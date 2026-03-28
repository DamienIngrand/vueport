export type Breakpoint = string

export type Operator = '>' | '<' | '>=' | '<=' | '!=' | '=='

export interface BreakpointConfig {
  [key: string]: number
}

export interface ViewportOptions {
  breakpoints?: BreakpointConfig
  debounce?: number
}

export interface ViewportState {
  current: Breakpoint
  is: (expression: string) => boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
}
