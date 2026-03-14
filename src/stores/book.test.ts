import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBookStore } from './book'
import { setupLocalStorageMock, setupTestPinia, clearLocalStorage } from '../test-utils/setup'

const getFirstBook = (store: ReturnType<typeof useBookStore>) => {
  expect(store.books[0]).toBeDefined()
  return store.books[0]!
}

describe('useBookStore', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
    document.documentElement.className = ''
  })

  it('rejects invalid book input', () => {
    const store = useBookStore()

    expect(store.addBook({
      title: '   ',
      author: 'Author',
      totalPages: 100,
      status: 'TO_READ',
    })).toEqual({ ok: false, message: '책 제목을 입력해 주세요.' })

    expect(store.books).toHaveLength(0)
  })

  it('adds a normalized book and persists it', () => {
    const store = useBookStore()

    const result = store.addBook({
      title: '  Clean Code  ',
      author: '  Robert C. Martin ',
      totalPages: 464,
      status: 'TO_READ',
      coverUrl: ' https://example.com/cover.jpg ',
    })

    expect(result).toEqual({ ok: true })
    expect(getFirstBook(store).title).toBe('Clean Code')
    expect(getFirstBook(store).author).toBe('Robert C. Martin')
    expect(getFirstBook(store).coverUrl).toBe('https://example.com/cover.jpg')
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('applies status transitions when moving to reading and read', () => {
    const store = useBookStore()
    store.addBook({
      title: 'Book',
      author: 'Author',
      totalPages: 100,
      status: 'TO_READ',
    })

    const bookId = getFirstBook(store).id

    expect(store.updateBook(bookId, { status: 'READING' })).toEqual({ ok: true })
    expect(getFirstBook(store).startDate).toBeTruthy()

    expect(store.updateBook(bookId, { status: 'READ' })).toEqual({ ok: true })
    expect(getFirstBook(store).endDate).toBeTruthy()
    expect(getFirstBook(store).currentPage).toBe(100)
  })

  it('rejects out-of-range current page updates', () => {
    const store = useBookStore()
    store.addBook({
      title: 'Book',
      author: 'Author',
      totalPages: 100,
      status: 'TO_READ',
    })

    const result = store.updateBook(getFirstBook(store).id, { currentPage: 120 })

    expect(result).toEqual({ ok: false, message: '현재 페이지는 0에서 전체 페이지 수 사이여야 합니다.' })
  })

  it('validates reading log boundaries and updates progress', () => {
    const store = useBookStore()
    store.addBook({
      title: 'Book',
      author: 'Author',
      totalPages: 300,
      status: 'TO_READ',
    })

    const bookId = getFirstBook(store).id

    expect(store.addReadingLog(bookId, {
      startPage: 20,
      endPage: 10,
      content: 'invalid',
    })).toEqual({ ok: false, message: '종료 페이지는 시작 페이지보다 같거나 커야 합니다.' })

    expect(store.addReadingLog(bookId, {
      startPage: 1,
      endPage: 25,
      content: '  first session  ',
    })).toEqual({ ok: true })

    expect(getFirstBook(store).logs).toHaveLength(1)
    expect(getFirstBook(store).logs[0]).toBeDefined()
    expect(getFirstBook(store).logs[0]!.content).toBe('first session')
    expect(getFirstBook(store).currentPage).toBe(25)
    expect(getFirstBook(store).status).toBe('READING')
  })

  it('saves reviews with trim and rating validation', () => {
    const store = useBookStore()
    store.addBook({
      title: 'Book',
      author: 'Author',
      totalPages: 100,
      status: 'TO_READ',
    })

    const bookId = getFirstBook(store).id

    expect(store.saveReview(bookId, { rating: 7, review: 'x' })).toEqual({
      ok: false,
      message: '별점은 1점에서 5점 사이여야 합니다.',
    })

    expect(store.saveReview(bookId, {
      rating: 4,
      review: '  worth rereading  ',
    })).toEqual({ ok: true })

    expect(getFirstBook(store).rating).toBe(4)
    expect(getFirstBook(store).review).toBe('worth rereading')
  })

  it('normalizes stored books when loading from localStorage', () => {
    localStorage.setItem('booklog-books', JSON.stringify([
      {
        id: 'legacy-1',
        title: ' Legacy Book ',
        author: ' Author ',
        totalPages: 0,
        currentPage: 999,
        status: 'READING',
        logs: [{ startPage: 1, endPage: 5 }],
      },
      {
        id: 'legacy-2',
        title: ' ',
        author: 'Ignored',
      },
    ]))

    setupTestPinia()
    const store = useBookStore()

    expect(store.books).toHaveLength(1)
    expect(getFirstBook(store).title).toBe('Legacy Book')
    expect(getFirstBook(store).totalPages).toBe(1)
    expect(getFirstBook(store).currentPage).toBe(1)
  })

  it('persists theme and toggles the dark class', async () => {
    const store = useBookStore()

    store.setTheme('dark')
    await nextTick()

    expect(store.theme).toBe('dark')
    expect(localStorage.setItem).toHaveBeenLastCalledWith('booklog-theme', 'dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('deletes books safely', () => {
    const store = useBookStore()
    store.addBook({
      title: 'Book',
      author: 'Author',
      totalPages: 100,
      status: 'TO_READ',
    })

    expect(store.deleteBook(getFirstBook(store).id)).toEqual({ ok: true })
    expect(store.books).toHaveLength(0)
  })

  it('falls back to light theme when stored value is invalid', () => {
    localStorage.setItem('booklog-theme', 'sepia')

    setupTestPinia()
    const store = useBookStore()

    expect(store.theme).toBe('light')
  })
})
