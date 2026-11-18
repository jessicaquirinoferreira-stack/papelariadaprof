import React, { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lock,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { buildWhatsAppUrl, formatCurrency } from '../lib/commerce';
import type { AppView, DigitalMaterial, StoreSettings } from '../types/store';

interface ApostilasPageProps {
  materials: DigitalMaterial[];
  settings: StoreSettings;
  isStudentLoggedIn: boolean;
  onAddMaterialToCart: (material: DigitalMaterial) => void;
  onNavigate: (view: AppView) => void;
}

export function ApostilasPage({
  materials,
  settings,
  isStudentLoggedIn,
  onAddMaterialToCart,
  onNavigate,
}: ApostilasPageProps) {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Todas');

  const subjects = useMemo(() => {
    const set = new Set<string>(['Todas']);
    materials.forEach((m) => {
      if (m.levelOrSubject) set.add(m.levelOrSubject);
    });
    return Array.from(set);
  }, [materials]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter((m) => {
      if (!m.active) return false;
      if (selectedSubject !== 'Todas' && m.levelOrSubject !== selectedSubject) return false;
      if (!q) return true;
      return `${m.title} ${m.description} ${m.levelOrSubject} ${m.recommendedAge}`
        .toLowerCase()
        .includes(q);
    });
  }, [materials, search, selectedSubject]);

  return (
    <div className="bg-[#FDF8F5]">
      {/* Pastel Boutique Header Band */}
      <section className="bg-[#F4EFFA] border-b border-[#E8DDF6] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#6B4C8C] text-xs font-bold border border-[#E8DDF6]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Exclusivo Aula Particular · Entrega Digital PDF
            </span>
            <div>
              <p className="font-script text-2xl sm:text-3xl text-[#6F4E42] leading-none">
                Acervo exclusivo da Prof
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3D2A24] mt-1 [text-wrap:balance]">
                Apostilas de Aula Particular & PDFs Exclusivos
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[#5E4942] leading-relaxed max-w-2xl">
              Cadernos pedagógicos em PDF de alta resolução preparados sob medida para reforço escolar, alfabetização individualizada e atendimentos psicopedagógicos. Compre pelo site, confirme no WhatsApp e baixe quando quiser na sua Área do Aluno.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate({ page: 'aluno' })}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#6F4E42] text-white text-xs sm:text-sm font-bold hover:bg-[#573B30] transition-colors soft-card-shadow"
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isStudentLoggedIn ? 'Acessar Minhas Apostilas' : 'Já comprei · Entrar na Área do Aluno'}
                </span>
              </button>
              <a
                href={buildWhatsAppUrl(
                  settings.whatsappNumber,
                  'Olá, Prof! Quero saber mais sobre as apostilas e PDFs exclusivos de aula particular.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#6F4E42] border border-[#E8DDF6] text-xs sm:text-sm font-bold hover:bg-[#FDEEF4] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                <span>Tirar dúvida no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* How It Works Flow Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 soft-card-shadow border border-[#E8DDF6] space-y-4">
            <h2 className="font-display text-base font-bold text-[#3D2A24] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#6B4C8C]" aria-hidden="true" />
              <span>Como funciona a liberação do PDF?</span>
            </h2>
            <ol className="space-y-3 text-xs text-[#5E4942]">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#FDEEF4] text-[#8C4B68] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  <strong className="text-[#3D2A24]">Faça seu cadastro completo</strong> na Área do Aluno e escolha as apostilas desejadas aqui na vitrine.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#FEF8E8] text-[#8B6215] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  <strong className="text-[#3D2A24]">Finalize a compra via WhatsApp</strong> combinando o pagamento (Pix ou Cartão) com a Prof.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#E6F2FC] text-[#3B6E9C] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  <strong className="text-[#3D2A24]">Liberação no seu painel:</strong> a Prof confirma o pagamento, seleciona seu cadastro e o PDF fica disponível na hora para download.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Filter & Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {subjects.map((subj) => {
              const active = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? 'bg-[#6F4E42] text-white'
                      : 'bg-white text-[#6F4E42] border border-[#EFE4DE] hover:bg-[#FDEEF4]'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="w-4 h-4 text-[#8C756D] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Buscar apostila ou PDF"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tema ou série..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#EFE4DE] text-xs text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-[#EFE4DE] text-center space-y-3 soft-card-shadow">
            <FileText className="w-8 h-8 text-[#B38ED9] mx-auto" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold text-[#3D2A24]">
              Nenhuma apostila encontrada com esse filtro
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('Todas');
                setSearch('');
              }}
              className="px-5 py-2.5 rounded-full bg-[#FDEEF4] text-[#6F4E42] text-xs font-bold"
            >
              Mostrar todas as apostilas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((mat) => {
              const hasPromo =
                typeof mat.promoPrice === 'number' &&
                mat.promoPrice > 0 &&
                mat.promoPrice < mat.price;
              const effectivePrice = hasPromo ? (mat.promoPrice as number) : mat.price;
              const directWa = buildWhatsAppUrl(
                settings.whatsappNumber,
                `Olá, Prof! Quero comprar a apostila exclusiva em PDF: *${mat.title}* (${formatCurrency(effectivePrice)}). Meu cadastro já está pronto para liberação na Área do Aluno!`
              );

              return (
                <article
                  key={mat.id}
                  className="group bg-white rounded-3xl border border-[#EFE4DE] overflow-hidden soft-card-shadow soft-card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-[#FAF3EE] overflow-hidden">
                    <img
                      src={mat.coverImage}
                      alt={mat.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-white/95 text-[#6B4C8C] text-[11px] font-bold shadow-xs">
                        {mat.levelOrSubject}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#FEF8E8] text-[#8B6215] text-[11px] font-bold shadow-xs">
                        {mat.pagesCount} pág. PDF
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-semibold text-[#8C4B68]">
                        Indicado para: {mat.recommendedAge}
                      </p>
                      <h3 className="font-display text-lg font-bold text-[#3D2A24] leading-snug">
                        {mat.title}
                      </h3>
                      <p className="text-xs text-[#725B53] leading-relaxed line-clamp-3">
                        {mat.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#15803D] font-semibold pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Acesso liberado na Área do Aluno após pagamento</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#FAF3EE]">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          {hasPromo && (
                            <span className="text-xs text-[#8C756D] line-through mr-2 tabular-nums">
                              {formatCurrency(mat.price)}
                            </span>
                          )}
                          <span className="font-display text-2xl font-bold text-[#6F4E42] tabular-nums">
                            {formatCurrency(effectivePrice)}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#725B53] bg-[#FDF8F5] px-2.5 py-1 rounded-full border border-[#EFE4DE]">
                          Frete grátis (PDF)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAddMaterialToCart(mat)}
                          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#6F4E42] text-white text-xs font-bold tracking-wide hover:bg-[#573B30] transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                          <span>COMPRAR APOSTILA</span>
                        </button>
                        <a
                          href={directWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Comprar ${mat.title} via WhatsApp`}
                          title="Comprar direto no WhatsApp"
                          className="w-11 h-11 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] flex items-center justify-center hover:bg-[#D5E9FA] transition-colors shrink-0"
                        >
                          <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom CTA to Student Area */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE4DE] soft-card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDEEF4] text-[#8C4B68] flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#3D2A24]">
                Já efetuou o pagamento pelo WhatsApp?
              </h2>
              <p className="text-xs text-[#725B53]">
                Entre com seu e-mail e senha na Área do Aluno para baixar suas apostilas exclusivas em PDF.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'aluno' })}
            className="px-6 py-3 rounded-2xl bg-[#F4EFFA] text-[#6B4C8C] border border-[#E8DDF6] text-xs font-bold hover:bg-[#E8DDF6] transition-colors shrink-0"
          >
            Ir para Área do Aluno
          </button>
        </div>
      </section>
    </div>
  );
}
