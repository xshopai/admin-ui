import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks.js';

test.describe('404 Not Found Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should display 404 page for unknown routes', async ({ page }) => {
    await page.goto('/some-nonexistent-page');
    await page.waitForLoadState('networkidle');

    const notFoundText = page.getByText('Page not found');
    await expect(notFoundText).toBeVisible({ timeout: 10000 });
  });

  test('should display 404 indicator', async ({ page }) => {
    await page.goto('/unknown-route');
    await page.waitForLoadState('networkidle');

    const indicator = page.getByText('404');
    await expect(indicator).toBeVisible({ timeout: 10000 });
  });

  test('should have Go to Dashboard link', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.waitForLoadState('networkidle');

    const dashboardLink = page.getByText('Go to Dashboard');
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard from 404 page', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.waitForLoadState('networkidle');

    const dashboardLink = page.getByText('Go to Dashboard');
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });
    await dashboardLink.click();

    // Should redirect to login (since not authenticated) or dashboard
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
  });

  test('should have Go Back button', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.waitForLoadState('networkidle');

    const goBackButton = page.getByText('Go Back');
    await expect(goBackButton).toBeVisible({ timeout: 10000 });
  });
});
