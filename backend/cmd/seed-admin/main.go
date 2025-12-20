package main

import (
"context"
"fmt"
"log"
"os"

_ "github.com/lib/pq"

"github.com/mafia-night/backend/ent"
"github.com/mafia-night/backend/internal/service"
)

func main() {
// Database connection
dbURL := os.Getenv("DATABASE_URL")
if dbURL == "" {
dbURL = "postgres://mafia_user:mafia_pass@localhost:5432/mafia_night?sslmode=disable"
}

client, err := ent.Open("postgres", dbURL)
if err != nil {
log.Fatalf("failed opening connection to postgres: %v", err)
}
defer client.Close()

ctx := context.Background()

// Create admin service
adminService := service.NewAdminService(client)

// Check if any admin exists
admins, err := adminService.ListAdmins(ctx)
if err != nil {
log.Fatalf("failed to check existing admins: %v", err)
}

if len(admins) > 0 {
fmt.Println("Admin user already exists. Skipping creation.")
for _, admin := range admins {
fmt.Printf("  - %s (%s)\n", admin.Username, admin.Email)
}
return
}

// Create default admin
username := os.Getenv("ADMIN_USERNAME")
if username == "" {
username = "admin"
}

email := os.Getenv("ADMIN_EMAIL")
if email == "" {
email = "admin@mafianight.local"
}

password := os.Getenv("ADMIN_PASSWORD")
if password == "" {
password = "admin123"
fmt.Println("⚠️  WARNING: Using default password 'admin123'")
fmt.Println("⚠️  Please change it immediately after first login!")
}

admin, err := adminService.CreateAdmin(ctx, username, email, password)
if err != nil {
log.Fatalf("failed to create admin: %v", err)
}

fmt.Printf("✓ Admin user created successfully:\n")
fmt.Printf("  Username: %s\n", admin.Username)
fmt.Printf("  Email: %s\n", admin.Email)
fmt.Printf("  ID: %s\n", admin.ID)
}
