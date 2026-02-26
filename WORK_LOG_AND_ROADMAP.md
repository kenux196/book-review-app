# BookLog 작업 현황 및 향후 계획

## 1. 현재 작업된 내용 (As-Is)

### 1.1 프로젝트 성격
- 독서 기록/관리용 웹 애플리케이션 (MVP 단계)
- 기술 스택: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS
- 데이터 저장: `localStorage` (키: `booklog-books`)

### 1.2 구현된 화면/흐름
- 대시보드 (`/`)
  - 읽는 중 도서 수, 완독 도서 수, 총 읽은 페이지 통계 제공
  - 현재 읽는 중 도서 카드 및 진행률 표시
- 도서 목록 (`/books`)
  - 도서 수동 등록 (제목/저자/페이지)
  - 검색(제목/저자), 상태 필터
  - 도서 카드 목록 및 진행률 표시
- 도서 상세 (`/books/:id`)
  - 상태 변경 (To Read / Reading / Read / Stopped)
  - 독서 진행률 표시
  - 독서 로그(시작/종료 페이지, 메모) 추가/조회
  - 도서 삭제

### 1.3 상태관리/도메인
- `Book` 타입에 진행률, 날짜, 리뷰 관련 필드 포함
- Pinia 스토어에서 CRUD 제공
  - `addBook`, `getBookById`, `updateBook`, `deleteBook`
- 스토어 변경 감지 후 자동 저장 (deep watch)

### 1.4 품질 관리
- 테스트: Vitest + Vue Test Utils + happy-dom
- 테스트 대상
  - 스토어 단위 테스트
  - 주요 뷰 컴포넌트 테스트
- CI
  - GitHub Actions에서 PR/Push 시 테스트 및 커버리지 리포트

---

## 2. 앞으로 진행해야 할 사항 (To-Be)

## 2.1 1순위: 기능 완성도 보강 (MVP 고도화)
- 리뷰/별점 기능 완성
  - 상세 화면에서 `rating`, `review` 입력/수정 UI 추가
  - 목록/상세에서 표시 규칙 정리
- 데이터 입력 검증 강화
  - `totalPages > 0`, `endPage >= startPage`, `endPage <= totalPages`
  - 빈 문자열/공백 제목 방지
- 예외 UX 개선
  - 저장 실패/잘못된 입력 시 사용자 피드백(토스트/인라인 에러)

## 2.2 2순위: 사용자 경험 개선
- 도서 커버 이미지 처리
  - URL 입력 또는 업로드 방식 중 1안 선택
  - 목록/상세에서 폴백 이미지 정책 통일
- 정렬 기능 추가
  - 생성일/제목/진행률/상태 기준 정렬
- 다크 모드 토글
  - 시스템 의존이 아닌 사용자 토글 + 저장

## 2.3 3순위: 제품성 확장
- 도서 검색 API 연동
  - 수동 입력 + 외부 검색 병행
- 독서 캘린더/히트맵
  - 로그 날짜 기반 시각화
- 백엔드 연동 검토
  - `localStorage`에서 클라우드 동기화 구조로 확장

## 2.4 4순위: 엔지니어링 품질 강화
- E2E 테스트 도입 (Playwright 또는 Cypress)
- 접근성 점검 (키보드 탐색, 대비, 라벨링)
- 라우트 가드/데이터 마이그레이션 고려
  - 스토어 스키마 변경 시 안전한 업그레이드 경로

---

## 3. 권장 실행 순서 (실행 가능한 단기 계획)

1. 리뷰/별점 UI + 스토어 업데이트 + 테스트 작성
2. 입력 검증/에러 메시지 체계화
3. 커버 이미지(우선 URL 방식) + 정렬 기능
4. 다크 모드 토글 및 사용자 설정 저장
5. E2E 핵심 시나리오 3개 구축
   - 도서 등록
   - 로그 추가
   - 상태 변경 및 삭제

---

## 4. 참고 파일
- `/Users/sky/Workspace/01_project/book-review-app/PRD.md`
- `/Users/sky/Workspace/01_project/book-review-app/PROJECT_STATUS.md`
- `/Users/sky/Workspace/01_project/book-review-app/src/stores/book.ts`
- `/Users/sky/Workspace/01_project/book-review-app/src/views/DashboardView.vue`
- `/Users/sky/Workspace/01_project/book-review-app/src/views/BookListView.vue`
- `/Users/sky/Workspace/01_project/book-review-app/src/views/BookDetailView.vue`
