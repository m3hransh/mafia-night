package service

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/mafia-night/backend/internal/database"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Helper to generate unique usernames/emails
func uniqueID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func TestAdminService_CreateAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	t.Run("creates admin with valid data", func(t *testing.T) {
		username := "testadmin" + uniqueID()
		email := "test" + uniqueID() + "@example.com"
		admin, err := service.CreateAdmin(ctx, username, email, "password123")

		require.NoError(t, err)
		assert.NotEmpty(t, admin.ID)
		assert.Equal(t, username, admin.Username)
		assert.Equal(t, email, admin.Email)
		assert.NotEmpty(t, admin.PasswordHash)
		assert.NotEqual(t, "password123", admin.PasswordHash, "Password should be hashed")
		assert.True(t, admin.IsActive)
		assert.NotZero(t, admin.CreatedAt)
		assert.NotZero(t, admin.UpdatedAt)
	})

	t.Run("fails with empty username", func(t *testing.T) {
		_, err := service.CreateAdmin(ctx, "", "email@example.com", "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyUsername, err)
	})

	t.Run("fails with empty email", func(t *testing.T) {
		_, err := service.CreateAdmin(ctx, "username", "", "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyEmail, err)
	})

	t.Run("fails with empty password", func(t *testing.T) {
		_, err := service.CreateAdmin(ctx, "username", "email@example.com", "")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyPassword, err)
	})

	t.Run("fails with duplicate username", func(t *testing.T) {
		username := "duplicate" + uniqueID()
		_, err := service.CreateAdmin(ctx, username, "unique1"+uniqueID()+"@example.com", "password123")
		require.NoError(t, err)

		_, err = service.CreateAdmin(ctx, username, "unique2"+uniqueID()+"@example.com", "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrUsernameExists, err)
	})

	t.Run("fails with duplicate email", func(t *testing.T) {
		email := "duplicate" + uniqueID() + "@example.com"
		_, err := service.CreateAdmin(ctx, "unique1"+uniqueID(), email, "password123")
		require.NoError(t, err)

		_, err = service.CreateAdmin(ctx, "unique2"+uniqueID(), email, "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrEmailExists, err)
	})
}

func TestAdminService_Login(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	// Create a test admin
	username := "logintest" + uniqueID()
	email := "login" + uniqueID() + "@example.com"
	createdAdmin, err := service.CreateAdmin(ctx, username, email, "correctpassword")
	require.NoError(t, err)

	t.Run("successful login with correct credentials", func(t *testing.T) {
		admin, err := service.Login(ctx, username, "correctpassword")

		require.NoError(t, err)
		assert.Equal(t, createdAdmin.ID, admin.ID)
		assert.Equal(t, username, admin.Username)
		assert.NotNil(t, admin.LastLogin)
	})

	t.Run("fails with incorrect password", func(t *testing.T) {
		_, err := service.Login(ctx, username, "wrongpassword")
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidCredentials, err)
	})

	t.Run("fails with non-existent username", func(t *testing.T) {
		_, err := service.Login(ctx, "nonexistent"+uniqueID(), "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidCredentials, err)
	})

	t.Run("fails with empty username", func(t *testing.T) {
		_, err := service.Login(ctx, "", "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyUsername, err)
	})

	t.Run("fails with empty password", func(t *testing.T) {
		_, err := service.Login(ctx, username, "")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyPassword, err)
	})

	t.Run("fails when admin is inactive", func(t *testing.T) {
		// Create inactive admin
		username := "inactive" + uniqueID()
		email := "inactive" + uniqueID() + "@example.com"
		inactiveAdmin, err := service.CreateAdmin(ctx, username, email, "password123")
		require.NoError(t, err)

		// Deactivate
		isActive := false
		_, err = service.UpdateAdmin(ctx, inactiveAdmin.ID, nil, nil, &isActive)
		require.NoError(t, err)

		// Try to login
		_, err = service.Login(ctx, username, "password123")
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidCredentials, err)
	})
}

func TestAdminService_GetAdminByID(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	t.Run("retrieves existing admin", func(t *testing.T) {
		username := "getbyid" + uniqueID()
		email := "getbyid" + uniqueID() + "@example.com"
		created, err := service.CreateAdmin(ctx, username, email, "password123")
		require.NoError(t, err)

		retrieved, err := service.GetAdminByID(ctx, created.ID)

		require.NoError(t, err)
		assert.Equal(t, created.ID, retrieved.ID)
		assert.Equal(t, created.Username, retrieved.Username)
		assert.Equal(t, created.Email, retrieved.Email)
	})

	t.Run("fails for non-existent admin", func(t *testing.T) {
		// Create and delete an admin to get a valid UUID
		username := "todelete" + uniqueID()
		email := "todelete" + uniqueID() + "@example.com"
		created, err := service.CreateAdmin(ctx, username, email, "password123")
		require.NoError(t, err)

		err = service.DeleteAdmin(ctx, created.ID)
		require.NoError(t, err)

		// Try to get deleted admin
		_, err = service.GetAdminByID(ctx, created.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrAdminNotFound, err)
	})
}

func TestAdminService_ListAdmins(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	t.Run("lists all admins", func(t *testing.T) {
		// Create multiple admins with unique IDs
		id1 := uniqueID()
		_, err := service.CreateAdmin(ctx, "list1-"+id1, "list1-"+id1+"@example.com", "password123")
		require.NoError(t, err)

		time.Sleep(time.Millisecond) // Ensure unique timestamp
		id2 := uniqueID()
		_, err = service.CreateAdmin(ctx, "list2-"+id2, "list2-"+id2+"@example.com", "password123")
		require.NoError(t, err)

		time.Sleep(time.Millisecond)
		id3 := uniqueID()
		_, err = service.CreateAdmin(ctx, "list3-"+id3, "list3-"+id3+"@example.com", "password123")
		require.NoError(t, err)

		admins, err := service.ListAdmins(ctx)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(admins), 3)
	})

	t.Run("returns empty list when no admins exist", func(t *testing.T) {
		// This test is not reliable when run with other tests since they share DB
		// Skip or just verify the service can list admins
		t.Skip("Test isolation issue - database is shared across tests")
	})
}

func TestAdminService_UpdateAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	t.Run("updates username", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "updatetest1-"+id, "update1-"+id+"@example.com", "password123")
		require.NoError(t, err)

		newUsername := "newusername-" + id
		updated, err := service.UpdateAdmin(ctx, admin.ID, &newUsername, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, "newusername-"+id, updated.Username)
		assert.Equal(t, admin.Email, updated.Email)
	})

	t.Run("updates email", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "updatetest2-"+id, "update2-"+id+"@example.com", "password123")
		require.NoError(t, err)

		newEmail := "newemail-" + id + "@example.com"
		updated, err := service.UpdateAdmin(ctx, admin.ID, nil, &newEmail, nil)

		require.NoError(t, err)
		assert.Equal(t, "newemail-"+id+"@example.com", updated.Email)
		assert.Equal(t, admin.Username, updated.Username)
	})

	t.Run("updates is_active status", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "updatetest3-"+id, "update3-"+id+"@example.com", "password123")
		require.NoError(t, err)

		isActive := false
		updated, err := service.UpdateAdmin(ctx, admin.ID, nil, nil, &isActive)

		require.NoError(t, err)
		assert.False(t, updated.IsActive)
	})

	t.Run("fails for non-existent admin", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "todelete2-"+id, "todelete2-"+id+"@example.com", "password123")
		require.NoError(t, err)

		err = service.DeleteAdmin(ctx, admin.ID)
		require.NoError(t, err)

		newUsername := "shouldfail"
		_, err = service.UpdateAdmin(ctx, admin.ID, &newUsername, nil, nil)
		assert.Error(t, err)
		assert.Equal(t, ErrAdminNotFound, err)
	})
}

func TestAdminService_ChangePassword(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	t.Run("changes password successfully", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "pwdtest1-"+id, "pwd1-"+id+"@example.com", "oldpassword")
		require.NoError(t, err)

		err = service.ChangePassword(ctx, admin.ID, "oldpassword", "newpassword")
		require.NoError(t, err)

		// Verify can login with new password
		_, err = service.Login(ctx, "pwdtest1-"+id, "newpassword")
		assert.NoError(t, err)

		// Verify cannot login with old password
		_, err = service.Login(ctx, "pwdtest1-"+id, "oldpassword")
		assert.Error(t, err)
	})

	t.Run("fails with incorrect old password", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "pwdtest2-"+id, "pwd2-"+id+"@example.com", "password123")
		require.NoError(t, err)

		err = service.ChangePassword(ctx, admin.ID, "wrongoldpassword", "newpassword")
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidCredentials, err)
	})

	t.Run("fails with empty old password", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "pwdtest3-"+id, "pwd3-"+id+"@example.com", "password123")
		require.NoError(t, err)

		err = service.ChangePassword(ctx, admin.ID, "", "newpassword")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyPassword, err)
	})

	t.Run("fails with empty new password", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "pwdtest4-"+id, "pwd4-"+id+"@example.com", "password123")
		require.NoError(t, err)

		err = service.ChangePassword(ctx, admin.ID, "password123", "")
		assert.Error(t, err)
		assert.Equal(t, ErrEmptyPassword, err)
	})

	t.Run("fails for non-existent admin", func(t *testing.T) {
		id := uniqueID()
		admin, err := service.CreateAdmin(ctx, "pwdtest5-"+id, "pwd5-"+id+"@example.com", "password123")
		require.NoError(t, err)

		err = service.DeleteAdmin(ctx, admin.ID)
		require.NoError(t, err)

		err = service.ChangePassword(ctx, admin.ID, "password123", "newpassword")
		assert.Error(t, err)
		assert.Equal(t, ErrAdminNotFound, err)
	})
}

func TestAdminService_DeleteAdmin(t *testing.T) {
	client := database.SetupTestDB(t)
	service := NewAdminService(client)
	ctx := context.Background()

	t.Run("deletes existing admin", func(t *testing.T) {
		admin, err := service.CreateAdmin(ctx, "deletetest1", "delete1@example.com", "password123")
		require.NoError(t, err)

		err = service.DeleteAdmin(ctx, admin.ID)
		require.NoError(t, err)

		// Verify admin is deleted
		_, err = service.GetAdminByID(ctx, admin.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrAdminNotFound, err)
	})

	t.Run("fails for non-existent admin", func(t *testing.T) {
		admin, err := service.CreateAdmin(ctx, "deletetest2", "delete2@example.com", "password123")
		require.NoError(t, err)

		// Delete once
		err = service.DeleteAdmin(ctx, admin.ID)
		require.NoError(t, err)

		// Try to delete again
		err = service.DeleteAdmin(ctx, admin.ID)
		assert.Error(t, err)
		assert.Equal(t, ErrAdminNotFound, err)
	})
}
