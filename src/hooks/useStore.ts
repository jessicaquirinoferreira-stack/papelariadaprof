import { useCallback, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';
import {
  grantMaterialsToStudentInStore,
  loadAdminCollections,
  loadLmsAdminOverview,
  loadPublicDigitalMaterials,
  loadPublicStorefrontData,
  loadStudentGrantsFromStore,
  persistCoupon,
  persistDigitalMaterial,
  persistOrder,
  persistProduct,
  persistSettings,
  removeCouponFromFirestore,
  removeDigitalMaterialFromStore,
  removeProductFromFirestore,
  revokeStudentGrantInStore,
  saveStudentProfileToFirestore,
  updateOrderStatusInFirestore,
} from '../lib/firestoreService';
import {
  DEFAULT_STORE_SETTINGS,
  SEED_BLOG_POSTS,
  SEED_COUPONS,
  SEED_DIGITAL_MATERIALS,
  SEED_ORDERS,
  SEED_PRODUCTS,
} from '../data/seedData';
import type {
  BlogPost,
  CartItem,
  Coupon,
  DigitalMaterial,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
  StudentMaterialGrant,
  StudentProfile,
} from '../types/store';
import { getEffectivePrice } from '../lib/commerce';

const STORAGE_CART = 'papelaria_prof_cart_v1';
const STORAGE_WISHLIST = 'papelaria_prof_wishlist_v1';
const STORAGE_LOCAL_PRODUCTS = 'papelaria_prof_products_v1';
const STORAGE_LOCAL_ORDERS = 'papelaria_prof_orders_v1';
const STORAGE_LOCAL_COUPONS = 'papelaria_prof_coupons_v1';
const STORAGE_LOCAL_SETTINGS = 'papelaria_prof_settings_v1';
const STORAGE_ADMIN_SESSION = 'papelaria_prof_admin_session_v1';
const STORAGE_STUDENT_SESSION = 'papelaria_prof_student_session_v1';

export interface ToastMessage {
  id: string;
  title: string;
  tone: 'success' | 'info' | 'error';
}

export interface StudentRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  studentOrChildName: string;
  gradeOrAge: string;
  cityState: string;
  notes?: string;
  password: string;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function useStore() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(STORAGE_LOCAL_PRODUCTS, SEED_PRODUCTS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    readStorage<Order[]>(STORAGE_LOCAL_ORDERS, SEED_ORDERS)
  );
  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    readStorage<Coupon[]>(STORAGE_LOCAL_COUPONS, SEED_COUPONS)
  );
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(SEED_BLOG_POSTS);
  const [settings, setSettings] = useState<StoreSettings>(() =>
    readStorage<StoreSettings>(STORAGE_LOCAL_SETTINGS, DEFAULT_STORE_SETTINGS)
  );

  // Exclusive Private Tutoring Apostilas & Student Area
  const [digitalMaterials, setDigitalMaterials] = useState<DigitalMaterial[]>(() =>
    SEED_DIGITAL_MATERIALS.map(({ pdfUrl: _ignored, ...rest }) => rest)
  );
  const [adminMaterials, setAdminMaterials] = useState<DigitalMaterial[]>(SEED_DIGITAL_MATERIALS);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [allStudentGrants, setAllStudentGrants] = useState<StudentMaterialGrant[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(() =>
    readStorage<StudentProfile | null>(STORAGE_STUDENT_SESSION, null)
  );
  const [currentStudentGrants, setCurrentStudentGrants] = useState<StudentMaterialGrant[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_CART, [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_WISHLIST, [])
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_ADMIN_SESSION, false)
  );
  const [firebaseAuthMode, setFirebaseAuthMode] = useState<'firebase' | 'preview'>('preview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (title: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_CART, cart);
  }, [cart]);

  useEffect(() => {
    writeStorage(STORAGE_WISHLIST, wishlist);
  }, [wishlist]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-taupe', settings.primaryColor || '#6F4E42');
    document.documentElement.style.setProperty('--color-rose-accent', settings.accentColor || '#E89EB8');
  }, [settings.primaryColor, settings.accentColor]);

  const refreshLmsAdminOverview = useCallback(async () => {
    const overview = await loadLmsAdminOverview();
    setStudents(overview.students);
    setAdminMaterials(overview.materials);
    setDigitalMaterials(
      overview.materials
        .filter((m) => m.active)
        .map(({ pdfUrl: _ignored, ...rest }) => rest)
    );
    setAllStudentGrants(overview.grants);
  }, []);

  const refreshCurrentStudentGrants = useCallback(
    async (stu: StudentProfile | null) => {
      if (!stu) {
        setCurrentStudentGrants([]);
        return;
      }
      const grants = await loadStudentGrantsFromStore(stu.uid, stu.email);
      setCurrentStudentGrants(grants);
    },
    []
  );

  useEffect(() => {
    let active = true;
    testFirestoreConnection();

    loadPublicStorefrontData().then((data) => {
      if (!active) return;
      const localProds = readStorage<Product[] | null>(STORAGE_LOCAL_PRODUCTS, null);
      if (!localProds) {
        setProducts(data.products);
      }
      const localSettings = readStorage<StoreSettings | null>(STORAGE_LOCAL_SETTINGS, null);
      if (!localSettings) {
        setSettings(data.settings);
      }
      setBlogPosts(data.blogPosts);
      setLoading(false);
    });

    loadPublicDigitalMaterials().then((mats) => {
      if (active && mats.length > 0) setDigitalMaterials(mats);
    });

    const savedStudent = readStorage<StudentProfile | null>(STORAGE_STUDENT_SESSION, null);
    if (savedStudent) {
      loadStudentGrantsFromStore(savedStudent.uid, savedStudent.email).then((g) => {
        if (active) setCurrentStudentGrants(g);
      });
    }

    if (readStorage<boolean>(STORAGE_ADMIN_SESSION, false)) {
      loadLmsAdminOverview().then((overview) => {
        if (!active) return;
        setStudents(overview.students);
        setAdminMaterials(overview.materials);
        setAllStudentGrants(overview.grants);
      });
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setFirebaseAuthMode('firebase');
        const adminData = await loadAdminCollections();
        if (!active) return;
        if (adminData.products.length > 0) setProducts(adminData.products);
        if (adminData.orders.length > 0) setOrders(adminData.orders);
        if (adminData.coupons.length > 0) setCoupons(adminData.coupons);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1, variantLabel?: string) => {
      const variantObj = product.variants?.find((v) => v.label === variantLabel);
      const basePrice = getEffectivePrice(product);
      const unitPrice = Math.max(0, basePrice + (variantObj?.priceDelta || 0));

      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === product.id && i.variantLabel === variantLabel
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + quantity,
          };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0] || '/src/assets/images/prod_alfabetizacao_1795023315545.jpg',
            unitPrice,
            quantity,
            variantLabel,
            weightGrams: product.weightGrams || 350,
            isDigital: false,
          },
        ];
      });
      setIsCartOpen(true);
      pushToast(`${product.name} adicionado à sacola!`);
    },
    [pushToast]
  );

  const addMaterialToCart = useCallback(
    (material: DigitalMaterial) => {
      const effective =
        typeof material.promoPrice === 'number' &&
        material.promoPrice > 0 &&
        material.promoPrice < material.price
          ? material.promoPrice
          : material.price;

      setCart((prev) => {
        const idx = prev.findIndex((i) => i.productId === material.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        return [
          ...prev,
          {
            productId: material.id,
            slug: material.slug,
            name: material.title,
            image: material.coverImage,
            unitPrice: effective,
            quantity: 1,
            variantLabel: 'PDF Exclusivo (Área do Aluno)',
            weightGrams: 0,
            isDigital: true,
          },
        ];
      });
      setIsCartOpen(true);
      pushToast(`${material.title} adicionada à sacola!`);
    },
    [pushToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, variantLabel: string | undefined, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) => {
            if (item.productId === productId && item.variantLabel === variantLabel) {
              return { ...item, quantity: item.quantity + delta };
            }
            return item;
          })
          .filter((item) => item.quantity > 0)
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string, variantLabel?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantLabel === variantLabel)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const next = exists
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        pushToast(
          exists ? 'Removido dos seus favoritos.' : 'Salvo nos seus favoritos!',
          'info'
        );
        return next;
      });
    },
    [pushToast]
  );

  // Admin auth
  const loginAdminWithCredentials = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; note?: string; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== 'admin@x.com' || password !== 'admin4321') {
        return { ok: false, error: 'Credenciais inválidas. Confira o login e a senha.' };
      }

      try {
        const resp = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (!resp.ok) {
          return { ok: false, error: 'Credenciais administrativas rejeitadas.' };
        }
      } catch {
        // Proceed with local validation
      }

      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setFirebaseAuthMode('firebase');
        setAdminAuthenticated(true);
        writeStorage(STORAGE_ADMIN_SESSION, true);
        await refreshLmsAdminOverview();
        return { ok: true };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
            setFirebaseAuthMode('firebase');
            setAdminAuthenticated(true);
            writeStorage(STORAGE_ADMIN_SESSION, true);
            await refreshLmsAdminOverview();
            return { ok: true };
          } catch {
            // Fall through
          }
        }
        setFirebaseAuthMode('preview');
        setAdminAuthenticated(true);
        writeStorage(STORAGE_ADMIN_SESSION, true);
        await refreshLmsAdminOverview();
        return {
          ok: true,
          note: 'Sessão administrativa iniciada com sincronização local.',
        };
      }
    },
    [refreshLmsAdminOverview]
  );

  const loginAdminWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      await signInWithPopup(auth, googleProvider);
      setFirebaseAuthMode('firebase');
      setAdminAuthenticated(true);
      writeStorage(STORAGE_ADMIN_SESSION, true);
      await refreshLmsAdminOverview();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Não foi possível concluir o login com Google.',
      };
    }
  }, [refreshLmsAdminOverview]);

  const logoutAdmin = useCallback(async () => {
    setAdminAuthenticated(false);
    writeStorage(STORAGE_ADMIN_SESSION, false);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    pushToast('Sessão administrativa encerrada.', 'info');
  }, [pushToast]);

  // Student auth & registration
  const registerStudent = useCallback(
    async (input: StudentRegistrationInput): Promise<{ ok: boolean; error?: string }> => {
      const cleanEmail = input.email.trim().toLowerCase();
      let firebaseUid: string | undefined;

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, input.password);
        firebaseUid = cred.user.uid;
      } catch {
        // Proceed with server-backed salted scrypt registration when Firebase Email/Password is not enabled
      }

      try {
        const res = await fetch('/api/lms/students/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            email: cleanEmail,
            ...(firebaseUid ? { uid: firebaseUid } : {}),
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          student?: StudentProfile;
          grants?: StudentMaterialGrant[];
        };
        if (!res.ok || !data.student) {
          return { ok: false, error: data.error || 'Não foi possível concluir seu cadastro.' };
        }

        if (firebaseUid) {
          await saveStudentProfileToFirestore(data.student);
        }

        setCurrentStudent(data.student);
        setCurrentStudentGrants(data.grants || []);
        writeStorage(STORAGE_STUDENT_SESSION, data.student);
        pushToast(`Bem-vinda(o) à Área do Aluno, ${data.student.fullName.split(' ')[0]}!`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Erro de conexão ao registrar cadastro.' };
      }
    },
    [pushToast]
  );

  const loginStudentWithEmail = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const res = await fetch('/api/lms/students/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: cred.user.uid,
            email: cleanEmail,
            fullName: cred.user.displayName || 'Aluno(a)',
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            student: StudentProfile;
            grants?: StudentMaterialGrant[];
          };
          setCurrentStudent(data.student);
          setCurrentStudentGrants(data.grants || []);
          writeStorage(STORAGE_STUDENT_SESSION, data.student);
          pushToast('Login na Área do Aluno realizado!');
          return { ok: true };
        }
      } catch {
        // Fall through to server password verification
      }

      try {
        const res = await fetch('/api/lms/students/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          student?: StudentProfile;
          grants?: StudentMaterialGrant[];
        };
        if (!res.ok || !data.student) {
          return { ok: false, error: data.error || 'E-mail ou senha inválidos.' };
        }
        setCurrentStudent(data.student);
        setCurrentStudentGrants(data.grants || []);
        writeStorage(STORAGE_STUDENT_SESSION, data.student);
        pushToast(`Olá, ${data.student.fullName.split(' ')[0]}! Bom retorno aos estudos.`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Não foi possível validar seu login.' };
      }
    },
    [pushToast]
  );

  const loginStudentWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email || '';
      const res = await fetch('/api/lms/students/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: cred.user.uid,
          email,
          fullName: cred.user.displayName || 'Aluno(a)',
        }),
      });
      if (!res.ok) {
        return { ok: false, error: 'Erro ao sincronizar perfil Google.' };
      }
      const data = (await res.json()) as {
        student: StudentProfile;
        grants?: StudentMaterialGrant[];
      };
      await saveStudentProfileToFirestore(data.student);
      setCurrentStudent(data.student);
      setCurrentStudentGrants(data.grants || []);
      writeStorage(STORAGE_STUDENT_SESSION, data.student);
      pushToast('Acesso à Área do Aluno via Google concluído!');
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Falha no login com Google.',
      };
    }
  }, [pushToast]);

  const updateStudentProfile = useCallback(
    async (profile: StudentProfile): Promise<{ ok: boolean }> => {
      try {
        const res = await fetch('/api/lms/students/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            student: StudentProfile;
            grants?: StudentMaterialGrant[];
          };
          await saveStudentProfileToFirestore(data.student);
          setCurrentStudent(data.student);
          setCurrentStudentGrants(data.grants || []);
          writeStorage(STORAGE_STUDENT_SESSION, data.student);
          pushToast('Cadastro do aluno atualizado com sucesso!');
          return { ok: true };
        }
      } catch {
        // fallback
      }
      return { ok: false };
    },
    [pushToast]
  );

  const logoutStudent = useCallback(async () => {
    setCurrentStudent(null);
    setCurrentStudentGrants([]);
    writeStorage(STORAGE_STUDENT_SESSION, null);
    if (!adminAuthenticated) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
    pushToast('Você saiu da Área do Aluno.', 'info');
  }, [adminAuthenticated, pushToast]);

  // Orders, products, coupons, settings
  const submitOrder = useCallback(
    async (order: Order) => {
      const nextOrders = [order, ...orders];
      setOrders(nextOrders);
      writeStorage(STORAGE_LOCAL_ORDERS, nextOrders);

      const nextProducts = products.map((prod) => {
        const orderedQty = order.items
          .filter((i) => i.productId === prod.id)
          .reduce((acc, i) => acc + i.quantity, 0);
        if (orderedQty === 0) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - orderedQty),
          salesCount: prod.salesCount + orderedQty,
        };
      });
      setProducts(nextProducts);
      writeStorage(STORAGE_LOCAL_PRODUCTS, nextProducts);

      if (order.couponCode) {
        const nextCoupons = coupons.map((c) =>
          c.code === order.couponCode ? { ...c, usedCount: c.usedCount + 1 } : c
        );
        setCoupons(nextCoupons);
        writeStorage(STORAGE_LOCAL_COUPONS, nextCoupons);
      }

      await persistOrder(order);
    },
    [orders, products, coupons]
  );

  const saveProduct = useCallback(
    async (product: Product, isNew: boolean) => {
      const next = isNew
        ? [product, ...products]
        : products.map((p) => (p.id === product.id ? product : p));
      setProducts(next);
      writeStorage(STORAGE_LOCAL_PRODUCTS, next);
      await persistProduct(product, isNew);
      pushToast(isNew ? 'Produto cadastrado com sucesso!' : 'Produto atualizado!');
    },
    [products, pushToast]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      const next = products.filter((p) => p.id !== productId);
      setProducts(next);
      writeStorage(STORAGE_LOCAL_PRODUCTS, next);
      await removeProductFromFirestore(productId);
      pushToast('Produto removido da vitrine.', 'info');
    },
    [products, pushToast]
  );

  const saveCoupon = useCallback(
    async (coupon: Coupon) => {
      const exists = coupons.some((c) => c.code === coupon.code);
      const next = exists
        ? coupons.map((c) => (c.code === coupon.code ? coupon : c))
        : [coupon, ...coupons];
      setCoupons(next);
      writeStorage(STORAGE_LOCAL_COUPONS, next);
      await persistCoupon(coupon);
      pushToast(`Cupom ${coupon.code} salvo!`);
    },
    [coupons, pushToast]
  );

  const deleteCoupon = useCallback(
    async (code: string) => {
      const next = coupons.filter((c) => c.code !== code);
      setCoupons(next);
      writeStorage(STORAGE_LOCAL_COUPONS, next);
      await removeCouponFromFirestore(code);
      pushToast(`Cupom ${code} removido.`, 'info');
    },
    [coupons, pushToast]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const now = new Date().toISOString();
      const next = orders.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: now } : o
      );
      setOrders(next);
      writeStorage(STORAGE_LOCAL_ORDERS, next);
      await updateOrderStatusInFirestore(orderId, status);
      pushToast('Status do pedido atualizado.');
    },
    [orders, pushToast]
  );

  const saveStoreSettings = useCallback(
    async (nextSettings: StoreSettings) => {
      const updated = { ...nextSettings, updatedAt: new Date().toISOString() };
      setSettings(updated);
      writeStorage(STORAGE_LOCAL_SETTINGS, updated);
      await persistSettings(updated);
      pushToast('Configurações da loja salvas!');
    },
    [pushToast]
  );

  // Admin Digital Apostilas & Student Grants
  const saveDigitalMaterial = useCallback(
    async (material: DigitalMaterial, isNew: boolean) => {
      const saved = await persistDigitalMaterial(material, isNew);
      await refreshLmsAdminOverview();
      pushToast(isNew ? 'Apostila/PDF publicada!' : 'Apostila/PDF atualizada!');
      return saved;
    },
    [pushToast, refreshLmsAdminOverview]
  );

  const deleteDigitalMaterial = useCallback(
    async (materialId: string) => {
      await removeDigitalMaterialFromStore(materialId);
      await refreshLmsAdminOverview();
      pushToast('Apostila removida do acervo.', 'info');
    },
    [pushToast, refreshLmsAdminOverview]
  );

  const grantMaterialsToStudent = useCallback(
    async (params: {
      student: StudentProfile;
      materials: DigitalMaterial[];
      orderRef?: string;
      notes?: string;
    }) => {
      const granted = await grantMaterialsToStudentInStore(params);
      await refreshLmsAdminOverview();
      if (currentStudent && currentStudent.uid === params.student.uid) {
        await refreshCurrentStudentGrants(currentStudent);
      }
      pushToast(
        `${granted.length} material(is) liberado(s) para ${params.student.fullName}!`
      );
    },
    [currentStudent, pushToast, refreshCurrentStudentGrants, refreshLmsAdminOverview]
  );

  const revokeStudentGrant = useCallback(
    async (grantId: string) => {
      await revokeStudentGrantInStore(grantId);
      await refreshLmsAdminOverview();
      if (currentStudent) {
        await refreshCurrentStudentGrants(currentStudent);
      }
      pushToast('Liberação removida do painel do aluno.', 'info');
    },
    [currentStudent, pushToast, refreshCurrentStudentGrants, refreshLmsAdminOverview]
  );

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return {
    loading,
    products,
    orders,
    coupons,
    blogPosts,
    settings,
    digitalMaterials,
    adminMaterials,
    students,
    allStudentGrants,
    currentStudent,
    currentStudentGrants,
    cart,
    cartCount,
    wishlist,
    isCartOpen,
    setIsCartOpen,
    firebaseUser,
    adminAuthenticated,
    firebaseAuthMode,
    toasts,
    pushToast,
    dismissToast,
    addToCart,
    addMaterialToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    loginAdminWithCredentials,
    loginAdminWithGoogle,
    logoutAdmin,
    registerStudent,
    loginStudentWithEmail,
    loginStudentWithGoogle,
    updateStudentProfile,
    logoutStudent,
    refreshCurrentStudentGrants,
    refreshLmsAdminOverview,
    submitOrder,
    saveProduct,
    deleteProduct,
    saveCoupon,
    deleteCoupon,
    updateOrderStatus,
    saveStoreSettings,
    saveDigitalMaterial,
    deleteDigitalMaterial,
    grantMaterialsToStudent,
    revokeStudentGrant,
  };
}
