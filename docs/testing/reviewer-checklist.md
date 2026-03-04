# Reviewer Checklist — Playwright E2E Tests

Use this checklist when reviewing PRs that modify or add Playwright E2E tests.

---

## User Flow Documentation

- [ ] All major user flows are documented in `docs/testing/user-flows.md`
- [ ] Each flow includes step-by-step user journey
- [ ] Expected behavior is documented for each step
- [ ] Documentation is up to date with current application state

---

## Test Coverage

- [ ] All documented user flows have corresponding Playwright tests
- [ ] Authentication flows tested (login, logout, session persistence, invalid credentials)
- [ ] Dashboard page tested (stats, sections, time range)
- [ ] User management tested (list, search, filters, add, edit)
- [ ] Product management tested (list, search, filters, add)
- [ ] Inventory management tested (list, search, filters, stats)
- [ ] Order management tested (list, search, filters, table)
- [ ] Returns management tested (list, search, filters)
- [ ] Reviews management tested (list, search, filters, stats)
- [ ] Settings page tested (profile, appearance, notifications, about)
- [ ] Navigation tested (sidebar, header, routing, branding)
- [ ] 404 page tested (display, navigation links)

---

## Test Quality

- [ ] Tests pass locally (`npm run test:e2e`)
- [ ] Tests pass in CI
- [ ] No flaky tests (tests pass consistently across multiple runs)
- [ ] No hardcoded waits (`waitForTimeout` only used where necessary)
- [ ] Tests use resilient locators (`getByRole`, `getByText`, semantic selectors)
- [ ] Tests are independent (each test sets up its own state)
- [ ] All API calls are mocked (no real backend dependency)
- [ ] Test files follow naming convention: `<feature>.e2e.test.js`

---

## Mock Data

- [ ] Mock data covers all API endpoints used by tests
- [ ] Mock data is realistic and consistent
- [ ] API route interception patterns are correct
- [ ] No real API endpoints are called during tests

---

## Documentation

- [ ] Test execution guide is complete (`docs/testing/test-guide.md`)
- [ ] Prerequisites are listed
- [ ] Installation steps are clear
- [ ] Instructions for running locally, headless, headed, and in CI
- [ ] Report generation instructions included
- [ ] Troubleshooting section covers common issues

---

## Code Quality

- [ ] Test code is readable and maintainable
- [ ] Shared fixtures and helpers are used consistently
- [ ] No secrets or sensitive data in test files
- [ ] Test descriptions clearly state expected behavior
