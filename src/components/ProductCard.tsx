import React, { useState } from 'react';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { formatCurrency, getEffectivePrice } from '../lib/commerce';
import type { Product } from '../types/store';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onOpenProduct: (slug: string) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  onOpenProduct,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
}: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const effectivePrice = getEffectivePrice(product);
  const hasPromo = effectivePrice < product.price;
  const installment = effectivePrice / 3;

  return (
    <article className="group bg-white rounded-3xl overflow-hidden flex flex-col border border-[#EFE4DE]/90 soft-card-shadow soft-card-shadow-hover transition-all duration-300 hover:-translate-y-1">
      {/* Product Photo with Rounded Top & Soft Hover Scale */}
      <div className="relative aspect-[4/3] bg-[#FDF8F5] overflow-hidden rounded-t-3xl">
        {!imgLoaded && <div className="absolute inset-0 bg-[#FAF3EE] animate-pulse" />}
        <button
          type="button"
          onClick={() => onOpenProduct(product.slug)}
          className="w-full h-full block text-left focus-visible:outline-2 focus-visible:outline-[#6F4E42]"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </button>

        {/* Top Left Pastel Category / Promo Tag */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          {hasPromo ? (
            <span className="px-2.5 py-1 rounded-full bg-[#FDEEF4] text-[#8C4B68] text-[11px] font-bold border border-[#F6DCE6]">
              Promoção
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-white/92 text-[#6F4E42] text-[11px] font-semibold border border-[#EFE4DE]">
              {product.category}
            </span>
          )}
        </div>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={isWishlisted ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-xs ${
            isWishlisted
              ? 'bg-[#FDEEF4] text-[#B84A70]'
              : 'bg-white/92 text-[#725B53] hover:text-[#B84A70]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#725B53]">
            <span className="px-2 py-0.5 rounded-full bg-[#FEF8E8] text-[#8B6215]">
              {product.recommendedAge}
            </span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F4EFFA] text-[#6B4C8C]">
                Últimas unidades
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenProduct(product.slug)}
            className="text-left block w-full"
          >
            <h3 className="font-display text-base sm:text-[17px] font-bold text-[#3D2A24] leading-snug group-hover:text-[#6F4E42] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </button>

          <p className="text-xs text-[#725B53] line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        <div className="space-y-3.5 pt-2 border-t border-[#FAF3EE]">
          <div>
            {hasPromo && (
              <span className="text-xs text-[#8C756D] line-through tabular-nums block">
                {formatCurrency(product.price)}
              </span>
            )}
            <p className="font-display text-xl font-bold text-[#6F4E42] tabular-nums">
              {formatCurrency(effectivePrice)}
            </p>
            <p className="text-[11px] text-[#725B53] tabular-nums">
              em até 3x de {formatCurrency(installment)} sem juros
            </p>
          </div>

          {/* Primary Brown "COMPRAR" + Pastel Eye Quick View */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => onAddToCart(product)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold tracking-wide uppercase hover:bg-[#573B30] disabled:bg-[#EFE4DE] disabled:text-[#725B53] transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{product.stock > 0 ? 'Comprar' : 'Esgotado'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onQuickView ? onQuickView(product) : onOpenProduct(product.slug)
              }
              aria-label={`Visualização rápida de ${product.name}`}
              title="Visualização rápida"
              className="w-10 h-10 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] inline-flex items-center justify-center hover:bg-[#D5E9FA] transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
