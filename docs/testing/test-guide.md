# Playwright E2E Test Execution Guide — xshopai Admin UI

This guide explains how to install, run, and debug Playwright end-to-end tests for the admin-ui application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running Tests Locally](#running-tests-locally)
4. [Running in Headless Mode](#running-in-headless-mode)
5. [Running in Headed Mode](#running-in-headed-mode)
6. [Using Playwright UI Mode](#using-playwright-ui-mode)
7. [Generating and Viewing Reports](#generating-and-viewing-reports)
8. [Running in CI](#running-in-ci)
9. [Test Structure](#test-structure)
10. [Writing New Tests](#writing-new-tests)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** >= 24.0.0
- **npm** >= 10.0.0
- Chromium browser (installed automatically by Playwright)

---

## Installation

1. **Install project dependencies:**

   ```bash
   npm install
   ```

2. **Install Playwright browsers:**

   ```bash
   npx playwright install chromium
   ```

   > This downloads the Chromium browser binary required for testing.

---

## Running Tests Locally

The test suite uses API mocking via `page.route()` — **no backend server is required**.

### Run all E2E tests:

```bash
npm run test:e2e
```

This command:
- Starts the dev server on port 3001 (via `webServer` config)
- Runs all tests in `tests/e2e/` against Chromium
- Outputs results to the terminal

### Run a specific test file:

```bash
npx playwright test tests/e2e/admin-login.e2e.test.js
```

### Run tests matching a pattern:

```bash
npx playwright test -g "should login"
```

---

## Running in Headless Mode

By default, tests run in **headless mode** (no visible browser window). This is the standard mode for both local development and CI:

```bash
npm run test:e2e
```

---

## Running in Headed Mode

To see the browser while tests run (useful for debugging):

```bash
npm run test:e2e:headed
```

Or:

```bash
npx playwright test tests/e2e --headed
```

---

## Using Playwright UI Mode

Playwright UI mode provides an interactive test runner with time-travel debugging:

```bash
npm run test:e2e:ui
```

Or:

```bash
npx playwright test tests/e2e --ui
```

Features:
- Watch mode for re-running tests on file changes
- Step-by-step execution with DOM snapshots
- Network request inspection
- Trace viewer integration

---

## Generating and Viewing Reports

### HTML Report (default for local runs):

After running tests, generate and view the HTML report:

```bash
npx playwright show-report
```

This opens an interactive HTML report in your browser showing:
- Test results per file and test case
- Screenshots for failed tests
- Trace files for debugging

### CI Report:

In CI environments, the reporter is set to `github` (outputs annotations in GitHub Actions).

### Custom reporter:

```bash
npx playwright test tests/e2e --reporter=list
npx playwright test tests/e2e --reporter=json
npx playwright test tests/e2e --reporter=html
```

---

## Running in CI

The `playwright.config.js` is already configured for CI:

```js
{
  forbidOnly:             {                 echo ___BEGIN___COMMAND_OUTPUT_MARKER___;                 PS1=;PS2=;unset HISTFILE;                 EC=0;                 echo ___BEGIN___COMMAND_DONE_MARKER___0;             }process.env.CI,     // Fail if test.only is left in code
  retries: process.env.CI ? 2 : 0,  // Retry failed tests twice in CI
  workers: process.env.CI ? 1 : 3,  // Single worker in CI for stability
  reporter: process.env.CI ? 'github' : 'html',
}
```

### GitHub Actions example:

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Test Structure

```
tests/
└── e2e/
    ├── fixtures/
    │   ├── api-mocks.js        # API route interception and mock setup
    │   └── mock-data.js        # Mock response data for all API endpoints
    ├── admin-login.e2e.test.js # Authentication tests (login, logout, session)
    ├── dashboard.e2e.test.js   # Dashboard page tests
    ├── inventory.e2e.test.js   # Inventory management tests
    ├── navigation.e2e.test.js  # Sidebar, header, routing tests
    ├── not-found.e2e.test.js   # 404 page tests
    ├── orders.e2e.test.js      # Order management tests
    ├── product-management.e2e.test.js # Product management tests
    ├── returns.e2e.test.js     # Returns dashboard tests
    ├── reviews.e2e.test.js     # Reviews management tests
    ├── settings.e2e.test.js    # Settings page tests
    └── user-management.e2e.test.js    # User management tests
```

### Test Naming Convention

- Files: `<feature>.e2e.test.js`
- Describe blocks: `<Feature> E2E`
- Test names: `should <expected behavior>`

### API Mocking Pattern

All tests use `setupApiMocks(page)` which intercepts HTTP requests via Playwright's `page.route()`:

```js
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);  // Set up API mocks
  await loginAsAdmin(page);   // Login via UI with mocked API
});
```

---

## Writing New Tests

1. **Add mock data** in `tests/e2e/fixtures/mock-data.js` if needed
2. **Add API route** in `tests/e2e/fixtures/api-mocks.js` for new endpoints
3. **Create test file** following the naming convention
4. **Use the mock helpers:**

```js
import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsAdmin } from './fixtures/api-mocks.js';

test.describe('My Feature E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginAsAdmin(page);
    await page.goto('/my-page');
    await page.waitForLoadState('networkidle');
  });

  test('should display expected content', async ({ page }) => {
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
```

### Best Practices

- **Avoid hardcoded waits** — use `waitForLoadState`, `waitForURL`, or `expect().toBeVisible()` with timeouts
- **Use resilient locators** — prefer `getByRole`, `getByText`, or `locator('main h1')` over fragile CSS selectors
- **Keep tests independent** — each test should set up its own state via `beforeEach`
- **Mock all API calls** — tests should never depend on a running backend

---

## Troubleshooting

### Tests fail with "port already in use"

The dev server from a previous run may still be active. Find and stop the process using port 3001.

### Tests fail with timeout errors

- Increase timeout in test: `await expect(locator).toBeVisible({ timeout: 15000 })`
- Check if API mocks are correctly matching the request URL
- Use `--headed` mode to visually inspect the page

### API mock not intercepting requests

- Verify the route pattern matches the actual request URL
- For non-`/api/` routes (like `/inventory`), add `resourceType` checks to avoid intercepting page navigation:
  ```js
  if (route.request().resourceType() === 'document') return route.continue();
  ```

### Debugging a failing test

1. Run with `--headed` to see the browser
2. Add `await page.pause()` in the test to open Playwright Inspector
3. Check error context files in `test-results/` directory
4. Use `--trace on` for full trace recording:
   ```bash
   npx playwright test --trace on
   ```
