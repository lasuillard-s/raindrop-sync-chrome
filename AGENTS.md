# Agent Rules — raindrop-sync-chrome

## Project Overview

**Raindrop Sync for Chrome** is a Chrome browser extension (Manifest V3) that performs a one-way sync from Raindrop.io bookmarks into Chrome's native bookmark store.

- **Framework**: Svelte 5 + TypeScript, bundled with Vite + `@crxjs/vite-plugin`
- **UI**: Flowbite-Svelte components on top of Tailwind CSS v4
- **Schema validation**: Zod
- **Testing**: Vitest (unit/component), Playwright (e2e)
- **Package manager**: Yarn v1 (`yarn.lock` is committed — **never use npm or pnpm**)
- **Node requirement**: ≥ 24 (enforced via `devEngines`)
- **Task runner**: `just` (see `Justfile`)
- **Dev environment**: Nix Flakes (`flake.nix`) — `nix develop` drops into a shell with all tools

---

## Directory Structure

```
src/
  app.ts              # App singleton — composition root
  service-worker.ts   # Background service worker (browser alarms, runtime events)
  app.css             # Global styles
  assets/             # Static asset imports
  components/         # Shared Svelte components (Message, Tree, PathBreadcrumb, SecretInput)
  config/             # SettingsStore, Settings schema, BrowserSettingsRepository
  lib/
    messages.ts       # Extension messaging types
    raindrop/         # Raindrop.io API adapter
    sync/             # Core sync logic (diff, plan, action, executor, tree, adapters)
      providers/
        chrome/       # Chrome bookmarks adapter
        raindrop/     # Raindrop source adapter
  migrations/         # Versioned data migrations (run on extension update)
  options/            # Options page (multi-tab UI)
  popup/              # Browser action popup
  services/sync/      # SyncService — schedules alarms and orchestrates sync runs
  vite-env.d.ts

tests/                # Unit and component tests (mirrors src/ structure)
  fixtures/           # Shared test fixtures
  helpers/            # Shared test helpers
  setup.ts            # Global test setup (happy-dom)

e2e/                  # Playwright end-to-end tests
  run.sh              # Runs e2e via Docker Compose
```

### Path Aliases (from `tsconfig.json`)

| Alias | Maps to |
|---|---|
| `$app` | `src/app.ts` |
| `$app.css` | `src/app.css` |
| `$assets/*` | `src/assets/*` |
| `$components/*` | `src/components/*` |
| `$config` / `$config/*` | `src/config/` |
| `$migrations` / `$migrations/*` | `src/migrations/` |
| `$services/*` | `src/services/*` |
| `$lib/*` | `src/lib/*` |
| `$fixtures/*` | `tests/fixtures/*` |
| `$test-helpers/*` | `tests/helpers/*` |

Always use these path aliases in imports — never use long relative paths.

---

## Key Architectural Patterns

### App Singleton
`App` (in `src/app.ts`) is the composition root. Access it via `App.getInstance()` in the service worker. For UI pages (popup, options), create a fresh instance or inject dependencies via the constructor.

### SettingsStore
- Uses Svelte stores internally; exposed as `$data`, `$state`, `$error` observables
- Always call `await settings.ready()` before reading `settings.snapshot`
- `SettingsStore.getOrCreate()` returns the shared singleton

### Sync Pipeline
The sync logic lives in `src/lib/sync/` and follows a clear pipeline:
1. **Adapters** (`providers/chrome`, `providers/raindrop`) — fetch source and target bookmark trees
2. **`tree.ts`** — represents bookmarks as a unified tree
3. **`diff.ts`** — computes difference between source and target trees
4. **`plan.ts`** — converts diff into an ordered list of actions
5. **`action.ts`** / **`executor.ts`** — executes the plan against the Chrome bookmarks API

When adding new sync behaviour, follow this pipeline rather than adding ad-hoc logic in the service worker.

### Migrations
Versioned migrations live in `src/migrations/`. Each file is named `NNN_description.ts` and must export a migration compatible with `MigrationContext`. Register new migrations in `src/migrations/index.ts`. Migrations run automatically on extension update inside the service worker's `onInstalled` listener.

---

## Development Commands

```bash
# Install JS deps + Playwright Chromium
just install

# Run full CI checks (format check, lint, unit tests, e2e)
just ci

# Format code
just fmt          # check only
just fmt --check=no  # write changes

# Lint (ESLint + svelte-check)
just lint

# Unit tests
just test

# E2e tests (builds first, runs via Docker)
just e2e

# Auto-fix linting and formatting issues
just fix

# Build extension
just build

# Dev server + browser with extension loaded
just run --browser

# Clean build artifacts
just clean
```

> **Before opening a PR**, always run `just ci` and make sure all checks pass.

---

## Code Style

- **Indentation**: tabs (configured in `.editorconfig` and Prettier)
- **Quotes**: single quotes in TypeScript/JavaScript
- **Trailing commas**: none
- **Print width**: 100 characters
- **Svelte**: use the `prettier-plugin-svelte` parser; Tailwind class ordering is enforced via `prettier-plugin-tailwindcss`
- **TypeScript**: strict mode is enabled; avoid `any` (ESLint rule is set to `off` as an escape hatch, but prefer proper types)
- **JSDoc**: required on exported functions/classes (enforced by `eslint-plugin-jsdoc`)
- **Browser polyfill**: the `browser` global is set to `webextension-polyfill` in `service-worker.ts`. In UI code, import from `webextension-polyfill` directly where needed.

---

## Testing Guidelines

- Unit tests live under `tests/` mirroring the `src/` structure
- Use `happy-dom` as the DOM environment (configured via `tests/setup.ts`)
- Use `@testing-library/svelte` for component tests
- Use `@faker-js/faker` for generating test data
- Fixtures go in `tests/fixtures/`, helpers in `tests/helpers/`
- E2e tests load the built extension into a real Chromium instance via Playwright

---

## Extension-Specific Notes

- Extension uses **Manifest V3** — service workers are ephemeral; do not store state in module-level variables across alarm callbacks. Persist state to `browser.storage`.
- The `onStartup` listener may not fire when the extension is loaded via `--load-extension` (see comment in `service-worker.ts`). Test startup behaviour by restarting the browser without that flag.
- Permissions in use: `identity`, `storage`, `bookmarks`, `alarms`
- Host permissions: `https://api.raindrop.io/*` (plus `http://localhost:5173/*` in dev mode)
