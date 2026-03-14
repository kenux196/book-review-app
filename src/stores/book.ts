import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  Book,
  BookDraft,
  BookStatus,
  ReadingLog,
  ReadingLogDraft,
  ReviewDraft,
  StoreActionResult,
  ThemePreference,
} from '../types/book'

const BOOKS_STORAGE_KEY = 'booklog-books'
const THEME_STORAGE_KEY = 'booklog-theme'

const STATUS_ORDER: BookStatus[] = ['TO_READ', 'READING', 'READ', 'STOPPED']

const toTrimmedText = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const normalizeRating = (value: unknown) => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
    ? value
    : undefined
}

const normalizePositiveInt = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const normalized = Math.floor(value)
  return normalized > 0 ? normalized : fallback
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const normalizeLog = (value: unknown, totalPages: number): ReadingLog | undefined => {
  if (!value || typeof value !== 'object') return undefined

  const raw = value as Partial<ReadingLog>
  const startPage = Math.floor(Number(raw.startPage))
  const endPage = Math.floor(Number(raw.endPage))

  if (!Number.isFinite(startPage) || !Number.isFinite(endPage)) return undefined
  if (startPage < 1 || endPage < startPage || endPage > totalPages) return undefined

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === 'string' && raw.date ? raw.date : new Date().toISOString(),
    startPage,
    endPage,
    content: toTrimmedText(raw.content),
  }
}

const normalizeBookRecord = (value: unknown): Book | undefined => {
  if (!value || typeof value !== 'object') return undefined

  const raw = value as Partial<Book>
  const title = toTrimmedText(raw.title)
  const author = toTrimmedText(raw.author)

  if (!title || !author) return undefined

  const totalPages = normalizePositiveInt(raw.totalPages, 1)
  const currentPage = clamp(Math.floor(Number(raw.currentPage ?? 0)) || 0, 0, totalPages)
  const status = STATUS_ORDER.includes(raw.status as BookStatus) ? raw.status as BookStatus : 'TO_READ'
  const logs = Array.isArray(raw.logs)
    ? raw.logs
        .map(log => normalizeLog(log, totalPages))
        .filter((log): log is ReadingLog => Boolean(log))
    : []

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
    title,
    author,
    coverUrl: toTrimmedText(raw.coverUrl),
    totalPages,
    currentPage,
    status,
    startDate: typeof raw.startDate === 'string' && raw.startDate ? raw.startDate : undefined,
    endDate: typeof raw.endDate === 'string' && raw.endDate ? raw.endDate : undefined,
    rating: normalizeRating(raw.rating),
    review: toTrimmedText(raw.review),
    logs,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString(),
  }
}

const withStatusTransitions = (book: Book, nextStatus: BookStatus) => {
  const now = new Date().toISOString()
  const nextBook = { ...book, status: nextStatus }

  if (nextStatus === 'READING' && !nextBook.startDate) {
    nextBook.startDate = now
  }

  if (nextStatus === 'READ') {
    nextBook.currentPage = nextBook.totalPages
    nextBook.endDate = nextBook.endDate ?? now
    nextBook.startDate = nextBook.startDate ?? now
  }

  return nextBook
}

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])
  const theme = ref<ThemePreference>('light')

  const loadBooks = () => {
    try {
      const stored = localStorage.getItem(BOOKS_STORAGE_KEY)
      if (!stored) {
        books.value = []
        return
      }

      const parsed = JSON.parse(stored)
      books.value = Array.isArray(parsed)
        ? parsed
            .map(item => normalizeBookRecord(item))
            .filter((item): item is Book => Boolean(item))
        : []
    } catch (error) {
      console.error('Failed to load books from localStorage:', error)
      books.value = []
    }
  }

  const loadTheme = () => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      theme.value = stored === 'dark' ? 'dark' : 'light'
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error)
      theme.value = 'light'
    }
  }

  const persistBooks = () => {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books.value))
  }

  const persistTheme = () => {
    localStorage.setItem(THEME_STORAGE_KEY, theme.value)
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  loadBooks()
  loadTheme()

  watch(books, persistBooks, { deep: true })
  watch(theme, persistTheme, { immediate: true })

  const readingBooks = computed(() => books.value.filter(book => book.status === 'READING'))
  const readBooks = computed(() => books.value.filter(book => book.status === 'READ'))

  const getBookById = (id: string) => {
    return books.value.find(book => book.id === id)
  }

  const addBook = (draft: BookDraft): StoreActionResult => {
    const title = toTrimmedText(draft.title)
    const author = toTrimmedText(draft.author)
    const coverUrl = toTrimmedText(draft.coverUrl)
    const totalPages = Math.floor(Number(draft.totalPages))

    if (!title) return { ok: false, message: '책 제목을 입력해 주세요.' }
    if (!author) return { ok: false, message: '저자를 입력해 주세요.' }
    if (!Number.isFinite(totalPages) || totalPages <= 0) {
      return { ok: false, message: '전체 페이지 수는 1 이상이어야 합니다.' }
    }

    const status = STATUS_ORDER.includes(draft.status) ? draft.status : 'TO_READ'
    const initialCurrentPage = clamp(Math.floor(Number(draft.currentPage ?? 0)) || 0, 0, totalPages)

    let nextBook: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      coverUrl,
      totalPages,
      currentPage: initialCurrentPage,
      status,
      logs: [],
      createdAt: new Date().toISOString(),
    }

    nextBook = withStatusTransitions(nextBook, status)
    books.value.push(nextBook)

    return { ok: true }
  }

  const updateBook = (id: string, updates: Partial<BookDraft> & Pick<Partial<Book>, 'currentPage'>): StoreActionResult => {
    const target = getBookById(id)
    if (!target) return { ok: false, message: '책을 찾을 수 없습니다.' }

    const title = 'title' in updates ? toTrimmedText(updates.title) : target.title
    const author = 'author' in updates ? toTrimmedText(updates.author) : target.author
    const totalPages = 'totalPages' in updates
      ? Math.floor(Number(updates.totalPages))
      : target.totalPages

    if (!title) return { ok: false, message: '책 제목을 입력해 주세요.' }
    if (!author) return { ok: false, message: '저자를 입력해 주세요.' }
    if (!Number.isFinite(totalPages) || totalPages <= 0) {
      return { ok: false, message: '전체 페이지 수는 1 이상이어야 합니다.' }
    }

    const currentPage = 'currentPage' in updates && updates.currentPage !== undefined
      ? Math.floor(Number(updates.currentPage))
      : target.currentPage

    if (!Number.isFinite(currentPage) || currentPage < 0 || currentPage > totalPages) {
      return { ok: false, message: '현재 페이지는 0에서 전체 페이지 수 사이여야 합니다.' }
    }

    const nextStatus = 'status' in updates && updates.status ? updates.status : target.status
    const index = books.value.findIndex(book => book.id === id)

    let nextBook: Book = {
      ...target,
      title,
      author,
      coverUrl: 'coverUrl' in updates ? toTrimmedText(updates.coverUrl) : target.coverUrl,
      totalPages,
      currentPage,
      status: STATUS_ORDER.includes(nextStatus) ? nextStatus : target.status,
    }

    nextBook = withStatusTransitions(nextBook, nextBook.status)
    books.value[index] = nextBook

    return { ok: true }
  }

  const addReadingLog = (bookId: string, draft: ReadingLogDraft): StoreActionResult => {
    const target = getBookById(bookId)
    if (!target) return { ok: false, message: '책을 찾을 수 없습니다.' }

    const startPage = Math.floor(Number(draft.startPage))
    const endPage = Math.floor(Number(draft.endPage))

    if (!Number.isFinite(startPage) || !Number.isFinite(endPage)) {
      return { ok: false, message: '페이지 번호를 올바르게 입력해 주세요.' }
    }
    if (startPage < 1) return { ok: false, message: '시작 페이지는 1 이상이어야 합니다.' }
    if (endPage < startPage) return { ok: false, message: '종료 페이지는 시작 페이지보다 같거나 커야 합니다.' }
    if (endPage > target.totalPages) {
      return { ok: false, message: '종료 페이지는 전체 페이지 수를 넘을 수 없습니다.' }
    }

    const log: ReadingLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      startPage,
      endPage,
      content: toTrimmedText(draft.content),
    }

    const index = books.value.findIndex(book => book.id === bookId)
    let nextBook: Book = {
      ...target,
      currentPage: Math.max(target.currentPage, endPage),
      logs: [...target.logs, log],
    }

    if (nextBook.status === 'TO_READ') {
      nextBook = withStatusTransitions(nextBook, 'READING')
    } else if (nextBook.currentPage === nextBook.totalPages) {
      nextBook = withStatusTransitions(nextBook, 'READ')
    }

    books.value[index] = nextBook
    return { ok: true }
  }

  const saveReview = (bookId: string, draft: ReviewDraft): StoreActionResult => {
    const target = getBookById(bookId)
    if (!target) return { ok: false, message: '책을 찾을 수 없습니다.' }

    const rating = normalizeRating(draft.rating)
    const review = toTrimmedText(draft.review)

    if ('rating' in draft && draft.rating !== undefined && rating === undefined) {
      return { ok: false, message: '별점은 1점에서 5점 사이여야 합니다.' }
    }

    const index = books.value.findIndex(book => book.id === bookId)
    books.value[index] = {
      ...target,
      rating,
      review,
    }

    return { ok: true }
  }

  const deleteBook = (id: string): StoreActionResult => {
    const nextBooks = books.value.filter(book => book.id !== id)
    if (nextBooks.length === books.value.length) {
      return { ok: false, message: '책을 찾을 수 없습니다.' }
    }

    books.value = nextBooks
    return { ok: true }
  }

  const setTheme = (nextTheme: ThemePreference) => {
    theme.value = nextTheme
  }

  return {
    books,
    theme,
    readingBooks,
    readBooks,
    getBookById,
    addBook,
    updateBook,
    addReadingLog,
    saveReview,
    deleteBook,
    setTheme,
  }
})
