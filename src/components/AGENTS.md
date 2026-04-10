<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# components

## Purpose
여러 뷰에서 재사용되는 Vue 컴포넌트. 현재는 샘플 컴포넌트만 존재하며,
앱이 성장함에 따라 공통 UI 요소(Button, Modal, Badge 등)가 추가될 디렉토리다.

## Key Files

| File | Description |
|------|-------------|
| `HelloWorld.vue` | Vite 프로젝트 스캐폴딩 샘플 컴포넌트 (실제 앱에서 미사용) |

## For AI Agents

### Working In This Directory
- 컴포넌트 파일명은 PascalCase (`BookCard.vue`, `RatingStars.vue`)
- Props 인터페이스는 컴포넌트 상단에 정의
- `defineProps`, `defineEmits`는 `<script setup>` 내에서 사용
- 스타일은 `<style scoped>`로 격리, 또는 Tailwind 클래스로 대체
- `index.ts` barrel export는 컴포넌트가 3개 이상 생기면 추가 고려

### Common Patterns
```vue
<script setup lang="ts">
interface Props {
  label: string
  variant?: 'primary' | 'secondary'
}
const props = defineProps<Props>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button @click="emit('click')" class="...">{{ props.label }}</button>
</template>
```

### Testing Requirements
- 컴포넌트 단위 테스트는 같은 디렉토리에 `ComponentName.test.ts`로 배치
- `@vue/test-utils`의 `mount` / `shallowMount` 사용

## Dependencies

### External
- `vue` — 프레임워크
- `lucide-vue-next` — 아이콘 컴포넌트
- `clsx`, `tailwind-merge` — 조건부 클래스 합성

<!-- MANUAL: -->
