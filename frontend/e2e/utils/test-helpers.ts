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
  const back = page.getByRole("button", {name: "Back"});
  await back.waitFor({ state: 'visible', timeout: 10000 });
  await back.click();
  const startButton = page.getByRole("button", {name: "Start Game"});
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();

  // Wait for game-started view ("Game in Progress" heading)
  await expect(page.getByText('Game in Progress')).toBeVisible({ timeout: 10000 });

  // Brief pause to allow WebSocket broadcasts to reach player pages
  await page.waitForTimeout(500);
}

/**
 * Start the day phase from the moderator's game view
 */
export async function startDayPhase(page: Page) {
  const btn = page.getByTestId('start-day-btn');
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
}

/**
 * Start the night phase from the moderator's game view
 */
export async function startNightPhase(page: Page) {
  const btn = page.getByTestId('start-night-btn');
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
}

/**
 * Wait for a specific phase badge to appear on a player page
 */
export async function waitForPhaseBadge(page: Page, phaseLabel: string, timeout = 10000) {
  const badge = page.getByTestId('phase-status-badge');
  await badge.waitFor({ state: 'visible', timeout });
  await expect(badge).toContainText(phaseLabel, { timeout });
  return badge;
}

/**
 * Wait for the phase notification banner to appear on a player page
 */
export async function waitForPhaseNotification(page: Page, partialText: string, timeout = 10000) {
  const banner = page.getByTestId('phase-notification-banner');
  await banner.waitFor({ state: 'visible', timeout });
  await expect(banner).toContainText(partialText, { timeout });
  return banner;
}

/**
 * Wait for player to receive their role
 */
export async function waitForRoleAssignment(page: Page, timeout = 15000) {
  // First wait for the lobby reveal card ("Reveal My Role" button)
  const revealButton = page.locator('button:has-text("Reveal My Role")');
  try {
    await revealButton.waitFor({ state: 'visible', timeout });
  } catch (error) {
    const url = page.url();
    const inLobby = await page.locator('text=/Waiting for|Game Lobby/i').isVisible().catch(() => false);
    throw new Error(`Failed to find "Reveal My Role" button after ${timeout}ms. URL: ${url}, In lobby: ${inLobby}`);
  }

  // Click to reveal the 3D card
  await revealButton.click();

  // Wait for Canvas element (3D card) to be visible
  const canvas = page.locator('canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 10000 });

  // Return player name from the header card
  const playerName = page.getByTestId('player-name').first();
  return await playerName.textContent();
}

/**
 * Verify role card UI elements
 */
export async function verifyRoleCard(page: Page) {
  // Check Canvas element (Three.js renders the 3D card)
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // Check player name display in the header card
  const playerNameDisplay = page.getByTestId('player-name');
  await expect(playerNameDisplay).toBeVisible();
  const playerName = await playerNameDisplay.textContent();
  expect(playerName, 'Player name should not be empty').toBeTruthy();

  // Check "Back to Lobby" button is present in the 3D card view
  await expect(page.locator('button:has-text("Back to Lobby")')).toBeVisible({ timeout: 5000 });
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

// ── Vote Session Helpers ──────────────────────────────────────────────────────

/**
 * Open a vote session from the moderator's VotingPanel for a given player name.
 * The moderator page must already be in the day phase showing the voting panel.
 */
export async function openVoteSessionFor(page: Page, playerName: string, message = '', timeout = 15000) {
  const panel = page.getByTestId('voting-panel-select');
  await panel.waitFor({ state: 'visible', timeout });

  if (message) {
    await page.getByTestId('vote-message-input').fill(message);
  }

  const btn = page.getByTestId(`vote-player-btn-${playerName}`);
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();

  // Wait for the active vote panel to appear
  await page.getByTestId('voting-panel-active').waitFor({ state: 'visible', timeout });
}

/**
 * Wait for the VoteOverlay to appear on a player page.
 */
export async function waitForVoteOverlay(page: Page, accusedName?: string, timeout = 15000) {
  const overlay = page.getByTestId('vote-overlay');
  await overlay.waitFor({ state: 'visible', timeout });
  if (accusedName) {
    await expect(page.getByTestId('overlay-accused-name')).toContainText(accusedName, { timeout });
  }
  return overlay;
}

/**
 * Cast a ballot (yes or no) on the player's VoteOverlay.
 */
export async function castBallotOnOverlay(page: Page, choice: 'yes' | 'no') {
  const btn = page.getByTestId(choice === 'yes' ? 'vote-yes-btn' : 'vote-no-btn');
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
}

/**
 * Close the vote session from the moderator panel.
 */
export async function closeVoteFromPanel(page: Page, timeout = 10000) {
  const btn = page.getByTestId('close-vote-btn');
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();
  // Wait for the outcome banner to appear
  await page.getByTestId('vote-outcome-banner').waitFor({ state: 'visible', timeout });
}

/**
 * Click "Start New Vote" button on the moderator panel to reset after close.
 */
export async function startNewVoteFromPanel(page: Page, timeout = 10000) {
  const btn = page.getByTestId('start-new-vote-btn');
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();
  // Wait for the player-select panel to re-appear
  await page.getByTestId('voting-panel-select').waitFor({ state: 'visible', timeout });
}

/**
 * Wait for the moderator phase label to show a specific string.
 */
export async function waitForModeratorPhaseLabel(page: Page, label: string, timeout = 10000) {
  const el = page.getByTestId('moderator-phase-label');
  await el.waitFor({ state: 'visible', timeout });
  await expect(el).toContainText(label, { timeout });
  return el;
}

/**
 * Wait for the moderator round number to appear.
 */
export async function waitForModeratorRound(page: Page, round: number, timeout = 10000) {
  const el = page.getByTestId('moderator-round-number');
  await el.waitFor({ state: 'visible', timeout });
  await expect(el).toContainText(String(round), { timeout });
  return el;
}

/**
 * Helper to set up a full game ready for phase switching:
 * Creates game, joins N players with given names, selects N roles, distributes.
 * Returns { moderatorPage, playerPages, cleanup }
 */
export async function setupGameInProgress(browser: Browser, playerNames: string[]) {
  const game = await createGameSession(browser);
  const players = await Promise.all(
    playerNames.map(name => joinGameAsPlayer(browser, game.gameCode, name))
  );

  for (const name of playerNames) {
    await waitForPlayerInList(game.moderatorPage, name);
  }

  const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
  await expect(selectRolesButton).toBeEnabled();
  await selectRolesButton.click();
  await selectRoles(game.moderatorPage, playerNames.length);
  await confirmRoleDistribution(game.moderatorPage);

  return {
    game,
    players,
    cleanup: async () => {
      await Promise.all(players.map(p => p.cleanup()));
      await game.cleanup();
    },
  };
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
