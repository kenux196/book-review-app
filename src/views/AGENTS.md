<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# views

## Purpose
Vue Router에 의해 라우팅되는 페이지 컴포넌트. 각 뷰는 하나의 페이지 역할을 하며
`useBookStore`를 통해 데이터를 읽고 조작한다. 단위 테스트 파일이 뷰와 함께 위치한다.

## Key Files

| File | Description |
|------|-------------|
| `DashboardView.vue` | `/` 경로 — 독서 통계(읽는 중, 완료, 총 페이지), 최근 활동 표시 |
| `DashboardView.test.ts` | DashboardView 단위 테스트 |
| `BookListView.vue` | `/books` 경로 — 책 목록, 검색, 상태 필터, 정렬, 책 추가 폼 |
| `BookListView.test.ts` | BookListView 단위 테스트 |
| `BookDetailView.vue` | `/books/:id` 경로 — 책 상세, 독서 로그 목록/추가/삭제, 별점/리뷰 |
| `BookDetailView.test.ts` | BookDetailView 단위 테스트 |

## For AI Agents

### Working In This Directory
- 뷰 파일명은 PascalCase + `View` suffix (`BookDetailView.vue`)
- 테스트 파일은 뷰와 동일 위치에 배치 (`*.test.ts`)
- 뷰는 레이아웃 + UI 로직만 담당 — 비즈니스 로직은 store로 위임
- `router/index.ts`에서 `BookListView`, `BookDetailView`는 lazy import

### Page Responsibilities

| View | Route | Key Features |
|------|-------|-------------|
| `DashboardView` | `/` | 통계 카드, 진행률 바, 최근 독서 현황 |
| `BookListView` | `/books` | 검색/필터/정렬, 책 추가 인라인 폼, 책 카드 목록 |
| `BookDetailView` | `/books/:id` | 책 정보 편집, 독서 로그 CRUD, 별점/리뷰 입력 |

### Testing Requirements
```bash
yarn test --run src/views/              # 뷰 테스트 전체 실행
```
- `setupTestPinia()` + `setupLocalStorageMock()` 사용
- `@vue/test-utils`의 `mount` + `RouterStub` 패턴
- UI 변경 시 스크린샷을 PR에 첨부

### Common Patterns
```vue
<script setup lang="ts">
import { useBookStore } from '@/stores/book'
import { useRouter } from 'vue-router'

const store = useBookStore()
const router = useRouter()
</script>
```

## Dependencies

### Internal
- `src/stores/book.ts` — 상태 읽기/조작
- `src/types/book.ts` — 타입 참조
- `src/router/index.ts` — 라우트 등록

### External
- `vue-router` — `useRoute`, `useRouter`
- `lucide-vue-next` — 아이콘
- `date-fns` — 날짜 포맷

<!-- MANUAL: -->
