<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# types

## Purpose
앱 전체에서 공유되는 TypeScript 타입 및 인터페이스 정의. 도메인 모델(Book, ReadingLog)과
스토어 액션 결과 타입, UI 관련 열거형(BookStatus, BookSortKey)을 포함한다.

## Key Files

| File | Description |
|------|-------------|
| `book.ts` | 모든 도메인 타입 정의 — `Book`, `BookDraft`, `ReadingLog`, `ReadingLogDraft`, `ReviewDraft`, `StoreActionResult` 인터페이스 및 `BookStatus`, `BookSortKey`, `ThemePreference` 유니온 타입 |

## For AI Agents

### Working In This Directory
- 이 디렉토리는 순수 타입 정의만 포함 — 런타임 로직 없음
- 새 도메인 타입은 `book.ts`에 추가 (파일 분리는 타입이 충분히 많아질 때)
- `BookDraft` / `ReadingLogDraft` 패턴: 사용자 입력 폼용 Draft 타입은 optional 필드 허용
- `StoreActionResult`는 store 액션의 성공/실패 반환 타입으로 사용

### Common Patterns
```typescript
// 주요 타입 요약
type BookStatus = 'TO_READ' | 'READING' | 'READ' | 'STOPPED'
type BookSortKey = 'CREATED_AT_DESC' | 'TITLE_ASC' | 'PROGRESS_DESC' | 'STATUS_ASC'

interface Book {
  id: string; title: string; author: string
  totalPages: number; currentPage: number
  status: BookStatus; rating?: number; review?: string
  logs: ReadingLog[]; createdAt: string
}

type StoreActionResult = { ok: true } | { ok: false; message: string }
```

### Testing Requirements
- 커버리지 설정에서 `src/types/` 제외됨 — 타입 검사는 `yarn build`로 확인

## Dependencies

### Internal
- `src/stores/book.ts` — 이 타입들을 import하여 사용
- `src/views/*.vue` — Book, BookStatus 등을 직접 참조

<!-- MANUAL: -->
