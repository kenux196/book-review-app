<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# test-utils

## Purpose
단위 테스트 전용 공용 유틸리티. Pinia 인스턴스 초기화, localStorage mock 설정,
목 데이터(fixture)를 제공하여 각 테스트 파일의 setup 코드를 재사용한다.
커버리지 수집 대상에서 제외된다.

## Key Files

| File | Description |
|------|-------------|
| `setup.ts` | `setupTestPinia()` — 테스트용 Pinia 생성/활성화, `setupLocalStorageMock()` — localStorage vi.fn() mock, `clearLocalStorage()` — 테스트 간 상태 초기화 |
| `mock-data.ts` | 테스트용 목 Book 데이터 — 다양한 상태(`TO_READ`, `READING`, `READ`, `STOPPED`)의 샘플 Book 객체 |

## For AI Agents

### Working In This Directory
- 이 디렉토리 파일은 **테스트 코드에서만** import
- 새 공용 테스트 헬퍼는 이 위치에 추가
- `vitest.config.ts`의 `coverage.exclude`에 `src/test-utils/` 등록되어 있음

### Common Patterns
```typescript
// 테스트 파일의 표준 setup 패턴
import { setupTestPinia, setupLocalStorageMock, clearLocalStorage } from '@/test-utils/setup'
import { mockBooks } from '@/test-utils/mock-data'

beforeEach(() => {
  setupTestPinia()
  setupLocalStorageMock()
})

afterEach(() => {
  clearLocalStorage()
})
```

### Testing Requirements
- 이 파일 자체는 테스트 대상 아님 (커버리지 제외)
- 변경 시 `yarn test --run`으로 의존하는 테스트들이 통과하는지 확인

## Dependencies

### External
- `pinia` — `createPinia`, `setActivePinia`
- `vitest` — `vi.fn()`

<!-- MANUAL: -->
