import { useEffect, useRef, useCallback, useState } from 'react';

export type GameUpdateType = 
  | 'initial_state'
  | 'player_joined' 
  | 'player_left' 
  | 'roles_selected'
  | 'roles_distributed'
  | 'game_deleted'
  | 'phase_changed'
  | 'vote_cast'
  | 'player_eliminated'
  | 'vote_session_opened'
  | 'ballot_cast'
  | 'vote_session_closed';

export interface GameUpdate {
  type: GameUpdateType;
  game_id: string;
  payload?: any;
}

interface UseGameWebSocketOptions {
  gameId: string;
  onUpdate?: (update: GameUpdate) => void;
  onPlayerJoined?: (player: any) => void;
  onPlayerLeft?: (playerId: string) => void;
  onRolesSelected?: () => void;
  onRolesDistributed?: () => void;
  onGameDeleted?: () => void;
  onPhaseChanged?: (phase: string, roundNumber: number) => void;
  onVoteCast?: (stage: string, tally: any) => void;
  onPlayerEliminated?: (playerId: string, playerName: string, cause: string) => void;
  onVoteSessionOpened?: (session: any) => void;
  onBallotCast?: (session: any) => void;
  onVoteSessionClosed?: (session: any) => void;
  enabled?: boolean;
}

export function useGameWebSocket({
  gameId,
  onUpdate,
  onPlayerJoined,
  onPlayerLeft,
  onRolesSelected,
  onRolesDistributed,
  onGameDeleted,
  onPhaseChanged,
  onVoteCast,
  onPlayerEliminated,
  onVoteSessionOpened,
  onBallotCast,
  onVoteSessionClosed,
  enabled = true,
}: UseGameWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to avoid reconnecting when they change
  const onUpdateRef = useRef(onUpdate);
  const onPlayerJoinedRef = useRef(onPlayerJoined);
  const onPlayerLeftRef = useRef(onPlayerLeft);
  const onRolesSelectedRef = useRef(onRolesSelected);
  const onRolesDistributedRef = useRef(onRolesDistributed);
  const onGameDeletedRef = useRef(onGameDeleted);
  const onPhaseChangedRef = useRef(onPhaseChanged);
  const onVoteCastRef = useRef(onVoteCast);
  const onPlayerEliminatedRef = useRef(onPlayerEliminated);
  const onVoteSessionOpenedRef = useRef(onVoteSessionOpened);
  const onBallotCastRef = useRef(onBallotCast);
  const onVoteSessionClosedRef = useRef(onVoteSessionClosed);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onPlayerJoinedRef.current = onPlayerJoined;
    onPlayerLeftRef.current = onPlayerLeft;
    onRolesSelectedRef.current = onRolesSelected;
    onRolesDistributedRef.current = onRolesDistributed;
    onGameDeletedRef.current = onGameDeleted;
    onPhaseChangedRef.current = onPhaseChanged;
    onVoteCastRef.current = onVoteCast;
    onPlayerEliminatedRef.current = onPlayerEliminated;
    onVoteSessionOpenedRef.current = onVoteSessionOpened;
    onBallotCastRef.current = onBallotCast;
    onVoteSessionClosedRef.current = onVoteSessionClosed;
  }, [onUpdate, onPlayerJoined, onPlayerLeft, onRolesSelected, onRolesDistributed, onGameDeleted, onPhaseChanged, onVoteCast, onPlayerEliminated, onVoteSessionOpened, onBallotCast, onVoteSessionClosed]);

  const connect = useCallback(() => {
    if (!enabled || !gameId) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}/api/games/${gameId}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const update: GameUpdate = JSON.parse(event.data);
          
          // Call generic handler
          onUpdateRef.current?.(update);

          // Call specific handlers
          switch (update.type) {
            case 'initial_state':
              // Handle initial state if needed
              break;
            case 'player_joined':
              onPlayerJoinedRef.current?.(update.payload);
              break;
            case 'player_left':
              onPlayerLeftRef.current?.(update.payload?.player_id);
              break;
            case 'roles_selected':
              onRolesSelectedRef.current?.();
              break;
            case 'roles_distributed':
              onRolesDistributedRef.current?.();
              break;
            case 'game_deleted':
              onGameDeletedRef.current?.();
              break;
            case 'phase_changed':
              onPhaseChangedRef.current?.(
                update.payload?.phase,
                update.payload?.round_number ?? 0,
              );
              break;
            case 'vote_cast':
              onVoteCastRef.current?.(update.payload?.stage, update.payload?.tally);
              break;
            case 'player_eliminated':
              onPlayerEliminatedRef.current?.(
                update.payload?.player_id,
                update.payload?.player_name,
                update.payload?.cause,
              );
              break;
            case 'vote_session_opened':
              onVoteSessionOpenedRef.current?.(update.payload);
              break;
            case 'ballot_cast':
              onBallotCastRef.current?.(update.payload);
              break;
            case 'vote_session_closed':
              onVoteSessionClosedRef.current?.(update.payload);
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setError(null);
        wsRef.current = null;

        // Attempt reconnect after 3 seconds if still enabled
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      wsRef.current = ws;
    } catch {
      setError('Failed to create WebSocket connection');
    }
  }, [gameId, enabled]);

  useEffect(() => {
    if (enabled && gameId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, enabled, gameId]);

  return { isConnected, error };
}
