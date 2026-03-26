'use client';

import type { ReactNode } from 'react';
import type { SelectedRoleEntry } from '@/lib/api';

interface SelectedRolesDisplayProps {
  roles: SelectedRoleEntry[];
  title?: string;
  /** Content rendered in the top-right badge area. Defaults to a "{n} roles" blue badge. */
  badge?: ReactNode;
  /** Content rendered below the role grid. Defaults to the "Waiting for moderator…" pulse line. Pass null to hide. */
  footer?: ReactNode;
}

const teamColors = { mafia: 'red', village: 'green', independent: 'yellow' } as const;
const teamLabels = { mafia: 'Mafia Team', village: 'Village Team', independent: 'Independent' };

export function SelectedRolesDisplay({
  roles,
  title = 'Roles Selected',
  badge,
  footer,
}: SelectedRolesDisplayProps) {
  if (roles.length === 0) return null;

  const rolesByTeam = roles.reduce((acc, role) => {
    if (!acc[role.team]) acc[role.team] = [];
    acc[role.team].push(role);
    return acc;
  }, {} as Record<string, SelectedRoleEntry[]>);

  const totalCount = roles.reduce((sum, r) => sum + r.count, 0);

  const defaultBadge = (
    <span className="bg-blue-500/20 text-blue-300 text-sm font-semibold px-3 py-1 rounded-full">
      {totalCount} role{totalCount !== 1 ? 's' : ''}
    </span>
  );

  const defaultFooter = (
    <> </>
  );

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-blue-500/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {badge !== undefined ? badge : defaultBadge}
      </div>

      <div className="space-y-6">
        {Object.entries(rolesByTeam).map(([team, teamRoles]) => {
          const color = teamColors[team as keyof typeof teamColors];
          const label = teamLabels[team as keyof typeof teamLabels];
          const teamTotal = teamRoles.reduce((sum, r) => sum + r.count, 0);
          return (
            <div key={team} className="space-y-3">
              <h3 className={`text-lg font-semibold text-${color}-400 flex items-center gap-2`}>
                <span className={`w-3 h-3 rounded-full bg-${color}-500`} />
                {label}
                <span className={`bg-${color}-400 text-white px-3 py-1 rounded-full text-sm font-bold`}>
                  {teamTotal}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamRoles.map((role) => (
                  <div
                    key={role.role_id}
                    className={`bg-black/30 rounded-lg p-4 border border-${color}-500/20 flex items-center justify-between`}
                  >
                    <span className="text-white font-semibold">{role.name}</span>
                    <span className={`bg-${color}-600/50 text-white px-3 py-1 rounded-full text-sm font-bold`}>
                      ×{role.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {footer !== undefined ? footer : defaultFooter}
    </div>
  );
}
