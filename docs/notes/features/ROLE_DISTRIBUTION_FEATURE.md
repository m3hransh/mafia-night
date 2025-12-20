# Role Distribution Feature

## Overview
Implemented a complete role distribution system that allows moderators to assign roles to players and enables players to view their assigned role cards.

Related: [[CURRENT_FEATURES]] | [[TESTING_ROLE_DISTRIBUTION]] | [[Game State Persistence]]

Tags: #feature #role-distribution #backend #frontend #api

## Backend Implementation

### New API Endpoints

1. **POST /api/games/{id}/distribute-roles**
   - Distributes roles to all players in a game
   - Moderator only (requires X-Moderator-ID header)
   - Request body:
     ```json
     {
       "roles": [
         { "role_id": "uuid", "count": 2 },
         { "role_id": "uuid", "count": 3 }
       ]
     }
     ```
   - Validates role count matches player count
   - Randomly shuffles and assigns roles
   - Updates game status to "active"
   - Returns 200 on success

2. **GET /api/games/{id}/roles**
   - Gets all role assignments for a game (moderator view)
   - Moderator only (requires X-Moderator-ID header)
   - Returns array of player-role assignments grouped by team:
     ```json
     [
       {
         "player_id": "uuid",
         "player_name": "John",
         "role_id": "uuid",
         "role_name": "Detective",
         "role_slug": "detective",
         "video": "url",
         "team": "village",
         "assigned_at": "timestamp"
       }
     ]
     ```

3. **GET /api/games/{id}/players/{player_id}/role**
   - Gets the assigned role for a specific player
   - Public endpoint (no authentication required)
   - Returns full role details including abilities
   - Returns 404 if role not yet assigned

### Service Layer Changes (`internal/service/game_service.go`)

- **New Errors:**
  - `ErrInvalidRoleCount` - Role count doesn't match player count
  - `ErrRolesAlreadyAssigned` - Roles have already been distributed

- **New Methods:**
  - `DistributeRoles()` - Randomly assigns roles to players in a transaction
  - `GetPlayerRole()` - Retrieves assigned role for a player with role details
  - `GetGameRoles()` - Gets all role assignments for moderator view

- **New Type:**
  - `RoleSelection` struct for role distribution payload

### Key Features

- **Random Distribution**: Uses secure random shuffling to assign roles
- **Transaction Safety**: All role assignments happen in a single database transaction
- **Duplicate Prevention**: Checks if roles are already assigned before distributing
- **Validation**: Ensures role count matches player count
- **Authorization**: Only moderator can distribute and view all roles

## Frontend Implementation

### Updated Components

#### 1. **Create Game Page** (`app/create-game/page.tsx`)

**New Features:**
- Distributes roles when moderator confirms selection
- Shows loading state during distribution
- Displays role assignments grouped by team after distribution
- Each team section color-coded:
  - Mafia: Red
  - Village: Green
  - Independent: Yellow

**New State:**
- `distributingRoles` - Loading state during distribution
- `roleAssignments` - Array of player-role assignments for moderator view

**Flow:**
1. Moderator selects roles in RoleSelectionPanel
2. On confirm, calls `distributeRoles()` API
3. Fetches role assignments via `getGameRoles()`
4. Displays assignments grouped by team
5. Shows player names and their assigned roles

#### 2. **Join Game Page** (`app/join-game/page.tsx`)

**New Features:**
- Polls for role assignment every 3 seconds
- Displays assigned role card when roles are distributed
- Shows role video, name, team, description, and abilities
- Maintains waiting screen until roles are assigned

**New State:**
- `assignedRole` - The role assigned to the player
- `checkingRole` - Prevents concurrent role checks

**Flow:**
1. Player joins game and waits
2. Backend polls for role assignment
3. When role is assigned, displays full role card
4. Shows video, description, abilities
5. Reminds player to keep role secret

### Updated API Client (`lib/api.ts`)

**New Functions:**
```typescript
// Distribute roles to players
distributeRoles(gameId, moderatorId, roles): Promise<void>

// Get all role assignments (moderator)
getGameRoles(gameId, moderatorId): Promise<PlayerRoleAssignment[]>

// Get player's assigned role
getPlayerRole(gameId, playerId): Promise<Role>
```

**New Type:**
```typescript
interface PlayerRoleAssignment {
  player_id: string;
  player_name: string;
  role_id: string;
  role_name: string;
  role_slug: string;
  video: string;
  team: 'mafia' | 'village' | 'independent';
  assigned_at: string;
}
```

## User Flows

### Moderator Flow

1. Create game and wait for players to join
2. Click "Select Roles" button
3. Choose roles matching player count
4. Click "Confirm Selection"
5. System distributes roles randomly
6. View all players grouped by team with their roles
7. Can use this view during game to track roles

### Player Flow

1. Join game with code
2. See list of all players waiting
3. Wait for moderator to distribute roles
4. Receive assigned role card automatically
5. View role details: video, name, team, description, abilities
6. Keep role secret and play the game!

## Technical Details

### Database Schema
Uses existing schema:
- `GameRole` table stores player-role assignments
- Fields: `game_id`, `player_id`, `role_id`, `assigned_at`
- Unique constraint on `(game_id, player_id)`

### Role Distribution Algorithm
1. Validate moderator authorization
2. Check no roles already assigned
3. Get all players in game
4. Validate total role count = player count
5. Build list of role IDs based on counts
6. Shuffle list using crypto-secure random
7. Assign roles to players in transaction
8. Update game status to "active"

### Error Handling
- Frontend shows clear error messages
- Backend returns appropriate HTTP status codes
- Validation at both frontend and backend
- Transaction rollback on any failure

### Security
- Moderator-only endpoints require X-Moderator-ID header
- Player role endpoint is public (players need to see their role)
- No player can see other players' roles
- Only moderator sees all role assignments

## Testing

Both backend and frontend compile successfully:
- Backend: `go build ./cmd/api` ✓
- Frontend: `npm run build` ✓

## Future Enhancements

Possible improvements:
1. Add role reveal animations
2. Allow re-distribution if game hasn't started
3. Add role swap/reassignment for moderator
4. Save role history for completed games
5. Add notifications when roles are distributed
6. Add sound effects for role assignment

## Related Notes
- [[CURRENT_FEATURES]] - Feature status and tracking
- [[TESTING_ROLE_DISTRIBUTION]] - Testing guide
- [[Game State Persistence]] - How state is maintained
- [[Backend Architecture]] - Overall backend design
- [[Frontend Architecture]] - Overall frontend design
- [[API Design]] - REST API patterns

## See Also
- Backend files: `internal/service/game_service.go`, `internal/handler/game_handler.go`
- Frontend files: `app/create-game/page.tsx`, `app/join-game/page.tsx`
- API client: `lib/api.ts`

---
*Created: 2024-12-20*
*Last updated: 2024-12-20*
