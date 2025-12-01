# 프로젝트 현황 및 향후 계획 보고서

## 1. 현재 구현 현황 (Current Status)

### 1.1 핵심 기능 (Core Features)

- **도서 목록 관리**:
  - 도서 추가 (제목, 저자, 페이지 수 등)
  - 상태별 필터링 (읽을 책, 읽는 중, 읽음, 중단됨)
  - 도서 검색 (제목, 저자)
  - 도서 삭제
- **도서 상세 정보**:
  - 독서 진행률 시각화 (프로그레스 바, 퍼센트)
  - 상태 변경 기능
  - 독서 로그(노트) 기록 및 조회
- **대시보드**:
  - 전체 독서 통계 (읽는 중, 읽은 책, 총 페이지 수)
  - 현재 읽는 중인 책 목록 및 진행 상황 표시
- **데이터 영속성**:
  - `localStorage`를 이용한 데이터 저장 및 불러오기

### 1.2 기술 스택 (Tech Stack)

- **Frontend**: Vue 3, TypeScript, Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Icons**: Lucide Vue Next
- **Date Handling**: date-fns

### 1.3 테스트 및 품질 관리 (Testing & QA)

- **테스트 프레임워크**: Vitest, Vue Test Utils
- **테스트 커버리지**: 81% (Statements 기준)
- **테스트 범위**:
  - **Unit Tests**: Pinia Store (CRUD, 에러 처리)
  - **Component Tests**: BookListView, BookDetailView, DashboardView
- **CI/CD**:
  - GitHub Actions를 통한 자동 테스트 실행
  - PR 시 커버리지 리포트 자동 코멘트

---

## 2. 향후 구현 및 개선 계획 (Future Roadmap)

### 2.1 기능 확장 (Feature Expansion)

- [ ] **도서 검색 API 연동**: 현재 수동 입력 방식을 알라딘/교보문고 API 등을 연동하여 자동 검색 및 등록으로 개선
- [ ] **이미지 업로드**: 도서 표지 이미지 업로드 또는 URL 링크 기능 추가
- [ ] **별점 및 리뷰 시스템**: 완독 후 별점(1~5)과 상세 리뷰 작성 기능 구현
- [ ] **독서 달력**: GitHub 잔디 심기 스타일의 독서 활동 히트맵 구현
- [ ] **다크 모드 토글**: 시스템 설정 외에 사용자가 직접 다크 모드를 켜고 끌 수 있는 기능 추가

### 2.2 기술적 개선 (Technical Improvements)

- [ ] **백엔드 연동**: 현재 `localStorage` 기반을 Firebase 또는 Supabase 등을 활용하여 클라우드 동기화 구현
- [ ] **PWA 지원**: 모바일에서 앱처럼 사용할 수 있도록 PWA(Progressive Web App) 설정 추가
- [ ] **성능 최적화**: 많은 도서 데이터가 쌓였을 때를 대비한 가상 스크롤(Virtual Scrolling) 도입 고려

### 2.3 테스트 강화 (Testing Enhancements)

- [ ] **E2E 테스트**: Cypress 또는 Playwright를 도입하여 전체 사용자 시나리오(User Journey) 테스트
- [ ] **접근성 테스트**: `vue-axe` 등을 활용하여 웹 접근성 준수 여부 자동 검사
- [ ] **스냅샷 테스트**: UI 변경 사항을 감지하기 위한 스냅샷 테스트 추가

---

## 3. 결론 (Conclusion)

현재 프로젝트는 MVP(Minimum Viable Product) 수준의 핵심 기능을 모두 갖추었으며, 높은 수준의 테스트 커버리지와 CI 파이프라인을 통해 안정적인 개발 기반이 마련되었습니다. 향후 외부 API 연동과 백엔드 도입을 통해 실제 서비스 가능한 수준으로 고도화할 수 있습니다.
