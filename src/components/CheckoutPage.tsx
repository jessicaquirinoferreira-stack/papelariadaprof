import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  ShoppingBag,
  Tag,
  Truck,
} from 'lucide-react';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  calculateCartTotals,
  calculateShippingOptions,
  cleanDigits,
  formatCep,
  formatCurrency,
  formatPhoneBr,
  validateCouponLogic,
} from '../lib/commerce';
import { fetchCouponByCode } from '../lib/firestoreService';
import type {
  AppView,
  CartItem,
  Coupon,
  Order,
  ShippingOption,
  StoreSettings,
  ViaCepAddress,
} from '../types/store';

interface CheckoutPageProps {
  items: CartItem[];
  coupons: Coupon[];
  settings: StoreSettings;
  onClearCart: () => void;
  onSubmitOrder: (order: Order) => Promise<void>;
  onNavigate: (view: AppView) => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

export function CheckoutPage({
  items,
  coupons,
  settings,
  onClearCart,
  onSubmitOrder,
  onNavigate,
  onNotify,
}: CheckoutPageProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [notes, setNotes] = useState('');

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingCode, setSelectedShippingCode] = useState<string>('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const hasOnlyDigital = items.length > 0 && items.every((i) => i.isDigital);

  const selectedShipping = hasOnlyDigital
    ? {
        code: 'RETIRADA' as const,
        name: 'Entrega Digital (Área do Aluno — Liberação Pós-Pagamento)',
        carrier: 'Papelaria da Prof',
        price: 0,
        estimatedDays: 'Liberação imediata após WhatsApp',
        description: 'Material disponível para download em PDF na Área do Aluno',
      }
    : shippingOptions.find((o) => o.code === selectedShippingCode) || shippingOptions[0] || null;

  const totals = calculateCartTotals(
    items,
    appliedCoupon,
    selectedShipping?.price || 0,
    settings.freeShippingThreshold
  );

  // Lookup CEP and real-time shipping quote when 8 digits are typed
  useEffect(() => {
    if (hasOnlyDigital) {
      setShippingOptions([]);
      setSelectedShippingCode('');
      return;
    }
    const digits = cleanDigits(cep);
    if (digits.length !== 8) {
      setShippingOptions([]);
      setSelectedShippingCode('');
      return;
    }

    let cancelled = false;
    const lookup = async () => {
      setCepLoading(true);
      setCepError('');
      try {
        const res = await fetch(`/api/cep/${digits}`);
        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) {
            setCepError(errData.error || 'CEP não encontrado.');
          }
        } else {
          const addr = (await res.json()) as ViaCepAddress;
          if (!cancelled) {
            if (addr.street) setStreet(addr.street);
            if (addr.neighborhood) setNeighborhood(addr.neighborhood);
            if (addr.city) setCity(addr.city);
            if (addr.state) setStateUf(addr.state);
          }
        }
      } catch {
        if (!cancelled) {
          setCepError('Não foi possível consultar o CEP automaticamente; preencha o endereço manualmente.');
        }
      }

      // Quote shipping via API with local deterministic fallback
      try {
        const quoteRes = await fetch('/api/shipping/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cep: digits,
            weightGrams: totals.totalWeightGrams,
            subtotal: totals.subtotal,
            freeShippingThreshold: settings.freeShippingThreshold,
          }),
        });
        if (quoteRes.ok) {
          const data = (await quoteRes.json()) as { options: ShippingOption[] };
          if (!cancelled && data.options.length > 0) {
            setShippingOptions(data.options);
            setSelectedShippingCode((prev) =>
              data.options.some((o) => o.code === prev) ? prev : data.options[0].code
            );
          }
        } else {
          const localOpts = calculateShippingOptions(
            digits,
            totals.totalWeightGrams,
            totals.subtotal,
            settings.freeShippingThreshold
          );
          if (!cancelled) {
            setShippingOptions(localOpts);
            if (localOpts[0]) setSelectedShippingCode(localOpts[0].code);
          }
        }
      } catch {
        const localOpts = calculateShippingOptions(
          digits,
          totals.totalWeightGrams,
          totals.subtotal,
          settings.freeShippingThreshold
        );
        if (!cancelled) {
          setShippingOptions(localOpts);
          if (localOpts[0]) setSelectedShippingCode(localOpts[0].code);
        }
      } finally {
        if (!cancelled) setCepLoading(false);
      }
    };

    lookup();
    return () => {
      cancelled = true;
    };
  }, [cep, totals.totalWeightGrams, totals.subtotal, settings.freeShippingThreshold]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Digite o código do cupom.');
      return;
    }

    const found = await fetchCouponByCode(code, coupons);
    const check = validateCouponLogic(found, totals.subtotal);
    if (!check.valid || !found) {
      setAppliedCoupon(null);
      setCouponError(check.reason || 'Cupom inválido.');
      return;
    }

    setAppliedCoupon(found);
    onNotify(`Cupom ${found.code} aplicado! Desconto de ${formatCurrency(check.discountAmount)}.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (customerName.trim().length < 3) errors.customerName = 'Informe seu nome completo.';
    if (cleanDigits(customerPhone).length < 10) errors.customerPhone = 'Informe um telefone/WhatsApp válido.';
    if (!customerEmail.includes('@')) errors.customerEmail = 'Informe um e-mail válido.';
    if (!hasOnlyDigital) {
      if (cleanDigits(cep).length !== 8) errors.cep = 'Informe um CEP válido com 8 dígitos.';
      if (!street.trim()) errors.street = 'Informe o endereço (rua/avenida).';
      if (!number.trim()) errors.number = 'Informe o número.';
      if (!neighborhood.trim()) errors.neighborhood = 'Informe o bairro.';
      if (!city.trim()) errors.city = 'Informe a cidade.';
      if (stateUf.trim().length < 2) errors.stateUf = 'UF inválida.';
      if (!selectedShipping) errors.shipping = 'Selecione uma opção de frete.';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      onNotify('Revise os campos obrigatórios destacados.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const orderNum = `PDP-${Math.floor(1050 + Math.random() * 8900)}`;
      const order: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        cep: hasOnlyDigital ? undefined : formatCep(cep),
        street: hasOnlyDigital ? undefined : street.trim(),
        number: hasOnlyDigital ? undefined : number.trim(),
        complement: hasOnlyDigital ? undefined : complement.trim() || undefined,
        neighborhood: hasOnlyDigital ? undefined : neighborhood.trim(),
        city: hasOnlyDigital ? undefined : city.trim(),
        state: hasOnlyDigital ? undefined : stateUf.trim().toUpperCase(),
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          ...(i.variantLabel ? { variantLabel: i.variantLabel } : {}),
          subtotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
        })),
        subtotal: totals.subtotal,
        shippingMethod:
          selectedShipping?.name || 'Entrega Digital (Área do Aluno)',
        shippingCost: totals.shippingCost,
        couponCode: appliedCoupon?.code || undefined,
        discount: totals.discount,
        total: totals.total,
        status: 'pendente',
        source: 'loja',
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await onSubmitOrder(order);
      onClearCart();
      setCompletedOrder(order);
      onNotify(`Pedido #${order.orderNumber} registrado com sucesso!`);
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    const whatsappMessage = buildWhatsAppOrderMessage(completedOrder, settings);
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMessage);

    return (
      <div className="bg-[#FDF8F5] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-8 sm:p-10 soft-card-shadow space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shrink-0">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#16A34A]">Pedido registrado</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24] mt-0.5">
                  Pedido #{completedOrder.orderNumber} confirmado!
                </h1>
                <p className="text-sm text-[#725B53] mt-1">
                  Obrigado, {completedOrder.customerName}. Clique abaixo para enviar o resumo pronto no WhatsApp da Prof e combinar o pagamento (Pix ou Cartão).
                </p>
              </div>
            </div>

            <div className="bg-[#FDF8F5] border border-[#EFE4DE] rounded-2xl p-5 space-y-3 text-sm">
              <h2 className="font-display font-bold text-[#3D2A24]">Resumo do Pedido</h2>
              <div className="text-xs text-[#725B53] space-y-1">
                <p>
                  <strong className="text-[#3D2A24]">Entrega:</strong> {completedOrder.street},{' '}
                  {completedOrder.number} — {completedOrder.neighborhood}, {completedOrder.city}/
                  {completedOrder.state} · CEP {completedOrder.cep}
                </p>
                <p>
                  <strong className="text-[#3D2A24]">Frete:</strong> {completedOrder.shippingMethod} (
                  {completedOrder.shippingCost === 0
                    ? 'Grátis'
                    : formatCurrency(completedOrder.shippingCost)}
                  )
                </p>
              </div>

              <ul className="divide-y divide-[#EFE4DE] pt-2">
                {completedOrder.items.map((item, i) => (
                  <li key={i} className="py-2 flex items-center justify-between gap-4 text-xs">
                    <span className="text-[#3D2A24]">
                      {item.quantity}x {item.name}
                      {item.variantLabel ? ` (${item.variantLabel})` : ''}
                    </span>
                    <span className="font-bold text-[#6F4E42] tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-[#EFE4DE] space-y-1 text-xs">
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <span>Desconto ({completedOrder.couponCode})</span>
                    <span className="tabular-nums">-{formatCurrency(completedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#3D2A24] pt-1">
                  <span>Total a pagar</span>
                  <span className="tabular-nums text-[#6F4E42]">
                    {formatCurrency(completedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold hover:bg-[#15803D] transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Enviar Pedido no WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => onNavigate({ page: 'catalog' })}
                className="px-6 py-3.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
              >
                Voltar para a loja
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FDEEF4] text-[#B84A70] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#3D2A24]">
          Sua sacola está vazia
        </h1>
        <p className="text-sm text-[#725B53]">
          Escolha seus recursos pedagógicos no catálogo antes de finalizar o pedido.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ page: 'catalog' })}
          className="px-6 py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors"
        >
          Ir para o Catálogo
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] placeholder:text-[#8C756D] focus:outline-none focus:border-[#E89EB8] focus:bg-white transition-colors';

  return (
    <div className="bg-[#FDF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="font-script text-2xl text-[#6F4E42] leading-none">
            Quase lá
          </p>
          <h1 className="font-display text-3xl font-bold text-[#3D2A24] mt-1">
            Finalizar Pedido
          </h1>
          <p className="text-sm text-[#725B53] mt-1">
            Preencha seus dados de entrega para calcular o frete e enviar o pedido direto para o WhatsApp da Prof.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6" noValidate>
            {/* Customer Info */}
            <section className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4">
              <h2 className="font-display text-lg font-bold text-[#3D2A24]">
                1. Dados de Contato
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="chk-name" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Nome completo *
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Profa. Ana Clara Souza"
                    className={inputCls}
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhoneBr(e.target.value))}
                    placeholder="(17) 99999-9999"
                    className={`${inputCls} tabular-nums`}
                  />
                  {formErrors.customerPhone && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="chk-email" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    E-mail *
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ana@escola.com.br"
                    className={inputCls}
                  />
                  {formErrors.customerEmail && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.customerEmail}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Address & CEP (hidden when cart has only digital PDFs) */}
            {hasOnlyDigital ? (
              <section className="bg-[#F4EFFA] border border-[#E8DDF6] rounded-3xl p-6 space-y-2">
                <h2 className="font-display text-base font-bold text-[#3D2A24]">
                  2. Entrega Digital na Área do Aluno (Frete Grátis)
                </h2>
                <p className="text-xs text-[#725B53] leading-relaxed">
                  Como sua sacola possui apenas apostilas e PDFs exclusivos de aula particular, não há cobrança de frete. Após enviar seu pedido e confirmar o pagamento no WhatsApp, a Prof liberará o PDF diretamente no seu painel na{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'aluno' })}
                    className="font-bold text-[#6F4E42] underline"
                  >
                    Área do Aluno
                  </button>
                  .
                </p>
              </section>
            ) : (
            <section className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4">
              <h2 className="font-display text-lg font-bold text-[#3D2A24]">
                2. Endereço e Cálculo de Frete
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label htmlFor="chk-cep" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      id="chk-cep"
                      type="text"
                      inputMode="numeric"
                      required
                      value={cep}
                      onChange={(e) => setCep(formatCep(e.target.value))}
                      placeholder="15015-000"
                      className={`${inputCls} tabular-nums`}
                    />
                    {cepLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-[#6F4E42] absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {formErrors.cep && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.cep}</p>
                  )}
                  {cepError && <p className="text-xs text-[#D97706] mt-1">{cepError}</p>}
                </div>

                <div className="sm:col-span-7">
                  <label htmlFor="chk-street" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    id="chk-street"
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={inputCls}
                  />
                  {formErrors.street && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.street}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="chk-number" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Número *
                  </label>
                  <input
                    id="chk-number"
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className={inputCls}
                  />
                  {formErrors.number && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.number}</p>
                  )}
                </div>

                <div className="sm:col-span-5">
                  <label htmlFor="chk-comp" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Complemento
                  </label>
                  <input
                    id="chk-comp"
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, bloco, escola..."
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="chk-neigh" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Bairro *
                  </label>
                  <input
                    id="chk-neigh"
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className={inputCls}
                  />
                  {formErrors.neighborhood && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.neighborhood}</p>
                  )}
                </div>

                <div className="sm:col-span-9">
                  <label htmlFor="chk-city" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Cidade *
                  </label>
                  <input
                    id="chk-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls}
                  />
                  {formErrors.city && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="chk-uf" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    id="chk-uf"
                    type="text"
                    maxLength={2}
                    required
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className={`${inputCls} uppercase`}
                  />
                  {formErrors.stateUf && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.stateUf}</p>
                  )}
                </div>
              </div>

              {/* Shipping options */}
              {shippingOptions.length > 0 && (
                <div className="pt-3 border-t border-[#FAF3EE] space-y-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-[#3D2A24]">
                    <Truck className="w-4 h-4 text-[#6F4E42]" aria-hidden="true" />
                    Escolha a modalidade de envio:
                  </span>
                  <div className="space-y-2">
                    {shippingOptions.map((opt) => {
                      const checked = selectedShipping?.code === opt.code;
                      return (
                        <label
                          key={opt.code}
                          className={`flex items-center justify-between gap-4 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[#FDEEF4] border-[#E89EB8]'
                              : 'bg-[#FDF8F5] border-[#EFE4DE] hover:border-[#6F4E42]/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={checked}
                              onChange={() => setSelectedShippingCode(opt.code)}
                              className="mt-1 accent-[#6F4E42]"
                            />
                            <div>
                              <p className="text-sm font-bold text-[#3D2A24]">{opt.name}</p>
                              <p className="text-xs text-[#725B53]">
                                {opt.estimatedDays} · {opt.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#6F4E42] tabular-nums shrink-0">
                            {opt.price === 0 ? 'Grátis' : formatCurrency(opt.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {formErrors.shipping && (
                <p className="text-xs text-[#DC2626]">{formErrors.shipping}</p>
              )}
            </section>
            )}

            {/* Notes */}
            <section className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-3">
              <label htmlFor="chk-notes" className="block font-display text-sm font-bold text-[#3D2A24]">
                Observações (opcional)
              </label>
              <textarea
                id="chk-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Preciso de nota fiscal para escola, preferência de entrega à tarde..."
                className={inputCls}
              />
            </section>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#6F4E42] text-white text-base font-bold hover:bg-[#573B30] disabled:opacity-60 transition-colors soft-card-shadow"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
              )}
              <span>{submitting ? 'Registrando pedido...' : 'Concluir Pedido & Enviar no WhatsApp'}</span>
            </button>
          </form>

          {/* Right Summary Column */}
          <aside className="lg:col-span-5 bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-5 lg:sticky lg:top-28">
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">
              Resumo da Sacola
            </h2>

            <ul className="divide-y divide-[#FAF3EE] max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantLabel || 'd'}`}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover bg-[#FAF3EE] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#3D2A24] truncate">{item.name}</p>
                      <p className="text-xs text-[#725B53]">
                        Qtd: {item.quantity}
                        {item.variantLabel ? ` · ${item.variantLabel}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#6F4E42] tabular-nums shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon Form */}
            <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-[#FAF3EE] space-y-2">
              <label htmlFor="chk-coupon" className="flex items-center gap-1.5 text-xs font-bold text-[#3D2A24]">
                <Tag className="w-3.5 h-3.5 text-[#6F4E42]" aria-hidden="true" />
                <span>Cupom de desconto (ex: PROF10)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="chk-coupon"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="PROF10"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-mono uppercase focus:outline-none focus:border-[#E89EB8]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] text-xs font-bold hover:bg-[#D5E9FA] transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {couponError && <p className="text-xs text-[#DC2626]">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-[#15803D] font-semibold">
                  <span>Cupom {appliedCoupon.code} ativo</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput('');
                    }}
                    className="underline text-[#725B53]"
                  >
                    Remover
                  </button>
                </div>
              )}
            </form>

            {/* Totals */}
            <div className="pt-4 border-t border-[#EFE4DE] space-y-2 text-sm">
              <div className="flex justify-between text-[#725B53]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#725B53]">
                <span>Frete ({selectedShipping ? selectedShipping.code : 'Informe o CEP'})</span>
                <span className="tabular-nums">
                  {selectedShipping
                    ? totals.shippingCost === 0
                      ? 'Grátis'
                      : formatCurrency(totals.shippingCost)
                    : '—'}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-[#15803D] font-semibold">
                  <span>Desconto</span>
                  <span className="tabular-nums">-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-[#EFE4DE]">
                <span className="font-display font-bold text-[#3D2A24]">Total</span>
                <span className="font-display text-2xl font-bold text-[#6F4E42] tabular-nums">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
