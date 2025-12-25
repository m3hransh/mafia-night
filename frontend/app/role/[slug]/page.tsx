'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use } from 'react';
import { fetchRoles, fetchRoleBySlug, Role, APIError } from '@/lib/api';

// Dynamic import to avoid SSR issues with Three.js
const CardScene = dynamic(() => import('@/components/CardScene').then(mod => ({ default: mod.CardScene })), {
  ssr: false,
});

export default function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [role, setRole] = useState<Role | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadRoleData() {
      try {
        const [roleData, rolesData] = await Promise.all([
          fetchRoleBySlug(slug),
          fetchRoles()
        ]);
        setRole(roleData);
        setAllRoles(rolesData);
      } catch (err) {
        if (err instanceof APIError) {
          console.log('APIError status:', err.status);
          if (err.status === 404) {
            setError('Role not found');
          }
          setError(err.message);
        } else {
          setError('Failed to load role');
        }
      } finally {
        setLoading(false);
      }
    }

    loadRoleData();
  }, [slug]);

  if (loading) {
    return (
      <main className="relative w-full h-screen overflow-hidden">
      </main>
    );
  }

  if (error || !role) {
    return (
      <main className="relative w-full h-screen overflow-hidden">
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Error</h1>
            <p className="text-xl text-red-400 mb-6">{error || 'Role not found'}</p>
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

      {/* Navigation controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-4">
        <Link href={`/role/${prevRole.slug}`}
          className="bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-purple-600/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <Link href="/roles"
          className="bg-black/50 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all whitespace-nowrap">
          <span className="text-white font-semibold">{currentIndex + 1} / {allRoles.length}</span>
        </Link>

        <Link href={`/role/${nextRole.slug}`}
          className="bg-black/50 backdrop-blur-md rounded-full p-4 hover:bg-purple-600/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
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
      <Link href="/roles"
        className="absolute top-8 left-8 z-10 bg-black/50 backdrop-blur-md rounded-full p-3 hover:bg-purple-600/30 transition-all"
        title="Back to Roles">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>
    </main>
  );
  }
