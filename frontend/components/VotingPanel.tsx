'use client';

import { useState } from 'react';
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
  onCastVote: (voterId: string, targetId: string) => Promise<void>;
  onEliminate: (playerId: string) => Promise<void>;
  eliminatingId: string | null;
}

export function VotingPanel({
  alivePlayers,
  tally,
  currentStage,
  onStageChange,
  onCastVote,
  onEliminate,
  eliminatingId,
}: VotingPanelProps) {
  // voter → selected target (local optimistic state, WS tally is the truth)
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [castingFor, setCastingFor] = useState<string | null>(null);
  const [activeVoter, setActiveVoter] = useState<string | null>(null);

  const votes = tally?.votes ?? [];
  const totalVoters = tally?.total_voters ?? alivePlayers.length;
  const majority = Math.floor(totalVoters / 2) + 1;
  const topVote = votes[0];
  const canEliminate = topVote && topVote.count >= majority;
  const topPlayer = canEliminate ? alivePlayers.find(p => p.name === topVote.target_name) : null;

  const handleTargetClick = async (voter: Player, target: Player) => {
    if (voter.id === target.id) return;
    setCastingFor(voter.id);
    try {
      await onCastVote(voter.id, target.id);
      setSelections(s => ({ ...s, [voter.id]: target.id }));
      setActiveVoter(null);
    } finally {
      setCastingFor(null);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-amber-500/30 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-amber-300">☀️ Day Voting</h3>
        <div className="text-white/50 text-sm">{totalVoters} players · majority: {majority}</div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2">
        {(['nomination', 'final'] as const).map(stage => (
          <button
            key={stage}
            onClick={() => { onStageChange(stage); setActiveVoter(null); setSelections({}); }}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm capitalize transition-all
              ${currentStage === stage
                ? 'bg-amber-500/30 border border-amber-500/60 text-amber-300'
                : 'bg-black/30 border border-white/10 text-white/50 hover:text-white/80'}`}
          >
            {stage === 'nomination' ? '1st Round — Nomination' : '2nd Round — Final'}
          </button>
        ))}
      </div>

      {/* Vote recorder — one row per voter */}
      <div className="space-y-2">
        <p className="text-white/40 text-xs uppercase tracking-wider">Tap a player, then pick their target</p>
        {alivePlayers.map(voter => {
          const selectedTargetId = selections[voter.id];
          const selectedTarget = alivePlayers.find(p => p.id === selectedTargetId);
          const isExpanded = activeVoter === voter.id;
          const isCasting = castingFor === voter.id;

          return (
            <div key={voter.id} className="rounded-xl overflow-hidden border border-white/10">
              {/* Voter row */}
              <button
                onClick={() => setActiveVoter(isExpanded ? null : voter.id)}
                disabled={isCasting}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all
                  ${isExpanded ? 'bg-amber-900/30' : 'bg-black/30 hover:bg-white/5'}`}
              >
                <span className="text-white font-medium">{voter.name}</span>
                <div className="flex items-center gap-2">
                  {isCasting ? (
                    <span className="text-amber-400 text-xs animate-pulse">recording…</span>
                  ) : selectedTarget ? (
                    <span className="text-amber-300 text-sm">→ {selectedTarget.name}</span>
                  ) : (
                    <span className="text-white/30 text-sm">not voted</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Target picker — inline expand */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-2 bg-amber-950/20 flex flex-wrap gap-2">
                  {alivePlayers
                    .filter(p => p.id !== voter.id)
                    .map(target => (
                      <button
                        key={target.id}
                        onClick={() => handleTargetClick(voter, target)}
                        disabled={isCasting}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                          ${selections[voter.id] === target.id
                            ? 'bg-amber-500/40 border border-amber-400/60 text-amber-200'
                            : 'bg-white/10 border border-white/10 text-white/70 hover:bg-amber-500/20 hover:text-amber-200'
                          }`}
                      >
                        {target.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live tally bars */}
      {votes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-white/40 text-xs uppercase tracking-wider">Live tally</p>
          {votes.map(v => {
            const pct = totalVoters > 0 ? Math.round((v.count / totalVoters) * 100) : 0;
            const atMajority = v.count >= majority;
            return (
              <div key={v.target_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={`font-semibold ${atMajority ? 'text-amber-300' : 'text-white/80'}`}>
                    {v.target_name}
                  </span>
                  <span className="text-white/50">{v.count}/{totalVoters} ({pct}%)</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '50%' }} />
                  <div
                    className={`h-full rounded-full transition-all duration-500
                      ${atMajority ? 'bg-amber-400' : 'bg-amber-600/60'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-white/30 text-xs flex items-center gap-1">
            <span className="inline-block w-3 h-px bg-white/30" />
            50% threshold — {majority} votes needed to eliminate
          </p>
        </div>
      )}

      {/* Eliminate button */}
      {canEliminate && topPlayer && (
        <button
          onClick={() => onEliminate(topPlayer.id)}
          disabled={eliminatingId === topPlayer.id}
          className="w-full py-3 rounded-xl font-bold text-white bg-red-500/20 border border-red-500/50
            hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {eliminatingId === topPlayer.id
            ? 'Eliminating…'
            : `🗳️ Eliminate ${topVote.target_name} (${topVote.count}/${totalVoters} votes)`}
        </button>
      )}
    </div>
  );
}
