package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/game"
	"github.com/mafia-night/backend/internal/models"
)

type PostgresGameRepository struct {
	client *ent.Client
}

func NewGameRepository(client *ent.Client) GameRepository {
	return &PostgresGameRepository{client: client}
}

func (r *PostgresGameRepository) Create(ctx context.Context, g *models.Game) error {
	created, err := r.client.Game.
		Create().
		SetID(g.ID.String()).
		SetStatus(game.Status(g.Status)).
		SetModeratorID(g.ModeratorID.String()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed creating game: %w", err)
	}
	// Update the input model with any server-generated fields (e.g. CreatedAt)
	g.CreatedAt = created.CreatedAt
	return nil
}

func (r *PostgresGameRepository) GetByID(ctx context.Context, id string) (*models.Game, error) {
	entGame, err := r.client.Game.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("game not found: %w", err)
		}
		return nil, fmt.Errorf("failed querying game: %w", err)
	}
	
	return mapEntGameToModel(entGame)
}

func (r *PostgresGameRepository) Update(ctx context.Context, g *models.Game) error {
	_, err := r.client.Game.
		UpdateOneID(g.ID.String()).
		SetStatus(game.Status(g.Status)).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed updating game: %w", err)
	}
	return nil
}

func (r *PostgresGameRepository) Delete(ctx context.Context, id string) error {
	err := r.client.Game.DeleteOneID(id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed deleting game: %w", err)
	}
	return nil
}

func (r *PostgresGameRepository) ListByStatus(ctx context.Context, status models.GameStatus) ([]*models.Game, error) {
	entGames, err := r.client.Game.
		Query().
		Where(game.StatusEQ(game.Status(status))).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed listing games: %w", err)
	}
	
	games := make([]*models.Game, len(entGames))
	for i, eg := range entGames {
		m, err := mapEntGameToModel(eg)
		if err != nil {
			return nil, err
		}
		games[i] = m
	}
	return games, nil
}

func mapEntGameToModel(eg *ent.Game) (*models.Game, error) {
	modID, err := parseUUID(eg.ModeratorID)
	if err != nil {
		return nil, err
	}
	
	return &models.Game{
		ID:          models.GameID(eg.ID),
		Status:      models.GameStatus(eg.Status),
		ModeratorID: modID,
		CreatedAt:   eg.CreatedAt,
		UpdatedAt:   time.Now(), // Ent doesn't have updated_at in our schema yet
	}, nil
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
