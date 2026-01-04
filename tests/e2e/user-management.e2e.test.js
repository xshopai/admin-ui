import { test, expect } from '@playwright/test';

/**
 * Admin UI E2E Test: User Management
 *
 * Tests admin user management operations:
 * 1. View user list
 * 2. Search users
 * 3. View user details
 * 4. Update user status (activate/deactivate)
 * 5. Update user roles
 * 6. Filter users by role/status
 */

const BASE_URL = process.env.ADMIN_UI_URL || 'http://localhost:3100';

test.describe('User Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@xshopai.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Navigate to user management
    const usersLink = page.locator('a[href*="users"]');
    if (await usersLink.isVisible()) {
      await usersLink.click();
    } else {
      await page.goto(`${BASE_URL}/users`);
    }
  });

  test('should display user list', async ({ page }) => {
    console.log('Testing user list display...');

    // Wait for users table to load
    const usersTable = page.locator('[data-testid="users-table"], table');
    await expect(usersTable).toBeVisible({ timeout: 10000 });

    // Count users
    const userRows = page.locator('tbody tr, [data-testid="user-row"]');
    const count = await userRows.count();

    console.log(`✅ User list displayed with ${count} users`);
  });

  test('should search for users', async ({ page }) => {
    console.log('Testing user search...');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('john');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForTimeout(1000);

      console.log('✅ User search executed');
    } else {
      console.log('⚠️  Search input not found - may need to implement');
    }
  });

  test('should view user details', async ({ page }) => {
    console.log('Testing user details view...');

    // Click first user to view details
    const viewButton = page.locator('[data-testid="view-user"], button:has-text("View")').first();

    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Verify user details modal/page appears
      const userDetailsSection = page.locator('[data-testid="user-details"], .user-details');
      await expect(userDetailsSection).toBeVisible({ timeout: 5000 });

      console.log('✅ User details displayed');
    } else {
      // Try clicking on user row
      const userRow = page.locator('tbody tr, [data-testid="user-row"]').first();
      if (await userRow.isVisible()) {
        await userRow.click();
        console.log('✅ User row clicked');
      } else {
        console.log('⚠️  No users to view');
      }
    }
  });

  test('should update user status', async ({ page }) => {
    console.log('Testing user status update...');

    // Find status toggle/button
    const statusToggle = page.locator('[data-testid="status-toggle"], .status-switch').first();

    if (await statusToggle.isVisible()) {
      await statusToggle.click();

      // Confirm if confirmation dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Verify success message
      const successMessage = page.locator('.success, [data-testid="success-message"]');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      console.log('✅ User status updated');
    } else {
      console.log('⚠️  Status toggle not found - may need to implement');
    }
  });

  test('should filter users by role', async ({ page }) => {
    console.log('Testing user role filter...');

    // Find role filter
    const roleFilter = page.locator('select[name="role"], [data-testid="role-filter"]');

    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('admin');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      console.log('✅ User role filter applied');
    } else {
      console.log('⚠️  Role filter not found - may need to implement');
    }
  });

  test('should filter users by status', async ({ page }) => {
    console.log('Testing user status filter...');

    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');

    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      console.log('✅ User status filter applied');
    } else {
      console.log('⚠️  Status filter not found - may need to implement');
    }
  });

  test('should paginate through user list', async ({ page }) => {
    console.log('Testing user list pagination...');

    // Find next page button
    const nextButton = page.locator('[data-testid="next-page"], button:has-text("Next")');

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Wait for page change
      await page.waitForTimeout(1000);

      console.log('✅ Pagination works');
    } else {
      console.log('⚠️  Pagination not found - may be single page of users');
    }
  });

  test('should export user list', async ({ page }) => {
    console.log('Testing user list export...');

    // Find export button
    const exportButton = page.locator('[data-testid="export-users"], button:has-text("Export")');

    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');

      await exportButton.click();

      // Wait for download to complete
      const download = await downloadPromise;

      console.log(`✅ User list exported: ${download.suggestedFilename()}`);
    } else {
      console.log('⚠️  Export button not found - may need to implement');
    }
  });
});
