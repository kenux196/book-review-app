import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import BookDetailView from './BookDetailView.vue'
import { setupLocalStorageMock, setupTestPinia, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/books', component: { template: '<div>Books</div>' } },
    { path: '/books/:id', name: 'book-detail', component: BookDetailView },
  ],
})

describe('BookDetailView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-17T09:00:00.000Z'))
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a missing-book state', async () => {
    const router = createTestRouter()
    await router.push('/books/missing')
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('책을 찾을 수 없습니다.')
    expect(wrapper.text()).toContain('서재로 이동')
  })

  it('updates book status from the select input', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    expect(store.books[0]).toBeDefined()
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    await wrapper.find('select').setValue('READING')

    expect(store.books[0]).toBeDefined()
    expect(store.books[0]!.status).toBe('READING')
    expect(store.books[0]!.startDate).toBeTruthy()
  })

  it('shows a validation error for invalid reading logs', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'READING' })
    expect(store.books[0]).toBeDefined()
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    const toggleButton = wrapper.findAll('button').find(button => button.text() === '로그 추가')
    await toggleButton?.trigger('click')
    const logInputs = wrapper.findAll('input[type="number"]')
    const startInput = logInputs[logInputs.length - 2]
    const endInput = logInputs[logInputs.length - 1]
    expect(startInput).toBeDefined()
    expect(endInput).toBeDefined()
    await startInput!.setValue('50')
    await endInput!.setValue('10')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    expect(wrapper.text()).toContain('종료 페이지는 시작 페이지보다 같거나 커야 합니다.')
  })

  it('adds a valid reading log and updates current page', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    expect(store.books[0]).toBeDefined()
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    const toggleButton = wrapper.findAll('button').find(button => button.text() === '로그 추가')
    await toggleButton?.trigger('click')
    const logInputs = wrapper.findAll('input[type="number"]')
    const startInput = logInputs[logInputs.length - 2]
    const endInput = logInputs[logInputs.length - 1]
    expect(startInput).toBeDefined()
    expect(endInput).toBeDefined()
    await startInput!.setValue('1')
    await endInput!.setValue('20')
    await wrapper.find('textarea[placeholder="오늘 인상 깊었던 내용을 남겨보세요."]').setValue('Solid opening')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    expect(store.books[0]).toBeDefined()
    expect(store.books[0]!.logs).toHaveLength(1)
    expect(store.books[0]!.currentPage).toBe(20)
    expect(wrapper.text()).toContain('Solid opening')
  })

  it('saves a reading log with a selected date', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'READING' })
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    const toggleButton = wrapper.findAll('button').find(button => button.text() === '로그 추가')
    await toggleButton?.trigger('click')

    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2026-04-05')

    const logInputs = wrapper.findAll('input[type="number"]')
    const startInput = logInputs[logInputs.length - 2]
    const endInput = logInputs[logInputs.length - 1]
    expect(startInput).toBeDefined()
    expect(endInput).toBeDefined()
    await startInput!.setValue('10')
    await endInput!.setValue('30')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    expect(store.books[0]!.logs).toHaveLength(1)
    expect(store.books[0]!.logs[0]!.date.slice(0, 10)).toBe('2026-04-05')
  })

  it('updates current page without adding a reading log', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    const openEditorButton = wrapper.findAll('button').find(button => button.text() === '페이지 수정')
    await openEditorButton?.trigger('click')

    const pageInput = wrapper.find('input[max="100"]')
    await pageInput.setValue('35')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    expect(store.books[0]!.currentPage).toBe(35)
    expect(store.books[0]!.logs).toHaveLength(0)
    expect(store.books[0]!.status).toBe('READING')
  })

  it('saves a review and rating', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'READ' })
    expect(store.books[0]).toBeDefined()
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    const rateButton = wrapper.find('button[aria-label="Rate 4 stars"]')
    await rateButton.trigger('click')
    await wrapper.find('#review').setValue('Excellent ending')

    const saveReviewButton = wrapper.find('button[aria-label="Save review"]')
    await saveReviewButton.trigger('click')

    expect(store.books[0]).toBeDefined()
    expect(store.books[0]!.rating).toBe(4)
    expect(store.books[0]!.review).toBe('Excellent ending')
    expect(wrapper.text()).toContain('리뷰와 별점을 저장했습니다.')
  })

  it('shows an in-app delete confirmation and restores the book when undo is clicked', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    expect(store.books[0]).toBeDefined()
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button[aria-label="Delete book"]').trigger('click')
    expect(wrapper.text()).toContain('이 책을 삭제할까요?')
    expect(store.books).toHaveLength(1)

    await wrapper.find('button[aria-label="Confirm delete"]').trigger('click')
    await flushPromises()

    expect(store.books).toHaveLength(0)
    expect(wrapper.text()).toContain('삭제했습니다.')
    expect(wrapper.find('button[aria-label="Undo delete"]').exists()).toBe(true)
    expect(router.currentRoute.value.fullPath).toBe(`/books/${bookId}`)

    await wrapper.find('button[aria-label="Undo delete"]').trigger('click')
    await flushPromises()

    expect(store.books).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe('Book')
  })

  it('falls back to missing-book state after the undo window expires', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button[aria-label="Delete book"]').trigger('click')
    await wrapper.find('button[aria-label="Confirm delete"]').trigger('click')
    await flushPromises()

    vi.advanceTimersByTime(5000)
    await flushPromises()

    expect(wrapper.text()).toContain('책을 찾을 수 없습니다.')
    expect(wrapper.find('button[aria-label="Undo delete"]').exists()).toBe(false)
  })

  it('edits book details and saves changes', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Original Title', author: 'Original Author', totalPages: 100, status: 'TO_READ' })
    const bookId = store.books[0]!.id

    const router = createTestRouter()
    await router.push(`/books/${bookId}`)
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    // Enter edit mode
    await wrapper.find('button[aria-label="Edit book"]').trigger('click')
    
    // Check if inputs are visible
    const titleInput = wrapper.find('input[placeholder="책 제목"]')
    const authorInput = wrapper.find('input[placeholder="저자"]')
    const numberInputs = wrapper.findAll('input[type="number"]')
    const pagesInput = numberInputs[0]
    const currentPageInput = numberInputs[1]
    const dateInputs = wrapper.findAll('input[type="date"]')
    
    expect(titleInput.exists()).toBe(true)
    expect(authorInput.exists()).toBe(true)
    expect(currentPageInput).toBeDefined()
    expect(dateInputs[0]).toBeDefined()
    expect(dateInputs[1]).toBeDefined()

    // Modify values
    await titleInput.setValue('Updated Title')
    await authorInput.setValue('Updated Author')
    expect(pagesInput).toBeDefined()
    await pagesInput!.setValue('150')
    await currentPageInput!.setValue('42')
    await dateInputs[0]!.setValue('2026-03-01')
    await dateInputs[1]!.setValue('2026-03-15')

    // Save changes
    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    // Verify store update
    expect(store.books[0]!.title).toBe('Updated Title')
    expect(store.books[0]!.author).toBe('Updated Author')
    expect(store.books[0]!.totalPages).toBe(150)
    expect(store.books[0]!.currentPage).toBe(42)
    expect(store.books[0]!.startDate?.slice(0, 10)).toBe('2026-03-01')
    expect(store.books[0]!.endDate?.slice(0, 10)).toBe('2026-03-15')

    // Verify UI switched back to display mode
    expect(wrapper.find('h1').text()).toBe('Updated Title')
    expect(wrapper.text()).toContain('Updated Author')
    expect(wrapper.find('input[placeholder="책 제목"]').exists()).toBe(false)
  })
})
