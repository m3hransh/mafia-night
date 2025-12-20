package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/role"
)

var (
	ErrEmptySlug      = errors.New("slug cannot be empty")
	ErrEmptyRoleName  = errors.New("role name cannot be empty")
	ErrRoleNotFound   = errors.New("role not found")
	ErrRoleNameExists = errors.New("role name already exists")
	ErrRoleSlugExists = errors.New("role slug already exists")
)

// RoleService handles role-related business logic
type RoleService struct {
	client *ent.Client
}

// NewRoleService creates a new role service
func NewRoleService(client *ent.Client) *RoleService {
	return &RoleService{client: client}
}

// GetAllRoles retrieves all roles ordered by name
func (s *RoleService) GetAllRoles(ctx context.Context) ([]*ent.Role, error) {
	roles, err := s.client.Role.
		Query().
		Order(ent.Asc(role.FieldName)).
		All(ctx)

	if err != nil {
		return nil, err
	}

	return roles, nil
}

// GetRoleBySlug retrieves a role by its slug
func (s *RoleService) GetRoleBySlug(ctx context.Context, slug string) (*ent.Role, error) {
	if slug == "" {
		return nil, ErrEmptySlug
	}

	role, err := s.client.Role.
		Query().
		Where(role.SlugEQ(slug)).
		Only(ctx)

	if err != nil {
		return nil, err
	}

	return role, nil
}

// GetRoleByID retrieves a role by its ID
func (s *RoleService) GetRoleByID(ctx context.Context, id uuid.UUID) (*ent.Role, error) {
	foundRole, err := s.client.Role.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrRoleNotFound
		}
		return nil, err
	}
	return foundRole, nil
}

// CreateRole creates a new role
func (s *RoleService) CreateRole(ctx context.Context, name, slug, video, description string, team role.Team, abilities []string) (*ent.Role, error) {
	if name == "" {
		return nil, ErrEmptyRoleName
	}
	if slug == "" {
		return nil, ErrEmptySlug
	}

	create := s.client.Role.
		Create().
		SetName(name).
		SetSlug(slug).
		SetVideo(video).
		SetTeam(team)

	if description != "" {
		create.SetDescription(description)
	}

	if abilities != nil && len(abilities) > 0 {
		create.SetAbilities(abilities)
	}

	createdRole, err := create.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			// Check which constraint was violated
			existing, _ := s.client.Role.Query().
				Where(role.NameEQ(name)).
				Exist(ctx)
			if existing {
				return nil, ErrRoleNameExists
			}
			return nil, ErrRoleSlugExists
		}
		return nil, err
	}

	return createdRole, nil
}

// UpdateRole updates an existing role
func (s *RoleService) UpdateRole(ctx context.Context, id uuid.UUID, name, slug, video, description *string, team *role.Team, abilities []string) (*ent.Role, error) {
	existingRole, err := s.GetRoleByID(ctx, id)
	if err != nil {
		return nil, err
	}

	update := existingRole.Update()

	if name != nil && *name != "" {
		update.SetName(*name)
	}
	if slug != nil && *slug != "" {
		update.SetSlug(*slug)
	}
	if video != nil && *video != "" {
		update.SetVideo(*video)
	}
	if description != nil {
		update.SetDescription(*description)
	}
	if team != nil {
		update.SetTeam(*team)
	}
	if abilities != nil {
		update.SetAbilities(abilities)
	}

	updated, err := update.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrRoleNameExists
		}
		return nil, err
	}

	return updated, nil
}

// DeleteRole deletes a role
func (s *RoleService) DeleteRole(ctx context.Context, id uuid.UUID) error {
	existingRole, err := s.GetRoleByID(ctx, id)
	if err != nil {
		return err
	}

	return s.client.Role.DeleteOne(existingRole).Exec(ctx)
}

