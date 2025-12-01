import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

/**
 * 테스트용 Pinia 스토어 설정
 */
export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * localStorage Mock 설정
 */
export function setupLocalStorageMock() {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString()
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  return localStorageMock
}

/**
 * 각 테스트 전에 localStorage 초기화
 */
export function clearLocalStorage() {
  localStorage.clear()
}
