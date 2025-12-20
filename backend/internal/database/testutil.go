package database

import (
	"context"
	"os"
	"testing"

	"github.com/mafia-night/backend/ent"
	_ "github.com/lib/pq"
)

// SetupTestDB creates a test database client and cleans up after the test
// Uses sequential cleanup to avoid race conditions
func SetupTestDB(t *testing.T) *ent.Client {
	// Use test database URL or default to localhost
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://mafia_user:mafia_pass@localhost:5432/mafia_night_test?sslmode=disable"
	}

	client, err := ent.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("failed opening connection to postgres: %v", err)
	}

	ctx := context.Background()
	
	// Clean up any existing data first
	CleanupTestDB(t, client)
	
	// Run migrations (create tables if they don't exist)
	if err := client.Schema.Create(ctx); err != nil {
		t.Fatalf("failed creating schema: %v", err)
	}

	// Cleanup function
	t.Cleanup(func() {
		CleanupTestDB(t, client)
		client.Close()
	})

	return client
}

// CleanupTestDB truncates all tables
func CleanupTestDB(t *testing.T, client *ent.Client) {
	ctx := context.Background()

	// Delete all data in reverse order of dependencies
	_, _ = client.GameRole.Delete().Exec(ctx)
	_, _ = client.Player.Delete().Exec(ctx)
	_, _ = client.Game.Delete().Exec(ctx)
	_, _ = client.Role.Delete().Exec(ctx)
	_, _ = client.Admin.Delete().Exec(ctx)
}
