<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ChevronDown, Star, Trash2 } from 'lucide-vue-next'
import { format } from 'date-fns'
import { useBookStore } from '../stores/book'
import type { BookStatus } from '../types/book'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const bookId = computed(() => route.params.id as string)
const book = computed(() => bookStore.getBookById(bookId.value))

const showLogForm = ref(false)
const logError = ref('')
const reviewMessage = ref('')
const reviewError = ref('')

const newLog = ref({
  startPage: 1,
  endPage: 1,
  content: '',
})

const selectedRating = ref<number | undefined>(undefined)
const reviewDraft = ref('')

watch(book, currentBook => {
  if (!currentBook) return
  newLog.value = {
    startPage: Math.min(Math.max(currentBook.currentPage || 1, 1), currentBook.totalPages),
    endPage: Math.min(Math.max(currentBook.currentPage || 1, 1), currentBook.totalPages),
    content: '',
  }
  selectedRating.value = currentBook.rating
  reviewDraft.value = currentBook.review ?? ''
}, { immediate: true })

const progressPercentage = computed(() => {
  if (!book.value || book.value.totalPages <= 0) return 0
  return Math.round((book.value.currentPage / book.value.totalPages) * 100)
})

const statusOptions: { value: BookStatus; label: string }[] = [
  { value: 'TO_READ', label: 'To Read' },
  { value: 'READING', label: 'Reading' },
  { value: 'READ', label: 'Read' },
  { value: 'STOPPED', label: 'Stopped' },
]

const formatDate = (value?: string) => {
  return value ? format(new Date(value), 'MMM d, yyyy') : '-'
}

const handleStatusChange = (event: Event) => {
  if (!book.value) return

  const nextStatus = (event.target as HTMLSelectElement).value as BookStatus
  const result = bookStore.updateBook(book.value.id, { status: nextStatus })

  if (!result.ok) {
    logError.value = result.message
  }
}

const handleAddLog = () => {
  if (!book.value) return

  logError.value = ''
  const result = bookStore.addReadingLog(book.value.id, newLog.value)

  if (!result.ok) {
    logError.value = result.message
    return
  }

  showLogForm.value = false
  newLog.value = {
    startPage: Math.min(Math.max(book.value.currentPage || 1, 1), book.value.totalPages),
    endPage: Math.min(Math.max(book.value.currentPage || 1, 1), book.value.totalPages),
    content: '',
  }
}

const handleDelete = () => {
  if (!book.value || !window.confirm('Are you sure you want to delete this book?')) return

  const result = bookStore.deleteBook(book.value.id)
  if (result.ok) {
    router.push('/books')
  }
}

const handleSaveReview = () => {
  if (!book.value) return

  reviewError.value = ''
  reviewMessage.value = ''

  const result = bookStore.saveReview(book.value.id, {
    rating: selectedRating.value,
    review: reviewDraft.value,
  })

  if (!result.ok) {
    reviewError.value = result.message
    return
  }

  reviewMessage.value = '리뷰와 별점을 저장했습니다.'
}
</script>

<template>
  <div v-if="book" class="space-y-8">
    <section class="grid gap-6 rounded-[30px] border border-border/70 bg-card/90 p-6 shadow-sm lg:grid-cols-[220px_minmax(0,1fr)]">
      <div class="overflow-hidden rounded-[24px] bg-muted">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="`${book.title} cover`"
          class="aspect-[3/4] h-full w-full object-cover"
        />
        <div v-else class="flex aspect-[3/4] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,rgba(148,163,184,0.22),transparent)] text-muted-foreground">
          <BookOpen class="h-12 w-12" />
          <span class="text-xs font-semibold uppercase tracking-[0.28em]">No Cover</span>
        </div>
      </div>

      <div class="space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              @click="router.back()"
            >
              <ArrowLeft class="h-4 w-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 class="text-3xl font-semibold tracking-tight">{{ book.title }}</h1>
              <p class="mt-1 text-base text-muted-foreground">{{ book.author }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <label class="relative">
              <select
                :value="book.status"
                class="h-11 appearance-none rounded-2xl border border-input bg-background px-4 pr-10 text-sm outline-none transition focus:border-primary"
                @change="handleStatusChange"
              >
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </label>

            <button
              type="button"
              aria-label="Delete book"
              class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-destructive transition hover:bg-destructive/10"
              @click="handleDelete"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-muted/70 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
            <p class="mt-2 text-2xl font-semibold">{{ progressPercentage }}%</p>
            <p class="mt-1 text-sm text-muted-foreground">{{ book.currentPage }} / {{ book.totalPages }} pages</p>
          </div>
          <div class="rounded-2xl bg-muted/70 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Started</p>
            <div class="mt-2 flex items-center gap-2 text-sm font-medium">
              <Calendar class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDate(book.startDate) }}</span>
            </div>
          </div>
          <div class="rounded-2xl bg-muted/70 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Finished</p>
            <div class="mt-2 flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDate(book.endDate) }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">Reading Progress</span>
            <span class="text-muted-foreground">{{ progressPercentage }}% Complete</span>
          </div>
          <div class="h-3 rounded-full bg-muted">
            <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progressPercentage}%` }" />
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-8">
        <section class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold">Reading Logs</h2>
              <p class="text-sm text-muted-foreground">페이지 범위와 간단한 메모를 남겨 독서 흐름을 이어가세요.</p>
            </div>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              @click="showLogForm = !showLogForm"
            >
              {{ showLogForm ? 'Close' : 'Add Log' }}
            </button>
          </div>

          <div v-if="showLogForm" class="mt-6 rounded-[24px] border border-border bg-background/60 p-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="space-y-2 text-sm font-medium">
                <span>Start Page</span>
                <input
                  v-model.number="newLog.startPage"
                  type="number"
                  min="1"
                  class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </label>

              <label class="space-y-2 text-sm font-medium">
                <span>End Page</span>
                <input
                  v-model.number="newLog.endPage"
                  type="number"
                  min="1"
                  class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </label>
            </div>

            <label class="mt-4 block space-y-2 text-sm font-medium">
              <span>Notes</span>
              <textarea
                v-model="newLog.content"
                class="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                placeholder="What stood out today?"
              />
            </label>

            <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p v-if="logError" class="text-sm font-medium text-destructive">{{ logError }}</p>
              <div class="flex gap-2 sm:ml-auto">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium transition hover:bg-muted"
                  @click="showLogForm = false"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  @click="handleAddLog"
                >
                  Save Log
                </button>
              </div>
            </div>
          </div>

          <div v-if="book.logs.length === 0" class="mt-6 rounded-[24px] border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No reading logs yet.
          </div>

          <div v-else class="mt-6 space-y-4">
            <article
              v-for="log in book.logs.slice().reverse()"
              :key="log.id"
              class="rounded-[24px] border border-border/70 bg-background/60 p-5"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-sm font-medium">{{ format(new Date(log.date), 'MMM d, yyyy') }}</p>
                <span class="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  p. {{ log.startPage }} - {{ log.endPage }}
                </span>
              </div>
              <p v-if="log.content" class="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{{ log.content }}</p>
              <p v-else class="mt-3 text-sm text-muted-foreground">메모 없이 페이지 범위만 기록했습니다.</p>
            </article>
          </div>
        </section>
      </div>

      <section class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">Review & Rating</h2>
            <p class="text-sm text-muted-foreground">완독 후의 감상이나 재독 포인트를 남겨 두세요.</p>
          </div>
          <span v-if="book.rating" class="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            {{ book.rating }}/5
          </span>
        </div>

        <div class="mt-6 space-y-3">
          <p class="text-sm font-medium">Rating</p>
          <div class="flex items-center gap-2">
            <button
              v-for="rating in 5"
              :key="rating"
              type="button"
              :aria-label="`Rate ${rating} stars`"
              class="rounded-xl p-1.5 transition hover:bg-muted"
              @click="selectedRating = rating"
            >
              <Star
                class="h-7 w-7"
                :class="rating <= (selectedRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'"
              />
            </button>
            <button
              v-if="selectedRating"
              type="button"
              class="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              @click="selectedRating = undefined"
            >
              Clear
            </button>
          </div>
        </div>

        <label class="mt-6 block space-y-2 text-sm font-medium">
          <span>Review</span>
          <textarea
            id="review"
            v-model="reviewDraft"
            class="min-h-[180px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Write your thoughts about this book."
          />
        </label>

        <div class="mt-5 flex flex-col gap-3">
          <p v-if="reviewError" class="text-sm font-medium text-destructive">{{ reviewError }}</p>
          <p v-else-if="reviewMessage" class="text-sm font-medium text-emerald-600 dark:text-emerald-300">{{ reviewMessage }}</p>
          <button
            type="button"
            aria-label="Save review"
            class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            @click="handleSaveReview"
          >
            Save Review
          </button>
        </div>

        <div v-if="book.rating || book.review" class="mt-6 rounded-[24px] bg-muted/50 p-5">
          <div v-if="book.rating" class="flex items-center gap-1 text-amber-400" aria-label="Saved rating">
            <Star
              v-for="rating in 5"
              :key="`saved-${rating}`"
              class="h-4 w-4"
              :class="rating <= book.rating ? 'fill-current' : 'text-muted-foreground'"
            />
          </div>
          <p v-if="book.review" class="mt-3 whitespace-pre-wrap text-sm leading-6">{{ book.review }}</p>
        </div>
      </section>
    </section>
  </div>

  <section v-else class="rounded-[30px] border border-dashed border-border bg-card/80 p-12 text-center">
    <div class="mx-auto flex max-w-md flex-col items-center gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen class="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 class="text-2xl font-semibold">Book not found.</h1>
      <p class="text-sm leading-6 text-muted-foreground">
        요청한 책이 존재하지 않거나 이미 삭제되었습니다. 서재 목록으로 돌아가 다른 책을 선택해 주세요.
      </p>
      <RouterLink
        to="/books"
        class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Go to Library
      </RouterLink>
    </div>
  </section>
</template>
