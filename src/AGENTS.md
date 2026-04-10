<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# src

## Purpose
BookLog 애플리케이션의 전체 소스 코드. Vue 3 Composition API 기반으로 구성되며,
라우팅(router), 상태 관리(stores), 타입 정의(types), 페이지(views), 공용 컴포넌트(components),
정적 자산(assets), 테스트 유틸리티(test-utils)로 분리된다.

## Key Files

| File | Description |
|------|-------------|
| `main.ts` | Vue 앱 진입점 — app 인스턴스 생성, 플러그인(Pinia, Router) 등록, 마운트 |
| `App.vue` | 루트 컴포넌트 — 공통 레이아웃, 상단 내비게이션 바, 다크모드 토글, `<RouterView>` |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `assets/` | 전역 CSS 및 번들 정적 파일 (see `assets/AGENTS.md`) |
| `components/` | 재사용 가능한 Vue 컴포넌트 (see `components/AGENTS.md`) |
| `router/` | Vue Router 설정 및 라우트 정의 (see `router/AGENTS.md`) |
| `stores/` | Pinia 상태 관리 store (see `stores/AGENTS.md`) |
| `types/` | 공유 TypeScript 타입/인터페이스 (see `types/AGENTS.md`) |
| `views/` | 라우팅되는 페이지 컴포넌트 (see `views/AGENTS.md`) |
| `test-utils/` | 테스트 공용 유틸리티 및 목 데이터 (see `test-utils/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `main.ts`에서 전역 플러그인 등록 순서: Pinia → Router → mount
- `App.vue`는 레이아웃 전용 — 비즈니스 로직은 views/stores로 분리 유지
- 새 페이지 추가 시 `router/index.ts`에 라우트 등록 필수
- 새 전역 상태는 `stores/`에 Pinia store로 추가

### Testing Requirements
```bash
yarn test --run     # src/**/*.test.ts 전체 실행
yarn build          # TypeScript 타입 검사 포함 빌드
```

### Common Patterns
```typescript
// Vue 3 Composition API 패턴
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBookStore } from '@/stores/book'

const store = useBookStore()
</script>
```

## Dependencies

### Internal
- 모든 하위 모듈이 이 디렉토리 아래에 위치

### External
- `vue` — 프레임워크 코어
- `vue-router` — 라우팅
- `pinia` — 상태 관리
- `tailwindcss` — 스타일링

<!-- MANUAL: -->
