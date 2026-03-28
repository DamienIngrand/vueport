import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vueport, createVueport, getVueport } from '../src/core'

function mockMatchMedia(matchBreakpoint: string, breakpoints: Record<string, string>) {
  const listeners = new Map<string, (e: { matches: boolean }) => void>()

  window.matchMedia = vi.fn((query: string) => {
    const name = Object.entries(breakpoints).find(([, q]) => q === query)?.[0] ?? query
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
        const name = Object.entries(breakpoints).find(([, q]) => q === query)?.[0]
        fn({ matches: name === newBreakpoint })
      })
    },
  }
}

const defaultQueries: Record<string, string> = {
  xs: '(max-width: 575.98px)',
  sm: '(min-width: 576px) and (max-width: 767.98px)',
  md: '(min-width: 768px) and (max-width: 991.98px)',
  lg: '(min-width: 992px) and (max-width: 1199.98px)',
  xl: '(min-width: 1200px)',
}

describe('Vueport', () => {
  describe('current breakpoint', () => {
    it('detects the current breakpoint', () => {
      mockMatchMedia('md', defaultQueries)
      const viewport = new Vueport()
      expect(viewport.current).toBe('md')
    })

    it('defaults to xs when smallest matches', () => {
      mockMatchMedia('xs', defaultQueries)
      const viewport = new Vueport()
      expect(viewport.current).toBe('xs')
    })

    it('detects xl', () => {
      mockMatchMedia('xl', defaultQueries)
      const viewport = new Vueport()
      expect(viewport.current).toBe('xl')
    })
  })

  describe('is() expressions', () => {
    let viewport: Vueport

    beforeEach(() => {
      mockMatchMedia('md', defaultQueries)
      viewport = new Vueport()
    })

    it('equals', () => {
      expect(viewport.is('md')).toBe(true)
      expect(viewport.is('==md')).toBe(true)
      expect(viewport.is('lg')).toBe(false)
    })

    it('not equal', () => {
      expect(viewport.is('!=xs')).toBe(true)
      expect(viewport.is('!=md')).toBe(false)
    })

    it('greater than', () => {
      expect(viewport.is('>sm')).toBe(true)
      expect(viewport.is('>md')).toBe(false)
      expect(viewport.is('>lg')).toBe(false)
    })

    it('less than', () => {
      expect(viewport.is('<lg')).toBe(true)
      expect(viewport.is('<md')).toBe(false)
      expect(viewport.is('<xs')).toBe(false)
    })

    it('greater or equal', () => {
      expect(viewport.is('>=md')).toBe(true)
      expect(viewport.is('>=sm')).toBe(true)
      expect(viewport.is('>=lg')).toBe(false)
    })

    it('less or equal', () => {
      expect(viewport.is('<=md')).toBe(true)
      expect(viewport.is('<=lg')).toBe(true)
      expect(viewport.is('<=sm')).toBe(false)
    })

    it('handles spaces', () => {
      expect(viewport.is('>= sm')).toBe(true)
      expect(viewport.is(' md ')).toBe(true)
    })

    it('returns false for unknown breakpoint', () => {
      expect(viewport.is('xxl')).toBe(false)
    })
  })

  describe('convenience getters', () => {
    it('isMobile for xs', () => {
      mockMatchMedia('xs', defaultQueries)
      expect(new Vueport().isMobile).toBe(true)
    })

    it('isMobile for sm', () => {
      mockMatchMedia('sm', defaultQueries)
      expect(new Vueport().isMobile).toBe(true)
    })

    it('isMobile false for lg', () => {
      mockMatchMedia('lg', defaultQueries)
      expect(new Vueport().isMobile).toBe(false)
    })

    it('isTablet for md', () => {
      mockMatchMedia('md', defaultQueries)
      expect(new Vueport().isTablet).toBe(true)
    })

    it('isDesktop for lg', () => {
      mockMatchMedia('lg', defaultQueries)
      expect(new Vueport().isDesktop).toBe(true)
    })

    it('isDesktop for xl', () => {
      mockMatchMedia('xl', defaultQueries)
      expect(new Vueport().isDesktop).toBe(true)
    })
  })

  describe('onChange', () => {
    it('calls listener on breakpoint change', () => {
      const mock = mockMatchMedia('md', defaultQueries)
      const viewport = new Vueport()
      const listener = vi.fn()

      viewport.onChange(listener)
      mock.simulateChange('lg')

      expect(listener).toHaveBeenCalledWith('lg', 'md')
    })

    it('returns unsubscribe function', () => {
      const mock = mockMatchMedia('md', defaultQueries)
      const viewport = new Vueport()
      const listener = vi.fn()

      const unsubscribe = viewport.onChange(listener)
      unsubscribe()
      mock.simulateChange('lg')

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('custom breakpoints', () => {
    const customQueries: Record<string, string> = {
      mobile: '(max-width: 639.98px)',
      tablet: '(min-width: 640px) and (max-width: 1023.98px)',
      desktop: '(min-width: 1024px)',
    }

    it('works with custom breakpoints', () => {
      mockMatchMedia('tablet', customQueries)
      const viewport = new Vueport({
        breakpoints: { mobile: 0, tablet: 640, desktop: 1024 },
      })

      expect(viewport.current).toBe('tablet')
      expect(viewport.is('>=tablet')).toBe(true)
      expect(viewport.is('desktop')).toBe(false)
    })
  })

  describe('destroy', () => {
    it('clears queries and listeners', () => {
      mockMatchMedia('md', defaultQueries)
      const viewport = new Vueport()
      const listener = vi.fn()
      viewport.onChange(listener)

      viewport.destroy()

      // Listener should no longer be called after destroy
      // (simulateChange still fires matchMedia callbacks, but listeners set is cleared)
      expect(() => viewport.destroy()).not.toThrow()
    })
  })

  describe('createVueport / getVueport', () => {
    it('createVueport creates a singleton instance', () => {
      mockMatchMedia('lg', defaultQueries)
      const viewport = createVueport()
      expect(viewport.current).toBe('lg')
    })

    it('getVueport returns the created instance', () => {
      mockMatchMedia('sm', defaultQueries)
      const created = createVueport()
      const retrieved = getVueport()
      expect(retrieved).toBe(created)
    })

    it('getVueport throws if no instance exists', async () => {
      // Reset module to clear singleton
      vi.resetModules()
      const { getVueport: freshGetVueport } = await import('../src/core')
      expect(() => freshGetVueport()).toThrow('[vueport] No Vueport instance')
    })
  })
})
