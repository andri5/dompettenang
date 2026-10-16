import { test, expect } from '@playwright/test';

async function mockCaptchaOff(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/captcha-config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          enabled: false,
          provider: 'turnstile',
          siteKey: null,
          misconfigured: false,
        },
      }),
    });
  });
}

async function disableNativeValidation(page: import('@playwright/test').Page) {
  await page.locator('form').evaluate((form) => {
    (form as HTMLFormElement).noValidate = true;
  });
}

test.describe('UI Validation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCaptchaOff(page);
  });

  test('login: invalid email stays on login with field error', async ({ page }) => {
    await page.goto('/login');
    await disableNativeValidation(page);
    await page.getByLabel('Email').fill('bukan-email');
    await page.getByLabel('Password', { exact: true }).fill('Test@12345');
    await page.getByRole('button', { name: /^Masuk$/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/format email|tidak valid/i).first()).toBeVisible();
  });

  test('login: empty password blocked', async ({ page }) => {
    await page.goto('/login');
    await disableNativeValidation(page);
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: /^Masuk$/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/password wajib/i).first()).toBeVisible();
  });

  test('register: weak password shows validation', async ({ page }) => {
    await page.goto('/register');
    await disableNativeValidation(page);
    await page.getByLabel('Nama').fill('Tester QA');
    await page.getByLabel('Email').fill('qa@example.com');
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByLabel('Konfirmasi').fill('weak');
    await page.getByRole('button', { name: /laki-laki/i }).click();
    await page.getByLabel('Tanggal lahir').fill('1995-05-15');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /daftar sekarang/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(
      page.getByText(/password minimal|huruf dan angka/i).first()
    ).toBeVisible();
  });

  test('register: XSS name rejected', async ({ page }) => {
    await page.goto('/register');
    await disableNativeValidation(page);
    await page.getByLabel('Nama').fill('<script>alert(1)</script>');
    await page.getByLabel('Email').fill('safe@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Strong1!');
    await page.getByLabel('Konfirmasi').fill('Strong1!');
    await page.getByRole('button', { name: /laki-laki/i }).click();
    await page.getByLabel('Tanggal lahir').fill('1995-05-15');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /daftar sekarang/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(
      page.getByText(/tidak diizinkan|tidak valid/i).first()
    ).toBeVisible();
  });

  test('register: password mismatch', async ({ page }) => {
    await page.goto('/register');
    await disableNativeValidation(page);
    await page.getByLabel('Nama').fill('Tester QA');
    await page.getByLabel('Email').fill('qa2@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Strong1!');
    await page.getByLabel('Konfirmasi').fill('Strong2!');
    await page.getByRole('button', { name: /laki-laki/i }).click();
    await page.getByLabel('Tanggal lahir').fill('1995-05-15');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /daftar sekarang/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/tidak cocok/i).first()).toBeVisible();
  });

  test('forgot password: invalid email', async ({ page }) => {
    await page.goto('/forgot-password');
    await disableNativeValidation(page);
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: /kirim tautan reset/i }).click();
    await expect(page.getByText(/format email|tidak valid/i).first()).toBeVisible();
  });
});
