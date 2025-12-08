package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"

	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/internal/handler"
	"github.com/mafia-night/backend/internal/service"
)

func main() {
	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://mafia_user:mafia_pass@localhost:5432/mafia_night?sslmode=disable"
	}

	client, err := ent.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}
	defer client.Close()

	// Run migrations
	ctx := context.Background()
	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	// Initialize services
	gameService := service.NewGameService(client)

	// Initialize handlers
	gameHandler := handler.NewGameHandler(gameService)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Health check
	r.Get("/health", healthHandler)

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Route("/games", func(r chi.Router) {
			r.Post("/", gameHandler.CreateGame)
			r.Get("/{id}", gameHandler.GetGame)
			r.Patch("/{id}", gameHandler.UpdateGameStatus)
			r.Delete("/{id}", gameHandler.DeleteGame)
			r.Post("/{id}/join", gameHandler.JoinGame)
		})
	})

	// Start server
	port := "8080"
	fmt.Printf("Starting Mafia Night API server on port %s\n", port)
	fmt.Printf("Health check: http://localhost:%s/health\n", port)
	fmt.Printf("API endpoint: http://localhost:%s/api/games\n", port)
	
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}
