# Project Instructions

This repository is a Chrome extension that synchronizes Raindrop.io collections into Chrome bookmarks (one-way sync).

## Build and Test Commands

Use Yarn scripts for direct tasks for common workflows.

- Install dependencies: `yarn install`
- Install browser test deps: `yarn run playwright install --with-deps`
- Dev server: `yarn run dev`
- Build extension: `yarn run build`
- Format (write): `yarn run fmt`
- Format check: `yarn run fmt:check`
- Lint: `yarn run lint`
- Lint with fixes: `yarn run lint:fix`
- Type check (Svelte + TS): `yarn run check`
- Unit tests: `yarn run test`
- E2E tests (local): `yarn run e2e`
- E2E tests (Docker): `yarn run e2e-docker`

Recommended full verification before merge:

- `yarn run fmt:check && yarn run lint && yarn run check && yarn run test`

## Definition of Done

A task is complete only when all of the following are true:

1. `yarn run fmt:check` exits 0.
2. `yarn run lint` exits 0.
3. `yarn run check` exits 0.
4. `yarn run test` exits 0 with no failing unit tests.
5. Relevant tests are added or updated for behavior changes.
6. Extension-specific risks are addressed (permissions, storage, background worker behavior).
7. PR description explains what changed, why, and how it was validated.

## When Writing Code

- Use strict TypeScript and avoid `any` unless justified.
- Keep logic in `src/lib/` and UI concerns in Svelte components/pages.
- Follow Manifest V3 constraints for background/service-worker code.
- Prefer small, composable functions and explicit types for public interfaces.
- Validate data crossing boundaries (API responses, Chrome storage, message passing).
- Run targeted checks after changes:
    - Single area formatting/linting as needed.
    - `yarn run check` for type and Svelte diagnostics.
    - `yarn run test` for unit-level verification.

## When Reviewing Code

- Confirm behavior matches the change intent and does not regress sync semantics.
- Check edge cases around bookmark tree mutations, duplicate handling, and empty collections.
- Verify Chrome extension security posture:
    - Least-privilege permissions in manifest.
    - No unsafe handling of external or user-provided content.
    - No secrets or tokens committed.
- Ensure tests cover critical paths and failure handling.
- Require evidence of validation commands in PR notes.

## When Blocked

- If a command or test fails, capture the exact command and full error output.
- Attempt at most 3 focused fixes for the same failing issue.
- If still failing after 3 attempts, stop and report:
    - What you tried.
    - The current failing output.
    - Suspected root cause.
    - What input/help is needed.
- If dependencies or tooling are missing, check `package.json`, lockfile, and Make targets first.
- Never resolve blockers by deleting tests, bypassing checks, or weakening validation.
- Never force push or rewrite shared history unless explicitly requested.

## Project Context

- Frontend: Svelte 5 + TypeScript 5
- Build: Vite + `@crxjs/vite-plugin`
- Styling: TailwindCSS + Flowbite Svelte
- API integration: Axios + `@lasuillard/raindrop-client`
- Unit tests: Vitest
- E2E tests: Playwright

## Key Paths

- `src/` main extension source
- `src/lib/` core sync and settings logic
- `src/components/` reusable UI components
- `src/options/` options page
- `src/popup/` popup page
- `tests/` unit tests
- `e2e/` end-to-end tests
