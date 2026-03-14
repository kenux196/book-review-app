# BookLog

BookLog is a client-side reading tracker built with Vue 3, TypeScript, Pinia, and Tailwind CSS. It stores all data in `localStorage`, so the MVP runs without a backend.

## Features
- Add books with title, author, total pages, and optional cover image URL
- Filter by reading status, search by title/author, and sort the library
- Track reading progress with validated reading logs
- Save ratings and reviews for each book
- View dashboard stats for current reads, completed books, and total pages
- Toggle light and dark theme with persisted preference

## Local Development
Run from the repository root:

```bash
yarn install
yarn dev
```

## Quality Checks
```bash
yarn test --run
yarn build
yarn test:e2e
```

For browser UI checks, Playwright is configured with a local Vite web server and writes artifacts to `output/playwright/`.

## Codex Skill
- Reusable Codex skill added at `/Users/sky/.codex/skills/booklog-playwright`
- Use it when adding or maintaining Playwright coverage for this repo

## Data Model Notes
- Books are persisted under `booklog-books`
- Theme preference is persisted under `booklog-theme`
- Invalid or incomplete legacy records are normalized on load when possible

## Current Scope
This MVP is intentionally local-first. External book APIs, cloud sync, reading heatmaps, and file uploads are out of scope for the current version.
