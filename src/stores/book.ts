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
  clamp,
  normalizeBookRecord,
  normalizeTheme,
} from './bookPersistenceUtils'
import { getBookRepository } from './bookRepositoryProvider'

const STATUS_ORDER: BookStatus[] = ['TO_READ', 'READING', 'READ', 'STOPPED']
const DELETE_UNDO_WINDOW_MS = 5000
const BACKUP_VERSION = 1

type PendingDeletion = {
  book: Book
  index: number
}

export type BackupPayload = {
  version: number
  exportedAt: string
  theme: ThemePreference
  books: Book[]
}

export type BackupPreview = {
  exportedAt: string
  theme: ThemePreference
  totalBooks: number
  readingBooks: number
  readBooks: number
}

export type BackupPreviewResult =
  | { ok: true; payload: BackupPayload; preview: BackupPreview }
  | { ok: false; message: string }

export type BackupRestoreMode = 'merge' | 'overwrite'

const toIsoDateString = (value: unknown) => {
  if (typeof value !== 'string' || !value) return undefined

  const trimmed = value.trim()
  if (!trimmed) return undefined

  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00.000Z` : trimmed
  const parsed = new Date(candidate)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

const getTodayIso = () => {
  return new Date().toISOString().slice(0, 10)
}

const isFutureDate = (value: string) => value.slice(0, 10) > getTodayIso()

const validateDateRange = (startDate?: string, endDate?: string) => {
  if (startDate && isFutureDate(startDate)) {
    return { ok: false as const, message: '시작일은 미래 날짜일 수 없습니다.' }
  }

  if (endDate && isFutureDate(endDate)) {
    return { ok: false as const, message: '완료일은 미래 날짜일 수 없습니다.' }
  }

  if (startDate && endDate && startDate > endDate) {
    return { ok: false as const, message: '시작일은 완료일보다 늦을 수 없습니다.' }
  }

  return { ok: true as const }
}

const applyProgressTransitions = (book: Book) => {
  if (book.currentPage === book.totalPages && book.status !== 'READ') {
    return withStatusTransitions(book, 'READ')
  }

  if (book.currentPage > 0 && book.status === 'TO_READ') {
    return withStatusTransitions(book, 'READING')
  }

  return book
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

const createBackupPreview = (payload: BackupPayload): BackupPreview => {
  return {
    exportedAt: payload.exportedAt,
    theme: payload.theme,
    totalBooks: payload.books.length,
    readingBooks: payload.books.filter(book => book.status === 'READING').length,
    readBooks: payload.books.filter(book => book.status === 'READ').length,
  }
}

const normalizeBackupPayload = (value: unknown): BackupPayload | undefined => {
  if (Array.isArray(value)) {
    const books = value
      .map(item => normalizeBookRecord(item))
      .filter((book): book is Book => Boolean(book))

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      theme: 'system',
      books,
    }
  }

  if (!value || typeof value !== 'object') return undefined

  const raw = value as Partial<BackupPayload> & { books?: unknown }
  if (!Array.isArray(raw.books)) return undefined

  const books = raw.books
    .map(item => normalizeBookRecord(item))
    .filter((book): book is Book => Boolean(book))

  const exportedAt = typeof raw.exportedAt === 'string' && !Number.isNaN(Date.parse(raw.exportedAt))
    ? raw.exportedAt
    : new Date().toISOString()

  return {
    version: typeof raw.version === 'number' ? raw.version : BACKUP_VERSION,
    exportedAt,
    theme: normalizeTheme(raw.theme),
    books,
  }
}

const mergeBooksById = (currentBooks: Book[], importedBooks: Book[]) => {
  const mergedBooks = [...currentBooks]
  const indexesById = new Map(currentBooks.map((book, index) => [book.id, index]))

  importedBooks.forEach(book => {
    const existingIndex = indexesById.get(book.id)
    if (existingIndex === undefined) {
      indexesById.set(book.id, mergedBooks.length)
      mergedBooks.push(book)
      return
    }

    mergedBooks[existingIndex] = book
  })

  return mergedBooks
}

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])
  const theme = ref<ThemePreference>('system')
  const resolvedTheme = ref<'light' | 'dark'>('light')
  const isHydrated = ref(false)
  const pendingDeletion = ref<PendingDeletion | null>(null)
  const deleteUndoExpiresAt = ref<number | null>(null)

  const repository = getBookRepository()
  let initializePromise: Promise<void> | null = null
  let persistQueue = Promise.resolve()
  let deleteUndoTimer: ReturnType<typeof setTimeout> | null = null
  let themeMediaQuery: MediaQueryList | null = null
  let stopWatchingSystemTheme: (() => void) | null = null

  const resolveSystemTheme = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'light' as const
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const applyResolvedTheme = (preference: ThemePreference) => {
    const nextResolvedTheme = preference === 'system' ? resolveSystemTheme() : preference
    resolvedTheme.value = nextResolvedTheme
    document.documentElement.classList.toggle('dark', nextResolvedTheme === 'dark')
  }

  const syncSystemThemeListener = (preference: ThemePreference) => {
    stopWatchingSystemTheme?.()
    stopWatchingSystemTheme = null

    if (preference !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      themeMediaQuery = null
      return
    }

    themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => applyResolvedTheme('system')

    if (typeof themeMediaQuery.addEventListener === 'function') {
      themeMediaQuery.addEventListener('change', handleThemeChange)
      stopWatchingSystemTheme = () => themeMediaQuery?.removeEventListener('change', handleThemeChange)
      return
    }

    themeMediaQuery.addListener(handleThemeChange)
    stopWatchingSystemTheme = () => themeMediaQuery?.removeListener(handleThemeChange)
  }

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
      syncSystemThemeListener(snapshot.theme)
      applyResolvedTheme(snapshot.theme)
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
    syncSystemThemeListener(value)
    applyResolvedTheme(value)
    if (!isHydrated.value) return
    enqueuePersist(() => repository.saveTheme(value))
  })

  const readingBooks = computed(() => books.value.filter(book => book.status === 'READING'))
  const readBooks = computed(() => books.value.filter(book => book.status === 'READ'))
  const recentlyDeletedBook = computed(() => pendingDeletion.value?.book)

  const clearPendingDeletion = () => {
    if (deleteUndoTimer) {
      clearTimeout(deleteUndoTimer)
      deleteUndoTimer = null
    }

    pendingDeletion.value = null
    deleteUndoExpiresAt.value = null
  }

  const armDeleteUndoWindow = (windowMs = DELETE_UNDO_WINDOW_MS) => {
    if (deleteUndoTimer) {
      clearTimeout(deleteUndoTimer)
    }

    deleteUndoExpiresAt.value = Date.now() + windowMs
    deleteUndoTimer = setTimeout(() => {
      clearPendingDeletion()
    }, windowMs)
  }

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
    const startDate = toIsoDateString(draft.startDate)
    const endDate = toIsoDateString(draft.endDate)

    const dateValidation = validateDateRange(startDate, endDate)
    if (!dateValidation.ok) return dateValidation

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
      startDate,
      endDate,
      tags,
      logs: [],
      createdAt: new Date().toISOString(),
    }

    nextBook = withStatusTransitions(nextBook, status)
    nextBook = applyProgressTransitions(nextBook)
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
    const startDate = 'startDate' in updates ? toIsoDateString(updates.startDate) : target.startDate
    const endDate = 'endDate' in updates ? toIsoDateString(updates.endDate) : target.endDate
    const index = books.value.findIndex(book => book.id === id)

    const dateValidation = validateDateRange(startDate, endDate)
    if (!dateValidation.ok) return dateValidation

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
      startDate,
      endDate,
      tags,
      status: STATUS_ORDER.includes(nextStatus) ? nextStatus : target.status,
    }

    nextBook = withStatusTransitions(nextBook, nextBook.status)
    nextBook = applyProgressTransitions(nextBook)
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

    const logDate = toIsoDateString(draft.date) ?? new Date().toISOString()
    if (isFutureDate(logDate)) {
      return { ok: false, message: '독서 로그 날짜는 미래일 수 없습니다.' }
    }

    const log: ReadingLog = {
      id: crypto.randomUUID(),
      date: logDate,
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
    const index = books.value.findIndex(book => book.id === id)
    if (index === -1) {
      return { ok: false, message: '책을 찾을 수 없습니다.' }
    }

    pendingDeletion.value = {
      book: books.value[index]!,
      index,
    }
    books.value = books.value.filter(book => book.id !== id)
    armDeleteUndoWindow()

    return { ok: true }
  }

  const undoDeleteBook = (): StoreActionResult => {
    if (!pendingDeletion.value) {
      return { ok: false, message: '복구할 삭제 항목이 없습니다.' }
    }

    const { book, index } = pendingDeletion.value
    const nextBooks = [...books.value]
    nextBooks.splice(Math.min(index, nextBooks.length), 0, book)
    books.value = nextBooks
    clearPendingDeletion()

    return { ok: true }
  }

  const cycleTheme = () => {
    if (theme.value === 'system') {
      theme.value = 'dark'
      return
    }

    if (theme.value === 'dark') {
      theme.value = 'light'
      return
    }

    theme.value = 'system'
  }

  const setTheme = (nextTheme: ThemePreference) => {
    theme.value = nextTheme
  }

  const exportBackup = () => {
    const payload: BackupPayload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      theme: theme.value,
      books: JSON.parse(JSON.stringify(books.value)) as Book[],
    }

    return JSON.stringify(payload, null, 2)
  }

  const previewBackup = (raw: string): BackupPreviewResult => {
    try {
      const parsed = JSON.parse(raw) as unknown
      const payload = normalizeBackupPayload(parsed)

      if (!payload) {
        return { ok: false, message: 'BookLog 백업 파일 형식을 인식할 수 없습니다.' }
      }

      return {
        ok: true,
        payload,
        preview: createBackupPreview(payload),
      }
    } catch {
      return { ok: false, message: 'JSON 백업 파일을 읽을 수 없습니다.' }
    }
  }

  const importBackup = (payload: BackupPayload, mode: BackupRestoreMode): StoreActionResult => {
    clearPendingDeletion()
    books.value = mode === 'overwrite'
      ? payload.books
      : mergeBooksById(books.value, payload.books)

    if (mode === 'overwrite') {
      theme.value = payload.theme
    }

    return { ok: true }
  }

  return {
    books,
    theme,
    resolvedTheme,
    isHydrated,
    initialize,
    readingBooks,
    readBooks,
    recentlyDeletedBook,
    deleteUndoExpiresAt,
    getBookById,
    addBook,
    updateBook,
    updateTags,
    addReadingLog,
    saveReview,
    deleteBook,
    undoDeleteBook,
    cycleTheme,
    setTheme,
    exportBackup,
    previewBackup,
    importBackup,
  }
})
