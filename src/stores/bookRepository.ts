import type { Book, ThemePreference } from '../types/book'

export type BookStoreSnapshot = {
  books: Book[]
  theme: ThemePreference
}

export interface BookRepository {
  hydrate(): Promise<BookStoreSnapshot>
  saveBooks(books: Book[]): Promise<void>
  saveTheme(theme: ThemePreference): Promise<void>
  clear(): Promise<void>
}
