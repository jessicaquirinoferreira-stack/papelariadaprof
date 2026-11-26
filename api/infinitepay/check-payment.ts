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
    if (!body.orderId) {
      sendJson(res, 400, { error: 'orderId é obrigatório.' });
      return;
    }

    const result = await verifyInfinitePayPayment({
      orderNsu: String(body.orderId),
      slug: body.slug ? String(body.slug) : undefined,
      transactionNsu: body.transactionNsu ? String(body.transactionNsu) : undefined,
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : undefined,
    });

    sendJson(res, 200, result);
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
