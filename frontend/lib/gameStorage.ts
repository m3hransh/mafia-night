/**
 * Utilities for persisting game state in localStorage
 */

interface ModeratorGameState {
  gameId: string;
  moderatorId: string;
  phase: 'waiting-for-players' | 'selecting-roles' | 'game-started';
  timestamp: number;
}

interface PlayerGameState {
  gameId: string;
  playerId: string;
  playerName: string;
  timestamp: number;
}

const MODERATOR_KEY = 'mafia_night_moderator';
const PLAYER_KEY = 'mafia_night_player';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save moderator game state
 */
export function saveModeratorGame(gameId: string, moderatorId: string, phase: ModeratorGameState['phase']) {
  try {
    const state: ModeratorGameState = {
      gameId,
      moderatorId,
      phase,
      timestamp: Date.now(),
    };
    localStorage.setItem(MODERATOR_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save moderator game:', error);
  }
}

/**
 * Get moderator game state
 */
export function getModeratorGame(): ModeratorGameState | null {
  try {
    const stored = localStorage.getItem(MODERATOR_KEY);
    if (!stored) return null;

    const state: ModeratorGameState = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() - state.timestamp > EXPIRY_TIME) {
      clearModeratorGame();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to get moderator game:', error);
    return null;
  }
}

/**
 * Clear moderator game state
 */
export function clearModeratorGame() {
  try {
    localStorage.removeItem(MODERATOR_KEY);
  } catch (error) {
    console.error('Failed to clear moderator game:', error);
  }
}

/**
 * Save player game state
 */
export function savePlayerGame(gameId: string, playerId: string, playerName: string) {
  try {
    const state: PlayerGameState = {
      gameId,
      playerId,
      playerName,
      timestamp: Date.now(),
    };
    localStorage.setItem(PLAYER_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save player game:', error);
  }
}

/**
 * Get player game state
 */
export function getPlayerGame(): PlayerGameState | null {
  try {
    const stored = localStorage.getItem(PLAYER_KEY);
    if (!stored) return null;

    const state: PlayerGameState = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() - state.timestamp > EXPIRY_TIME) {
      clearPlayerGame();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to get player game:', error);
    return null;
  }
}

/**
 * Clear player game state
 */
export function clearPlayerGame() {
  try {
    localStorage.removeItem(PLAYER_KEY);
  } catch (error) {
    console.error('Failed to clear player game:', error);
  }
}

/**
 * Validates moderator game state against backend
 * Returns validated state or null if invalid
 */
export async function validateModeratorGameState(): Promise<ModeratorGameState | null> {
  const state = getModeratorGame();
  if (!state) return null;

  try {
    const { validateGameExists } = await import('./api');
    const gameExists = await validateGameExists(state.gameId);

    if (!gameExists) {
      clearModeratorGame();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to validate moderator game:', error);
    return state; // Return state anyway if validation fails (network error, etc.)
  }
}

/**
 * Validates player game state against backend
 * Returns validated state or null if invalid
 */
export async function validatePlayerGameState(): Promise<PlayerGameState | null> {
  const state = getPlayerGame();
  if (!state) return null;

  try {
    const { validatePlayerInGame } = await import('./api');
    const playerInGame = await validatePlayerInGame(state.gameId, state.playerId);

    if (!playerInGame) {
      clearPlayerGame();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to validate player game:', error);
    return state; // Return state anyway if validation fails (network error, etc.)
  }
}
