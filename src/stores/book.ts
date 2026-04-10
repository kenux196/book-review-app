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
import {
  toTrimmedText,
  normalizeRating,
  normalizePositiveInt,
  clamp,
} from './bookPersistenceUtils'
import { getBookRepository } from './bookRepositoryProvider'

const STATUS_ORDER: BookStatus[] = ['TO_READ', 'READING', 'READ', 'STOPPED']

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
  const isHydrated = ref(false)

  const repository = getBookRepository()
  let initializePromise: Promise<void> | null = null
  let persistQueue = Promise.resolve()

  const enqueuePersist = (task: () => Promise<void>) => {
    persistQueue = persistQueue
      .then(task)
      .catch(error => console.error('Failed to persist book store:', error))
  }

  const initialize = (): Promise<void> => {
    initializePromise ??= (async () => {
      const snapshot = await repository.hydrate()
      books.value = snapshot.books
      theme.value = snapshot.theme
      document.documentElement.classList.toggle('dark', snapshot.theme === 'dark')
      isHydrated.value = true
    })()
    return initializePromise
  }

  watch(
    books,
    value => {
      if (!isHydrated.value) return
      const snapshot = JSON.parse(JSON.stringify(value)) as Book[]
      enqueuePersist(() => repository.saveBooks(snapshot))
    },
    { deep: true },
  )

  watch(theme, value => {
    document.documentElement.classList.toggle('dark', value === 'dark')
    if (!isHydrated.value) return
    enqueuePersist(() => repository.saveTheme(value))
  })

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

    const tags = Array.isArray(draft.tags)
      ? draft.tags.map(t => t.trim()).filter(t => t.length > 0)
      : []

    let nextBook: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      coverUrl,
      totalPages,
      currentPage: initialCurrentPage,
      status,
      tags,
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

    const tags = 'tags' in updates && Array.isArray(updates.tags)
      ? updates.tags.map(t => t.trim()).filter(t => t.length > 0)
      : target.tags

    let nextBook: Book = {
      ...target,
      title,
      author,
      coverUrl: 'coverUrl' in updates ? toTrimmedText(updates.coverUrl) : target.coverUrl,
      totalPages,
      currentPage,
      tags,
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

  const updateTags = (bookId: string, tags: string[]): StoreActionResult => {
    const target = getBookById(bookId)
    if (!target) return { ok: false, message: '책을 찾을 수 없습니다.' }

    const normalized = [...new Set(tags.map(t => t.trim()).filter(t => t.length > 0))]
    const index = books.value.findIndex(book => book.id === bookId)
    books.value[index] = { ...target, tags: normalized }

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
    isHydrated,
    initialize,
    readingBooks,
    readBooks,
    getBookById,
    addBook,
    updateBook,
    updateTags,
    addReadingLog,
    saveReview,
    deleteBook,
    setTheme,
  }
})
