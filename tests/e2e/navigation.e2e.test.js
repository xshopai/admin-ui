import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
  });

  test('should display xshopai branding in sidebar', async ({ page }) => {
    const branding = page.getByRole('heading', { name: 'xshopai' }).first();
    await expect(branding).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to each page via URL', async ({ page }) => {
    const pages = [
      { path: '/users', text: 'users' },
      { path: '/products', text: 'products' },
      { path: '/orders', text: 'orders' },
      { path: '/settings', text: 'settings' },
    ];

    for (const pg of pages) {
      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(pg.path);
    }
  });

  test('should display user info in header', async ({ page }) => {
    const userName = page.getByText('Admin User');
    await expect(userName.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display user email in header', async ({ page }) => {
    const userEmail = page.getByText('admin@xshopai.com');
    await expect(userEmail.first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect root to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should display page title in header bar', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    // Header bar shows page name from URL path
    const headerTitle = page.locator('header h2');
    await expect(headerTitle).toBeVisible({ timeout: 5000 });
    const text = await headerTitle.textContent();
    expect(text?.toLowerCase()).toContain('users');
  });

  test('should have sign out button', async ({ page }) => {
    const signOutButton = page.locator('button[title="Sign out"]');
    await expect(signOutButton).toBeVisible({ timeout: 5000 });
  });
});
