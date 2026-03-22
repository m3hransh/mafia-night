package handler

import "time"

// ErrorResponseBody represents an error response
// @Description Error response body
type ErrorResponseBody struct {
	Error string `json:"error" example:"something went wrong"`
}

// MessageResponse represents a success message response
// @Description Simple message response
type MessageResponse struct {
	Message string `json:"message" example:"operation completed successfully"`
}

// GameResponse represents a game object
// @Description Game data
type GameResponse struct {
	ID          string    `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ModeratorID string    `json:"moderator_id" example:"mod-123"`
	Status      string    `json:"status" example:"waiting" enums:"waiting,active,finished"`
	CreatedAt   time.Time `json:"created_at" example:"2024-01-01T00:00:00Z"`
}

// PlayerResponse represents a player object
// @Description Player data
type PlayerResponse struct {
	ID        string    `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name      string    `json:"name" example:"Alice"`
	GameID    string    `json:"game_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	CreatedAt time.Time `json:"created_at" example:"2024-01-01T00:00:00Z"`
}

// RoleResponse represents a role object
// @Description Role data
type RoleResponse struct {
	ID          string   `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string   `json:"name" example:"Mafia"`
	Slug        string   `json:"slug" example:"mafia"`
	Video       string   `json:"video" example:"https://example.com/video.mp4"`
	Description string   `json:"description" example:"The mafia member eliminates villagers at night."`
	Team        string   `json:"team" example:"mafia" enums:"mafia,village,independent"`
	Abilities   []string `json:"abilities" example:"eliminate"`
}

// PlayerRoleResponse represents a player's assigned role
// @Description Player role assignment data
type PlayerRoleResponse struct {
	ID          string    `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string    `json:"name" example:"Mafia"`
	Slug        string    `json:"slug" example:"mafia"`
	Video       string    `json:"video" example:"https://example.com/video.mp4"`
	Description string    `json:"description" example:"The mafia member eliminates villagers at night."`
	Team        string    `json:"team" example:"mafia" enums:"mafia,village,independent"`
	Abilities   []string  `json:"abilities" example:"eliminate"`
	AssignedAt  time.Time `json:"assigned_at" example:"2024-01-01T00:00:00Z"`
}

// GameRoleResponse represents a game role assignment (moderator view)
// @Description Moderator view of a player-role assignment
type GameRoleResponse struct {
	PlayerID   string    `json:"player_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PlayerName string    `json:"player_name" example:"Alice"`
	RoleID     string    `json:"role_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	RoleName   string    `json:"role_name" example:"Mafia"`
	RoleSlug   string    `json:"role_slug" example:"mafia"`
	Video      string    `json:"video" example:"https://example.com/video.mp4"`
	Team       string    `json:"team" example:"mafia" enums:"mafia,village,independent"`
	AssignedAt time.Time `json:"assigned_at" example:"2024-01-01T00:00:00Z"`
}

// RoleTemplateResponse represents a role template object
// @Description Role template data
type RoleTemplateResponse struct {
	ID          string                    `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string                    `json:"name" example:"8-player standard"`
	PlayerCount int                       `json:"player_count" example:"8"`
	Description string                    `json:"description" example:"Standard 8-player game setup"`
	CreatedAt   time.Time                 `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt   time.Time                 `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	Roles       []TemplateRoleEntryResponse `json:"roles,omitempty"`
}

// TemplateRoleEntryResponse represents a role entry within a template
// @Description Role entry in a template
type TemplateRoleEntryResponse struct {
	Count  int          `json:"count" example:"2"`
	Role   *RoleResponse `json:"role,omitempty"`
	RoleID *string      `json:"role_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
}

// AdminResponse represents an admin user object
// @Description Admin user data
type AdminResponse struct {
	ID        string     `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Username  string     `json:"username" example:"admin"`
	Email     string     `json:"email" example:"admin@example.com"`
	IsActive  bool       `json:"is_active" example:"true"`
	LastLogin *time.Time `json:"last_login" example:"2024-01-01T00:00:00Z"`
	CreatedAt time.Time  `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt time.Time  `json:"updated_at" example:"2024-01-01T00:00:00Z"`
}

// LoginResponse represents the login response
// @Description Login response with token and admin info
type LoginResponse struct {
	Token string        `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	Admin AdminResponse `json:"admin"`
}

// DistributeRolesSuccessResponse represents a success response for role distribution
// @Description Role distribution success response
type DistributeRolesSuccessResponse struct {
	Message string `json:"message" example:"roles distributed successfully"`
}

// ChangePasswordSuccessResponse represents a success response for password change
// @Description Password change success response
type ChangePasswordSuccessResponse struct {
	Message string `json:"message" example:"password changed successfully"`
}

// WebSocketStatsResponse represents WebSocket stats
// @Description WebSocket connection statistics
type WebSocketStatsResponse struct {
	ActiveGames       int `json:"active_games" example:"3"`
	TotalConnections  int `json:"total_connections" example:"12"`
}
