/**
 * API route mocking for Tier 1 Playwright E2E tests — admin-ui.
 *
 * Intercepts all BFF HTTP calls via page.route() so that tests
 * run entirely against mock data — no backend required.
 */

import {
  mockAdminLoginResponse,
  mockAdminUser,
  mockUserList,
  mockSingleUser,
  mockAdminProductList,
  mockSingleProduct,
  mockDashboardStats,
  mockAdminOrders,
  mockSingleOrder,
  mockAdminReviews,
  mockReviewStats,
  mockInventoryList,
  mockAdminReturns,
  mockReturnStats,
} from './mock-data.js';

/**
 * Set up API route mocking for admin-ui.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object}  [options]
 * @param {boolean} [options.authenticated=false]  Pre-set admin auth state
 */
export async function setupApiMocks(page, options = {}) {
  const { authenticated = false } = options;

  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-jwt-token');
      localStorage.setItem('admin_refresh_token', 'mock-admin-refresh-token');
      localStorage.setItem(
        'admin_user',
        JSON.stringify({
          id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@xshopai.com',
          role: 'admin',
          roles: ['admin'],
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastLogin: new Date().toISOString(),
        }),
      );
    });
  }

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const authHeader = route.request().headers()['authorization'] || '';
    const hasToken = authenticated || authHeader.includes('mock-admin-jwt-token');

    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    // ── Auth ────────────────────────────────────────────────────────────
    if (path === '/api/auth/login' && method === 'POST') return json(mockAdminLoginResponse);

    if (path === '/api/auth/me' && method === 'GET') {
      return hasToken
        ? json({ user: mockAdminUser })
        : json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    if (path === '/api/auth/verify' && method === 'GET') {
      return hasToken
        ? json({ valid: true, user: mockAdminUser })
        : json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    if (path === '/api/auth/logout' && method === 'POST') return json({ success: true, message: 'Logged out' });

    if (path === '/api/auth/refresh' && method === 'POST')
      return json({ token: 'mock-refreshed-admin-jwt', refreshToken: 'mock-refreshed-admin-refresh' });

    // ── Dashboard ───────────────────────────────────────────────────────
    if (path === '/api/admin/dashboard/stats' && method === 'GET') return json(mockDashboardStats);

    // ── Users (admin) ───────────────────────────────────────────────────
    if (path === '/api/admin/users' && method === 'GET') return json(mockUserList);
    if (path === '/api/admin/users' && method === 'POST')
      return json({ success: true, data: mockSingleUser.data }, 201);

    if (/^\/api\/admin\/users\/[\w-]+\/status$/.test(path) && method === 'PATCH')
      return json({ success: true, data: { ...mockSingleUser.data, isActive: true } });

    if (/^\/api\/admin\/users\/[\w-]+\/reset-password$/.test(path) && method === 'POST')
      return json({ success: true, message: 'Password reset email sent' });

    if (/^\/api\/admin\/users\/[\w-]+$/.test(path) && method === 'GET') return json(mockSingleUser);
    if (/^\/api\/admin\/users\/[\w-]+$/.test(path) && method === 'PATCH')
      return json({ success: true, data: mockSingleUser.data });
    if (/^\/api\/admin\/users\/[\w-]+$/.test(path) && method === 'DELETE') return json({ success: true });

    // ── Products (admin) ────────────────────────────────────────────────
    if (path === '/api/admin/products' && method === 'GET') return json(mockAdminProductList);
    if (path === '/api/admin/products' && method === 'POST')
      return json({ success: true, data: mockSingleProduct.data }, 201);

    if (/^\/api\/admin\/products\/[\w-]+$/.test(path) && method === 'GET') return json(mockSingleProduct);
    if (/^\/api\/admin\/products\/[\w-]+$/.test(path) && method === 'PATCH')
      return json({ success: true, data: mockSingleProduct.data });
    if (/^\/api\/admin\/products\/[\w-]+$/.test(path) && method === 'DELETE') return json({ success: true });

    // ── Orders (admin) ──────────────────────────────────────────────────
    if (/^\/api\/admin\/orders\/[\w-]+\/status$/.test(path) && method === 'PUT')
      return json({ success: true, data: mockSingleOrder.data });
    if (/^\/api\/admin\/orders\/[\w-]+\/tracking$/.test(path) && (method === 'PUT' || method === 'GET'))
      return json({ success: true, data: mockSingleOrder.data });
    if (/^\/api\/admin\/orders\/[\w-]+\/payment$/.test(path) && method === 'GET')
      return json({ success: true, data: { status: 'Captured' } });
    if (path === '/api/admin/orders/paged' && method === 'GET') return json(mockAdminOrders);
    if (/^\/api\/admin\/orders\/[\w-]+$/.test(path) && method === 'GET') return json(mockSingleOrder);
    if (/^\/api\/admin\/orders\/[\w-]+$/.test(path) && method === 'DELETE') return json({ success: true });
    if (/^\/api\/admin\/orders/.test(path) && method === 'GET') return json(mockAdminOrders);

    // ── Reviews (admin) ─────────────────────────────────────────────────
    if (path === '/api/admin/reviews/stats' && method === 'GET') return json(mockReviewStats);
    if (/^\/api\/admin\/reviews\/[\w-]+$/.test(path) && method === 'PATCH')
      return json({ success: true, data: mockAdminReviews.data[0] });
    if (/^\/api\/admin\/reviews\/[\w-]+$/.test(path) && method === 'DELETE') return json({ success: true });
    if (/^\/api\/admin\/reviews/.test(path) && method === 'GET') return json(mockAdminReviews);

    // ── Returns (admin) ─────────────────────────────────────────────────
    if (path === '/api/admin/returns/stats' && method === 'GET') return json(mockReturnStats);
    if (/^\/api\/admin\/returns\/paged/.test(path) && method === 'GET') return json(mockAdminReturns);
    if (/^\/api\/admin\/returns/.test(path) && method === 'GET')
      return json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });

    // ── Fallback ────────────────────────────────────────────────────────
    return json({ success: true, data: {} });
  });

  // Inventory routes use /inventory (no /api prefix) — only intercept XHR/fetch, not page navigation
  await page.route('**/inventory/**', async (route) => {
    if (route.request().resourceType() === 'document') return route.continue();

    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (/\/inventory\/[\w-]+\/movements$/.test(path) && method === 'GET')
      return json({ success: true, data: [] });
    if (/\/inventory\/[\w-]+\/stock$/.test(path) && method === 'PATCH')
      return json({ success: true, data: mockInventoryList.data[0] });
    if (/\/inventory\/[\w-]+$/.test(path) && method === 'GET')
      return json({ success: true, data: mockInventoryList.data[0] });

    return json(mockInventoryList);
  });

  await page.route('**/inventory', async (route) => {
    if (route.request().resourceType() === 'document') return route.continue();

    const method = route.request().method();
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (method === 'GET') return json(mockInventoryList);
    return json({ success: true, data: {} });
  });
}

/**
 * Perform admin login via the UI form with mocked API.
 * Assumes setupApiMocks(page) has already been called.
 */
export async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="email"]', 'admin@xshopai.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.locator('button[type="submit"]').click();

  // Wait for navigation to dashboard (ProtectedRoute verifies token)
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}
