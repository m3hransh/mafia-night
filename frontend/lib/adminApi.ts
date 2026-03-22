// Admin API client functions

import { adminApiClient } from "./api-client";
import { saveAdminToken, saveAdminUser, AdminUser, LoginResponse } from "./adminAuth";
import { Role } from "./api";

// Auth API
export async function adminLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const { data, error } = await adminApiClient.POST("/admin/login", {
    body: { username, password },
  });

  if (error || !data) {
    throw new Error((error as { error?: string })?.error ?? "Login failed");
  }

  const result = data as LoginResponse;
  saveAdminToken(result.token);
  saveAdminUser(result.admin as AdminUser);

  return result;
}

// Admin Users CRUD
export async function listAdmins(): Promise<AdminUser[]> {
  const { data, error } = await adminApiClient.GET("/admin/users");

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to fetch admins"
    );
  }

  return (data as AdminUser[]) ?? [];
}

export async function getAdmin(id: string): Promise<AdminUser> {
  const { data, error } = await adminApiClient.GET("/admin/users/{id}", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to fetch admin"
    );
  }

  return data as AdminUser;
}

export async function createAdmin(
  username: string,
  email: string,
  password: string
): Promise<AdminUser> {
  const { data, error } = await adminApiClient.POST("/admin/users", {
    body: { username, email, password },
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to create admin"
    );
  }

  return data as AdminUser;
}

export async function updateAdmin(
  id: string,
  updates: {
    username?: string;
    email?: string;
    is_active?: boolean;
  }
): Promise<AdminUser> {
  const { data, error } = await adminApiClient.PATCH("/admin/users/{id}", {
    params: { path: { id } },
    body: updates as never,
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to update admin"
    );
  }

  return data as AdminUser;
}

export async function deleteAdmin(id: string): Promise<void> {
  const { error } = await adminApiClient.DELETE("/admin/users/{id}", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to delete admin"
    );
  }
}

export async function changePassword(
  id: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const { error } = await adminApiClient.POST(
    "/admin/users/{id}/change-password",
    {
      params: { path: { id } },
      body: { old_password: oldPassword, new_password: newPassword } as never,
    }
  );

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to change password"
    );
  }
}

// Role Management
export async function listRoles(): Promise<Role[]> {
  const { data, error } = await adminApiClient.GET("/admin/roles", {});

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to fetch roles"
    );
  }

  return (data as Role[]) ?? [];
}

export async function createRole(role: Omit<Role, "id">): Promise<Role> {
  const { data, error } = await adminApiClient.POST("/admin/roles", {
    body: role as never,
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to create role"
    );
  }

  return data as Role;
}

export async function updateRole(
  id: string,
  role: Partial<Role>
): Promise<Role> {
  const { data, error } = await adminApiClient.PATCH("/admin/roles/{id}", {
    params: { path: { id } },
    body: role as never,
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to update role"
    );
  }

  return data as Role;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await adminApiClient.DELETE("/admin/roles/{id}", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to delete role"
    );
  }
}

// Role Template Management — reads use GET endpoints (same handler as public routes)
export interface RoleTemplate {
  id: string;
  name: string;
  player_count: number;
  description: string;
  created_at: string;
  updated_at: string;
  roles: Array<{
    role_id?: string;
    count: number;
    role?: Role;
  }>;
}

export async function listRoleTemplates(): Promise<RoleTemplate[]> {
  const { data, error } = await adminApiClient.GET("/admin/role-templates", {});

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to fetch role templates"
    );
  }

  return (data as RoleTemplate[]) ?? [];
}

export async function getRoleTemplate(id: string): Promise<RoleTemplate> {
  const { data, error } = await adminApiClient.GET("/admin/role-templates/{id}", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to fetch role template"
    );
  }

  return data as RoleTemplate;
}

export async function createRoleTemplate(templateData: {
  name: string;
  player_count: number;
  description: string;
  roles: Array<{ role_id: string; count: number }>;
}): Promise<RoleTemplate> {
  const { data, error } = await adminApiClient.POST("/admin/role-templates", {
    body: templateData as never,
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to create role template"
    );
  }

  return data as RoleTemplate;
}

export async function updateRoleTemplate(
  id: string,
  updates: {
    name?: string;
    player_count?: number;
    description?: string;
    roles?: Array<{ role_id: string; count: number }>;
  }
): Promise<RoleTemplate> {
  const { data, error } = await adminApiClient.PATCH(
    "/admin/role-templates/{id}",
    {
      params: { path: { id } },
      body: updates as never,
    }
  );

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to update role template"
    );
  }

  return data as RoleTemplate;
}

export async function deleteRoleTemplate(id: string): Promise<void> {
  const { error } = await adminApiClient.DELETE("/admin/role-templates/{id}", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(
      (error as { error?: string })?.error ?? "Failed to delete role template"
    );
  }
}
