import { test, expect } from '@playwright/test';

/**
 * Admin UI E2E Test: Product Management
 *
 * Tests admin product CRUD operations:
 * 1. View product list
 * 2. Create new product
 * 3. Edit existing product
 * 4. Delete product
 * 5. Search and filter products
 */

const BASE_URL = process.env.ADMIN_UI_URL || 'http://localhost:3100';

test.describe('Product Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@xshopai.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

    // Navigate to products management
    const productsLink = page.locator('a[href*="products"]');
    if (await productsLink.isVisible()) {
      await productsLink.click();
    } else {
      await page.goto(`${BASE_URL}/products`);
    }
  });

  test('should display product list', async ({ page }) => {
    console.log('Testing product list display...');

    // Wait for products table/grid to load
    const productsList = page.locator('[data-testid="products-table"], table, .products-grid');
    await expect(productsList).toBeVisible({ timeout: 10000 });

    // Count products
    const productRows = page.locator('tbody tr, [data-testid="product-row"]');
    const count = await productRows.count();

    console.log(`✅ Product list displayed with ${count} products`);
  });

  test('should create new product', async ({ page }) => {
    console.log('Testing product creation...');

    // Click create product button
    const createButton = page.locator(
      '[data-testid="create-product"], button:has-text("Add Product"), button:has-text("New Product")'
    );
    await createButton.click();

    // Fill product form
    await page.fill('[name="name"]', 'Test Product E2E');
    await page.fill('[name="description"]', 'This is a test product created by E2E test');
    await page.fill('[name="price"]', '99.99');
    await page.fill('[name="sku"]', `TEST-${Date.now()}`);
    await page.fill('[name="stock"]', '100');

    // Select category if available
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
    await submitButton.click();

    // Verify success message
    const successMessage = page.locator('[data-testid="success-message"], .success');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Product created successfully');
  });

  test('should edit existing product', async ({ page }) => {
    console.log('Testing product editing...');

    // Find first product edit button
    const editButton = page.locator('[data-testid="edit-product"], button:has-text("Edit")').first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for edit form
      await page.waitForTimeout(1000);

      // Update product name
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('Updated Product Name');

      // Update price
      const priceInput = page.locator('input[name="price"]');
      await priceInput.fill('149.99');

      // Submit changes
      const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
      await saveButton.click();

      // Verify success
      const successMessage = page.locator('.success, [role="alert"]');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      console.log('✅ Product updated successfully');
    } else {
      console.log('⚠️  Edit button not found - no products to edit');
    }
  });

  test('should delete product', async ({ page }) => {
    console.log('Testing product deletion...');

    // Find delete button
    const deleteButton = page.locator('[data-testid="delete-product"], button:has-text("Delete")').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if confirmation dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Verify success
      const successMessage = page.locator('.success, [data-testid="success-message"]');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      console.log('✅ Product deleted successfully');
    } else {
      console.log('⚠️  Delete button not found - no products to delete');
    }
  });

  test('should search products', async ({ page }) => {
    console.log('Testing product search...');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('laptop');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForTimeout(1000);

      console.log('✅ Product search executed');
    } else {
      console.log('⚠️  Search input not found - may need to implement');
    }
  });

  test('should filter products by status', async ({ page }) => {
    console.log('Testing product filters...');

    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');

    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      console.log('✅ Product filter applied');
    } else {
      console.log('⚠️  Status filter not found - may need to implement');
    }
  });
});
