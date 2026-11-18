import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../lib/commerce';
import type { CartItem, StoreSettings } from '../types/store';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  settings: StoreSettings;
  onClose: () => void;
  onUpdateQuantity: (productId: string, variantLabel: string | undefined, delta: number) => void;
  onRemoveItem: (productId: string, variantLabel?: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  settings,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const threshold = settings.freeShippingThreshold || 199;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Sacola de compras"
    >
      <div
        className="fixed inset-0 bg-[#3D2A24]/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-[#EFE4DE] shadow-2xl">
        <div className="px-6 py-5 border-b border-[#EFE4DE] flex items-center justify-between bg-[#FDF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FDEEF4] text-[#6F4E42] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">
              Sua Sacola
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sacola"
            className="p-2 rounded-full text-[#725B53] hover:text-[#3D2A24] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length > 0 && threshold > 0 && (
          <div className="px-6 py-3.5 bg-[#FDEEF4]/70 border-b border-[#F6DCE6] space-y-2">
            <p className="text-xs text-[#6F4E42]">
              {remaining === 0 ? (
                <span className="font-bold text-[#15803D]">
                  Parabéns! Você desbloqueou Frete Grátis via PAC.
                </span>
              ) : (
                <>
                  Faltam{' '}
                  <strong className="text-[#3D2A24] tabular-nums">
                    {formatCurrency(remaining)}
                  </strong>{' '}
                  para Frete Grátis via PAC.
                </>
              )}
            </p>
            <div className="h-2 rounded-full bg-white overflow-hidden border border-[#F6DCE6]">
              <div
                className="h-full bg-[#E89EB8] transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="w-16 h-16 rounded-full bg-[#FDEEF4] text-[#B84A70] flex items-center justify-center">
                <ShoppingBag className="w-7 h-7" aria-hidden="true" />
              </div>
              <p className="font-display text-base font-bold text-[#3D2A24]">
                Sua sacola está vazia
              </p>
              <p className="text-sm text-[#725B53] max-w-xs">
                Adicione recursos pedagógicos, baralhos ou planners para começar seu pedido.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#FDEEF4] text-[#6F4E42] text-sm font-bold hover:bg-[#FCE2EC] transition-colors"
              >
                Continuar explorando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantLabel || 'default'}`}
                className="flex gap-4 pb-4 border-b border-[#FAF3EE]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover bg-[#FAF3EE] border border-[#EFE4DE] shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#3D2A24] leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId, item.variantLabel)}
                        aria-label={`Remover ${item.name} da sacola`}
                        className="p-1 text-[#8C756D] hover:text-[#DC2626] shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.variantLabel && (
                      <p className="text-xs text-[#725B53] mt-0.5">{item.variantLabel}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#EFE4DE] rounded-xl bg-[#FDF8F5]">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.productId, item.variantLabel, -1)}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="px-2.5 py-1 text-[#3D2A24] hover:text-[#6F4E42]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold tabular-nums text-[#3D2A24]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.productId, item.variantLabel, 1)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="px-2.5 py-1 text-[#3D2A24] hover:text-[#6F4E42]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#6F4E42] tabular-nums">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#EFE4DE] bg-[#FDF8F5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#725B53]">Subtotal dos itens</span>
              <span className="font-display text-xl font-bold text-[#6F4E42] tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors soft-card-shadow"
            >
              <span>Finalizar pedido</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
