export type ResourceType = 'pedagogico' | 'terapeutico' | 'ambos' | 'papelaria';

export type OrderStatus = 'pendente' | 'em_andamento' | 'finalizado' | 'cancelado';

export type OrderSource = 'loja' | 'pdv';

export interface ProductVariant {
  id: string;
  label: string;
  priceDelta?: number;
  stock?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
  category: string;
  resourceType: ResourceType;
  recommendedAge: string;
  tags: string[];
  images: string[];
  videoUrl?: string | null;
  variants?: ProductVariant[] | null;
  featured: boolean;
  active: boolean;
  salesCount: number;
  weightGrams: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  variantLabel?: string;
  weightGrams: number;
  isDigital?: boolean;
}

export interface StudentProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  studentOrChildName: string;
  gradeOrAge: string;
  cityState: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalMaterial {
  id: string;
  slug: string;
  title: string;
  description: string;
  levelOrSubject: string;
  recommendedAge: string;
  pagesCount: number;
  price: number;
  promoPrice?: number | null;
  coverImage: string;
  fileName: string;
  /** Only populated inside Admin session or StudentMaterialGrant; omitted from public Firestore showcase */
  pdfUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentMaterialGrant {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  materialId: string;
  materialTitle: string;
  materialDescription?: string;
  levelOrSubject?: string;
  pagesCount?: number;
  coverImage: string;
  pdfUrl: string;
  fileName: string;
  orderRef?: string;
  notes?: string;
  grantedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variantLabel?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingMethod: string;
  shippingCost: number;
  couponCode?: string | null;
  discount: number;
  total: number;
  status: OrderStatus;
  source: OrderSource;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  contactEmail: string;
  cityState: string;
  originCep: string;
  freeShippingThreshold: number;
  welcomeMessage: string;
  footerText: string;
  shippingPolicy: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  coverImage: string;
  published: boolean;
  publishedAt: string;
}

export interface ShippingOption {
  code: 'PAC' | 'SEDEX' | 'RETIRADA';
  name: string;
  carrier: string;
  price: number;
  estimatedDays: string;
  description: string;
}

export interface ViaCepAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  source: 'viacep' | 'fallback';
}

export type SortOption = 'relevancia' | 'menor_preco' | 'maior_preco' | 'mais_vendidos';

export interface CatalogFilters {
  search: string;
  category: string;
  resourceType: ResourceType | 'todos';
  recommendedAge: string;
  maxPrice: number;
  promoOnly: boolean;
  wishlistOnly: boolean;
  sortBy: SortOption;
}

export type AppView =
  | { page: 'home' }
  | {
      page: 'catalog';
      initialCategory?: string;
      initialResourceType?: ResourceType | 'todos';
      initialSearch?: string;
      initialWishlistOnly?: boolean;
    }
  | { page: 'product'; slug: string }
  | { page: 'apostilas' }
  | { page: 'aluno' }
  | { page: 'checkout' }
  | { page: 'about' }
  | { page: 'contact' }
  | { page: 'blog'; postSlug?: string }
  | { page: 'admin' };
