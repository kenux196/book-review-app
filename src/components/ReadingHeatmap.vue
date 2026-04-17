<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  addDays,
  endOfYear,
  format,
  getDay,
  isAfter,
  isSameDay,
  startOfDay,
  startOfYear,
  subDays,
} from 'date-fns'
import { useBookStore } from '../stores/book'

const bookStore = useBookStore()
const currentYear = ref(new Date().getFullYear())
const today = startOfDay(new Date())
const selectedDay = ref<DayCell | null>(null)

// 날짜별 읽은 페이지 합산
const activityMap = computed(() => {
  const map = new Map<string, number>()
  for (const book of bookStore.books) {
    for (const log of book.logs) {
      const dateKey = log.date.substring(0, 10)
      const pages = log.endPage - log.startPage + 1
      map.set(dateKey, (map.get(dateKey) ?? 0) + pages)
    }
  }
  return map
})

// 연도 이동 함수
const goToPrevYear = () => {
  currentYear.value--
}

const goToNextYear = () => {
  if (currentYear.value < today.getFullYear()) {
    currentYear.value++
  }
}

const goToCurrentYear = () => {
  currentYear.value = today.getFullYear()
}

const isNextDisabled = computed(() => currentYear.value >= today.getFullYear())
const isCurrentYear = computed(() => currentYear.value === today.getFullYear())

type DayCell = { date: Date; dateKey: string; pages: number; isFuture: boolean }
type WeekRow = (DayCell | null)[]

// 그리드 생성 (일요일 기준 정렬, 선택된 연도의 전체 일수 포함)
const grid = computed((): WeekRow[] => {
  const jan1 = startOfYear(new Date(currentYear.value, 0, 1))
  const dec31 = endOfYear(jan1)

  // 1월 1일이 포함된 주의 일요일 찾기
  const startDayOfWeek = getDay(jan1)
  const startDate = subDays(jan1, startDayOfWeek)

  // 12월 31일이 포함된 주의 토요일까지의 총 일수 계산
  const endDayOfWeek = getDay(dec31)
  // 실제 그리드에 필요한 총 일수 (앞뒤 패딩 포함)
  const gridDays = startDayOfWeek + (365 + (currentYear.value % 4 === 0 ? 1 : 0)) + (6 - endDayOfWeek)

  const days: (DayCell | null)[] = Array.from({ length: gridDays }, (_, i) => {
    const date = addDays(startDate, i)
    // 현재 선택된 연도 범위를 벗어나는 날짜는 null 처리 (패딩)
    if (date.getFullYear() !== currentYear.value) return null

    const dateKey = format(date, 'yyyy-MM-dd')
    const isFuture = isAfter(date, today) && !isSameDay(date, today)

    return {
      date,
      dateKey,
      pages: activityMap.value.get(dateKey) ?? 0,
      isFuture,
    }
  })

  const weeks: WeekRow[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
})

const getMonthLabel = (weekIndex: number): string => {
  const week = grid.value[weekIndex]
  const firstDay = week?.find((d): d is DayCell => d !== null)
  if (!firstDay) return ''

  // 해당 주의 첫 번째 실제 날짜가 1일이거나, 그리드의 첫 번째 주인 경우
  if (firstDay.date.getDate() <= 7) {
    const prevWeek = grid.value[weekIndex - 1]
    const prevFirstDay = prevWeek?.find((d): d is DayCell => d !== null)

    if (!prevFirstDay || firstDay.date.getMonth() !== prevFirstDay.date.getMonth()) {
      return format(firstDay.date, 'M월')
    }
  }
  return ''
}

const getCellColor = (day: DayCell) => {
  if (day.isFuture) return 'bg-muted/30 opacity-40'
  if (day.pages === 0) return 'bg-muted'
  if (day.pages <= 20) return 'bg-primary/30'
  if (day.pages <= 50) return 'bg-primary/55'
  if (day.pages <= 100) return 'bg-primary/80'
  return 'bg-primary'
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const getDaySummary = (day: DayCell) => {
  if (day.isFuture) {
    return `${day.dateKey}은 아직 오지 않은 날짜입니다.`
  }

  if (day.pages === 0) {
    return `${day.dateKey}에는 기록된 독서 페이지가 없습니다.`
  }

  return `${day.dateKey}에 ${day.pages}페이지를 읽었습니다.`
}

const selectDay = (day: DayCell) => {
  selectedDay.value = day
}

// 현재 선택된 연도의 통계
const yearStats = computed(() => {
  let activeDays = 0
  let totalPages = 0
  const yearPrefix = `${currentYear.value}-`

  for (const [date, pages] of activityMap.value.entries()) {
    if (date.startsWith(yearPrefix)) {
      activeDays++
      totalPages += pages
    }
  }
  return { activeDays, totalPages }
})

const selectedDaySummary = computed(() => {
  if (!selectedDay.value) return '셀을 누르거나 키보드로 포커스를 이동하면 날짜별 기록을 확인할 수 있습니다.'
  return getDaySummary(selectedDay.value)
})

watch(currentYear, nextYear => {
  if (selectedDay.value?.date.getFullYear() !== nextYear) {
    selectedDay.value = null
  }
})
</script>

<template>
  <div class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm transition-all duration-300">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">독서 활동</h2>
        <p class="text-sm text-muted-foreground">{{ currentYear }}년 독서 기록</p>
      </div>

      <div class="flex flex-col items-end gap-2">
        <!-- 연도 네비게이션 -->
        <div class="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-1">
          <button
            @click="goToPrevYear"
            aria-label="이전 연도"
            class="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="px-2 text-sm font-medium">{{ currentYear }}년</span>
          <button
            @click="goToCurrentYear"
            :disabled="isCurrentYear"
            aria-label="현재 연도로 이동"
            class="inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            올해
          </button>
          <button
            @click="goToNextYear"
            :disabled="isNextDisabled"
            aria-label="다음 연도"
            class="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div class="text-right text-sm text-muted-foreground">
          <p><span class="font-medium text-foreground">{{ yearStats.activeDays }}일</span> 활동</p>
          <p><span class="font-medium text-foreground">{{ yearStats.totalPages.toLocaleString() }}p</span> 기록</p>
        </div>
      </div>
    </div>

    <!-- 히트맵 영역 (가로 스크롤 가능) -->
    <div class="mt-6 w-full overflow-x-auto pb-2">
      <div class="min-w-[700px]">
        <!-- 월 레이블 행 -->
        <div class="mb-1 flex items-end">
          <div class="mr-1 w-7 shrink-0" />
          <div
            v-for="(_week, wi) in grid"
            :key="wi"
            class="min-w-0 flex-1 overflow-hidden text-[10px] font-medium text-muted-foreground/80"
          >
            {{ getMonthLabel(wi) }}
          </div>
        </div>

        <!-- 요일별 히트맵 행 -->
        <div
          v-for="(day, di) in DAY_LABELS"
          :key="day"
          class="mb-[3px] flex items-center"
        >
          <!-- 요일 레이블 -->
          <div class="mr-1 w-7 shrink-0 text-right text-[10px] leading-none text-muted-foreground/60">
            {{ di % 2 === 1 ? day : '' }}
          </div>
          <!-- 주별 셀 -->
          <div
            v-for="(week, wi) in grid"
            :key="wi"
            class="min-w-0 flex-1 px-[1.5px]"
          >
            <button
              v-if="week[di]"
              type="button"
              :title="getDaySummary(week[di]!)"
              :aria-label="getDaySummary(week[di]!)"
              :class="[
                'aspect-square w-full rounded-[3px] transition-all hover:scale-110 hover:ring-2 hover:ring-primary/20 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40',
                selectedDay?.dateKey === week[di]!.dateKey ? 'ring-2 ring-primary/40' : '',
                getCellColor(week[di]!),
              ]"
              @click="selectDay(week[di]!)"
              @focus="selectDay(week[di]!)"
            />
            <div v-else class="aspect-square w-full bg-transparent" />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-[20px] border border-border/60 bg-background/70 px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">선택한 날짜</p>
      <p class="mt-2 text-sm leading-6 text-foreground/90">{{ selectedDaySummary }}</p>
    </div>

    <!-- 범례 -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
      <div class="flex items-center gap-4 text-[10px] text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <div class="h-2.5 w-2.5 rounded-[2px] bg-primary/30" />
          <span>~20p</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="h-2.5 w-2.5 rounded-[2px] bg-primary/55" />
          <span>~50p</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="h-2.5 w-2.5 rounded-[2px] bg-primary/80" />
          <span>~100p</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="h-2.5 w-2.5 rounded-[2px] bg-primary" />
          <span>100p+</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>적음</span>
        <div class="h-[12px] w-[12px] rounded-[2px] bg-muted" />
        <div class="h-[12px] w-[12px] rounded-[2px] bg-primary" />
        <span>많음</span>
      </div>
    </div>
  </div>
</template>
