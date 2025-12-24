'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleSelectionPanel } from '@/components/RoleSelectionPanel';
import { CreateGameInitial, WaitingForPlayers, GameStarted, RoleDistributing } from '@/components';
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
            // check if the roles are distributed by api
            const roles = await getGameRoles(validatedState.gameId, validatedState.moderatorId);
            if (roles && roles.length > 0) {
              setRoleAssignments(roles);
              setGamePhase('game-started');
            } else {
              setGamePhase(validatedState.phase);
            }
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
          <CreateGameInitial
            loading={loading}
            error={error}
            onCreateGame={createGame}
          />
        ) : gamePhase === 'selecting-roles' ? (
          distributingRoles ? (
            <RoleDistributing />
          ) : (
            <RoleSelectionPanel
              playerCount={players.length}
              onRolesSelected={handleRolesSelected}
              onCancel={handleCancelRoleSelection}
            />
          )
        ) : gamePhase === 'game-started' ? (
          <GameStarted
            roleAssignments={roleAssignments}
            error={error}
            closing={closing}
            onCloseGame={closeGame}
          />
        ) : (
          <WaitingForPlayers
            gameId={game.id}
            players={players}
            removingPlayerId={removingPlayerId}
            copySuccess={copySuccess}
            closing={closing}
            onCopyGameCode={copyGameCode}
            onShareGame={shareGame}
            onRemovePlayer={handleRemovePlayer}
            onStartRoleSelection={handleStartRoleSelection}
            onCloseGame={closeGame}
          />
        )}
      </div>
    </main>
  );
}
