'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/Button';
import { getAdminUser } from '@/lib/adminAuth';
import { adminApiClient } from '@/lib/api-client';
import type { AdminUser } from '@/lib/types';
import { AdminCreateForm } from '@/components/admin/AdminCreateForm';
import { AdminList } from '@/components/admin/AdminList';

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const user = getAdminUser();
    setCurrentUser(user);
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await adminApiClient.GET("/admin/users");
      if (error) throw new Error((error as { error?: string })?.error ?? 'Failed to load admins');
      setAdmins((data as AdminUser[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (username: string, email: string, password: string) => {
    const { error } = await adminApiClient.POST("/admin/users", {
      body: { username, email, password },
    });
    if (error) throw new Error((error as { error?: string })?.error ?? 'Failed to create admin');
    setShowCreateForm(false);
    await loadAdmins();
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete admin "${username}"?`)) {
      return;
    }

    try {
      const { error } = await adminApiClient.DELETE("/admin/users/{id}", {
        params: { path: { id } },
      });
      if (error) throw new Error((error as { error?: string })?.error ?? 'Failed to delete admin');
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      const { error } = await adminApiClient.PATCH("/admin/users/{id}", {
        params: { path: { id: admin.id } },
        body: { is_active: !admin.is_active } as never,
      });
      if (error) throw new Error((error as { error?: string })?.error ?? 'Failed to update admin');
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin');
    }
  };

  return (
    <AdminLayout 
      title="Admin Management"
      actions={
        !showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="success"
            size="lg"
            className="w-full md:w-auto"
          >
            Create New Admin
          </Button>
        )
      }
    >
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm md:text-base">
          {error}
        </div>
      )}

      {/* Create Admin Form */}
      {showCreateForm && (
        <AdminCreateForm 
          onCreate={handleCreateAdmin} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}

      {/* Admins List */}
      <AdminList 
        admins={admins}
        currentUser={currentUser}
        loading={loading}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteAdmin}
      />
    </AdminLayout>
  );
}
