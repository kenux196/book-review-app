# Work Log And Roadmap

## Latest Completed Work (2026-04-10)

- Generated hierarchical AGENTS.md documentation across 11 directories
- Fixed picomatch ReDoS vulnerability via yarn resolutions (nested 2.3.1 → 4.0.3)
- Added Playwright E2E job to GitHub Actions CI (runs in parallel with unit tests)
- Added tag/keyword feature: `tags: string[]` on Book type, `updateTags` store action, add/remove UI in BookDetailView, tag badges on BookListView cards, tag-aware search
- Added ReadingHeatmap component: 52-week GitHub-style activity grid, pages-per-day aggregation from reading logs, 4-level color intensity, month/day labels, legend
- Added MonthlyStats component: last-12-months bar chart, Pages/Books tab toggle, yearly summary, bar hover tooltips — displayed in 2-column grid alongside heatmap
- Expanded E2E test coverage from 3 to 11 scenarios: book deletion, tag add/remove, tag search, form validation errors, localStorage persistence, dashboard stats, status change persistence

## Previous Completed Work

- Rebuilt the Pinia store around validated actions instead of raw object mutation
- Added normalization for `localStorage` data and persisted theme preference
- Refined the library, detail, and dashboard views for stronger empty/error states
- Added cover URL handling, sorting, and review UX improvements
- Replaced outdated tests with scenario-driven Vitest coverage
- Added Playwright configuration and end-to-end browser coverage for core flows
- Updated project docs to reflect the real MVP state

## Roadmap

1. **Supabase backend integration** — replace localStorage with Supabase DB, add Auth (email/social login), enable multi-device sync. Keep `useBookStore` interface intact, swap only the persistence layer.
2. External book search API (Aladin / Kyobo) so users can register books without manual entry
3. Social features — share books with friends, comments
4. Reading timer — track time spent per session
