package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/roletemplate"
	"github.com/mafia-night/backend/ent/roletemplaterole"
)

var (
	ErrEmptyTemplateName         = errors.New("template name cannot be empty")
	ErrInvalidPlayerCount        = errors.New("player count must be positive")
	ErrTemplateNotFound          = errors.New("role template not found")
	ErrTemplateNameExists        = errors.New("template name already exists")
	ErrEmptyRoles                = errors.New("template must have at least one role")
	ErrInvalidTemplateRoleCount  = errors.New("role count must be positive")
	ErrPlayerCountMismatch       = errors.New("sum of role counts must equal player count")
	ErrRoleTemplateRoleNotFound  = errors.New("role template role not found")
)

// RoleTemplateService handles role template-related business logic
type RoleTemplateService struct {
	client *ent.Client
}

// NewRoleTemplateService creates a new role template service
func NewRoleTemplateService(client *ent.Client) *RoleTemplateService {
	return &RoleTemplateService{client: client}
}

// RoleAssignment represents a role and its count in a template
type RoleAssignment struct {
	RoleID uuid.UUID
	Count  int
}

// CreateRoleTemplate creates a new role template with role assignments
func (s *RoleTemplateService) CreateRoleTemplate(ctx context.Context, name string, playerCount int, description string, roles []RoleAssignment) (*ent.RoleTemplate, error) {
	if name == "" {
		return nil, ErrEmptyTemplateName
	}
	if playerCount <= 0 {
		return nil, ErrInvalidPlayerCount
	}
	if len(roles) == 0 {
		return nil, ErrEmptyRoles
	}

	// Validate role counts
	totalCount := 0
	for _, r := range roles {
		if r.Count <= 0 {
			return nil, ErrInvalidTemplateRoleCount
		}
		totalCount += r.Count
	}

	if totalCount != playerCount {
		return nil, ErrPlayerCountMismatch
	}

	// Start a transaction
	tx, err := s.client.Tx(ctx)
	if err != nil {
		return nil, err
	}

	// Create the template
	create := tx.RoleTemplate.
		Create().
		SetName(name).
		SetPlayerCount(playerCount)

	if description != "" {
		create.SetDescription(description)
	}

	template, err := create.Save(ctx)
	if err != nil {
		tx.Rollback()
		if ent.IsConstraintError(err) {
			return nil, ErrTemplateNameExists
		}
		return nil, err
	}

	// Create role assignments
	for _, r := range roles {
		_, err := tx.RoleTemplateRole.
			Create().
			SetRoleTemplateID(template.ID).
			SetRoleID(r.RoleID).
			SetCount(r.Count).
			Save(ctx)

		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Return the template with loaded edges
	return s.GetRoleTemplateByID(ctx, template.ID)
}

// GetAllRoleTemplates retrieves all role templates ordered by player count
func (s *RoleTemplateService) GetAllRoleTemplates(ctx context.Context, playerCount *int) ([]*ent.RoleTemplate, error) {
	query := s.client.RoleTemplate.
		Query().
		WithTemplateRoles(func(q *ent.RoleTemplateRoleQuery) {
			q.WithRole()
		}).
		Order(ent.Asc(roletemplate.FieldPlayerCount), ent.Asc(roletemplate.FieldName))

	if playerCount != nil {
		query = query.Where(roletemplate.PlayerCountEQ(*playerCount))
	}

	templates, err := query.All(ctx)
	if err != nil {
		return nil, err
	}

	return templates, nil
}

// GetRoleTemplateByID retrieves a role template by its ID with role assignments
func (s *RoleTemplateService) GetRoleTemplateByID(ctx context.Context, id uuid.UUID) (*ent.RoleTemplate, error) {
	template, err := s.client.RoleTemplate.
		Query().
		Where(roletemplate.IDEQ(id)).
		WithTemplateRoles(func(q *ent.RoleTemplateRoleQuery) {
			q.WithRole()
		}).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrTemplateNotFound
		}
		return nil, err
	}

	return template, nil
}

// UpdateRoleTemplate updates an existing role template
func (s *RoleTemplateService) UpdateRoleTemplate(ctx context.Context, id uuid.UUID, name *string, playerCount *int, description *string, roles []RoleAssignment) (*ent.RoleTemplate, error) {
	existingTemplate, err := s.GetRoleTemplateByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// If roles are being updated, validate them
	if roles != nil {
		if len(roles) == 0 {
			return nil, ErrEmptyRoles
		}

		// Determine the player count to validate against
		validatePlayerCount := existingTemplate.PlayerCount
		if playerCount != nil {
			validatePlayerCount = *playerCount
		}

		// Validate role counts
		totalCount := 0
		for _, r := range roles {
			if r.Count <= 0 {
				return nil, ErrInvalidTemplateRoleCount
			}
			totalCount += r.Count
		}

		if totalCount != validatePlayerCount {
			return nil, ErrPlayerCountMismatch
		}
	}

	// Start a transaction
	tx, err := s.client.Tx(ctx)
	if err != nil {
		return nil, err
	}

	// Update the template
	update := tx.RoleTemplate.UpdateOneID(existingTemplate.ID)

	if name != nil && *name != "" {
		update.SetName(*name)
	}
	if playerCount != nil && *playerCount > 0 {
		update.SetPlayerCount(*playerCount)
	}
	if description != nil {
		update.SetDescription(*description)
	}

	_, err = update.Save(ctx)
	if err != nil {
		tx.Rollback()
		if ent.IsConstraintError(err) {
			return nil, ErrTemplateNameExists
		}
		return nil, err
	}

	// Update roles if provided
	if roles != nil {
		// Delete existing role assignments
		_, err := tx.RoleTemplateRole.
			Delete().
			Where(roletemplaterole.RoleTemplateIDEQ(existingTemplate.ID)).
			Exec(ctx)

		if err != nil {
			tx.Rollback()
			return nil, err
		}

		// Create new role assignments
		for _, r := range roles {
			_, err := tx.RoleTemplateRole.
				Create().
				SetRoleTemplateID(existingTemplate.ID).
				SetRoleID(r.RoleID).
				SetCount(r.Count).
				Save(ctx)

			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Return the updated template with loaded edges
	return s.GetRoleTemplateByID(ctx, existingTemplate.ID)
}

// DeleteRoleTemplate deletes a role template and its role assignments
func (s *RoleTemplateService) DeleteRoleTemplate(ctx context.Context, id uuid.UUID) error {
	existingTemplate, err := s.GetRoleTemplateByID(ctx, id)
	if err != nil {
		return err
	}

	// Start a transaction
	tx, err := s.client.Tx(ctx)
	if err != nil {
		return err
	}

	// Delete role assignments first
	_, err = tx.RoleTemplateRole.
		Delete().
		Where(roletemplaterole.RoleTemplateIDEQ(existingTemplate.ID)).
		Exec(ctx)

	if err != nil {
		tx.Rollback()
		return err
	}

	// Delete the template
	err = tx.RoleTemplate.DeleteOne(existingTemplate).Exec(ctx)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}
