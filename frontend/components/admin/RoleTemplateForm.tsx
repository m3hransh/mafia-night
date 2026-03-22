import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { RoleTemplate, Role } from '@/lib/types';

interface RoleTemplateFormProps {
  initialData?: RoleTemplate;
  availableRoles: Role[];
  onSubmit: (data: {
    name: string;
    player_count: number;
    description: string;
    roles: Array<{ role_id: string; count: number }>;
  }) => Promise<void>;
  onCancel: () => void;
}

interface RoleAssignment {
  role_id: string;
  count: number;
}

type FormValues = {
  name: string;
  player_count: number;
  description: string;
};

export function RoleTemplateForm({ initialData, availableRoles, onSubmit, onCancel }: RoleTemplateFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initialData
      ? {
          name: initialData.name,
          player_count: initialData.player_count,
          description: initialData.description,
        }
      : { name: '', player_count: 0, description: '' },
  });

  // Role assignment UI state — managed outside RHF since it uses custom button interactions
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(() => {
    if (!initialData) return [];
    return initialData.roles
      .map(r => ({ role_id: r.role_id || r.role?.id || '', count: r.count }))
      .filter(r => r.role_id);
  });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleCount, setRoleCount] = useState(1);
  const [submitError, setSubmitError] = useState('');

  const playerCount = watch('player_count');
  const totalAssignedRoles = roleAssignments.reduce((sum, r) => sum + r.count, 0);

  const onFormSubmit = handleSubmit(async (values) => {
    if (roleAssignments.length === 0) {
      setSubmitError('At least one role is required');
      return;
    }
    if (totalAssignedRoles !== Number(values.player_count)) {
      setSubmitError(`Total role count (${totalAssignedRoles}) must equal player count (${values.player_count})`);
      return;
    }
    setSubmitError('');
    try {
      await onSubmit({
        name: values.name.trim(),
        player_count: Number(values.player_count),
        description: values.description.trim(),
        roles: roleAssignments,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save role template');
    }
  });

  const addRole = () => {
    if (!selectedRoleId || roleCount <= 0) return;
    const existingIndex = roleAssignments.findIndex(r => r.role_id === selectedRoleId);
    if (existingIndex >= 0) {
      const updated = [...roleAssignments];
      updated[existingIndex].count += roleCount;
      setRoleAssignments(updated);
    } else {
      setRoleAssignments([...roleAssignments, { role_id: selectedRoleId, count: roleCount }]);
    }
    setSelectedRoleId('');
    setRoleCount(1);
  };

  const removeRole = (roleId: string) => setRoleAssignments(roleAssignments.filter(r => r.role_id !== roleId));

  const updateRoleCount = (roleId: string, newCount: number) => {
    if (newCount <= 0) return;
    setRoleAssignments(roleAssignments.map(r => r.role_id === roleId ? { ...r, count: newCount } : r));
  };

  const getRoleName = (roleId: string) => availableRoles.find(r => r.id === roleId)?.name || 'Unknown Role';

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          {initialData ? 'Edit Role Template' : 'Create New Role Template'}
        </h2>
        <button onClick={onCancel} className="text-purple-400 hover:text-white transition-colors">✕</button>
      </div>

      <form onSubmit={onFormSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Template Name</label>
            <input
              {...register('name', { required: 'Template name is required' })}
              placeholder="e.g., Standard 10 Player"
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Player Count</label>
            <input
              type="number"
              {...register('player_count', { required: 'Player count is required', min: { value: 1, message: 'Must be at least 1' } })}
              min="1"
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
            {errors.player_count && <p className="text-red-400 text-sm mt-1">{errors.player_count.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description</label>
          <textarea
            {...register('description')}
            placeholder="Describe this template's gameplay style..."
            className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Role Assignments
            {playerCount > 0 && (
              <span className={`ml-2 text-sm ${totalAssignedRoles === Number(playerCount) ? 'text-green-400' : 'text-yellow-400'}`}>
                ({totalAssignedRoles}/{playerCount} assigned)
              </span>
            )}
          </label>

          <div className="bg-black/30 rounded-lg p-4 mb-3 border border-purple-500/20">
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="flex-1 bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a855f7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5rem',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="" className="bg-black/95 text-gray-400">Select a role...</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id} className="bg-black/95 text-white py-2">
                    {role.name} ({role.team})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={roleCount}
                  onChange={(e) => setRoleCount(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-20 bg-black/50 border border-purple-500/50 rounded-lg px-3 py-3 text-white text-center focus:outline-none focus:border-purple-400"
                />
                <Button type="button" onClick={addRole} variant="secondary" size="sm" disabled={!selectedRoleId} className="whitespace-nowrap">
                  Add Role
                </Button>
              </div>
            </div>

            {roleAssignments.length > 0 && (
              <div className="space-y-2">
                {roleAssignments.map((assignment) => (
                  <div key={assignment.role_id} className="flex items-center gap-3 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                    <span className="flex-1 text-white">{getRoleName(assignment.role_id)}</span>
                    <input
                      type="number"
                      value={assignment.count}
                      onChange={(e) => updateRoleCount(assignment.role_id, parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-16 bg-black/50 border border-purple-500/50 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-purple-400"
                    />
                    <button type="button" onClick={() => removeRole(assignment.role_id)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">{submitError}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting} variant="success" size="lg" className="w-full sm:w-auto">
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Template' : 'Create Template')}
          </Button>
          <Button type="button" onClick={onCancel} variant="secondary" size="lg" className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
