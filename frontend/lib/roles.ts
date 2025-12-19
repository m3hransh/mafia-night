/**
 * @deprecated This file is deprecated. Roles are now fetched from the backend API.
 * Use the fetchRoles() and fetchRoleBySlug() functions from @/lib/api instead.
 * This file is kept temporarily for backward compatibility and will be removed in a future update.
 */
export const roles = [
  { 
    name: 'Sherlock', 
    video: '/roles/sherlock.webm', 
    slug: 'sherlock',
    description: 'The brilliant detective who can investigate one player each night to discover their role. Uses deduction and logic to find the criminals.'
  },
  { 
    name: 'Mafia', 
    video: '/roles/Mafia.webm', 
    slug: 'mafia',
    description: 'A member of the criminal organization. Works with other Mafia members to eliminate citizens during the night. Win by outnumbering the town.'
  },
  { 
    name: 'Doctor Watson', 
    video: '/roles/Doctor Watson.webm', 
    slug: 'doctor-watson',
    description: 'The trusted medical expert who can protect one player each night from elimination. Cannot protect the same person two nights in a row.'
  },
  { 
    name: 'Bodyguard', 
    video: '/roles/Bodyguard.webm', 
    slug: 'bodyguard',
    description: 'Professional protector who shields one player each night. If that player is attacked, both the attacker and bodyguard may die.'
  },
  { 
    name: 'Chef', 
    video: '/roles/Chef.webm', 
    slug: 'chef',
    description: 'Provides nourishment to the town. Can prepare a special meal that reveals information about other players. A citizen with culinary secrets.'
  },
  { 
    name: 'Citizen Kane', 
    video: '/roles/Citizen Kane.webm', 
    slug: 'citizen-kane',
    description: 'Influential townsperson whose vote counts double during eliminations. A powerful voice in the community with hidden wealth.'
  },
  { 
    name: 'Citizen Male', 
    video: '/roles/Citizen_male.webm', 
    slug: 'citizen-male',
    description: 'An ordinary member of the town with no special powers. Must rely on logic and observation to identify the criminals among them.'
  },
  { 
    name: 'Citizen', 
    video: '/roles/Citizen.webm', 
    slug: 'citizen',
    description: 'Regular townsperson trying to survive and help eliminate the Mafia. Uses voting and discussion to protect the innocent.'
  },
  { 
    name: 'Commander', 
    video: '/roles/Commander.webm', 
    slug: 'commander',
    description: 'Military leader who can rally the town and coordinate defenses. Has tactical knowledge and leadership abilities to guide citizens.'
  },
  { 
    name: 'Constantine', 
    video: '/roles/Constantine.webm', 
    slug: 'constantine',
    description: 'Mystic occult detective who can sense supernatural evil. Has unique powers to detect dark forces working against the town.'
  },
  { 
    name: 'Cowgirl', 
    video: '/roles/Cowgirl.webm', 
    slug: 'cowgirl',
    description: 'Quick-draw sharpshooter from the frontier. Can use her weapon skills to eliminate threats but must choose targets carefully.'
  },
  { 
    name: 'Gunsmith', 
    video: '/roles/Gunsmith.webm', 
    slug: 'gunsmith',
    description: 'Arms dealer who can detect if a player owns weapons. Knows who might be dangerous but not their true allegiance.'
  },
  { 
    name: 'Hacker', 
    video: '/roles/Hacker.webm', 
    slug: 'hacker',
    description: 'Digital infiltrator who can access secret information. Can hack into communications to learn about other players actions.'
  },
  { 
    name: 'Leon', 
    video: '/roles/Leon.webm', 
    slug: 'leon',
    description: 'Professional cleaner and hitman who works in the shadows. Highly skilled and dangerous with unclear loyalties.'
  },
  { 
    name: 'Mayor', 
    video: '/roles/Mayor.webm', 
    slug: 'mayor',
    description: 'Elected leader of the town. Can reveal themselves to gain extra voting power or call emergency meetings to discuss threats.'
  },
  { 
    name: 'Natasha', 
    video: '/roles/Natasha.webm', 
    slug: 'natasha',
    description: 'Mysterious operative with espionage training. Can gather intelligence and has connections to both sides of the conflict.'
  },
  { 
    name: 'Ocean\'s Friend', 
    video: '/roles/Ocean_s friend.webm', 
    slug: 'oceans-friend',
    description: 'Part of a heist crew with strategic planning skills. Works to protect their team and can coordinate group actions.'
  },
  { 
    name: 'Ocean', 
    video: '/roles/Ocean.webm', 
    slug: 'ocean',
    description: 'Master thief and strategist who leads complex operations. Can steal items or information from other players during the night.'
  },
  { 
    name: 'Police', 
    video: '/roles/Police.webm', 
    slug: 'police',
    description: 'Law enforcement officer investigating the crimes. Can arrest one suspect per night to learn their alignment and protect the town.'
  },
  { 
    name: 'Priest', 
    video: '/roles/Priest.webm', 
    slug: 'priest',
    description: 'Holy man who can resurrect one eliminated player or protect souls. Has divine powers to aid the innocent and punish evil.'
  },
  { 
    name: 'Rostam', 
    video: '/roles/Rostam.webm', 
    slug: 'rostam',
    description: 'Legendary hero warrior with incredible strength. Can challenge others to combat and has enhanced defensive abilities.'
  },
  { 
    name: 'Saboteur', 
    video: '/roles/saboteur.webm', 
    slug: 'saboteur',
    description: 'Agent of chaos who disrupts plans and sows confusion. Can interfere with other players abilities and create mayhem in the night.'
  },
  { 
    name: 'Saul Goodman', 
    video: '/roles/Saul Goodman.webm', 
    slug: 'saul-goodman',
    description: 'Criminal lawyer who can defend accused players. Can prevent one elimination per game through legal manipulation and persuasion.'
  },
  { 
    name: 'Spider', 
    video: '/roles/Spider.webm', 
    slug: 'spider',
    description: 'Web-spinning vigilante who protects the innocent. Can trap criminals and has enhanced senses to detect danger approaching.'
  },
  { 
    name: 'Spy', 
    video: '/roles/Spy.webm', 
    slug: 'spy',
    description: 'Covert intelligence operative who gathers secrets. Can spy on conversations and learn about other players actions and roles.'
  },
  { 
    name: 'Terrorist', 
    video: '/roles/Terrorist.webm', 
    slug: 'terrorist',
    description: 'Extremist with explosive capabilities. Can eliminate multiple players at once but will also perish in the blast. Use carefully.'
  },
  { 
    name: 'Therapist', 
    video: '/roles/Therapist.webm', 
    slug: 'therapist',
    description: 'Mental health professional who can calm disturbed minds. Can prevent certain roles from using their abilities by providing therapy.'
  },
  { 
    name: 'Thief', 
    video: '/roles/Thief.webm', 
    slug: 'thief',
    description: 'Cunning burglar who steals from others at night. Can take items, abilities, or information from other players to gain advantage.'
  },
  { 
    name: 'Traitor', 
    video: '/roles/Traitor.webm', 
    slug: 'traitor',
    description: 'Betrayer who appears as citizen but aids the Mafia. Unknown even to Mafia, becomes active if all Mafia are eliminated.'
  },
  { 
    name: 'Yakuza', 
    video: '/roles/Yakuza.webm', 
    slug: 'yakuza',
    description: 'Japanese crime syndicate member with honor code. Works with organized criminals and has unique assassination techniques.'
  },
];
