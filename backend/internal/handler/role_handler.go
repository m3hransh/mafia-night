package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/role"
	"github.com/mafia-night/backend/internal/service"
)

// RoleHandler handles role-related HTTP requests
type RoleHandler struct {
	roleService *service.RoleService
}

// NewRoleHandler creates a new role handler
func NewRoleHandler(roleService *service.RoleService) *RoleHandler {
	return &RoleHandler{roleService: roleService}
}

// GetRoles handles GET /api/roles
// @Summary      List all roles
// @Description  Retrieves all available roles in the game.
// @Tags         roles
// @Produce      json
// @Success      200  {array}   RoleResponse
// @Failure      500  {object}  ErrorResponseBody
// @Router       /roles [get]
func (h *RoleHandler) GetRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := h.roleService.GetAllRoles(r.Context())
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to fetch roles")
		return
	}

	rolesJSON := make([]map[string]any, len(roles))
	for i, role := range roles {
		rolesJSON[i] = roleToJSON(role)
	}

	JSONResponse(w, http.StatusOK, rolesJSON)
}

// GetRoleBySlug handles GET /api/roles/{slug}
// @Summary      Get a role by slug
// @Description  Retrieves a single role by its slug identifier.
// @Tags         roles
// @Produce      json
// @Param        slug  path      string  true  "Role slug"
// @Success      200   {object}  RoleResponse
// @Failure      400   {object}  ErrorResponseBody
// @Failure      404   {object}  ErrorResponseBody
// @Router       /roles/{slug} [get]
func (h *RoleHandler) GetRoleBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	role, err := h.roleService.GetRoleBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, service.ErrEmptySlug) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusNotFound, "role not found")
		return
	}

	JSONResponse(w, http.StatusOK, roleToJSON(role))
}

// CreateRole handles POST /api/admin/roles
// @Summary      Create a role
// @Description  Creates a new game role. Requires admin authentication.
// @Tags         admin-roles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      object{name=string,slug=string,video=string,description=string,team=string,abilities=[]string}  true  "Role data"
// @Success      201   {object}  RoleResponse
// @Failure      400   {object}  ErrorResponseBody
// @Failure      409   {object}  ErrorResponseBody
// @Failure      500   {object}  ErrorResponseBody
// @Router       /admin/roles [post]
func (h *RoleHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string   `json:"name"`
		Slug        string   `json:"slug"`
		Video       string   `json:"video"`
		Description string   `json:"description"`
		Team        string   `json:"team"`
		Abilities   []string `json:"abilities"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate team
	var teamEnum role.Team
	switch req.Team {
	case "mafia":
		teamEnum = role.TeamMafia
	case "village":
		teamEnum = role.TeamVillage
	case "independent":
		teamEnum = role.TeamIndependent
	default:
		ErrorResponse(w, http.StatusBadRequest, "invalid team value")
		return
	}

	createdRole, err := h.roleService.CreateRole(
		r.Context(),
		req.Name,
		req.Slug,
		req.Video,
		req.Description,
		teamEnum,
		req.Abilities,
	)

	if err != nil {
		if errors.Is(err, service.ErrRoleNameExists) || errors.Is(err, service.ErrRoleSlugExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyRoleName) || errors.Is(err, service.ErrEmptySlug) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusCreated, roleToJSON(createdRole))
}

// UpdateRole handles PATCH /api/admin/roles/{id}
// @Summary      Update a role
// @Description  Updates an existing role. Requires admin authentication.
// @Tags         admin-roles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string  true  "Role ID"
// @Param        body  body      object{name=string,slug=string,video=string,description=string,team=string,abilities=[]string}  false  "Partial role data"
// @Success      200   {object}  RoleResponse
// @Failure      400   {object}  ErrorResponseBody
// @Failure      404   {object}  ErrorResponseBody
// @Failure      409   {object}  ErrorResponseBody
// @Failure      500   {object}  ErrorResponseBody
// @Router       /admin/roles/{id} [patch]
func (h *RoleHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid role ID")
		return
	}

	var req struct {
		Name        *string  `json:"name"`
		Slug        *string  `json:"slug"`
		Video       *string  `json:"video"`
		Description *string  `json:"description"`
		Team        *string  `json:"team"`
		Abilities   []string `json:"abilities"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var teamEnum *role.Team
	if req.Team != nil {
		var t role.Team
		switch *req.Team {
		case "mafia":
			t = role.TeamMafia
		case "village":
			t = role.TeamVillage
		case "independent":
			t = role.TeamIndependent
		default:
			ErrorResponse(w, http.StatusBadRequest, "invalid team value")
			return
		}
		teamEnum = &t
	}

	updatedRole, err := h.roleService.UpdateRole(
		r.Context(),
		id,
		req.Name,
		req.Slug,
		req.Video,
		req.Description,
		teamEnum,
		req.Abilities,
	)

	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, service.ErrRoleNameExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, roleToJSON(updatedRole))
}

// DeleteRole handles DELETE /api/admin/roles/{id}
// @Summary      Delete a role
// @Description  Deletes a role. Requires admin authentication.
// @Tags         admin-roles
// @Security     BearerAuth
// @Param        id   path    string  true  "Role ID"
// @Success      204
// @Failure      400  {object}  ErrorResponseBody
// @Failure      404  {object}  ErrorResponseBody
// @Failure      500  {object}  ErrorResponseBody
// @Router       /admin/roles/{id} [delete]
func (h *RoleHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid role ID")
		return
	}

	err = h.roleService.DeleteRole(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// roleToJSON converts an ent.Role to a JSON-serializable map
func roleToJSON(r *ent.Role) map[string]any {
	return map[string]any{
		"id":          r.ID,
		"name":        r.Name,
		"slug":        r.Slug,
		"video":       r.Video,
		"description": r.Description,
		"team":        r.Team,
		"abilities":   r.Abilities,
	}
}
