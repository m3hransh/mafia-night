package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/mafia-night/backend/ent"
)

// JWTAuthMiddleware creates a middleware that validates JWT tokens
func JWTAuthMiddleware(jwtService *JWTService, client *ent.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			// Check for Bearer token
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			// Validate JWT token
			claims, err := jwtService.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			// Verify admin exists and is active
			admin, err := client.Admin.Get(r.Context(), claims.AdminID)
			if err != nil || !admin.IsActive {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			// Add admin ID and username to context for handlers to use
			ctx := context.WithValue(r.Context(), "admin_id", claims.AdminID)
			ctx = context.WithValue(ctx, "admin_username", claims.Username)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
