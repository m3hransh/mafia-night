package models

import "errors"

var (
	// Game errors
	ErrGameAlreadyStarted = errors.New("game has already started")
	ErrGameNotInProgress  = errors.New("game is not in progress")
	ErrGameNotFound       = errors.New("game not found")
	
	// Player errors
	ErrPlayerNotFound     = errors.New("player not found")
	ErrDuplicatePlayer    = errors.New("player with this name already exists in game")
	ErrGameFull           = errors.New("game has reached maximum players")
	
	// Role errors
	ErrRoleNotFound       = errors.New("role not found")
	ErrInvalidRole        = errors.New("invalid role configuration")
)
