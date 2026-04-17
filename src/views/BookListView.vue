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
  { value: 'CREATED_AT_DESC', label: '최근 추가 순' },
  { value: 'TITLE_ASC', label: '제목 가나다순' },
  { value: 'PROGRESS_DESC', label: '진행률 높은 순' },
  { value: 'STATUS_ASC', label: '상태 순' },
]

const addStatusOptions: { value: BookStatus; label: string; description: string }[] = [
  { value: 'TO_READ', label: '읽을 책', description: '읽고 싶은 책으로 저장하고 페이지는 0부터 시작합니다.' },
  { value: 'READING', label: '읽는 중', description: '지금 읽는 책으로 저장하고 현재 읽은 페이지를 함께 기록합니다.' },
  { value: 'READ', label: '완독', description: '완독한 책으로 저장합니다. 저장 시 전체 페이지까지 자동 반영됩니다.' },
  { value: 'STOPPED', label: '중단', description: '중단한 책으로 저장하고 마지막으로 읽은 페이지를 남깁니다.' },
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

const currentStatusOption = computed(() => {
  return addStatusOptions.find(option => option.value === newBook.value.status) ?? addStatusOptions[0]
})

const shouldShowProgressField = computed(() => {
  return newBook.value.status === 'READING' || newBook.value.status === 'STOPPED'
})

const progressFieldLabel = computed(() => {
  return newBook.value.status === 'STOPPED' ? '마지막으로 읽은 페이지' : '현재 페이지'
})

const progressFieldDescription = computed(() => {
  return newBook.value.status === 'STOPPED'
    ? '중단하기 전 마지막으로 읽은 페이지를 입력하세요.'
    : '현재 어디까지 읽었는지 입력하세요.'
})

const updateDraftStatus = (status: BookStatus) => {
  newBook.value.status = status

  if (status === 'TO_READ') {
    newBook.value.currentPage = 0
  }
}

const handleDraftStatusChange = (event: Event) => {
  updateDraftStatus((event.target as HTMLSelectElement).value as BookStatus)
}

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
      return '읽을 책'
    case 'READING':
      return '읽는 중'
    case 'READ':
      return '완독'
    case 'STOPPED':
      return '중단'
  }
}
</script>

<template>
  <div class="space-y-8">
    <section class="flex flex-col gap-5 rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-sm shadow-slate-200/40 dark:shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-3">
        <span class="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          내 서재
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
        <span>{{ showAddForm ? '폼 닫기' : '책 추가' }}</span>
      </button>
    </section>

    <section v-if="showAddForm" class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold">새 책 추가</h2>
          <p class="text-sm text-muted-foreground">제목, 저자, 페이지 수를 기준으로 로컬 서재에 추가합니다.</p>
        </div>
        <p v-if="addError" class="text-sm font-medium text-destructive">{{ addError }}</p>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label class="space-y-2 text-sm font-medium">
          <span>제목</span>
          <input
            v-model="newBook.title"
            placeholder="책 제목"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>저자</span>
          <input
            v-model="newBook.author"
            placeholder="저자명"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>전체 페이지</span>
          <input
            v-model.number="newBook.totalPages"
            type="number"
            min="1"
            placeholder="전체 페이지 수"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>초기 상태</span>
          <div class="relative">
            <select
              :value="newBook.status"
              aria-label="초기 상태"
              class="h-11 w-full appearance-none rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
              @change="handleDraftStatusChange"
            >
              <option
                v-for="option in addStatusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <p class="text-xs leading-5 text-muted-foreground">{{ currentStatusOption?.description }}</p>
        </label>

        <label class="space-y-2 text-sm font-medium">
          <span>표지 URL</span>
          <input
            v-model="newBook.coverUrl"
            type="url"
            placeholder="https://example.com/cover.jpg"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label v-if="shouldShowProgressField" class="space-y-2 text-sm font-medium">
          <span>{{ progressFieldLabel }}</span>
          <input
            v-model.number="newBook.currentPage"
            type="number"
            min="1"
            :max="newBook.totalPages || undefined"
            placeholder="현재 페이지"
            class="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
          />
          <p class="text-xs leading-5 text-muted-foreground">{{ progressFieldDescription }}</p>
        </label>

        <div
          v-else-if="newBook.status === 'READ'"
          class="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          저장하면 완독 상태로 추가되고 진행률은 <span class="font-semibold">100%</span>로 설정됩니다.
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium transition hover:bg-muted"
          @click="showAddForm = false; resetForm()"
        >
          취소
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          @click="handleAddBook"
        >
          저장
        </button>
      </div>
    </section>

    <section class="grid gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_200px_200px]">
      <label class="relative">
        <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          placeholder="책 제목, 저자, 태그 검색"
          class="h-11 w-full rounded-2xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary"
        />
      </label>

      <label class="relative">
        <select
          v-model="statusFilter"
          class="h-11 w-full appearance-none rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary"
        >
          <option value="ALL">모든 상태</option>
          <option value="TO_READ">읽을 책</option>
          <option value="READING">읽는 중</option>
          <option value="READ">완독</option>
          <option value="STOPPED">중단</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </label>

      <label class="relative">
        <select
          v-model="sortKey"
          aria-label="정렬 기준"
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
              <span class="text-[11px] font-semibold uppercase tracking-[0.24em]">표지 없음</span>
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
                <span>{{ book.currentPage }} / {{ book.totalPages }} 페이지</span>
                <span>로그 {{ book.logs.length }}개</span>
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
        <h2 class="text-xl font-semibold">조건에 맞는 책이 없습니다.</h2>
        <p class="text-sm leading-6 text-muted-foreground">
          검색어, 상태 필터, 정렬 조건에 맞는 책이 없습니다. 필터를 바꾸거나 새 책을 추가해 보세요.
        </p>
      </div>
    </section>
  </div>
</template>
