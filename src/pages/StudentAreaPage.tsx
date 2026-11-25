import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Download,
  ExternalLink,
  History,
  LogOut,
  Save,
  User as UserIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FIREBASE_AUTH_PROVIDERS_URL, FIREBASE_AUTH_SETTINGS_URL } from '../lib/firebase';
import { formatBRL, formatTimestamp, maskPhone } from '../lib/utils';
import { SafeImage } from '../components/SafeImage';

export function StudentAreaPage() {
  const {
    authReady,
    firebaseUser,
    studentProfile,
    studentMaterials,
    studentOrders,
    loginWithGoogle,
    registerStudent,
    loginStudentWithEmail,
    logout,
    updateStudentProfile,
    navigate,
    showToast,
  } = useStore();

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [dashTab, setDashTab] = useState<'materials' | 'history' | 'profile'>('materials');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [authError, setAuthError] = useState('');
  const [emailProviderDisabled, setEmailProviderDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Editable Profile fields
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (studentProfile) {
      setProfName(studentProfile.fullName || '');
      setProfPhone(studentProfile.phone || '');
    } else if (firebaseUser) {
      setProfName(firebaseUser.displayName || '');
    }
  }, [studentProfile, firebaseUser]);

  const [unauthorizedDomainHelp, setUnauthorizedDomainHelp] = useState(false);

  const handleAuthException = (err: unknown) => {
    const code = (err as { code?: string })?.code || '';
    setUnauthorizedDomainHelp(false);
    if (code === 'auth/unauthorized-domain') {
      setUnauthorizedDomainHelp(true);
      setAuthError(
        `O domínio "${window.location.hostname}" ainda não está nos Domínios Autorizados do Firebase para Login com Google. Adicione-o em 1 clique abaixo ou entre usando seu e-mail e senha!`
      );
      return;
    }
    if (code === 'auth/operation-not-allowed') {
      setEmailProviderDisabled(true);
      setAuthError(
        'O login por E-mail/Senha ainda não foi ativado no Console do Firebase. Ative em 1 clique no link abaixo ou entre instantaneamente com sua conta Google!'
      );
      return;
    }
    if (code === 'auth/email-already-in-use') {
      setAuthError('Este e-mail já está cadastrado. Faça login na aba "Entrar".');
      return;
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      setAuthError('E-mail ou senha incorretos. Verifique seus dados.');
      return;
    }
    if (code === 'auth/weak-password') {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setAuthError(err instanceof Error ? err.message : 'Não foi possível autenticar.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setEmailProviderDisabled(false);
    setSubmitting(true);
    try {
      await loginStudentWithEmail(loginEmail, loginPassword);
    } catch (err) {
      handleAuthException(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setEmailProviderDisabled(false);

    if (regName.trim().length < 2) {
      setAuthError('Digite seu nome completo.');
      return;
    }
    if (regPhone.replace(/\D/g, '').length < 10) {
      setAuthError('Informe seu telefone WhatsApp com DDD.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirm) {
      setAuthError('A confirmação de senha não confere.');
      return;
    }

    setSubmitting(true);
    try {
      await registerStudent({
        fullName: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
    } catch (err) {
      handleAuthException(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      handleAuthException(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateStudentProfile({
        fullName: profName,
        phone: profPhone,
      });
    } catch {
      showToast('Erro ao salvar dados do perfil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!authReady) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center text-sm font-medium text-[#675975]">
        Carregando Área do Aluno...
      </main>
    );
  }

  if (!firebaseUser) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-[2rem] p-7 sm:p-10 border-2 border-[#FCE1EE] shadow-sm space-y-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#9B82E6]" />
          <div className="text-center space-y-2 pt-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
              Portal Exclusivo
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3A2E45]">Área do Aluno</h1>
            <p className="text-sm text-[#675975]">
              Acesse ou crie sua conta para baixar suas apostilas e materiais digitais liberados.
            </p>
          </div>

          {/* Google 1-Click Sign-In */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-[#FFF9FB] border-2 border-[#BEE6FB] text-sm font-bold text-[#3A2E45] hover:bg-[#E8F6FE] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0 7.31 0 3.25 2.69 1.28 6.61l3.66 2.84C5.8 6.86 8.65 5 12 5z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#FBBC05" d="M4.94 14.55c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.53H1.28C.47 9.14 0 10.97 0 12.46s.47 3.32 1.28 4.93l3.66-2.84z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.35 0-6.2-1.86-7.06-4.45H1.28v2.84C3.25 21.31 7.31 24 12 24z" />
            </svg>
            <span>Entrar com Google (Acesso Instantâneo)</span>
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-[#675975]">
            <div className="h-px flex-1 bg-[#FCE1EE]" />
            <span>ou use seu e-mail</span>
            <div className="h-px flex-1 bg-[#FCE1EE]" />
          </div>

          {/* Auth Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#FFF9FB] rounded-2xl border-2 border-[#FCE1EE]">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authTab === 'login' ? 'bg-[#F67BB4] text-white shadow-xs' : 'text-[#675975]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authTab === 'register' ? 'bg-[#F67BB4] text-white shadow-xs' : 'text-[#675975]'
              }`}
            >
              Criar Cadastro
            </button>
          </div>

          {authError && (
            <div className="p-4 rounded-2xl bg-[#FFF0F5] border-2 border-[#F8BBD7] text-xs text-[#A82765] space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
              {emailProviderDisabled && (
                <a
                  href={FIREBASE_AUTH_PROVIDERS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold underline text-[#3A2E45]"
                >
                  <span>Ativar E-mail/Senha no Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {unauthorizedDomainHelp && (
                <a
                  href={FIREBASE_AUTH_SETTINGS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold underline text-[#3A2E45]"
                >
                  <span>Adicionar domínio em Domínios Autorizados no Firebase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">E-mail</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">Senha</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl candy-btn-purple text-sm font-bold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Entrando...' : 'Entrar na Área do Aluno'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex.: Ana Paula Ferreira"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(maskPhone(e.target.value))}
                    placeholder="(21) 99999-9999"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                    Senha *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                    Confirmar senha *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] focus:outline-none focus:ring-2 focus:ring-[#F67BB4]/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Criando cadastro...' : 'Concluir Cadastro'}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Student Header Banner */}
      <div className="playful-dots rounded-[2rem] p-6 sm:p-8 border-2 border-[#FCE1EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]" />
        <div className="pt-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
            Área do Aluno
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3A2E45] mt-1">
            Olá, {studentProfile?.fullName || firebaseUser.displayName || 'Aluna'}!
          </h1>
          <p className="text-xs text-[#675975] mt-1">
            {firebaseUser.email} {studentProfile?.phone ? `· ${studentProfile.phone}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border-2 border-[#FCE1EE] text-xs font-bold text-[#3A2E45] hover:bg-[#FCE6F1] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#E05899]" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Dashboard Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setDashTab('materials')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            dashTab === 'materials'
              ? 'candy-btn-purple'
              : 'bg-white text-[#3A2E45] border-2 border-[#FCE1EE] hover:bg-[#FCE6F1]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Minhas Apostilas ({studentMaterials.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setDashTab('history')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            dashTab === 'history'
              ? 'candy-btn-purple'
              : 'bg-white text-[#3A2E45] border-2 border-[#FCE1EE] hover:bg-[#FCE6F1]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico ({studentMaterials.length + studentOrders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setDashTab('profile')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            dashTab === 'profile'
              ? 'candy-btn-purple'
              : 'bg-white text-[#3A2E45] border-2 border-[#FCE1EE] hover:bg-[#FCE6F1]'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Meus Dados</span>
        </button>
      </div>

      {/* Tab 1: Unlocked PDFs */}
      {dashTab === 'materials' && (
        <section>
          {studentMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-[#FCE1EE] space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-3xl bg-[#FCE6F1] text-[#E05899] flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                  Nenhuma apostila liberada ainda
                </h2>
                <p className="text-sm text-[#675975] leading-relaxed">
                  Após comprar uma apostila exclusiva e confirmar o pedido no WhatsApp, a Papelaria da Prof libera o PDF imediatamente aqui para você baixar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('apostilas')}
                className="px-6 py-3 rounded-full candy-btn-yellow text-xs font-display font-bold cursor-pointer"
              >
                Ver Apostilas Disponíveis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentMaterials.map((grant) => (
                <article
                  key={grant.id}
                  className="soft-card rounded-3xl overflow-hidden border-2 border-[#FCE1EE] flex flex-col"
                >
                  <div className="h-2 bg-[#9B82E6]" />
                  <div className="aspect-[4/3] bg-[#FFF9FB] overflow-hidden">
                    <SafeImage
                      src={grant.coverUrl}
                      alt={grant.materialTitle}
                      fallbackTitle={grant.materialTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#E05899]">
                        {grant.category} · Liberado em {formatTimestamp(grant.unlockedAt)}
                      </p>
                      <h3 className="font-display text-lg font-bold text-[#3A2E45] mt-1">
                        {grant.materialTitle}
                      </h3>
                      {grant.orderRef && (
                        <p className="text-xs text-[#675975] mt-1">
                          Referência: {grant.orderRef}
                        </p>
                      )}
                    </div>

                    <a
                      href={grant.pdfUrl}
                      download={grant.pdfFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl candy-btn-purple text-xs font-bold"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Apostila PDF</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: History */}
      {dashTab === 'history' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#3A2E45] mb-4">
              Histórico de Materiais Recebidos
            </h2>
            {studentMaterials.length === 0 ? (
              <p className="text-sm text-[#675975]">Nenhum material recebido até o momento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#FCE1EE] text-[#675975]">
                      <th className="py-3 pr-4 font-bold">Material</th>
                      <th className="py-3 pr-4 font-bold">Categoria</th>
                      <th className="py-3 pr-4 font-bold">Data de Liberação</th>
                      <th className="py-3 text-right font-bold">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE1EE]">
                    {studentMaterials.map((g) => (
                      <tr key={g.id}>
                        <td className="py-3 pr-4 font-bold text-[#3A2E45]">{g.materialTitle}</td>
                        <td className="py-3 pr-4 text-[#675975]">{g.category}</td>
                        <td className="py-3 pr-4 font-mono tabular-nums text-[#675975]">
                          {formatTimestamp(g.unlockedAt)}
                        </td>
                        <td className="py-3 text-right">
                          <a
                            href={g.pdfUrl}
                            download={g.pdfFileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#9B82E6] font-bold hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#BEE6FB] shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#3A2E45] mb-4">
              Meus Pedidos no Site
            </h2>
            {studentOrders.length === 0 ? (
              <p className="text-sm text-[#675975]">Você ainda não realizou pedidos logada.</p>
            ) : (
              <div className="space-y-3">
                {studentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#FCE1EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#3A2E45]">
                        {ord.orderNumber} · {formatTimestamp(ord.createdAt)}
                      </p>
                      <p className="text-[#675975] mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono tabular-nums font-bold text-[#3A2E45]">
                        {formatBRL(ord.total)}
                      </span>
                      <span className="text-[#E05899] font-bold uppercase">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Editable Profile */}
      {dashTab === 'profile' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] max-w-2xl shadow-sm">
          <h2 className="font-display text-xl font-bold text-[#3A2E45] mb-6">
            Editar Dados do Perfil
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                required
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                E-mail cadastrado
              </label>
              <input
                type="email"
                disabled
                value={studentProfile?.email || firebaseUser.email || ''}
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB]/70 border-2 border-[#FCE1EE] text-sm text-[#675975]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={profPhone}
                onChange={(e) => setProfPhone(maskPhone(e.target.value))}
                placeholder="(21) 99999-9999"
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
