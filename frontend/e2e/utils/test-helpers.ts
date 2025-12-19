import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helper Utilities
 */

/**
 * Wait for the page to finish loading (no loading indicators)
 * Using 'load' instead of 'networkidle' as Next.js apps maintain persistent connections
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if an element is visible on the page
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    return await page.locator(selector).isVisible();
  } catch {
    return false;
  }
}

/**
 * Wait for API response and return data
 */
export async function waitForApiResponse<T = any>(
  page: Page,
  urlPattern: string | RegExp
): Promise<T> {
  const response = await page.waitForResponse(urlPattern);
  return response.json();
}

/**
 * Mock API endpoint with custom response
 */
export async function mockApiRoute(
  page: Page,
  urlPattern: string | RegExp,
  response: any,
  status = 200
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Check for console errors
 */
export function setupConsoleErrorTracking(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  return {
    getErrors: () => consoleErrors,
    expectNoErrors: () => {
      expect(consoleErrors, 'Console should have no errors').toHaveLength(0);
    },
  };
}

/**
 * Take a screenshot with a custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  fullPage = false
) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage,
  });
}

/**
 * Common role data for tests
 */
export const mockRoles = [
  {
    id: '1',
    name: 'Sherlock',
    slug: 'sherlock',
    video: '/roles/sherlock.webm',
    description: 'The brilliant detective who can investigate one player each night.',
    team: 'independent',
  },
  {
    id: '2',
    name: 'Mafia',
    slug: 'mafia',
    video: '/roles/Mafia.webm',
    description: 'A member of the criminal organization.',
    team: 'mafia',
  },
  {
    id: '3',
    name: 'Doctor Watson',
    slug: 'doctor-watson',
    video: '/roles/Doctor Watson.webm',
    description: 'The trusted medical expert who can protect one player each night.',
    team: 'village',
  },
];
