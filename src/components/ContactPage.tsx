import React, { useState } from 'react';
import { Instagram, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/commerce';
import type { StoreSettings } from '../types/store';

interface ContactPageProps {
  settings: StoreSettings;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

export function ContactPage({ settings, onNotify }: ContactPageProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Professora / Educadora');
  const [message, setMessage] = useState('');
  const [sentUrl, setSentUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      onNotify('Preencha seu nome e sua mensagem.', 'error');
      return;
    }
    const text = `Olá, Prof! Meu nome é ${name.trim()} (${role}).\n\n${message.trim()}`;
    const url = buildWhatsAppUrl(settings.whatsappNumber, text);
    setSentUrl(url);
    onNotify('Mensagem preparada! Clique no botão verde para enviar no WhatsApp.');
  };

  return (
    <div className="bg-[#FDF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="font-script text-2xl text-[#6F4E42] leading-none">
                Atendimento acolhedor
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3D2A24] mt-1">
                Fale com a Prof
              </h1>
              <p className="text-sm text-[#725B53] mt-2 leading-relaxed">
                Dúvidas sobre faixa etária, kits para escolas, personalização de pictogramas ou retirada em São José do Rio Preto? Estamos à disposição.
              </p>
            </div>

            <div className="bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4EFFA] text-[#6B4C8C] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-[#3D2A24]">Localização</p>
                  <p className="text-[#725B53]">{settings.cityState} · Retirada agendada e envios Correios</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-[#3D2A24]">E-mail</p>
                  <p className="text-[#725B53]">{settings.contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FDEEF4] text-[#B84A70] flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-[#3D2A24]">Instagram</p>
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6F4E42] font-semibold hover:underline"
                  >
                    @papelaria.da.prof
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#EFE4DE] rounded-3xl p-6 sm:p-8 soft-card-shadow">
            <h2 className="font-display text-xl font-bold text-[#3D2A24] mb-4">
              Enviar mensagem direta
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cnt-name" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Seu nome
                  </label>
                  <input
                    id="cnt-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
                  />
                </div>

                <div>
                  <label htmlFor="cnt-role" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Perfil
                  </label>
                  <select
                    id="cnt-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
                  >
                    <option>Professora / Educadora</option>
                    <option>Terapeuta / Psicopedagoga / Fono</option>
                    <option>Mãe / Pai / Responsável</option>
                    <option>Coordenação / Escola</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cnt-msg" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Como podemos ajudar?
                </label>
                <textarea
                  id="cnt-msg"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Conte para nós sobre a idade das crianças, objetivos ou quantidade de kits..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors soft-card-shadow"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Preparar atendimento no WhatsApp</span>
              </button>

              {sentUrl && (
                <div className="p-4 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#166534]">
                    Tudo pronto! Clique para abrir a conversa com o ateliê.
                  </span>
                  <a
                    href={sentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803D]"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Abrir WhatsApp</span>
                  </a>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
