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
npx jest path/to/test.spec.ts

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
- **[src/connection.ts](src/connection.ts)** — `PrismaConnection` implements Kysely's `DatabaseConnection`. Routes SELECT queries through `$queryRawUnsafe` and mutation queries (INSERT/UPDATE/DELETE) without a RETURNING clause through `$executeRawUnsafe` (returning affected row count as a BigInt).

### Dual Package Build

The package is published as a dual ESM/CJS package:

- [tsconfig.json](tsconfig.json) compiles to `dist/esm` (ES2022 modules)
- [tsconfig.cjs.json](tsconfig.cjs.json) compiles to `dist/cjs` (CommonJS)
- `tsconfig-to-dual-package` generates the `package.json` markers for each output directory

### Tests

Tests use Jest + ts-jest in ESM mode ([jest.config.mjs](jest.config.mjs)). The test database is SQLite at [prisma/dev.db](prisma/dev.db), set up via `prisma db push` (the `pretest` script). The Prisma schema at [prisma/schema.prisma](prisma/schema.prisma) also generates Kysely types via `prisma-kysely` to [prisma/generated/types.ts](prisma/generated/types.ts).

### Examples

Runnable examples live in [examples/](examples/) (basic, camel-case, esm, logging, read-replica). Each is a self-contained project with its own `package.json` and Prisma schema. They are run in CI but are not part of the main test suite.

## Go-Forward Plan (as of Feb 2026)

### Active

1. **Prisma 7 support (PR #336, Issue #292)** — Prisma 7 introduces a driver adapter architecture that is a breaking change. PR #336 (community-contributed) bumps to v4.0.0 and updates the extension to use driver adapters. This is the most impactful pending change and requires a major version release. Review and merge or rebase this PR.

2. **Transaction reliability (Issue #71)** — Reports that `tx.$kysely` inside `prisma.$transaction` doesn't always use the transaction client. The current Proxy-based implementation is covered by 30 integration tests (all passing). Monitor for new reproduction cases; likely a v4 concern.

### Completed (v3.x)

- ✅ **Fix Prisma client import path (Issue #245)** — `src/index.ts` now imports `Prisma` from `@prisma/client/extension`, consistent with `driver.ts` and `connection.ts`. Fixes failures when a custom Prisma output path is configured.
- ✅ **Pin peer dependency version (Issue #289)** — `peerDependencies` now specifies `"@prisma/client": "^5.0.0 || ^6.0.0"`.
- ✅ **Kysely ^0.27 + ^0.28 both supported** — `peerDependencies` and `devDependencies` updated.
- ✅ **Publishing overhauled** — Replaced release-please + npm token with semantic-release + npm OIDC trusted publishing (`workflow_dispatch` trigger, no long-lived secrets). See `.github/workflows/release.yml` and `.releaserc.json`.
- ✅ **Renovate replaced with Dependabot** — Weekly grouped updates via `.github/dependabot.yml`.
- ✅ **Dependency hygiene** — commitlint v20, ts-jest v30, Biome v2.

### Intentionally Deferred to v4

- `@prisma/extension-read-replicas@^0.5.0` requires Prisma 7 — will be picked up as part of the v4 work.
