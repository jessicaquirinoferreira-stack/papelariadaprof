import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PDF_CATEGORIES } from '../data/defaults';
import { ProductCard } from '../components/ProductCard';

interface CatalogPageProps {
  mode: 'catalog' | 'apostilas';
}

export function CatalogPage({ mode }: CatalogPageProps) {
  const { materials, catalogCategory, setCatalogCategory, searchQuery, setSearchQuery, categories: storeCategories } = useStore();
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const items = useMemo(() => materials.filter((m) => m.active), [materials]);

  const categories = useMemo(() => {
    const fromItems = Array.from(new Set(items.map((i) => i.category)));
    const ordered = Array.from(new Set([...storeCategories, ...fromItems]));
    return ['Todas', ...ordered];
  }, [items, storeCategories]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchCat = catalogCategory === 'Todas' || item.category === catalogCategory;
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [items, catalogCategory, searchQuery, sortBy]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative overflow-hidden playful-dots rounded-[2rem] p-8 sm:p-10 mb-10 border-2 border-[#FCE1EE] shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] via-[#7ED082] to-[#6BBEEB]" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899] mb-2">
          {mode === 'apostilas' ? 'Materiais Digitais em PDF' : 'Vitrine Completa'}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E45]">
          {mode === 'apostilas'
            ? 'Apostilas de Aula Particular Exclusivas'
            : 'Catálogo de Recursos'}
        </h1>
        {mode === 'apostilas' ? (
          <p className="text-sm text-[#675975] mt-2 max-w-2xl leading-relaxed">
            Materiais digitais em PDF em alta resolução prontos para baixar, imprimir e aplicar. Liberados na Área do Aluno após confirmação do pedido.
          </p>
        ) : (
          <div className="text-sm text-[#675975] mt-2.5 max-w-3xl leading-relaxed space-y-1.5">
            <p>
              Recursos pedagógicos prontos para imprimir e transformar o aprendizado. Feitos com afeto por mim, Professora Lilian, para ajudar mamães e professoras no dia a dia.
            </p>
            <p>
              Recursos pedagógicos prontos para baixar, imprimir e tornar cada momento de estudo muito mais leve e eficaz.
            </p>
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatalogCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogCategory === cat
                  ? 'candy-btn-pink'
                  : 'bg-white text-[#675975] border-2 border-[#FCE1EE] hover:bg-[#FCE6F1] hover:text-[#3A2E45]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7D6A43] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar material em PDF..."
              className="pl-10 pr-4 py-2.5 rounded-full bg-[#FDECA8] border-2 border-[#FAD663] text-sm text-[#3A2E45] placeholder:text-[#7D6A43] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50 w-full sm:w-64"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
            className="px-4 py-2.5 rounded-full bg-white border-2 border-[#BEE6FB] text-sm font-semibold text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
            aria-label="Ordenar por"
          >
            <option value="featured">Destaques</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-[#FCE1EE] space-y-3 shadow-sm">
          <p className="font-display text-xl font-bold text-[#3A2E45]">
            Nenhum PDF encontrado nesta seleção
          </p>
          <p className="text-sm text-[#675975]">
            Tente outro termo de busca ou visualize todas as categorias disponíveis.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCatalogCategory('Todas');
            }}
            className="px-6 py-2.5 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer"
          >
            Mostrar todos os PDFs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((item) => (
            <ProductCard key={item.id} type="material" item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
