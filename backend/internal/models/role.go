package models

import (
	"time"

	"github.com/google/uuid"
)

// Team represents which side a role is on
type Team string

const (
	TeamMafia   Team = "mafia"
	TeamCitizen Team = "citizen"
)

// Role represents a role in the Mafia game (e.g., Mafia, Doctor, Detective)
type Role struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Team        Team      `json:"team" db:"team"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// NewRole creates a new Role instance
func NewRole(name string, team Team) *Role {
	return &Role{
		ID:        uuid.New(),
		Name:      name,
		Team:      team,
		CreatedAt: time.Now(),
	}
}

// IsValid validates the role instance
func (r *Role) IsValid() bool {
	if r.ID == uuid.Nil {
		return false
	}
	if r.Name == "" {
		return false
	}
	if r.Team != TeamMafia && r.Team != TeamCitizen {
		return false
	}
	return true
}

// GameRole represents the assignment of a role to a player in a specific game
type GameRole struct {
	ID         uuid.UUID `json:"id" db:"id"`
	GameID     uuid.UUID `json:"game_id" db:"game_id"`
	PlayerID   uuid.UUID `json:"player_id" db:"player_id"`
	RoleID     uuid.UUID `json:"role_id" db:"role_id"`
	AssignedAt time.Time `json:"assigned_at" db:"assigned_at"`
}

// NewGameRole creates a new GameRole instance
func NewGameRole(gameID, playerID, roleID uuid.UUID) *GameRole {
	return &GameRole{
		ID:         uuid.New(),
		GameID:     gameID,
		PlayerID:   playerID,
		RoleID:     roleID,
		AssignedAt: time.Now(),
	}
}
