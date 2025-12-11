'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamic import to avoid SSR issues with Three.js
const CardScene = dynamic(() => import('@/components/CardScene').then(mod => ({ default: mod.CardScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center  from-slate-900  to-slate-900">
      <div className="text-white text-2xl">Loading magical cards...</div>
    </div>
  ),
});

const roles = [
  { name: 'Sherlock', video: '/roles/sherlock.webm' },
  { name: 'Mafia', video: '/roles/Mafia.webm' },
  { name: 'Doctor Watson', video: '/roles/Doctor Watson.webm' },
];

export default function Home() {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const currentRole = roles[currentRoleIndex];

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <CardScene videoSrc={currentRole.video} roleName={currentRole.name} frameStyle="golden-dynamic" />
      
      {/* Role selector */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/50 backdrop-blur-md rounded-full px-6 py-3 flex gap-4">
          {roles.map((role, index) => (
            <button
              key={role.name}
              onClick={() => setCurrentRoleIndex(index)}
              className={`px-4 py-2 rounded-full transition-all ${
                index === currentRoleIndex
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-transparent text-gray-300 hover:bg-purple-600/30'
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-2xl">
          {currentRole.name}
        </h1>
        <p className="text-xl text-purple-300">Mafia Night • Role Card</p>
      </div>

    </main>
  );
}
