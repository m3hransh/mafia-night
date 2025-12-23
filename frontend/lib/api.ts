const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Role {
  id: string;
  name: string;
  slug: string;
  video: string;
  description: string;
  team: 'mafia' | 'village' | 'independent';
  abilities?: string[];
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Fetches all roles from the backend API
 */
export async function fetchRoles(): Promise<Role[]> {
  const response = await fetch(`${API_BASE_URL}/api/roles`);

  if (!response.ok) {
    throw new APIError(response.status, 'Failed to fetch roles');
  }

  return response.json();
}

/**
 * Fetches a single role by its slug from the backend API
 */
export async function fetchRoleBySlug(slug: string): Promise<Role> {
  const response = await fetch(`${API_BASE_URL}/api/roles/${slug}`);

  if (!response.ok) {
    throw new APIError(response.status, `Failed to fetch role: ${slug}`);
  }

  return response.json();
}

// Game-related types and functions

export interface Game {
  id: string;
  moderator_id: string;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  game_id: string;
  created_at: string;
}

/**
 * Validates if a game exists on the backend
 */
export async function validateGameExists(gameId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
    return response.ok;
  } catch (error) {
    console.error('Failed to validate game:', error);
    return false;
  }
}

/**
 * Validates if a player is still part of a game
 */
export async function validatePlayerInGame(gameId: string, playerId: string): Promise<boolean> {
  try {
    const players = await fetchPlayers(gameId);
    return players.some(player => player.id === playerId);
  } catch (error) {
    console.error('Failed to validate player in game:', error);
    return false;
  }
}

/**
 * Fetches all players in a game
 */
export async function fetchPlayers(gameId: string): Promise<Player[]> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/players`);

  if (!response.ok) {
    throw new APIError(response.status, 'Failed to fetch players');
  }

  return response.json();
}

/**
 * Deletes a game (moderator only)
 */
export async function deleteGame(gameId: string, moderatorId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
    method: 'DELETE',
    headers: {
      'X-Moderator-ID': moderatorId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new APIError(response.status, error || 'Failed to delete game');
  }
}

/**
 * Removes a player from a game
 */
export async function removePlayer(gameId: string, playerId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/players/${playerId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new APIError(response.status, error || 'Failed to remove player');
  }
}

/**
 * Distributes roles to players
 */
export async function distributeRoles(
  gameId: string,
  moderatorId: string,
  roles: { role_id: string; count: number }[]
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/distribute-roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Moderator-ID': moderatorId,
    },
    body: JSON.stringify({ roles }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new APIError(response.status, error || 'Failed to distribute roles');
  }
}

export interface PlayerRoleAssignment {
  player_id: string;
  player_name: string;
  role_id: string;
  role_name: string;
  role_slug: string;
  video: string;
  team: 'mafia' | 'village' | 'independent';
  assigned_at: string;
}

/**
 * Gets all role assignments for a game (moderator only)
 */
export async function getGameRoles(gameId: string, moderatorId: string): Promise<PlayerRoleAssignment[]> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/roles`, {
    headers: {
      'X-Moderator-ID': moderatorId,
    },
  });

  if (!response.ok) {
    throw new APIError(response.status, 'Failed to fetch game roles');
  }

  return response.json();
}

/**
 * Gets the assigned role for a specific player
 */
export async function getPlayerRole(gameId: string, playerId: string): Promise<Role | null> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/players/${playerId}/role`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function joinGame(gameCode: string, playerName: string): Promise<Player> {
      const response = await fetch(`${API_BASE_URL}/api/games/${gameCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new APIError(response.status, 'Game not found');
        }
       if (response.status == 409){
         throw new APIError(response.status, 'Player already exists');  
        }
        throw new APIError(response.status, 'Failed to join game'); 
      }

      const player = await response.json();
      return player;
}
