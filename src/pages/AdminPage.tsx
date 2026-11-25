import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Heart,
  KeyRound,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_ABOUT_TEXT, PDF_CATEGORIES } from '../data/defaults';
import { FIREBASE_AUTH_PROVIDERS_URL, FIREBASE_AUTH_SETTINGS_URL } from '../lib/firebase';
import {
  formatBRL,
  formatTimestamp,
  maskPhone,
  uploadFileToStorage,
} from '../lib/utils';
import { Coupon, Material, OrderStatus } from '../types';
import { SafeImage } from '../components/SafeImage';
import { BLOB_ASSETS, VERCEL_BLOB_STORE_ID } from '../data/assets';

type AdminTab =
  | 'dashboard'
  | 'pdv'
  | 'materials'
  | 'unlock'
  | 'coupons'
  | 'categories'
  | 'about'
  | 'settings';

export function AdminPage() {
  const {
    authReady,
    firebaseUser,
    isAdmin,
    isBootstrapAdmin,
    loginAdminWithCredentials,
    loginWithGoogle,
    logout,
    materials,
    settings,
    categories,
    saveCategory,
    deleteCategory,
    adminStudents,
    adminOrders,
    adminCoupons,
    adminStudentMaterials,
    adminMaterialFiles,
    saveMaterial,
    deleteMaterial,
    unlockMaterialForStudent,
    revokeStudentMaterial,
    updateOrderStatus,
    deleteOrder,
    saveCoupon,
    deleteCoupon,
    saveSettings,
    createOrder,
    authorizeAdminUid,
    seedStoreDefaults,
    showToast,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('dashboard');

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [emailDisabledHelp, setEmailDisabledHelp] = useState(false);
  const [unauthorizedDomainHelp, setUnauthorizedDomainHelp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // PDV state
  const [pdvSearch, setPdvSearch] = useState('');
  const [pdvCart, setPdvCart] = useState<
    { id: string; type: 'product' | 'material'; title: string; price: number; quantity: number; imageUrl: string }[]
  >([]);
  const [pdvCustomerName, setPdvCustomerName] = useState('');
  const [pdvCustomerPhone, setPdvCustomerPhone] = useState('');
  const [pdvDiscount, setPdvDiscount] = useState('0');
  const [pdvPayment, setPdvPayment] = useState('Pix');
  const [pdvSubmitting, setPdvSubmitting] = useState(false);

  // Material Form state
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matCat, setMatCat] = useState<string>(PDF_CATEGORIES[0]);
  const [matPrice, setMatPrice] = useState('');
  const [matCover, setMatCover] = useState<string>(BLOB_ASSETS.apostilaLeitura);
  const [matPages, setMatPages] = useState('40');
  const [matStock, setMatStock] = useState('999');
  const [matFeatured, setMatFeatured] = useState(true);
  const [matActive, setMatActive] = useState(true);
  const [matPdfUrl, setMatPdfUrl] = useState('');
  const [matPdfName, setMatPdfName] = useState('');
  const [matPdfSize, setMatPdfSize] = useState(0);
  const [uploadingMatFile, setUploadingMatFile] = useState(false);

  // Unlock Material state
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [unlockOrderRef, setUnlockOrderRef] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Coupon state
  const [coupCode, setCoupCode] = useState('');
  const [coupType, setCoupType] = useState<'percent' | 'fixed'>('percent');
  const [coupValue, setCoupValue] = useState('10');
  const [coupMin, setCoupMin] = useState('50');

  // Settings state
  const [cfgStoreName, setCfgStoreName] = useState(settings.storeName);
  const [cfgWhatsapp, setCfgWhatsapp] = useState(settings.whatsappNumber);
  const [cfgInstagramUrl, setCfgInstagramUrl] = useState(settings.instagramUrl);
  const [cfgInstagramHandle, setCfgInstagramHandle] = useState(settings.instagramHandle || '');
  const [cfgEmail, setCfgEmail] = useState(settings.contactEmail);
  const [cfgHours, setCfgHours] = useState(settings.businessHours);
  const [cfgHeroTitle, setCfgHeroTitle] = useState(settings.heroTitle);
  const [cfgHeroSubtitle, setCfgHeroSubtitle] = useState(settings.heroSubtitle);
  const [cfgAssistantName, setCfgAssistantName] = useState(settings.assistantName);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('admin@x.com');

  // Category state
  const [newCatName, setNewCatName] = useState('');
  const [editingCatOld, setEditingCatOld] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Quem sou eu state
  const [cfgAboutTitle, setCfgAboutTitle] = useState(
    settings.aboutTitle || 'Quem sou eu – Professora Lilian'
  );
  const [cfgAboutSubtitle, setCfgAboutSubtitle] = useState(
    settings.aboutSubtitle ||
      'Educadora apaixonada pelo universo da aprendizagem e pelo desenvolvimento infantil.'
  );
  const [cfgAboutPhotoUrl, setCfgAboutPhotoUrl] = useState(
    settings.aboutPhotoUrl || BLOB_ASSETS.lilianPhoto
  );
  const [cfgAboutText, setCfgAboutText] = useState(
    settings.aboutText || DEFAULT_ABOUT_TEXT
  );
  const [cfgAboutCredentials, setCfgAboutCredentials] = useState<string[]>(
    settings.aboutCredentials || []
  );
  const [newCredText, setNewCredText] = useState('');
  const [editingCredIdx, setEditingCredIdx] = useState<number | null>(null);
  const [editingCredVal, setEditingCredVal] = useState('');
  const [uploadingAboutPhoto, setUploadingAboutPhoto] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await saveCategory(newCatName, true);
    setNewCatName('');
  };

  const handleUpdateCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) return;
    await saveCategory(newName, false, oldName);
    setEditingCatOld(null);
    setEditingCatName('');
  };

  const persistCredentials = async (nextCredentials: string[], message: string) => {
    const cleaned = nextCredentials.map((c) => c.trim()).filter(Boolean).slice(0, 12);
    setCfgAboutCredentials(cleaned);
    await saveSettings({
      ...settings,
      aboutTitle: cfgAboutTitle.trim() || 'Quem sou eu – Professora Lilian',
      aboutSubtitle: cfgAboutSubtitle.trim(),
      aboutPhotoUrl: cfgAboutPhotoUrl.trim() || BLOB_ASSETS.lilianPhoto,
      aboutText: cfgAboutText.trim() || DEFAULT_ABOUT_TEXT,
      aboutCredentials: cleaned,
    });
    showToast(message);
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCredText.trim();
    if (!val) return;
    if (cfgAboutCredentials.length >= 12) {
      showToast('Limite máximo de 12 destaques atingido.', 'error');
      return;
    }
    await persistCredentials([...cfgAboutCredentials, val], 'Destaque adicionado!');
    setNewCredText('');
  };

  const handleUpdateCredential = async (idx: number) => {
    const val = editingCredVal.trim();
    if (!val) return;
    const next = cfgAboutCredentials.map((c, i) => (i === idx ? val : c));
    await persistCredentials(next, 'Destaque atualizado!');
    setEditingCredIdx(null);
    setEditingCredVal('');
  };

  const handleDeleteCredential = async (idx: number) => {
    const next = cfgAboutCredentials.filter((_, i) => i !== idx);
    await persistCredentials(next, 'Destaque removido!');
    if (editingCredIdx === idx) {
      setEditingCredIdx(null);
      setEditingCredVal('');
    }
  };

  useEffect(() => {
    setCfgStoreName(settings.storeName);
    setCfgWhatsapp(settings.whatsappNumber);
    setCfgInstagramUrl(settings.instagramUrl);
    setCfgInstagramHandle(settings.instagramHandle || '');
    setCfgEmail(settings.contactEmail);
    setCfgHours(settings.businessHours);
    setCfgHeroTitle(settings.heroTitle);
    setCfgHeroSubtitle(settings.heroSubtitle);
    setCfgAssistantName(settings.assistantName);
    setCfgAboutTitle(settings.aboutTitle || 'Quem sou eu – Professora Lilian');
    setCfgAboutSubtitle(
      settings.aboutSubtitle ||
        'Educadora apaixonada pelo universo da aprendizagem e pelo desenvolvimento infantil.'
    );
    setCfgAboutPhotoUrl(settings.aboutPhotoUrl || BLOB_ASSETS.lilianPhoto);
    setCfgAboutText(settings.aboutText || DEFAULT_ABOUT_TEXT);
    setCfgAboutCredentials(settings.aboutCredentials || []);
  }, [settings]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setEmailDisabledHelp(false);
    setUnauthorizedDomainHelp(false);
    setLoggingIn(true);
    try {
      await loginAdminWithCredentials(adminEmail, adminPassword);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setEmailDisabledHelp(true);
        setLoginError(
          'O provedor E-mail/Senha ainda não foi ativado no Firebase Console. Ative no link abaixo ou entre instantaneamente com o Google Administrador!'
        );
      } else {
        setLoginError('Credenciais inválidas ou sem permissão de administrador.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoginError('');
    setEmailDisabledHelp(false);
    setUnauthorizedDomainHelp(false);
    setLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setUnauthorizedDomainHelp(true);
        setLoginError(
          `Para entrar com Google no domínio "${window.location.hostname}", adicione-o em Domínios Autorizados no Firebase Console (link abaixo) — ou entre agora usando E-mail e Senha!`
        );
      } else {
        setLoginError('Falha ao entrar com Google.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const validOrders = adminOrders.filter((o) => o.status !== 'cancelled');
    const revenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const avgTicket = validOrders.length ? revenue / validOrders.length : 0;

    const itemMap: Record<string, { title: string; qty: number; revenue: number }> = {};
    for (const o of validOrders) {
      for (const it of o.items || []) {
        if (!itemMap[it.id]) {
          itemMap[it.id] = { title: it.title, qty: 0, revenue: 0 };
        }
        itemMap[it.id].qty += it.quantity;
        itemMap[it.id].revenue += it.price * it.quantity;
      }
    }
    const topSelling = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      revenue,
      ordersCount: adminOrders.length,
      avgTicket,
      studentsCount: adminStudents.length,
      unlockedCount: adminStudentMaterials.length,
      topSelling,
    };
  }, [adminOrders, adminStudents, adminStudentMaterials]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return adminStudents;
    return adminStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    );
  }, [adminStudents, studentQuery]);

  if (!authReady) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center text-sm font-medium text-[#675975]">
        Verificando acesso administrativo...
      </main>
    );
  }

  if (!firebaseUser || !isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 py-14">
        <div className="bg-white rounded-[2rem] p-8 border-2 border-[#FCE1EE] shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#9B82E6]" />
          <div className="text-center space-y-2 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE6F1] text-[#E05899] flex items-center justify-center mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#3A2E45]">
              Painel Administrativo
            </h1>
            <p className="text-xs text-[#675975]">
              Acesso restrito à gestão da Papelaria da Prof.
            </p>
          </div>

          {firebaseUser && !isAdmin && (
            <div className="p-4 rounded-2xl bg-[#FFF0F5] border-2 border-[#F8BBD7] text-xs text-[#A82765] space-y-2">
              <p>
                Você está conectada como <strong>{firebaseUser.email}</strong>, que não possui permissão de administrador.
              </p>
              <p className="font-mono text-[11px] break-all">UID: {firebaseUser.uid}</p>
              <button
                type="button"
                onClick={logout}
                className="font-bold underline text-[#3A2E45] cursor-pointer"
              >
                Sair desta conta
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={loggingIn}
            onClick={handleGoogleAdminLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-[#FFF9FB] border-2 border-[#BEE6FB] text-sm font-bold text-[#3A2E45] hover:bg-[#E8F6FE] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0 7.31 0 3.25 2.69 1.28 6.61l3.66 2.84C5.8 6.86 8.65 5 12 5z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#FBBC05" d="M4.94 14.55c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.53H1.28C.47 9.14 0 10.97 0 12.46s.47 3.32 1.28 4.93l3.66-2.84z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.35 0-6.2-1.86-7.06-4.45H1.28v2.84C3.25 21.31 7.31 24 12 24z" />
            </svg>
            <span>Entrar como Admin com Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-[#675975]">
            <div className="h-px flex-1 bg-[#FCE1EE]" />
            <span>ou credenciais admin</span>
            <div className="h-px flex-1 bg-[#FCE1EE]" />
          </div>

          {loginError && (
            <div className="p-4 rounded-2xl bg-[#FFF0F5] border-2 border-[#F8BBD7] text-xs text-[#A82765] space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{loginError}</p>
              </div>
              {emailDisabledHelp && (
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
                  <span>Adicionar domínio na Vercel ao Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                E-mail Administrativo
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@x.com"
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 px-6 rounded-2xl candy-btn-purple text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {loggingIn ? 'Acessando...' : 'Entrar no Painel Admin'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Helpers for Material editing
  const startEditMaterial = (m: Material) => {
    setEditingMaterialId(m.id);
    setMatTitle(m.title);
    setMatDesc(m.description);
    setMatCat(m.category);
    setMatPrice(String(m.price));
    setMatCover(m.coverUrl);
    setMatPages(String(m.pagesCount));
    setMatStock(String(m.stock));
    setMatFeatured(m.featured);
    setMatActive(m.active);
    const file = adminMaterialFiles[m.id];
    setMatPdfUrl(file?.pdfUrl || '');
    setMatPdfName(file?.pdfFileName || '');
    setMatPdfSize(file?.fileSizeBytes || 0);
  };

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setMatTitle('');
    setMatDesc('');
    setMatCat(PDF_CATEGORIES[0]);
    setMatPrice('');
    setMatCover(BLOB_ASSETS.apostilaLeitura);
    setMatPages('40');
    setMatStock('999');
    setMatFeatured(true);
    setMatActive(true);
    setMatPdfUrl('');
    setMatPdfName('');
    setMatPdfSize(0);
  };

  const handleSaveMaterialForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = materials.find((m) => m.id === editingMaterialId);
    await saveMaterial(
      {
        id: editingMaterialId || '',
        title: matTitle,
        description: matDesc,
        category: matCat,
        price: Number(matPrice) || 0,
        coverUrl: matCover,
        pagesCount: Math.max(1, Number(matPages) || 1),
        stock: Number(matStock) || 999,
        featured: matFeatured,
        active: matActive,
        salesCount: existing?.salesCount ?? 0,
      },
      matPdfUrl ? { pdfUrl: matPdfUrl, pdfFileName: matPdfName || 'apostila.pdf', fileSizeBytes: matPdfSize } : null,
      !editingMaterialId
    );
    resetMaterialForm();
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = adminStudents.find((s) => s.uid === selectedStudentId);
    const material = materials.find((m) => m.id === selectedMaterialId);
    if (!student || !material) {
      showToast('Selecione um aluno e uma apostila.', 'error');
      return;
    }
    setUnlocking(true);
    try {
      await unlockMaterialForStudent({
        student,
        material,
        orderRef: unlockOrderRef,
      });
      setUnlockOrderRef('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao liberar material.', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  const handlePdvComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pdvCart.length === 0) {
      showToast('Adicione pelo menos um item ao PDV.', 'error');
      return;
    }
    const subtotal = pdvCart.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const disc = Math.min(subtotal, Math.max(0, Number(pdvDiscount) || 0));
    const total = Math.max(0, subtotal - disc);

    setPdvSubmitting(true);
    try {
      const orderNumber = `#PDV-${Math.floor(1000 + Math.random() * 9000)}`;
      await createOrder({
        orderNumber,
        customerName: pdvCustomerName.trim() || 'Cliente Presencial',
        customerPhone: pdvCustomerPhone.trim() || '(00) 00000-0000',
        items: pdvCart,
        subtotal,
        shippingCost: 0,
        discount: disc,
        total,
        paymentMethod: pdvPayment,
        source: 'pdv',
        status: 'completed',
      });
      setPdvCart([]);
      setPdvCustomerName('');
      setPdvCustomerPhone('');
      setPdvDiscount('0');
      showToast(`Venda ${orderNumber} registrada no PDV!`);
    } catch {
      showToast('Erro ao registrar venda no PDV.', 'error');
    } finally {
      setPdvSubmitting(false);
    }
  };

  const navTabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Relatórios', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'pdv', label: 'PDV', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'materials', label: 'Apostilas PDF', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'unlock', label: 'Liberar Material', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'coupons', label: 'Cupons', icon: <Tag className="w-4 h-4" /> },
    { id: 'categories', label: 'Categorias', icon: <Tag className="w-4 h-4" /> },
    { id: 'about', label: 'Quem sou eu', icon: <Heart className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  const allPdvItems = materials
    .map((m) => ({
      id: m.id,
      type: 'material' as const,
      title: m.title,
      price: m.price,
      imageUrl: m.coverUrl,
    }))
    .filter((i) => !pdvSearch.trim() || i.title.toLowerCase().includes(pdvSearch.toLowerCase()));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="playful-dots rounded-[2rem] p-6 sm:p-8 border-2 border-[#FCE1EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F67BB4] via-[#FAD663] to-[#6BBEEB]" />
        <div className="pt-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E05899]">
            Gestão da Loja
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3A2E45] mt-1">
            Painel Administrativo · {settings.storeName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
            <span className="text-[#675975]">Conectado como {firebaseUser.email}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Vercel Blob Ativo ({VERCEL_BLOB_STORE_ID})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => seedStoreDefaults().then(() => showToast('Catálogo sincronizado no Firestore!'))}
            className="px-4 py-2.5 rounded-2xl bg-white border-2 border-[#BEE6FB] text-xs font-bold text-[#3A2E45] hover:bg-[#E8F6FE] cursor-pointer"
          >
            Sincronizar Catálogo Padrão
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl candy-btn-coral text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {navTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              tab === t.id
                ? 'candy-btn-purple'
                : 'bg-white text-[#3A2E45] border-2 border-[#FCE1EE] hover:bg-[#FCE6F1]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD */}
      {tab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-3xl p-5 border-2 border-[#F8BBD7] shadow-xs">
              <p className="text-xs font-semibold text-[#675975]">Faturamento Total</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#3A2E45] mt-1">
                {formatBRL(metrics.revenue)}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-5 border-2 border-[#BEE6FB] shadow-xs">
              <p className="text-xs font-semibold text-[#675975]">Pedidos Registrados</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#3A2E45] mt-1">
                {metrics.ordersCount}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-5 border-2 border-[#F7DF8A] shadow-xs">
              <p className="text-xs font-semibold text-[#675975]">Ticket Médio</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#3A2E45] mt-1">
                {formatBRL(metrics.avgTicket)}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-5 border-2 border-[#D7CBFA] shadow-xs">
              <p className="text-xs font-semibold text-[#675975]">Alunas Cadastradas</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#3A2E45] mt-1">
                {metrics.studentsCount}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-5 border-2 border-[#B7E7BB] shadow-xs">
              <p className="text-xs font-semibold text-[#675975]">Materiais Liberados</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#E05899] mt-1">
                {metrics.unlockedCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] shadow-sm">
              <h2 className="font-display text-xl font-bold text-[#3A2E45] mb-4">
                Pedidos Recentes
              </h2>
              {adminOrders.length === 0 ? (
                <p className="text-sm text-[#675975]">Nenhum pedido registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-[#FCE1EE] text-[#675975]">
                        <th className="py-2.5 pr-3">Pedido</th>
                        <th className="py-2.5 pr-3">Cliente</th>
                        <th className="py-2.5 pr-3">Canal</th>
                        <th className="py-2.5 pr-3">Total</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FCE1EE]">
                      {adminOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="py-3 pr-3 font-mono font-bold text-[#3A2E45]">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-bold text-[#3A2E45]">{ord.customerName}</p>
                            <p className="text-[11px] text-[#675975]">{ord.customerPhone}</p>
                          </td>
                          <td className="py-3 pr-3 uppercase text-[#675975]">{ord.source}</td>
                          <td className="py-3 pr-3 font-mono tabular-nums font-bold text-[#E05899]">
                            {formatBRL(ord.total)}
                          </td>
                          <td className="py-3 flex items-center gap-2">
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs font-semibold text-[#3A2E45]"
                            >
                              <option value="pending">Pendente</option>
                              <option value="paid">Pago</option>
                              <option value="shipped">Enviado</option>
                              <option value="completed">Concluído</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => deleteOrder(ord.id)}
                              className="p-1.5 text-[#675975] hover:text-[#E05899] cursor-pointer"
                              aria-label="Excluir pedido"
                              title="Remover pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Selling */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] shadow-sm">
              <h2 className="font-display text-xl font-bold text-[#3A2E45] mb-4">Mais Vendidos</h2>
              {metrics.topSelling.length === 0 ? (
                <p className="text-sm text-[#675975]">
                  Os mais vendidos aparecerão após os primeiros pedidos.
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.topSelling.map((item, idx) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FFF9FB] border border-[#FCE1EE]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#3A2E45] truncate">
                          {idx + 1}. {item.title}
                        </p>
                        <p className="text-[11px] text-[#675975] font-mono tabular-nums">
                          {item.qty} unidades
                        </p>
                      </div>
                      <span className="font-mono tabular-nums text-xs font-bold text-[#E05899]">
                        {formatBRL(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PDV */}
      {tab === 'pdv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                PDV — Ponto de Venda
              </h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-[#7D6A43] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={pdvSearch}
                  onChange={(e) => setPdvSearch(e.target.value)}
                  placeholder="Buscar apostila PDF..."
                  className="w-full pl-9 pr-3 py-2 rounded-full bg-[#FDECA8] border-2 border-[#FAD663] text-xs text-[#3A2E45] placeholder:text-[#7D6A43]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {allPdvItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() =>
                    setPdvCart((prev) => {
                      const idx = prev.findIndex((c) => c.id === item.id && c.type === item.type);
                      if (idx >= 0) {
                        const next = [...prev];
                        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                        return next;
                      }
                      return [...prev, { ...item, quantity: 1 }];
                    })
                  }
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] hover:border-[#F267A8] text-left transition-colors cursor-pointer"
                >
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase text-[#E05899] font-bold">
                      {item.type === 'material' ? 'PDF Digital' : 'Produto'}
                    </p>
                    <p className="text-xs font-bold text-[#3A2E45] truncate">{item.title}</p>
                    <p className="font-mono tabular-nums text-xs text-[#9B82E6] font-bold">
                      {formatBRL(item.price)}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-[#E05899] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handlePdvComplete}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-[#3A2E45]">Cupom da Venda</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pdvCart.length === 0 ? (
                <p className="text-xs text-[#675975]">Clique nos itens ao lado para adicionar.</p>
              ) : (
                pdvCart.map((c) => (
                  <div key={`${c.type}-${c.id}`} className="flex items-center justify-between gap-2 text-xs bg-[#FFF9FB] border border-[#FCE1EE] p-2.5 rounded-xl">
                    <span className="truncate flex-1 font-bold text-[#3A2E45]">
                      {c.quantity}x {c.title}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-[#E05899]">
                      {formatBRL(c.price * c.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPdvCart((prev) => prev.filter((x) => !(x.id === c.id && x.type === c.type)))}
                      className="text-[#675975] hover:text-[#E05899] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#3A2E45] mb-1">
                  Nome da Cliente
                </label>
                <input
                  type="text"
                  value={pdvCustomerName}
                  onChange={(e) => setPdvCustomerName(e.target.value)}
                  placeholder="Balcão / Presencial"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3A2E45] mb-1">Telefone</label>
                <input
                  type="tel"
                  value={pdvCustomerPhone}
                  onChange={(e) => setPdvCustomerPhone(maskPhone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#3A2E45] mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pdvDiscount}
                  onChange={(e) => setPdvDiscount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3A2E45] mb-1">Pagamento</label>
                <select
                  value={pdvPayment}
                  onChange={(e) => setPdvPayment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#FCE1EE] flex items-center justify-between">
              <span className="text-sm font-bold text-[#3A2E45]">Total PDV</span>
              <span className="font-mono tabular-nums text-2xl font-bold text-[#E05899]">
                {formatBRL(
                  Math.max(
                    0,
                    pdvCart.reduce((acc, i) => acc + i.price * i.quantity, 0) - (Number(pdvDiscount) || 0)
                  )
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={pdvSubmitting || pdvCart.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl candy-btn-coral text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{pdvSubmitting ? 'Registrando...' : 'Finalizar Venda PDV'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. DIGITAL MATERIALS & PDFs */}
      {tab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveMaterialForm}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                {editingMaterialId ? 'Editar Apostila PDF' : 'Nova Apostila Exclusiva'}
              </h2>
              {editingMaterialId && (
                <button
                  type="button"
                  onClick={resetMaterialForm}
                  className="text-xs font-bold text-[#E05899] underline cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">Título *</label>
              <input
                type="text"
                required
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Categoria *</label>
                <select
                  value={matCat}
                  onChange={(e) => setMatCat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                >
                  {PDF_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!PDF_CATEGORIES.includes(matCat as (typeof PDF_CATEGORIES)[number]) && (
                    <option value={matCat}>{matCat}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={matPrice}
                  onChange={(e) => setMatPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Páginas</label>
                <input
                  type="number"
                  min="1"
                  value={matPages}
                  onChange={(e) => setMatPages(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Estoque Digital</label>
                <input
                  type="number"
                  min="0"
                  value={matStock}
                  onChange={(e) => setMatStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">Descrição</label>
              <textarea
                rows={3}
                value={matDesc}
                onChange={(e) => setMatDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">Capa (Imagem)</label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#FCE6F1] text-[#3A2E45] text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#E05899]" />
                  <span>Enviar Capa</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadingMatFile(true);
                      try {
                        const res = await uploadFileToStorage(f, 'images');
                        setMatCover(res.url);
                        showToast('Capa enviada!');
                      } finally {
                        setUploadingMatFile(false);
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={matCover}
                  onChange={(e) => setMatCover(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                Arquivo PDF da Apostila (Upload ou URL direta)
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingMatFile ? 'Enviando...' : 'Upload PDF'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadingMatFile(true);
                      try {
                        const res = await uploadFileToStorage(f, 'pdfs');
                        setMatPdfUrl(res.url);
                        setMatPdfName(res.fileName);
                        setMatPdfSize(res.fileSizeBytes);
                        showToast(`PDF "${res.fileName}" enviado!`);
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'Falha no upload do PDF.', 'error');
                      } finally {
                        setUploadingMatFile(false);
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={matPdfUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMatPdfUrl(val);
                    if (!matPdfName && val) {
                      setMatPdfName(val.split('/').pop() || 'apostila.pdf');
                    }
                  }}
                  placeholder="/pdfs/arquivo.pdf ou https://..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs"
                />
              </div>
              <p className="text-[11px] text-[#7C62CA] mt-1 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Arquivos e PDFs hospedados com alta velocidade no Vercel Blob Storage ({VERCEL_BLOB_STORE_ID})
              </p>
              {matPdfName && (
                <p className="text-[11px] text-[#675975] mt-0.5 truncate">
                  Arquivo selecionado: {matPdfName}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 text-xs font-bold text-[#3A2E45]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matFeatured}
                  onChange={(e) => setMatFeatured(e.target.checked)}
                />
                <span>Destaque</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matActive}
                  onChange={(e) => setMatActive(e.target.checked)}
                />
                <span>Ativo</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold cursor-pointer"
            >
              {editingMaterialId ? 'Atualizar Apostila' : 'Cadastrar Apostila'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {materials.map((m) => {
              const fileMeta = adminMaterialFiles[m.id];
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-4 border-2 border-[#FCE1EE] flex items-center gap-4 shadow-xs"
                >
                  <SafeImage
                    src={m.coverUrl}
                    alt={m.title}
                    className="w-16 h-20 rounded-2xl object-cover shrink-0 bg-[#FFF9FB]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase font-bold text-[#675975]">
                      {m.category} · {m.pagesCount} pág. · {m.active ? 'Ativo' : 'Inativo'}
                    </p>
                    <p className="font-display text-base font-bold text-[#3A2E45] truncate">
                      {m.title}
                    </p>
                    <p className="text-xs text-[#3A2E45] font-mono tabular-nums font-bold">
                      {formatBRL(m.price)} ·{' '}
                      <span className="text-[#E05899]">
                        {fileMeta?.pdfFileName || 'Sem PDF'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditMaterial(m)}
                      className="px-3.5 py-2 rounded-xl bg-[#FCE6F1] text-xs font-bold text-[#3A2E45] hover:bg-[#F8BBD7] cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMaterial(m.id)}
                      className="p-2 rounded-xl text-[#675975] hover:text-[#E05899] cursor-pointer"
                      aria-label="Excluir apostila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. UNLOCK MATERIAL FOR STUDENT */}
      {tab === 'unlock' && (
        <div className="space-y-8">
          <form
            onSubmit={handleUnlockSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-6 shadow-sm"
          >
            <div>
              <h2 className="font-display text-2xl font-bold text-[#3A2E45]">
                Liberar Material para Aluno
              </h2>
              <p className="text-xs text-[#675975] mt-1">
                Selecione o aluno cadastrado e a apostila adquirida para liberar imediatamente o download na Área do Aluno.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Picker */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#3A2E45]">
                  1. Buscar e Selecionar Aluno ({adminStudents.length} cadastrados)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#7D6A43] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou telefone..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FDECA8] border-2 border-[#FAD663] text-xs text-[#3A2E45] placeholder:text-[#7D6A43]"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-[#675975] p-3">
                      Nenhum aluno cadastrado encontrado. Peça para o cliente criar o cadastro na Área do Aluno.
                    </p>
                  ) : (
                    filteredStudents.map((st) => {
                      const active = selectedStudentId === st.uid;
                      return (
                        <button
                          key={st.uid}
                          type="button"
                          onClick={() => setSelectedStudentId(st.uid)}
                          className={`w-full text-left p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                            active
                              ? 'bg-[#FCE6F1] border-[#F267A8]'
                              : 'bg-[#FFF9FB] border-[#FCE1EE] hover:bg-white'
                          }`}
                        >
                          <p className="text-xs font-bold text-[#3A2E45]">{st.fullName}</p>
                          <p className="text-[11px] text-[#675975]">
                            {st.email} {st.phone ? `· ${st.phone}` : ''}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Material Picker */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#3A2E45] mb-2">
                    2. Selecionar Apostila / PDF
                  </label>
                  <select
                    required
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
                  >
                    <option value="">Escolha a apostila...</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({formatBRL(m.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A2E45] mb-2">
                    3. Número do Pedido / Observação (opcional)
                  </label>
                  <input
                    type="text"
                    value={unlockOrderRef}
                    onChange={(e) => setUnlockOrderRef(e.target.value)}
                    placeholder="Ex.: Pedido #PP-4821"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={unlocking || !selectedStudentId || !selectedMaterialId}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl candy-btn-purple text-sm font-bold disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{unlocking ? 'Liberando...' : 'Confirmar Liberação para Aluno'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Granted Materials List */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#BEE6FB] shadow-sm">
            <h3 className="font-display text-xl font-bold text-[#3A2E45] mb-4">
              Liberações Ativas ({adminStudentMaterials.length})
            </h3>
            {adminStudentMaterials.length === 0 ? (
              <p className="text-sm text-[#675975]">Nenhuma liberação realizada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#FCE1EE] text-[#675975]">
                      <th className="py-2.5 pr-3">Aluno</th>
                      <th className="py-2.5 pr-3">Material</th>
                      <th className="py-2.5 pr-3">Pedido</th>
                      <th className="py-2.5 pr-3">Data</th>
                      <th className="py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE1EE]">
                    {adminStudentMaterials.map((g) => (
                      <tr key={g.id}>
                        <td className="py-3 pr-3">
                          <p className="font-bold text-[#3A2E45]">{g.studentName}</p>
                          <p className="text-[11px] text-[#675975]">{g.studentEmail}</p>
                        </td>
                        <td className="py-3 pr-3 font-bold text-[#3A2E45]">{g.materialTitle}</td>
                        <td className="py-3 pr-3 text-[#675975]">{g.orderRef || '—'}</td>
                        <td className="py-3 pr-3 font-mono tabular-nums text-[#675975]">
                          {formatTimestamp(g.unlockedAt)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => revokeStudentMaterial(g.id)}
                            className="text-xs font-bold text-[#E05899] hover:underline cursor-pointer"
                          >
                            Revogar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. COUPONS */}
      {tab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveCoupon(
                {
                  id: '',
                  code: coupCode,
                  type: coupType,
                  value: Number(coupValue) || 10,
                  minOrder: Number(coupMin) || 0,
                  active: true,
                  usageCount: 0,
                },
                true
              );
              setCoupCode('');
            }}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm"
          >
            <h2 className="font-display text-xl font-bold text-[#3A2E45]">
              Novo Cupom de Desconto
            </h2>
            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">Código *</label>
              <input
                type="text"
                required
                value={coupCode}
                onChange={(e) => setCoupCode(e.target.value.toUpperCase())}
                placeholder="Ex.: PROF15"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm uppercase font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Tipo</label>
                <select
                  value={coupType}
                  onChange={(e) => setCoupType(e.target.value as 'percent' | 'fixed')}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs"
                >
                  <option value="percent">% Porcentagem</option>
                  <option value="fixed">R$ Fixo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Valor</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={coupValue}
                  onChange={(e) => setCoupValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Mínimo (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={coupMin}
                  onChange={(e) => setCoupMin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl candy-btn-coral text-sm font-bold cursor-pointer"
            >
              Criar Cupom
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {adminCoupons.map((c: Coupon) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-4 border-2 border-[#FCE1EE] flex items-center justify-between gap-4 shadow-xs"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-[#3A2E45]">{c.code}</p>
                  <p className="text-xs text-[#675975]">
                    {c.type === 'percent' ? `${c.value}% OFF` : `${formatBRL(c.value)} OFF`} · Pedido mínimo:{' '}
                    {formatBRL(c.minOrder)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveCoupon({ ...c, active: !c.active }, false)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      c.active
                        ? 'bg-[#EAF8EC] text-[#3F9145]'
                        : 'bg-[#FFF9FB] text-[#675975] border border-[#FCE1EE]'
                    }`}
                  >
                    {c.active ? 'Ativo' : 'Pausado'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCoupon(c.id)}
                    className="p-2 text-[#675975] hover:text-[#E05899] cursor-pointer"
                    aria-label="Excluir cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CATEGORIES */}
      {tab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#3A2E45]">
              Adicionar Nova Categoria
            </h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Ciências e Natureza (1º ao 5º ano)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer"
              >
                Adicionar Categoria
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#3A2E45]">
              Categorias Ativas ({categories.length})
            </h2>
            <div className="space-y-3">
              {categories.map((cat) => {
                const isEditing = editingCatOld === cat;
                return (
                  <div
                    key={cat}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE]"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex gap-2 w-full">
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#FCE1EE] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCategory(cat, editingCatName)}
                          className="px-3 py-1.5 rounded-xl bg-[#7ED082] text-white text-xs font-bold"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatOld(null);
                            setEditingCatName('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-200 text-xs font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#E05899]" />
                          <span className="font-display text-sm font-bold text-[#3A2E45]">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatOld(cat);
                              setEditingCatName(cat);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#BEE6FB] text-xs font-bold text-[#2D8EC4] hover:bg-[#E8F6FE] cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja realmente remover a categoria "${cat}"?`)) {
                                deleteCategory(cat);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 cursor-pointer"
                            title="Remover Categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. QUEM SOU EU */}
      {tab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Photo preview & Vercel Blob Upload */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-[#FCE1EE] space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                Foto da Professora Lilian
              </h2>
              <button
                type="button"
                onClick={() => setCfgAboutPhotoUrl(BLOB_ASSETS.lilianPhoto)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-[11px] font-bold text-[#E05899] hover:bg-[#FCE6F1] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Foto Oficial</span>
              </button>
            </div>

            <div className="playful-dots p-3 rounded-[1.75rem] border-2 border-[#F8BBD7]">
              <div className="w-full max-w-[300px] mx-auto aspect-[3/4] rounded-[1.25rem] overflow-hidden bg-white border border-[#FCE1EE] flex items-center justify-center">
                <SafeImage
                  src={cfgAboutPhotoUrl || BLOB_ASSETS.lilianPhoto}
                  alt={cfgAboutTitle}
                  className="w-full h-full object-contain object-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1.5">
                Enviar nova foto para Vercel Blob
              </label>
              <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-[#F8BBD7] bg-[#FFF9FB] hover:bg-[#FCE6F1]/60 text-xs font-bold text-[#E05899] cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>
                  {uploadingAboutPhoto
                    ? 'Enviando foto para Vercel Blob...'
                    : 'Selecionar Foto (JPG, PNG, WEBP)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingAboutPhoto}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingAboutPhoto(true);
                    try {
                      const uploaded = await uploadFileToStorage(file, 'images');
                      setCfgAboutPhotoUrl(uploaded.url);
                      showToast('Foto enviada para o Vercel Blob! Clique em Salvar para publicar.');
                    } catch (err) {
                      showToast(
                        err instanceof Error ? err.message : 'Erro ao enviar foto.',
                        'error'
                      );
                    } finally {
                      setUploadingAboutPhoto(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                URL da Foto
              </label>
              <input
                type="url"
                value={cfgAboutPhotoUrl}
                onChange={(e) => setCfgAboutPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs font-mono text-[#3A2E45]"
              />
            </div>

            {/* Destaques / Formação (CRUD: Adicionar, Editar, Remover) */}
            <div className="pt-4 border-t border-[#FCE1EE] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#3A2E45] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E05899]" />
                  <span>Destaques & Formação ({cfgAboutCredentials.length}/12)</span>
                </h3>
              </div>

              <form onSubmit={handleAddCredential} className="flex gap-2">
                <input
                  type="text"
                  value={newCredText}
                  onChange={(e) => setNewCredText(e.target.value)}
                  placeholder="Ex.: Pós-graduada em Libras"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs text-[#3A2E45]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl candy-btn-pink text-xs font-bold cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cfgAboutCredentials.map((cred, idx) => {
                  const isEditing = editingCredIdx === idx;
                  return (
                    <div
                      key={`${cred}-${idx}`}
                      className="p-2.5 rounded-2xl bg-[#FFF9FB] border border-[#FCE1EE] flex items-center justify-between gap-2"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex gap-1.5">
                          <input
                            type="text"
                            value={editingCredVal}
                            onChange={(e) => setEditingCredVal(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#FCE1EE] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCredential(idx)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#7ED082] text-white text-[11px] font-bold cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCredIdx(null);
                              setEditingCredVal('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-gray-200 text-[11px] font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-[#3A2E45] leading-snug flex-1">
                            {cred}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCredIdx(idx);
                                setEditingCredVal(cred);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-white border border-[#BEE6FB] text-[11px] font-bold text-[#2D8EC4] hover:bg-[#E8F6FE] cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCredential(idx)}
                              className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 cursor-pointer"
                              title="Remover destaque"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {cfgAboutCredentials.length === 0 && (
                  <p className="text-xs text-[#675975] italic">
                    Nenhum destaque cadastrado. Adicione acima para exibir na seção Quem sou eu.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Biography & Headings Editor */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingAbout(true);
              try {
                await saveSettings({
                  ...settings,
                  aboutTitle: cfgAboutTitle.trim() || 'Quem sou eu – Professora Lilian',
                  aboutSubtitle: cfgAboutSubtitle.trim(),
                  aboutPhotoUrl: cfgAboutPhotoUrl.trim() || BLOB_ASSETS.lilianPhoto,
                  aboutText: cfgAboutText.trim() || DEFAULT_ABOUT_TEXT,
                  aboutCredentials: cfgAboutCredentials,
                });
                showToast('Seção "Quem sou eu" atualizada no banco de dados e no site!');
              } finally {
                setSavingAbout(false);
              }
            }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#3A2E45]">
                  Editar Seção “Quem sou eu”
                </h2>
                <p className="text-xs text-[#675975] mt-0.5">
                  As alterações aparecem imediatamente na página inicial e na página Quem sou eu do menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCfgAboutText(DEFAULT_ABOUT_TEXT)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF9FB] border border-[#FCE1EE] text-xs font-bold text-[#7C62CA] hover:bg-[#F7F4FD] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Texto Padrão</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                Título da Seção
              </label>
              <input
                type="text"
                required
                value={cfgAboutTitle}
                onChange={(e) => setCfgAboutTitle(e.target.value)}
                placeholder="Quem sou eu – Professora Lilian"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                Subtítulo de Destaque
              </label>
              <input
                type="text"
                value={cfgAboutSubtitle}
                onChange={(e) => setCfgAboutSubtitle(e.target.value)}
                placeholder="Educadora apaixonada pelo universo da aprendizagem..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#3A2E45]">
                  Texto Completo (separe parágrafos com uma linha em branco)
                </label>
                <span className="text-[11px] text-[#675975]">
                  {cfgAboutText.length}/5000 caracteres
                </span>
              </div>
              <textarea
                rows={14}
                maxLength={5000}
                required
                value={cfgAboutText}
                onChange={(e) => setCfgAboutText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm text-[#3A2E45] leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingAbout}
                className="px-7 py-3.5 rounded-2xl candy-btn-pink text-sm font-bold disabled:opacity-60 cursor-pointer"
              >
                {savingAbout ? 'Salvando...' : 'Salvar Seção Quem sou eu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. SETTINGS */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveSettings({
                ...settings,
                storeName: cfgStoreName,
                whatsappNumber: cfgWhatsapp,
                instagramUrl: cfgInstagramUrl,
                instagramHandle: cfgInstagramHandle,
                contactEmail: cfgEmail,
                businessHours: cfgHours,
                heroTitle: cfgHeroTitle,
                heroSubtitle: cfgHeroSubtitle,
                freeShippingThreshold: 0,
                assistantName: cfgAssistantName,
              });
            }}
            className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FCE1EE] space-y-4 shadow-sm"
          >
            <h2 className="font-display text-xl font-bold text-[#3A2E45]">
              Configurações Gerais, WhatsApp e Redes Sociais
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">Nome da Loja</label>
                <input
                  type="text"
                  value={cfgStoreName}
                  onChange={(e) => setCfgStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  WhatsApp da Loja (código país + DDD + número)
                </label>
                <input
                  type="text"
                  value={cfgWhatsapp}
                  onChange={(e) => setCfgWhatsapp(e.target.value)}
                  placeholder="5521999999999"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  Link do Instagram
                </label>
                <input
                  type="url"
                  value={cfgInstagramUrl}
                  onChange={(e) => setCfgInstagramUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">@ do Instagram</label>
                <input
                  type="text"
                  value={cfgInstagramHandle}
                  onChange={(e) => setCfgInstagramHandle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={cfgEmail}
                  onChange={(e) => setCfgEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  Nome da Assistente Virtual
                </label>
                <input
                  type="text"
                  value={cfgAssistantName}
                  onChange={(e) => setCfgAssistantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  Horário de Atendimento
                </label>
                <input
                  type="text"
                  value={cfgHours}
                  onChange={(e) => setCfgHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                Título Principal (Hero)
              </label>
              <input
                type="text"
                value={cfgHeroTitle}
                onChange={(e) => setCfgHeroTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A2E45] mb-1">Subtítulo (Hero)</label>
              <textarea
                rows={2}
                value={cfgHeroSubtitle}
                onChange={(e) => setCfgHeroSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-7 py-3.5 rounded-2xl candy-btn-coral text-sm font-bold cursor-pointer"
            >
              Salvar Configurações
            </button>
          </form>

          {(isBootstrapAdmin || isAdmin) && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAdminUid.trim()) return;
                await authorizeAdminUid(newAdminUid, newAdminEmail);
                setNewAdminUid('');
              }}
              className="lg:col-span-4 bg-white rounded-3xl p-6 border-2 border-[#BEE6FB] space-y-4 shadow-sm"
            >
              <h3 className="font-display text-lg font-bold text-[#3A2E45]">
                Autorizar Novo Admin
              </h3>
              <p className="text-xs text-[#675975] leading-relaxed">
                Cole o UID de uma conta autenticada para conceder acesso administrativo completo no Firestore e na Vercel.
              </p>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">
                  UID do Usuário
                </label>
                <input
                  type="text"
                  required
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="Firebase Auth UID"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3A2E45] mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border-2 border-[#FCE1EE] text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl candy-btn-purple text-xs font-bold cursor-pointer"
              >
                Conceder Acesso Admin
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}
