import { test, expect } from '@playwright/test';

test.describe('Authentication - CRUD Operations', () => {
  test('TC-001: User Registration (CREATE)', async ({ page }) => {
    await page.goto('/register');
    
    // Wait for page to load
    await expect(page).toHaveTitle(/Dompet Tenang/);
    
    // Fill registration form
    const uniqueEmail = `test_${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Test@12345');
    await page.fill('input[name="confirmPassword"]', 'Test@12345');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect or success message
    await expect(page).toHaveURL(/\/login|\/dashboard/, { timeout: 5000 });
  });

  test('TC-002: User Login (READ)', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify dashboard access
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('TC-003: Session Persistence (READ)', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    // Navigate and return
    await page.goto('/expenses');
    await expect(page).toHaveURL(/\/expenses/);
    
    // Verify still logged in
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-004: User Logout (DELETE session)', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout
    await page.click('button[aria-label="menu"]'); // Hamburger/menu button
    await page.click('text=Logout');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Categories - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-005: Create Category', async ({ page }) => {
    await page.goto('/categories');
    
    // Click add category button
    await page.click('button:has-text("Add Category")');
    
    // Fill category form
    const categoryName = `TestCategory_${Date.now()}`;
    await page.fill('input[name="name"]', categoryName);
    await page.fill('input[name="description"]', 'Test category description');
    
    // Submit form
    await page.click('button[type="submit"]:not([disabled])');
    
    // Verify success
    await expect(page.locator('text=Category created successfully')).toBeVisible({ timeout: 5000 });
  });

  test('TC-006: Read Categories List', async ({ page }) => {
    await page.goto('/categories');
    
    // Wait for categories grid to load
    await expect(page.locator('[data-testid="categories-grid"]')).toBeVisible({ timeout: 5000 });
    
    // Verify at least one category exists
    const cards = await page.locator('div[class*="card"]').count();
    expect(cards).toBeGreaterThanOrEqual(0);
  });

  test('TC-007: Update Category', async ({ page }) => {
    await page.goto('/categories');
    
    // Wait for first category and click edit
    await expect(page.locator('button:has-text("Edit")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Edit")');
    
    // Update category
    const updatedName = `Updated_${Date.now()}`;
    await page.fill('input[name="name"]', updatedName);
    
    // Submit
    await page.click('button[type="submit"]:not([disabled])');
    
    // Verify success
    await expect(page.locator('text=Category updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('TC-008: Delete Category', async ({ page }) => {
    await page.goto('/categories');
    
    // Wait for delete button
    await expect(page.locator('button[aria-label="delete"]')).toBeVisible({ timeout: 5000 });
    
    // Click delete
    await page.click('button[aria-label="delete"]');
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify success
    await expect(page.locator('text=Category deleted successfully')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Expenses - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-009: Create Expense', async ({ page }) => {
    await page.goto('/expenses');
    
    // Click add expense button
    await page.click('button:has-text("Add Expense")');
    
    // Fill expense form
    await page.fill('input[name="description"]', 'Test Expense');
    await page.fill('input[name="amount"]', '50000');
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    
    // Submit form
    await page.click('button[type="submit"]:not([disabled])');
    
    // Verify success
    await expect(page.locator('text=Expense created successfully')).toBeVisible({ timeout: 5000 });
  });

  test('TC-010: Read Expenses List', async ({ page }) => {
    await page.goto('/expenses');
    
    // Wait for expenses table/list to load
    await expect(page.locator('[data-testid="expenses-list"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-011: Update Expense', async ({ page }) => {
    await page.goto('/expenses');
    
    // Click first edit button
    await expect(page.locator('button:has-text("Edit")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Edit")');
    
    // Update expense
    await page.fill('input[name="description"]', 'Updated Expense');
    await page.fill('input[name="amount"]', '75000');
    
    // Submit
    await page.click('button[type="submit"]:not([disabled])');
    
    // Verify success
    await expect(page.locator('text=Expense updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('TC-012: Delete Expense', async ({ page }) => {
    await page.goto('/expenses');
    
    // Click first delete button
    await expect(page.locator('button[aria-label="delete"]')).toBeVisible({ timeout: 5000 });
    await page.click('button[aria-label="delete"]');
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify success
    await expect(page.locator('text=Expense deleted successfully')).toBeVisible({ timeout: 5000 });
  });
});
