import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Settings,
  Share2,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
} from 'lucide-react';
import { AdminApostilasTab } from './AdminApostilasTab';
import { AdminPosTab } from './AdminPosTab';
import { AdminProductsTab } from './AdminProductsTab';
import { buildWhatsAppOrderMessage, formatCurrency } from '../../lib/commerce';
import type {
  Coupon,
  DigitalMaterial,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
  StudentMaterialGrant,
  StudentProfile,
} from '../../types/store';

type AdminTab =
  | 'dashboard'
  | 'pdv'
  | 'produtos'
  | 'apostilas'
  | 'cupons'
  | 'redes'
  | 'configuracoes';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  digitalMaterials: DigitalMaterial[];
  students: StudentProfile[];
  studentGrants: StudentMaterialGrant[];
  settings: StoreSettings;
  firebaseAuthMode: 'firebase' | 'preview';
  onSaveProduct: (product: Product, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onCreateOrder: (order: Order) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onSaveCoupon: (coupon: Coupon) => Promise<void>;
  onDeleteCoupon: (code: string) => Promise<void>;
  onSaveDigitalMaterial: (material: DigitalMaterial, isNew: boolean) => Promise<DigitalMaterial>;
  onDeleteDigitalMaterial: (materialId: string) => Promise<void>;
  onGrantMaterials: (params: {
    student: StudentProfile;
    materials: DigitalMaterial[];
    orderRef?: string;
    notes?: string;
  }) => Promise<void>;
  onRevokeGrant: (grantId: string) => Promise<void>;
  onSaveSettings: (settings: StoreSettings) => Promise<void>;
  onExitToStore: () => void;
  onLogout: () => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

const NAV_TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pdv', label: 'PDV (Caixa)', icon: ShoppingCart },
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'apostilas', label: 'Apostilas & Alunos', icon: FileText },
  { id: 'cupons', label: 'Cupons', icon: Tag },
  { id: 'redes', label: 'Redes & WhatsApp', icon: Share2 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export function AdminPanel({
  products,
  orders,
  coupons,
  digitalMaterials,
  students,
  studentGrants,
  settings,
  firebaseAuthMode,
  onSaveProduct,
  onDeleteProduct,
  onCreateOrder,
  onUpdateOrderStatus,
  onSaveCoupon,
  onDeleteCoupon,
  onSaveDigitalMaterial,
  onDeleteDigitalMaterial,
  onGrantMaterials,
  onRevokeGrant,
  onSaveSettings,
  onExitToStore,
  onLogout,
  onNotify,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [draftSettings, setDraftSettings] = useState<StoreSettings>(settings);

  // Coupon form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(50);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(100);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2027-12-31');

  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelado');
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const revenueTotal = validOrders.reduce((acc, o) => acc + o.total, 0);
    const revenueToday = validOrders
      .filter((o) => now - new Date(o.createdAt).getTime() <= dayMs)
      .reduce((acc, o) => acc + o.total, 0);
    const revenueWeek = validOrders
      .filter((o) => now - new Date(o.createdAt).getTime() <= 7 * dayMs)
      .reduce((acc, o) => acc + o.total, 0);
    const revenueMonth = validOrders
      .filter((o) => now - new Date(o.createdAt).getTime() <= 30 * dayMs)
      .reduce((acc, o) => acc + o.total, 0);

    const pendingCount = orders.filter((o) => o.status === 'pendente').length;
    const progressCount = orders.filter((o) => o.status === 'em_andamento').length;
    const doneCount = orders.filter((o) => o.status === 'finalizado').length;

    const topProducts = [...products]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5)
      .map((p) => ({
        name: p.name.length > 15 ? `${p.name.slice(0, 15)}…` : p.name,
        vendas: p.salesCount,
      }));

    return {
      revenueTotal,
      revenueToday,
      revenueWeek,
      revenueMonth,
      pendingCount,
      progressCount,
      doneCount,
      topProducts,
    };
  }, [orders, products]);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (code.length < 2) {
      onNotify('Código do cupom inválido.', 'error');
      return;
    }
    await onSaveCoupon({
      code,
      type: newCouponType,
      value: Number(newCouponValue),
      minOrderValue: Number(newCouponMin),
      maxUses: Number(newCouponMaxUses),
      usedCount: 0,
      expiresAt: newCouponExpiry,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setNewCouponCode('');
  };

  const previewOrderMessage = useMemo(() => {
    const sample = orders[0] || {
      id: 'preview',
      orderNumber: 'PDP-1050',
      customerName: 'Profa. Maria Eduarda',
      customerPhone: '(17) 99123-4567',
      items: [
        {
          productId: 'p1',
          name: 'Kit Alfabetização Silábica',
          quantity: 1,
          unitPrice: 94.9,
          subtotal: 94.9,
        },
      ],
      subtotal: 94.9,
      shippingMethod: 'Correios PAC',
      shippingCost: 12.9,
      discount: 0,
      total: 107.8,
      status: 'pendente',
      source: 'loja',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return buildWhatsAppOrderMessage(sample, draftSettings);
  }, [orders, draftSettings]);

  const inputCls =
    'w-full px-3.5 py-2 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-sm text-[#3D2A24] focus:outline-none focus:border-[#E89EB8]';

  return (
    <div className="min-h-screen bg-[#FDF8F5] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#EFE4DE] p-4 flex flex-col justify-between gap-6 shrink-0">
        <div className="space-y-6">
          <div className="px-2 pt-1">
            <p className="font-script text-xl text-[#6F4E42] leading-none">
              Painel Administrativo
            </p>
            <h1 className="font-display text-lg font-bold text-[#3D2A24] mt-1">
              {settings.storeName}
            </h1>
          </div>

          <nav aria-label="Menu administrativo" className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#FDEEF4] text-[#6F4E42] border border-[#F6DCE6]'
                      : 'text-[#725B53] hover:bg-[#FDF8F5] hover:text-[#3D2A24]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-2 pt-4 border-t border-[#EFE4DE]">
          <button
            type="button"
            onClick={onExitToStore}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-semibold text-[#3D2A24] hover:bg-[#FDEEF4] transition-colors"
          >
            <Store className="w-4 h-4 text-[#6F4E42]" aria-hidden="true" />
            <span>Ver Loja Online</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Sair do Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EFE4DE]">
          <div>
            <p className="text-xs text-[#725B53]">
              Administração /{' '}
              <span className="font-bold text-[#3D2A24]">
                {NAV_TABS.find((t) => t.id === activeTab)?.label}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={onExitToStore}
              className="px-3.5 py-1.5 rounded-full border border-[#EFE4DE] bg-white text-xs font-semibold text-[#6F4E42]"
            >
              Ver Loja
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#DC2626]"
            >
              Sair
            </button>
          </div>
        </div>

        {firebaseAuthMode === 'preview' && (
          <div className="bg-[#FEF8E8] border border-[#F3E2B3] rounded-2xl p-4 text-xs text-[#7A5208] leading-relaxed">
            <strong>Modo de sessão local ativo:</strong> Para gravar alterações diretamente no Cloud Firestore com <code className="font-mono font-semibold">admin@x.com</code>, habilite o provedor <em>Email/Senha</em> em Authentication no Console do Firebase ou entre usando o botão <em>Entrar com Google</em> no login.
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow">
                <p className="text-xs font-semibold text-[#725B53]">Vendas hoje</p>
                <p className="font-display text-2xl font-bold text-[#3D2A24] tabular-nums mt-1">
                  {formatCurrency(metrics.revenueToday)}
                </p>
              </div>
              <div className="bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow">
                <p className="text-xs font-semibold text-[#725B53]">Últimos 7 dias</p>
                <p className="font-display text-2xl font-bold text-[#3D2A24] tabular-nums mt-1">
                  {formatCurrency(metrics.revenueWeek)}
                </p>
              </div>
              <div className="bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow">
                <p className="text-xs font-semibold text-[#725B53]">Faturamento (30 dias)</p>
                <p className="font-display text-2xl font-bold text-[#6F4E42] tabular-nums mt-1">
                  {formatCurrency(metrics.revenueMonth)}
                </p>
              </div>
              <div className="bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow">
                <p className="text-xs font-semibold text-[#725B53]">Pedidos por status</p>
                <p className="text-xs font-semibold text-[#3D2A24] mt-2 tabular-nums">
                  {metrics.pendingCount} pendentes · {metrics.progressCount} em preparo ·{' '}
                  {metrics.doneCount} finalizados
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow space-y-4">
                <h2 className="font-display text-base font-bold text-[#3D2A24]">
                  Produtos Mais Vendidos (unid.)
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.topProducts} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FAF3EE" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#725B53' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        interval={0}
                        tick={{ fontSize: 11, fill: '#3D2A24' }}
                      />
                      <Tooltip />
                      <Bar dataKey="vendas" fill="#6F4E42" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-7 bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow space-y-4 overflow-x-auto">
                <h2 className="font-display text-base font-bold text-[#3D2A24]">
                  Pedidos Recentes (Loja & PDV)
                </h2>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EFE4DE] text-[#725B53]">
                      <th className="py-2.5 pr-3">Pedido</th>
                      <th className="py-2.5 pr-3">Cliente</th>
                      <th className="py-2.5 pr-3 text-right">Total</th>
                      <th className="py-2.5 pr-3">Canal</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF3EE]">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-2.5 pr-3 font-mono font-semibold text-[#3D2A24]">
                          {order.orderNumber}
                        </td>
                        <td className="py-2.5 pr-3 text-[#3D2A24]">{order.customerName}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-bold text-[#6F4E42]">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-2.5 pr-3 uppercase text-[11px] text-[#725B53]">
                          {order.source}
                        </td>
                        <td className="py-2.5">
                          <select
                            aria-label={`Status do pedido ${order.orderNumber}`}
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="px-2.5 py-1 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs font-medium text-[#3D2A24]"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="em_andamento">Em andamento</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PDV */}
        {activeTab === 'pdv' && (
          <AdminPosTab
            products={products}
            coupons={coupons}
            settings={settings}
            onCreateOrder={onCreateOrder}
            onNotify={onNotify}
          />
        )}

        {/* TAB: PRODUTOS */}
        {activeTab === 'produtos' && (
          <AdminProductsTab
            products={products}
            onSaveProduct={onSaveProduct}
            onDeleteProduct={onDeleteProduct}
            onNotify={onNotify}
          />
        )}

        {/* TAB: APOSTILAS & ALUNOS */}
        {activeTab === 'apostilas' && (
          <AdminApostilasTab
            materials={digitalMaterials}
            students={students}
            grants={studentGrants}
            orders={orders}
            onSaveMaterial={onSaveDigitalMaterial}
            onDeleteMaterial={onDeleteDigitalMaterial}
            onGrantMaterials={onGrantMaterials}
            onRevokeGrant={onRevokeGrant}
            onNotify={onNotify}
          />
        )}

        {/* TAB: CUPONS */}
        {activeTab === 'cupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleAddCoupon}
              className="lg:col-span-5 bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-[#3D2A24]">
                Criar Cupom de Desconto
              </h2>

              <div>
                <label htmlFor="cpn-code" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Código do cupom *
                </label>
                <input
                  id="cpn-code"
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="VOLTASAULAS15"
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cpn-type" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Tipo
                  </label>
                  <select
                    id="cpn-type"
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                    className={inputCls}
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cpn-val" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Valor
                  </label>
                  <input
                    id="cpn-val"
                    type="number"
                    min={1}
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(Number(e.target.value))}
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cpn-min" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Pedido mínimo (R$)
                  </label>
                  <input
                    id="cpn-min"
                    type="number"
                    min={0}
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(Number(e.target.value))}
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
                <div>
                  <label htmlFor="cpn-max" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Limite de usos
                  </label>
                  <input
                    id="cpn-max"
                    type="number"
                    min={1}
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cpn-exp" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Validade
                </label>
                <input
                  id="cpn-exp"
                  type="date"
                  value={newCouponExpiry}
                  onChange={(e) => setNewCouponExpiry(e.target.value)}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Cupom</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-[#EFE4DE] rounded-3xl p-5 soft-card-shadow overflow-x-auto">
              <h2 className="font-display text-lg font-bold text-[#3D2A24] mb-4">
                Cupons Cadastrados
              </h2>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EFE4DE] text-[#725B53]">
                    <th className="py-2.5 pr-3">Código</th>
                    <th className="py-2.5 pr-3">Desconto</th>
                    <th className="py-2.5 pr-3">Mínimo</th>
                    <th className="py-2.5 pr-3">Usos</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF3EE]">
                  {coupons.map((c) => (
                    <tr key={c.code}>
                      <td className="py-3 pr-3 font-mono font-bold text-[#6F4E42]">{c.code}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value)}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{formatCurrency(c.minOrderValue)}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {c.usedCount}/{c.maxUses}
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => onSaveCoupon({ ...c, active: !c.active })}
                          className={`font-semibold ${
                            c.active ? 'text-[#15803D]' : 'text-[#725B53]'
                          }`}
                        >
                          {c.active ? 'Ativo' : 'Pausado'}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteCoupon(c.code)}
                          aria-label={`Excluir cupom ${c.code}`}
                          className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: REDES SOCIAIS & WHATSAPP */}
        {activeTab === 'redes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveSettings(draftSettings);
              }}
              className="lg:col-span-7 bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-[#3D2A24]">
                WhatsApp de Pedidos & Redes Sociais
              </h2>

              <div>
                <label htmlFor="soc-wa" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Número do WhatsApp da loja (com DDI 55 + DDD)
                </label>
                <input
                  id="soc-wa"
                  type="text"
                  value={draftSettings.whatsappNumber}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, whatsappNumber: e.target.value })
                  }
                  placeholder="5517991234567"
                  className={`${inputCls} font-mono`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="soc-ig" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Instagram URL
                  </label>
                  <input
                    id="soc-ig"
                    type="url"
                    value={draftSettings.instagramUrl}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, instagramUrl: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="soc-fb" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                    Facebook URL
                  </label>
                  <input
                    id="soc-fb"
                    type="url"
                    value={draftSettings.facebookUrl || ''}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, facebookUrl: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="soc-tt" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  TikTok URL
                </label>
                <input
                  id="soc-tt"
                  type="url"
                  value={draftSettings.tiktokUrl || ''}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, tiktokUrl: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="soc-msg" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Mensagem padrão de confirmação de pedido
                </label>
                <textarea
                  id="soc-msg"
                  rows={3}
                  value={draftSettings.welcomeMessage}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, welcomeMessage: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
              >
                Salvar Redes & WhatsApp
              </button>
            </form>

            <div className="lg:col-span-5 bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-3">
              <h3 className="font-display text-sm font-bold text-[#3D2A24]">
                Prévia da Mensagem no WhatsApp
              </h3>
              <pre className="p-4 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] text-xs text-[#3D2A24] whitespace-pre-wrap font-sans leading-relaxed">
                {previewOrderMessage}
              </pre>
            </div>
          </div>
        )}

        {/* TAB: CONFIGURAÇÕES DO SITE */}
        {activeTab === 'configuracoes' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveSettings(draftSettings);
            }}
            className="max-w-3xl bg-white border border-[#EFE4DE] rounded-3xl p-6 soft-card-shadow space-y-5"
          >
            <h2 className="font-display text-lg font-bold text-[#3D2A24]">
              Identidade, Frete e Políticas da Loja
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-name" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Nome da loja
                </label>
                <input
                  id="cfg-name"
                  type="text"
                  value={draftSettings.storeName}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, storeName: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cfg-tag" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Subtítulo da marca
                </label>
                <input
                  id="cfg-tag"
                  type="text"
                  value={draftSettings.tagline}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, tagline: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="cfg-c1" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Cor principal (taupe / marrom)
                </label>
                <input
                  id="cfg-c1"
                  type="color"
                  value={draftSettings.primaryColor}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, primaryColor: e.target.value })
                  }
                  className="w-full h-10 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] p-1"
                />
              </div>
              <div>
                <label htmlFor="cfg-c2" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Cor de destaque (rosa pastel)
                </label>
                <input
                  id="cfg-c2"
                  type="color"
                  value={draftSettings.accentColor}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, accentColor: e.target.value })
                  }
                  className="w-full h-10 rounded-xl border border-[#EFE4DE] bg-[#FDF8F5] p-1"
                />
              </div>

              <div>
                <label htmlFor="cfg-free" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Frete grátis acima de (R$)
                </label>
                <input
                  id="cfg-free"
                  type="number"
                  min={0}
                  value={draftSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                  className={`${inputCls} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="cfg-cep" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  CEP de origem (SJRP)
                </label>
                <input
                  id="cfg-cep"
                  type="text"
                  value={draftSettings.originCep}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, originCep: e.target.value })
                  }
                  className={`${inputCls} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="cfg-email" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  E-mail de contato
                </label>
                <input
                  id="cfg-email"
                  type="email"
                  value={draftSettings.contactEmail}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, contactEmail: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cfg-city" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                  Cidade / Estado
                </label>
                <input
                  id="cfg-city"
                  type="text"
                  value={draftSettings.cityState}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, cityState: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cfg-footer" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                Texto institucional do rodapé
              </label>
              <textarea
                id="cfg-footer"
                rows={2}
                value={draftSettings.footerText}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, footerText: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="cfg-policy" className="block text-xs font-semibold text-[#3D2A24] mb-1">
                Política de envio e retirada
              </label>
              <textarea
                id="cfg-policy"
                rows={3}
                value={draftSettings.shippingPolicy}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, shippingPolicy: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#6F4E42] text-white text-xs font-bold hover:bg-[#573B30] transition-colors"
            >
              Salvar Configurações do Site
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
