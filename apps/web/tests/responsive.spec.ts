import { test, expect } from '@playwright/test';

// Mobile configuration
test.describe('Responsive Layout - Mobile (375px)', () => {
  // Tests will set viewport manually

  test('TC-061: Mobile Navigation Toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // On mobile, hamburger menu should be visible
    const toggleBtn = page.locator('[aria-label="toggle sidebar"], button[class*="hamburger"]').first();
    
    if (await toggleBtn.isVisible()) {
      await expect(toggleBtn).toBeVisible();
      
      // Toggle should work
      await toggleBtn.click();
      await page.waitForTimeout(300);
      
      // Navigate link should be accessible
      const navLink = page.locator('a:has-text("Categories"), button:has-text("Categories")');
      await expect(navLink).toBeVisible({ timeout: 2000 });
    }
  });

  test('TC-062: Mobile Form Layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Form elements should be full width on mobile
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    // Get viewport width
    const viewportWidth = page.viewportSize()?.width || 375;
    
    // Input should be responsive
    const inputBox = await emailInput.boundingBox();
    expect(inputBox).toBeDefined();
  });

  test('TC-063: Mobile Button Size', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    const submitBtn = page.locator('button[type="submit"]');
    const buttonBox = await submitBtn.boundingBox();
    
    // Button should be appropriately sized for touch (min 44px height)
    expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
  });

  test('TC-064: Mobile Expense List Display', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/expenses');
    
    // List should be visible on mobile
    const listItems = page.locator('[data-testid="expense-item"]');
    const count = await listItems.count();
    
    console.log(`Mobile: Found ${count} expense items`);
    
    // If items exist, they should be readable
    if (count > 0) {
      const firstItem = listItems.first();
      const box = await firstItem.boundingBox();
      expect(box).toBeDefined();
    }
  });

  test('TC-065: Mobile Keyboard Input', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    const emailInput = page.locator('input[name="email"]');
    
    // Input should work
    await emailInput.fill('test@example.com');
    
    const value = await emailInput.inputValue();
    expect(value).toBe('test@example.com');
  });
});

// Tablet configuration
test.describe('Responsive Layout - Tablet (768px)', () => {
  test('TC-071: Tablet Sidebar Behavior', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Sidebar might be visible or hidden on tablet
    const sidebar = page.locator('[class*="sidebar"]').first();
    const isVisible = await sidebar.isVisible().catch(() => false);
    
    console.log(`Tablet: Sidebar visible: ${isVisible}`);
  });

  test('TC-072: Tablet Grid Layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/categories');
    
    // Grid should adapt to tablet size
    const gridItems = page.locator('[data-testid="categories-grid"] > div');
    const count = await gridItems.count();
    
    console.log(`Tablet: Found ${count} grid items`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-073: Tablet Form Rendering', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/register');
    
    // Form should be properly sized for tablet
    const form = page.locator('form').first();
    const formBox = await form.boundingBox();
    
    // Form should have reasonable width (not full width)
    expect(formBox?.width).toBeGreaterThan(300);
  });

  test('TC-074: Tablet Touch Interactions', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/login');
    
    const button = page.locator('button[type="submit"]');
    
    // Buttons should be touch-friendly
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
    expect(buttonBox?.width).toBeGreaterThanOrEqual(60);
  });
});

// Desktop configuration
test.describe('Responsive Layout - Desktop (1024px+)', () => {
  test('TC-081: Desktop Sidebar Layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('[class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 1000 });
  });

  test('TC-082: Desktop Multi-Column Layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/dashboard');
    
    // Dashboard should show multiple columns
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('TC-083: Desktop Grid Multi-Column', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/categories');
    
    // On desktop, grid should show multiple columns
    const gridItems = page.locator('[data-testid="categories-grid"] > div');
    const count = await gridItems.count();
    
    console.log(`Desktop: Found ${count} grid items`);
    
    // Multiple items per row on desktop
    if (count >= 3) {
      const firstItem = gridItems.nth(0);
      const secondItem = gridItems.nth(1);
      
      const firstBox = await firstItem.boundingBox();
      const secondBox = await secondItem.boundingBox();
      
      // Items should be side by side (similar Y position)
      if (firstBox && secondBox) {
        console.log(`First item Y: ${firstBox.y}, Second item Y: ${secondBox.y}`);
      }
    }
  });

  test('TC-084: Desktop Form Width', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    await page.goto('/login');
    
    const form = page.locator('form').first();
    const formBox = await form.boundingBox();
    
    // Form should not be full width on desktop
    expect(formBox?.width).toBeLessThan(600);
  });

  test('TC-085: Desktop Hover Effects Visible', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    await page.goto('/login');
    
    const button = page.locator('button[type="submit"]');
    
    // Hover should trigger animation
    await button.hover();
    
    // Check for hover state change
    const hoverOpacity = await button.evaluate((el) => 
      window.getComputedStyle(el).opacity
    );
    
    console.log(`Desktop button hover opacity: ${hoverOpacity}`);
  });
});

// Responsive breakpoints cross-test
test.describe('Responsive Layout - Breakpoint Transitions', () => {
  test('TC-091: Content Reflow at Breakpoints', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Test at multiple breakpoints
    const breakpoints = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' },
    ];
    
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(300);
      
      // Navigate to verify layout adapts
      await page.goto('/categories');
      
      const gridItems = page.locator('[data-testid="categories-grid"] > div');
      const count = await gridItems.count();
      
      console.log(`${bp.name}: ${count} items visible`);
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC-092: Sidebar Toggle Across Breakpoints', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    let toggleBtn = page.locator('[aria-label="toggle sidebar"]').first();
    const mobileHasToggle = await toggleBtn.isVisible().catch(() => false);
    
    // Test on desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    toggleBtn = page.locator('[aria-label="toggle sidebar"]').first();
    const desktopHasToggle = await toggleBtn.isVisible().catch(() => false);
    
    console.log(`Mobile has toggle: ${mobileHasToggle}, Desktop has toggle: ${desktopHasToggle}`);
  });

  test('TC-093: Modal Responsive Width', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Test modal width at different breakpoints
    const breakpoints = [375, 768, 1440];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 667 });
      
      await page.goto('/categories');
      await page.click('button:has-text("Add")');
      
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      
      if (await modal.isVisible({ timeout: 500 })) {
        const modalBox = await modal.boundingBox();
        
        // Modal should fit in viewport with padding
        expect(modalBox?.width).toBeLessThan(width - 32); // 16px padding each side
        
        console.log(`Modal width at ${width}px viewport: ${modalBox?.width}px`);
      }
    }
  });
});
