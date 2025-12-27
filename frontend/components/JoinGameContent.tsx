import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { savePlayerGame, clearPlayerGame, validatePlayerGameState } from '@/lib/gameStorage';
import { getPlayerRole, Role, Player } from '@/lib/api';
import { JoinLobby } from '@/components/JoinLobby';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { AssignedRole } from '@/components/AssignedRole';
import { JoinGameForm } from '@/components/JoinGameForm';

export function JoinGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [joined, setJoined] = useState(false); const [players, setPlayers] = useState<Player[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [assignedRole, setAssignedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing player session on mount with backend validation
  useEffect(() => {
    const checkSavedPlayer = async () => {
      try {
        const validatedState = await validatePlayerGameState();
        if (validatedState) {
          // Restore player state
          setGameCode(validatedState.gameId);
          setPlayerName(validatedState.playerName);
          setPlayerId(validatedState.playerId);
          setJoined(true);

          try {
            const role = await getPlayerRole(validatedState.gameId, validatedState.playerId);
            if (role) {
              setAssignedRole(role);
            }
          } catch (error) {
            console.error('Error fetching role:', error);
          }
        }
      } catch (error) {
        console.error('Error validating player state:', error);
      } finally {
        setIsLoading(false);
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

  const joinGameHandler = async (gameId: string, player: Player | null) => {

    if (!player) return;

    setPlayerId(player.id);
    setPlayerName(player.name);
    setJoined(true);
    // Save to localStorage
    setGameCode(gameId);
    savePlayerGame(gameId, player.id, player.name);
  };

  const leaveGameHandler = async () => {
    if (!confirm('Are you sure you want to leave the game?')) {
      return;
    }

    setLeaving(true);
    // Only moderator can remove player
    // await removePlayer(gameCode, playerId);
    clearPlayerGame();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6"></div>
        <h2 className="text-2xl font-bold text-white animate-pulse">Loading Game State...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto relative z-10">
      {/* Back button */}
      <Link href="/"
        className="inline-flex items-center gap-2 mb-4 bg-black/30 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-white font-semibold">Home</span>
      </Link>


        {assignedRole ? (
          <>
          <AssignedRole assignedRole={assignedRole} playerName={playerName} leaving={leaving}
            onLeaveGame={leaveGameHandler} />
          </>
        ) : (
          <>
            <div className="text-center mb-12 space-y-6 p-4">
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                Join Game
              </h1>
              <p className="text-xl text-purple-300 mb-4">Enter the game code to join</p>
            {!joined ? (
              <JoinGameForm gameId={gameCode} onJoinGame={joinGameHandler} />
            ) : (
              <JoinLobby players={players} playerName={playerName} leaving={leaving} onLeaveGame={leaveGameHandler} />
            )}

            </div>
          </>
        )}
      </div>
  );
    }
