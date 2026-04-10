<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# router

## Purpose
Vue Router 설정 및 라우트 정의. 앱의 모든 페이지 경로를 관리하며,
DashboardView는 즉시 로드(eager), 나머지 뷰는 지연 로드(lazy import)로 구성된다.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | 라우터 인스턴스 생성 및 라우트 테이블 정의 |

## For AI Agents

### Working In This Directory
- 라우트 이름은 kebab-case (`dashboard`, `book-list`, `book-detail`)
- 동적 세그먼트: `/books/:id` — `useRoute().params.id`로 접근
- 새 페이지 추가 시 lazy import(`() => import(...)`) 권장 — 번들 분할 유지
- history 모드: `createWebHistory` (HTML5 히스토리 API)

### Current Routes

| Path | Name | Component | Load |
|------|------|-----------|------|
| `/` | `dashboard` | `DashboardView` | eager |
| `/books` | `book-list` | `BookListView` | lazy |
| `/books/:id` | `book-detail` | `BookDetailView` | lazy |

### Common Patterns
```typescript
// 뷰에서 라우터 사용
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// 프로그래매틱 내비게이션
router.push({ name: 'book-detail', params: { id: book.id } })
```

## Dependencies

### Internal
- `src/views/DashboardView.vue`
- `src/views/BookListView.vue`
- `src/views/BookDetailView.vue`

### External
- `vue-router` 4.x

<!-- MANUAL: -->
