import { Button } from './Button';

interface PlayerRoleAssignment {
  player_id: string;
  player_name: string;
  role_id: string;
  role_name: string;
  team: string;
}

interface GameStartedProps {
  roleAssignments: PlayerRoleAssignment[];
  error: string;
  closing: boolean;
  onCloseGame: () => void;
}

export function GameStarted({ roleAssignments, error, closing, onCloseGame }: GameStartedProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
      <h2 className="text-3xl font-bold text-white mb-4 text-center">Roles Distributed!</h2>
      <p className="text-purple-300 mb-6 text-center">All players have been assigned their roles.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Display role assignments by team */}
      <div className="space-y-6 mb-8">
        {['mafia', 'village', 'independent'].map(team => {
          const teamAssignments = roleAssignments.filter(a => a.team === team);
          if (teamAssignments.length === 0) return null;

          const teamColors = {
            mafia: { bg: 'bg-red-900/30', border: 'border-red-500/30', text: 'text-red-400', label: 'Mafia Team' },
            village: { bg: 'bg-green-900/30', border: 'border-green-500/30', text: 'text-green-400', label: 'Village Team' },
            independent: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Independent' },
          };

          const colors = teamColors[team as keyof typeof teamColors];

          return (
            <div key={team} className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
              <h3 className={`text-2xl font-bold ${colors.text} mb-4`}>
                {colors.label} ({teamAssignments.length})
              </h3>
              <div className="space-y-3">
                {teamAssignments.map(assignment => (
                  <div key={assignment.player_id} className="bg-black/40 rounded-lg p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{assignment.player_name}</div>
                      <div className={`text-sm ${colors.text}`}>{assignment.role_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          onClick={onCloseGame}
          disabled={closing}
          variant="danger"
          size="lg"
        >
          {closing ? 'Closing...' : 'End Game'}
        </Button>
      </div>
    </div>
  );
}
