<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# e2e

## Purpose
Playwright E2E 테스트 스펙 파일. 실제 브라우저(Chromium)에서 사용자 시나리오를
end-to-end로 검증한다. 책 추가, 독서 로그 기록, 검색/필터, 대시보드 확인 등
핵심 사용자 흐름을 커버한다.

## Key Files

| File | Description |
|------|-------------|
| `booklog.spec.ts` | BookLog 전체 E2E 테스트 스펙 — 주요 사용자 시나리오(책 CRUD, 독서 로그, 리뷰, 대시보드) |

## For AI Agents

### Working In This Directory
- E2E 테스트는 `yarn preview`(port 4173)에서 실행 — 먼저 `yarn build` 필요
- 테스트 파일명: `*.spec.ts` (Playwright 관례)
- `playwright.config.ts`(루트)에서 baseURL, timeout, outputDir 설정

### Testing Requirements
```bash
# 실행 순서
yarn build              # 프로덕션 빌드
yarn test:e2e           # 헤드리스 실행 (CI)
yarn test:e2e:headed    # 브라우저 표시 (디버깅)
yarn test:e2e:ui        # Playwright UI 모드 (인터랙티브)
```

### Common Patterns
```typescript
import { test, expect } from '@playwright/test'

test('책을 추가할 수 있다', async ({ page }) => {
  await page.goto('/books')
  await page.getByRole('button', { name: '책 추가' }).click()
  await page.getByLabel('제목').fill('테스트 책')
  // ...
  await expect(page.getByText('테스트 책')).toBeVisible()
})
```

### Debugging Tips
- 실패 시 `output/playwright/`에 스크린샷/트레이스 저장됨
- `--debug` 플래그로 Playwright Inspector 실행 가능
- `page.pause()`로 특정 시점에 실행 중단 후 수동 확인

## Dependencies

### Internal
- 빌드된 앱 (`dist/`) — preview 서버가 서빙

### External
- `@playwright/test` — 테스트 러너 및 assertion
- `playwright` — 브라우저 자동화 엔진

<!-- MANUAL: -->
