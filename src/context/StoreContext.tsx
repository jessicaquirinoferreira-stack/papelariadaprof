import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, auth, db, googleProvider, handleFirestoreError } from '../lib/firebase';
import {
  DEFAULT_COUPONS,
  DEFAULT_MATERIAL_FILES,
  DEFAULT_MATERIALS,
  DEFAULT_SETTINGS,
  PDF_CATEGORIES,
} from '../data/defaults';
import { slugId } from '../lib/utils';
import {
  CartItem,
  Coupon,
  Material,
  MaterialFile,
  Order,
  OrderStatus,
  PageRoute,
  Product,
  StoreSettings,
  StudentMaterial,
  StudentProfile,
} from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface SelectedItem {
  type: 'product' | 'material';
  id: string;
}

interface StoreContextValue {
  route: PageRoute;
  navigate: (nextRoute: PageRoute, item?: SelectedItem, category?: string) => void;
  selectedItem: SelectedItem | null;
  catalogCategory: string;
  setCatalogCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  quickViewItem: { type: 'product' | 'material'; item: Product | Material } | null;
  setQuickViewItem: (v: { type: 'product' | 'material'; item: Product | Material } | null) => void;

  // Storefront data
  products: Product[];
  materials: Material[];
  settings: StoreSettings;
  activeCoupons: Coupon[];
  catalogLoading: boolean;
  categories: string[];
  saveCategory: (categoryName: string, isNew: boolean, oldCategoryName?: string) => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  updateCartQty: (id: string, type: 'product' | 'material', qty: number) => void;
  removeFromCart: (id: string, type: 'product' | 'material') => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;

  // Auth & User
  authReady: boolean;
  firebaseUser: User | null;
  studentProfile: StudentProfile | null;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  studentMaterials: StudentMaterial[];
  studentOrders: Order[];

  // Auth actions
  loginWithGoogle: () => Promise<void>;
  registerStudent: (data: { fullName: string; email: string; phone: string; password: string }) => Promise<void>;
  loginStudentWithEmail: (email: string, password: string) => Promise<void>;
  loginAdminWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStudentProfile: (updates: Partial<StudentProfile>) => Promise<void>;

  // Orders & Coupons
  validateCoupon: (code: string, subtotal: number) => { valid: boolean; coupon?: Coupon; discount: number; message: string };
  createOrder: (orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<Order>;
  verifyAndUnlockInfinitePayOrder: (params: {
    orderId: string;
    slug?: string;
    transactionNsu?: string;
    receiptUrl?: string;
    captureMethod?: string;
  }) => Promise<{ paid: boolean; unlockedCount: number; order?: Order }>;

  // Admin data & actions
  adminStudents: StudentProfile[];
  adminOrders: Order[];
  adminCoupons: Coupon[];
  adminStudentMaterials: StudentMaterial[];
  adminMaterialFiles: Record<string, MaterialFile>;
  saveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveMaterial: (
    material: Omit<Material, 'createdAt' | 'updatedAt'>,
    fileInfo: { pdfUrl: string; pdfFileName: string; fileSizeBytes?: number } | null,
    isNew: boolean
  ) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  unlockMaterialForStudent: (params: {
    student: StudentProfile;
    material: Material;
    orderRef?: string;
  }) => Promise<void>;
  revokeStudentMaterial: (grantId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  saveCoupon: (coupon: Omit<Coupon, 'createdAt'>, isNew: boolean) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  saveSettings: (nextSettings: Omit<StoreSettings, 'updatedAt'>) => Promise<void>;
  authorizeAdminUid: (uid: string, email: string) => Promise<void>;
  seedStoreDefaults: () => Promise<void>;

  // Toast
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'papelaria_prof_cart_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<PageRoute>('home');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [catalogCategory, setCatalogCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickViewItem, setQuickViewItem] = useState<{ type: 'product' | 'material'; item: Product | Material } | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const materials = useMemo(() => {
    const deletedSet = new Set(settings.deletedMaterialIds || []);
    const filteredRaw = rawMaterials.filter(
      (m) =>
        !deletedSet.has(m.id) &&
        m.id !== 'mat-caderno-psicopedagogico' &&
        !m.category.toLowerCase().includes('psicopedag') &&
        !m.title.toLowerCase().includes('terapêut')
    );
    const existingIds = new Set(filteredRaw.map((d) => d.id));
    const validDefaults = DEFAULT_MATERIALS.filter((dm) => !deletedSet.has(dm.id));
    const hasAnyNewSeed = validDefaults.some((dm) => existingIds.has(dm.id));

    if (hasAnyNewSeed || filteredRaw.some((d) => !d.id.startsWith('mat-'))) {
      const missingDefaults = validDefaults.filter((dm) => !existingIds.has(dm.id));
      return [...filteredRaw, ...missingDefaults];
    } else {
      const customDocs = filteredRaw.filter(
        (d) =>
          d.id !== 'mat-alfabetizacao-afetiva' &&
          d.id !== 'mat-matematica-ludica' &&
          d.id !== 'mat-oficina-producao-texto'
      );
      return [...validDefaults, ...customDocs];
    }
  }, [rawMaterials, settings.deletedMaterialIds]);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as CartItem[];
      return Array.isArray(parsed) ? parsed.filter((c) => c.type === 'material') : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBootstrapAdmin, setIsBootstrapAdmin] = useState(false);

  const [studentMaterials, setStudentMaterials] = useState<StudentMaterial[]>([]);
  const [studentOrders, setStudentOrders] = useState<Order[]>([]);

  // Admin state
  const [adminStudents, setAdminStudents] = useState<StudentProfile[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [adminStudentMaterials, setAdminStudentMaterials] = useState<StudentMaterial[]>([]);
  const [adminMaterialFiles, setAdminMaterialFiles] = useState<Record<string, MaterialFile>>(DEFAULT_MATERIAL_FILES);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((nextRoute: PageRoute, item?: SelectedItem, category?: string) => {
    setRoute(nextRoute);
    if (item) {
      setSelectedItem(item);
    }
    if (category) {
      setCatalogCategory(category);
    } else if (nextRoute === 'catalog' || nextRoute === 'apostilas') {
      setCatalogCategory('Todas');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Persist cart locally
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  // Public Firestore listeners
  useEffect(() => {
    // Store is 100% digital PDF now
    setProducts([]);
    setCatalogLoading(false);

    const unsubMaterials = onSnapshot(
      collection(db, 'materials'),
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => d.data() as Material);
          setRawMaterials(docs);
        } else {
          setRawMaterials(DEFAULT_MATERIALS);
        }
      },
      (error) => {
        console.error('Materials listener:', error);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        if (snap.exists()) {
          const raw = snap.data() as StoreSettings;
          const normalized: StoreSettings = {
            ...DEFAULT_SETTINGS,
            ...raw,
            assistantName:
              !raw.assistantName || raw.assistantName.trim().toLowerCase() === 'prof. mel'
                ? 'Prof. Lilian'
                : raw.assistantName,
            contactEmail:
              !raw.contactEmail || raw.contactEmail === 'contato@papelariadaprof.com.br'
                ? 'lilianluquezzi0@gmail.com'
                : raw.contactEmail,
            heroTitle:
              !raw.heroTitle || raw.heroTitle.toLowerCase().includes('papelaria afetiva')
                ? DEFAULT_SETTINGS.heroTitle
                : raw.heroTitle,
            heroSubtitle:
              !raw.heroSubtitle || raw.heroSubtitle.toLowerCase().includes('terapêut')
                ? DEFAULT_SETTINGS.heroSubtitle
                : raw.heroSubtitle,
            freeShippingThreshold: 0,
            aboutTitle: raw.aboutTitle || DEFAULT_SETTINGS.aboutTitle,
            aboutSubtitle: raw.aboutSubtitle || DEFAULT_SETTINGS.aboutSubtitle,
            aboutPhotoUrl: raw.aboutPhotoUrl || DEFAULT_SETTINGS.aboutPhotoUrl,
            aboutText: raw.aboutText || DEFAULT_SETTINGS.aboutText,
            aboutCredentials:
              raw.aboutCredentials && raw.aboutCredentials.length > 0
                ? raw.aboutCredentials
                : DEFAULT_SETTINGS.aboutCredentials,
          };
          setSettings(normalized);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      },
      (error) => {
        console.error('Settings listener:', error);
      }
    );

    const unsubCoupons = onSnapshot(
      query(collection(db, 'coupons'), where('active', '==', true)),
      (snap) => {
        if (!snap.empty) {
          setActiveCoupons(snap.docs.map((d) => d.data() as Coupon));
        } else {
          setActiveCoupons(DEFAULT_COUPONS);
        }
      },
      (error) => {
        console.error('Coupons listener:', error);
      }
    );

    return () => {
      unsubMaterials();
      unsubSettings();
      unsubCoupons();
    };
  }, []);

  const seedStoreDefaults = useCallback(async () => {
    try {
      // Remove legacy psychopedagogy/therapeutic seed doc if present
      const legacyMatRef = doc(db, 'materials', 'mat-caderno-psicopedagogico');
      const legacyMatSnap = await getDoc(legacyMatRef);
      if (legacyMatSnap.exists()) {
        await deleteDoc(legacyMatRef);
      }

      const matSnap = await getDocs(collection(db, 'materials'));
      const existingMatIds = new Set(matSnap.docs.map((d) => d.id));
      for (const m of DEFAULT_MATERIALS) {
        if (!existingMatIds.has(m.id)) {
          await setDoc(doc(db, 'materials', m.id), {
            id: m.id,
            title: m.title,
            description: m.description,
            category: m.category,
            price: m.price,
            coverUrl: m.coverUrl,
            pagesCount: m.pagesCount,
            stock: m.stock,
            featured: m.featured,
            active: m.active,
            salesCount: m.salesCount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          const fileMeta = DEFAULT_MATERIAL_FILES[m.id];
          if (fileMeta) {
            await setDoc(doc(db, 'materials', m.id, 'private', 'file'), {
              materialId: m.id,
              pdfUrl: fileMeta.pdfUrl,
              pdfFileName: fileMeta.pdfFileName,
              fileSizeBytes: fileMeta.fileSizeBytes ?? 0,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      const setSnap = await getDoc(doc(db, 'settings', 'store'));
      if (!setSnap.exists()) {
        await setDoc(doc(db, 'settings', 'store'), {
          ...DEFAULT_SETTINGS,
          updatedAt: serverTimestamp(),
        });
      } else {
        const raw = setSnap.data() as StoreSettings;
        if (
          raw.assistantName === 'Prof. Mel' ||
          raw.contactEmail === 'contato@papelariadaprof.com.br' ||
          !raw.whatsappNumber ||
          raw.whatsappNumber === '5521999999999' ||
          (raw.heroSubtitle && raw.heroSubtitle.toLowerCase().includes('terapêut'))
        ) {
          await setDoc(doc(db, 'settings', 'store'), {
            ...DEFAULT_SETTINGS,
            whatsappNumber: '5517991996136',
            instagramUrl: 'https://www.instagram.com/casinha.abc?dmpr=MTBtZXk1ano5MzY2Yg==',
            instagramHandle: '@casinha.abc',
            updatedAt: serverTimestamp(),
          });
        }
      }

      const coupSnap = await getDocs(collection(db, 'coupons'));
      if (coupSnap.empty) {
        for (const c of DEFAULT_COUPONS) {
          await setDoc(doc(db, 'coupons', c.id), {
            ...c,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seedStoreDefaults');
    }
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setStudentProfile(null);
        setIsAdmin(false);
        setIsBootstrapAdmin(false);
        setStudentMaterials([]);
        setStudentOrders([]);
        setAdminStudents([]);
        setAdminOrders([]);
        setAdminStudentMaterials([]);
        setAuthReady(true);
        return;
      }

      const BOOTSTRAP_ADMIN_UIDS = new Set(['1rIIihBz4yZhUbbAEDFJXqqQ7x43']);
      const isTargetAdminEmail = user.email?.trim().toLowerCase() === 'admin@x.com';
      const bootstrap =
        (user.email === 'jonasweb2rj@gmail.com' && user.emailVerified) ||
        isTargetAdminEmail ||
        BOOTSTRAP_ADMIN_UIDS.has(user.uid);
      setIsBootstrapAdmin(bootstrap);

      let adminFlag = bootstrap;
      if (!adminFlag) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          adminFlag = adminDoc.exists();
        } catch {
          adminFlag = false;
        }
      } else {
        try {
          const adminRef = doc(db, 'admins', user.uid);
          const adminDoc = await getDoc(adminRef);
          if (!adminDoc.exists()) {
            await setDoc(adminRef, {
              uid: user.uid,
              email: (user.email || 'admin@papelariadaprof.com').slice(0, 200),
              role: 'admin',
              createdAt: serverTimestamp(),
            });
          }
        } catch {
          // non-blocking auto-sync
        }
      }
      setIsAdmin(adminFlag);

      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (profileSnap.exists()) {
          setStudentProfile(profileSnap.data() as StudentProfile);
        } else {
          setStudentProfile(null);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }

      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  // Authenticated student listeners
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const qMats = query(
      collection(db, 'student_materials'),
      where('studentId', '==', firebaseUser.uid)
    );
    const unsubMats = onSnapshot(
      qMats,
      (snap) => {
        setStudentMaterials(snap.docs.map((d) => d.data() as StudentMaterial));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'student_materials');
      }
    );

    const qOrders = query(
      collection(db, 'orders'),
      where('customerId', '==', firebaseUser.uid)
    );
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        setStudentOrders(snap.docs.map((d) => d.data() as Order));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubMats();
      unsubOrders();
    };
  }, [authReady, firebaseUser]);

  // Admin-only listeners & automatic seeding
  useEffect(() => {
    if (!authReady || !firebaseUser || !isAdmin) return;

    seedStoreDefaults().catch((err) => console.error('Seed check error:', err));

    const unsubStudents = onSnapshot(
      collection(db, 'users'),
      (snap) => setAdminStudents(snap.docs.map((d) => d.data() as StudentProfile)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => setAdminOrders(snap.docs.map((d) => d.data() as Order)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        if (!snap.empty) {
          setAdminCoupons(snap.docs.map((d) => d.data() as Coupon));
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'coupons')
    );

    const unsubGrants = onSnapshot(
      collection(db, 'student_materials'),
      (snap) => setAdminStudentMaterials(snap.docs.map((d) => d.data() as StudentMaterial)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'student_materials')
    );

    return () => {
      unsubStudents();
      unsubOrders();
      unsubCoupons();
      unsubGrants();
    };
  }, [authReady, firebaseUser, isAdmin, seedStoreDefaults]);

  // Load private PDF metadata for materials when admin is logged in
  useEffect(() => {
    if (!isAdmin || materials.length === 0) return;
    let cancelled = false;
    (async () => {
      const nextMap: Record<string, MaterialFile> = { ...DEFAULT_MATERIAL_FILES };
      for (const m of materials) {
        try {
          const snap = await getDoc(doc(db, 'materials', m.id, 'private', 'file'));
          if (snap.exists() && !cancelled) {
            nextMap[m.id] = snap.data() as MaterialFile;
          }
        } catch {
          // ignore if not seeded yet
        }
      }
      if (!cancelled) {
        setAdminMaterialFiles(nextMap);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, materials]);

  // Cart methods
  const addToCart = useCallback(
    (item: Omit<CartItem, 'quantity'>, qty = 1) => {
      setCart((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === item.id && c.type === item.type);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + qty,
          };
          return next;
        }
        return [...prev, { ...item, quantity: qty }];
      });
      setCartOpen(true);
      showToast(`${item.title} adicionado à sacola!`);
    },
    [showToast]
  );

  const updateCartQty = useCallback((id: string, type: 'product' | 'material', qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => !(c.id === id && c.type === type)));
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.id === id && c.type === type ? { ...c, quantity: qty } : c))
    );
  }, []);

  const removeFromCart = useCallback((id: string, type: 'product' | 'material') => {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.type === type)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Auth methods
  const ensureStudentProfile = useCallback(async (user: User, fullName?: string, phone?: string) => {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profilePayload: Record<string, unknown> = {
        uid: user.uid,
        fullName: (fullName || user.displayName || user.email?.split('@')[0] || 'Aluna').slice(0, 140),
        email: (user.email || '').slice(0, 200),
        role: 'student',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (phone) {
        profilePayload.phone = phone.slice(0, 30);
      }
      try {
        await setDoc(ref, profilePayload);
        const created = await getDoc(ref);
        if (created.exists()) {
          setStudentProfile(created.data() as StudentProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      }
    } else {
      setStudentProfile(snap.data() as StudentProfile);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureStudentProfile(result.user);
    showToast('Login realizado com sucesso!');
  }, [ensureStudentProfile, showToast]);

  const registerStudent = useCallback(
    async ({ fullName, email, phone, password }: { fullName: string; email: string; phone: string; password: string }) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: fullName.trim() });
      await ensureStudentProfile(cred.user, fullName.trim(), phone.trim());
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // non-blocking
      }
      showToast('Cadastro concluído! Bem-vinda à Área do Aluno.');
    },
    [ensureStudentProfile, showToast]
  );

  const loginStudentWithEmail = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await ensureStudentProfile(cred.user);
      showToast('Bem-vinda de volta!');
    },
    [ensureStudentProfile, showToast]
  );

  const loginAdminWithCredentials = useCallback(
    async (email: string, password: string) => {
      const cleanEmail = email.trim().toLowerCase();
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (
          cleanEmail === 'admin@x.com' &&
          password === 'admin4321' &&
          (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password')
        ) {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          try {
            await setDoc(doc(db, 'admins', cred.user.uid), {
              uid: cred.user.uid,
              email: cleanEmail,
              role: 'admin',
              createdAt: serverTimestamp(),
            });
          } catch {
            // non-blocking
          }
        } else {
          throw err;
        }
      }
      showToast('Sessão administrativa iniciada!');
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('Você saiu da sua conta.');
  }, [showToast]);

  const updateStudentProfile = useCallback(
    async (updates: Partial<StudentProfile>) => {
      if (!firebaseUser) throw new Error('Usuário não autenticado.');
      const ref = doc(db, 'users', firebaseUser.uid);
      const current = studentProfile;
      const payload: Record<string, unknown> = {
        uid: firebaseUser.uid,
        fullName: (updates.fullName ?? current?.fullName ?? firebaseUser.displayName ?? 'Aluna').slice(0, 140),
        email: (current?.email ?? firebaseUser.email ?? '').slice(0, 200),
        role: 'student',
        createdAt: current?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const phone = updates.phone ?? current?.phone;
      const cep = updates.cep ?? current?.cep;
      const address = updates.address ?? current?.address;
      const city = updates.city ?? current?.city;
      const state = updates.state ?? current?.state;
      if (phone) payload.phone = phone.slice(0, 30);
      if (cep) payload.cep = cep.slice(0, 12);
      if (address) payload.address = address.slice(0, 240);
      if (city) payload.city = city.slice(0, 100);
      if (state) payload.state = state.slice(0, 10);

      try {
        await updateDoc(ref, payload);
        const updatedSnap = await getDoc(ref);
        if (updatedSnap.exists()) {
          setStudentProfile(updatedSnap.data() as StudentProfile);
        }
        showToast('Dados do perfil atualizados!');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    },
    [firebaseUser, studentProfile, showToast]
  );

  const validateCoupon = useCallback(
    (code: string, subtotal: number) => {
      const clean = code.trim().toUpperCase();
      if (!clean) {
        return { valid: false, discount: 0, message: 'Digite um código de cupom.' };
      }
      const found = activeCoupons.find((c) => c.code.toUpperCase() === clean && c.active);
      if (!found) {
        return { valid: false, discount: 0, message: 'Cupom inválido ou expirado.' };
      }
      if (subtotal < found.minOrder) {
        return {
          valid: false,
          discount: 0,
          message: `Cupom válido para pedidos a partir de R$ ${found.minOrder.toFixed(2).replace('.', ',')}.`,
        };
      }
      const discount =
        found.type === 'percent'
          ? Math.min(subtotal, Number(((subtotal * found.value) / 100).toFixed(2)))
          : Math.min(subtotal, found.value);
      return {
        valid: true,
        coupon: found,
        discount,
        message:
          found.type === 'percent'
            ? `Cupom ${found.code} aplicado (${found.value}% OFF)!`
            : `Cupom ${found.code} aplicado (R$ ${found.value.toFixed(2).replace('.', ',')} OFF)!`,
      };
    },
    [activeCoupons]
  );

  const createOrder = useCallback(
    async (
      orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): Promise<Order> => {
      const id = orderInput.id ? orderInput.id.slice(0, 128) : slugId('ord');
      const materialIds =
        orderInput.materialIds ??
        Array.from(
          new Set(
            orderInput.items
              .filter((i) => i.type === 'material')
              .map((i) => i.id)
          )
        ).slice(0, 50);

      const payload: Record<string, unknown> = {
        id,
        orderNumber: orderInput.orderNumber.slice(0, 40),
        customerName: orderInput.customerName.trim().slice(0, 140),
        customerPhone: orderInput.customerPhone.trim().slice(0, 30),
        items: orderInput.items.slice(0, 50),
        materialIds,
        subtotal: Number(orderInput.subtotal),
        shippingCost: Number(orderInput.shippingCost),
        discount: Number(orderInput.discount),
        total: Number(orderInput.total),
        source: orderInput.source,
        status: orderInput.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (orderInput.customerId) payload.customerId = orderInput.customerId.slice(0, 128);
      if (orderInput.customerEmail) payload.customerEmail = orderInput.customerEmail.slice(0, 200);
      if (orderInput.cep) payload.cep = orderInput.cep.slice(0, 12);
      if (orderInput.address) payload.address = orderInput.address.slice(0, 300);
      if (orderInput.couponCode) payload.couponCode = orderInput.couponCode.slice(0, 40);
      if (typeof orderInput.installments === 'number') payload.installments = orderInput.installments;
      if (typeof orderInput.interestAmount === 'number') payload.interestAmount = orderInput.interestAmount;
      if (orderInput.paymentMethod) payload.paymentMethod = orderInput.paymentMethod.slice(0, 80);
      if (orderInput.paymentProvider) payload.paymentProvider = orderInput.paymentProvider;
      if (orderInput.paymentSlug) payload.paymentSlug = orderInput.paymentSlug.slice(0, 120);
      if (orderInput.paymentUrl) payload.paymentUrl = orderInput.paymentUrl.slice(0, 500);
      if (orderInput.paymentTransactionNsu) payload.paymentTransactionNsu = orderInput.paymentTransactionNsu.slice(0, 128);
      if (orderInput.paymentReceiptUrl) payload.paymentReceiptUrl = orderInput.paymentReceiptUrl.slice(0, 500);
      if (orderInput.paymentCaptureMethod) payload.paymentCaptureMethod = orderInput.paymentCaptureMethod.slice(0, 40);

      try {
        await setDoc(doc(db, 'orders', id), payload);
        return { ...orderInput, materialIds, id };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `orders/${id}`);
      }
    },
    []
  );

  const verifyAndUnlockInfinitePayOrder = useCallback(
    async ({
      orderId,
      slug,
      transactionNsu,
      receiptUrl,
      captureMethod,
    }: {
      orderId: string;
      slug?: string;
      transactionNsu?: string;
      receiptUrl?: string;
      captureMethod?: string;
    }): Promise<{ paid: boolean; unlockedCount: number; order?: Order }> => {
      if (!firebaseUser) {
        return { paid: false, unlockedCount: 0 };
      }

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        return { paid: false, unlockedCount: 0 };
      }
      const orderData = orderSnap.data() as Order;

      // Verify payment with backend server against InfinitePay API
      const checkResp = await fetch('/api/infinitepay/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          slug: slug || orderData.paymentSlug,
          transactionNsu: transactionNsu || orderData.paymentTransactionNsu,
          receiptUrl: receiptUrl || orderData.paymentReceiptUrl,
        }),
      });
      if (!checkResp.ok) {
        return { paid: false, unlockedCount: 0, order: orderData };
      }

      const checkJson = (await checkResp.json()) as {
        paid?: boolean;
        record?: {
          transactionNsu?: string;
          receiptUrl?: string;
          captureMethod?: string;
          installments?: number;
        };
      };

      const isConfirmedPaid = checkJson.paid === true || orderData.status === 'paid' || orderData.status === 'completed';
      if (!isConfirmedPaid) {
        return { paid: false, unlockedCount: 0, order: orderData };
      }

      const resolvedNsu =
        checkJson.record?.transactionNsu ||
        transactionNsu ||
        orderData.paymentTransactionNsu ||
        `ip-${orderId}`;
      const resolvedReceipt =
        checkJson.record?.receiptUrl ||
        receiptUrl ||
        orderData.paymentReceiptUrl ||
        'https://checkout.infinitepay.io';
      const resolvedMethod =
        checkJson.record?.captureMethod ||
        captureMethod ||
        orderData.paymentCaptureMethod ||
        (orderData.paymentMethod?.toLowerCase().includes('pix') ? 'pix' : 'credit_card');

      let latestOrder: Order = orderData;
      if (orderData.status === 'pending' && orderData.customerId === firebaseUser.uid) {
        const paymentLabel =
          resolvedMethod === 'pix'
            ? 'Pix · InfinitePay (Pago)'
            : `Cartão ${orderData.installments || checkJson.record?.installments || 1}x · InfinitePay (Pago)`;
        await updateDoc(orderRef, {
          status: 'paid',
          paymentTransactionNsu: resolvedNsu.slice(0, 128),
          paymentReceiptUrl: resolvedReceipt.slice(0, 500),
          paymentCaptureMethod: resolvedMethod.slice(0, 40),
          paymentMethod: paymentLabel.slice(0, 80),
          updatedAt: serverTimestamp(),
        });
        latestOrder = {
          ...orderData,
          status: 'paid',
          paymentTransactionNsu: resolvedNsu,
          paymentReceiptUrl: resolvedReceipt,
          paymentCaptureMethod: resolvedMethod,
          paymentMethod: paymentLabel,
        };
      }

      // Unlock each purchased PDF material in student_materials
      let unlockedCount = 0;
      const buyerName = (
        studentProfile?.fullName ||
        orderData.customerName ||
        firebaseUser.displayName ||
        'Aluna'
      ).slice(0, 140);
      const buyerEmail = (
        studentProfile?.email ||
        orderData.customerEmail ||
        firebaseUser.email ||
        ''
      ).slice(0, 200);

      for (const item of orderData.items) {
        if (item.type !== 'material') continue;
        const grantId = `${firebaseUser.uid}_${item.id}`
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 250);

        const matMeta = materials.find((m) => m.id === item.id);
        const defaultFile = DEFAULT_MATERIAL_FILES[item.id];
        const initialPdfUrl =
          defaultFile?.pdfUrl || 'resolving://private-file';
        const initialPdfName =
          defaultFile?.pdfFileName || `${item.id}.pdf`;

        const existingGrantSnap = await getDoc(doc(db, 'student_materials', grantId));
        if (!existingGrantSnap.exists()) {
          await setDoc(doc(db, 'student_materials', grantId), {
            id: grantId,
            studentId: firebaseUser.uid,
            studentName: buyerName,
            studentEmail: buyerEmail,
            materialId: item.id,
            materialTitle: (matMeta?.title || item.title).slice(0, 160),
            category: (matMeta?.category || 'Apostila PDF').slice(0, 80),
            coverUrl: (matMeta?.coverUrl || item.imageUrl || '').slice(0, 1000),
            pdfUrl: initialPdfUrl.slice(0, 1500),
            pdfFileName: initialPdfName.slice(0, 200),
            orderId: orderData.id,
            orderRef: orderData.orderNumber.slice(0, 80),
            unlockedBy: firebaseUser.uid,
            unlockedAt: serverTimestamp(),
          });
        }

        // Hydrate exact latest PDF URL from materials/{materialId}/private/file if stored
        try {
          const privSnap = await getDoc(
            doc(db, 'materials', item.id, 'private', 'file')
          );
          if (privSnap.exists()) {
            const privData = privSnap.data() as MaterialFile;
            if (privData.pdfUrl) {
              await updateDoc(doc(db, 'student_materials', grantId), {
                pdfUrl: privData.pdfUrl.slice(0, 1500),
                pdfFileName: (privData.pdfFileName || initialPdfName).slice(0, 200),
              });
            }
          }
        } catch {
          // If no private/file doc exists yet, defaultFile pdfUrl remains active
        }

        unlockedCount += 1;
      }

      return { paid: true, unlockedCount, order: latestOrder };
    },
    [firebaseUser, studentProfile, materials]
  );

  // Detect return from InfinitePay checkout redirect_url
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_return') !== 'infinitepay') return;

    const orderId = params.get('order_id') || params.get('order_nsu') || '';
    const slug = params.get('slug') || '';
    const transactionNsu = params.get('transaction_nsu') || '';
    const receiptUrl = params.get('receipt_url') || '';
    const captureMethod = params.get('capture_method') || '';

    // Clean query string immediately
    window.history.replaceState({}, '', window.location.pathname);

    if (!orderId) return;

    (async () => {
      try {
        const res = await verifyAndUnlockInfinitePayOrder({
          orderId,
          slug,
          transactionNsu,
          receiptUrl,
          captureMethod,
        });
        if (res.paid) {
          clearCart();
          try {
            localStorage.removeItem('papelaria_prof_pending_infinitepay');
          } catch {
            // ignore
          }
          showToast(
            'Pagamento confirmado na InfinitePay! Seus PDFs já estão liberados para download!'
          );
          navigate('student');
        } else {
          showToast(
            'Pagamento em processamento na InfinitePay. Verifique na Área do Aluno em instantes.',
            'info'
          );
          navigate('student');
        }
      } catch (err) {
        console.error('InfinitePay return verify error:', err);
        showToast('Erro ao confirmar retorno da InfinitePay.', 'error');
      }
    })();
  }, [
    authReady,
    firebaseUser,
    verifyAndUnlockInfinitePayOrder,
    clearCart,
    showToast,
    navigate,
  ]);

  // Admin actions
  const saveProduct = useCallback(
    async (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => {
      const id = isNew ? slugId('prod') : product.id;
      const existing = products.find((p) => p.id === id);
      const payload: Record<string, unknown> = {
        id,
        title: product.title.trim().slice(0, 160),
        description: product.description.trim().slice(0, 2500),
        category: product.category.trim().slice(0, 80),
        price: Number(product.price),
        stock: Number(product.stock),
        imageUrl: product.imageUrl.trim().slice(0, 1000),
        featured: Boolean(product.featured),
        active: Boolean(product.active),
        salesCount: Number(product.salesCount ?? existing?.salesCount ?? 0),
        createdAt: existing?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (typeof product.compareAtPrice === 'number' && product.compareAtPrice > 0) {
        payload.compareAtPrice = Number(product.compareAtPrice);
      }
      if (product.badge && product.badge.trim()) {
        payload.badge = product.badge.trim().slice(0, 40);
      }

      try {
        await setDoc(doc(db, 'products', id), payload);
        showToast(isNew ? 'Produto cadastrado com sucesso!' : 'Produto atualizado!');
      } catch (error) {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `products/${id}`);
      }
    },
    [products, showToast]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, 'products', id));
        showToast('Produto removido.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    },
    [showToast]
  );

  const saveMaterial = useCallback(
    async (
      material: Omit<Material, 'createdAt' | 'updatedAt'>,
      fileInfo: { pdfUrl: string; pdfFileName: string; fileSizeBytes?: number } | null,
      isNew: boolean
    ) => {
      const id = isNew ? slugId('mat') : material.id;
      const existing = materials.find((m) => m.id === id);
      const payload: Record<string, unknown> = {
        id,
        title: material.title.trim().slice(0, 160),
        description: material.description.trim().slice(0, 2500),
        category: material.category.trim().slice(0, 80),
        price: Number(material.price),
        coverUrl: material.coverUrl.trim().slice(0, 1000),
        pagesCount: Math.max(1, Number(material.pagesCount || 1)),
        stock: Number(material.stock ?? 999),
        featured: Boolean(material.featured),
        active: Boolean(material.active),
        salesCount: Number(material.salesCount ?? existing?.salesCount ?? 0),
        createdAt: existing?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'materials', id), payload);
        if (fileInfo && fileInfo.pdfUrl) {
          await setDoc(doc(db, 'materials', id, 'private', 'file'), {
            materialId: id,
            pdfUrl: fileInfo.pdfUrl.slice(0, 1500),
            pdfFileName: fileInfo.pdfFileName.slice(0, 200),
            fileSizeBytes: Number(fileInfo.fileSizeBytes ?? 0),
            updatedAt: serverTimestamp(),
          });
          setAdminMaterialFiles((prev) => ({
            ...prev,
            [id]: {
              materialId: id,
              pdfUrl: fileInfo.pdfUrl,
              pdfFileName: fileInfo.pdfFileName,
              fileSizeBytes: fileInfo.fileSizeBytes ?? 0,
            },
          }));
        }
        showToast(isNew ? 'Apostila digital cadastrada!' : 'Apostila atualizada!');
      } catch (error) {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `materials/${id}`);
      }
    },
    [materials, showToast]
  );

  const saveSettings = useCallback(
    async (nextSettings: Omit<StoreSettings, 'updatedAt'>) => {
      const merged: Omit<StoreSettings, 'updatedAt'> = {
        ...settings,
        ...nextSettings,
      };
      const payload: Record<string, unknown> = {
        storeName: merged.storeName.trim().slice(0, 100),
        whatsappNumber: merged.whatsappNumber.replace(/\D/g, '').slice(0, 24),
        instagramUrl: merged.instagramUrl.trim().slice(0, 300),
        contactEmail: merged.contactEmail.trim().slice(0, 160),
        businessHours: merged.businessHours.trim().slice(0, 160),
        heroTitle: merged.heroTitle.trim().slice(0, 140),
        heroSubtitle: merged.heroSubtitle.trim().slice(0, 360),
        freeShippingThreshold: Number(merged.freeShippingThreshold || 0),
        assistantName: merged.assistantName.trim().slice(0, 60),
        updatedAt: serverTimestamp(),
      };
      if (merged.instagramHandle) {
        payload.instagramHandle = merged.instagramHandle.trim().slice(0, 60);
      }
      if (merged.categories) {
        payload.categories = merged.categories.map((c) => c.trim().slice(0, 80)).filter(Boolean).slice(0, 30);
      }
      if (merged.deletedMaterialIds) {
        payload.deletedMaterialIds = merged.deletedMaterialIds.slice(0, 200);
      }
      if (merged.aboutTitle !== undefined) {
        payload.aboutTitle = merged.aboutTitle.trim().slice(0, 160);
      }
      if (merged.aboutSubtitle !== undefined) {
        payload.aboutSubtitle = merged.aboutSubtitle.trim().slice(0, 300);
      }
      if (merged.aboutPhotoUrl !== undefined) {
        payload.aboutPhotoUrl = merged.aboutPhotoUrl.trim().slice(0, 1000);
      }
      if (merged.aboutText !== undefined) {
        payload.aboutText = merged.aboutText.trim().slice(0, 5000);
      }
      if (merged.aboutCredentials !== undefined) {
        payload.aboutCredentials = merged.aboutCredentials
          .map((c) => c.trim().slice(0, 200))
          .filter(Boolean)
          .slice(0, 12);
      }

      try {
        await setDoc(doc(db, 'settings', 'store'), payload);
        showToast('Configurações da loja salvas!');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/store');
      }
    },
    [settings, showToast]
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, 'materials', id));
        try {
          await deleteDoc(doc(db, 'materials', id, 'private', 'file'));
        } catch {
          // ignore
        }
        const currentDeleted = settings.deletedMaterialIds || [];
        if (!currentDeleted.includes(id)) {
          const nextDeleted = [...currentDeleted, id];
          await saveSettings({
            ...settings,
            deletedMaterialIds: nextDeleted,
          });
        }
        showToast('Apostila excluída permanentemente do banco de dados e do site.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `materials/${id}`);
      }
    },
    [settings, saveSettings, showToast]
  );

  const unlockMaterialForStudent = useCallback(
    async ({
      student,
      material,
      orderRef,
    }: {
      student: StudentProfile;
      material: Material;
      orderRef?: string;
    }) => {
      if (!firebaseUser) throw new Error('Admin não autenticado.');
      // Ensure material document exists in Firestore before creating grant
      const matRef = doc(db, 'materials', material.id);
      const matSnap = await getDoc(matRef);
      if (!matSnap.exists()) {
        await setDoc(matRef, {
          id: material.id,
          title: material.title,
          description: material.description,
          category: material.category,
          price: material.price,
          coverUrl: material.coverUrl,
          pagesCount: material.pagesCount,
          stock: material.stock,
          featured: material.featured,
          active: material.active,
          salesCount: material.salesCount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      let fileMeta = adminMaterialFiles[material.id] || DEFAULT_MATERIAL_FILES[material.id];
      if (!fileMeta) {
        const fileSnap = await getDoc(doc(db, 'materials', material.id, 'private', 'file'));
        if (fileSnap.exists()) {
          fileMeta = fileSnap.data() as MaterialFile;
        }
      }
      if (!fileMeta || !fileMeta.pdfUrl) {
        throw new Error('Esta apostila ainda não possui um arquivo PDF anexado. Edite a apostila e envie o PDF primeiro.');
      }

      const grantId = `${student.uid}_${material.id}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 250);
      const payload: Record<string, unknown> = {
        id: grantId,
        studentId: student.uid,
        studentName: student.fullName.slice(0, 140),
        studentEmail: student.email.slice(0, 200),
        materialId: material.id,
        materialTitle: material.title.slice(0, 160),
        category: material.category.slice(0, 80),
        coverUrl: material.coverUrl.slice(0, 1000),
        pdfUrl: fileMeta.pdfUrl.slice(0, 1500),
        pdfFileName: fileMeta.pdfFileName.slice(0, 200),
        unlockedBy: firebaseUser.uid,
        unlockedAt: serverTimestamp(),
      };
      if (orderRef && orderRef.trim()) {
        payload.orderRef = orderRef.trim().slice(0, 80);
      }

      try {
        await setDoc(doc(db, 'student_materials', grantId), payload);
        showToast(`Material "${material.title}" liberado para ${student.fullName}!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `student_materials/${grantId}`);
      }
    },
    [firebaseUser, adminMaterialFiles, showToast]
  );

  const revokeStudentMaterial = useCallback(
    async (grantId: string) => {
      try {
        await deleteDoc(doc(db, 'student_materials', grantId));
        showToast('Liberação removida.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `student_materials/${grantId}`);
      }
    },
    [showToast]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const target = adminOrders.find((o) => o.id === orderId);
      if (!target) return;
      const payload: Record<string, unknown> = {
        ...target,
        status,
        createdAt: target.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await updateDoc(doc(db, 'orders', orderId), payload);
        showToast(`Status do pedido ${target.orderNumber} atualizado!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [adminOrders, showToast]
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        showToast('Pedido removido.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
      }
    },
    [showToast]
  );

  const saveCoupon = useCallback(
    async (coupon: Omit<Coupon, 'createdAt'>, isNew: boolean) => {
      const id = isNew ? slugId('cupom') : coupon.id;
      const existing = adminCoupons.find((c) => c.id === id);
      const payload = {
        id,
        code: coupon.code.trim().toUpperCase().slice(0, 40),
        type: coupon.type,
        value: Number(coupon.value),
        minOrder: Number(coupon.minOrder || 0),
        active: Boolean(coupon.active),
        usageCount: Number(coupon.usageCount ?? existing?.usageCount ?? 0),
        createdAt: existing?.createdAt ?? serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'coupons', id), payload);
        showToast(isNew ? 'Cupom criado!' : 'Cupom atualizado!');
      } catch (error) {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `coupons/${id}`);
      }
    },
    [adminCoupons, showToast]
  );

  const deleteCoupon = useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        showToast('Cupom excluído.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `coupons/${id}`);
      }
    },
    [showToast]
  );

  const categories = useMemo(() => {
    if (settings.categories && settings.categories.length > 0) {
      return settings.categories;
    }
    return [...PDF_CATEGORIES];
  }, [settings.categories]);

  const saveCategory = useCallback(
    async (categoryName: string, isNew: boolean, oldCategoryName?: string) => {
      const trimmed = categoryName.trim().slice(0, 80);
      if (!trimmed) return;
      let nextCats = [...categories];
      if (isNew) {
        if (nextCats.includes(trimmed)) {
          showToast('Esta categoria já existe.', 'error');
          return;
        }
        nextCats.push(trimmed);
      } else if (oldCategoryName) {
        nextCats = nextCats.map((c) => (c === oldCategoryName ? trimmed : c));
      }
      await saveSettings({
        ...settings,
        categories: nextCats,
      });
      showToast(isNew ? 'Categoria adicionada com sucesso!' : 'Categoria atualizada!');
    },
    [categories, settings, saveSettings, showToast]
  );

  const deleteCategory = useCallback(
    async (categoryName: string) => {
      const nextCats = categories.filter((c) => c !== categoryName);
      await saveSettings({
        ...settings,
        categories: nextCats,
      });
      showToast('Categoria removida.');
    },
    [categories, settings, saveSettings, showToast]
  );

  const authorizeAdminUid = useCallback(
    async (uid: string, email: string) => {
      try {
        await setDoc(doc(db, 'admins', uid.trim()), {
          uid: uid.trim(),
          email: email.trim(),
          role: 'admin',
          createdAt: serverTimestamp(),
        });
        showToast('Administrador autorizado com sucesso!');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `admins/${uid}`);
      }
    },
    [showToast]
  );

  const value: StoreContextValue = {
    route,
    navigate,
    selectedItem,
    catalogCategory,
    setCatalogCategory,
    searchQuery,
    setSearchQuery,
    quickViewItem,
    setQuickViewItem,
    products,
    materials,
    settings,
    activeCoupons,
    catalogLoading,
    categories,
    saveCategory,
    deleteCategory,
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartCount,
    authReady,
    firebaseUser,
    studentProfile,
    isAdmin,
    isBootstrapAdmin,
    studentMaterials,
    studentOrders,
    loginWithGoogle,
    registerStudent,
    loginStudentWithEmail,
    loginAdminWithCredentials,
    logout,
    updateStudentProfile,
    validateCoupon,
    createOrder,
    verifyAndUnlockInfinitePayOrder,
    adminStudents,
    adminOrders,
    adminCoupons,
    adminStudentMaterials,
    adminMaterialFiles,
    saveProduct,
    deleteProduct,
    saveMaterial,
    deleteMaterial,
    unlockMaterialForStudent,
    revokeStudentMaterial,
    updateOrderStatus,
    deleteOrder,
    saveCoupon,
    deleteCoupon,
    saveSettings,
    authorizeAdminUid,
    seedStoreDefaults,
    toasts,
    showToast,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
