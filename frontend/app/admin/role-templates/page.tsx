'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/Button';
import { RoleTemplateList } from '@/components/admin/RoleTemplateList';
import { RoleTemplateForm } from '@/components/admin/RoleTemplateForm';
import { adminApiClient } from '@/lib/api-client';
import type { Role, RoleTemplate } from '@/lib/types';

function apiErr(err: unknown, fallback: string): string {
  return (err as { error?: string })?.error ?? fallback;
}

type TemplateFormData = {
  name: string;
  player_count: number;
  description: string;
  roles: Array<{ role_id: string; count: number }>;
};

export default function RoleTemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | undefined>(undefined);

  // Reuses cache populated by admin/roles page — no duplicate fetch if already loaded
  const { data: roles = [] } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const { data, error } = await adminApiClient.GET('/admin/roles', {});
      if (error) throw new Error(apiErr(error, 'Failed to load roles'));
      return (data as Role[]) ?? [];
    },
  });

  const { data: templates = [], isLoading, error: loadError } = useQuery({
    queryKey: ['admin', 'role-templates'],
    queryFn: async () => {
      const { data, error } = await adminApiClient.GET('/admin/role-templates', {});
      if (error) throw new Error(apiErr(error, 'Failed to load templates'));
      return (data as RoleTemplate[]) ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'role-templates'] });

  const createMutation = useMutation({
    mutationFn: async (templateData: TemplateFormData) => {
      const { error } = await adminApiClient.POST('/admin/role-templates', {
        body: templateData as never,
      });
      if (error) throw new Error(apiErr(error, 'Failed to create template'));
    },
    onSuccess: () => { setShowForm(false); invalidate(); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      const { error } = await adminApiClient.PATCH('/admin/role-templates/{id}', {
        params: { path: { id } },
        body: data as never,
      });
      if (error) throw new Error(apiErr(error, 'Failed to update template'));
    },
    onSuccess: () => { setShowForm(false); invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await adminApiClient.DELETE('/admin/role-templates/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error(apiErr(error, 'Failed to delete template'));
    },
    onSuccess: invalidate,
  });

  // Throws so RoleTemplateForm can display the error inline
  const handleSubmit = async (templateData: TemplateFormData) => {
    if (editingTemplate) {
      await updateMutation.mutateAsync({ id: editingTemplate.id, data: templateData });
    } else {
      await createMutation.mutateAsync(templateData);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const deleteError =
    deleteMutation.error instanceof Error ? deleteMutation.error.message : null;

  return (
    <AdminLayout
      title="Role Template Management"
      actions={
        !showForm && (
          <Button
            onClick={() => { setEditingTemplate(undefined); setShowForm(true); }}
            variant="success"
            size="lg"
            className="w-full md:w-auto"
          >
            Create New Template
          </Button>
        )
      }
    >
      {loadError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {loadError instanceof Error ? loadError.message : 'Failed to load data'}
        </div>
      )}
      {deleteError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {deleteError}
        </div>
      )}

      {showForm ? (
        <RoleTemplateForm
          initialData={editingTemplate}
          availableRoles={roles}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <RoleTemplateList
          templates={templates}
          loading={isLoading}
          onEdit={(t) => { setEditingTemplate(t); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
}

