# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code. Route views live in `src/views/`, shared state is in `src/stores/`, router setup is in `src/router/`, and domain types are in `src/types/`. Test helpers and mock fixtures live in `src/test-utils/`. Static assets belong in `src/assets/` or `public/` depending on whether they should be bundled. Project notes and product docs are kept at the repo root in files such as `PRD.md` and `PROJECT_STATUS.md`.

## Build, Test, and Development Commands
- `yarn dev`: start the Vite development server.
- `yarn build`: run `vue-tsc` and produce a production build in `dist/`.
- `yarn preview`: serve the built app locally for a final check.
- `yarn test --run`: execute the Vitest suite once.
- `yarn test:coverage`: generate coverage reports (`text`, `html`, `json-summary`).

Run commands from the repository root: `cd /Users/sky/work/01_project/book-review-app`.

## Coding Style & Naming Conventions
Use TypeScript and Vue 3 Composition API patterns already present in the repo. Match the existing style: 2-space indentation, single quotes, semicolon-free statements, and concise comments only where logic is not obvious. Name Vue views and components in PascalCase (`BookDetailView.vue`), composable-style Pinia stores with `use...Store`, and tests with `*.test.ts`. Keep route names kebab-case (`book-detail`).

There is no dedicated formatter or linter configured, so rely on `yarn build` to catch TypeScript issues such as unused imports and invalid signatures.

## Testing Guidelines
Tests use Vitest with `happy-dom` and Vue Test Utils. Place store tests next to the store (`src/stores/book.test.ts`) and view tests next to the view (`src/views/DashboardView.test.ts`). Reuse `src/test-utils/setup.ts` for Pinia and `localStorage` setup. Coverage excludes `src/test-utils/`, `**/*.test.ts`, `**/*.spec.ts`, and `src/types/`; keep new logic covered at the store or view level.

## Commit & Pull Request Guidelines
Recent history uses short, imperative commits with prefixes such as `docs:`, `ci:`, and plain action phrases. Follow that pattern, for example: `feat: add review form validation`. Keep PRs focused and include:
- a brief summary of user-visible changes
- linked issue or task when available
- test evidence (`yarn test --run`, `yarn build`)
- screenshots for UI changes affecting `src/views/`

## Architecture & Configuration Notes
The app is a client-only MVP using Pinia plus `localStorage` persistence with the key `booklog-books`. Avoid introducing secrets into the frontend; use Vite env vars only for public client configuration.
