'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Role } from '@/lib/types';

const CardScene = dynamic(() => import('@/components/CardScene').then(mod => ({ default: mod.CardScene })), {
  ssr: false,
});

export default function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // Reuses cache from /roles page — no extra fetch if already visited
  const { data: allRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/roles', {});
      if (error) throw new Error('Failed to load roles');
      return (data as Role[]) ?? [];
    },
  });

  const { data: role, isLoading: roleLoading, error } = useQuery({
    queryKey: ['role', slug],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET('/roles/{slug}', {
        params: { path: { slug } },
      });
      if (error) {
        if (response.status === 404) throw new Error('Role not found');
        throw new Error('Failed to load role');
      }
      return data as Role;
    },
  });

  const isLoading = rolesLoading || roleLoading;

  if (isLoading) {
    return <main className="relative w-full h-screen overflow-hidden" />;
  }

  if (error || !role) {
    return (
      <main className="relative w-full h-screen overflow-hidden">
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Error</h1>
            <p className="text-xl text-red-400 mb-6">
              {error instanceof Error ? error.message : 'Role not found'}
            </p>
            <Link href="/roles" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
              Back to Roles
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentIndex = allRoles.findIndex(r => r.slug === slug);
  const prevRole = allRoles[(currentIndex - 1 + allRoles.length) % allRoles.length];
  const nextRole = allRoles[(currentIndex + 1) % allRoles.length];

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <CardScene videoSrc={role.video} role={role} />

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-4">
        <Link href={`/role/${prevRole?.slug}`}
          className="bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-purple-600/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Link href="/roles"
          className="bg-black/50 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all whitespace-nowrap">
          <span className="text-white font-semibold">{currentIndex + 1} / {allRoles.length}</span>
        </Link>
        <Link href={`/role/${nextRole?.slug}`}
          className="bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-purple-600/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">{role.name}</h1>
      </div>

      <Link href="/roles"
        className="absolute top-8 left-8 z-10 bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-purple-600/30 transition-all"
        title="Back to Roles">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>
    </main>
  );
}

