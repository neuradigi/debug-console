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
- 🪶 Zero runtime deps, ~small, tree-shakeable (ESM + CJS + types)
- 🎯 Captures `console.*` + `window` `error` / `unhandledrejection`
- 🧱 Shadow-DOM isolated: fixed dark "terminal" look, self-contained tooltips
- 🧰 Filter chips, auto-scroll (pin), jump-to-bottom, download `.log`, clear
- 🧠 Bounded buffer (default 500, oldest dropped); safe stringify (circular refs, `bigint`, `Error`)

## Install

```bash
npm install @neuradigi/debug-console
```

## Quick start (any framework)

```ts
import { initDebugConsole } from '@neuradigi/debug-console';

initDebugConsole({
  enabled: process.env.NODE_ENV !== 'production', // hide in prod with one flag
  max: 500,
  position: 'top-right'
});
```

Call it **once, as early as possible** in your app's entry file so logs are
captured from boot. That's it — a launcher button appears; click it to open the panel.

### Declarative usage (render the element yourself)

```ts
import { defineDebugConsole, startCapture } from '@neuradigi/debug-console';

startCapture();        // begin mirroring console.* + errors
defineDebugConsole();  // register the <debug-console> element
```

```html
<debug-console data-position="top-right"></debug-console>
```

## Per-framework notes

**Angular** — call `initDebugConsole()` in `main.ts` (or an `APP_INITIALIZER`). The
`<debug-console>` tag needs no `CUSTOM_ELEMENTS_SCHEMA` when mounted via
`initDebugConsole()`. If you place the tag in a template instead, add
`CUSTOM_ELEMENTS_SCHEMA` to that component.

**React** — call `initDebugConsole()` in your entry (e.g. `main.tsx`). Custom
elements work in JSX; if you place `<debug-console />` yourself and use TS, add an
`IntrinsicElements` declaration.

**Vue** — call `initDebugConsole()` in `main.ts`. If you use the tag in templates,
mark it as a custom element in your Vue compiler options
(`isCustomElement: tag => tag === 'debug-console'`).

**Plain HTML** — `import { initDebugConsole } from '@neuradigi/debug-console'; initDebugConsole();`

## API

### `initDebugConsole(options?): DebugConsoleHandle | null`

Starts capturing and mounts the overlay at `document.body`. Returns a handle, or
`null` when `enabled: false` or there is no DOM (SSR-safe).

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | When `false`, the console is **not** patched and nothing is mounted. |
| `max` | `number` | `500` | Max buffered entries (oldest dropped). |
| `captureGlobalErrors` | `boolean` | `true` | Capture `window` `error` + `unhandledrejection`. |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Launcher corner. |
| `accent` | `string` | brand gradient | Any CSS color/gradient for accent (launcher, count pill, active chips). |
| `open` | `boolean` | `false` | Open the panel immediately. |

**`DebugConsoleHandle`**: `{ element, show(), hide(), toggle(), clear(), destroy() }`

### Other exports

- `startCapture({ max?, captureGlobalErrors? })` — begin capturing without mounting UI.
- `defineDebugConsole(name?)` — register the custom element (default tag `debug-console`).
- `logger` — the capture core (`logger.entries`, `logger.subscribe`, `logger.clear`).
- Types: `DebugConsoleOptions`, `DebugConsoleHandle`, `LogEntry`, `LogLevel`, `LauncherPosition`.

## Theming

The panel uses a fixed dark palette by default. Override any `--dc-*` custom
property on the element (they pierce the shadow boundary):

```ts
const handle = initDebugConsole({ accent: '#22c55e' });
handle?.element.style.setProperty('--dc-error', '#f87171');
```

You can also style exposed parts: `debug-console::part(panel)`, `::part(launcher)`.

## Out of scope

- Specialized methods (`console.trace/table/dir/group/assert`).
- Browser-native messages the app didn't log itself (failed network / CORS / CSP)
  only appear if your own error handling logs them via `console.*`.

## License

MIT
