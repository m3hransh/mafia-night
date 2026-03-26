'use client';

import { Role } from "@/lib/api";
import dynamic from 'next/dynamic';

const CardScene = dynamic(() => import('./CardScene').then(mod => ({ default: mod.CardScene })), {
  ssr: false,
  loading: () => <div className="w-full h-screen" />,
});

interface AssignedRoleProps {
  assignedRole: Role;
  playerName: string;
  onBack: () => void;
}

export function AssignedRole({ assignedRole, playerName, onBack }: AssignedRoleProps) {
  return (
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
        .ar-shimmer-btn {
          background: linear-gradient(90deg, #7c3aed 0%, #a855f7 40%, #ec4899 60%, #7c3aed 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        .ar-glow-card {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
        .ar-float { animation: float 3s ease-in-out infinite; }
        .ar-spin { animation: spin-slow 8s linear infinite; }
        .ar-spin-rev { animation: spin-reverse 6s linear infinite; }
      `}</style>

      {/* Background matching lobby card gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/40 to-black pointer-events-none" />

      {/* 3D card scene */}
      <CardScene videoSrc={assignedRole.video} role={assignedRole} />

      {/* Header — same card style as lobby reveal */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-10/12 max-w-xl z-10">
        <div className="ar-glow-card relative bg-gradient-to-b from-black/70 to-purple-950/60 backdrop-blur-xl rounded-3xl border border-purple-400/40 px-6 py-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />

          <p className="relative z-10 text-xs uppercase tracking-[0.3em] text-purple-400 font-semibold mb-1">
            Your destiny
          </p>
          <h2 className="relative z-10 text-2xl md:text-3xl font-extrabold text-white">
            <span data-testid="player-name" className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {playerName}
            </span>
          </h2>
          <div className="relative z-10 mt-2 flex justify-center gap-2">
            {['✦','✧','✦','✧','✦'].map((s, i) => (
              <span key={i} className="ar-float text-purple-400/60 text-xs"
                style={{ animationDelay: `${i * 0.3}s` }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative rings — same as lobby */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="ar-spin w-[340px] h-[340px] rounded-full border border-dashed border-purple-500/20" />
        <div className="ar-spin-rev absolute w-[390px] h-[390px] rounded-full border border-dashed border-pink-500/15" />
      </div>

      {/* Back button — same shimmer style as lobby reveal button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={onBack}
          className="ar-shimmer-btn inline-flex items-center gap-3 px-8 py-3 rounded-2xl text-white font-bold text-base shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none"
        >
          <span>✦</span>
          Back to Lobby
          <span>✦</span>
        </button>
      </div>
    </>
  );
}
