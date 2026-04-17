<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, subMonths } from 'date-fns'
import { useBookStore } from '../stores/book'

const bookStore = useBookStore()

type Metric = 'pages' | 'books'
const activeMetric = ref<Metric>('pages')

const MONTHS = 12

const months = computed(() =>
  Array.from({ length: MONTHS }, (_, i) => {
    const date = subMonths(new Date(), MONTHS - 1 - i)
    return { date, key: format(date, 'yyyy-MM'), label: format(date, 'M월') }
  }),
)

const pagesPerMonth = computed(() => {
  const map = new Map<string, number>()
  for (const book of bookStore.books) {
    for (const log of book.logs) {
      const key = log.date.substring(0, 7)
      const pages = log.endPage - log.startPage + 1
      map.set(key, (map.get(key) ?? 0) + pages)
    }
  }
  return map
})

const booksPerMonth = computed(() => {
  const map = new Map<string, number>()
  for (const book of bookStore.books) {
    if (book.status === 'READ' && book.endDate) {
      const key = book.endDate.substring(0, 7)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
  }
  return map
})

const chartData = computed(() =>
  months.value.map(month => ({
    ...month,
    value:
      activeMetric.value === 'pages'
        ? (pagesPerMonth.value.get(month.key) ?? 0)
        : (booksPerMonth.value.get(month.key) ?? 0),
  })),
)

const maxValue = computed(() => Math.max(...chartData.value.map(d => d.value), 1))

const thisYearKey = format(new Date(), 'yyyy')
const totalPagesThisYear = computed(() =>
  [...pagesPerMonth.value.entries()]
    .filter(([k]) => k.startsWith(thisYearKey))
    .reduce((sum, [, v]) => sum + v, 0),
)
const totalBooksThisYear = computed(() =>
  bookStore.books.filter(b => b.status === 'READ' && b.endDate?.startsWith(thisYearKey)).length,
)
</script>

<template>
  <div class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">월간 통계</h2>
        <p class="text-sm text-muted-foreground">최근 12개월 독서 현황</p>
      </div>

      <!-- 탭 전환 -->
      <div class="flex gap-1 rounded-2xl bg-muted p-1 text-sm">
        <button
          type="button"
          :class="['h-8 rounded-xl px-3 font-medium transition', activeMetric === 'pages' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']"
          @click="activeMetric = 'pages'"
        >
          페이지
        </button>
        <button
          type="button"
          :class="['h-8 rounded-xl px-3 font-medium transition', activeMetric === 'books' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']"
          @click="activeMetric = 'books'"
        >
          권수
        </button>
      </div>
    </div>

    <!-- 요약 -->
    <div class="mt-5 flex gap-6 text-sm">
      <div>
        <p class="text-muted-foreground">{{ thisYearKey }}년 완독</p>
        <p class="mt-0.5 text-2xl font-semibold">{{ totalBooksThisYear }}<span class="ml-1 text-sm font-normal text-muted-foreground">권</span></p>
      </div>
      <div>
        <p class="text-muted-foreground">{{ thisYearKey }}년 읽은 페이지</p>
        <p class="mt-0.5 text-2xl font-semibold">{{ totalPagesThisYear.toLocaleString() }}<span class="ml-1 text-sm font-normal text-muted-foreground">p</span></p>
      </div>
    </div>

    <!-- 바 차트 -->
    <div class="mt-6 flex items-end gap-1.5" style="height: 120px">
      <div
        v-for="item in chartData"
        :key="item.key"
        class="group relative flex flex-1 flex-col items-center justify-end"
        style="height: 100%"
      >
        <!-- 툴팁 -->
        <div class="pointer-events-none absolute bottom-full mb-1.5 hidden rounded-xl border border-border bg-card px-2 py-1 text-center text-xs shadow-sm group-hover:block">
          <p class="font-semibold">{{ item.value.toLocaleString() }}{{ activeMetric === 'pages' ? 'p' : '권' }}</p>
        </div>
        <!-- 바 -->
        <div
          :style="{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 2)}%` }"
          :class="['w-full rounded-t-md transition-all', item.value > 0 ? 'bg-primary' : 'bg-muted']"
        />
      </div>
    </div>

    <!-- 월 레이블 -->
    <div class="mt-1.5 flex gap-1.5">
      <div
        v-for="item in chartData"
        :key="item.key"
        class="flex-1 text-center text-[10px] text-muted-foreground"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
