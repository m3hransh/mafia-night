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
