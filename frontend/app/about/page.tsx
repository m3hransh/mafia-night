'use client'

import { GradientBackground } from '@/components/GradientBackground'
import type { Metadata } from 'next'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <GradientBackground />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-center">
            About Mafia Night
          </h1>

          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/20 p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">What is Mafia Night?</h2>
              <p className="text-white/80 leading-relaxed">
                Mafia Night is a web application designed to enhance your physical Mafia game
                experience. Whether you're hosting a party or organizing a game night, our
                platform helps you manage players, assign roles, and moderate games seamlessly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Features</h2>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>Easy game creation and player management</li>
                <li>Beautiful 3D role cards with unique designs</li>
                <li>Role distribution and assignment system</li>
                <li>Moderator tools for game control</li>
                <li>Mobile-friendly responsive design</li>
                <li>Real-time game state synchronization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">How to Play</h2>
              <ol className="list-decimal list-inside space-y-2 text-white/80">
                <li>The moderator creates a game and shares the game code</li>
                <li>Players join using the game code on their devices</li>
                <li>The moderator assigns roles to all players</li>
                <li>Each player views their secret role card</li>
                <li>The game begins with alternating night and day phases</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Open Source</h2>
              <p className="text-white/80 leading-relaxed">
                Mafia Night is built with modern web technologies including Next.js, React,
                Three.js for 3D graphics, and Go for the backend. The project is open source
                and welcomes contributions from the community.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
