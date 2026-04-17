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

  return bookStore.theme === 'dark' ? '다크 모드 켜짐' : '라이트 모드 켜짐'
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
  <div class="app-shell min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b border-white/8 bg-background/78 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-3">
          <RouterLink to="/" class="flex items-center gap-3">
            <div
              class="surface-stripe flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-white"
              style="box-shadow: 0 0 0 1px rgba(27, 28, 30, 1), inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 18px 36px rgba(0, 0, 0, 0.28);"
            >
              <BookOpen class="h-5 w-5" />
            </div>
            <div>
              <p class="text-lg font-semibold tracking-[0.02em]">BookLog</p>
              <p class="text-sm text-muted-foreground">독서 흐름을 기록하는 개인 서재</p>
            </div>
          </RouterLink>

          <button
            type="button"
            class="action-pill-secondary h-11 px-4"
            :aria-label="themeLabel"
            @click="toggleTheme"
          >
            <Laptop v-if="bookStore.theme === 'system'" class="h-4 w-4" />
            <Sun v-else-if="bookStore.theme === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
            <span>{{ themeButtonText }}</span>
          </button>
        </div>

        <nav class="grid grid-cols-2 gap-2 rounded-full border border-white/8 bg-white/[0.03] p-1.5 sm:inline-flex sm:w-fit">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium tracking-[0.02em] text-muted-foreground transition hover:text-foreground"
            :class="route.path === item.to ? 'bg-white/[0.06] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.08)]' : ''"
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
