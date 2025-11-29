# Next.js

React framework for the frontend.

## Version

**Next.js 15** with App Router

## Why Next.js?

### ✅ Server-Side Rendering
- Fast initial page load
- Better SEO
- Streaming support

### ✅ File-Based Routing
- Intuitive structure
- No configuration needed
- Automatic code splitting

### ✅ Modern Features
- Server Components (default)
- Server Actions
- Streaming
- Suspense

### ✅ Great DX
- Fast Refresh (instant updates)
- TypeScript support
- Built-in optimizations

## App Router

New in Next.js 13+, default in 15.

### File Structure
```
app/
├── layout.tsx       # Root layout
├── page.tsx         # / route
├── about/
│   └── page.tsx     # /about route
└── games/
    ├── page.tsx     # /games route
    └── [id]/
        └── page.tsx # /games/:id route
```

### Special Files
- `layout.tsx` - Shared layout
- `page.tsx` - Route page
- `loading.tsx` - Loading UI
- `error.tsx` - Error handling
- `not-found.tsx` - 404 page

## Server vs Client Components

### Server Components (Default)
```tsx
// Runs on server, no JS sent to client
export default async function Page() {
  const data = await fetchData()  // Can fetch directly!
  return <div>{data.map(...)}</div>
}
```

Benefits:
- Smaller bundle size
- Direct database access (if needed)
- Better security (API keys safe)

### Client Components
```tsx
'use client'  // Mark as client component

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

Use when you need:
- Interactivity (useState, onClick)
- Browser APIs (localStorage, window)
- React hooks (useEffect)

## Routing

### Static Routes
```tsx
// app/about/page.tsx
export default function About() {
  return <h1>About</h1>
}
// URL: /about
```

### Dynamic Routes
```tsx
// app/games/[id]/page.tsx
export default function GamePage({ params }: { params: { id: string } }) {
  return <h1>Game {params.id}</h1>
}
// URL: /games/ABC123
```

### Route Groups
```tsx
// app/(auth)/login/page.tsx
// app/(auth)/signup/page.tsx
// URLs: /login, /signup (no /auth in URL)
```

## Data Fetching

### Server Components (Recommended)
```tsx
async function getGames() {
  const res = await fetch(`${API_URL}/games`)
  return res.json()
}

export default async function GamesPage() {
  const games = await getGames()
  return <GameList games={games} />
}
```

### Client Components
```tsx
'use client'

export function GameList() {
  const [games, setGames] = useState([])
  
  useEffect(() => {
    fetch(`${API_URL}/games`)
      .then(res => res.json())
      .then(setGames)
  }, [])
  
  return <div>{games.map(...)}</div>
}
```

## Styling

### Tailwind CSS (Recommended)
```tsx
export function Button({ children }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
      {children}
    </button>
  )
}
```

### CSS Modules
```tsx
import styles from './Button.module.css'

export function Button({ children }) {
  return <button className={styles.button}>{children}</button>
}
```

## Configuration

### `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Access: `process.env.NEXT_PUBLIC_API_URL`

## Development

### Commands
```bash
# Development server
npm run dev
# or
just dev-frontend

# Build for production
npm run build

# Start production server
npm start
```

### Hot Reload
Changes reflect instantly:
- Edit component → see change
- No manual refresh needed

## Testing

See [[Testing Workflow]] for details.

### Jest + React Testing Library
```tsx
import { render, screen } from '@testing-library/react'
import Home from './page'

test('renders title', () => {
  render(<Home />)
  expect(screen.getByText('Mafia Night')).toBeInTheDocument()
})
```

### Run Tests
```bash
just test-frontend
# or
cd frontend && npm test
```

## TypeScript

Full TypeScript support:

```tsx
interface GameCardProps {
  game: Game
  onJoin?: (id: string) => void
}

export function GameCard({ game, onJoin }: GameCardProps) {
  return <div onClick={() => onJoin?.(game.id)}>...</div>
}
```

## Optimization

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
/>
```

### Code Splitting
Automatic for each route:
- `/games` loads only games code
- `/about` loads only about code

### Dynamic Import
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

## Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push

# Vercel auto-deploys!
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Common Patterns

### Layout with Navigation
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/games">Games</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### Loading State
```tsx
// app/games/loading.tsx
export default function Loading() {
  return <div>Loading games...</div>
}
```

### Error Handling
```tsx
// app/games/error.tsx
'use client'

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Error: {error.message}</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Learning Resources

- Official Docs: https://nextjs.org/docs
- Learn Next.js: https://nextjs.org/learn
- App Router: https://nextjs.org/docs/app

## Related Notes

- [[Frontend Architecture]] - How we use Next.js
- [[Tech Stack]] - All technologies
- [[Testing Workflow]] - Testing Next.js
- [[Phase 1 - Infrastructure]] - Next.js setup
- [[Development Workflow]] - Daily usage

---

#nextjs #react #frontend #framework
