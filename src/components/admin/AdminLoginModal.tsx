import React, { useState } from 'react';
import { Loader2, Lock, X } from 'lucide-react';
import { BrandEmblem } from '../BrandMark';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginCredentials: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; note?: string; error?: string }>;
  onLoginGoogle: () => Promise<{ ok: boolean; error?: string }>;
  onSuccess: (note?: string) => void;
}

export function AdminLoginModal({
  open,
  onClose,
  onLoginCredentials,
  onLoginGoogle,
  onSuccess,
}: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await onLoginCredentials(email, password);
      if (res.ok) {
        onSuccess(res.note);
      } else {
        setError(res.error || 'Falha na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await onLoginGoogle();
      if (res.ok) {
        onSuccess();
      } else {
        setError(res.error || 'Não foi possível entrar com o Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D2A24]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Acesso à Área Administrativa"
    >
      <div className="w-full max-w-md bg-white border border-[#EFE4DE] rounded-3xl p-6 sm:p-8 soft-card-shadow space-y-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela de login administrativo"
          className="absolute top-5 right-5 p-2 rounded-full text-[#725B53] hover:text-[#3D2A24] hover:bg-[#FDF8F5] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <BrandEmblem size={44} />
          <div>
            <h2 className="font-display text-xl font-bold text-[#3D2A24]">
              Área Administrativa
            </h2>
            <p className="text-xs text-[#725B53]">
              Gestão de vitrine, PDV, pedidos e configurações
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adm-email" className="block text-xs font-semibold text-[#3D2A24] mb-1">
              E-mail de acesso
            </label>
            <input
              id="adm-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@x.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
            />
          </div>

          <div>
            <label htmlFor="adm-pass" className="block text-xs font-semibold text-[#3D2A24] mb-1">
              Senha
            </label>
            <input
              id="adm-pass"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Entrar no Painel</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#FAF3EE] space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className="w-full px-4 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
          >
            Entrar com Google (Firebase Auth)
          </button>
        </div>
      </div>
    </div>
  );
}
