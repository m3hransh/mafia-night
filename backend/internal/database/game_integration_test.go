package database

import (
	"context"
	"testing"

	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/game"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGameRepository_Create(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	g, err := client.Game.
		Create().
		SetID("ABC123").
		SetStatus("pending").
		SetModeratorID("mod-123").
		Save(ctx)

	require.NoError(t, err)
	assert.Equal(t, "ABC123", g.ID)
	assert.Equal(t, game.StatusPending, g.Status)
	assert.Equal(t, "mod-123", g.ModeratorID)
	assert.NotZero(t, g.CreatedAt)
}

func TestGameRepository_GetByID(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	created, err := client.Game.
		Create().
		SetID("TEST123").
		SetStatus("pending").
		SetModeratorID("mod-456").
		Save(ctx)
	require.NoError(t, err)

	// Retrieve it
	found, err := client.Game.Get(ctx, created.ID)
	require.NoError(t, err)
	assert.Equal(t, "TEST123", found.ID)
	assert.Equal(t, game.StatusPending, found.Status)
	assert.Equal(t, "mod-456", found.ModeratorID)
}

func TestGameRepository_UpdateStatus(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	g, err := client.Game.
		Create().
		SetID("UPD123").
		SetStatus("pending").
		SetModeratorID("mod-789").
		Save(ctx)
	require.NoError(t, err)

	// Update status
	updated, err := g.Update().
		SetStatus("active").
		Save(ctx)
	require.NoError(t, err)
	assert.Equal(t, game.StatusActive, updated.Status)

	// Verify in database
	found, err := client.Game.Get(ctx, "UPD123")
	require.NoError(t, err)
	assert.Equal(t, game.StatusActive, found.Status)
}

func TestGameRepository_Delete(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	g, err := client.Game.
		Create().
		SetID("DEL123").
		SetStatus("pending").
		SetModeratorID("mod-999").
		Save(ctx)
	require.NoError(t, err)

	// Delete it
	err = client.Game.DeleteOne(g).Exec(ctx)
	require.NoError(t, err)

	// Verify it's gone
	_, err = client.Game.Get(ctx, "DEL123")
	assert.Error(t, err)
	assert.True(t, ent.IsNotFound(err))
}

func TestGameRepository_ListByStatus(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create multiple games
	_, err := client.Game.Create().SetID("G1").SetStatus("pending").SetModeratorID("m1").Save(ctx)
	require.NoError(t, err)
	_, err = client.Game.Create().SetID("G2").SetStatus("active").SetModeratorID("m2").Save(ctx)
	require.NoError(t, err)
	_, err = client.Game.Create().SetID("G3").SetStatus("pending").SetModeratorID("m3").Save(ctx)
	require.NoError(t, err)

	// Query pending games
	pending, err := client.Game.
		Query().
		Where(game.StatusEQ(game.StatusPending)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, pending, 2)
}

func TestGameRepository_WithPlayers(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a game
	createdGame, err := client.Game.
		Create().
		SetID("GAME1").
		SetStatus("pending").
		SetModeratorID("moderator1").
		Save(ctx)
	require.NoError(t, err)

	// Add players to the game
	player1, err := client.Player.
		Create().
		SetName("Alice").
		SetGameID(createdGame.ID).
		Save(ctx)
	require.NoError(t, err)

	player2, err := client.Player.
		Create().
		SetName("Bob").
		SetGameID(createdGame.ID).
		Save(ctx)
	require.NoError(t, err)

	// Query game with players  
	gameWithPlayers, err := client.Game.
		Query().
		Where(game.IDEQ(createdGame.ID)).
		WithPlayers().
		Only(ctx)
	require.NoError(t, err)

	players, err := gameWithPlayers.QueryPlayers().All(ctx)
	require.NoError(t, err)
	assert.Len(t, players, 2)
	assert.Contains(t, []string{player1.Name, player2.Name}, players[0].Name)
	assert.Contains(t, []string{player1.Name, player2.Name}, players[1].Name)
}
