<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ChevronDown, Pencil, Star, Trash2, X } from 'lucide-vue-next'
import { format } from 'date-fns'
import { useBookStore } from '../stores/book'
import type { BookDraft, BookStatus } from '../types/book'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const bookId = computed(() => route.params.id as string)
const book = computed(() => bookStore.getBookById(bookId.value))
const deletedBook = computed(() => {
  const candidate = bookStore.recentlyDeletedBook
  return candidate?.id === bookId.value ? candidate : undefined
})

const isEditing = ref(false)
type BookEditDraft = Partial<BookDraft> & {
  currentPage?: number
  startDate?: string
  endDate?: string
}
const editDraft = ref<BookEditDraft>({})
const editError = ref('')
const showPageEditor = ref(false)
const currentPageDraft = ref(0)
const currentPageError = ref('')
const showDeleteConfirm = ref(false)
const undoCountdownSeconds = ref(0)
let undoCountdownTimer: ReturnType<typeof setInterval> | null = null
let reviewMessageTimer: ReturnType<typeof setTimeout> | null = null

const showLogForm = ref(false)
const logError = ref('')
const reviewMessage = ref('')
const reviewError = ref('')

const newLog = ref({
  startPage: 1,
  endPage: 1,
  date: '',
  content: '',
})

const toDateInputValue = (value?: string) => value ? value.slice(0, 10) : ''

const selectedRating = ref<number | undefined>(undefined)
const reviewDraft = ref('')

watch(book, currentBook => {
  if (!currentBook) return
  showDeleteConfirm.value = false
  newLog.value = {
    startPage: Math.min(Math.max(currentBook.currentPage || 1, 1), currentBook.totalPages),
    endPage: Math.min(Math.max(currentBook.currentPage || 1, 1), currentBook.totalPages),
    date: toDateInputValue(new Date().toISOString()),
    content: '',
  }
  currentPageDraft.value = currentBook.currentPage
  selectedRating.value = currentBook.rating
  reviewDraft.value = currentBook.review ?? ''
}, { immediate: true })

const stopUndoCountdown = () => {
  if (!undoCountdownTimer) return
  clearInterval(undoCountdownTimer)
  undoCountdownTimer = null
}

const syncUndoCountdown = () => {
  if (!deletedBook.value || !bookStore.deleteUndoExpiresAt) {
    undoCountdownSeconds.value = 0
    stopUndoCountdown()
    return
  }

  const updateCountdown = () => {
    if (!bookStore.deleteUndoExpiresAt) {
      undoCountdownSeconds.value = 0
      stopUndoCountdown()
      return
    }

    const remainingMs = Math.max(bookStore.deleteUndoExpiresAt - Date.now(), 0)
    undoCountdownSeconds.value = Math.ceil(remainingMs / 1000)

    if (remainingMs === 0) {
      stopUndoCountdown()
    }
  }

  updateCountdown()

  if (undoCountdownTimer) return
  undoCountdownTimer = setInterval(updateCountdown, 250)
}

watch(
  () => [deletedBook.value?.id, bookStore.deleteUndoExpiresAt] as const,
  () => {
    syncUndoCountdown()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopUndoCountdown()
  if (reviewMessageTimer) {
    clearTimeout(reviewMessageTimer)
  }
})

const progressPercentage = computed(() => {
  if (!book.value || book.value.totalPages <= 0) return 0
  return Math.round((book.value.currentPage / book.value.totalPages) * 100)
})

const statusOptions: { value: BookStatus; label: string; description: string }[] = [
  { value: 'TO_READ', label: '읽을 책', description: '읽기 전 목록에 보관하는 상태입니다.' },
  { value: 'READING', label: '읽는 중', description: '지금 읽고 있는 책으로 진행률과 로그가 계속 쌓입니다.' },
  { value: 'READ', label: '완독', description: '끝까지 읽은 책으로 완료일과 별점 리뷰를 남기기 좋습니다.' },
  { value: 'STOPPED', label: '보류 중', description: '포기보다는 잠시 멈춘 상태로, 나중에 다시 이어 읽을 수 있습니다.' },
]
const defaultStatusOption = statusOptions[0]!

const currentStatusOption = computed(() => {
  return statusOptions.find(option => option.value === book.value?.status) ?? defaultStatusOption
})

const formatDate = (value?: string) => {
  return value ? format(new Date(value), 'yyyy. M. d.') : '-'
}

const handleStatusChange = (event: Event) => {
  if (!book.value) return

  const nextStatus = (event.target as HTMLSelectElement).value as BookStatus
  const result = bookStore.updateBook(book.value.id, { status: nextStatus })

  if (!result.ok) {
    logError.value = result.message
  }
}

const startEditing = () => {
  if (!book.value) return
  editDraft.value = {
    title: book.value.title,
    author: book.value.author,
    totalPages: book.value.totalPages,
    currentPage: book.value.currentPage,
    coverUrl: book.value.coverUrl,
    status: book.value.status,
    startDate: toDateInputValue(book.value.startDate),
    endDate: toDateInputValue(book.value.endDate),
  }
  isEditing.value = true
  editError.value = ''
}

const cancelEditing = () => {
  isEditing.value = false
  editError.value = ''
}

const handleSaveEdit = () => {
  if (!book.value) return

  const result = bookStore.updateBook(book.value.id, {
    title: editDraft.value.title,
    author: editDraft.value.author,
    totalPages: editDraft.value.totalPages,
    currentPage: editDraft.value.currentPage,
    coverUrl: editDraft.value.coverUrl,
    status: editDraft.value.status,
    startDate: editDraft.value.startDate,
    endDate: editDraft.value.endDate,
  })
  if (result.ok) {
    isEditing.value = false
  } else {
    editError.value = result.message
  }
}

const togglePageEditor = () => {
  if (!book.value) return
  currentPageDraft.value = book.value.currentPage
  currentPageError.value = ''
  showPageEditor.value = !showPageEditor.value
}

const handleCurrentPageSave = () => {
  if (!book.value) return

  currentPageError.value = ''
  const result = bookStore.updateBook(book.value.id, { currentPage: currentPageDraft.value })

  if (!result.ok) {
    currentPageError.value = result.message
    return
  }

  showPageEditor.value = false
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
    date: toDateInputValue(new Date().toISOString()),
    content: '',
  }
}

const handleDelete = () => {
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}

const confirmDelete = () => {
  if (!book.value) return

  const result = bookStore.deleteBook(book.value.id)
  if (result.ok) {
    showDeleteConfirm.value = false
  }
}

const handleUndoDelete = () => {
  const result = bookStore.undoDeleteBook()
  if (result.ok) {
    showDeleteConfirm.value = false
  }
}

const tagInput = ref('')

const handleAddTag = () => {
  if (!book.value) return
  const tag = tagInput.value.trim()
  if (!tag || book.value.tags.includes(tag)) {
    tagInput.value = ''
    return
  }
  bookStore.updateTags(book.value.id, [...book.value.tags, tag])
  tagInput.value = ''
}

const handleRemoveTag = (tag: string) => {
  if (!book.value) return
  bookStore.updateTags(book.value.id, book.value.tags.filter(t => t !== tag))
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

  if (reviewMessageTimer) {
    clearTimeout(reviewMessageTimer)
  }

  reviewMessageTimer = setTimeout(() => {
    reviewMessage.value = ''
    reviewMessageTimer = null
  }, 2500)
}
</script>

<template>
  <div v-if="book" class="page-grid">
    <section class="hero-section grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div class="overflow-hidden rounded-[24px] border border-white/10 bg-secondary/70">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="`${book.title} cover`"
          class="aspect-[3/4] h-full w-full object-cover"
        />
        <div v-else class="flex aspect-[3/4] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,rgba(85,179,255,0.16),transparent)] text-muted-foreground">
          <BookOpen class="h-12 w-12" />
          <span class="text-xs font-semibold uppercase tracking-[0.28em]">표지 없음</span>
        </div>
      </div>

      <div class="space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex-1 space-y-3">
            <button
              type="button"
              class="action-pill-ghost px-0 py-0"
              @click="router.back()"
            >
              <ArrowLeft class="h-4 w-4" />
              <span>뒤로</span>
            </button>
            <div v-if="!isEditing">
              <h1 class="text-3xl font-semibold tracking-tight">{{ book.title }}</h1>
              <p class="mt-1 text-base text-muted-foreground">{{ book.author }}</p>
            </div>
            <div v-else class="space-y-3">
              <div class="grid gap-3">
                <input
                  v-model="editDraft.title"
                  class="field-shell h-11 text-xl font-semibold"
                  placeholder="책 제목"
                />
                <input
                  v-model="editDraft.author"
                  class="field-shell"
                  placeholder="저자"
                />
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex flex-col gap-1.5">
                    <span class="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">전체 페이지</span>
                    <input
                      v-model.number="editDraft.totalPages"
                      type="number"
                      min="1"
                      class="field-shell"
                    />
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span class="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">표지 이미지 URL</span>
                    <input
                      v-model="editDraft.coverUrl"
                      class="field-shell"
                      placeholder="https://..."
                    />
                  </label>
                </div>
                <div class="grid gap-3 sm:grid-cols-3">
                  <label class="flex flex-col gap-1.5">
                    <span class="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">현재 페이지</span>
                    <input
                      v-model.number="editDraft.currentPage"
                      type="number"
                      min="0"
                      :max="editDraft.totalPages"
                      class="field-shell"
                    />
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span class="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">시작일</span>
                    <input
                      v-model="editDraft.startDate"
                      type="date"
                      :max="toDateInputValue(new Date().toISOString())"
                      class="field-shell"
                    />
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span class="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">완료일</span>
                    <input
                      v-model="editDraft.endDate"
                      type="date"
                      :max="toDateInputValue(new Date().toISOString())"
                      class="field-shell"
                    />
                  </label>
                </div>
              </div>
              <p v-if="editError" class="text-sm font-medium text-destructive">{{ editError }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <template v-if="!isEditing">
              <label class="relative">
                <select
                  :value="book.status"
                  class="field-shell appearance-none pr-10"
                  @change="handleStatusChange"
                >
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </label>

              <button
                type="button"
                aria-label="Edit book"
                class="action-pill-secondary h-11 w-11 px-0 text-muted-foreground"
                @click="startEditing"
              >
                <Pencil class="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Delete book"
                class="action-pill-secondary h-11 w-11 px-0 text-destructive"
                @click="handleDelete"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="action-pill-secondary h-11 px-4"
                @click="cancelEditing"
              >
                취소
              </button>
              <button
                type="button"
                class="action-pill-primary h-11 px-4"
                @click="handleSaveEdit"
              >
                저장
              </button>
            </template>
          </div>
        </div>

        <p class="text-sm text-muted-foreground">{{ currentStatusOption.description }}</p>

        <div
          v-if="showDeleteConfirm"
          class="rounded-[24px] border border-destructive/30 bg-destructive/10 p-4"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
              <p class="text-sm font-semibold text-foreground">이 책을 삭제할까요?</p>
              <p class="text-sm text-muted-foreground">
                삭제 후 잠깐 동안은 되돌릴 수 있지만, 시간이 지나면 복구할 수 없습니다.
              </p>
            </div>
            <div class="flex gap-2 sm:justify-end">
              <button
                type="button"
                aria-label="Cancel delete"
                class="action-pill-secondary h-10 px-4"
                @click="cancelDelete"
              >
                취소
              </button>
              <button
                type="button"
                aria-label="Confirm delete"
                class="action-pill h-10 bg-[linear-gradient(135deg,rgba(255,99,99,0.95),rgba(255,99,99,0.72))] px-4 text-destructive-foreground"
                @click="confirmDelete"
              >
                삭제
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="panel-muted">
            <div class="flex items-start justify-between gap-3">
              <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">진행률</p>
                <p class="mt-2 text-2xl font-semibold">{{ progressPercentage }}%</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ book.currentPage }} / {{ book.totalPages }} 페이지</p>
              </div>
              <button
                type="button"
                class="action-pill-secondary h-8 rounded-xl px-3 text-xs"
                @click="togglePageEditor"
              >
                {{ showPageEditor ? '닫기' : '페이지 수정' }}
              </button>
            </div>
            <div v-if="showPageEditor" class="mt-4 space-y-3">
              <label class="space-y-2 text-sm font-medium">
                <span>현재 페이지</span>
                <input
                  v-model.number="currentPageDraft"
                  type="number"
                  min="0"
                  :max="book.totalPages"
                  class="field-shell"
                />
              </label>
              <p v-if="currentPageError" class="text-sm font-medium text-destructive">{{ currentPageError }}</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="action-pill-secondary h-10 px-4"
                  @click="togglePageEditor"
                >
                  취소
                </button>
                <button
                  type="button"
                  class="action-pill-primary h-10 px-4"
                  @click="handleCurrentPageSave"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
          <div class="panel-muted">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">시작일</p>
            <div class="mt-2 flex items-center gap-2 text-sm font-medium">
              <Calendar class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDate(book.startDate) }}</span>
            </div>
          </div>
          <div class="panel-muted">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">완료일</p>
            <div class="mt-2 flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDate(book.endDate) }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">독서 진행률</span>
            <span class="text-muted-foreground">{{ progressPercentage }}% 완료</span>
          </div>
          <div class="h-3 rounded-full bg-muted/80">
            <div class="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,99,99,0.95),rgba(85,179,255,0.85))] transition-all" :style="{ width: `${progressPercentage}%` }" />
          </div>
          <p class="text-xs text-muted-foreground">최근 로그 {{ book.logs.length }}개가 누적되어 있습니다.</p>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium">태그</p>
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="tag in book.tags"
              :key="tag"
              class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {{ tag }}
              <button type="button" :aria-label="`Remove tag ${tag}`" class="transition hover:text-primary/60" @click="handleRemoveTag(tag)">
                <X class="h-3 w-3" />
              </button>
            </span>
            <span v-if="book.tags.length === 0" class="text-xs text-muted-foreground">태그 없음</span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="tagInput"
              placeholder="태그 입력 후 Enter"
              class="field-shell h-9 px-3"
              @keydown.enter.prevent="handleAddTag"
            />
            <button
              type="button"
              class="action-pill-secondary h-9 rounded-2xl px-3 text-xs text-primary"
              @click="handleAddTag"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-8">
        <section class="panel">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold">독서 로그</h2>
              <p class="text-sm text-muted-foreground">페이지 범위와 간단한 메모를 남겨 독서 흐름을 이어가세요.</p>
            </div>
            <button
              type="button"
              class="action-pill-primary h-11 px-4"
              @click="showLogForm = !showLogForm"
            >
              {{ showLogForm ? '닫기' : '로그 추가' }}
            </button>
          </div>

          <div v-if="showLogForm" class="mt-6 rounded-[24px] border border-white/10 bg-background/60 p-4">
            <div class="grid gap-4 sm:grid-cols-3">
              <label class="space-y-2 text-sm font-medium">
                <span>시작 페이지</span>
                <input
                  v-model.number="newLog.startPage"
                  type="number"
                  min="1"
                  class="field-shell"
                />
              </label>

              <label class="space-y-2 text-sm font-medium">
                <span>종료 페이지</span>
                <input
                  v-model.number="newLog.endPage"
                  type="number"
                  min="1"
                  class="field-shell"
                />
              </label>

              <label class="space-y-2 text-sm font-medium">
                <span>기록 날짜</span>
                <input
                  v-model="newLog.date"
                  type="date"
                  :max="toDateInputValue(new Date().toISOString())"
                  class="field-shell"
                />
              </label>
            </div>

            <label class="mt-4 block space-y-2 text-sm font-medium">
              <span>메모</span>
              <textarea
                v-model="newLog.content"
                class="field-shell min-h-[120px] px-4 py-3"
                placeholder="오늘 인상 깊었던 내용을 남겨보세요."
              />
            </label>

            <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p v-if="logError" class="text-sm font-medium text-destructive">{{ logError }}</p>
              <div class="flex gap-2 sm:ml-auto">
                <button
                  type="button"
                  class="action-pill-secondary h-11 px-4"
                  @click="showLogForm = false"
                >
                  취소
                </button>
                <button
                  type="button"
                  class="action-pill-primary h-11 px-4"
                  @click="handleAddLog"
                >
                  저장
                </button>
              </div>
            </div>
          </div>

          <div v-if="book.logs.length === 0" class="mt-6 rounded-[24px] border border-dashed border-white/10 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            아직 기록된 독서 로그가 없습니다.
          </div>

          <div v-else class="mt-6 space-y-4">
            <article
              v-for="log in book.logs.slice().reverse()"
              :key="log.id"
              class="rounded-[24px] border border-white/10 bg-background/60 p-5"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-sm font-medium">{{ format(new Date(log.date), 'yyyy. M. d.') }}</p>
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

      <section class="panel">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">리뷰와 별점</h2>
            <p class="text-sm text-muted-foreground">완독 후의 감상이나 재독 포인트를 남겨 두세요.</p>
          </div>
          <span v-if="book.rating" class="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">
            {{ book.rating }}/5
          </span>
        </div>

        <div class="mt-6 space-y-3">
          <p class="text-sm font-medium">별점</p>
          <div class="flex items-center gap-2">
            <button
              v-for="rating in 5"
              :key="rating"
              type="button"
              :aria-label="`Rate ${rating} stars`"
              class="rounded-xl p-1.5 transition hover:bg-white/5"
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
              초기화
            </button>
          </div>
        </div>

        <label class="mt-6 block space-y-2 text-sm font-medium">
          <span>리뷰</span>
          <textarea
            id="review"
            v-model="reviewDraft"
            class="field-shell min-h-[180px] px-4 py-3"
            placeholder="이 책에 대한 감상을 남겨보세요."
          />
        </label>

        <div class="mt-5 flex flex-col gap-3">
          <p v-if="reviewError" class="text-sm font-medium text-destructive">{{ reviewError }}</p>
          <p v-else-if="reviewMessage" class="text-sm font-medium text-emerald-600 dark:text-emerald-300">{{ reviewMessage }}</p>
          <button
            type="button"
            aria-label="Save review"
            class="action-pill-primary h-11 px-4"
            @click="handleSaveReview"
          >
            리뷰 저장
          </button>
        </div>

        <div v-if="book.rating || book.review" class="mt-6 rounded-[24px] border border-white/10 bg-muted/50 p-5">
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

  <section
    v-else-if="deletedBook"
    class="hero-section p-8"
  >
    <div class="mx-auto flex max-w-xl flex-col gap-4 text-center sm:text-left">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">삭제됨</p>
        <h1 class="text-2xl font-semibold">{{ deletedBook.title }}을(를) 삭제했습니다.</h1>
        <p class="text-sm leading-6 text-muted-foreground">
          {{ undoCountdownSeconds }}초 안에는 되돌릴 수 있습니다. 시간이 지나면 이 화면에서도 복구할 수 없습니다.
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          aria-label="Undo delete"
          class="action-pill-primary h-11 px-5"
          @click="handleUndoDelete"
        >
          삭제 취소
        </button>
        <button
          type="button"
          class="action-pill-secondary h-11 px-5"
          @click="router.push('/books')"
        >
          서재로 이동
        </button>
      </div>
    </div>
  </section>

  <section v-else class="hero-section border-dashed p-12 text-center">
    <div class="mx-auto flex max-w-md flex-col items-center gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-secondary/70">
        <BookOpen class="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 class="text-2xl font-semibold">책을 찾을 수 없습니다.</h1>
      <p class="text-sm leading-6 text-muted-foreground">
        요청한 책이 존재하지 않거나 이미 삭제되었습니다. 서재 목록으로 돌아가 다른 책을 선택해 주세요.
      </p>
      <RouterLink
        to="/books"
        class="action-pill-primary h-11 px-5"
      >
        서재로 이동
      </RouterLink>
    </div>
  </section>
</template>
