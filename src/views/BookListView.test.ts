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
    await wrapper.find('input[placeholder="책 제목"]').setValue('New Book')
    await wrapper.find('input[placeholder="저자명"]').setValue('New Author')
    await wrapper.find('input[placeholder="전체 페이지 수"]').setValue('320')
    await wrapper.find('input[placeholder="https://example.com/cover.jpg"]').setValue('https://example.com/book.jpg')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    const store = useBookStore()
    expect(store.books).toHaveLength(1)
    expect(store.books[0]).toBeDefined()
    expect(store.books[0]!.title).toBe('New Book')
    expect(store.books[0]!.coverUrl).toBe('https://example.com/book.jpg')
  })

  it('captures initial reading status and progress when adding a book', async () => {
    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="책 제목"]').setValue('Currently Reading')
    await wrapper.find('input[placeholder="저자명"]').setValue('Reader')
    await wrapper.find('input[placeholder="전체 페이지 수"]').setValue('280')
    await wrapper.find('select[aria-label="초기 상태"]').setValue('READING')
    await wrapper.find('input[placeholder="현재 페이지"]').setValue('48')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    const store = useBookStore()
    expect(store.books).toHaveLength(1)
    expect(store.books[0]!.status).toBe('READING')
    expect(store.books[0]!.currentPage).toBe(48)
    expect(store.books[0]!.startDate).toBeTruthy()
  })

  it('hides progress input for completed books and saves them as finished', async () => {
    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="책 제목"]').setValue('Finished Book')
    await wrapper.find('input[placeholder="저자명"]').setValue('Finisher')
    await wrapper.find('input[placeholder="전체 페이지 수"]').setValue('410')
    await wrapper.find('select[aria-label="초기 상태"]').setValue('READ')

    expect(wrapper.find('input[placeholder="현재 페이지"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('100%')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
    await saveButton?.trigger('click')

    const store = useBookStore()
    expect(store.books).toHaveLength(1)
    expect(store.books[0]!.status).toBe('READ')
    expect(store.books[0]!.currentPage).toBe(410)
    expect(store.books[0]!.endDate).toBeTruthy()
  })

  it('shows an inline error for invalid input', async () => {
    const router = createTestRouter()
    await router.push('/books')
    await router.isReady()

    const wrapper = mount(BookListView, {
      global: { plugins: [router] },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="책 제목"]').setValue(' ')
    await wrapper.find('input[placeholder="저자명"]').setValue('Author')
    await wrapper.find('input[placeholder="전체 페이지 수"]').setValue('0')

    const saveButton = wrapper.findAll('button').find(button => button.text() === '저장')
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

    await wrapper.find('input[placeholder="책 제목, 저자, 태그 검색"]').setValue('Clean')
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

    expect(wrapper.text()).toContain('조건에 맞는 책이 없습니다.')
  })
})
