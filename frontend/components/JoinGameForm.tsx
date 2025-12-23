import { useEffect, useState } from 'react';
import { joinGame, Player } from '@/lib/api';

interface JoinGameFormProps {
  gameId?: string;
  onJoinGame: (gameId: string, player: Player | null) => void;
}

export function JoinGameForm({ gameId, onJoinGame }: JoinGameFormProps) {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      setGameCode(gameId);
    }
  }, [gameId]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const player = await joinGame(gameCode, playerName);
      onJoinGame(gameCode, player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
      <form onSubmit={handleJoinGame} className="space-y-6">
        <div>
          <label htmlFor="gameCode" className="block text-white font-semibold mb-2">
            Game Code
          </label>
          <input id="gameCode" type="text" value={gameCode} onChange={(e) => setGameCode(e.target.value)}
            placeholder="Enter game code"
            className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white
      placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            required
          />
        </div>

        <div>
          <label htmlFor="playerName" className="block text-white font-semibold mb-2">
            Your Name
          </label>
          <input id="playerName" type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white
      placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold text-xl px-12 py-4 rounded-xl transition-all transform hover:scale-105 shadow-2xl">
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </form>
    </div>
  )
}
