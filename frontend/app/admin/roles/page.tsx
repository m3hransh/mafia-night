'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/Button';
import { RoleList } from '@/components/admin/RoleList';
import { RoleForm } from '@/components/admin/RoleForm';
import { adminApiClient } from '@/lib/api-client';
import type { Role } from '@/lib/types';

function apiErr(err: unknown, fallback: string): string {
  return (err as { error?: string })?.error ?? fallback;
}

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  const { data: roles = [], isLoading, error: loadError } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const { data, error } = await adminApiClient.GET('/admin/roles', {});
      if (error) throw new Error(apiErr(error, 'Failed to load roles'));
      return (data as Role[]) ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });

  const createMutation = useMutation({
    mutationFn: async (roleData: Omit<Role, 'id'>) => {
      const { error } = await adminApiClient.POST('/admin/roles', {
        body: roleData as never,
      });
      if (error) throw new Error(apiErr(error, 'Failed to create role'));
    },
    onSuccess: () => { setShowForm(false); invalidate(); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Role, 'id'> }) => {
      const { error } = await adminApiClient.PATCH('/admin/roles/{id}', {
        params: { path: { id } },
        body: data as never,
      });
      if (error) throw new Error(apiErr(error, 'Failed to update role'));
    },
    onSuccess: () => { setShowForm(false); invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await adminApiClient.DELETE('/admin/roles/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error(apiErr(error, 'Failed to delete role'));
    },
    onSuccess: invalidate,
  });

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  // Throws on error so RoleForm can display it inline
  const handleSubmit = async (roleData: Omit<Role, 'id'>) => {
    if (editingRole) {
      await updateMutation.mutateAsync({ id: editingRole.id, data: roleData });
    } else {
      await createMutation.mutateAsync(roleData);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete role "${name}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const deleteError = deleteMutation.error instanceof Error
    ? deleteMutation.error.message
    : null;

  return (
    <AdminLayout
      title="Role Management"
      actions={
        !showForm && (
          <Button
            onClick={() => { setEditingRole(undefined); setShowForm(true); }}
            variant="success"
            size="lg"
            className="w-full md:w-auto"
          >
            Create New Role
          </Button>
        )
      }
    >
      {loadError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {loadError instanceof Error ? loadError.message : 'Failed to load roles'}
        </div>
      )}
      {deleteError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {deleteError}
        </div>
      )}

      {showForm ? (
        <RoleForm
          initialData={editingRole}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <RoleList
          roles={roles}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
}

