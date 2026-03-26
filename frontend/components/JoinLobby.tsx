import { Player, Role } from "@/lib/api";
import type { SelectedRoleEntry } from '@/lib/api';
import { Button } from './Button';
import { SelectedRolesDisplay } from './SelectedRolesDisplay';
import { Phase } from "@/app/join-game/page";
import { useState, useEffect } from "react";
import { AssignedRole } from "./AssignedRole";

interface JoinLobbyProps {
    playerName: string;
    players: Player[];
    onLeaveGame: () => void;
    leaving: boolean;
    selectedRoles?: SelectedRoleEntry[];
    assignedRole?: Role| null;
    phase: Phase;
}

export function JoinLobby({ playerName, players, assignedRole, onLeaveGame, leaving, selectedRoles = [], phase }: JoinLobbyProps) {
  const [showAssignedRole, setShowAssignedRole] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Trigger entrance animation when role is first assigned
  useEffect(() => {
    if (phase === 'role-assigned') {
      const t = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleShowRoleClick = () => {
    setShowAssignedRole(true);
  }
  const handleBackToLobbyClick = () => {
    setShowAssignedRole(false);
  }  
  const handleLeaveClick = () => {
    onLeaveGame();
  }
  return (
    <>
      {/* Success Message */}

      {showAssignedRole && assignedRole ? (
        <div className="fixed inset-0 z-50 bg-black">
          <AssignedRole assignedRole={assignedRole} playerName={playerName} onBack={handleBackToLobbyClick} />
        </div>
      ) : (
      <>
      { phase === 'role-assigned' && assignedRole ? (
      <>
        <style>{`
          @keyframes spin-slow { to { transform: rotate(360deg); } }
          @keyframes spin-reverse { to { transform: rotate(-360deg); } }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px 4px rgba(168,85,247,0.4), 0 0 60px 8px rgba(168,85,247,0.15); }
            50% { box-shadow: 0 0 40px 8px rgba(236,72,153,0.5), 0 0 80px 16px rgba(236,72,153,0.2); }
          }
          .shimmer-btn {
            background: linear-gradient(90deg, #7c3aed 0%, #a855f7 40%, #ec4899 60%, #7c3aed 100%);
            background-size: 200% auto;
            animation: shimmer 2.5s linear infinite;
          }
          .role-card {
            animation: glow-pulse 2.5s ease-in-out infinite;
          }
          .float-icon {
            animation: float 3s ease-in-out infinite;
          }
          .spin-ring {
            animation: spin-slow 8s linear infinite;
          }
          .spin-ring-reverse {
            animation: spin-reverse 6s linear infinite;
          }
        `}</style>

        <div
          className={`relative transition-all duration-700 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          {/* Outer spinning decorative ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="spin-ring w-[340px] h-[340px] rounded-full border border-dashed border-purple-500/30" />
            <div className="spin-ring-reverse absolute w-[380px] h-[380px] rounded-full border border-dashed border-pink-500/20" />
          </div>

          {/* Main card */}
          <div className="role-card relative bg-gradient-to-b from-black/70 to-purple-950/60 backdrop-blur-xl rounded-3xl border border-purple-400/40 p-10 text-center overflow-hidden">

            {/* Background shimmer layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />

            {/* Floating mystery icon */}
            <div className="float-icon relative z-10 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                <span className="text-4xl select-none">🎭</span>
              </div>
            </div>

            {/* Text */}
            <div className="relative z-10 space-y-3 mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-purple-400 font-semibold">
                Fate has been decided
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                Your role awaits,{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {playerName}
                </span>
              </h2>
              <p className="text-purple-300/80 text-base">
                Tap below to discover your destiny
              </p>
            </div>

            {/* Reveal button */}
            <div className="relative z-10">
              <button
                onClick={handleShowRoleClick}
                className="shimmer-btn relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none"
              >
                <span className="text-2xl">✦</span>
                Reveal My Role
                <span className="text-2xl">✦</span>
              </button>
            </div>

            {/* Bottom sparkles */}
            <div className="relative z-10 mt-6 flex justify-center gap-2">
              {['✦','✧','✦','✧','✦'].map((s, i) => (
                <span
                  key={i}
                  className="text-purple-400/60 text-xs"
                  style={{ animationDelay: `${i * 0.3}s`, animation: 'float 3s ease-in-out infinite' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </>
      ) : (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
        <div className="text-5xl  text-green-500 mb-2">✓</div>
        <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
        <p className="text-xl text-purple-300">
          Welcome to the game, <span className="text-white font-semibold">{playerName}</span>
        </p>
      </div>
      )}

      {/* Players List */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
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
              <div key={player.id}
                className="bg-black/30 rounded-lg p-4 flex items-center justify-between border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div
                    className="md:w-10 md:h-10 w-5 h-5  text-sm bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
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

      {/* Selected Roles (shown once moderator has selected them) */}
      {selectedRoles.length > 0 && (
        <SelectedRolesDisplay roles={selectedRoles} />
      )}

      <div className="text-center">
      { (phase === 'waiting') && (
        <>
        <p className="text-purple-300 mb-6">Waiting for the game to start...</p>
        <div className="mb-6">
          <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1"></div>
          <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{
            animationDelay: '0.2s'
          }}></div>
          <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{
            animationDelay: '0.4s'
          }}></div>
        </div>
        </>
      )}

        {/* Leave Game Button */}
        <Button
          onClick={handleLeaveClick}
          disabled={leaving}
          variant="danger"
          size="lg"
        >
          {leaving ? 'Leaving...' : 'Leave Game'}
        </Button>
      </div>
      </>
      )}
    </>
  )
}
