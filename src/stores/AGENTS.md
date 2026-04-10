<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# stores

## Purpose
Pinia 기반 전역 상태 관리. 책 데이터의 CRUD, 독서 로그 관리, 검색/필터/정렬,
localStorage 영속성, 입력 유효성 검사를 모두 담당한다.

## Key Files

| File | Description |
|------|-------------|
| `book.ts` | `useBookStore` — 책 전체 상태 관리 (CRUD, 검색, 정렬, localStorage 동기화, 유효성 검사) |
| `book.test.ts` | `useBookStore` 단위 테스트 — 각 액션 및 getter에 대한 케이스 포함 |

## For AI Agents

### Working In This Directory
- Store 파일명과 테스트 파일을 항상 같은 위치에 배치 (`book.ts` ↔ `book.test.ts`)
- 새 store 추가 시 `use<Name>Store` 패턴으로 명명
- 모든 변이 액션은 `StoreActionResult`(`{ ok: true } | { ok: false; message: string }`) 반환
- localStorage 키: `booklog-books` (책 목록), `booklog-theme` (테마 설정)
- 데이터 로드 시 레거시/손상 레코드 정규화 처리 포함

### Key Store API (`useBookStore`)

**State:**
- `books: Book[]` — 전체 책 목록
- `searchQuery: string` — 검색어
- `statusFilter: BookStatus | 'ALL'` — 상태 필터
- `sortKey: BookSortKey` — 정렬 기준

**Getters:**
- `filteredBooks` — 검색/필터/정렬 적용된 책 목록
- `stats` — 대시보드용 통계 (읽는 중, 완료, 총 페이지 등)

**Actions:**
- `addBook(draft: BookDraft): StoreActionResult`
- `updateBook(id, draft): StoreActionResult`
- `deleteBook(id): void`
- `addReadingLog(bookId, draft): StoreActionResult`
- `deleteReadingLog(bookId, logId): void`
- `updateReview(bookId, draft): StoreActionResult`

### Testing Requirements
```bash
yarn test --run src/stores/book.test.ts   # 스토어만 테스트
```
- `setupTestPinia()`, `setupLocalStorageMock()` (`src/test-utils/setup.ts`) 사용
- 각 액션의 성공/실패 케이스 모두 테스트

### Common Patterns
```typescript
// 뷰에서 store 사용
import { useBookStore } from '@/stores/book'
const store = useBookStore()

const result = await store.addBook({ title, author, totalPages, status })
if (!result.ok) console.error(result.message)
```

## Dependencies

### Internal
- `src/types/book.ts` — Book, BookDraft 등 타입

### External
- `pinia` — 상태 관리
- `date-fns` — 날짜 처리 (로그 날짜 포맷)

<!-- MANUAL: -->
