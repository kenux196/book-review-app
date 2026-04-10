<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# assets

## Purpose
번들링되는 정적 자산 디렉토리. Vite가 빌드 시 처리하는 CSS와 이미지 파일을 포함한다.
번들링이 필요 없는 정적 파일(favicon 등)은 루트 `public/`에 위치한다.

## Key Files

| File | Description |
|------|-------------|
| `main.css` | 전역 CSS — Tailwind 지시어(`@tailwind base/components/utilities`) 및 CSS 변수 기반 다크모드 테마 정의 |
| `vue.svg` | Vue 로고 SVG (샘플 자산) |

## For AI Agents

### Working In This Directory
- `main.css`는 `src/main.ts`에서 import되어 전역 적용됨
- 다크모드 CSS 변수(예: `--color-background`, `--color-text`)는 이 파일에서 정의
- 컴포넌트별 스타일은 각 `.vue` 파일의 `<style>` 블록에 작성 (scoped 권장)
- 새 전역 스타일 추가 시 `main.css`에 Tailwind `@layer` 지시어 활용

### Testing Requirements
- CSS 변경 시 `yarn dev`로 시각적 확인
- 다크모드 토글 기능으로 라이트/다크 모두 확인

### Common Patterns
```css
/* Tailwind 기본 구조 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS 변수 기반 테마 */
:root { --color-background: #ffffff; }
.dark { --color-background: #1a1a1a; }
```

## Dependencies

### External
- `tailwindcss` — CSS 유틸리티 클래스 생성
- `postcss` + `autoprefixer` — CSS 후처리

<!-- MANUAL: -->
