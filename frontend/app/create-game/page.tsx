'use client';

import Link from 'next/link';
import { CreateGameProvider, useCreateGameContext } from './context';
import { RoleSelectionPanel } from '@/components/RoleSelectionPanel';
import { CreateGameInitial } from '@/components/CreateGameInitial';
import { WaitingForPlayers } from '@/components/WaitingForPlayers';
import { GameStarted } from '@/components/GameStarted';
import { RoleDistributing } from '@/components/RoleDistributing';

function CreateGameView() {
  const { state } = useCreateGameContext();
  const { game, phase, distributingRoles } = state;

  return (
    <main className="relative w-full min-h-screen p-8">
      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/"
          className="inline-flex items-center gap-2 mb-8 bg-black/30 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all">
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
          <CreateGameInitial />
        ) : phase === 'selecting-roles' ? (
          distributingRoles ? <RoleDistributing /> : <RoleSelectionPanel />
        ) : phase === 'game-started' ? (
          <GameStarted />
        ) : (
          <WaitingForPlayers />
        )}
      </div>
    </main>
  );
}

export default function CreateGamePage() {
  return (
    <CreateGameProvider>
      <CreateGameView />
    </CreateGameProvider>
  );
}
