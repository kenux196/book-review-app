<script setup lang="ts">
import { computed, ref } from 'vue'
import { Book as BookIcon, ChevronDown, Plus, Search, Star } from 'lucide-vue-next'
import { useBookStore } from '../stores/book'
import type { BookDraft, BookSortKey, BookStatus } from '../types/book'

const bookStore = useBookStore()

const searchQuery = ref('')
const statusFilter = ref<BookStatus | 'ALL'>('ALL')
const sortKey = ref<BookSortKey>('CREATED_AT_DESC')
const showAddForm = ref(false)
const addError = ref('')

const createInitialDraft = (): BookDraft => ({
  title: '',
  author: '',
  totalPages: 0,
  status: 'TO_READ',
  currentPage: 0,
  coverUrl: '',
})

const newBook = ref<BookDraft>(createInitialDraft())

const sortOptions: { value: BookSortKey; label: string }[] = [
  { value: 'CREATED_AT_DESC', label: 'Latest Added' },
  { value: 'TITLE_ASC', label: 'Title A-Z' },
  { value: 'PROGRESS_DESC', label: 'Highest Progress' },
  { value: 'STATUS_ASC', label: 'Status' },
]

const statusOrder: Record<BookStatus, number> = {
  TO_READ: 0,
  READING: 1,
  READ: 2,
  STOPPED: 3,
}

const getProgress = (currentPage: number, totalPages: number) => {
  return totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0
}

const filteredBooks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return [...bookStore.books]
    .filter(book => {
      const matchesSearch = !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.tags.some(tag => tag.toLowerCase().includes(query))
      const matchesStatus = statusFilter.value === 'ALL' || book.status === statusFilter.value
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortKey.value) {
        case 'TITLE_ASC':
          return a.title.localeCompare(b.title)
        case 'PROGRESS_DESC':
          return getProgress(b.currentPage, b.totalPages) - getProgress(a.currentPage, a.totalPages)
        case 'STATUS_ASC':
          return statusOrder[a.status] - statusOrder[b.status]
        case 'CREATED_AT_DESC':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
})

const resetForm = () => {
  newBook.value = createInitialDraft()
  addError.value = ''
}

const handleAddBook = () => {
  const result = bookStore.addBook(newBook.value)

  if (!result.ok) {
    addError.value = result.message
    return
  }

  resetForm()
  showAddForm.value = false
}

const getStatusColor = (status: BookStatus) => {
  switch (status) {
    case 'TO_READ':
      return 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'READING':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
    case 'READ':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    case 'STOPPED':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
  }
}

const getStatusLabel = (status: BookStatus) => {
  switch (status) {
    case 'TO_READ':
      return 'To Read'
    case 'READING':
      return 'Reading'
    case 'READ':
      return 'Read'
    case 'STOPPED':
      return 'Stopped'
  }
}
</script>

<template>
  <div class="space-y-8">
    <section class="flex flex-col gap-5 rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-sm shadow-slate-200/40 dark:shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-3">
        <span class="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Library
        </span>
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">읽은 책, 읽는 책, 읽고 싶은 책을 한 번에 관리하세요.</h1>
          <p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            빠르게 등록하고, 상태를 나누고, 진행률과 별점을 보면서 지금의 독서 흐름을 정리할 수 있습니다.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
        @click="showAddForm = !showAddForm"
      >
        <Plus class="h-4 w-4" />
        <span>{{ showAddForm ? 'Close Form' : 'Add Book' }}</span>
      </button>
    </section>

    <section v-if="showAddForm" class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold">Add New Book</h2>
          <p class="text-sm text-muted-foreground">제목, 저자, 페이지 수를 기준으로 로컬 서재에 추가합니다.</p>
        </div>
        <p v-if="addError" class="text-sm font-medium text-destructive">{{ addError }}</p>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label class="space-y-2 text-sm font-medium">
          <span>Title</span>
          <input
            v-model="newBook.title"
            placeholder="Book Title"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>Author</span>
          <input
            v-model="newBook.author"
            placeholder="Author Name"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>Total Pages</span>
          <input
            v-model.number="newBook.totalPages"
            type="number"
            min="1"
            placeholder="Total Pages"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>Cover URL</span>
          <input
            v-model="newBook.coverUrl"
            type="url"
            placeholder="https://example.com/cover.jpg"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium transition hover:bg-muted"
          @click="showAddForm = false; resetForm()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          @click="handleAddBook"
        >
          Save Book
        </button>
      </div>
    </section>

    <section class="grid gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_200px_200px]">
      <label class="relative">
        <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          placeholder="Search books..."
          class="h-11 w-full rounded-2xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary"
        />
      </label>

      <label class="relative">
        <select
          v-model="statusFilter"
          class="h-11 w-full appearance-none rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
        >
          <option value="ALL">All Status</option>
          <option value="TO_READ">To Read</option>
          <option value="READING">Reading</option>
          <option value="READ">Read</option>
          <option value="STOPPED">Stopped</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </label>

      <label class="relative">
        <select
          v-model="sortKey"
          aria-label="Sort books"
          class="h-11 w-full appearance-none rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </label>
    </section>

    <section v-if="filteredBooks.length > 0" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="book in filteredBooks"
        :key="book.id"
        :to="`/books/${book.id}`"
        class="group overflow-hidden rounded-[28px] border border-border/70 bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div class="grid min-h-[220px] grid-cols-[112px_minmax(0,1fr)]">
          <div class="relative flex items-center justify-center overflow-hidden bg-muted">
            <img
              v-if="book.coverUrl"
              :src="book.coverUrl"
              :alt="`${book.title} cover`"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(180deg,rgba(148,163,184,0.18),transparent)] text-muted-foreground">
              <BookIcon class="h-10 w-10" />
              <span class="text-[11px] font-semibold uppercase tracking-[0.24em]">No Cover</span>
            </div>
          </div>

          <div class="flex flex-col gap-4 p-5">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-semibold', getStatusColor(book.status)]">
                  {{ getStatusLabel(book.status) }}
                </span>
                <span class="text-xs text-muted-foreground">{{ getProgress(book.currentPage, book.totalPages) }}%</span>
              </div>

              <div class="space-y-1.5">
                <h2 class="line-clamp-2 text-lg font-semibold leading-snug">{{ book.title }}</h2>
                <p class="text-sm text-muted-foreground">{{ book.author }}</p>
              </div>

              <div v-if="book.rating" class="flex items-center gap-1 text-amber-400" :aria-label="`${book.title} rating ${book.rating}`">
                <Star
                  v-for="rating in 5"
                  :key="`${book.id}-${rating}`"
                  class="h-4 w-4"
                  :class="rating <= book.rating ? 'fill-current' : 'text-muted-foreground'"
                />
              </div>

              <div v-if="book.tags.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="tag in book.tags.slice(0, 3)"
                  :key="tag"
                  class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  {{ tag }}
                </span>
                <span v-if="book.tags.length > 3" class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  +{{ book.tags.length - 3 }}
                </span>
              </div>
            </div>

            <div class="mt-auto space-y-2">
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>{{ book.currentPage }} / {{ book.totalPages }} pages</span>
                <span>{{ book.logs.length }} logs</span>
              </div>
              <div class="h-2 rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: `${getProgress(book.currentPage, book.totalPages)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </RouterLink>
    </section>

    <section v-else class="rounded-[28px] border border-dashed border-border bg-card/60 p-10 text-center">
      <div class="mx-auto flex max-w-md flex-col items-center gap-3">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <BookIcon class="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 class="text-xl font-semibold">No books found.</h2>
        <p class="text-sm leading-6 text-muted-foreground">
          검색어, 상태 필터, 정렬 조건에 맞는 책이 없습니다. 필터를 바꾸거나 새 책을 추가해 보세요.
        </p>
      </div>
    </section>
  </div>
</template>
