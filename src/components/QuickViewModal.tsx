import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FileText, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBRL, formatInstallment } from '../lib/utils';
import { Material, Product } from '../types';
import { SafeImage } from './SafeImage';

export function QuickViewModal() {
  const { quickViewItem, setQuickViewItem, addToCart, navigate } = useStore();

  if (!quickViewItem) return null;

  const { type, item } = quickViewItem;
  const imageUrl = type === 'product' ? (item as Product).imageUrl : (item as Material).coverUrl;
  const pagesCount = type === 'material' ? (item as Material).pagesCount : undefined;

  const handleBuy = () => {
    addToCart({
      id: item.id,
      type: 'material',
      title: item.title,
      price: item.price,
      imageUrl,
      category: item.category,
    });
    setQuickViewItem(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3A2E45]/45 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setQuickViewItem(null)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border-2 border-[#FCE1EE] grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#FFF9FB] relative aspect-[4/3] md:aspect-auto md:h-full">
          <SafeImage
            src={imageUrl}
            alt={item.title}
            fallbackTitle={item.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between gap-6 relative">
          <button
            type="button"
            onClick={() => setQuickViewItem(null)}
            className="absolute top-5 right-5 p-2 rounded-xl bg-[#FCE6F1] text-[#3A2E45] hover:bg-[#F67BB4] hover:text-white transition-colors"
            aria-label="Fechar visualização rápida"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-3 pr-8">
            <p className="text-xs font-semibold text-[#E05899]">
              {item.category} · Material Digital PDF
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#3A2E45] leading-snug">
              {item.title}
            </h2>
            <div className="space-y-0.5 pt-1">
              <div className="flex items-baseline gap-3">
                <span className="font-mono tabular-nums text-2xl font-bold text-[#3A2E45]">
                  {formatBRL(item.price)}
                </span>
              </div>
              <p className="text-xs text-[#675975]">ou {formatInstallment(item.price, 3)}</p>
            </div>
            <p className="text-sm text-[#675975] leading-relaxed pt-2">
              {item.description}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#3A2E45]">
              <FileText className="w-4 h-4 text-[#9B82E6]" />
              <span>
                PDF com {pagesCount || 40} páginas · Pronto para baixar e imprimir na Área do Aluno
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={item.stock <= 0}
              onClick={handleBuy}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{item.stock <= 0 ? 'Indisponível' : 'COMPRAR AGORA'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setQuickViewItem(null);
                navigate('product', { type: 'material', id: item.id });
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl text-xs font-semibold text-[#7459C7] bg-[#EFEAFD] hover:bg-[#E4DAF9] transition-colors"
            >
              <span>Ver detalhes completos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
