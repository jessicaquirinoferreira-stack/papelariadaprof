import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import type { ToastMessage } from '../hooks/useStore';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 bg-white border border-[#EFE4DE] soft-card-shadow rounded-2xl px-4 py-3 text-sm text-[#3D2A24]"
        >
          {toast.tone === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" aria-hidden="true" />
          )}
          {toast.tone === 'info' && (
            <Info className="w-4 h-4 text-[#6F4E42] shrink-0" aria-hidden="true" />
          )}
          {toast.tone === 'error' && (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1 font-medium">{toast.title}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificação"
            className="p-1 text-[#725B53] hover:text-[#3D2A24] rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
