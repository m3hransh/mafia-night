import { useEffect, useRef, useCallback, useState } from 'react';

export type GameUpdateType = 
  | 'initial_state'
  | 'player_joined' 
  | 'player_left' 
  | 'roles_distributed'
  | 'game_deleted';

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
  onRolesDistributed?: () => void;
  onGameDeleted?: () => void;
  enabled?: boolean;
}

export function useGameWebSocket({
  gameId,
  onUpdate,
  onPlayerJoined,
  onPlayerLeft,
  onRolesDistributed,
  onGameDeleted,
  enabled = true,
}: UseGameWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          onUpdate?.(update);

          // Call specific handlers
          switch (update.type) {
            case 'initial_state':
              // Handle initial state if needed
              break;
            case 'player_joined':
              onPlayerJoined?.(update.payload);
              break;
            case 'player_left':
              onPlayerLeft?.(update.payload?.player_id);
              break;
            case 'roles_distributed':
              onRolesDistributed?.();
              break;
            case 'game_deleted':
              onGameDeleted?.();
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
        wsRef.current = null;

        // Attempt reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch {
      setError('Failed to create WebSocket connection');
    }
  }, [gameId, enabled, onUpdate, onPlayerJoined, onPlayerLeft, onRolesDistributed, onGameDeleted]);

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
