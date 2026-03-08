import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Reviews Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
    await page.goto('/reviews');
    await page.waitForLoadState('networkidle');
  });

  test('should display reviews page with table', async ({ page }) => {
    const reviewsTable = page.locator('table');
    await expect(reviewsTable).toBeVisible({ timeout: 10000 });
  });

  test('should display review rows with data', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Amazing');
    await page.waitForTimeout(500);
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should toggle filters panel', async ({ page }) => {
    const filtersButton = page.locator('button:has-text("Filters")');
    await expect(filtersButton).toBeVisible({ timeout: 5000 });
    await filtersButton.click();

    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display reviews stats cards', async ({ page }) => {
    const statsCards = page.locator('.card');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    const count = await statsCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display table headers', async ({ page }) => {
    const headers = page.locator('thead th');
    await expect(headers.first()).toBeVisible({ timeout: 10000 });
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(4);
  });
});
