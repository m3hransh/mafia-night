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
// @Summary      Create a new game
// @Description  Creates a new Mafia game session. The caller becomes the moderator.
// @Tags         games
// @Accept       json
// @Produce      json
// @Param        X-Moderator-ID  header    string           true  "Moderator identifier"
// @Success      201             {object}  GameResponse
// @Failure      400             {object}  ErrorResponseBody
// @Failure      500             {object}  ErrorResponseBody
// @Router       /games [post]
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
// @Summary      Get a game by ID
// @Description  Retrieves a game by its ID.
// @Tags         games
// @Produce      json
// @Param        id   path      string  true  "Game ID"
// @Success      200  {object}  GameResponse
// @Failure      400  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id} [get]
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
// @Summary      Update game status
// @Description  Updates the status of a game. Only the moderator can update.
// @Tags         games
// @Accept       json
// @Produce      json
// @Param        id              path      string                  true  "Game ID"
// @Param        X-Moderator-ID  header    string                  true  "Moderator identifier"
// @Param        body            body      object{status=string}   true  "New status"
// @Success      200             {object}  GameResponse
// @Failure      400             {object}  ErrorResponseBody
// @Failure      403             {object}  ErrorResponseBody
// @Failure      404             {object}  ErrorResponseBody
// @Router       /games/{id} [patch]
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
// @Summary      Delete a game
// @Description  Deletes a game. Only the moderator can delete.
// @Tags         games
// @Param        id              path    string  true  "Game ID"
// @Param        X-Moderator-ID  header  string  true  "Moderator identifier"
// @Success      204
// @Failure      400  {object}  ErrorResponseBody
// @Failure      403  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id} [delete]
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

// JoinGame handles POST /api/games/{id}/join
// @Summary      Join a game
// @Description  Allows a player to join a game by name.
// @Tags         games
// @Accept       json
// @Produce      json
// @Param        id    path      string              true  "Game ID"
// @Param        body  body      object{name=string} true  "Player name"
// @Success      200   {object}  PlayerResponse
// @Failure      400   {object}  ErrorResponseBody
// @Failure      404   {object}  ErrorResponseBody
// @Failure      409   {object}  ErrorResponseBody
// @Router       /games/{id}/join [post]
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
		if errors.Is(err, service.ErrPlayerNameExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, service.ErrGameAlreadyStarted) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
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
// @Summary      Get players in a game
// @Description  Retrieves all players in a game.
// @Tags         games
// @Produce      json
// @Param        id   path      string  true  "Game ID"
// @Success      200  {array}   PlayerResponse
// @Failure      400  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id}/players [get]
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
// @Summary      Remove a player from a game
// @Description  Removes a player from the game.
// @Tags         games
// @Param        id         path    string  true  "Game ID"
// @Param        player_id  path    string  true  "Player ID"
// @Success      204
// @Failure      400  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id}/players/{player_id} [delete]
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
		"phase":        g.Phase,
		"round_number": g.RoundNumber,
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

// SelectRoles handles POST /api/games/{id}/select-roles
// @Summary      Select roles for a game
// @Description  Persists the moderator's role selection without assigning to players. Broadcasts roles_selected via WebSocket.
// @Tags         games
// @Accept       json
// @Produce      json
// @Param        id              path      string                                         true  "Game ID"
// @Param        X-Moderator-ID  header    string                                         true  "Moderator identifier"
// @Param        body            body      object{roles=[]service.RoleSelection}          true  "Role selections"
// @Success      200             {object}  map[string]string
// @Failure      400             {object}  ErrorResponseBody
// @Failure      403             {object}  ErrorResponseBody
// @Failure      409             {object}  ErrorResponseBody
// @Failure      500             {object}  ErrorResponseBody
// @Router       /games/{id}/select-roles [post]
func (h *GameHandler) SelectRoles(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	moderatorID := r.Header.Get("X-Moderator-ID")

	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}

	var req struct {
		Roles []service.RoleSelection `json:"roles"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err := h.gameService.SelectRoles(r.Context(), gameID, moderatorID, req.Roles)
	if err != nil {
		if errors.Is(err, service.ErrNotAuthorized) {
			ErrorResponse(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrRolesAlreadyAssigned) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyModeratorID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, map[string]any{
		"message": "roles selected successfully",
	})
}


// @Summary      Distribute pre-selected roles to players
// @Description  Randomly assigns the pre-selected roles to all players. Requires SelectRoles to have been called first. Only the moderator can trigger this.
// @Tags         games
// @Produce      json
// @Param        id              path      string  true  "Game ID"
// @Param        X-Moderator-ID  header    string  true  "Moderator identifier"
// @Success      200             {object}  DistributeRolesSuccessResponse
// @Failure      400             {object}  ErrorResponseBody
// @Failure      403             {object}  ErrorResponseBody
// @Failure      409             {object}  ErrorResponseBody
// @Failure      500             {object}  ErrorResponseBody
// @Router       /games/{id}/distribute-roles [post]
func (h *GameHandler) DistributeRoles(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	moderatorID := r.Header.Get("X-Moderator-ID")

	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}

	err := h.gameService.DistributeRoles(r.Context(), gameID, moderatorID)
	if err != nil {
		if errors.Is(err, service.ErrNotAuthorized) {
			ErrorResponse(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrInvalidRoleCount) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrRolesAlreadyAssigned) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, service.ErrRolesNotSelected) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyModeratorID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, map[string]any{
		"message": "roles distributed successfully",
	})
}

// GetPlayerRole handles GET /api/games/{id}/players/{player_id}/role
// @Summary      Get a player's role
// @Description  Retrieves the role assigned to a specific player.
// @Tags         games
// @Produce      json
// @Param        id         path      string  true  "Game ID"
// @Param        player_id  path      string  true  "Player ID"
// @Success      200        {object}  PlayerRoleResponse
// @Failure      400        {object}  ErrorResponseBody
// @Failure      404        {object}  ErrorResponseBody
// @Failure      500        {object}  ErrorResponseBody
// @Router       /games/{id}/players/{player_id}/role [get]
func (h *GameHandler) GetPlayerRole(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	playerID := chi.URLParam(r, "player_id")

	gameRole, err := h.gameService.GetPlayerRole(r.Context(), gameID, playerID)
	if err != nil {
		if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyPlayerID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "role not assigned or player not found")
		return
	}

	// Get the role information
	role := gameRole.Edges.Role
	if role == nil {
		ErrorResponse(w, http.StatusInternalServerError, "role information not found")
		return
	}

	JSONResponse(w, http.StatusOK, map[string]any{
		"id":          role.ID,
		"name":        role.Name,
		"slug":        role.Slug,
		"video":       role.Video,
		"description": role.Description,
		"team":        role.Team,
		"abilities":   role.Abilities,
		"assigned_at": gameRole.AssignedAt,
	})
}

// GetGameRoles handles GET /api/games/{id}/roles (moderator view)
// @Summary      Get all role assignments in a game
// @Description  Returns all player-role assignments for a game. Only the moderator can view this.
// @Tags         games
// @Produce      json
// @Param        id              path      string  true  "Game ID"
// @Param        X-Moderator-ID  header    string  true  "Moderator identifier"
// @Success      200             {array}   GameRoleResponse
// @Failure      400             {object}  ErrorResponseBody
// @Failure      403             {object}  ErrorResponseBody
// @Failure      404             {object}  ErrorResponseBody
// @Router       /games/{id}/roles [get]
func (h *GameHandler) GetGameRoles(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	moderatorID := r.Header.Get("X-Moderator-ID")

	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}

	gameRoles, err := h.gameService.GetGameRoles(r.Context(), gameID, moderatorID)
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

	// Return only fully-assigned roles (player+role pairs)
	response := make([]map[string]any, 0, len(gameRoles))
	for _, gameRole := range gameRoles {
		player := gameRole.Edges.Player
		role := gameRole.Edges.Role
		if player == nil || role == nil {
			continue
		}
		response = append(response, map[string]any{
			"player_id":   player.ID,
			"player_name": player.Name,
			"role_id":     role.ID,
			"role_name":   role.Name,
			"role_slug":   role.Slug,
			"video":       role.Video,
			"team":        role.Team,
			"assigned_at": gameRole.AssignedAt,
		})
	}

	JSONResponse(w, http.StatusOK, response)
}

// GetSelectedRoles handles GET /api/games/{id}/selected-roles
// @Summary      Get selected (unassigned) roles for a game
// @Description  Returns the roles the moderator has selected but not yet distributed to players. Public endpoint.
// @Tags         games
// @Produce      json
// @Param        id   path      string  true  "Game ID"
// @Success      200  {array}   service.SelectedRoleEntry
// @Failure      400  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id}/selected-roles [get]
func (h *GameHandler) GetSelectedRoles(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")

	entries, err := h.gameService.GetSelectedRoles(r.Context(), gameID)
	if err != nil {
		if errors.Is(err, service.ErrEmptyGameID) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "game not found")
		return
	}

	JSONResponse(w, http.StatusOK, entries)
}


// ── Phase management ──────────────────────────────────────────────────────────

// StartDay handles POST /api/games/{id}/start-day
// @Summary      Start the day phase
// @Description  Transitions the game to the day phase and opens a new round. Only the moderator can call this.
// @Tags         games
// @Produce      json
// @Param        id              path      string  true  "Game ID"
// @Param        X-Moderator-ID  header    string  true  "Moderator identifier"
// @Success      200  {object}  map[string]any
// @Failure      400  {object}  ErrorResponseBody
// @Failure      403  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id}/start-day [post]
func (h *GameHandler) StartDay(w http.ResponseWriter, r *http.Request) {
gameID := chi.URLParam(r, "id")
moderatorID := r.Header.Get("X-Moderator-ID")

result, err := h.gameService.StartDay(r.Context(), gameID, moderatorID)
if err != nil {
switch {
case errors.Is(err, service.ErrEmptyGameID), errors.Is(err, service.ErrEmptyModeratorID):
ErrorResponse(w, http.StatusBadRequest, err.Error())
case errors.Is(err, service.ErrNotAuthorized):
ErrorResponse(w, http.StatusForbidden, err.Error())
case errors.Is(err, service.ErrGameAlreadyEnded):
ErrorResponse(w, http.StatusConflict, err.Error())
default:
ErrorResponse(w, http.StatusNotFound, "game not found")
}
return
}

JSONResponse(w, http.StatusOK, map[string]any{
"phase":        result.Game.Phase,
"round_number": result.Game.RoundNumber,
"round_id":     result.Round.ID,
})
}

// StartNight handles POST /api/games/{id}/start-night
// @Summary      Start the night phase
// @Description  Transitions the game to the night phase and opens a new round. Only the moderator can call this.
// @Tags         games
// @Produce      json
// @Param        id              path      string  true  "Game ID"
// @Param        X-Moderator-ID  header    string  true  "Moderator identifier"
// @Success      200  {object}  map[string]any
// @Failure      400  {object}  ErrorResponseBody
// @Failure      403  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Router       /games/{id}/start-night [post]
func (h *GameHandler) StartNight(w http.ResponseWriter, r *http.Request) {
gameID := chi.URLParam(r, "id")
moderatorID := r.Header.Get("X-Moderator-ID")

result, err := h.gameService.StartNight(r.Context(), gameID, moderatorID)
if err != nil {
switch {
case errors.Is(err, service.ErrEmptyGameID), errors.Is(err, service.ErrEmptyModeratorID):
ErrorResponse(w, http.StatusBadRequest, err.Error())
case errors.Is(err, service.ErrNotAuthorized):
ErrorResponse(w, http.StatusForbidden, err.Error())
case errors.Is(err, service.ErrGameAlreadyEnded):
ErrorResponse(w, http.StatusConflict, err.Error())
default:
ErrorResponse(w, http.StatusNotFound, "game not found")
}
return
}

JSONResponse(w, http.StatusOK, map[string]any{
"phase":        result.Game.Phase,
"round_number": result.Game.RoundNumber,
"round_id":     result.Round.ID,
})
}

// EndGame handles POST /api/games/{id}/end-game
// @Summary      End the game
// @Description  Marks the game as ended. Only the moderator can call this.
// @Tags         games
// @Produce      json
// @Param        id              path      string  true  "Game ID"
// @Param        X-Moderator-ID  header    string  true  "Moderator identifier"
// @Success      200  {object}  GameResponse
// @Failure      400  {object}  ErrorResponseBody
// @Failure      403  {object}  ErrorResponseBody
// @Failure      409  {object}  ErrorResponseBody
// @Router       /games/{id}/end-game [post]
func (h *GameHandler) EndGame(w http.ResponseWriter, r *http.Request) {
gameID := chi.URLParam(r, "id")
moderatorID := r.Header.Get("X-Moderator-ID")

g, err := h.gameService.EndGame(r.Context(), gameID, moderatorID)
if err != nil {
switch {
case errors.Is(err, service.ErrEmptyGameID), errors.Is(err, service.ErrEmptyModeratorID):
ErrorResponse(w, http.StatusBadRequest, err.Error())
case errors.Is(err, service.ErrNotAuthorized):
ErrorResponse(w, http.StatusForbidden, err.Error())
case errors.Is(err, service.ErrGameAlreadyEnded):
ErrorResponse(w, http.StatusConflict, err.Error())
default:
ErrorResponse(w, http.StatusNotFound, "game not found")
}
return
}

JSONResponse(w, http.StatusOK, g)
}

// CastVote handles POST /api/games/{id}/votes
func (h *GameHandler) CastVote(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	var req struct {
		VoterID  string `json:"voter_id"`
		TargetID string `json:"target_id"`
		Stage    string `json:"stage"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.VoterID == "" || req.TargetID == "" || req.Stage == "" {
		ErrorResponse(w, http.StatusBadRequest, "voter_id, target_id, and stage are required")
		return
	}
	if err := h.gameService.CastVote(r.Context(), gameID, req.VoterID, req.TargetID, req.Stage); err != nil {
		switch {
		case errors.Is(err, service.ErrWrongPhase):
			ErrorResponse(w, http.StatusConflict, err.Error())
		case errors.Is(err, service.ErrCannotVoteForSelf), errors.Is(err, service.ErrInvalidVoteStage):
			ErrorResponse(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrNoActiveRound):
			ErrorResponse(w, http.StatusConflict, err.Error())
		default:
			ErrorResponse(w, http.StatusInternalServerError, "failed to cast vote")
		}
		return
	}
	JSONResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GetVoteTally handles GET /api/games/{id}/votes?stage=nomination
func (h *GameHandler) GetVoteTally(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	stage := r.URL.Query().Get("stage")
	if stage == "" {
		stage = "nomination"
	}
	tally, err := h.gameService.GetVoteTally(r.Context(), gameID, stage)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get vote tally")
		return
	}
	JSONResponse(w, http.StatusOK, tally)
}

// EliminatePlayer handles POST /api/games/{id}/eliminate
func (h *GameHandler) EliminatePlayer(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	moderatorID := r.Header.Get("X-Moderator-ID")
	if moderatorID == "" {
		ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
		return
	}
	var req struct {
		PlayerID string `json:"player_id"`
		Cause    string `json:"cause"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.PlayerID == "" {
		ErrorResponse(w, http.StatusBadRequest, "player_id is required")
		return
	}
	if req.Cause == "" {
		req.Cause = "vote"
	}
	elim, err := h.gameService.EliminatePlayer(r.Context(), gameID, moderatorID, req.PlayerID, req.Cause)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrNotAuthorized):
			ErrorResponse(w, http.StatusForbidden, err.Error())
		default:
			ErrorResponse(w, http.StatusInternalServerError, "failed to eliminate player")
		}
		return
	}
	JSONResponse(w, http.StatusOK, map[string]any{
		"player_id":     elim.PlayerID,
		"cause":         elim.Cause,
		"eliminated_at": elim.EliminatedAt,
	})
}

// ── Vote sessions ─────────────────────────────────────────────────────────────

func (h *GameHandler) OpenVoteSession(w http.ResponseWriter, r *http.Request) {
gameID := chi.URLParam(r, "id")
moderatorID := r.Header.Get("X-Moderator-ID")
if moderatorID == "" {
ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
return
}
var req struct {
AccusedPlayerID string `json:"accused_player_id"`
Message         string `json:"message"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AccusedPlayerID == "" {
ErrorResponse(w, http.StatusBadRequest, "accused_player_id is required")
return
}
result, err := h.gameService.OpenVoteSession(r.Context(), gameID, moderatorID, req.AccusedPlayerID, req.Message)
if err != nil {
switch {
case errors.Is(err, service.ErrNotAuthorized):
ErrorResponse(w, http.StatusForbidden, err.Error())
default:
ErrorResponse(w, http.StatusInternalServerError, "failed to open vote session")
}
return
}
JSONResponse(w, http.StatusCreated, result)
}

func (h *GameHandler) CastBallot(w http.ResponseWriter, r *http.Request) {
sessionID := chi.URLParam(r, "sessionId")
var req struct {
VoterID string `json:"voter_id"`
Choice  string `json:"choice"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.VoterID == "" || req.Choice == "" {
ErrorResponse(w, http.StatusBadRequest, "voter_id and choice are required")
return
}
if req.Choice != "yes" && req.Choice != "no" {
ErrorResponse(w, http.StatusBadRequest, "choice must be 'yes' or 'no'")
return
}
result, err := h.gameService.CastBallot(r.Context(), sessionID, req.VoterID, req.Choice)
if err != nil {
switch {
case errors.Is(err, service.ErrVoteSessionNotFound):
ErrorResponse(w, http.StatusNotFound, err.Error())
case errors.Is(err, service.ErrVoteSessionClosed):
ErrorResponse(w, http.StatusConflict, err.Error())
default:
ErrorResponse(w, http.StatusInternalServerError, "failed to cast ballot")
}
return
}
JSONResponse(w, http.StatusOK, result)
}

func (h *GameHandler) CloseVoteSession(w http.ResponseWriter, r *http.Request) {
sessionID := chi.URLParam(r, "sessionId")
moderatorID := r.Header.Get("X-Moderator-ID")
if moderatorID == "" {
ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
return
}
result, err := h.gameService.CloseVoteSession(r.Context(), sessionID, moderatorID)
if err != nil {
switch {
case errors.Is(err, service.ErrNotAuthorized):
ErrorResponse(w, http.StatusForbidden, err.Error())
case errors.Is(err, service.ErrVoteSessionNotFound):
ErrorResponse(w, http.StatusNotFound, err.Error())
case errors.Is(err, service.ErrVoteSessionClosed):
ErrorResponse(w, http.StatusConflict, err.Error())
default:
ErrorResponse(w, http.StatusInternalServerError, "failed to close vote session")
}
return
}
JSONResponse(w, http.StatusOK, result)
}

func (h *GameHandler) GetCurrentVoteSession(w http.ResponseWriter, r *http.Request) {
gameID := chi.URLParam(r, "id")
result, err := h.gameService.GetCurrentVoteSession(r.Context(), gameID)
if err != nil {
JSONResponse(w, http.StatusOK, nil)
return
}
JSONResponse(w, http.StatusOK, result)
}
