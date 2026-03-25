package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/game"
	"github.com/mafia-night/backend/ent/role"
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

		var response map[string]any
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

		var response map[string]any
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

		var response map[string]any
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

	t.Run("fails with duplicate name in same game", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		body := map[string]string{"name": "player1"}
		bodyBytes, _ := json.Marshal(body)

		r := chi.NewRouter()
		r.Post("/api/games/{id}/join", handler.JoinGame)

		// First join succeeds
		req = httptest.NewRequest("POST", "/api/games/"+created.ID+"/join", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusOK, rr.Code)

		// Second join with same name fails
		bodyBytes, _ = json.Marshal(body)
		req = httptest.NewRequest("POST", "/api/games/"+created.ID+"/join", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		rr = httptest.NewRecorder()
		r.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusConflict, rr.Code)
	})

	t.Run("fails when game has already started", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		// Update game to active
		_, err = gameService.UpdateGameStatus(req.Context(), created.ID, game.StatusActive, "mod-123")
		require.NoError(t, err)

		body := map[string]string{"name": "player1"}
		bodyBytes, _ := json.Marshal(body)

		r := chi.NewRouter()
		r.Post("/api/games/{id}/join", handler.JoinGame)

		req = httptest.NewRequest("POST", "/api/games/"+created.ID+"/join", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestGetPlayersHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("returns all players in a game", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		// Add players
		_, err = gameService.JoinGame(req.Context(), created.ID, "player1")
		require.NoError(t, err)
		_, err = gameService.JoinGame(req.Context(), created.ID, "player2")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Get("/api/games/{id}/players", handler.GetPlayers)

		req = httptest.NewRequest("GET", "/api/games/"+created.ID+"/players", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response []map[string]any
		err = json.NewDecoder(rr.Body).Decode(&response)
		require.NoError(t, err)
		assert.Len(t, response, 2)
	})

	t.Run("returns empty list for game with no players", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Get("/api/games/{id}/players", handler.GetPlayers)

		req = httptest.NewRequest("GET", "/api/games/"+created.ID+"/players", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response []map[string]any
		err = json.NewDecoder(rr.Body).Decode(&response)
		require.NoError(t, err)
		assert.Empty(t, response)
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		r := chi.NewRouter()
		r.Get("/api/games/{id}/players", handler.GetPlayers)

		req := httptest.NewRequest("GET", "/api/games/NOEXIST/players", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}

func TestRemovePlayerHandler(t *testing.T) {
	client := database.SetupTestDB(t)
	gameService := service.NewGameService(client)
	handler := NewGameHandler(gameService)

	t.Run("removes player successfully", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		player, err := gameService.JoinGame(req.Context(), created.ID, "player1")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Delete("/api/games/{id}/players/{player_id}", handler.RemovePlayer)

		req = httptest.NewRequest("DELETE", "/api/games/"+created.ID+"/players/"+player.ID.String(), nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNoContent, rr.Code)

		// Verify player is removed
		players, err := gameService.GetPlayers(req.Context(), created.ID)
		require.NoError(t, err)
		assert.Empty(t, players)
	})

	t.Run("fails for non-existent game", func(t *testing.T) {
		r := chi.NewRouter()
		r.Delete("/api/games/{id}/players/{player_id}", handler.RemovePlayer)

		req := httptest.NewRequest("DELETE", "/api/games/NOEXIST/players/00000000-0000-0000-0000-000000000000", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})

	t.Run("fails for non-existent player", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/", nil)
		created, err := gameService.CreateGame(req.Context(), "mod-123")
		require.NoError(t, err)

		r := chi.NewRouter()
		r.Delete("/api/games/{id}/players/{player_id}", handler.RemovePlayer)

		req = httptest.NewRequest("DELETE", "/api/games/"+created.ID+"/players/00000000-0000-0000-0000-000000000000", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}


// createRole inserts a role directly into the test DB and returns its UUID string.
func createRole(t *testing.T, client *ent.Client, name string) string {
t.Helper()
r, err := client.Role.Create().
SetName(name).
SetSlug(name).
SetVideo("https://example.com/video").
SetTeam(role.TeamVillage).
Save(context.Background())
require.NoError(t, err)
return r.ID.String()
}

// setupGameWithPlayers creates a game and joins n players, returning the game ID.
func setupGameWithPlayers(t *testing.T, svc *service.GameService, n int, modID string) string {
t.Helper()
g, err := svc.CreateGame(context.Background(), modID)
require.NoError(t, err)
for i := 0; i < n; i++ {
_, err = svc.JoinGame(context.Background(), g.ID, fmt.Sprintf("player%d", i+1))
require.NoError(t, err)
}
return g.ID
}

func TestSelectRolesHandler(t *testing.T) {
client := database.SetupTestDB(t)
gameService := service.NewGameService(client)
h := NewGameHandler(gameService)

r := chi.NewRouter()
r.Post("/api/games/{id}/select-roles", h.SelectRoles)

t.Run("selects roles successfully", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 2, "mod-123")
role1 := createRole(t, client, fmt.Sprintf("sr-role1-%s", gameID))
role2 := createRole(t, client, fmt.Sprintf("sr-role2-%s", gameID))

body, _ := json.Marshal(map[string]any{
"roles": []map[string]any{
{"role_id": role1, "count": 1},
{"role_id": role2, "count": 1},
},
})
req := httptest.NewRequest("POST", "/api/games/"+gameID+"/select-roles", bytes.NewReader(body))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-Moderator-ID", "mod-123")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusOK, rr.Code)
var resp map[string]any
require.NoError(t, json.NewDecoder(rr.Body).Decode(&resp))
assert.Contains(t, resp["message"], "selected")
})

t.Run("can re-select roles before distribution", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-456")
roleID := createRole(t, client, fmt.Sprintf("resel-%s", gameID))

body, _ := json.Marshal(map[string]any{
"roles": []map[string]any{{"role_id": roleID, "count": 1}},
})
for i := 0; i < 2; i++ {
req := httptest.NewRequest("POST", "/api/games/"+gameID+"/select-roles", bytes.NewReader(body))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-Moderator-ID", "mod-456")
rr := httptest.NewRecorder()
r.ServeHTTP(rr, req)
assert.Equal(t, http.StatusOK, rr.Code)
body, _ = json.Marshal(map[string]any{
"roles": []map[string]any{{"role_id": roleID, "count": 1}},
})
}
})

t.Run("fails without moderator ID header", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-789")
roleID := createRole(t, client, fmt.Sprintf("nomid-%s", gameID))

body, _ := json.Marshal(map[string]any{
"roles": []map[string]any{{"role_id": roleID, "count": 1}},
})
req := httptest.NewRequest("POST", "/api/games/"+gameID+"/select-roles", bytes.NewReader(body))
req.Header.Set("Content-Type", "application/json")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusBadRequest, rr.Code)
})

t.Run("fails with wrong moderator", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-aaa")
roleID := createRole(t, client, fmt.Sprintf("wrongmod-%s", gameID))

body, _ := json.Marshal(map[string]any{
"roles": []map[string]any{{"role_id": roleID, "count": 1}},
})
req := httptest.NewRequest("POST", "/api/games/"+gameID+"/select-roles", bytes.NewReader(body))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-Moderator-ID", "wrong-mod")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusForbidden, rr.Code)
})

t.Run("fails with invalid request body", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-bbb")
req := httptest.NewRequest("POST", "/api/games/"+gameID+"/select-roles", bytes.NewReader([]byte("not-json")))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-Moderator-ID", "mod-bbb")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusBadRequest, rr.Code)
})

t.Run("returns 409 if roles already distributed", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-ccc")
roleID := createRole(t, client, fmt.Sprintf("dist-%s", gameID))

selections := []service.RoleSelection{{RoleID: roleID, Count: 1}}
require.NoError(t, gameService.SelectRoles(context.Background(), gameID, "mod-ccc", selections))
require.NoError(t, gameService.DistributeRoles(context.Background(), gameID, "mod-ccc"))

body, _ := json.Marshal(map[string]any{
"roles": []map[string]any{{"role_id": roleID, "count": 1}},
})
req := httptest.NewRequest("POST", "/api/games/"+gameID+"/select-roles", bytes.NewReader(body))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-Moderator-ID", "mod-ccc")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusConflict, rr.Code)
})
}

func TestDistributeRolesHandler(t *testing.T) {
client := database.SetupTestDB(t)
gameService := service.NewGameService(client)
h := NewGameHandler(gameService)

r := chi.NewRouter()
r.Post("/api/games/{id}/distribute-roles", h.DistributeRoles)

selectRolesForGame := func(t *testing.T, gameID, modID string, n int) {
t.Helper()
var selections []service.RoleSelection
for i := 0; i < n; i++ {
roleID := createRole(t, client, fmt.Sprintf("dr-role-%s-%d", gameID, i))
selections = append(selections, service.RoleSelection{RoleID: roleID, Count: 1})
}
require.NoError(t, gameService.SelectRoles(context.Background(), gameID, modID, selections))
}

t.Run("distributes roles successfully", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 2, "mod-123")
selectRolesForGame(t, gameID, "mod-123", 2)

req := httptest.NewRequest("POST", "/api/games/"+gameID+"/distribute-roles", nil)
req.Header.Set("X-Moderator-ID", "mod-123")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusOK, rr.Code)
var resp map[string]any
require.NoError(t, json.NewDecoder(rr.Body).Decode(&resp))
assert.Contains(t, resp["message"], "distributed")

// Game should now be active
g, err := gameService.GetGameByID(context.Background(), gameID)
require.NoError(t, err)
assert.Equal(t, game.StatusActive, g.Status)
})

t.Run("fails without moderator ID header", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-ddd")
selectRolesForGame(t, gameID, "mod-ddd", 1)

req := httptest.NewRequest("POST", "/api/games/"+gameID+"/distribute-roles", nil)
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusBadRequest, rr.Code)
})

t.Run("fails with wrong moderator", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-eee")
selectRolesForGame(t, gameID, "mod-eee", 1)

req := httptest.NewRequest("POST", "/api/games/"+gameID+"/distribute-roles", nil)
req.Header.Set("X-Moderator-ID", "wrong-mod")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusForbidden, rr.Code)
})

t.Run("returns 400 if roles not yet selected", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-fff")

req := httptest.NewRequest("POST", "/api/games/"+gameID+"/distribute-roles", nil)
req.Header.Set("X-Moderator-ID", "mod-fff")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusBadRequest, rr.Code)
})

t.Run("returns 409 if roles already distributed", func(t *testing.T) {
gameID := setupGameWithPlayers(t, gameService, 1, "mod-ggg")
selectRolesForGame(t, gameID, "mod-ggg", 1)
require.NoError(t, gameService.DistributeRoles(context.Background(), gameID, "mod-ggg"))

req := httptest.NewRequest("POST", "/api/games/"+gameID+"/distribute-roles", nil)
req.Header.Set("X-Moderator-ID", "mod-ggg")
rr := httptest.NewRecorder()

r.ServeHTTP(rr, req)

assert.Equal(t, http.StatusConflict, rr.Code)
})
}
