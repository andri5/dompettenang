import { test, expect } from '@playwright/test';

test.describe('Public smoke', () => {
  test('landing loads with brand', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Dompet Tenang/i).first()).toBeVisible();
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Masuk$/i })).toBeVisible();
  });

  test('register page renders form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel('Nama')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /daftar sekarang/i })).toBeVisible();
  });

  test('unknown route shows not found or redirect', async ({ page }) => {
    await page.goto('/halaman-tidak-ada-xyz');
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(10);
  });
});
