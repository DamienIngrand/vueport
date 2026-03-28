import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Vueport } from './core'
import { DEFAULT_BREAKPOINTS } from './types'
import type { Breakpoint, VueportOptions } from './types'

export const useVueportStore = defineStore('vueport', () => {
  let viewport: Vueport | null = null

  const breakpoint = ref<Breakpoint>('')

  function init(options: VueportOptions = {}): void {
    if (viewport) return

    viewport = new Vueport({
      breakpoints: options.breakpoints ?? DEFAULT_BREAKPOINTS,
      ...options,
    })

    breakpoint.value = viewport.current

    viewport.onChange((current) => {
      breakpoint.value = current
    })
  }

  function is(expression: string): boolean {
    if (!viewport) {
      throw new Error('[vueport] Store not initialized. Call init() first.')
    }
    // Access breakpoint.value for reactivity
    breakpoint.value
    return viewport.is(expression)
  }

  const isMobile = computed(() => {
    breakpoint.value
    return viewport?.isMobile ?? false
  })

  const isTablet = computed(() => {
    breakpoint.value
    return viewport?.isTablet ?? false
  })

  const isDesktop = computed(() => {
    breakpoint.value
    return viewport?.isDesktop ?? false
  })

  return {
    breakpoint,
    init,
    is,
    isMobile,
    isTablet,
    isDesktop,
  }
})
