import { Button } from '@/components/Button';
import { RoleTemplate } from '@/lib/adminApi';

interface RoleTemplateListProps {
  templates: RoleTemplate[];
  loading: boolean;
  onEdit: (template: RoleTemplate) => void;
  onDelete: (id: string, name: string) => void;
}

export function RoleTemplateList({ templates, loading, onEdit, onDelete }: RoleTemplateListProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        Role Templates ({templates.length})
      </h2>

      {loading ? (
        <div className="text-center py-8 text-purple-300">
          <p>Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-purple-300">
          <p>No templates found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-purple-500/30 text-purple-300">
                <th className="p-3">Name</th>
                <th className="p-3">Players</th>
                <th className="p-3 hidden md:table-cell">Roles</th>
                <th className="p-3 hidden lg:table-cell">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr 
                  key={template.id} 
                  className="border-b border-purple-500/10 hover:bg-purple-900/10 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-semibold text-white">{template.name}</div>
                    <div className="text-xs text-purple-400 md:hidden">
                      {template.player_count} players
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200">
                      {template.player_count} players
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-300 hidden md:table-cell">
                    {template.roles?.length || 0} roles
                  </td>
                  <td className="p-3 text-sm text-gray-300 hidden lg:table-cell max-w-xs truncate">
                    {template.description || '-'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onEdit(template)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onDelete(template.id, template.name)}
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
