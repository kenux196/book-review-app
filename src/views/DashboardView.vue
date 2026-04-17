<script setup lang="ts">
import { computed, ref } from 'vue'
import { BookCopy, BookOpen, CheckCircle2, Download, LibraryBig, RotateCcw, Sparkles, Upload } from 'lucide-vue-next'
import { useBookStore } from '../stores/book'
import type { BackupPayload, BackupPreview, BackupRestoreMode } from '../stores/book'
import ReadingHeatmap from '../components/ReadingHeatmap.vue'
import MonthlyStats from '../components/MonthlyStats.vue'

const bookStore = useBookStore()
const backupFileInput = ref<HTMLInputElement | null>(null)
const backupMessage = ref('')
const backupError = ref('')
const importFileName = ref('')
const importMode = ref<BackupRestoreMode>('merge')
const importPayload = ref<BackupPayload | null>(null)
const importPreview = ref<BackupPreview | null>(null)

const totalPagesRead = computed(() => {
  return bookStore.books.reduce((sum, book) => sum + book.currentPage, 0)
})

const featuredReadingBook = computed(() => {
  return [...bookStore.readingBooks].sort((left, right) => {
    const leftLastActivity = left.logs[left.logs.length - 1]?.date ?? left.startDate ?? left.createdAt
    const rightLastActivity = right.logs[right.logs.length - 1]?.date ?? right.startDate ?? right.createdAt
    return rightLastActivity.localeCompare(leftLastActivity)
  })[0]
})

const readingStreakHint = computed(() => {
  if (featuredReadingBook.value) {
    return `${featuredReadingBook.value.title}의 최근 페이지에서 바로 이어 읽을 수 있습니다.`
  }
  if (bookStore.books.length > 0) return '읽을 책 하나를 Reading 상태로 옮겨 오늘의 독서를 시작해 보세요.'
  return '첫 책을 등록하면 대시보드에 독서 현황이 쌓이기 시작합니다.'
})

const nextActionLink = computed(() => {
  return featuredReadingBook.value ? `/books/${featuredReadingBook.value.id}` : '/books'
})

const nextActionLabel = computed(() => {
  return featuredReadingBook.value ? '이어 읽기' : '서재 열기'
})

const resetImportState = () => {
  importFileName.value = ''
  importPayload.value = null
  importPreview.value = null

  if (backupFileInput.value) {
    backupFileInput.value.value = ''
  }
}

const handleExportBackup = () => {
  const backupJson = bookStore.exportBackup()
  const blob = new Blob([backupJson], { type: 'application/json' })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStamp = new Date().toISOString().slice(0, 10)

  link.href = downloadUrl
  link.download = `booklog-backup-${dateStamp}.json`
  link.click()
  URL.revokeObjectURL(downloadUrl)

  backupError.value = ''
  backupMessage.value = '백업 파일을 다운로드했습니다.'
}

const handleBackupFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  backupMessage.value = ''

  if (!file) {
    resetImportState()
    return
  }

  const result = bookStore.previewBackup(await file.text())
  if (!result.ok) {
    backupError.value = result.message
    resetImportState()
    return
  }

  importFileName.value = file.name
  importPayload.value = result.payload
  importPreview.value = result.preview
  backupError.value = ''
}

const applyBackupImport = () => {
  if (!importPayload.value || !importPreview.value) {
    backupError.value = '가져올 백업 파일을 먼저 선택해 주세요.'
    return
  }

  const result = bookStore.importBackup(importPayload.value, importMode.value)
  if (!result.ok) {
    backupError.value = result.message
    return
  }

  backupError.value = ''
  backupMessage.value = importMode.value === 'overwrite'
    ? `${importPreview.value.totalBooks}권을 덮어써서 복원했습니다.`
    : `${importPreview.value.totalBooks}권을 현재 서재에 병합했습니다.`
  resetImportState()
}
</script>

<template>
  <div class="page-grid">
    <section class="hero-section grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="space-y-4">
        <span class="hero-badge">
          <Sparkles class="h-3.5 w-3.5" />
          대시보드
        </span>
        <div class="space-y-3">
          <h1 class="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">독서의 현재 위치를 빠르게 확인하세요.</h1>
          <p class="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            읽는 중인 책, 완독한 책, 누적 페이지를 한 화면에서 보고 바로 다음 액션으로 이어갈 수 있습니다.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted-foreground">
          <span class="code-kbd">Command</span>
          <span class="code-kbd">K</span>
          <span>대신 지금은 대시보드에서 바로 다음 읽기 흐름을 선택합니다.</span>
        </div>
      </div>

      <div class="panel-muted relative overflow-hidden">
        <div class="surface-stripe absolute inset-y-0 right-0 w-20 opacity-40" />
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">이어 읽기</p>
        <p class="mt-3 text-sm leading-6 text-foreground/90">{{ readingStreakHint }}</p>
        <div v-if="featuredReadingBook" class="mt-4 rounded-2xl border border-white/10 bg-background/80 px-4 py-3">
          <p class="text-sm font-semibold">{{ featuredReadingBook.title }}</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ featuredReadingBook.currentPage }} / {{ featuredReadingBook.totalPages }} 페이지 · 로그 {{ featuredReadingBook.logs.length }}개
          </p>
        </div>
        <RouterLink
          :to="nextActionLink"
          class="action-pill-primary mt-5 h-11 px-4"
        >
          {{ nextActionLabel }}
        </RouterLink>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <article class="metric-card">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">지금 읽는 책</p>
          <BookOpen class="h-4 w-4 text-info" />
        </div>
        <p class="mt-4 text-3xl font-semibold">{{ bookStore.readingBooks.length }}</p>
        <p class="mt-2 text-sm text-muted-foreground">현재 진행 중인 책 수</p>
      </article>

      <article class="metric-card">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">완독한 책</p>
          <CheckCircle2 class="h-4 w-4 text-success" />
        </div>
        <p class="mt-4 text-3xl font-semibold">{{ bookStore.readBooks.length }}</p>
        <p class="mt-2 text-sm text-muted-foreground">완독한 책 수</p>
      </article>

      <article class="metric-card">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">누적 페이지</p>
          <BookCopy class="h-4 w-4 text-primary" />
        </div>
        <p class="mt-4 text-3xl font-semibold">{{ totalPagesRead }}</p>
        <p class="mt-2 text-sm text-muted-foreground">전체 책에서 누적한 페이지 수</p>
      </article>
    </section>

    <div class="space-y-6">
      <ReadingHeatmap />
      <MonthlyStats />
    </div>

    <section class="panel grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight">백업 및 복원</h2>
          <p class="mt-2 text-sm leading-7 text-muted-foreground">
            브라우저를 바꾸거나 데이터를 정리하기 전에 전체 서재를 JSON 파일로 내보내세요. 가져오기 전에는 책 수와 상태를 미리 확인할 수 있습니다.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="action-pill-primary h-11 px-4"
            @click="handleExportBackup"
          >
            <Download class="h-4 w-4" />
            JSON 백업 다운로드
          </button>

          <label class="action-pill-secondary h-11 cursor-pointer px-4">
            <Upload class="h-4 w-4" />
            백업 파일 선택
            <input
              ref="backupFileInput"
              type="file"
              accept="application/json"
              class="sr-only"
              @change="handleBackupFileChange"
            >
          </label>
        </div>

        <p v-if="backupMessage" class="text-sm text-emerald-600 dark:text-emerald-400">{{ backupMessage }}</p>
        <p v-if="backupError" class="text-sm text-rose-600 dark:text-rose-400">{{ backupError }}</p>
      </div>

      <div class="panel-muted">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">복원 미리보기</p>
        <div v-if="importPreview" class="mt-4 space-y-4">
          <div>
            <p class="text-sm font-semibold text-foreground">{{ importFileName }}</p>
            <p class="mt-1 text-xs text-muted-foreground">
              내보낸 시각 {{ new Date(importPreview.exportedAt).toLocaleString('ko-KR') }}
            </p>
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-2xl border border-white/10 bg-background/85 px-3 py-2">
              <dt class="text-xs text-muted-foreground">총 책</dt>
              <dd class="mt-1 font-semibold">{{ importPreview.totalBooks }}권</dd>
            </div>
            <div class="rounded-2xl border border-white/10 bg-background/85 px-3 py-2">
              <dt class="text-xs text-muted-foreground">읽는 중</dt>
              <dd class="mt-1 font-semibold">{{ importPreview.readingBooks }}권</dd>
            </div>
            <div class="rounded-2xl border border-white/10 bg-background/85 px-3 py-2">
              <dt class="text-xs text-muted-foreground">완독</dt>
              <dd class="mt-1 font-semibold">{{ importPreview.readBooks }}권</dd>
            </div>
            <div class="rounded-2xl border border-white/10 bg-background/85 px-3 py-2">
              <dt class="text-xs text-muted-foreground">테마</dt>
              <dd class="mt-1 font-semibold">
                {{ importPreview.theme === 'system' ? '시스템' : importPreview.theme === 'dark' ? '다크' : '라이트' }}
              </dd>
            </div>
          </dl>

          <fieldset class="space-y-2">
            <legend class="text-sm font-semibold">복원 방식</legend>
            <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/85 px-3 py-3">
              <input v-model="importMode" type="radio" value="merge" class="mt-1" >
              <span>
                <span class="block text-sm font-semibold">병합</span>
                <span class="block text-xs leading-5 text-muted-foreground">현재 서재를 유지한 채 같은 ID는 덮어쓰고 새 책은 추가합니다.</span>
              </span>
            </label>
            <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/85 px-3 py-3">
              <input v-model="importMode" type="radio" value="overwrite" class="mt-1" >
              <span>
                <span class="block text-sm font-semibold">덮어쓰기</span>
                <span class="block text-xs leading-5 text-muted-foreground">현재 서재와 테마를 백업 파일 내용으로 완전히 교체합니다.</span>
              </span>
            </label>
          </fieldset>

          <button
            type="button"
            class="action-pill-secondary h-11 w-full"
            @click="applyBackupImport"
          >
            <RotateCcw class="h-4 w-4" />
            선택한 방식으로 복원하기
          </button>
        </div>

        <div v-else class="mt-4 rounded-2xl border border-dashed border-white/10 bg-background/60 px-4 py-6 text-sm leading-6 text-muted-foreground">
          백업 JSON 파일을 선택하면 복원 전 책 수와 테마를 여기에서 확인할 수 있습니다.
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight">이어 읽기</h2>
          <p class="text-sm text-muted-foreground">진행 중인 책의 상태와 페이지를 바로 확인합니다.</p>
        </div>
        <RouterLink to="/books" class="text-sm font-medium text-primary transition hover:opacity-80">서재 전체 보기</RouterLink>
      </div>

      <div v-if="bookStore.readingBooks.length === 0" class="panel border-dashed text-center">
        <div class="mx-auto flex max-w-md flex-col items-center gap-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-secondary/70">
            <LibraryBig class="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 class="text-xl font-semibold">지금 읽는 책이 없습니다.</h3>
          <p class="text-sm leading-6 text-muted-foreground">
            서재에서 책을 추가하거나 상태를 Reading으로 바꾸면 여기에서 바로 이어서 볼 수 있습니다.
          </p>
          <RouterLink
            to="/books"
            class="action-pill-primary h-11 px-4"
          >
            책 추가하거나 시작하기
          </RouterLink>
        </div>
      </div>

      <div v-else class="grid gap-5 lg:grid-cols-2">
        <RouterLink
          v-for="book in bookStore.readingBooks"
          :key="book.id"
          :to="`/books/${book.id}`"
          class="panel transition hover:-translate-y-0.5"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold">{{ book.title }}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{{ book.author }}</p>
            </div>
            <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              읽는 중
            </span>
          </div>

          <div class="mt-6 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>진행률</span>
              <span>{{ Math.round((book.currentPage / book.totalPages) * 100) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${Math.round((book.currentPage / book.totalPages) * 100)}%` }"
              />
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ book.currentPage }} / {{ book.totalPages }} 페이지</span>
              <span>로그 {{ book.logs.length }}개</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
