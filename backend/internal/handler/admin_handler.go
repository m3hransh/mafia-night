package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/internal/auth"
	"github.com/mafia-night/backend/internal/service"
)

// AdminHandler handles admin-related HTTP requests
type AdminHandler struct {
	adminService *service.AdminService
	jwtService   *auth.JWTService
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(adminService *service.AdminService, jwtService *auth.JWTService) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
		jwtService:   jwtService,
	}
}

// Login handles POST /api/admin/login
func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	admin, err := h.adminService.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			ErrorResponse(w, http.StatusUnauthorized, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Generate JWT token
	token, err := h.jwtService.GenerateToken(admin.ID, admin.Username)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	JSONResponse(w, http.StatusOK, map[string]any{
		"token": token,
		"admin": adminToJSON(admin),
	})
}

// CreateAdmin handles POST /api/admin/users
func (h *AdminHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	admin, err := h.adminService.CreateAdmin(r.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrUsernameExists) || errors.Is(err, service.ErrEmailExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmptyUsername) || errors.Is(err, service.ErrEmptyPassword) || errors.Is(err, service.ErrEmptyEmail) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusCreated, adminToJSON(admin))
}

// ListAdmins handles GET /api/admin/users
func (h *AdminHandler) ListAdmins(w http.ResponseWriter, r *http.Request) {
	admins, err := h.adminService.ListAdmins(r.Context())
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	adminsJSON := make([]map[string]any, len(admins))
	for i, admin := range admins {
		adminsJSON[i] = adminToJSON(admin)
	}

	JSONResponse(w, http.StatusOK, adminsJSON)
}

// GetAdmin handles GET /api/admin/users/{id}
func (h *AdminHandler) GetAdmin(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid admin ID")
		return
	}

	admin, err := h.adminService.GetAdminByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrAdminNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, adminToJSON(admin))
}

// UpdateAdmin handles PATCH /api/admin/users/{id}
func (h *AdminHandler) UpdateAdmin(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid admin ID")
		return
	}

	var req struct {
		Username *string `json:"username"`
		Email    *string `json:"email"`
		IsActive *bool   `json:"is_active"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	admin, err := h.adminService.UpdateAdmin(r.Context(), id, req.Username, req.Email, req.IsActive)
	if err != nil {
		if errors.Is(err, service.ErrAdminNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, service.ErrUsernameExists) {
			ErrorResponse(w, http.StatusConflict, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, adminToJSON(admin))
}

// ChangePassword handles POST /api/admin/users/{id}/change-password
func (h *AdminHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid admin ID")
		return
	}

	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err = h.adminService.ChangePassword(r.Context(), id, req.OldPassword, req.NewPassword)
	if err != nil {
		if errors.Is(err, service.ErrAdminNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, service.ErrInvalidCredentials) {
			ErrorResponse(w, http.StatusUnauthorized, "incorrect old password")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, map[string]any{
		"message": "password changed successfully",
	})
}

// DeleteAdmin handles DELETE /api/admin/users/{id}
func (h *AdminHandler) DeleteAdmin(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid admin ID")
		return
	}

	err = h.adminService.DeleteAdmin(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrAdminNotFound) {
			ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// adminToJSON converts an ent.Admin to a JSON-serializable map
func adminToJSON(a *ent.Admin) map[string]any {
	result := map[string]any{
		"id":         a.ID,
		"username":   a.Username,
		"email":      a.Email,
		"is_active":  a.IsActive,
		"created_at": a.CreatedAt,
		"updated_at": a.UpdatedAt,
	}

	if a.LastLogin != nil {
		result["last_login"] = *a.LastLogin
	} else {
		result["last_login"] = nil
	}

	return result
}
