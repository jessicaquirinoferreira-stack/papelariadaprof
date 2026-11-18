import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  formatCurrency,
  formatPhoneBr,
  getEffectivePrice,
  validateCouponLogic,
} from '../../lib/commerce';
import type { Coupon, Order, OrderItem, Product, StoreSettings } from '../../types/store';

interface AdminPosTabProps {
  products: Product[];
  coupons: Coupon[];
  settings: StoreSettings;
  onCreateOrder: (order: Order) => Promise<void>;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

export function AdminPosTab({
  products,
  coupons,
  settings,
  onCreateOrder,
  onNotify,
}: AdminPosTabProps) {
  const [search, setSearch] = useState('');
  const [pdvItems, setPdvItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.active &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q))
    );
  }, [products, search]);

  const addProduct = (product: Product) => {
    const unitPrice = getEffectivePrice(product);
    setPdvItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const qty = next[idx].quantity + 1;
        next[idx] = {
          ...next[idx],
          quantity: qty,
          subtotal: Math.round(qty * unitPrice * 100) / 100,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice,
          subtotal: unitPrice,
        },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setPdvItems((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const qty = item.quantity + delta;
          return {
            ...item,
            quantity: qty,
            subtotal: Math.round(qty * item.unitPrice * 100) / 100,
          };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = Math.round(pdvItems.reduce((a, b) => a + b.subtotal, 0) * 100) / 100;
  const matchedCoupon = couponCode
    ? coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase())
    : undefined;
  const couponCheck = matchedCoupon
    ? validateCouponLogic(matchedCoupon, subtotal)
    : { valid: false, discountAmount: 0 };
  const totalDiscount = Math.min(
    subtotal,
    (couponCheck.valid ? couponCheck.discountAmount : 0) + Math.max(0, manualDiscount)
  );
  const total = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

  const handleFinalizeSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pdvItems.length === 0) {
      onNotify('Adicione pelo menos um produto ao PDV.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: `pdv-${Date.now()}`,
      orderNumber: `PDV-${Math.floor(2000 + Math.random() * 7900)}`,
      customerName: customerName.trim() || 'Cliente Balcão (Ateliê)',
      customerPhone: customerPhone.trim() || '(17) 99999-0000',
      items: pdvItems,
      subtotal,
      shippingMethod: 'Retirada no Balcão (PDV)',
      shippingCost: 0,
      couponCode: couponCheck.valid ? matchedCoupon?.code : undefined,
      discount: totalDiscount,
      total,
      status: 'finalizado',
      source: 'pdv',
      createdAt: now,
      updatedAt: now,
    };

    await onCreateOrder(order);
    setLastOrder(order);
    setPdvItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCouponCode('');
    setManualDiscount(0);
    onNotify(`Venda ${order.orderNumber} finalizada!`);
  };

  const whatsappUrl = lastOrder
    ? buildWhatsAppUrl(
        lastOrder.customerPhone.replace(/\D/g, '').length >= 10
          ? lastOrder.customerPhone
          : settings.whatsappNumber,
        buildWhatsAppOrderMessage(lastOrder, settings)
      )
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Fast Product Search & Grid */}
      <div className="lg:col-span-7 bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow space-y-4">
        <div className="relative">
          <label htmlFor="pdv-search" className="sr-only">
            Buscar produto no PDV
          </label>
          <Search className="w-4 h-4 text-[#725B53] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="pdv-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca rápida por nome ou categoria..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="flex items-center gap-3 p-3 rounded-2xl border border-[#EFE4DE] bg-[#FDF8F5] hover:border-[#E89EB8] hover:bg-[#FDEEF4]/40 text-left transition-colors"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#3D2A24] truncate">
                  {product.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-[#6F4E42] tabular-nums">
                    {formatCurrency(getEffectivePrice(product))}
                  </span>
                  <span className="text-[11px] text-[#725B53] tabular-nums">
                    Est: {product.stock}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Active PDV Ticket */}
      <div className="lg:col-span-5 bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow space-y-5">
        <h3 className="font-display text-lg font-bold text-[#3D2A24]">
          Caixa Rápido (PDV)
        </h3>

        {lastOrder && (
          <div className="p-4 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#166534]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Venda #{lastOrder.orderNumber} registrada!</span>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803D]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enviar comprovante no WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <form onSubmit={handleFinalizeSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pdv-cust" className="block text-xs font-semibold text-[#725B53] mb-1">
                Nome do cliente
              </label>
              <input
                id="pdv-cust"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Profa. Marina"
                className="w-full px-3 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs"
              />
            </div>
            <div>
              <label htmlFor="pdv-phone" className="block text-xs font-semibold text-[#725B53] mb-1">
                WhatsApp
              </label>
              <input
                id="pdv-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhoneBr(e.target.value))}
                placeholder="(17) 99999-9999"
                className="w-full px-3 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="border border-[#EFE4DE] rounded-2xl divide-y divide-[#FAF3EE] max-h-56 overflow-y-auto">
            {pdvItems.length === 0 ? (
              <p className="p-4 text-xs text-[#725B53] text-center">
                Clique nos produtos ao lado para adicionar ao caixa.
              </p>
            ) : (
              pdvItems.map((item) => (
                <div key={item.productId} className="p-3 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#3D2A24] truncate">{item.name}</p>
                    <p className="text-[#725B53] tabular-nums">
                      {formatCurrency(item.unitPrice)} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, -1)}
                      aria-label="Diminuir"
                      className="p-1 rounded-lg border border-[#EFE4DE] hover:bg-[#FDF8F5]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, 1)}
                      aria-label="Aumentar"
                      className="p-1 rounded-lg border border-[#EFE4DE] hover:bg-[#FDF8F5]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, -item.quantity)}
                      aria-label="Remover item"
                      className="p-1 text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pdv-coupon" className="block text-xs font-semibold text-[#725B53] mb-1">
                Cupom
              </label>
              <input
                id="pdv-coupon"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="PROF10"
                className="w-full px-3 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label htmlFor="pdv-disc" className="block text-xs font-semibold text-[#725B53] mb-1">
                Desconto extra (R$)
              </label>
              <input
                id="pdv-disc"
                type="number"
                min={0}
                step="0.50"
                value={manualDiscount}
                onChange={(e) => setManualDiscount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EFE4DE] space-y-1 text-sm">
            <div className="flex justify-between text-xs text-[#725B53]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-[#15803D]">
                <span>Desconto</span>
                <span className="tabular-nums">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-lg text-[#3D2A24] pt-1">
              <span>Total</span>
              <span className="tabular-nums text-[#6F4E42]">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={pdvItems.length === 0}
            className="w-full py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] disabled:bg-[#EFE4DE] disabled:text-[#725B53] transition-colors"
          >
            Finalizar Venda PDV
          </button>
        </form>
      </div>
    </div>
  );
}
