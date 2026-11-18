import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import {
  calculateShippingOptions,
  formatCep,
  formatCurrency,
  getEffectivePrice,
} from '../lib/commerce';
import type { AppView, Product, ShippingOption, StoreSettings } from '../types/store';

interface ProductDetailPageProps {
  product: Product | undefined;
  settings: StoreSettings;
  isWishlisted: boolean;
  onNavigate: (view: AppView) => void;
  onAddToCart: (product: Product, quantity: number, variantLabel?: string) => void;
  onToggleWishlist: (productId: string) => void;
}

const RESOURCE_LABEL: Record<Product['resourceType'], string> = {
  pedagogico: 'Recurso Pedagógico',
  terapeutico: 'Recurso Terapêutico',
  ambos: 'Pedagógico e Terapêutico',
  papelaria: 'Papelaria Afetiva',
};

export function ProductDetailPage({
  product,
  settings,
  isWishlisted,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
}: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    product?.variants?.[0]?.label
  );
  const [cepInput, setCepInput] = useState('');
  const [shippingQuote, setShippingQuote] = useState<ShippingOption[]>([]);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setSelectedVariant(product?.variants?.[0]?.label);
  }, [product?.id]);

  // Dynamic Schema.org Product JSON-LD
  useEffect(() => {
    if (!product) return;
    const scriptId = 'product-jsonld-schema';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription,
      image: product.images,
      category: product.category,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: getEffectivePrice(product).toFixed(2),
        availability:
          product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
    });
    return () => {
      scriptEl?.remove();
    };
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#3D2A24]">
          Produto não encontrado
        </h1>
        <p className="text-sm text-[#725B53]">
          Este recurso pode ter sido atualizado ou movido para outra categoria.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ page: 'catalog' })}
          className="px-6 py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-semibold hover:bg-[#573B30]"
        >
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const baseEffective = getEffectivePrice(product);
  const variantObj = product.variants?.find((v) => v.label === selectedVariant);
  const unitPrice = Math.max(0, baseEffective + (variantObj?.priceDelta || 0));
  const hasPromo = baseEffective < product.price;
  const installment = unitPrice / 3;

  const handleSimulateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const opts = calculateShippingOptions(
      cepInput,
      (product.weightGrams || 400) * quantity,
      unitPrice * quantity,
      settings.freeShippingThreshold
    );
    setShippingQuote(opts);
  };

  return (
    <div className="bg-[#FDF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
          type="button"
          onClick={() => onNavigate({ page: 'catalog' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EFE4DE] text-xs font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Voltar ao catálogo</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Media Gallery Left */}
          <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-4">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-[#EFE4DE] soft-card-shadow">
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`Ver imagem ${idx + 1} de ${product.name}`}
                    className={`w-20 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === idx
                        ? 'border-[#6F4E42] soft-card-shadow'
                        : 'border-[#EFE4DE] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} miniatura ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {product.videoUrl && (
              <div className="rounded-3xl overflow-hidden border border-[#EFE4DE] bg-black soft-card-shadow">
                <video
                  src={product.videoUrl}
                  controls
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}
          </div>

          {/* Sticky Purchase Module Right */}
          <div className="lg:col-span-6 bg-white border border-[#EFE4DE] rounded-3xl p-6 sm:p-8 soft-card-shadow space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-[#FDEEF4] text-[#8C4B68] font-bold">
                  {product.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F4EFFA] text-[#6B4C8C] font-semibold">
                  {RESOURCE_LABEL[product.resourceType]}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#FEF8E8] text-[#8B6215] font-semibold">
                  {product.recommendedAge}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24] leading-tight">
                {product.name}
              </h1>

              <p className="text-sm text-[#725B53] leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            <div className="py-4 border-y border-[#FAF3EE] flex items-baseline justify-between gap-4">
              <div>
                {hasPromo && (
                  <p className="text-sm text-[#8C756D] line-through tabular-nums">
                    {formatCurrency(product.price + (variantObj?.priceDelta || 0))}
                  </p>
                )}
                <p className="font-display text-3xl font-bold text-[#6F4E42] tabular-nums">
                  {formatCurrency(unitPrice)}
                </p>
                <p className="text-xs text-[#725B53] tabular-nums mt-0.5">
                  em até 3x de {formatCurrency(installment)} sem juros
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  product.stock > 0
                    ? 'bg-[#ECFDF3] text-[#15803D]'
                    : 'bg-[#FEF2F2] text-[#DC2626]'
                }`}
              >
                {product.stock > 0
                  ? `${product.stock} disponíveis`
                  : 'Temporariamente esgotado'}
              </span>
            </div>

            {/* Variations */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#3D2A24]">
                  Escolha a opção:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const active = selectedVariant === variant.label;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant.label)}
                        className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#FDEEF4] border-[#E89EB8] text-[#3D2A24]'
                            : 'bg-[#FDF8F5] border-[#EFE4DE] text-[#725B53] hover:border-[#6F4E42]'
                        }`}
                      >
                        {variant.label}
                        {variant.priceDelta
                          ? ` (+${formatCurrency(variant.priceDelta)})`
                          : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Primary Buy CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border border-[#EFE4DE] rounded-xl bg-[#FDF8F5]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="p-3 text-[#3D2A24] hover:text-[#6F4E42]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums text-[#3D2A24]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  aria-label="Aumentar quantidade"
                  className="p-3 text-[#3D2A24] hover:text-[#6F4E42]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => onAddToCart(product, quantity, selectedVariant)}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#6F4E42] text-white text-xs sm:text-sm font-bold uppercase tracking-wide hover:bg-[#573B30] disabled:bg-[#EFE4DE] disabled:text-[#725B53] transition-colors soft-card-shadow"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>Comprar agora</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                className={`p-3.5 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'bg-[#FDEEF4] border-[#E89EB8] text-[#B84A70]'
                    : 'bg-[#E6F2FC] border-[#CEE5F8] text-[#3B6E9C] hover:bg-[#D5E9FA]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Inline CEP Shipping Estimator */}
            <form
              onSubmit={handleSimulateShipping}
              className="p-4 rounded-2xl bg-[#FDF8F5] border border-[#EFE4DE] space-y-3"
            >
              <label htmlFor="pdp-cep" className="flex items-center gap-2 text-xs font-bold text-[#3D2A24]">
                <Truck className="w-4 h-4 text-[#6F4E42]" aria-hidden="true" />
                <span>Simular frete e prazo (Correios ou Retirada SJRP)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="pdp-cep"
                  type="text"
                  inputMode="numeric"
                  value={cepInput}
                  onChange={(e) => setCepInput(formatCep(e.target.value))}
                  placeholder="15015-000"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#EFE4DE] bg-white text-sm tabular-nums focus:outline-none focus:border-[#E89EB8]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] text-xs font-bold hover:bg-[#D5E9FA] transition-colors"
                >
                  Calcular
                </button>
              </div>
              {shippingQuote.length > 0 && (
                <ul className="space-y-1.5 text-xs text-[#725B53] pt-1">
                  {shippingQuote.map((opt) => (
                    <li
                      key={opt.code}
                      className="flex items-center justify-between py-1.5 border-b border-[#EFE4DE] last:border-0"
                    >
                      <span>
                        <strong className="text-[#3D2A24]">{opt.name}</strong> · {opt.estimatedDays}
                      </span>
                      <span className="font-bold text-[#6F4E42] tabular-nums">
                        {opt.price === 0 ? 'Grátis' : formatCurrency(opt.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            {/* Rich Product Description */}
            <div className="pt-2 space-y-3">
              <h2 className="font-display text-base font-bold text-[#3D2A24]">
                Detalhes pedagógicos e composição
              </h2>
              <div
                className="prose prose-sm max-w-none text-[#725B53] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p]:mb-3 [&_strong]:text-[#3D2A24]"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-[#FAF3EE] text-[#725B53] text-[11px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
