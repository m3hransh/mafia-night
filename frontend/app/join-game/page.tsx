'use client';

import { Suspense } from 'react';
import { GradientBackground } from '@/components/GradientBackground';
import {JoinGameContent} from '@/components/JoinGameContent';


export default function JoinGamePage() {
  return (
    <Suspense fallback={
      <main className="relative w-full min-h-screen p-8">
        <GradientBackground />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      </main>
    }>
      <JoinGameContent />
    </Suspense>
  );
}
