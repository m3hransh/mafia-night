package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/mafia-night/backend/ent"
	"github.com/mafia-night/backend/ent/admin"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrAdminNotFound      = errors.New("admin not found")
	ErrUsernameExists     = errors.New("username already exists")
	ErrEmailExists        = errors.New("email already exists")
	ErrEmptyUsername      = errors.New("username cannot be empty")
	ErrEmptyPassword      = errors.New("password cannot be empty")
	ErrEmptyEmail         = errors.New("email cannot be empty")
)

// AdminService handles admin-related business logic
type AdminService struct {
	client *ent.Client
}

// NewAdminService creates a new admin service
func NewAdminService(client *ent.Client) *AdminService {
	return &AdminService{client: client}
}

// CreateAdmin creates a new admin user
func (s *AdminService) CreateAdmin(ctx context.Context, username, email, password string) (*ent.Admin, error) {
	if username == "" {
		return nil, ErrEmptyUsername
	}
	if email == "" {
		return nil, ErrEmptyEmail
	}
	if password == "" {
		return nil, ErrEmptyPassword
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create admin
	createdAdmin, err := s.client.Admin.
		Create().
		SetUsername(username).
		SetEmail(email).
		SetPasswordHash(string(hashedPassword)).
		Save(ctx)

	if err != nil {
		if ent.IsConstraintError(err) {
			// Check which constraint was violated
			existing, _ := s.client.Admin.Query().
				Where(admin.UsernameEQ(username)).
				Exist(ctx)
			if existing {
				return nil, ErrUsernameExists
			}
			return nil, ErrEmailExists
		}
		return nil, err
	}

	return createdAdmin, nil
}

// Login validates credentials and returns admin
func (s *AdminService) Login(ctx context.Context, username, password string) (*ent.Admin, error) {
	if username == "" {
		return nil, ErrEmptyUsername
	}
	if password == "" {
		return nil, ErrEmptyPassword
	}

	// Get admin by username
	foundAdmin, err := s.client.Admin.
		Query().
		Where(
			admin.UsernameEQ(username),
			admin.IsActiveEQ(true),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(foundAdmin.PasswordHash), []byte(password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Update last login
	foundAdmin, err = foundAdmin.Update().
		SetLastLogin(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, err
	}

	return foundAdmin, nil
}

// GetAdminByID retrieves an admin by ID
func (s *AdminService) GetAdminByID(ctx context.Context, id uuid.UUID) (*ent.Admin, error) {
	foundAdmin, err := s.client.Admin.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrAdminNotFound
		}
		return nil, err
	}
	return foundAdmin, nil
}

// ListAdmins retrieves all admins
func (s *AdminService) ListAdmins(ctx context.Context) ([]*ent.Admin, error) {
	admins, err := s.client.Admin.Query().All(ctx)
	if err != nil {
		return nil, err
	}
	return admins, nil
}

// UpdateAdmin updates an admin's information
func (s *AdminService) UpdateAdmin(ctx context.Context, id uuid.UUID, username, email *string, isActive *bool) (*ent.Admin, error) {
	existingAdmin, err := s.GetAdminByID(ctx, id)
	if err != nil {
		return nil, err
	}

	update := existingAdmin.Update()

	if username != nil && *username != "" {
		update.SetUsername(*username)
	}
	if email != nil && *email != "" {
		update.SetEmail(*email)
	}
	if isActive != nil {
		update.SetIsActive(*isActive)
	}

	updated, err := update.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, ErrUsernameExists
		}
		return nil, err
	}

	return updated, nil
}

// ChangePassword changes an admin's password
func (s *AdminService) ChangePassword(ctx context.Context, id uuid.UUID, oldPassword, newPassword string) error {
	if oldPassword == "" || newPassword == "" {
		return ErrEmptyPassword
	}

	existingAdmin, err := s.GetAdminByID(ctx, id)
	if err != nil {
		return err
	}

	// Verify old password
	err = bcrypt.CompareHashAndPassword([]byte(existingAdmin.PasswordHash), []byte(oldPassword))
	if err != nil {
		return ErrInvalidCredentials
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password
	_, err = existingAdmin.Update().
		SetPasswordHash(string(hashedPassword)).
		Save(ctx)

	return err
}

// DeleteAdmin deletes an admin
func (s *AdminService) DeleteAdmin(ctx context.Context, id uuid.UUID) error {
	existingAdmin, err := s.GetAdminByID(ctx, id)
	if err != nil {
		return err
	}

	return s.client.Admin.DeleteOne(existingAdmin).Exec(ctx)
}
