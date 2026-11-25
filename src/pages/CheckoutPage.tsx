import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, FileText, ShoppingBag, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  buildWhatsAppOrderUrl,
  formatBRL,
  maskPhone,
} from '../lib/utils';
import { Order } from '../types';
import { SafeImage } from '../components/SafeImage';

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    clearCart,
    settings,
    validateCoupon,
    createOrder,
    firebaseUser,
    studentProfile,
    navigate,
    showToast,
  } = useStore();

  const [fullName, setFullName] = useState(studentProfile?.fullName || '');
  const [phone, setPhone] = useState(studentProfile?.phone || '');
  const [email, setEmail] = useState(studentProfile?.email || firebaseUser?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    order: Order;
    waUrl: string;
  } | null>(null);

  useEffect(() => {
    if (studentProfile) {
      if (!fullName) setFullName(studentProfile.fullName || '');
      if (!phone && studentProfile.phone) setPhone(studentProfile.phone);
      if (!email) setEmail(studentProfile.email || '');
    }
  }, [studentProfile, fullName, phone, email]);

  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, cartSubtotal - discount);

  const handleApplyCoupon = () => {
    const res = validateCoupon(couponInput, cartSubtotal);
    setCouponMessage(res.message);
    if (res.valid && res.coupon) {
      setAppliedCoupon({ code: res.coupon.code, discount: res.discount });
      showToast(res.message);
    } else {
      setAppliedCoupon(null);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (fullName.trim().length < 2) {
      showToast('Informe seu nome completo.', 'error');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      showToast('Informe um telefone WhatsApp válido com DDD.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = `#PP-${Math.floor(1000 + Math.random() * 9000)}`;
      const savedOrder = await createOrder({
        orderNumber,
        customerId: firebaseUser?.uid || '',
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        items: cart.map((c) => ({
          id: c.id,
          type: 'material',
          title: c.title,
          price: c.price,
          quantity: c.quantity,
          imageUrl: c.imageUrl,
        })),
        subtotal: cartSubtotal,
        shippingCost: 0,
        discount,
        couponCode: appliedCoupon?.code,
        total,
        paymentMethod,
        source: 'online',
        status: 'pending',
      });

      const waUrl = buildWhatsAppOrderUrl({
        whatsappNumber: settings.whatsappNumber,
        orderNumber,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        items: cart,
        subtotal: cartSubtotal,
        shippingCost: 0,
        discount,
        couponCode: appliedCoupon?.code,
        total,
        paymentMethod,
      });

      clearCart();
      setCompletedOrder({ order: savedOrder, waUrl });
      showToast(`Pedido ${orderNumber} registrado! Enviando resumo ao WhatsApp...`);

      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (error) {
      console.error(error);
      showToast('Não foi possível registrar o pedido. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    const { order, waUrl } = completedOrder;
    return (
      <main className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 border-2 border-[#FCE1EE] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#EAF8EC] text-[#3F9145] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#E05899]">
              Pedido {order.orderNumber} Registrado
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3A2E45]">
              Obrigada pelo seu pedido, {order.customerName.split(' ')[0]}!
            </h1>
            <p className="text-sm text-[#675975] max-w-lg mx-auto leading-relaxed">
              Seu resumo foi preparado para envio automático no WhatsApp da loja. Clique no botão abaixo caso a janela não tenha aberto automaticamente.
            </p>
          </div>

          <div className="bg-[#FFF9FB] rounded-2xl p-5 border border-[#FCE1EE] text-left space-y-2 text-xs text-[#3A2E45]">
            {order.items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex justify-between gap-4">
                <span>
                  {item.quantity}x {item.title}
                </span>
                <span className="font-mono tabular-nums font-bold">
                  {formatBRL(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-[#FCE1EE] flex justify-between font-bold text-sm text-[#3A2E45]">
              <span>Total</span>
              <span className="font-mono tabular-nums text-[#E05899]">{formatBRL(order.total)}</span>
            </div>
          </div>

          <div className="bg-[#E8F6FE] border border-[#BEE6FB] rounded-2xl p-4 text-xs text-[#3A2E45]">
            Assim que confirmarmos seu pagamento no WhatsApp, os arquivos <strong>PDF</strong> serão liberados diretamente na sua <strong>Área do Aluno</strong> para baixar e imprimir!
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl candy-btn-coral text-sm font-bold"
            >
              <span>Enviar Resumo no WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => {
                const decoded = decodeURIComponent(waUrl.split('?text=')[1] || '');
                navigator.clipboard?.writeText(decoded);
                showToast('Resumo do pedido copiado!');
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl candy-btn-purple text-sm font-bold cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Resumo</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('student')}
              className="text-xs font-bold text-[#E05899] hover:underline cursor-pointer"
            >
              Ir para Área do Aluno
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#FCE6F1] text-[#E05899] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#3A2E45]">Sua sacola está vazia</h1>
        <p className="text-sm text-[#675975]">
          Adicione suas apostilas e materiais em PDF antes de prosseguir para o checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('catalog')}
          className="px-7 py-3.5 rounded-full candy-btn-yellow text-sm font-display font-bold cursor-pointer"
        >
          Explorar Catálogo de PDFs
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-bold text-[#3A2E45] mb-8">
        Finalizar Pedido Digital (PDF)
      </h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Info */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-5 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#3A2E45]">
              1. Dados para Contato e Liberação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex.: Maria Clara Silva"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                  E-mail (para Área do Aluno) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#E8F6FE] border border-[#BEE6FB] p-4 flex items-start gap-3 text-xs text-[#3A2E45]">
              <FileText className="w-4 h-4 text-[#2D8EC4] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Entrega 100% Digital em PDF:</strong> não há cobrança de frete nem envio físico. Após confirmação do pedido no WhatsApp, o arquivo fica disponível na sua Área do Aluno para download imediato.
              </p>
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#3A2E45]">
              2. Preferência de Pagamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Pix', 'Cartão de Crédito', 'Cartão de Débito'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-[#FCE6F1] border-[#F267A8] text-[#3A2E45]'
                      : 'bg-[#FFF9FB] border-[#FCE1EE] text-[#675975] hover:border-[#F8BBD7]'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-6 lg:sticky lg:top-28 shadow-sm">
          <h2 className="font-display text-xl font-bold text-[#3A2E45]">Resumo do Pedido</h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
                <SafeImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#FFF9FB] border border-[#FCE1EE]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#3A2E45] truncate">{item.title}</p>
                  <p className="text-[11px] text-[#675975]">
                    Qtd: {item.quantity} · PDF Digital
                  </p>
                </div>
                <span className="font-mono tabular-nums text-xs font-bold text-[#E05899]">
                  {formatBRL(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="pt-4 border-t border-[#FCE1EE] space-y-2">
            <label className="block text-xs font-bold text-[#3A2E45]">Cupom de desconto</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#7D6A43] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Ex.: PROF10"
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#FDECA8] border-2 border-[#FAD663] text-xs font-bold uppercase text-[#3A2E45] placeholder:text-[#7D6A43] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2.5 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer"
              >
                Aplicar
              </button>
            </div>
            {couponMessage && (
              <p className={`text-xs font-semibold ${appliedCoupon ? 'text-[#3F9145]' : 'text-[#E05899]'}`}>
                {couponMessage}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-[#FCE1EE] space-y-2.5 text-sm">
            <div className="flex justify-between text-[#675975]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-semibold">{formatBRL(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-[#675975]">
              <span>Entrega</span>
              <span className="text-xs font-bold text-[#3F9145]">Digital em PDF (Área do Aluno)</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#3F9145] font-semibold">
                <span>Desconto ({appliedCoupon?.code})</span>
                <span className="font-mono tabular-nums">-{formatBRL(discount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-[#FCE1EE] flex justify-between items-baseline">
              <span className="font-display text-lg font-bold text-[#3A2E45]">Total</span>
              <span className="font-mono tabular-nums text-2xl font-bold text-[#E05899]">
                {formatBRL(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Finalizando Pedido...' : 'Finalizar Pedido via WhatsApp'}
          </button>
        </aside>
      </form>
    </main>
  );
}
