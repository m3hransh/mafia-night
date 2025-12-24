package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestNewJWTService(t *testing.T) {
	secret := "test-secret"
	issuer := "test-issuer"

	service := NewJWTService(secret, issuer)

	if service == nil {
		t.Fatal("NewJWTService returned nil")
	}

	if string(service.secretKey) != secret {
		t.Errorf("Expected secret key %s, got %s", secret, string(service.secretKey))
	}

	if service.issuer != issuer {
		t.Errorf("Expected issuer %s, got %s", issuer, service.issuer)
	}
}

func TestGenerateToken(t *testing.T) {
	service := NewJWTService("test-secret", "test-issuer")
	adminID := uuid.New()
	username := "testuser"

	token, err := service.GenerateToken(adminID, username)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	if token == "" {
		t.Fatal("GenerateToken returned empty token")
	}

	// Verify token can be parsed
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte("test-secret"), nil
	})

	if err != nil {
		t.Fatalf("Failed to parse generated token: %v", err)
	}

	if !parsedToken.Valid {
		t.Error("Generated token is not valid")
	}
}

func TestValidateToken_ValidToken(t *testing.T) {
	service := NewJWTService("test-secret", "test-issuer")
	adminID := uuid.New()
	username := "testuser"

	// Generate a token
	token, err := service.GenerateToken(adminID, username)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	// Validate the token
	claims, err := service.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims == nil {
		t.Fatal("ValidateToken returned nil claims")
	}

	if claims.AdminID != adminID {
		t.Errorf("Expected admin ID %s, got %s", adminID, claims.AdminID)
	}

	if claims.Username != username {
		t.Errorf("Expected username %s, got %s", username, claims.Username)
	}

	if claims.Issuer != "test-issuer" {
		t.Errorf("Expected issuer test-issuer, got %s", claims.Issuer)
	}
}

func TestValidateToken_InvalidToken(t *testing.T) {
	service := NewJWTService("test-secret", "test-issuer")

	tests := []struct {
		name  string
		token string
	}{
		{
			name:  "empty token",
			token: "",
		},
		{
			name:  "malformed token",
			token: "not.a.valid.token",
		},
		{
			name:  "invalid signature",
			token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := service.ValidateToken(tt.token)
			if err == nil {
				t.Error("Expected error for invalid token, got nil")
			}
			if claims != nil {
				t.Error("Expected nil claims for invalid token")
			}
		})
	}
}

func TestValidateToken_WrongSecret(t *testing.T) {
	service1 := NewJWTService("secret1", "test-issuer")
	service2 := NewJWTService("secret2", "test-issuer")

	adminID := uuid.New()
	username := "testuser"

	// Generate token with service1
	token, err := service1.GenerateToken(adminID, username)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	// Try to validate with service2 (different secret)
	claims, err := service2.ValidateToken(token)
	if err == nil {
		t.Error("Expected error when validating with wrong secret")
	}
	if claims != nil {
		t.Error("Expected nil claims when validating with wrong secret")
	}
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	service := NewJWTService("test-secret", "test-issuer")
	adminID := uuid.New()

	// Create token that expired 1 hour ago
	claims := JWTClaims{
		AdminID:  adminID,
		Username: "testuser",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "test-issuer",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("Failed to create expired token: %v", err)
	}

	// Try to validate expired token
	validatedClaims, err := service.ValidateToken(tokenString)
	if err == nil {
		t.Error("Expected error for expired token")
	}
	if validatedClaims != nil {
		t.Error("Expected nil claims for expired token")
	}
}

func TestJWTClaims_Structure(t *testing.T) {
	adminID := uuid.New()
	username := "testuser"

	claims := JWTClaims{
		AdminID:  adminID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "test-issuer",
		},
	}

	if claims.AdminID != adminID {
		t.Errorf("Expected AdminID %s, got %s", adminID, claims.AdminID)
	}

	if claims.Username != username {
		t.Errorf("Expected Username %s, got %s", username, claims.Username)
	}

	if claims.Issuer != "test-issuer" {
		t.Errorf("Expected Issuer test-issuer, got %s", claims.Issuer)
	}
}
