import React, { useState } from 'react';
import {
  GraduationCap,
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { buildWhatsAppUrl } from '../lib/commerce';
import type { AppView, StoreSettings } from '../types/store';

interface HeaderProps {
  settings: StoreSettings;
  currentPage: AppView['page'];
  activeCategory?: string;
  cartCount: number;
  wishlistCount: number;
  studentName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onNavigate: (view: AppView) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
}

const CATEGORY_PILLS: {
  label: string;
  view: AppView;
  matchKey: string;
}[] = [
  { label: 'Início', view: { page: 'home' }, matchKey: 'home' },
  { label: 'Todos os Recursos', view: { page: 'catalog' }, matchKey: 'catalog-all' },
  {
    label: 'Alfabetização',
    view: { page: 'catalog', initialCategory: 'Alfabetização' },
    matchKey: 'Alfabetização',
  },
  {
    label: 'Socioemocional',
    view: { page: 'catalog', initialCategory: 'Socioemocional' },
    matchKey: 'Socioemocional',
  },
  {
    label: 'Coordenação Motora',
    view: { page: 'catalog', initialCategory: 'Coordenação Motora' },
    matchKey: 'Coordenação Motora',
  },
  {
    label: 'Rotina Visual',
    view: { page: 'catalog', initialCategory: 'Rotina e Autonomia' },
    matchKey: 'Rotina e Autonomia',
  },
  {
    label: 'Planners da Prof',
    view: { page: 'catalog', initialCategory: 'Planners e Papelaria' },
    matchKey: 'Planners e Papelaria',
  },
  { label: 'Apostilas & PDFs', view: { page: 'apostilas' }, matchKey: 'apostilas' },
  { label: 'Sobre', view: { page: 'about' }, matchKey: 'about' },
  { label: 'Blog', view: { page: 'blog' }, matchKey: 'blog' },
  { label: 'Contato', view: { page: 'contact' }, matchKey: 'contact' },
];

export function Header({
  settings,
  currentPage,
  activeCategory,
  cartCount,
  wishlistCount,
  studentName,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onNavigate,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    'Olá, Prof! Estou navegando na loja e gostaria de atendimento.'
  );

  const handleSearchForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchQuery);
  };

  const isPillActive = (matchKey: string) => {
    if (matchKey === 'home') return currentPage === 'home';
    if (matchKey === 'apostilas') return currentPage === 'apostilas';
    if (matchKey === 'about') return currentPage === 'about';
    if (matchKey === 'blog') return currentPage === 'blog';
    if (matchKey === 'contact') return currentPage === 'contact';
    if (matchKey === 'catalog-all') {
      return currentPage === 'catalog' && (!activeCategory || activeCategory === 'Todas');
    }
    return currentPage === 'catalog' && activeCategory === matchKey;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md soft-header-shadow">
      {/* Main Row: Logo Left · Wide Rounded Search Center · Actions Right */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onNavigate({ page: 'home' });
          }}
          aria-label={`Ir para a página inicial da ${settings.storeName}`}
          className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6F4E42]"
        >
          <BrandMark storeName={settings.storeName} tagline="Recursos Pedagógicos" variant="compact" />
        </button>

        {/* Central Wide Rounded Search Bar (Desktop & Tablet) */}
        <form
          onSubmit={handleSearchForm}
          className="hidden md:flex flex-1 max-w-xl relative"
          role="search"
        >
          <label htmlFor="header-search-input" className="sr-only">
            Buscar recursos pedagógicos
          </label>
          <input
            id="header-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="O que você procura hoje? Ex: sílabas, emoções, planner..."
            className="w-full pl-5 pr-12 py-2.5 rounded-full bg-[#FDF8F5] border border-[#EFE4DE] text-sm text-[#3D2A24] placeholder:text-[#8C756D] focus:outline-none focus:border-[#E89EB8] focus:bg-white transition-colors"
          />
          <button
            type="submit"
            aria-label="Buscar no catálogo"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#FDEEF4] text-[#6F4E42] flex items-center justify-center hover:bg-[#FCE2EC] transition-colors"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        {/* Right Icon Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'aluno' })}
            aria-label="Área do Aluno"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
              currentPage === 'aluno'
                ? 'bg-[#6B4C8C] text-white border-[#6B4C8C]'
                : 'bg-[#F4EFFA] border-[#E8DDF6] text-[#6B4C8C] hover:bg-[#E8DDF6]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{studentName ? studentName.split(' ')[0] : 'Área do Aluno'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            aria-label="Conta e Área Admin"
            title="Conta / Área Admin"
            className="hidden sm:inline-flex w-10 h-10 rounded-full bg-[#FDF8F5] border border-[#EFE4DE] text-[#6F4E42] items-center justify-center hover:bg-[#F4EFFA] transition-colors"
          >
            <User className="w-4 h-4" aria-hidden="true" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp da Prof"
            title="WhatsApp da Prof"
            className="hidden sm:inline-flex w-10 h-10 rounded-full bg-[#FDEEF4] border border-[#F6DCE6] text-[#6F4E42] items-center justify-center hover:bg-[#FCE2EC] transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label={`Ver favoritos (${wishlistCount})`}
            title="Meus favoritos"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6F2FC] text-[#3B6E9C] inline-flex items-center justify-center hover:bg-[#D5E9FA] transition-colors"
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E89EB8] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Abrir sacola de compras com ${cartCount} itens`}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#6F4E42] text-white text-xs sm:text-sm font-semibold hover:bg-[#573B30] transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sacola</span>
            <span className="tabular-nums text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu e busca'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-9 h-9 rounded-full border border-[#EFE4DE] bg-[#FDF8F5] text-[#3D2A24] inline-flex items-center justify-center shrink-0"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Secondary Pastel Pink Category Pill Bar (Desktop / Tablet) */}
      <nav
        aria-label="Categorias e páginas"
        className="hidden md:block bg-[#FDEEF4] border-y border-[#F6DCE6]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_PILLS.map((pill) => {
            const active = isPillActive(pill.matchKey);
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => onNavigate(pill.view)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#6F4E42] text-white shadow-xs'
                    : 'bg-white/85 text-[#6F4E42] hover:bg-white hover:shadow-xs'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Dropdown: Search + Pastel Pills */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FDEEF4] border-y border-[#F6DCE6] px-4 py-3 space-y-3">
          <form
            onSubmit={(e) => {
              handleSearchForm(e);
              setMobileMenuOpen(false);
            }}
            className="relative"
          >
            <label htmlFor="mobile-search-input" className="sr-only">
              Buscar produto
            </label>
            <input
              id="mobile-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar recursos pedagógicos..."
              className="w-full pl-4 pr-10 py-2 rounded-full bg-white border border-[#F6DCE6] text-sm text-[#3D2A24]"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#6F4E42]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PILLS.map((pill) => {
              const active = isPillActive(pill.matchKey);
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(pill.view);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    active ? 'bg-[#6F4E42] text-white' : 'bg-white text-[#6F4E42]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate({ page: 'aluno' });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                currentPage === 'aluno'
                  ? 'bg-[#6B4C8C] text-white'
                  : 'bg-[#F4EFFA] text-[#6B4C8C] border border-[#E8DDF6]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{studentName ? studentName.split(' ')[0] : 'Área do Aluno'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
