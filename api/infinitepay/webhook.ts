import type { IncomingMessage, ServerResponse } from 'http';
import { verifyInfinitePayPayment } from '../../server/infinitepay';

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido.' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const orderNsu = String(body.order_nsu || '').trim();
    const slug = String(body.invoice_slug || body.slug || '').trim();
    const transactionNsu = String(body.transaction_nsu || '').trim();
    const receiptUrl = String(body.receipt_url || '').trim();

    if (orderNsu) {
      await verifyInfinitePayPayment({
        orderNsu,
        slug,
        transactionNsu,
        receiptUrl,
      });
    }

    sendJson(res, 200, { received: true });
  } catch (error) {
    console.error('Vercel InfinitePay webhook error:', error);
    sendJson(res, 200, { received: true });
  }
}
