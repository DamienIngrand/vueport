import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

function mockMatchMedia(matchBreakpoint: string) {
  const listeners = new Map<string, (e: { matches: boolean }) => void>()

  const queries: Record<string, string> = {
    xs: '(max-width: 575.98px)',
    sm: '(min-width: 576px) and (max-width: 767.98px)',
    md: '(min-width: 768px) and (max-width: 991.98px)',
    lg: '(min-width: 992px) and (max-width: 1199.98px)',
    xl: '(min-width: 1200px)',
  }

  window.matchMedia = vi.fn((query: string) => {
    const name = Object.entries(queries).find(([, q]) => q === query)?.[0] ?? query
    const matches = name === matchBreakpoint

    const mql = {
      matches,
      media: query,
      addEventListener: vi.fn((event: string, fn: (e: { matches: boolean }) => void) => {
        if (event === 'change') {
          listeners.set(query, fn)
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    return mql
  })

  return {
    simulateChange(newBreakpoint: string) {
      listeners.forEach((fn, query) => {
        const name = Object.entries(queries).find(([, q]) => q === query)?.[0]
        fn({ matches: name === newBreakpoint })
      })
    },
  }
}

describe('useVueportStore', () => {
  beforeEach(() => {
    vi.resetModules()
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('initializes with current breakpoint', async () => {
    mockMatchMedia('lg')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()

    expect(store.breakpoint).toBe('lg')
  })

  it('is() works after init', async () => {
    mockMatchMedia('md')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()

    expect(store.is('md')).toBe(true)
    expect(store.is('>=sm')).toBe(true)
    expect(store.is('xl')).toBe(false)
  })

  it('throws if is() called before init', async () => {
    mockMatchMedia('md')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()

    expect(() => store.is('md')).toThrow('[vueport] Store not initialized')
  })

  it('isMobile is reactive', async () => {
    mockMatchMedia('xs')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()

    expect(store.isMobile).toBe(true)
    expect(store.isDesktop).toBe(false)
  })

  it('isTablet for md', async () => {
    mockMatchMedia('md')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()

    expect(store.isTablet).toBe(true)
  })

  it('isDesktop for xl', async () => {
    mockMatchMedia('xl')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()

    expect(store.isDesktop).toBe(true)
    expect(store.isMobile).toBe(false)
  })

  it('updates on breakpoint change', async () => {
    const mock = mockMatchMedia('sm')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()

    expect(store.breakpoint).toBe('sm')
    expect(store.isMobile).toBe(true)

    mock.simulateChange('lg')
    await nextTick()

    expect(store.breakpoint).toBe('lg')
    expect(store.isDesktop).toBe(true)
    expect(store.isMobile).toBe(false)
  })

  it('init is idempotent', async () => {
    mockMatchMedia('md')
    const { useVueportStore } = await import('../src/pinia')
    const store = useVueportStore()
    store.init()
    store.init() // should not throw or reinitialize

    expect(store.breakpoint).toBe('md')
  })
})
