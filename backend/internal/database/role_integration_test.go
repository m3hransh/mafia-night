package database

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
		SetSlug("mafia").
		SetVideo("mafia_intro.mp4").
		SetAbilities([]string{"Kill one villager each night"}).
		Save(ctx)

	require.NoError(t, err)
	assert.NotZero(t, r.ID)
	assert.Equal(t, "Mafia", r.Name)
	assert.Equal(t, role.TeamMafia, r.Team)
	assert.Equal(t, "mafia_intro.mp4", r.Video)
	assert.Equal(t, []string{"Kill one villager each night"}, r.Abilities)
}

func TestRoleRepository_UniqueNames(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	// Create first role
	_, err := client.Role.
		Create().
		SetName("Doctor").
		SetTeam("village").
		SetSlug("doctor").
		SetVideo("doctor_intro.mp4").
		SetAbilities([]string{"Save one player each night"}).
		Save(ctx)
	require.NoError(t, err)

	// Try to create another role with same name (should fail)
	_, err = client.Role.
		Create().
		SetName("Doctor").
		SetTeam("village").
		SetSlug("doctor-2").
		SetVideo("doctor_intro_2.mp4").
		Save(ctx)
	assert.Error(t, err)
}

func TestRoleRepository_SeedPredefinedRoles(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()

	predefinedRoles := []struct {
		name      string
		team      string
		video     string
		abilities []string
	}{
		{"Mafia", "mafia", "mafia_intro.mp4", []string{"Kill one villager each night"}},
		{"Doctor", "village", "doctor_intro.mp4", []string{"Save one player each night"}},
		{"Detective", "village", "detective_intro.mp4", []string{"Investigate one player each night"}},
		{"Villager", "village", "villager_intro.mp4", []string{"No special abilities"}},
	}

	// Create predefined roles
	for _, r := range predefinedRoles {
		team := role.Team(r.team)
		_, err := client.Role.
			Create().
			SetName(r.name).
			SetTeam(team).
			SetSlug(r.name).
			SetVideo(r.video).
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
	_, err := client.Role.Create().SetName("Mafia").SetTeam("mafia").SetSlug("mafia").SetVideo("mafia_intro.mp4").Save(ctx)
	require.NoError(t, err)
	_, err = client.Role.Create().SetName("Doctor").SetTeam("village").SetSlug("doctor").SetVideo("doctor_intro.mp4").Save(ctx)
	require.NoError(t, err)
	_, err = client.Role.Create().SetName("Detective").SetTeam("village").SetSlug("detective").SetVideo("detective_intro.mp4").Save(ctx)
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
