package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mafia-night/backend/ent"
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

// roleToJSON converts an ent.Role to a JSON-serializable map
func roleToJSON(r *ent.Role) map[string]any {
	return map[string]any{
		"id":          r.ID,
		"name":        r.Name,
		"slug":        r.Slug,
		"video":       r.Video,
		"description": r.Description,
		"team":        r.Team,
	}
}
