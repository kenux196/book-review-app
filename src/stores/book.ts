import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Book } from '../types/book'

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])

  // Load from localStorage
  const loadBooks = () => {
    try {
      const stored = localStorage.getItem('booklog-books')
      if (stored) {
        books.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load books from localStorage:', error)
      books.value = []
    }
  }

  // Save to localStorage
  watch(books, (newBooks) => {
    localStorage.setItem('booklog-books', JSON.stringify(newBooks))
  }, { deep: true })

  // Initialize
  loadBooks()

  const getBookById = (id: string) => {
    return books.value.find(b => b.id === id)
  }

  const addBook = (book: Book) => {
    books.value.push(book)
  }

  const updateBook = (id: string, updates: Partial<Book>) => {
    const index = books.value.findIndex(b => b.id === id)
    if (index !== -1) {
      books.value[index] = { ...books.value[index], ...updates } as Book
    }
  }

  const deleteBook = (id: string) => {
    books.value = books.value.filter(b => b.id !== id)
  }

  return {
    books,
    getBookById,
    addBook,
    updateBook,
    deleteBook
  }
})
