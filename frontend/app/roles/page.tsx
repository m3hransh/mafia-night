'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchRoles, Role, APIError } from '@/lib/api';
import { OptimizedVideo } from '@/components/OptimizedVideo';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('Failed to load roles');
        }
        console.error('Error loading roles:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRoles();
  }, []);

  if (loading) {
    return (
      <main className="relative w-full min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Loading roles...</h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative w-full min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Error</h1>
          <p className="text-xl text-red-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-full min-h-screen p-8">
      {/* Animated gradient background */}

      <div className="max-w-7xl mx-auto">
        {/* Back to home button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 bg-black/30 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-white font-semibold">Home</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            Role Cards
          </h1>
          <p className="text-2xl text-purple-300">Select a Role to View</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 gap-2">
          {roles.map((role, index) => {
            // Preload first 6 videos (above the fold), lazy load the rest
            const shouldPreload = index < 6;

            return (
              <Link
                key={role.slug}
                href={`/role/${role.slug}`}
                className="bg-black/30 backdrop-blur-md rounded-xl overflow-hidden hover:bg-purple-600/20 transition-all transform hover:scale-105 border border-purple-500/20 relative"
              >
                {/* Role Video - Full Card */}
                <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-purple-900/50 to-black">
                  <OptimizedVideo
                    src={role.video}
                    className="w-full h-full object-cover object-top"
                    autoPlay
                    loop
                    muted
                    playsInline
                    lazy={!shouldPreload}
                    preload={shouldPreload ? 'auto' : 'metadata'}
                  />

                  {/* Gradient overlay for better text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                  {/* Role Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-center backdrop-blur-md bg-black/10">
                    <h3 className="text-sm md:text-xl font-semibold text-white mb-1 drop-shadow-lg">
                      {role.name}
                    </h3>
                    <p className="text-xs text-purple-300 capitalize">{role.team}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
