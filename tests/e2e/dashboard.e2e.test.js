import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
  });

  test('should display dashboard page after login', async ({ page }) => {
    expect(page.url()).toContain('/dashboard');
  });

  test('should display stats cards', async ({ page }) => {
    const statsCards = page.locator('.card');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    const count = await statsCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display dashboard heading', async ({ page }) => {
    const heading = page.locator('main h1:has-text("Dashboard")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display key business metrics section', async ({ page }) => {
    const metricsHeading = page.getByRole('heading', { name: /Key Business Metrics/i });
    await expect(metricsHeading).toBeVisible({ timeout: 10000 });
  });

  test('should display store overview section', async ({ page }) => {
    const overviewHeading = page.getByRole('heading', { name: /Store Overview/i });
    await expect(overviewHeading).toBeVisible({ timeout: 10000 });
  });

  test('should display attention required section', async ({ page }) => {
    const attentionHeading = page.getByRole('heading', { name: /Attention Required/i });
    await expect(attentionHeading).toBeVisible({ timeout: 10000 });
  });

  test('should display quick actions section', async ({ page }) => {
    const quickActionsHeading = page.getByRole('heading', { name: /Quick Actions/i });
    await expect(quickActionsHeading).toBeVisible({ timeout: 10000 });
  });

  test('should show time range selector', async ({ page }) => {
    const timeRangeButton = page.locator('button:has-text("Last 30 Days")');
    await expect(timeRangeButton).toBeVisible({ timeout: 10000 });
  });

  test('should display recent activity section', async ({ page }) => {
    const recentActivityHeading = page.getByRole('heading', { name: /Recent Activity/i });
    await expect(recentActivityHeading).toBeVisible({ timeout: 10000 });
  });
});
