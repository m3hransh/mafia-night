package repository

import (
	"context"
	"testing"

	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/player"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPlayerRepository_Create(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game first
	game, err := client.Game.
		Create().
		SetID("GAME1").
		SetStatus("pending").
		SetModeratorID("mod1").
		Save(ctx)
	require.NoError(t, err)

	// Create a player
	player, err := client.Player.
		Create().
		SetName("Alice").
		SetGameID(game.ID).
		SetTelegramID("telegram123").
		Save(ctx)

	require.NoError(t, err)
	assert.NotZero(t, player.ID)
	assert.Equal(t, "Alice", player.Name)
	assert.Equal(t, "GAME1", player.GameID)
	assert.Equal(t, "telegram123", player.TelegramID)
}

func TestPlayerRepository_UniqueNamePerGame(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	game, err := client.Game.
		Create().
		SetID("GAME2").
		SetStatus("pending").
		SetModeratorID("mod2").
		Save(ctx)
	require.NoError(t, err)

	// Create first player
	_, err = client.Player.
		Create().
		SetName("Alice").
		SetGameID(game.ID).
		Save(ctx)
	require.NoError(t, err)

	// Try to create another player with same name in same game (should fail)
	_, err = client.Player.
		Create().
		SetName("Alice").
		SetGameID(game.ID).
		Save(ctx)
	assert.Error(t, err)
}

func TestPlayerRepository_SameNameDifferentGames(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create two games
	game1, err := client.Game.Create().SetID("GAME3").SetStatus("pending").SetModeratorID("mod3").Save(ctx)
	require.NoError(t, err)
	game2, err := client.Game.Create().SetID("GAME4").SetStatus("pending").SetModeratorID("mod4").Save(ctx)
	require.NoError(t, err)

	// Create player with same name in both games (should succeed)
	player1, err := client.Player.
		Create().
		SetName("Alice").
		SetGameID(game1.ID).
		Save(ctx)
	require.NoError(t, err)

	player2, err := client.Player.
		Create().
		SetName("Alice").
		SetGameID(game2.ID).
		Save(ctx)
	require.NoError(t, err)

	assert.NotEqual(t, player1.ID, player2.ID)
	assert.Equal(t, player1.Name, player2.Name)
}

func TestPlayerRepository_GetByGameID(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	game, err := client.Game.Create().SetID("GAME5").SetStatus("pending").SetModeratorID("mod5").Save(ctx)
	require.NoError(t, err)

	// Create multiple players
	_, err = client.Player.Create().SetName("Alice").SetGameID(game.ID).Save(ctx)
	require.NoError(t, err)
	_, err = client.Player.Create().SetName("Bob").SetGameID(game.ID).Save(ctx)
	require.NoError(t, err)
	_, err = client.Player.Create().SetName("Charlie").SetGameID(game.ID).Save(ctx)
	require.NoError(t, err)

	// Query all players in the game
	players, err := client.Player.
		Query().
		Where(player.GameIDEQ(game.ID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, players, 3)
}

func TestPlayerRepository_Delete(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create game and player
	game, err := client.Game.Create().SetID("GAME6").SetStatus("pending").SetModeratorID("mod6").Save(ctx)
	require.NoError(t, err)

	player, err := client.Player.Create().SetName("Alice").SetGameID(game.ID).Save(ctx)
	require.NoError(t, err)

	// Delete player
	err = client.Player.DeleteOne(player).Exec(ctx)
	require.NoError(t, err)

	// Verify deleted
	_, err = client.Player.Get(ctx, player.ID)
	assert.Error(t, err)
	assert.True(t, ent.IsNotFound(err))
}

func TestPlayerRepository_CascadeDelete(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create game with players
	game, err := client.Game.Create().SetID("GAME7").SetStatus("pending").SetModeratorID("mod7").Save(ctx)
	require.NoError(t, err)

	_, err = client.Player.Create().SetName("Alice").SetGameID(game.ID).Save(ctx)
	require.NoError(t, err)
	_, err = client.Player.Create().SetName("Bob").SetGameID(game.ID).Save(ctx)
	require.NoError(t, err)

	// Delete game (should cascade delete players)
	err = client.Game.DeleteOne(game).Exec(ctx)
	require.NoError(t, err)

	// Verify players are deleted
	players, err := client.Player.Query().Where(player.GameIDEQ(game.ID)).All(ctx)
	require.NoError(t, err)
	assert.Len(t, players, 0)
}
