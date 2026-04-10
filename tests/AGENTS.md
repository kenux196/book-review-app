<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# tests

## Purpose
Playwright 기반 E2E(End-to-End) 테스트 디렉토리. 실제 브라우저 환경에서 사용자 시나리오를
시뮬레이션하여 전체 앱 흐름을 검증한다. 단위 테스트(`src/**/*.test.ts`)와 분리되어 관리된다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `e2e/` | Playwright E2E 테스트 스펙 파일 (see `e2e/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- E2E 테스트 실행 전 `yarn build` + preview 서버(port 4173) 필요
- `playwright.config.ts`(루트)에서 baseURL, 브라우저, 타임아웃 설정 관리
- 테스트 결과 아티팩트(스크린샷, 트레이스)는 `output/playwright/`에 저장됨

### Testing Requirements
```bash
yarn test:e2e           # Playwright 헤드리스 실행
yarn test:e2e:headed    # 브라우저 UI 표시하여 실행
yarn test:e2e:ui        # Playwright UI 모드
```

### Common Patterns
- 테스트 파일명: `*.spec.ts`
- Page Object 패턴 권장 (복잡도 증가 시)
- `expect(page).toHaveURL()`, `page.getByRole()` 등 Playwright locator 사용

## Dependencies

### Internal
- 빌드된 앱(`dist/`) 또는 dev 서버에 의존

### External
- `@playwright/test` — E2E 테스트 프레임워크
- `playwright` — 브라우저 자동화

<!-- MANUAL: -->
