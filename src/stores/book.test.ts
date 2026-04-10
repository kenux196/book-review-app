import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookStore } from './book'
import { setupTestPinia } from '../test-utils/setup'
import { setBookRepositoryForTests } from './bookRepositoryProvider'
import type { BookRepository, BookStoreSnapshot } from './bookRepository'
import type { Book, ThemePreference } from '../types/book'

class InMemoryBookRepository implements BookRepository {
  snapshot: BookStoreSnapshot = { books: [], theme: 'light' }

  hydrate = vi.fn(async () => structuredClone(this.snapshot))
  saveBooks = vi.fn(async (books: Book[]) => {
    this.snapshot.books = structuredClone(books)
  })
  saveTheme = vi.fn(async (theme: ThemePreference) => {
    this.snapshot.theme = theme
  })
  clear = vi.fn(async () => {
    this.snapshot = { books: [], theme: 'light' }
  })
}

const getFirstBook = (store: ReturnType<typeof useBookStore>) => {
  expect(store.books[0]).toBeDefined()
  return store.books[0]!
}

describe('useBookStore', () => {
  let repo: InMemoryBookRepository

  beforeEach(() => {
    repo = new InMemoryBookRepository()
    setBookRepositoryForTests(repo)
    setupTestPinia()
    document.documentElement.className = ''
  })

  afterEach(() => {
    setBookRepositoryForTests()
  })

  it('rejects invalid book input', async () => {
    const store = useBookStore()
    await store.initialize()

    expect(store.addBook({
      title: '   ',
      author: 'Author',
      totalPages: 100,
      status: 'TO_READ',
    })).toEqual({ ok: false, message: '책 제목을 입력해 주세요.' })

    expect(store.books).toHaveLength(0)
  })

  it('adds a normalized book and persists it', async () => {
    const store = useBookStore()
    await store.initialize()

    const result = store.addBook({
      title: '  Clean Code  ',
      author: '  Robert C. Martin ',
      totalPages: 464,
      status: 'TO_READ',
      coverUrl: ' https://example.com/cover.jpg ',
    })

    await nextTick()

    expect(result).toEqual({ ok: true })
    expect(getFirstBook(store).title).toBe('Clean Code')
    expect(getFirstBook(store).author).toBe('Robert C. Martin')
    expect(getFirstBook(store).coverUrl).toBe('https://example.com/cover.jpg')
    expect(repo.saveBooks).toHaveBeenCalled()
  })

  it('applies status transitions when moving to reading and read', async () => {
    const store = useBookStore()
    await store.initialize()

    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    const bookId = getFirstBook(store).id

    expect(store.updateBook(bookId, { status: 'READING' })).toEqual({ ok: true })
    expect(getFirstBook(store).startDate).toBeTruthy()

    expect(store.updateBook(bookId, { status: 'READ' })).toEqual({ ok: true })
    expect(getFirstBook(store).endDate).toBeTruthy()
    expect(getFirstBook(store).currentPage).toBe(100)
  })

  it('rejects out-of-range current page updates', async () => {
    const store = useBookStore()
    await store.initialize()

    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })

    const result = store.updateBook(getFirstBook(store).id, { currentPage: 120 })

    expect(result).toEqual({ ok: false, message: '현재 페이지는 0에서 전체 페이지 수 사이여야 합니다.' })
  })

  it('validates reading log boundaries and updates progress', async () => {
    const store = useBookStore()
    await store.initialize()

    store.addBook({ title: 'Book', author: 'Author', totalPages: 300, status: 'TO_READ' })
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
    expect(getFirstBook(store).logs[0]!.content).toBe('first session')
    expect(getFirstBook(store).currentPage).toBe(25)
    expect(getFirstBook(store).status).toBe('READING')
  })

  it('saves reviews with trim and rating validation', async () => {
    const store = useBookStore()
    await store.initialize()

    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })
    const bookId = getFirstBook(store).id

    expect(store.saveReview(bookId, { rating: 7, review: 'x' })).toEqual({
      ok: false,
      message: '별점은 1점에서 5점 사이여야 합니다.',
    })

    expect(store.saveReview(bookId, { rating: 4, review: '  worth rereading  ' })).toEqual({ ok: true })

    expect(getFirstBook(store).rating).toBe(4)
    expect(getFirstBook(store).review).toBe('worth rereading')
  })

  it('hydrates books from repository on initialize', async () => {
    repo.snapshot.books = [
      {
        id: 'preloaded-1',
        title: 'Pre-loaded Book',
        author: 'Author',
        totalPages: 200,
        currentPage: 0,
        status: 'TO_READ',
        tags: [],
        logs: [],
        createdAt: new Date().toISOString(),
      },
    ]

    const store = useBookStore()
    await store.initialize()

    expect(store.books).toHaveLength(1)
    expect(getFirstBook(store).title).toBe('Pre-loaded Book')
  })

  it('persists theme and toggles the dark class', async () => {
    const store = useBookStore()
    await store.initialize()

    store.setTheme('dark')
    await nextTick()
    await Promise.resolve()

    expect(store.theme).toBe('dark')
    expect(repo.saveTheme).toHaveBeenCalledWith('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('deletes books safely', async () => {
    const store = useBookStore()
    await store.initialize()

    store.addBook({ title: 'Book', author: 'Author', totalPages: 100, status: 'TO_READ' })

    expect(store.deleteBook(getFirstBook(store).id)).toEqual({ ok: true })
    expect(store.books).toHaveLength(0)
  })

  it('loads theme from repository on initialize', async () => {
    repo.snapshot.theme = 'dark'

    const store = useBookStore()
    await store.initialize()

    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
