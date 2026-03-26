'use client';

import type { VoteTally } from '@/lib/api';

interface Player {
  id: string;
  name: string;
  created_at: string;
}

interface VotingPanelProps {
  gameId: string;
  moderatorId: string;
  alivePlayers: Player[];
  tally: VoteTally | null;
  currentStage: 'nomination' | 'final';
  onStageChange: (stage: 'nomination' | 'final') => void;
  onEliminate: (playerId: string) => Promise<void>;
  eliminatingId: string | null;
}

export function VotingPanel({
  alivePlayers,
  tally,
  currentStage,
  onStageChange,
  onEliminate,
  eliminatingId,
}: VotingPanelProps) {
  const votes = tally?.votes ?? [];
  const totalVoters = tally?.total_voters ?? alivePlayers.length;
  const majority = Math.floor(totalVoters / 2) + 1;

  // Find top candidate
  const topVote = votes[0];
  const canEliminate = topVote && topVote.count >= majority;

  // Find player id for top candidate
  const topPlayer = canEliminate
    ? alivePlayers.find(p => p.name === topVote.target_name)
    : null;

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-amber-500/30 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-amber-300">☀️ Day Voting</h3>
        <div className="text-white/50 text-sm">{totalVoters} players · majority: {majority}</div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2">
        {(['nomination', 'final'] as const).map(stage => (
          <button
            key={stage}
            onClick={() => onStageChange(stage)}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm capitalize transition-all
              ${currentStage === stage
                ? 'bg-amber-500/30 border border-amber-500/60 text-amber-300'
                : 'bg-black/30 border border-white/10 text-white/50 hover:text-white/80'
              }`}
          >
            {stage}
          </button>
        ))}
      </div>

      {/* Vote bars */}
      <div className="space-y-3">
        {votes.length === 0 && (
          <div className="text-white/40 text-sm text-center py-4">No votes cast yet</div>
        )}
        {votes.map(v => {
          const pct = totalVoters > 0 ? Math.round((v.count / totalVoters) * 100) : 0;
          const atMajority = v.count >= majority;
          return (
            <div key={v.target_id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={`font-semibold ${atMajority ? 'text-amber-300' : 'text-white/80'}`}>
                  {v.target_name}
                </span>
                <span className="text-white/50">{v.count} vote{v.count !== 1 ? 's' : ''} ({pct}%)</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                {/* majority threshold line at 50% */}
                <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '50%' }} />
                <div
                  className={`h-full rounded-full transition-all duration-500 ${atMajority ? 'bg-amber-400' : 'bg-amber-600/60'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Majority threshold indicator */}
      <div className="text-white/40 text-xs flex items-center gap-1">
        <div className="w-3 h-px bg-white/30" />
        <span>50% majority threshold ({majority} votes needed)</span>
      </div>

      {/* Eliminate button */}
      {canEliminate && topPlayer && (
        <div className="pt-2">
          <button
            onClick={() => onEliminate(topPlayer.id)}
            disabled={eliminatingId === topPlayer.id}
            className="w-full py-3 rounded-xl font-bold text-white bg-red-500/20 border border-red-500/50
              hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {eliminatingId === topPlayer.id
              ? 'Eliminating...'
              : `🗳️ Eliminate ${topVote.target_name} (${topVote.count}/${totalVoters} votes)`}
          </button>
        </div>
      )}
    </div>
  );
}
