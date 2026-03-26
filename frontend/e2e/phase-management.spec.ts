import { test, expect } from '@playwright/test';
import {
  createGameSession,
  joinGameAsPlayer,
  waitForPlayerInList,
  selectRoles,
  confirmRoleDistribution,
  waitForRoleAssignment,
  startDayPhase,
  startNightPhase,
  waitForPhaseBadge,
  waitForPhaseNotification,
} from './utils/test-helpers';

/**
 * E2E Tests: Phase Management & Role Reveal UX
 *
 * Covers:
 * - Role card collapses to compact badge after player views their role
 * - Compact badge re-opens the full role card
 * - Moderator day/night phase controls (Start Day / Start Night / End Game)
 * - Players receive phase change notification banner
 * - Players see phase status badge update
 */

test.describe('Role Reveal — Collapse & Re-open', () => {
  test('role reveal card collapses to compact badge after viewing', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player = await joinGameAsPlayer(browser, game.gameCode, 'RoleViewer');

    try {
      await waitForPlayerInList(game.moderatorPage, 'RoleViewer');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 1);
      await confirmRoleDistribution(game.moderatorPage);

      // Player waits for "Reveal My Role" and clicks it
      await waitForRoleAssignment(player.playerPage);

      // Player is now in role card view — click "Back to Lobby"
      await player.playerPage.locator('button:has-text("Back to Lobby")').click();

      // The large reveal card should be gone
      await expect(
        player.playerPage.locator('button:has-text("Reveal My Role")')
      ).not.toBeVisible({ timeout: 5000 });

      // The compact badge should now be visible
      const badge = player.playerPage.getByTestId('role-seen-badge');
      await expect(badge).toBeVisible({ timeout: 5000 });

      // Badge should display the role name
      const badgeText = await badge.textContent();
      expect(badgeText?.length, 'Compact badge should contain role name').toBeGreaterThan(0);

    } finally {
      await player.cleanup();
      await game.cleanup();
    }
  });

  test('compact role badge re-opens full role card', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player = await joinGameAsPlayer(browser, game.gameCode, 'ReTapper');

    try {
      await waitForPlayerInList(game.moderatorPage, 'ReTapper');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 1);
      await confirmRoleDistribution(game.moderatorPage);

      // First reveal
      await waitForRoleAssignment(player.playerPage);
      await player.playerPage.locator('button:has-text("Back to Lobby")').click();

      // Compact badge is visible
      const badge = player.playerPage.getByTestId('role-seen-badge');
      await expect(badge).toBeVisible({ timeout: 5000 });

      // Tap the compact badge to re-open the role card
      await badge.click();

      // Full-screen role card should appear again (canvas + Back to Lobby)
      await expect(player.playerPage.locator('canvas').first()).toBeVisible({ timeout: 10000 });
      await expect(player.playerPage.locator('button:has-text("Back to Lobby")')).toBeVisible();

    } finally {
      await player.cleanup();
      await game.cleanup();
    }
  });
});

test.describe('Phase Management — Moderator Controls', () => {
  test('moderator can start day phase and it appears in game view', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'DayPlayer1');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'DayPlayer2');

    try {
      await waitForPlayerInList(game.moderatorPage, 'DayPlayer1');
      await waitForPlayerInList(game.moderatorPage, 'DayPlayer2');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 2);
      await confirmRoleDistribution(game.moderatorPage);

      // Phase controls should now be visible on moderator page
      await expect(game.moderatorPage.getByTestId('start-day-btn')).toBeVisible();
      await expect(game.moderatorPage.getByTestId('start-night-btn')).toBeVisible();
      await expect(game.moderatorPage.getByTestId('end-game-btn')).toBeVisible();

      // Start Day
      await startDayPhase(game.moderatorPage);

      // Moderator's "Start Day" button should be disabled (already in day)
      await expect(game.moderatorPage.getByTestId('start-day-btn')).toBeDisabled({ timeout: 5000 });

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });

  test('moderator can cycle day → night → day', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'CyclePlayer1');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'CyclePlayer2');

    try {
      await waitForPlayerInList(game.moderatorPage, 'CyclePlayer1');
      await waitForPlayerInList(game.moderatorPage, 'CyclePlayer2');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 2);
      await confirmRoleDistribution(game.moderatorPage);

      // Start Day
      await startDayPhase(game.moderatorPage);
      await expect(game.moderatorPage.getByTestId('start-day-btn')).toBeDisabled({ timeout: 5000 });
      await expect(game.moderatorPage.getByTestId('start-night-btn')).toBeEnabled({ timeout: 5000 });

      // Start Night
      await startNightPhase(game.moderatorPage);
      await expect(game.moderatorPage.getByTestId('start-night-btn')).toBeDisabled({ timeout: 5000 });
      await expect(game.moderatorPage.getByTestId('start-day-btn')).toBeEnabled({ timeout: 5000 });

      // Back to Day
      await startDayPhase(game.moderatorPage);
      await expect(game.moderatorPage.getByTestId('start-day-btn')).toBeDisabled({ timeout: 5000 });

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });
});

test.describe('Phase Change — Player Notifications', () => {
  test('player sees phase status badge when moderator starts day', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'NotifyAlice');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'NotifyBob');

    try {
      await waitForPlayerInList(game.moderatorPage, 'NotifyAlice');
      await waitForPlayerInList(game.moderatorPage, 'NotifyBob');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 2);
      await confirmRoleDistribution(game.moderatorPage);

      // No phase badge before phase change
      await expect(player1.playerPage.getByTestId('phase-status-badge')).not.toBeVisible();

      // Moderator starts Day
      await startDayPhase(game.moderatorPage);

      // Both players should see phase status badge with "Day Phase"
      await waitForPhaseBadge(player1.playerPage, 'Day Phase');
      await waitForPhaseBadge(player2.playerPage, 'Day Phase');

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });

  test('player sees phase notification banner on day/night transitions', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'BannerAlice');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'BannerBob');

    try {
      await waitForPlayerInList(game.moderatorPage, 'BannerAlice');
      await waitForPlayerInList(game.moderatorPage, 'BannerBob');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 2);
      await confirmRoleDistribution(game.moderatorPage);

      // Start Day — both players get banner
      await startDayPhase(game.moderatorPage);
      await waitForPhaseNotification(player1.playerPage, 'Day');
      await waitForPhaseNotification(player2.playerPage, 'Day');

      // Start Night — both players get updated banner
      await startNightPhase(game.moderatorPage);
      await waitForPhaseBadge(player1.playerPage, 'Night Phase');
      await waitForPhaseNotification(player1.playerPage, 'Night');

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });

  test('player sees night phase badge after moderator starts night', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player1 = await joinGameAsPlayer(browser, game.gameCode, 'NightAlice');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'NightBob');

    try {
      await waitForPlayerInList(game.moderatorPage, 'NightAlice');
      await waitForPlayerInList(game.moderatorPage, 'NightBob');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 2);
      await confirmRoleDistribution(game.moderatorPage);

      // Start Night directly (game can go straight to night)
      await startNightPhase(game.moderatorPage);

      // Players should see Night Phase badge
      await waitForPhaseBadge(player1.playerPage, 'Night Phase');
      await waitForPhaseBadge(player2.playerPage, 'Night Phase');

    } finally {
      await player1.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });

  test('player with assigned role still receives phase change notifications', async ({ browser }) => {
    const game = await createGameSession(browser);
    const player = await joinGameAsPlayer(browser, game.gameCode, 'RolePlayer');
    const player2 = await joinGameAsPlayer(browser, game.gameCode, 'RolePlayer2');

    try {
      await waitForPlayerInList(game.moderatorPage, 'RolePlayer');
      await waitForPlayerInList(game.moderatorPage, 'RolePlayer2');

      const selectRolesButton = game.moderatorPage.locator('button:has-text("Select Roles")');
      await expect(selectRolesButton).toBeEnabled();
      await selectRolesButton.click();
      await selectRoles(game.moderatorPage, 2);
      await confirmRoleDistribution(game.moderatorPage);

      // Player reveals role and goes back
      await player.playerPage.locator('button:has-text("Reveal My Role")').waitFor({ state: 'visible', timeout: 15000 });
      await waitForRoleAssignment(player.playerPage);
      await player.playerPage.locator('button:has-text("Back to Lobby")').click();

      // Compact badge is visible — player has seen their role
      await expect(player.playerPage.getByTestId('role-seen-badge')).toBeVisible({ timeout: 5000 });

      // Moderator starts Night — player should still get the phase notification
      await startNightPhase(game.moderatorPage);
      await waitForPhaseBadge(player.playerPage, 'Night Phase');
      await waitForPhaseNotification(player.playerPage, 'Night');

    } finally {
      await player.cleanup();
      await player2.cleanup();
      await game.cleanup();
    }
  });
});
