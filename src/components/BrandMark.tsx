import React from 'react';

interface BrandMarkProps {
  storeName?: string;
  tagline?: string;
  variant?: 'compact' | 'full';
}

export function BrandEmblem({ size = 40 }: { size?: number }) {
  const logoUrl = '/images/logo-kawaii.png';
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 rounded-full flex items-center justify-center overflow-hidden bg-transparent"
    >
      <img
        src={logoUrl}
        alt="Papelaria da Prof"
        className="w-full h-full object-contain drop-shadow-xs"
      />
    </div>
  );
}

export function BrandMark({
  storeName = 'Papelaria da Prof',
  tagline = 'Recursos Pedagógicos',
  variant = 'compact',
}: BrandMarkProps) {
  const logoUrl = '/images/logo-kawaii.png';
  const sizeClass = variant === 'full' ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-11 sm:h-11';

  return (
    <div className="inline-flex items-center gap-2.5 sm:gap-3 text-left group">
      <div className={`relative shrink-0 rounded-full flex items-center justify-center overflow-hidden bg-transparent transition-transform duration-300 group-hover:scale-105 ${sizeClass}`}>
        <img
          src={logoUrl}
          alt={storeName}
          className="w-full h-full object-contain drop-shadow-sm filter contrast-105"
        />
      </div>
      <div className="leading-tight">
        <span className="font-display font-bold tracking-tight text-[#3D2A24] text-base sm:text-lg block">
          {storeName}
        </span>
        <span className="font-script text-sm sm:text-base font-bold text-[#6F4E42] block -mt-0.5">
          {tagline}
        </span>
      </div>
    </div>
  );
}
