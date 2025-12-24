'use client'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">

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
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Feature Requests</h2>
              <p className="text-white/80 leading-relaxed">
                Have a great idea for a new role or feature? You can support the development by buying me a chai! 
                When you make a donation, simply include your requested feature in the message, and I will do my best 
                to implement it for you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Open Source</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                Mafia Night is built with modern web technologies including Next.js, React,
                Three.js for 3D graphics, and Go for the backend. The project is open source
                and welcomes contributions from the community.
              </p>
              <a 
                href="https://github.com/m3hransh/mafia-night" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                <span>View on GitHub</span>
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
