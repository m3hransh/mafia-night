import { Button } from '@/components/Button';
import { Role } from '@/lib/api';

interface RoleListProps {
  roles: Role[];
  loading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (id: string, name: string) => void;
}

export function RoleList({ roles, loading, onEdit, onDelete }: RoleListProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        Roles ({roles.length})
      </h2>

      {loading ? (
        <div className="text-center py-8 text-purple-300">
          <p>Loading roles...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8 text-purple-300">
          <p>No roles found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-purple-500/30 text-purple-300">
                <th className="p-3">Name</th>
                <th className="p-3">Team</th>
                <th className="p-3 hidden md:table-cell">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr 
                  key={role.id} 
                  className="border-b border-purple-500/10 hover:bg-purple-900/10 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-semibold text-white">{role.name}</div>
                    <div className="text-xs text-purple-400 md:hidden">{role.team}</div>
                  </td>
                  <td className="p-3">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${role.team === 'mafia' ? 'bg-red-900/50 text-red-200' : 
                        role.team === 'village' ? 'bg-green-900/50 text-green-200' : 
                        'bg-yellow-900/50 text-yellow-200'}
                    `}>
                      {role.team}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-300 hidden md:table-cell max-w-xs truncate">
                    {role.description}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onEdit(role)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onDelete(role.id, role.name)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
