# Work Log And Roadmap

## Latest Completed Work
- Rebuilt the Pinia store around validated actions instead of raw object mutation
- Added normalization for `localStorage` data and persisted theme preference
- Refined the library, detail, and dashboard views for stronger empty/error states
- Added cover URL handling, sorting, and review UX improvements
- Replaced outdated tests with scenario-driven Vitest coverage
- Added Playwright configuration and end-to-end browser coverage for core flows
- Updated project docs to reflect the real MVP state

## Roadmap
1. Add external book lookup so users can register books without manual entry
2. Introduce reading activity calendar and lightweight historical insights
3. Add Playwright E2E execution to CI and expand scenario coverage
4. Evaluate backend sync once the local-first UX is stable
