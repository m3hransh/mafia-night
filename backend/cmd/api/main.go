package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
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
	roleService := service.NewRoleService(client)
	adminService := service.NewAdminService(client)

	// Initialize handlers
	gameHandler := handler.NewGameHandler(gameService)
	roleHandler := handler.NewRoleHandler(roleService)
	adminHandler := handler.NewAdminHandler(adminService)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS middleware
	allowedOrigins := getAllowedOrigins()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Moderator-ID", "X-Admin-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	fmt.Printf("CORS enabled for origins: %v\n", allowedOrigins)

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
			r.Get("/{id}/players", gameHandler.GetPlayers)
			r.Delete("/{id}/players/{player_id}", gameHandler.RemovePlayer)
			r.Post("/{id}/distribute-roles", gameHandler.DistributeRoles)
			r.Get("/{id}/roles", gameHandler.GetGameRoles)
			r.Get("/{id}/players/{player_id}/role", gameHandler.GetPlayerRole)
		})

		r.Route("/roles", func(r chi.Router) {
			r.Get("/", roleHandler.GetRoles)
			r.Get("/{slug}", roleHandler.GetRoleBySlug)
		})

		// Admin routes
		r.Route("/admin", func(r chi.Router) {
			// Public admin routes
			r.Post("/login", adminHandler.Login)

			// Protected admin routes (require authentication)
			r.Group(func(r chi.Router) {
				r.Use(adminAuthMiddleware(client))

				// Admin user management
				r.Route("/users", func(r chi.Router) {
					r.Post("/", adminHandler.CreateAdmin)
					r.Get("/", adminHandler.ListAdmins)
					r.Get("/{id}", adminHandler.GetAdmin)
					r.Patch("/{id}", adminHandler.UpdateAdmin)
					r.Delete("/{id}", adminHandler.DeleteAdmin)
					r.Post("/{id}/change-password", adminHandler.ChangePassword)
				})

				// Role management
				r.Route("/roles", func(r chi.Router) {
					r.Post("/", roleHandler.CreateRole)
					r.Patch("/{id}", roleHandler.UpdateRole)
					r.Delete("/{id}", roleHandler.DeleteRole)
				})
			})
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

// adminAuthMiddleware verifies admin authentication token
func adminAuthMiddleware(client *ent.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get("X-Admin-Token")
			if token == "" {
				http.Error(w, `{"error":"missing authentication token"}`, http.StatusUnauthorized)
				return
			}

			// Parse token as UUID (admin ID)
			adminID, err := uuid.Parse(token)
			if err != nil {
				http.Error(w, `{"error":"invalid authentication token"}`, http.StatusUnauthorized)
				return
			}

			// Verify admin exists and is active
			admin, err := client.Admin.Get(r.Context(), adminID)
			if err != nil || !admin.IsActive {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			// Add admin ID to context for handlers to use
			ctx := context.WithValue(r.Context(), "admin_id", adminID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// getAllowedOrigins returns the list of allowed CORS origins
// Reads from ALLOWED_ORIGINS environment variable (comma-separated)
// Falls back to localhost origins for development
func getAllowedOrigins() []string {
	originsEnv := os.Getenv("ALLOWED_ORIGINS")

	if originsEnv != "" {
		// Production: use environment variable
		origins := strings.Split(originsEnv, ",")
		// Trim whitespace from each origin
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
		return origins
	}

	// Development: default to localhost
	return []string{
		"http://localhost:3000",
		"https://localhost:3000",
		"http://localhost:3001",
		"https://localhost:3001",
	}
}
