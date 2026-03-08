import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Settings Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings page heading', async ({ page }) => {
    const heading = page.locator('main h1:has-text("Settings")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display profile section', async ({ page }) => {
    const profileSection = page.getByText('Profile & Account');
    await expect(profileSection).toBeVisible({ timeout: 10000 });
  });

  test('should display email address field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should display appearance section with theme toggle', async ({ page }) => {
    const appearanceHeading = page.getByRole('heading', { name: 'Appearance' });
    await expect(appearanceHeading).toBeVisible({ timeout: 10000 });

    const themeButton = page.locator('button:has-text("Toggle to")');
    await expect(themeButton).toBeVisible();
  });

  test('should display notifications section', async ({ page }) => {
    const notificationsHeading = page.getByRole('heading', { name: 'Notifications' });
    await expect(notificationsHeading).toBeVisible({ timeout: 10000 });
  });

  test('should have notification toggles', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should display save button', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save Notification Preferences")');
    await expect(saveButton).toBeVisible({ timeout: 10000 });
  });

  test('should display about section with version info', async ({ page }) => {
    const aboutHeading = page.getByRole('heading', { name: 'About' });
    await expect(aboutHeading).toBeVisible({ timeout: 10000 });

    const versionText = page.getByText('v1.0.0');
    await expect(versionText).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    const themeButton = page.locator('button:has-text("Toggle to")');
    await expect(themeButton).toBeVisible({ timeout: 10000 });
    const initialText = await themeButton.textContent();
    await themeButton.click();
    await page.waitForTimeout(500);

    const updatedText = await themeButton.textContent();
    expect(updatedText).not.toBe(initialText);
  });
});
