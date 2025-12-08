package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/game"
	"github.com/mafia-night/backend/internal/service"
)

// GameHandler handles game-related HTTP requests
type GameHandler struct {
	gameService *service.GameService
}

// NewGameHandler creates a new game handler
func NewGameHandler(gameService *service.GameService) *GameHandler {
	return &GameHandler{gameService: gameService}
}

// CreateGame handles POST /api/games
func (h *GameHandler) CreateGame(w http.ResponseWriter, r *http.Request) {
	moderatorID := r.Header.Get("X-Moderator-ID")
	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}

	game, err := h.gameService.CreateGame(r.Context(), moderatorID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusCreated, gameToJSON(game))
}

// GetGame handles GET /api/games/{id}
func (h *GameHandler) GetGame(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")

	game, err := h.gameService.GetGameByID(r.Context(), gameID)
	if err != nil {
		if errors.Is(err, service.ErrEmptyGameID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game not found")
		return
	}

	JSONResponse(w, http.StatusOK, gameToJSON(game))
}

// UpdateGameStatus handles PATCH /api/games/{id}
func (h *GameHandler) UpdateGameStatus(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	moderatorID := r.Header.Get("X-Moderator-ID")

	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}

	var req struct {
		Status game.Status `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.gameService.UpdateGameStatus(r.Context(), gameID, req.Status, moderatorID)
	if err != nil {
		if errors.Is(err, service.ErrNotAuthorized) {
			ErrorResponse(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyModeratorID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game not found")
		return
	}

	JSONResponse(w, http.StatusOK, gameToJSON(updated))
}

// DeleteGame handles DELETE /api/games/{id}
func (h *GameHandler) DeleteGame(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	moderatorID := r.Header.Get("X-Moderator-ID")

	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}

	err := h.gameService.DeleteGame(r.Context(), gameID, moderatorID)
	if err != nil {
		if errors.Is(err, service.ErrNotAuthorized) {
			ErrorResponse(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyModeratorID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *GameHandler) JoinGame(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	player, err := h.gameService.JoinGame(r.Context(), gameID, req.Name)
	if err != nil {
		if errors.Is(err, service.ErrNotAuthorized) {
			ErrorResponse(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyUserID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game not found")
		return
	}

	JSONResponse(w, http.StatusOK, playerToJSON(player))
}

// GetPlayers handles GET /api/games/{id}/players
func (h *GameHandler) GetPlayers(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")

	players, err := h.gameService.GetPlayers(r.Context(), gameID)
	if err != nil {
		if errors.Is(err, service.ErrEmptyGameID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game not found")
		return
	}

	playersJSON := make([]map[string]any, len(players))
	for i, player := range players {
		playersJSON[i] = playerToJSON(player)
	}

	JSONResponse(w, http.StatusOK, playersJSON)
}

// RemovePlayer handles DELETE /api/games/{id}/players/{player_id}
func (h *GameHandler) RemovePlayer(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	playerID := chi.URLParam(r, "player_id")

	err := h.gameService.RemovePlayer(r.Context(), gameID, playerID)
	if err != nil {
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyPlayerID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game or player not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// gameToJSON converts an ent.Game to a JSON-serializable map
func gameToJSON(g *ent.Game) map[string]any {
	return map[string]any{
		"id":           g.ID,
		"moderator_id": g.ModeratorID,
		"status":       g.Status,
		"created_at":   g.CreatedAt,
	}
}

func playerToJSON(p *ent.Player) map[string]any {
	return map[string]any{
		"id":     p.ID,
		"name":   p.Name,
		"game_id": p.GameID,
		"created_at": p.CreatedAt,
	}
}

