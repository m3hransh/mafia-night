'use client';

import { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { GradientBackground } from '@/components/GradientBackground';
import { Button } from '@/components/Button';
import { getAdminUser, adminLogout, AdminUser } from '@/lib/adminAuth';
import { listAdmins, createAdmin, deleteAdmin, updateAdmin } from '@/lib/adminApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminCreateForm } from '@/components/admin/AdminCreateForm';
import { AdminList } from '@/components/admin/AdminList';

export default function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}

function AdminDashboardContent() {
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
      const data = await listAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (username: string, email: string, password: string) => {
    await createAdmin(username, email, password);
    setShowCreateForm(false);
    await loadAdmins();
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete admin "${username}"?`)) {
      return;
    }

    try {
      await deleteAdmin(id);
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      await updateAdmin(admin.id, { is_active: !admin.is_active });
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      adminLogout();
    }
  };

  return (
    <main className="relative w-full min-h-screen p-4 md:p-8">
      <GradientBackground />

      <div className="max-w-6xl mx-auto relative z-10">
        <AdminHeader 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm md:text-base">
            {error}
          </div>
        )}

        {/* Actions */}
        {!showCreateForm && (
          <div className="mb-6">
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="success"
              size="lg"
              className="w-full md:w-auto"
            >
              Create New Admin
            </Button>
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
      </div>
    </main>
  );
}
