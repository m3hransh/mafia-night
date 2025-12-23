'use client';

import dynamic from 'next/dynamic';
import { Role } from "@/lib/api";
import Link from "next/link";
import { GradientBackground } from '@/components/GradientBackground';

const AssignedRole = dynamic(() => import('@/components/AssignedRole').then(mod => ({ default: mod.AssignedRole })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center from-slate-900 to-slate-900">
      <div className="text-white text-2xl">Loading magical card...</div>
    </div>
  ),
});

export default function JoinGameContent() {
  const assignedRole: Role = {
    id: "1",
    name: "sherlock",
    slug: "sherlock",
    video: "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/sherlock.webm",
    description: "You are Sherlock, a detective trying to find the mafia.",
    team: 'independent',
    abilities: ["investigate", "disguise"]
  };
  const playerName = "John Doe";

  return (

    <main className="relative w-full h-screen overflow-hidden">
      {/* Back button */}

      <GradientBackground />
      <Link href="/"
        className="inline-flex items-center gap-2 mb-4 bg-black/30 backdrop-blur-md rounded-full px-5 py-3 hover:bg-purple-600/30 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-white font-semibold">Home</span>
      </Link>

      <AssignedRole assignedRole={assignedRole} playerName={playerName} leaving={false} onLeaveGame={() => {}} />
    </main>
  );
}
