# BIR Notebook

## Workspace Commands
- `pnpm web|server|shared` - Run single app in dev mode
- `pnpm typecheck` - Run type check on all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all packages

## Server Commands (apps/server)
- `make:migration` - Create new migration
- `migration:run` - Run pending migrations
- `migration:rollback` - Rollback last migration

## Deployment
Tag a release to trigger CI/CD:
```bash
git tag v1.0.0 && git push origin v1.0.0
```
This builds and pushes Docker images to GHCR, then deploys to Digital Ocean.

## Architecture
| Directory | Purpose |
|-----------|---------|
| `apps/web` | React SPA, TanStack Router, Tailwind CSS |
| `apps/server` | H3 server, Kysely ORM, better-auth |
| `apps/shared` | Shared types and utilities |

## Tech Stack
- Backend: H3, Kysely, PostgreSQL
- Frontend: React 19, TanStack Router, Tailwind CSS v4
- Auth: better-auth
- Linter: Biome

## Database
- PostgreSQL with Kysely query builder
- Migrations in `apps/server/database/migrations`