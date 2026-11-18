import React, { useState } from 'react';
import { ArrowRight, Heart, ShoppingBag, X } from 'lucide-react';
import { formatCurrency, getEffectivePrice } from '../lib/commerce';
import type { Product } from '../types/store';

interface QuickViewModalProps {
  product: Product | null;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variantLabel?: string) => void;
  onToggleWishlist: (productId: string) => void;
  onGoToFullPage: (slug: string) => void;
}

export function QuickViewModal({
  product,
  isWishlisted,
  onClose,
  onAddToCart,
  onToggleWishlist,
  onGoToFullPage,
}: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    product?.variants?.[0]?.label
  );

  if (!product) return null;

  const baseEffective = getEffectivePrice(product);
  const activeVariantLabel =
    selectedVariant && product.variants?.some((v) => v.label === selectedVariant)
      ? selectedVariant
      : product.variants?.[0]?.label;
  const variantObj = product.variants?.find((v) => v.label === activeVariantLabel);
  const unitPrice = Math.max(0, baseEffective + (variantObj?.priceDelta || 0));
  const hasPromo = baseEffective < product.price;
  const installment = unitPrice / 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D2A24]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização rápida de ${product.name}`}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden soft-card-shadow border border-[#EFE4DE] relative grid grid-cols-1 sm:grid-cols-12">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar visualização rápida"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#FDF8F5] text-[#3D2A24] flex items-center justify-center hover:bg-[#FDEEF4] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="sm:col-span-6 bg-[#FDF8F5] aspect-[4/3] sm:aspect-auto">
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="sm:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FDEEF4] text-[#8C4B68] text-[11px] font-semibold">
                {product.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F4EFFA] text-[#6B4C8C] text-[11px] font-semibold">
                {product.recommendedAge}
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-[#3D2A24] leading-snug pr-6">
              {product.name}
            </h2>

            <p className="text-xs sm:text-sm text-[#725B53] leading-relaxed">
              {product.shortDescription}
            </p>

            <div className="pt-1">
              {hasPromo && (
                <span className="text-xs text-[#8C756D] line-through tabular-nums block">
                  {formatCurrency(product.price + (variantObj?.priceDelta || 0))}
                </span>
              )}
              <p className="font-display text-2xl font-bold text-[#6F4E42] tabular-nums">
                {formatCurrency(unitPrice)}
              </p>
              <p className="text-[11px] text-[#725B53] tabular-nums">
                ou 3x de {formatCurrency(installment)} sem juros
              </p>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="block text-[11px] font-semibold text-[#3D2A24]">
                  Opção:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => {
                    const active = activeVariantLabel === v.label;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v.label)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                          active
                            ? 'bg-[#FDEEF4] border-[#E89EB8] text-[#3D2A24]'
                            : 'bg-[#FDF8F5] border-[#EFE4DE] text-[#725B53] hover:border-[#6F4E42]'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => {
                  onAddToCart(product, 1, activeVariantLabel);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6F4E42] text-white text-xs font-bold tracking-wide uppercase hover:bg-[#573B30] disabled:bg-[#EFE4DE] disabled:text-[#725B53] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>{product.stock > 0 ? 'Comprar' : 'Esgotado'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remover dos favoritos' : 'Favoritar'}
                className={`p-3 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'bg-[#FDEEF4] border-[#E89EB8] text-[#B84A70]'
                    : 'bg-[#FDF8F5] border-[#EFE4DE] text-[#725B53] hover:text-[#6F4E42]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToFullPage(product.slug);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6F4E42] hover:underline"
            >
              <span>Ver página completa do recurso</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
