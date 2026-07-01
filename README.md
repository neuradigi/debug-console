# @neuradigi/debug-console

A framework-agnostic **in-app console overlay**. It mirrors your app's own
`console.log/info/warn/error/debug` (and uncaught errors / unhandled promise
rejections) into a floating debug panel — so you can see logs inside the running
app without opening browser DevTools. DevTools keeps working too; this **mirrors**
output, it never swallows it.

Built as a **Web Component** with **Shadow DOM**, so it drops into **Angular,
React, Vue, Svelte, or plain HTML** with **zero runtime dependencies** and no CSS
conflicts with your app.

- 🔌 One-call setup, or use `<debug-console>` in your own markup
- 🪶 Zero runtime deps, tree-shakeable (ESM + CJS + types)
- 🎯 Captures `console.*` + `window` `error` / `unhandledrejection`
- 🧱 Shadow-DOM isolated: fixed dark "terminal" look, self-contained tooltips
- 🧰 Filter chips, auto-scroll, jump-to-bottom, download `.log`, clear
- 🧠 Bounded buffer (default 500, oldest dropped); safe stringify (circular refs, `bigint`, `Error`)
- 🖥️ SSR-safe (no-ops when there is no DOM)

## Contents

- [Requirements](#requirements)
- [Install](#install)
- [Quick start](#quick-start)
- [Declarative usage](#declarative-usage-render-the-element-yourself)
- [Per-framework notes](#per-framework-notes)
- [Panel controls](#panel-controls)
- [API reference](#api-reference)
- [Configuration options](#configuration-options)
- [Theming (CSS variables & parts)](#theming)
- [Recipes](#recipes)
- [Troubleshooting](#troubleshooting)
- [Develop & run the demo](#develop--run-the-demo)
- [Limitations / out of scope](#limitations--out-of-scope)

## Requirements

- **Runtime:** any evergreen browser (Chrome/Edge, Firefox, Safari). The overlay
  is a native [Web Component](https://developer.mozilla.org/docs/Web/API/Web_components)
  using Shadow DOM and needs no polyfills on modern browsers.
- **Bundler / TypeScript:** none required. The package ships **ESM** (`import`),
  **CommonJS** (`require`), and **TypeScript type declarations**, so it works with
  Vite, webpack, Rollup, esbuild, Angular CLI, Next.js, plain `<script type="module">`,
  and Node-based tooling alike. Built target is **ES2020**.
- **Runtime dependencies:** zero.
- **Server-side rendering:** safe — every entry point no-ops when there is no DOM,
  so it won't throw during SSR/prerender.

## Install

With a bundler or Node toolchain:

```bash
npm install @neuradigi/debug-console
# or: pnpm add @neuradigi/debug-console  /  yarn add @neuradigi/debug-console
```

**No build step? Use a CDN.** For a plain `.html` file with no bundler, import the
ESM build straight from a CDN — no install needed:

```html
<script type="module">
  import { initDebugConsole } from 'https://esm.sh/@neuradigi/debug-console';
  initDebugConsole();
</script>
```

(unpkg / jsDelivr work too, e.g. `https://cdn.jsdelivr.net/npm/@neuradigi/debug-console/+esm`.)

## Quick start

Call `initDebugConsole()` **once, as early as possible** in your app's entry file
so logs are captured from boot:

```ts
import { initDebugConsole } from '@neuradigi/debug-console';

initDebugConsole({
  enabled: process.env.NODE_ENV !== 'production', // master switch; false = never patch console, mount nothing (use to hide in prod)
  max: 500,                    // keep at most this many log lines; oldest are dropped past it
  captureGlobalErrors: true,   // also capture uncaught errors + unhandled promise rejections as error rows
  position: 'top-right',       // which corner the launcher sits in: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  accent: '#22c55e',           // any CSS color/gradient for the launcher, count pill and active filter chips
  open: false                  // false = start collapsed (launcher icon only); true = start expanded
});
```

Every option is optional — pass only the ones you want to change. The full reference,
with types and defaults, is in [Configuration options](#configuration-options).

That's it — a launcher button appears in the corner; click it to open the panel.
See [Configuration options](#configuration-options) for every setting.

## Declarative usage (render the element yourself)

If you'd rather place the element in your own markup instead of auto-mounting:

```ts
import { defineDebugConsole, startCapture } from '@neuradigi/debug-console';

startCapture();        // begin mirroring console.* + errors (no UI)
defineDebugConsole();  // register the <debug-console> custom element
```

```html
<!-- position via the data-position attribute -->
<debug-console data-position="top-right"></debug-console>
```

## Per-framework notes

The rule is the same everywhere: **`import` and call `initDebugConsole()` at the very
top of your app's entry file — before the framework boots** — so even the framework's
own startup logs are captured. Each example below is the *complete* entry file; the only
lines you add are the `import` and the `initDebugConsole(...)` call (highlighted with
comments). No template tag, schema, or registration is required for this path.

### Angular

Put the two lines at the top of `src/main.ts`, before `bootstrapApplication`:

```ts
// src/main.ts
import { initDebugConsole } from '@neuradigi/debug-console';   // 1. import
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

initDebugConsole({ enabled: true });                           // 2. call it FIRST

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
```

Using the older NgModule bootstrap? Same idea:

```ts
// src/main.ts
import { initDebugConsole } from '@neuradigi/debug-console';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

initDebugConsole({ enabled: true });

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

No `CUSTOM_ELEMENTS_SCHEMA` is needed when mounted via `initDebugConsole()`. Only if you
place the `<debug-console>` tag in a component template do you add the schema there:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({ /* ... */, schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AppComponent {}
```

### React

Add the two lines at the top of `src/main.tsx` (or `index.tsx`), before `createRoot`:

```tsx
// src/main.tsx
import { initDebugConsole } from '@neuradigi/debug-console';   // 1. import
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

initDebugConsole({ enabled: true });                           // 2. call it FIRST

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Custom elements work in JSX out of the box. Only if you write `<debug-console />` yourself
in **TypeScript** do you need to declare the tag once (any `.d.ts` or your entry file):

```tsx
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'debug-console': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
        & { 'data-position'?: string };
    }
  }
}
```

### Vue

Add the two lines at the top of `src/main.ts`, before `createApp(...).mount(...)`:

```ts
// src/main.ts
import { initDebugConsole } from '@neuradigi/debug-console';   // 1. import
import { createApp } from 'vue';
import App from './App.vue';

initDebugConsole({ enabled: true });                           // 2. call it FIRST

createApp(App).mount('#app');
```

If you use the `<debug-console>` tag inside a Vue template, tell the compiler it's a
custom element so Vue doesn't warn or try to resolve it as a component:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';

export default {
  plugins: [vue({
    template: { compilerOptions: { isCustomElement: tag => tag === 'debug-console' } }
  })]
};
```

### Svelte / SvelteKit

**Svelte (Vite)** — add the two lines at the top of `src/main.ts`, before `new App(...)`:

```ts
// src/main.ts
import { initDebugConsole } from '@neuradigi/debug-console';   // 1. import
import App from './App.svelte';

initDebugConsole({ enabled: true });                           // 2. call it FIRST

export default new App({ target: document.getElementById('app')! });
```

**SvelteKit** — the app runs on the server too, so call it from the browser only. The
tidiest spot is the root layout's `onMount` (it already no-ops during SSR, but `onMount`
guarantees it runs client-side):

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  onMount(() => import('@neuradigi/debug-console').then(m => m.initDebugConsole()));
</script>

<slot />
```

Svelte passes unknown tags straight through to the DOM, so `<debug-console>` needs no config.

### Plain HTML

With a bundler, import as above. Without one, import from a CDN — this is a complete,
working page:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My app</title>
    <script type="module">
      import { initDebugConsole } from 'https://esm.sh/@neuradigi/debug-console';
      initDebugConsole({ enabled: true });
    </script>
  </head>
  <body>
    <h1>Hello</h1>
    <!-- Use type="module" so this runs AFTER the init above (module scripts run
         in document order, after the page parses) and its logs are captured. -->
    <script type="module">
      console.log('This line appears in the debug console overlay.');
    </script>
  </body>
</html>
```

## Panel controls

What the UI exposes at runtime:

| Control | What it does |
|---|---|
| **Launcher** (corner button) | Opens the panel. While **closed**, shows a count **badge** for errors/warnings (red if any errors, amber if only warnings). Hidden while the panel is open. |
| **Title + count pill** | "Application Logs" with the total number of buffered entries. |
| **Filter chips** | `All / Log / Info / Warn / Error`. `Log` also includes `debug` entries. |
| **Auto-scroll** (pin) | Toggle. When on, the list follows the newest line. Lit when active. |
| **Scroll to bottom** (double chevron) | Jumps to the latest entry (handy when auto-scroll is off). |
| **Download** | Exports the full buffer to `application-logs-YYYYMMDD-HHmmss.log` (one line per entry: `[YYYY-MM-DD HH:mm:ss.SSS] LEVEL message`). Disabled when empty. |
| **Clear** | Empties the buffer. Disabled when empty. |
| **Close** | Collapses the panel back to the launcher. |

Levels are colour-coded: error = red, warn = amber, info = brand/blue, log/debug = muted gray.

## API reference

### `initDebugConsole(options?): DebugConsoleHandle | null`

Starts capturing and mounts the overlay at `document.body`. Idempotent — a second
call reuses the existing overlay instead of stacking another. Returns a
[handle](#debugconsolehandle), or `null` when `enabled: false` or there is no DOM (SSR).

### `startCapture(options?): void`

Begins mirroring `console.*` and capturing global errors **without** mounting any UI
(use with [declarative usage](#declarative-usage-render-the-element-yourself)).
Accepts `{ max?, captureGlobalErrors? }`. Idempotent.

### `defineDebugConsole(name?: string): void`

Registers the custom element (default tag `debug-console`). Idempotent and
browser-only. Pass a name to register under a different tag.

### `ELEMENT_NAME: string`

The default custom-element tag name (`'debug-console'`).

### `logger`

The shared capture core, if you want to read/observe the buffer yourself:

| Member | Type | Description |
|---|---|---|
| `logger.entries` | `readonly LogEntry[]` | Current buffer, oldest → newest. |
| `logger.limit` | `number` | Configured buffer cap. |
| `logger.subscribe(fn)` | `(e: LogEvent) => void` ⇒ `() => void` | Subscribe to changes; returns an unsubscribe fn. |
| `logger.clear()` | `void` | Empty the buffer. |
| `logger.init(opts?)` | `void` | Patch console + error hooks (called for you by `initDebugConsole`/`startCapture`). |

```ts
import { logger } from '@neuradigi/debug-console';
const off = logger.subscribe(e => { if (e.type === 'add') myTelemetry(e.entry); });
// ...later: off();
```

### `DebugConsoleHandle`

Returned by `initDebugConsole()`:

| Member | Description |
|---|---|
| `element` | The mounted `<debug-console>` element. |
| `show()` | Open the panel. |
| `hide()` | Close the panel. |
| `toggle()` | Toggle the panel. |
| `clear()` | Empty the buffer. |
| `destroy()` | Remove the element from the DOM. |

### Types

`DebugConsoleOptions`, `DebugConsoleHandle`, `LauncherPosition`, `LogEntry`,
`LogLevel`, `LogEvent` are all exported.

```ts
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
interface LogEntry { id: number; level: LogLevel; time: Date; text: string; }
```

## Configuration options

Every field of `DebugConsoleOptions` (all optional):

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Master switch. When `false`, the console is **not** patched and nothing is mounted — use it to disable in production. |
| `max` | `number` | `500` | Maximum buffered entries; oldest are dropped past this. |
| `captureGlobalErrors` | `boolean` | `true` | Also capture `window` `error` + `unhandledrejection` as error rows. |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Which corner the launcher pins to. |
| `accent` | `string` | brand gradient | Any CSS color/gradient for the accent (launcher, count pill, active chips). Shorthand for setting `--dc-accent`. |
| `open` | `boolean` | `false` | Start expanded. `false` = launcher icon only until clicked. |

## Theming

The panel ships a fixed dark "terminal" palette (theme-independent) exposed as
CSS custom properties. Because custom properties inherit through the shadow
boundary, you can override any of them **three** ways:

```ts
// 1) the accent shorthand
initDebugConsole({ accent: '#22c55e' });

// 2) imperatively on the element
handle.element.style.setProperty('--dc-error', '#f87171');
```

```css
/* 3) plain host CSS — targets the element, inherits into the shadow root */
debug-console {
  --dc-accent: #22c55e;
  --dc-bg: #0d1117;
}
```

### CSS variables

| Variable | Default | Purpose |
|---|---|---|
| `--dc-accent` | brand gradient | Launcher, count pill, active chips. |
| `--dc-bg` | `#0b0e14` | Panel background. |
| `--dc-surface` | `#11151f` | Header / filter bar background. |
| `--dc-border` | `#232a3a` | Borders and scrollbar thumb. |
| `--dc-text` | `#c9d1d9` | Default text. |
| `--dc-muted` | `#8b949e` | Timestamps, muted / log level. |
| `--dc-row-hover` | `rgba(255,255,255,.04)` | Row hover background. |
| `--dc-shadow` | `0 10px 34px rgba(0,0,0,.5)` | Panel & launcher shadow. |
| `--dc-error` | `#ff6b6b` | Error level. |
| `--dc-warn` | `#ffc107` | Warn level. |
| `--dc-info` | `#57bdff` | Info level + active toolbar icons. |
| `--dc-badge-error` | `#dc3545` | Launcher error badge. |
| `--dc-badge-warn` | `#ffc107` | Launcher warning badge. |

### Shadow parts

Two elements are exposed via `::part()` for structural styling:

```css
debug-console::part(launcher) { /* the corner button */ }
debug-console::part(panel)    { /* the sliding panel */ }
```

## Recipes

```ts
// Enable only outside production, start collapsed
initDebugConsole({ enabled: !import.meta.env.PROD });

// Start expanded in the bottom-left, green accent
initDebugConsole({ open: true, position: 'bottom-left', accent: '#22c55e' });

// Control it programmatically
const dc = initDebugConsole();
dc?.show();
document.querySelector('#logs-btn')?.addEventListener('click', () => dc?.toggle());

// Bigger buffer, no global-error capture
initDebugConsole({ max: 2000, captureGlobalErrors: false });

// Register under a custom tag (declarative usage)
defineDebugConsole('app-logs');
```

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| **No launcher appears / nothing captured.** | `enabled` resolved to `false` (e.g. you gated it on an env flag), or there's no DOM (SSR). `initDebugConsole` returns `null` in both cases — check the return value. |
| **Early logs are missing.** | Capture only starts once `initDebugConsole()`/`startCapture()` runs. Call it **first thing** in your entry file so nothing logged before it is lost. |
| **Launcher is anchored to the wrong place / scrolls with the page.** | An ancestor (often `<body>`) has a `transform`/`filter`/`perspective`, which makes `position: fixed` anchor to that ancestor instead of the viewport (standard CSS). Remove the transform from that ancestor, or mount `<debug-console>` outside it. |
| **A specific `console.*` call isn't showing.** | Only `log`, `info`, `warn`, `error`, `debug` are mirrored. `console.trace/table/dir/group/assert` are [out of scope](#limitations--out-of-scope). |
| **The panel covers my app's own top bar.** | The panel slides down from the top; move the launcher with `position: 'bottom-right'` (or `'bottom-left'`), or raise your app's own top UI. The overlay uses a very high `z-index` by design so it stays on top. |
| **Colors don't match / accent ignored.** | Custom properties must be set on the element (or an ancestor it inherits from). Use `accent`, `--dc-accent`, or the [theming](#theming) overrides — not global styles targeting inner classes (they're inside a shadow root and unreachable). |
| **Still visible in production.** | Pass `enabled: false` (or gate it on `NODE_ENV`/`import.meta.env.PROD`) so the console is never patched and nothing mounts. See [Configuration options](#configuration-options). |

## Develop & run the demo

Clone the repo, then:

```bash
npm install        # install dev tooling (tsup + typescript)
npm run build      # bundle to dist/ (ESM + CJS + .d.ts)
npm run dev        # rebuild on change (watch mode)
npm run typecheck  # type-check without emitting
```

A zero-config live demo lives in [`demo/index.html`](demo/index.html). It loads the
built `dist/index.js`, so build first, then serve the package root with any static
server and open the `/demo/` path:

```bash
npm run build
npx serve .        # then open http://localhost:3000/demo/
```

The demo has buttons for every capture path — `console.log/info/warn/error/debug`,
large & circular objects, `bigint`, bursts of lines, uncaught errors, and unhandled
rejections — so you can exercise the panel end to end.

## Limitations / out of scope

- Specialized methods (`console.trace/table/dir/group/assert`) are not captured.
- Browser-native messages the app didn't log itself (failed network / CORS / CSP)
  only appear if your own error handling logs them via `console.*`.
- Uses `position: fixed`; if a `transform`/`filter` is set on an ancestor of the
  element (e.g. `<body>`), fixed positioning anchors to that ancestor instead of the
  viewport (standard CSS behaviour).
- Under extreme logging bursts (tens of thousands of rapid calls) the panel does
  O(buffer) bookkeeping per entry, like DevTools' own console.

## License

MIT
