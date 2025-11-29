package models

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewPlayer(t *testing.T) {
	name := "Alice"
	telegramID := "telegram123"
	gameID := uuid.New()
	
	player := NewPlayer(name, telegramID, gameID)
	
	// Test: Player should have a valid UUID
	if player.ID == uuid.Nil {
		t.Error("Expected player to have a valid ID")
	}
	
	// Test: Player should have correct name
	if player.Name != name {
		t.Errorf("Expected name to be %s, got %s", name, player.Name)
	}
	
	// Test: Player should have correct telegram ID
	if player.TelegramID != telegramID {
		t.Errorf("Expected telegram_id to be %s, got %s", telegramID, player.TelegramID)
	}
	
	// Test: Player should have correct game ID
	if player.GameID != gameID {
		t.Errorf("Expected game_id to be %s, got %s", gameID, player.GameID)
	}
	
	// Test: CreatedAt should be set
	if player.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
}

func TestPlayerIsValid(t *testing.T) {
	tests := []struct {
		name    string
		player  *Player
		want    bool
	}{
		{
			name:   "valid player",
			player: NewPlayer("Alice", "tg123", uuid.New()),
			want:   true,
		},
		{
			name: "invalid player - nil ID",
			player: &Player{
				ID:         uuid.Nil,
				Name:       "Alice",
				TelegramID: "tg123",
				GameID:     uuid.New(),
			},
			want: false,
		},
		{
			name: "invalid player - empty name",
			player: &Player{
				ID:         uuid.New(),
				Name:       "",
				TelegramID: "tg123",
				GameID:     uuid.New(),
			},
			want: false,
		},
		{
			name: "invalid player - empty telegram ID",
			player: &Player{
				ID:         uuid.New(),
				Name:       "Alice",
				TelegramID: "",
				GameID:     uuid.New(),
			},
			want: false,
		},
		{
			name: "invalid player - nil game ID",
			player: &Player{
				ID:         uuid.New(),
				Name:       "Alice",
				TelegramID: "tg123",
				GameID:     uuid.Nil,
			},
			want: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.player.IsValid(); got != tt.want {
				t.Errorf("IsValid() = %v, want %v", got, tt.want)
			}
		})
	}
}
