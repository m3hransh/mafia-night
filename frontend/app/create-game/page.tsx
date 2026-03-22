'use client';

import { useReducer, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleSelectionPanel } from '@/components/RoleSelectionPanel';
import { CreateGameInitial, WaitingForPlayers, GameStarted, RoleDistributing } from '@/components';
import { v4 as uuidv4 } from 'uuid';
import { saveModeratorGame, clearModeratorGame, validateModeratorGameState } from '@/lib/gameStorage';
import { deleteGame, removePlayer, distributeRoles, getGameRoles, PlayerRoleAssignment } from '@/lib/api';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Role } from '@/lib/types';

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

const SELECTED_ROLES_KEY = 'mafia-night-selected-roles';

function loadSelectedRolesFromStorage(): Map<string, number> {
  if (typeof window === 'undefined') return new Map();
  try {
    const stored = localStorage.getItem(SELECTED_ROLES_KEY);
    if (stored) {
      return new Map(Object.entries(JSON.parse(stored)).map(([k, v]) => [k, v as number]));
    }
  } catch {}
  return new Map();
}

function saveSelectedRolesToStorage(roles: Map<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_ROLES_KEY, JSON.stringify(Object.fromEntries(roles)));
  } catch {}
}

// ── State ────────────────────────────────────────────────────────────────────

type State = {
  game: Game | null;
  players: Player[];
  moderatorId: string;
  phase: GamePhase;
  roleAssignments: PlayerRoleAssignment[];
  selectedRoles: Map<string, number>;
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
  selectedRoles: loadSelectedRolesFromStorage(),
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
  | { type: 'SET_ERROR'; error: string }
  | { type: 'ROLES_CHANGED'; roles: Map<string, number> };

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

    case 'ROLES_CHANGED':
      return { ...state, selectedRoles: action.roles };

    default:
      return state;
  }
}

// ── Selected Roles Summary ────────────────────────────────────────────────────

const teamColors = { mafia: 'red', village: 'green', independent: 'yellow' } as const;

function SelectedRolesSummary({
  selectedRoles,
  allRoles,
  playerCount,
}: {
  selectedRoles: Map<string, number>;
  allRoles: Role[];
  playerCount: number;
}) {
  const total = useMemo(
    () => Array.from(selectedRoles.values()).reduce((s, c) => s + c, 0),
    [selectedRoles]
  );

  const entries = useMemo(() =>
    Array.from(selectedRoles.entries())
      .map(([roleId, count]) => ({ role: allRoles.find(r => r.id === roleId), count }))
      .filter((e): e is { role: Role; count: number } => !!e.role),
    [selectedRoles, allRoles]
  );

  const isComplete = total === playerCount;

  return (
    <div className="mt-6 bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Pre-selected Roles</h3>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          isComplete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {total} / {playerCount} {isComplete ? '✓ Ready' : 'slots'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map(({ role, count }) => (
          <div key={role.id}
            className={`flex items-center gap-2 bg-black/30 border border-${teamColors[role.team as keyof typeof teamColors]}-500/30 rounded-lg px-3 py-2`}>
            <span className={`w-2 h-2 rounded-full bg-${teamColors[role.team as keyof typeof teamColors]}-500`} />
            <span className="text-white text-sm font-medium">{role.name}</span>
            <span className={`text-${teamColors[role.team as keyof typeof teamColors]}-400 text-sm font-bold`}>×{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function CreateGamePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { game, players, moderatorId, phase, roleAssignments, selectedRoles, error, loading, closing,
    removingPlayerId, distributingRoles, copySuccess } = state;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const router = useRouter();

  // Fetch roles for the summary card (served from cache — no extra fetch if /roles visited)
  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/roles', {});
      if (error) throw new Error('Failed to load roles');
      return (data as Role[]) ?? [];
    },
  });

  // Persist selected roles to localStorage whenever they change
  useEffect(() => {
    saveSelectedRolesToStorage(selectedRoles);
  }, [selectedRoles]);

  useEffect(() => {
    const controller = new AbortController();

    const checkSavedGame = async () => {
      const validatedState = await validateModeratorGameState();
      if (controller.signal.aborted) return;

      if (validatedState) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/games/${validatedState.gameId}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const gameData = await res.json();
            const roles = await getGameRoles(validatedState.gameId, validatedState.moderatorId);
            if (!controller.signal.aborted) {
              dispatch({
                type: 'RESTORE',
                game: gameData,
                moderatorId: validatedState.moderatorId,
                phase: roles?.length > 0 ? 'game-started' : validatedState.phase,
                roleAssignments: roles ?? [],
              });
            }
          } else {
            clearModeratorGame();
            if (!controller.signal.aborted) dispatch({ type: 'INIT', moderatorId: uuidv4() });
          }
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
          clearModeratorGame();
          dispatch({ type: 'INIT', moderatorId: uuidv4() });
        }
      } else {
        dispatch({ type: 'INIT', moderatorId: uuidv4() });
      }
    };

    checkSavedGame();
    return () => controller.abort();
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
              selectedRoles={selectedRoles}
              onRolesChanged={(roles) => dispatch({ type: 'ROLES_CHANGED', roles })}
              onRolesSelected={handleRolesSelected}
              onCancel={handleCancelRoleSelection}
            />
          )
        ) : phase === 'game-started' ? (
          <GameStarted roleAssignments={roleAssignments} error={error} closing={closing} onCloseGame={closeGame} />
        ) : (
          <>
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
            {selectedRoles.size > 0 && (
              <SelectedRolesSummary selectedRoles={selectedRoles} allRoles={allRoles} playerCount={players.length} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
