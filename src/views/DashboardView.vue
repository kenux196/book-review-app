<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, CheckCircle2, Clock3, LibraryBig, Sparkles } from 'lucide-vue-next'
import { useBookStore } from '../stores/book'
import ReadingHeatmap from '../components/ReadingHeatmap.vue'

const bookStore = useBookStore()

const totalPagesRead = computed(() => {
  return bookStore.books.reduce((sum, book) => sum + book.currentPage, 0)
})

const readingStreakHint = computed(() => {
  if (bookStore.readingBooks.length > 0) return '진행 중인 책의 로그를 추가해 흐름을 끊기지 않게 유지하세요.'
  if (bookStore.books.length > 0) return '읽을 책 하나를 Reading 상태로 옮겨 오늘의 독서를 시작해 보세요.'
  return '첫 책을 등록하면 대시보드에 독서 현황이 쌓이기 시작합니다.'
})
</script>

<template>
  <div class="space-y-8">
    <section class="grid gap-6 rounded-[30px] border border-border/70 bg-card/90 p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_280px]">
      <div class="space-y-4">
        <span class="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          <Sparkles class="h-3.5 w-3.5" />
          Dashboard
        </span>
        <div class="space-y-3">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">독서의 현재 위치를 빠르게 확인하세요.</h1>
          <p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            읽는 중인 책, 완독한 책, 누적 페이지를 한 화면에서 보고 바로 다음 액션으로 이어갈 수 있습니다.
          </p>
        </div>
      </div>

      <div class="rounded-[26px] bg-muted/60 p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Next Move</p>
        <p class="mt-3 text-sm leading-6 text-foreground/90">{{ readingStreakHint }}</p>
        <RouterLink
          to="/books"
          class="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Open Library
        </RouterLink>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <article class="rounded-[26px] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">Reading Now</p>
          <BookOpen class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-4 text-3xl font-semibold">{{ bookStore.readingBooks.length }}</p>
        <p class="mt-2 text-sm text-muted-foreground">현재 진행 중인 책 수</p>
      </article>

      <article class="rounded-[26px] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">Books Read</p>
          <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-4 text-3xl font-semibold">{{ bookStore.readBooks.length }}</p>
        <p class="mt-2 text-sm text-muted-foreground">완독한 책 수</p>
      </article>

      <article class="rounded-[26px] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">Total Pages</p>
          <Clock3 class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-4 text-3xl font-semibold">{{ totalPagesRead }}</p>
        <p class="mt-2 text-sm text-muted-foreground">전체 책에서 누적한 페이지 수</p>
      </article>
    </section>

    <ReadingHeatmap />

    <section class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight">Currently Reading</h2>
          <p class="text-sm text-muted-foreground">진행 중인 책의 상태와 페이지를 바로 확인합니다.</p>
        </div>
        <RouterLink to="/books" class="text-sm font-medium text-primary transition hover:opacity-80">See all books</RouterLink>
      </div>

      <div v-if="bookStore.readingBooks.length === 0" class="rounded-[28px] border border-dashed border-border bg-card/70 p-10 text-center">
        <div class="mx-auto flex max-w-md flex-col items-center gap-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LibraryBig class="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 class="text-xl font-semibold">No books currently in progress.</h3>
          <p class="text-sm leading-6 text-muted-foreground">
            서재에서 책을 추가하거나 상태를 Reading으로 바꾸면 여기에서 바로 이어서 볼 수 있습니다.
          </p>
          <RouterLink
            to="/books"
            class="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Add or Start a Book
          </RouterLink>
        </div>
      </div>

      <div v-else class="grid gap-5 lg:grid-cols-2">
        <RouterLink
          v-for="book in bookStore.readingBooks"
          :key="book.id"
          :to="`/books/${book.id}`"
          class="overflow-hidden rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold">{{ book.title }}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{{ book.author }}</p>
            </div>
            <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              Reading
            </span>
          </div>

          <div class="mt-6 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{{ Math.round((book.currentPage / book.totalPages) * 100) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${Math.round((book.currentPage / book.totalPages) * 100)}%` }"
              />
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ book.currentPage }} / {{ book.totalPages }} pages</span>
              <span>{{ book.logs.length }} logs</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
