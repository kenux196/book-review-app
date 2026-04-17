import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import DashboardView from './DashboardView.vue'
import { setupLocalStorageMock, setupTestPinia, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/books', component: { template: '<div>Books</div>' } },
    { path: '/books/:id', name: 'book-detail', component: { template: '<div>Detail</div>' } },
  ],
})

describe('DashboardView', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  it('renders empty-state CTA when nothing is being read', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(DashboardView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('지금 읽는 책이 없습니다.')
    expect(wrapper.text()).toContain('책 추가하거나 시작하기')
  })

  it('shows aggregate stats and reading cards', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Reading Book', author: 'Author', totalPages: 300, status: 'READING', currentPage: 150 })
    store.addBook({ title: 'Finished Book', author: 'Author', totalPages: 200, status: 'READ' })

    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(DashboardView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('지금 읽는 책')
    expect(wrapper.text()).toContain('완독한 책')
    expect(wrapper.text()).toContain('350')
    expect(wrapper.text()).toContain('Reading Book')
    expect(wrapper.text()).toContain('150 / 300 페이지')
  })

  it('links the top CTA directly to the active reading book', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Current Book', author: 'Author', totalPages: 280, status: 'READING', currentPage: 88 })

    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(DashboardView, {
      global: { plugins: [router] },
    })

    const continueLink = wrapper.findAllComponents({ name: 'RouterLink' })
      .find(link => link.text() === '이어 읽기')

    expect(continueLink?.props('to')).toBe(`/books/${store.readingBooks[0]?.id}`)
    expect(wrapper.text()).toContain('Current Book')
    expect(wrapper.text()).toContain('88 / 280 페이지')
  })
})
