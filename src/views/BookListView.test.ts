import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import BookListView from './BookListView.vue'
import { setupLocalStorageMock, setupTestPinia, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/books', component: BookListView },
    { path: '/books/:id', name: 'book-detail', component: { template: '<div>Detail</div>' } },
  ],
})

describe('BookListView', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  it('adds a valid book through the form', async () => {
    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Book Title"]').setValue('New Book')
    await wrapper.find('input[placeholder="Author Name"]').setValue('New Author')
    await wrapper.find('input[placeholder="Total Pages"]').setValue('320')
    await wrapper.find('input[placeholder="https://example.com/cover.jpg"]').setValue('https://example.com/book.jpg')

    const saveButton = wrapper.findAll('button').find(button => button.text() === 'Save Book')
    await saveButton?.trigger('click')

    const store = useBookStore()
    expect(store.books).toHaveLength(1)
    expect(store.books[0]).toBeDefined()
    expect(store.books[0]!.title).toBe('New Book')
    expect(store.books[0]!.coverUrl).toBe('https://example.com/book.jpg')
  })

  it('shows an inline error for invalid input', async () => {
    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Book Title"]').setValue(' ')
    await wrapper.find('input[placeholder="Author Name"]').setValue('Author')
    await wrapper.find('input[placeholder="Total Pages"]').setValue('0')

    const saveButton = wrapper.findAll('button').find(button => button.text() === 'Save Book')
    await saveButton?.trigger('click')

    expect(wrapper.text()).toContain('책 제목을 입력해 주세요.')
  })

  it('filters by search and status', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Clean Code', author: 'Robert Martin', totalPages: 100, status: 'READING' })
    store.addBook({ title: 'Refactoring', author: 'Martin Fowler', totalPages: 100, status: 'TO_READ' })

    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    await wrapper.find('input[placeholder="Search books..."]').setValue('Clean')
    const selects = wrapper.findAll('select')
    expect(selects[0]).toBeDefined()
    await selects[0]!.setValue('READING')

    expect(wrapper.text()).toContain('Clean Code')
    expect(wrapper.text()).not.toContain('Refactoring')
  })

  it('sorts books by title', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Zoo', author: 'Author', totalPages: 100, status: 'TO_READ' })
    store.addBook({ title: 'Alpha', author: 'Author', totalPages: 100, status: 'TO_READ' })

    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    const selects = wrapper.findAll('select')
    expect(selects[1]).toBeDefined()
    await selects[1]!.setValue('TITLE_ASC')

    const titles = wrapper.findAll('h2').map(node => node.text())
    expect(titles[0]).toBe('Alpha')
    expect(titles[1]).toBe('Zoo')
  })

  it('renders fallback empty state copy when no result matches', async () => {
    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('No books found.')
  })
})
