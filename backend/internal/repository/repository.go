package repository

import (
	"context"

	"github.com/mafia-night/backend/internal/models"
)

// GameRepository defines the interface for game data access
type GameRepository interface {
	Create(ctx context.Context, game *models.Game) error
	GetByID(ctx context.Context, id string) (*models.Game, error)
	Update(ctx context.Context, game *models.Game) error
	Delete(ctx context.Context, id string) error
	ListByStatus(ctx context.Context, status models.GameStatus) ([]*models.Game, error)
}

// PlayerRepository defines the interface for player data access
type PlayerRepository interface {
	Create(ctx context.Context, player *models.Player) error
	GetByGameID(ctx context.Context, gameID string) ([]*models.Player, error)
	GetByID(ctx context.Context, id string) (*models.Player, error)
	Delete(ctx context.Context, id string) error
}

// RoleRepository defines the interface for role data access
type RoleRepository interface {
	Create(ctx context.Context, role *models.Role) error
	GetByName(ctx context.Context, name string) (*models.Role, error)
	GetAll(ctx context.Context) ([]*models.Role, error)
}
