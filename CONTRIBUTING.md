# ❤️‍🔥 Contributing to this project

Thank you for your interest in contributing to **Raindrop Sync for Chrome**!

## 🐛 Reporting issues

Please report issues in the [GitHub issue tracker](https://github.com/lasuillard-s/raindrop-sync-chrome/issues). Search for existing issues first to avoid duplicates.

## 🏗️ Project overview

This project is a Chrome extension for syncing bookmarks from Raindrop.io into Chrome bookmarks. It uses the Raindrop client, Chrome extension APIs, and a Svelte-based UI.

### 🛠️ Tech stack

- [Svelte](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) and [`@crxjs/vite-plugin`](https://crxjs.dev/vite-plugin/) for Chrome extension development
- [ESLint](https://eslint.org/), [Prettier](https://prettier.io/) for linting and formatting
- [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)

### 📂 Key directory structure

- `docs/`: Documentation resources
- `e2e/`: End-to-end tests and helpers
- `public/`: Static assets copied into builds
- `src/`: Extension source code
- `tests/`: Unit and component tests
- `flake.nix`: Nix Flakes configuration for the development environment
- `Justfile`: Local build and development tasks
- `manifest.config.ts`: Extension manifest configuration
- `package.json`: Project metadata and dependencies

## 🔧 Set up the development environment

This repository uses [Nix Flakes](https://nix.dev/concepts/flakes.html) for the development shell. The shell installs the following tools:

- `pre-commit`
- `just`
- `nodejs_24`
- `yarn`

Run `nix develop` to enter the development shell and `just install` to install JavaScript dependencies and Playwright's Chromium build. Note that containerized end-to-end testing (`yarn run e2e-docker`) requires Docker and Docker Compose which is not managed by the Nix Flakes environment. You may need to install them separately.

If you prefer a containerized setup, copy the checked-in `.devcontainer.example` folder to `.devcontainer` and use that local directory.

## ✅ Verifying changes

Run `just ci` before opening a pull request. This checks code formatting, linting, and tests.

## ✨ Submitting changes

Please submit pull requests on GitHub. Keep changes focused, and make sure the relevant checks pass before requesting review.

## 🚀 Release process

Releases are prepared and published through GitHub Actions:

1. Dispatch the [Prepare Release](https://github.com/lasuillard-s/raindrop-sync-chrome/actions/workflows/prepare-release.yaml) workflow with the next semver tag, for example `v0.8.0`.
2. Review and merge the release-preparation pull request.
3. Create and publish the GitHub release for that tag.
4. The [Release](./.github/workflows/release.yaml) workflow runs automatically and publishes the extension to the Chrome Web Store.
