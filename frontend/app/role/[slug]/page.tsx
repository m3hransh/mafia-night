'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use } from 'react';
import { roles } from '@/lib/roles';

// Dynamic import to avoid SSR issues with Three.js
const CardScene = dynamic(() => import('@/components/CardScene').then(mod => ({ default: mod.CardScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center from-slate-900 to-slate-900">
      <div className="text-white text-2xl">Loading magical card...</div>
    </div>
  ),
});

export default function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const role = roles.find(r => r.slug === slug);

  if (!role) {
    notFound();
  }

  const currentIndex = roles.findIndex(r => r.slug === slug);
  const prevRole = roles[(currentIndex - 1 + roles.length) % roles.length];
  const nextRole = roles[(currentIndex + 1) % roles.length];

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <CardScene
        videoSrc={role.video}
        roleName={role.name}
        description={role.description}
      />
      
      {/* Navigation controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-4">
        <Link
          href={`/role/${prevRole.slug}`}
          className="bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-purple-600/30 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        <Link
          href="/roles"
          className="bg-black/50 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all whitespace-nowrap"
        >
          <span className="text-white font-semibold">{currentIndex + 1} / {roles.length}</span>
        </Link>
        
        <Link
          href={`/role/${nextRole.slug}`}
          className="bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-purple-600/30 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Title overlay */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">
          {role.name}
        </h1>
      </div>

      {/* Back to gallery button */}
      <Link
        href="/roles"
        className="absolute top-8 left-8 z-10 bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-purple-600/30 transition-all"
        title="Back to Roles"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>
    </main>
  );
}
