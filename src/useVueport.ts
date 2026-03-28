import { ref, computed, onScopeDispose, type Ref, type ComputedRef } from 'vue'
import { Viewport } from './core'
import { DEFAULT_BREAKPOINTS } from './types'
import type { Breakpoint, ViewportOptions } from './types'

let sharedViewport: Viewport | null = null

interface UseViewportReturn {
  breakpoint: Ref<Breakpoint>
  is: (expression: string) => ComputedRef<boolean>
  isMobile: ComputedRef<boolean>
  isTablet: ComputedRef<boolean>
  isDesktop: ComputedRef<boolean>
}

export function useVueport(options: ViewportOptions = {}): UseViewportReturn {
  if (!sharedViewport) {
    sharedViewport = new Viewport({
      breakpoints: options.breakpoints ?? DEFAULT_BREAKPOINTS,
      ...options,
    })
  }

  const viewport = sharedViewport
  const breakpoint = ref<Breakpoint>(viewport.current)

  const unsubscribe = viewport.onChange((current) => {
    breakpoint.value = current
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  const is = (expression: string): ComputedRef<boolean> => {
    return computed(() => {
      // Access breakpoint.value to create reactivity dependency
      breakpoint.value
      return viewport.is(expression)
    })
  }

  const isMobile = computed(() => {
    breakpoint.value
    return viewport.isMobile
  })

  const isTablet = computed(() => {
    breakpoint.value
    return viewport.isTablet
  })

  const isDesktop = computed(() => {
    breakpoint.value
    return viewport.isDesktop
  })

  return {
    breakpoint,
    is,
    isMobile,
    isTablet,
    isDesktop,
  }
}
