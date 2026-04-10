<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# book-review-app (BookLog)

## Purpose
독서 기록 관리 앱(BookLog). Vue 3 + TypeScript + Pinia + Tailwind CSS 기반의 클라이언트 전용 SPA.
책 추가/수정/삭제, 독서 진행률 추적, 독서 일지 작성, 별점/리뷰, 대시보드 통계를 제공한다.
데이터는 localStorage에 저장되며 별도 백엔드 없이 동작한다.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | 의존성 및 스크립트 정의 |
| `vite.config.ts` | Vite 빌드 설정 (Vue 플러그인) |
| `vitest.config.ts` | Vitest 단위 테스트 설정 (happy-dom, coverage v8) |
| `playwright.config.ts` | Playwright E2E 테스트 설정 (port 4173, chromium) |
| `tailwind.config.js` | Tailwind CSS 테마 (dark mode, CSS 변수 기반) |
| `tsconfig.json` | TypeScript 기본 설정 |
| `index.html` | HTML 진입점 |
| `PRD.md` | 제품 요구사항 문서 (한국어) |
| `PROJECT_STATUS.md` | 프로젝트 현황 보고서 (한국어) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | 애플리케이션 소스 코드 (see `src/AGENTS.md`) |
| `tests/` | E2E 테스트 (see `tests/AGENTS.md`) |
| `public/` | 번들링되지 않는 정적 자산 |
| `.github/` | GitHub Actions CI/CD 워크플로우 |

## For AI Agents

### Working In This Directory
- 의존성 변경 시 `yarn install` 실행 필수
- TypeScript 오류는 `yarn build`로 확인 (전용 linter/formatter 없음)
- 2-space 들여쓰기, single quotes, 세미콜론 없음 스타일 유지
- Vue 뷰/컴포넌트는 PascalCase, Pinia store는 `use...Store` 패턴, 라우트명은 kebab-case

### Testing Requirements
```bash
yarn test --run          # 단위 테스트 1회 실행
yarn test:coverage       # 커버리지 리포트 생성
yarn test:e2e            # Playwright E2E 테스트 (preview 서버 필요)
yarn build               # TypeScript 검증 + 프로덕션 빌드
```

### Common Patterns
- 컴포넌트/뷰: Vue 3 Composition API (`<script setup>`)
- 상태 관리: Pinia store (composable 스타일)
- 스타일: Tailwind utility classes + CSS 변수 다크모드
- 데이터 지속: `localStorage` (`booklog-books`, `booklog-theme` 키)

## Dependencies

### External
- Vue 3.5 — UI 프레임워크
- Vue Router 4.6 — 클라이언트 사이드 라우팅
- Pinia 3.0 — 상태 관리
- Tailwind CSS 3.4 — 유틸리티 CSS
- date-fns 4.1 — 날짜 처리
- lucide-vue-next — SVG 아이콘
- Vitest 4.0 — 단위 테스트
- Playwright 1.53 — E2E 테스트

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
# Repository Guidelines (기존 규칙 — preserved)

## Commit & Pull Request Guidelines
Recent history uses short, imperative commits with prefixes such as `docs:`, `ci:`, and plain action phrases. Follow that pattern, for example: `feat: add review form validation`. Keep PRs focused and include:
- a brief summary of user-visible changes
- linked issue or task when available
- test evidence (`yarn test --run`, `yarn build`)
- screenshots for UI changes affecting `src/views/`

## Architecture & Configuration Notes
The app is a client-only MVP using Pinia plus `localStorage` persistence with the key `booklog-books`. Avoid introducing secrets into the frontend; use Vite env vars only for public client configuration.
