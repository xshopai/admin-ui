import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Orders Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
  });

  test('should display orders page with table', async ({ page }) => {
    const ordersTable = page.locator('table');
    await expect(ordersTable).toBeVisible({ timeout: 10000 });
  });

  test('should display order rows with data', async ({ page }) => {
    const orderRows = page.locator('tbody tr');
    await expect(orderRows.first()).toBeVisible({ timeout: 10000 });
    const count = await orderRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display order stats cards', async ({ page }) => {
    const statsCards = page.locator('.card');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    const count = await statsCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('ORD-2024');
    await page.waitForTimeout(500);
    // Table should still be visible after search
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should toggle filters panel', async ({ page }) => {
    const filtersButton = page.locator('button:has-text("Filters")');
    await expect(filtersButton).toBeVisible({ timeout: 5000 });
    await filtersButton.click();

    // Filter selects should now be visible
    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display table headers', async ({ page }) => {
    const headers = page.locator('thead th');
    await expect(headers.first()).toBeVisible({ timeout: 10000 });
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(5);
  });
});
