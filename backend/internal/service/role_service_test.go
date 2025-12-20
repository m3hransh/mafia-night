package service

import (
	"context"
	"testing"

	"github.com/mafia-night/backend/ent/role"
	"github.com/mafia-night/backend/internal/database"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRoleService_CreateRole(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewRoleService(client)
	ctx := context.Background()

	t.Run("creates role with valid data", func(t *testing.T) {
		createdRole, err := service.CreateRole(
			ctx,
			"Test Detective",
			"test-detective",
			"https://example.com/video.webm",
			"A test detective role",
			role.TeamVillage,
			[]string{"Investigate players", "Find mafia"},
		)

		require.NoError(t, err)
		assert.NotEmpty(t, createdRole.ID)
		assert.Equal(t, "Test Detective", createdRole.Name)
		assert.Equal(t, "test-detective", createdRole.Slug)
		assert.Equal(t, "https://example.com/video.webm", createdRole.Video)
		assert.Equal(t, "A test detective role", createdRole.Description)
		assert.Equal(t, role.TeamVillage, createdRole.Team)
		assert.Len(t, createdRole.Abilities, 2)
		assert.Contains(t, createdRole.Abilities, "Investigate players")
	})

	t.Run("creates role without description", func(t *testing.T) {
		createdRole, err := service.CreateRole(
			ctx,
			"Simple Role",
			"simple-role",
			"https://example.com/video.webm",
			"",
			role.TeamMafia,
			nil,
		)

		require.NoError(t, err)
		assert.Equal(t, "Simple Role", createdRole.Name)
		assert.Empty(t, createdRole.Description)
		assert.Empty(t, createdRole.Abilities)
	})

	t.Run("fails with empty name", func(t *testing.T) {
		_, err := service.CreateRole(
			ctx,
			"",
			"slug",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)

		assert.Error(t, err)
		assert.Equal(t, ErrEmptyRoleName, err)
	})

	t.Run("fails with empty slug", func(t *testing.T) {
		_, err := service.CreateRole(
			ctx,
			"Role Name",
			"",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)

		assert.Error(t, err)
		assert.Equal(t, ErrEmptySlug, err)
	})

	t.Run("fails with duplicate name", func(t *testing.T) {
		_, err := service.CreateRole(
			ctx,
			"Duplicate Name",
			"unique-slug-1",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		_, err = service.CreateRole(
			ctx,
			"Duplicate Name",
			"unique-slug-2",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)

		assert.Error(t, err)
		assert.Equal(t, ErrRoleNameExists, err)
	})

	t.Run("fails with duplicate slug", func(t *testing.T) {
		_, err := service.CreateRole(
			ctx,
			"Unique Name 1",
			"duplicate-slug",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		_, err = service.CreateRole(
			ctx,
			"Unique Name 2",
			"duplicate-slug",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)

		assert.Error(t, err)
		assert.Equal(t, ErrRoleSlugExists, err)
	})
}

func TestRoleService_GetRoleByID(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewRoleService(client)
	ctx := context.Background()

	t.Run("retrieves existing role", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Get By ID Test",
			"get-by-id-test",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			[]string{"ability1"},
		)
		require.NoError(t, err)

		retrieved, err := service.GetRoleByID(ctx, created.ID)

		require.NoError(t, err)
		assert.Equal(t, created.ID, retrieved.ID)
		assert.Equal(t, created.Name, retrieved.Name)
		assert.Equal(t, created.Slug, retrieved.Slug)
	})

	t.Run("fails for non-existent role", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"To Delete",
			"to-delete",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		err = service.DeleteRole(ctx, created.ID)
		require.NoError(t, err)

		_, err = service.GetRoleByID(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrRoleNotFound, err)
	})
}

func TestRoleService_UpdateRole(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewRoleService(client)
	ctx := context.Background()

	t.Run("updates role name", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Original Name",
			"update-test-1",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		newName := "Updated Name"
		updated, err := service.UpdateRole(ctx, created.ID, &newName, nil, nil, nil, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, "Updated Name", updated.Name)
		assert.Equal(t, created.Slug, updated.Slug)
	})

	t.Run("updates role slug", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Update Test 2",
			"original-slug",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		newSlug := "updated-slug"
		updated, err := service.UpdateRole(ctx, created.ID, nil, &newSlug, nil, nil, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, "updated-slug", updated.Slug)
		assert.Equal(t, created.Name, updated.Name)
	})

	t.Run("updates role video", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Update Test 3",
			"update-test-3",
			"https://example.com/original.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		newVideo := "https://example.com/updated.webm"
		updated, err := service.UpdateRole(ctx, created.ID, nil, nil, &newVideo, nil, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, "https://example.com/updated.webm", updated.Video)
	})

	t.Run("updates role description", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Update Test 4",
			"update-test-4",
			"https://example.com/video.webm",
			"original description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		newDesc := "updated description"
		updated, err := service.UpdateRole(ctx, created.ID, nil, nil, nil, &newDesc, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, "updated description", updated.Description)
	})

	t.Run("updates role team", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Update Test 5",
			"update-test-5",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		newTeam := role.TeamMafia
		updated, err := service.UpdateRole(ctx, created.ID, nil, nil, nil, nil, &newTeam, nil)

		require.NoError(t, err)
		assert.Equal(t, role.TeamMafia, updated.Team)
	})

	t.Run("updates role abilities", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Update Test 6",
			"update-test-6",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			[]string{"old ability"},
		)
		require.NoError(t, err)

		newAbilities := []string{"new ability 1", "new ability 2"}
		updated, err := service.UpdateRole(ctx, created.ID, nil, nil, nil, nil, nil, newAbilities)

		require.NoError(t, err)
		assert.Len(t, updated.Abilities, 2)
		assert.Contains(t, updated.Abilities, "new ability 1")
		assert.Contains(t, updated.Abilities, "new ability 2")
	})

	t.Run("updates multiple fields at once", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Update Test 7",
			"update-test-7",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		newName := "New Name"
		newSlug := "new-slug"
		newTeam := role.TeamMafia
		updated, err := service.UpdateRole(ctx, created.ID, &newName, &newSlug, nil, nil, &newTeam, nil)

		require.NoError(t, err)
		assert.Equal(t, "New Name", updated.Name)
		assert.Equal(t, "new-slug", updated.Slug)
		assert.Equal(t, role.TeamMafia, updated.Team)
	})

	t.Run("fails for non-existent role", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"To Delete 2",
			"to-delete-2",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		err = service.DeleteRole(ctx, created.ID)
		require.NoError(t, err)

		newName := "Should Fail"
		_, err = service.UpdateRole(ctx, created.ID, &newName, nil, nil, nil, nil, nil)
		assert.Error(t, err)
		assert.Equal(t, ErrRoleNotFound, err)
	})
}

func TestRoleService_DeleteRole(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewRoleService(client)
	ctx := context.Background()

	t.Run("deletes existing role", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Delete Test 1",
			"delete-test-1",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		err = service.DeleteRole(ctx, created.ID)
		require.NoError(t, err)

		// Verify role is deleted
		_, err = service.GetRoleByID(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrRoleNotFound, err)
	})

	t.Run("fails for non-existent role", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Delete Test 2",
			"delete-test-2",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		// Delete once
		err = service.DeleteRole(ctx, created.ID)
		require.NoError(t, err)

		// Try to delete again
		err = service.DeleteRole(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrRoleNotFound, err)
	})
}

func TestRoleService_GetAllRoles(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewRoleService(client)
	ctx := context.Background()

	t.Run("returns all roles ordered by name", func(t *testing.T) {
		// Create roles in non-alphabetical order
		_, err := service.CreateRole(ctx, "Zebra", "zebra", "video", "", role.TeamVillage, nil)
		require.NoError(t, err)

		_, err = service.CreateRole(ctx, "Alpha", "alpha", "video", "", role.TeamMafia, nil)
		require.NoError(t, err)

		_, err = service.CreateRole(ctx, "Beta", "beta", "video", "", role.TeamIndependent, nil)
		require.NoError(t, err)

		roles, err := service.GetAllRoles(ctx)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(roles), 3)

		// Find our test roles and verify order
		var testRoles []string
		for _, r := range roles {
			if r.Name == "Zebra" || r.Name == "Alpha" || r.Name == "Beta" {
				testRoles = append(testRoles, r.Name)
			}
		}

		assert.Equal(t, []string{"Alpha", "Beta", "Zebra"}, testRoles)
	})
}

func TestRoleService_GetRoleBySlug(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewRoleService(client)
	ctx := context.Background()

	t.Run("retrieves role by slug", func(t *testing.T) {
		created, err := service.CreateRole(
			ctx,
			"Slug Test",
			"unique-slug-test",
			"https://example.com/video.webm",
			"description",
			role.TeamVillage,
			nil,
		)
		require.NoError(t, err)

		retrieved, err := service.GetRoleBySlug(ctx, "unique-slug-test")

		require.NoError(t, err)
		assert.Equal(t, created.ID, retrieved.ID)
		assert.Equal(t, "Slug Test", retrieved.Name)
	})

	t.Run("fails with empty slug", func(t *testing.T) {
		_, err := service.GetRoleBySlug(ctx, "")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptySlug, err)
	})

	t.Run("fails for non-existent slug", func(t *testing.T) {
		_, err := service.GetRoleBySlug(ctx, "non-existent-slug")
		assert.Error(t, err)
	})
}
