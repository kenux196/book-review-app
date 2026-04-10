import type { Book, BookStatus, ReadingLog, ThemePreference } from '../types/book'

const STATUS_ORDER: BookStatus[] = ['TO_READ', 'READING', 'READ', 'STOPPED']

export const toTrimmedText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export const normalizeRating = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
    ? value
    : undefined
}

export const normalizePositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const normalized = Math.floor(value)
  return normalized > 0 ? normalized : fallback
}

export const clamp = (value: number, min: number, max: number): number => {
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

export const normalizeBookRecord = (value: unknown): Book | undefined => {
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

  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string').map(t => t.trim()).filter(t => t.length > 0)
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
    tags,
    logs,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString(),
  }
}

export const normalizeTheme = (value: unknown): ThemePreference => {
  return value === 'dark' ? 'dark' : 'light'
}
