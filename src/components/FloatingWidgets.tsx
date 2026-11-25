import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BLOB_ASSETS } from '../data/assets';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

const FAQ_OPTIONS = [
  {
    label: 'Horário de atendimento',
    query: 'Qual o horário de atendimento?',
  },
  {
    label: 'Formas de pagamento',
    query: 'Quais são as formas de pagamento?',
  },
  {
    label: 'Como funciona a Área do Aluno',
    query: 'Como funciona a Área do Aluno para baixar os PDFs?',
  },
  {
    label: 'Como recebo os PDFs?',
    query: 'Os materiais são enviados em PDF para imprimir?',
  },
];

export function FloatingWidgets() {
  const { settings, toasts, dismissToast } = useStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const assistantName = settings.assistantName || 'Prof. Lilian';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: `Oi! Eu sou a ${assistantName}. Como posso te ajudar hoje com nossos materiais pedagógicos em PDF? Escolha uma dúvida abaixo ou me envie uma mensagem!`,
    },
  ]);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`}`;

  const buildBotReply = (q: string): string => {
    const lower = q.toLowerCase();
    let answer = '';
    if (lower.includes('hor') || (lower.includes('funcion') && lower.includes('loja'))) {
      answer = `Nosso horário de atendimento é: ${settings.businessHours}.`;
    } else if (lower.includes('pag') || lower.includes('pix') || lower.includes('cart')) {
      answer =
        'Aceitamos Pix, Cartão de Crédito e Cartão de Débito. Ao finalizar seu pedido no site, enviamos o resumo direto para o nosso WhatsApp para concluir seu pagamento com segurança.';
    } else if (lower.includes('alun') || lower.includes('apostila') || lower.includes('baixar')) {
      answer =
        'É super simples! Você escolhe suas apostilas em PDF aqui no site, faz seu cadastro gratuito na Área do Aluno e, após a confirmação do pedido pelo WhatsApp, eu libero os arquivos na hora no seu painel para baixar e imprimir.';
    } else if (lower.includes('pdf') || lower.includes('imprim') || lower.includes('receb') || lower.includes('entreg')) {
      answer =
        'Todos os nossos materiais são 100% digitais em PDF de alta qualidade, prontos para você baixar e imprimir quantas vezes precisar na Área do Aluno — sem frete e sem espera!';
    } else {
      answer =
        'Que bom falar com você! Posso tirar dúvidas sobre horários, formas de pagamento, como baixar os PDFs e como funciona a Área do Aluno.';
    }
    return `${answer} Me chama no Instagram ou WhatsApp para atendimento personalizado!`;
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend ?? input).trim();
    if (!q) return;
    const reply = buildBotReply(q);
    setMessages((prev) => [...prev, { sender: 'user', text: q }, { sender: 'bot', text: reply }]);
    if (!textToSend) setInput('');
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-24 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border-2 text-sm ${
              t.type === 'error'
                ? 'bg-[#FFF5F7] border-[#F67BB4] text-[#9E2A63]'
                : 'bg-white border-[#BEE6FB] text-[#3A2E45]'
            }`}
          >
            <span>{t.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="p-1 text-[#675975] hover:text-[#3A2E45]"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Right Side Floating Social Buttons (Instagram + WhatsApp) */}
      <div className="fixed right-4 bottom-5 z-40 flex flex-col gap-3">
        <a
          href={settings.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram Papelaria da Prof"
          title="Instagram Papelaria da Prof"
          className="w-12 h-12 rounded-2xl bg-white border-2 border-[#F67BB4] text-[#E05899] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Papelaria da Prof"
          title="WhatsApp Papelaria da Prof"
          className="w-12 h-12 rounded-2xl bg-[#7ED082] text-white shadow-[0_4px_0_#59AB5E] hover:bg-[#70C474] hover:-translate-y-0.5 transition-all flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.31 20.62C8.76 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM17.75 16.03C17.51 16.71 16.54 17.28 16.01 17.37C15.52 17.46 14.88 17.53 12.71 16.63C10.02 15.52 8.29 12.79 8.15 12.61C8.02 12.43 7.06 11.16 7.06 9.85C7.06 8.54 7.75 7.9 8 7.63C8.24 7.36 8.53 7.29 8.71 7.29C8.89 7.29 9.07 7.29 9.23 7.3C9.4 7.31 9.63 7.23 9.85 7.77C10.08 8.33 10.64 9.69 10.71 9.83C10.78 9.97 10.83 10.14 10.73 10.33C10.64 10.52 10.59 10.64 10.45 10.8C10.31 10.97 10.16 11.17 10.03 11.3C9.89 11.44 9.75 11.59 9.91 11.87C10.07 12.14 10.63 13.06 11.46 13.8C12.53 14.75 13.42 15.05 13.7 15.19C13.97 15.33 14.13 15.31 14.29 15.12C14.46 14.94 14.99 14.3 15.18 14.02C15.36 13.74 15.55 13.79 15.81 13.88C16.07 13.97 17.44 14.65 17.72 14.79C18 14.93 18.19 15 18.25 15.12C18.32 15.23 18.32 15.79 17.75 16.03Z" />
          </svg>
        </a>
      </div>

      {/* Left Side Floating Virtual Assistant (Falar com a Prof · Prof. Lilian) */}
      <div className="fixed left-4 bottom-4 z-40 flex flex-col items-start gap-2.5">
        {chatOpen && (
          <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border-2 border-[#FCE1EE] overflow-hidden mb-1">
            <div className="bg-[#F67BB4] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-0.5 rounded-full bg-white">
                  <img
                    src={BLOB_ASSETS.assistant}
                    alt={assistantName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-contain rounded-full"
                  />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">
                    {assistantName}
                  </p>
                  <p className="text-[11px] text-white/90">Falar com a Prof · Atendimento Digital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-xl bg-white/25 text-white hover:bg-white/35 transition-colors"
                aria-label="Fechar chat da Prof. Lilian"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-72 overflow-y-auto space-y-3 bg-[#FFF9FB]">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#9B82E6] text-white rounded-br-sm'
                        : 'bg-white text-[#3A2E45] border border-[#FCE1EE] rounded-bl-sm shadow-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {FAQ_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSend(opt.query)}
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-[#FDECA8] text-[#3A2E45] hover:bg-[#FAD663] transition-colors font-semibold"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#FCE1EE]">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 px-3 rounded-xl candy-btn-coral text-[11px] font-bold"
                >
                  Chamar no WhatsApp
                </a>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 px-3 rounded-xl candy-btn-purple text-[11px] font-bold"
                >
                  Ir para Instagram
                </a>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-[#FCE1EE] flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua dúvida..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs text-[#3A2E45] placeholder:text-[#8E7FA0] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/40"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl candy-btn-pink"
                aria-label="Enviar mensagem"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={() => setChatOpen((prev) => !prev)}
          className="group flex items-center gap-2.5 pr-4 pl-1.5 py-1.5 rounded-full bg-white border-2 border-[#F67BB4] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
          aria-label={`Falar com a Prof - ${assistantName}`}
        >
          <span className="p-0.5 rounded-full bg-gradient-to-tr from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]">
            <img
              src={BLOB_ASSETS.assistant}
              alt={assistantName}
              referrerPolicy="no-referrer"
              className="w-11 h-11 object-contain rounded-full bg-white transition-transform group-hover:scale-105"
            />
          </span>
          <div className="text-left">
            <p className="font-display text-xs font-bold text-[#3A2E45] leading-tight">
              Falar com a Prof
            </p>
            <p className="text-[11px] text-[#E05899] font-semibold">{assistantName}</p>
          </div>
        </button>
      </div>
    </>
  );
}
