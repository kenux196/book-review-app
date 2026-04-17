export type BookStatus = 'TO_READ' | 'READING' | 'READ' | 'STOPPED'
export type BookSortKey = 'CREATED_AT_DESC' | 'TITLE_ASC' | 'PROGRESS_DESC' | 'STATUS_ASC'
export type ThemePreference = 'light' | 'dark'

export interface ReadingLog {
  id: string
  date: string
  startPage: number
  endPage: number
  content?: string
}

export interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string
  totalPages: number
  currentPage: number
  status: BookStatus
  startDate?: string
  endDate?: string
  rating?: number
  review?: string
  tags: string[]
  logs: ReadingLog[]
  createdAt: string
}

export interface BookDraft {
  title: string
  author: string
  totalPages: number
  status: BookStatus
  currentPage?: number
  coverUrl?: string
  startDate?: string
  endDate?: string
  tags?: string[]
}

export interface ReviewDraft {
  rating?: number
  review?: string
}

export interface ReadingLogDraft {
  startPage: number
  endPage: number
  date?: string
  content?: string
}

export type StoreActionResult =
  | { ok: true }
  | { ok: false; message: string }
