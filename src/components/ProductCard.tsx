import React from 'react';
import { motion } from 'motion/react';
import { Eye, FileText, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBRL, formatInstallment } from '../lib/utils';
import { Material, Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  type: 'product' | 'material';
  item: Product | Material;
}

function getCategoryAccent(category: string): { bar: string; label: string } {
  const lower = category.toLowerCase();
  if (lower.includes('alfabetiz')) return { bar: 'bg-[#F67BB4]', label: 'text-[#D14788]' };
  if (lower.includes('portugu')) return { bar: 'bg-[#6BBEEB]', label: 'text-[#2C88BA]' };
  if (lower.includes('matem')) return { bar: 'bg-[#FAD663]', label: 'text-[#B5840E]' };
  return { bar: 'bg-[#9B82E6]', label: 'text-[#7459C7]' };
}

export function ProductCard({ type, item }: ProductCardProps) {
  const { addToCart, navigate, setQuickViewItem } = useStore();

  const imageUrl = type === 'product' ? (item as Product).imageUrl : (item as Material).coverUrl;
  const pagesCount = type === 'material' ? (item as Material).pagesCount : undefined;
  const outOfStock = item.stock <= 0;
  const accent = getCategoryAccent(item.category);

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({
      id: item.id,
      type: 'material',
      title: item.title,
      price: item.price,
      imageUrl,
      category: item.category,
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewItem({ type: 'material', item });
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate('product', { type: 'material', id: item.id })}
      className="soft-card rounded-3xl overflow-hidden flex flex-col cursor-pointer group border-2 border-[#FCE1EE]"
    >
      <div className={`h-2 w-full ${accent.bar}`} />

      <div className="relative w-full overflow-hidden bg-[#FFF9FB] aspect-[3/4]">
        <SafeImage
          src={imageUrl}
          alt={item.title}
          fallbackTitle={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <button
          type="button"
          onClick={handleQuickView}
          className="absolute top-3.5 right-3.5 w-10 h-10 rounded-2xl bg-white/95 text-[#9B82E6] hover:bg-[#9B82E6] hover:text-white flex items-center justify-center shadow-md transition-all"
          aria-label={`Visualização rápida de ${item.title}`}
          title="Visualização rápida"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4 bg-white">
        <div className="space-y-2">
          <div className={`text-xs font-semibold ${accent.label}`}>
            <span className="truncate block">
              {item.category}
              {pagesCount ? ` · ${pagesCount} pág.` : ''}
            </span>
          </div>

          <h3 className="font-display text-lg font-semibold text-[#3A2E45] leading-snug line-clamp-2 group-hover:text-[#E05899] transition-colors">
            {item.title}
          </h3>

          <p className="text-xs text-[#675975] leading-relaxed line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-[#FCE6F1]">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono tabular-nums text-xl font-bold text-[#3A2E45]">
                {formatBRL(item.price)}
              </span>
            </div>
            <p className="text-[11px] text-[#675975]">
              ou {formatInstallment(item.price, 3)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#675975]">
            <FileText className="w-3.5 h-3.5 text-[#F267A8] shrink-0" />
            <span>PDF pronto para imprimir · Área do Aluno</span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuy}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl candy-btn-coral text-xs font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{outOfStock ? 'INDISPONÍVEL' : 'COMPRAR'}</span>
            </button>
            <button
              type="button"
              onClick={handleQuickView}
              className="p-3 rounded-2xl candy-btn-purple"
              aria-label="Visualização rápida"
              title="Visualização rápida"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
