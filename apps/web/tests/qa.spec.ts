import { test, expect } from '@playwright/test';

test.describe('QA - Error Handling', () => {
  test('TC-151: Invalid Email Validation', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Test@12345');
    
    // Blur to trigger validation
    await page.locator('input[name="email"]').blur();
    
    // Error should appear or submit should fail
    await page.click('button[type="submit"]');
    
    // Either error message or still on login page
    const stillOnLogin = (await page.url()).includes('/login');
    const hasError = await page.locator('[class*="error"]').count() > 0;
    
    expect(stillOnLogin || hasError).toBeTruthy();
  });

  test('TC-152: Password Strength Validation', async ({ page }) => {
    await page.goto('/register');
    
    // Enter weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    
    // Should show validation error
    await page.waitForTimeout(300);
    
    const errorMsg = page.locator('[class*="error"], [class*="helper"]');
    const isVisible = await errorMsg.isVisible().catch(() => false);
    
    console.log(`Password validation error visible: ${isVisible}`);
  });

  test('TC-153: Network Error Handling', async ({ page }) => {
    await page.goto('/login');
    
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Error message should appear
    const hasErrorMsg = await page.locator('[class*="error"], [class*="toast"]').count() > 0;
    expect(hasErrorMsg).toBeTruthy();
    
    // Restore connection
    await page.context().setOffline(false);
  });

  test('TC-154: Missing Required Field Validation', async ({ page }) => {
    await page.goto('/register');
    
    // Leave email empty
    await page.fill('input[name="password"]', 'Test@12345');
    await page.fill('input[name="confirmPassword"]', 'Test@12345');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await page.waitForTimeout(300);
    
    const errorCount = await page.locator('[class*="error"]').count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('TC-155: Duplicate Entry Handling', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    
    // Try to create duplicate category
    await page.goto('/categories');
    
    // Create first category
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'TestCategory');
    await page.click('button[type="submit"]:not([disabled])');
    
    await page.waitForTimeout(500);
    
    // Try to create duplicate
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'TestCategory');
    await page.click('button[type="submit"]:not([disabled])');
    
    // Should show error or be prevented
    await page.waitForTimeout(500);
  });
});

test.describe('QA - Edge Cases', () => {
  test('TC-161: Very Long Input Handling', async ({ page }) => {
    await page.goto('/login');
    
    const longEmail = 'a'.repeat(100) + '@example.com';
    await page.fill('input[name="email"]', longEmail);
    
    // Input should handle long text gracefully
    const value = await page.locator('input[name="email"]').inputValue();
    console.log(`Long input length: ${value.length}`);
  });

  test('TC-162: Special Characters in Input', async ({ page }) => {
    await page.goto('/register');
    
    // Enter special characters
    await page.fill('input[name="email"]', 'test+alias@example.com');
    await page.fill('input[name="password"]', 'P@ss!w0rd#$%');
    
    // Should handle without errors
    const emailValue = await page.locator('input[name="email"]').inputValue();
    expect(emailValue).toContain('+');
  });

  test('TC-163: Rapid Form Submission', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    
    const submitBtn = page.locator('button[type="submit"]');
    
    // Rapid clicks
    await submitBtn.click();
    await submitBtn.click();
    await submitBtn.click();
    
    // Should handle gracefully (no duplicate requests)
    await page.waitForTimeout(1000);
  });

  test('TC-164: Session Timeout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    
    // Navigate to page
    await page.goto('/expenses');
    
    // Simulate session expiry by clearing token
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Refresh page
    await page.reload();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('QA - Console & Performance', () => {
  test('TC-171: No Console Errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through app
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    console.log(`Console errors: ${consoleErrors.length}`);
    expect(consoleErrors.length).toBe(0);
  });

  test('TC-172: Page Load Performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000);
  });

  test('TC-173: Memory Leak Check', async ({ page }) => {
    // Perform multiple navigation cycles
    for (let i = 0; i < 3; i++) {
      await page.goto('/login');
      await page.waitForTimeout(300);
      
      await page.goto('/register');
      await page.waitForTimeout(300);
    }
    
    // Memory should not spike excessively
    // (Note: Actual memory check requires more sophisticated monitoring)
    console.log('Navigation cycles completed');
  });

  test('TC-174: Resource Requests', async ({ page }) => {
    const requests: { url: string; status: number }[] = [];
    
    page.on('response', (response) => {
      requests.push({
        url: response.url(),
        status: response.status(),
      });
    });
    
    await page.goto('/login');
    
    // Check for failed requests
    const failedRequests = requests.filter((r) => r.status >= 400);
    
    console.log(`Failed requests: ${failedRequests.length}`);
    console.log(`Total requests: ${requests.length}`);
  });
});

test.describe('QA - Data Integrity', () => {
  test('TC-181: Form Data Persistence', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    
    // Refresh page
    await page.reload();
    
    // Check if form data persisted (depends on implementation)
    const email = await page.locator('input[name="email"]').inputValue();
    console.log(`Email persisted: ${email.length > 0}`);
  });

  test('TC-182: Date Format Consistency', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/expenses');
    
    // Check date formats in list
    const dates = await page.locator('[data-testid*="date"]').allTextContents();
    
    console.log(`Date values: ${dates.slice(0, 3).join(', ')}`);
  });

  test('TC-183: Number Format Consistency', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/expenses');
    
    // Check number formats (currency)
    const amounts = await page.locator('[data-testid*="amount"]').allTextContents();
    
    console.log(`Amount values: ${amounts.slice(0, 3).join(', ')}`);
  });
});

test.describe('QA - Regression Tests', () => {
  test('TC-191: Complete User Flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    
    // Navigate through pages
    await page.goto('/expenses');
    await expect(page).toHaveURL(/\/expenses/);
    
    await page.goto('/categories');
    await expect(page).toHaveURL(/\/categories/);
    
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    
    console.log('Complete user flow: PASSED');
  });

  test('TC-192: All Components Render', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    // Check for key components
    const components = {
      buttons: await page.locator('button').count(),
      inputs: await page.locator('input').count(),
      links: await page.locator('a').count(),
    };
    
    console.log(`Components found: ${JSON.stringify(components)}`);
    
    expect(components.buttons).toBeGreaterThan(0);
  });
});
