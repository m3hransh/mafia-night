package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/game"
	"github.com/mafia-night/backend/ent/player"
	"github.com/mafia-night/backend/pkg/gameid"
)

var (
	ErrEmptyGameID      = errors.New("game ID cannot be empty")
	ErrEmptyModeratorID = errors.New("moderator ID cannot be empty")
	ErrNotAuthorized    = errors.New("not authorized to perform this action")
	ErrEmptyUserID       = errors.New("user ID cannot be empty")
)

// GameService handles game-related business logic
type GameService struct {
	client *ent.Client
}

// NewGameService creates a new game service
func NewGameService(client *ent.Client) *GameService {
	return &GameService{client: client}
}

// CreateGame creates a new game with a generated ID
func (s *GameService) CreateGame(ctx context.Context, moderatorID string) (*ent.Game, error) {
	if moderatorID == "" {
		return nil, ErrEmptyModeratorID
	}

	gameID := gameid.Generate()

	game, err := s.client.Game.
		Create().
		SetID(gameID).
		SetModeratorID(moderatorID).
		SetStatus(game.StatusPending).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return game, nil
}

// GetGameByID retrieves a game by its ID
func (s *GameService) GetGameByID(ctx context.Context, gameID string) (*ent.Game, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}

	game, err := s.client.Game.Get(ctx, gameID)
	if err != nil {
		return nil, err
	}

	return game, nil
}

// UpdateGameStatus updates the status of a game
// Only the moderator who created the game can update it
func (s *GameService) UpdateGameStatus(ctx context.Context, gameID string, status game.Status, moderatorID string) (*ent.Game, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}
	if moderatorID == "" {
		return nil, ErrEmptyModeratorID
	}

	// Get the game first to check moderator
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Check if moderator matches
	if existingGame.ModeratorID != moderatorID {
		return nil, ErrNotAuthorized
	}

	// Update the status
	updated, err := existingGame.Update().
		SetStatus(status).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return updated, nil
}

// DeleteGame deletes a game
// Only the moderator who created the game can delete it
func (s *GameService) DeleteGame(ctx context.Context, gameID string, moderatorID string) error {
	if gameID == "" {
		return ErrEmptyGameID
	}
	if moderatorID == "" {
		return ErrEmptyModeratorID
	}

	// Get the game first to check moderator
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return err
	}

	// Check if moderator matches
	if existingGame.ModeratorID != moderatorID {
		return ErrNotAuthorized
	}

	// Delete the game
	err = s.client.Game.DeleteOne(existingGame).Exec(ctx)
	if err != nil {
		return err
	}

	return nil
}

func (s *GameService) JoinGame(ctx context.Context, gameID string, userName string) (*ent.Player, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID	
	}
	if userName == ""	 {
		return nil, ErrEmptyUserID
	}


	// Get the game first
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Create the player
	player, err := s.client.Player.
		Create().
		SetID(uuid.New()).
		SetName(userName).
		SetGameID(existingGame.ID).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return player, nil
}

// GetPlayers retrieves all players in a game
func (s *GameService) GetPlayers(ctx context.Context, gameID string) ([]*ent.Player, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}

	// Verify game exists
	_, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Get all players for this game
	players, err := s.client.Player.
		Query().
		Where(player.GameID(gameID)).
		All(ctx)

	if err != nil {
		return nil, err
	}

	return players, nil
}
