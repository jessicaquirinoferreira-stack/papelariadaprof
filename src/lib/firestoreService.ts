import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
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
  Coupon,
  DigitalMaterial,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
  StudentMaterialGrant,
  StudentProfile,
} from '../types/store';

function toIsoDate(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeId(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return clean || `item-${Date.now()}`;
}

export async function loadPublicStorefrontData(): Promise<{
  products: Product[];
  settings: StoreSettings;
  blogPosts: BlogPost[];
}> {
  let products: Product[] = SEED_PRODUCTS;
  let settings: StoreSettings = DEFAULT_STORE_SETTINGS;
  let blogPosts: BlogPost[] = SEED_BLOG_POSTS;

  try {
    const q = query(collection(db, 'products'), where('active', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      products = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Product),
          id: d.id,
          createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
          updatedAt: toIsoDate(data.updatedAt, new Date().toISOString()),
        };
      });
    }
  } catch (err) {
    console.warn('Public products query fell back to curated catalog:', err);
  }

  try {
    const storeSnap = await getDoc(doc(db, 'settings', 'store'));
    if (storeSnap.exists()) {
      const data = storeSnap.data();
      settings = {
        ...DEFAULT_STORE_SETTINGS,
        ...(data as StoreSettings),
        updatedAt: toIsoDate(data.updatedAt, DEFAULT_STORE_SETTINGS.updatedAt),
      };
    }
  } catch (err) {
    console.warn('Public settings fetch fell back to defaults:', err);
  }

  try {
    const blogQuery = query(collection(db, 'blogPosts'), where('published', '==', true));
    const blogSnap = await getDocs(blogQuery);
    if (!blogSnap.empty) {
      blogPosts = blogSnap.docs.map((d) => ({
        ...(d.data() as BlogPost),
        id: d.id,
      }));
    }
  } catch (err) {
    console.warn('Public blog fetch fell back to curated posts:', err);
  }

  return { products, settings, blogPosts };
}

export async function loadAdminCollections(): Promise<{
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
}> {
  const isFirebaseSignedIn = Boolean(auth.currentUser);
  if (!isFirebaseSignedIn) {
    return {
      products: SEED_PRODUCTS,
      orders: SEED_ORDERS,
      coupons: SEED_COUPONS,
    };
  }

  let products: Product[] = SEED_PRODUCTS;
  let orders: Order[] = SEED_ORDERS;
  let coupons: Coupon[] = SEED_COUPONS;

  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    if (!prodSnap.empty) {
      products = prodSnap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Product),
          id: d.id,
          createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
          updatedAt: toIsoDate(data.updatedAt, new Date().toISOString()),
        };
      });
    }
  } catch (err) {
    console.warn('Admin products query error (using cached/seed):', err);
  }

  try {
    const ordSnap = await getDocs(collection(db, 'orders'));
    if (!ordSnap.empty) {
      orders = ordSnap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Order),
          id: d.id,
          createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
          updatedAt: toIsoDate(data.updatedAt, new Date().toISOString()),
        };
      });
    }
  } catch (err) {
    console.warn('Admin orders query error (using cached/seed):', err);
  }

  try {
    const cpnSnap = await getDocs(collection(db, 'coupons'));
    if (!cpnSnap.empty) {
      coupons = cpnSnap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Coupon),
          code: d.id,
          createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
        };
      });
    }
  } catch (err) {
    console.warn('Admin coupons query error (using cached/seed):', err);
  }

  return { products, orders, coupons };
}

export async function fetchCouponByCode(
  codeRaw: string,
  localCoupons: Coupon[]
): Promise<Coupon | null> {
  const code = codeRaw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!code || code.length < 2) return null;

  try {
    const snap = await getDoc(doc(db, 'coupons', code));
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...(data as Coupon),
        code: snap.id,
        createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
      };
    }
  } catch {
    // Fallback to local/seed coupons when Firestore rules deny or document absent
  }

  return localCoupons.find((c) => c.code.toUpperCase() === code) || null;
}

export async function persistOrder(order: Order): Promise<{ syncedToFirestore: boolean }> {
  const safeId = normalizeId(order.id);
  const payload = {
    id: safeId,
    orderNumber: order.orderNumber.slice(0, 32),
    customerName: order.customerName.slice(0, 140),
    customerPhone: order.customerPhone.slice(0, 30),
    customerEmail: order.customerEmail ? order.customerEmail.slice(0, 160) : null,
    cep: order.cep ? order.cep.slice(0, 12) : null,
    street: order.street ? order.street.slice(0, 200) : null,
    number: order.number ? order.number.slice(0, 24) : null,
    complement: order.complement ? order.complement.slice(0, 120) : null,
    neighborhood: order.neighborhood ? order.neighborhood.slice(0, 120) : null,
    city: order.city ? order.city.slice(0, 120) : null,
    state: order.state ? order.state.slice(0, 4) : null,
    items: order.items.slice(0, 50),
    subtotal: Number(order.subtotal) || 0,
    shippingMethod: order.shippingMethod.slice(0, 60),
    shippingCost: Number(order.shippingCost) || 0,
    couponCode: order.couponCode ? order.couponCode.slice(0, 40) : null,
    discount: Number(order.discount) || 0,
    total: Number(order.total) || 0,
    status: order.status,
    source: order.source,
    notes: order.notes ? order.notes.slice(0, 600) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'orders', safeId), payload);
    return { syncedToFirestore: true };
  } catch (err) {
    if (order.source === 'pdv' && !auth.currentUser) {
      return { syncedToFirestore: false };
    }
    try {
      handleFirestoreError(err, OperationType.CREATE, `orders/${safeId}`);
    } catch {
      return { syncedToFirestore: false };
    }
  }
}

export async function persistProduct(
  product: Product,
  isNew: boolean
): Promise<{ syncedToFirestore: boolean }> {
  if (!auth.currentUser) {
    return { syncedToFirestore: false };
  }
  const safeId = normalizeId(product.id);
  const basePayload = {
    id: safeId,
    slug: product.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 140),
    name: product.name.slice(0, 160),
    shortDescription: product.shortDescription.slice(0, 300),
    description: product.description.slice(0, 8000),
    price: Number(product.price) || 0,
    promoPrice:
      typeof product.promoPrice === 'number' && product.promoPrice > 0
        ? Number(product.promoPrice)
        : null,
    stock: Math.max(0, Number(product.stock) || 0),
    category: product.category.slice(0, 80),
    resourceType: product.resourceType,
    recommendedAge: product.recommendedAge.slice(0, 60),
    tags: (product.tags || []).slice(0, 10),
    images: (product.images && product.images.length > 0
      ? product.images
      : ['/src/assets/images/prod_alfabetizacao_1795023315545.jpg']
    ).slice(0, 8),
    videoUrl: product.videoUrl ? product.videoUrl.slice(0, 500) : null,
    variants: product.variants ? product.variants.slice(0, 10) : null,
    featured: Boolean(product.featured),
    active: Boolean(product.active),
    salesCount: Math.max(0, Number(product.salesCount) || 0),
    weightGrams: Math.max(1, Number(product.weightGrams) || 350),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'products', safeId), {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    } else {
      const ref = doc(db, 'products', safeId);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        await updateDoc(ref, basePayload);
      } else {
        await setDoc(ref, {
          ...basePayload,
          createdAt: serverTimestamp(),
        });
      }
    }
    return { syncedToFirestore: true };
  } catch (err) {
    console.warn('Product Firestore write fallback:', err);
    return { syncedToFirestore: false };
  }
}

export async function removeProductFromFirestore(productId: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await deleteDoc(doc(db, 'products', normalizeId(productId)));
    return true;
  } catch (err) {
    console.warn('Delete product Firestore fallback:', err);
    return false;
  }
}

export async function persistCoupon(coupon: Coupon): Promise<boolean> {
  if (!auth.currentUser) return false;
  const code = coupon.code.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);
  try {
    const ref = doc(db, 'coupons', code);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        type: coupon.type,
        value: Number(coupon.value),
        minOrderValue: Number(coupon.minOrderValue),
        maxUses: Number(coupon.maxUses),
        usedCount: Number(coupon.usedCount),
        expiresAt: coupon.expiresAt.slice(0, 40),
        active: Boolean(coupon.active),
      });
    } else {
      await setDoc(ref, {
        code,
        type: coupon.type,
        value: Number(coupon.value),
        minOrderValue: Number(coupon.minOrderValue),
        maxUses: Number(coupon.maxUses),
        usedCount: Number(coupon.usedCount) || 0,
        expiresAt: coupon.expiresAt.slice(0, 40),
        active: Boolean(coupon.active),
        createdAt: serverTimestamp(),
      });
    }
    return true;
  } catch (err) {
    console.warn('Coupon Firestore write fallback:', err);
    return false;
  }
}

export async function removeCouponFromFirestore(code: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await deleteDoc(doc(db, 'coupons', code.toUpperCase()));
    return true;
  } catch {
    return false;
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await updateDoc(doc(db, 'orders', normalizeId(orderId)), {
      status,
      ...(typeof notes === 'string' ? { notes: notes.slice(0, 600) } : {}),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function persistSettings(settings: StoreSettings): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await setDoc(doc(db, 'settings', 'store'), {
      storeName: settings.storeName.slice(0, 100),
      tagline: settings.tagline.slice(0, 140),
      primaryColor: settings.primaryColor.slice(0, 24),
      accentColor: settings.accentColor.slice(0, 24),
      whatsappNumber: settings.whatsappNumber.slice(0, 20),
      instagramUrl: settings.instagramUrl.slice(0, 300),
      facebookUrl: settings.facebookUrl ? settings.facebookUrl.slice(0, 300) : null,
      tiktokUrl: settings.tiktokUrl ? settings.tiktokUrl.slice(0, 300) : null,
      contactEmail: settings.contactEmail.slice(0, 160),
      cityState: settings.cityState.slice(0, 120),
      originCep: settings.originCep.slice(0, 12),
      freeShippingThreshold: Number(settings.freeShippingThreshold) || 0,
      welcomeMessage: settings.welcomeMessage.slice(0, 1000),
      footerText: settings.footerText.slice(0, 500),
      shippingPolicy: settings.shippingPolicy.slice(0, 2000),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn('Settings Firestore write fallback:', err);
    return false;
  }
}

export async function loadPublicDigitalMaterials(): Promise<DigitalMaterial[]> {
  try {
    const res = await fetch('/api/lms/public-materials');
    if (res.ok) {
      const data = (await res.json()) as { materials?: DigitalMaterial[] };
      if (Array.isArray(data.materials) && data.materials.length > 0) {
        return data.materials;
      }
    }
  } catch {
    // fallback below
  }

  try {
    const q = query(collection(db, 'digitalMaterials'), where('active', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as DigitalMaterial),
          id: d.id,
          createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
          updatedAt: toIsoDate(data.updatedAt, new Date().toISOString()),
        };
      });
    }
  } catch {
    // fallback to curated seed without exposing raw links unnecessarily
  }

  return SEED_DIGITAL_MATERIALS.map(({ pdfUrl: _ignored, ...rest }) => rest);
}

export async function loadLmsAdminOverview(): Promise<{
  students: StudentProfile[];
  materials: DigitalMaterial[];
  grants: StudentMaterialGrant[];
}> {
  let students: StudentProfile[] = [];
  let materials: DigitalMaterial[] = SEED_DIGITAL_MATERIALS;
  let grants: StudentMaterialGrant[] = [];

  try {
    const res = await fetch('/api/lms/admin/overview');
    if (res.ok) {
      const data = (await res.json()) as {
        students?: StudentProfile[];
        materials?: DigitalMaterial[];
        grants?: StudentMaterialGrant[];
      };
      if (Array.isArray(data.students)) students = data.students;
      if (Array.isArray(data.materials) && data.materials.length > 0) materials = data.materials;
      if (Array.isArray(data.grants)) grants = data.grants;
    }
  } catch {
    // fallback
  }

  if (auth.currentUser) {
    try {
      const [stuSnap, matSnap, assetSnap, grantSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'digitalMaterials')),
        getDocs(collection(db, 'materialAssets')),
        getDocs(collection(db, 'studentGrants')),
      ]);

      if (!stuSnap.empty) {
        const fsStudents = stuSnap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as StudentProfile),
            uid: d.id,
            createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
            updatedAt: toIsoDate(data.updatedAt, new Date().toISOString()),
          };
        });
        const merged = new Map<string, StudentProfile>();
        [...students, ...fsStudents].forEach((s) => merged.set(s.uid, s));
        students = Array.from(merged.values());
      }

      if (!matSnap.empty) {
        const assetMap = new Map<string, string>();
        assetSnap.docs.forEach((a) => {
          const pdfUrl = a.data()?.pdfUrl;
          if (typeof pdfUrl === 'string') assetMap.set(a.id, pdfUrl);
        });
        const fsMaterials = matSnap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as DigitalMaterial),
            id: d.id,
            pdfUrl: assetMap.get(d.id) || `/api/sample-pdf/${data.slug || d.id}`,
            createdAt: toIsoDate(data.createdAt, new Date().toISOString()),
            updatedAt: toIsoDate(data.updatedAt, new Date().toISOString()),
          };
        });
        const mergedMat = new Map<string, DigitalMaterial>();
        [...materials, ...fsMaterials].forEach((m) => mergedMat.set(m.id, m));
        materials = Array.from(mergedMat.values());
      }

      if (!grantSnap.empty) {
        const fsGrants = grantSnap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as StudentMaterialGrant),
            id: d.id,
            grantedAt: toIsoDate(data.grantedAt, new Date().toISOString()),
          };
        });
        const mergedGrants = new Map<string, StudentMaterialGrant>();
        [...grants, ...fsGrants].forEach((g) => mergedGrants.set(g.id, g));
        grants = Array.from(mergedGrants.values());
      }
    } catch (err) {
      console.warn('Firestore LMS overview fallback:', err);
    }
  }

  return { students, materials, grants };
}

export async function saveStudentProfileToFirestore(student: StudentProfile): Promise<boolean> {
  if (!auth.currentUser) return false;
  const safeUid = normalizeId(student.uid);
  try {
    const ref = doc(db, 'students', safeUid);
    const existing = await getDoc(ref);
    const base = {
      fullName: student.fullName.slice(0, 140),
      email: student.email.slice(0, 160),
      phone: student.phone.slice(0, 30),
      cpf: student.cpf.slice(0, 20),
      studentOrChildName: student.studentOrChildName.slice(0, 140),
      gradeOrAge: student.gradeOrAge.slice(0, 80),
      cityState: student.cityState.slice(0, 120),
      ...(student.notes ? { notes: student.notes.slice(0, 600) } : {}),
      updatedAt: serverTimestamp(),
    };
    if (existing.exists()) {
      await updateDoc(ref, base);
    } else {
      await setDoc(ref, {
        uid: safeUid,
        ...base,
        createdAt: serverTimestamp(),
      });
    }
    return true;
  } catch (err) {
    console.warn('Student Firestore save fallback:', err);
    return false;
  }
}

export async function loadStudentGrantsFromStore(
  studentId: string,
  studentEmail?: string
): Promise<StudentMaterialGrant[]> {
  let grants: StudentMaterialGrant[] = [];
  try {
    const qUrl = `/api/lms/students/${encodeURIComponent(studentId)}/grants${
      studentEmail ? `?email=${encodeURIComponent(studentEmail)}` : ''
    }`;
    const res = await fetch(qUrl);
    if (res.ok) {
      const data = (await res.json()) as { grants?: StudentMaterialGrant[] };
      if (Array.isArray(data.grants)) grants = data.grants;
    }
  } catch {
    // fallback
  }

  if (auth.currentUser) {
    try {
      const q = query(collection(db, 'studentGrants'), where('studentId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fsGrants = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as StudentMaterialGrant),
            id: d.id,
            grantedAt: toIsoDate(data.grantedAt, new Date().toISOString()),
          };
        });
        const merged = new Map<string, StudentMaterialGrant>();
        [...grants, ...fsGrants].forEach((g) => merged.set(g.id, g));
        grants = Array.from(merged.values());
      }
    } catch {
      // ignore if offline
    }
  }

  return grants;
}

export async function persistDigitalMaterial(
  material: DigitalMaterial,
  isNew: boolean
): Promise<DigitalMaterial> {
  const safeId = normalizeId(material.id);
  let savedMaterial = { ...material, id: safeId };

  try {
    const res = await fetch('/api/lms/admin/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material: savedMaterial }),
    });
    if (res.ok) {
      const data = (await res.json()) as { material?: DigitalMaterial };
      if (data.material) savedMaterial = data.material;
    }
  } catch {
    // fallback
  }

  if (auth.currentUser) {
    try {
      const publicPayload = {
        id: safeId,
        slug: savedMaterial.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 140),
        title: savedMaterial.title.slice(0, 160),
        description: savedMaterial.description.slice(0, 4000),
        levelOrSubject: savedMaterial.levelOrSubject.slice(0, 80),
        recommendedAge: savedMaterial.recommendedAge.slice(0, 60),
        pagesCount: Math.max(1, Number(savedMaterial.pagesCount) || 10),
        price: Number(savedMaterial.price) || 0,
        promoPrice:
          typeof savedMaterial.promoPrice === 'number' && savedMaterial.promoPrice > 0
            ? Number(savedMaterial.promoPrice)
            : null,
        coverImage: savedMaterial.coverImage.slice(0, 500),
        fileName: (savedMaterial.fileName || `${savedMaterial.slug}.pdf`).slice(0, 160),
        active: Boolean(savedMaterial.active),
        updatedAt: serverTimestamp(),
      };

      const ref = doc(db, 'digitalMaterials', safeId);
      const existing = await getDoc(ref);
      if (isNew || !existing.exists()) {
        await setDoc(ref, { ...publicPayload, createdAt: serverTimestamp() });
      } else {
        await updateDoc(ref, publicPayload);
      }

      if (savedMaterial.pdfUrl) {
        await setDoc(doc(db, 'materialAssets', safeId), {
          materialId: safeId,
          pdfUrl: savedMaterial.pdfUrl.slice(0, 1000),
          fileName: (savedMaterial.fileName || `${savedMaterial.slug}.pdf`).slice(0, 160),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('DigitalMaterial Firestore write fallback:', err);
    }
  }

  return savedMaterial;
}

export async function removeDigitalMaterialFromStore(materialId: string): Promise<void> {
  const safeId = normalizeId(materialId);
  try {
    await fetch(`/api/lms/admin/materials/${encodeURIComponent(safeId)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
  if (auth.currentUser) {
    try {
      await Promise.all([
        deleteDoc(doc(db, 'digitalMaterials', safeId)),
        deleteDoc(doc(db, 'materialAssets', safeId)),
      ]);
    } catch {
      // ignore
    }
  }
}

export async function grantMaterialsToStudentInStore(params: {
  student: StudentProfile;
  materials: DigitalMaterial[];
  orderRef?: string;
  notes?: string;
}): Promise<StudentMaterialGrant[]> {
  const { student, materials, orderRef, notes } = params;
  let serverGrants: StudentMaterialGrant[] = [];

  try {
    const res = await fetch('/api/lms/admin/grants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.uid,
        materialIds: materials.map((m) => m.id),
        orderRef,
        notes,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { grants?: StudentMaterialGrant[] };
      if (Array.isArray(data.grants)) serverGrants = data.grants;
    }
  } catch {
    // fallback
  }

  const now = new Date().toISOString();
  const resolvedGrants =
    serverGrants.length > 0
      ? serverGrants
      : materials.map((mat) => ({
          id: normalizeId(`grant-${student.uid}-${mat.id}`),
          studentId: student.uid,
          studentName: student.fullName,
          studentEmail: student.email,
          materialId: mat.id,
          materialTitle: mat.title,
          materialDescription: mat.description,
          levelOrSubject: mat.levelOrSubject,
          pagesCount: mat.pagesCount,
          coverImage: mat.coverImage,
          pdfUrl: mat.pdfUrl || `/api/sample-pdf/${mat.slug}`,
          fileName: mat.fileName || `${mat.slug}.pdf`,
          ...(orderRef ? { orderRef } : {}),
          ...(notes ? { notes } : {}),
          grantedAt: now,
        }));

  if (auth.currentUser) {
    for (const g of resolvedGrants) {
      try {
        await setDoc(doc(db, 'studentGrants', g.id), {
          id: g.id,
          studentId: g.studentId,
          studentName: g.studentName.slice(0, 140),
          studentEmail: g.studentEmail.slice(0, 160),
          materialId: g.materialId,
          materialTitle: g.materialTitle.slice(0, 160),
          ...(g.materialDescription ? { materialDescription: g.materialDescription.slice(0, 4000) } : {}),
          ...(g.levelOrSubject ? { levelOrSubject: g.levelOrSubject.slice(0, 80) } : {}),
          ...(typeof g.pagesCount === 'number' ? { pagesCount: g.pagesCount } : {}),
          coverImage: g.coverImage.slice(0, 500),
          pdfUrl: g.pdfUrl.slice(0, 1000),
          fileName: g.fileName.slice(0, 160),
          ...(g.orderRef ? { orderRef: g.orderRef.slice(0, 40) } : {}),
          ...(g.notes ? { notes: g.notes.slice(0, 600) } : {}),
          grantedAt: serverTimestamp(),
        });
      } catch {
        // ignore if Firestore rules or student doc absent in preview
      }
    }
  }

  return resolvedGrants;
}

export async function revokeStudentGrantInStore(grantId: string): Promise<void> {
  const safeId = normalizeId(grantId);
  try {
    await fetch(`/api/lms/admin/grants/${encodeURIComponent(safeId)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'studentGrants', safeId));
    } catch {
      // ignore
    }
  }
}
