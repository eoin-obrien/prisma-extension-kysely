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

# Lint and format
npm run lint
npm run format:check
npm run format   # auto-fix
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

The project has been unmaintained for ~12 months. Here is the prioritized work based on open issues and PRs:

### High Priority

1. **Prisma 7 support (PR #336, Issue #292)** — Prisma 7 introduces a driver adapter architecture that is a breaking change. PR #336 (community-contributed) bumps to v4.0.0 and updates the extension to use driver adapters. This is the most impactful pending change and requires a major version release. Review and merge or rebase this PR.

2. **Fix Prisma client import path (PR #208, current branch `patch-1`)** — The extension imports from `@prisma/client/extension` directly, which breaks when users configure a custom Prisma output path in `schema.prisma`. The staged change on the current branch addresses this (related to Issue #245).

3. **Pin peer dependency version (Issue #289)** — `@prisma/client: "latest"` in `peerDependencies` is fragile. Should be pinned to a specific major version range (e.g., `"^5.0.0 || ^6.0.0"` for the current v3.x, and `"^7.0.0"` for v4.x).

### Medium Priority

4. **Transaction reliability (Issue #71)** — Ongoing reports that `tx.$kysely` inside `prisma.$transaction` doesn't always use the transaction client. The current implementation uses a Proxy to wrap `$transaction` — verify this works correctly across Prisma versions and consider adding integration tests.

5. **Update Kysely to ^0.28.0 (PR #227)** — Kysely has had breaking changes since the currently pinned ^0.27.0.

6. **Update `@prisma/extension-read-replicas` to ^0.5.0 (PR #323)**.

### Dependency Hygiene (Renovate PRs)

Renovate has many open PRs for major bumps (ESLint v10, commitlint v20, etc.). These can be merged once the main feature work is settled.
