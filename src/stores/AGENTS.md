<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-17 -->

# stores

## Purpose
Pinia 기반 전역 상태 관리. 책 데이터의 CRUD, 독서 로그 관리, 검색/필터/정렬,
IndexedDB 영속성, 백업/복원, 테마 해상, 입력 유효성 검사를 모두 담당한다.

## Key Files

| File | Description |
|------|-------------|
| `book.ts` | `useBookStore` — 책 전체 상태 관리 (CRUD, 백업/복원, 테마, 유효성 검사) |
| `bookRepository.ts` | 스토어 persistence 추상화 인터페이스 |
| `bookRepositoryProvider.ts` | 런타임/테스트용 repository 주입 지점 |
| `indexedDbBookRepository.ts` | Dexie 기반 IndexedDB 구현체 및 legacy localStorage 마이그레이션 |
| `book.test.ts` | `useBookStore` 단위 테스트 — 각 액션 및 getter에 대한 케이스 포함 |

## For AI Agents

### Working In This Directory
- Store 파일명과 테스트 파일을 항상 같은 위치에 배치 (`book.ts` ↔ `book.test.ts`)
- 새 store 추가 시 `use<Name>Store` 패턴으로 명명
- 모든 변이 액션은 `StoreActionResult`(`{ ok: true } | { ok: false; message: string }`) 반환
- 영속성 기본값은 IndexedDB이며, legacy 키 `booklog-books` / `booklog-theme`는 마이그레이션 용도로만 유지
- 데이터 로드 시 레거시/손상 레코드 정규화 처리 포함

### Key Store API (`useBookStore`)

**State:**
- `books: Book[]` — 전체 책 목록
- `theme: ThemePreference` — 사용자가 선택한 테마 (`system | light | dark`)
- `resolvedTheme: 'light' | 'dark'` — 시스템 설정까지 반영된 실제 적용 테마
- `recentlyDeletedBook` / `deleteUndoExpiresAt` — 삭제 복구 상태

**Actions:**
- `addBook(draft: BookDraft): StoreActionResult`
- `updateBook(id, draft): StoreActionResult`
- `deleteBook(id): StoreActionResult`
- `undoDeleteBook(): StoreActionResult`
- `addReadingLog(bookId, draft): StoreActionResult`
- `saveReview(bookId, draft): StoreActionResult`
- `setTheme(theme): void`
- `cycleTheme(): void`
- `exportBackup(): string`
- `previewBackup(raw): BackupPreviewResult`
- `importBackup(payload, mode): StoreActionResult`

### Testing Requirements
```bash
yarn test --run src/stores/book.test.ts   # 스토어만 테스트
```
- `setupTestPinia()`, `setupLocalStorageMock()` (`src/test-utils/setup.ts`) 사용
- `matchMedia` mock으로 시스템 테마 반응까지 검증
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
- `dexie` — IndexedDB persistence
- `date-fns` — 날짜 처리 (로그 날짜 포맷)

<!-- MANUAL: -->
