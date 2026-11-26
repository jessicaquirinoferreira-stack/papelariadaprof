import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  UserPlus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  calculateInstallmentOption,
  getAllowedInstallmentOptions,
} from '../lib/infinitepay';
import { formatBRL, maskPhone, slugId } from '../lib/utils';
import { Order } from '../types';
import { SafeImage } from '../components/SafeImage';

function extractInfinitePaySlug(checkoutUrl: string): string {
  try {
    const segments = new URL(checkoutUrl).pathname.split('/').filter(Boolean);
    return segments.length >= 2 ? segments[1].slice(0, 120) : '';
  } catch {
    return '';
  }
}

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    clearCart,
    validateCoupon,
    createOrder,
    verifyAndUnlockInfinitePayOrder,
    firebaseUser,
    studentProfile,
    studentMaterials,
    loginWithGoogle,
    loginStudentWithEmail,
    registerStudent,
    logout,
    navigate,
    showToast,
  } = useStore();

  // Contact fields (synced with authenticated student)
  const [fullName, setFullName] = useState(studentProfile?.fullName || '');
  const [phone, setPhone] = useState(studentProfile?.phone || '');
  const [email, setEmail] = useState(studentProfile?.email || firebaseUser?.email || '');

  // Inline Auth inside Checkout Step 1 when not logged in
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Payment Method & InfinitePay Installments
  const [paymentType, setPaymentType] = useState<'pix' | 'credit_card'>('pix');
  const [wantsInstallments, setWantsInstallments] = useState<boolean>(false);
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState('');

  // Active InfinitePay Checkout Session
  const [submitting, setSubmitting] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{
    order: Order;
    checkoutUrl: string;
    slug: string;
  } | null>(null);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);

  // Pre-prepared InfinitePay checkout link so clicking "Ir para Checkout" opens immediately without popup blocking
  const [preparedCheckout, setPreparedCheckout] = useState<{
    signature: string;
    orderId: string;
    orderNumber: string;
    checkoutUrl: string;
    slug: string;
  } | null>(null);
  const [preparingCheckout, setPreparingCheckout] = useState(false);
  const pendingOrderSaveRef = useRef<Promise<void> | null>(null);

  const isInIframe = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    if (studentProfile) {
      if (!fullName) setFullName(studentProfile.fullName || '');
      if (!phone && studentProfile.phone) setPhone(studentProfile.phone);
      if (!email) setEmail(studentProfile.email || '');
    } else if (firebaseUser) {
      if (!fullName && firebaseUser.displayName) setFullName(firebaseUser.displayName);
      if (!email && firebaseUser.email) setEmail(firebaseUser.email);
    }
  }, [studentProfile, firebaseUser, fullName, phone, email]);

  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const baseTotal = Math.max(0, Number((cartSubtotal - discount).toFixed(2)));

  const allowedInstallments = useMemo(
    () => getAllowedInstallmentOptions(baseTotal),
    [baseTotal]
  );

  const effectiveInstallments = useMemo(() => {
    if (paymentType === 'pix') return 1;
    if (!wantsInstallments) return 1;
    const maxAllowed =
      allowedInstallments[allowedInstallments.length - 1]?.installments || 1;
    return Math.max(1, Math.min(maxAllowed, selectedInstallments));
  }, [paymentType, wantsInstallments, allowedInstallments, selectedInstallments]);

  const activeInstallmentCalc = useMemo(
    () => calculateInstallmentOption(baseTotal, effectiveInstallments),
    [baseTotal, effectiveInstallments]
  );

  const finalTotal =
    paymentType === 'pix' ? baseTotal : activeInstallmentCalc.totalWithInterest;

  const checkoutSignature = useMemo(() => {
    if (!firebaseUser || cart.length === 0) return '';
    return JSON.stringify({
      uid: firebaseUser.uid,
      items: cart.map((c) => [c.id, c.price, c.quantity]),
      discount,
      paymentType,
      installments: effectiveInstallments,
    });
  }, [firebaseUser, cart, discount, paymentType, effectiveInstallments]);

  // Auto-prepare InfinitePay checkout link whenever user is logged in and payment options settle
  useEffect(() => {
    if (!firebaseUser || !checkoutSignature || pendingCheckout || paidOrder) {
      return;
    }
    if (preparedCheckout && preparedCheckout.signature === checkoutSignature) {
      return;
    }

    let cancelled = false;
    setPreparingCheckout(true);

    const timer = setTimeout(async () => {
      try {
        const orderId = slugId('ord');
        const orderNumber = `#PP-${Math.floor(1000 + Math.random() * 9000)}`;
        const origin = window.location.origin;
        const redirectUrl = `${origin}/?payment_return=infinitepay&order_id=${encodeURIComponent(orderId)}`;
        const webhookUrl = origin.startsWith('https://')
          ? `${origin}/api/infinitepay/webhook`
          : undefined;

        const cleanName = (
          fullName ||
          studentProfile?.fullName ||
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Aluna'
        ).trim();
        const cleanEmail = (email || studentProfile?.email || firebaseUser.email || '').trim();
        const phoneDigits = phone.replace(/\D/g, '');

        const resp = await fetch('/api/infinitepay/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            items: cart.map((c) => ({
              title: c.title,
              price: c.price,
              quantity: c.quantity,
            })),
            discount,
            paymentType,
            installments: effectiveInstallments,
            redirectUrl,
            webhookUrl,
            customer: {
              name: cleanName,
              email: cleanEmail,
              phone: phoneDigits.length >= 10 ? phone.trim() : undefined,
            },
          }),
        });

        const data = (await resp.json().catch(() => ({}))) as {
          url?: string;
          slug?: string;
        };

        if (!cancelled && resp.ok && data.url) {
          const slug = data.slug || extractInfinitePaySlug(data.url);
          setPreparedCheckout({
            signature: checkoutSignature,
            orderId,
            orderNumber,
            checkoutUrl: data.url,
            slug,
          });
        }
      } catch {
        // Fallback button handles on-demand creation if pre-fetch fails
      } finally {
        if (!cancelled) {
          setPreparingCheckout(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    firebaseUser,
    checkoutSignature,
    pendingCheckout,
    paidOrder,
    preparedCheckout,
    cart,
    discount,
    paymentType,
    effectiveInstallments,
    fullName,
    phone,
    email,
    studentProfile,
  ]);

  // Background polling while waiting for InfinitePay payment confirmation
  useEffect(() => {
    if (!pendingCheckout || paidOrder || !firebaseUser) return;

    let cancelled = false;
    const poll = async () => {
      try {
        if (pendingOrderSaveRef.current) {
          await pendingOrderSaveRef.current;
        }
        const res = await verifyAndUnlockInfinitePayOrder({
          orderId: pendingCheckout.order.id,
          slug: pendingCheckout.slug,
        });
        if (!cancelled && res.paid && res.order) {
          clearCart();
          try {
            localStorage.removeItem('papelaria_prof_pending_infinitepay');
          } catch {
            // ignore
          }
          setPaidOrder(res.order);
          showToast(
            'Pagamento confirmado na InfinitePay! Seus PDFs já estão liberados na Área do Aluno!'
          );
        }
      } catch {
        // silent background check
      }
    };

    const interval = setInterval(poll, 4500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingCheckout, paidOrder, firebaseUser, verifyAndUnlockInfinitePayOrder, clearCart, showToast]);

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

  const handleCheckoutAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authTab === 'login') {
        await loginStudentWithEmail(authEmail, authPassword);
      } else {
        if (authName.trim().length < 2) {
          throw new Error('Informe seu nome completo.');
        }
        if (authPhone.replace(/\D/g, '').length < 10) {
          throw new Error('Informe um WhatsApp válido com DDD.');
        }
        if (authPassword.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.');
        }
        if (authPassword !== authConfirm) {
          throw new Error('As senhas não conferem.');
        }
        await registerStudent({
          fullName: authName,
          email: authEmail,
          phone: authPhone,
          password: authPassword,
        });
        setFullName(authName.trim());
        setPhone(authPhone.trim());
        setEmail(authEmail.trim());
      }
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado. Acesse a aba "Já tenho conta".');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setAuthError('E-mail ou senha incorretos.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Erro ao autenticar.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const persistOrderForSession = async ({
    orderId,
    orderNumber,
    checkoutUrl,
    slug,
  }: {
    orderId: string;
    orderNumber: string;
    checkoutUrl: string;
    slug: string;
  }): Promise<Order> => {
    if (!firebaseUser) {
      throw new Error('Usuário não autenticado.');
    }
    const cleanName = (
      fullName ||
      studentProfile?.fullName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Aluna'
    ).trim();
    const safePhone =
      phone.replace(/\D/g, '').length >= 8 ? phone.trim() : 'Não informado';
    const paymentLabel =
      paymentType === 'pix'
        ? 'Pix · InfinitePay'
        : effectiveInstallments <= 3
        ? `Cartão ${effectiveInstallments}x sem juros · InfinitePay`
        : `Cartão ${effectiveInstallments}x c/ juros InfinitePay`;

    const materialIds = Array.from(
      new Set(cart.filter((c) => c.type === 'material').map((c) => c.id))
    );

    const savedOrder = await createOrder({
      id: orderId,
      orderNumber,
      customerId: firebaseUser.uid,
      customerName: cleanName.length >= 2 ? cleanName : 'Aluna',
      customerPhone: safePhone,
      customerEmail: (email || firebaseUser.email || '').trim(),
      items: cart.map((c) => ({
        id: c.id,
        type: 'material',
        title: c.title,
        price: c.price,
        quantity: c.quantity,
        imageUrl: c.imageUrl,
      })),
      materialIds,
      subtotal: cartSubtotal,
      shippingCost: 0,
      discount,
      couponCode: appliedCoupon?.code,
      installments: effectiveInstallments,
      interestAmount:
        paymentType === 'credit_card' ? activeInstallmentCalc.interestAmount : 0,
      total: finalTotal,
      paymentMethod: paymentLabel,
      paymentProvider: 'infinitepay',
      paymentSlug: slug,
      paymentUrl: checkoutUrl,
      source: 'online',
      status: 'pending',
    });

    try {
      localStorage.setItem(
        'papelaria_prof_pending_infinitepay',
        JSON.stringify({ orderId: savedOrder.id, slug, checkoutUrl })
      );
    } catch {
      // ignore
    }

    return savedOrder;
  };

  // Called synchronously on real <a href={checkoutUrl} target="_blank"> click inside iframe
  const handlePreparedAnchorClick = () => {
    if (!preparedCheckout || !firebaseUser) return;
    const session = preparedCheckout;

    const paymentLabel =
      paymentType === 'pix'
        ? 'Pix · InfinitePay'
        : effectiveInstallments <= 3
        ? `Cartão ${effectiveInstallments}x sem juros · InfinitePay`
        : `Cartão ${effectiveInstallments}x c/ juros InfinitePay`;
    const cleanName = (
      fullName ||
      studentProfile?.fullName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Aluna'
    ).trim();
    const safePhone =
      phone.replace(/\D/g, '').length >= 8 ? phone.trim() : 'Não informado';

    const optimisticOrder: Order = {
      id: session.orderId,
      orderNumber: session.orderNumber,
      customerId: firebaseUser.uid,
      customerName: cleanName.length >= 2 ? cleanName : 'Aluna',
      customerPhone: safePhone,
      customerEmail: (email || firebaseUser.email || '').trim(),
      items: cart.map((c) => ({
        id: c.id,
        type: 'material',
        title: c.title,
        price: c.price,
        quantity: c.quantity,
        imageUrl: c.imageUrl,
      })),
      materialIds: Array.from(
        new Set(cart.filter((c) => c.type === 'material').map((c) => c.id))
      ),
      subtotal: cartSubtotal,
      shippingCost: 0,
      discount,
      couponCode: appliedCoupon?.code,
      installments: effectiveInstallments,
      interestAmount:
        paymentType === 'credit_card' ? activeInstallmentCalc.interestAmount : 0,
      total: finalTotal,
      paymentMethod: paymentLabel,
      paymentProvider: 'infinitepay',
      paymentSlug: session.slug,
      paymentUrl: session.checkoutUrl,
      source: 'online',
      status: 'pending',
    };

    setPendingCheckout({
      order: optimisticOrder,
      checkoutUrl: session.checkoutUrl,
      slug: session.slug,
    });
    showToast('Checkout InfinitePay aberto! Conclua o pagamento na nova aba.');

    pendingOrderSaveRef.current = persistOrderForSession({
      orderId: session.orderId,
      orderNumber: session.orderNumber,
      checkoutUrl: session.checkoutUrl,
      slug: session.slug,
    })
      .then((saved) => {
        setPendingCheckout((prev) => (prev ? { ...prev, order: saved } : prev));
      })
      .catch((err) => {
        console.error('Background order persist error:', err);
      })
      .finally(() => {
        pendingOrderSaveRef.current = null;
      });
  };

  const handleStartInfinitePayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!firebaseUser) {
      showToast(
        'Entre ou crie sua conta de aluno no Passo 1 para liberar seus PDFs automaticamente após o pagamento.',
        'error'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      let orderId: string;
      let orderNumber: string;
      let checkoutUrl: string;
      let slug: string;

      if (preparedCheckout && preparedCheckout.signature === checkoutSignature) {
        orderId = preparedCheckout.orderId;
        orderNumber = preparedCheckout.orderNumber;
        checkoutUrl = preparedCheckout.checkoutUrl;
        slug = preparedCheckout.slug;
      } else {
        orderId = slugId('ord');
        orderNumber = `#PP-${Math.floor(1000 + Math.random() * 9000)}`;
        const origin = window.location.origin;
        const redirectUrl = `${origin}/?payment_return=infinitepay&order_id=${encodeURIComponent(orderId)}`;
        const webhookUrl = origin.startsWith('https://')
          ? `${origin}/api/infinitepay/webhook`
          : undefined;

        const cleanName = (
          fullName ||
          studentProfile?.fullName ||
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Aluna'
        ).trim();
        const phoneDigits = phone.replace(/\D/g, '');

        const checkoutResp = await fetch('/api/infinitepay/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            items: cart.map((c) => ({
              title: c.title,
              price: c.price,
              quantity: c.quantity,
            })),
            discount,
            paymentType,
            installments: effectiveInstallments,
            redirectUrl,
            webhookUrl,
            customer: {
              name: cleanName,
              email: (email || firebaseUser.email || '').trim(),
              phone: phoneDigits.length >= 10 ? phone.trim() : undefined,
            },
          }),
        });

        const rawRespText = await checkoutResp.text();
        let checkoutJson: {
          url?: string;
          slug?: string;
          error?: string;
        } = {};
        try {
          checkoutJson = JSON.parse(rawRespText);
        } catch {
          // ignore non-json
        }

        if (!checkoutResp.ok || !checkoutJson.url) {
          throw new Error(
            checkoutJson.error ||
              (rawRespText && rawRespText.length < 180 ? rawRespText : '') ||
              'Não foi possível gerar o link de pagamento InfinitePay.'
          );
        }

        checkoutUrl = checkoutJson.url;
        slug = checkoutJson.slug || extractInfinitePaySlug(checkoutUrl);
      }

      const savedOrder = await persistOrderForSession({
        orderId,
        orderNumber,
        checkoutUrl,
        slug,
      });

      setPendingCheckout({
        order: savedOrder,
        checkoutUrl,
        slug,
      });

      showToast('Redirecionando para o checkout seguro InfinitePay...');

      if (!isInIframe) {
        // Direct same-tab navigation outside iframe: never blocked by popup blockers
        window.location.assign(checkoutUrl);
      } else {
        const link = document.createElement('a');
        link.href = checkoutUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Erro ao iniciar checkout InfinitePay. Tente novamente.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualVerifyPayment = async () => {
    if (!pendingCheckout) return;
    setCheckingPayment(true);
    try {
      if (pendingOrderSaveRef.current) {
        await pendingOrderSaveRef.current;
      }
      const res = await verifyAndUnlockInfinitePayOrder({
        orderId: pendingCheckout.order.id,
        slug: pendingCheckout.slug,
      });
      if (res.paid && res.order) {
        clearCart();
        try {
          localStorage.removeItem('papelaria_prof_pending_infinitepay');
        } catch {
          // ignore
        }
        setPaidOrder(res.order);
        showToast('Pagamento confirmado! Seus PDFs já estão liberados para download!');
      } else {
        showToast(
          'Pagamento ainda não confirmado pela InfinitePay. Conclua o pagamento na aba aberta e clique novamente.',
          'info'
        );
      }
    } catch {
      showToast('Erro ao consultar pagamento na InfinitePay.', 'error');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Screen 1: Paid & Unlocked!
  if (paidOrder) {
    const unlockedForOrder = studentMaterials.filter((m) =>
      paidOrder.materialIds?.includes(m.materialId)
    );
    return (
      <main className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 border-2 border-[#AEE3B5] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#EAF8EC] text-[#2F7D36] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#2F7D36]">
              Pagamento Aprovado · Pedido {paidOrder.orderNumber}
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3A2E45]">
              Tudo certo, {paidOrder.customerName.split(' ')[0]}! Seus PDFs estão liberados!
            </h1>
            <p className="text-sm text-[#675975] max-w-lg mx-auto leading-relaxed">
              Confirmamos seu pagamento pela InfinitePay e todas as apostilas deste pedido já estão disponíveis na sua Área do Aluno para download imediato.
            </p>
          </div>

          {unlockedForOrder.length > 0 && (
            <div className="bg-[#FFF9FB] rounded-2xl p-5 border-2 border-[#FCE1EE] text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E05899]">
                Downloads Liberados Agora
              </p>
              {unlockedForOrder.map((grant) => (
                <div
                  key={grant.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#FCE1EE]"
                >
                  <div>
                    <p className="text-sm font-bold text-[#3A2E45]">{grant.materialTitle}</p>
                    <p className="text-[11px] text-[#675975]">{grant.category}</p>
                  </div>
                  <a
                    href={grant.pdfUrl}
                    download={grant.pdfFileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl candy-btn-purple text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar PDF</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('student')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl candy-btn-pink text-sm font-bold cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Ir para Minha Área do Aluno</span>
            </button>
            {paidOrder.paymentReceiptUrl && (
              <a
                href={paidOrder.paymentReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#BEE6FB] text-sm font-bold text-[#3A2E45]"
              >
                <span>Ver Comprovante</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Screen 2: Awaiting InfinitePay Payment
  if (pendingCheckout) {
    const { order, checkoutUrl } = pendingCheckout;
    return (
      <main className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 border-2 border-[#FCE1EE] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F6FE] text-[#2D8EC4] flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#E05899]">
              Pedido {order.orderNumber} · Aguardando Pagamento InfinitePay
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3A2E45]">
              Finalize seu pagamento na InfinitePay
            </h1>
            <p className="text-sm text-[#675975] max-w-lg mx-auto leading-relaxed">
              Abrimos o checkout seguro da InfinitePay em uma nova aba. Assim que você concluir o pagamento via Pix ou Cartão, esta página reconhecerá automaticamente e liberará seus PDFs na Área do Aluno!
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
            {order.discount > 0 && (
              <div className="flex justify-between text-[#3F9145]">
                <span>Desconto</span>
                <span className="font-mono">-{formatBRL(order.discount)}</span>
              </div>
            )}
            {(order.interestAmount || 0) > 0 && (
              <div className="flex justify-between text-[#675975]">
                <span>Juros parcelamento ({order.installments}x InfinitePay)</span>
                <span className="font-mono">+{formatBRL(order.interestAmount || 0)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#FCE1EE] flex justify-between font-bold text-sm text-[#3A2E45]">
              <span>Total ({order.paymentMethod})</span>
              <span className="font-mono tabular-nums text-[#E05899]">
                {formatBRL(order.total)}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFBEA] border border-[#FAD663] text-xs font-semibold text-[#7D6A43]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Verificando confirmação da InfinitePay automaticamente...</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl candy-btn-coral text-sm font-bold"
            >
              <span>Abrir Checkout InfinitePay</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              disabled={checkingPayment}
              onClick={handleManualVerifyPayment}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl candy-btn-purple text-sm font-bold cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checkingPayment ? 'animate-spin' : ''}`} />
              <span>{checkingPayment ? 'Verificando...' : 'Já paguei! Liberar PDFs'}</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('student')}
              className="text-xs font-bold text-[#E05899] hover:underline cursor-pointer"
            >
              Acompanhar na Área do Aluno →
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
      <div className="mb-8 space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
          Checkout Seguro InfinitePay
        </p>
        <h1 className="font-display text-3xl font-bold text-[#3A2E45]">
          Finalizar Compra Digital (PDF)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Student Account Recognition or Inline Creation */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                1. Conta do Aluno (Para Liberar os PDFs)
              </h2>
              {firebaseUser && (
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-bold text-[#E05899] hover:underline cursor-pointer"
                >
                  Usar outra conta
                </button>
              )}
            </div>

            {firebaseUser ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#EAF8EC] border-2 border-[#AEE3B5] p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2F7D36] shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-[#2F7D36]">
                      Conta reconhecida automaticamente!
                    </p>
                    <p className="text-[#3A2E45]">
                      Os PDFs comprados serão liberados no painel de{' '}
                      <strong>{studentProfile?.email || firebaseUser.email}</strong>.
                    </p>
                  </div>
                </div>

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
                      Telefone / WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(17) 99999-9999"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                      E-mail da Área do Aluno
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email || firebaseUser.email || ''}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB]/70 border-2 border-[#FCE1EE] text-sm text-[#675975]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#FFFBEA] border-2 border-[#FAD663] p-4 flex items-start gap-3 text-xs text-[#3A2E45]">
                  <UserPlus className="w-5 h-5 text-[#B58209] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Não detectamos nenhuma conta conectada ainda. <strong>Crie sua conta aqui em segundos</strong> ou faça login para receber suas apostilas em PDF automaticamente na Área do Aluno após o pagamento.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={async () => {
                    setAuthError('');
                    setAuthLoading(true);
                    try {
                      await loginWithGoogle();
                    } catch (err) {
                      setAuthError(
                        err instanceof Error ? err.message : 'Erro ao entrar com Google.'
                      );
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-[#FFF9FB] border-2 border-[#BEE6FB] text-sm font-bold text-[#3A2E45] hover:bg-[#E8F6FE] transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0 7.31 0 3.25 2.69 1.28 6.61l3.66 2.84C5.8 6.86 8.65 5 12 5z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                    <path fill="#FBBC05" d="M4.94 14.55c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.53H1.28C.47 9.14 0 10.97 0 12.46s.47 3.32 1.28 4.93l3.66-2.84z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.35 0-6.2-1.86-7.06-4.45H1.28v2.84C3.25 21.31 7.31 24 12 24z" />
                  </svg>
                  <span>Entrar / Criar Conta com Google (1 Clique)</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#FFF9FB] rounded-2xl border-2 border-[#FCE1EE]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError('');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      authTab === 'register'
                        ? 'bg-[#F67BB4] text-white shadow-xs'
                        : 'text-[#675975]'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Criar Conta Nova</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      authTab === 'login'
                        ? 'bg-[#F67BB4] text-white shadow-xs'
                        : 'text-[#675975]'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Já Tenho Conta</span>
                  </button>
                </div>

                {authError && (
                  <div className="p-3.5 rounded-2xl bg-[#FFF0F5] border-2 border-[#F8BBD7] text-xs text-[#A82765] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleCheckoutAuthSubmit} className="space-y-3">
                  {authTab === 'register' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                          Nome completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Seu nome completo"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                          WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={authPhone}
                          onChange={(e) => setAuthPhone(maskPhone(e.target.value))}
                          placeholder="(17) 99999-9999"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={authTab === 'register' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                        Senha *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                      />
                    </div>
                    {authTab === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                          Confirmar senha *
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={authConfirm}
                          onChange={(e) => setAuthConfirm(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 px-5 rounded-2xl candy-btn-purple text-sm font-bold cursor-pointer disabled:opacity-50"
                  >
                    {authLoading
                      ? 'Autenticando...'
                      : authTab === 'register'
                      ? 'Criar Conta Agora e Liberar Checkout'
                      : 'Entrar na Minha Conta'}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* STEP 2: InfinitePay Payment Method & Installments */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                2. Pagamento via InfinitePay
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8EC] border border-[#AEE3B5] text-[11px] font-bold text-[#2F7D36]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ambiente Criptografado</span>
              </span>
            </div>

            {/* Pix vs Credit Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('pix');
                  setWantsInstallments(false);
                  setSelectedInstallments(1);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                  paymentType === 'pix'
                    ? 'bg-[#EAF8EC] border-[#7ED082] shadow-xs'
                    : 'bg-[#FFF9FB] border-[#FCE1EE] hover:border-[#F8BBD7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-display text-base font-bold text-[#3A2E45]">
                    <QrCode className="w-5 h-5 text-[#3F9145]" />
                    <span>Pix</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#7ED082] text-white text-[10px] font-bold">
                    0% Juros
                  </span>
                </div>
                <p className="text-xs text-[#675975]">
                  À vista: <strong>{formatBRL(baseTotal)}</strong> · Aprovação instantânea.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('credit_card')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                  paymentType === 'credit_card'
                    ? 'bg-[#FCE6F1] border-[#F267A8] shadow-xs'
                    : 'bg-[#FFF9FB] border-[#FCE1EE] hover:border-[#F8BBD7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-display text-base font-bold text-[#3A2E45]">
                    <CreditCard className="w-5 h-5 text-[#E05899]" />
                    <span>Cartão de Crédito</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#9B82E6] text-white text-[10px] font-bold">
                    Até 3x s/ juros
                  </span>
                </div>
                <p className="text-xs text-[#675975]">
                  Parcele em até 12x (4x a 12x com juros InfinitePay).
                </p>
              </button>
            </div>

            {/* Installment Choice when Credit Card is selected */}
            {paymentType === 'credit_card' && (
              <div className="p-5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#3A2E45]">
                    Deseja dividir (parcelar) o valor no cartão?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWantsInstallments(false);
                        setSelectedInstallments(1);
                      }}
                      className={`py-2.5 px-4 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                        !wantsInstallments
                          ? 'bg-white border-[#F267A8] text-[#3A2E45] shadow-xs'
                          : 'bg-white/60 border-[#FCE1EE] text-[#675975]'
                      }`}
                    >
                      Não, pagar à vista (1x sem juros)
                    </button>
                    <button
                      type="button"
                      disabled={allowedInstallments.length <= 1}
                      onClick={() => {
                        setWantsInstallments(true);
                        if (selectedInstallments <= 1 && allowedInstallments.length > 1) {
                          setSelectedInstallments(2);
                        }
                      }}
                      className={`py-2.5 px-4 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all disabled:opacity-50 ${
                        wantsInstallments
                          ? 'bg-white border-[#9B82E6] text-[#3A2E45] shadow-xs'
                          : 'bg-white/60 border-[#FCE1EE] text-[#675975]'
                      }`}
                    >
                      Sim, desejo parcelar ({allowedInstallments.length > 1 ? `até ${allowedInstallments[allowedInstallments.length - 1].installments}x` : 'indisponível < R$10'})
                    </button>
                  </div>
                </div>

                {wantsInstallments && allowedInstallments.length > 1 ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#3A2E45]">
                        Escolha a quantidade de parcelas permitidas:
                      </label>
                      <span className="text-[11px] text-[#675975]">
                        Até 3x sem juros · Acima de 3x juros InfinitePay
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {allowedInstallments
                        .filter((opt) => opt.installments >= 2)
                        .map((opt) => {
                          const isSelected = effectiveInstallments === opt.installments;
                          return (
                            <button
                              key={opt.installments}
                              type="button"
                              onClick={() => setSelectedInstallments(opt.installments)}
                              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-[#FCE6F1] border-[#F267A8] shadow-xs'
                                  : 'bg-white border-[#FCE1EE] hover:border-[#F8BBD7]'
                              }`}
                            >
                              <div>
                                <p className="text-xs font-bold text-[#3A2E45]">
                                  {opt.installments}x de {formatBRL(opt.installmentValue)}
                                </p>
                                <p className="text-[11px] text-[#675975]">
                                  Total: {formatBRL(opt.totalWithInterest)}
                                </p>
                              </div>
                              {opt.hasInterest ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#FFFBEA] border border-[#FAD663] text-[10px] font-bold text-[#B58209] shrink-0">
                                  +{opt.interestRatePercent.toFixed(2).replace('.', ',')}% juros
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-[#EAF8EC] border border-[#AEE3B5] text-[10px] font-bold text-[#2F7D36] shrink-0">
                                  Sem juros
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#675975]">
                    {allowedInstallments.length <= 1
                      ? 'Parcelamento disponível para compras a partir de R$ 10,00 (parcela mínima de R$ 5,00).'
                      : `Pagamento selecionado em 1x de ${formatBRL(baseTotal)} sem juros no cartão de crédito.`}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-[#E8F6FE] border border-[#BEE6FB] p-4 flex items-start gap-3 text-xs text-[#3A2E45]">
              <FileText className="w-4 h-4 text-[#2D8EC4] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Liberação Automática na Área do Aluno:</strong> ao pagar via InfinitePay, os arquivos <strong>PDF</strong> deste pedido ficam imediatamente liberados no seu painel para baixar e imprimir quantas vezes quiser!
              </p>
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
              <span className="font-mono tabular-nums font-semibold">
                {formatBRL(cartSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#675975]">
              <span>Entrega</span>
              <span className="text-xs font-bold text-[#3F9145]">
                Digital em PDF (Área do Aluno)
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#3F9145] font-semibold">
                <span>Desconto ({appliedCoupon?.code})</span>
                <span className="font-mono tabular-nums">-{formatBRL(discount)}</span>
              </div>
            )}
            {paymentType === 'credit_card' && activeInstallmentCalc.interestAmount > 0 && (
              <div className="flex justify-between text-[#B58209] text-xs font-semibold">
                <span>
                  Juros InfinitePay ({effectiveInstallments}x ·{' '}
                  {activeInstallmentCalc.interestRatePercent.toFixed(2).replace('.', ',')}%)
                </span>
                <span className="font-mono tabular-nums">
                  +{formatBRL(activeInstallmentCalc.interestAmount)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-[#FCE1EE] flex justify-between items-baseline">
              <span className="font-display text-lg font-bold text-[#3A2E45]">Total</span>
              <div className="text-right">
                <span className="font-mono tabular-nums text-2xl font-bold text-[#E05899] block">
                  {formatBRL(finalTotal)}
                </span>
                {paymentType === 'credit_card' && effectiveInstallments > 1 && (
                  <span className="text-[11px] font-semibold text-[#675975]">
                    {effectiveInstallments}x de{' '}
                    {formatBRL(activeInstallmentCalc.installmentValue)}{' '}
                    {activeInstallmentCalc.hasInterest ? 'c/ juros' : 'sem juros'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {firebaseUser &&
          isInIframe &&
          preparedCheckout &&
          preparedCheckout.signature === checkoutSignature ? (
            <a
              href={preparedCheckout.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePreparedAnchorClick}
              className="w-full py-4 px-6 rounded-2xl candy-btn-coral text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Pagar {formatBRL(finalTotal)} na InfinitePay</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled={submitting || (Boolean(firebaseUser) && preparingCheckout)}
              onClick={handleStartInfinitePayCheckout}
              className="w-full py-4 px-6 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {submitting || (Boolean(firebaseUser) && preparingCheckout) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>
                {submitting
                  ? 'Abrindo Checkout InfinitePay...'
                  : Boolean(firebaseUser) && preparingCheckout
                  ? 'Preparando Checkout InfinitePay...'
                  : `Pagar ${formatBRL(finalTotal)} na InfinitePay`}
              </span>
            </button>
          )}

          {!firebaseUser && (
            <p className="text-[11px] text-center text-[#E05899] font-semibold">
              Crie ou acesse sua conta no Passo 1 acima para liberar o pagamento.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
