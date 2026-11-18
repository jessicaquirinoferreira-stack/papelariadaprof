import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  HeartHandshake,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { formatCurrency } from '../lib/commerce';
import type {
  AppView,
  DigitalMaterial,
  Product,
  ResourceType,
  StoreSettings,
} from '../types/store';

interface HomePageProps {
  products: Product[];
  digitalMaterials: DigitalMaterial[];
  settings: StoreSettings;
  wishlist: string[];
  onNavigate: (view: AppView) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onAddMaterialToCart: (material: DigitalMaterial) => void;
  onToggleWishlist: (productId: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'slide-1',
    badge: 'Ateliê São José do Rio Preto · SP',
    scriptKicker: 'Feito com afeto & pedagogia',
    title: 'Recursos pedagógicos encantadores para transformar cada aula.',
    subtitle:
      'Kits plastificados, jogos de alfabetização e planners docentes prontos para usar em sala de aula, consultório ou em casa.',
    ctaLabel: 'Explorar Catálogo',
    ctaView: { page: 'catalog' } as AppView,
    image: '/src/assets/images/hero_pedagogico_1795023243781.jpg',
    alt: 'Mesa acolhedora com planner lilás da Papelaria da Prof, caneta dourada, blocos de letras em madeira e fichas de alfabetização',
  },
  {
    id: 'slide-2',
    badge: 'Psicopedagogia · Fono · T.O.',
    scriptKicker: 'Acolhimento terapêutico',
    title: 'Materiais sensoriais e emocionais com cores suaves.',
    subtitle:
      'Baralhos das emoções e quadros de rotina visual projetados sem sobrecarga sensorial para apoiar crianças típicas, TEA e TDAH.',
    ctaLabel: 'Ver Recursos Terapêuticos',
    ctaView: { page: 'catalog', initialResourceType: 'terapeutico' } as AppView,
    image: '/src/assets/images/prod_emocoes_terapeutico_1795023315726.jpg',
    alt: 'Baralho terapêutico das emoções em tons pastel com cavalete de madeira',
  },
  {
    id: 'slide-3',
    badge: 'Curadoria da Prof',
    scriptKicker: 'Qualidade artesanal',
    title: 'Prontos para durar o ano inteiro na rotina escolar.',
    subtitle:
      'Impressão em alta definição, plastificação rígida higienizável e envio cuidadoso pelos Correios para todo o Brasil.',
    ctaLabel: 'Conhecer Nossa História',
    ctaView: { page: 'about' } as AppView,
    image: '/src/assets/images/sobre_atelie_prof_1795023388525.jpg',
    alt: 'Ateliê da Papelaria da Prof em São José do Rio Preto com estantes de materiais pedagógicos',
  },
];

const FEATURED_CATEGORIES: {
  title: string;
  subtitle: string;
  badge: string;
  categoryFilter: string;
  resourceType?: ResourceType;
  cardBg: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    title: 'Alfabetização',
    subtitle: 'Fichas plastificadas, sílabas e letras móveis',
    badge: 'Mais pedidos',
    categoryFilter: 'Alfabetização',
    cardBg: 'bg-white',
    iconBg: 'bg-[#F4EFFA] text-[#6B4C8C]',
    icon: BookOpen,
  },
  {
    title: 'Recursos Terapêuticos',
    subtitle: 'Emoções, rotina visual, TEA e TDAH',
    badge: 'Clínica & Casa',
    categoryFilter: 'Todas',
    resourceType: 'terapeutico',
    cardBg: 'bg-white',
    iconBg: 'bg-[#E6F2FC] text-[#3B6E9C]',
    icon: HeartHandshake,
  },
  {
    title: 'Coordenação Motora',
    subtitle: 'Grafomotricidade e pranchas táteis',
    badge: 'Sensorial',
    categoryFilter: 'Coordenação Motora',
    cardBg: 'bg-white',
    iconBg: 'bg-[#FEF8E8] text-[#8B6215]',
    icon: Sparkles,
  },
  {
    title: 'Planners da Prof',
    subtitle: 'Planejamento docente e papelaria afetiva',
    badge: 'Edição 2026',
    categoryFilter: 'Planners e Papelaria',
    cardBg: 'bg-white',
    iconBg: 'bg-[#FDEEF4] text-[#8C4B68]',
    icon: Palette,
  },
];

const TESTIMONIALS = [
  {
    name: 'Profa. Camila Mendonça',
    role: 'Alfabetizadora · São José do Rio Preto - SP',
    tag: 'Alfabetização',
    quote:
      'Antes eu passava domingos recortando e plastificando atividades. Com o Kit de Alfabetização Silábica, ganhei 4 horas por semana no planejamento e meus alunos avançaram na leitura em menos de dois meses.',
  },
  {
    name: 'Dra. Beatriz Alencar',
    role: 'Fonoaudióloga Infantil · Clínica Falar Bem',
    tag: 'Rotina Visual',
    quote:
      'O Quadro de Rotina Visual Magnético transformou o acolhimento de crianças com TEA no consultório. A previsibilidade reduziu a resistência logo nas primeiras sessões.',
  },
  {
    name: 'Fernanda Rodrigues',
    role: 'Psicopedagoga Clínica · Ribeirão Preto - SP',
    tag: 'Socioemocional',
    quote:
      'Material impecável na espessura da plastificação e no capricho das cores suaves. Dá para sentir que foi pensado por quem entende a prática pedagógica de verdade.',
  },
];

export function HomePage({
  products,
  digitalMaterials,
  settings,
  wishlist,
  onNavigate,
  onQuickView,
  onAddToCart,
  onAddMaterialToCart,
  onToggleWishlist,
}: HomePageProps) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = HERO_SLIDES[slideIdx];
  const promoAndFeatured = products
    .filter((p) => p.active && (p.featured || (p.promoPrice && p.promoPrice < p.price)))
    .slice(0, 6);

  return (
    <div className="bg-[#FDF8F5]">
      {/* 1. Full-Width Pastel Boutique Hero Carousel (Cream Canvas) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className="relative rounded-3xl overflow-hidden soft-card-shadow border border-[#EFE4DE] bg-[#FAF3EE] min-h-[420px] sm:min-h-[470px] flex items-center">
          <img
            src={currentSlide.image}
            alt={currentSlide.alt}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#FDF8F5]/95 via-[#FDF8F5]/82 to-[#FDF8F5]/20 sm:to-transparent"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl p-7 pb-16 sm:p-14 space-y-5">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#FDEEF4] text-[#8C4B68] text-xs font-bold border border-[#F6DCE6]">
              {currentSlide.badge}
            </span>

            <div>
              <p className="font-script text-2xl sm:text-3xl text-[#6F4E42] leading-none mb-1">
                {currentSlide.scriptKicker}
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#3D2A24] leading-[1.12] [text-wrap:balance]">
                {currentSlide.title}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#5E4942] leading-relaxed max-w-lg">
              {currentSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate(currentSlide.ctaView)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors soft-card-shadow"
              >
                <span>{currentSlide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate({ page: 'catalog' })}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/95 text-[#6F4E42] border border-[#EFE4DE] text-sm font-semibold hover:bg-[#FDEEF4] transition-colors"
              >
                <span>Ver Toda a Loja</span>
              </button>
            </div>
          </div>

          {/* Carousel Arrows & Delicate Indicators */}
          <button
            type="button"
            onClick={() =>
              setSlideIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
            }
            aria-label="Slide anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 text-[#6F4E42] items-center justify-center soft-card-shadow hover:bg-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)}
            aria-label="Próximo slide"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 text-[#6F4E42] items-center justify-center soft-card-shadow hover:bg-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/85 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#EFE4DE]"
            role="tablist"
            aria-label="Slides em destaque"
          >
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={slideIdx === idx}
                aria-label={`Ir para slide ${idx + 1}`}
                onClick={() => setSlideIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  slideIdx === idx ? 'w-6 bg-[#6F4E42]' : 'w-2 bg-[#D8C7C0] hover:bg-[#B38ED9]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Soft Pastel Benefit Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 border border-[#EFE4DE] flex items-center gap-3.5 soft-card-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#FDEEF4] text-[#8C4B68] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#3D2A24]">
                Frete grátis acima de R$ {settings.freeShippingThreshold}
              </p>
              <p className="text-xs text-[#725B53]">Envio Correios PAC/SEDEX e retirada SJRP</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EFE4DE] flex items-center gap-3.5 soft-card-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#F4EFFA] text-[#6B4C8C] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#3D2A24]">
                Plastificação rígida durável
              </p>
              <p className="text-xs text-[#725B53]">Cantos arredondados e fáceis de higienizar</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EFE4DE] flex items-center gap-3.5 soft-card-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#FEF8E8] text-[#8B6215] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#3D2A24]">
                Parcelamento facilitado
              </p>
              <p className="text-xs text-[#725B53]">Em até 3x sem juros ou confirmação via WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pastel Pink Band: Explore by Area */}
      <section className="bg-[#FDEEF4] py-14 border-y border-[#F6DCE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="font-script text-2xl text-[#6F4E42] leading-none">
                Curadoria por objetivo
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24] mt-1">
                Explore por área de atuação
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog' })}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6F4E42] hover:underline self-start sm:self-auto"
            >
              <span>Ver todos os produtos</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.title}
                  type="button"
                  onClick={() =>
                    onNavigate({
                      page: 'catalog',
                      initialCategory: cat.categoryFilter,
                      initialResourceType: cat.resourceType || 'todos',
                    })
                  }
                  className={`${cat.cardBg} rounded-3xl p-6 text-left soft-card-shadow soft-card-shadow-hover border border-[#F6DCE6] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between gap-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.iconBg}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FDF8F5] text-[#6F4E42] text-[11px] font-semibold border border-[#EFE4DE]">
                      {cat.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#3D2A24]">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#725B53] mt-1 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. White Band: Featured & Promotional Product Grid */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="font-script text-2xl text-[#6F4E42] leading-none">
                Os queridinhos do ateliê
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24] mt-1">
                Destaques & Promoções da Prof
              </h2>
              <p className="text-sm text-[#725B53] mt-1">
                Recursos testados na prática para aulas e atendimentos encantadores.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog' })}
              className="px-5 py-2.5 rounded-full bg-[#FDEEF4] text-[#6F4E42] text-xs font-bold hover:bg-[#FCE2EC] transition-colors self-start sm:self-auto"
            >
              Abrir catálogo completo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {promoAndFeatured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                onOpenProduct={(slug) => onNavigate({ page: 'product', slug })}
                onQuickView={onQuickView}
                onAddToCart={(p) => onAddToCart(p)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3.5 Butter Cream Band: Exclusive Private Tutoring Apostilas & PDFs */}
      <section className="bg-[#FEF8E8] py-16 border-t border-[#F3E2B3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#8B6215] text-[11px] font-bold border border-[#F3E2B3]">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                Exclusivo Aula Particular · Download em PDF
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24] mt-1">
                Apostilas Exclusivas & PDFs na Área do Aluno
              </h2>
              <p className="text-sm text-[#725B53] max-w-2xl">
                Cadernos digitais de reforço e alfabetização. Compre pelo site, confirme no WhatsApp e baixe diretamente no seu painel de aluno.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => onNavigate({ page: 'apostilas' })}
                className="px-5 py-2.5 rounded-full bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
              >
                Ver todas as Apostilas
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'aluno' })}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#6B4C8C] border border-[#E8DDF6] text-xs font-bold hover:bg-[#F4EFFA] transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Acessar Área do Aluno</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {digitalMaterials.slice(0, 3).map((mat) => {
              const price =
                typeof mat.promoPrice === 'number' &&
                mat.promoPrice > 0 &&
                mat.promoPrice < mat.price
                  ? mat.promoPrice
                  : mat.price;
              return (
                <article
                  key={mat.id}
                  className="bg-white rounded-3xl p-5 border border-[#EFE4DE] soft-card-shadow flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#F4EFFA] text-[#6B4C8C] text-[11px] font-bold">
                        {mat.levelOrSubject}
                      </span>
                      <span className="text-[11px] font-semibold text-[#725B53]">
                        {mat.pagesCount} pág. PDF
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#3D2A24] leading-snug">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-[#725B53] line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#FAF3EE]">
                    <span className="font-display text-xl font-bold text-[#6F4E42] tabular-nums">
                      {formatCurrency(price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddMaterialToCart(mat)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Comprar PDF</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Soft Lilac Band: Story & Educator Testimonials */}
      <section className="bg-[#F4EFFA] py-16 border-t border-[#E8DDF6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl overflow-hidden soft-card-shadow border border-[#E8DDF6] grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 relative min-h-[300px] bg-[#FAF3EE]">
              <img
                src="/src/assets/images/sobre_atelie_prof_1795023388525.jpg"
                alt="Ateliê da Papelaria da Prof em São José do Rio Preto"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#F4EFFA] text-[#6B4C8C] text-xs font-bold">
                  De professora para quem educa e cuida
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24] [text-wrap:balance]">
                  Cada ficha e jogo nasce da vivência real de sala de aula.
                </h2>
                <p className="text-sm sm:text-base text-[#725B53] leading-relaxed">
                  Em São José do Rio Preto - SP, preparamos cada kit manualmente: impressão em alta definição, plastificação resistente e curadoria pedagógica testada com crianças.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#EFE4DE]">
                {TESTIMONIALS.map((item) => (
                  <blockquote
                    key={item.name}
                    className="rounded-2xl bg-[#FDF8F5] p-4 border border-[#EFE4DE] space-y-2.5"
                  >
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FDEEF4] text-[#8C4B68] text-[10px] font-bold">
                      {item.tag}
                    </span>
                    <p className="text-xs text-[#3D2A24] leading-relaxed">“{item.quote}”</p>
                    <footer className="text-[11px] text-[#725B53]">
                      <span className="font-bold text-[#6F4E42] block">{item.name}</span>
                      <span>{item.role}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'about' })}
                  className="px-5 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
                >
                  Conhecer nossa história
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'contact' })}
                  className="px-5 py-2.5 rounded-xl bg-[#FEF8E8] border border-[#F3E2B3] text-[#6F4E42] text-xs font-bold hover:bg-[#FDEFC8] transition-colors"
                >
                  Kits sob medida para escolas
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
