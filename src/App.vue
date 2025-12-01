<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { BookOpen, LayoutDashboard, Library } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-16 items-center justify-between px-4 md:px-8">
        <div class="flex items-center gap-2">
          <BookOpen class="h-6 w-6 text-primary" />
          <span class="text-lg font-bold tracking-tight">BookLog</span>
        </div>
        <nav class="flex items-center gap-6 text-sm font-medium">
          <RouterLink to="/" class="transition-colors hover:text-foreground/80 text-foreground/60" active-class="!text-foreground">
            <div class="flex items-center gap-2">
              <LayoutDashboard class="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </RouterLink>
          <RouterLink to="/books" class="transition-colors hover:text-foreground/80 text-foreground/60" active-class="!text-foreground">
            <div class="flex items-center gap-2">
              <Library class="h-4 w-4" />
              <span>Library</span>
            </div>
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="container py-8 px-4 md:px-8">
      <RouterView />
    </main>
  </div>
</template>
