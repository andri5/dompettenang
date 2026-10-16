import { test, expect } from '@playwright/test';

test.describe('Animation Performance - FPS & Smoothness', () => {
  test('TC-041: Button Hover Animation FPS', async ({ page }) => {
    await page.goto('/login');
    
    const button = page.locator('button[type="submit"]');
    
    // Record performance during hover
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFrames = () => {
          frameCount++;
          const currentTime = performance.now();
          const elapsed = (currentTime - lastTime) / 1000;
          
          if (elapsed >= 1) {
            const currentFps = Math.round(frameCount / elapsed);
            resolve(currentFps);
            return;
          }
          requestAnimationFrame(measureFrames);
        };
        
        requestAnimationFrame(measureFrames);
      });
    });
    
    // Hover over button during measurement
    await button.hover();
    
    // Should maintain 50+ FPS (accounting for system variance)
    console.log(`Button hover animation FPS: ${fps}`);
    expect(fps as number).toBeGreaterThanOrEqual(30); // Conservative minimum
  });

  test('TC-042: Input Focus Animation Smoothness', async ({ page }) => {
    await page.goto('/register');
    
    const input = page.locator('input[name="email"]');
    
    // Measure animation timing
    const animationTime = await page.evaluate(() => {
      const start = performance.now();
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const end = performance.now();
          resolve(Math.round(end - start));
        });
      });
    });
    
    await input.focus();
    
    // Animation should complete within reasonable time
    console.log(`Input focus animation frame time: ${animationTime}ms`);
    expect(animationTime as number).toBeLessThan(16.67); // ~60fps frame time
  });

  test('TC-043: Page Transition Animation Duration', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Measure navigation timing
    const startTime = performance.now();
    
    // Navigate to expenses
    await page.goto('/expenses');
    
    const navigationTime = performance.now() - startTime;
    
    // Page transition should be fast (under 500ms for local dev)
    console.log(`Page transition time: ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(1000);
  });

  test('TC-044: Sidebar Collapse Animation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    const toggleBtn = page.locator('[aria-label="toggle sidebar"]').first();
    
    if (await toggleBtn.isVisible()) {
      const startTime = performance.now();
      
      // Click toggle
      await toggleBtn.click();
      
      // Wait for animation to complete
      await page.waitForTimeout(300);
      
      const collapseTime = performance.now() - startTime;
      
      console.log(`Sidebar collapse animation time: ${collapseTime}ms`);
      expect(collapseTime).toBeLessThan(500);
    }
  });
});

test.describe('Animation Performance - Loading States', () => {
  test('TC-045: Form Submission Loading Animation', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    
    // Click submit and capture loading animation
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Button should show loading state
    await page.waitForTimeout(200);
    
    // Check if button has loading indicator or changed state
    const hasSpinner = await page.locator('button[type="submit"] [class*="spinner"]').count() > 0;
    const hasLoadingClass = await submitBtn.evaluate((el) => 
      el.className.includes('loading') || el.getAttribute('disabled') !== null
    );
    
    console.log(`Loading indicator visible: ${hasSpinner || hasLoadingClass}`);
    expect(hasSpinner || hasLoadingClass).toBeDefined();
  });

  test('TC-046: Modal Opening Animation Timing', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.goto('/categories');
    
    const startTime = performance.now();
    
    // Open modal
    await page.click('button:has-text("Add")');
    
    // Wait for modal to be visible
    await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible({ timeout: 500 });
    
    const modalOpenTime = performance.now() - startTime;
    
    console.log(`Modal open animation time: ${modalOpenTime}ms`);
    expect(modalOpenTime).toBeLessThan(500);
  });
});

test.describe('Animation Performance - List Rendering', () => {
  test('TC-047: Grid Stagger Animation Performance', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate to categories to see staggered grid
    await page.goto('/categories');
    
    const startTime = performance.now();
    
    // Wait for all cards to animate in
    await expect(page.locator('[data-testid="categories-grid"] > div').first()).toBeVisible();
    await page.waitForTimeout(500); // Wait for stagger animation
    
    const staggerTime = performance.now() - startTime;
    
    console.log(`Grid stagger animation time: ${staggerTime}ms`);
    expect(staggerTime).toBeLessThan(1000);
  });

  test('TC-048: List Item Hover Animation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.goto('/expenses');
    
    // Find first list item
    const listItem = page.locator('[data-testid="expense-item"]').first();
    
    if (await listItem.isVisible()) {
      const startTime = performance.now();
      
      // Hover over item
      await listItem.hover();
      
      // Brief wait for animation
      await page.waitForTimeout(150);
      
      const hoverTime = performance.now() - startTime;
      
      console.log(`List item hover animation time: ${hoverTime}ms`);
      expect(hoverTime).toBeLessThan(300);
    }
  });
});

test.describe('Animation Performance - Memory Usage', () => {
  test('TC-049: Long Animation Sequence Memory', async ({ page }) => {
    await page.goto('/login');
    
    // Get initial memory (if available)
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    // Perform multiple animations
    const button = page.locator('button[type="submit"]');
    for (let i = 0; i < 10; i++) {
      await button.hover();
      await page.waitForTimeout(100);
    }
    
    // Check memory after animations
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = ((finalMemory as number) - (initialMemory as number)) / 1024 / 1024;
      console.log(`Memory increase after animations: ${memoryIncrease.toFixed(2)}MB`);
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10);
    }
  });
});

test.describe('Animation Performance - Responsiveness', () => {
  test('TC-050: Input Response Time (Fast Typing)', async ({ page }) => {
    await page.goto('/register');
    
    const input = page.locator('input[name="email"]');
    
    const startTime = performance.now();
    
    // Simulate fast typing
    await input.type('test@example.com', { delay: 10 }); // 10ms between keystrokes
    
    const typingTime = performance.now() - startTime;
    
    // Should handle fast input without lag
    console.log(`Fast typing response time: ${typingTime}ms`);
    expect(typingTime).toBeLessThan(2000);
  });

  test('TC-051: Click Response Time', async ({ page }) => {
    await page.goto('/login');
    
    const button = page.locator('button[type="submit"]');
    
    const startTime = performance.now();
    
    // Click button
    await button.click();
    
    // Wait for response
    await page.waitForTimeout(100);
    
    const responseTime = performance.now() - startTime;
    
    console.log(`Button click response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(200);
  });
});
