# 제품 요구사항 문서 (PRD) - 독서 기록 서비스 "BookLog" (가칭)

## 1. 개요 (Overview)

사용자가 읽은 책을 관리하고, 독서 진행 상황과 감상을 기록할 수 있는 웹 애플리케이션입니다. 단순한 도서 목록 관리를 넘어, 독서 습관을 형성하고 인사이트를 축적하는 것을 목표로 합니다.

## 2. 목표 (Goals)

- 사용자가 자신의 독서 이력을 한눈에 파악할 수 있도록 한다.
- 책별로 상세한 독서 기록(메모, 진행률)을 남길 수 있게 한다.
- 직관적이고 아름다운 UI로 기록하는 즐거움을 제공한다.

## 3. 주요 기능 (Key Features)

### 3.1 도서 목록 관리 (Book List Management) ✅

- **도서 등록**: 수동 입력을 통해 도서를 내 서재에 추가. (검색 API 연동 예정)
- **도서 상태 분류**:
  - 읽고 싶은 책 (To Read)
  - 읽는 중 (Reading)
  - 읽은 책 (Read)
  - 중단함 (Stopped)
- **목록 조회**: 상태별, 평점별, 날짜별 정렬 및 필터링.
- **태그/키워드**: 책에 태그를 추가하고 태그로 검색.

### 3.2 독서 기록 (Reading Records) ✅

- **진행률 추적**:
  - 전체 페이지 수 대비 읽은 페이지 수 입력.
  - 퍼센트(%) 자동 계산 및 시각적 프로그레스 바 제공.
- **날짜 기록**:
  - 독서 시작일 (Start Date)
  - 독서 종료일 (End Date)
- **독서 노트 (Reading Logs)**:
  - 읽는 도중 인상 깊은 구절이나 생각을 페이지 번호와 함께 기록.

### 3.3 리뷰 및 서평 (Review & Critique) ✅

- **전체 리뷰**: 완독 후 책에 대한 총평 작성.
- **별점 평가**: 1~5점 척도로 평가.

### 3.4 통계 및 대시보드 (Statistics & Dashboard) ✅

- **완독 권수**: 연간/월간 완독 권수 시각화 (바 차트, Pages/Books 탭 전환).
- **독서 달력**: 날짜별 독서 활동 히트맵 (GitHub 잔디 스타일, 52주).
- **백업/복원**:
  - 현재 서재와 테마 설정을 JSON 파일로 내보내기.
  - 백업 파일을 미리보기 후 병합 또는 덮어쓰기 방식으로 복원.

### 3.5 데이터 안정성 및 복구 (Data Safety) ✅

- **삭제 복구**:
  - 책 삭제 후 5초 동안 실행 취소(undo) 가능.
- **레거시 데이터 마이그레이션**:
  - 기존 `localStorage` 데이터를 첫 실행 시 IndexedDB로 자동 이전.

### 3.6 도서 검색 API 연동 (Book Search) 🔜 예정

- 책 등록 시 제목/저자/ISBN으로 외부 API 검색.
- 검색 결과에서 선택 시 표지 이미지, 저자, 페이지수 자동 입력.
- **구현 계획**: 카카오 책 검색 API(메인) + Google Books API(페이지수 보조)
  - 카카오 API: CORS 허용, 한국 도서 커버리지 우수
  - Google Books API: CORS 허용, pageCount 제공
  - 향후 Supabase Edge Function 기반 알라딘 API 프록시로 전환 고려

## 4. 사용자 인터페이스 (UI/UX Requirements)

- **디자인 컨셉**: 깔끔하고 모던한 디자인, 집중을 돕는 차분한 컬러 팔레트.
- **반응형 웹**: 데스크탑 및 모바일 환경 최적화.
- **테마**: 시스템 설정을 기본값으로 따르며, 사용자가 `시스템 / 라이트 / 다크`를 선택 가능. ✅

## 5. 기술적 요구사항 (Technical Requirements)

- **Frontend**: Vue.js 3 (Vite), Tailwind CSS
- **State Management**: Pinia
- **Data Persistence**:
  - ~~LocalStorage (MVP)~~ → **IndexedDB (Dexie 4.x)** ✅
  - BookRepository 패턴으로 persistence layer 추상화 (Supabase 전환 대비)
  - 기존 localStorage 데이터 첫 실행 시 자동 마이그레이션
- **Backup Format**:
  - 버전(`version`), 내보낸 시각(`exportedAt`), 테마(`theme`), 책 목록(`books`)을 포함한 JSON 백업 지원
- **Testing**: Vitest (unit), Playwright (E2E, 11개 시나리오)

## 6. 향후 확장 고려 (Future Scope)

| 항목 | 상태 | 비고 |
|------|------|------|
| 도서 검색 API 연동 | 🔜 다음 작업 | 카카오 + Google Books |
| Supabase 백엔드 연동 | 📋 예정 | BookRepository 교체만으로 전환 가능 |
| 인증(Auth) | 📋 예정 | Supabase Auth (이메일/소셜) |
| 멀티 디바이스 지원 | 📋 예정 | Supabase 연동 후 |
| 소셜 기능 | 💡 아이디어 | 친구와 책 공유, 코멘트 |
| 독서 타이머 | 💡 아이디어 | |
