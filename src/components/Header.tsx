import React, { useState } from 'react';
import { Copy, Download, Instagram, Mail, Menu, MessageCircle, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageRoute } from '../types';
import { SafeImage } from './SafeImage';
import { BLOB_ASSETS } from '../data/assets';

export function Header() {
  const {
    route,
    navigate,
    cartCount,
    setCartOpen,
    settings,
    firebaseUser,
    searchQuery,
    setSearchQuery,
    showToast,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { label: string; target: PageRoute }[] = [
    { label: 'Início', target: 'home' },
    { label: 'Catálogo PDF', target: 'catalog' },
    { label: 'Apostilas', target: 'apostilas' },
    { label: 'Área do Aluno', target: 'student' },
    { label: 'Quem sou eu', target: 'about' },
    { label: 'Contato', target: 'contact' },
  ];

  const handleNav = (target: PageRoute) => {
    navigate(target);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('catalog');
  };

  const cleanWa = settings.whatsappNumber.replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`}`;

  return (
    <div className="relative z-40">
      {/* Top Candy Pink Strip with Social Circles + Login/Register CTA */}
      <div className="bg-[#F67BB4] text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
          {/* Left: Promo Coupon */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText('PROF10');
              showToast('Cupom PROF10 copiado! Use no checkout para 10% OFF.');
            }}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-white/95 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Cupom PROF10 · 10% OFF nos PDFs</span>
          </button>

          {/* Center: Green Pastel Social Circles matching the layout */}
          <div className="flex items-center gap-2 mx-auto md:mx-0">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="w-7 h-7 rounded-full bg-[#80C96A] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="w-7 h-7 rounded-full bg-[#80C96A] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
            <a
              href={`mailto:${settings.contactEmail}`}
              aria-label="E-mail"
              title={settings.contactEmail}
              className="w-7 h-7 rounded-full bg-[#80C96A] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right: Coral Login / Cadastre-se Pill */}
          <button
            type="button"
            onClick={() => handleNav('student')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F68967] hover:bg-[#EE7A56] text-white text-xs font-semibold shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>{firebaseUser ? 'Minha Área do Aluno' : 'Faça login ou cadastre-se'}</span>
          </button>
        </div>

        {/* Scalloped Paper Edge Bottom Divider */}
        <div className="w-full overflow-hidden leading-none text-[#F67BB4] bg-white">
          <svg
            viewBox="0 0 1200 18"
            preserveAspectRatio="none"
            className="w-full h-3 sm:h-4 block fill-[#F67BB4]"
            aria-hidden="true"
          >
            <path d="M0,0 L1200,0 L1200,6 C1160,16 1120,2 1080,10 C1040,18 1000,4 960,11 C920,17 880,3 840,10 C800,17 760,3 720,11 C680,18 640,4 600,10 C560,17 520,3 480,11 C440,18 400,3 360,10 C320,17 280,4 240,11 C200,18 160,3 120,10 C80,17 40,4 0,10 Z" />
          </svg>
        </div>
      </div>

      {/* Main Header: Yellow Search | Rainbow-Framed Logo | Purple Download + Coral Cart */}
      <header className="sticky top-0 z-40 playful-dots border-b border-[#FCE1EE] shadow-[0_6px_24px_-12px_rgba(242,103,168,0.2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Left Zone: Butter-Yellow Search Bar (Desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center flex-1 max-w-xs relative"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Faça sua busca aqui"
                aria-label="Faça sua busca aqui"
                className="w-full pl-4 pr-11 py-2.5 rounded-full bg-[#FDECA8] border-2 border-[#FAD663] text-sm text-[#3A2E45] placeholder:text-[#7D6A43] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50 shadow-xs"
              />
              <button
                type="submit"
                aria-label="Buscar materiais"
                className="absolute right-2.5 w-7 h-7 rounded-full bg-[#FAD663] text-[#3A2E45] hover:bg-[#F67BB4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Center Zone: Rainbow-Halo Official Logo */}
            <button
              type="button"
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F67BB4] rounded-full group cursor-pointer"
              aria-label={settings.storeName}
            >
              <span className="p-1 rounded-full bg-gradient-to-tr from-[#F67BB4] via-[#FAD663] to-[#6BBEEB] shadow-md group-hover:scale-105 transition-transform">
                <span className="block bg-white rounded-full p-1">
                  <SafeImage
                    src={BLOB_ASSETS.logo}
                    alt={settings.storeName}
                    fallbackTitle={settings.storeName}
                    className="h-12 sm:h-14 w-auto object-contain"
                  />
                </span>
              </span>
              <span className="hidden sm:block text-left">
                <span className="font-display text-lg font-bold text-[#3A2E45] block leading-tight">
                  Papelaria da Prof
                </span>
                <span className="text-[11px] font-semibold text-[#E05899] block">
                  Por Prof. Lilian
                </span>
              </span>
            </button>

            {/* Right Zone: Purple "Fazer download" + Coral "Sua sacola" */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleNav('student')}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl candy-btn-purple text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5" />
                </span>
                <span>Fazer download</span>
              </button>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl candy-btn-coral text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Abrir sacola de compras"
              >
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline">Sua sacola</span>
                <span className="font-mono tabular-nums bg-white text-[#DA6A48] px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {cartCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2.5 rounded-2xl bg-[#FCE6F1] text-[#3A2E45] hover:bg-[#F67BB4] hover:text-white transition-colors"
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Sky-Blue Floating Navigation Pill Bar (Desktop) */}
          <div className="hidden lg:flex justify-center mt-3">
            <nav
              className="inline-flex items-center gap-6 px-8 py-2 rounded-full bg-[#BEE6FB] border-2 border-white shadow-sm"
              aria-label="Navegação principal"
            >
              {navItems.map((item) => {
                const active = route === item.target;
                return (
                  <button
                    key={item.target}
                    type="button"
                    onClick={() => handleNav(item.target)}
                    className={`text-sm font-display font-semibold whitespace-nowrap shrink-0 pb-0.5 border-b-2 transition-colors cursor-pointer ${
                      active
                        ? 'text-[#3A2E45] border-[#E05899]'
                        : 'text-[#3A2E45]/80 border-transparent hover:text-[#E05899]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Dropdown Navigation + Search */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#FCE1EE] px-4 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Faça sua busca aqui"
                className="w-full pl-4 pr-11 py-2.5 rounded-full bg-[#FDECA8] border-2 border-[#FAD663] text-sm text-[#3A2E45] placeholder:text-[#7D6A43] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FAD663] text-[#3A2E45] flex items-center justify-center"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const active = route === item.target;
                return (
                  <button
                    key={item.target}
                    type="button"
                    onClick={() => handleNav(item.target)}
                    className={`text-left px-4 py-3 rounded-2xl text-sm font-display font-semibold transition-colors ${
                      active
                        ? 'bg-[#BEE6FB] text-[#3A2E45]'
                        : 'bg-[#FFF9FB] text-[#675975] hover:bg-[#FCE6F1]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleNav('student')}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl candy-btn-purple text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Fazer download (Área do Aluno)</span>
            </button>
          </div>
        )}
      </header>
    </div>
  );
}
