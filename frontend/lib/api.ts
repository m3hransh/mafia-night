import { apiClient } from "./api-client";
export type { Role, Game, Player, PlayerRoleAssignment, RoleTemplate, AdminUser, LoginResponse } from "./types";
export { APIError } from "./types";
import type { Role, Player, PlayerRoleAssignment, RoleTemplate } from "./types";
import { APIError } from "./types";

/**
 * Fetches all roles from the backend API
 */
export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await apiClient.GET("/roles");

  if (error) {
    throw new APIError(500, "Failed to fetch roles");
  }

  return (data as Role[]) ?? [];
}

/**
 * Fetches all role templates from the backend API
 */
export async function fetchRoleTemplates(): Promise<RoleTemplate[]> {
  const { data, error } = await apiClient.GET("/role-templates");

  if (error) {
    throw new APIError(500, "Failed to fetch role templates");
  }

  return (data as RoleTemplate[]) ?? [];
}

/**
 * Fetches a single role by its slug from the backend API
 */
export async function fetchRoleBySlug(slug: string): Promise<Role> {
  const { data, error, response } = await apiClient.GET("/roles/{slug}", {
    params: { path: { slug } },
  });

  if (error) {
    throw new APIError(response.status, `Failed to fetch role: ${slug}`);
  }

  return data as Role;
}

/**
 * Validates if a game exists on the backend
 */
export async function validateGameExists(gameId: string): Promise<boolean> {
  try {
    const { response } = await apiClient.GET("/games/{id}", {
      params: { path: { id: gameId } },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validates if a player is still part of a game
 */
export async function validatePlayerInGame(
  gameId: string,
  playerId: string
): Promise<boolean> {
  try {
    const players = await fetchPlayers(gameId);
    return players.some((player) => player.id === playerId);
  } catch {
    return false;
  }
}

/**
 * Fetches all players in a game
 */
export async function fetchPlayers(gameId: string): Promise<Player[]> {
  const { data, error } = await apiClient.GET("/games/{id}/players", {
    params: { path: { id: gameId } },
  });

  if (error) {
    throw new APIError(500, "Failed to fetch players");
  }

  return (data as Player[]) ?? [];
}

/**
 * Deletes a game (moderator only)
 */
export async function deleteGame(
  gameId: string,
  moderatorId: string
): Promise<void> {
  const { error, response } = await apiClient.DELETE("/games/{id}", {
    params: {
      path: { id: gameId },
      header: { "X-Moderator-ID": moderatorId },
    },
  });

  if (error) {
    throw new APIError(response.status, "Failed to delete game");
  }
}

/**
 * Removes a player from a game
 */
export async function removePlayer(
  gameId: string,
  playerId: string
): Promise<void> {
  const { error, response } = await apiClient.DELETE(
    "/games/{id}/players/{player_id}",
    {
      params: { path: { id: gameId, player_id: playerId } },
    }
  );

  if (error) {
    throw new APIError(response.status, "Failed to remove player");
  }
}

/**
 * Selects roles for a game (persists without assigning to players).
 * Can be called multiple times to update the selection.
 */
export async function selectRoles(
  gameId: string,
  moderatorId: string,
  roles: { role_id: string; count: number }[]
): Promise<void> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetch(`${API_BASE_URL}/api/games/${gameId}/select-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Moderator-ID': moderatorId },
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new APIError(res.status, err.error || 'Failed to select roles');
  }
}

export interface SelectedRoleEntry {
  role_id: string;
  name: string;
  slug: string;
  team: 'mafia' | 'village' | 'independent';
  video: string;
  count: number;
}

/**
 * Gets the roles the moderator has selected but not yet distributed (public endpoint).
 */
export async function getSelectedRoles(gameId: string): Promise<SelectedRoleEntry[]> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetch(`${API_BASE_URL}/api/games/${gameId}/selected-roles`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Distributes roles to players
 */
export async function distributeRoles(
  gameId: string,
  moderatorId: string,
): Promise<void> {
  const { error, response } = await apiClient.POST(
    "/games/{id}/distribute-roles",
    {
      params: {
        path: { id: gameId },
        header: { "X-Moderator-ID": moderatorId },
      },
      body: {} as never,
    }
  );

  if (error) {
    throw new APIError(response.status, "Failed to distribute roles");
  }
}

/**
 * Gets all role assignments for a game (moderator only)
 */
export async function getGameRoles(
  gameId: string,
  moderatorId: string
): Promise<PlayerRoleAssignment[]> {
  const { data, error } = await apiClient.GET("/games/{id}/roles", {
    params: {
      path: { id: gameId },
      header: { "X-Moderator-ID": moderatorId },
    },
  });

  if (error) {
    throw new APIError(500, "Failed to fetch game roles");
  }

  return (data as PlayerRoleAssignment[]) ?? [];
}

/**
 * Gets the assigned role for a specific player
 */
export async function getPlayerRole(
  gameId: string,
  playerId: string
): Promise<Role | null> {
  const { data, response } = await apiClient.GET(
    "/games/{id}/players/{player_id}/role",
    {
      params: { path: { id: gameId, player_id: playerId } },
    }
  );

  if (!response.ok) {
    return null;
  }

  return (data as Role) ?? null;
}

export async function joinGame(
  gameCode: string,
  playerName: string
): Promise<Player> {
  const { data, error, response } = await apiClient.POST("/games/{id}/join", {
    params: { path: { id: gameCode } },
    body: { name: playerName },
  });

  if (error) {
    if (response.status === 404) {
      throw new APIError(response.status, "Game not found");
    }
    if (response.status === 409) {
      throw new APIError(response.status, "Player already exists");
    }
    throw new APIError(response.status, "Failed to join game");
  }

  return data as Player;
}

// ── Phase management ──────────────────────────────────────────────────────────

export interface PhaseResult {
  phase: 'waiting' | 'day' | 'night' | 'ended';
  round_number: number;
  round_id?: string;
}

async function phaseRequest(gameId: string, moderatorId: string, endpoint: string): Promise<PhaseResult> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetch(`${API_BASE_URL}/api/games/${gameId}/${endpoint}`, {
    method: 'POST',
    headers: { 'X-Moderator-ID': moderatorId },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new APIError(res.status, err.error || `Failed to ${endpoint}`);
  }
  return res.json();
}

export async function startDay(gameId: string, moderatorId: string): Promise<PhaseResult> {
  return phaseRequest(gameId, moderatorId, 'start-day');
}

export async function startNight(gameId: string, moderatorId: string): Promise<PhaseResult> {
  return phaseRequest(gameId, moderatorId, 'start-night');
}

export async function endGame(gameId: string, moderatorId: string): Promise<PhaseResult> {
  return phaseRequest(gameId, moderatorId, 'end-game');
}
