import { list, put } from '@vercel/blob';

const INFINITEPAY_CHECKOUT_URL = 'https://api.checkout.infinitepay.io/links';
const INFINITEPAY_PAYMENT_CHECK_URL = 'https://api.checkout.infinitepay.io/payment_check';

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

export interface VerifiedInfinitePayRecord {
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

// Fast in-memory cache (complemented by Vercel Blob persistence across serverless invocations)
const verifiedPaymentsMemory = new Map<string, VerifiedInfinitePayRecord>();

function getInfinitePayConfig() {
  const apiKey = (process.env.INFINITEPAY_API_KEY || '').trim();
  const rawHandle = process.env.INFINITEPAY_HANDLE || 'lilian-santos-0in';
  const handle = rawHandle.trim().replace(/^[@$]+/, '') || 'lilian-santos-0in';
  const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  return { apiKey, handle, blobToken };
}

export interface CheckoutItemInput {
  title: string;
  price: number;
  quantity: number;
}

export interface CreateCheckoutInput {
  orderId: string;
  items: CheckoutItemInput[];
  discount?: number;
  paymentType: 'pix' | 'credit_card';
  installments?: number;
  redirectUrl: string;
  webhookUrl?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

function buildInfinitePayItemsCents(
  items: CheckoutItemInput[],
  discountBrl: number,
  paymentType: 'pix' | 'credit_card',
  installments: number
): {
  items: { description: string; price: number; quantity: number }[];
  baseTotalCents: number;
  interestCents: number;
  finalTotalCents: number;
  ratePercent: number;
} {
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
    // Distribute coupon discount proportionally so all prices stay positive integers
    let remainingCents = baseTotalCents;
    cleanItems.forEach((item, idx) => {
      const lineTotal = item.unitCents * item.quantity;
      const isLast = idx === cleanItems.length - 1;
      const discountedLine = isLast
        ? Math.max(1, remainingCents)
        : Math.max(
            1,
            Math.round((lineTotal / rawSubtotalCents) * baseTotalCents)
          );
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
  };
}

export async function createInfinitePayCheckoutLink(input: CreateCheckoutInput) {
  const { apiKey, handle } = getInfinitePayConfig();
  if (!apiKey) {
    throw new Error(
      'Chave da InfinitePay (INFINITEPAY_API_KEY) não configurada no servidor.'
    );
  }

  const safeOrderId = String(input.orderId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeOrderId) {
    throw new Error('Identificador do pedido inválido.');
  }

  const paymentType = input.paymentType === 'credit_card' ? 'credit_card' : 'pix';
  const installments =
    paymentType === 'credit_card'
      ? Math.max(1, Math.min(12, Math.floor(input.installments || 1)))
      : 1;

  const computed = buildInfinitePayItemsCents(
    input.items,
    input.discount || 0,
    paymentType,
    installments
  );

  const cleanPhoneDigits = (input.customer?.phone || '').replace(/\D/g, '');
  const formattedPhone =
    cleanPhoneDigits.length >= 10
      ? cleanPhoneDigits.startsWith('55')
        ? `+${cleanPhoneDigits}`
        : `+55${cleanPhoneDigits}`
      : undefined;

  const payload: Record<string, unknown> = {
    handle,
    order_nsu: safeOrderId,
    redirect_url: input.redirectUrl,
    items: computed.items,
  };

  if (input.webhookUrl && input.webhookUrl.startsWith('https://')) {
    payload.webhook_url = input.webhookUrl;
  }

  if (input.customer?.name || input.customer?.email || formattedPhone) {
    const cust: Record<string, string> = {};
    if (input.customer?.name) cust.name = input.customer.name.trim().slice(0, 120);
    if (input.customer?.email) cust.email = input.customer.email.trim().slice(0, 160);
    if (formattedPhone) cust.phone_number = formattedPhone;
    payload.customer = cust;
  }

  const response = await fetch(INFINITEPAY_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
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
    throw new Error(
      parsed.message ||
        parsed.error ||
        `Erro ao gerar link na InfinitePay (HTTP ${response.status}).`
    );
  }

  const slug = checkoutUrl.split('/').filter(Boolean).pop() || '';

  return {
    url: checkoutUrl,
    slug,
    totalCents: computed.finalTotalCents,
    interestCents: computed.interestCents,
    ratePercent: computed.ratePercent,
    installments,
  };
}

export async function saveVerifiedPaymentRecord(record: VerifiedInfinitePayRecord) {
  verifiedPaymentsMemory.set(record.orderNsu, record);
  const { blobToken } = getInfinitePayConfig();
  if (!blobToken) return;

  try {
    await put(
      `infinitepay-payments/${record.orderNsu}.json`,
      JSON.stringify(record),
      {
        access: 'public',
        token: blobToken,
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      }
    );
  } catch (err) {
    console.error('Failed to save InfinitePay verification record to Blob:', err);
  }
}

export async function getCachedVerifiedPayment(
  orderNsu: string
): Promise<VerifiedInfinitePayRecord | null> {
  const mem = verifiedPaymentsMemory.get(orderNsu);
  if (mem && mem.paid) return mem;

  const { blobToken } = getInfinitePayConfig();
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
    if (data && data.paid) {
      verifiedPaymentsMemory.set(orderNsu, data);
      return data;
    }
  } catch {
    // ignore cache miss
  }
  return null;
}

export async function verifyInfinitePayPayment(params: {
  orderNsu: string;
  slug?: string;
  transactionNsu?: string;
  receiptUrl?: string;
}): Promise<{
  paid: boolean;
  record?: VerifiedInfinitePayRecord;
}> {
  const orderNsu = String(params.orderNsu || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!orderNsu) return { paid: false };

  // Check verified webhook cache first
  const cached = await getCachedVerifiedPayment(orderNsu);
  if (cached && cached.paid) {
    return { paid: true, record: cached };
  }

  const { apiKey, handle } = getInfinitePayConfig();
  if (!apiKey) {
    throw new Error('INFINITEPAY_API_KEY não configurada no servidor.');
  }

  const bodyPayload: Record<string, string> = {
    handle,
    order_nsu: orderNsu,
  };
  if (params.slug) bodyPayload.slug = String(params.slug).trim();
  if (params.transactionNsu) {
    bodyPayload.transaction_nsu = String(params.transactionNsu).trim();
  }

  const response = await fetch(INFINITEPAY_PAYMENT_CHECK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    return { paid: false };
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
      slug: data.slug || params.slug || '',
      transactionNsu:
        data.transaction_nsu || params.transactionNsu || `ip-${orderNsu}`,
      amount: Number(data.amount || 0),
      paidAmount: Number(data.paid_amount || data.amount || 0),
      installments: Number(data.installments || 1),
      captureMethod: data.capture_method || 'pix',
      receiptUrl:
        data.receipt_url ||
        params.receiptUrl ||
        'https://checkout.infinitepay.io',
      paid: true,
      verifiedAt: new Date().toISOString(),
    };
    await saveVerifiedPaymentRecord(record);
    return { paid: true, record };
  }

  return { paid: false };
}
