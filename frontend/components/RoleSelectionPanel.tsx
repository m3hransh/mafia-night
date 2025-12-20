'use client';

import { useState, useEffect } from 'react';
import { fetchRoles, Role } from '@/lib/api';

interface RoleSelectionPanelProps {
  playerCount: number;
  onRolesSelected: (selectedRoles: { roleId: string; count: number }[]) => void;
  onCancel: () => void;
}

export function RoleSelectionPanel({ playerCount, onRolesSelected, onCancel }: RoleSelectionPanelProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        setError('Failed to load roles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  const getTotalSelected = () => {
    return Array.from(selectedRoles.values()).reduce((sum, count) => sum + count, 0);
  };

  const getTeamCountMap = () => {
    return Array.from(selectedRoles.entries()).reduce((map: Record<string, number>, [roleId, count]) => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        if (!map[role.team]) {
          map[role.team] = 0;
        }
        map[role.team] += count;
      }
      return map;
    }, {});
  };

  const handleIncrement = (roleId: string) => {
    const current = selectedRoles.get(roleId) || 0;
    const newMap = new Map(selectedRoles);
    newMap.set(roleId, current + 1);
    setSelectedRoles(newMap);
  };

  const handleDecrement = (roleId: string) => {
    const current = selectedRoles.get(roleId) || 0;
    if (current > 0) {
      const newMap = new Map(selectedRoles);
      if (current === 1) {
        newMap.delete(roleId);
      } else {
        newMap.set(roleId, current - 1);
      }
      setSelectedRoles(newMap);
    }
  };

  const handleConfirm = () => {
    const rolesArray = Array.from(selectedRoles.entries()).map(([roleId, count]) => ({
      roleId,
      count,
    }));
    onRolesSelected(rolesArray);
  };

  const totalSelected = getTotalSelected();
  const isValid = totalSelected === playerCount;
  const remaining = playerCount - totalSelected;

  // Group roles by team
  const rolesByTeam = roles.reduce((acc, role) => {
    if (!acc[role.team]) {
      acc[role.team] = [];
    }
    acc[role.team].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  const teamColors = {
    mafia: 'red',
    village: 'green',
    independent: 'yellow',
  };

  const teamLabels = {
    mafia: 'Mafia Team',
    village: 'Village Team',
    independent: 'Independent',
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <div className="text-center text-purple-300">
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button onClick={onCancel}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Select Roles</h2>
        <div className="flex items-center justify-between">
          <p className="text-purple-300">
            Players: <span className="font-bold text-white">{playerCount}</span>
          </p>
          <div className={`text-xl font-bold ${isValid ? 'text-green-400' : remaining < 0 ? 'text-red-400'
            : 'text-yellow-400'}`}>
            {isValid ? '✓ Complete' : remaining > 0 ? `${remaining} more needed` : `${Math.abs(remaining)} too
                many`}
          </div>
        </div>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(rolesByTeam).map(([team, teamRoles]) => (
          <div key={team} className="space-y-3">
            <h3 className={`text-xl font-semibold text-${teamColors[team as keyof typeof teamColors]}-400 flex
                items-center gap-2`}>
              <span className={`w-3 h-3 rounded-full bg-${teamColors[team as keyof typeof teamColors]}-500`}></span>
              {teamLabels[team as keyof typeof teamLabels]}

              <span className={` bg-${teamColors[team as keyof typeof teamColors]}-400 text-white px-3 py-1 rounded-full  font-bold`}>
                {getTeamCountMap()[team] || 0}
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
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDecrement(role.id)}
                        disabled={count === 0}
                        className="bg-red-600/50 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed
                      text-white w-10 h-10 rounded-lg transition-all font-bold text-xl"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center text-2xl font-bold text-purple-300">
                        {count}
                      </div>
                      <button onClick={() => handleIncrement(role.id)}
                        className="bg-green-600/50 hover:bg-green-600 text-white w-10 h-10 rounded-lg transition-all
                      font-bold text-xl"
                      >
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
        <button onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold md:text-lg px-3 py-3 md:px-8 md:py-4 rounded-xl transition-all">
          Cancel
        </button>
        <button onClick={handleConfirm} disabled={!isValid}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 px-3 text-white font-bold md:text-lg md:px-8 md:py-4 rounded-xl transition-all transform hover:scale-105">
          Confirm Selection
        </button>
      </div>
    </div>
  );
        }
