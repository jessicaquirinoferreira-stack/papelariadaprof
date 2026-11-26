import type { IncomingMessage, ServerResponse } from 'http';
import { list, put } from '@vercel/blob';

const INFINITEPAY_PAYMENT_CHECK_URL = 'https://api.checkout.infinitepay.io/payment_check';

interface VerifiedInfinitePayRecord {
  orderNsu: string;
  slug: string;
  transactionNsu: string;
  amount: number;
  paidAmount: number;
  installments: number;
  captureMethod: string;
  receiptUrl: string;
  paid: boolean;
  verifiedAt: string;
}

async function readJsonBody(
  req: IncomingMessage & { body?: unknown }
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function getCachedVerifiedPayment(
  orderNsu: string,
  blobToken: string
): Promise<VerifiedInfinitePayRecord | null> {
  if (!blobToken) return null;
  try {
    const result = await list({
      prefix: `infinitepay-payments/${orderNsu}.json`,
      token: blobToken,
      limit: 1,
    });
    const match = result.blobs[0];
    if (!match) return null;
    const res = await fetch(match.url);
    if (!res.ok) return null;
    const data = (await res.json()) as VerifiedInfinitePayRecord;
    if (data && data.paid) return data;
  } catch {
    // ignore cache miss
  }
  return null;
}

async function saveVerifiedPaymentRecord(
  record: VerifiedInfinitePayRecord,
  blobToken: string
) {
  if (!blobToken) return;
  try {
    await put(`infinitepay-payments/${record.orderNsu}.json`, JSON.stringify(record), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    console.error('Failed to save InfinitePay verification record to Blob:', err);
  }
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido.' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const orderNsu = String(body.orderId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!orderNsu) {
      sendJson(res, 400, { error: 'orderId é obrigatório.' });
      return;
    }

    const apiKey = (process.env.INFINITEPAY_API_KEY || '').trim();
    const rawHandle = process.env.INFINITEPAY_HANDLE || 'lilian-santos-0in';
    const handle = rawHandle.trim().replace(/^[@$]+/, '') || 'lilian-santos-0in';
    const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();

    const cached = await getCachedVerifiedPayment(orderNsu, blobToken);
    if (cached && cached.paid) {
      sendJson(res, 200, { paid: true, record: cached });
      return;
    }

    const bodyPayload: Record<string, string> = {
      handle,
      order_nsu: orderNsu,
    };
    if (body.slug && String(body.slug).trim()) {
      bodyPayload.slug = String(body.slug).trim();
    }
    if (body.transactionNsu && String(body.transactionNsu).trim()) {
      bodyPayload.transaction_nsu = String(body.transactionNsu).trim();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const response = await fetch(INFINITEPAY_PAYMENT_CHECK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      sendJson(res, 200, { paid: false });
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      paid?: boolean;
      amount?: number;
      paid_amount?: number;
      installments?: number;
      capture_method?: string;
      transaction_nsu?: string;
      slug?: string;
      receipt_url?: string;
    };

    if (data.paid === true) {
      const record: VerifiedInfinitePayRecord = {
        orderNsu,
        slug: data.slug || (body.slug ? String(body.slug).trim() : ''),
        transactionNsu:
          data.transaction_nsu ||
          (body.transactionNsu ? String(body.transactionNsu).trim() : '') ||
          `ip-${orderNsu}`,
        amount: Number(data.amount || 0),
        paidAmount: Number(data.paid_amount || data.amount || 0),
        installments: Number(data.installments || 1),
        captureMethod: data.capture_method || 'pix',
        receiptUrl:
          data.receipt_url ||
          (body.receiptUrl ? String(body.receiptUrl).trim() : '') ||
          'https://checkout.infinitepay.io',
        paid: true,
        verifiedAt: new Date().toISOString(),
      };
      await saveVerifiedPaymentRecord(record, blobToken);
      sendJson(res, 200, { paid: true, record });
      return;
    }

    sendJson(res, 200, { paid: false });
  } catch (error) {
    console.error('Vercel InfinitePay check-payment error:', error);
    sendJson(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao verificar pagamento InfinitePay.',
    });
  }
}
