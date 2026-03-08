import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Returns Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
    await page.goto('/returns');
    await page.waitForLoadState('networkidle');
  });

  test('should display returns management page', async ({ page }) => {
    const heading = page.getByText('Returns Management');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display returns table', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should show returns table headers', async ({ page }) => {
    const headers = page.locator('thead th');
    await expect(headers.first()).toBeVisible({ timeout: 10000 });
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(5);
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should have status filter dropdown', async ({ page }) => {
    const statusSelect = page.locator('select');
    await expect(statusSelect.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible({ timeout: 5000 });
  });
});
