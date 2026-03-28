# vueport

[![CI](https://github.com/DamienIngrand/vueport/actions/workflows/ci.yml/badge.svg)](https://github.com/DamienIngrand/vueport/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/DamienIngrand/vueport/graph/badge.svg)](https://codecov.io/gh/DamienIngrand/vueport)
[![npm version](https://img.shields.io/npm/v/vueport.svg)](https://www.npmjs.com/package/vueport)
[![license](https://img.shields.io/github/license/DamienIngrand/vueport.svg)](https://github.com/DamienIngrand/vueport/blob/main/LICENSE)

Reactive viewport breakpoint detection for Vue 3 and vanilla JS. Uses `window.matchMedia` for reliable, performant breakpoint tracking with zero DOM injection.

## Install

```bash
npm install vueport
# or
yarn add vueport
```

## Usage

### Vue 3 Composable

```vue
<script setup>
import { useVueport } from 'vueport'

const { breakpoint, is, isMobile, isDesktop } = useVueport()

const isLarge = is('>=lg')
</script>

<template>
  <p>Current: {{ breakpoint }}</p>
  <nav v-if="isDesktop">Desktop nav</nav>
  <nav v-else>Mobile nav</nav>
  <aside v-if="isLarge.value">Sidebar</aside>
</template>
```

### Pinia Store

```ts
import { useViewportStore } from 'vueport/pinia'

const viewport = useViewportStore()
viewport.init()

// Reactive in templates and computed
viewport.breakpoint  // 'lg'
viewport.is('>=md')  // true
viewport.isMobile    // false
```

### Vanilla JS

```ts
import { createViewport } from 'vueport/core'

const viewport = createViewport()

viewport.current    // 'lg'
viewport.is('>=md') // true
viewport.isMobile   // true

viewport.onChange((current, previous) => {
  console.log(`${previous} → ${current}`)
})
```

## Expression Syntax

The `is()` method accepts an intuitive expression syntax:

| Expression | Meaning |
|---|---|
| `'md'` or `'==md'` | Exactly md |
| `'>sm'` | Greater than sm |
| `'<lg'` | Less than lg |
| `'>=md'` | Greater than or equal to md |
| `'<=sm'` | Less than or equal to sm |
| `'!=xs'` | Not xs |

## Custom Breakpoints

```ts
import { useVueport } from 'vueport'

const { breakpoint } = useVueport({
  breakpoints: {
    mobile: 0,
    tablet: 640,
    desktop: 1024,
    wide: 1440,
  },
})
```

## Default Breakpoints

| Name | Min width |
|---|---|
| `xs` | 0px |
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |

## API

### `useVueport(options?)`

Vue 3 composable. Returns:

- `breakpoint` — `Ref<string>` current breakpoint
- `is(expr)` — `ComputedRef<boolean>` reactive expression check
- `isMobile` — `ComputedRef<boolean>` (xs or sm)
- `isTablet` — `ComputedRef<boolean>` (md)
- `isDesktop` — `ComputedRef<boolean>` (lg or xl)

### `useViewportStore()` (from `vueport/pinia`)

Pinia store. Call `init(options?)` before use. Same reactive properties.

### `createViewport(options?)` (from `vueport/core`)

Vanilla JS. Returns a `Viewport` instance:

- `current` — current breakpoint name
- `is(expr)` — boolean expression check
- `isMobile` / `isTablet` / `isDesktop` — boolean getters
- `onChange(fn)` — subscribe to changes, returns unsubscribe function
- `destroy()` — cleanup all listeners

## License

MIT
