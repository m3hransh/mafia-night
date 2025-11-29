package models

import (
	"time"

	"github.com/google/uuid"
)

// Player represents a player in a Mafia game
type Player struct {
	ID         uuid.UUID `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	TelegramID string    `json:"telegram_id" db:"telegram_id"`
	GameID     string    `json:"game_id" db:"game_id"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// NewPlayer creates a new Player instance
func NewPlayer(name, telegramID string, gameID string) *Player {
	return &Player{
		ID:         uuid.New(),
		Name:       name,
		TelegramID: telegramID,
		GameID:     gameID,
		CreatedAt:  time.Now(),
	}
}

// IsValid validates the player instance
func (p *Player) IsValid() bool {
	if p.ID == uuid.Nil {
		return false
	}
	if p.Name == "" {
		return false
	}
	if p.TelegramID == "" {
		return false
	}
	if p.GameID == "" {
		return false
	}
	return true
}
