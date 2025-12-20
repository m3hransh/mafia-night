'use client';

import Link from 'next/link';
import { GradientBackground } from '@/components/GradientBackground';
import { BuyCoffee } from '@/components/BuyCoffee';

export default function Home() {
  return (
    <main className="relative w-full min-h-screen flex items-center justify-center p-8 overflow-hidden">
      {/* Animated gradient background */}
      <GradientBackground />
      <BuyCoffee />

      <div className="max-w-4xl mb-6 mx-auto text-center relative z-10">
        <h1 className="text-8xl font-bold text-white mb-6 drop-shadow-2xl animate-pulse-slow">
          Mafia Night
        </h1>

        <p className="text-2xl text-purple-200 mb-4">
          A social deduction game of mystery and deception
        </p>

        <p className="text-lg text-purple-300 mb-12 max-w-2xl mx-auto">
          Navigate through a world of intrigue where citizens and criminals clash.
          Choose your role and use your unique abilities to uncover the truth or hide in the shadows.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/create-game"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-10 py-5 rounded-xl transition-all transform hover:scale-105 shadow-2xl">
            Create Game
          </Link>

          <Link href="/join-game"
            className="bg-black/30 backdrop-blur-md border-2 border-purple-500/50 hover:border-purple-400 text-white font-semibold text-xl px-10 py-5 rounded-xl transition-all transform hover:scale-105">
            Join Game
          </Link>
        </div>

        <div className="mt-12">
          <Link href="/roles" className="text-purple-300 hover:text-purple-200 underline text-lg transition-colors">
            Browse Role Cards
          </Link>
        </div>
      </div>
    </main>
  );
}
