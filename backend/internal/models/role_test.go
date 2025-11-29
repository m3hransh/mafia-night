package models

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewRole(t *testing.T) {
	name := "Mafia"
	team := TeamMafia
	
	role := NewRole(name, team)
	
	// Test: Role should have a valid UUID
	if role.ID == uuid.Nil {
		t.Error("Expected role to have a valid ID")
	}
	
	// Test: Role should have correct name
	if role.Name != name {
		t.Errorf("Expected name to be %s, got %s", name, role.Name)
	}
	
	// Test: Role should have correct team
	if role.Team != team {
		t.Errorf("Expected team to be %s, got %s", team, role.Team)
	}
	
	// Test: CreatedAt should be set
	if role.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
}

func TestRoleIsValid(t *testing.T) {
	tests := []struct {
		name string
		role *Role
		want bool
	}{
		{
			name: "valid mafia role",
			role: NewRole("Mafia", TeamMafia),
			want: true,
		},
		{
			name: "valid citizen role",
			role: NewRole("Doctor", TeamCitizen),
			want: true,
		},
		{
			name: "invalid role - nil ID",
			role: &Role{
				ID:   uuid.Nil,
				Name: "Mafia",
				Team: TeamMafia,
			},
			want: false,
		},
		{
			name: "invalid role - empty name",
			role: &Role{
				ID:   uuid.New(),
				Name: "",
				Team: TeamMafia,
			},
			want: false,
		},
		{
			name: "invalid role - invalid team",
			role: &Role{
				ID:   uuid.New(),
				Name: "Unknown",
				Team: Team("invalid"),
			},
			want: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.role.IsValid(); got != tt.want {
				t.Errorf("IsValid() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGameRoleCreation(t *testing.T) {
	gameID := "ABC1234"
	playerID := uuid.New()
	roleID := uuid.New()
	
	gameRole := NewGameRole(gameID, playerID, roleID)
	
	// Test: GameRole should have correct game ID
	if gameRole.GameID != gameID {
		t.Errorf("Expected game_id to be %s, got %s", gameID, gameRole.GameID)
	}
	
	// Test: GameRole should have correct player ID
	if gameRole.PlayerID != playerID {
		t.Errorf("Expected player_id to be %s, got %s", playerID, gameRole.PlayerID)
	}
	
	// Test: GameRole should have correct role ID
	if gameRole.RoleID != roleID {
		t.Errorf("Expected role_id to be %s, got %s", roleID, gameRole.RoleID)
	}
	
	// Test: AssignedAt should be set
	if gameRole.AssignedAt.IsZero() {
		t.Error("Expected AssignedAt to be set")
	}
}
