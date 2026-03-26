'use client';

import { useState } from 'react';
import type { VoteSessionResult } from '@/lib/api';

interface VoteOverlayProps {
  session: VoteSessionResult;
  existingChoice: 'yes' | 'no' | null;
  onVote: (choice: 'yes' | 'no') => Promise<void>;
  onDismiss: () => void;
}

export function VoteOverlay({ session, existingChoice, onVote, onDismiss }: VoteOverlayProps) {
  const [voting, setVoting] = useState(false);
  const [localChoice, setLocalChoice] = useState<'yes' | 'no' | null>(existingChoice);

  const total = session.total_voters;
  const voted = session.yes_count + session.no_count;
  const majority = Math.floor(total / 2) + 1;
  const isClosed = session.status === 'closed';
  const yesWins = session.yes_count >= majority;

  const handleVote = async (choice: 'yes' | 'no') => {
    if (isClosed || voting) return;
    setVoting(true);
    try {
      await onVote(choice);
      setLocalChoice(choice);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-gray-950 rounded-3xl border border-amber-500/30 p-8 space-y-6 shadow-2xl">

        {/* Header */}
        <div className="text-center space-y-1">
          {isClosed ? (
            <p className="text-white/40 text-sm uppercase tracking-wider">Vote closed</p>
          ) : (
            <p className="text-amber-400 text-sm uppercase tracking-wider font-semibold animate-pulse">
              🗳️ Vote now
            </p>
          )}
          <h2 className="text-3xl font-extrabold text-white">{session.accused_player_name}</h2>
          {session.message && (
            <p className="text-white/40 text-sm italic mt-1">"{session.message}"</p>
          )}
        </div>

        {/* Results bar — shown after voting OR when closed */}
        {(isClosed || localChoice) && (
          <div className="space-y-3 bg-black/30 rounded-2xl p-4">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>{voted}/{total} voted</span>
              <span>majority: {majority}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-400 font-semibold">✓ Eliminate</span>
                <span className="text-white/50">{session.yes_count}</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500/70 rounded-full transition-all duration-700"
                  style={{ width: total > 0 ? `${(session.yes_count / total) * 100}%` : '0%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-400 font-semibold">✗ Spare</span>
                <span className="text-white/50">{session.no_count}</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500/70 rounded-full transition-all duration-700"
                  style={{ width: total > 0 ? `${(session.no_count / total) * 100}%` : '0%' }} />
              </div>
            </div>

            {/* Final outcome */}
            {isClosed && (
              <div className={`mt-3 text-center font-bold py-2.5 rounded-xl
                ${yesWins ? 'text-red-300 bg-red-900/20' : 'text-green-300 bg-green-900/20'}`}>
                {yesWins
                  ? `☠️ ${session.accused_player_name} will be eliminated`
                  : `✓ ${session.accused_player_name} is spared`}
              </div>
            )}
          </div>
        )}

        {/* Vote buttons — only when open */}
        {!isClosed && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVote('yes')}
              disabled={voting}
              className={`py-4 rounded-2xl font-bold text-lg transition-all
                ${localChoice === 'yes'
                  ? 'bg-green-500/40 border-2 border-green-400 text-green-200'
                  : 'bg-green-900/30 border border-green-500/30 text-green-400 hover:bg-green-500/20'}
                disabled:opacity-50`}
            >
              ✓ Yes
            </button>
            <button
              onClick={() => handleVote('no')}
              disabled={voting}
              className={`py-4 rounded-2xl font-bold text-lg transition-all
                ${localChoice === 'no'
                  ? 'bg-blue-500/40 border-2 border-blue-400 text-blue-200'
                  : 'bg-blue-900/30 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}
                disabled:opacity-50`}
            >
              ✗ No
            </button>
          </div>
        )}

        {!isClosed && localChoice && (
          <p className="text-center text-white/40 text-sm">
            You voted{' '}
            <span className={localChoice === 'yes' ? 'text-green-400 font-semibold' : 'text-blue-400 font-semibold'}>
              {localChoice === 'yes' ? 'to eliminate' : 'to spare'}
            </span>
            . Tap again to change.
          </p>
        )}

        {!isClosed && !localChoice && (
          <p className="text-center text-white/30 text-sm">Waiting for your vote…</p>
        )}

        {isClosed && (
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/50 bg-white/5
              border border-white/10 hover:bg-white/10 hover:text-white/80 transition-all"
          >
            ✕ Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
