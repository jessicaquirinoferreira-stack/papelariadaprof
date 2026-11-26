import type { IncomingMessage, ServerResponse } from 'http';
import { put } from '@vercel/blob';

const INFINITEPAY_PAYMENT_CHECK_URL = 'https://api.checkout.infinitepay.io/payment_check';

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
    const orderNsu = String(body.order_nsu || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const slug = String(body.invoice_slug || body.slug || '').trim();
    const transactionNsu = String(body.transaction_nsu || '').trim();
    const receiptUrl = String(body.receipt_url || '').trim();

    if (orderNsu) {
      const apiKey = (process.env.INFINITEPAY_API_KEY || '').trim();
      const rawHandle = process.env.INFINITEPAY_HANDLE || 'lilian-santos-0in';
      const handle = rawHandle.trim().replace(/^[@$]+/, '') || 'lilian-santos-0in';
      const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();

      const bodyPayload: Record<string, string> = {
        handle,
        order_nsu: orderNsu,
      };
      if (slug) bodyPayload.slug = slug;
      if (transactionNsu) bodyPayload.transaction_nsu = transactionNsu;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-Api-Key'] = apiKey;
      }

      const checkResp = await fetch(INFINITEPAY_PAYMENT_CHECK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      if (checkResp.ok) {
        const data = (await checkResp.json().catch(() => ({}))) as {
          paid?: boolean;
          amount?: number;
          paid_amount?: number;
          installments?: number;
          capture_method?: string;
          transaction_nsu?: string;
          slug?: string;
          receipt_url?: string;
        };

        if (data.paid === true && blobToken) {
          const record = {
            orderNsu,
            slug: data.slug || slug,
            transactionNsu: data.transaction_nsu || transactionNsu || `ip-${orderNsu}`,
            amount: Number(data.amount || 0),
            paidAmount: Number(data.paid_amount || data.amount || 0),
            installments: Number(data.installments || 1),
            captureMethod: data.capture_method || 'pix',
            receiptUrl:
              data.receipt_url || receiptUrl || 'https://checkout.infinitepay.io',
            paid: true,
            verifiedAt: new Date().toISOString(),
          };
          await put(`infinitepay-payments/${orderNsu}.json`, JSON.stringify(record), {
            access: 'public',
            token: blobToken,
            contentType: 'application/json',
            addRandomSuffix: false,
            allowOverwrite: true,
          });
        }
      }
    }

    sendJson(res, 200, { received: true });
  } catch (error) {
    console.error('Vercel InfinitePay webhook error:', error);
    sendJson(res, 200, { received: true });
  }
}
