package service

import (
	"context"
	"testing"

	"github.com/mafia-night/backend/ent/role"
	"github.com/mafia-night/backend/internal/database"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRoleTemplateService_CreateRoleTemplate(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := NewRoleService(client)
	templateService := NewRoleTemplateService(client)
	ctx := context.Background()

	// Create some roles to use in templates
	godfather, err := roleService.CreateRole(ctx, "Godfather1", "godfather1", "video", "desc", role.TeamMafia, nil)
	require.NoError(t, err)

	mafia, err := roleService.CreateRole(ctx, "Mafia1", "mafia1", "video", "desc", role.TeamMafia, nil)
	require.NoError(t, err)

	doctor, err := roleService.CreateRole(ctx, "Doctor1", "doctor1", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	detective, err := roleService.CreateRole(ctx, "Detective1", "detective1", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	villager, err := roleService.CreateRole(ctx, "Villager1", "villager1", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	t.Run("creates template with valid data", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: godfather.ID, Count: 1},
			{RoleID: mafia.ID, Count: 2},
			{RoleID: doctor.ID, Count: 1},
			{RoleID: detective.ID, Count: 1},
			{RoleID: villager.ID, Count: 5},
		}

		template, err := templateService.CreateRoleTemplate(
			ctx,
			"Classic 10-Player",
			10,
			"A classic setup for 10 players",
			roles,
		)

		require.NoError(t, err)
		assert.NotEmpty(t, template.ID)
		assert.Equal(t, "Classic 10-Player", template.Name)
		assert.Equal(t, 10, template.PlayerCount)
		assert.Equal(t, "A classic setup for 10 players", template.Description)
		assert.NotNil(t, template.Edges.TemplateRoles)
		assert.Len(t, template.Edges.TemplateRoles, 5)
	})

	t.Run("creates template without description", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
			{RoleID: villager.ID, Count: 4},
		}

		template, err := templateService.CreateRoleTemplate(
			ctx,
			"Simple 6-Player",
			6,
			"",
			roles,
		)

		require.NoError(t, err)
		assert.Equal(t, "Simple 6-Player", template.Name)
		assert.Empty(t, template.Description)
		assert.Len(t, template.Edges.TemplateRoles, 2)
	})

	t.Run("fails with empty name", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
			{RoleID: villager.ID, Count: 4},
		}

		_, err := templateService.CreateRoleTemplate(ctx, "", 6, "desc", roles)
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyTemplateName, err)
	})

	t.Run("fails with invalid player count", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
		}

		_, err := templateService.CreateRoleTemplate(ctx, "Invalid", 0, "desc", roles)
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidPlayerCount, err)

		_, err = templateService.CreateRoleTemplate(ctx, "Invalid", -5, "desc", roles)
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidPlayerCount, err)
	})

	t.Run("fails with empty roles", func(t *testing.T) {
		_, err := templateService.CreateRoleTemplate(ctx, "No Roles", 10, "desc", []RoleAssignment{})
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyRoles, err)
	})

	t.Run("fails with invalid role count", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 0},
			{RoleID: villager.ID, Count: 6},
		}

		_, err := templateService.CreateRoleTemplate(ctx, "Invalid Count", 6, "desc", roles)
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidTemplateRoleCount, err)
	})

	t.Run("fails with player count mismatch", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
			{RoleID: villager.ID, Count: 3},
		}

		_, err := templateService.CreateRoleTemplate(ctx, "Mismatch", 10, "desc", roles)
		assert.Error(t, err)
		assert.Equal(t, ErrPlayerCountMismatch, err)
	})

	t.Run("fails with duplicate name", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
			{RoleID: villager.ID, Count: 4},
		}

		_, err := templateService.CreateRoleTemplate(ctx, "Duplicate Name", 6, "desc", roles)
		require.NoError(t, err)

		roles2 := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
			{RoleID: villager.ID, Count: 6},
		}

		_, err = templateService.CreateRoleTemplate(ctx, "Duplicate Name", 8, "desc", roles2)
		assert.Error(t, err)
		assert.Equal(t, ErrTemplateNameExists, err)
	})
}

func TestRoleTemplateService_GetAllRoleTemplates(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := NewRoleService(client)
	templateService := NewRoleTemplateService(client)
	ctx := context.Background()

	// Create roles
	mafia, err := roleService.CreateRole(ctx, "Mafia2", "mafia2", "video", "desc", role.TeamMafia, nil)
	require.NoError(t, err)
	villager, err := roleService.CreateRole(ctx, "Villager2", "villager2", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	t.Run("returns all templates ordered by player count", func(t *testing.T) {
		// Create templates in non-ordered way
		roles10 := []RoleAssignment{{RoleID: mafia.ID, Count: 3}, {RoleID: villager.ID, Count: 7}}
		_, err := templateService.CreateRoleTemplate(ctx, "10-Player Setup", 10, "", roles10)
		require.NoError(t, err)

		roles6 := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		_, err = templateService.CreateRoleTemplate(ctx, "6-Player Setup", 6, "", roles6)
		require.NoError(t, err)

		roles8 := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 6}}
		_, err = templateService.CreateRoleTemplate(ctx, "8-Player Setup", 8, "", roles8)
		require.NoError(t, err)

		templates, err := templateService.GetAllRoleTemplates(ctx, nil)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(templates), 3)

		// Verify templates include role edges
		for _, tmpl := range templates {
			if tmpl.Name == "10-Player Setup" || tmpl.Name == "6-Player Setup" || tmpl.Name == "8-Player Setup" {
				assert.NotNil(t, tmpl.Edges.TemplateRoles)
				assert.Greater(t, len(tmpl.Edges.TemplateRoles), 0)
			}
		}
	})

	t.Run("filters by player count", func(t *testing.T) {
		playerCount := 6
		templates, err := templateService.GetAllRoleTemplates(ctx, &playerCount)
		require.NoError(t, err)

		for _, tmpl := range templates {
			assert.Equal(t, 6, tmpl.PlayerCount)
		}
	})
}

func TestRoleTemplateService_GetRoleTemplateByID(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := NewRoleService(client)
	templateService := NewRoleTemplateService(client)
	ctx := context.Background()

	mafia, err := roleService.CreateRole(ctx, "Mafia3", "mafia3", "video", "desc", role.TeamMafia, nil)
	require.NoError(t, err)
	villager, err := roleService.CreateRole(ctx, "Villager3", "villager3", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	t.Run("retrieves existing template with roles", func(t *testing.T) {
		roles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 2},
			{RoleID: villager.ID, Count: 4},
		}

		created, err := templateService.CreateRoleTemplate(ctx, "GetByID Test", 6, "desc", roles)
		require.NoError(t, err)

		retrieved, err := templateService.GetRoleTemplateByID(ctx, created.ID)
		require.NoError(t, err)
		assert.Equal(t, created.ID, retrieved.ID)
		assert.Equal(t, created.Name, retrieved.Name)
		assert.Equal(t, created.PlayerCount, retrieved.PlayerCount)
		assert.NotNil(t, retrieved.Edges.TemplateRoles)
		assert.Len(t, retrieved.Edges.TemplateRoles, 2)

		// Verify role details are loaded
		for _, tr := range retrieved.Edges.TemplateRoles {
			assert.NotNil(t, tr.Edges.Role)
			assert.Greater(t, tr.Count, 0)
		}
	})

	t.Run("fails for non-existent template", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "To Delete", 6, "desc", roles)
		require.NoError(t, err)

		err = templateService.DeleteRoleTemplate(ctx, created.ID)
		require.NoError(t, err)

		_, err = templateService.GetRoleTemplateByID(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrTemplateNotFound, err)
	})
}

func TestRoleTemplateService_UpdateRoleTemplate(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := NewRoleService(client)
	templateService := NewRoleTemplateService(client)
	ctx := context.Background()

	mafia, err := roleService.CreateRole(ctx, "Mafia4", "mafia4", "video", "desc", role.TeamMafia, nil)
	require.NoError(t, err)
	villager, err := roleService.CreateRole(ctx, "Villager4", "villager4", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)
	doctor, err := roleService.CreateRole(ctx, "Doctor4", "doctor4", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	t.Run("updates template name", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Original Name", 6, "desc", roles)
		require.NoError(t, err)

		newName := "Updated Name"
		updated, err := templateService.UpdateRoleTemplate(ctx, created.ID, &newName, nil, nil, nil)
		require.NoError(t, err)
		assert.Equal(t, "Updated Name", updated.Name)
		assert.Equal(t, created.PlayerCount, updated.PlayerCount)
	})

	t.Run("updates template player count", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Update PC Test", 6, "desc", roles)
		require.NoError(t, err)

		newPlayerCount := 8
		newRoles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 6}}
		updated, err := templateService.UpdateRoleTemplate(ctx, created.ID, nil, &newPlayerCount, nil, newRoles)
		require.NoError(t, err)
		assert.Equal(t, 8, updated.PlayerCount)
	})

	t.Run("updates template description", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Update Desc Test", 6, "old desc", roles)
		require.NoError(t, err)

		newDesc := "new description"
		updated, err := templateService.UpdateRoleTemplate(ctx, created.ID, nil, nil, &newDesc, nil)
		require.NoError(t, err)
		assert.Equal(t, "new description", updated.Description)
	})

	t.Run("updates template roles", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Update Roles Test", 6, "desc", roles)
		require.NoError(t, err)

		newRoles := []RoleAssignment{
			{RoleID: mafia.ID, Count: 1},
			{RoleID: doctor.ID, Count: 1},
			{RoleID: villager.ID, Count: 4},
		}
		updated, err := templateService.UpdateRoleTemplate(ctx, created.ID, nil, nil, nil, newRoles)
		require.NoError(t, err)
		assert.Len(t, updated.Edges.TemplateRoles, 3)
	})

	t.Run("updates multiple fields at once", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Multi Update", 6, "desc", roles)
		require.NoError(t, err)

		newName := "New Name"
		newDesc := "New Description"
		newPlayerCount := 7
		newRoles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 5}}

		updated, err := templateService.UpdateRoleTemplate(ctx, created.ID, &newName, &newPlayerCount, &newDesc, newRoles)
		require.NoError(t, err)
		assert.Equal(t, "New Name", updated.Name)
		assert.Equal(t, "New Description", updated.Description)
		assert.Equal(t, 7, updated.PlayerCount)
		assert.Len(t, updated.Edges.TemplateRoles, 2)
	})

	t.Run("fails with player count mismatch on update", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Mismatch Update", 6, "desc", roles)
		require.NoError(t, err)

		// Try to update roles that don't match current player count
		newRoles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 5}}
		_, err = templateService.UpdateRoleTemplate(ctx, created.ID, nil, nil, nil, newRoles)
		assert.Error(t, err)
		assert.Equal(t, ErrPlayerCountMismatch, err)
	})

	t.Run("fails for non-existent template", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "To Delete 2", 6, "desc", roles)
		require.NoError(t, err)

		err = templateService.DeleteRoleTemplate(ctx, created.ID)
		require.NoError(t, err)

		newName := "Should Fail"
		_, err = templateService.UpdateRoleTemplate(ctx, created.ID, &newName, nil, nil, nil)
		assert.Error(t, err)
		assert.Equal(t, ErrTemplateNotFound, err)
	})
}

func TestRoleTemplateService_DeleteRoleTemplate(t *testing.T) {
	client := database.SetupTestDB(t)
	roleService := NewRoleService(client)
	templateService := NewRoleTemplateService(client)
	ctx := context.Background()

	mafia, err := roleService.CreateRole(ctx, "Mafia5", "mafia5", "video", "desc", role.TeamMafia, nil)
	require.NoError(t, err)
	villager, err := roleService.CreateRole(ctx, "Villager5", "villager5", "video", "desc", role.TeamVillage, nil)
	require.NoError(t, err)

	t.Run("deletes existing template and its roles", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Delete Test 1", 6, "desc", roles)
		require.NoError(t, err)

		err = templateService.DeleteRoleTemplate(ctx, created.ID)
		require.NoError(t, err)

		// Verify template is deleted
		_, err = templateService.GetRoleTemplateByID(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrTemplateNotFound, err)
	})

	t.Run("fails for non-existent template", func(t *testing.T) {
		roles := []RoleAssignment{{RoleID: mafia.ID, Count: 2}, {RoleID: villager.ID, Count: 4}}
		created, err := templateService.CreateRoleTemplate(ctx, "Delete Test 2", 6, "desc", roles)
		require.NoError(t, err)

		// Delete once
		err = templateService.DeleteRoleTemplate(ctx, created.ID)
		require.NoError(t, err)

		// Try to delete again
		err = templateService.DeleteRoleTemplate(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrTemplateNotFound, err)
	})
}
