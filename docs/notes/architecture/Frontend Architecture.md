# Frontend Architecture

Design and organization of the [[Next.js]] frontend.

## Overview

```
┌─────────────────┐
│   App Router    │  app/
│   (Next.js 15)  │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Pages  │  app/*/page.tsx
    └────┬────┘
         │
    ┌────▼────────┐
    │  Components │  components/
    └────┬────────┘
         │
    ┌────▼────┐
    │   API   │  Fetch to backend
    └─────────┘
```

## App Router Structure

### File-Based Routing

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # / (home)
├── globals.css            # Global styles
├── games/
│   ├── page.tsx           # /games (list)
│   ├── [id]/
│   │   └── page.tsx       # /games/:id (detail)
│   └── create/
│       └── page.tsx       # /games/create
└── moderator/
    └── [gameId]/
        └── page.tsx        # /moderator/:gameId
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

### Organization

```
components/
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

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── games/               # Games section
├── components/              # Reusable components
│   ├── game/
│   ├── player/
│   └── ui/
├── types/                   # TypeScript types
│   ├── game.ts
│   └── player.ts
├── lib/                     # Utilities
│   ├── api.ts              # API functions
│   └── utils.ts            # Helper functions
├── __tests__/              # Tests
│   └── components/
├── public/                 # Static files
└── package.json
```

## Related Notes

- [[Next.js]] - Framework details
- [[Project Structure]] - Overall organization
- [[Frontend Architecture]] - This note
- [[TDD Approach]] - Testing methodology
- [[Tech Stack]] - Technologies used

---

#architecture #frontend #nextjs #react
