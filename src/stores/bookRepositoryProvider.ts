import type { BookRepository } from './bookRepository'
import { IndexedDbBookRepository } from './indexedDbBookRepository'

let repository: BookRepository = new IndexedDbBookRepository()

export const getBookRepository = (): BookRepository => repository

export const setBookRepositoryForTests = (next?: BookRepository) => {
  repository = next ?? new IndexedDbBookRepository()
}
