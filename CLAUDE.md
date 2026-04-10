# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm ci

# Build (both ESM and CJS outputs)
npm run build

# Run tests (automatically runs `prisma db push` first to set up the SQLite test DB)
npm test

# Run a single test file
npx vitest run path/to/test.spec.ts

# Watch mode
npm run test:watch

# Lint and format check (Biome)
npm run check

# Lint and format auto-fix
npm run check:write
```

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint. Use `npm run commit` for an interactive prompt.

## Architecture

The library is a Prisma Client Extension that bridges Kysely's query builder to Prisma's raw query execution. It has three source files in [src/](src/):

- **[src/index.ts](src/index.ts)** — Entry point. Exports the extension factory function. Uses `Prisma.defineExtension` to attach `$kysely` to the client. Wraps `$transaction` via a `Proxy` so that interactive transactions get a fresh `PrismaDriver`/`PrismaConnection` bound to the transaction client (not the original client).
- **[src/driver.ts](src/driver.ts)** — `PrismaDriver` implements Kysely's `Driver` interface. Transaction methods intentionally throw — Kysely's own transaction API is unsupported; users must use `prisma.$transaction` instead.
- **[src/connection.ts](src/connection.ts)** — `PrismaConnection` implements Kysely's `DatabaseConnection`. Routes SELECT (and any query with a RETURNING clause) through `$queryRaw`, and mutation queries (INSERT/UPDATE/DELETE without RETURNING) through `$executeRaw`. **Both paths use the safe variants with a `Prisma.Sql`-shaped object** (built by `toSqlLike`) — *not* `$queryRawUnsafe`/`$executeRawUnsafe`. On Prisma 7 with driver adapters the unsafe variants escape the interactive transaction connection (writes auto-commit independently); the safe variants route correctly. See issue #71.

### Dual Package Build

The package is published as a dual ESM/CJS package:

- [tsconfig.json](tsconfig.json) compiles to `dist/esm` (ES2022 modules)
- [tsconfig.cjs.json](tsconfig.cjs.json) compiles to `dist/cjs` (CommonJS)
- `tsconfig-to-dual-package` generates the `package.json` markers for each output directory

### Tests

Tests use Vitest ([vitest.config.ts](vitest.config.ts)) and run against **both SQLite and Postgres** — selected at runtime via the `TEST_DB` env var:

- `npm run test:sqlite` — default. Uses SQLite at [prisma/dev.db](prisma/dev.db) and the [prisma/schema.prisma](prisma/schema.prisma) schema. No external dependencies.
- `npm run test:postgres` — boots a local Postgres via [docker-compose.yml](docker-compose.yml) (`db:postgres:up`), pushes the [prisma/postgres.schema.prisma](prisma/postgres.schema.prisma) variant, then runs the same suite under postgres. Requires Docker.
- `npm test` — sqlite only (kept as the contributor-friendly default; CI runs both via a `backend: [sqlite, postgres]` matrix in [.github/workflows/ci.yml](.github/workflows/ci.yml)).

[test/index.test.ts](test/index.test.ts) and [test/driver.test.ts](test/driver.test.ts) pick the prisma adapter (`PrismaBetterSqlite3` vs `PrismaPg`) and the kysely dialect (`SqliteAdapter` vs `PostgresAdapter`) from `TEST_DB`. [test/connection.test.ts](test/connection.test.ts) is a backend-agnostic unit test for the `PrismaConnection` routing logic using a fake prisma client (it does NOT spy on the real prisma client — replacing `$queryRaw` / `$executeRaw` with a bound copy of the original breaks interactive transaction routing). The Prisma schemas also generate Kysely types via `prisma-kysely` to [generated/kysely/types.ts](generated/kysely/types.ts).

### Examples

Runnable examples live in [examples/](examples/) (basic, camel-case, esm, logging, read-replica). Each is a self-contained project with its own `package.json` and Prisma schema. They are run in CI but are not part of the main test suite.

## Go-Forward Plan (as of Apr 2026)

### Active

_(none)_

### Completed (v4.x)

- ✅ **Transaction reliability — postgres concurrency hole (Issue #71)** — Two coupled fixes:
  1. `src/index.ts` no longer mutates `tx.$kysely` inside `$transaction`; it returns a per-call `Proxy` whose `get` trap exposes the tx-bound Kysely. No shared state across concurrent transactions.
  2. `src/connection.ts` switched from `$executeRawUnsafe` / `$queryRawUnsafe` to the safe `$executeRaw` / `$queryRaw` variants with a `Prisma.Sql`-shaped object built by `toSqlLike`. On Prisma 7 + driver adapters the unsafe variants escape the interactive transaction connection and auto-commit; the safe variants route correctly. The whole suite now runs against both SQLite and Postgres in CI to keep this regression caught — SQLite alone masked the bug because better-sqlite3 is single-connection.
- ✅ **Dual-backend test infra** — `TEST_DB` env var, `prisma/postgres.schema.prisma` variant, `docker-compose.yml`, `npm run test:sqlite` / `test:postgres` scripts, and a `backend: [sqlite, postgres]` matrix in CI.

### Completed (v4.0)

- ✅ **Prisma 7 support (Issue #292)** — Prisma 7 introduces a driver adapter architecture as a breaking change. Updated the extension and all examples to use driver adapters. Bumped to v4.0.0. `@prisma/extension-read-replicas@^0.5.0` included.
- ✅ **Migrate tests from Jest to Vitest** — Replaced jest + ts-jest with vitest for native ESM/TypeScript support.

### Completed (v3.x)

- ✅ **Fix Prisma client import path (Issue #245)** — `src/index.ts` now imports `Prisma` from `@prisma/client/extension`, consistent with `driver.ts` and `connection.ts`. Fixes failures when a custom Prisma output path is configured.
- ✅ **Pin peer dependency version (Issue #289)** — `peerDependencies` now specifies `"@prisma/client": "^5.0.0 || ^6.0.0"`.
- ✅ **Kysely ^0.27 + ^0.28 both supported** — `peerDependencies` and `devDependencies` updated.
- ✅ **Publishing overhauled** — Replaced release-please + npm token with semantic-release + npm OIDC trusted publishing (`workflow_dispatch` trigger, no long-lived secrets). See `.github/workflows/release.yml` and `.releaserc.json`.
- ✅ **Renovate replaced with Dependabot** — Weekly grouped updates via `.github/dependabot.yml`.
- ✅ **Dependency hygiene** — commitlint v20, Biome v2.
