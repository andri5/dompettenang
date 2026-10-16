import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import expenseRoutes from './expense.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import uploadRoutes from './upload.routes.js';
import marketRoutes from './market.routes.js';
import budgetRoutes from './budget.routes.js';
import recurringRoutes from './recurring.routes.js';
import savingsRoutes from './savings.routes.js';
import feedbackRoutes from './feedback.routes.js';
import adminRoutes from './admin.routes.js';
import featureFlagsRoutes from './featureFlags.routes.js';
import analyticsRoutes from './analytics.routes.js';
import legalRoutes from './legal.routes.js';
import billingRoutes from './billing.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dompet Tenang API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/uploads', uploadRoutes);
router.use('/market', marketRoutes);
router.use('/budgets', budgetRoutes);
router.use('/recurring', recurringRoutes);
router.use('/savings', savingsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin', adminRoutes);
router.use('/billing', billingRoutes);
router.use('/', featureFlagsRoutes);
router.use('/', analyticsRoutes);
router.use('/', legalRoutes);

export default router;
