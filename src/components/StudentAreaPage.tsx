import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  UserPlus,
  X,
} from 'lucide-react';
import { buildWhatsAppUrl, formatCpf, formatPhoneBr } from '../lib/commerce';
import type { StudentRegistrationInput } from '../hooks/useStore';
import type {
  AppView,
  StoreSettings,
  StudentMaterialGrant,
  StudentProfile,
} from '../types/store';

interface StudentAreaPageProps {
  currentStudent: StudentProfile | null;
  grants: StudentMaterialGrant[];
  settings: StoreSettings;
  onRegisterStudent: (input: StudentRegistrationInput) => Promise<{ ok: boolean; error?: string }>;
  onLoginStudent: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onLoginGoogle: () => Promise<{ ok: boolean; error?: string }>;
  onUpdateProfile: (profile: StudentProfile) => Promise<{ ok: boolean }>;
  onRefreshGrants: (student: StudentProfile | null) => Promise<void>;
  onLogout: () => Promise<void>;
  onNavigate: (view: AppView) => void;
}

export function StudentAreaPage({
  currentStudent,
  grants,
  settings,
  onRegisterStudent,
  onLoginStudent,
  onLoginGoogle,
  onUpdateProfile,
  onRefreshGrants,
  onLogout,
  onNavigate,
}: StudentAreaPageProps) {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Full registration form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [studentOrChildName, setStudentOrChildName] = useState('');
  const [gradeOrAge, setGradeOrAge] = useState('');
  const [cityState, setCityState] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editDraft, setEditDraft] = useState<StudentProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [previewGrant, setPreviewGrant] = useState<StudentMaterialGrant | null>(null);

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] placeholder:text-[#8C756D] focus:outline-none focus:border-[#E89EB8] focus:bg-white transition-colors';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      const res = await onLoginStudent(loginEmail, loginPassword);
      if (!res.ok && res.error) {
        setAuthError(res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (password.length < 6) {
      setAuthError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('As senhas digitadas não coincidem.');
      return;
    }

    setBusy(true);
    try {
      const res = await onRegisterStudent({
        fullName,
        email,
        phone,
        cpf,
        studentOrChildName,
        gradeOrAge,
        cityState,
        notes,
        password,
      });
      if (!res.ok && res.error) {
        setAuthError(res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentStudent) return;
    setRefreshing(true);
    try {
      await onRefreshGrants(currentStudent);
    } finally {
      setRefreshing(false);
    }
  };

  // Logged-in Student Dashboard
  if (currentStudent) {
    return (
      <div className="bg-[#FDF8F5] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Student Header Card */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE4DE] soft-card-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F4EFFA] text-[#6B4C8C] border border-[#E8DDF6] flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-script text-2xl text-[#6F4E42] leading-none">
                  Área do Aluno · Aula Particular
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3D2A24]">
                  Olá, {currentStudent.fullName}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#725B53] pt-1">
                  <span>
                    <strong className="text-[#3D2A24]">Aluno(a):</strong>{' '}
                    {currentStudent.studentOrChildName || 'Não informado'}
                  </span>
                  <span>
                    <strong className="text-[#3D2A24]">Série / Idade:</strong>{' '}
                    {currentStudent.gradeOrAge || 'Não informado'}
                  </span>
                  <span>
                    <strong className="text-[#3D2A24]">E-mail:</strong> {currentStudent.email}
                  </span>
                  {currentStudent.phone && (
                    <span>
                      <strong className="text-[#3D2A24]">WhatsApp:</strong> {currentStudent.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] text-xs font-bold hover:bg-[#D5E9FA] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar PDFs</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditDraft(currentStudent);
                  setEditingProfile((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FDF8F5] border border-[#EFE4DE] text-[#6F4E42] text-xs font-bold hover:bg-[#FDEEF4] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Meu Cadastro</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </section>

          {/* Optional Edit Profile Form */}
          {editingProfile && editDraft && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdateProfile(editDraft);
                setEditingProfile(false);
              }}
              className="bg-white rounded-3xl p-6 border border-[#E8DDF6] soft-card-shadow space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#3D2A24]">
                  Atualizar Cadastro Completo
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="text-xs font-semibold text-[#725B53] hover:text-[#3D2A24]"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.fullName}
                    onChange={(e) => setEditDraft({ ...editDraft, fullName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={editDraft.phone}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, phone: formatPhoneBr(e.target.value) })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    CPF / Documento
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.cpf}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, cpf: formatCpf(e.target.value) })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Nome do Aluno(a)
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.studentOrChildName}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, studentOrChildName: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Série / Idade
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.gradeOrAge}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, gradeOrAge: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.cityState}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, cityState: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
              >
                Salvar Alterações
              </button>
            </form>
          )}

          {/* Granted Apostilas & PDFs Section */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#3D2A24]">
                  Minhas Apostilas & PDFs Liberados ({grants.length})
                </h2>
                <p className="text-xs text-[#725B53] mt-0.5">
                  Materiais exclusivos liberados pela Prof para download após confirmação do pagamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'apostilas' })}
                className="px-4 py-2 rounded-full bg-[#FDEEF4] text-[#6F4E42] text-xs font-bold hover:bg-[#FCE2EC] transition-colors self-start sm:self-auto"
              >
                Adquirir novas apostilas
              </button>
            </div>

            {grants.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-[#EFE4DE] soft-card-shadow text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FEF8E8] text-[#8B6215] flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="max-w-lg mx-auto space-y-2">
                  <h3 className="font-display text-xl font-bold text-[#3D2A24]">
                    Nenhuma apostila liberada neste painel ainda
                  </h3>
                  <p className="text-xs sm:text-sm text-[#725B53] leading-relaxed">
                    Assim que você escolher sua apostila de aula particular no site e confirmar o pagamento via WhatsApp, a Prof selecionará seu cadastro (<strong className="text-[#3D2A24]">{currentStudent.email}</strong>) e o arquivo PDF aparecerá automaticamente aqui para download.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'apostilas' })}
                    className="px-5 py-3 rounded-2xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
                  >
                    Explorar Apostilas Exclusivas
                  </button>
                  <a
                    href={buildWhatsAppUrl(
                      settings.whatsappNumber,
                      `Olá, Prof! Já fiz meu cadastro na Área do Aluno (${currentStudent.fullName} - ${currentStudent.email}) e gostaria de liberar minha apostila em PDF.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0] text-xs font-bold hover:bg-[#DCFCE7] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avisar Prof no WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grants.map((grant) => (
                  <article
                    key={grant.id}
                    className="bg-white rounded-3xl border border-[#EFE4DE] overflow-hidden soft-card-shadow flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-[#FAF3EE] overflow-hidden">
                      <img
                        src={grant.coverImage}
                        alt={grant.materialTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ECFDF3] text-[#15803D] text-[11px] font-bold border border-[#BBF7D0]">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Liberado para Download</span>
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#725B53]">
                          {grant.levelOrSubject && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F4EFFA] text-[#6B4C8C] font-bold">
                              {grant.levelOrSubject}
                            </span>
                          )}
                          {grant.pagesCount && <span>{grant.pagesCount} páginas PDF</span>}
                          {grant.orderRef && (
                            <span className="font-mono font-semibold text-[#6F4E42]">
                              Pedido {grant.orderRef}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-base font-bold text-[#3D2A24]">
                          {grant.materialTitle}
                        </h3>
                        {grant.materialDescription && (
                          <p className="text-xs text-[#725B53] leading-relaxed line-clamp-2">
                            {grant.materialDescription}
                          </p>
                        )}
                        {grant.notes && (
                          <div className="p-3 rounded-2xl bg-[#FEF8E8] border border-[#F3E2B3] text-xs text-[#7A5208]">
                            <strong>Recado da Prof:</strong> {grant.notes}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-3 border-t border-[#FAF3EE]">
                        <p className="text-[11px] text-[#725B53]">
                          Arquivo: <span className="font-mono">{grant.fileName}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href={grant.pdfUrl}
                            download={grant.fileName || 'apostila-papelaria-da-prof.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
                          >
                            <Download className="w-4 h-4" aria-hidden="true" />
                            <span>Baixar PDF</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setPreviewGrant(grant)}
                            aria-label={`Visualizar ${grant.materialTitle}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#E6F2FC] text-[#3B6E9C] text-xs font-bold hover:bg-[#D5E9FA] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Visualizar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Inline PDF Viewer Modal */}
        {previewGrant && (
          <div
            className="fixed inset-0 z-50 bg-[#3D2A24]/50 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Visualizando ${previewGrant.materialTitle}`}
          >
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden soft-card-shadow border border-[#EFE4DE]">
              <div className="px-5 py-4 border-b border-[#EFE4DE] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-[#6F4E42] shrink-0" />
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#3D2A24] truncate">
                    {previewGrant.materialTitle}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewGrant.pdfUrl}
                    download={previewGrant.fileName}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#6F4E42] text-white text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewGrant(null)}
                    aria-label="Fechar visualizador"
                    className="w-8 h-8 rounded-full bg-[#FDF8F5] text-[#6F4E42] flex items-center justify-center hover:bg-[#FDEEF4]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <iframe
                src={previewGrant.pdfUrl}
                title={previewGrant.materialTitle}
                className="flex-1 w-full bg-[#FAF3EE]"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated Student Login & Full Registration View
  return (
    <div className="bg-[#FDF8F5] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FDEEF4] text-[#8C4B68] text-xs font-bold border border-[#F6DCE6]">
            <GraduationCap className="w-3.5 h-3.5" />
            Portal Exclusivo de Alunos
          </span>
          <div>
            <p className="font-script text-3xl text-[#6F4E42] leading-none">
              Seus PDFs de aula particular
            </p>
            <h1 className="font-display text-3xl font-bold text-[#3D2A24] mt-1">
              Área do Aluno
            </h1>
          </div>
          <p className="text-sm text-[#725B53] leading-relaxed">
            Faça seu cadastro completo uma única vez. Sempre que você adquirir uma apostila exclusiva ou pacote de atividades em PDF pelo site e confirmar o pagamento no WhatsApp, a Prof libera o material direto no seu painel para download.
          </p>

          <div className="bg-white rounded-3xl p-5 border border-[#EFE4DE] soft-card-shadow space-y-3 text-xs text-[#5E4942]">
            <p className="font-display font-bold text-sm text-[#3D2A24]">
              Vantagens do seu cadastro:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Download ilimitado das apostilas liberadas para você</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Recados personalizados e orientações da Prof por aluno</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Visualização direta no celular, tablet ou computador</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE4DE] soft-card-shadow space-y-6">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#FDF8F5] p-1.5 rounded-2xl border border-[#EFE4DE]">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                authTab === 'login'
                  ? 'bg-[#6F4E42] text-white shadow-xs'
                  : 'text-[#6F4E42] hover:bg-white'
              }`}
            >
              Já tenho cadastro (Entrar)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                authTab === 'register'
                  ? 'bg-[#6F4E42] text-white shadow-xs'
                  : 'text-[#6F4E42] hover:bg-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Fazer Cadastro Completo</span>
            </button>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#DC2626]">
              {authError}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="stu-login-email" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  E-mail cadastrado *
                </label>
                <input
                  id="stu-login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="stu-login-pass" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Senha *
                </label>
                <input
                  id="stu-login-pass"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-2xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Entrar na Área do Aluno</span>
              </button>

              <div className="relative py-2 flex items-center">
                <div className="flex-1 border-t border-[#EFE4DE]" />
                <span className="px-3 text-[11px] text-[#725B53]">ou</span>
                <div className="flex-1 border-t border-[#EFE4DE]" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  const res = await onLoginGoogle();
                  if (!res.ok && res.error) setAuthError(res.error);
                }}
                className="w-full py-3 rounded-2xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-bold text-[#3D2A24] hover:bg-[#FDEEF4] transition-colors"
              >
                Entrar com conta Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="stu-reg-name" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Nome completo do responsável / aluno *
                  </label>
                  <input
                    id="stu-reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Mariana Oliveira Santos"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-email" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    E-mail de acesso *
                  </label>
                  <input
                    id="stu-reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mariana@email.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-phone" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    WhatsApp *
                  </label>
                  <input
                    id="stu-reg-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
                    placeholder="(17) 99999-9999"
                    className={`${inputCls} tabular-nums`}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-cpf" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    CPF *
                  </label>
                  <input
                    id="stu-reg-cpf"
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className={`${inputCls} tabular-nums`}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-child" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Nome do Aluno(a) na aula particular *
                  </label>
                  <input
                    id="stu-reg-child"
                    type="text"
                    required
                    value={studentOrChildName}
                    onChange={(e) => setStudentOrChildName(e.target.value)}
                    placeholder="Ex: Lucas Oliveira (7 anos)"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-grade" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Série Escolar / Idade *
                  </label>
                  <input
                    id="stu-reg-grade"
                    type="text"
                    required
                    value={gradeOrAge}
                    onChange={(e) => setGradeOrAge(e.target.value)}
                    placeholder="Ex: 2º Ano Fundamental · 7 anos"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-city" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Cidade / UF *
                  </label>
                  <input
                    id="stu-reg-city"
                    type="text"
                    required
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="São José do Rio Preto - SP"
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="stu-reg-notes" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Objetivos pedagógicos / observações (opcional)
                  </label>
                  <textarea
                    id="stu-reg-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Foco em alfabetização, interpretação de texto ou reforço em matemática..."
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-pass" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Crie uma senha (mín. 6 dígitos) *
                  </label>
                  <input
                    id="stu-reg-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="stu-reg-pass2" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Confirmar senha *
                  </label>
                  <input
                    id="stu-reg-pass2"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-2xl bg-[#6F4E42] text-white text-sm font-bold hover:bg-[#573B30] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Concluir Cadastro & Acessar Painel</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
