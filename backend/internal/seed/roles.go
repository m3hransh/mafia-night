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
}

// Roles contains all 30 roles from frontend with team assignments
var Roles = []RoleData{
	{
		Name:        "Sherlock",
		Slug:        "sherlock",
		Video:       "/roles/sherlock.webm",
		Description: "The brilliant detective who can investigate one player each night to discover their role. Uses deduction and logic to find the criminals.",
		Team:        role.TeamIndependent,
	},
	{
		Name:        "Mafia",
		Slug:        "mafia",
		Video:       "/roles/Mafia.webm",
		Description: "A member of the criminal organization. Works with other Mafia members to eliminate citizens during the night. Win by outnumbering the town.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Doctor Watson",
		Slug:        "doctor-watson",
		Video:       "/roles/Doctor Watson.webm",
		Description: "The trusted medical expert who can protect one player each night from elimination. Cannot protect the same person two nights in a row.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Bodyguard",
		Slug:        "bodyguard",
		Video:       "/roles/Bodyguard.webm",
		Description: "Professional protector who shields one player each night. If that player is attacked, both the attacker and bodyguard may die.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Chef",
		Slug:        "chef",
		Video:       "/roles/Chef.webm",
		Description: "Provides nourishment to the town. Can prepare a special meal that reveals information about other players. A citizen with culinary secrets.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Citizen Kane",
		Slug:        "citizen-kane",
		Video:       "/roles/Citizen Kane.webm",
		Description: "Influential townsperson whose vote counts double during eliminations. A powerful voice in the community with hidden wealth.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Citizen Male",
		Slug:        "citizen-male",
		Video:       "/roles/Citizen_male.webm",
		Description: "An ordinary member of the town with no special powers. Must rely on logic and observation to identify the criminals among them.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Citizen",
		Slug:        "citizen",
		Video:       "/roles/Citizen.webm",
		Description: "Regular townsperson trying to survive and help eliminate the Mafia. Uses voting and discussion to protect the innocent.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Commander",
		Slug:        "commander",
		Video:       "/roles/Commander.webm",
		Description: "Military leader who can rally the town and coordinate defenses. Has tactical knowledge and leadership abilities to guide citizens.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Constantine",
		Slug:        "constantine",
		Video:       "/roles/Constantine.webm",
		Description: "Mystic occult detective who can sense supernatural evil. Has unique powers to detect dark forces working against the town.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Cowgirl",
		Slug:        "cowgirl",
		Video:       "/roles/Cowgirl.webm",
		Description: "Quick-draw sharpshooter from the frontier. Can use her weapon skills to eliminate threats but must choose targets carefully.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Gunsmith",
		Slug:        "gunsmith",
		Video:       "/roles/Gunsmith.webm",
		Description: "Arms dealer who can detect if a player owns weapons. Knows who might be dangerous but not their true allegiance.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Hacker",
		Slug:        "hacker",
		Video:       "/roles/Hacker.webm",
		Description: "Digital infiltrator who can access secret information. Can hack into communications to learn about other players actions.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Leon",
		Slug:        "leon",
		Video:       "/roles/Leon.webm",
		Description: "Professional cleaner and hitman who works in the shadows. Highly skilled and dangerous with unclear loyalties.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Mayor",
		Slug:        "mayor",
		Video:       "/roles/Mayor.webm",
		Description: "Elected leader of the town. Can reveal themselves to gain extra voting power or call emergency meetings to discuss threats.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Natasha",
		Slug:        "natasha",
		Video:       "/roles/Natasha.webm",
		Description: "Mysterious operative with espionage training. Can gather intelligence and has connections to both sides of the conflict.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Ocean's Friend",
		Slug:        "oceans-friend",
		Video:       "/roles/Ocean_s friend.webm",
		Description: "Part of a heist crew with strategic planning skills. Works to protect their team and can coordinate group actions.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Ocean",
		Slug:        "ocean",
		Video:       "/roles/Ocean.webm",
		Description: "Master thief and strategist who leads complex operations. Can steal items or information from other players during the night.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Police",
		Slug:        "police",
		Video:       "/roles/Police.webm",
		Description: "Law enforcement officer investigating the crimes. Can arrest one suspect per night to learn their alignment and protect the town.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Priest",
		Slug:        "priest",
		Video:       "/roles/Priest.webm",
		Description: "Holy man who can resurrect one eliminated player or protect souls. Has divine powers to aid the innocent and punish evil.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Rostam",
		Slug:        "rostam",
		Video:       "/roles/Rostam.webm",
		Description: "Legendary hero warrior with incredible strength. Can challenge others to combat and has enhanced defensive abilities.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Saboteur",
		Slug:        "saboteur",
		Video:       "/roles/saboteur.webm",
		Description: "Agent of chaos who disrupts plans and sows confusion. Can interfere with other players abilities and create mayhem in the night.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Saul Goodman",
		Slug:        "saul-goodman",
		Video:       "/roles/Saul Goodman.webm",
		Description: "Criminal lawyer who can defend accused players. Can prevent one elimination per game through legal manipulation and persuasion.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Spider",
		Slug:        "spider",
		Video:       "/roles/Spider.webm",
		Description: "Web-spinning vigilante who protects the innocent. Can trap criminals and has enhanced senses to detect danger approaching.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Spy",
		Slug:        "spy",
		Video:       "/roles/Spy.webm",
		Description: "Covert intelligence operative who gathers secrets. Can spy on conversations and learn about other players actions and roles.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Terrorist",
		Slug:        "terrorist",
		Video:       "/roles/Terrorist.webm",
		Description: "Extremist with explosive capabilities. Can eliminate multiple players at once but will also perish in the blast. Use carefully.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Therapist",
		Slug:        "therapist",
		Video:       "/roles/Therapist.webm",
		Description: "Mental health professional who can calm disturbed minds. Can prevent certain roles from using their abilities by providing therapy.",
		Team:        role.TeamVillage,
	},
	{
		Name:        "Thief",
		Slug:        "thief",
		Video:       "/roles/Thief.webm",
		Description: "Cunning burglar who steals from others at night. Can take items, abilities, or information from other players to gain advantage.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Traitor",
		Slug:        "traitor",
		Video:       "/roles/Traitor.webm",
		Description: "Betrayer who appears as citizen but aids the Mafia. Unknown even to Mafia, becomes active if all Mafia are eliminated.",
		Team:        role.TeamMafia,
	},
	{
		Name:        "Yakuza",
		Slug:        "yakuza",
		Video:       "/roles/Yakuza.webm",
		Description: "Japanese crime syndicate member with honor code. Works with organized criminals and has unique assassination techniques.",
		Team:        role.TeamMafia,
	},
}

// SeedRoles seeds the database with predefined roles
func SeedRoles(ctx context.Context, client *ent.Client) error {
	// Check if roles already exist (idempotent)
	count, err := client.Role.Query().Count(ctx)
	if err != nil {
		return fmt.Errorf("failed to count roles: %w", err)
	}

	if count > 0 {
		fmt.Printf("Roles already exist (%d found). Skipping seed.\n", count)
		return nil
	}

	// Bulk create roles
	bulk := make([]*ent.RoleCreate, len(Roles))
	for i, r := range Roles {
		bulk[i] = client.Role.Create().
			SetName(r.Name).
			SetSlug(r.Slug).
			SetVideo(r.Video).
			SetDescription(r.Description).
			SetTeam(r.Team)
	}

	created, err := client.Role.CreateBulk(bulk...).Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to create roles: %w", err)
	}

	fmt.Printf("✅ Successfully seeded %d roles\n", len(created))
	return nil
}
