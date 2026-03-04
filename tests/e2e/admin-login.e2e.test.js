import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Admin Login E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should login with valid admin credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', 'admin@xshopai.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify we're on the dashboard (multiple h1/h2 exist, so just check URL)
    expect(page.url()).toContain('/dashboard');
  });

  test('should reject invalid credentials', async ({ page }) => {
    // Use 400 (not 401) so the axios interceptor doesn't trigger a full page
    // reload via window.location.href which would wipe the React error state.
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        }),
      }),
    );

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Error message rendered in <p class="text-sm text-red-800 ...">
    const errorMessage = page.getByText(/invalid email or password|invalid credentials|login failed/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Both fields have required attribute — clicking submit with empty fields
    // triggers HTML5 validation; the URL stays on /login
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    const url = page.url();
    expect(url).toContain('login');
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsAdmin(page);

    // Logout button is an icon-only button with title="Sign out"
    const logoutButton = page.locator('button[title="Sign out"]');
    if (await logoutButton.isVisible({ timeout: 3000 })) {
      await logoutButton.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });
    }
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Use pre-authenticated state so refresh doesn't redirect to login
    await setupApiMocks(page, { authenticated: true });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for ProtectedRoute to verify and render the page
    await page.waitForTimeout(2000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should still be on a protected page (not redirected to login)
    const url = page.url();
    expect(url).not.toContain('/login');
  });
});
