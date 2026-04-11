<script setup lang="ts">
import { computed, ref } from 'vue'
import { addDays, format, getDay, startOfDay, subDays } from 'date-fns'
import { useBookStore } from '../stores/book'

const bookStore = useBookStore()

type ViewMode = '6months' | '1year'
const viewMode = ref<ViewMode>('6months')

const weeksCount = computed(() => (viewMode.value === '6months' ? 26 : 52))

type DayCell = { date: Date; dateKey: string; pages: number }
type WeekRow = (DayCell | null)[]

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

// 그리드 생성 (일요일 기준 정렬)
const grid = computed((): WeekRow[] => {
  const today = startOfDay(new Date())
  const todayDow = getDay(today)
  const WEEKS = weeksCount.value
  const startDate = subDays(today, todayDow + WEEKS * 7)
  const totalDays = todayDow + WEEKS * 7 + 1

  const days: DayCell[] = Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(startDate, i)
    const dateKey = format(date, 'yyyy-MM-dd')
    return { date, dateKey, pages: activityMap.value.get(dateKey) ?? 0 }
  })

  // 마지막 주를 7칸으로 패딩
  const padded: (DayCell | null)[] = [...days]
  while (padded.length % 7 !== 0) padded.push(null)

  const weeks: WeekRow[] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }
  return weeks
})

const getMonthLabel = (weekIndex: number): string => {
  const week = grid.value[weekIndex]
  const firstDay = week?.find((d): d is DayCell => d !== null)
  if (!firstDay) return ''
  if (weekIndex === 0) return format(firstDay.date, 'MMM')
  const prevWeek = grid.value[weekIndex - 1]
  const prevFirstDay = prevWeek?.find((d): d is DayCell => d !== null)
  if (prevFirstDay && firstDay.date.getMonth() !== prevFirstDay.date.getMonth()) {
    return format(firstDay.date, 'MMM')
  }
  return ''
}

const getCellColor = (pages: number) => {
  if (pages === 0) return 'bg-muted'
  if (pages <= 20) return 'bg-primary/30'
  if (pages <= 50) return 'bg-primary/55'
  if (pages <= 100) return 'bg-primary/80'
  return 'bg-primary'
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const totalActiveDays = computed(() => activityMap.value.size)
const totalPagesLogged = computed(() =>
  [...activityMap.value.values()].reduce((a, b) => a + b, 0),
)
</script>

<template>
  <div class="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm transition-all duration-300">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold">Reading Activity</h2>
          <!-- 전환 토글 -->
          <div class="flex rounded-lg bg-muted p-1 text-[10px] font-medium">
            <button
              @click="viewMode = '6months'"
              :class="[
                'rounded-[4px] px-2 py-0.5 transition-all',
                viewMode === '6months' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              ]"
            >
              6개월
            </button>
            <button
              @click="viewMode = '1year'"
              :class="[
                'rounded-[4px] px-2 py-0.5 transition-all',
                viewMode === '1year' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              ]"
            >
              1년
            </button>
          </div>
        </div>
        <p class="text-sm text-muted-foreground">일별 독서 기록 — 최근 {{ viewMode === '6months' ? '6개월' : '1년' }}</p>
      </div>
      <div class="text-right text-sm text-muted-foreground">
        <p><span class="font-medium text-foreground">{{ totalActiveDays }}일</span> 활동</p>
        <p><span class="font-medium text-foreground">{{ totalPagesLogged.toLocaleString() }}p</span> 기록</p>
      </div>
    </div>

    <div class="mt-6 overflow-x-auto pb-2 scrollbar-hide">
      <div class="inline-flex gap-[4px]">
        <!-- 요일 레이블 -->
        <div class="mr-1.5 flex flex-col gap-[4px] pt-6">
          <div
            v-for="(day, i) in DAY_LABELS"
            :key="day"
            class="h-[14px] w-7 text-right text-[10px] leading-[14px] text-muted-foreground/60"
          >
            {{ i % 2 === 1 ? day : '' }}
          </div>
        </div>

        <!-- 주 열 -->
        <div v-for="(week, wi) in grid" :key="wi" class="flex flex-col gap-[4px]">
          <!-- 월 레이블 -->
          <div class="h-6 text-[10px] font-medium leading-6 text-muted-foreground/80">
            {{ getMonthLabel(wi) }}
          </div>
          <!-- 7일 셀 -->
          <template v-for="(day, di) in week" :key="di">
            <div
              v-if="day"
              :title="`${day.dateKey}: ${day.pages}p 읽음`"
              :class="[
                'h-[14px] w-[14px] rounded-[3px] transition-all hover:scale-110 hover:ring-2 hover:ring-primary/20',
                getCellColor(day.pages),
              ]"
            />
            <div v-else class="h-[14px] w-[14px]" />
          </template>
        </div>
      </div>
    </div>

    <!-- 범례 개선 -->
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
        <span>Less</span>
        <div class="h-[12px] w-[12px] rounded-[2px] bg-muted" />
        <div class="h-[12px] w-[12px] rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
