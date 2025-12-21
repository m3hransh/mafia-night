'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GradientBackground } from '@/components/GradientBackground';
import { RoleSelectionPanel } from '@/components/RoleSelectionPanel';
import { v4 as uuidv4 } from 'uuid';
import { saveModeratorGame, getModeratorGame, clearModeratorGame, validateModeratorGameState } from '@/lib/gameStorage';
import { deleteGame, removePlayer, distributeRoles, getGameRoles, PlayerRoleAssignment } from '@/lib/api';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';

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
  const [closing, setClosing] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('not-created');
  const [distributingRoles, setDistributingRoles] = useState(false);
  const [roleAssignments, setRoleAssignments] = useState<PlayerRoleAssignment[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const router = useRouter();

  // Check for existing game and restore state on mount with backend validation
  useEffect(() => {
    const checkSavedGame = async () => {
      const validatedState = await validateModeratorGameState();
      if (validatedState) {
        // Fetch full game data
        try {
          const res = await fetch(`${API_BASE_URL}/api/games/${validatedState.gameId}`);
          if (res.ok) {
            const gameData = await res.json();
            setGame(gameData);
            setModeratorId(validatedState.moderatorId);
            setGamePhase(validatedState.phase);
          } else {
            clearModeratorGame();
            setModeratorId(uuidv4());
          }
        } catch {
          clearModeratorGame();
          setModeratorId(uuidv4());
        }
      } else {
        setModeratorId(uuidv4());
      }
    };

    checkSavedGame();
  }, [API_BASE_URL]);

  // WebSocket connection for real-time updates
  useGameWebSocket({
    gameId: game?.id || '',
    enabled: !!game && gamePhase !== 'game-started',
    onPlayerJoined: (player) => {
      setPlayers(prev => {
        // Avoid duplicates
        if (prev.some(p => p.id === player.id)) return prev;
        return [...prev, player];
      });
    },
    onPlayerLeft: (playerId) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    },
    onRolesDistributed: () => {
      // Optionally handle role distribution updates
    },
    onGameDeleted: () => {
      clearModeratorGame();
      router.push('/');
    },
    onUpdate: (update) => {
      // Handle initial state
      if (update.type === 'initial_state' && update.payload?.players) {
        setPlayers(update.payload.players);
      }
    }
  });

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

  const handleRolesSelected = async (selectedRoles: { roleId: string; count: number }[]) => {
    if (!game) return;

    setDistributingRoles(true);
    setError('');

    try {
      const rolesPayload = selectedRoles.map(r => ({
        role_id: r.roleId,
        count: r.count
      }));

      await distributeRoles(game.id, moderatorId, rolesPayload);
      
      // Fetch role assignments for moderator view
      const assignments = await getGameRoles(game.id, moderatorId);
      setRoleAssignments(assignments);
      
      setGamePhase('game-started');
      saveModeratorGame(game.id, moderatorId, 'game-started');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute roles');
      setDistributingRoles(false);
    } finally {
      setDistributingRoles(false);
    }
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

  const closeGame = async () => {
    if (!game) return;

    if (!confirm('Are you sure you want to close this game? All players will be removed and the game will be deleted.')) {
      return;
    }

    setClosing(true);
    setError('');

    try {
      await deleteGame(game.id, moderatorId);
      clearModeratorGame();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close game');
      setClosing(false);
    }
  };

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    if (!game) return;

    if (!confirm(`Remove ${playerName} from the game?`)) {
      return;
    }

    setRemovingPlayerId(playerId);
    setError('');

    try {
      await removePlayer(game.id, playerId);
      // Update local state - remove from players list
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove player');
    } finally {
      setRemovingPlayerId(null);
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
          distributingRoles ? (
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30 text-center">
              <div className="text-white text-2xl mb-4">Distributing roles...</div>
              <div className="flex justify-center gap-2">
                <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : (
            <RoleSelectionPanel
              playerCount={players.length}
              onRolesSelected={handleRolesSelected}
              onCancel={handleCancelRoleSelection}
            />
          )
        ) : gamePhase === 'game-started' ? (
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">Roles Distributed!</h2>
            <p className="text-purple-300 mb-6 text-center">All players have been assigned their roles.</p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Display role assignments by team */}
            <div className="space-y-6 mb-8">
              {['mafia', 'village', 'independent'].map(team => {
                const teamAssignments = roleAssignments.filter(a => a.team === team);
                if (teamAssignments.length === 0) return null;

                const teamColors = {
                  mafia: { bg: 'bg-red-900/30', border: 'border-red-500/30', text: 'text-red-400', label: 'Mafia Team' },
                  village: { bg: 'bg-green-900/30', border: 'border-green-500/30', text: 'text-green-400', label: 'Village Team' },
                  independent: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Independent' },
                };

                const colors = teamColors[team as keyof typeof teamColors];

                return (
                  <div key={team} className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
                    <h3 className={`text-2xl font-bold ${colors.text} mb-4`}>
                      {colors.label} ({teamAssignments.length})
                    </h3>
                    <div className="space-y-3">
                      {teamAssignments.map(assignment => (
                        <div key={assignment.player_id} className="bg-black/40 rounded-lg p-4 flex items-center gap-4">
                          <div className="flex-1">
                            <div className="text-white font-semibold">{assignment.player_name}</div>
                            <div className={`text-sm ${colors.text}`}>{assignment.role_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={closeGame}
                disabled={closing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-all"
              >
                {closing ? 'Closing...' : 'End Game'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game Code */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">Game Code</h2>
              <div className="flex items-center gap-4">
                <div data-testid="game-code" className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-2xl text-purple-300 text-center">
                  {game.id}
                </div>
                <button
                  data-testid="copy-game-code-button"
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
                        <div>
                          <span className="text-white font-semibold block">{player.name}</span>
                          <span className="text-xs text-purple-400">
                            Joined {new Date(player.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player.id, player.name)}
                        disabled={removingPlayerId === player.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-all"
                      >
                        {removingPlayerId === player.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
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

              {/* Close Game Button */}
              <div className="text-center">
                <button
                  onClick={closeGame}
                  disabled={closing}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-all"
                >
                  {closing ? 'Closing Game...' : 'Close Game'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
