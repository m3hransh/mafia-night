'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GradientBackground } from '@/components/GradientBackground';
import { RoleSelectionPanel } from '@/components/RoleSelectionPanel';
import { v4 as uuidv4 } from 'uuid';
import { saveModeratorGame, getModeratorGame, clearModeratorGame } from '@/lib/gameStorage';

interface Player {
  id: string;
  name: string;
  created_at: string;
}

interface Game {
  id: string;
  moderator_id: string;
  status: string;
  created_at: string;
}

type GamePhase = 'not-created' | 'waiting-for-players' | 'selecting-roles' | 'game-started';

export default function CreateGamePage() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [moderatorId, setModeratorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('not-created');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const router = useRouter();

  // Check for existing game and restore state on mount
  useEffect(() => {
    const savedGame = getModeratorGame();
    if (savedGame) {
      // Verify game still exists on backend
      fetch(`${API_BASE_URL}/api/games/${savedGame.gameId}`)
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Game not found');
        })
        .then((gameData) => {
          // Restore game state
          setGame(gameData);
          setModeratorId(savedGame.moderatorId);
          setGamePhase(savedGame.phase);
        })
        .catch(() => {
          // Game doesn't exist anymore, clear storage
          clearModeratorGame();
          const id = uuidv4();
          setModeratorId(id);
        });
    } else {
      const id = uuidv4();
      setModeratorId(id);
    }
  }, [API_BASE_URL]);

  // Poll for players when game is created
  useEffect(() => {
    if (!game) return;

    const fetchPlayers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/games/${game.id}/players`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [game, API_BASE_URL]);

  const createGame = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Moderator-ID': moderatorId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create game');
      }

      const gameData = await response.json();
      setGame(gameData);
      setGamePhase('waiting-for-players');
      
      // Save to localStorage
      saveModeratorGame(gameData.id, moderatorId, 'waiting-for-players');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const copyGameCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getJoinUrl = () => {
    if (!game) return '';
    return `${window.location.origin}/join-game?code=${game.id}`;
  };

  const handleStartRoleSelection = () => {
    if (players.length > 0 && game) {
      setGamePhase('selecting-roles');
      saveModeratorGame(game.id, moderatorId, 'selecting-roles');
    }
  };

  const handleRolesSelected = (selectedRoles: { roleId: string; count: number }[]) => {
    // TODO: Send selected roles to backend
    console.log('Selected roles:', selectedRoles);
    setGamePhase('game-started');
    if (game) {
      saveModeratorGame(game.id, moderatorId, 'game-started');
    }
    // Here you would typically send the role selection to the backend
    // and transition to the actual game screen
  };

  const handleCancelRoleSelection = () => {
    setGamePhase('waiting-for-players');
    if (game) {
      saveModeratorGame(game.id, moderatorId, 'waiting-for-players');
    }
  };

  const shareGame = async () => {
    const shareData = {
      title: 'Join Mafia Night Game!',
      text: `Join my Mafia Night game! Game code: ${game?.id}`,
      url: getJoinUrl(),
    };

    try {
      // Use native share API if available (mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(getJoinUrl());
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', err);
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
            Create Game
          </h1>
          <p className="text-xl text-purple-300">Start a new Mafia Night game session</p>
        </div>

        {!game ? (
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
            <div className="text-center">
              <p className="text-purple-200 mb-6">
                Click the button below to create a new game. You'll get a unique game code that players can use to join.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={createGame}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold text-xl px-3 py-3 md:px-12 md:py-6 rounded-xl transition-all transform hover:scale-105 shadow-2xl"
              >
                {loading ? 'Creating Game...' : 'Create Game'}
              </button>
            </div>
          </div>
        ) : gamePhase === 'selecting-roles' ? (
          <RoleSelectionPanel
            playerCount={players.length}
            onRolesSelected={handleRolesSelected}
            onCancel={handleCancelRoleSelection}
          />
        ) : gamePhase === 'game-started' ? (
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Started!</h2>
            <p className="text-purple-300 mb-6">Roles have been assigned. The game can now begin.</p>
            <Link
              href="/"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game Code */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">Game Code</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-2xl text-purple-300 text-center">
                  {game.id}
                </div>
                <button
                  onClick={copyGameCode}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg transition-all"
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="mt-4">
                <p className="text-sm text-purple-300 mb-2">Share this link with players:</p>
                <div className="bg-black/50 rounded-lg p-3 text-sm text-purple-200 break-all mb-3">
                  {getJoinUrl()}
                </div>
                <button
                  onClick={shareGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Game Link
                </button>
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
                        <span className="text-white font-semibold">{player.name}</span>
                      </div>
                      <span className="text-sm text-purple-400">
                        Joined {new Date(player.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleStartRoleSelection}
                disabled={players.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold md:text-lg px-8 py-2 rounded-xl transition-all transform hover:scale-105"
              >
                Select Roles
              </button>
              <Link
                href="/roles"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold md:text-lg px-2 md:px-8 py-2 rounded-xl transition-all transform hover:scale-105 inline-block text-center"
              >
                View Roles
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
