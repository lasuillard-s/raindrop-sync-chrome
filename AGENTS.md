This project is a Chrome browser extension for syncing bookmarks between Chrome and Raindrop.io, providing one-way synchronization from Raindrop collections to Chrome bookmark folders with automatic background sync.

## Tech Stack

- **Frontend**: Svelte 5 with TypeScript 5
- **Build**: Vite 6 with @crxjs/vite-plugin 2 for extension bundling
- **Styling**: TailwindCSS 4 and Flowbite Svelte 1 for UI
- **HTTP Client**: Axios 1 with @lasuillard/raindrop-client for API integration
- **Testing**: Vitest 2 for unit tests, Playwright 1 for end-to-end testing
- **Code Quality**: ESLint 9 and Prettier 3 with TypeScript

## Project Structure

- `src/` - Main source code with TypeScript and Svelte files
- `src/pages/` - Extension UI pages (options settings, popup interface)
- `src/lib/` - Core business logic (bookmark sync, settings management, Raindrop API)
- `src/components/` - Reusable Svelte UI components
- `tests/` - Unit test suites
- `e2e/` - End-to-end test scenarios

## Development Guidelines

- Use strict TypeScript with comprehensive type annotations
- Follow Chrome Extension Manifest V3 patterns and security requirements
- Implement Svelte stores with Chrome storage API persistence for state
- Apply TailwindCSS utility classes with Flowbite component library
- Write thorough tests for sync algorithms and user interaction flows
- Maintain code consistency with ESLint rules and Prettier formatting
