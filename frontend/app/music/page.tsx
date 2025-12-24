'use client'

export default function MusicPage() {
  return (
    <div className="min-h-screen bg-black text-white">

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-center">
            Mafia Night Music
          </h1>

          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/20 p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Atmosphere & Soundtracks</h2>
              <p className="text-white/80 leading-relaxed mb-6">
                Enhance your Mafia game experience with atmospheric music and sound effects.
                The right soundtrack can make your game night unforgettable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Recommended Playlists</h2>
              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/10">
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Night Phase</h3>
                  <p className="text-white/70 text-sm">
                    Dark, mysterious ambient music for when the Mafia strikes. Creates tension
                    and suspense during night actions.
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/10">
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Day Phase</h3>
                  <p className="text-white/70 text-sm">
                    Upbeat but tense music for discussion and voting. Keeps energy high during
                    debates and accusations.
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/10">
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Lobby Music</h3>
                  <p className="text-white/70 text-sm">
                    Light background music while players are joining and roles are being assigned.
                    Sets the mood without overwhelming conversation.
                  </p>
                </div>
              </div>
            </section>

            <section className="pt-4">
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Tips for Music</h2>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>Keep volume low enough for players to hear each other clearly</li>
                <li>Use instrumental tracks to avoid lyric distractions</li>
                <li>Switch music between phases to signal game state changes</li>
                <li>Consider using a timer sound effect for voting countdowns</li>
                <li>Dramatic music during reveals enhances the experience</li>
              </ul>
            </section>

            <section className="pt-4">
              <p className="text-white/60 text-center italic">
                Music integration coming soon! We're working on built-in audio controls
                for seamless soundtrack management during your games.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
