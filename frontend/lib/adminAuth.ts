// Admin authentication utilities

const ADMIN_TOKEN_KEY = 'mafia_admin_token';
const ADMIN_USER_KEY = 'mafia_admin_user';

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

// Token management
export const saveAdminToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
};

export const getAdminToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return null;
};

export const removeAdminToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }
};

// User management
export const saveAdminUser = (user: AdminUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  }
};

export const getAdminUser = (): AdminUser | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Check if admin is authenticated
export const isAdminAuthenticated = (): boolean => {
  return getAdminToken() !== null && getAdminUser() !== null;
};

// Logout
export const adminLogout = () => {
  removeAdminToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/login';
  }
};
