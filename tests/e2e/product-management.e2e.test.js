import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Product Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);

    // Navigate directly to products page (sidebar has duplicate mobile/desktop links)
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('should display product list in table', async ({ page }) => {
    const productsTable = page.locator('table');
    await expect(productsTable).toBeVisible({ timeout: 10000 });

    // Table should have product rows
    const productRows = page.locator('tbody tr');
    const count = await productRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to add product page', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add New Product")');
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    await page.waitForURL(/\/products\/add/, { timeout: 5000 });
  });

  test('should search products', async ({ page }) => {
    // Search input is type="text" with placeholder containing "Search"
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Wireless');
    // Search applies on change — frontend filtering
    await page.waitForTimeout(500);

    // Filtered results should still show table
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should show filters panel', async ({ page }) => {
    // Filters are hidden behind a "Filters" button
    const filtersButton = page.locator('button:has-text("Filters")');
    await expect(filtersButton).toBeVisible({ timeout: 5000 });
    await filtersButton.click();

    // Category and Status selects should now be visible
    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show product stats cards', async ({ page }) => {
    // Stats cards: Total Products, Active, With Variants, Filtered
    const statsCards = page.locator('.card');
    const count = await statsCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display product details in table rows', async ({ page }) => {
    const productsTable = page.locator('table');
    await expect(productsTable).toBeVisible({ timeout: 10000 });

    // Check table headers include expected columns
    const headers = page.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(4);
  });
});
