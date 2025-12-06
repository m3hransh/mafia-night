package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/mafia-night/backend/internal/database"
)

func main() {
	cfg := database.Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     5432,
		User:     getEnv("DB_USER", "mafia_user"),
		Password: getEnv("DB_PASSWORD", "mafia_pass"),
		DBName:   getEnv("DB_NAME", "mafia_night"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	client, err := database.NewEntClient(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	// Run auto-migration
	fmt.Println("Running Ent auto-migration...")
	if err := database.CreateSchema(ctx, client); err != nil {
		log.Fatalf("Failed to create schema: %v", err)
	}

	fmt.Println("✅ Migration completed successfully!")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
