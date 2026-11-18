import React, { useState } from 'react';
import { Bold, Edit3, Italic, List, Plus, Search, Trash2, X } from 'lucide-react';
import { MediaDropzone } from './MediaDropzone';
import { formatCurrency, getEffectivePrice, sanitizeSlug } from '../../lib/commerce';
import type { Product, ResourceType } from '../../types/store';

interface AdminProductsTabProps {
  products: Product[];
  onSaveProduct: (product: Product, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

function createEmptyProduct(): Product {
  const now = new Date().toISOString();
  return {
    id: `prod-${Date.now()}`,
    slug: '',
    name: '',
    shortDescription: '',
    description: '<p>Recurso pedagógico desenvolvido com acabamento plastificado.</p>',
    price: 79.9,
    promoPrice: null,
    stock: 10,
    category: 'Alfabetização',
    resourceType: 'pedagogico',
    recommendedAge: '4 a 7 anos',
    tags: [],
    images: ['/src/assets/images/prod_alfabetizacao_1795023315545.jpg'],
    videoUrl: '',
    variants: [],
    featured: false,
    active: true,
    salesCount: 0,
    weightGrams: 400,
    createdAt: now,
    updatedAt: now,
  };
}

export function AdminProductsTab({
  products,
  onSaveProduct,
  onDeleteProduct,
  onNotify,
}: AdminProductsTabProps) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ product: Product; isNew: boolean } | null>(null);
  const [tagsText, setTagsText] = useState('');

  const filtered = products.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openEditor = (product?: Product) => {
    const target = product ? { ...product } : createEmptyProduct();
    setTagsText((target.tags || []).join(', '));
    setEditing({ product: target, isNew: !product });
  };

  const insertRichTag = (tag: 'strong' | 'em' | 'li') => {
    if (!editing) return;
    const snippet =
      tag === 'strong'
        ? ' <strong>destaque</strong> '
        : tag === 'em'
        ? ' <em>ênfase</em> '
        : '\n<ul><li>Novo benefício pedagógico</li></ul>';
    setEditing({
      ...editing,
      product: {
        ...editing.product,
        description: `${editing.product.description}${snippet}`,
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const p = editing.product;
    if (p.name.trim().length < 2) {
      onNotify('Informe o nome do produto.', 'error');
      return;
    }
    const slug = p.slug.trim() || sanitizeSlug(p.name) || `produto-${Date.now()}`;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    await onSaveProduct(
      {
        ...p,
        slug,
        shortDescription: p.shortDescription.trim() || p.name.trim(),
        tags,
        images:
          p.images.length > 0
            ? p.images
            : ['/src/assets/images/prod_alfabetizacao_1795023315545.jpg'],
        updatedAt: new Date().toISOString(),
      },
      editing.isNew
    );
    setEditing(null);
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="adm-prod-search" className="sr-only">
            Buscar produto
          </label>
          <Search className="w-4 h-4 text-[#725B53] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="adm-prod-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar produtos da vitrine..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#EFE4DE] bg-white text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
          />
        </div>

        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-[#EFE4DE] rounded-3xl soft-card-shadow overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#EFE4DE] text-xs text-[#725B53] bg-[#FDF8F5]">
              <th className="py-3.5 px-4 font-semibold">Produto</th>
              <th className="py-3.5 px-4 font-semibold">Categoria / Tipo</th>
              <th className="py-3.5 px-4 font-semibold text-right">Preço</th>
              <th className="py-3.5 px-4 font-semibold text-right">Estoque</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FAF3EE]">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-[#FDF8F5]">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover bg-[#FAF3EE] shrink-0"
                    />
                    <div>
                      <p className="font-bold text-[#3D2A24] line-clamp-1">{product.name}</p>
                      <p className="text-xs text-[#725B53]">{product.recommendedAge}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-[#725B53]">
                  {product.category} · {product.resourceType}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-[#6F4E42]">
                  {formatCurrency(getEffectivePrice(product))}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-xs">
                  {product.stock} un.
                </td>
                <td className="py-3 px-4 text-xs">
                  <span
                    className={`font-semibold ${
                      product.active ? 'text-[#15803D]' : 'text-[#725B53]'
                    }`}
                  >
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditor(product)}
                      aria-label={`Editar ${product.name}`}
                      className="p-2 rounded-xl text-[#6F4E42] hover:bg-[#FDEEF4]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(product.id)}
                      aria-label={`Excluir ${product.name}`}
                      className="p-2 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Create/Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D2A24]/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={editing.isNew ? 'Cadastrar produto' : 'Editar produto'}
        >
          <div className="bg-white border border-[#EFE4DE] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 soft-card-shadow space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3D2A24]">
                {editing.isNew ? 'Cadastrar Novo Produto' : 'Editar Produto'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Fechar editor"
                className="p-2 rounded-full text-[#725B53] hover:bg-[#FDF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="ep-name" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Nome do produto *
                  </label>
                  <input
                    id="ep-name"
                    type="text"
                    required
                    value={editing.product.name}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, name: e.target.value },
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="ep-short" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Resumo curto (vitrine e SEO)
                  </label>
                  <input
                    id="ep-short"
                    type="text"
                    value={editing.product.shortDescription}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, shortDescription: e.target.value },
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="ep-price" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    id="ep-price"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={editing.product.price}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, price: Number(e.target.value) },
                      })
                    }
                    className={`${inputCls} tabular-nums`}
                  />
                </div>

                <div>
                  <label htmlFor="ep-promo" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Preço promocional (opcional)
                  </label>
                  <input
                    id="ep-promo"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editing.product.promoPrice ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: {
                          ...editing.product,
                          promoPrice: e.target.value ? Number(e.target.value) : null,
                        },
                      })
                    }
                    className={`${inputCls} tabular-nums`}
                  />
                </div>

                <div>
                  <label htmlFor="ep-cat" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Categoria
                  </label>
                  <input
                    id="ep-cat"
                    type="text"
                    value={editing.product.category}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, category: e.target.value },
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="ep-type" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Classificação
                  </label>
                  <select
                    id="ep-type"
                    value={editing.product.resourceType}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: {
                          ...editing.product,
                          resourceType: e.target.value as ResourceType,
                        },
                      })
                    }
                    className={inputCls}
                  >
                    <option value="pedagogico">Pedagógico</option>
                    <option value="terapeutico">Terapêutico</option>
                    <option value="ambos">Pedagógico e Terapêutico</option>
                    <option value="papelaria">Papelaria Afetiva</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ep-age" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Idade recomendada
                  </label>
                  <input
                    id="ep-age"
                    type="text"
                    value={editing.product.recommendedAge}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, recommendedAge: e.target.value },
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ep-stock" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                      Estoque
                    </label>
                    <input
                      id="ep-stock"
                      type="number"
                      min={0}
                      value={editing.product.stock}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: { ...editing.product, stock: Number(e.target.value) },
                        })
                      }
                      className={`${inputCls} tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="ep-weight" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                      Peso (g)
                    </label>
                    <input
                      id="ep-weight"
                      type="number"
                      min={50}
                      value={editing.product.weightGrams}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: { ...editing.product, weightGrams: Number(e.target.value) },
                        })
                      }
                      className={`${inputCls} tabular-nums`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="ep-tags" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    id="ep-tags"
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="alfabetização, TEA, sílabas"
                    className={inputCls}
                  />
                </div>

                {/* Rich Description Editor */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ep-desc" className="text-xs font-semibold text-[#3D2A24]">
                      Descrição rica do produto
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertRichTag('strong')}
                        title="Negrito"
                        className="p-1.5 rounded-lg border border-[#EFE4DE] hover:bg-[#FDF8F5]"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichTag('em')}
                        title="Itálico"
                        className="p-1.5 rounded-lg border border-[#EFE4DE] hover:bg-[#FDF8F5]"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichTag('li')}
                        title="Lista de tópicos"
                        className="p-1.5 rounded-lg border border-[#EFE4DE] hover:bg-[#FDF8F5]"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="ep-desc"
                    rows={4}
                    value={editing.product.description}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, description: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-mono"
                  />
                </div>
              </div>

              <MediaDropzone
                images={editing.product.images}
                videoUrl={editing.product.videoUrl || ''}
                onChangeImages={(imgs) =>
                  setEditing({
                    ...editing,
                    product: { ...editing.product, images: imgs },
                  })
                }
                onChangeVideoUrl={(url) =>
                  setEditing({
                    ...editing,
                    product: { ...editing.product, videoUrl: url },
                  })
                }
                onNotify={onNotify}
              />

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#3D2A24]">
                  <input
                    type="checkbox"
                    checked={editing.product.active}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, active: e.target.checked },
                      })
                    }
                    className="accent-[#6F4E42]"
                  />
                  <span>Produto ativo na vitrine</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#3D2A24]">
                  <input
                    type="checkbox"
                    checked={editing.product.featured}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, featured: e.target.checked },
                      })
                    }
                    className="accent-[#6F4E42]"
                  />
                  <span>Destacar na página inicial</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EFE4DE]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 rounded-xl border border-[#EFE4DE] text-xs font-semibold text-[#3D2A24]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
