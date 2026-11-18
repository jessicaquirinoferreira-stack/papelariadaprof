import type {
  CartItem,
  CatalogFilters,
  Coupon,
  Order,
  Product,
  ShippingOption,
  StoreSettings,
} from '../types/store';

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safe);
}

export function cleanDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatCep(raw: string): string {
  const digits = cleanDigits(raw).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatPhoneBr(raw: string): string {
  const digits = cleanDigits(raw).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCpf(raw: string): string {
  const digits = cleanDigits(raw).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function sanitizeSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function getEffectivePrice(product: Pick<Product, 'price' | 'promoPrice'>): number {
  if (
    typeof product.promoPrice === 'number' &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price
  ) {
    return product.promoPrice;
  }
  return product.price;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  discountAmount: number;
}

export function validateCouponLogic(
  coupon: Coupon | null | undefined,
  subtotal: number,
  nowIso: string = new Date().toISOString()
): CouponValidationResult {
  if (!coupon) {
    return { valid: false, reason: 'Cupom não encontrado.', discountAmount: 0 };
  }
  if (!coupon.active) {
    return { valid: false, reason: 'Este cupom está inativo no momento.', discountAmount: 0 };
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: 'Este cupom atingiu o limite máximo de usos.', discountAmount: 0 };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < new Date(nowIso).getTime()) {
    return { valid: false, reason: 'Este cupom expirou.', discountAmount: 0 };
  }
  if (subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      reason: `Pedido mínimo de ${formatCurrency(coupon.minOrderValue)} para este cupom.`,
      discountAmount: 0,
    };
  }

  const rawDiscount =
    coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  const discountAmount = Math.min(subtotal, Math.round(rawDiscount * 100) / 100);
  return { valid: true, discountAmount };
}

export function calculateShippingOptions(
  cepRaw: string,
  weightGrams: number,
  subtotal: number,
  freeShippingThreshold: number
): ShippingOption[] {
  const cep = cleanDigits(cepRaw);
  if (cep.length !== 8) {
    return [];
  }

  const prefix2 = Number(cep.slice(0, 2));
  const prefix3 = Number(cep.slice(0, 3));
  const weightKg = Math.max(0.3, weightGrams / 1000);
  const qualifiesFree = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;

  // Distance bands from São José do Rio Preto - SP (CEP 150xx)
  let basePac = 24.9;
  let baseSedex = 42.9;
  let pacDays = '6 a 9 dias úteis';
  let sedexDays = '2 a 4 dias úteis';

  if (prefix3 >= 150 && prefix3 <= 151) {
    // SJRP and immediate microregion
    basePac = 12.9;
    baseSedex = 18.9;
    pacDays = '2 a 3 dias úteis';
    sedexDays = '1 dia útil';
  } else if (prefix2 >= 11 && prefix2 <= 19) {
    // Interior SP
    basePac = 16.9;
    baseSedex = 26.5;
    pacDays = '3 a 5 dias úteis';
    sedexDays = '1 a 2 dias úteis';
  } else if (prefix2 >= 1 && prefix2 <= 9) {
    // Grande São Paulo
    basePac = 18.5;
    baseSedex = 28.9;
    pacDays = '4 a 6 dias úteis';
    sedexDays = '1 a 3 dias úteis';
  } else if ((prefix2 >= 20 && prefix2 <= 39) || (prefix2 >= 80 && prefix2 <= 99)) {
    // Sudeste e Sul
    basePac = 23.9;
    baseSedex = 39.9;
    pacDays = '5 a 8 dias úteis';
    sedexDays = '2 a 4 dias úteis';
  } else {
    // Centro-Oeste, Norte e Nordeste
    basePac = 31.9;
    baseSedex = 56.9;
    pacDays = '7 a 12 dias úteis';
    sedexDays = '3 a 6 dias úteis';
  }

  const weightSurcharge = Math.max(0, weightKg - 0.5) * 6.5;
  const pacPrice = qualifiesFree
    ? 0
    : Math.round((basePac + weightSurcharge) * 100) / 100;
  const sedexPrice = Math.round((baseSedex + weightSurcharge * 1.45) * 100) / 100;

  const options: ShippingOption[] = [
    {
      code: 'PAC',
      name: qualifiesFree ? 'PAC (Frete Grátis)' : 'Correios PAC',
      carrier: 'Correios',
      price: pacPrice,
      estimatedDays: pacDays,
      description: qualifiesFree
        ? `Frete grátis aplicado para compras acima de ${formatCurrency(freeShippingThreshold)}`
        : 'Entrega econômica com rastreamento',
    },
    {
      code: 'SEDEX',
      name: 'Correios SEDEX',
      carrier: 'Correios',
      price: sedexPrice,
      estimatedDays: sedexDays,
      description: 'Entrega expressa prioritária',
    },
  ];

  if (prefix3 >= 150 && prefix3 <= 151) {
    options.unshift({
      code: 'RETIRADA',
      name: 'Retirada no Ateliê (SJRP)',
      carrier: 'Papelaria da Prof',
      price: 0,
      estimatedDays: 'Pronto em até 24h',
      description: 'Retire sem custo em São José do Rio Preto - SP',
    });
  }

  return options;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  totalWeightGrams: number;
  qualifiesFreeShipping: boolean;
}

export function calculateCartTotals(
  items: CartItem[],
  coupon: Coupon | null | undefined,
  selectedShippingCost: number,
  freeShippingThreshold: number
): CartTotals {
  const subtotal =
    Math.round(
      items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0) * 100
    ) / 100;
  const totalWeightGrams = items.reduce(
    (acc, item) => acc + (item.weightGrams || 250) * item.quantity,
    0
  );
  const couponCheck = validateCouponLogic(coupon, subtotal);
  const discount = couponCheck.valid ? couponCheck.discountAmount : 0;
  const qualifiesFreeShipping =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const shippingCost = Math.max(0, Math.round(selectedShippingCost * 100) / 100);
  const total = Math.max(
    0,
    Math.round((subtotal - discount + shippingCost) * 100) / 100
  );

  return {
    subtotal,
    discount,
    shippingCost,
    total,
    totalWeightGrams,
    qualifiesFreeShipping,
  };
}

export function buildWhatsAppOrderMessage(
  order: Order,
  settings: Pick<StoreSettings, 'storeName' | 'welcomeMessage'>
): string {
  const lines: string[] = [];
  if (settings.welcomeMessage?.trim()) {
    lines.push(settings.welcomeMessage.trim());
    lines.push('');
  }
  lines.push(`*Pedido #${order.orderNumber}* — ${settings.storeName}`);
  lines.push(`*Cliente:* ${order.customerName}`);
  lines.push(`*Telefone:* ${order.customerPhone}`);
  if (order.customerEmail) {
    lines.push(`*E-mail:* ${order.customerEmail}`);
  }
  if (order.street && order.city) {
    const comp = order.complement ? ` (${order.complement})` : '';
    lines.push(
      `*Endereço:* ${order.street}, ${order.number || 'S/N'}${comp} - ${order.neighborhood || ''}, ${order.city}/${order.state || ''} · CEP ${order.cep || ''}`
    );
  }
  lines.push('');
  lines.push('*Itens do pedido:*');
  for (const item of order.items) {
    const variant = item.variantLabel ? ` [${item.variantLabel}]` : '';
    lines.push(
      `• ${item.quantity}x ${item.name}${variant} — ${formatCurrency(item.subtotal)}`
    );
  }
  lines.push('');
  lines.push(`*Subtotal:* ${formatCurrency(order.subtotal)}`);
  lines.push(
    `*Frete (${order.shippingMethod}):* ${
      order.shippingCost === 0 ? 'Grátis' : formatCurrency(order.shippingCost)
    }`
  );
  if (order.discount > 0) {
    lines.push(
      `*Desconto${order.couponCode ? ` (${order.couponCode})` : ''}:* -${formatCurrency(order.discount)}`
    );
  }
  lines.push(`*Total:* *${formatCurrency(order.total)}*`);
  if (order.notes) {
    lines.push('');
    lines.push(`*Observações:* ${order.notes}`);
  }
  return lines.join('\n');
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  const digits = cleanDigits(whatsappNumber);
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function filterAndSortProducts(
  products: Product[],
  filters: CatalogFilters,
  wishlistIds: string[] = []
): Product[] {
  const queryText = filters.search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!product.active) return false;

    if (filters.wishlistOnly && !wishlistIds.includes(product.id)) {
      return false;
    }

    if (
      filters.category &&
      filters.category !== 'Todas' &&
      product.category !== filters.category
    ) {
      return false;
    }

    if (
      filters.resourceType &&
      filters.resourceType !== 'todos' &&
      product.resourceType !== filters.resourceType
    ) {
      return false;
    }

    if (
      filters.recommendedAge &&
      filters.recommendedAge !== 'Todas' &&
      product.recommendedAge !== filters.recommendedAge
    ) {
      return false;
    }

    const effectivePrice = getEffectivePrice(product);
    if (filters.maxPrice > 0 && effectivePrice > filters.maxPrice) {
      return false;
    }

    if (
      filters.promoOnly &&
      !(typeof product.promoPrice === 'number' && product.promoPrice > 0 && product.promoPrice < product.price)
    ) {
      return false;
    }

    if (queryText) {
      const haystack = [
        product.name,
        product.shortDescription,
        product.category,
        product.recommendedAge,
        ...product.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(queryText)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (filters.sortBy) {
      case 'menor_preco':
        return getEffectivePrice(a) - getEffectivePrice(b);
      case 'maior_preco':
        return getEffectivePrice(b) - getEffectivePrice(a);
      case 'mais_vendidos':
        return b.salesCount - a.salesCount;
      case 'relevancia':
      default:
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.salesCount - a.salesCount;
    }
  });

  return sorted;
}
