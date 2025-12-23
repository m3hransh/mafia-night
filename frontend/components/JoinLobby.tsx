import {Player} from "@/lib/api";

interface JoinLobbyProps {
    playerName: string;
    players: Player[];
    onLeaveGame: () => void;
    leaving: boolean;
}

export function JoinLobby({ playerName, players, onLeaveGame, leaving }: JoinLobbyProps) {
  const handleLeaveClick = () => {
    onLeaveGame();
  }
  return (
    <>
      {/* Success Message */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
        <div className="text-5xl  text-green-500 mb-2">✓</div>
        <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
        <p className="text-xl text-purple-300">
          Welcome to the game, <span className="text-white font-semibold">{playerName}</span>
        </p>
      </div>

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

      <div className="text-center">
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

        {/* Leave Game Button */}
        <button onClick={handleLeaveClick} disabled={leaving}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-4 md:px-8 py-3 rounded-lg transition-all">
          {leaving ? 'Leaving...' : 'Leave Game'}
        </button>
      </div>
    </>
  )
}
