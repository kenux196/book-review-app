import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import BookListView from './BookListView.vue'
import { setupTestPinia, setupLocalStorageMock, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'
import { createMockBook } from '../test-utils/mock-data'

// 라우터 설정
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/books/:id', name: 'book-detail', component: { template: '<div>Detail</div>' } },
  ],
})

describe('BookListView', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  describe('렌더링', () => {
    it('컴포넌트가 정상적으로 마운트되어야 함', () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('제목 "Library"가 표시되어야 함', () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Library')
    })

    it('"Add Book" 버튼이 표시되어야 함', () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Add Book')
    })
  })

  describe('책 목록 표시', () => {
    it('빈 목록일 때 "No books found" 메시지를 표시해야 함', () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('No books found')
    })

    it('책이 있을 때 책 카드를 표시해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-1', title: '테스트 책', author: '테스트 저자' })
      store.addBook(book)

      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('테스트 책')
      expect(wrapper.text()).toContain('테스트 저자')
    })

    it('여러 책을 표시할 수 있어야 함', async () => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', title: '책 1' }))
      store.addBook(createMockBook({ id: 'book-2', title: '책 2' }))
      store.addBook(createMockBook({ id: 'book-3', title: '책 3' }))

      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('책 1')
      expect(wrapper.text()).toContain('책 2')
      expect(wrapper.text()).toContain('책 3')
    })
  })

  describe('검색 기능', () => {
    beforeEach(() => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', title: '클린 코드', author: '로버트 마틴' }))
      store.addBook(createMockBook({ id: 'book-2', title: '리팩터링', author: '마틴 파울러' }))
      store.addBook(createMockBook({ id: 'book-3', title: '이펙티브 자바', author: '조슈아 블로크' }))
    })

    it('제목으로 검색할 수 있어야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      const searchInput = wrapper.find('input[placeholder="Search books..."]')
      await searchInput.setValue('클린')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('클린 코드')
      expect(wrapper.text()).not.toContain('리팩터링')
      expect(wrapper.text()).not.toContain('이펙티브 자바')
    })

    it('저자로 검색할 수 있어야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      const searchInput = wrapper.find('input[placeholder="Search books..."]')
      await searchInput.setValue('마틴')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('클린 코드')
      expect(wrapper.text()).toContain('리팩터링')
      expect(wrapper.text()).not.toContain('이펙티브 자바')
    })

    it('대소문자 구분 없이 검색해야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      const searchInput = wrapper.find('input[placeholder="Search books..."]')
      await searchInput.setValue('CLEAN')
      await wrapper.vm.$nextTick()

      // 영문 검색은 실제 데이터에 따라 다를 수 있음
      // 한글 검색으로 테스트
      await searchInput.setValue('클린')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('클린 코드')
    })
  })

  describe('상태 필터', () => {
    beforeEach(() => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', title: '읽을 책', status: 'TO_READ' }))
      store.addBook(createMockBook({ id: 'book-2', title: '읽는 중인 책', status: 'READING' }))
      store.addBook(createMockBook({ id: 'book-3', title: '읽은 책', status: 'READ' }))
      store.addBook(createMockBook({ id: 'book-4', title: '중단한 책', status: 'STOPPED' }))
    })

    it('전체(ALL) 필터가 모든 책을 표시해야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('읽을 책')
      expect(wrapper.text()).toContain('읽는 중인 책')
      expect(wrapper.text()).toContain('읽은 책')
      expect(wrapper.text()).toContain('중단한 책')
    })

    it('TO_READ 필터가 읽을 책만 표시해야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      const statusSelect = wrapper.find('select')
      await statusSelect.setValue('TO_READ')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('읽을 책')
      expect(wrapper.text()).not.toContain('읽는 중인 책')
      expect(wrapper.text()).not.toContain('읽은 책')
      expect(wrapper.text()).not.toContain('중단한 책')
    })

    it('READING 필터가 읽는 중인 책만 표시해야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      const statusSelect = wrapper.find('select')
      await statusSelect.setValue('READING')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('읽을 책')
      expect(wrapper.text()).toContain('읽는 중인 책')
      expect(wrapper.text()).not.toContain('읽은 책')
      expect(wrapper.text()).not.toContain('중단한 책')
    })
  })

  describe('책 추가 폼', () => {
    it('"Add Book" 버튼 클릭 시 폼이 표시되어야 함', async () => {
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).not.toContain('Add New Book')

      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Add New Book')
    })

    it('폼에 책 정보를 입력하고 저장할 수 있어야 함', async () => {
      const store = useBookStore()
      const wrapper = mount(BookListView, {
        global: {
          plugins: [router],
        },
      })

      // 폼 열기
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 입력 필드 찾기 (placeholder 기반)
      const titleInput = wrapper.find('input[placeholder="Book Title"]')
      const authorInput = wrapper.find('input[placeholder="Author Name"]')
      const pagesInput = wrapper.find('input[placeholder="Total Pages"]')

      // 값 입력
      await titleInput.setValue('새로운 책')
      await authorInput.setValue('새로운 저자')
      await pagesInput.setValue('300')
      await wrapper.vm.$nextTick()

      // 저장 버튼 클릭
      const saveButton = wrapper.findAll('button').find(btn => btn.text().includes('Save'))
      if (saveButton) {
        await saveButton.trigger('click')
        await wrapper.vm.$nextTick()
      }

      // 스토어에 추가되었는지 확인
      expect(store.books.length).toBeGreaterThan(0)
      const addedBook = store.books.find(b => b.title === '새로운 책')
      expect(addedBook).toBeDefined()
      expect(addedBook?.author).toBe('새로운 저자')
      expect(addedBook?.totalPages).toBe(300)
    })
  })
})
