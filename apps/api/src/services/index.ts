export { authService } from './auth.service.js';
export { categoryService } from './category.service.js';
export { ensureDefaultCategories } from './defaultCategories.service.js';
export { expenseService } from './expense.service.js';
export { dashboardService } from './dashboard.service.js';
export { budgetService } from './budget.service.js';
export { auditService } from './audit.service.js';
export { ensureDefaultFeatureFlags, getFeatureFlags, setFeatureFlag, isFeatureEnabled } from './featureFlags.service.js';
export {
  ensureDefaultLegalDocuments,
  listLegalDocuments,
  getLegalDocument,
  updateLegalDocument,
} from './legal.service.js';
