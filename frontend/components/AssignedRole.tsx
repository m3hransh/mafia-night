import {Role} from "@/lib/api";
import { OptimizedVideo } from '@/components/OptimizedVideo';

interface AssignedRoleProps {
  assignedRole: Role ;
  playerName: string;
  onLeaveGame: () => void;
  leaving: boolean;
}

export function AssignedRole({ assignedRole, playerName, onLeaveGame, leaving }: AssignedRoleProps) {
  const handleLeaveClick = () => {
    onLeaveGame();
  };
  return (
              // Display assigned role
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Your Role</h2>
                
                <div className="max-w-md mx-auto">
                  {/* Role Card */}
                  <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-purple-900/50 to-black rounded-xl overflow-hidden mb-6">
                    <OptimizedVideo
                      src={assignedRole.video}
                      className="w-full h-full object-cover object-top"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
                    
                    {/* Role Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center backdrop-blur-md bg-black/10">
                      <h3 className="text-2xl font-semibold text-white mb-2 drop-shadow-lg">
                        {assignedRole.name}
                      </h3>
                      <p className="text-sm text-purple-300 capitalize mb-2">{assignedRole.team} Team</p>
                    </div>
                  </div>

                  {/* Role Description */}
                  {assignedRole.description && (
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-semibold mb-2">Description</h4>
                      <p className="text-purple-200 text-sm">{assignedRole.description}</p>
                    </div>
                  )}

                  {/* Role Abilities */}
                  {assignedRole.abilities && assignedRole.abilities.length > 0 && (
                    <div className="bg-black/30 rounded-lg p-4 mb-6">
                      <h4 className="text-white font-semibold mb-2">Abilities</h4>
                      <ul className="list-disc list-inside text-purple-200 text-sm space-y-1">
                        {assignedRole.abilities.map((ability, index) => (
                          <li key={index}>{ability}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-center text-purple-300 mb-4">
                    Keep your role secret! Good luck, <span className="text-white font-semibold">{playerName}</span>!
                  </p>

                  <div className="text-center">
                    <button
                      onClick={handleLeaveClick}
                      disabled={leaving}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-all"
                    >
                      {leaving ? 'Leaving...' : 'Leave Game'}
                    </button>
                  </div>
                </div>
              </div>
            )
}
