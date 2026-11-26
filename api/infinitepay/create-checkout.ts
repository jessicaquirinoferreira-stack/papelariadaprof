import type { IncomingMessage, ServerResponse } from 'http';
import { createInfinitePayCheckoutLink } from '../../server/infinitepay';

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
    if (!body.orderId || !Array.isArray(body.items) || body.items.length === 0) {
      sendJson(res, 400, { error: 'Dados do pedido inválidos.' });
      return;
    }

    const result = await createInfinitePayCheckoutLink({
      orderId: String(body.orderId),
      items: body.items as { title: string; price: number; quantity: number }[],
      discount: Number(body.discount || 0),
      paymentType: body.paymentType === 'credit_card' ? 'credit_card' : 'pix',
      installments: Number(body.installments || 1),
      redirectUrl: String(body.redirectUrl || ''),
      webhookUrl: body.webhookUrl ? String(body.webhookUrl) : undefined,
      customer: body.customer as { name?: string; email?: string; phone?: string } | undefined,
    });

    sendJson(res, 200, result);
  } catch (error) {
    console.error('Vercel InfinitePay create-checkout error:', error);
    sendJson(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao gerar link de checkout InfinitePay.',
    });
  }
}
