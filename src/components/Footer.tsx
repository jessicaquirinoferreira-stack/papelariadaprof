import React from 'react';
import { Instagram, Lock, Mail, MapPin, MessageCircle } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { buildWhatsAppUrl } from '../lib/commerce';
import type { AppView, StoreSettings } from '../types/store';

interface FooterProps {
  settings: StoreSettings;
  onNavigate: (view: AppView) => void;
  onOpenAdmin: () => void;
}

export function Footer({ settings, onNavigate, onOpenAdmin }: FooterProps) {
  const whatsappLink = buildWhatsAppUrl(
    settings.whatsappNumber,
    'Olá! Vim pelo site da Papelaria da Prof e gostaria de tirar uma dúvida.'
  );

  return (
    <footer className="bg-white border-t border-[#EFE4DE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <BrandMark
              storeName={settings.storeName}
              tagline="Recursos Pedagógicos"
              variant="full"
            />
            <p className="text-sm text-[#725B53] leading-relaxed max-w-md">
              {settings.footerText}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDEEF4] border border-[#F6DCE6] text-xs font-semibold text-[#6F4E42] hover:bg-[#FCE2EC] transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-[#B84A70]" aria-hidden="true" />
                <span>@papelaria.da.prof</span>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6F2FC] border border-[#CEE5F8] text-xs font-semibold text-[#3B6E9C] hover:bg-[#D5E9FA] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>WhatsApp da Prof</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#3D2A24]">
              Navegação
            </h3>
            <ul className="space-y-2 text-sm text-[#725B53]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'catalog' })}
                  className="hover:text-[#6F4E42] transition-colors"
                >
                  Catálogo Completo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate({ page: 'catalog', initialResourceType: 'terapeutico' })
                  }
                  className="hover:text-[#6F4E42] transition-colors"
                >
                  Recursos Terapêuticos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'apostilas' })}
                  className="hover:text-[#6F4E42] transition-colors font-semibold text-[#6B4C8C]"
                >
                  Apostilas & PDFs Exclusivos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'aluno' })}
                  className="hover:text-[#6F4E42] transition-colors"
                >
                  Área do Aluno (Downloads)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'about' })}
                  className="hover:text-[#6F4E42] transition-colors"
                >
                  Sobre a Papelaria da Prof
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'blog' })}
                  className="hover:text-[#6F4E42] transition-colors"
                >
                  Caderno de Ideias (Blog)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'contact' })}
                  className="hover:text-[#6F4E42] transition-colors"
                >
                  Contato e Orçamentos
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#3D2A24]">
              Atendimento & Envios
            </h3>
            <div className="space-y-2.5 text-sm text-[#725B53]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#B38ED9] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{settings.cityState} · Retirada agendada e envio nacional</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E89EB8] shrink-0" aria-hidden="true" />
                <span>{settings.contactEmail}</span>
              </p>
              <p className="text-xs leading-relaxed pt-1 bg-[#FDF8F5] rounded-2xl p-3 border border-[#EFE4DE]">
                {settings.shippingPolicy}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#EFE4DE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#725B53]">
          <p>
            © {new Date().getFullYear()} {settings.storeName} · Todos os direitos reservados.
          </p>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-[#725B53] hover:text-[#6F4E42] transition-colors py-1 px-2.5 rounded-full hover:bg-[#FDF8F5]"
          >
            <Lock className="w-3 h-3" aria-hidden="true" />
            <span>Área Admin</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
