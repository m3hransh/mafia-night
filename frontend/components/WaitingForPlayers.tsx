import Link from 'next/link';
import { Button } from './Button';

interface Player {
  id: string;
  name: string;
  created_at: string;
}

interface WaitingForPlayersProps {
  gameId: string;
  players: Player[];
  removingPlayerId: string | null;
  copySuccess: boolean;
  closing: boolean;
  onCopyGameCode: () => void;
  onShareGame: () => void;
  onRemovePlayer: (playerId: string, playerName: string) => void;
  onStartRoleSelection: () => void;
  onCloseGame: () => void;
}

export function WaitingForPlayers({
  gameId,
  players,
  removingPlayerId,
  copySuccess,
  closing,
  onCopyGameCode,
  onShareGame,
  onRemovePlayer,
  onStartRoleSelection,
  onCloseGame,
}: WaitingForPlayersProps) {
  const getJoinUrl = () => {
    return `${window.location.origin}/join-game?code=${gameId}`;
  };

  return (
    <div className="space-y-6">
      {/* Game Code */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">Game Code</h2>
        <div className="flex items-center gap-4">
          <div data-testid="game-code" className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-2xl text-purple-300 text-center">
            {gameId}
          </div>
          <Button
            data-testid="copy-game-code-button"
            onClick={onCopyGameCode}
            size="lg"
            className="py-4"
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-purple-300 mb-2">Share this link with players:</p>
          <div className="bg-black/50 rounded-lg p-3 text-sm text-purple-200 break-all mb-3">
            {getJoinUrl()}
          </div>
          <Button
            onClick={onShareGame}
            variant="success"
            size="md"
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Game Link
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">
          Players ({players.length})
        </h2>

        {players.length === 0 ? (
          <div className="text-center py-8 text-purple-300">
            <p>Waiting for players to join...</p>
            <div className="mt-4">
              <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1"></div>
              <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{ animationDelay: '0.2s' }}></div>
              <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-black/30 rounded-lg p-4 flex items-center justify-between border border-purple-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-white font-semibold block">{player.name}</span>
                    <span className="text-xs text-purple-400">
                      Joined {new Date(player.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onRemovePlayer(player.id, player.name)}
                  disabled={removingPlayerId === player.id}
                  variant="danger"
                  size="sm"
                >
                  {removingPlayerId === player.id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onStartRoleSelection}
            disabled={players.length === 0}
            variant="success"
            scaleOnHover
          >
            Select Roles
          </Button>
          <Link
            href="/roles"
          >
          <Button
            variant="primary"
            scaleOnHover
          >
            View Roles
          </Button>
          </Link>
        </div>

        {/* Close Game Button */}
        <div className="text-center">
          <Button
            onClick={onCloseGame}
            disabled={closing}
            variant="danger"
            size="lg"
          >
            {closing ? 'Closing Game...' : 'Close Game'}
          </Button>
        </div>
      </div>
    </div>
  );
}
