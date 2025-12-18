'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative w-full min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-8xl font-bold text-white mb-6 drop-shadow-2xl">
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
          <Link
            href="/roles"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-10 py-5 rounded-xl transition-all transform hover:scale-105 shadow-2xl"
          >
            View Role Cards
          </Link>

          <Link
            href="/roles"
            className="bg-black/30 backdrop-blur-md border-2 border-purple-500/50 hover:border-purple-400 text-white font-semibold text-xl px-10 py-5 rounded-xl transition-all transform hover:scale-105"
          >
            Browse Roles
          </Link>
        </div>

        <div className="mt-16 text-purple-400 text-sm">
          <p>30 unique roles with special abilities</p>
        </div>
      </div>
    </main>
  );
}
