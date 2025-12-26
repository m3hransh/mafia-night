package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/internal/service"
)

// RoleTemplateHandler handles role template-related HTTP requests
type RoleTemplateHandler struct {
	roleTemplateService *service.RoleTemplateService
}

// NewRoleTemplateHandler creates a new role template handler
func NewRoleTemplateHandler(roleTemplateService *service.RoleTemplateService) *RoleTemplateHandler {
	return &RoleTemplateHandler{roleTemplateService: roleTemplateService}
}

// GetRoleTemplates handles GET /api/role-templates
func (h *RoleTemplateHandler) GetRoleTemplates(w http.ResponseWriter, r *http.Request) {
	// Optional player count filter
	var playerCount *int
	if playerCountStr := r.URL.Query().Get("player_count"); playerCountStr != "" {
		count, err := strconv.Atoi(playerCountStr)
		if err != nil || count <= 0 {
			ErrorResponse(w, http.StatusBadRequest, "invalid player_count parameter")
			return
		}
		playerCount = &count
	}

	templates, err := h.roleTemplateService.GetAllRoleTemplates(r.Context(), playerCount)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to fetch role templates")
		return
	}

	templatesJSON := make([]map[string]any, len(templates))
	for i, template := range templates {
		templatesJSON[i] = roleTemplateToJSON(template)
	}

	JSONResponse(w, http.StatusOK, templatesJSON)
}

// GetRoleTemplateByID handles GET /api/role-templates/{id}
func (h *RoleTemplateHandler) GetRoleTemplateByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid template ID")
		return
	}

	template, err := h.roleTemplateService.GetRoleTemplateByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrTemplateNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to fetch role template")
		return
	}

	JSONResponse(w, http.StatusOK, roleTemplateToJSON(template))
}

// CreateRoleTemplate handles POST /api/admin/role-templates
func (h *RoleTemplateHandler) CreateRoleTemplate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		PlayerCount int    `json:"player_count"`
		Description string `json:"description"`
		Roles       []struct {
			RoleID string `json:"role_id"`
			Count  int    `json:"count"`
		} `json:"roles"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Parse role assignments
	roles := make([]service.RoleAssignment, len(req.Roles))
	for i, r := range req.Roles {
		roleID, err := uuid.Parse(r.RoleID)
		if err != nil {
			ErrorResponse(w, http.StatusBadRequest, "invalid role ID")
			return
		}
		roles[i] = service.RoleAssignment{
			RoleID: roleID,
			Count:  r.Count,
		}
	}

	template, err := h.roleTemplateService.CreateRoleTemplate(
		r.Context(),
		req.Name,
		req.PlayerCount,
		req.Description,
		roles,
	)

	if err != nil {
		if errors.Is(err, service.ErrEmptyTemplateName) ||
			errors.Is(err, service.ErrInvalidPlayerCount) ||
			errors.Is(err, service.ErrEmptyRoles) ||
			errors.Is(err, service.ErrInvalidTemplateRoleCount) ||
			errors.Is(err, service.ErrPlayerCountMismatch) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrTemplateNameExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusCreated, roleTemplateToJSON(template))
}

// UpdateRoleTemplate handles PATCH /api/admin/role-templates/{id}
func (h *RoleTemplateHandler) UpdateRoleTemplate(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid template ID")
		return
	}

	var req struct {
		Name        *string `json:"name"`
		PlayerCount *int    `json:"player_count"`
		Description *string `json:"description"`
		Roles       *[]struct {
			RoleID string `json:"role_id"`
			Count  int    `json:"count"`
		} `json:"roles"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Parse role assignments if provided
	var roles []service.RoleAssignment
	if req.Roles != nil {
		roles = make([]service.RoleAssignment, len(*req.Roles))
		for i, r := range *req.Roles {
			roleID, err := uuid.Parse(r.RoleID)
			if err != nil {
				ErrorResponse(w, http.StatusBadRequest, "invalid role ID")
				return
			}
			roles[i] = service.RoleAssignment{
				RoleID: roleID,
				Count:  r.Count,
			}
		}
	}

	template, err := h.roleTemplateService.UpdateRoleTemplate(
		r.Context(),
		id,
		req.Name,
		req.PlayerCount,
		req.Description,
		roles,
	)

	if err != nil {
		if errors.Is(err, service.ErrTemplateNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyTemplateName) ||
			errors.Is(err, service.ErrInvalidPlayerCount) ||
			errors.Is(err, service.ErrEmptyRoles) ||
			errors.Is(err, service.ErrInvalidTemplateRoleCount) ||
			errors.Is(err, service.ErrPlayerCountMismatch) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrTemplateNameExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, roleTemplateToJSON(template))
}

// DeleteRoleTemplate handles DELETE /api/admin/role-templates/{id}
func (h *RoleTemplateHandler) DeleteRoleTemplate(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid template ID")
		return
	}

	err = h.roleTemplateService.DeleteRoleTemplate(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrTemplateNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// roleTemplateToJSON converts an ent.RoleTemplate to a JSON-serializable map
func roleTemplateToJSON(t *ent.RoleTemplate) map[string]any {
	result := map[string]any{
		"id":           t.ID,
		"name":         t.Name,
		"player_count": t.PlayerCount,
		"description":  t.Description,
		"created_at":   t.CreatedAt,
		"updated_at":   t.UpdatedAt,
	}

	// Include roles if loaded
	if t.Edges.TemplateRoles != nil {
		roles := make([]map[string]any, len(t.Edges.TemplateRoles))
		for i, tr := range t.Edges.TemplateRoles {
			roleData := map[string]any{
				"count": tr.Count,
			}

			// Include full role details if loaded
			if tr.Edges.Role != nil {
				roleData["role"] = map[string]any{
					"id":          tr.Edges.Role.ID,
					"name":        tr.Edges.Role.Name,
					"slug":        tr.Edges.Role.Slug,
					"video":       tr.Edges.Role.Video,
					"description": tr.Edges.Role.Description,
					"team":        tr.Edges.Role.Team,
					"abilities":   tr.Edges.Role.Abilities,
				}
			} else {
				roleData["role_id"] = tr.RoleID
			}

			roles[i] = roleData
		}
		result["roles"] = roles
	}

	return result
}
