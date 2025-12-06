package models

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewPlayer(t *testing.T) {
	name := "Alice"
	telegramID := "telegram123"
	gameID := GameID("ABC1234")

	player, err := NewPlayer(name, telegramID, gameID)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

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

func TestNewPlayer_Validation(t *testing.T) {
	tests := []struct {
		name       string
		telegramID string
		gameID     GameID
		wantErr    bool
	}{
		{
			name:       "valid player",
			telegramID: "tg123",
			gameID:     GameID("ABC1234"),
			wantErr:    false,
		},
		{
			name:       "",
			telegramID: "tg123",
			gameID:     GameID("ABC1234"),
			wantErr:    true,
		},
		{
			name:       "invalid player - empty telegram ID",
			telegramID: "",
			gameID:     GameID("ABC1234"),
			wantErr:    true,
		},
		{
			name:       "invalid player 2 - empty game ID",
			telegramID: "tg123",
			gameID:     "",
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewPlayer(tt.name, tt.telegramID, tt.gameID)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewPlayer() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
