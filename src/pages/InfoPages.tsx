import React, { useState } from 'react';
import { CheckCircle2, Clock, FileText, Heart, Mail, Phone, Send, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SafeImage } from '../components/SafeImage';
import { BLOB_ASSETS } from '../data/assets';

export function AboutPage() {
  const { navigate } = useStore();
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <section className="bg-white rounded-[2rem] border-2 border-[#FCE1EE] overflow-hidden grid grid-cols-1 md:grid-cols-2 items-stretch shadow-sm">
        <SafeImage
          src={BLOB_ASSETS.aboutAtelier}
          alt="Professora Lilian · Papelaria da Prof"
          className="w-full h-full object-cover min-h-[280px] bg-[#FCE6F1]"
        />
        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
            Nossa História
          </p>
          <h1 className="font-display text-3xl font-bold text-[#3A2E45]">
            Sobre a Papelaria da Prof · Prof. Lilian
          </h1>
          <p className="text-sm text-[#675975] leading-relaxed">
            A Papelaria da Prof nasceu com o propósito de criar recursos pedagógicos em PDF prontos para imprimir e transformar o aprendizado. Cada material é feito com afeto por mim, Professora Lilian, para ajudar mamães e professoras no dia a dia.
          </p>
          <p className="text-sm text-[#675975] leading-relaxed">
            Do início da alfabetização aos conteúdos de Português e Matemática do 1º ao 5º ano, nossos PDFs tornam cada momento de estudo muito mais leve, organizado e eficaz.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('catalog')}
              className="px-6 py-3.5 rounded-full candy-btn-yellow text-sm font-display font-bold cursor-pointer"
            >
              Conhecer Apostilas PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border-2 border-[#F8BBD7] space-y-2 shadow-sm">
          <Heart className="w-6 h-6 text-[#E05899]" />
          <h2 className="font-display text-lg font-bold text-[#3A2E45]">Feito com Afeto</h2>
          <p className="text-xs text-[#675975] leading-relaxed">
            Atividades com visual acolhedor e didático para encantar as crianças nos estudos em casa ou na escola.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border-2 border-[#BEE6FB] space-y-2 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-[#2D8EC4]" />
          <h2 className="font-display text-lg font-bold text-[#3A2E45]">1º ao 5º Ano & Alfabetização</h2>
          <p className="text-xs text-[#675975] leading-relaxed">
            Apostilas estruturadas para Alfabetização nos Anos Iniciais, Português, Matemática e organização para professoras.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border-2 border-[#D7CBFA] space-y-2 shadow-sm">
          <FileText className="w-6 h-6 text-[#7C62CA]" />
          <h2 className="font-display text-lg font-bold text-[#3A2E45]">100% Digital em PDF</h2>
          <p className="text-xs text-[#675975] leading-relaxed">
            Sem espera nem frete: seus arquivos ficam liberados na Área do Aluno para baixar e imprimir quando quiser.
          </p>
        </div>
      </section>
    </main>
  );
}

export function ContactPage() {
  const { settings, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    showToast('Mensagem preparada! Você também pode falar com a Prof. Lilian pelo WhatsApp.');
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
              Atendimento
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3A2E45] mt-1">
              Fale com a Prof. Lilian
            </h1>
            <p className="text-sm text-[#675975] mt-2 leading-relaxed">
              Dúvidas sobre apostilas em PDF, pedidos ou liberação de materiais na Área do Aluno? Estou aqui para ajudar você.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 text-sm text-[#3A2E45] shadow-sm">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#3F9145] mt-1 shrink-0" />
              <div>
                <p className="font-bold text-[#3A2E45]">WhatsApp</p>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-xs text-[#675975] hover:text-[#E05899]">
                  Atendimento direto via WhatsApp
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#E05899] mt-1 shrink-0" />
              <div>
                <p className="font-bold text-[#3A2E45]">E-mail de Trabalho</p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-xs text-[#675975] hover:text-[#E05899]"
                >
                  {settings.contactEmail}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#9B82E6] mt-1 shrink-0" />
              <div>
                <p className="font-bold text-[#3A2E45]">Horário de Atendimento</p>
                <p className="text-xs text-[#675975]">{settings.businessHours}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[2rem] p-7 sm:p-9 border-2 border-[#FCE1EE] shadow-sm">
          {sent ? (
            <div className="text-center py-10 space-y-4">
              <CheckCircle2 className="w-10 h-10 text-[#3F9145] mx-auto" />
              <h2 className="font-display text-2xl font-bold text-[#3A2E45]">Mensagem pronta!</h2>
              <p className="text-sm text-[#675975]">
                Para resposta rápida, clique abaixo e envie sua mensagem direto no WhatsApp da Prof. Lilian.
              </p>
              <a
                href={`${waHref}?text=${encodeURIComponent(`Olá Prof. Lilian! Sou ${name} (${email}). ${message}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-coral text-sm font-bold"
              >
                <span>Abrir no WhatsApp</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#3A2E45]">Envie uma mensagem</h2>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">Seu nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">Seu e-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">Mensagem</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-coral text-sm font-bold cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Mensagem</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export function PoliciesPage() {
  const { settings } = useStore();
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="playful-dots rounded-[2rem] p-8 border-2 border-[#FCE1EE] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899] pt-1">
          Transparência
        </p>
        <h1 className="font-display text-3xl font-bold text-[#3A2E45] mt-1">
          Políticas de Uso e Privacidade
        </h1>
      </div>

      <section className="bg-white rounded-3xl p-7 border-2 border-[#FCE1EE] space-y-3 shadow-sm">
        <h2 className="font-display text-xl font-bold text-[#3A2E45]">
          1. Materiais 100% Digitais em PDF
        </h2>
        <p className="text-sm text-[#675975] leading-relaxed">
          Todos os recursos da Papelaria da Prof são entregues exclusivamente em formato digital (PDF) prontos para impressão. Não realizamos envio físico pelos Correios e não há cobrança de frete.
        </p>
      </section>

      <section className="bg-white rounded-3xl p-7 border-2 border-[#BEE6FB] space-y-3 shadow-sm">
        <h2 className="font-display text-xl font-bold text-[#3A2E45]">
          2. Liberação na Área do Aluno e Licença de Uso
        </h2>
        <p className="text-sm text-[#675975] leading-relaxed">
          As apostilas e PDFs exclusivos são liberados diretamente na Área do Aluno vinculada ao seu cadastro após a confirmação do pedido pelo WhatsApp. O uso é autorizado para suas aulas, uso familiar com seus filhos ou alunos individuais, sendo proibida a revenda ou redistribuição comercial dos arquivos digitais.
        </p>
      </section>

      <section className="bg-white rounded-3xl p-7 border-2 border-[#D7CBFA] space-y-3 shadow-sm">
        <h2 className="font-display text-xl font-bold text-[#3A2E45]">
          3. Privacidade e Atendimento
        </h2>
        <p className="text-sm text-[#675975] leading-relaxed">
          Seus dados cadastrais são protegidos e utilizados exclusivamente para controle de pedidos e liberação dos PDFs na Área do Aluno. Para suporte ou solicitações, entre em contato pelo e-mail {settings.contactEmail} ou pelo nosso WhatsApp oficial.
        </p>
      </section>
    </main>
  );
}
