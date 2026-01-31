'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/Button';
import { RoleTemplateList } from '@/components/admin/RoleTemplateList';
import { RoleTemplateForm } from '@/components/admin/RoleTemplateForm';
import {
  listRoleTemplates,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
  listRoles,
  RoleTemplate,
} from '@/lib/adminApi';
import { Role } from '@/lib/api';

export default function RoleTemplatesPage() {
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [templatesData, rolesData] = await Promise.all([
        listRoleTemplates(),
        listRoles(),
      ]);
      setTemplates(templatesData);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setShowForm(true);
  };

  const handleEdit = (template: RoleTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleSubmit = async (templateData: {
    name: string;
    player_count: number;
    description: string;
    roles: Array<{ role_id: string; count: number }>;
  }) => {
    try {
      if (editingTemplate) {
        await updateRoleTemplate(editingTemplate.id, templateData);
      } else {
        await createRoleTemplate(templateData);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) {
      return;
    }

    try {
      await deleteRoleTemplate(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  return (
    <AdminLayout
      title="Role Template Management"
      actions={
        !showForm && (
          <Button onClick={handleCreate} variant="success" size="lg" className="w-full md:w-auto">
            Create New Template
          </Button>
        )
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
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
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
}
