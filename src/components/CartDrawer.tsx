import React from 'react';
import { motion } from 'motion/react';
import { FileText, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBRL } from '../lib/utils';
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
  } = useStore();

  if (!cartOpen) return null;

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
            <span>Entrega 100% digital em PDF na Área do Aluno, sem frete.</span>
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
            cart.map((item) => (
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
            ))
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
              className="w-full py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </motion.aside>
    </div>
  );
}
