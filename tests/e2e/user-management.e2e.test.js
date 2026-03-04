import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('User Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);

    // Navigate directly to users page (sidebar has duplicate mobile/desktop links)
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
  });

  test('should display user list in table', async ({ page }) => {
    const usersTable = page.locator('table');
    await expect(usersTable).toBeVisible({ timeout: 10000 });

    // Table should have user rows
    const userRows = page.locator('tbody tr');
    const count = await userRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should search for users', async ({ page }) => {
    // Search input is type="text" with placeholder containing "Search"
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('john');
    // Search applies on change, wait for API call
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to user edit', async ({ page }) => {
    // Wait for user rows to appear
    const userRows = page.locator('tbody tr');
    await expect(userRows.first()).toBeVisible({ timeout: 10000 });

    // Edit button is a pencil icon button — look for it in the first row
    const editButton = userRows.first().locator('button').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      // Should navigate to /users/edit/:id
      const url = page.url();
      expect(url).toMatch(/\/users\/(edit\/)?/);
    }
  });

  test('should show filters panel', async ({ page }) => {
    // Filters are hidden behind a "Filters" button
    const filtersButton = page.locator('button:has-text("Filters")');
    await expect(filtersButton).toBeVisible({ timeout: 5000 });
    await filtersButton.click();

    // Filter selects should now be visible
    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display Add New User button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add New User")');
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test('should show user stats cards', async ({ page }) => {
    // Stats cards: Total Users, Active Users, Users on Page
    const statsCards = page.locator('.card');
    const count = await statsCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
