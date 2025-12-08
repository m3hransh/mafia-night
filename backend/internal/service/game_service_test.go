package service

import (
	"context"
	"testing"

	"github.com/mafia-night/backend/ent/game"
	"github.com/mafia-night/backend/internal/database"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGameService_CreateGame(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("creates game with generated ID", func(t *testing.T) {
		moderatorID := "mod-123"
		
		createdGame, err := service.CreateGame(ctx, moderatorID)
		
		require.NoError(t, err)
		assert.NotEmpty(t, createdGame.ID)
		assert.Equal(t, 6, len(createdGame.ID), "Game ID should be 6 characters")
		assert.Equal(t, moderatorID, createdGame.ModeratorID)
		assert.Equal(t, game.StatusPending, createdGame.Status)
		assert.NotZero(t, createdGame.CreatedAt)
	})

	t.Run("generates unique game IDs", func(t *testing.T) {
		game1, err := service.CreateGame(ctx, "mod-1")
		require.NoError(t, err)

		game2, err := service.CreateGame(ctx, "mod-2")
		require.NoError(t, err)

		assert.NotEqual(t, game1.ID, game2.ID, "Game IDs should be unique")
	})

	t.Run("fails with empty moderator ID", func(t *testing.T) {
		_, err := service.CreateGame(ctx, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "moderator ID")
	})
}

func TestGameService_GetGameByID(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("retrieves existing game", func(t *testing.T) {
		// Create a game first
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		// Retrieve it
		retrieved, err := service.GetGameByID(ctx, created.ID)
		
		require.NoError(t, err)
		assert.Equal(t, created.ID, retrieved.ID)
		assert.Equal(t, created.ModeratorID, retrieved.ModeratorID)
		assert.Equal(t, created.Status, retrieved.Status)
	})

	t.Run("returns error for non-existent game", func(t *testing.T) {
		_, err := service.GetGameByID(ctx, "NOEXIST")
		assert.Error(t, err)
	})

	t.Run("returns error for empty ID", func(t *testing.T) {
		_, err := service.GetGameByID(ctx, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "game ID")
	})
}

func TestGameService_UpdateGameStatus(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("updates game status successfully", func(t *testing.T) {
		// Create a game
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)
		assert.Equal(t, game.StatusPending, created.Status)

		// Update to active
		updated, err := service.UpdateGameStatus(ctx, created.ID, game.StatusActive, "mod-123")
		
		require.NoError(t, err)
		assert.Equal(t, game.StatusActive, updated.Status)
	})

	t.Run("fails when moderator ID doesn't match", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		// Try to update with different moderator
		_, err = service.UpdateGameStatus(ctx, created.ID, game.StatusActive, "different-mod")
		
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not authorized")
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		_, err := service.UpdateGameStatus(ctx, "NOEXIST", game.StatusActive, "mod-123")
		assert.Error(t, err)
	})

	t.Run("fails with empty game ID", func(t *testing.T) {
		_, err := service.UpdateGameStatus(ctx, "", game.StatusActive, "mod-123")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "game ID")
	})

	t.Run("fails with empty moderator ID", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		_, err = service.UpdateGameStatus(ctx, created.ID, game.StatusActive, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "moderator ID")
	})
}

func TestGameService_DeleteGame(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("deletes game successfully", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		// Delete the game
		err = service.DeleteGame(ctx, created.ID, "mod-123")
		require.NoError(t, err)

		// Verify it's gone
		_, err = service.GetGameByID(ctx, created.ID)
		assert.Error(t, err)
	})

	t.Run("fails when moderator ID doesn't match", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		// Try to delete with different moderator
		err = service.DeleteGame(ctx, created.ID, "different-mod")
		
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not authorized")

		// Verify game still exists
		retrieved, err := service.GetGameByID(ctx, created.ID)
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		err := service.DeleteGame(ctx, "NOEXIST", "mod-123")
		assert.Error(t, err)
	})

	t.Run("fails with empty game ID", func(t *testing.T) {
		err := service.DeleteGame(ctx, "", "mod-123")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "game ID")
	})

	t.Run("fails with empty moderator ID", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		err = service.DeleteGame(ctx, created.ID, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "moderator ID")
	})
}

func TestGameService_JoinGame(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("joins game successfully", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		userName := "player1"
		player, err := service.JoinGame(ctx, created.ID, userName)
		require.NoError(t, err)
		assert.NotNil(t, player)
		assert.Equal(t, created.ID, player.GameID)
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		_, err := service.JoinGame(ctx, "NOEXIST", "player1")
		assert.Error(t, err)
	})

	t.Run("fails with empty game ID", func(t *testing.T) {
		_, err := service.JoinGame(ctx, "", "player1")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "game ID")
	})

	t.Run("fails with empty user ID", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		_, err = service.JoinGame(ctx, created.ID, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "user ID")
	})
}

func TestGameService_GetPlayers(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("returns all players in a game", func(t *testing.T) {
		// Create a game
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		// Add players
		_, err = service.JoinGame(ctx, created.ID, "player1")
		require.NoError(t, err)
		_, err = service.JoinGame(ctx, created.ID, "player2")
		require.NoError(t, err)
		_, err = service.JoinGame(ctx, created.ID, "player3")
		require.NoError(t, err)

		// Get players
		players, err := service.GetPlayers(ctx, created.ID)
		require.NoError(t, err)
		assert.Len(t, players, 3)
		
		// Check player names
		names := make([]string, len(players))
		for i, p := range players {
			names[i] = p.Name
		}
		assert.Contains(t, names, "player1")
		assert.Contains(t, names, "player2")
		assert.Contains(t, names, "player3")
	})

	t.Run("returns empty list for game with no players", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		players, err := service.GetPlayers(ctx, created.ID)
		require.NoError(t, err)
		assert.Empty(t, players)
	})

	t.Run("fails with empty game ID", func(t *testing.T) {
		_, err := service.GetPlayers(ctx, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "game ID")
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		_, err := service.GetPlayers(ctx, "NOEXIST")
		assert.Error(t, err)
	})
}

func TestGameService_RemovePlayer(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewGameService(client)
	ctx := context.Background()

	t.Run("removes player successfully", func(t *testing.T) {
		// Create game and add player
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		player, err := service.JoinGame(ctx, created.ID, "player1")
		require.NoError(t, err)

		// Remove player
		err = service.RemovePlayer(ctx, created.ID, player.ID.String())
		require.NoError(t, err)

		// Verify player is removed
		players, err := service.GetPlayers(ctx, created.ID)
		require.NoError(t, err)
		assert.Empty(t, players)
	})

	t.Run("fails with empty game ID", func(t *testing.T) {
		err := service.RemovePlayer(ctx, "", "player-id")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "game ID")
	})

	t.Run("fails with empty player ID", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		err = service.RemovePlayer(ctx, created.ID, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "player ID")
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		err := service.RemovePlayer(ctx, "NOEXIST", "player-id")
		assert.Error(t, err)
	})

	t.Run("fails for non-existent player", func(t *testing.T) {
		created, err := service.CreateGame(ctx, "mod-123")
		require.NoError(t, err)

		err = service.RemovePlayer(ctx, created.ID, "00000000-0000-0000-0000-000000000000")
		assert.Error(t, err)
	})
}
