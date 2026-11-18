import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  calculateCartTotals,
  calculateShippingOptions,
  filterAndSortProducts,
  formatCep,
  formatCurrency,
  formatPhoneBr,
  validateCouponLogic,
} from './commerce';
import type { Coupon, Order, Product } from '../types/store';

test('formatting helpers format BRL, CEP, and BR phone numbers accurately', () => {
  assert.match(formatCurrency(89.9), /89,90/);
  assert.equal(formatCep('15015000'), '15015-000');
  assert.equal(formatPhoneBr('17991234567'), '(17) 99123-4567');
});

test('validateCouponLogic handles percent, fixed, minOrderValue, and expiry', () => {
  const percentCoupon: Coupon = {
    code: 'PROF10',
    type: 'percent',
    value: 10,
    minOrderValue: 80,
    maxUses: 100,
    usedCount: 5,
    expiresAt: '2030-12-31T23:59:59.000Z',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const valid = validateCouponLogic(percentCoupon, 150, '2026-11-18T12:00:00.000Z');
  assert.equal(valid.valid, true);
  assert.equal(valid.discountAmount, 15);

  const belowMin = validateCouponLogic(percentCoupon, 50, '2026-11-18T12:00:00.000Z');
  assert.equal(belowMin.valid, false);

  const expired = validateCouponLogic(
    { ...percentCoupon, expiresAt: '2025-01-01T00:00:00.000Z' },
    150,
    '2026-11-18T12:00:00.000Z'
  );
  assert.equal(expired.valid, false);
});

test('calculateShippingOptions includes Retirada in SJRP and respects free shipping threshold', () => {
  const sjrpOptions = calculateShippingOptions('15010-000', 800, 120, 199);
  assert.equal(sjrpOptions.some((o) => o.code === 'RETIRADA' && o.price === 0), true);
  assert.equal(sjrpOptions.some((o) => o.code === 'PAC' && o.price > 0), true);

  const freeShippingOptions = calculateShippingOptions('01310-100', 800, 220, 199);
  const pac = freeShippingOptions.find((o) => o.code === 'PAC');
  assert.equal(pac?.price, 0);
  assert.equal(freeShippingOptions.some((o) => o.code === 'RETIRADA'), false);
});

test('calculateCartTotals computes subtotal, coupon discount, shipping, and total', () => {
  const coupon: Coupon = {
    code: 'FIXO20',
    type: 'fixed',
    value: 20,
    minOrderValue: 50,
    maxUses: 50,
    usedCount: 0,
    expiresAt: '2030-12-31T00:00:00.000Z',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const totals = calculateCartTotals(
    [
      {
        productId: 'p1',
        slug: 'kit-silabas',
        name: 'Kit Sílabas',
        image: '/img.jpg',
        unitPrice: 75,
        quantity: 2,
        weightGrams: 400,
      },
    ],
    coupon,
    18.5,
    199
  );
  assert.equal(totals.subtotal, 150);
  assert.equal(totals.discount, 20);
  assert.equal(totals.shippingCost, 18.5);
  assert.equal(totals.total, 148.5);
});

test('buildWhatsAppOrderMessage and URL encode complete order summary', () => {
  const order: Order = {
    id: 'ord_1',
    orderNumber: 'PDP-1042',
    customerName: 'Mariana Silva',
    customerPhone: '(17) 99123-4567',
    customerEmail: 'mariana@escola.com',
    cep: '15010-000',
    street: 'Rua Bernardino de Campos',
    number: '1200',
    neighborhood: 'Centro',
    city: 'São José do Rio Preto',
    state: 'SP',
    items: [
      {
        productId: 'p1',
        name: 'Kit Sílabas Divertidas',
        quantity: 1,
        unitPrice: 89.9,
        subtotal: 89.9,
      },
    ],
    subtotal: 89.9,
    shippingMethod: 'Retirada no Ateliê (SJRP)',
    shippingCost: 0,
    discount: 0,
    total: 89.9,
    status: 'pendente',
    source: 'loja',
    createdAt: '2026-11-18T12:00:00.000Z',
    updatedAt: '2026-11-18T12:00:00.000Z',
  };

  const msg = buildWhatsAppOrderMessage(order, {
    storeName: 'Papelaria da Prof',
    welcomeMessage: 'Olá! Acabei de fazer um pedido na loja:',
  });
  assert.match(msg, /PDP-1042/);
  assert.match(msg, /Mariana Silva/);
  assert.match(msg, /Kit Sílabas Divertidas/);

  const url = buildWhatsAppUrl('17991234567', msg);
  assert.match(url, /^https:\/\/wa\.me\/5517991234567\?text=/);
});

test('filterAndSortProducts filters by resourceType, promoOnly, and sorts correctly', () => {
  const products: Product[] = [
    {
      id: '1',
      slug: 'a',
      name: 'Baralho das Emoções',
      shortDescription: 'Recurso terapêutico',
      description: 'Desc',
      price: 100,
      promoPrice: 80,
      stock: 10,
      category: 'Terapia',
      resourceType: 'terapeutico',
      recommendedAge: '4 a 7 anos',
      tags: ['emoções'],
      images: ['/a.jpg'],
      featured: true,
      active: true,
      salesCount: 40,
      weightGrams: 300,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      slug: 'b',
      name: 'Planner Docente',
      shortDescription: 'Organização escolar',
      description: 'Desc',
      price: 120,
      promoPrice: null,
      stock: 5,
      category: 'Planners',
      resourceType: 'papelaria',
      recommendedAge: 'Adultos e Profs',
      tags: ['planner'],
      images: ['/b.jpg'],
      featured: false,
      active: true,
      salesCount: 90,
      weightGrams: 500,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const promoTherapeutic = filterAndSortProducts(products, {
    search: '',
    category: 'Todas',
    resourceType: 'terapeutico',
    recommendedAge: 'Todas',
    maxPrice: 500,
    promoOnly: true,
    wishlistOnly: false,
    sortBy: 'menor_preco',
  });
  assert.equal(promoTherapeutic.length, 1);
  assert.equal(promoTherapeutic[0].id, '1');
});
