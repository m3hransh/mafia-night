'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/Button';
import { getAdminUser } from '@/lib/adminAuth';
import { adminApiClient } from '@/lib/api-client';
import type { AdminUser } from '@/lib/types';
import { AdminCreateForm } from '@/components/admin/AdminCreateForm';
import { AdminList } from '@/components/admin/AdminList';

function apiErr(err: unknown, fallback: string): string {
  return (err as { error?: string })?.error ?? fallback;
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const currentUser = getAdminUser();

  const { data: admins = [], isLoading, error: loadError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await adminApiClient.GET('/admin/users', {});
      if (error) throw new Error(apiErr(error, 'Failed to load admins'));
      return (data as AdminUser[]) ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const createMutation = useMutation({
    mutationFn: async ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => {
      const { error } = await adminApiClient.POST('/admin/users', {
        body: { username, email, password },
      });
      if (error) throw new Error(apiErr(error, 'Failed to create admin'));
    },
    onSuccess: () => { setShowCreateForm(false); invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await adminApiClient.DELETE('/admin/users/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error(apiErr(error, 'Failed to delete admin'));
    },
    onSuccess: invalidate,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (admin: AdminUser) => {
      const { error } = await adminApiClient.PATCH('/admin/users/{id}', {
        params: { path: { id: admin.id } },
        body: { is_active: !admin.is_active } as never,
      });
      if (error) throw new Error(apiErr(error, 'Failed to update admin'));
    },
    onSuccess: invalidate,
  });

  // Throws so AdminCreateForm can display the error inline
  const handleCreateAdmin = async (username: string, email: string, password: string) => {
    await createMutation.mutateAsync({ username, email, password });
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete admin "${username}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleToggleActive = async (admin: AdminUser) => {
    await toggleActiveMutation.mutateAsync(admin);
  };

  const mutationError =
    (deleteMutation.error ?? toggleActiveMutation.error) instanceof Error
      ? (deleteMutation.error ?? toggleActiveMutation.error)!.message
      : null;

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
      {(loadError || mutationError) && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm md:text-base">
          {loadError instanceof Error ? loadError.message : mutationError}
        </div>
      )}

      {showCreateForm && (
        <AdminCreateForm
          onCreate={handleCreateAdmin}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <AdminList
        admins={admins}
        currentUser={currentUser}
        loading={isLoading}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteAdmin}
      />
    </AdminLayout>
  );
}

