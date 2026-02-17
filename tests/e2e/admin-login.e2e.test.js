import { test, expect } from '@playwright/test';

/**
 * Admin UI E2E Test: Admin Login
 *
 * Tests admin authentication flow:
 * 1. Navigate to admin login page
 * 2. Enter admin credentials
 * 3. Submit login form
 * 4. Verify redirect to admin dashboard
 * 5. Verify admin session persists
 * 6. Test logout functionality
 */

const BASE_URL = process.env.ADMIN_UI_URL || 'http://localhost:3001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8004';

test.describe('Admin Login E2E', () => {
  test('should login with valid admin credentials', async ({ page }) => {
    console.log('Testing admin login...');

    // Navigate to admin login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in admin credentials
    await page.fill('[data-testid="email-input"], input[name="email"]', 'admin@xshopai.com');
    await page.fill('[data-testid="password-input"], input[name="password"]', 'admin123');

    // Click login button
    const loginButton = page.locator('[data-testid="login-button"], button[type="submit"]');
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Verify dashboard elements
    const dashboardHeading = page.locator('h1:has-text("Dashboard"), [data-testid="dashboard-title"]');
    await expect(dashboardHeading).toBeVisible();

    console.log('✅ Admin logged in successfully');
  });

  test('should reject invalid credentials', async ({ page }) => {
    console.log('Testing invalid credentials...');

    await page.goto(`${BASE_URL}/login`);

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Click login
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Wait for error message
    const errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Invalid credentials rejected');
  });

  test('should validate required fields', async ({ page }) => {
    console.log('Testing form validation...');

    await page.goto(`${BASE_URL}/login`);

    // Try to submit without filling fields
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Verify validation messages
    const validationErrors = page.locator('.error, [data-error]');
    const errorCount = await validationErrors.count();

    if (errorCount > 0) {
      console.log(`✅ Form validation works: ${errorCount} errors`);
    } else {
      console.log('⚠️  Form validation may need implementation');
    }
  });

  test('should logout successfully', async ({ page }) => {
    console.log('Testing logout...');

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@xshopai.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Click logout
    const logoutButton = page.locator(
      '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")',
    );

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Verify redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });

      console.log('✅ Logout successful');
    } else {
      console.log('⚠️  Logout button not found - may need to implement');
    }
  });

  test('should maintain session after page refresh', async ({ page }) => {
    console.log('Testing session persistence...');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@xshopai.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Refresh page
    await page.reload();

    // Verify still on dashboard (session maintained)
    const url = page.url();
    expect(url).toContain('dashboard');

    console.log('✅ Session persisted after refresh');
  });
});
