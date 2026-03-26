import { Button } from './Button';
import { useCreateGameContext } from '@/app/create-game/context';

const PHASE_LABELS: Record<string, { icon: string; label: string; desc: string }> = {
  waiting: { icon: '⏳', label: 'Waiting', desc: 'Game is waiting to begin' },
  day:     { icon: '☀️', label: 'Day',     desc: 'Discussion and voting phase' },
  night:   { icon: '🌙', label: 'Night',   desc: 'Night actions phase' },
  ended:   { icon: '🏁', label: 'Ended',   desc: 'Game is over' },
};

export function GameStarted() {
  const { state, closeGame, handleStartDay, handleStartNight, handleEndGame } = useCreateGameContext();
  const { roleAssignments, error, closing, dayNightPhase, roundNumber, players } = state;

  const alive = players.length; // TODO: update when eliminations land

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30 space-y-6">
      <h2 className="text-3xl font-bold text-white text-center">Game in Progress</h2>

      {/* Phase status bar */}
      <div className="flex items-center justify-between bg-black/50 rounded-xl px-6 py-4 border border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{PHASE_LABELS[dayNightPhase]?.icon}</span>
          <div>
            <div className="text-white font-bold text-lg">{PHASE_LABELS[dayNightPhase]?.label}</div>
            <div className="text-purple-300 text-sm">{PHASE_LABELS[dayNightPhase]?.desc}</div>
          </div>
        </div>
        <div className="text-right">
          {roundNumber > 0 && (
            <div className="text-white/70 text-sm">Round <span className="text-white font-bold">{roundNumber}</span></div>
          )}
          <div className="text-white/70 text-sm">{alive} player{alive !== 1 ? 's' : ''} alive</div>
        </div>
      </div>

      {/* Phase controls */}
      {dayNightPhase !== 'ended' && (
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={handleStartDay}
            disabled={dayNightPhase === 'day'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all
              bg-amber-500/20 border border-amber-500/40 text-amber-300
              hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ☀️ Start Day
          </button>
          <button
            onClick={handleStartNight}
            disabled={dayNightPhase === 'night'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all
              bg-indigo-500/20 border border-indigo-500/40 text-indigo-300
              hover:bg-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🌙 Start Night
          </button>
          <button
            onClick={handleEndGame}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all
              bg-red-500/20 border border-red-500/40 text-red-300
              hover:bg-red-500/30"
          >
            🏁 End Game
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Role assignments by team */}
      <div className="space-y-4">
        {['mafia', 'village', 'independent'].map(team => {
          const teamAssignments = roleAssignments.filter(a => a.team === team);
          if (teamAssignments.length === 0) return null;

          const teamColors = {
            mafia:       { bg: 'bg-red-900/30',    border: 'border-red-500/30',    text: 'text-red-400',    label: 'Mafia Team' },
            village:     { bg: 'bg-green-900/30',  border: 'border-green-500/30',  text: 'text-green-400',  label: 'Village Team' },
            independent: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Independent' },
          };
          const colors = teamColors[team as keyof typeof teamColors];

          return (
            <div key={team} className={`${colors.bg} ${colors.border} border rounded-xl p-5`}>
              <h3 className={`text-xl font-bold ${colors.text} mb-3`}>
                {colors.label} ({teamAssignments.length})
              </h3>
              <div className="space-y-2">
                {teamAssignments.map(assignment => (
                  <div key={assignment.player_id} className="bg-black/40 rounded-lg px-4 py-3 flex items-center gap-4">
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

      <div className="flex justify-center">
        <Button onClick={closeGame} disabled={closing} variant="danger" size="lg">
          {closing ? 'Closing...' : 'Delete Game'}
        </Button>
      </div>
    </div>
  );
}
