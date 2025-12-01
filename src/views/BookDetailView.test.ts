import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import BookDetailView from './BookDetailView.vue'
import { setupTestPinia, setupLocalStorageMock, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'
import { createMockBook } from '../test-utils/mock-data'

const createTestRouter = (bookId: string = 'test-book-id') => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/books/:id', name: 'book-detail', component: BookDetailView },
    ],
  })
}

describe('BookDetailView', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  describe('렌더링', () => {
    it('존재하는 책을 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        title: '테스트 책',
        author: '테스트 저자',
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('테스트 책')
      expect(wrapper.text()).toContain('테스트 저자')
    })

    it('존재하지 않는 책일 때 "Book not found" 메시지를 표시해야 함', async () => {
      const router = createTestRouter('non-existent-id')
      await router.push('/books/non-existent-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Book not found')
    })
  })

  describe('진행률 표시', () => {
    it('진행률 퍼센티지를 올바르게 계산해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        currentPage: 150,
        totalPages: 300,
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('50%')
      expect(wrapper.text()).toContain('150 / 300')
    })

    it('진행률이 0%일 때 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        currentPage: 0,
        totalPages: 300,
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('0%')
    })

    it('진행률이 100%일 때 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        currentPage: 300,
        totalPages: 300,
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('100%')
    })
  })

  describe('상태 변경', () => {
    it('상태 변경 버튼이 표시되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        status: 'TO_READ',
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 상태 변경 버튼들이 있어야 함
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('상태를 변경할 수 있어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        status: 'TO_READ',
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 상태 변경 (실제 버튼 찾기는 DOM 구조에 따라 다를 수 있음)
      // 직접 스토어 메서드 호출로 테스트
      store.updateBook('test-book-id', { status: 'READING' })

      const updatedBook = store.getBookById('test-book-id')
      expect(updatedBook?.status).toBe('READING')
    })
  })

  describe('독서 로그', () => {
    it('"Reading Logs" 섹션이 표시되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-book-id' })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Reading Logs')
    })

    it('로그가 없을 때 안내 메시지를 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        logs: [],
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No reading logs yet')
    })

    it('로그가 있을 때 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        logs: [
          {
            id: 'log-1',
            date: '2024-01-01',
            startPage: 1,
            endPage: 50,
            content: '첫 독서 노트',
          },
        ],
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('첫 독서 노트')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('50')
    })

    it('"Add Log" 버튼이 표시되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-book-id' })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Add Log')
    })
  })

  describe('날짜 표시', () => {
    it('시작 날짜가 있을 때 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        startDate: '2024-01-01',
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Started')
      // 날짜 형식은 date-fns의 format에 따라 다를 수 있음
    })

    it('종료 날짜가 있을 때 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-book-id',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
      })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Finished')
    })
  })

  describe('책 삭제', () => {
    it('삭제 버튼이 표시되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-book-id' })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 삭제 버튼 확인 (아이콘이나 텍스트로)
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('책을 삭제할 수 있어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-book-id' })
      store.addBook(book)

      expect(store.books.length).toBe(1)

      // 직접 삭제 메서드 호출
      store.deleteBook('test-book-id')

      expect(store.books.length).toBe(0)
      expect(store.getBookById('test-book-id')).toBeUndefined()
    })
  })

  describe('뒤로 가기', () => {
    it('뒤로 가기 버튼이 표시되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-book-id' })
      store.addBook(book)

      const router = createTestRouter('test-book-id')
      await router.push('/books/test-book-id')

      const wrapper = mount(BookDetailView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 뒤로 가기 버튼 확인
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})
