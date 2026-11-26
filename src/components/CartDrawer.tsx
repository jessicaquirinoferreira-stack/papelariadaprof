import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LogIn,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBRL, maskPhone } from '../lib/utils';
import { SafeImage } from './SafeImage';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    navigate,
    firebaseUser,
    studentProfile,
    loginWithGoogle,
    loginStudentWithEmail,
    registerStudent,
  } = useStore();

  const [showAuthBox, setShowAuthBox] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (!cartOpen) return null;

  const handleQuickAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await loginStudentWithEmail(email, password);
      } else {
        if (fullName.trim().length < 2) {
          throw new Error('Informe seu nome completo.');
        }
        if (phone.replace(/\D/g, '').length < 10) {
          throw new Error('Informe seu WhatsApp com DDD.');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        await registerStudent({ fullName, email, phone, password });
      }
      setShowAuthBox(false);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já tem conta! Clique em "Já tenho conta" para entrar.');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setAuthError('E-mail ou senha inválidos.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Erro ao autenticar.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3A2E45]/45 backdrop-blur-sm flex justify-end"
      onClick={() => setCartOpen(false)}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l-2 border-[#FCE1EE]"
        onClick={(e) => e.stopPropagation()}
        aria-label="Sacola de compras"
      >
        <div className="px-6 py-5 bg-[#F67BB4] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-display text-xl font-semibold">Sua Sacola</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Fechar sacola"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-3 bg-[#BEE6FB]/50 text-xs font-medium text-[#3A2E45] flex items-center gap-2 border-b border-[#FCE1EE]">
            <FileText className="w-4 h-4 text-[#E05899] shrink-0" />
            <span>Entrega 100% digital em PDF na Área do Aluno após pagamento.</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[#FFF9FB]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FCE6F1] flex items-center justify-center text-[#E05899]">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold text-[#3A2E45]">Sua sacola está vazia</p>
                <p className="text-sm text-[#675975]">
                  Explore nossas apostilas em PDF para Alfabetização, Português e Matemática (1º ao 5º ano) e materiais para professoras.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('catalog');
                }}
                className="px-6 py-3 rounded-2xl candy-btn-yellow text-sm font-bold"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-4 p-3.5 rounded-2xl bg-white border-2 border-[#FCE1EE] shadow-xs"
                >
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    fallbackTitle={item.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-[#FFF9FB]"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[#E05899]">
                        {item.category} · PDF
                      </p>
                      <h3 className="text-sm font-semibold text-[#3A2E45] line-clamp-1">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="inline-flex items-center gap-1 bg-[#FFF9FB] rounded-xl border border-[#FCE1EE] p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.type, item.quantity - 1)}
                          className="p-1.5 text-[#3A2E45] hover:text-[#E05899]"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono tabular-nums text-xs px-2 text-[#3A2E45]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.type, item.quantity + 1)}
                          className="p-1.5 text-[#3A2E45] hover:text-[#E05899]"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-sm font-bold text-[#3A2E45]">
                          {formatBRL(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.type)}
                          className="p-1.5 text-[#675975] hover:text-[#E05899] transition-colors"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Student Account Recognition Card right inside Cart */}
              {firebaseUser ? (
                <div className="p-4 rounded-2xl bg-[#EAF8EC] border-2 border-[#AEE3B5] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2F7D36]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Conta do Aluno Reconhecida!</span>
                  </div>
                  <p className="text-xs text-[#3A2E45] font-semibold">
                    {studentProfile?.fullName || firebaseUser.displayName || 'Aluna'} ·{' '}
                    <span className="font-normal text-[#675975]">{firebaseUser.email}</span>
                  </p>
                  <p className="text-[11px] text-[#4E6B52]">
                    Ao finalizar o pagamento, seus PDFs serão liberados automaticamente nesta conta.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border-2 border-[#BEE6FB] space-y-3 shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#3A2E45] flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-[#2D8EC4]" />
                      <span>Identificação do Aluno para Receber os PDFs</span>
                    </p>
                    <p className="text-[11px] text-[#675975] leading-relaxed">
                      Ainda não identificamos uma conta conectada. Entre ou crie sua conta rápida por aqui para liberar seus PDFs no painel após o pagamento.
                    </p>
                  </div>

                  {!showAuthBox ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setShowAuthBox(true);
                          setAuthError('');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl candy-btn-pink text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Criar Conta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthBox(true);
                          setAuthError('');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs font-bold text-[#3A2E45] hover:bg-[#FCE6F1] cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5 text-[#E05899]" />
                        <span>Já tenho conta</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE]">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('register');
                            setAuthError('');
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            authMode === 'register'
                              ? 'bg-[#F67BB4] text-white'
                              : 'text-[#675975]'
                          }`}
                        >
                          Criar Conta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError('');
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            authMode === 'login'
                              ? 'bg-[#F67BB4] text-white'
                              : 'text-[#675975]'
                          }`}
                        >
                          Já tenho conta
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={async () => {
                          setAuthError('');
                          setAuthLoading(true);
                          try {
                            await loginWithGoogle();
                            setShowAuthBox(false);
                          } catch (err) {
                            setAuthError(
                              err instanceof Error ? err.message : 'Erro ao entrar com Google.'
                            );
                          } finally {
                            setAuthLoading(false);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#FFF9FB] border-2 border-[#BEE6FB] text-xs font-bold text-[#3A2E45] hover:bg-[#E8F6FE] cursor-pointer"
                      >
                        Entrar rápido com Google
                      </button>

                      {authError && (
                        <div className="p-2.5 rounded-xl bg-[#FFF0F5] border border-[#F8BBD7] text-[11px] text-[#A82765] flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <form onSubmit={handleQuickAuth} className="space-y-2">
                        {authMode === 'register' && (
                          <>
                            <input
                              type="text"
                              required
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Seu nome completo"
                              className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs text-[#3A2E45]"
                            />
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(maskPhone(e.target.value))}
                              placeholder="WhatsApp com DDD"
                              className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs text-[#3A2E45]"
                            />
                          </>
                        )}
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Seu e-mail"
                          className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs text-[#3A2E45]"
                        />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={authMode === 'register' ? 'Crie uma senha (mín. 6 caracteres)' : 'Sua senha'}
                          className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs text-[#3A2E45]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="flex-1 py-2 rounded-xl candy-btn-purple text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {authLoading
                              ? 'Aguarde...'
                              : authMode === 'register'
                              ? 'Criar Conta e Continuar'
                              : 'Entrar na Conta'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAuthBox(false)}
                            className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-semibold text-[#675975] cursor-pointer"
                          >
                            Fechar
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t-2 border-[#FCE1EE] bg-white space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#675975]">Subtotal (Entrega Digital PDF)</span>
              <span className="font-mono tabular-nums text-lg font-bold text-[#3A2E45]">
                {formatBRL(cartSubtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                navigate('checkout');
              }}
              className="w-full py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold cursor-pointer"
            >
              Ir para Checkout InfinitePay
            </button>
          </div>
        )}
      </motion.aside>
    </div>
  );
}
