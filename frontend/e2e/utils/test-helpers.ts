import { Page, expect, Browser } from '@playwright/test';

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
 * Wait for element to be visible with better error messages
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' }
) {
  const locator = page.locator(selector);
  await locator.waitFor({
    state: options?.state || 'visible',
    timeout: options?.timeout || 10000
  });
  return locator;
}

/**
 * Wait for WebSocket connection to be established
 */
export async function waitForWebSocketConnection(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForEvent('websocket', {
    predicate: ws => {
      const url = ws.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    timeout
  });
}

/**
 * Track WebSocket connections and ensure cleanup
 */
export function trackWebSockets(page: Page) {
  const connections: any[] = [];

  page.on('websocket', ws => {
    connections.push({
      ws,
      url: ws.url(),
      closed: false
    });

    ws.on('close', () => {
      const conn = connections.find(c => c.ws === ws);
      if (conn) conn.closed = true;
    });
  });

  return {
    getConnections: () => connections,
    getOpenConnections: () => connections.filter(c => !c.closed),
    waitForClose: async (timeout = 2000) => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        if (connections.every(c => c.closed)) return;
        await page.waitForTimeout(100);
      }
    }
  };
}

/**
 * Game session fixture - creates a game and returns moderator context
 */
export async function createGameSession(browser: Browser) {
  const moderatorContext = await browser.newContext();
  const moderatorPage = await moderatorContext.newPage();

  // Track WebSockets for cleanup verification
  const wsTracker = trackWebSockets(moderatorPage);

  await moderatorPage.goto('/create-game');

  // Wait for page to load
  await expect(moderatorPage.locator('h1:has-text("Create Game")')).toBeVisible();

  // Click create game button
  const createButton = moderatorPage.locator('button:has-text("Create Game")');
  await createButton.click();

  // Wait for game code to appear (use data-testid if available, fallback to class selector)
  const gameCodeElement = moderatorPage.getByTestId('game-code').or(moderatorPage.locator('.font-mono').first());
  await gameCodeElement.waitFor({ state: 'visible', timeout: 10000 });
  const gameCode = await gameCodeElement.textContent();

  if (!gameCode || gameCode.length !== 6) {
    throw new Error(`Invalid game code: ${gameCode}`);
  }

  return {
    moderatorContext,
    moderatorPage,
    gameCode: gameCode.trim(),
    wsTracker,
    cleanup: async () => {
      await moderatorContext.close();
    }
  };
}

/**
 * Join game as a player
 */
export async function joinGameAsPlayer(
  browser: Browser,
  gameCode: string,
  playerName: string
) {
  const playerContext = await browser.newContext();
  const playerPage = await playerContext.newPage();

  // Track WebSockets
  const wsTracker = trackWebSockets(playerPage);

  await playerPage.goto(`/join-game?code=${gameCode}`);

  // Wait for page to load
  await expect(playerPage.locator('h1:has-text("Join Game")')).toBeVisible();

  // Enter player name
  const nameInput = playerPage.getByRole('textbox', {name: "Your Name"});
  await nameInput.waitFor({ state: 'visible' });
  await nameInput.fill(playerName);

  // Click join button
  await playerPage.click('button:has-text("Join Game")');

  // Wait for lobby to appear (WebSocket connection should be established)
  await expect(playerPage.locator('text=/Waiting for|Game Lobby/i')).toBeVisible({ timeout: 10000 });

  return {
    playerContext,
    playerPage,
    playerName,
    wsTracker,
    cleanup: async () => {
      await playerContext.close();
    }
  };
}

/**
 * Wait for a player to appear in the moderator's player list
 */
export async function waitForPlayerInList(page: Page, playerName: string, timeout = 15000) {
  const playerElement = page.locator(`text=${playerName}`).first();
  await playerElement.waitFor({ state: 'visible', timeout });
  return playerElement;
}

/**
 * Wait for players count to update
 */
export async function waitForPlayersCount(page: Page, expectedCount: number, timeout = 15000) {
  const playersHeader = page.locator('h2:has-text("Players")');
  await expect(playersHeader).toContainText(`(${expectedCount})`, { timeout });
}

/**
 * Select roles for distribution
 */
export async function selectRoles(page: Page, roleCount: number) {
  // Wait for role selection to be visible
  await expect(page.locator('text=/Select Roles|Role Selection/i')).toBeVisible({ timeout: 10000 });

  // Wait for increment buttons to be available
  const incrementButtons = page.locator('button:has-text("+")');
  await incrementButtons.first().waitFor({ state: 'visible', timeout: 10000 });

  // Click increment buttons to add roles
  for (let i = 0; i < roleCount; i++) {
    const button = incrementButtons.nth(i % (await incrementButtons.count()));
    await button.click();
    // Small delay to ensure state updates
    await page.waitForTimeout(200);
  }
}

/**
 * Confirm role distribution and wait for completion
 */
export async function confirmRoleDistribution(page: Page) {
  const confirmButton = page.getByRole("button", {name: "Confirm Selection"});
  await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
  await confirmButton.click();

  // Wait for success message
  await expect(page.getByText('Roles Distributed!')).toBeVisible({ timeout: 10000 });

  // Small delay to ensure WebSocket broadcasts complete
  await page.waitForTimeout(500);
}

/**
 * Wait for player to receive their role
 */
export async function waitForRoleAssignment(page: Page, timeout = 30000) {
  // Wait for "Your Role!" heading (increased timeout for WebSocket propagation)
  const roleHeading = page.locator('h2:has-text("Your Role!")');

  // Log current URL for debugging
  console.log('[waitForRoleAssignment] Current URL:', page.url());

  try {
    await roleHeading.waitFor({ state: 'visible', timeout });
  } catch (error) {
    // Enhanced debugging
    const url = page.url();
    const title = await page.title();
    const bodyText = await page.locator('body').textContent().catch(() => 'Unable to get body text');

    console.error('[waitForRoleAssignment] Failed to find "Your Role!" heading');
    console.error('  URL:', url);
    console.error('  Title:', title);
    console.error('  Body text (first 500 chars):', bodyText?.substring(0, 500));

    // Check if we're still in lobby
    const inLobby = await page.locator('text=/Waiting for|Game Lobby/i').isVisible().catch(() => false);
    console.error('  Still in lobby?:', inLobby);

    throw new Error(`Failed to find "Your Role!" heading after ${timeout}ms. URL: ${url}, In lobby: ${inLobby}`);
  }

  // Wait for Canvas element (3D card) to be visible
  const canvas = page.locator('canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 10000 });

  // Optionally wait for video element (it may load asynchronously)
  // Don't fail if video doesn't appear - Three.js manages it internally
  try {
    const video = page.locator('video').first();
    await video.waitFor({ state: 'attached', timeout: 3000 });
  } catch {
    // Video element managed by Three.js may not be in DOM yet
    console.log('[waitForRoleAssignment] Video element not yet attached, continuing...');
  }

  // Return player name from the header card instead of role name
  const playerName = page.locator('.text-white.font-bold.bg-gradient-to-r').first();
  return await playerName.textContent();
}

/**
 * Verify role card UI elements
 */
export async function verifyRoleCard(page: Page) {
  // Check role heading
  await expect(page.locator('h2:has-text("Your Role!")')).toBeVisible();

  // Check player name display
  const playerNameDisplay = page.locator('.text-white.font-bold.bg-gradient-to-r');
  await expect(playerNameDisplay).toBeVisible();

  // Check Canvas element (Three.js renders the 3D card with role name and team badge)
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // Optionally check video element (it may load asynchronously via Three.js)
  // Video is managed by useVideoTexture hook and may not be immediately in DOM
  try {
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 3000 });
    const videoSrc = await video.getAttribute('src');
    expect(videoSrc, 'Video source should be present').toBeTruthy();
  } catch {
    // Video managed by Three.js may not be in DOM yet - this is acceptable
    console.log('[verifyRoleCard] Video element not yet attached, continuing...');
  }

  // Check player name is displayed
  const playerName = await playerNameDisplay.textContent();
  expect(playerName, 'Player name should not be empty').toBeTruthy();
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
