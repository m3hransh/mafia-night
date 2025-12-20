import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Game Flow
 * 
 * Tests the complete flow of creating a game, joining as players, and selecting roles
 */

test.describe('Game Flow - Create and Join Game', () => {
  const API_BASE_URL = 'http://localhost:8080';
  
  test('should create game, join as players, and select roles', async ({ browser }) => {
    // Create two contexts: one for moderator, one for player
    const moderatorContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const moderatorPage = await moderatorContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Step 1: Moderator creates a game
      await moderatorPage.goto('/create-game');
      
      // Check page loaded
      await expect(moderatorPage.locator('h1:has-text("Create Game")')).toBeVisible();
      
      // Click create game button
      await moderatorPage.click('button:has-text("Create Game")');
      
      // Wait for game to be created
      await moderatorPage.waitForTimeout(2000);
      
      // Get the game code
      const gameCodeElement = moderatorPage.locator('.font-mono').first();
      await expect(gameCodeElement).toBeVisible();
      const gameCode = await gameCodeElement.textContent();
      
      console.log('Game created with code:', gameCode);
      expect(gameCode).toBeTruthy();
      expect(gameCode?.length).toBe(6);

      // Step 2: Player joins the game
      await playerPage.goto(`/join-game?code=${gameCode}`);
      
      // Wait for join page to load
      await expect(playerPage.locator('h1:has-text("Join Game")')).toBeVisible();
      
      // Enter player name
      const playerNameInput = playerPage.getByRole('textbox', {name: "Your Name"});
      await expect(playerNameInput).toBeVisible();
      await playerNameInput.fill('Alice');
      
      // Click join button
      await playerPage.click('button:has-text("Join Game")');
      
      // Wait for player to join
      await playerPage.waitForTimeout(2000);
      
      // Check that player sees "Waiting for game to start" or similar message
      await expect(playerPage.locator('text=/Waiting for|Game Lobby/i')).toBeVisible({ timeout: 5000 });

      // Step 3: Moderator should see the player in the list
      await moderatorPage.waitForTimeout(3000); // Wait for polling to update
      
      const playerInList = moderatorPage.locator('text=Alice');
      await expect(playerInList).toBeVisible({ timeout: 10000 });
      
      // Check players count
      const playersHeader = moderatorPage.locator('h2:has-text("Players")');
      await expect(playersHeader).toContainText('(1)');

      // Step 4: Add a second player
      const player2Context = await browser.newContext();
      const player2Page = await player2Context.newPage();
      
      await player2Page.goto(`/join-game?code=${gameCode}`);
      await player2Page.getByRole('textbox', {name: "Your Name"}).fill('Bob');
      await player2Page.click('button:has-text("Join Game")');
      await player2Page.waitForTimeout(2000);

      // Wait for second player to appear in moderator view
      await moderatorPage.waitForTimeout(3000);
      await expect(moderatorPage.locator('text=Bob')).toBeVisible({ timeout: 10000 });
      
      // Check updated players count
      await expect(moderatorPage.locator('h2:has-text("Players")')).toContainText('(2)');

      // Step 5: Moderator starts role selection
      const startButton = moderatorPage.locator('button:has-text("Select Roles & Start Game")');
      await expect(startButton).toBeEnabled();
      await startButton.click();
      
      // Wait for role selection panel to appear
      await moderatorPage.waitForTimeout(2000);
      
      // Check that role selection panel is visible
      await expect(moderatorPage.locator('text=/Select Roles|Role Selection/i')).toBeVisible({ timeout: 5000 });

      // Wait for roles API to load
      await moderatorPage.waitForTimeout(3000);

      // Step 6: Select roles (add Mafia role)
      // Find the first role's increment button and click it twice
      const incrementButtons = moderatorPage.locator('button:has-text("+")');
      await expect(incrementButtons.first()).toBeVisible({ timeout: 10000 });
      
      // Add 2 roles (e.g., 1 Mafia, 1 Doctor or Villager)
      await incrementButtons.first().click();
      await moderatorPage.waitForTimeout(500);
      await incrementButtons.nth(1).click();
      await moderatorPage.waitForTimeout(500);

      // Step 7: Confirm role selection
      const confirmButton = moderatorPage.getByRole("button", {name : "Confirm Selection"} );
      await expect(confirmButton).toBeVisible({ timeout: 5000 });
      await confirmButton.click();
      
      // Wait for game to start
      await moderatorPage.waitForTimeout(2000);
      
      // Check that game started message appears
      await expect(moderatorPage.getByText('Game Started')).toBeVisible({ timeout: 5000 });

      // Cleanup
      await player2Context.close();
      
    } finally {
      await moderatorContext.close();
      await playerContext.close();
    }
  });

  test('should show error when joining with invalid game code', async ({ page }) => {
    await page.goto('/join-game?code=INVALID');
    
    // Wait for page to load
    await expect(page.locator('h1:has-text("Join Game")')).toBeVisible();
    
    // Enter player name
    await page.getByRole('textbox', {name: "Your Name"}).fill('TestPlayer');
    
    // Try to join
    await page.click('button:has-text("Join Game")');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Should show error
    await expect(page.locator('text=/error|not found|invalid/i')).toBeVisible({ timeout: 5000 });
  });

  test('should not allow duplicate player names in same game', async ({ browser }) => {
    const moderatorContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();
    
    const moderatorPage = await moderatorContext.newPage();
    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    try {
      // Create game
      await moderatorPage.goto('/create-game');
      await moderatorPage.click('button:has-text("Create Game")');
      await moderatorPage.waitForTimeout(2000);
      
      const gameCode = await moderatorPage.locator('.font-mono').first().textContent();
      
      // First player joins
      await player1Page.goto(`/join-game?code=${gameCode}`);
      await player1Page.getByRole('textbox', {name: "Your Name"}).fill('John');
      await player1Page.click('button:has-text("Join Game")');
      await player1Page.waitForTimeout(2000);
      
      // Second player tries to join with same name
      await player2Page.goto(`/join-game?code=${gameCode}`);
      await player2Page.getByRole('textbox', {name: "Your Name"}).fill('John');
      await player2Page.click('button:has-text("Join Game")');
      await player2Page.waitForTimeout(2000);
      
      // Should show error about duplicate name
      await expect(player2Page.locator('text=/already exists|duplicate|taken/i')).toBeVisible({ timeout: 5000 });
      
    } finally {
      await moderatorContext.close();
      await player1Context.close();
      await player2Context.close();
    }
  });

  test('should copy game code to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.goto('/create-game');
    await page.click('button:has-text("Create Game")');
    await page.waitForTimeout(2000);
    
    // Get the game code first
    const gameCode = await page.locator('.font-mono').first().textContent();
    
    // Click copy button
    const copyButton = page.locator('button:has-text("Copy")');
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    // Wait for button text to change to "Copied!" by waiting for the new text to appear
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible({ timeout: 3000 });
    
    // Verify clipboard content matches the game code
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(gameCode?.trim());
    expect(clipboardText.length).toBe(6);
    
    // Optionally verify it changes back to "Copy" after timeout
    await expect(page.locator('button:has-text("Copy")').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show share button and join URL', async ({ page }) => {
    await page.goto('/create-game');
    await page.click('button:has-text("Create Game")');
    await page.waitForTimeout(2000);
    
    // Check that share button is visible
    const shareButton = page.locator('button:has-text("Share Game Link")');
    await expect(shareButton).toBeVisible();
    
    // Check that join URL is displayed
    const joinUrl = page.locator('text=/join-game\\?code=/i');
    await expect(joinUrl).toBeVisible();
  });

  test('should not allow starting game without players', async ({ page }) => {
    await page.goto('/create-game');
    await page.click('button:has-text("Create Game")');
    await page.waitForTimeout(2000);
    
    // Start button should be disabled
    const startButton = page.locator('button:has-text("Select Roles & Start Game")');
    await expect(startButton).toBeDisabled();
  });
});
