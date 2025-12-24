'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/Button';
import { RoleList } from '@/components/admin/RoleList';
import { RoleForm } from '@/components/admin/RoleForm';
import { listRoles, createRole, updateRole, deleteRole } from '@/lib/adminApi';
import { Role } from '@/lib/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(undefined);
    setShowForm(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleSubmit = async (roleData: Omit<Role, 'id'>) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, roleData);
      } else {
        await createRole(roleData);
      }
      setShowForm(false);
      loadRoles();
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete role "${name}"?`)) {
      return;
    }

    try {
      await deleteRole(id);
      loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  return (
    <AdminLayout 
      title="Role Management"
      actions={
        !showForm && (
          <Button onClick={handleCreate} variant="success" size="lg" className="w-full md:w-auto">
            Create New Role
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
        <RoleForm 
          initialData={editingRole} 
          onSubmit={handleSubmit} 
          onCancel={() => setShowForm(false)} 
        />
      ) : (
        <RoleList 
          roles={roles} 
          loading={loading} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}
    </AdminLayout>
  );
}
