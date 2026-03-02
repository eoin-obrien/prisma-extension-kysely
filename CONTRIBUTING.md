# Contributing

Contributions are welcome. Here's how to get started.

## Setup

1. [Fork the repo](https://github.com/eoin-obrien/prisma-extension-kysely/fork) on GitHub.
2. Clone your fork and install dependencies:

```bash
git clone https://github.com/<your-username>/prisma-extension-kysely.git
cd prisma-extension-kysely
npm ci
```

## Development Workflow

### Build

```bash
npm run build
```

Compiles both ESM and CJS outputs to `dist/`.

### Test

```bash
npm test
```

Runs Vitest against a SQLite database. The `pretest` script automatically runs `prisma db push` to set up the test DB.

### Lint & Format

```bash
# Check for issues
npm run check

# Auto-fix
npm run check:write
```

Uses [Biome](https://biomejs.dev/) for linting and formatting.

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are enforced by commitlint.

```bash
# Interactive commit prompt
npm run commit
```

Examples: `fix: handle null result`, `feat: add postgres dialect support`, `docs: update readme`.

## Pull Requests

1. Fork the repo and create a branch from `main`.
2. Make your changes.
3. Ensure `npm test` and `npm run check` pass.
4. Open a pull request with a clear description of what changed and why.

## Reporting Issues

Use the [issue templates](https://github.com/eoin-obrien/prisma-extension-kysely/issues/new/choose) for bug reports and feature requests.
