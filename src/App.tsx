/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { FloatingWidgets } from './components/FloatingWidgets';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { StudentAreaPage } from './pages/StudentAreaPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage, ContactPage, PoliciesPage } from './pages/InfoPages';

function AppShell() {
  const { route } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB] text-[#3A2E45]">
      <Header />
      <motion.div
        key={route}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1"
      >
        {route === 'home' && <HomePage />}
        {route === 'catalog' && <CatalogPage mode="catalog" />}
        {route === 'apostilas' && <CatalogPage mode="apostilas" />}
        {route === 'product' && <ProductDetailPage />}
        {route === 'checkout' && <CheckoutPage />}
        {route === 'student' && <StudentAreaPage />}
        {route === 'admin' && <AdminPage />}
        {route === 'about' && <AboutPage />}
        {route === 'contact' && <ContactPage />}
        {route === 'policies' && <PoliciesPage />}
      </motion.div>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
      <FloatingWidgets />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </ErrorBoundary>
  );
}
