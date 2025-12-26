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
	"github.com/mafia-night/backend/ent/role"
	"github.com/mafia-night/backend/internal/database"
	"github.com/mafia-night/backend/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRoleTemplateHandler_CreateRoleTemplate(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := service.NewRoleService(client)
	templateService := service.NewRoleTemplateService(client)
	handler := NewRoleTemplateHandler(templateService)
	ctx := context.Background()

	// Create test roles
	mafia, _ := roleService.CreateRole(ctx, "Mafia", "mafia", "video", "desc", role.TeamMafia, nil)
	villager, _ := roleService.CreateRole(ctx, "Villager", "villager", "video", "desc", role.TeamVillage, nil)

	t.Run("creates template successfully", func(t *testing.T) {
		reqBody := map[string]any{
			"name":         "Test Template",
			"player_count": 6,
			"description":  "A test template",
			"roles": []map[string]any{
				{"role_id": mafia.ID.String(), "count": 2},
				{"role_id": villager.ID.String(), "count": 4},
			},
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/role-templates", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		handler.CreateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusCreated, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, "Test Template", response["name"])
		assert.Equal(t, float64(6), response["player_count"])
		assert.Equal(t, "A test template", response["description"])
		assert.NotNil(t, response["roles"])
	})

	t.Run("fails with invalid request body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/admin/role-templates", bytes.NewBufferString("invalid json"))
		w := httptest.NewRecorder()

		handler.CreateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
	})

	t.Run("fails with player count mismatch", func(t *testing.T) {
		reqBody := map[string]any{
			"name":         "Mismatch Template",
			"player_count": 10,
			"description":  "This should fail",
			"roles": []map[string]any{
				{"role_id": mafia.ID.String(), "count": 2},
				{"role_id": villager.ID.String(), "count": 4},
			},
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/role-templates", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		handler.CreateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)

		var response map[string]any
		json.NewDecoder(res.Body).Decode(&response)
		assert.Contains(t, response["error"], "player count")
	})

	t.Run("fails with invalid role ID", func(t *testing.T) {
		reqBody := map[string]any{
			"name":         "Invalid Role ID",
			"player_count": 6,
			"roles": []map[string]any{
				{"role_id": "invalid-uuid", "count": 2},
				{"role_id": villager.ID.String(), "count": 4},
			},
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/role-templates", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		handler.CreateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
	})
}

func TestRoleTemplateHandler_GetRoleTemplates(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := service.NewRoleService(client)
	templateService := service.NewRoleTemplateService(client)
	handler := NewRoleTemplateHandler(templateService)
	ctx := context.Background()

	// Create test roles
	mafia, _ := roleService.CreateRole(ctx, "Mafia Get", "mafia-get", "video", "desc", role.TeamMafia, nil)
	villager, _ := roleService.CreateRole(ctx, "Villager Get", "villager-get", "video", "desc", role.TeamVillage, nil)

	// Create test templates
	roles6 := []service.RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
	templateService.CreateRoleTemplate(ctx, "6-Player Test", 6, "desc", roles6)

	roles10 := []service.RoleAssignment{{RoleID: mafia.ID, Count: 3}, {RoleID: villager.ID, Count: 7}}
	templateService.CreateRoleTemplate(ctx, "10-Player Test", 10, "desc", roles10)

	t.Run("returns all templates", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/role-templates", nil)
		w := httptest.NewRecorder()

		handler.GetRoleTemplates(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response []map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.GreaterOrEqual(t, len(response), 2)
	})

	t.Run("filters by player count", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/role-templates?player_count=6", nil)
		w := httptest.NewRecorder()

		handler.GetRoleTemplates(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response []map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		for _, tmpl := range response {
			assert.Equal(t, float64(6), tmpl["player_count"])
		}
	})

	t.Run("fails with invalid player count", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/role-templates?player_count=invalid", nil)
		w := httptest.NewRecorder()

		handler.GetRoleTemplates(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
	})
}

func TestRoleTemplateHandler_GetRoleTemplateByID(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := service.NewRoleService(client)
	templateService := service.NewRoleTemplateService(client)
	handler := NewRoleTemplateHandler(templateService)
	ctx := context.Background()

	// Create test roles and template
	mafia, _ := roleService.CreateRole(ctx, "Mafia GetID", "mafia-getid", "video", "desc", role.TeamMafia, nil)
	villager, _ := roleService.CreateRole(ctx, "Villager GetID", "villager-getid", "video", "desc", role.TeamVillage, nil)
	roles := []service.RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
	template, _ := templateService.CreateRoleTemplate(ctx, "GetByID Test", 6, "desc", roles)

	t.Run("retrieves template by ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/role-templates/%s", template.ID), nil)
		w := httptest.NewRecorder()

		// Setup chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", template.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.GetRoleTemplateByID(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, template.ID.String(), response["id"])
		assert.Equal(t, "GetByID Test", response["name"])
		assert.NotNil(t, response["roles"])
	})

	t.Run("fails with invalid ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/role-templates/invalid-id", nil)
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "invalid-id")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.GetRoleTemplateByID(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
	})
}

func TestRoleTemplateHandler_UpdateRoleTemplate(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := service.NewRoleService(client)
	templateService := service.NewRoleTemplateService(client)
	handler := NewRoleTemplateHandler(templateService)
	ctx := context.Background()

	// Create test roles and template
	mafia, _ := roleService.CreateRole(ctx, "Mafia Update", "mafia-update", "video", "desc", role.TeamMafia, nil)
	villager, _ := roleService.CreateRole(ctx, "Villager Update", "villager-update", "video", "desc", role.TeamVillage, nil)
	roles := []service.RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
	template, _ := templateService.CreateRoleTemplate(ctx, "Update Test", 6, "old desc", roles)

	t.Run("updates template name", func(t *testing.T) {
		reqBody := map[string]any{
			"name": "Updated Name",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/admin/role-templates/%s", template.ID), bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", template.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.UpdateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, "Updated Name", response["name"])
	})

	t.Run("updates template roles", func(t *testing.T) {
		reqBody := map[string]any{
			"roles": []map[string]any{
				{"role_id": mafia.ID.String(), "count": 1},
				{"role_id": villager.ID.String(), "count": 5},
			},
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/admin/role-templates/%s", template.ID), bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", template.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.UpdateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)

		var response map[string]any
		err := json.NewDecoder(res.Body).Decode(&response)
		require.NoError(t, err)

		roles, ok := response["roles"].([]any)
		require.True(t, ok)
		assert.Len(t, roles, 2)
	})

	t.Run("fails with invalid ID", func(t *testing.T) {
		reqBody := map[string]any{"name": "New Name"}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPatch, "/api/admin/role-templates/invalid-id", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "invalid-id")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.UpdateRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
	})
}

func TestRoleTemplateHandler_DeleteRoleTemplate(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := service.NewRoleService(client)
	templateService := service.NewRoleTemplateService(client)
	handler := NewRoleTemplateHandler(templateService)
	ctx := context.Background()

	// Create test roles and template
	mafia, _ := roleService.CreateRole(ctx, "Mafia Delete", "mafia-delete", "video", "desc", role.TeamMafia, nil)
	villager, _ := roleService.CreateRole(ctx, "Villager Delete", "villager-delete", "video", "desc", role.TeamVillage, nil)
	roles := []service.RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
	template, _ := templateService.CreateRoleTemplate(ctx, "Delete Test", 6, "desc", roles)

	t.Run("deletes template successfully", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/admin/role-templates/%s", template.ID), nil)
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", template.ID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.DeleteRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusNoContent, res.StatusCode)

		// Verify deletion
		_, err := templateService.GetRoleTemplateByID(ctx, template.ID)
		assert.Error(t, err)
	})

	t.Run("fails with invalid ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/admin/role-templates/invalid-id", nil)
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "invalid-id")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.DeleteRoleTemplate(w, req)

		res := w.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
	})
}
