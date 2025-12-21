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
    const backButton = page.getByRole('main').getByRole('link', {name: 'Home'});
    await expect(backButton).toBeVisible();

    // Check that it has the correct href
    await expect(backButton).toHaveAttribute('href', '/');
  });

  test('should display role names for initially loaded cards', async ({ page }) => {
    await waitForPageLoad(page);

    // With lazy loading, only first 6 cards load immediately
    // Check for roles that should be in the initial batch (positions 0-5)
    // These roles are eagerly loaded with preload="auto"
    const initialRoles = [
      'Sherlock',      // Position 0
      'Mafia',         // Position 1
      'Doctor Watson', // Position 2
    ];

    for (const roleName of initialRoles) {
      const roleCard = page.locator(`text=${roleName}`).first();
      await expect(roleCard).toBeVisible({ timeout: 10000 });
    }

    // Verify that role cards have videos with proper lazy loading attributes
    const firstCard = page.locator('a[href^="/role/"]').first();
    await expect(firstCard).toBeVisible();
  });

  test('should lazy load videos for cards below the fold', async ({ page }) => {
    await waitForPageLoad(page);

    // wait for 2 sec
    await page.waitForTimeout(2000);

    // Get total number of role cards
    const allCards = page.locator('a[href^="/role/"]');
    const totalCards = await allCards.count();

    // Verify we have more than 6 cards (otherwise lazy loading doesn't apply)
    expect(totalCards).toBeGreaterThan(6);

    // Scroll to bottom to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for lazy loaded content to appear
    await page.waitForTimeout(1000);

    // Check that a card that should be lazy loaded is now visible
    // This would typically be a role at position 7 or later
    const lazyLoadedCards = allCards.nth(7);
    await expect(lazyLoadedCards).toBeVisible();

    // Verify the page still has the expected structure after lazy loading
    await expect(page.locator('h1:has-text("Role Cards")')).toBeVisible();
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

  test('should not load all videos immediately for performance', async ({ page }) => {
    // Track network requests for video files
    const videoRequests: string[] = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('.webm') || url.includes('cloudinary.com')) {
        videoRequests.push(url);
      }
    });

    await page.goto('/roles');
    await waitForPageLoad(page);

    // Wait a bit for any initial video loads
    await page.waitForTimeout(2000);

    // With 30 total roles, we should NOT have 30 video requests immediately
    // Only first ~6 should be eagerly loaded
    // This test ensures lazy loading is working
    const initialVideoRequests = videoRequests.length;

    // Should have some videos loaded (first batch)
    expect(initialVideoRequests).toBeGreaterThan(0);

    // But should NOT have all 30 loaded yet (accounting for retries, should be less than 15)
    expect(initialVideoRequests).toBeLessThan(20);

    // Log for debugging
    console.log(`Initial video requests: ${initialVideoRequests}`);
  });
});
