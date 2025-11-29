package models

import (
	"time"

	"github.com/google/uuid"
)

// GameRole represents the assignment of a role to a player in a game
type GameRole struct {
	GameID     string    `json:"game_id" db:"game_id"`
	PlayerID   uuid.UUID `json:"player_id" db:"player_id"`
	RoleID     uuid.UUID `json:"role_id" db:"role_id"`
	AssignedAt time.Time `json:"assigned_at" db:"assigned_at"`
}

// NewGameRole creates a new GameRole instance
func NewGameRole(gameID string, playerID, roleID uuid.UUID) *GameRole {
	return &GameRole{
		GameID:     gameID,
		PlayerID:   playerID,
		RoleID:     roleID,
		AssignedAt: time.Now(),
	}
}
