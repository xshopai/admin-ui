import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Inventory Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should display inventory page with table', async ({ page }) => {
    const inventoryTable = page.locator('table');
    await expect(inventoryTable).toBeVisible({ timeout: 10000 });
  });

  test('should display inventory items in rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Wireless');
    await page.waitForTimeout(500);
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display inventory stats', async ({ page }) => {
    // Stats are in div containers showing Total Items, Low Stock, Out of Stock
    const totalItemsText = page.getByText('Total Items');
    await expect(totalItemsText).toBeVisible({ timeout: 10000 });
  });

  test('should have status filter dropdown', async ({ page }) => {
    const statusSelect = page.locator('select');
    await expect(statusSelect.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display table headers', async ({ page }) => {
    const headers = page.locator('thead th');
    await expect(headers.first()).toBeVisible({ timeout: 10000 });
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(4);
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible({ timeout: 5000 });
  });

  test('should have low stock only toggle', async ({ page }) => {
    const lowStockButton = page.locator('button:has-text("Low Stock Only")');
    await expect(lowStockButton).toBeVisible({ timeout: 5000 });
  });
});
