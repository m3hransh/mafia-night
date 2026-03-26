package service

import (
	"context"
	"errors"
	"math/rand"
	"strings"
	"time"

	"sort"

	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/elimination"
	"github.com/mafia-night/backend/ent/game"
	"github.com/mafia-night/backend/ent/gameround"
	"github.com/mafia-night/backend/ent/gamerole"
	"github.com/mafia-night/backend/ent/player"
	entVote "github.com/mafia-night/backend/ent/vote"
	"github.com/mafia-night/backend/pkg/gameid"
)

var (
	ErrEmptyGameID          = errors.New("game ID cannot be empty")
	ErrEmptyModeratorID     = errors.New("moderator ID cannot be empty")
	ErrNotAuthorized        = errors.New("not authorized to perform this action")
	ErrEmptyUserID          = errors.New("user ID cannot be empty")
	ErrEmptyPlayerID        = errors.New("player ID cannot be empty")
	ErrPlayerNameExists     = errors.New("player name already exists in this game")
	ErrGameAlreadyStarted   = errors.New("game has already started")
	ErrInvalidRoleCount     = errors.New("role count must match player count")
	ErrRolesAlreadyAssigned = errors.New("roles have already been assigned")
	ErrRolesAlreadySelected = errors.New("roles have already been selected")
	ErrRolesNotSelected     = errors.New("roles have not been selected yet")
)

// GameService handles game-related business logic
type GameService struct {
	client *ent.Client
}

// NewGameService creates a new game service
func NewGameService(client *ent.Client) *GameService {
	return &GameService{client: client}
}

// CreateGame creates a new game with a generated ID
func (s *GameService) CreateGame(ctx context.Context, moderatorID string) (*ent.Game, error) {
	if moderatorID == "" {
		return nil, ErrEmptyModeratorID
	}

	gameID := gameid.Generate()

	game, err := s.client.Game.
		Create().
		SetID(gameID).
		SetModeratorID(moderatorID).
		SetStatus(game.StatusPending).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return game, nil
}

// GetGameByID retrieves a game by its ID
func (s *GameService) GetGameByID(ctx context.Context, gameID string) (*ent.Game, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}

	game, err := s.client.Game.Get(ctx, gameID)
	if err != nil {
		return nil, err
	}

	return game, nil
}

// UpdateGameStatus updates the status of a game
// Only the moderator who created the game can update it
func (s *GameService) UpdateGameStatus(ctx context.Context, gameID string, status game.Status, moderatorID string) (*ent.Game, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}
	if moderatorID == "" {
		return nil, ErrEmptyModeratorID
	}

	// Get the game first to check moderator
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Check if moderator matches
	if existingGame.ModeratorID != moderatorID {
		return nil, ErrNotAuthorized
	}

	// Update the status
	updated, err := existingGame.Update().
		SetStatus(status).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return updated, nil
}

// DeleteGame deletes a game
// Only the moderator who created the game can delete it
func (s *GameService) DeleteGame(ctx context.Context, gameID string, moderatorID string) error {
	if gameID == "" {
		return ErrEmptyGameID
	}
	if moderatorID == "" {
		return ErrEmptyModeratorID
	}

	// Get the game first to check moderator
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return err
	}

	// Check if moderator matches
	if existingGame.ModeratorID != moderatorID {
		return ErrNotAuthorized
	}

	// Delete the game
	err = s.client.Game.DeleteOne(existingGame).Exec(ctx)
	if err != nil {
		return err
	}

	return nil
}

func (s *GameService) JoinGame(ctx context.Context, gameID string, userName string) (*ent.Player, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID	
	}
	if userName == ""	 {
		return nil, ErrEmptyUserID
	}


	// Get the game first
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Validate game status - can only join pending games
	if existingGame.Status != game.StatusPending {
		return nil, ErrGameAlreadyStarted
	}

	// Create the player
	player, err := s.client.Player.
		Create().
		SetID(uuid.New()).
		SetName(userName).
		SetGameID(existingGame.ID).
		Save(ctx)

	if err != nil {
		// Check if it's a duplicate key constraint error
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, ErrPlayerNameExists
		}
		return nil, err
	}

	return player, nil
}

// GetPlayers retrieves all players in a game
func (s *GameService) GetPlayers(ctx context.Context, gameID string) ([]*ent.Player, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}

	// Verify game exists
	_, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Get all players for this game
	players, err := s.client.Player.
		Query().
		Where(player.GameID(gameID)).
		All(ctx)

	if err != nil {
		return nil, err
	}

	return players, nil
}

// RemovePlayer removes a player from a game
func (s *GameService) RemovePlayer(ctx context.Context, gameID string, playerID string) error {
	if gameID == "" {
		return ErrEmptyGameID
	}
	if playerID == "" {
		return ErrEmptyPlayerID
	}

	// Verify game exists
	_, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return err
	}

	// Parse player ID
	playerUUID, err := uuid.Parse(playerID)
	if err != nil {
		return err
	}

	// Get the player and verify it belongs to this game
	existingPlayer, err := s.client.Player.Get(ctx, playerUUID)
	if err != nil {
		return err
	}

	// Verify player belongs to this game
	if existingPlayer.GameID != gameID {
		return errors.New("player does not belong to this game")
	}

	// Delete the player
	err = s.client.Player.DeleteOne(existingPlayer).Exec(ctx)
	if err != nil {
		return err
	}

	return nil
}

// RoleSelection represents a role and the count to assign
type RoleSelection struct {
	RoleID string `json:"role_id"`
	Count  int    `json:"count"`
}

// SelectRoles persists the moderator's role selection without assigning them to players.
// Can be called multiple times to update the selection; fails only if roles were already distributed.
func (s *GameService) SelectRoles(ctx context.Context, gameID string, moderatorID string, roleSelections []RoleSelection) error {
	if gameID == "" {
		return ErrEmptyGameID
	}
	if moderatorID == "" {
		return ErrEmptyModeratorID
	}

	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return err
	}

	if existingGame.ModeratorID != moderatorID {
		return ErrNotAuthorized
	}

	// Fail if roles have already been distributed (any row has a player assigned)
	assignedCount, err := s.client.GameRole.
		Query().
		Where(gamerole.GameID(gameID), gamerole.PlayerIDNotNil()).
		Count(ctx)
	if err != nil {
		return err
	}
	if assignedCount > 0 {
		return ErrRolesAlreadyAssigned
	}

	tx, err := s.client.Tx(ctx)
	if err != nil {
		return err
	}

	// Delete any previous unassigned selection before saving the new one
	_, err = tx.GameRole.
		Delete().
		Where(gamerole.GameID(gameID), gamerole.PlayerIDIsNil()).
		Exec(ctx)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Create GameRole records without a player assignment
	for _, sel := range roleSelections {
		roleUUID, err := uuid.Parse(sel.RoleID)
		if err != nil {
			tx.Rollback()
			return err
		}
		for i := 0; i < sel.Count; i++ {
			_, err := tx.GameRole.
				Create().
				SetGameID(gameID).
				SetRoleID(roleUUID).
				Save(ctx)
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

// DistributeRoles randomly assigns players to the pre-selected roles.
// SelectRoles must be called first to persist the role selection.
func (s *GameService) DistributeRoles(ctx context.Context, gameID string, moderatorID string) error {
	if gameID == "" {
		return ErrEmptyGameID
	}
	if moderatorID == "" {
		return ErrEmptyModeratorID
	}

	// Get the game and verify moderator
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return err
	}

	if existingGame.ModeratorID != moderatorID {
		return ErrNotAuthorized
	}

	// Fail if roles have already been distributed
	assignedCount, err := s.client.GameRole.
		Query().
		Where(gamerole.GameID(gameID), gamerole.PlayerIDNotNil()).
		Count(ctx)
	if err != nil {
		return err
	}
	if assignedCount > 0 {
		return ErrRolesAlreadyAssigned
	}

	// Load the pre-selected (unassigned) GameRole records
	selectedRoles, err := s.client.GameRole.
		Query().
		Where(gamerole.GameID(gameID), gamerole.PlayerIDIsNil()).
		All(ctx)
	if err != nil {
		return err
	}
	if len(selectedRoles) == 0 {
		return ErrRolesNotSelected
	}

	// Get all players in the game
	players, err := s.GetPlayers(ctx, gameID)
	if err != nil {
		return err
	}

	// Validate role count matches player count
	if len(selectedRoles) != len(players) {
		return ErrInvalidRoleCount
	}

	// Shuffle players for random assignment
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	rng.Shuffle(len(players), func(i, j int) {
		players[i], players[j] = players[j], players[i]
	})

	// Assign each player to a pre-selected GameRole record in a transaction
	tx, err := s.client.Tx(ctx)
	if err != nil {
		return err
	}

	for i, gr := range selectedRoles {
		_, err := tx.GameRole.
			UpdateOneID(gr.ID).
			SetPlayerID(players[i].ID).
			Save(ctx)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// Update game status to active
	_, err = tx.Game.
		UpdateOneID(gameID).
		SetStatus(game.StatusActive).
		Save(ctx)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

// SelectedRoleEntry holds a role and how many times it was selected.
type SelectedRoleEntry struct {
	RoleID string `json:"role_id"`
	Name   string `json:"name"`
	Slug   string `json:"slug"`
	Team   string `json:"team"`
	Video  string `json:"video"`
	Count  int    `json:"count"`
}

// GetSelectedRoles returns all roles the moderator has selected for the game, including already-distributed ones.
func (s *GameService) GetSelectedRoles(ctx context.Context, gameID string) ([]SelectedRoleEntry, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}

	_, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	gameRoles, err := s.client.GameRole.
		Query().
		Where(gamerole.GameID(gameID)).
		WithRole().
		All(ctx)
	if err != nil {
		return nil, err
	}

	// Aggregate counts per role
	order := []string{}
	counts := map[string]*SelectedRoleEntry{}
	for _, gr := range gameRoles {
		r := gr.Edges.Role
		if r == nil {
			continue
		}
		id := r.ID.String()
		if _, ok := counts[id]; !ok {
			order = append(order, id)
			counts[id] = &SelectedRoleEntry{
				RoleID: id,
				Name:   r.Name,
				Slug:   r.Slug,
				Team:   string(r.Team),
				Video:  r.Video,
			}
		}
		counts[id].Count++
	}

	result := make([]SelectedRoleEntry, 0, len(order))
	for _, id := range order {
		result = append(result, *counts[id])
	}
	return result, nil
}
func (s *GameService) GetPlayerRole(ctx context.Context, gameID string, playerID string) (*ent.GameRole, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}
	if playerID == "" {
		return nil, ErrEmptyPlayerID
	}

	// Parse player ID
	playerUUID, err := uuid.Parse(playerID)
	if err != nil {
		return nil, err
	}

	// Get the game role with role details
	gameRole, err := s.client.GameRole.
		Query().
		Where(
			gamerole.GameID(gameID),
			gamerole.PlayerID(playerUUID),
		).
		WithRole().
		Only(ctx)

	if err != nil {
		return nil, err
	}

	return gameRole, nil
}

// GetGameRoles retrieves all role assignments for a game (moderator view)
func (s *GameService) GetGameRoles(ctx context.Context, gameID string, moderatorID string) ([]*ent.GameRole, error) {
	if gameID == "" {
		return nil, ErrEmptyGameID
	}
	if moderatorID == "" {
		return nil, ErrEmptyModeratorID
	}

	// Verify game exists and moderator owns it
	existingGame, err := s.GetGameByID(ctx, gameID)
	if err != nil {
		return nil, err
	}

	if existingGame.ModeratorID != moderatorID {
		return nil, ErrNotAuthorized
	}

	// Get all game roles with player and role details
	gameRoles, err := s.client.GameRole.
		Query().
		Where(gamerole.GameID(gameID)).
		WithPlayer().
		WithRole().
		All(ctx)

	if err != nil {
		return nil, err
	}

	return gameRoles, nil
}

// ── Phase management ──────────────────────────────────────────────────────────

var (
ErrWrongPhase               = errors.New("game is not in the expected phase")
ErrGameNotActive            = errors.New("game is not active")
ErrGameAlreadyEnded         = errors.New("game has already ended")
ErrGameNotFound             = errors.New("game not found")
ErrPlayerAlreadyEliminated  = errors.New("player has already been eliminated")
ErrCannotVoteForSelf        = errors.New("cannot vote for yourself")
ErrNoActiveRound            = errors.New("no active round")
ErrInvalidVoteStage         = errors.New("invalid vote stage")
)

// PhaseResult is returned by phase-transition methods.
type PhaseResult struct {
Game  *ent.Game
Round *ent.GameRound
}

// StartDay transitions the game to the day phase and opens a new round.
func (s *GameService) StartDay(ctx context.Context, gameID, moderatorID string) (*PhaseResult, error) {
if gameID == "" {
return nil, ErrEmptyGameID
}
if moderatorID == "" {
return nil, ErrEmptyModeratorID
}

g, err := s.GetGameByID(ctx, gameID)
if err != nil {
return nil, err
}
if g.ModeratorID != moderatorID {
return nil, ErrNotAuthorized
}
if g.Phase == "ended" {
return nil, ErrGameAlreadyEnded
}

// Close any open round
if err := s.closeCurrentRound(ctx, gameID); err != nil {
return nil, err
}

newRound := g.RoundNumber + 1

round, err := s.client.GameRound.
Create().
SetGameID(gameID).
SetRoundNumber(newRound).
SetPhase("day").
Save(ctx)
if err != nil {
return nil, err
}

updatedGame, err := s.client.Game.
UpdateOneID(gameID).
SetPhase("day").
SetRoundNumber(newRound).
SetStatus("active").
Save(ctx)
if err != nil {
return nil, err
}

return &PhaseResult{Game: updatedGame, Round: round}, nil
}

// StartNight transitions the game to the night phase and opens a new round.
func (s *GameService) StartNight(ctx context.Context, gameID, moderatorID string) (*PhaseResult, error) {
if gameID == "" {
return nil, ErrEmptyGameID
}
if moderatorID == "" {
return nil, ErrEmptyModeratorID
}

g, err := s.GetGameByID(ctx, gameID)
if err != nil {
return nil, err
}
if g.ModeratorID != moderatorID {
return nil, ErrNotAuthorized
}
if g.Phase == "ended" {
return nil, ErrGameAlreadyEnded
}

if err := s.closeCurrentRound(ctx, gameID); err != nil {
return nil, err
}

newRound := g.RoundNumber + 1

round, err := s.client.GameRound.
Create().
SetGameID(gameID).
SetRoundNumber(newRound).
SetPhase("night").
Save(ctx)
if err != nil {
return nil, err
}

updatedGame, err := s.client.Game.
UpdateOneID(gameID).
SetPhase("night").
SetRoundNumber(newRound).
SetStatus("active").
Save(ctx)
if err != nil {
return nil, err
}

return &PhaseResult{Game: updatedGame, Round: round}, nil
}

// EndGame marks the game as ended.
func (s *GameService) EndGame(ctx context.Context, gameID, moderatorID string) (*ent.Game, error) {
if gameID == "" {
return nil, ErrEmptyGameID
}
if moderatorID == "" {
return nil, ErrEmptyModeratorID
}

g, err := s.GetGameByID(ctx, gameID)
if err != nil {
return nil, err
}
if g.ModeratorID != moderatorID {
return nil, ErrNotAuthorized
}
if g.Phase == "ended" {
return nil, ErrGameAlreadyEnded
}

if err := s.closeCurrentRound(ctx, gameID); err != nil {
return nil, err
}

return s.client.Game.
UpdateOneID(gameID).
SetPhase("ended").
SetStatus("completed").
Save(ctx)
}

// closeCurrentRound stamps ended_at on the most recent open round, if any.
func (s *GameService) closeCurrentRound(ctx context.Context, gameID string) error {
openRound, err := s.client.GameRound.
Query().
Where(
gameround.GameID(gameID),
gameround.EndedAtIsNil(),
).
Order(ent.Desc(gameround.FieldRoundNumber)).
First(ctx)
if err != nil {
if ent.IsNotFound(err) {
return nil
}
return err
}

now := time.Now()
return s.client.GameRound.
UpdateOneID(openRound.ID).
SetEndedAt(now).
Exec(ctx)
}

// GetCurrentRound returns the most recent open round for a game.
func (s *GameService) GetCurrentRound(ctx context.Context, gameID string) (*ent.GameRound, error) {
return s.client.GameRound.
Query().
Where(
gameround.GameID(gameID),
gameround.EndedAtIsNil(),
).
Order(ent.Desc(gameround.FieldRoundNumber)).
First(ctx)
}

type VoteCount struct {
	TargetID   uuid.UUID `json:"target_id"`
	TargetName string    `json:"target_name"`
	Count      int       `json:"count"`
}

type VoteTally struct {
	Stage string      `json:"stage"`
	Votes []VoteCount `json:"votes"`
	Total int         `json:"total_voters"`
}

// CastVote lets a player vote for a target during the current day round.
func (s *GameService) CastVote(ctx context.Context, gameID, voterID, targetID, stage string) error {
	g, err := s.client.Game.Get(ctx, gameID)
	if err != nil {
		return ErrGameNotFound
	}
	if g.Phase != game.PhaseDay {
		return ErrWrongPhase
	}
	if stage != "nomination" && stage != "final" {
		return ErrInvalidVoteStage
	}
	if voterID == targetID {
		return ErrCannotVoteForSelf
	}

	voterUUID, err := uuid.Parse(voterID)
	if err != nil {
		return errors.New("invalid voter id")
	}
	targetUUID, err := uuid.Parse(targetID)
	if err != nil {
		return errors.New("invalid target id")
	}

	round, err := s.GetCurrentRound(ctx, gameID)
	if err != nil {
		return ErrNoActiveRound
	}

	voteStage := entVote.Stage(stage)

	existing, err := s.client.Vote.Query().
		Where(
			entVote.RoundID(round.ID),
			entVote.VoterID(voterUUID),
			entVote.StageEQ(voteStage),
		).Only(ctx)

	if err == nil {
		_, err = s.client.Vote.UpdateOne(existing).
			SetTargetID(targetUUID).
			Save(ctx)
		return err
	}

	_, err = s.client.Vote.Create().
		SetGameID(gameID).
		SetRoundID(round.ID).
		SetVoterID(voterUUID).
		SetTargetID(targetUUID).
		SetStage(voteStage).
		Save(ctx)
	return err
}

// GetVoteTally returns the current vote counts for the active round.
func (s *GameService) GetVoteTally(ctx context.Context, gameID, stage string) (*VoteTally, error) {
	_, err := s.client.Game.Get(ctx, gameID)
	if err != nil {
		return nil, ErrGameNotFound
	}

	round, err := s.GetCurrentRound(ctx, gameID)
	if err != nil {
		return nil, ErrNoActiveRound
	}

	voteStage := entVote.Stage(stage)

	votes, err := s.client.Vote.Query().
		Where(
			entVote.RoundID(round.ID),
			entVote.StageEQ(voteStage),
		).
		WithTarget().
		All(ctx)
	if err != nil {
		return nil, err
	}

	counts := map[uuid.UUID]*VoteCount{}
	for _, v := range votes {
		if v.Edges.Target == nil {
			continue
		}
		if _, ok := counts[v.TargetID]; !ok {
			counts[v.TargetID] = &VoteCount{
				TargetID:   v.TargetID,
				TargetName: v.Edges.Target.Name,
			}
		}
		counts[v.TargetID].Count++
	}

	result := make([]VoteCount, 0, len(counts))
	for _, c := range counts {
		result = append(result, *c)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Count > result[j].Count })

	alivePlayers, _ := s.GetAlivePlayers(ctx, gameID)

	return &VoteTally{
		Stage: stage,
		Votes: result,
		Total: len(alivePlayers),
	}, nil
}

// GetAlivePlayers returns players who have not been eliminated.
func (s *GameService) GetAlivePlayers(ctx context.Context, gameID string) ([]*ent.Player, error) {
	allPlayers, err := s.GetPlayers(ctx, gameID)
	if err != nil {
		return nil, err
	}

	elims, err := s.client.Elimination.Query().
		Where(elimination.GameID(gameID)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	eliminatedIDs := make(map[uuid.UUID]bool, len(elims))
	for _, e := range elims {
		eliminatedIDs[e.PlayerID] = true
	}

	alive := make([]*ent.Player, 0, len(allPlayers))
	for _, p := range allPlayers {
		if !eliminatedIDs[p.ID] {
			alive = append(alive, p)
		}
	}
	return alive, nil
}

// EliminatePlayer removes a player from the game by creating an Elimination record.
func (s *GameService) EliminatePlayer(ctx context.Context, gameID, moderatorID, playerID, cause string) (*ent.Elimination, error) {
	g, err := s.client.Game.Get(ctx, gameID)
	if err != nil {
		return nil, ErrGameNotFound
	}
	if g.ModeratorID != moderatorID {
		return nil, ErrNotAuthorized
	}

	playerUUID, err := uuid.Parse(playerID)
	if err != nil {
		return nil, errors.New("invalid player id")
	}

	elimCause := elimination.Cause(cause)

	var roundID *uuid.UUID
	round, err := s.GetCurrentRound(ctx, gameID)
	if err == nil {
		id := round.ID
		roundID = &id
	}

	b := s.client.Elimination.Create().
		SetGameID(gameID).
		SetPlayerID(playerUUID).
		SetCause(elimCause)
	if roundID != nil {
		b = b.SetRoundID(*roundID)
	}
	return b.Save(ctx)
}
