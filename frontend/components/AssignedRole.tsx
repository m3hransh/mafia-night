import { Role } from "@/lib/api";
import { CardScene } from "./CardScene";

interface AssignedRoleProps {
  assignedRole: Role;
  playerName: string;
  onLeaveGame: () => void;
  leaving: boolean;
}


export function AssignedRole({ assignedRole, playerName, leaving, onLeaveGame }: AssignedRoleProps) {
  const handleLeaveClick = () => {
    onLeaveGame();
  };
  return (
    // Display assigned role
    <>
      <CardScene videoSrc={assignedRole.video} role={assignedRole} />

      {/* Header Card with backdrop */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-10/12 max-w-2xl">
        <div className="backdrop-blur-md bg-black/40 rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8">
          <div className="text-center space-y-4">
            <h2 className="font-bold text-2xl md:text-4xl text-white tracking-tight">
              Your Role!
            </h2>

            <div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>

            <p className="text-xl text-purple-200/90 leading-relaxed">
              <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {playerName}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Leave button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={handleLeaveClick}
          disabled={leaving}
          className="bg-red-600/90 hover:bg-red-700 disabled:bg-red-800/50 disabled:cursor-not-allowed
                     text-white font-semibold px-4 md:px-8 py-4 rounded-xl
                     backdrop-blur-sm border border-red-400/30
                     transition-all duration-200
                     hover:scale-105 hover:shadow-lg hover:shadow-red-500/50
                     active:scale-95"
        >
          {leaving ? 'Leaving...' : 'Leave Game'}
        </button>
      </div>
    </>
  )
}
