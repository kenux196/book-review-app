<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '../stores/book'
import type { Book, BookStatus } from '../types/book'
import { ArrowLeft, BookOpen, Calendar, Trash2, CheckCircle } from 'lucide-vue-next'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const book = ref<Book | undefined>(undefined)
const showLogForm = ref(false)
const newLog = ref({
  startPage: 0,
  endPage: 0,
  content: ''
})

onMounted(() => {
  const id = route.params.id as string
  book.value = bookStore.getBookById(id)
  if (book.value) {
    newLog.value.startPage = book.value.currentPage
    newLog.value.endPage = book.value.currentPage
  }
})

const progressPercentage = computed(() => {
  if (!book.value) return 0
  return Math.round((book.value.currentPage / book.value.totalPages) * 100)
})

const handleUpdateStatus = (status: BookStatus) => {
  if (!book.value) return
  bookStore.updateBook(book.value.id, { status })
  book.value.status = status
  
  if (status === 'READING' && !book.value.startDate) {
    const now = new Date().toISOString()
    bookStore.updateBook(book.value.id, { startDate: now })
    book.value.startDate = now
  } else if (status === 'READ' && !book.value.endDate) {
    const now = new Date().toISOString()
    bookStore.updateBook(book.value.id, { endDate: now, currentPage: book.value.totalPages })
    book.value.endDate = now
    book.value.currentPage = book.value.totalPages
  }
}

const handleAddLog = () => {
  if (!book.value) return
  
  const log = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    startPage: Number(newLog.value.startPage),
    endPage: Number(newLog.value.endPage),
    content: newLog.value.content
  }
  
  const updatedLogs = [...book.value.logs, log]
  const newCurrentPage = Math.max(book.value.currentPage, log.endPage)
  
  bookStore.updateBook(book.value.id, { 
    logs: updatedLogs,
    currentPage: newCurrentPage
  })
  
  book.value.logs = updatedLogs
  book.value.currentPage = newCurrentPage
  
  showLogForm.value = false
  newLog.value = { startPage: newCurrentPage, endPage: newCurrentPage, content: '' }
}

const handleDelete = () => {
  if (!book.value || !confirm('Are you sure you want to delete this book?')) return
  bookStore.deleteBook(book.value.id)
  router.push('/books')
}
</script>

<template>
  <div v-if="book" class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex items-start gap-4">
        <button @click="router.back()" class="mt-1 p-2 hover:bg-accent rounded-full transition-colors">
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-2">{{ book.title }}</h1>
          <p class="text-xl text-muted-foreground">{{ book.author }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select :value="book.status" @change="e => handleUpdateStatus((e.target as HTMLSelectElement).value as BookStatus)" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <option value="TO_READ">To Read</option>
          <option value="READING">Reading</option>
          <option value="READ">Read</option>
          <option value="STOPPED">Stopped</option>
        </select>
        <button @click="handleDelete" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 text-destructive">
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="grid gap-8 md:grid-cols-[2fr_1fr]">
      <div class="space-y-8">
        <!-- Progress -->
        <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 class="font-semibold mb-4">Reading Progress</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ progressPercentage }}% Complete</span>
              <span class="text-muted-foreground">{{ book.currentPage }} / {{ book.totalPages }} pages</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div class="h-full bg-primary transition-all" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
          </div>
          
          <div class="mt-6 grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <span class="text-xs text-muted-foreground">Started</span>
              <div class="flex items-center gap-2 text-sm font-medium">
                <Calendar class="h-4 w-4 text-muted-foreground" />
                {{ book.startDate ? format(new Date(book.startDate), 'MMM d, yyyy') : '-' }}
              </div>
            </div>
            <div class="space-y-1">
              <span class="text-xs text-muted-foreground">Finished</span>
              <div class="flex items-center gap-2 text-sm font-medium">
                <CheckCircle class="h-4 w-4 text-muted-foreground" v-if="book.endDate" />
                <span v-else>-</span>
                {{ book.endDate ? format(new Date(book.endDate), 'MMM d, yyyy') : '' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Reading Logs -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold">Reading Logs</h3>
            <button @click="showLogForm = !showLogForm" class="text-sm text-primary hover:underline">
              Add Log
            </button>
          </div>

          <div v-if="showLogForm" class="rounded-lg border bg-card p-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-medium">Start Page</label>
                <input v-model="newLog.startPage" type="number" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-medium">End Page</label>
                <input v-model="newLog.endPage" type="number" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-medium">Notes</label>
              <textarea v-model="newLog.content" class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="What did you think?"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="showLogForm = false" class="text-sm px-3 py-1 hover:bg-accent rounded-md">Cancel</button>
              <button @click="handleAddLog" class="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save Log</button>
            </div>
          </div>

          <div class="space-y-4">
            <div v-for="log in book.logs.slice().reverse()" :key="log.id" class="rounded-lg border bg-card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-muted-foreground">{{ format(new Date(log.date), 'MMM d, yyyy') }}</span>
                <span class="text-xs font-medium bg-secondary px-2 py-1 rounded-full">p. {{ log.startPage }} - {{ log.endPage }}</span>
              </div>
              <p class="text-sm whitespace-pre-wrap">{{ log.content }}</p>
            </div>
            <div v-if="book.logs.length === 0" class="text-center py-8 text-muted-foreground text-sm">
              No reading logs yet.
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Info -->
      <div class="space-y-6">
        <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div class="aspect-[2/3] w-full bg-muted rounded-md flex items-center justify-center mb-4">
            <BookOpen class="h-16 w-16 text-muted-foreground/50" />
          </div>
          <!-- Placeholder for cover image upload -->
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-[50vh]">
    <p class="text-muted-foreground">Book not found.</p>
  </div>
</template>
