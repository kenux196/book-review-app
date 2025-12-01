<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBookStore } from '../stores/book'
import type { Book, BookStatus } from '../types/book'
import { Plus, Search, Book as BookIcon } from 'lucide-vue-next'

const bookStore = useBookStore()

const searchQuery = ref('')
const statusFilter = ref<BookStatus | 'ALL'>('ALL')
const showAddForm = ref(false)

const newBook = ref<Partial<Book>>({
  title: '',
  author: '',
  totalPages: 0,
  status: 'TO_READ',
  currentPage: 0
})

const filteredBooks = computed(() => {
  return bookStore.books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'ALL' || book.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const handleAddBook = () => {
  if (!newBook.value.title || !newBook.value.author || !newBook.value.totalPages) return

  const book: Book = {
    id: crypto.randomUUID(),
    title: newBook.value.title,
    author: newBook.value.author,
    totalPages: Number(newBook.value.totalPages),
    currentPage: 0,
    status: 'TO_READ',
    logs: [],
    createdAt: new Date().toISOString(),
    ...newBook.value
  } as Book

  bookStore.addBook(book)
  showAddForm.value = false
  newBook.value = { title: '', author: '', totalPages: 0, status: 'TO_READ', currentPage: 0 }
}

const getStatusColor = (status: BookStatus) => {
  switch (status) {
    case 'TO_READ': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    case 'READING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'READ': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'STOPPED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-slate-100 text-slate-800'
  }
}

const getStatusLabel = (status: BookStatus) => {
  switch (status) {
    case 'TO_READ': return 'To Read'
    case 'READING': return 'Reading'
    case 'READ': return 'Read'
    case 'STOPPED': return 'Stopped'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Library</h1>
        <p class="text-muted-foreground">Manage your book collection.</p>
      </div>
      <button @click="showAddForm = !showAddForm" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        <Plus class="mr-2 h-4 w-4" />
        Add Book
      </button>
    </div>

    <!-- Add Book Form -->
    <div v-if="showAddForm" class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 class="text-lg font-semibold mb-4">Add New Book</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">Title</label>
          <input v-model="newBook.title" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Book Title" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">Author</label>
          <input v-model="newBook.author" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Author Name" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">Total Pages</label>
          <input v-model="newBook.totalPages" type="number" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Total Pages" />
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button @click="showAddForm = false" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          Cancel
        </button>
        <button @click="handleAddBook" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Save Book
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input v-model="searchQuery" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Search books..." />
      </div>
      <select v-model="statusFilter" class="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <option value="ALL">All Status</option>
        <option value="TO_READ">To Read</option>
        <option value="READING">Reading</option>
        <option value="READ">Read</option>
        <option value="STOPPED">Stopped</option>
      </select>
    </div>

    <!-- Book List -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="book in filteredBooks" :key="book.id" class="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
        <div class="aspect-[2/3] w-full bg-muted flex items-center justify-center">
          <BookIcon class="h-12 w-12 text-muted-foreground/50" />
        </div>
        <div class="p-4 flex flex-col flex-1">
          <div class="mb-2">
            <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', getStatusColor(book.status)]">
              {{ getStatusLabel(book.status) }}
            </span>
          </div>
          <h3 class="font-semibold leading-none tracking-tight mb-1 line-clamp-1">{{ book.title }}</h3>
          <p class="text-sm text-muted-foreground mb-4 line-clamp-1">{{ book.author }}</p>
          
          <div class="mt-auto pt-4">
            <div class="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{{ Math.round((book.currentPage / book.totalPages) * 100) }}%</span>
              <span>{{ book.currentPage }}/{{ book.totalPages }}</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div class="h-full bg-primary transition-all" :style="{ width: `${(book.currentPage / book.totalPages) * 100}%` }"></div>
            </div>
          </div>
        </div>
        <RouterLink :to="`/books/${book.id}`" class="absolute inset-0">
          <span class="sr-only">View book</span>
        </RouterLink>
      </div>
    </div>

    <div v-if="filteredBooks.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">No books found.</p>
    </div>
  </div>
</template>
