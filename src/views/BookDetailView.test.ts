import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('renders a missing-book state', async () => {
    const router = createTestRouter()
    await router.push('/books/missing')
    await router.isReady()

    const wrapper = mount(BookDetailView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('Book not found.')
    expect(wrapper.text()).toContain('Go to Library')
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

    const toggleButton = wrapper.findAll('button').find(button => button.text() === 'Add Log')
    await toggleButton?.trigger('click')
    const numberInputs = wrapper.findAll('input[type="number"]')
    expect(numberInputs[0]).toBeDefined()
    expect(numberInputs[1]).toBeDefined()
    await numberInputs[0]!.setValue('50')
    await numberInputs[1]!.setValue('10')

    const saveButton = wrapper.findAll('button').find(button => button.text() === 'Save Log')
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

    const toggleButton = wrapper.findAll('button').find(button => button.text() === 'Add Log')
    await toggleButton?.trigger('click')
    const numberInputs = wrapper.findAll('input[type="number"]')
    expect(numberInputs[0]).toBeDefined()
    expect(numberInputs[1]).toBeDefined()
    await numberInputs[0]!.setValue('1')
    await numberInputs[1]!.setValue('20')
    await wrapper.find('textarea[placeholder="What stood out today?"]').setValue('Solid opening')

    const saveButton = wrapper.findAll('button').find(button => button.text() === 'Save Log')
    await saveButton?.trigger('click')

    expect(store.books[0]).toBeDefined()
    expect(store.books[0]!.logs).toHaveLength(1)
    expect(store.books[0]!.currentPage).toBe(20)
    expect(wrapper.text()).toContain('Solid opening')
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

  it('deletes a book and navigates back to library', async () => {
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
    await flushPromises()

    expect(store.books).toHaveLength(0)
    expect(router.currentRoute.value.fullPath).toBe('/books')
  })
})
