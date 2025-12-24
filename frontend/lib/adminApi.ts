// Admin API client functions

import { getAdminToken, saveAdminToken, saveAdminUser, removeAdminToken, AdminUser, LoginResponse } from './adminAuth';
import { Role } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper function to make authenticated requests
async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAdminToken();

  const headers = new Headers(options.headers);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, clear token and redirect to login
  if (response.status === 401) {
    removeAdminToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  return response;
}

// Auth API
export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();

  // Save token and user info
  saveAdminToken(data.token);
  saveAdminUser(data.admin);

  return data;
}

// Admin Users CRUD
export async function listAdmins(): Promise<AdminUser[]> {
  const response = await adminFetch('/api/admin/users');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch admins');
  }

  return response.json();
}

export async function getAdmin(id: string): Promise<AdminUser> {
  const response = await adminFetch(`/api/admin/users/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch admin');
  }

  return response.json();
}

export async function createAdmin(username: string, email: string, password: string): Promise<AdminUser> {
  const response = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create admin');
  }

  return response.json();
}

export async function updateAdmin(
  id: string,
  data: {
    username?: string;
    email?: string;
    is_active?: boolean;
  }
): Promise<AdminUser> {
  const response = await adminFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update admin');
  }

  return response.json();
}

export async function deleteAdmin(id: string): Promise<void> {
  const response = await adminFetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete admin');
  }
}

export async function changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
  const response = await adminFetch(`/api/admin/users/${id}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }
}

// Role Management
export async function listRoles(): Promise<Role[]> {
  const response = await adminFetch('/api/admin/roles');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch roles');
  }

  return response.json();
}

export async function createRole(role: Omit<Role, 'id'>): Promise<Role> {
  const response = await adminFetch('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify(role),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create role');
  }

  return response.json();
}

export async function updateRole(id: string, role: Partial<Role>): Promise<Role> {
  const response = await adminFetch(`/api/admin/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(role),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update role');
  }

  return response.json();
}

export async function deleteRole(id: string): Promise<void> {
  const response = await adminFetch(`/api/admin/roles/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete role');
  }
}
