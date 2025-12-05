package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// GameID represents a unique game identifier code
type GameID string

func (id GameID) String() string {
	return string(id)
}

// GameStatus represents the current state of a game
type GameStatus string

const (
	GameStatusPending   GameStatus = "pending"
	GameStatusInProgress GameStatus = "in_progress"
	GameStatusCompleted GameStatus = "completed"
)

// Game represents a Mafia game session
type Game struct {
	ID          GameID     `json:"id" db:"id"`
	Status      GameStatus `json:"status" db:"status"`
	ModeratorID uuid.UUID  `json:"moderator_id" db:"moderator_id"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// NewGame creates a new Game instance with default values
func NewGame(moderatorID uuid.UUID) (*Game, error) {
	if moderatorID == uuid.Nil {
		return nil, errors.New("moderator ID is required")
	}

	now := time.Now()
	// Generate a random 8-character ID
	// Note: In production, ensure uniqueness collision check
	id := uuid.New().String()[:8]

	return &Game{
		ID:          GameID(id),
		Status:      GameStatusPending,
		ModeratorID: moderatorID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// CanJoin checks if players can join the game
func (g *Game) CanJoin() bool {
	return g.Status == GameStatusPending
}

// CanStart checks if the game can be started
func (g *Game) CanStart() bool {
	return g.Status == GameStatusPending
}

// Start transitions the game to in-progress status
func (g *Game) Start() error {
	if !g.CanStart() {
		return ErrGameAlreadyStarted
	}
	g.Status = GameStatusInProgress
	g.UpdatedAt = time.Now()
	return nil
}

// Complete transitions the game to completed status
func (g *Game) Complete() error {
	if g.Status != GameStatusInProgress {
		return ErrGameNotInProgress
	}
	g.Status = GameStatusCompleted
	g.UpdatedAt = time.Now()
	return nil
}
