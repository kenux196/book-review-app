import type { Book, ReadingLog, BookStatus } from '../types/book'

/**
 * 테스트용 독서 로그 생성 함수
 */
export function createMockReadingLog(overrides?: Partial<ReadingLog>): ReadingLog {
  return {
    id: `log-${Date.now()}`,
    date: new Date().toISOString(),
    startPage: 1,
    endPage: 50,
    content: '테스트 독서 노트',
    ...overrides,
  }
}

/**
 * 테스트용 책 데이터 생성 함수
 */
export function createMockBook(overrides?: Partial<Book>): Book {
  const id = `book-${Date.now()}`
  return {
    id,
    title: '테스트 책',
    author: '테스트 저자',
    totalPages: 300,
    currentPage: 0,
    status: 'TO_READ' as BookStatus,
    logs: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * 다양한 상태의 샘플 책 데이터
 */
export const mockBooks: Book[] = [
  createMockBook({
    id: 'book-1',
    title: '클린 코드',
    author: '로버트 C. 마틴',
    totalPages: 584,
    currentPage: 584,
    status: 'READ',
    rating: 5,
    review: '모든 개발자가 읽어야 할 필독서',
    startDate: '2024-01-01',
    endDate: '2024-01-15',
  }),
  createMockBook({
    id: 'book-2',
    title: '리팩터링',
    author: '마틴 파울러',
    totalPages: 418,
    currentPage: 200,
    status: 'READING',
    startDate: '2024-02-01',
    logs: [
      createMockReadingLog({
        id: 'log-1',
        startPage: 1,
        endPage: 100,
        content: '첫 100페이지 완료',
      }),
      createMockReadingLog({
        id: 'log-2',
        startPage: 101,
        endPage: 200,
        content: '리팩터링 기법들이 유용함',
      }),
    ],
  }),
  createMockBook({
    id: 'book-3',
    title: '이펙티브 타입스크립트',
    author: '댄 밴더캄',
    totalPages: 280,
    currentPage: 0,
    status: 'TO_READ',
  }),
  createMockBook({
    id: 'book-4',
    title: '함수형 프로그래밍',
    author: '루이스 아텐시오',
    totalPages: 400,
    currentPage: 150,
    status: 'STOPPED',
    startDate: '2024-03-01',
  }),
]
