import React, { useEffect, useMemo, useState } from 'react';
import { Heart, RotateCcw, Search } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { filterAndSortProducts, formatCurrency } from '../lib/commerce';
import type { AppView, CatalogFilters, Product, ResourceType, SortOption } from '../types/store';

interface CatalogPageProps {
  products: Product[];
  loading: boolean;
  wishlist: string[];
  initialCategory?: string;
  initialResourceType?: ResourceType | 'todos';
  initialSearch?: string;
  initialWishlistOnly?: boolean;
  onNavigate: (view: AppView) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

const RESOURCE_TABS: { value: ResourceType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pedagogico', label: 'Pedagógico' },
  { value: 'terapeutico', label: 'Terapêutico' },
  { value: 'ambos', label: 'Ambos' },
  { value: 'papelaria', label: 'Papelaria' },
];

export function CatalogPage({
  products,
  loading,
  wishlist,
  initialCategory = 'Todas',
  initialResourceType = 'todos',
  initialSearch = '',
  initialWishlistOnly = false,
  onNavigate,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
}: CatalogPageProps) {
  const [filters, setFilters] = useState<CatalogFilters>({
    search: initialSearch,
    category: initialCategory,
    resourceType: initialResourceType,
    recommendedAge: 'Todas',
    maxPrice: 300,
    promoOnly: false,
    wishlistOnly: initialWishlistOnly,
    sortBy: 'relevancia',
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: initialSearch ?? prev.search,
      category: initialCategory || 'Todas',
      resourceType: initialResourceType || 'todos',
      wishlistOnly: Boolean(initialWishlistOnly),
    }));
  }, [initialCategory, initialResourceType, initialSearch, initialWishlistOnly]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.filter((p) => p.active).map((p) => p.category)));
    return ['Todas', ...unique];
  }, [products]);

  const ages = useMemo(() => {
    const unique = Array.from(
      new Set(products.filter((p) => p.active).map((p) => p.recommendedAge))
    );
    return ['Todas', ...unique];
  }, [products]);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters, wishlist),
    [products, filters, wishlist]
  );

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'Todas',
      resourceType: 'todos',
      recommendedAge: 'Todas',
      maxPrice: 300,
      promoOnly: false,
      wishlistOnly: false,
      sortBy: 'relevancia',
    });
  };

  return (
    <div className="bg-[#FDF8F5] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-script text-2xl text-[#6F4E42] leading-none">
              Vitrine Completa
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3D2A24] mt-1">
              Catálogo de Recursos
            </h1>
            <p className="text-sm text-[#725B53] mt-1.5">
              Materiais prontos para uso escolar, clínico e familiar · Escolha por faixa etária, categoria ou objetivo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, wishlistOnly: !f.wishlistOnly }))}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filters.wishlistOnly
                  ? 'bg-[#FDEEF4] border-[#E89EB8] text-[#8C4B68]'
                  : 'bg-white border-[#EFE4DE] text-[#6F4E42] hover:bg-[#FDEEF4]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${filters.wishlistOnly ? 'fill-current' : ''}`} />
              <span>Favoritos ({wishlist.length})</span>
            </button>

            <span className="px-3 py-1.5 rounded-full bg-white border border-[#EFE4DE] text-xs font-semibold text-[#725B53] tabular-nums whitespace-nowrap">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'recurso' : 'recursos'}
            </span>
          </div>
        </div>

        {/* Soft Pastel Filter Bar */}
        <div className="bg-white border border-[#EFE4DE] rounded-3xl p-5 sm:p-6 soft-card-shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 relative">
              <label htmlFor="catalog-search" className="sr-only">
                Buscar produto no catálogo
              </label>
              <Search
                className="w-4 h-4 text-[#725B53] absolute left-4 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="catalog-search"
                type="search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Buscar por sílabas, emoções, planner, TEA..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] placeholder:text-[#8C756D] focus:outline-none focus:border-[#E89EB8] focus:bg-white transition-colors"
              />
            </div>

            <div className="md:col-span-7 flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Filtrar por tipo de recurso"
                className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FDEEF4] rounded-2xl border border-[#F6DCE6]"
              >
                {RESOURCE_TABS.map((tab) => {
                  const active = filters.resourceType === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, resourceType: tab.value }))}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                        active
                          ? 'bg-[#6F4E42] text-white shadow-xs'
                          : 'text-[#6F4E42] hover:bg-white/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-[#FAF3EE]">
            <div>
              <label htmlFor="filter-category" className="block text-xs font-semibold text-[#725B53] mb-1.5">
                Categoria
              </label>
              <select
                id="filter-category"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-age" className="block text-xs font-semibold text-[#725B53] mb-1.5">
                Idade recomendada
              </label>
              <select
                id="filter-age"
                value={filters.recommendedAge}
                onChange={(e) => setFilters((f) => ({ ...f, recommendedAge: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
              >
                {ages.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-price" className="block text-xs font-semibold text-[#725B53] mb-1.5">
                Preço máximo:{' '}
                <span className="tabular-nums font-bold text-[#6F4E42]">
                  {formatCurrency(filters.maxPrice)}
                </span>
              </label>
              <input
                id="filter-price"
                type="range"
                min={50}
                max={300}
                step={10}
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                className="w-full accent-[#6F4E42] mt-2.5"
              />
            </div>

            <div>
              <label htmlFor="filter-sort" className="block text-xs font-semibold text-[#725B53] mb-1.5">
                Ordenar por
              </label>
              <select
                id="filter-sort"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sortBy: e.target.value as SortOption }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
              >
                <option value="relevancia">Destaques da Prof</option>
                <option value="mais_vendidos">Mais vendidos</option>
                <option value="menor_preco">Menor preço</option>
                <option value="maior_preco">Maior preço</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#3D2A24] cursor-pointer">
              <input
                type="checkbox"
                checked={filters.promoOnly}
                onChange={(e) => setFilters((f) => ({ ...f, promoOnly: e.target.checked }))}
                className="rounded border-[#EFE4DE] accent-[#6F4E42]"
              />
              <span>Mostrar apenas produtos em promoção</span>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF3EE] text-xs font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>

        {/* Product Grid / Soft Skeleton / Empty */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white border border-[#EFE4DE] rounded-3xl overflow-hidden soft-card-shadow animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#FAF3EE]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[#FDEEF4] rounded-full w-1/3" />
                  <div className="h-5 bg-[#FAF3EE] rounded-full w-4/5" />
                  <div className="h-4 bg-[#FAF3EE] rounded-full w-full" />
                  <div className="h-9 bg-[#FAF3EE] rounded-xl w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-12 text-center soft-card-shadow space-y-3">
            <h2 className="font-display text-xl font-bold text-[#3D2A24]">
              Nenhum recurso encontrado com esses filtros
            </h2>
            <p className="text-sm text-[#725B53] max-w-md mx-auto">
              Experimente limpar os filtros ativos ou buscar por outro termo pedagógico.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#6F4E42] text-white text-sm font-semibold hover:bg-[#573B30] transition-colors"
            >
              Ver todo o catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                onOpenProduct={(slug) => onNavigate({ page: 'product', slug })}
                onQuickView={onQuickView}
                onAddToCart={(p) => onAddToCart(p)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
