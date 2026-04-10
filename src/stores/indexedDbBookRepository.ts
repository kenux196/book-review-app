import Dexie, { type Table } from 'dexie'
import type { Book, ThemePreference } from '../types/book'
import type { BookRepository, BookStoreSnapshot } from './bookRepository'
import { normalizeBookRecord, normalizeTheme } from './bookPersistenceUtils'

const DB_NAME = 'booklog'
const BOOKS_STORAGE_KEY = 'booklog-books'
const THEME_STORAGE_KEY = 'booklog-theme'
const MIGRATION_VERSION = '1'

type SettingRecord = { key: string; value: string }

class BookLogDb extends Dexie {
  books!: Table<Book, string>
  settings!: Table<SettingRecord, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      books: 'id, status, createdAt',
      settings: 'key',
    })
  }
}

const db = new BookLogDb()

export class IndexedDbBookRepository implements BookRepository {
  async hydrate(): Promise<BookStoreSnapshot> {
    await this.migrateLegacyIfNeeded()

    const [books, themeRecord] = await Promise.all([
      db.books.toArray(),
      db.settings.get('theme'),
    ])

    return {
      books: books
        .map(book => normalizeBookRecord(book))
        .filter((book): book is Book => Boolean(book)),
      theme: normalizeTheme(themeRecord?.value),
    }
  }

  async saveBooks(books: Book[]): Promise<void> {
    await db.transaction('rw', db.books, async () => {
      await db.books.clear()
      if (books.length > 0) {
        await db.books.bulkPut(books)
      }
    })
  }

  async saveTheme(theme: ThemePreference): Promise<void> {
    await db.settings.put({ key: 'theme', value: theme })
  }

  async clear(): Promise<void> {
    await db.transaction('rw', db.books, db.settings, async () => {
      await db.books.clear()
      await db.settings.clear()
    })
  }

  private async migrateLegacyIfNeeded(): Promise<void> {
    const migration = await db.settings.get('migrationVersion')
    if (migration?.value === MIGRATION_VERSION) return

    const hasIndexedDbData =
      (await db.books.count()) > 0 || Boolean(await db.settings.get('theme'))

    if (hasIndexedDbData) {
      await db.settings.put({ key: 'migrationVersion', value: MIGRATION_VERSION })
      return
    }

    const legacyBooksRaw = localStorage.getItem(BOOKS_STORAGE_KEY)
    const legacyThemeRaw = localStorage.getItem(THEME_STORAGE_KEY)

    const parsedBooks = safeParseJson(legacyBooksRaw)
    const books = Array.isArray(parsedBooks)
      ? parsedBooks
          .map(item => normalizeBookRecord(item))
          .filter((item): item is Book => Boolean(item))
      : []

    const theme = normalizeTheme(legacyThemeRaw)

    await db.transaction('rw', db.books, db.settings, async () => {
      if (books.length > 0) {
        await db.books.bulkPut(books)
      }
      await db.settings.bulkPut([
        { key: 'theme', value: theme },
        { key: 'migrationVersion', value: MIGRATION_VERSION },
      ])
    })

    localStorage.removeItem(BOOKS_STORAGE_KEY)
    localStorage.removeItem(THEME_STORAGE_KEY)
  }
}

function safeParseJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
