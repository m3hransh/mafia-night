# Admin Management System Implementation

## ✅ Completed - Backend

### 1. Database Schema
**File**: `backend/ent/schema/admin.go`
- Admin user entity with fields:
  - id (UUID)
  - username (unique)
  - email (unique)
  - password_hash (bcrypt)
  - is_active (boolean)
  - created_at, updated_at, last_login timestamps

### 2. Admin Service
**File**: `backend/internal/service/admin_service.go`
- `CreateAdmin()` - Create new admin users
- `Login()` - Authenticate with username/password
- `GetAdminByID()` - Retrieve admin by ID
- `ListAdmins()` - Get all admins
- `UpdateAdmin()` - Update admin information
- `ChangePassword()` - Change admin password
- `DeleteAdmin()` - Delete admin user
- Bcrypt password hashing
- Email and username uniqueness validation

### 3. Role Service (Extended)
**File**: `backend/internal/service/role_service.go`
- Added `GetRoleByID()` - Get role by UUID
- Added `CreateRole()` - Create new roles
- Added `UpdateRole()` - Update existing roles
- Added `DeleteRole()` - Delete roles
- Validation for name and slug uniqueness

### 4. Admin Handler
**File**: `backend/internal/handler/admin_handler.go`
- POST `/api/admin/login` - Admin login
- POST `/api/admin/users` - Create admin
- GET `/api/admin/users` - List all admins
- GET `/api/admin/users/{id}` - Get admin details
- PATCH `/api/admin/users/{id}` - Update admin
- DELETE `/api/admin/users/{id}` - Delete admin
- POST `/api/admin/users/{id}/change-password` - Change password

### 5. Role Handler (Extended)
**File**: `backend/internal/handler/role_handler.go`
- POST `/api/admin/roles` - Create role
- PATCH `/api/admin/roles/{id}` - Update role
- DELETE `/api/admin/roles/{id}` - Delete role

### 6. Authentication Middleware
**File**: `backend/cmd/api/main.go`
- `adminAuthMiddleware()` - Validates X-Admin-Token header
- Checks if admin exists and is active
- Protects all admin routes

### 7. Admin Seed Command
**File**: `backend/cmd/seed-admin/main.go`
- Creates initial admin user
- Environment variables:
  - `ADMIN_USERNAME` (default: "admin")
  - `ADMIN_EMAIL` (default: "admin@mafianight.local")
  - `ADMIN_PASSWORD` (default: "admin123")
- Checks if admin already exists
- Run with: `go run ./cmd/seed-admin`

### 8. API Routes
Protected admin routes (require X-Admin-Token header):
```
POST   /api/admin/login
POST   /api/admin/users
GET    /api/admin/users
GET    /api/admin/users/{id}
PATCH  /api/admin/users/{id}
DELETE /api/admin/users/{id}
POST   /api/admin/users/{id}/change-password
POST   /api/admin/roles
PATCH  /api/admin/roles/{id}
DELETE /api/admin/roles/{id}
```

## 🚧 TODO - Frontend

### 1. Admin Login Page
**File**: `frontend/app/admin/page.tsx`
- Login form (username, password)
- Store auth token in localStorage
- Redirect to admin dashboard

### 2. Admin Dashboard
**File**: `frontend/app/admin/dashboard/page.tsx`
- Overview of system stats
- Quick actions
- Links to management pages

### 3. Role Management Page
**File**: `frontend/app/admin/roles/page.tsx`
- List all roles in a table
- Add new role button
- Edit/Delete actions per role
- Search/filter roles

### 4. Role Create/Edit Form
**File**: `frontend/app/admin/roles/[id]/page.tsx` or modal
- Form fields:
  - Name
  - Slug
  - Video URL
  - Description
  - Team (dropdown: mafia/village/independent)
  - Abilities (array input)
- Form validation
- Submit to API

### 5. Admin User Management (Optional)
**File**: `frontend/app/admin/users/page.tsx`
- List admins
- Create/Edit/Delete admins
- Change password

### 6. API Client
**File**: `frontend/lib/api.ts` or `frontend/lib/adminApi.ts`
- Add admin API functions:
  - `adminLogin(username, password)`
  - `getRoles()` - with auth
  - `createRole(roleData, token)`
  - `updateRole(id, roleData, token)`
  - `deleteRole(id, token)`

### 7. Auth Context/Hook
**File**: `frontend/lib/adminAuth.ts` or context
- Store admin token
- Auth guard for admin pages
- Logout function
- Token validation

## 📝 Usage Instructions

### Backend Setup

1. **Run Migrations** (creates admin table):
```bash
cd backend
go run ./cmd/migrate
```

2. **Create Initial Admin**:
```bash
# With defaults (username: admin, password: admin123)
go run ./cmd/seed-admin

# With custom credentials
ADMIN_USERNAME=superadmin ADMIN_PASSWORD=secure123 ADMIN_EMAIL=admin@example.com go run ./cmd/seed-admin
```

3. **Start API Server**:
```bash
go run ./cmd/api
```

### Testing Admin API

1. **Login**:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
echo "Admin Token: $TOKEN"
```

2. **Create Role**:
```bash
curl -X POST http://localhost:8080/api/admin/roles \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{
    "name": "Test Role",
    "slug": "test-role",
    "video": "https://example.com/video.webm",
    "description": "A test role",
    "team": "village",
    "abilities": ["Can test things"]
  }'
```

3. **List All Roles**:
```bash
curl http://localhost:8080/api/roles
```

4. **Update Role**:
```bash
ROLE_ID="<role-uuid>"
curl -X PATCH http://localhost:8080/api/admin/roles/$ROLE_ID \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"name": "Updated Role Name"}'
```

5. **Delete Role**:
```bash
curl -X DELETE http://localhost:8080/api/admin/roles/$ROLE_ID \
  -H "X-Admin-Token: $TOKEN"
```

## 🔐 Security Notes

1. **Default Password**: Change the default admin password immediately in production
2. **Token Storage**: Current implementation uses admin ID as token (simple but insecure)
3. **Production**: Replace with JWT tokens with expiration
4. **HTTPS**: Always use HTTPS in production
5. **Password Policy**: Consider adding password strength requirements
6. **Rate Limiting**: Add rate limiting to login endpoint

## 📊 Database Schema

### admins table
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_login TIMESTAMP
);
```

## 🎯 Next Steps

1. **Implement Frontend Admin Pages**:
   - Login page
   - Role management UI
   - Admin dashboard

2. **Improve Security**:
   - Implement JWT tokens
   - Add token expiration
   - Add refresh tokens
   - Add CORS for admin frontend

3. **Add Features**:
   - Role templates
   - Bulk role import/export
   - Audit logs for admin actions
   - Admin permissions (super admin vs regular admin)

4. **Testing**:
   - Add unit tests for admin service
   - Add integration tests for admin endpoints
   - Add E2E tests for admin panel

## ✅ Backend Complete!

The backend admin system is fully functional and ready to use. You can now:
- Create admin users
- Authenticate admins
- Create, update, and delete roles via API
- Manage admin users

The frontend admin panel needs to be built to provide a UI for these features.
