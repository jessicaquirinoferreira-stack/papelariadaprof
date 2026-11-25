export type PageRoute =
  | 'home'
  | 'catalog'
  | 'apostilas'
  | 'product'
  | 'checkout'
  | 'student'
  | 'admin'
  | 'about'
  | 'contact'
  | 'policies';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  imageUrl: string;
  badge?: string;
  featured: boolean;
  active: boolean;
  salesCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  coverUrl: string;
  pagesCount: number;
  stock: number;
  featured: boolean;
  active: boolean;
  salesCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MaterialFile {
  materialId: string;
  pdfUrl: string;
  pdfFileName: string;
  fileSizeBytes?: number;
  updatedAt?: unknown;
}

export interface StudentProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  role: 'student';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudentMaterial {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  materialId: string;
  materialTitle: string;
  category: string;
  coverUrl: string;
  pdfUrl: string;
  pdfFileName: string;
  orderRef?: string;
  unlockedBy: string;
  unlockedAt?: unknown;
}

export interface OrderItem {
  id: string;
  type: 'product' | 'material';
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  cep?: string;
  address?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod?: string;
  source: 'online' | 'pdv';
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  active: boolean;
  usageCount: number;
  createdAt?: unknown;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  instagramUrl: string;
  instagramHandle?: string;
  contactEmail: string;
  businessHours: string;
  heroTitle: string;
  heroSubtitle: string;
  freeShippingThreshold: number;
  assistantName: string;
  categories?: string[];
  deletedMaterialIds?: string[];
  updatedAt?: unknown;
}

export interface CartItem {
  id: string;
  type: 'product' | 'material';
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
}
