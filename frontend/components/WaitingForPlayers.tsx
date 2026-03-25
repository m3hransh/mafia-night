import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from './Button';
import { useCreateGameContext } from '@/app/create-game/context';
import { SelectedRolesDisplay } from './SelectedRolesDisplay';
import type { SelectedRoleEntry } from '@/lib/api';
import type { Role } from '@/lib/types';

function SelectedRolesSummary() {
  const { state, allRoles } = useCreateGameContext();
  const { selectedRoles, players } = state;
  const playerCount = players.length;

  const total = useMemo(
    () => Array.from(selectedRoles.values()).reduce((s, c) => s + c, 0),
    [selectedRoles]
  );

  const entries = useMemo((): SelectedRoleEntry[] =>
    Array.from(selectedRoles.entries())
      .map(([roleId, count]) => {
        const role = allRoles.find(r => r.id === roleId);
        if (!role) return null;
        return { role_id: role.id, name: role.name, slug: role.slug, team: role.team, video: role.video, count } satisfies SelectedRoleEntry;
      })
      .filter((e): e is SelectedRoleEntry => e !== null),
    [selectedRoles, allRoles]
  );

  const isComplete = total === playerCount;

  const badge = (
    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
      isComplete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
    }`}>
      {total} / {playerCount} {isComplete ? '✓ Ready' : 'slots'}
    </span>
  );

  return (
    <SelectedRolesDisplay
      roles={entries}
      title="Pre-selected Roles"
      badge={badge}
      footer={null}
    />
  );
}

export function WaitingForPlayers() {
  const { state, copyGameCode, shareGame, closeGame, handleRemovePlayer, handleStartRoleSelection, handleRolesDistribute }
    = useCreateGameContext();
  const { game, players, removingPlayerId, copySuccess, closing, selectedRoles, distributingRoles } = state;
  const playerCount = useMemo(() => players.length, [players]);
  const totalRoles = useMemo(
    () => Array.from(selectedRoles.values()).reduce((s, c) => s + c, 0),
    [selectedRoles]
  );

  const isComplete = useMemo(() => playerCount > 0 && totalRoles === playerCount, [playerCount, totalRoles]);

  if (!game) return null;

  const getJoinUrl = () => `${window.location.origin}/join-game?code=${game.id}`;
  const handleStartGame = () => {
    handleRolesDistribute();
  };

  return (
    <div className="space-y-6">
      {/* Game Code */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">Game Code</h2>
        <div className="flex items-center gap-4">
          <div data-testid="game-code"
            className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-2xl text-purple-300 text-center">
            {game.id}
          </div>
          <Button data-testid="copy-game-code-button" onClick={copyGameCode} size="lg" className="py-4">
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-purple-300 mb-2">Share this link with players:</p>
          <div className="bg-black/50 rounded-lg p-3 text-sm text-purple-200 break-all mb-3">
            {getJoinUrl()}
          </div>
          <Button onClick={shareGame} variant="success" size="md" fullWidth
            className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Game Link
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">Players ({players.length})</h2>
        {players.length === 0 ? (
          <div className="text-center py-8 text-purple-300">
            <p>Waiting for players to join...</p>
            <div className="mt-4">
              <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" />
              <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{
                animationDelay: '0.2s'
              }} />
              <div className="animate-pulse inline-block w-3 h-3 bg-purple-500 rounded-full mx-1" style={{
                animationDelay: '0.4s'
              }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={player.id}
                className="bg-black/30 rounded-lg p-4 flex items-center justify-between border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-white font-semibold block">{player.name}</span>
                    <span className="text-xs text-purple-400">Joined {new Date(player.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                <Button onClick={() => handleRemovePlayer(player.id, player.name)} disabled={removingPlayerId === player.id}
                  variant="danger" size="sm">
                  {removingPlayerId === player.id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-selected roles summary */}
      <SelectedRolesSummary />

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 justify-center">
          <Button onClick={handleStartRoleSelection} variant="primary" scaleOnHover>Select Roles</Button>
        </div>

        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <Button onClick={closeGame} disabled={closing} variant="danger" size="lg">
              {closing ? 'Closing Game...' : 'Close Game'}
            </Button>
          </div>

          <div className="text-center">
            <Button onClick={handleStartGame} disabled={!isComplete} variant="success" size="lg">
              {distributingRoles ? 'Starting Game...' : 'Start Game'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
