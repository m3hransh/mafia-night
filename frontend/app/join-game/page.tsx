'use client';

import { useReducer, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { savePlayerGame, clearPlayerGame, validatePlayerGameState } from '@/lib/gameStorage';
import { getPlayerRole, getSelectedRoles, Role, Player, SelectedRoleEntry } from '@/lib/api';
import { JoinLobby } from '@/components/JoinLobby';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { AssignedRole } from '@/components/AssignedRole';
import { JoinGameForm } from '@/components/JoinGameForm';

// ── State ─────────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'not-joined' | 'waiting' | 'role-assigned';

type State = {
  phase: Phase;
  gameCode: string;
  playerName: string;
  playerId: string;
  players: Player[];
  assignedRole: Role | null;
  selectedRoles: SelectedRoleEntry[];
  leaving: boolean;
};

const initialState: State = {
  phase: 'loading',
  gameCode: '',
  playerName: '',
  playerId: '',
  players: [],
  assignedRole: null,
  selectedRoles: [],
  leaving: false,
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; gameCode?: string }
  | { type: 'RESTORE'; gameCode: string; playerName: string; playerId: string; assignedRole: Role | null }
  | { type: 'SET_GAME_CODE'; code: string }
  | { type: 'JOINED'; gameCode: string; playerId: string; playerName: string }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'PLAYERS_LOADED'; players: Player[] }
  | { type: 'ROLE_ASSIGNED'; role: Role }
  | { type: 'SELECTED_ROLES_LOADED'; roles: SelectedRoleEntry[] }
  | { type: 'LEAVING' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...state, phase: 'not-joined', gameCode: action.gameCode ?? state.gameCode };

    case 'RESTORE':
      return {
        ...state,
        phase: action.assignedRole ? 'role-assigned' : 'waiting',
        gameCode: action.gameCode,
        playerName: action.playerName,
        playerId: action.playerId,
        assignedRole: action.assignedRole,
      };

    case 'SET_GAME_CODE':
      return state.gameCode ? state : { ...state, gameCode: action.code };

    case 'JOINED':
      return {
        ...state,
        phase: 'waiting',
        gameCode: action.gameCode,
        playerId: action.playerId,
        playerName: action.playerName,
      };

    case 'PLAYER_JOINED':
      if (state.players.some(p => p.id === action.player.id)) return state;
      return { ...state, players: [...state.players, action.player] };

    case 'PLAYER_LEFT':
      return { ...state, players: state.players.filter(p => p.id !== action.playerId) };

    case 'PLAYERS_LOADED':
      return { ...state, players: action.players };

    case 'ROLE_ASSIGNED':
      return { ...state, phase: 'role-assigned', assignedRole: action.role };

    case 'SELECTED_ROLES_LOADED':
      return { ...state, selectedRoles: action.roles };

    case 'LEAVING':
      return { ...state, leaving: true };

    default:
      return state;
  }
}

// ── Inner component (needs Suspense because of useSearchParams) ────────────────

function JoinGameContent() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { phase, gameCode, playerName, playerId, players, assignedRole, selectedRoles, leaving } = state;

  const searchParams = useSearchParams();
  const router = useRouter();

  // Restore session from localStorage with backend validation
  useEffect(() => {
    const controller = new AbortController();

    const checkSavedPlayer = async () => {
      try {
        const validatedState = await validatePlayerGameState();
        if (controller.signal.aborted) return;

        if (validatedState) {
          let role: Role | null = null;
          try {
            role = await getPlayerRole(validatedState.gameId, validatedState.playerId);
          } catch {
            // No role assigned yet — that's fine
          }
          if (!controller.signal.aborted) {
            dispatch({
              type: 'RESTORE',
              gameCode: validatedState.gameId,
              playerName: validatedState.playerName,
              playerId: validatedState.playerId,
              assignedRole: role,
            });
          }
        } else {
          const urlCode = searchParams.get('code') ?? undefined;
          if (!controller.signal.aborted) dispatch({ type: 'INIT', gameCode: urlCode });
        }
      } catch {
        if (!controller.signal.aborted) dispatch({ type: 'INIT' });
      }
    };

    checkSavedPlayer();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL ?code param after initial load
  useEffect(() => {
    if (phase === 'not-joined') {
      const code = searchParams.get('code');
      if (code) dispatch({ type: 'SET_GAME_CODE', code });
    }
  }, [searchParams, phase]);

  // Fetch selected roles whenever we're in the waiting phase
  useEffect(() => {
    if (phase !== 'waiting' || !gameCode) return;
    getSelectedRoles(gameCode).then(roles => {
      if (roles.length > 0) dispatch({ type: 'SELECTED_ROLES_LOADED', roles });
    }).catch(() => {});
  }, [phase, gameCode]);

  const refreshSelectedRoles = async () => {
    if (!gameCode) return;
    try {
      const roles = await getSelectedRoles(gameCode);
      dispatch({ type: 'SELECTED_ROLES_LOADED', roles });
    } catch {
      // ignore
    }
  };

  useGameWebSocket({
    gameId: gameCode,
    enabled: phase === 'waiting',
    onPlayerJoined: (player) => dispatch({ type: 'PLAYER_JOINED', player }),
    onPlayerLeft: (pid) => dispatch({ type: 'PLAYER_LEFT', playerId: pid }),
    onRolesSelected: refreshSelectedRoles,
    onRolesDistributed: async () => {
      if (gameCode && playerId) {
        try {
          const role = await getPlayerRole(gameCode, playerId);
          if (role) dispatch({ type: 'ROLE_ASSIGNED', role });
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
      if (update.type === 'initial_state') {
        if (update.payload?.players) {
          dispatch({ type: 'PLAYERS_LOADED', players: update.payload.players });
        }
        if (update.payload?.selected_roles?.length > 0) {
          dispatch({ type: 'SELECTED_ROLES_LOADED', roles: update.payload.selected_roles });
        }
      }
    },
  });

  const joinGameHandler = (gameId: string, player: Player | null) => {
    if (!player) return;
    savePlayerGame(gameId, player.id, player.name);
    dispatch({ type: 'JOINED', gameCode: gameId, playerId: player.id, playerName: player.name });
  };

  const leaveGameHandler = () => {
    if (!confirm('Are you sure you want to leave the game?')) return;
    dispatch({ type: 'LEAVING' });
    clearPlayerGame();
    router.push('/');
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6" />
        <h2 className="text-2xl font-bold text-white animate-pulse">Loading Game State...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto relative z-10">
      <Link href="/"
        className="inline-flex items-center gap-2 mb-4 bg-black/30 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-white font-semibold">Home</span>
      </Link>

      {phase === 'role-assigned' && assignedRole ? (
        <AssignedRole assignedRole={assignedRole} playerName={playerName} leaving={leaving} onLeaveGame={leaveGameHandler} />
      ) : (
        <div className="text-center mb-12 space-y-6 p-4">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">Join Game</h1>
          <p className="text-xl text-purple-300 mb-4">Enter the game code to join</p>
          {phase === 'not-joined' ? (
            <JoinGameForm gameId={gameCode} onJoinGame={joinGameHandler} />
          ) : (
            <JoinLobby
              players={players}
              playerName={playerName}
              leaving={leaving}
              onLeaveGame={leaveGameHandler}
              selectedRoles={selectedRoles}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Page (Suspense boundary required for useSearchParams) ─────────────────────

export default function JoinGamePage() {
  return (
    <main className="relative w-full min-h-screen p-8">
      <Suspense fallback={
        <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6" />
          <h2 className="text-2xl font-bold text-white animate-pulse">Loading...</h2>
        </div>
      }>
        <JoinGameContent />
      </Suspense>
    </main>
  );
}
