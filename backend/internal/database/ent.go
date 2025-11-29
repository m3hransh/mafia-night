package database

import (
	"context"
	"fmt"

	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql"
	"github.com/mafia-night/backend/ent"
	_ "github.com/lib/pq"
)

// NewEntClient creates a new Ent client connected to PostgreSQL
func NewEntClient(cfg Config) (*ent.Client, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	// Open the database connection
	drv, err := sql.Open(dialect.Postgres, dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := drv.DB().Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Create Ent client
	client := ent.NewClient(ent.Driver(drv))

	return client, nil
}

// CreateSchema creates all tables using Ent's auto-migration
func CreateSchema(ctx context.Context, client *ent.Client) error {
	if err := client.Schema.Create(ctx); err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}
	return nil
}
