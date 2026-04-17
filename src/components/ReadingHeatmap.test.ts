import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadingHeatmap from './ReadingHeatmap.vue'
import { setupLocalStorageMock, setupTestPinia, clearLocalStorage } from '../test-utils/setup'
import { useBookStore } from '../stores/book'

describe('ReadingHeatmap', () => {
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

  it('shows selected day details when a heatmap cell is clicked', async () => {
    const store = useBookStore()
    store.addBook({ title: 'Heatmap Book', author: 'Author', totalPages: 300, status: 'READING', currentPage: 40 })
    const bookId = store.books[0]!.id
    store.addReadingLog(bookId, { startPage: 1, endPage: 20, date: '2026-04-12' })

    const wrapper = mount(ReadingHeatmap)
    const dayButton = wrapper.find('button[aria-label="2026-04-12에 20페이지를 읽었습니다."]')

    expect(dayButton.exists()).toBe(true)
    await dayButton.trigger('click')

    expect(wrapper.text()).toContain('2026-04-12에 20페이지를 읽었습니다.')
  })

  it('adds a shortcut button to return to the current year', async () => {
    const store = useBookStore()
    store.addBook({ title: 'History Book', author: 'Author', totalPages: 300, status: 'READING', currentPage: 15 })
    const bookId = store.books[0]!.id
    store.addReadingLog(bookId, { startPage: 1, endPage: 15, date: '2025-02-03' })

    const wrapper = mount(ReadingHeatmap)
    const prevYearButton = wrapper.find('button[aria-label="이전 연도"]')
    expect(prevYearButton.exists()).toBe(true)
    await prevYearButton.trigger('click')

    expect(wrapper.text()).toContain('2025년 독서 기록')

    const currentYearButton = wrapper.find('button[aria-label="현재 연도로 이동"]')
    expect(currentYearButton.exists()).toBe(true)
    await currentYearButton.trigger('click')

    expect(wrapper.text()).toContain('2026년 독서 기록')
  })
})
