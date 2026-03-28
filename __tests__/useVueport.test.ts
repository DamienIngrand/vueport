import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick, effectScope } from 'vue'
import { useVueport } from '../src/useVueport'

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

// Reset the shared viewport singleton between tests
async function resetSharedViewport() {
  const mod = await import('../src/useVueport')
  // @ts-expect-error accessing module-level variable for testing
  mod.__test_reset?.()
}

describe('useVueport', () => {
  beforeEach(async () => {
    // Force re-import to reset singleton
    vi.resetModules()
  })

  it('returns the current breakpoint as a ref', async () => {
    mockMatchMedia('lg')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { breakpoint } = freshUseVueport()
      expect(breakpoint.value).toBe('lg')
    })
    scope.stop()
  })

  it('is() returns a computed ref', async () => {
    mockMatchMedia('md')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { is } = freshUseVueport()
      expect(is('md').value).toBe(true)
      expect(is('>=sm').value).toBe(true)
      expect(is('xl').value).toBe(false)
      expect(is('>md').value).toBe(false)
      expect(is('<lg').value).toBe(true)
    })
    scope.stop()
  })

  it('isMobile is true for xs', async () => {
    mockMatchMedia('xs')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { isMobile } = freshUseVueport()
      expect(isMobile.value).toBe(true)
    })
    scope.stop()
  })

  it('isMobile is true for sm', async () => {
    mockMatchMedia('sm')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { isMobile } = freshUseVueport()
      expect(isMobile.value).toBe(true)
    })
    scope.stop()
  })

  it('isMobile is false for lg', async () => {
    mockMatchMedia('lg')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { isMobile } = freshUseVueport()
      expect(isMobile.value).toBe(false)
    })
    scope.stop()
  })

  it('isTablet is true for md', async () => {
    mockMatchMedia('md')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { isTablet } = freshUseVueport()
      expect(isTablet.value).toBe(true)
    })
    scope.stop()
  })

  it('isDesktop is true for lg', async () => {
    mockMatchMedia('lg')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { isDesktop } = freshUseVueport()
      expect(isDesktop.value).toBe(true)
    })
    scope.stop()
  })

  it('isDesktop is true for xl', async () => {
    mockMatchMedia('xl')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(() => {
      const { isDesktop } = freshUseVueport()
      expect(isDesktop.value).toBe(true)
    })
    scope.stop()
  })

  it('updates reactively on breakpoint change', async () => {
    const mock = mockMatchMedia('sm')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(async () => {
      const { breakpoint, isMobile, isDesktop } = freshUseVueport()

      expect(breakpoint.value).toBe('sm')
      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)

      mock.simulateChange('xl')
      await nextTick()

      expect(breakpoint.value).toBe('xl')
      expect(isMobile.value).toBe(false)
      expect(isDesktop.value).toBe(true)
    })
    scope.stop()
  })

  it('is() computed updates on change', async () => {
    const mock = mockMatchMedia('xs')
    const { useVueport: freshUseVueport } = await import('../src/useVueport')

    const scope = effectScope()
    scope.run(async () => {
      const { is } = freshUseVueport()
      const isLarge = is('>=lg')

      expect(isLarge.value).toBe(false)

      mock.simulateChange('xl')
      await nextTick()

      expect(isLarge.value).toBe(true)
    })
    scope.stop()
  })
})
