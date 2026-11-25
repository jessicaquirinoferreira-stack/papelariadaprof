import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Heart,
  HeartHandshake,
  MessageCircle,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PDF_CATEGORIES } from '../data/defaults';
import { formatBRL } from '../lib/utils';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { BLOB_ASSETS } from '../data/assets';

const TESTIMONIALS = [
  {
    name: 'Camila Andrade',
    role: 'Mãe do Pedro (2º ano) · Minas Gerais',
    accent: 'border-t-[#F67BB4]',
    quote:
      'As apostilas da Professora Lilian salvaram nossas tardes de estudo em casa! O PDF de Alfabetização para Anos Iniciais é super lúdico, organizado e meu filho pede para fazer as atividades.',
  },
  {
    name: 'Mariana Costa',
    role: 'Professora do 1º ao 5º ano · São Paulo',
    accent: 'border-t-[#6BBEEB]',
    quote:
      'Comprei o Combo de Português e os PDFs para Professoras, finalizei no WhatsApp e em minutos já estava baixando tudo na Área do Aluno. Prático para imprimir e aplicar em sala de aula.',
  },
  {
    name: 'Fernanda Oliveira',
    role: 'Professora Particular · Rio de Janeiro',
    accent: 'border-t-[#9B82E6]',
    quote:
      'Os materiais de Matemática do 1º ao 5º ano têm uma sequência didática maravilhosa e visual acolhedor. Ganho horas de preparo toda semana com os PDFs prontos da Prof. Lilian.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Como recebo minhas Apostilas e PDFs após a compra?',
    a: 'Assim que você finaliza o pedido no site e envia o resumo pelo WhatsApp, confirmamos o pagamento e liberamos o arquivo PDF diretamente na sua Área do Aluno. Você pode baixar e imprimir quantas vezes quiser.',
  },
  {
    q: 'Os materiais são enviados pelos Correios ou apenas em PDF?',
    a: 'Nossa loja trabalha exclusivamente com materiais 100% digitais em PDF de alta qualidade, prontos para você baixar e imprimir em casa ou na escola — sem frete e sem espera.',
  },
  {
    q: 'Quais turmas e conteúdos estão disponíveis no catálogo?',
    a: 'Temos quatro linhas principais: Alfabetização para Anos Iniciais, Português (1º ao 5º ano), Matemática (1º ao 5º ano) e PDF para Professoras com planejamentos e recursos de sala.',
  },
  {
    q: 'Quais são as formas de pagamento aceitas?',
    a: 'Aceitamos Pix, Cartão de Crédito em até 3x sem juros e Cartão de Débito, com confirmação humanizada e rápida diretamente pelo nosso WhatsApp.',
  },
];

const WELCOME_LETTERS = [
  { char: 'B', color: '#F267A8' },
  { char: 'E', color: '#6BBEEB' },
  { char: 'M', color: '#F5B727' },
  { char: '-', color: '#9B82E6' },
  { char: 'V', color: '#7ED082' },
  { char: 'I', color: '#F68967' },
  { char: 'N', color: '#F267A8' },
  { char: 'D', color: '#6BBEEB' },
  { char: 'O', color: '#9B82E6' },
  { char: 'S', color: '#7ED082' },
];

export function HomePage() {
  const { materials, settings, navigate, addToCart, categories: storeCategories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [homeSearch, setHomeSearch] = useState('');
  const [heroTabIndex, setHeroTabIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeMaterials = useMemo(() => materials.filter((m) => m.active), [materials]);

  const heroSpotlightItems = useMemo(() => {
    const picked = activeMaterials.filter((m) => m.featured).slice(0, 3);
    const source = picked.length > 0 ? picked : activeMaterials.slice(0, 3);
    return source.map((m) => ({
      item: m,
      imageUrl: m.coverUrl,
      tag: m.category,
    }));
  }, [activeMaterials]);

  const currentSpotlight = heroSpotlightItems[heroTabIndex] || heroSpotlightItems[0];

  const categories = useMemo(() => {
    const fromItems = Array.from(new Set(activeMaterials.map((m) => m.category)));
    const ordered = Array.from(new Set([...storeCategories, ...fromItems]));
    return ['Todas', ...ordered];
  }, [activeMaterials, storeCategories]);

  const filteredMaterials = useMemo(() => {
    const q = homeSearch.trim().toLowerCase();
    return activeMaterials
      .filter((m) => {
        const matchCat = selectedCategory === 'Todas' || m.category === selectedCategory;
        const matchQuery =
          !q ||
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q);
        return matchCat && matchQuery;
      })
      .slice(0, 6);
  }, [activeMaterials, selectedCategory, homeSearch]);

  const collections = useMemo(() => {
    const stripes = ['bg-[#F67BB4]', 'bg-[#6BBEEB]', 'bg-[#FAD663]', 'bg-[#9B82E6]', 'bg-[#7ED082]', 'bg-[#F68967]'];
    const borders = ['border-[#F8BBD7]', 'border-[#BEE6FB]', 'border-[#F7DF8A]', 'border-[#D7CBFA]', 'border-[#C8EAD0]', 'border-[#FAD2C7]'];
    const accentTexts = ['text-[#E05899]', 'text-[#2D8EC4]', 'text-[#B58209]', 'text-[#7C62CA]', 'text-[#419E46]', 'text-[#E05631]'];
    const images = [
      BLOB_ASSETS.apostilaLeitura,
      BLOB_ASSETS.apostilaRedacao,
      BLOB_ASSETS.apostilaMatematica,
      BLOB_ASSETS.prodPlanner,
      BLOB_ASSETS.apostilaLeitura,
      BLOB_ASSETS.apostilaRedacao,
    ];

    return storeCategories.map((cat, idx) => ({
      title: cat,
      category: cat,
      desc: `Recursos digitais e apostilas em PDF sobre ${cat}.`,
      image: images[idx % images.length],
      stripe: stripes[idx % stripes.length],
      border: borders[idx % borders.length],
      accentText: accentTexts[idx % accentTexts.length],
      count: activeMaterials.filter((m) => m.category === cat).length,
    }));
  }, [storeCategories, activeMaterials]);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`}`;

  return (
    <main>
      {/* PLAYFUL CANDY-PINK & RAINBOW HERO MATCHING REFERENCE LAYOUT */}
      <section className="relative bg-[#F67BB4] pt-4 pb-10 sm:py-8 overflow-hidden">
        {/* Decorative background floating stars & sparkles */}
        <div
          className="pointer-events-none absolute top-6 left-8 text-white/40 animate-float-slow"
          aria-hidden="true"
        >
          <Star className="w-7 h-7 fill-current" />
        </div>
        <div
          className="pointer-events-none absolute bottom-8 right-10 text-[#FAD663]/70 animate-float-slow"
          aria-hidden="true"
        >
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Inner Scalloped / Rounded Polka-Dot Showcase Canvas */}
          <div className="relative rounded-[2.25rem] playful-dots border-4 border-white shadow-[0_24px_48px_-16px_rgba(224,88,153,0.38)] overflow-hidden">
            {/* Soft top pink wave inside hero card */}
            <div className="h-3 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] via-[#7ED082] via-[#6BBEEB] to-[#9B82E6]" />

            <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Rainbow-Circular Emblem + Spotlight Switcher */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-3 flex flex-col items-center gap-5"
              >
                <div className="relative">
                  <div className="p-2 rounded-full bg-gradient-to-tr from-[#F67BB4] via-[#FAD663] via-[#7ED082] to-[#6BBEEB] shadow-lg">
                    <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-white flex items-center justify-center p-3 border-4 border-white overflow-hidden">
                      <SafeImage
                        src={BLOB_ASSETS.logo}
                        alt="Papelaria da Prof · Professora Lilian"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-[#FAD663] text-[#3A2E45] flex items-center justify-center shadow-md border-2 border-white animate-float-slow"
                    aria-hidden="true"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </span>
                  <span
                    className="absolute -bottom-1 -left-2 w-8 h-8 rounded-full bg-[#F267A8] text-white flex items-center justify-center shadow-md border-2 border-white"
                    aria-hidden="true"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </span>
                </div>

                {/* Quick Metric Strip */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[240px]">
                  <div className="rounded-2xl bg-[#FCE6F1] border border-[#F8BBD7] px-3 py-2 text-center">
                    <span className="font-mono tabular-nums text-sm font-bold text-[#E05899] block">
                      +1.400
                    </span>
                    <span className="text-[10px] font-semibold text-[#675975]">
                      Professoras
                    </span>
                  </div>
                  <div className="rounded-2xl bg-[#E8F6FE] border border-[#BEE6FB] px-3 py-2 text-center">
                    <span className="font-mono tabular-nums text-sm font-bold text-[#2D8EC4] block">
                      100% PDF
                    </span>
                    <span className="text-[10px] font-semibold text-[#675975]">
                      Pronto p/ imprimir
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Center Column: Sejam BEM-VINDOS Headline + Copy + Sunny Yellow CTA */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                className="lg:col-span-6 text-center flex flex-col items-center space-y-5"
              >
                <div className="bg-white/95 rounded-[2rem] px-6 py-6 sm:px-8 sm:py-7 border-2 border-[#FCE1EE] shadow-[0_14px_30px_-14px_rgba(224,88,153,0.22)] w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-[#F267A8] fill-[#F267A8]" />
                    <span className="font-display text-2xl sm:text-3xl font-bold text-[#3A2E45]">
                      Sejam
                    </span>
                    <Heart className="w-4 h-4 text-[#F267A8] fill-[#F267A8]" />
                  </div>

                  <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-wide leading-none flex flex-wrap justify-center gap-x-0.5 py-1">
                    {WELCOME_LETTERS.map((item, idx) => (
                      <span
                        key={`${item.char}-${idx}`}
                        style={{ color: item.color }}
                        className="inline-block drop-shadow-[0_2px_0_rgba(58,46,69,0.12)]"
                      >
                        {item.char}
                      </span>
                    ))}
                  </h1>

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B82E6] mt-2">
                    Papelaria da Prof · Professora Lilian
                  </p>

                  <p className="text-sm sm:text-base font-medium text-[#3A2E45] mt-3 leading-relaxed">
                    {settings.heroTitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[#675975] mt-1.5 leading-relaxed max-w-xl mx-auto">
                    {settings.heroSubtitle}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => navigate('catalog')}
                    className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full candy-btn-yellow text-xs sm:text-sm font-display font-bold uppercase tracking-wide cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>CLIQUE AQUI PARA VER NOSSOS PDFs!</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('student')}
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-full candy-btn-purple text-xs sm:text-sm font-display font-bold cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Área do Aluno</span>
                  </button>
                </div>

                {/* Compact Spotlight Quick-Shop Card inside Hero */}
                {currentSpotlight && (
                  <div className="w-full bg-white/95 rounded-3xl p-3.5 sm:p-4 border-2 border-[#BEE6FB] shadow-sm text-left space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#E05899]">
                        Destaque em PDF · {currentSpotlight.tag}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {heroSpotlightItems.map((spot, idx) => (
                          <button
                            key={spot.item.id}
                            type="button"
                            onClick={() => setHeroTabIndex(idx)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                              heroTabIndex === idx
                                ? 'bg-[#9B82E6] text-white'
                                : 'bg-[#FFF9FB] text-[#675975] border border-[#FCE1EE] hover:bg-[#FCE6F1]'
                            }`}
                          >
                            0{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <SafeImage
                        src={currentSpotlight.imageUrl}
                        alt={currentSpotlight.item.title}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-[#FFF9FB] border border-[#FCE1EE]"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-sm sm:text-base font-bold text-[#3A2E45] truncate">
                          {currentSpotlight.item.title}
                        </h2>
                        <p className="font-mono tabular-nums text-xs sm:text-sm font-bold text-[#E05899]">
                          {formatBRL(currentSpotlight.item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              id: currentSpotlight.item.id,
                              type: 'material',
                              title: currentSpotlight.item.title,
                              price: currentSpotlight.item.price,
                              imageUrl: currentSpotlight.imageUrl,
                              category: currentSpotlight.item.category,
                            })
                          }
                          className="px-4 py-2 rounded-xl candy-btn-coral text-xs font-bold cursor-pointer"
                        >
                          COMPRAR
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate('product', {
                              type: 'material',
                              id: currentSpotlight.item.id,
                            })
                          }
                          className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-[#FCE6F1] text-[#3A2E45] text-xs font-bold hover:bg-[#F8BBD7] transition-colors cursor-pointer"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Right Column: Friendly Prof. Lilian Character in Rainbow Arch */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                className="lg:col-span-3 flex flex-col items-center"
              >
                <div className="relative rounded-[2.25rem] bg-gradient-to-b from-[#BEE6FB]/65 via-[#FCE6F1] to-[#FDECA8]/65 p-4 border-4 border-white shadow-lg w-full max-w-[260px]">
                  <div className="w-full aspect-square flex items-center justify-center">
                    <SafeImage
                      src={BLOB_ASSETS.assistant}
                      alt="Professora Lilian · Papelaria da Prof"
                      className="w-full h-full object-contain drop-shadow-md animate-float-slow"
                    />
                  </div>
                  <div className="mt-2 bg-white rounded-2xl px-3.5 py-2 text-center border border-[#FCE1EE] shadow-xs">
                    <p className="font-display text-sm font-bold text-[#3A2E45]">
                      Prof. Lilian
                    </p>
                    <p className="text-[11px] font-medium text-[#E05899]">
                      Criadora dos PDFs Pedagógicos
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 4-Column Colorful Trust Strip */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border-2 border-[#FAD663] flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#FDECA8] text-[#B58209] flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#3A2E45]">100% Digital em PDF</p>
                <p className="text-xs text-[#675975]">Pronto para baixar e imprimir</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#D7CBFA] flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#EFEAFD] text-[#7C62CA] flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#3A2E45]">Área do Aluno</p>
                <p className="text-xs text-[#675975]">Seus PDFs sempre disponíveis</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#F9C6B6] flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#FDEAE3] text-[#DA6A48] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#3A2E45]">Pix & Parcelamento</p>
                <p className="text-xs text-[#675975]">Até 3x sem juros no cartão</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#B7E7BB] flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#EAF8EC] text-[#3F9145] flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#3A2E45]">Feito pela Prof. Lilian</p>
                <p className="text-xs text-[#675975]">Atendimento direto no WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scalloped Transition Wave below Hero */}
      <div className="w-full overflow-hidden leading-none bg-[#FFF9FB]">
        <svg
          viewBox="0 0 1200 22"
          preserveAspectRatio="none"
          className="w-full h-4 sm:h-5 block fill-[#F67BB4]"
          aria-hidden="true"
        >
          <path d="M0,0 L1200,0 L1200,6 C1160,20 1120,4 1080,14 C1040,22 1000,4 960,14 C920,22 880,4 840,14 C800,22 760,4 720,14 C680,22 640,4 600,14 C560,22 520,4 480,14 C440,22 400,4 360,14 C320,22 280,4 240,14 C200,22 160,4 120,14 C80,22 40,4 0,14 Z" />
        </svg>
      </div>

      {/* SECTION 1: 4 DEDICATED PDF CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
              Organizado por Etapa e Uso
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E45]">
              Escolha por Área de Aprendizado
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('catalog')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#BEE6FB] text-xs font-bold text-[#3A2E45] hover:bg-[#9BD6F9] transition-colors cursor-pointer"
          >
            <span>Ver todos os PDFs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((col, idx) => (
            <motion.button
              key={col.title}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              onClick={() => navigate('catalog', undefined, col.category)}
              className={`soft-card text-left rounded-3xl overflow-hidden border-2 ${col.border} flex flex-col group cursor-pointer`}
            >
              <div className={`h-2 w-full ${col.stripe}`} />
              <div className="aspect-[16/10] w-full bg-[#FFF9FB] overflow-hidden">
                <SafeImage
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-mono font-bold ${col.accentText}`}>
                    {col.count} {col.count === 1 ? 'material PDF' : 'materiais PDF'}
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#3A2E45] mt-0.5 group-hover:text-[#E05899] transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-xs text-[#675975] mt-1 leading-relaxed">{col.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3A2E45]">
                  <span>Abrir seção</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E05899] transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* SECTION 2: VITRINE DE APOSTILAS PDF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B82E6]">
              Biblioteca Digital Completa
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E45]">
              Apostilas e Materiais em PDF
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7D6A43] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                placeholder="Buscar apostila PDF..."
                className="pl-10 pr-4 py-2.5 rounded-full bg-[#FDECA8] border-2 border-[#FAD663] text-xs font-medium text-[#3A2E45] placeholder:text-[#7D6A43] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50 w-full sm:w-52"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'candy-btn-pink'
                      : 'bg-white text-[#675975] border-2 border-[#FCE1EE] hover:bg-[#FCE6F1] hover:text-[#3A2E45]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-[#FCE1EE] space-y-3 shadow-sm">
            <FileText className="w-8 h-8 text-[#F267A8] mx-auto" />
            <p className="font-display text-lg font-bold text-[#3A2E45]">
              Nenhum material em PDF encontrado para essa busca.
            </p>
            <button
              type="button"
              onClick={() => {
                setHomeSearch('');
                setSelectedCategory('Todas');
              }}
              className="px-5 py-2.5 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredMaterials.map((material) => (
              <ProductCard key={material.id} type="material" item={material} />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('catalog')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full candy-btn-yellow text-sm font-display font-bold cursor-pointer"
          >
            <span>Ver Catálogo Completo de PDFs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* SECTION 3: ÁREA DO ALUNO WORKFLOW */}
      <section className="playful-dots border-y-2 border-[#FCE1EE] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
                Praticidade Total
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E45] text-balance">
                Como funciona a entrega dos seus PDFs
              </h2>
              <p className="text-sm text-[#675975] leading-relaxed">
                Arquivos digitais em alta resolução prontos para imprimir e aplicar em sala de aula, aulas particulares ou reforço escolar em casa.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => navigate('student')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Acessar Área do Aluno</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#F8BBD7] shadow-sm space-y-2">
              <span className="inline-flex w-9 h-9 rounded-2xl bg-[#FCE6F1] text-[#E05899] font-mono text-xs font-bold items-center justify-center">
                01
              </span>
              <h3 className="font-display text-xl font-bold text-[#3A2E45]">
                Selecione seus PDFs
              </h3>
              <p className="text-xs sm:text-sm text-[#675975] leading-relaxed">
                Adicione as apostilas desejadas à sacola e conclua o pedido com envio automático do resumo para o WhatsApp da Prof. Lilian.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#BEE6FB] shadow-sm space-y-2">
              <span className="inline-flex w-9 h-9 rounded-2xl bg-[#E8F6FE] text-[#2D8EC4] font-mono text-xs font-bold items-center justify-center">
                02
              </span>
              <h3 className="font-display text-xl font-bold text-[#3A2E45]">
                Confirmação da Prof
              </h3>
              <p className="text-xs sm:text-sm text-[#675975] leading-relaxed">
                Após confirmar seu pagamento pelo WhatsApp, liberamos o material diretamente no seu cadastro sem custos de envio.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#D7CBFA] shadow-sm space-y-2">
              <span className="inline-flex w-9 h-9 rounded-2xl bg-[#EFEAFD] text-[#7C62CA] font-mono text-xs font-bold items-center justify-center">
                03
              </span>
              <h3 className="font-display text-xl font-bold text-[#3A2E45]">
                Acesso na Área do Aluno
              </h3>
              <p className="text-xs sm:text-sm text-[#675975] leading-relaxed">
                Entre no seu painel exclusivo a qualquer hora para baixar os PDFs liberados e imprimir sempre que precisar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
            Quem Usa Recomenda
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E45] text-balance">
            Resultados reais na rotina de mamães e professoras
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className={`bg-white rounded-3xl p-7 border-2 border-[#FCE1EE] border-t-4 ${t.accent} shadow-sm flex flex-col justify-between gap-5`}
            >
              <p className="text-sm text-[#3A2E45] leading-relaxed">“{t.quote}”</p>
              <div className="pt-4 border-t border-[#FCE1EE]">
                <p className="font-display text-base font-bold text-[#3A2E45]">{t.name}</p>
                <p className="text-xs text-[#675975]">{t.role}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* SECTION 5: QUEM SOU EU – PROFESSORA LILIAN & FAQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        {(() => {
          const aboutTitle = settings.aboutTitle || 'Quem sou eu – Professora Lilian';
          const aboutSubtitle =
            settings.aboutSubtitle ||
            'Educadora apaixonada pelo universo da aprendizagem e pelo desenvolvimento infantil.';
          const aboutPhoto = settings.aboutPhotoUrl || BLOB_ASSETS.lilianPhoto;
          const aboutParagraphs = (settings.aboutText || '')
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean);
          const previewParagraphs =
            aboutParagraphs.length > 3 ? aboutParagraphs.slice(0, 3) : aboutParagraphs;
          const credentials = settings.aboutCredentials || [];

          return (
            <div className="bg-white rounded-[2.25rem] border-2 border-[#FCE1EE] overflow-hidden shadow-sm relative">
              <div className="h-2 w-full bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]" />
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 p-6 sm:p-10 lg:p-12">
                {/* Portrait Column - Full photo completely visible */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full max-w-[340px] playful-dots p-3 sm:p-4 rounded-[2rem] border-2 border-[#F8BBD7] shadow-sm relative">
                    <div className="w-full aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-white border border-[#FCE1EE] flex items-center justify-center">
                      <SafeImage
                        src={aboutPhoto}
                        alt={aboutTitle}
                        className="w-full h-full object-contain object-center"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-[#E05899]">
                      <GraduationCap className="w-4 h-4" />
                      <span>Pedagoga · UNIRP · +8 anos de experiência</span>
                    </div>
                  </div>
                </div>

                {/* Biography & Credentials Column */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FCE6F1] border border-[#F8BBD7] text-xs font-bold uppercase tracking-[0.14em] text-[#E05899]">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Quem sou eu</span>
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E45] text-balance leading-tight">
                      {aboutTitle}
                    </h2>
                    {aboutSubtitle && (
                      <p className="text-sm sm:text-base font-semibold text-[#7C62CA]">
                        {aboutSubtitle}
                      </p>
                    )}
                  </div>

                  {credentials.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {credentials.slice(0, 4).map((cred, idx) => {
                        const colors = [
                          'bg-[#FFF5FA] border-[#F8BBD7] text-[#3A2E45]',
                          'bg-[#F2FAFE] border-[#BEE6FB] text-[#3A2E45]',
                          'bg-[#FFFBEA] border-[#FAD663] text-[#3A2E45]',
                          'bg-[#F7F4FD] border-[#D7CBFA] text-[#3A2E45]',
                        ];
                        return (
                          <div
                            key={`${cred}-${idx}`}
                            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-start gap-2 ${colors[idx % colors.length]}`}
                          >
                            <Star className="w-3.5 h-3.5 text-[#E05899] shrink-0 mt-0.5" />
                            <span>{cred}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-3 text-sm text-[#675975] leading-relaxed">
                    {previewParagraphs.length > 0 ? (
                      previewParagraphs.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))
                    ) : (
                      <p>
                        Cada apostila em PDF nasce da prática real em sala de aula e no acompanhamento escolar, unindo clareza didática e afeto.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('about')}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-pink text-sm font-bold cursor-pointer"
                    >
                      <span>Ler História Completa</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('catalog')}
                      className="px-6 py-3.5 rounded-2xl candy-btn-yellow text-sm font-bold cursor-pointer"
                    >
                      Explorar Apostilas PDF
                    </button>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-coral text-sm font-bold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Falar no WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Interactive FAQ Accordion */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-10 border-2 border-[#BEE6FB] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B82E6]">
                Dúvidas Frequentes
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A2E45] mt-1">
                Tudo sobre nossos PDFs e Área do Aluno
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('policies')}
              className="text-xs font-bold text-[#E05899] hover:text-[#3A2E45] transition-colors cursor-pointer"
            >
              Ler Políticas Completas →
            </button>
          </div>

          <div className="divide-y divide-[#FCE1EE]">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="font-display text-base sm:text-lg font-bold text-[#3A2E45]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#E05899] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm text-[#675975] leading-relaxed mt-3 pr-8"
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
