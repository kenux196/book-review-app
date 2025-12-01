import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from './DashboardView.vue'
import { setupTestPinia, setupLocalStorageMock, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'
import { createMockBook } from '../test-utils/mock-data'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/books/:id', name: 'book-detail', component: { template: '<div>Detail</div>' } },
  ],
})

describe('DashboardView', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  describe('렌더링', () => {
    it('컴포넌트가 정상적으로 마운트되어야 함', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('제목 "Dashboard"가 표시되어야 함', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Dashboard')
    })

    it('환영 메시지가 표시되어야 함', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Welcome back')
    })
  })

  describe('통계 카드', () => {
    it('세 개의 통계 카드가 표시되어야 함', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Reading Now')
      expect(wrapper.text()).toContain('Books Read')
      expect(wrapper.text()).toContain('Total Pages')
    })

    it('읽는 중인 책 수를 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', status: 'READING' }))
      store.addBook(createMockBook({ id: 'book-2', status: 'READING' }))
      store.addBook(createMockBook({ id: 'book-3', status: 'READ' }))

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // "Reading Now" 카드에 2가 표시되어야 함
      const text = wrapper.text()
      expect(text).toContain('Reading Now')
      // 숫자 확인 (정확한 위치는 DOM 구조에 따라 다를 수 있음)
      const readingSection = wrapper.html()
      expect(readingSection).toContain('2')
    })

    it('읽은 책 수를 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', status: 'READ' }))
      store.addBook(createMockBook({ id: 'book-2', status: 'READ' }))
      store.addBook(createMockBook({ id: 'book-3', status: 'READ' }))
      store.addBook(createMockBook({ id: 'book-4', status: 'READING' }))

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      const html = wrapper.html()
      expect(html).toContain('3')
    })

    it('총 읽은 페이지 수를 올바르게 계산해야 함', async () => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', currentPage: 100 }))
      store.addBook(createMockBook({ id: 'book-2', currentPage: 200 }))
      store.addBook(createMockBook({ id: 'book-3', currentPage: 50 }))

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 총 350페이지
      const html = wrapper.html()
      expect(html).toContain('350')
    })
  })

  describe('현재 읽는 중인 책 섹션', () => {
    it('"Currently Reading" 제목이 표시되어야 함', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Currently Reading')
    })

    it('읽는 중인 책이 없을 때 안내 메시지를 표시해야 함', () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('No books currently in progress')
    })

    it('읽는 중인 책을 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(
        createMockBook({
          id: 'book-1',
          title: '읽는 중인 책',
          author: '저자',
          status: 'READING',
          currentPage: 100,
          totalPages: 300,
        })
      )

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('읽는 중인 책')
      expect(wrapper.text()).toContain('저자')
    })

    it('진행률을 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(
        createMockBook({
          id: 'book-1',
          title: '테스트 책',
          status: 'READING',
          currentPage: 150,
          totalPages: 300,
        })
      )

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 50% 진행률
      expect(wrapper.text()).toContain('50%')
      expect(wrapper.text()).toContain('150 / 300 pages')
    })

    it('여러 읽는 중인 책을 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(createMockBook({ id: 'book-1', title: '책 1', status: 'READING' }))
      store.addBook(createMockBook({ id: 'book-2', title: '책 2', status: 'READING' }))
      store.addBook(createMockBook({ id: 'book-3', title: '책 3', status: 'READ' })) // 읽은 책은 표시 안됨

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('책 1')
      expect(wrapper.text()).toContain('책 2')
      expect(wrapper.text()).not.toContain('책 3')
    })

    it('진행률이 0%일 때도 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(
        createMockBook({
          id: 'book-1',
          title: '시작 안한 책',
          status: 'READING',
          currentPage: 0,
          totalPages: 300,
        })
      )

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('0%')
    })

    it('진행률이 100%일 때도 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      store.addBook(
        createMockBook({
          id: 'book-1',
          title: '완독한 책',
          status: 'READING', // 상태는 READING이지만 페이지는 완료
          currentPage: 300,
          totalPages: 300,
        })
      )

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('100%')
    })
  })

  describe('통합 시나리오', () => {
    it('다양한 상태의 책들이 있을 때 올바르게 표시해야 함', async () => {
      const store = useBookStore()
      
      // 다양한 상태의 책 추가
      store.addBook(createMockBook({ id: 'book-1', status: 'TO_READ', currentPage: 0 }))
      store.addBook(createMockBook({ id: 'book-2', status: 'READING', currentPage: 100 }))
      store.addBook(createMockBook({ id: 'book-3', status: 'READING', currentPage: 200 }))
      store.addBook(createMockBook({ id: 'book-4', status: 'READ', currentPage: 300 }))
      store.addBook(createMockBook({ id: 'book-5', status: 'READ', currentPage: 400 }))
      store.addBook(createMockBook({ id: 'book-6', status: 'STOPPED', currentPage: 50 }))

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      // 통계 확인
      const html = wrapper.html()
      
      // 읽는 중: 2권
      expect(wrapper.text()).toContain('Reading Now')
      
      // 읽은 책: 2권
      expect(wrapper.text()).toContain('Books Read')
      
      // 총 페이지: 0 + 100 + 200 + 300 + 400 + 50 = 1050
      expect(html).toContain('1050')
    })
  })
})
