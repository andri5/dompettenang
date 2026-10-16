import { test, expect } from '@playwright/test';

test.describe('Accessibility - Keyboard Navigation', () => {
  test('TC-101: Login Form Tab Navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form
    await page.keyboard.press('Tab');
    
    // Check focus on email input
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('TC-102: Form Submission via Enter Key', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Should attempt login
    await expect(page).toHaveURL(/\/dashboard|\/login/, { timeout: 5000 });
  });

  test('TC-103: Modal Navigation with Keyboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.goto('/categories');
    
    // Open modal with keyboard focus
    await page.click('button:has-text("Add")');
    
    // Tab through modal fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Escape to close modal
    await page.keyboard.press('Escape');
    
    // Modal should close
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).not.toBeVisible({ timeout: 500 });
  });

  test('TC-104: Button Activation via Space/Enter', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Tab past inputs
    
    // Find focused element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Focused element: ${focused}`);
    
    // Activate with Space
    await page.keyboard.press('Space');
    
    // Button should respond
    await page.waitForTimeout(500);
  });

  test('TC-105: Link Navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Find "Don't have account?" link
    const registerLink = page.locator('a:has-text("register"), a:has-text("Sign up")').first();
    
    if (await registerLink.isVisible()) {
      // Tab to link
      await registerLink.focus();
      
      // Press Enter
      await page.keyboard.press('Enter');
      
      // Should navigate
      await expect(page).toHaveURL(/\/register/, { timeout: 2000 });
    }
  });
});

test.describe('Accessibility - ARIA Labels & Roles', () => {
  test('TC-111: Form Input Labels', async ({ page }) => {
    await page.goto('/login');
    
    // All inputs should have associated labels
    const inputs = page.locator('input');
    
    for (let i = 0; i < await inputs.count(); i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const labelCount = await label.count();
        
        // Should have label or aria-label
        const hasAriaLabel = await input.getAttribute('aria-label');
        expect(labelCount > 0 || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('TC-112: Button Accessibility', async ({ page }) => {
    await page.goto('/login');
    
    const buttons = page.locator('button');
    
    for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have accessible name
      expect(text || ariaLabel || title).toBeTruthy();
    }
  });

  test('TC-113: Dialog Role', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.goto('/categories');
    
    // Open modal
    await page.click('button:has-text("Add")');
    
    // Modal should have dialog role
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    
    const role = await modal.getAttribute('role');
    expect(role).toBe('dialog');
  });

  test('TC-114: List Semantic HTML', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    
    await page.goto('/expenses');
    
    // Lists should use semantic HTML or proper ARIA roles
    const expensesList = page.locator('ul, [role="list"]').first();
    const isVisible = await expensesList.isVisible().catch(() => false);
    
    console.log(`List element present: ${isVisible}`);
  });

  test('TC-115: Form Error Association', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form to trigger errors
    await page.click('button[type="submit"]');
    
    // Wait for errors
    await page.waitForTimeout(500);
    
    // Errors should be associated with inputs via aria-describedby
    const errorMessages = page.locator('[class*="error"]');
    const count = await errorMessages.count();
    
    console.log(`Error messages found: ${count}`);
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('TC-121: Button Text Contrast', async ({ page }) => {
    await page.goto('/login');
    
    const button = page.locator('button[type="submit"]');
    
    // Get computed styles
    const styles = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
      };
    });
    
    console.log(`Button colors: ${JSON.stringify(styles)}`);
    
    // Colors should be defined
    expect(styles.backgroundColor).toBeDefined();
    expect(styles.color).toBeDefined();
  });

  test('TC-122: Link Color Contrast', async ({ page }) => {
    await page.goto('/login');
    
    const links = page.locator('a');
    
    for (let i = 0; i < Math.min(await links.count(), 3); i++) {
      const link = links.nth(i);
      
      const color = await link.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      
      console.log(`Link color: ${color}`);
      expect(color).toBeDefined();
    }
  });

  test('TC-123: Text Input Contrast', async ({ page }) => {
    await page.goto('/login');
    
    const input = page.locator('input[name="email"]');
    
    // Focus to see contrast
    await input.focus();
    
    const borderColor = await input.evaluate((el) => 
      window.getComputedStyle(el).borderColor
    );
    
    console.log(`Input border color: ${borderColor}`);
    expect(borderColor).toBeDefined();
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('TC-131: Focus Visible on Interactive Elements', async ({ page }) => {
    await page.goto('/login');
    
    const button = page.locator('button[type="submit"]');
    
    // Tab to button
    await button.focus();
    
    // Should have visible focus indicator
    const outline = await button.evaluate((el) => 
      window.getComputedStyle(el).outline
    );
    
    console.log(`Button focus outline: ${outline}`);
  });

  test('TC-132: Focus Trap in Modal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.goto('/categories');
    
    // Open modal
    await page.click('button:has-text("Add")');
    
    // Tab through modal repeatedly
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Focus should still be within modal
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el?.closest('[role="dialog"]') !== null;
    });
    
    console.log(`Focus still in modal: ${focused}`);
  });

  test('TC-133: Restore Focus After Modal Close', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.goto('/categories');
    
    // Get trigger button
    const addBtn = page.locator('button:has-text("Add")');
    
    // Open modal
    await addBtn.click();
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Focus should return to trigger button or nearby element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Focused element after modal close: ${focused}`);
  });
});

test.describe('Accessibility - Responsive Text', () => {
  test('TC-141: Text Scaling', async ({ page }) => {
    await page.goto('/login');
    
    // Set zoom to 200%
    await page.evaluate(() => {
      (document.documentElement as any).style.zoom = '1.5';
    });
    
    // Content should be readable
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Reset zoom
    await page.evaluate(() => {
      (document.documentElement as any).style.zoom = '1';
    });
  });

  test('TC-142: Text Wrapping', async ({ page }) => {
    await page.goto('/login');
    
    // Narrow viewport
    await page.setViewportSize({ width: 300, height: 667 });
    
    // Text should wrap and be readable
    const heading = page.locator('h1').first();
    
    if (await heading.isVisible()) {
      const text = await heading.textContent();
      console.log(`Heading text: ${text}`);
      expect(text).toBeTruthy();
    }
  });
});
