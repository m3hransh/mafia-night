'use client';

import { useReducer, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleSelectionPanel } from '@/components/RoleSelectionPanel';
import { CreateGameInitial, WaitingForPlayers, GameStarted, RoleDistributing } from '@/components';
import { v4 as uuidv4 } from 'uuid';
import { saveModeratorGame, clearModeratorGame, validateModeratorGameState } from '@/lib/gameStorage';
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

// ── State ────────────────────────────────────────────────────────────────────

type State = {
  game: Game | null;
  players: Player[];
  moderatorId: string;
  phase: GamePhase;
  roleAssignments: PlayerRoleAssignment[];
  error: string;
  loading: boolean;
  closing: boolean;
  removingPlayerId: string | null;
  distributingRoles: boolean;
  copySuccess: boolean;
};

const initialState: State = {
  game: null,
  players: [],
  moderatorId: '',
  phase: 'not-created',
  roleAssignments: [],
  error: '',
  loading: false,
  closing: false,
  removingPlayerId: null,
  distributingRoles: false,
  copySuccess: false,
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; moderatorId: string }
  | { type: 'RESTORE'; game: Game; moderatorId: string; phase: GamePhase; roleAssignments: PlayerRoleAssignment[] }
  | { type: 'CREATING' }
  | { type: 'CREATED'; game: Game }
  | { type: 'CREATE_FAILED'; error: string }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'PLAYERS_LOADED'; players: Player[] }
  | { type: 'SELECT_ROLES' }
  | { type: 'CANCEL_SELECT_ROLES' }
  | { type: 'DISTRIBUTING' }
  | { type: 'DISTRIBUTED'; roleAssignments: PlayerRoleAssignment[] }
  | { type: 'DISTRIBUTE_FAILED'; error: string }
  | { type: 'REMOVING_PLAYER'; playerId: string }
  | { type: 'PLAYER_REMOVED'; playerId: string }
  | { type: 'REMOVE_PLAYER_FAILED'; error: string }
  | { type: 'CLOSING' }
  | { type: 'SET_COPY_SUCCESS'; value: boolean }
  | { type: 'SET_ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...state, moderatorId: action.moderatorId };

    case 'RESTORE':
      return {
        ...state,
        game: action.game,
        moderatorId: action.moderatorId,
        phase: action.phase,
        roleAssignments: action.roleAssignments,
      };

    case 'CREATING':
      return { ...state, loading: true, error: '' };

    case 'CREATED':
      return { ...state, loading: false, game: action.game, phase: 'waiting-for-players' };

    case 'CREATE_FAILED':
      return { ...state, loading: false, error: action.error };

    case 'PLAYER_JOINED':
      if (state.players.some(p => p.id === action.player.id)) return state;
      return { ...state, players: [...state.players, action.player] };

    case 'PLAYER_LEFT':
      return { ...state, players: state.players.filter(p => p.id !== action.playerId) };

    case 'PLAYERS_LOADED':
      return { ...state, players: action.players };

    case 'SELECT_ROLES':
      return { ...state, phase: 'selecting-roles' };

    case 'CANCEL_SELECT_ROLES':
      return { ...state, phase: 'waiting-for-players' };

    case 'DISTRIBUTING':
      return { ...state, distributingRoles: true, error: '' };

    case 'DISTRIBUTED':
      return { ...state, distributingRoles: false, roleAssignments: action.roleAssignments, phase: 'game-started' };

    case 'DISTRIBUTE_FAILED':
      return { ...state, distributingRoles: false, error: action.error };

    case 'REMOVING_PLAYER':
      return { ...state, removingPlayerId: action.playerId, error: '' };

    case 'PLAYER_REMOVED':
      return {
        ...state,
        removingPlayerId: null,
        players: state.players.filter(p => p.id !== action.playerId),
      };

    case 'REMOVE_PLAYER_FAILED':
      return { ...state, removingPlayerId: null, error: action.error };

    case 'CLOSING':
      return { ...state, closing: true, error: '' };

    case 'SET_COPY_SUCCESS':
      return { ...state, copySuccess: action.value };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    default:
      return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateGamePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { game, players, moderatorId, phase, roleAssignments, error, loading, closing,
    removingPlayerId, distributingRoles, copySuccess } = state;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const router = useRouter();

  useEffect(() => {
    const checkSavedGame = async () => {
      const validatedState = await validateModeratorGameState();
      if (validatedState) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/games/${validatedState.gameId}`);
          if (res.ok) {
            const gameData = await res.json();
            const roles = await getGameRoles(validatedState.gameId, validatedState.moderatorId);
            dispatch({
              type: 'RESTORE',
              game: gameData,
              moderatorId: validatedState.moderatorId,
              phase: roles?.length > 0 ? 'game-started' : validatedState.phase,
              roleAssignments: roles ?? [],
            });
          } else {
            clearModeratorGame();
            dispatch({ type: 'INIT', moderatorId: uuidv4() });
          }
        } catch {
          clearModeratorGame();
          dispatch({ type: 'INIT', moderatorId: uuidv4() });
        }
      } else {
        dispatch({ type: 'INIT', moderatorId: uuidv4() });
      }
    };

    checkSavedGame();
  }, [API_BASE_URL]);

  useGameWebSocket({
    gameId: game?.id || '',
    enabled: !!game && phase !== 'game-started',
    onPlayerJoined: (player) => dispatch({ type: 'PLAYER_JOINED', player }),
    onPlayerLeft: (playerId) => dispatch({ type: 'PLAYER_LEFT', playerId }),
    onRolesDistributed: () => {},
    onGameDeleted: () => {
      clearModeratorGame();
      router.push('/');
    },
    onUpdate: (update) => {
      if (update.type === 'initial_state' && update.payload?.players) {
        dispatch({ type: 'PLAYERS_LOADED', players: update.payload.players });
      }
    },
  });

  const createGame = async () => {
    dispatch({ type: 'CREATING' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Moderator-ID': moderatorId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create game');
      }
      const gameData = await response.json();
      dispatch({ type: 'CREATED', game: gameData });
      saveModeratorGame(gameData.id, moderatorId, 'waiting-for-players');
    } catch (err) {
      dispatch({ type: 'CREATE_FAILED', error: err instanceof Error ? err.message : 'Failed to create game' });
    }
  };

  const copyGameCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.id);
      dispatch({ type: 'SET_COPY_SUCCESS', value: true });
      setTimeout(() => dispatch({ type: 'SET_COPY_SUCCESS', value: false }), 2000);
    }
  };

  const getJoinUrl = () => game ? `${window.location.origin}/join-game?code=${game.id}` : '';

  const handleStartRoleSelection = () => {
    if (game) {
      dispatch({ type: 'SELECT_ROLES' });
      saveModeratorGame(game.id, moderatorId, 'selecting-roles');
    }
  };

  const handleRolesSelected = async (selectedRoles: { roleId: string; count: number }[]) => {
    if (!game) return;
    dispatch({ type: 'DISTRIBUTING' });
    try {
      await distributeRoles(game.id, moderatorId, selectedRoles.map(r => ({ role_id: r.roleId, count: r.count })));
      const assignments = await getGameRoles(game.id, moderatorId);
      dispatch({ type: 'DISTRIBUTED', roleAssignments: assignments });
      saveModeratorGame(game.id, moderatorId, 'game-started');
    } catch (err) {
      dispatch({ type: 'DISTRIBUTE_FAILED', error: err instanceof Error ? err.message : 'Failed to distribute roles' });
    }
  };

  const handleCancelRoleSelection = () => {
    dispatch({ type: 'CANCEL_SELECT_ROLES' });
    if (game) saveModeratorGame(game.id, moderatorId, 'waiting-for-players');
  };

  const shareGame = async () => {
    const shareData = {
      title: 'Join Mafia Night Game!',
      text: `Join my Mafia Night game! Game code: ${game?.id}`,
      url: getJoinUrl(),
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(getJoinUrl());
        dispatch({ type: 'SET_COPY_SUCCESS', value: true });
        setTimeout(() => dispatch({ type: 'SET_COPY_SUCCESS', value: false }), 2000);
      }
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  };

  const closeGame = async () => {
    if (!game) return;
    if (!confirm('Are you sure you want to close this game? All players will be removed and the game will be deleted.')) return;
    dispatch({ type: 'CLOSING' });
    try {
      await deleteGame(game.id, moderatorId);
      clearModeratorGame();
      router.push('/');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to close game' });
    }
  };

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    if (!game) return;
    if (!confirm(`Remove ${playerName} from the game?`)) return;
    dispatch({ type: 'REMOVING_PLAYER', playerId });
    try {
      await removePlayer(game.id, playerId);
      dispatch({ type: 'PLAYER_REMOVED', playerId });
    } catch (err) {
      dispatch({ type: 'REMOVE_PLAYER_FAILED', error: err instanceof Error ? err.message : 'Failed to remove player' });
    }
  };

  return (
    <main className="relative w-full min-h-screen p-8">
      <div className="max-w-4xl mx-auto relative z-10">
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
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">Create Game</h1>
          <p className="text-xl text-purple-300">Start a new Mafia Night game session</p>
        </div>

        {!game ? (
          <CreateGameInitial loading={loading} error={error} onCreateGame={createGame} />
        ) : phase === 'selecting-roles' ? (
          distributingRoles ? (
            <RoleDistributing />
          ) : (
            <RoleSelectionPanel
              playerCount={players.length}
              onRolesSelected={handleRolesSelected}
              onCancel={handleCancelRoleSelection}
            />
          )
        ) : phase === 'game-started' ? (
          <GameStarted roleAssignments={roleAssignments} error={error} closing={closing} onCloseGame={closeGame} />
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
