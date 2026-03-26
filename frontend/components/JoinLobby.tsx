import { Player, Role } from "@/lib/api";
import type { SelectedRoleEntry } from '@/lib/api';
import { Button } from './Button';
import { SelectedRolesDisplay } from './SelectedRolesDisplay';
import { Phase, DayNightPhase } from "@/app/join-game/page";
import { useState, useEffect, useRef } from "react";
import { AssignedRole } from "./AssignedRole";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JoinLobbyProps {
  playerName: string;
  players: Player[];
  onLeaveGame: () => void;
  leaving: boolean;
  selectedRoles?: SelectedRoleEntry[];
  assignedRole?: Role | null;
  phase: Phase;
  dayNightPhase?: DayNightPhase;
  roundNumber?: number;
}

// ── Phase theme config ────────────────────────────────────────────────────────

const PHASE_THEME = {
  waiting: {
    bg: 'from-black via-gray-950 to-slate-950',
    overlay: 'from-purple-950/30 via-transparent to-transparent',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    icon: null,
    label: null,
  },
  day: {
    bg: 'from-amber-950 via-orange-950 to-yellow-950',
    overlay: 'from-amber-900/30 via-transparent to-orange-900/20',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    icon: '☀️',
    label: 'Day Phase',
  },
  night: {
    bg: 'from-indigo-950 via-slate-950 to-blue-950',
    overlay: 'from-indigo-900/40 via-transparent to-blue-950/30',
    border: 'border-indigo-400/30',
    badge: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300',
    icon: '🌙',
    label: 'Night Phase',
  },
  ended: {
    bg: 'from-gray-950 via-zinc-950 to-neutral-950',
    overlay: 'from-gray-900/30 via-transparent to-transparent',
    border: 'border-gray-500/30',
    badge: 'bg-gray-500/20 border-gray-500/40 text-gray-300',
    icon: '🏁',
    label: 'Game Over',
  },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function PhaseNotificationBanner({ phase, roundNumber }: { phase: DayNightPhase; roundNumber: number }) {
  const [visible, setVisible] = useState(false);
  const prevPhaseRef = useRef<DayNightPhase>(phase);

  useEffect(() => {
    // Don't show banner on initial 'waiting' load
    if (phase === 'waiting' || phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [phase]);

  if (!visible || phase === 'waiting') return null;

  const theme = PHASE_THEME[phase];
  const messages = {
    day:   `☀️  Day ${roundNumber} has begun — discuss and vote!`,
    night: `🌙  Night ${roundNumber} has fallen — silence…`,
    ended: '🏁  The game has ended',
  };

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl border
        backdrop-blur-xl shadow-2xl text-center
        transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${theme.badge}`}
    >
      <p className="font-bold text-lg tracking-wide">{messages[phase as keyof typeof messages]}</p>
    </div>
  );
}

function DayNightOverlay({ phase }: { phase: DayNightPhase }) {
  const theme = PHASE_THEME[phase];

  if (phase === 'waiting') return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000
        bg-gradient-to-br ${theme.bg} opacity-60`}
    />
  );
}

function PhaseStatusBadge({ phase, roundNumber }: { phase: DayNightPhase; roundNumber: number }) {
  if (phase === 'waiting') return null;
  const theme = PHASE_THEME[phase];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${theme.badge}`}>
      <span>{theme.icon}</span>
      <span>{theme.label}</span>
      {roundNumber > 0 && <span className="opacity-70">· Round {roundNumber}</span>}
    </div>
  );
}

function NightStars() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() > 0.8 ? 2 : 1,
            height: Math.random() > 0.8 ? 2 : 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.2,
            animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

function DaySunRays() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px]"
        style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.08) 5deg, transparent 10deg, rgba(251,191,36,0.05) 15deg, transparent 20deg)' }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function JoinLobby({
  playerName,
  players,
  assignedRole,
  onLeaveGame,
  leaving,
  selectedRoles = [],
  phase,
  dayNightPhase = 'waiting',
  roundNumber = 0,
}: JoinLobbyProps) {
  const [showAssignedRole, setShowAssignedRole] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [roleSeen, setRoleSeen] = useState(false);

  const theme = PHASE_THEME[dayNightPhase];

  useEffect(() => {
    if (phase === 'role-assigned') {
      const t = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleBackFromRole = () => {
    setShowAssignedRole(false);
    setRoleSeen(true);
  };

  if (showAssignedRole && assignedRole) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <AssignedRole assignedRole={assignedRole} playerName={playerName} onBack={handleBackFromRole} />
      </div>
    );
  }

  return (
    <>
      {/* Dynamic background overlays */}
      <DayNightOverlay phase={dayNightPhase} />
      {dayNightPhase === 'night' && <NightStars />}
      {dayNightPhase === 'day' && <DaySunRays />}

      {/* Phase transition banner */}
      <PhaseNotificationBanner phase={dayNightPhase} roundNumber={roundNumber} />

      {/* Phase status badge */}
      {dayNightPhase !== 'waiting' && (
        <div className="mb-4">
          <PhaseStatusBadge phase={dayNightPhase} roundNumber={roundNumber} />
        </div>
      )}

      {/* Role reveal card — collapses to a compact badge once seen */}
      {phase === 'role-assigned' && assignedRole && (
        roleSeen ? (
          <button
            onClick={() => setShowAssignedRole(true)}
            className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border backdrop-blur-md bg-black/30 hover:bg-black/50 transition-all ${theme.border}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎭</span>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">{assignedRole.name}</p>
                <p className="text-purple-300 text-xs">Your role</p>
              </div>
            </div>
            <span className="text-purple-400 text-xs font-medium">View again →</span>
          </button>
        ) : (
          <RoleRevealCard
            playerName={playerName}
            revealed={revealed}
            onReveal={() => setShowAssignedRole(true)}
            theme={theme}
          />
        )
      )}

      {/* "You're In" card — only while waiting for roles */}
      {phase !== 'role-assigned' && (
        <div className={`bg-black/40 backdrop-blur-md rounded-2xl p-8 border ${theme.border} text-center`}>
          <div className="text-5xl text-green-500 mb-2">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re In!</h2>
          <p className="text-xl text-purple-300">
            Welcome to the game, <span className="text-white font-semibold">{playerName}</span>
          </p>
        </div>
      )}

      {/* Players list */}
      <div className={`bg-black/40 backdrop-blur-md rounded-2xl p-8 border ${theme.border}`}>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
          Players in Game ({players.length})
        </h2>
        {players.length === 0 ? (
          <div className="text-center py-8 text-purple-300">
            <p>Loading players...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`bg-black/30 rounded-lg p-4 flex items-center justify-between border ${theme.border}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`md:w-10 md:h-10 w-5 h-5 text-sm rounded-full flex items-center justify-center text-white font-bold
                    ${dayNightPhase === 'night' ? 'bg-indigo-600' : dayNightPhase === 'day' ? 'bg-amber-600' : 'bg-purple-600'}`}>
                    {index + 1}
                  </div>
                  <span className="text-white font-semibold">{player.name}</span>
                  {player.name === playerName && (
                    <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-300">You</span>
                  )}
                </div>
                <span className="text-xs text-purple-400">
                  {new Date(player.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected roles */}
      {selectedRoles.length > 0 && <SelectedRolesDisplay roles={selectedRoles} />}

      {/* Waiting indicator + leave button */}
      <div className="text-center">
        {phase === 'waiting' && dayNightPhase === 'waiting' && (
          <>
            <p className="text-purple-300 mb-6">Waiting for the game to start…</p>
            <div className="mb-6">
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </>
        )}
        <Button onClick={onLeaveGame} disabled={leaving} variant="danger" size="lg">
          {leaving ? 'Leaving...' : 'Leave Game'}
        </Button>
      </div>
    </>
  );
}

// ── Role reveal card ──────────────────────────────────────────────────────────

function RoleRevealCard({
  playerName,
  revealed,
  onReveal,
  theme,
}: {
  playerName: string;
  revealed: boolean;
  onReveal: () => void;
  theme: typeof PHASE_THEME[DayNightPhase];
}) {
  return (
    <>
      <style>{`
        @keyframes spin-slow    { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(168,85,247,0.4),  0 0 60px 8px  rgba(168,85,247,0.15); }
          50%       { box-shadow: 0 0 40px 8px rgba(236,72,153,0.5),  0 0 80px 16px rgba(236,72,153,0.2); }
        }
        .shimmer-btn {
          background: linear-gradient(90deg, #7c3aed 0%, #a855f7 40%, #ec4899 60%, #7c3aed 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        .role-card    { animation: glow-pulse 2.5s ease-in-out infinite; }
        .float-icon   { animation: float 3s ease-in-out infinite; }
        .spin-ring    { animation: spin-slow 8s linear infinite; }
        .spin-ring-r  { animation: spin-reverse 6s linear infinite; }
      `}</style>

      <div className={`relative transition-all duration-700 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        {/* Decorative spinning rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="spin-ring   w-[340px] h-[340px] rounded-full border border-dashed border-purple-500/30" />
          <div className="spin-ring-r absolute w-[380px] h-[380px] rounded-full border border-dashed border-pink-500/20" />
        </div>

        <div className={`role-card relative bg-gradient-to-b from-black/70 to-purple-950/60 backdrop-blur-xl rounded-3xl border ${theme.border} p-10 text-center overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />

          <div className="float-icon relative z-10 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-xl" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <span className="text-4xl select-none">🎭</span>
            </div>
          </div>

          <div className="relative z-10 space-y-3 mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-400 font-semibold">Fate has been decided</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Your role awaits,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{playerName}</span>
            </h2>
            <p className="text-purple-300/80 text-base">Tap below to discover your destiny</p>
          </div>

          <div className="relative z-10">
            <button
              onClick={onReveal}
              className="shimmer-btn relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none"
            >
              <span className="text-2xl">✦</span>
              Reveal My Role
              <span className="text-2xl">✦</span>
            </button>
          </div>

          <div className="relative z-10 mt-6 flex justify-center gap-2">
            {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
              <span key={i} className="text-purple-400/60 text-xs" style={{ animationDelay: `${i * 0.3}s`, animation: 'float 3s ease-in-out infinite' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
