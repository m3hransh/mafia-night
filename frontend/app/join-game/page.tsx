'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GradientBackground } from '@/components/GradientBackground';
import { savePlayerGame, getPlayerGame, clearPlayerGame, validatePlayerGameState } from '@/lib/gameStorage';
import { removePlayer, getPlayerRole, Role } from '@/lib/api';
import { OptimizedVideo } from '@/components/OptimizedVideo';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';

interface Player {
  id: string;
  name: string;
  created_at: string;
}

function JoinGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const [assignedRole, setAssignedRole] = useState<Role | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // Check for existing player session on mount with backend validation
  useEffect(() => {
    const checkSavedPlayer = async () => {
      const validatedState = await validatePlayerGameState();
      if (validatedState) {
        // Restore player state
        setGameCode(validatedState.gameId);
        setPlayerName(validatedState.playerName);
        setPlayerId(validatedState.playerId);
        setJoined(true);

          const role = await getPlayerRole(validatedState.gameId, validatedState.playerId);
          if (role) {
            setAssignedRole(role);
          }
      }
    };

    checkSavedPlayer();
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !gameCode) {
      setGameCode(code);
    }
  }, [searchParams, gameCode]);

  // WebSocket connection for real-time updates
  useGameWebSocket({
    gameId: gameCode,
    enabled: joined && !assignedRole,
    onPlayerJoined: (player) => {
      setPlayers(prev => {
        if (prev.some(p => p.id === player.id)) return prev;
        return [...prev, player];
      });
    },
    onPlayerLeft: (playerId) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    },
    onRolesDistributed: async () => {
      // Check if we got a role
      if (gameCode && playerId) {
        try {
          const role = await getPlayerRole(gameCode, playerId);
          setAssignedRole(role);
        } catch (err) {
          console.error('Error fetching role after distribution:', err);
        }
      }
    },
    onGameDeleted: () => {
      clearPlayerGame();
      router.push('/');
    },
    onUpdate: (update) => {
      if (update.type === 'initial_state' && update.payload?.players) {
        setPlayers(update.payload.players);
      }
    }
  });

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

  const leaveGame = async () => {
    if (!confirm('Are you sure you want to leave the game?')) {
      return;
    }

    setLeaving(true);
    setError('');

      // Only moderator can remove player
      // await removePlayer(gameCode, playerId);
      clearPlayerGame();
      router.push('/');
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
            {assignedRole ? (
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
                      onClick={leaveGame}
                      disabled={leaving}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-all"
                    >
                      {leaving ? 'Leaving...' : 'Leave Game'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* Success Message */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
              <div className="text-5xl  text-green-500 mb-2">✓</div>
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
                        <div className="md:w-10 md:h-10 w-5 h-5  text-sm bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
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
                <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{ animationDelay: '0.2s' }}></div>
                <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{ animationDelay: '0.4s' }}></div>
              </div>

              {/* Leave Game Button */}
              <button
                onClick={leaveGame}
                disabled={leaving}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-all"
              >
                {leaving ? 'Leaving...' : 'Leave Game'}
              </button>
            </div>
              </>
            )}
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
