<script setup lang="ts">
import { computed } from 'vue'
import { useBookStore } from '../stores/book'
import { BookOpen, CheckCircle, Clock } from 'lucide-vue-next'

const bookStore = useBookStore()

const readingBooks = computed(() => bookStore.books.filter(b => b.status === 'READING'))
const readBooks = computed(() => bookStore.books.filter(b => b.status === 'READ'))

const totalPagesRead = computed(() => {
  return bookStore.books.reduce((acc, book) => acc + book.currentPage, 0)
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Welcome back! Here's your reading overview.</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium">Reading Now</h3>
          <BookOpen class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold">{{ readingBooks.length }}</div>
        <p class="text-xs text-muted-foreground">Books in progress</p>
      </div>
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium">Books Read</h3>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold">{{ readBooks.length }}</div>
        <p class="text-xs text-muted-foreground">Completed books</p>
      </div>
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium">Total Pages</h3>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold">{{ totalPagesRead }}</div>
        <p class="text-xs text-muted-foreground">Pages read across all books</p>
      </div>
    </div>

    <!-- Currently Reading Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold tracking-tight">Currently Reading</h2>
      <div v-if="readingBooks.length === 0" class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No books currently in progress. Start reading something new!
      </div>
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="book in readingBooks" :key="book.id" class="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
          <div class="p-6">
            <h3 class="font-semibold leading-none tracking-tight mb-2">{{ book.title }}</h3>
            <p class="text-sm text-muted-foreground mb-4">{{ book.author }}</p>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{{ Math.round((book.currentPage / book.totalPages) * 100) }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div class="h-full bg-primary transition-all" :style="{ width: `${(book.currentPage / book.totalPages) * 100}%` }"></div>
              </div>
              <div class="text-xs text-muted-foreground text-right">
                {{ book.currentPage }} / {{ book.totalPages }} pages
              </div>
            </div>
          </div>
          <RouterLink :to="`/books/${book.id}`" class="absolute inset-0">
            <span class="sr-only">View book</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
