package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/mafia-night/backend/internal/database"
	"github.com/mafia-night/backend/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateGameHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("creates game successfully", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/games", nil)
		req.Header.Set("X-Moderator-ID", "mod-123")
		rr := httptest.NewRecorder()

		handler.CreateGame(rr, req)

		assert.Equal(t, http.StatusCreated, rr.Code)

		var response map[string]interface{}
		err := json.NewDecoder(rr.Body).Decode(&response)
		require.NoError(t, err)

		assert.NotEmpty(t, response["id"])
		assert.Equal(t, "mod-123", response["moderator_id"])
		assert.Equal(t, "pending", response["status"])
		assert.NotEmpty(t, response["created_at"])
	})

	t.Run("fails without moderator ID header", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/games", nil)
		rr := httptest.NewRecorder()

		handler.CreateGame(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)

		var response map[string]string
		json.NewDecoder(rr.Body).Decode(&response)
		assert.Contains(t, response["error"], "X-Moderator-ID")
	})
}

func TestGetGameHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("retrieves game successfully", func(t *testing.T) {
		// Create a game first
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		// Set up router with URL param
		r := chi.NewRouter()
		r.Get("/api/games/{id}", handler.GetGame)

		req = httptest.NewRequest("GET", "/api/games/"+created.ID, nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response map[string]interface{}
		err = json.NewDecoder(rr.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, created.ID, response["id"])
		assert.Equal(t, "mod-123", response["moderator_id"])
	})

	t.Run("returns 404 for non-existent game", func(t *testing.T) {
		r := chi.NewRouter()
		r.Get("/api/games/{id}", handler.GetGame)

		req := httptest.NewRequest("GET", "/api/games/NOEXIST", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}

func TestUpdateGameStatusHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("updates game status successfully", func(t *testing.T) {
		// Create a game
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		// Update request
		body := map[string]string{"status": "active"}
		bodyBytes, _ := json.Marshal(body)

		r := chi.NewRouter()
		r.Patch("/api/games/{id}", handler.UpdateGameStatus)

		req = httptest.NewRequest("PATCH", "/api/games/"+created.ID, bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Moderator-ID", "mod-123")
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response map[string]interface{}
		json.NewDecoder(rr.Body).Decode(&response)
		assert.Equal(t, "active", response["status"])
	})

	t.Run("fails with wrong moderator", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		body := map[string]string{"status": "active"}
		bodyBytes, _ := json.Marshal(body)

		r := chi.NewRouter()
		r.Patch("/api/games/{id}", handler.UpdateGameStatus)

		req = httptest.NewRequest("PATCH", "/api/games/"+created.ID, bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Moderator-ID", "wrong-mod")
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusForbidden, rr.Code)
	})

	t.Run("fails without moderator ID header", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		body := map[string]string{"status": "active"}
		bodyBytes, _ := json.Marshal(body)

		r := chi.NewRouter()
		r.Patch("/api/games/{id}", handler.UpdateGameStatus)

		req = httptest.NewRequest("PATCH", "/api/games/"+created.ID, bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestDeleteGameHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("deletes game successfully", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Delete("/api/games/{id}", handler.DeleteGame)

		req = httptest.NewRequest("DELETE", "/api/games/"+created.ID, nil)
		req.Header.Set("X-Moderator-ID", "mod-123")
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNoContent, rr.Code)
	})

	t.Run("fails with wrong moderator", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Delete("/api/games/{id}", handler.DeleteGame)

		req = httptest.NewRequest("DELETE", "/api/games/"+created.ID, nil)
		req.Header.Set("X-Moderator-ID", "wrong-mod")
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusForbidden, rr.Code)
	})

	t.Run("fails without moderator ID header", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Delete("/api/games/{id}", handler.DeleteGame)

		req = httptest.NewRequest("DELETE", "/api/games/"+created.ID, nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestJoinGameHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("joins game successfully", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		body := map[string]string{"name": "player1"}
		bodyBytes, _ := json.Marshal(body)

		r := chi.NewRouter()
		r.Post("/api/games/{id}/join", handler.JoinGame)

		req = httptest.NewRequest("POST", "/api/games/"+created.ID+"/join", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response map[string]any
		json.NewDecoder(rr.Body).Decode(&response)
		assert.Equal(t, "player1", response["name"])
	})

	t.Run("fails without player name", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Post("/api/games/{id}/join", handler.JoinGame)

		req = httptest.NewRequest("POST", "/api/games/"+created.ID+"/join", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

