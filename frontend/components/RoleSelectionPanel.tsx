'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Role, RoleTemplate } from '@/lib/types';
import { Button } from './Button';
import { useCreateGameContext } from '@/app/create-game/context';

export function RoleSelectionPanel() {
  const { state, handleRolesSelected, handleCancelRoleSelection, handleRolesChanged } = useCreateGameContext();
  const { selectedRoles, players } = state;
  const playerCount = players.length;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/roles', {});
      if (error) throw new Error('Failed to load roles');
      return (data as Role[]) ?? [];
    },
  });

  const { data: roleTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['role-templates'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/role-templates', {});
      if (error) throw new Error('Failed to load templates');
      return (data as RoleTemplate[]) ?? [];
    },
  });

  const loading = rolesLoading || templatesLoading;

  const totalSelected = useMemo(() => {
    return Array.from(selectedRoles.values()).reduce((sum, count) => sum + count, 0);
  }, [selectedRoles]);

  const teamCountMap = useMemo(() => {
    return Array.from(selectedRoles.entries()).reduce((map: Record<string, number>, [roleId, count]) => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        map[role.team] = (map[role.team] ?? 0) + count;
      }
      return map;
    }, {});
  }, [selectedRoles, roles]);

  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      handleRolesChanged(new Map());
      return;
    }
    const template = roleTemplates.find(t => t.id === templateId);
    if (template) {
      const newMap = new Map<string, number>();
      template.roles.forEach(r => newMap.set(r.role!.id, r.count));
      handleRolesChanged(newMap);
    }
  }, [roleTemplates, handleRolesChanged]);

  const handleIncrement = useCallback((roleId: string) => {
    const newMap = new Map(selectedRoles);
    newMap.set(roleId, (selectedRoles.get(roleId) ?? 0) + 1);
    handleRolesChanged(newMap);
  }, [selectedRoles, handleRolesChanged]);

  const handleDecrement = useCallback((roleId: string) => {
    const current = selectedRoles.get(roleId) ?? 0;
    if (current === 0) return;
    const newMap = new Map(selectedRoles);
    if (current === 1) newMap.delete(roleId);
    else newMap.set(roleId, current - 1);
    handleRolesChanged(newMap);
  }, [selectedRoles, handleRolesChanged]);

  const handleConfirm = useCallback(() => {
    handleRolesSelected(
      Array.from(selectedRoles.entries()).map(([roleId, count]) => ({ roleId, count }))
    );
  }, [selectedRoles, handleRolesSelected]);

  const isValid = totalSelected === playerCount;
  const remaining = playerCount - totalSelected;

  const rolesByTeam = roles.reduce((acc, role) => {
    if (!acc[role.team]) acc[role.team] = [];
    acc[role.team].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  const teamColors = { mafia: 'red', village: 'green', independent: 'yellow' };
  const teamLabels = { mafia: 'Mafia Team', village: 'Village Team', independent: 'Independent' };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <div className="text-center text-purple-300">
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Select Roles</h2>

        <div className="mb-4">
          <select
            value={selectedTemplateId}
            onChange={(e) => selectTemplate(e.target.value)}
            className="flex-1 bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a855f7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.5rem',
              paddingRight: '2.5rem',
            }}
          >
            <option value="" className="bg-black/95 text-gray-400">Select a template...</option>
            {roleTemplates.map(template => (
              <option key={template.id} value={template.id} className="bg-black/95 text-white py-2">
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-purple-300">
            Players: <span className="font-bold text-white">{playerCount}</span>
          </p>
          <div className={`text-xl font-bold ${isValid ? 'text-green-400' : remaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
            {isValid ? '✓ Complete' : remaining > 0 ? `${remaining} more needed` : `${Math.abs(remaining)} too many`}
          </div>
        </div>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(rolesByTeam).map(([team, teamRoles]) => (
          <div key={team} className="space-y-3">
            <h3 className={`text-xl font-semibold text-${teamColors[team as keyof typeof teamColors]}-400 flex items-center gap-2`}>
              <span className={`w-3 h-3 rounded-full bg-${teamColors[team as keyof typeof teamColors]}-500`} />
              {teamLabels[team as keyof typeof teamLabels]}
              <span className={`bg-${teamColors[team as keyof typeof teamColors]}-400 text-white px-3 py-1 rounded-full font-bold`}>
                {teamCountMap[team] || 0}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamRoles.map((role) => {
                const count = selectedRoles.get(role.id) || 0;
                return (
                  <div key={role.id}
                    className="bg-black/30 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{role.name}</span>
                      {count > 0 && (
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDecrement(role.id)} disabled={count === 0}
                        className="bg-red-600/50 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white w-10 h-10 rounded-lg transition-all font-bold text-xl">
                        −
                      </button>
                      <div className="flex-1 text-center text-2xl font-bold text-purple-300">{count}</div>
                      <button onClick={() => handleIncrement(role.id)}
                        className="bg-green-600/50 hover:bg-green-600 text-white w-10 h-10 rounded-lg transition-all font-bold text-xl">
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <Button onClick={handleCancelRoleSelection} variant="secondary">Cancel</Button>
        <Button onClick={handleConfirm} disabled={!isValid} variant="primary" scaleOnHover>
          Confirm Selection
        </Button>
      </div>
    </div>
  );
}
