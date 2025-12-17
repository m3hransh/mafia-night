'use client';

import Link from 'next/link';
import { roles } from '@/lib/roles';

export default function Home() {
  return (
    <main className="relative w-full min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            Mafia Night
          </h1>
          <p className="text-2xl text-purple-300">Select a Role Card</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {roles.map((role) => (
            <Link
              key={role.slug}
              href={`/role/${role.slug}`}
              className="bg-black/30 backdrop-blur-md rounded-xl p-6 hover:bg-purple-600/20 transition-all transform hover:scale-105 border border-purple-500/20"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {role.name}
                </h3>
                <p className="text-sm text-purple-300">View Card</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
