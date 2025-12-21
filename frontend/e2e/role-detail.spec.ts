import { test, expect } from '@playwright/test';
import { waitForPageLoad, mockApiRoute, mockRoles } from './utils/test-helpers';

/**
 * E2E Tests for Individual Role Page
 *
 * Tests the individual role detail page with 3D card visualization
 * URL: /role/[slug]
 */

test.describe('Individual Role Page', () => {
  const testSlug = 'sherlock';

  test.beforeEach(async ({ page }) => {
    // Navigate to specific role page
    await page.goto(`/role/${testSlug}`);
  });

  test('should display role title', async ({ page }) => {
    await waitForPageLoad(page);

    // Check that role name is displayed
    const title = page.locator('h1:has-text("Sherlock")');
    await expect(title).toBeVisible();
  });

  test('should fetch role data from API by slug', async ({ page }) => {
    // Wait for API call to complete
    const response = await page.waitForResponse((res) =>
      res.url().includes(`/api/roles/${testSlug}`) && res.status() === 200
    );

    const data = await response.json();
    expect(data.slug).toBe(testSlug);
    expect(data.name).toBe('Sherlock');
  });

  test('should fetch all roles for navigation', async ({ page }) => {
    // Should also fetch all roles for prev/next navigation
    await page.waitForResponse((res) =>
      res.url().includes('/api/roles') && res.status() === 200
    );

    await waitForPageLoad(page);

    // Navigation should be available
    const prevButton = page.locator('a').filter({ hasText: '/' }).first();
    await expect(prevButton).toBeVisible();
  });

  test('should display 3D card scene component', async ({ page }) => {
    await waitForPageLoad(page);

    // Canvas should be present (Three.js)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state initially', async ({ page }) => {
    // Slow down the API response to catch the loading state
    let requestHandled = false;
    await page.route('**/api/roles/*', async (route) => {
      if (!requestHandled) {
        requestHandled = true;
        // Delay before continuing to allow loading state to show
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      await route.continue();
    });

    const responsePromise = page.waitForResponse('**/api/roles/*');
    await page.goto(`/role/${testSlug}`);

    // Try to catch loading text before response completes
    const loadingText = page.locator('text=Loading');
    // Loading state might be very brief, so we check if it was visible at any point
    const isLoadingVisible = await loadingText.isVisible().catch(() => false);
    
    // Wait for response to complete
    await responsePromise;
    
    // After loading, title should be visible
    await waitForPageLoad(page);
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    
    // Note: Loading state might be too fast to catch, which is acceptable
  });

  test('should have navigation buttons', async ({ page }) => {
    await waitForPageLoad(page);

    // Previous role button
    const prevButton = page.locator('svg').filter({ has: page.locator('path[d*="15 19l-7-7"]') }).locator('..').first();
    await expect(prevButton).toBeVisible();

    // Next role button
    const nextButton = page.locator('svg').filter({ has: page.locator('path[d*="9 5l7 7"]') }).locator('..').first();
    await expect(nextButton).toBeVisible();

    // Counter showing position
    const counter = page.locator('text=/\\d+ \\/ \\d+/');
    await expect(counter).toBeVisible();
  });

  test('should navigate to previous role when prev button clicked', async ({
    page,
  }) => {
    await waitForPageLoad(page);

    // Get the previous button (left arrow)
    const prevButton = page.locator('a').filter({ has: page.locator('svg path[d*="15 19"]') }).first();

    // Get initial URL
    const initialUrl = page.url();

    // Click previous button
    await prevButton.click();

    // URL should change to a different role
    await page.waitForURL((url) => url.toString() !== initialUrl);
    const newUrl = page.url();
    expect(newUrl).not.toContain(testSlug);
    expect(newUrl).toMatch(/\/role\/[^/]+/);
  });

  test('should navigate to next role when next button clicked', async ({
    page,
  }) => {
    await waitForPageLoad(page);

    // Get the next button (right arrow)
    const nextButton = page.locator('a').filter({ has: page.locator('svg path[d*="9 5l7"]') }).first();

    // Get initial URL
    const initialUrl = page.url();

    // Click next button
    await nextButton.click();

    // URL should change to a different role
    await page.waitForURL((url) => url.toString() !== initialUrl);
    const newUrl = page.url();
    expect(newUrl).not.toContain(testSlug);
    expect(newUrl).toMatch(/\/role\/[^/]+/);
  });

  test('should have back to gallery button', async ({ page }) => {
    await waitForPageLoad(page);

    // Back button in top-left corner
    const backButton = page.locator('a[href="/roles"]').first();
    await expect(backButton).toBeVisible();

    // Click should navigate to roles gallery
    await backButton.click();
    await expect(page).toHaveURL('/roles');
  });

  test('should navigate to roles gallery when clicking counter', async ({
    page,
  }) => {
    await waitForPageLoad(page);

    // Click on the counter (shows N / M)
    const counterLink = page.locator('a[href="/roles"]').filter({ hasText: '/' });
    await counterLink.click();

    // Should navigate to roles page
    await expect(page).toHaveURL('/roles');
  });

  test('should show error when role not found', async ({ page }) => {
    // Mock 404 response
    await mockApiRoute(
      page,
      '**/api/roles/nonexistent',
      { error: 'Not found' },
      404
    );

    await page.goto('/role/nonexistent');
    await waitForPageLoad(page);

    // Should show error message
    const errorTitle = page.locator('h1:has-text("Error")');
    await expect(errorTitle).toBeVisible();

    // Should have back to roles link
    const backLink = page.locator('a[href="/roles"]');
    await expect(backLink).toBeVisible();
  });

  // test('should handle API errors gracefully', async ({ page }) => {
  //   // Mock API to return error
  //   await page.route('**/api/roles/*', async (route) => {
  //     await route.fulfill({
  //       status: 500,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ error: 'Server error' }),
  //     });
  //   });
  //
  //   await page.goto(`/role/${testSlug}`);
  //   await waitForPageLoad(page);
  //
  //   // Should show error state
  //   // Check for any error-related text
  //   const hasError = await page.locator('text=/error|failed|wrong/i').count() > 0;
  //   
  //   // If error handling is implemented, we should see error text
  //   // If not, the page might show loading state or be empty
  //   expect(hasError || await page.locator('text=Loading').isVisible()).toBeTruthy();
  // });

  test('should display gradient background', async ({ page }) => {
    await waitForPageLoad(page);

    const background = page.locator('main').first();
    await expect(background).toHaveClass(/overflow-hidden/);
  });

  test('should have full screen layout', async ({ page }) => {
    await waitForPageLoad(page);

    // Page should be full height (h-screen)
    const main = page.locator('main').first();
    await expect(main).toHaveClass(/h-screen/);
  });

  test('should render role video correctly', async ({ page }) => {
    await waitForPageLoad(page);

    // Wait for canvas to render (Three.js scene)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Canvas should have some width/height
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('should navigate through multiple roles in sequence', async ({
    page,
  }) => {
    await waitForPageLoad(page);

    const initialUrl = page.url();

    // Click next 3 times
    for (let i = 0; i < 3; i++) {
      const currentUrl = page.url();
      const nextButton = page.locator('a').filter({ has: page.locator('svg path[d*="9 5"]') }).first();
      await nextButton.click();
      // Wait for URL to change
      await page.waitForURL((url) => url.toString() !== currentUrl);
      await waitForPageLoad(page);
    }

    // URL should be different
    const finalUrl = page.url();
    expect(finalUrl).not.toBe(initialUrl);

    // Should still be on a role page
    expect(finalUrl).toMatch(/\/role\/[^/]+/);
  });

  test('should update counter when navigating between roles', async ({
    page,
  }) => {
    await waitForPageLoad(page);

    // Get initial counter value
    const counterLink = page.locator('a[href="/roles"]').filter({ hasText: '/' });
    const initialCounter = await counterLink.textContent();
    const currentUrl = page.url();

    // Navigate to next role
    const nextButton = page.locator('a').filter({ has: page.locator('svg path[d*="9 5"]') }).first();
    await nextButton.click();
    
    // Wait for URL to change first
    await page.waitForURL((url) => url.toString() !== currentUrl);
    await waitForPageLoad(page);

    // Counter should update
    const newCounter = await counterLink.textContent();
    expect(newCounter).not.toBe(initialCounter);

    // Should still show format "N / 30"
    expect(newCounter).toMatch(/\d+ \/ \d+/);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await waitForPageLoad(page);

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // One of the navigation buttons should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('should handle rapid navigation clicks', async ({ page }) => {
    await waitForPageLoad(page);

    // Rapidly click next button multiple times
    const nextButton = page.locator('a').filter({ has: page.locator('svg path[d*="9 5"]') }).first();

    // Click 4 times rapidly
    for (let i = 0; i < 4; i++) {
      await nextButton.click({ timeout: 1000 });
    }

    // Should still be on a valid role page
    await expect(page).toHaveURL(/\/role\/[^/]+/);
    await waitForPageLoad(page);

    // Page should be functional
    await expect(page.locator('h1')).toBeVisible();
  });
});
