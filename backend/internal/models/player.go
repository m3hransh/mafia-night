package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Player represents a player in a Mafia game
type Player struct {
	ID         uuid.UUID `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	TelegramID string    `json:"telegram_id" db:"telegram_id"`
	GameID     GameID    `json:"game_id" db:"game_id"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// NewPlayer creates a new Player instance
func NewPlayer(name, telegramID string, gameID GameID) (*Player, error) {
	if name == "" {
		return nil, errors.New("player name is required")
	}
	if telegramID == "" {
		return nil, errors.New("telegram ID is required")
	}
	if gameID == "" {
		return nil, errors.New("game ID is required")
	}

	return &Player{
		ID:         uuid.New(),
		Name:       name,
		TelegramID: telegramID,
		GameID:     gameID,
		CreatedAt:  time.Now(),
	}, nil
}
