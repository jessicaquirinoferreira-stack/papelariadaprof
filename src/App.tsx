import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CheckoutPage } from './components/CheckoutPage';
import { AboutPage } from './components/AboutPage';
import { ApostilasPage } from './components/ApostilasPage';
import { ContactPage } from './components/ContactPage';
import { BlogPage } from './components/BlogPage';
import { StudentAreaPage } from './components/StudentAreaPage';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { CookieBanner } from './components/CookieBanner';
import { ToastContainer } from './components/ToastContainer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { useStore } from './hooks/useStore';
import { FloatingWidgets } from './components/FloatingWidgets';
import type { AppView, Product } from './types/store';

export default function App() {
  const store = useStore();
  const [view, setView] = useState<AppView>({ page: 'home' });
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const navigate = (nextView: AppView) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const titleMap: Record<AppView['page'], string> = {
      home: `${store.settings.storeName} — ${store.settings.tagline}`,
      catalog: `Catálogo — ${store.settings.storeName}`,
      product: `Produto — ${store.settings.storeName}`,
      apostilas: `Apostilas & PDFs Exclusivos — ${store.settings.storeName}`,
      aluno: `Área do Aluno — ${store.settings.storeName}`,
      checkout: `Finalizar Pedido — ${store.settings.storeName}`,
      about: `Sobre Nós — ${store.settings.storeName}`,
      contact: `Contato — ${store.settings.storeName}`,
      blog: `Blog Pedagógico — ${store.settings.storeName}`,
      admin: `Área Admin — ${store.settings.storeName}`,
    };
    document.title = titleMap[view.page] || store.settings.storeName;
  }, [view.page, store.settings.storeName, store.settings.tagline]);

  const handleOpenAdmin = () => {
    if (store.adminAuthenticated) {
      navigate({ page: 'admin' });
    } else {
      setAdminLoginOpen(true);
    }
  };

  const handleHeaderSearchSubmit = (query: string) => {
    navigate({
      page: 'catalog',
      initialCategory: 'Todas',
      initialResourceType: 'todos',
      initialSearch: query,
    });
  };

  const handleOpenWishlist = () => {
    navigate({
      page: 'catalog',
      initialCategory: 'Todas',
      initialResourceType: 'todos',
      initialWishlistOnly: true,
    });
  };

  if (view.page === 'admin' && store.adminAuthenticated) {
    return (
      <MotionConfig reducedMotion="user">
        <AdminPanel
          products={store.products}
          orders={store.orders}
          coupons={store.coupons}
          digitalMaterials={store.adminMaterials}
          students={store.students}
          studentGrants={store.allStudentGrants}
          settings={store.settings}
          firebaseAuthMode={store.firebaseAuthMode}
          onSaveProduct={store.saveProduct}
          onDeleteProduct={store.deleteProduct}
          onCreateOrder={store.submitOrder}
          onUpdateOrderStatus={store.updateOrderStatus}
          onSaveCoupon={store.saveCoupon}
          onDeleteCoupon={store.deleteCoupon}
          onSaveDigitalMaterial={store.saveDigitalMaterial}
          onDeleteDigitalMaterial={store.deleteDigitalMaterial}
          onGrantMaterials={store.grantMaterialsToStudent}
          onRevokeGrant={store.revokeStudentGrant}
          onSaveSettings={store.saveStoreSettings}
          onExitToStore={() => navigate({ page: 'home' })}
          onLogout={() => {
            store.logoutAdmin();
            navigate({ page: 'home' });
          }}
          onNotify={store.pushToast}
        />
        <ToastContainer toasts={store.toasts} onDismiss={store.dismissToast} />
      </MotionConfig>
    );
  }

  const activeProduct =
    view.page === 'product'
      ? store.products.find((p) => p.slug === view.slug)
      : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FDF8F5] text-[#3D2A24]">
        <Header
          settings={store.settings}
          currentPage={view.page}
          activeCategory={view.page === 'catalog' ? view.initialCategory : undefined}
          cartCount={store.cartCount}
          wishlistCount={store.wishlist.length}
          studentName={store.currentStudent?.fullName}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (view.page === 'catalog') {
              setView((prev) =>
                prev.page === 'catalog' ? { ...prev, initialSearch: q } : prev
              );
            }
          }}
          onSearchSubmit={handleHeaderSearchSubmit}
          onNavigate={navigate}
          onOpenCart={() => store.setIsCartOpen(true)}
          onOpenWishlist={handleOpenWishlist}
          onOpenAdmin={handleOpenAdmin}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                view.page === 'product'
                  ? `product-${view.slug}`
                  : view.page === 'catalog'
                  ? `catalog-${view.initialCategory || ''}-${view.initialResourceType || ''}-${view.initialWishlistOnly ? 'wish' : 'all'}`
                  : view.page
              }
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {view.page === 'home' && (
                <HomePage
                  products={store.products}
                  digitalMaterials={store.digitalMaterials}
                  settings={store.settings}
                  wishlist={store.wishlist}
                  onNavigate={navigate}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onAddToCart={(p) => store.addToCart(p)}
                  onAddMaterialToCart={store.addMaterialToCart}
                  onToggleWishlist={store.toggleWishlist}
                />
              )}

              {view.page === 'catalog' && (
                <CatalogPage
                  products={store.products}
                  loading={store.loading}
                  wishlist={store.wishlist}
                  initialCategory={view.initialCategory}
                  initialResourceType={view.initialResourceType}
                  initialSearch={view.initialSearch}
                  initialWishlistOnly={view.initialWishlistOnly}
                  onNavigate={navigate}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onAddToCart={(p) => store.addToCart(p)}
                  onToggleWishlist={store.toggleWishlist}
                />
              )}

              {view.page === 'product' && (
                <ProductDetailPage
                  product={activeProduct}
                  settings={store.settings}
                  isWishlisted={
                    activeProduct ? store.wishlist.includes(activeProduct.id) : false
                  }
                  onNavigate={navigate}
                  onAddToCart={store.addToCart}
                  onToggleWishlist={store.toggleWishlist}
                />
              )}

              {view.page === 'checkout' && (
                <CheckoutPage
                  items={store.cart}
                  coupons={store.coupons}
                  settings={store.settings}
                  onClearCart={store.clearCart}
                  onSubmitOrder={store.submitOrder}
                  onNavigate={navigate}
                  onNotify={store.pushToast}
                />
              )}

              {view.page === 'about' && (
                <AboutPage settings={store.settings} onNavigate={navigate} />
              )}

              {view.page === 'contact' && (
                <ContactPage settings={store.settings} onNotify={store.pushToast} />
              )}

              {view.page === 'apostilas' && (
                <ApostilasPage
                  materials={store.digitalMaterials}
                  settings={store.settings}
                  isStudentLoggedIn={Boolean(store.currentStudent)}
                  onAddMaterialToCart={store.addMaterialToCart}
                  onNavigate={navigate}
                />
              )}

              {view.page === 'aluno' && (
                <StudentAreaPage
                  currentStudent={store.currentStudent}
                  grants={store.currentStudentGrants}
                  settings={store.settings}
                  onRegisterStudent={store.registerStudent}
                  onLoginStudent={store.loginStudentWithEmail}
                  onLoginGoogle={store.loginStudentWithGoogle}
                  onUpdateProfile={store.updateStudentProfile}
                  onRefreshGrants={store.refreshCurrentStudentGrants}
                  onLogout={store.logoutStudent}
                  onNavigate={navigate}
                />
              )}

              {view.page === 'blog' && (
                <BlogPage posts={store.blogPosts} initialSlug={view.postSlug} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer
          settings={store.settings}
          onNavigate={navigate}
          onOpenAdmin={handleOpenAdmin}
        />

        <CartDrawer
          open={store.isCartOpen}
          items={store.cart}
          settings={store.settings}
          onClose={() => store.setIsCartOpen(false)}
          onUpdateQuantity={store.updateCartQuantity}
          onRemoveItem={store.removeFromCart}
          onProceedToCheckout={() => {
            store.setIsCartOpen(false);
            navigate({ page: 'checkout' });
          }}
        />

        <QuickViewModal
          product={quickViewProduct}
          isWishlisted={
            quickViewProduct ? store.wishlist.includes(quickViewProduct.id) : false
          }
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={store.addToCart}
          onToggleWishlist={store.toggleWishlist}
          onGoToFullPage={(slug) => navigate({ page: 'product', slug })}
        />

        <CookieBanner />

        <AdminLoginModal
          open={adminLoginOpen}
          onClose={() => setAdminLoginOpen(false)}
          onLoginCredentials={store.loginAdminWithCredentials}
          onLoginGoogle={store.loginAdminWithGoogle}
          onSuccess={(note) => {
            setAdminLoginOpen(false);
            navigate({ page: 'admin' });
            if (note) store.pushToast(note, 'info');
          }}
        />

        <ToastContainer toasts={store.toasts} onDismiss={store.dismissToast} />

        <FloatingWidgets settings={store.settings} onNavigate={navigate} />
      </div>
    </MotionConfig>
  );
}
