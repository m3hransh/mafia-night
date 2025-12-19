package service

import (
	"context"
	"errors"

	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/role"
)

var (
	ErrEmptySlug = errors.New("slug cannot be empty")
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
