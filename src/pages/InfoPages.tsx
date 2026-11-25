import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SafeImage } from '../components/SafeImage';
import { BLOB_ASSETS } from '../data/assets';
import { DEFAULT_ABOUT_TEXT } from '../data/defaults';

export function AboutPage() {
  const { navigate, settings } = useStore();

  const title = settings.aboutTitle || 'Quem sou eu – Professora Lilian';
  const subtitle =
    settings.aboutSubtitle ||
    'Educadora apaixonada pelo universo da aprendizagem e pelo desenvolvimento infantil.';
  const photoUrl = settings.aboutPhotoUrl || BLOB_ASSETS.lilianPhoto;
  const fullText = settings.aboutText || DEFAULT_ABOUT_TEXT;
  const credentials = settings.aboutCredentials || [];

  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`}`;

  const pillStyles = [
    'bg-[#FFF5FA] border-[#F8BBD7]',
    'bg-[#F2FAFE] border-[#BEE6FB]',
    'bg-[#FFFBEA] border-[#FAD663]',
    'bg-[#F7F4FD] border-[#D7CBFA]',
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
      {/* Top playful banner */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="playful-dots rounded-[2.25rem] border-2 border-[#FCE1EE] overflow-hidden shadow-sm relative"
      >
        <div className="h-2.5 w-full bg-gradient-to-r from-[#F67BB4] via-[#FAD663] via-[#7ED082] to-[#6BBEEB]" />
        <div className="px-6 sm:px-10 py-8 sm:py-10 text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border-2 border-[#F8BBD7] text-xs font-bold uppercase tracking-[0.14em] text-[#E05899] shadow-xs">
            <Heart className="w-3.5 h-3.5" />
            <span>Quem sou eu</span>
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A2E45] text-balance leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-[#675975] font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </motion.section>

      {/* Main Portrait + Full Biography Card */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-white rounded-[2.25rem] border-2 border-[#FCE1EE] p-6 sm:p-10 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Portrait Frame - 3:4 complete view without cropping */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="playful-dots rounded-[2rem] p-4 border-2 border-[#F8BBD7] shadow-sm">
              <div className="w-full aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-white border border-[#FCE1EE] flex items-center justify-center">
                <SafeImage
                  src={photoUrl}
                  alt={title}
                  className="w-full h-full object-contain object-center"
                />
              </div>
              <div className="mt-4 bg-white/95 rounded-2xl p-3.5 border border-[#FCE1EE] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCE6F1] flex items-center justify-center text-[#E05899] shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#3A2E45] truncate">
                    Professora Lilian
                  </p>
                  <p className="text-xs text-[#675975]">
                    Pedagoga · Alfabetização, Letramento e Libras
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials Badges */}
            {credentials.length > 0 && (
              <div className="space-y-2.5">
                {credentials.map((cred, idx) => (
                  <div
                    key={`${cred}-${idx}`}
                    className={`rounded-2xl px-4 py-3 border-2 flex items-start gap-2.5 shadow-xs ${pillStyles[idx % pillStyles.length]}`}
                  >
                    <Star className="w-4 h-4 text-[#E05899] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-semibold text-[#3A2E45] leading-snug">
                      {cred}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Story Content */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {paragraphs.map((para, idx) => {
                const isGreeting = idx === 0;
                const isSignature =
                  para === 'Com carinho,' ||
                  para === 'Professora Lilian' ||
                  para.toLowerCase().startsWith('com carinho');

                if (isGreeting) {
                  return (
                    <div
                      key={idx}
                      className="rounded-3xl bg-[#FFF5FA] border-2 border-[#F8BBD7] p-5 text-[#3A2E45]"
                    >
                      <p className="font-display text-lg sm:text-xl font-bold leading-relaxed flex items-start gap-2.5">
                        <Sparkles className="w-5 h-5 text-[#E05899] shrink-0 mt-1" />
                        <span>{para}</span>
                      </p>
                    </div>
                  );
                }

                if (isSignature) {
                  return (
                    <p
                      key={idx}
                      className={
                        para === 'Professora Lilian'
                          ? 'font-display text-xl font-bold text-[#E05899] pt-1'
                          : 'text-sm font-semibold text-[#675975] italic pt-2'
                      }
                    >
                      {para}
                    </p>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="text-sm sm:text-[15px] text-[#4E405D] leading-relaxed"
                  >
                    {para}
                  </p>
                );
              })}
            </div>

            <div className="pt-4 border-t-2 border-[#FCE1EE] flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('catalog')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-pink text-sm font-display font-bold cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Conhecer Apostilas PDF</span>
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-coral text-sm font-display font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com a Prof. Lilian</span>
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border-2 border-[#F8BBD7] space-y-2 shadow-sm">
          <Heart className="w-6 h-6 text-[#E05899]" />
          <h2 className="font-display text-lg font-bold text-[#3A2E45]">
            Educação Individualizada
          </h2>
          <p className="text-xs text-[#675975] leading-relaxed">
            Cada criança possui seu próprio ritmo, habilidades e particularidades. Materiais pensados para acolher e incentivar.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border-2 border-[#BEE6FB] space-y-2 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-[#2D8EC4]" />
          <h2 className="font-display text-lg font-bold text-[#3A2E45]">
            Prática Pedagógica Real
          </h2>
          <p className="text-xs text-[#675975] leading-relaxed">
            Mais de oito anos atuando na Educação Infantil, Ensino Fundamental, aulas particulares e espaço pedagógico infantil.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border-2 border-[#D7CBFA] space-y-2 shadow-sm">
          <FileText className="w-6 h-6 text-[#7C62CA]" />
          <h2 className="font-display text-lg font-bold text-[#3A2E45]">
            100% Digital em PDF
          </h2>
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
