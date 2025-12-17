# Frontend Architecture

Design and organization of the [[Next.js]] frontend.

## Overview

```
┌─────────────────┐
│   App Router    │  app/
│   (Next.js 16)  │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Pages  │  app/*/page.tsx
    └────┬────┘
         │
    ┌────▼────────┐
    │  Components │  components/
    │  (3D Cards) │  (Three.js)
    └────┬────────┘
         │
    ┌────▼────┐
    │   API   │  Fetch to backend
    └─────────┘
```

## App Router Structure

### File-Based Routing

**Current Implementation:**
```
app/
├── layout.tsx              # Root layout
├── page.tsx                # / (home page)
├── globals.css             # Global styles (Tailwind)
└── role/
    └── [slug]/
        └── page.tsx        # /role/:slug (3D role card viewer)
```

**Planned Routes:**
```
app/games/
├── page.tsx                # /games (list)
├── [id]/
│   └── page.tsx            # /games/:id (detail)
└── create/
    └── page.tsx            # /games/create

app/moderator/
└── [gameId]/
    └── page.tsx            # /moderator/:gameId
```

### Layouts

Root layout (`app/layout.tsx`):
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav>...</nav>
        {children}
        <footer>...</footer>
      </body>
    </html>
  )
}
```

### Pages

Page component (`app/games/page.tsx`):
```tsx
export default function GamesPage() {
  return (
    <div>
      <h1>Games</h1>
      <GameList />
    </div>
  )
}
```

## Components

### Current Organization

```
components/
├── CardScene.tsx          # 3D scene container (Three.js canvas)
├── MagicCard3D.tsx        # 3D card component with shaders
└── index.ts               # Component exports
```

### Planned Organization

```
components/
├── 3d/                    # Three.js components
│   ├── CardScene.tsx
│   └── MagicCard3D.tsx
├── game/
│   ├── GameCard.tsx
│   ├── GameList.tsx
│   └── GameForm.tsx
├── player/
│   ├── PlayerCard.tsx
│   └── PlayerList.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    └── Card.tsx
```

### Component Pattern

```tsx
interface GameCardProps {
  game: Game
  onJoin?: (gameId: string) => void
}

export function GameCard({ game, onJoin }: GameCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{game.id}</h3>
      <p>Status: {game.status}</p>
      {onJoin && (
        <button onClick={() => onJoin(game.id)}>
          Join Game
        </button>
      )}
    </div>
  )
}
```

## State Management

### Server Components (Default)
```tsx
// app/games/page.tsx
export default async function GamesPage() {
  // Fetch on server
  const games = await fetchGames()
  
  return <GameList games={games} />
}
```

### Client Components
```tsx
'use client'  // Mark as client component

import { useState } from 'react'

export function GameForm() {
  const [name, setName] = useState('')
  
  const handleSubmit = async () => {
    await createGame({ name })
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Context (Global State)
```tsx
'use client'

import { createContext, useContext } from 'react'

const GameContext = createContext<GameContextType>({})

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null)
  
  return (
    <GameContext.Provider value={{ currentGame, setCurrentGame }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
```

## API Integration

### Fetch Wrapper
```tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL

async function fetchGames(): Promise<Game[]> {
  const res = await fetch(`${API_URL}/api/games`)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

async function createGame(data: CreateGameData): Promise<Game> {
  const res = await fetch(`${API_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create')
  return res.json()
}
```

### Error Handling
```tsx
'use client'

export function GameList() {
  const [games, setGames] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>{games.map(game => <GameCard key={game.id} game={game} />)}</div>
}
```

## Styling

### Tailwind CSS

Utility-first approach:
```tsx
export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {children}
    </button>
  )
}
```

### CSS Modules (Alternative)
```tsx
import styles from './Button.module.css'

export function Button({ children }: ButtonProps) {
  return <button className={styles.button}>{children}</button>
}
```

## Testing

### Component Tests
```tsx
import { render, screen } from '@testing-library/react'
import { GameCard } from './GameCard'

describe('GameCard', () => {
  it('displays game ID', () => {
    const game = { id: 'ABC123', status: 'pending' }
    render(<GameCard game={game} />)
    
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })
  
  it('calls onJoin when clicked', () => {
    const onJoin = jest.fn()
    const game = { id: 'ABC123', status: 'pending' }
    render(<GameCard game={game} onJoin={onJoin} />)
    
    fireEvent.click(screen.getByText('Join Game'))
    expect(onJoin).toHaveBeenCalledWith('ABC123')
  })
})
```

### Integration Tests
```tsx
import { render, waitFor } from '@testing-library/react'
import GamesPage from './page'

jest.mock('../api', () => ({
  fetchGames: jest.fn().mockResolvedValue([
    { id: 'ABC123', status: 'pending' }
  ])
}))

test('displays games', async () => {
  render(<GamesPage />)
  
  await waitFor(() => {
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })
})
```

## TypeScript

### Types
```tsx
// types/game.ts
export interface Game {
  id: string
  status: 'pending' | 'active' | 'completed'
  createdAt: string
  moderatorId: string
}

export interface Player {
  id: string
  name: string
  gameId: string
}

export interface CreateGameData {
  moderatorId: string
}
```

### Props Types
```tsx
interface GameCardProps {
  game: Game
  onJoin?: (gameId: string) => void
}

export function GameCard({ game, onJoin }: GameCardProps) {
  // TypeScript knows game.id exists
  // TypeScript knows onJoin is optional
}
```

## Performance

### Server Components (Default)
```tsx
// Runs on server, no JS sent to client
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Code Splitting
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
})
```

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/game-image.jpg"
  alt="Game"
  width={500}
  height={300}
/>
```

## Three.js Integration

### 3D Card Components

The frontend uses Three.js via React Three Fiber for interactive 3D role cards.

#### CardScene Component

```tsx
// components/CardScene.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

export function CardScene({ videoSrc, roleName, description }) {
  const [isMobile, setIsMobile] = useState(false)

  return (
    <div className="w-full h-screen">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 6]} />
          <MagicCard3D
            videoSrc={videoSrc}
            roleName={roleName}
            description={description}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

#### MagicCard3D Component

Features:
- **Video Textures**: Displays role videos on 3D cards
- **Custom Shaders**: Circular masks, gradients, and metallic effects
- **Gyroscope Support**: Tilts card on mobile devices
- **Mouse Tracking**: Interactive rotation on desktop
- **Flip Animation**: Click to reveal role description
- **Dynamic Lighting**: Golden/silver ring effects around video

```tsx
// components/MagicCard3D.tsx
'use client'

export function MagicCard3D({ videoSrc, roleName, description }) {
  const [flipped, setFlipped] = useState(false)
  const [gyroRotation, setGyroRotation] = useState({ beta: 0, gamma: 0 })

  const videoTexture = useVideoTexture(videoSrc)

  // Custom shader materials for effects
  const circularMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({ /* ... */ })
  }, [videoTexture])

  return (
    <group>
      <RoundedBox onClick={() => setFlipped(!flipped)}>
        <meshBasicMaterial color="#000000" />
      </RoundedBox>
      {/* Video, text, and effects */}
    </group>
  )
}
```

### Role Management

```tsx
// lib/roles.ts
export const roles = [
  {
    name: 'Sherlock',
    video: '/roles/sherlock.webm',
    slug: 'sherlock',
    description: 'The brilliant detective...'
  },
  // 30+ roles total
]
```

## Project Structure

**Current Implementation:**
```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles (Tailwind)
│   └── role/
│       └── [slug]/
│           └── page.tsx     # 3D role card viewer
├── components/              # Reusable components
│   ├── CardScene.tsx        # 3D scene (Three.js canvas)
│   ├── MagicCard3D.tsx      # 3D card with shaders
│   └── index.ts             # Component exports
├── lib/                     # Utilities
│   └── roles.ts             # Role definitions (30+ roles)
├── types/                   # TypeScript types
│   └── jest.d.ts            # Jest type definitions
├── __tests__/               # Tests
│   ├── page.test.tsx        # Home page tests
│   └── sample.test.tsx      # Sample tests
├── public/                  # Static files
│   └── roles/               # Role videos (.webm)
├── jest.config.js           # Jest configuration
├── jest.setup.ts            # Jest setup file
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

**Planned Structure:**
```
frontend/
├── app/
│   ├── games/               # Game management
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── create/page.tsx
│   └── moderator/
│       └── [gameId]/page.tsx
├── components/
│   ├── 3d/                  # Three.js components
│   ├── game/                # Game components
│   ├── player/              # Player components
│   └── ui/                  # UI components
└── types/
    ├── game.ts
    └── player.ts
```

## Related Notes

- [[Next.js]] - Framework details
- [[Project Structure]] - Overall organization
- [[Frontend Architecture]] - This note
- [[TDD Approach]] - Testing methodology
- [[Tech Stack]] - Technologies used

---

#architecture #frontend #nextjs #react
