package seed

import (
	"context"
	"fmt"

	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/role"
)

// RoleData represents the data structure for seeding roles
type RoleData struct {
	Name        string
	Slug        string
	Video       string
	Description string
	Team        role.Team
	Abilities   []string
}

// Roles contains all 30 roles from frontend with team assignments
var Roles = []RoleData{
	{
		Name:        "Sherlock",
		Slug:        "sherlock",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/sherlock.webm",
		Description: "The brilliant detective who can investigate one player each night to discover their role. Uses deduction and logic to find the criminals.",
		Team:        role.TeamIndependent,
		Abilities:   []string{"Investigate player each night", "Discover player's role", "Cannot be killed at night"},
	},
	{
		Name:        "Mafia",
		Slug:        "mafia",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Mafia.webm",
		Description: "A member of the criminal organization. Works with other Mafia members to eliminate citizens during the night. Win by outnumbering the town.",
		Team:        role.TeamMafia,
		Abilities:   []string{"Kill one player each night", "Coordinate with other Mafia", "Win by outnumbering villagers"},
	},
	{
		Name:        "Doctor Watson",
		Slug:        "doctor-watson",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Doctor_Watson.webm",
		Description: "The trusted medical expert who can protect one player each night from elimination. Cannot protect the same person two nights in a row.",
		Team:        role.TeamVillage,
		Abilities:   []string{"Protect one player each night", "Cannot protect same player twice in a row", "Prevent night kills"},
	},
	{
		Name:        "Bodyguard",
		Slug:        "bodyguard",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Bodyguard.webm",
		Description: "Professional protector who shields one player each night. If that player is attacked, both the attacker and bodyguard may die.",
		Team:        role.TeamVillage,
		Abilities:   []string{"Protect one player each night", "Die if protected player is attacked", "Kill the attacker"},
	},
	{
		Name:        "Chef",
		Slug:        "chef",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Chef.webm",
		Description: "Provides nourishment to the town. Can prepare a special meal that reveals information about other players. A citizen with culinary secrets.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Citizen Kane",
		Slug:        "citizen-kane",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Citizen_Kane.webm",
		Description: "Influential townsperson whose vote counts double during eliminations. A powerful voice in the community with hidden wealth.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Citizen Male",
		Slug:        "citizen-male",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Citizen_male.webm",
		Description: "An ordinary member of the town with no special powers. Must rely on logic and observation to identify the criminals among them.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Citizen",
		Slug:        "citizen",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Citizen.webm",
		Description: "Regular townsperson trying to survive and help eliminate the Mafia. Uses voting and discussion to protect the innocent.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Commander",
		Slug:        "commander",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Commander.webm",
		Description: "Military leader who can rally the town and coordinate defenses. Has tactical knowledge and leadership abilities to guide citizens.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Constantine",
		Slug:        "constantine",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Constantine.webm",
		Description: "Mystic occult detective who can sense supernatural evil. Has unique powers to detect dark forces working against the town.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Cowgirl",
		Slug:        "cowgirl",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Cowgirl.webm",
		Description: "Quick-draw sharpshooter from the frontier. Can use her weapon skills to eliminate threats but must choose targets carefully.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Gunsmith",
		Slug:        "gunsmith",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Gunsmith.webm",
		Description: "Arms dealer who can detect if a player owns weapons. Knows who might be dangerous but not their true allegiance.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Hacker",
		Slug:        "hacker",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Hacker.webm",
		Description: "Digital infiltrator who can access secret information. Can hack into communications to learn about other players actions.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Leon",
		Slug:        "leon",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Leon.webm",
		Description: "Professional cleaner and hitman who works in the shadows. Highly skilled and dangerous with unclear loyalties.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Mayor",
		Slug:        "mayor",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Mayor.webm",
		Description: "Elected leader of the town. Can reveal themselves to gain extra voting power or call emergency meetings to discuss threats.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Natasha",
		Slug:        "natasha",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Natasha.webm",
		Description: "Mysterious operative with espionage training. Can gather intelligence and has connections to both sides of the conflict.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Ocean's Friend",
		Slug:        "oceans-friend",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Ocean_s_friend.webm",
		Description: "Part of a heist crew with strategic planning skills. Works to protect their team and can coordinate group actions.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Ocean",
		Slug:        "ocean",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Ocean.webm",
		Description: "Master thief and strategist who leads complex operations. Can steal items or information from other players during the night.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Police",
		Slug:        "police",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Police.webm",
		Description: "Law enforcement officer investigating the crimes. Can arrest one suspect per night to learn their alignment and protect the town.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Priest",
		Slug:        "priest",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Priest.webm",
		Description: "Holy man who can resurrect one eliminated player or protect souls. Has divine powers to aid the innocent and punish evil.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Rostam",
		Slug:        "rostam",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Rostam.webm",
		Description: "Legendary hero warrior with incredible strength. Can challenge others to combat and has enhanced defensive abilities.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Saboteur",
		Slug:        "saboteur",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/saboteur.webm",
		Description: "Agent of chaos who disrupts plans and sows confusion. Can interfere with other players abilities and create mayhem in the night.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Saul Goodman",
		Slug:        "saul-goodman",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Saul_Goodman.webm",
		Description: "Criminal lawyer who can defend accused players. Can prevent one elimination per game through legal manipulation and persuasion.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Spider",
		Slug:        "spider",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Spider.webm",
		Description: "Web-spinning vigilante who protects the innocent. Can trap criminals and has enhanced senses to detect danger approaching.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Spy",
		Slug:        "spy",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Spy.webm",
		Description: "Covert intelligence operative who gathers secrets. Can spy on conversations and learn about other players actions and roles.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Terrorist",
		Slug:        "terrorist",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Terrorist.webm",
		Description: "Extremist with explosive capabilities. Can eliminate multiple players at once but will also perish in the blast. Use carefully.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Therapist",
		Slug:        "therapist",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Therapist.webm",
		Description: "Mental health professional who can calm disturbed minds. Can prevent certain roles from using their abilities by providing therapy.",
		Team:        role.TeamVillage,
		Abilities:   []string{},
	},
	{
		Name:        "Thief",
		Slug:        "thief",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Thief.webm",
		Description: "Cunning burglar who steals from others at night. Can take items, abilities, or information from other players to gain advantage.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Traitor",
		Slug:        "traitor",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Traitor.webm",
		Description: "Betrayer who appears as citizen but aids the Mafia. Unknown even to Mafia, becomes active if all Mafia are eliminated.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
	{
		Name:        "Yakuza",
		Slug:        "yakuza",
		Video:       "https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Yakuza.webm",
		Description: "Japanese crime syndicate member with honor code. Works with organized criminals and has unique assassination techniques.",
		Team:        role.TeamMafia,
		Abilities:   []string{},
	},
}

// SeedRoles seeds the database with predefined roles
// Uses upsert logic: creates new roles or updates existing ones based on slug
func SeedRoles(ctx context.Context, client *ent.Client) error {
	created := 0
	updated := 0

	for _, r := range Roles {
		// Check if role exists by slug
		existingRole, err := client.Role.Query().
			Where(role.SlugEQ(r.Slug)).
			Only(ctx)

		if err != nil && !ent.IsNotFound(err) {
			return fmt.Errorf("failed to query role %s: %w", r.Slug, err)
		}

		if existingRole != nil {
			// Update existing role
			err = client.Role.UpdateOne(existingRole).
				SetName(r.Name).
				SetVideo(r.Video).
				SetDescription(r.Description).
				SetTeam(r.Team).
				SetAbilities(r.Abilities).
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update role %s: %w", r.Slug, err)
			}
			updated++
		} else {
			// Create new role
			_, err = client.Role.Create().
				SetName(r.Name).
				SetSlug(r.Slug).
				SetVideo(r.Video).
				SetDescription(r.Description).
				SetTeam(r.Team).
				SetAbilities(r.Abilities).
				Save(ctx)
			if err != nil {
				return fmt.Errorf("failed to create role %s: %w", r.Slug, err)
			}
			created++
		}
	}

	if created > 0 && updated > 0 {
		fmt.Printf("✅ Successfully seeded roles: %d created, %d updated\n", created, updated)
	} else if created > 0 {
		fmt.Printf("✅ Successfully created %d roles\n", created)
	} else if updated > 0 {
		fmt.Printf("✅ Successfully updated %d roles\n", updated)
	} else {
		fmt.Println("✅ All roles are already up to date")
	}

	return nil
}
