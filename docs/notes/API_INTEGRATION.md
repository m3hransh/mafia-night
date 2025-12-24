# Frontend-Backend API Integration

## Overview

The Mafia Night frontend integrates with the Go backend API to manage game creation, player joining, and real-time player updates.

## Setup

### Backend Setup

1. **CORS Configuration**:
   The backend CORS is environment-aware:

   **Development** (no `ALLOWED_ORIGINS` env var):
   - Automatically allows: `localhost:3000`, `localhost:3001` (HTTP & HTTPS)

   **Production** (with `ALLOWED_ORIGINS` env var):
   - Set `ALLOWED_ORIGINS` to comma-separated list of frontend URLs
   - Examples:
     - Domain: `ALLOWED_ORIGINS=http://mafia.example.com,https://mafia.example.com`
     - IP: `ALLOWED_ORIGINS=http://123.456.789.012,https://123.456.789.012`

   The backend will log enabled origins on startup.

2. **Required Headers**:
   - `X-Moderator-ID`: Required for creating games (auto-generated UUID in frontend)
   - `Content-Type: application/json`: For all POST/PATCH requests

3. **Start Backend**:

   **Development:**
   ```bash
   cd backend
   go run cmd/api/main.go
   # Server runs on http://localhost:8080
   # CORS: localhost:3000, localhost:3001
   ```

   **Production:**
   ```bash
   # Set environment variable
   export ALLOWED_ORIGINS="http://your-domain.com,https://your-domain.com"
   go run cmd/api/main.go
   # Or use docker-compose (reads from .env.production)
   ```

### Frontend Setup

1. **Environment Variables**:
   Create `.env.local` in frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   # Server runs on http://localhost:3000
   ```

## API Endpoints Used

### Create Game
```
POST /api/games
Headers:
  - X-Moderator-ID: <uuid>
  - Content-Type: application/json

Response:
{
  "id": "game-uuid",
  "moderator_id": "moderator-uuid",
  "status": "waiting",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Join Game
```
POST /api/games/{id}/join
Headers:
  - Content-Type: application/json
Body:
{
  "name": "Player Name"
}

Response:
{
  "id": "player-uuid",
  "name": "Player Name",
  "game_id": "game-uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Players
```
GET /api/games/{id}/players

Response:
[
  {
    "id": "player-uuid",
    "name": "Player Name",
    "game_id": "game-uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## Features

### Create Game Page (`/create-game`)

**Features**:
- Auto-generates unique moderator ID
- Creates game via API
- Displays game code for sharing
- Real-time player list updates (polls every 2 seconds)
- Copy game code to clipboard
- Share link generation
- Start game button (disabled until players join)

**Flow**:
1. User clicks "Create Game"
2. Frontend generates UUID for moderator
3. Sends POST request to `/api/games`
4. Receives game ID
5. Starts polling `/api/games/{id}/players` every 2 seconds
6. Displays players as they join

### Join Game Page (`/join-game`)

**Features**:
- Accept game code via URL parameter (`?code=xxx`) or manual entry
- Player name input
- Join game via API
- Real-time player list after joining
- Success confirmation

**Flow**:
1. User enters game code and name
2. Sends POST to `/api/games/{id}/join`
3. On success, starts polling for player list
4. Shows "You're In!" confirmation
5. Displays all players in game

## Real-time Updates

Both pages use **polling** (every 2 seconds) to update the player list. This ensures:
- Moderators see new players joining
- Players see other players in the lobby
- Updates happen automatically without page refresh

**Implementation**:
```typescript
useEffect(() => {
  const fetchPlayers = async () => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/players`);
    const data = await response.json();
    setPlayers(data);
  };

  fetchPlayers();
  const interval = setInterval(fetchPlayers, 2000);
  return () => clearInterval(interval);
}, [gameId]);
```

## Error Handling

### Backend Errors
- `400 Bad Request`: Invalid game ID, missing headers, or invalid request body
- `404 Not Found`: Game not found
- `409 Conflict`: Player name already exists in game
- `500 Internal Server Error`: Database or server errors

### Frontend Handling
- Displays error messages in red alert boxes
- Validates required fields before submission
- Shows loading states during API calls
- Handles network errors gracefully

## Production Deployment

### Environment Configuration

1. **Backend** - Add to `.env.production`:
   ```bash
   # CORS Configuration - Frontend URLs
   ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
   # Or with IP address
   ALLOWED_ORIGINS=http://123.456.789.012,https://123.456.789.012
   ```

2. **Frontend** - Add to `.env.production`:
   ```bash
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://your-domain.com/api
   # Or with IP
   NEXT_PUBLIC_API_URL=http://123.456.789.012/api
   ```

3. **Docker Compose**:
   The `docker-compose.prod.yml` automatically reads these variables and configures both services correctly.

### Deployment Steps

1. Update `.env.production` with your domain/IP
2. Deploy using: `just deploy-prod`
3. Verify CORS logs on backend startup
4. Test from frontend by creating a game

### CORS Verification

Check backend logs on startup:
```
CORS enabled for origins: [http://your-domain.com https://your-domain.com]
```

Test CORS manually:
```bash
curl -X OPTIONS http://your-domain.com/api/games \
  -H "Origin: http://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
# Should return Access-Control-Allow-Origin header
```

## Security

### CORS Protection
- Only configured origins can access the API
- Environment-based configuration prevents unauthorized access
- Development defaults to localhost only
- Production requires explicit origin configuration
- Credentials are allowed for future authentication

### Moderator Authorization
- Moderator ID stored in browser (sessionStorage/localStorage could be added)
- Required for game management operations
- Prevents unauthorized game modifications

## Future Enhancements

1. **WebSockets**: Replace polling with WebSocket connections for true real-time updates
2. **Authentication**: Add user accounts and session management
3. **Game State**: Add game start/end functionality
4. **Role Assignment**: Integrate role card assignment from backend
5. **Persistent Sessions**: Store moderator/player IDs in localStorage

## Testing

### Test Create Game Flow
1. Start backend: `cd backend && go run cmd/api/main.go`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3000`
4. Click "Create Game"
5. Copy game code
6. Open new incognito window
7. Navigate to join page with code
8. Enter name and join
9. See player appear in moderator's view

### Test CORS
```bash
curl -X POST http://localhost:8080/api/games \
  -H "Origin: http://localhost:3000" \
  -H "X-Moderator-ID: test-moderator" \
  -v
# Should see Access-Control-Allow-Origin header
```

---

## Related Documentation

- [[CORS_SETUP]] - Detailed CORS configuration
- [[DEPLOYMENT]] - Production deployment guide
- [[TESTING]] - Backend testing guide
- [[GITHUB_ACTIONS_SETUP]] - CI/CD setup
- [[CURRENT_FEATURES]] - Current features and API endpoints

---

#api #integration #cors #frontend #backend

Built with Next.js 16, Go 1.25, and PostgreSQL
