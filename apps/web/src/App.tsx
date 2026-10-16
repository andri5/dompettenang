/**
 * Dompet Tenang - Main App Component
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { router } from './router';
import { useAuthStore } from '@/stores';
import { initThemeFromStorage } from '@/stores/ui.store';
import { Notifications } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VisitTracker } from '@/components/VisitTracker';
import './index.css';

initThemeFromStorage();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    const path = window.location.pathname;
    // Don't poke session APIs on recovery pages — avoids redirect races with ?token=
    if (path === '/reset-password' || path === '/forgot-password') {
      useAuthStore.setState({ isBootstrapping: false });
      initThemeFromStorage();
      return;
    }
    void initAuth();
    initThemeFromStorage();
  }, [initAuth]);

  // If a hard redirect cleared tokens but persist still says logged-in, reconcile on login
  useEffect(() => {
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register') return;
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated && !user) {
      useAuthStore.setState({ isAuthenticated: false });
    }
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AnimatePresence mode="wait">
            <RouterProvider router={router} />
          </AnimatePresence>
          <VisitTracker />
          <Notifications />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
