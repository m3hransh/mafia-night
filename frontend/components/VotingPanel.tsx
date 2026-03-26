'use client';

import { useState } from 'react';
import type { VoteSessionResult } from '@/lib/api';

interface Player {
  id: string;
  name: string;
  created_at: string;
}

interface VotingPanelProps {
  alivePlayers: Player[];
  activeSession: VoteSessionResult | null;
  onOpenSession: (playerId: string, message: string) => Promise<void>;
  onCloseSession: () => Promise<void>;
  onClearSession: () => void;
  onEliminate: (playerId: string) => Promise<void>;
  eliminatingId: string | null;
  openingFor: string | null;
}

export function VotingPanel({
  alivePlayers,
  activeSession,
  onOpenSession,
  onCloseSession,
  onClearSession,
  onEliminate,
  eliminatingId,
  openingFor,
}: VotingPanelProps) {
  const [message, setMessage] = useState('');
  const [closing, setClosing] = useState(false);

  const majority = activeSession
    ? Math.floor(activeSession.total_voters / 2) + 1
    : 0;
  const yesWins = activeSession
    ? activeSession.yes_count >= majority
    : false;
  const accusedPlayer = activeSession
    ? alivePlayers.find(p => p.id === activeSession.accused_player_id)
    : null;

  const handleClose = async () => {
    setClosing(true);
    try { await onCloseSession(); } finally { setClosing(false); }
  };

  if (activeSession) {
    const total = activeSession.total_voters;
    const yesPct = total > 0 ? Math.round((activeSession.yes_count / total) * 100) : 0;
    const noPct  = total > 0 ? Math.round((activeSession.no_count  / total) * 100) : 0;
    const voted  = activeSession.yes_count + activeSession.no_count;

    return (
      <div data-testid="voting-panel-active" className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-amber-500/30 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-amber-300">🗳️ Vote in Progress</h3>
          <span data-testid="vote-count" className="text-xs text-white/40 bg-amber-500/10 px-2 py-1 rounded-full">
            {voted}/{total} voted
          </span>
        </div>

        <div className="text-center py-4 bg-red-900/20 rounded-xl border border-red-500/20">
          <p className="text-white/50 text-sm mb-1">Accused player</p>
          <p data-testid="accused-player-name" className="text-2xl font-bold text-red-300">{activeSession.accused_player_name}</p>
          {activeSession.message && (
            <p className="text-white/40 text-sm mt-2 italic">&ldquo;{activeSession.message}&rdquo;</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-400 font-semibold">✓ Yes — eliminate</span>
              <span data-testid="yes-count" className="text-white/50">{activeSession.yes_count} ({yesPct}%)</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/70 rounded-full transition-all duration-500"
                style={{ width: `${yesPct}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-400 font-semibold">✗ No — spare</span>
              <span data-testid="no-count" className="text-white/50">{activeSession.no_count} ({noPct}%)</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500/70 rounded-full transition-all duration-500"
                style={{ width: `${noPct}%` }} />
            </div>
          </div>
          <p className="text-white/30 text-xs">{majority} yes votes needed for majority</p>
        </div>

        {activeSession.status === 'open' && (
          <button
            data-testid="close-vote-btn"
            onClick={handleClose}
            disabled={closing}
            className="w-full py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20
              hover:bg-white/15 disabled:opacity-50 transition-all"
          >
            {closing ? 'Closing…' : '🔒 Close Vote & Reveal Results'}
          </button>
        )}

        {activeSession.status === 'closed' && (
          <div className="space-y-3">
            <div data-testid="vote-outcome-banner" className={`text-center py-3 rounded-xl font-bold
              ${yesWins ? 'bg-red-900/30 text-red-300 border border-red-500/30' : 'bg-green-900/20 text-green-300 border border-green-500/20'}`}>
              {yesWins
                ? `☠️ Majority reached — ${activeSession.accused_player_name} eliminated`
                : `✓ Spared — ${activeSession.accused_player_name} stays`}
            </div>

            {yesWins && accusedPlayer && (
              <button
                data-testid="confirm-eliminate-btn"
                onClick={() => onEliminate(accusedPlayer.id)}
                disabled={eliminatingId === accusedPlayer.id}
                className="w-full py-3 rounded-xl font-bold text-white bg-red-500/20 border border-red-500/50
                  hover:bg-red-500/30 disabled:opacity-50 transition-all"
              >
                {eliminatingId === accusedPlayer.id
                  ? 'Eliminating…'
                  : `☠️ Confirm: Eliminate ${activeSession.accused_player_name}`}
              </button>
            )}

            <button
              data-testid="start-new-vote-btn"
              onClick={onClearSession}
              className="w-full py-2.5 rounded-xl font-semibold text-white/60 bg-white/5 border border-white/10
                hover:bg-white/10 hover:text-white transition-all text-sm"
            >
              🗳️ Start New Vote
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="voting-panel-select" className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-amber-500/30 space-y-5">
      <h3 className="text-xl font-bold text-amber-300">☀️ Day Voting</h3>
      <p className="text-white/40 text-sm">Select a player to put to a vote</p>

      <input
        data-testid="vote-message-input"
        type="text"
        placeholder="Message to players (optional)"
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white
          placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50"
      />

      <div className="space-y-2">
        {alivePlayers.map(player => (
          <button
            key={player.id}
            data-testid={`vote-player-btn-${player.name}`}
            onClick={() => onOpenSession(player.id, message)}
            disabled={openingFor === player.id}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl
              bg-black/30 border border-white/10 hover:border-amber-500/30 hover:bg-amber-900/10
              disabled:opacity-50 transition-all"
          >
            <span className="text-white font-medium">{player.name}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full
              ${openingFor === player.id
                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                : 'bg-white/5 text-white/40'}`}>
              {openingFor === player.id ? 'Opening…' : 'Put to vote →'}
            </span>
          </button>
        ))}
        {alivePlayers.length === 0 && (
          <p className="text-white/30 text-sm text-center py-4">No alive players</p>
        )}
      </div>
    </div>
  );
}
