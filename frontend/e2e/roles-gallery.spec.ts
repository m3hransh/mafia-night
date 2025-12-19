import { test, expect } from '@playwright/test';
import { waitForPageLoad, mockApiRoute, mockRoles } from './utils/test-helpers';

/**
 * E2E Tests for Roles Gallery Page
 *
 * Tests the main roles listing page that displays all available roles
 * URL: /roles
 */

test.describe('Roles Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to roles page before each test
    await page.goto('/roles');
  });

  test('should display page title and description', async ({ page }) => {
    // Check main title
    const title = page.locator('h1:has-text("Role Cards")');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Role Cards');

    // Check subtitle
    const subtitle = page.locator('text=Select a Role to View');
    await expect(subtitle).toBeVisible();
  });

  test('should display back to home button', async ({ page }) => {
    const backButton = page.locator('a[href="/"]').first();
    await expect(backButton).toBeVisible();
    await expect(backButton).toContainText('Home');

    // Check that it has the correct href
    await expect(backButton).toHaveAttribute('href', '/');
  });

  test('should fetch and display roles from API', async ({ page }) => {
    // Wait for API call to complete
    await page.waitForResponse((response) =>
      response.url().includes('/api/roles') && response.status() === 200
    );

    // Wait for roles to be rendered
    await waitForPageLoad(page);

    // Check that role cards are displayed
    const roleCards = page.locator('a[href^="/role/"]');
    const count = await roleCards.count();

    // Should have 30 roles (as per seed data)
    expect(count).toBe(30);
  });

  test('should display role names in cards', async ({ page }) => {
    await waitForPageLoad(page);

    // Check for specific roles
    await expect(page.locator('text=Sherlock')).toBeVisible();
    await expect(page.locator('text=Mafia')).toBeVisible();
    await expect(page.locator('text=Doctor Watson')).toBeVisible();
  });

  test('should have correct grid layout', async ({ page }) => {
    await waitForPageLoad(page);

    // Check that the grid container exists
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();

    // Grid should have responsive columns (2-5 columns depending on screen size)
    // Check for grid-cols class
    await expect(grid).toHaveClass(/grid-cols-/);
  });

  test('should navigate to individual role page when card is clicked', async ({
    page,
  }) => {
    await waitForPageLoad(page);

    // Click on Sherlock card
    await page.click('a[href="/role/sherlock"]');

    // Should navigate to the role page
    await expect(page).toHaveURL('/role/sherlock');
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate with network blocked to see loading state
    await page.route('**/api/roles', async (route) => {
      await page.waitForTimeout(1000); // Delay response
      await route.continue();
    });

    await page.goto('/roles');

    // Check for loading text
    const loadingText = page.locator('text=Loading roles');
    await expect(loadingText).toBeVisible();

    // Wait for loading to finish
    await page.waitForResponse('**/api/roles');
    await expect(loadingText).not.toBeVisible();
  });

  test('should show error state when API fails', async ({ page }) => {
    // Mock API to return error
    await mockApiRoute(page, '**/api/roles', { error: 'Server error' }, 500);

    await page.goto('/roles');
    await waitForPageLoad(page);

    // Check for error message
    const errorTitle = page.locator('h1:has-text("Error")');
    await expect(errorTitle).toBeVisible();

    const errorMessage = page.locator('text=Failed to fetch roles');
    await expect(errorMessage).toBeVisible();

    // Check for retry button
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });

  test('should retry loading when retry button is clicked', async ({
    page,
  }) => {
    let requestCount = 0;

    // Intercept requests to the backend API (localhost:8080)
    await page.route('http://localhost:8080/api/roles', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      } else {
        // Subsequent requests succeed - use fallback to let it go through normally
        await route.fallback();
      }
    });

    // Navigate to the page
    await page.goto('/roles');
    
    // Wait for error UI to render
    await page.waitForTimeout(1500);

    // Check if error message and retry button appear
    const errorHeading = page.locator('h1:has-text("Error")');
    await expect(errorHeading).toBeVisible({ timeout: 5000 });
    
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
    
    // Click retry button and wait for page reload
    await retryButton.click({ force: true });
    await page.waitForURL('/roles', { waitUntil: 'load' });
    
    // Wait for roles to load
    await page.waitForTimeout(2000);
    const roleCards = page.locator('a[href^="/role/"]');
    await expect(roleCards.first()).toBeVisible({ timeout: 10000 });
    expect(await roleCards.count()).toBeGreaterThan(0);
  });

  test('should have hover effects on role cards', async ({ page }) => {
    await waitForPageLoad(page);

    // Get first role card
    const firstCard = page.locator('a[href^="/role/"]').first();

    // Hover over the card
    await firstCard.hover();

    // Card should have hover classes (transform scale, bg change, etc.)
    // This checks that Tailwind hover classes are applied
    await expect(firstCard).toHaveClass(/hover:scale-105/);
    await expect(firstCard).toHaveClass(/hover:bg-purple-600/);
  });

  test('should display gradient background', async ({ page }) => {
    await waitForPageLoad(page);

    // Check for gradient background component
    const background = page.locator('main').first();
    await expect(background).toHaveClass(/bg-gradient-to-b/);
    await expect(background).toHaveClass(/from-slate-900/);
    await expect(background).toHaveClass(/to-slate-800/);
  });

  test('should be accessible', async ({ page }) => {
    await waitForPageLoad(page);

    // Check that all links have accessible text
    const roleLinks = page.locator('a[href^="/role/"]');
    const count = await roleLinks.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = roleLinks.nth(i);
      const text = await link.textContent();
      expect(text).toBeTruthy();
      expect(text?.trim()).not.toBe('');
    }

    // Check main heading has correct level
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle empty API response gracefully', async ({ page }) => {
    // Mock empty roles array
    await mockApiRoute(page, '**/api/roles', []);

    await page.goto('/roles');
    await waitForPageLoad(page);

    // Should not show any role cards
    const roleCards = page.locator('a[href^="/role/"]');
    expect(await roleCards.count()).toBe(0);

    // Title should still be visible
    await expect(page.locator('h1:has-text("Role Cards")')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    await waitForPageLoad(page);

    // Desktop viewport (default)
    await page.setViewportSize({ width: 1920, height: 1080 });
    let grid = page.locator('.grid');
    await expect(grid).toBeVisible();

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    grid = page.locator('.grid');
    await expect(grid).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    grid = page.locator('.grid');
    await expect(grid).toBeVisible();
  });
});
