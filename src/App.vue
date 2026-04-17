<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { BookOpen, Laptop, LayoutDashboard, Library, Moon, Sun } from 'lucide-vue-next'
import { useBookStore } from './stores/book'

const route = useRoute()
const bookStore = useBookStore()

const navItems = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/books', label: '내 서재', icon: Library },
]

const themeLabel = computed(() => {
  if (bookStore.theme === 'system') {
    return `시스템 테마 사용 중 (${bookStore.resolvedTheme === 'dark' ? '다크' : '라이트'})`
  }

  return bookStore.theme === 'dark' ? '다크 모드 사용 중' : '라이트 모드 사용 중'
})

const themeButtonText = computed(() => {
  if (bookStore.theme === 'system') return '시스템'
  return bookStore.theme === 'dark' ? '다크' : '라이트'
})

const toggleTheme = () => {
  bookStore.cycleTheme()
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="absolute inset-x-0 top-0 -z-10 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_60%)]" />

    <header class="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-3">
          <RouterLink to="/" class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
              <BookOpen class="h-5 w-5" />
            </div>
            <div>
              <p class="text-lg font-semibold tracking-tight">BookLog</p>
              <p class="text-sm text-muted-foreground">독서 흐름을 기록하는 개인 서재</p>
            </div>
          </RouterLink>

          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
            :aria-label="themeLabel"
            @click="toggleTheme"
          >
            <Laptop v-if="bookStore.theme === 'system'" class="h-4 w-4" />
            <Sun v-else-if="bookStore.theme === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
            <span>{{ themeButtonText }}</span>
          </button>
        </div>

        <nav class="grid grid-cols-2 gap-2 rounded-2xl bg-muted/70 p-1.5 sm:inline-flex sm:w-fit">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            :class="route.path === item.to ? 'bg-background text-foreground shadow-sm' : ''"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <RouterView />
    </main>
  </div>
</template>
