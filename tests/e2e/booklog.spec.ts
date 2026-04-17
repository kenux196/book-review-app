import { expect, test } from '@playwright/test'
import { seedBooklogDb } from './helpers/seedBooklogDb'

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
    tags: [],
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
    tags: [],
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
    tags: [],
    logs: [],
    createdAt: '2026-03-01T09:00:00.000Z',
  },
]

test.beforeEach(async ({ page }) => {
  await seedBooklogDb(page, { books: seedBooks, theme: 'light' })
})

// ── 기존 시나리오 ──────────────────────────────────────────────

test('adds a new book from the library form', async ({ page }) => {
  await page.goto('/books')

  await page.getByRole('button', { name: '책 추가' }).click()
  await page.getByRole('textbox', { name: '제목' }).fill('Domain-Driven Design')
  await page.getByRole('textbox', { name: '저자' }).fill('Eric Evans')
  await page.getByRole('spinbutton', { name: '전체 페이지' }).fill('560')
  await page.getByLabel('초기 상태').selectOption('READING')
  await page.getByPlaceholder('현재 페이지').fill('128')
  await page.getByPlaceholder('https://example.com/cover.jpg').fill('https://example.com/ddd.jpg')
  await page.getByRole('button', { name: '저장' }).click()

  const newBookCard = page.getByRole('link', { name: /Domain-Driven Design/ })
  await expect(newBookCard).toBeVisible()
  await expect(newBookCard.getByText('Domain-Driven Design')).toBeVisible()
  await expect(newBookCard.getByText('Eric Evans')).toBeVisible()
  await expect(newBookCard.getByText('읽는 중')).toBeVisible()
  await expect(newBookCard.getByText('23%')).toBeVisible()
})

test('filters and sorts books in the library', async ({ page }) => {
  await page.goto('/books')

  await page.getByPlaceholder('책 제목, 저자, 태그 검색').fill('Martin')
  await page.locator('select').nth(0).selectOption('READING')
  await page.getByTestId('book-sort-select').selectOption('TITLE_ASC')

  await expect(page.getByRole('link', { name: /Refactoring/ })).toBeVisible()
  await expect(page.getByText('Clean Code')).not.toBeVisible()
  await expect(page.getByText('Atomic Habits')).not.toBeVisible()
})

test('saves review, adds reading log, and persists dark mode', async ({ page }) => {
  await page.goto('/books/book-2')

  await page.getByRole('button', { name: 'Rate 4 stars' }).click()
  await page.locator('#review').fill('Useful examples and still very practical.')
  await page.getByRole('button', { name: 'Save review' }).click()
  await expect(page.getByText('리뷰와 별점을 저장했습니다.')).toBeVisible()

  await page.getByRole('button', { name: '로그 추가' }).click()
  await page.locator('input[type="date"]').fill('2026-02-14')
  await page.locator('input[type="number"]').nth(0).fill('211')
  await page.locator('input[type="number"]').nth(1).fill('240')
  await page.getByPlaceholder('오늘 인상 깊었던 내용을 남겨보세요.').fill('The chapter on long methods was especially clear.')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('The chapter on long methods was especially clear.')).toBeVisible()
  await expect(page.getByText('2026. 2. 14.')).toBeVisible()

  await page.getByRole('button', { name: '라이트 모드 켜짐' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  // Wait for async IndexedDB save to complete before reload
  await page.waitForTimeout(300)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

// ── 신규 시나리오 ──────────────────────────────────────────────

test('deletes a book and redirects to library', async ({ page }) => {
  await page.goto('/books/book-3')

  await page.getByRole('button', { name: 'Delete book' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()

  await expect(page.getByText('삭제 취소')).toBeVisible()
  await page.getByRole('button', { name: '서재로 이동' }).click()
  await expect(page).toHaveURL('/books')
  await expect(page.getByText('Atomic Habits')).not.toBeVisible()
})

test('adds and removes a tag on a book', async ({ page }) => {
  await page.goto('/books/book-1')

  await page.getByPlaceholder('태그 입력 후 Enter').fill('클린코드')
  await page.getByPlaceholder('태그 입력 후 Enter').press('Enter')
  await expect(page.getByText('클린코드')).toBeVisible()

  await page.getByRole('button', { name: 'Remove tag 클린코드' }).click()
  await expect(page.getByText('클린코드')).not.toBeVisible()
})

test('tags are searchable in the library', async ({ page }) => {
  await page.goto('/books/book-1')
  await page.getByPlaceholder('태그 입력 후 Enter').fill('개발')
  await page.getByPlaceholder('태그 입력 후 Enter').press('Enter')
  await page.waitForTimeout(300)

  await page.goto('/books')
  await page.getByPlaceholder('책 제목, 저자, 태그 검색').fill('개발')
  await expect(page.getByRole('link', { name: /Clean Code/ })).toBeVisible()
  await expect(page.getByText('Refactoring')).not.toBeVisible()
})

test('shows error when adding book with empty title', async ({ page }) => {
  await page.goto('/books')

  await page.getByRole('button', { name: '책 추가' }).click()
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.getByText('책 제목을 입력해 주세요.')).toBeVisible()
})

test('shows error for reading log exceeding total pages', async ({ page }) => {
  await page.goto('/books/book-2')

  await page.getByRole('button', { name: '로그 추가' }).click()
  await page.locator('input[type="number"]').nth(0).fill('400')
  await page.locator('input[type="number"]').nth(1).fill('500')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.getByText('종료 페이지는 전체 페이지 수를 넘을 수 없습니다.')).toBeVisible()
})

test('persists new book after page reload', async ({ page }) => {
  await page.goto('/books')

  await page.getByRole('button', { name: '책 추가' }).click()
  await page.getByRole('textbox', { name: '제목' }).fill('The Pragmatic Programmer')
  await page.getByPlaceholder('저자명').fill('David Thomas')
  await page.getByPlaceholder('전체 페이지 수').fill('352')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByRole('link', { name: /The Pragmatic Programmer/ })).toBeVisible()

  // Wait for async IndexedDB save to complete before reload
  await page.waitForTimeout(300)
  await page.reload()
  await expect(page.getByRole('link', { name: /The Pragmatic Programmer/ })).toBeVisible()
})

test('dashboard shows currently reading book', async ({ page }) => {
  await page.goto('/')

  const readingNowCard = page.locator('article').filter({ hasText: '지금 읽는 책' })
  await expect(readingNowCard.getByText('1')).toBeVisible()
  await expect(page.getByRole('link', { name: /Refactoring/ })).toBeVisible()
})

test('changes book status and persists after reload', async ({ page }) => {
  await page.goto('/books/book-3')

  await page.locator('select').first().selectOption('READING')

  await page.reload()
  await expect(page.locator('select').first()).toHaveValue('READING')
})

test('edits book metadata and persists after reload', async ({ page }) => {
  await page.goto('/books/book-2')

  await page.getByRole('button', { name: 'Edit book' }).click()
  await page.getByPlaceholder('책 제목').fill('Refactoring (Updated)')
  await page.getByPlaceholder('저자').fill('Martin Fowler (2nd)')
  await page.locator('input[type="number"]').nth(1).fill('123')
  await page.locator('input[type="date"]').nth(0).fill('2026-01-15')
  await page.locator('input[type="date"]').nth(1).fill('2026-02-20')
  await page.getByRole('button', { name: '저장', exact: true }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Refactoring (Updated)')
  await expect(page.getByText('Martin Fowler (2nd)')).toBeVisible()
  await expect(page.getByText('123 / 418 페이지')).toBeVisible()
  await expect(page.getByText('2026. 1. 15.')).toBeVisible()
  await expect(page.getByText('2026. 2. 20.')).toBeVisible()

  await page.waitForTimeout(300)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Refactoring (Updated)')
  await expect(page.getByText('123 / 418 페이지')).toBeVisible()
  await expect(page.getByText('2026. 1. 15.')).toBeVisible()
  await expect(page.getByText('2026. 2. 20.')).toBeVisible()
})

test('updates current page directly without creating a log', async ({ page }) => {
  await page.goto('/books/book-3')

  await page.getByRole('button', { name: '페이지 수정' }).click()
  await page.locator('input[max="320"]').fill('55')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.getByText('55 / 320 페이지')).toBeVisible()
  await expect(page.getByText('아직 기록된 독서 로그가 없습니다.')).toBeVisible()

  await page.waitForTimeout(300)
  await page.reload()
  await expect(page.getByText('55 / 320 페이지')).toBeVisible()
  await expect(page.locator('select').first()).toHaveValue('READING')
})
