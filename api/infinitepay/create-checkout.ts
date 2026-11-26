import type { IncomingMessage, ServerResponse } from 'http';

const INFINITEPAY_CHECKOUT_URL = 'https://api.checkout.infinitepay.io/links';

const INFINITEPAY_RATES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 6.85,
  5: 7.57,
  6: 8.28,
  7: 8.99,
  8: 9.8,
  9: 10.38,
  10: 11.06,
  11: 11.74,
  12: 12.4,
};

interface CheckoutItemInput {
  title: string;
  price: number;
  quantity: number;
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

function buildInfinitePayItemsCents(
  items: CheckoutItemInput[],
  discountBrl: number,
  paymentType: 'pix' | 'credit_card',
  installments: number
) {
  const cleanItems = items
    .filter((i) => i && Number(i.price) > 0 && Number(i.quantity) > 0)
    .map((i) => ({
      title: String(i.title || 'Apostila Digital PDF').slice(0, 120),
      unitCents: Math.max(100, Math.round(Number(i.price) * 100)),
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
    }));

  if (cleanItems.length === 0) {
    throw new Error('Nenhum item válido no pedido.');
  }

  const rawSubtotalCents = cleanItems.reduce(
    (sum, item) => sum + item.unitCents * item.quantity,
    0
  );
  const discountCents = Math.min(
    Math.max(0, rawSubtotalCents - 100),
    Math.max(0, Math.round((Number(discountBrl) || 0) * 100))
  );
  const baseTotalCents = rawSubtotalCents - discountCents;

  const safeInstallments =
    paymentType === 'credit_card'
      ? Math.max(1, Math.min(12, Math.floor(installments || 1)))
      : 1;
  const ratePercent =
    paymentType === 'credit_card' && safeInstallments > 3
      ? INFINITEPAY_RATES[safeInstallments] ?? 0
      : 0;

  const finalTotalCents =
    ratePercent > 0
      ? Math.round(baseTotalCents * (1 + ratePercent / 100))
      : baseTotalCents;
  const interestCents = Math.max(0, finalTotalCents - baseTotalCents);

  const outputItems: { description: string; price: number; quantity: number }[] = [];

  if (discountCents <= 0) {
    for (const item of cleanItems) {
      outputItems.push({
        description: item.title,
        price: item.unitCents,
        quantity: item.quantity,
      });
    }
  } else {
    let remainingCents = baseTotalCents;
    cleanItems.forEach((item, idx) => {
      const lineTotal = item.unitCents * item.quantity;
      const isLast = idx === cleanItems.length - 1;
      const discountedLine = isLast
        ? Math.max(1, remainingCents)
        : Math.max(1, Math.round((lineTotal / rawSubtotalCents) * baseTotalCents));
      remainingCents -= discountedLine;
      outputItems.push({
        description: `${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.title} (c/ desconto)`,
        price: discountedLine,
        quantity: 1,
      });
    });
  }

  if (interestCents > 0) {
    outputItems.push({
      description: `Juros parcelamento ${safeInstallments}x InfinitePay (${ratePercent.toFixed(2).replace('.', ',')}%)`,
      price: interestCents,
      quantity: 1,
    });
  }

  return {
    items: outputItems,
    baseTotalCents,
    interestCents,
    finalTotalCents,
    ratePercent,
    installments: safeInstallments,
  };
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
    if (!body.orderId || !Array.isArray(body.items) || body.items.length === 0) {
      sendJson(res, 400, { error: 'Dados do pedido inválidos.' });
      return;
    }

    const safeOrderId = String(body.orderId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeOrderId) {
      sendJson(res, 400, { error: 'Identificador do pedido inválido.' });
      return;
    }

    const apiKey = (process.env.INFINITEPAY_API_KEY || '').trim();
    const rawHandle = process.env.INFINITEPAY_HANDLE || 'lilian-santos-0in';
    const handle = rawHandle.trim().replace(/^[@$]+/, '') || 'lilian-santos-0in';

    const paymentType = body.paymentType === 'credit_card' ? 'credit_card' : 'pix';
    const computed = buildInfinitePayItemsCents(
      body.items as CheckoutItemInput[],
      Number(body.discount || 0),
      paymentType,
      Number(body.installments || 1)
    );

    const customer = (body.customer || {}) as {
      name?: string;
      email?: string;
      phone?: string;
    };
    const cleanPhoneDigits = (customer.phone || '').replace(/\D/g, '');
    const formattedPhone =
      cleanPhoneDigits.length >= 10
        ? cleanPhoneDigits.startsWith('55')
          ? `+${cleanPhoneDigits}`
          : `+55${cleanPhoneDigits}`
        : undefined;

    const payload: Record<string, unknown> = {
      handle,
      order_nsu: safeOrderId,
      redirect_url: String(body.redirectUrl || ''),
      items: computed.items,
    };

    const webhookUrl = body.webhookUrl ? String(body.webhookUrl) : '';
    if (webhookUrl.startsWith('https://')) {
      payload.webhook_url = webhookUrl;
    }

    if (customer.name || customer.email || formattedPhone) {
      const cust: Record<string, string> = {};
      if (customer.name) cust.name = customer.name.trim().slice(0, 120);
      if (customer.email) cust.email = customer.email.trim().slice(0, 160);
      if (formattedPhone) cust.phone_number = formattedPhone;
      payload.customer = cust;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const response = await fetch(INFINITEPAY_CHECKOUT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let parsed: { url?: string; checkout_url?: string; message?: string; error?: string } = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // ignore non-json
    }

    const checkoutUrl = parsed.url || parsed.checkout_url;
    if (!response.ok || !checkoutUrl) {
      sendJson(res, 502, {
        error:
          parsed.message ||
          parsed.error ||
          `Erro ao gerar link na InfinitePay (HTTP ${response.status}).`,
      });
      return;
    }

    let slug = '';
    try {
      const segments = new URL(checkoutUrl).pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        slug = segments[1].slice(0, 120);
      }
    } catch {
      slug = '';
    }

    sendJson(res, 200, {
      url: checkoutUrl,
      slug,
      totalCents: computed.finalTotalCents,
      interestCents: computed.interestCents,
      ratePercent: computed.ratePercent,
      installments: computed.installments,
    });
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
