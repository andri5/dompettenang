/**
 * Dompet Tenang - Public Route Component
 * Redirects to dashboard if already authenticated
 * (except auth recovery pages that must stay reachable while logged in)
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { Loading } from '@/components/ui';

interface PublicRouteProps {
  children: React.ReactNode;
  /** Allow opening this page even when a session exists */
  allowAuthenticated?: boolean;
}

export function PublicRoute({ children, allowAuthenticated = false }: PublicRouteProps) {
  const { isAuthenticated, isBootstrapping } = useAuthStore();
  const location = useLocation();

  const isRecovery =
    allowAuthenticated ||
    location.pathname === ROUTES.FORGOT_PASSWORD ||
    location.pathname === ROUTES.RESET_PASSWORD;

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loading message="Memulihkan sesi..." />
      </div>
    );
  }

  if (isAuthenticated && !isRecovery) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
