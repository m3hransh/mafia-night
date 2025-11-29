package repository

import (
	"context"
	"testing"

	"github.com/mafia-night/backend/ent/role"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRoleRepository_Create(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create a role
	r, err := client.Role.
		Create().
		SetName("Mafia").
		SetTeam("mafia").
		SetAbilities("Kill one villager each night").
		Save(ctx)

	require.NoError(t, err)
	assert.NotZero(t, r.ID)
	assert.Equal(t, "Mafia", r.Name)
	assert.Equal(t, role.TeamMafia, r.Team)
	assert.Equal(t, "Kill one villager each night", r.Abilities)
}

func TestRoleRepository_UniqueNames(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create first role
	_, err := client.Role.
		Create().
		SetName("Doctor").
		SetTeam("village").
		Save(ctx)
	require.NoError(t, err)

	// Try to create another role with same name (should fail)
	_, err = client.Role.
		Create().
		SetName("Doctor").
		SetTeam("village").
		Save(ctx)
	assert.Error(t, err)
}

func TestRoleRepository_SeedPredefinedRoles(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	predefinedRoles := []struct {
		name      string
		team      string
		abilities string
	}{
		{"Mafia", "mafia", "Kill one villager each night"},
		{"Doctor", "village", "Save one player each night"},
		{"Detective", "village", "Investigate one player each night"},
		{"Villager", "village", "No special abilities"},
	}

	// Create predefined roles
	for _, r := range predefinedRoles {
		team := role.Team(r.team)
		_, err := client.Role.
			Create().
			SetName(r.name).
			SetTeam(team).
			SetAbilities(r.abilities).
			Save(ctx)
		require.NoError(t, err)
	}

	// Verify all roles exist
	roles, err := client.Role.Query().All(ctx)
	require.NoError(t, err)
	assert.Len(t, roles, 4)
}

func TestRoleRepository_GetByTeam(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create roles
	_, err := client.Role.Create().SetName("Mafia").SetTeam("mafia").Save(ctx)
	require.NoError(t, err)
	_, err = client.Role.Create().SetName("Doctor").SetTeam("village").Save(ctx)
	require.NoError(t, err)
	_, err = client.Role.Create().SetName("Detective").SetTeam("village").Save(ctx)
	require.NoError(t, err)

	// Query village roles
	villageRoles, err := client.Role.
		Query().
		Where(role.TeamEQ(role.TeamVillage)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, villageRoles, 2)

	// Query mafia roles
	mafiaRoles, err := client.Role.
		Query().
		Where(role.TeamEQ(role.TeamMafia)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, mafiaRoles, 1)
}
