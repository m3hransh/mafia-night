# OpenAPI Integration Plan for Mafia Night

## Overview
This document outlines a comprehensive plan to integrate OpenAPI specification into the Mafia Night project to improve type safety between the Go backend and TypeScript frontend.

## Current State
- **Backend**: Go with Chi router (assumed from typical Go REST API structure)
- **Frontend**: Next.js/TypeScript with manual type definitions in `lib/api.ts`
- **Issue**: Types are manually maintained and can drift between backend and frontend

## Goals
1. **Single Source of Truth**: Define API contracts in one place
2. **Type Safety**: Auto-generate TypeScript types from backend API spec
3. **Auto-generated Client**: Reduce manual fetch code
4. **API Documentation**: Automatically generate interactive API docs
5. **Runtime Validation**: Validate requests/responses against schema

---

## Solution Architecture

### Option 1: Contract-First (Recommended for New Projects)
Write OpenAPI spec → Generate server stubs + client code

### Option 2: Code-First (Recommended for Existing Projects) ⭐
Write Go code with annotations → Generate OpenAPI spec → Generate TypeScript client

**Recommendation**: Option 2 (Code-First) is better for your existing codebase.

---

## Implementation Plan

### Phase 1: Backend - Generate OpenAPI Spec from Go Code

#### Tool Selection: **swaggo/swag**
- Most popular Go OpenAPI generator (9k+ stars)
- Supports Chi router
- Generates Swagger/OpenAPI 2.0 and 3.0
- Good documentation and community support

**Alternative**: **ogen-go** (newer, experimental)

#### Installation
```bash
cd backend
go install github.com/swaggo/swag/cmd/swag@latest
go get -u github.com/swaggo/http-swagger
```

#### Example Annotation
```go
// @Summary Get all roles
// @Description Retrieves all available roles in the game
// @Tags roles
// @Accept json
// @Produce json
// @Success 200 {array} models.Role
// @Failure 500 {object} ErrorResponse
// @Router /api/roles [get]
func (h *Handler) GetRoles(w http.ResponseWriter, r *http.Request) {
    // Implementation
}
```

#### Generate Spec
```bash
swag init -g cmd/server/main.go -o ./api/docs
```

This creates:
- `api/docs/swagger.json` - OpenAPI 2.0 spec
- `api/docs/swagger.yaml` - YAML version
- `api/docs/docs.go` - Go bindings

#### Serve API Docs
```go
import httpSwagger "github.com/swaggo/http-swagger"

r.Get("/swagger/*", httpSwagger.Handler(
    httpSwagger.URL("/swagger/doc.json"),
))
```

Access at: `http://localhost:8080/swagger/`

---

### Phase 2: Frontend - Generate TypeScript Client

#### Tool Selection Comparison

| Tool | Pros | Cons | Stars |
|------|------|------|-------|
| **openapi-typescript** | Type-only, lightweight, flexible | Requires custom fetch wrapper | 4.5k |
| **openapi-typescript-codegen** | Full client generation | Can be verbose | 2.1k |
| **orval** | React Query/SWR/Axios support | More opinionated | 2.1k |
| **swagger-typescript-api** | Comprehensive, well-maintained | Larger bundle | 3k |

#### Recommended: **openapi-typescript** + **openapi-fetch** ⭐

**Why**: 
- Minimal bundle size
- Type-safe with auto-complete
- Works with native fetch
- No runtime overhead
- Flexible for custom logic

#### Installation
```bash
cd frontend
npm install openapi-typescript openapi-fetch --save-dev
```

#### Configuration (`package.json`)
```json
{
  "scripts": {
    "generate:api": "openapi-typescript http://localhost:8080/swagger/doc.json -o ./types/api.d.ts",
    "generate:api:prod": "openapi-typescript https://api.mafia-night.com/swagger/doc.json -o ./types/api.d.ts"
  }
}
```

#### Generate Types
```bash
npm run generate:api
```

#### Usage Example
```typescript
// lib/api-client.ts
import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

const client = createClient<paths>({ 
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080" 
});

// Type-safe API calls with auto-complete!
export async function fetchRoles() {
  const { data, error } = await client.GET("/api/roles");
  
  if (error) {
    throw new APIError(error.status, error.message);
  }
  
  return data; // Automatically typed as Role[]
}

export async function distributeRoles(
  gameId: string,
  moderatorId: string,
  roles: { role_id: string; count: number }[]
) {
  const { data, error } = await client.POST("/api/games/{gameId}/distribute-roles", {
    params: {
      path: { gameId }
    },
    headers: {
      "X-Moderator-ID": moderatorId
    },
    body: { roles }
  });
  
  if (error) throw new APIError(error.status, error.message);
  return data;
}
```

---

### Phase 3: Alternative - Full Code Generation with Orval

If you want React Query/SWR hooks auto-generated:

#### Installation
```bash
npm install -D orval
```

#### Configuration (`orval.config.ts`)
```typescript
export default {
  'mafia-api': {
    input: 'http://localhost:8080/swagger/doc.json',
    output: {
      mode: 'tags-split',
      target: './lib/api/endpoints.ts',
      schemas: './lib/api/models',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './lib/api/custom-client.ts',
          name: 'customClient',
        },
      },
    },
  },
};
```

#### Generate
```bash
npx orval
```

#### Auto-generated Hooks
```typescript
import { useGetRoles, useDistributeRoles } from '@/lib/api/endpoints';

function RoleList() {
  const { data: roles, isLoading } = useGetRoles();
  const { mutate: distribute } = useDistributeRoles();
  
  // Fully typed!
}
```

---

## Development Workflow

### 1. Make Backend Changes
```bash
cd backend
# Edit your handlers, add comments
vim api/handlers/roles.go

# Generate new OpenAPI spec
swag init -g cmd/server/main.go -o ./api/docs

# Commit the spec
git add api/docs/swagger.json
```

### 2. Update Frontend Types
```bash
cd frontend
# Regenerate types
npm run generate:api

# Types are now in sync!
git add types/api.d.ts
```

### 3. CI/CD Integration
```yaml
# .github/workflows/api-sync.yml
name: API Type Sync

on:
  push:
    paths:
      - 'backend/api/**'
      - 'backend/cmd/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Install swag
        run: go install github.com/swaggo/swag/cmd/swag@latest
      
      - name: Generate OpenAPI spec
        run: |
          cd backend
          swag init -g cmd/server/main.go -o ./api/docs
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Generate TypeScript types
        run: |
          cd frontend
          npm ci
          npm run generate:api
      
      - name: Check for changes
        run: |
          git diff --exit-code || (
            echo "API types are out of sync!"
            exit 1
          )
```

---

## Migration Strategy

### Step 1: Add OpenAPI to Existing Endpoints (Week 1)
1. Install swag in backend
2. Add annotations to 2-3 existing endpoints
3. Generate initial spec
4. Verify with Swagger UI

### Step 2: Frontend Type Generation (Week 1)
1. Install openapi-typescript
2. Generate types from spec
3. Test with one endpoint
4. Compare with manual types

### Step 3: Gradual Migration (Week 2-3)
1. Convert `lib/api.ts` to use generated types
2. Replace manual fetch calls with typed client
3. Add annotations to remaining endpoints
4. Remove manual type definitions

### Step 4: Validation & Testing (Week 3-4)
1. Add request/response validation
2. Update tests to use OpenAPI spec
3. Set up CI/CD pipeline
4. Document for team

---

## Additional Enhancements

### 1. Request/Response Validation (Backend)
```bash
go get github.com/getkin/kin-openapi/openapi3filter
```

```go
// Middleware to validate against OpenAPI spec
func ValidateRequest(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Validate request against OpenAPI schema
        // Return 400 if invalid
        next.ServeHTTP(w, r)
    })
}
```

### 2. Runtime Validation (Frontend)
```bash
npm install zod zod-openapi
```

Convert OpenAPI schemas to Zod schemas for runtime validation.

### 3. Mock Server for Development
```bash
npm install -D @stoplight/prism-cli
prism mock api/docs/swagger.json
```

Test frontend against mock API without backend running.

---

## Recommended Stack

### ✅ Final Recommendation

**Backend**:
- `swaggo/swag` - OpenAPI spec generation
- `http-swagger` - Swagger UI hosting
- `kin-openapi` - Request/response validation (optional)

**Frontend**:
- `openapi-typescript` - Type generation
- `openapi-fetch` - Type-safe fetch client
- Consider `orval` if you want React Query hooks

**DevOps**:
- Git hooks to regenerate types on backend changes
- CI/CD pipeline to verify type sync
- Automated PR checks

---

## Estimated Effort

- **Initial Setup**: 8-12 hours
- **Annotating Existing Endpoints**: 16-24 hours (depends on number of endpoints)
- **Frontend Migration**: 12-16 hours
- **Testing & Validation**: 8-12 hours
- **Documentation**: 4-6 hours

**Total**: ~2-3 weeks (part-time) or 1 week (full-time)

---

## Benefits Summary

✅ **Type Safety**: Compile-time errors for API mismatches  
✅ **Auto-complete**: IDE suggestions for all API calls  
✅ **Documentation**: Always up-to-date API docs  
✅ **Faster Development**: No manual type maintenance  
✅ **Fewer Bugs**: Catch API contract violations early  
✅ **Better DX**: Swagger UI for API exploration  
✅ **Validation**: Optional runtime schema validation  

---

## Resources

- [swaggo/swag](https://github.com/swaggo/swag)
- [openapi-typescript](https://openapi-ts.pages.dev/)
- [openapi-fetch](https://openapi-ts.pages.dev/openapi-fetch/)
- [orval](https://orval.dev/)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [kin-openapi](https://github.com/getkin/kin-openapi)

---

## Next Steps

1. Review this plan with team
2. Choose between `openapi-typescript` vs `orval` for frontend
3. Create proof-of-concept with 1-2 endpoints
4. Measure impact on bundle size and DX
5. Create migration timeline
6. Update development guidelines

