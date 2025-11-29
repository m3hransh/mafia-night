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
