import React from 'react';
import { Award, BookOpenCheck, HeartHandshake, MapPin } from 'lucide-react';
import { BrandMark } from './BrandMark';
import type { AppView, StoreSettings } from '../types/store';

interface AboutPageProps {
  settings: StoreSettings;
  onNavigate: (view: AppView) => void;
}

export function AboutPage({ settings, onNavigate }: AboutPageProps) {
  return (
    <div className="bg-[#FDF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <BrandMark storeName={settings.storeName} tagline="Recursos Pedagógicos" variant="full" />
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3D2A24] leading-tight [text-wrap:balance]">
              Nascemos dentro da sala de aula para facilitar o dia a dia de quem ensina e cuida.
            </h1>
            <p className="text-base text-[#725B53] leading-relaxed">
              A <strong className="text-[#3D2A24]">Papelaria da Prof</strong> surgiu em São José do Rio Preto - SP com o desejo de unir papelaria afetiva de alta qualidade a materiais pedagógicos e terapêuticos prontos para uso imediato.
            </p>
            <p className="text-base text-[#725B53] leading-relaxed">
              Sabemos o quanto professores, psicopedagogos, fonoaudiólogos e terapeutas ocupacionais dedicam noites e finais de semana preparando fichas e jogos. Por isso, entregamos cada kit impresso, recortado, plastificado com cantos arredondados e pensado com intencionalidade pedagógica.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate({ page: 'catalog' })}
                className="px-6 py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors soft-card-shadow"
              >
                Conhecer os recursos
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'contact' })}
                className="px-6 py-3 rounded-xl border border-[#EFE4DE] bg-white text-sm font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
              >
                Falar com o ateliê
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-[#EFE4DE] bg-white soft-card-shadow">
              <img
                src="/src/assets/images/sobre_atelie_prof_1795023388525.jpg"
                alt="Ateliê da Papelaria da Prof com estantes organizadas"
                referrerPolicy="no-referrer"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F4EFFA] text-[#6B4C8C] flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">Base Pedagógica Real</h2>
            <p className="text-sm text-[#725B53] leading-relaxed">
              Todo recurso respeita etapas reais do desenvolvimento infantil, consciência fonológica e alfabetização significativa.
            </p>
          </div>

          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E6F2FC] text-[#3B6E9C] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">Inclusão & Terapia</h2>
            <p className="text-sm text-[#725B53] leading-relaxed">
              Cores suaves sem sobrecarga sensorial, pictogramas claros e apoio visual para TEA, TDAH, fala e regulação emocional.
            </p>
          </div>

          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FEF8E8] text-[#8B6215] flex items-center justify-center">
              <Award className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">Acabamento Profissional</h2>
            <p className="text-sm text-[#725B53] leading-relaxed">
              Plastificação 175 micras higienizável, madeira lixada e cantos arredondados para resistir à rotina escolar e clínica.
            </p>
          </div>
        </div>

        <div className="bg-[#FDEEF4] border border-[#F6DCE6] rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 soft-card-shadow">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-bold text-[#8C4B68]">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {settings.cityState}
            </p>
            <h2 className="font-display text-xl font-bold text-[#3D2A24]">
              Atendimento para escolas e compras institucionais
            </h2>
            <p className="text-sm text-[#725B53]">
              Montamos combos personalizados por turma ou clínica com orçamento rápido via WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'contact' })}
            className="px-6 py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors shrink-0"
          >
            Solicitar orçamento
          </button>
        </div>
      </div>
    </div>
  );
}
