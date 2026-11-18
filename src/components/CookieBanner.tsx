import React, { useState } from 'react';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'papelaria_prof_cookie_ok_v1';

export function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(COOKIE_KEY) !== '1';
    } catch {
      return false;
    }
  });

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de privacidade e cookies"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-40 sm:max-w-sm bg-white/96 backdrop-blur-md border border-[#EFE4DE] rounded-2xl p-4 soft-card-shadow flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-[#FEF8E8] text-[#6F4E42] flex items-center justify-center shrink-0">
        <Cookie className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs text-[#3D2A24] leading-relaxed">
          Usamos cookies para manter sua sacola e seus favoritos salvos com carinho durante a visita.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={accept}
            className="px-3.5 py-1.5 rounded-xl bg-[#6F4E42] text-white text-[11px] font-semibold hover:bg-[#573B30] transition-colors"
          >
            Entendi e aceito
          </button>
          <button
            type="button"
            onClick={accept}
            aria-label="Fechar aviso de cookies"
            className="p-1 text-[#725B53] hover:text-[#3D2A24]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
