import { Button } from '@/components/Button';
import { AdminUser } from '@/lib/adminAuth';

interface AdminListProps {
  admins: AdminUser[];
  currentUser: AdminUser | null;
  loading: boolean;
  onToggleActive: (admin: AdminUser) => void;
  onDelete: (id: string, username: string) => void;
}

export function AdminList({ admins, currentUser, loading, onToggleActive, onDelete }: AdminListProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        Admin Users ({admins.length})
      </h2>

      {loading ? (
        <div className="text-center py-8 text-purple-300">
          <p>Loading admins...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-8 text-purple-300">
          <p>No admins found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="bg-black/30 rounded-lg p-4 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                  <span className="text-white font-semibold text-lg break-all">
                    {admin.username}
                  </span>
                  {admin.id === currentUser?.id && (
                    <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-300 whitespace-nowrap">
                      You
                    </span>
                  )}
                  {!admin.is_active && (
                    <span className="text-xs bg-red-500/30 px-2 py-1 rounded-full text-red-300 whitespace-nowrap">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-purple-400 break-all">{admin.email}</p>
                <div className="flex flex-col sm:flex-row sm:gap-4 mt-2 text-xs text-purple-500">
                  <span>Created: {new Date(admin.created_at).toLocaleDateString()}</span>
                  {admin.last_login && (
                    <span>Last login: {new Date(admin.last_login).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2 md:mt-0">
                <Button
                  onClick={() => onToggleActive(admin)}
                  variant={admin.is_active ? 'secondary' : 'success'}
                  size="sm"
                  className="flex-1 md:flex-none"
                >
                  {admin.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => onDelete(admin.id, admin.username)}
                  variant="danger"
                  size="sm"
                  disabled={admin.id === currentUser?.id}
                  className="flex-1 md:flex-none"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
