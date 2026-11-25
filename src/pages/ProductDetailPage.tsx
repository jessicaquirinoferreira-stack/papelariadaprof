import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Minus, Plus, Printer, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBRL } from '../lib/utils';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';

export function ProductDetailPage() {
  const { selectedItem, materials, addToCart, navigate, settings } = useStore();
  const [qty, setQty] = useState(1);

  const item = materials.find((m) => m.id === selectedItem?.id) || materials[0];

  if (!item) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#3A2E45] mb-4">
          Material não encontrado
        </h1>
        <button
          type="button"
          onClick={() => navigate('catalog')}
          className="px-6 py-3 rounded-2xl candy-btn-purple text-sm font-bold cursor-pointer"
        >
          Voltar ao Catálogo
        </button>
      </main>
    );
  }

  const related = materials.filter((m) => m.id !== item.id && m.active).slice(0, 3);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, '');
  const waQuestionHref = `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`}?text=${encodeURIComponent(`Olá Prof. Lilian! Tenho uma dúvida sobre o material PDF: ${item.title}`)}`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate('catalog')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#675975] hover:text-[#E05899] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Catálogo de PDFs</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sticky Cover */}
        <div className="lg:col-span-6 lg:sticky lg:top-28">
          <div className="rounded-[2rem] overflow-hidden bg-white border-2 border-[#FCE1EE] shadow-md aspect-[3/4] max-w-md mx-auto">
            <div className="h-2.5 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]" />
            <SafeImage
              src={item.coverUrl}
              alt={item.title}
              fallbackTitle={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Purchase Module */}
        <div className="lg:col-span-6 bg-white rounded-[2rem] p-7 sm:p-10 border-2 border-[#FCE1EE] shadow-sm space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
              {item.category} · Material Digital em PDF
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3A2E45] leading-snug">
              {item.title}
            </h1>
          </div>

          <div className="flex items-baseline gap-3 pb-4 border-b border-[#FCE1EE]">
            <span className="font-mono tabular-nums text-3xl font-bold text-[#E05899]">
              {formatBRL(item.price)}
            </span>
          </div>

          <p className="text-sm text-[#675975] leading-relaxed">{item.description}</p>

          <div className="bg-[#FFF9FB] rounded-2xl p-4 border border-[#FCE1EE] space-y-2.5 text-xs font-medium text-[#3A2E45]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E05899]" />
              <span>Arquivo PDF com {item.pagesCount} páginas em alta resolução</span>
            </div>
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#9B82E6]" />
              <span>Pronto para baixar e imprimir quantas vezes precisar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3F9145]" />
              <span>Liberado na sua Área do Aluno após confirmação do pedido</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="inline-flex items-center justify-between sm:justify-center gap-3 px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE]">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-1 text-[#3A2E45] hover:text-[#E05899] cursor-pointer"
                aria-label="Diminuir quantidade"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono tabular-nums text-sm font-bold w-6 text-center text-[#3A2E45]">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="p-1 text-[#3A2E45] hover:text-[#E05899] cursor-pointer"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={item.stock <= 0}
              onClick={() =>
                addToCart(
                  {
                    id: item.id,
                    type: 'material',
                    title: item.title,
                    price: item.price,
                    imageUrl: item.coverUrl,
                    category: item.category,
                  },
                  qty
                )
              }
              className="flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{item.stock <= 0 ? 'INDISPONÍVEL' : 'COMPRAR PDF AGORA'}</span>
            </button>
          </div>

          <a
            href={waQuestionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 px-4 rounded-2xl bg-[#FCE6F1] text-[#3A2E45] text-xs font-bold hover:bg-[#F8BBD7] transition-colors"
          >
            Tirar dúvidas sobre este material com a Prof. Lilian
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t-2 border-[#FCE1EE]">
          <h2 className="font-display text-2xl font-bold text-[#3A2E45] mb-8">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {related.map((rel) => (
              <ProductCard key={rel.id} type="material" item={rel} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
