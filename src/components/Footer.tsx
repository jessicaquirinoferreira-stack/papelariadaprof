import React from 'react';
import { Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PDF_CATEGORIES } from '../data/defaults';
import { SafeImage } from './SafeImage';
import { BLOB_ASSETS } from '../data/assets';

export function Footer() {
  const { navigate, settings, categories } = useStore();

  return (
    <footer className="mt-20 bg-white border-t-4 border-[#F67BB4] relative">
      {/* Subtle Scalloped Top Edge */}
      <div className="w-full overflow-hidden leading-none bg-[#FFF9FB]">
        <svg
          viewBox="0 0 1200 18"
          preserveAspectRatio="none"
          className="w-full h-3 sm:h-4 block fill-[#F67BB4]"
          aria-hidden="true"
        >
          <path d="M0,18 L1200,18 L1200,12 C1160,2 1120,16 1080,8 C1040,0 1000,14 960,7 C920,1 880,15 840,8 C800,1 760,15 720,7 C680,0 640,14 600,8 C560,1 520,15 480,7 C440,0 400,15 360,8 C320,1 280,14 240,7 C200,0 160,15 120,8 C80,1 40,14 0,8 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3">
              <span className="p-1 rounded-full bg-gradient-to-tr from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]">
                <span className="block bg-white rounded-full p-1">
                  <SafeImage
                    src={BLOB_ASSETS.logo}
                    alt={settings.storeName}
                    fallbackTitle={settings.storeName}
                    className="h-14 w-auto object-contain"
                  />
                </span>
              </span>
              <div>
                <p className="font-display text-lg font-bold text-[#3A2E45]">{settings.storeName}</p>
                <p className="text-xs font-semibold text-[#E05899]">Por Professora Lilian</p>
              </div>
            </div>
            <p className="text-sm text-[#675975] leading-relaxed">
              Recursos pedagógicos em PDF preparados com afeto pela Professora Lilian para apoiar mamães e professoras na alfabetização e do 1º ao 5º ano.
            </p>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-[#3A2E45] mb-4">
              Categorias em PDF
            </h3>
            <ul className="space-y-2.5 text-sm text-[#675975]">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => navigate('catalog', undefined, cat)}
                    className="hover:text-[#E05899] transition-colors text-left cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigate('student')}
                  className="hover:text-[#E05899] transition-colors text-left cursor-pointer"
                >
                  Área do Aluno
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-[#3A2E45] mb-4">
              Institucional
            </h3>
            <ul className="space-y-2.5 text-sm text-[#675975]">
              <li>
                <button type="button" onClick={() => navigate('about')} className="hover:text-[#E05899] transition-colors cursor-pointer">
                  Quem sou eu – Prof. Lilian
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('contact')} className="hover:text-[#E05899] transition-colors cursor-pointer">
                  Fale Conosco
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('policies')} className="hover:text-[#E05899] transition-colors cursor-pointer">
                  Políticas de Uso e Privacidade
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('catalog')} className="hover:text-[#E05899] transition-colors cursor-pointer">
                  Catálogo Completo de PDFs
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-[#3A2E45] mb-4">
              Atendimento
            </h3>
            <p className="text-sm text-[#675975]">{settings.businessHours}</p>
            <p className="text-sm font-medium text-[#3A2E45]">{settings.contactEmail}</p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-4 py-2 rounded-xl candy-btn-coral"
              >
                WhatsApp da Loja
              </a>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-4 py-2 rounded-xl candy-btn-purple"
              >
                {settings.instagramHandle || 'Instagram'}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#FCE1EE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#675975]">
          <p>
            © {new Date().getFullYear()} {settings.storeName} · Professora Lilian. Todos os direitos reservados.
          </p>
          <button
            type="button"
            onClick={() => navigate('admin')}
            className="inline-flex items-center gap-1.5 text-[#8E7FA0] hover:text-[#3A2E45] transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Área Administrativa</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
