package models

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewGame(t *testing.T) {
	moderatorID := uuid.New()
	
	game := NewGame(moderatorID)
	
	// Test: Game should have a valid ID
	if game.ID == "" {
		t.Error("Expected game to have a valid ID")
	}
	
	// Test: Game should start in pending status
	if game.Status != GameStatusPending {
		t.Errorf("Expected status to be %s, got %s", GameStatusPending, game.Status)
	}
	
	// Test: Game should have the correct moderator
	if game.ModeratorID != moderatorID {
		t.Errorf("Expected moderator_id to be %s, got %s", moderatorID, game.ModeratorID)
	}
	
	// Test: CreatedAt should be set
	if game.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
	
	// Test: UpdatedAt should be set
	if game.UpdatedAt.IsZero() {
		t.Error("Expected UpdatedAt to be set")
	}
}

func TestGameIsValid(t *testing.T) {
	tests := []struct {
		name    string
		game    *Game
		want    bool
	}{
		{
			name: "valid game",
			game: NewGame(uuid.New()),
			want: true,
		},
		{
			name: "invalid game - empty ID",
			game: &Game{
				ID:          "",
				Status:      GameStatusPending,
				ModeratorID: uuid.New(),
			},
			want: false,
		},
		{
			name: "invalid game - nil moderator",
			game: &Game{
				ID:          uuid.New().String()[:8],
				Status:      GameStatusPending,
				ModeratorID: uuid.Nil,
			},
			want: false,
		},
		{
			name: "invalid game - invalid status",
			game: &Game{
				ID:          uuid.New().String()[:8],
				Status:      GameStatus("invalid"),
				ModeratorID: uuid.New(),
			},
			want: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.game.IsValid(); got != tt.want {
				t.Errorf("IsValid() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGameCanJoin(t *testing.T) {
	tests := []struct {
		name   string
		status GameStatus
		want   bool
	}{
		{
			name:   "can join pending game",
			status: GameStatusPending,
			want:   true,
		},
		{
			name:   "cannot join in-progress game",
			status: GameStatusInProgress,
			want:   false,
		},
		{
			name:   "cannot join completed game",
			status: GameStatusCompleted,
			want:   false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			game := NewGame(uuid.New())
			game.Status = tt.status
			
			if got := game.CanJoin(); got != tt.want {
				t.Errorf("CanJoin() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGameStart(t *testing.T) {
	t.Run("can start pending game", func(t *testing.T) {
		game := NewGame(uuid.New())
		
		err := game.Start()
		
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		
		if game.Status != GameStatusInProgress {
			t.Errorf("Expected status to be %s, got %s", GameStatusInProgress, game.Status)
		}
	})
	
	t.Run("cannot start already started game", func(t *testing.T) {
		game := NewGame(uuid.New())
		game.Status = GameStatusInProgress
		
		err := game.Start()
		
		if err != ErrGameAlreadyStarted {
			t.Errorf("Expected ErrGameAlreadyStarted, got %v", err)
		}
	})
	
	t.Run("cannot start completed game", func(t *testing.T) {
		game := NewGame(uuid.New())
		game.Status = GameStatusCompleted
		
		err := game.Start()
		
		if err != ErrGameAlreadyStarted {
			t.Errorf("Expected ErrGameAlreadyStarted, got %v", err)
		}
	})
}

func TestGameComplete(t *testing.T) {
	t.Run("can complete in-progress game", func(t *testing.T) {
		game := NewGame(uuid.New())
		game.Status = GameStatusInProgress
		
		err := game.Complete()
		
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		
		if game.Status != GameStatusCompleted {
			t.Errorf("Expected status to be %s, got %s", GameStatusCompleted, game.Status)
		}
	})
	
	t.Run("cannot complete pending game", func(t *testing.T) {
		game := NewGame(uuid.New())
		
		err := game.Complete()
		
		if err != ErrGameNotInProgress {
			t.Errorf("Expected ErrGameNotInProgress, got %v", err)
		}
	})
	
	t.Run("cannot complete already completed game", func(t *testing.T) {
		game := NewGame(uuid.New())
		game.Status = GameStatusCompleted
		
		err := game.Complete()
		
		if err != ErrGameNotInProgress {
			t.Errorf("Expected ErrGameNotInProgress, got %v", err)
		}
	})
}
