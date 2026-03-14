import { expect, test } from '@playwright/test'

const seedBooks = [
  {
    id: 'book-1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    totalPages: 464,
    currentPage: 464,
    status: 'READ',
    rating: 5,
    review: 'A classic on maintainable code.',
    logs: [],
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'book-2',
    title: 'Refactoring',
    author: 'Martin Fowler',
    totalPages: 418,
    currentPage: 210,
    status: 'READING',
    startDate: '2026-02-01T09:00:00.000Z',
    logs: [
      {
        id: 'log-1',
        date: '2026-02-10T09:00:00.000Z',
        startPage: 1,
        endPage: 120,
        content: 'Strong first half.',
      },
    ],
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'book-3',
    title: 'Atomic Habits',
    author: 'James Clear',
    totalPages: 320,
    currentPage: 0,
    status: 'TO_READ',
    logs: [],
    createdAt: '2026-03-01T09:00:00.000Z',
  },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript((books) => {
    if (!window.localStorage.getItem('booklog-books')) {
      window.localStorage.setItem('booklog-books', JSON.stringify(books))
    }
    if (!window.localStorage.getItem('booklog-theme')) {
      window.localStorage.setItem('booklog-theme', 'light')
    }
  }, seedBooks)
})

test('adds a new book from the library form', async ({ page }) => {
  await page.goto('/books')

  await page.getByRole('button', { name: 'Add Book' }).click()
  await page.getByPlaceholder('Book Title').fill('Domain-Driven Design')
  await page.getByPlaceholder('Author Name').fill('Eric Evans')
  await page.getByPlaceholder('Total Pages').fill('560')
  await page.getByPlaceholder('https://example.com/cover.jpg').fill('https://example.com/ddd.jpg')
  await page.getByRole('button', { name: 'Save Book' }).click()

  await expect(page.getByText('Domain-Driven Design')).toBeVisible()
  await expect(page.getByText('Eric Evans')).toBeVisible()
})

test('filters and sorts books in the library', async ({ page }) => {
  await page.goto('/books')

  await page.getByPlaceholder('Search books...').fill('Martin')
  await page.locator('select').nth(0).selectOption('READING')
  await page.getByLabel('Sort books').selectOption('TITLE_ASC')

  await expect(page.getByText('Refactoring')).toBeVisible()
  await expect(page.getByText('Clean Code')).not.toBeVisible()
  await expect(page.getByText('Atomic Habits')).not.toBeVisible()
})

test('saves review, adds reading log, and persists dark mode', async ({ page }) => {
  await page.goto('/books/book-2')

  await page.getByRole('button', { name: 'Rate 4 stars' }).click()
  await page.locator('#review').fill('Useful examples and still very practical.')
  await page.getByRole('button', { name: 'Save review' }).click()
  await expect(page.getByText('리뷰와 별점을 저장했습니다.')).toBeVisible()

  await page.getByRole('button', { name: 'Add Log' }).click()
  await page.locator('input[type="number"]').nth(0).fill('211')
  await page.locator('input[type="number"]').nth(1).fill('240')
  await page.getByPlaceholder('What stood out today?').fill('The chapter on long methods was especially clear.')
  await page.getByRole('button', { name: 'Save Log' }).click()
  await expect(page.getByText('The chapter on long methods was especially clear.')).toBeVisible()

  await page.getByRole('button', { name: '라이트 모드 켜짐' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
