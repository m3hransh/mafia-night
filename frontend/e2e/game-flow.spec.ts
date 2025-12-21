import { test, expect } from '@playwright/test';
import {
  createGameSession,
  joinGameAsPlayer,
  waitForPlayerInList,
  waitForPlayersCount,
  selectRoles,
  confirmRoleDistribution,
  waitForRoleAssignment,
  verifyRoleCard,
} from './utils/test-helpers';

/**
 * E2E Tests for Game Flow
 *
 * Tests the complete flow of creating a game, joining as players, and selecting roles
 * Improved version with:
 * - No arbitrary waitForTimeout calls
 * - Proper WebSocket synchronization
 * - Reusable test fixtures
 * - Better error messages
 */

test.describe('Game Flow - Create and Join Game', () => {
  test('should create game, join as players, and select roles', async ({ browser }) => {
    // Create game session
    const game = await createGameSession(browser);

    // Join as first player
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'Alice');

    try {
      // Verify player appears in moderator's list
      await waitForPlayerInList(game.moderatorPage, 'Alice');
      await waitForPlayersCount(game.moderatorPage, 1);

      // Add a second player
      const player2 = await joinGameAsPlayer(browser, game.gameCode, 'Bob');

      try {
        // Verify second player appears
        await waitForPlayerInList(game.moderatorPage, 'Bob');
        await waitForPlayersCount(game.moderatorPage, 2);

        // Moderator starts role selection
        const startButton = game.moderatorPage.locator('button:has-text("Select Roles")');
        await expect(startButton).toBeEnabled();
        await startButton.click();

        // Select 2 roles
        await selectRoles(game.moderatorPage, 2);

        // Confirm role selection
        await confirmRoleDistribution(game.moderatorPage);

        // Cleanup
        await player2.cleanup();
      } catch (error) {
        await player2.cleanup();
        throw error;
      }

    } finally {
      await player1.cleanup();
      await game.cleanup();
    }
  });

  test('should show error when joining with invalid game code', async ({ page }) => {
    await page.goto('/join-game?code=INVALID');

    // Wait for page to load
    await expect(page.locator('h1:has-text("Join Game")')).toBeVisible();

    // Enter player name
    const nameInput = page.getByRole('textbox', {name: "Your Name"});
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('TestPlayer');

    // Try to join
    await page.click('button:has-text("Join Game")');

    // Should show error
    await expect(page.locator('text=/error|not found|invalid/i')).toBeVisible({ timeout: 10000 });
  });

  test('should not allow duplicate player names in same game', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'John');

    try {
      // Second player tries to join with same name
      const player2Context = await browser.newContext();
      const player2Page = await player2Context.newPage();

      await player2Page.goto(`/join-game?code=${game.gameCode}`);
      await expect(player2Page.locator('h1:has-text("Join Game")')).toBeVisible();

      await player2Page.getByRole('textbox', {name: "Your Name"}).fill('John');
      await player2Page.click('button:has-text("Join Game")');

      // Should show error about duplicate name
      await expect(player2Page.locator('text=/already exists|duplicate|taken/i')).toBeVisible({ timeout: 10000 });

      await player2Context.close();
    } finally {
      await player1.cleanup();
      await game.cleanup();
    }
  });

  test('should copy game code to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/create-game');
    await expect(page.locator('h1:has-text("Create Game")')).toBeVisible();

    await page.click('button:has-text("Create Game")');

    // Wait for game code (prefer data-testid, fallback to class)
    const gameCodeElement = page.getByTestId('game-code').or(page.locator('.font-mono').first());
    await gameCodeElement.waitFor({ state: 'visible', timeout: 10000 });
    const gameCode = await gameCodeElement.textContent();

    // Click copy button (prefer data-testid, fallback to text)
    const copyButton = page.getByTestId('copy-game-code-button').or(page.locator('button:has-text("Copy")'));
    await copyButton.waitFor({ state: 'visible' });
    await copyButton.click();

    // Wait for button text to change to "Copied!"
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible({ timeout: 3000 });

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText, 'Clipboard should contain game code').toBe(gameCode?.trim());
    expect(clipboardText.length, 'Game code should be 6 characters').toBe(6);

    // Verify it changes back to "Copy"
    await expect(page.locator('button:has-text("Copy")').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show share button and join URL', async ({ page }) => {
    await page.goto('/create-game');
    await expect(page.locator('h1:has-text("Create Game")')).toBeVisible();

    await page.click('button:has-text("Create Game")');

    // Wait for game to be created
    await page.locator('.font-mono').first().waitFor({ state: 'visible', timeout: 10000 });

    // Check that share button is visible
    const shareButton = page.locator('button:has-text("Share Game Link")');
    await expect(shareButton).toBeVisible();

    // Check that join URL is displayed
    const joinUrl = page.locator('text=/join-game\\?code=/i');
    await expect(joinUrl).toBeVisible();
  });

  test('should not allow starting game without players', async ({ page }) => {
    await page.goto('/create-game');
    await expect(page.locator('h1:has-text("Create Game")')).toBeVisible();

    await page.click('button:has-text("Create Game")');

    // Wait for game to be created
    await page.locator('.font-mono').first().waitFor({ state: 'visible', timeout: 10000 });

    // Start button should be disabled
    const startButton = page.locator('button:has-text("Select Roles")');
    await expect(startButton).toBeDisabled();
  });

  test('should distribute roles and players should see their assigned roles', async ({ browser }) => {
    // Create game
    const game = await createGameSession(browser);

    // Join as two players
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'Alice');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'Bob');

    try {
      // Verify both players are in the list
      await waitForPlayerInList(game.moderatorPage, 'Alice');
      await waitForPlayerInList(game.moderatorPage, 'Bob');
      await waitForPlayersCount(game.moderatorPage, 2);

      // Moderator starts role selection
      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();

      // Select 2 different roles
      await selectRoles(game.moderatorPage, 2);

      // Confirm role distribution
      await confirmRoleDistribution(game.moderatorPage);

      // Verify Player 1 sees their assigned role
      const player1Role = await waitForRoleAssignment(player1.playerPage);
      expect(player1Role, 'Player 1 should have a role assigned').toBeTruthy();
      expect(player1Role?.length, 'Player 1 role name should not be empty').toBeGreaterThan(0);

      // Verify Player 1 role card UI
      await verifyRoleCard(player1.playerPage);

      // Verify Player 2 sees their assigned role
      const player2Role = await waitForRoleAssignment(player2.playerPage);
      expect(player2Role, 'Player 2 should have a role assigned').toBeTruthy();

      // Verify Player 2 role card UI
      await verifyRoleCard(player2.playerPage);

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });

  test('should display role abilities and description when assigned', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player = await joinGameAsPlayer(browser, game.gameCode, 'TestPlayer');

    try {
      // Wait for moderator to see player
      await waitForPlayerInList(game.moderatorPage, 'TestPlayer');

      // Start role selection
      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();

      // Select one role
      await selectRoles(game.moderatorPage, 1);

      // Confirm distribution
      await confirmRoleDistribution(game.moderatorPage);

      // Wait for player to receive role
      await waitForRoleAssignment(player.playerPage);

      // Verify role card is displayed
      await expect(player.playerPage.locator('h2:has-text("Your Role")')).toBeVisible();

      // Check that role description/abilities section exists
      const descriptionSection = player.playerPage.locator('text=/Description|Role|Abilities/i').first();
      await expect(descriptionSection).toBeVisible({ timeout: 5000 });

      // Verify player name is shown in the encouragement message
      await expect(player.playerPage.locator('text=/Good luck.*TestPlayer/i')).toBeVisible({ timeout: 5000 });

      // Verify Leave Game button is available
      await expect(player.playerPage.locator('button:has-text("Leave Game")')).toBeVisible({ timeout: 5000 });

    } finally {
      await player.cleanup();
      await game.cleanup();
    }
  });

  test('should handle WebSocket reconnection gracefully', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player = await joinGameAsPlayer(browser, game.gameCode, 'ReconnectTest');

    try {
      // Verify player appears
      await waitForPlayerInList(game.moderatorPage, 'ReconnectTest');

      // Simulate network interruption by reloading the player page
      await player.playerPage.reload();

      // Player should reconnect and still be in lobby
      await expect(player.playerPage.locator('text=/Waiting for|Game Lobby/i')).toBeVisible({ timeout: 15000 });

      // Verify player is still in moderator's list
      await expect(game.moderatorPage.locator('text=ReconnectTest')).toBeVisible();

    } finally {
      await player.cleanup();
      await game.cleanup();
    }
  });

  test('should handle multiple players joining simultaneously', async ({ browser }) => {
    const game = await createGameSession(browser);

    // Join 3 players simultaneously
    const [player1, player2, player3] = await Promise.all([
      joinGameAsPlayer(browser, game.gameCode, 'Concurrent1'),
      joinGameAsPlayer(browser, game.gameCode, 'Concurrent2'),
      joinGameAsPlayer(browser, game.gameCode, 'Concurrent3'),
    ]);

    try {
      // All players should appear in moderator's list
      await waitForPlayerInList(game.moderatorPage, 'Concurrent1');
      await waitForPlayerInList(game.moderatorPage, 'Concurrent2');
      await waitForPlayerInList(game.moderatorPage, 'Concurrent3');
      await waitForPlayersCount(game.moderatorPage, 3);

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await player3.cleanup();
      await game.cleanup();
    }
  });
});
