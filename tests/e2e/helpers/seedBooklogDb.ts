import type { Page } from '@playwright/test'

interface SeedData {
  books: unknown[]
  theme: 'light' | 'dark'
}

export async function seedBooklogDb(page: Page, seed: SeedData): Promise<void> {
  // Navigate to app first so the DB schema is initialized by Dexie
  await page.goto('/')
  await page.waitForFunction(() => document.readyState === 'complete')

  await page.evaluate(async ({ books, theme }) => {
    await new Promise<void>((resolve, reject) => {
      // No version specified — opens at current version (Dexie uses version×10 internally)
      const open = indexedDB.open('booklog')

      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result
        const tx = db.transaction(['books', 'settings'], 'readwrite')
        const bookStore = tx.objectStore('books')
        const settingsStore = tx.objectStore('settings')

        bookStore.clear()
        settingsStore.clear()

        for (const book of books) {
          bookStore.put(book)
        }
        settingsStore.put({ key: 'theme', value: theme })
        settingsStore.put({ key: 'migrationVersion', value: '1' })

        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
    })
  }, { books: seed.books, theme: seed.theme })
}
