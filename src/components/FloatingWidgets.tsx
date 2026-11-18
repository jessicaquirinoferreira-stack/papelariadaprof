import React, { useState } from 'react';
import { MessageCircle, Instagram, Sparkles, X, ChevronRight, HelpCircle, Send } from 'lucide-react';
import type { StoreSettings } from '../types/store';

interface FloatingWidgetsProps {
  settings: StoreSettings;
  onNavigate: (view: any) => void;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

export const FloatingWidgets: React.FC<FloatingWidgetsProps> = ({ settings, onNavigate }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Olá! Sou a Profª Bia, assistente virtual da Papelaria da Prof. Como posso te ajudar hoje com nossos recursos pedagógicos?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickQuestions = [
    'Qual o prazo de envio e frete?',
    'Como funcionam as apostilas em PDF?',
    'Onde fica a loja física / retirada?',
    'Falar direto com a Prof no WhatsApp',
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputValue.trim();
    if (!q) return;

    const userMsg: ChatMessage = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // Bot response logic
    setTimeout(() => {
      let botReply = 'Adorei sua dúvida! Para atendimento personalizado, orçamentos para escolas ou dúvidas sobre materiais, chame a Prof no WhatsApp.';
      const lower = q.toLowerCase();

      if (lower.includes('envio') || lower.includes('frete') || lower.includes('correios') || lower.includes('prazo')) {
        botReply = 'Enviamos nossos recursos plastificados em até 2 dias úteis via Correios (PAC ou SEDEX) para todo o Brasil. Moradores de São José do Rio Preto - SP também podem retirar grátis no ateliê!';
      } else if (lower.includes('pdf') || lower.includes('apostila') || lower.includes('digital') || lower.includes('aluno')) {
        botReply = 'Nossas apostilas e PDFs exclusivos são comprados no site, com confirmação rápida via WhatsApp e liberados na hora para download direto na sua Área do Aluno!';
      } else if (lower.includes('loja') || lower.includes('rio preto') || lower.includes('onde fica') || lower.includes('retirada')) {
        botReply = 'Estamos localizados em São José do Rio Preto - SP! Atendemos professores, terapeutas e escolas de todo o Brasil e oferecemos retirada com horário agendado.';
      } else if (lower.includes('whatsapp') || lower.includes('falar') || lower.includes('atendimento')) {
        window.open(`https://wa.me/${settings.whatsappNumber}?text=Olá,%20Prof!%20Vim%20pelo%20chat%20do%20site%20e%20gostaria%20de%20atendimento.`, '_blank');
        botReply = 'Abrindo o WhatsApp da Prof para você conversar diretamente com nossa equipe!';
      } else if (lower.includes('instagram') || lower.includes('insta') || lower.includes('fotos')) {
        window.open('https://www.instagram.com/papelaria.da.prof/', '_blank');
        botReply = 'Abrindo nosso perfil no Instagram para você ver os bastidores e vídeos dos recursos!';
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 500);
  };

  return (
    <>
      {/* RIGHT SIDE: Official WhatsApp & Instagram Floating Buttons */}
      <div className="fixed right-5 bottom-6 z-40 flex flex-col gap-3 items-end">
        <a
          href={`https://wa.me/${settings.whatsappNumber}?text=Olá,%20Prof!%20Estou%20no%20site%20e%20gostaria%20de%20atendimento.`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group relative"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-white" />
          <span className="absolute right-16 bg-[#3D2A24] text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none font-medium">
            Falar no WhatsApp
          </span>
        </a>

        <a
          href="https://www.instagram.com/papelaria.da.prof/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group relative"
          aria-label="Seguir no Instagram"
        >
          <Instagram className="w-7 h-7" />
          <span className="absolute right-16 bg-[#3D2A24] text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none font-medium">
            @papelaria.da.prof
          </span>
        </a>
      </div>

      {/* LEFT SIDE: Virtual Assistant Floating Widget */}
      <div className="fixed left-5 bottom-6 z-40 flex flex-col items-start">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="group flex items-center gap-3 bg-white hover:bg-[#FDF8F5] border border-[#EED7C5] p-2 pr-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105"
            aria-label="Abrir assistente virtual Profª Bia"
          >
            <div className="relative w-12 h-12 rounded-full bg-[#FDEEF4] flex items-center justify-center overflow-hidden border-2 border-[#D8A7B1] shadow-sm">
              <img
                src="/images/assistente-bia.png"
                alt="Profª Bia"
                className="w-10 h-10 object-contain mt-1"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#6F4E42] flex items-center gap-1">
                Profª Bia <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <div className="text-[11px] text-[#3D2A24]/70 font-medium">
                Tire suas dúvidas aqui!
              </div>
            </div>
          </button>
        ) : (
          <div className="w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-[#EED7C5] overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="bg-[#6F4E42] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[#FDEEF4] flex items-center justify-center overflow-hidden border-2 border-white/80 shadow-sm">
                  <img
                    src="/images/assistente-bia.png"
                    alt="Profª Bia"
                    className="w-9 h-9 object-contain mt-1"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    Profª Bia <span className="text-[10px] bg-amber-400 text-[#3D2A24] px-1.5 py-0.5 rounded-full font-bold">Ativa</span>
                  </div>
                  <div className="text-[11px] text-white/80">Assistente Papelaria da Prof</div>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label="Fechar assistente"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="p-3.5 h-[280px] overflow-y-auto flex flex-col gap-2.5 bg-[#FDF8F5]/50 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-[#6F4E42] text-white rounded-br-none'
                        : 'bg-white text-[#3D2A24] border border-[#EED7C5] rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Suggestions */}
            <div className="p-2 bg-white border-t border-[#F2E5DC] flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-[11px] bg-[#FDEEF4] hover:bg-[#f6d7e4] text-[#6F4E42] font-medium px-2.5 py-1 rounded-full transition-colors text-left flex items-center gap-1"
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3 h-3 text-[#6F4E42]/60" />
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="p-2.5 bg-white border-t border-[#EED7C5] flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua dúvida..."
                className="flex-1 bg-[#FDF8F5] border border-[#EED7C5] rounded-xl px-3 py-2 text-xs text-[#3D2A24] focus:outline-none focus:ring-2 focus:ring-[#6F4E42]/30"
              />
              <button
                onClick={() => handleSend()}
                className="w-9 h-9 bg-[#6F4E42] hover:bg-[#5a3f36] text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                aria-label="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Social Shortcuts at Footer */}
            <div className="bg-[#FDF8F5] p-2 px-3 border-t border-[#EED7C5] flex items-center justify-between text-[11px] text-[#6F4E42]">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold flex items-center gap-1 hover:underline text-emerald-700"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> WhatsApp
              </a>
              <span className="text-[#3D2A24]/30">|</span>
              <a
                href="https://www.instagram.com/papelaria.da.prof/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold flex items-center gap-1 hover:underline text-pink-700"
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
