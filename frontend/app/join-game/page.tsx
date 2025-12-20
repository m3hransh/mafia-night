'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GradientBackground } from '@/components/GradientBackground';
import { savePlayerGame, getPlayerGame, clearPlayerGame } from '@/lib/gameStorage';

interface Player {
  id: string;
  name: string;
  created_at: string;
}

function JoinGameContent() {
  const searchParams = useSearchParams();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // Check for existing player session on mount
  useEffect(() => {
    const savedPlayer = getPlayerGame();
    if (savedPlayer) {
      // Verify player still exists in game
      fetch(`${API_BASE_URL}/api/games/${savedPlayer.gameId}/players`)
        .then(res => res.json())
        .then((playersList: Player[]) => {
          const playerExists = playersList.find(p => p.id === savedPlayer.playerId);
          if (playerExists) {
            // Restore player state
            setGameCode(savedPlayer.gameId);
            setPlayerName(savedPlayer.playerName);
            setPlayerId(savedPlayer.playerId);
            setJoined(true);
          } else {
            // Player not in game anymore
            clearPlayerGame();
          }
        })
        .catch(() => {
          clearPlayerGame();
        });
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !gameCode) {
      setGameCode(code);
    }
  }, [searchParams, gameCode]);

  // Poll for players after joining
  useEffect(() => {
    if (!joined || !gameCode) return;

    const fetchPlayers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/games/${gameCode}/players`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 2000);

    return () => clearInterval(interval);
  }, [joined, gameCode, API_BASE_URL]);

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${gameCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join game');
      }

      const playerData = await response.json();
      setPlayerId(playerData.id);
      setJoined(true);
      
      // Save to localStorage
      savePlayerGame(gameCode, playerData.id, playerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-full min-h-screen p-8">
      <GradientBackground />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 bg-black/30 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-white font-semibold">Home</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            Join Game
          </h1>
          <p className="text-xl text-purple-300">Enter the game code to join</p>
        </div>

        {!joined ? (
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
            <form onSubmit={joinGame} className="space-y-6">
              <div>
                <label htmlFor="gameCode" className="block text-white font-semibold mb-2">
                  Game Code
                </label>
                <input
                  id="gameCode"
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="Enter game code"
                  className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="playerName" className="block text-white font-semibold mb-2">
                  Your Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold text-xl px-12 py-4 rounded-xl transition-all transform hover:scale-105 shadow-2xl"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-3xl font-bold text-white mb-2">You're In!</h2>
              <p className="text-xl text-purple-300">
                Welcome to the game, <span className="text-white font-semibold">{playerName}</span>
              </p>
            </div>

            {/* Players List */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">
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
                      className="bg-black/30 rounded-lg p-4 flex items-center justify-between border border-purple-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <span className="text-white font-semibold">{player.name}</span>
                        {player.name === playerName && (
                          <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-300">You</span>
                        )}
                      </div>
                      <span className="text-sm text-purple-400">
                        {new Date(player.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-purple-300">Waiting for the game to start...</p>
              <div className="mt-4">
                <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1"></div>
                <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{ animationDelay: '0.2s' }}></div>
                <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function JoinGamePage() {
  return (
    <Suspense fallback={
      <main className="relative w-full min-h-screen p-8">
        <GradientBackground />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      </main>
    }>
      <JoinGameContent />
    </Suspense>
  );
}
