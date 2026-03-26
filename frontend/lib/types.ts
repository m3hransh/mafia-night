export interface Role {
  id: string;
  name: string;
  slug: string;
  video: string;
  description: string;
  team: "mafia" | "village" | "independent";
  abilities?: string[];
}

export interface Game {
  id: string;
  moderator_id: string;
  status: "waiting" | "active" | "finished";
  phase: 'waiting' | 'day' | 'night' | 'ended';
  round_number: number;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  game_id: string;
  created_at: string;
}

export interface PlayerRoleAssignment {
  player_id: string;
  player_name: string;
  role_id: string;
  role_name: string;
  role_slug: string;
  video: string;
  team: "mafia" | "village" | "independent";
  assigned_at: string;
}

export interface RoleTemplate {
  id: string;
  name: string;
  player_count: number;
  description: string;
  created_at: string;
  updated_at: string;
  roles: Array<SelectedRole>;
}

export interface SelectedRole {
  role_id?: string;
  count: number;
  role?: Role;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

export class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}
