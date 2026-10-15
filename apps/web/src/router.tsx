/**
 * Dompet Tenang - Router Configuration
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, ProFeatureGate } from '@/components/auth';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  DashboardPage,
  ExpensesPage,
  ExpenseFormPage,
  IncomesPage,
  CategoriesPage,
  BudgetPage,
  RecurringPage,
  SavingsPage,
  LandingPage,
  AdminLayout,
  AdminOverview,
  AdminUsers,
  AdminFeedback,
  AdminTraffic,
  AdminFlags,
  AdminActivity,
  AdminLegal,
  AdminProRequests,
  SettingsPage,
  UpgradePage,
  HelpPage,
  TermsPage,
  PrivacyPage,
  NotFoundPage,
  MaintenancePage,
} from '@/pages';
import { ROUTES } from '@/lib/constants';
import { isMaintenanceMode } from '@/lib/maintenance';

const appRoutes = [
  {
    path: ROUTES.LOGIN,
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.REGISTER,
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.TERMS,
    element: <TermsPage />,
  },
  {
    path: ROUTES.PRIVACY,
    element: <PrivacyPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: (
      <PublicRoute allowAuthenticated>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: (
      <PublicRoute allowAuthenticated>
        <ResetPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.EXPENSES,
    element: (
      <ProtectedRoute>
        <ExpensesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.EXPENSE_NEW,
    element: (
      <ProtectedRoute>
        <ExpenseFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.EXPENSE_EDIT,
    element: (
      <ProtectedRoute>
        <ExpenseFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.INCOMES,
    element: (
      <ProtectedRoute>
        <IncomesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.INCOME_NEW,
    element: (
      <ProtectedRoute>
        <ExpenseFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.INCOME_EDIT,
    element: (
      <ProtectedRoute>
        <ExpenseFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.CATEGORIES,
    element: (
      <ProtectedRoute>
        <CategoriesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.BUDGET,
    element: (
      <ProtectedRoute>
        <BudgetPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.RECURRING,
    element: (
      <ProtectedRoute>
        <ProFeatureGate
          title="Transaksi Otomatis"
          description="Jadwalkan pemasukan/pengeluaran rutin — fitur Pro"
        >
          <RecurringPage />
        </ProFeatureGate>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SAVINGS,
    element: (
      <ProtectedRoute>
        <ProFeatureGate
          title="Target Tabungan"
          description="Pantau progres saving goals — fitur Pro"
        >
          <SavingsPage />
        </ProFeatureGate>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SETTINGS,
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.UPGRADE,
    element: (
      <ProtectedRoute>
        <UpgradePage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.HELP,
    element: (
      <ProtectedRoute>
        <HelpPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.MAINTENANCE,
    element: <MaintenancePage />,
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
  {
    path: ROUTES.ADMIN,
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'feedback', element: <AdminFeedback /> },
      { path: 'traffic', element: <AdminTraffic /> },
      { path: 'flags', element: <AdminFlags /> },
      { path: 'activity', element: <AdminActivity /> },
      { path: 'legal', element: <AdminLegal /> },
      { path: 'pro', element: <AdminProRequests /> },
    ],
  },
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

/** When VITE_MAINTENANCE_MODE=true, every path shows the maintenance page */
const maintenanceRoutes = [
  {
    path: '*',
    element: <MaintenancePage />,
  },
];

export const router = createBrowserRouter(
  isMaintenanceMode ? maintenanceRoutes : appRoutes
);
