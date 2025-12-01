import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBookStore } from './book'
import { setupTestPinia, setupLocalStorageMock, clearLocalStorage } from '../test-utils/setup'
import { createMockBook, mockBooks } from '../test-utils/mock-data'
import type { Book } from '../types/book'

describe('useBookStore', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorage()
    setupTestPinia()
  })

  describe('초기화', () => {
    it('빈 배열로 시작해야 함', () => {
      const store = useBookStore()
      expect(store.books).toEqual([])
    })

    it('localStorage에서 데이터를 로드해야 함', () => {
      const testBooks = [mockBooks[0], mockBooks[1]]
      localStorage.setItem('booklog-books', JSON.stringify(testBooks))

      setupTestPinia()
      const store = useBookStore()

      expect(store.books).toEqual(testBooks)
    })

    it('localStorage에 잘못된 데이터가 있어도 에러가 발생하지 않아야 함', () => {
      localStorage.setItem('booklog-books', 'invalid json')

      expect(() => {
        setupTestPinia()
        useBookStore()
      }).not.toThrow()
    })
  })

  describe('addBook', () => {
    it('새 책을 추가해야 함', () => {
      const store = useBookStore()
      const newBook = createMockBook({ title: '새로운 책' })

      store.addBook(newBook)

      expect(store.books).toHaveLength(1)
      expect(store.books[0]).toEqual(newBook)
    })

    it('여러 책을 추가할 수 있어야 함', () => {
      const store = useBookStore()
      const book1 = createMockBook({ id: 'book-1', title: '책 1' })
      const book2 = createMockBook({ id: 'book-2', title: '책 2' })

      store.addBook(book1)
      store.addBook(book2)

      expect(store.books).toHaveLength(2)
      expect(store.books[0]).toEqual(book1)
      expect(store.books[1]).toEqual(book2)
    })

    it('책 추가 시 localStorage에 저장되어야 함', async () => {
      const store = useBookStore()
      const newBook = createMockBook({ title: '새로운 책' })

      store.addBook(newBook)

      // watch가 실행될 시간을 기다림
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'booklog-books',
        JSON.stringify([newBook])
      )
    })
  })

  describe('getBookById', () => {
    it('존재하는 책을 ID로 찾아야 함', () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id', title: '테스트 책' })
      store.addBook(book)

      const found = store.getBookById('test-id')

      expect(found).toEqual(book)
    })

    it('존재하지 않는 책은 undefined를 반환해야 함', () => {
      const store = useBookStore()

      const found = store.getBookById('non-existent-id')

      expect(found).toBeUndefined()
    })

    it('여러 책 중에서 올바른 책을 찾아야 함', () => {
      const store = useBookStore()
      mockBooks.forEach(book => store.addBook(book))

      const found = store.getBookById('book-2')

      expect(found?.title).toBe('리팩터링')
    })
  })

  describe('updateBook', () => {
    it('책 정보를 업데이트해야 함', () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id', title: '원래 제목' })
      store.addBook(book)

      store.updateBook('test-id', { title: '수정된 제목' })

      const updated = store.getBookById('test-id')
      expect(updated?.title).toBe('수정된 제목')
    })

    it('부분 업데이트가 가능해야 함', () => {
      const store = useBookStore()
      const book = createMockBook({
        id: 'test-id',
        title: '테스트 책',
        currentPage: 0,
        status: 'TO_READ',
      })
      store.addBook(book)

      store.updateBook('test-id', { currentPage: 100, status: 'READING' })

      const updated = store.getBookById('test-id')
      expect(updated?.title).toBe('테스트 책') // 변경되지 않음
      expect(updated?.currentPage).toBe(100) // 변경됨
      expect(updated?.status).toBe('READING') // 변경됨
    })

    it('존재하지 않는 책을 업데이트하려고 하면 아무 일도 일어나지 않아야 함', () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id' })
      store.addBook(book)

      store.updateBook('non-existent-id', { title: '수정된 제목' })

      expect(store.books).toHaveLength(1)
      expect(store.books[0]).toEqual(book)
    })

    it('업데이트 시 localStorage에 저장되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id', title: '원래 제목' })
      store.addBook(book)

      vi.clearAllMocks() // 이전 호출 기록 제거

      store.updateBook('test-id', { title: '수정된 제목' })

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('deleteBook', () => {
    it('책을 삭제해야 함', () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id' })
      store.addBook(book)

      store.deleteBook('test-id')

      expect(store.books).toHaveLength(0)
      expect(store.getBookById('test-id')).toBeUndefined()
    })

    it('여러 책 중 하나만 삭제해야 함', () => {
      const store = useBookStore()
      mockBooks.forEach(book => store.addBook(book))
      const initialLength = store.books.length

      store.deleteBook('book-2')

      expect(store.books).toHaveLength(initialLength - 1)
      expect(store.getBookById('book-2')).toBeUndefined()
      expect(store.getBookById('book-1')).toBeDefined()
      expect(store.getBookById('book-3')).toBeDefined()
    })

    it('존재하지 않는 책을 삭제하려고 하면 아무 일도 일어나지 않아야 함', () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id' })
      store.addBook(book)

      store.deleteBook('non-existent-id')

      expect(store.books).toHaveLength(1)
      expect(store.books[0]).toEqual(book)
    })

    it('삭제 시 localStorage에 저장되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id' })
      store.addBook(book)

      vi.clearAllMocks()

      store.deleteBook('test-id')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('localStorage 동기화', () => {
    it('books 배열이 변경되면 localStorage에 자동 저장되어야 함', async () => {
      const store = useBookStore()
      const book = createMockBook()

      store.addBook(book)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'booklog-books',
        expect.any(String)
      )

      const savedData = JSON.parse(
        (localStorage.setItem as any).mock.calls[0][1]
      )
      expect(savedData).toEqual([book])
    })

    it('deep watch로 중첩된 변경사항도 감지해야 함', async () => {
      const store = useBookStore()
      const book = createMockBook({ id: 'test-id', logs: [] })
      store.addBook(book)

      vi.clearAllMocks()

      // 중첩된 배열 수정
      const bookRef = store.getBookById('test-id')
      if (bookRef) {
        bookRef.logs.push({
          id: 'log-1',
          date: new Date().toISOString(),
          startPage: 1,
          endPage: 50,
        })
      }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })
})
