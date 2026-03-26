import { test, expect, Browser } from '@playwright/test';
import {
  setupGameInProgress,
  startDayPhase,
  startNightPhase,
  waitForPhaseBadge,
  openVoteSessionFor,
  waitForVoteOverlay,
  castBallotOnOverlay,
  closeVoteFromPanel,
  startNewVoteFromPanel,
  waitForModeratorPhaseLabel,
  waitForModeratorRound,
} from './utils/test-helpers';

/**
 * E2E Tests: Vote Session System
 *
 * Scenarios:
 * 1. Moderator opens a vote → players see the overlay with accused name
 * 2. Player votes yes → moderator sees live count update
 * 3. Player can change their vote before close
 * 4. Moderator closes vote → outcome banner shown on both sides
 * 5. After close — player dismisses overlay
 * 6. After close — moderator starts a new vote for a different player
 * 7. Majority yes → confirm eliminate removes player from list
 * 8. Minority yes → spared result shown
 * 9. Phase restore: moderator refreshes and sees correct phase/round
 * 10. Phase restore: player refreshes and sees correct day/night overlay
 * 11. Vote restore: player refreshes while vote is open → overlay reappears
 * 12. Vote restore: moderator refreshes while vote is open → panel reappears
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

async function setupDayPhase(browser: Browser, playerNames: string[]) {
  const { game, players, cleanup } = await setupGameInProgress(browser, playerNames);
  await startDayPhase(game.moderatorPage);
  // Wait for voting panel to appear on moderator
  await game.moderatorPage.getByTestId('voting-panel-select').waitFor({ state: 'visible', timeout: 10000 });
  return { game, players, cleanup };
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Vote Session — Open & Player Overlay', () => {
  test('moderator opens vote and players see overlay with accused player name', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Alice', 'Bob']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Alice');

      // Both players should see the overlay
      await waitForVoteOverlay(players[0].playerPage, 'Alice');
      await waitForVoteOverlay(players[1].playerPage, 'Alice');

      // Voting panel should show accused name
      await expect(game.moderatorPage.getByTestId('accused-player-name')).toContainText('Alice');
    } finally {
      await cleanup();
    }
  });

  test('moderator opens vote with a custom message', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Carol', 'Dave']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Carol', 'Suspicious behaviour');

      const overlay = await waitForVoteOverlay(players[0].playerPage, 'Carol');
      await expect(overlay).toContainText('Suspicious behaviour');
    } finally {
      await cleanup();
    }
  });
});

test.describe('Vote Session — Casting Ballots', () => {
  test('player votes yes and moderator sees live count update', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Eve', 'Frank']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Eve');

      // Wait for overlay on Eve's (player[0]) page
      await waitForVoteOverlay(players[0].playerPage, 'Eve');

      // Player 0 casts yes
      await castBallotOnOverlay(players[0].playerPage, 'yes');

      // Moderator panel yes count should now show 1
      await expect(game.moderatorPage.getByTestId('yes-count')).toContainText('1', { timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  test('player votes no and moderator sees live count update', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Grace', 'Henry']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Grace');
      await waitForVoteOverlay(players[1].playerPage, 'Grace');

      // Player 1 (Henry) casts no
      await castBallotOnOverlay(players[1].playerPage, 'no');

      await expect(game.moderatorPage.getByTestId('no-count')).toContainText('1', { timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  test('player can change vote from yes to no before close', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Ivy', 'Jack']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Ivy');
      await waitForVoteOverlay(players[0].playerPage, 'Ivy');

      // First vote: yes
      await castBallotOnOverlay(players[0].playerPage, 'yes');
      await expect(game.moderatorPage.getByTestId('yes-count')).toContainText('1', { timeout: 10000 });

      // Change to no
      await castBallotOnOverlay(players[0].playerPage, 'no');

      // Yes count drops back to 0, no count goes to 1
      await expect(game.moderatorPage.getByTestId('yes-count')).toContainText('0', { timeout: 10000 });
      await expect(game.moderatorPage.getByTestId('no-count')).toContainText('1', { timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  test('multiple players vote and counts are reflected correctly', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Kate', 'Leo', 'Mia']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Kate');

      await waitForVoteOverlay(players[0].playerPage, 'Kate');
      await waitForVoteOverlay(players[1].playerPage, 'Kate');
      await waitForVoteOverlay(players[2].playerPage, 'Kate');

      // Kate votes no (accused player), Leo votes yes, Mia votes yes
      await castBallotOnOverlay(players[0].playerPage, 'no');
      await castBallotOnOverlay(players[1].playerPage, 'yes');
      await castBallotOnOverlay(players[2].playerPage, 'yes');

      // Moderator sees 2 yes, 1 no
      await expect(game.moderatorPage.getByTestId('yes-count')).toContainText('2', { timeout: 10000 });
      await expect(game.moderatorPage.getByTestId('no-count')).toContainText('1', { timeout: 10000 });
    } finally {
      await cleanup();
    }
  });
});

test.describe('Vote Session — Close & Results', () => {
  test('moderator closes vote and outcome banner shows on both sides (majority yes)', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Nick', 'Olivia']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Nick');

      // Both vote yes (majority)
      await waitForVoteOverlay(players[0].playerPage, 'Nick');
      await waitForVoteOverlay(players[1].playerPage, 'Nick');
      await castBallotOnOverlay(players[0].playerPage, 'yes');
      await castBallotOnOverlay(players[1].playerPage, 'yes');

      // Moderator closes
      await closeVoteFromPanel(game.moderatorPage);

      // Moderator outcome banner shows eliminated
      await expect(game.moderatorPage.getByTestId('vote-outcome-banner')).toContainText('Majority reached', { timeout: 5000 });
      await expect(game.moderatorPage.getByTestId('confirm-eliminate-btn')).toBeVisible();

      // Player overlay shows outcome
      await expect(players[0].playerPage.getByTestId('overlay-outcome')).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  test('moderator closes vote and spared result shown when no majority', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Pat', 'Quinn', 'Ray']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Pat');

      // Only 1 yes out of 3 — no majority
      await waitForVoteOverlay(players[0].playerPage, 'Pat');
      await castBallotOnOverlay(players[0].playerPage, 'yes');
      await castBallotOnOverlay(players[1].playerPage, 'no');
      await castBallotOnOverlay(players[2].playerPage, 'no');

      await closeVoteFromPanel(game.moderatorPage);

      // Spared result
      await expect(game.moderatorPage.getByTestId('vote-outcome-banner')).toContainText('Spared', { timeout: 5000 });
      // No eliminate button
      await expect(game.moderatorPage.getByTestId('confirm-eliminate-btn')).not.toBeVisible();
    } finally {
      await cleanup();
    }
  });

  test('player sees dismiss button after vote closes and can dismiss overlay', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Sam', 'Tess']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Sam');
      await waitForVoteOverlay(players[0].playerPage, 'Sam');

      await closeVoteFromPanel(game.moderatorPage);

      // Player sees dismiss button
      const dismissBtn = players[0].playerPage.getByTestId('dismiss-overlay-btn');
      await dismissBtn.waitFor({ state: 'visible', timeout: 10000 });
      await dismissBtn.click();

      // Overlay gone
      await expect(players[0].playerPage.getByTestId('vote-overlay')).not.toBeVisible({ timeout: 5000 });
    } finally {
      await cleanup();
    }
  });
});

test.describe('Vote Session — Start New Vote', () => {
  test('moderator can start new vote for a different player after close', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Uma', 'Vera']);
    try {
      // First vote for Uma
      await openVoteSessionFor(game.moderatorPage, 'Uma');
      await closeVoteFromPanel(game.moderatorPage);

      // Start new vote
      await startNewVoteFromPanel(game.moderatorPage);

      // Player select panel should be visible with both players
      await expect(game.moderatorPage.getByTestId('vote-player-btn-Uma')).toBeVisible();
      await expect(game.moderatorPage.getByTestId('vote-player-btn-Vera')).toBeVisible();

      // Now open vote for Vera
      await openVoteSessionFor(game.moderatorPage, 'Vera');
      await expect(game.moderatorPage.getByTestId('accused-player-name')).toContainText('Vera');

      // Vera's overlay appears for players
      await waitForVoteOverlay(players[0].playerPage, 'Vera');
    } finally {
      await cleanup();
    }
  });

  test('after new vote opens, previous dismissed overlay is replaced', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Will', 'Xena']);
    try {
      // First vote
      await openVoteSessionFor(game.moderatorPage, 'Will');
      await waitForVoteOverlay(players[0].playerPage, 'Will');
      await closeVoteFromPanel(game.moderatorPage);

      // Player dismisses
      await players[0].playerPage.getByTestId('dismiss-overlay-btn').click();
      await expect(players[0].playerPage.getByTestId('vote-overlay')).not.toBeVisible({ timeout: 5000 });

      // Moderator starts new vote for Xena
      await startNewVoteFromPanel(game.moderatorPage);
      await openVoteSessionFor(game.moderatorPage, 'Xena');

      // New overlay appears for player with new accused name
      await waitForVoteOverlay(players[0].playerPage, 'Xena');
    } finally {
      await cleanup();
    }
  });
});

test.describe('Vote Session — Elimination', () => {
  test('majority yes vote allows moderator to confirm elimination', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Yara', 'Zane']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Yara');

      // Both vote yes
      await waitForVoteOverlay(players[0].playerPage, 'Yara');
      await waitForVoteOverlay(players[1].playerPage, 'Yara');
      await castBallotOnOverlay(players[0].playerPage, 'yes');
      await castBallotOnOverlay(players[1].playerPage, 'yes');

      await closeVoteFromPanel(game.moderatorPage);

      // Confirm elimination button appears
      const eliminateBtn = game.moderatorPage.getByTestId('confirm-eliminate-btn');
      await eliminateBtn.waitFor({ state: 'visible', timeout: 5000 });
      await eliminateBtn.click();

      // After elimination, PLAYER_ELIMINATED clears activeVoteSession →
      // voting-panel-select reappears automatically (no need for "Start New Vote")
      await game.moderatorPage.getByTestId('voting-panel-select').waitFor({ state: 'visible', timeout: 10000 });

      // Yara is eliminated — should not appear in alive player list
      await expect(game.moderatorPage.getByTestId('vote-player-btn-Yara')).not.toBeVisible({ timeout: 5000 });
      await expect(game.moderatorPage.getByTestId('vote-player-btn-Zane')).toBeVisible();
    } finally {
      await cleanup();
    }
  });
});

test.describe('State Restore on Refresh', () => {
  test('moderator refreshes page and sees correct phase and round number', async ({ browser }) => {
    const { game, players, cleanup } = await setupGameInProgress(browser, ['Adam', 'Beth']);
    try {
      // Start day phase
      await startDayPhase(game.moderatorPage);
      await waitForModeratorPhaseLabel(game.moderatorPage, 'Day');
      await waitForModeratorRound(game.moderatorPage, 1);

      // Refresh moderator page
      await game.moderatorPage.reload();
      await game.moderatorPage.waitForLoadState('load');

      // Should restore day phase and round 1
      await waitForModeratorPhaseLabel(game.moderatorPage, 'Day', 15000);
      await waitForModeratorRound(game.moderatorPage, 1, 15000);
    } finally {
      await Promise.all(players.map(p => p.cleanup()));
      await game.cleanup();
    }
  });

  test('moderator refreshes and sees night phase after night was started', async ({ browser }) => {
    const { game, players, cleanup } = await setupGameInProgress(browser, ['Carl', 'Dana']);
    try {
      await startNightPhase(game.moderatorPage);
      await waitForModeratorPhaseLabel(game.moderatorPage, 'Night');

      await game.moderatorPage.reload();
      await game.moderatorPage.waitForLoadState('load');

      await waitForModeratorPhaseLabel(game.moderatorPage, 'Night', 15000);
    } finally {
      await Promise.all(players.map(p => p.cleanup()));
      await game.cleanup();
    }
  });

  test('moderator refreshes with open vote session and sees active voting panel', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Evan', 'Faye']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Evan');
      await expect(game.moderatorPage.getByTestId('accused-player-name')).toContainText('Evan');

      // Refresh
      await game.moderatorPage.reload();
      await game.moderatorPage.waitForLoadState('load');

      // Active vote panel should reappear with Evan's name
      await game.moderatorPage.getByTestId('voting-panel-active').waitFor({ state: 'visible', timeout: 15000 });
      await expect(game.moderatorPage.getByTestId('accused-player-name')).toContainText('Evan', { timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  test('player refreshes and sees correct day phase overlay', async ({ browser }) => {
    const { game, players, cleanup } = await setupGameInProgress(browser, ['Gina', 'Hugo']);
    try {
      await startDayPhase(game.moderatorPage);
      await waitForPhaseBadge(players[0].playerPage, 'Day Phase');

      // Refresh player page
      await players[0].playerPage.reload();
      await players[0].playerPage.waitForLoadState('load');

      // Phase badge should restore to Day
      await waitForPhaseBadge(players[0].playerPage, 'Day Phase', 15000);
    } finally {
      await cleanup();
    }
  });

  test('player refreshes and sees correct night phase overlay', async ({ browser }) => {
    const { game, players, cleanup } = await setupGameInProgress(browser, ['Iris', 'Jake']);
    try {
      await startNightPhase(game.moderatorPage);
      await waitForPhaseBadge(players[0].playerPage, 'Night Phase');

      await players[0].playerPage.reload();
      await players[0].playerPage.waitForLoadState('load');

      await waitForPhaseBadge(players[0].playerPage, 'Night Phase', 15000);
    } finally {
      await cleanup();
    }
  });

  test('player refreshes while vote is open and sees overlay', async ({ browser }) => {
    const { game, players, cleanup } = await setupDayPhase(browser, ['Kim', 'Leo']);
    try {
      await openVoteSessionFor(game.moderatorPage, 'Kim');
      await waitForVoteOverlay(players[0].playerPage, 'Kim');

      // Refresh player 1's page
      await players[1].playerPage.reload();
      await players[1].playerPage.waitForLoadState('load');

      // Vote overlay should reappear after restore
      await waitForVoteOverlay(players[1].playerPage, 'Kim', 15000);
    } finally {
      await cleanup();
    }
  });

  test('player roleSeen state persists across refresh', async ({ browser }) => {
    const { game, players, cleanup } = await setupGameInProgress(browser, ['Mae', 'Ned']);
    try {
      // Player reveals role and goes back to lobby
      await players[0].playerPage.locator('button:has-text("Reveal My Role")').waitFor({ state: 'visible', timeout: 15000 });
      await players[0].playerPage.locator('button:has-text("Reveal My Role")').click();
      await players[0].playerPage.locator('canvas').first().waitFor({ state: 'visible', timeout: 10000 });
      await players[0].playerPage.locator('button:has-text("Back to Lobby")').click();

      // Compact badge visible
      await expect(players[0].playerPage.getByTestId('role-seen-badge')).toBeVisible({ timeout: 5000 });

      // Refresh
      await players[0].playerPage.reload();
      await players[0].playerPage.waitForLoadState('load');

      // Still shows compact badge (no "Reveal My Role" button)
      await expect(players[0].playerPage.getByTestId('role-seen-badge')).toBeVisible({ timeout: 15000 });
      await expect(players[0].playerPage.locator('button:has-text("Reveal My Role")')).not.toBeVisible({ timeout: 3000 });
    } finally {
      await cleanup();
    }
  });
});
