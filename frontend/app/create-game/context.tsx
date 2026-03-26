'use client';

import { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/lib/api-client';
import type { Role } from '@/lib/types';
import { saveModeratorGame, clearModeratorGame, validateModeratorGameState } from '@/lib/gameStorage';
import { deleteGame, removePlayer, distributeRoles, selectRoles, getSelectedRoles, getGameRoles, PlayerRoleAssignment, startDay, startNight, endGame, eliminatePlayer, openVoteSession, closeVoteSession, getCurrentVoteSession, VoteSessionResult } from '@/lib/api';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  created_at: string;
}

export type GamePhase = 'not-created' | 'waiting-for-players' | 'selecting-roles' | 'game-started';
export type DayNightPhase = 'waiting' | 'day' | 'night' | 'ended';

export interface Game {
  id: string;
  moderator_id: string;
  status: string;
  phase: DayNightPhase;
  round_number: number;
  created_at: string;
}

// ── State ─────────────────────────────────────────────────────────────────────

export type State = {
  game: Game | null;
  players: Player[];
  moderatorId: string;
  phase: GamePhase;
  dayNightPhase: DayNightPhase;
  roundNumber: number;
  roleAssignments: PlayerRoleAssignment[];
  selectedRoles: Map<string, number>;
  error: string;
  loading: boolean;
  closing: boolean;
  removingPlayerId: string | null;
  distributingRoles: boolean;
  copySuccess: boolean;
  activeVoteSession: VoteSessionResult | null;
  openingVoteFor: string | null;
  eliminatingPlayerId: string | null;
  eliminatedPlayerIds: Set<string>;
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; moderatorId: string }
  | { type: 'RESTORE'; game: Game; moderatorId: string; phase: GamePhase; roleAssignments: PlayerRoleAssignment[]; selectedRoles: Map<string, number>; dayNightPhase: DayNightPhase; roundNumber: number; activeVoteSession: VoteSessionResult | null }
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
  | { type: 'ROLES_CHANGED'; roles: Map<string, number> }
  | { type: 'PHASE_CHANGED'; dayNightPhase: DayNightPhase; roundNumber: number }
  | { type: 'VOTE_SESSION_UPDATED'; session: VoteSessionResult }
  | { type: 'VOTE_SESSION_CLEARED' }
  | { type: 'OPENING_VOTE_FOR'; playerId: string }
  | { type: 'ELIMINATING_PLAYER'; playerId: string }
  | { type: 'PLAYER_ELIMINATED'; playerId: string }
  | { type: 'ELIMINATE_FAILED' };

// ── localStorage helpers ──────────────────────────────────────────────────────

const SELECTED_ROLES_KEY = 'mafia-night-selected-roles';

function loadSelectedRolesFromStorage(): Map<string, number> {
  if (typeof window === 'undefined') return new Map();
  try {
    const stored = localStorage.getItem(SELECTED_ROLES_KEY);
    if (stored)
      return new Map(Object.entries(JSON.parse(stored)).map(([k, v]) => [k, v as number]));
  } catch {}
  return new Map();
}

function saveSelectedRolesToStorage(roles: Map<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_ROLES_KEY, JSON.stringify(Object.fromEntries(roles)));
  } catch {}
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: State = {
  game: null,
  players: [],
  moderatorId: '',
  phase: 'not-created',
  dayNightPhase: 'waiting',
  roundNumber: 0,
  roleAssignments: [],
  selectedRoles: loadSelectedRolesFromStorage(),
  error: '',
  loading: false,
  closing: false,
  removingPlayerId: null,
  distributingRoles: false,
  copySuccess: false,
  activeVoteSession: null,
  openingVoteFor: null,
  eliminatingPlayerId: null,
  eliminatedPlayerIds: new Set<string>(),
};

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
        selectedRoles: action.selectedRoles,
        dayNightPhase: action.dayNightPhase,
        roundNumber: action.roundNumber,
        activeVoteSession: action.activeVoteSession,
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
      return { ...state, removingPlayerId: null, players: state.players.filter(p => p.id !== action.playerId) };
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
    case 'PHASE_CHANGED':
      return { ...state, dayNightPhase: action.dayNightPhase, roundNumber: action.roundNumber };
    case 'VOTE_SESSION_UPDATED':
      return { ...state, activeVoteSession: action.session, openingVoteFor: null };
    case 'VOTE_SESSION_CLEARED':
      return { ...state, activeVoteSession: null, openingVoteFor: null };
    case 'OPENING_VOTE_FOR':
      return { ...state, openingVoteFor: action.playerId || null };
    case 'ELIMINATING_PLAYER':
      return { ...state, eliminatingPlayerId: action.playerId };
    case 'PLAYER_ELIMINATED':
      return {
        ...state,
        eliminatingPlayerId: null,
        activeVoteSession: null,
        eliminatedPlayerIds: new Set([...state.eliminatedPlayerIds, action.playerId]),
      };
    case 'ELIMINATE_FAILED':
      return { ...state, eliminatingPlayerId: null };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

type CreateGameContextValue = {
  state: State;
  allRoles: Role[];
  createGame: () => Promise<void>;
  copyGameCode: () => void;
  shareGame: () => Promise<void>;
  closeGame: () => Promise<void>;
  handleRemovePlayer: (playerId: string, playerName: string) => Promise<void>;
  handleStartRoleSelection: () => void;
  handleRolesDistribute: () => Promise<void>;
  handleCancelRoleSelection: () => void;
  handleRolesChanged: (roles: Map<string, number>) => void;
  handleStartDay: () => Promise<void>;
  handleStartNight: () => Promise<void>;
  handleEndGame: () => Promise<void>;
  handleOpenVoteSession: (playerId: string, message: string) => Promise<void>;
  handleCloseVoteSession: () => Promise<void>;
  handleClearVoteSession: () => void;
  handleEliminate: (playerId: string) => Promise<void>;
};

const CreateGameContext = createContext<CreateGameContextValue | null>(null);

export function useCreateGameContext(): CreateGameContextValue {
  const ctx = useContext(CreateGameContext);
  if (!ctx) throw new Error('useCreateGameContext must be used within CreateGameProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

async function restoreModeratorSession(
  signal: AbortSignal,
  apiBaseUrl: string,
  dispatch: React.Dispatch<Action>,
) {
  const validatedState = await validateModeratorGameState();
  if (signal.aborted) return;

  if (validatedState) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/games/${validatedState.gameId}`, { signal });
      if (res.ok) {
        const gameData: Game = await res.json();
        const [roles, selectedEntries, activeVoteSession] = await Promise.all([
          getGameRoles(validatedState.gameId, validatedState.moderatorId),
          getSelectedRoles(validatedState.gameId),
          getCurrentVoteSession(validatedState.gameId),
        ]);

        const selectedRoles = new Map<string, number>(
          selectedEntries.map(e => [e.role_id, e.count])
        );

        if (!signal.aborted) {
          dispatch({
            type: 'RESTORE',
            game: gameData,
            moderatorId: validatedState.moderatorId,
            phase: roles?.length > 0 ? 'game-started' : validatedState.phase,
            roleAssignments: roles ?? [],
            selectedRoles,
            dayNightPhase: (gameData.phase ?? 'waiting') as DayNightPhase,
            roundNumber: gameData.round_number ?? 0,
            activeVoteSession,
          });
        }
      } else {
        clearModeratorGame();
        if (!signal.aborted) dispatch({ type: 'INIT', moderatorId: uuidv4() });
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      clearModeratorGame();
      dispatch({ type: 'INIT', moderatorId: uuidv4() });
    }
  } else {
    dispatch({ type: 'INIT', moderatorId: uuidv4() });
  }
}

export function CreateGameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { game, players, moderatorId, phase, selectedRoles } = state;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const router = useRouter();

  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/roles', {});
      if (error) throw new Error('Failed to load roles');
      return (data as Role[]) ?? [];
    },
  });

  useEffect(() => {
    const controller = new AbortController();
    restoreModeratorSession(controller.signal, API_BASE_URL, dispatch);
    return () => controller.abort();
  }, [API_BASE_URL]);

  useEffect(() => {
    saveSelectedRolesToStorage(selectedRoles);
  }, [selectedRoles]);

  useGameWebSocket({
    gameId: game?.id || '',
    enabled: !!game,
    onPlayerJoined: (player) => dispatch({ type: 'PLAYER_JOINED', player }),
    onPlayerLeft: (playerId) => dispatch({ type: 'PLAYER_LEFT', playerId }),
    onRolesDistributed: () => {},
    onGameDeleted: () => { clearModeratorGame(); router.push('/'); },
    onPhaseChanged: (phase, roundNumber) => {
      dispatch({ type: 'PHASE_CHANGED', dayNightPhase: phase as DayNightPhase, roundNumber });
      if (phase === 'day') dispatch({ type: 'VOTE_SESSION_CLEARED' });
    },
    onVoteSessionOpened: (session) => {
      if (session) dispatch({ type: 'VOTE_SESSION_UPDATED', session });
    },
    onBallotCast: (session) => {
      if (session) dispatch({ type: 'VOTE_SESSION_UPDATED', session });
    },
    onVoteSessionClosed: (session) => {
      if (session) dispatch({ type: 'VOTE_SESSION_UPDATED', session });
    },
    onPlayerEliminated: (playerId) => {
      if (playerId) dispatch({ type: 'PLAYER_ELIMINATED', playerId });
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
        const err = await response.json();
        throw new Error(err.error || 'Failed to create game');
      }
      const gameData = await response.json();
      dispatch({ type: 'CREATED', game: gameData });
      saveModeratorGame(gameData.id, moderatorId, 'waiting-for-players');

      const currentRoles = selectedRoles;
      if (currentRoles.size > 0) {
        selectRoles(
          gameData.id,
          moderatorId,
          Array.from(currentRoles.entries()).map(([role_id, count]) => ({ role_id, count }))
        ).catch(() => {});
      }
    } catch (err) {
      dispatch({ type: 'CREATE_FAILED', error: err instanceof Error ? err.message : 'Failed to create game' });
    }
  };

  const getJoinUrl = () =>
    typeof window !== 'undefined' && game
      ? `${window.location.origin}/join-game?code=${game.id}`
      : '';

  const copyGameCode = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.id);
    dispatch({ type: 'SET_COPY_SUCCESS', value: true });
    setTimeout(() => dispatch({ type: 'SET_COPY_SUCCESS', value: false }), 2000);
  };

  const shareGame = async () => {
    const shareData = { title: 'Join Mafia Night Game!', text: `Join my Mafia Night game! Game code: ${game?.id}`, url: getJoinUrl() };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
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

  const handleStartRoleSelection = () => {
    if (game) {
      dispatch({ type: 'SELECT_ROLES' });
      saveModeratorGame(game.id, moderatorId, 'selecting-roles');
    }
  };

  const handleRolesDistribute = async () => {
    if (!game) return;
    dispatch({ type: 'DISTRIBUTING' });
    try {
      await distributeRoles(game.id, moderatorId);
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

  const handleRolesChanged = (roles: Map<string, number>) => {
    dispatch({ type: 'ROLES_CHANGED', roles });
    if (game && roles.size > 0) {
      selectRoles(
        game.id,
        moderatorId,
        Array.from(roles.entries()).map(([role_id, count]) => ({ role_id, count }))
      ).catch(() => {});
    }
  };

  const handleStartDay = async () => {
    if (!game) return;
    try {
      const result = await startDay(game.id, moderatorId);
      dispatch({ type: 'PHASE_CHANGED', dayNightPhase: result.phase, roundNumber: result.round_number });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to start day' });
    }
  };

  const handleStartNight = async () => {
    if (!game) return;
    try {
      const result = await startNight(game.id, moderatorId);
      dispatch({ type: 'PHASE_CHANGED', dayNightPhase: result.phase, roundNumber: result.round_number });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to start night' });
    }
  };

  const handleEndGame = async () => {
    if (!game) return;
    try {
      const result = await endGame(game.id, moderatorId);
      dispatch({ type: 'PHASE_CHANGED', dayNightPhase: result.phase, roundNumber: result.round_number });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to end game' });
    }
  };

  const handleOpenVoteSession = async (playerId: string, message: string) => {
    if (!game) return;
    dispatch({ type: 'OPENING_VOTE_FOR', playerId });
    try {
      const session = await openVoteSession(game.id, moderatorId, playerId, message);
      dispatch({ type: 'VOTE_SESSION_UPDATED', session });
    } catch (err) {
      dispatch({ type: 'OPENING_VOTE_FOR', playerId: '' });
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to open vote' });
    }
  };

  const handleCloseVoteSession = async () => {
    if (!game || !state.activeVoteSession) return;
    try {
      const session = await closeVoteSession(state.activeVoteSession.session_id, moderatorId);
      dispatch({ type: 'VOTE_SESSION_UPDATED', session });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to close vote' });
    }
  };

  const handleClearVoteSession = () => {
    dispatch({ type: 'VOTE_SESSION_CLEARED' });
  };

  const handleEliminate = async (playerId: string) => {
    if (!game) return;
    dispatch({ type: 'ELIMINATING_PLAYER', playerId });
    try {
      await eliminatePlayer(game.id, moderatorId, playerId);
      dispatch({ type: 'PLAYER_ELIMINATED', playerId });
    } catch (err) {
      dispatch({ type: 'ELIMINATE_FAILED' });
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to eliminate player' });
    }
  };

  const value = useMemo(() => ({
    state,
    allRoles,
    createGame,
    copyGameCode,
    shareGame,
    closeGame,
    handleRemovePlayer,
    handleStartRoleSelection,
    handleRolesDistribute,
    handleCancelRoleSelection,
    handleRolesChanged,
    handleStartDay,
    handleStartNight,
    handleEndGame,
    handleOpenVoteSession,
    handleCloseVoteSession,
    handleClearVoteSession,
    handleEliminate,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state, allRoles]);

  return (
    <CreateGameContext.Provider value={value}>
      {children}
    </CreateGameContext.Provider>
  );
}
