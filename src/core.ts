import { DEFAULT_BREAKPOINTS } from './types'
import type { Breakpoint, BreakpointConfig, Operator, ViewportOptions } from './types'

type Listener = (current: Breakpoint, previous: Breakpoint | null) => void

export class Viewport {
  private breakpoints: BreakpointConfig
  private sortedBreakpoints: [string, number][]
  private queries: Map<string, MediaQueryList> = new Map()
  private listeners: Set<Listener> = new Set()
  private _current: Breakpoint = ''

  constructor(options: ViewportOptions = {}) {
    this.breakpoints = options.breakpoints ?? DEFAULT_BREAKPOINTS
    this.sortedBreakpoints = Object.entries(this.breakpoints).sort((a, b) => a[1] - b[1])
    this.initMediaQueries()
  }

  private initMediaQueries(): void {
    this.sortedBreakpoints.forEach(([name, minWidth], index) => {
      const next = this.sortedBreakpoints[index + 1]
      let query: string

      if (index === 0) {
        query = `(max-width: ${next[1] - 0.02}px)`
      } else if (!next) {
        query = `(min-width: ${minWidth}px)`
      } else {
        query = `(min-width: ${minWidth}px) and (max-width: ${next[1] - 0.02}px)`
      }

      const mql = window.matchMedia(query)
      this.queries.set(name, mql)

      if (mql.matches) {
        this._current = name
      }

      mql.addEventListener('change', (e) => {
        if (e.matches) {
          const previous = this._current
          this._current = name
          this.listeners.forEach((fn) => fn(name, previous))
        }
      })
    })
  }

  get current(): Breakpoint {
    return this._current
  }

  private getIndex(breakpoint: Breakpoint): number {
    return this.sortedBreakpoints.findIndex(([name]) => name === breakpoint)
  }

  private parseExpression(expression: string): { operator: Operator; breakpoint: Breakpoint } {
    const cleaned = expression.replace(/\s/g, '')
    const operators: Operator[] = ['>=', '<=', '!=', '==', '>', '<']

    for (const op of operators) {
      if (cleaned.startsWith(op)) {
        return { operator: op, breakpoint: cleaned.slice(op.length) }
      }
    }

    return { operator: '==', breakpoint: cleaned }
  }

  is(expression: string): boolean {
    const { operator, breakpoint } = this.parseExpression(expression)
    const currentIndex = this.getIndex(this._current)
    const targetIndex = this.getIndex(breakpoint)

    if (currentIndex === -1 || targetIndex === -1) {
      return false
    }

    const comparators: Record<Operator, () => boolean> = {
      '==': () => currentIndex === targetIndex,
      '!=': () => currentIndex !== targetIndex,
      '>': () => currentIndex > targetIndex,
      '<': () => currentIndex < targetIndex,
      '>=': () => currentIndex >= targetIndex,
      '<=': () => currentIndex <= targetIndex,
    }

    return comparators[operator]()
  }

  get isMobile(): boolean {
    return this.is('<=sm')
  }

  get isTablet(): boolean {
    return this.is('md')
  }

  get isDesktop(): boolean {
    return this.is('>=lg')
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  destroy(): void {
    this.queries.clear()
    this.listeners.clear()
  }
}

let instance: Viewport | null = null

export function createViewport(options: ViewportOptions = {}): Viewport {
  instance = new Viewport(options)
  return instance
}

export function getViewport(): Viewport {
  if (!instance) {
    throw new Error('[vueport] No viewport instance. Call createViewport() first.')
  }
  return instance
}
