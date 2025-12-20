# Testing Role Distribution Feature

Manual and API testing guide for the role distribution system.

Related: [[ROLE_DISTRIBUTION_FEATURE]] | [[Testing Workflow]] | [[CURRENT_FEATURES]]

Tags: #testing #manual-testing #api-testing #e2e

## Manual Testing Guide

### Prerequisites
1. Start the backend server: `cd backend && go run cmd/api/main.go`
2. Start the frontend dev server: `cd frontend && npm run dev`
3. Have at least 2 browser windows/tabs ready (one for moderator, one for player)

### Test Scenario 1: Basic Role Distribution Flow

#### Step 1: Moderator Creates Game
1. Open browser as Moderator: http://localhost:3000/create-game
2. Click "Create Game"
3. Note the game code (e.g., ABC123)
4. Share the join URL or game code

#### Step 2: Players Join Game
1. Open new browser window/tab as Player 1
2. Navigate to http://localhost:3000/join-game?code=ABC123
3. Enter player name (e.g., "Alice")
4. Click "Join Game"
5. Repeat for Player 2 with name "Bob"

#### Step 3: Verify Players Appear
- In moderator view, both players should appear in the players list
- In player views, both should see the full player list
- Player count should show (2)

#### Step 4: Moderator Selects Roles
1. In moderator view, click "Select Roles"
2. Choose 2 roles (e.g., 1 Detective + 1 Godfather)
3. Verify the counter shows "✓ Complete"
4. Click "Confirm Selection"

#### Step 5: Verify Role Distribution
**Moderator View:**
- Should see "Roles Distributed!" message
- Roles grouped by team:
  - Village Team section (green) showing Alice/Bob with Detective
  - Mafia Team section (red) showing Alice/Bob with Godfather
- Can see which player has which role

**Player Views:**
- Each player should automatically see their assigned role card
- Role card displays:
  - Video animation
  - Role name
  - Team (Village/Mafia/Independent)
  - Description
  - Abilities (if any)
- Message: "Keep your role secret!"

### Test Scenario 2: Multiple Players with Multiple Roles

#### Setup
1. Create game
2. Have 5 players join:
   - Alice, Bob, Charlie, Diana, Eve

#### Role Selection
Select roles totaling 5:
- 2x Villagers
- 1x Detective
- 1x Godfather
- 1x Jester

#### Verification
1. All 5 roles should be randomly distributed
2. Moderator should see:
   - Village Team: 3 players (2 Villagers + 1 Detective)
   - Mafia Team: 1 player (Godfather)
   - Independent: 1 player (Jester)
3. Each player sees only their own role

### Test Scenario 3: Error Cases

#### Test 3.1: Role Count Mismatch
1. Create game with 3 players
2. Select roles totaling 2 or 4 (not 3)
3. "Confirm Selection" should be disabled
4. Shows "X more needed" or "X too many"

#### Test 3.2: Roles Already Assigned
1. Distribute roles successfully
2. Try to distribute again (would need to use API directly)
3. Should return error "roles have already been assigned"

#### Test 3.3: Wrong Moderator
1. Create game as Moderator A
2. Try to distribute roles with Moderator B's ID (API level test)
3. Should return 403 Forbidden

### Test Scenario 4: Game Flow Persistence

#### Test Browser Refresh
1. Moderator distributes roles
2. Players refresh their browsers
3. Verify: Players still see their assigned roles (localStorage)
4. Moderator refreshes
5. Verify: Moderator still sees role assignments

### API Testing with curl

#### 1. Create Game
```bash
MODERATOR_ID="mod-$(uuidgen)"
GAME_RESPONSE=$(curl -s -X POST http://localhost:8080/api/games \
  -H "X-Moderator-ID: $MODERATOR_ID")
GAME_ID=$(echo $GAME_RESPONSE | jq -r '.id')
echo "Game ID: $GAME_ID"
echo "Moderator ID: $MODERATOR_ID"
```

#### 2. Add Players
```bash
# Player 1
PLAYER1=$(curl -s -X POST http://localhost:8080/api/games/$GAME_ID/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}')
PLAYER1_ID=$(echo $PLAYER1 | jq -r '.id')

# Player 2
PLAYER2=$(curl -s -X POST http://localhost:8080/api/games/$GAME_ID/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob"}')
PLAYER2_ID=$(echo $PLAYER2 | jq -r '.id')

echo "Player 1 ID: $PLAYER1_ID"
echo "Player 2 ID: $PLAYER2_ID"
```

#### 3. Get Roles (for role IDs)
```bash
ROLES=$(curl -s http://localhost:8080/api/roles)
DETECTIVE_ID=$(echo $ROLES | jq -r '.[] | select(.slug=="detective") | .id')
GODFATHER_ID=$(echo $ROLES | jq -r '.[] | select(.slug=="godfather") | .id')
echo "Detective ID: $DETECTIVE_ID"
echo "Godfather ID: $GODFATHER_ID"
```

#### 4. Distribute Roles
```bash
curl -X POST http://localhost:8080/api/games/$GAME_ID/distribute-roles \
  -H "Content-Type: application/json" \
  -H "X-Moderator-ID: $MODERATOR_ID" \
  -d "{
    \"roles\": [
      {\"role_id\": \"$DETECTIVE_ID\", \"count\": 1},
      {\"role_id\": \"$GODFATHER_ID\", \"count\": 1}
    ]
  }"
```

#### 5. View Moderator's Role Assignments
```bash
curl -s http://localhost:8080/api/games/$GAME_ID/roles \
  -H "X-Moderator-ID: $MODERATOR_ID" | jq
```

#### 6. View Player's Role
```bash
curl -s http://localhost:8080/api/games/$GAME_ID/players/$PLAYER1_ID/role | jq
curl -s http://localhost:8080/api/games/$GAME_ID/players/$PLAYER2_ID/role | jq
```

## Expected Results

### Success Indicators
✓ Backend compiles without errors
✓ Frontend compiles without errors  
✓ All existing tests still pass
✓ Role distribution is random (different each time)
✓ Role count validation works
✓ Moderator sees all role assignments
✓ Players only see their own roles
✓ Game status updates to "active" after distribution
✓ Role assignments persist across page refreshes

### Performance
- Role distribution should complete in < 1 second
- Players should see roles within 3 seconds of distribution
- No visible lag in UI

## Known Limitations
1. Cannot re-distribute roles after initial assignment
2. No notification system (players must poll for role)
3. Cannot see role history after leaving game

## Debug Tips

### Backend Logs
- Check for transaction errors
- Verify role IDs are valid UUIDs
- Check game status transitions

### Frontend Console
- Check network tab for API calls
- Verify localStorage persistence
- Check for polling intervals (every 3s for roles)

### Database Queries
```sql
-- Check role assignments
SELECT gr.game_id, p.name, r.name as role_name, r.team
FROM game_roles gr
JOIN players p ON gr.player_id = p.id
JOIN roles r ON gr.role_id = r.id
WHERE gr.game_id = 'YOUR_GAME_ID';

-- Check game status
SELECT * FROM games WHERE id = 'YOUR_GAME_ID';
```

## Related Notes
- [[ROLE_DISTRIBUTION_FEATURE]] - Feature implementation details
- [[Testing Workflow]] - General testing approach
- [[CURRENT_FEATURES]] - Feature tracking
- [[Backend Architecture]] - Understanding the backend
- [[API Design]] - API patterns and conventions

## Automated Testing
For automated tests, see:
- Backend: `internal/service/game_service_test.go`
- Backend: `internal/handler/game_handler_test.go`
- Frontend: `e2e/game-flow.spec.ts` (Playwright)

---
*Created: 2024-12-20*
*Last updated: 2024-12-20*
