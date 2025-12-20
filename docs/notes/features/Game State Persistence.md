# Game State Persistence

## Overview
Implements browser-side persistence of game state using localStorage, allowing users to return to their games after refreshing or closing the browser.

## Implementation

### Storage Utility (`lib/gameStorage.ts`)
Provides functions to manage game state in localStorage:

**Moderator State:**
```typescript
interface ModeratorGameState {
  gameId: string;
  moderatorId: string;
  phase: 'waiting-for-players' | 'selecting-roles' | 'game-started';
  timestamp: number;
}
```

**Player State:**
```typescript
interface PlayerGameState {
  gameId: string;
  playerId: string;
  playerName: string;
  timestamp: number;
}
```

### Functions
- `saveModeratorGame()` - Saves moderator game state
- `getModeratorGame()` - Retrieves moderator state (returns null if expired)
- `clearModeratorGame()` - Clears moderator state
- `savePlayerGame()` - Saves player game state
- `getPlayerGame()` - Retrieves player state (returns null if expired)
- `clearPlayerGame()` - Clears player state

### Auto-Expiry
All stored data automatically expires after **24 hours** and is cleared on retrieval.

## Usage

### Create Game Flow
1. On mount, checks for existing moderator session
2. If found, validates with backend API
3. Restores game state (gameId, phase, players)
4. Saves state on:
   - Game creation
   - Phase transitions (waiting → selecting roles → started)

### Join Game Flow
1. On mount, checks for existing player session
2. If found, validates player still exists in game
3. Restores player state (gameId, playerId, playerName)
4. Saves state after successful join

## Validation
Before restoring any state, the system:
1. Fetches current data from backend
2. Verifies game/player still exists
3. Clears localStorage if validation fails

## Storage Keys
- `mafia_night_moderator` - Moderator game state
- `mafia_night_player` - Player game state

## Links
- [[ROLE_DISTRIBUTION_FEATURE]] - Role distribution uses same persistence patterns
- [[CURRENT_FEATURES]] - Overall feature status
- [[Project Overview]]
- [[Frontend Architecture]]
- [[Tech Stack]]
- [[Testing Workflow]]

## Tags
#feature #persistence #localStorage #state-management #frontend
