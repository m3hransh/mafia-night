package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/mafia-night/backend/internal/auth"
	"github.com/mafia-night/backend/internal/database"
	"github.com/mafia-night/backend/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAdminHandler_Login(t *testing.T) {
	client := database.SetupTestDB(t)
	adminService := service.NewAdminService(client)
	jwtService := auth.NewJWTService("test-secret", "test-issuer")
	handler := NewAdminHandler(adminService, jwtService)
	ctx := context.Background()

	// Create a test admin
	username := "handlerlogin"
	password := "password123"
	_, err := adminService.CreateAdmin(ctx, username, "handlerlogin@example.com", password)
	require.NoError(t, err)

	t.Run("successful login", func(t *testing.T) {
		reqBody := map[string]string{
			"username": username,
			"password": password,
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/login", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		handler.Login(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.NotEmpty(t, response["token"])
		adminMap, ok := response["admin"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, username, adminMap["username"])
	})

	t.Run("invalid credentials", func(t *testing.T) {
		reqBody := map[string]string{
			"username": username,
			"password": "wrongpassword",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/login", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		handler.Login(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})
}

func TestAdminHandler_CreateAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	adminService := service.NewAdminService(client)
	jwtService := auth.NewJWTService("test-secret", "test-issuer")
	handler := NewAdminHandler(adminService, jwtService)

	t.Run("create admin successfully", func(t *testing.T) {
		reqBody := map[string]string{
			"username": "newadmin",
			"email":    "newadmin@example.com",
			"password": "password123",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/users", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		handler.CreateAdmin(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusCreated, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, "newadmin", response["username"])
		assert.Equal(t, "newadmin@example.com", response["email"])
		assert.Empty(t, response["password"]) // Password should not be returned
	})

	t.Run("create duplicate admin", func(t *testing.T) {
		// First create
		reqBody := map[string]string{
			"username": "duplicate",
			"email":    "duplicate@example.com",
			"password": "password123",
		}
		body, _ := json.Marshal(reqBody)
		req1 := httptest.NewRequest(http.MethodPost, "/api/admin/users", bytes.NewBuffer(body))
		w1 := httptest.NewRecorder()
		handler.CreateAdmin(w1, req1)
		require.Equal(t, http.StatusCreated, w1.Result().StatusCode)

		// Second create
		req2 := httptest.NewRequest(http.MethodPost, "/api/admin/users", bytes.NewBuffer(body))
		w2 := httptest.NewRecorder()
		handler.CreateAdmin(w2, req2)

		res := w2.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusConflict, res.StatusCode)
	})
}

func TestAdminHandler_ListAdmins(t *testing.T) {
	client := database.SetupTestDB(t)
	adminService := service.NewAdminService(client)
	jwtService := auth.NewJWTService("test-secret", "test-issuer")
	handler := NewAdminHandler(adminService, jwtService)
	ctx := context.Background()

	// Create some admins
	_, err := adminService.CreateAdmin(ctx, "admin1", "admin1@example.com", "password123")
	require.NoError(t, err)
	_, err = adminService.CreateAdmin(ctx, "admin2", "admin2@example.com", "password123")
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/users", nil)
	w := httptest.NewRecorder()

	handler.ListAdmins(w, req)

	res := w.Result()
	defer res.Body.Close()

	assert.Equal(t, http.StatusOK, res.StatusCode)

	var admins []map[string]any
	err = json.NewDecoder(res.Body).Decode(&admins)
	require.NoError(t, err)

	assert.GreaterOrEqual(t, len(admins), 2)
}

func TestAdminHandler_GetAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	adminService := service.NewAdminService(client)
	jwtService := auth.NewJWTService("test-secret", "test-issuer")
	handler := NewAdminHandler(adminService, jwtService)
	ctx := context.Background()

	admin, err := adminService.CreateAdmin(ctx, "getadmin", "getadmin@example.com", "password123")
	require.NoError(t, err)

	t.Run("get existing admin", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/admin/users/"+admin.ID.String(), nil)
		// Mock chi context for URL params
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", admin.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()
		handler.GetAdmin(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, admin.ID.String(), response["id"])
	})

	t.Run("get non-existent admin", func(t *testing.T) {
		nonExistentID := uuid.New().String()
		req := httptest.NewRequest(http.MethodGet, "/api/admin/users/"+nonExistentID, nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", nonExistentID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()
		handler.GetAdmin(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusNotFound, res.StatusCode)
	})
}

func TestAdminHandler_UpdateAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	adminService := service.NewAdminService(client)
	jwtService := auth.NewJWTService("test-secret", "test-issuer")
	handler := NewAdminHandler(adminService, jwtService)
	ctx := context.Background()

	admin, err := adminService.CreateAdmin(ctx, "updateadmin", "updateadmin@example.com", "password123")
	require.NoError(t, err)

	t.Run("update admin successfully", func(t *testing.T) {
		newUsername := "updatedadmin"
		reqBody := map[string]any{
			"username": newUsername,
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest(http.MethodPatch, "/api/admin/users/"+admin.ID.String(), bytes.NewBuffer(body))
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", admin.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()
		handler.UpdateAdmin(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, newUsername, response["username"])
	})
}

func TestAdminHandler_DeleteAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	adminService := service.NewAdminService(client)
	jwtService := auth.NewJWTService("test-secret", "test-issuer")
	handler := NewAdminHandler(adminService, jwtService)
	ctx := context.Background()

	admin, err := adminService.CreateAdmin(ctx, "deleteadmin", "deleteadmin@example.com", "password123")
	require.NoError(t, err)

	t.Run("delete admin successfully", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/admin/users/"+admin.ID.String(), nil)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", admin.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()
		handler.DeleteAdmin(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusNoContent, res.StatusCode)

		// Verify deletion
		_, err := adminService.GetAdminByID(ctx, admin.ID)
		assert.Error(t, err)
	})
}
