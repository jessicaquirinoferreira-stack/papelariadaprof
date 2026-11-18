import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Ocorreu um erro inesperado ao carregar esta seção.',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#EFE4DE] rounded-3xl p-8 text-center soft-card-shadow">
            <h1 className="font-display text-xl font-bold text-[#3D2A24]">
              Algo saiu do previsto
            </h1>
            <p className="mt-2 text-sm text-[#725B53] leading-relaxed">
              Nosso ateliê digital encontrou uma instabilidade pontual. Tente recarregar a página.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2.5 rounded-xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
