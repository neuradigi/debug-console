# @neuradigi/debug-console

A tiny **in-app console overlay**. It mirrors your app's `console.log/info/warn/error/debug`
and uncaught errors into a floating panel, so you can read logs **inside the running app** —
no DevTools needed. It *mirrors* output (never swallows it), so DevTools keeps working too.

Built as a **Web Component** (Shadow DOM), so it drops into **Angular, React, Vue, Svelte,
or plain HTML** with **zero dependencies** and no style conflicts.

- 🔌 One call to set up
- 🎯 Captures `console.*` + uncaught errors / promise rejections
- 🧰 Filter, auto-scroll, download `.log`, clear
- 🧱 Style-isolated, SSR-safe, zero runtime deps

## Install

```bash
npm install @neuradigi/debug-console
```

No bundler? Import straight from a CDN — nothing to install:

```html
<script type="module">
  import { initDebugConsole } from 'https://esm.sh/@neuradigi/debug-console';
  initDebugConsole();
</script>
```

## Quick start

Call it **once, as early as possible** in your app's entry file:

```ts
import { initDebugConsole } from '@neuradigi/debug-console';

initDebugConsole();
```

A launcher button appears in the corner — click it to open the panel. That's it.

## Options

Everything is optional — pass only what you want to change:

```ts
initDebugConsole({
  enabled: true,             // false = do nothing at all (use to switch off in production)
  max: 500,                  // max lines kept; oldest are dropped past this
  captureGlobalErrors: true, // also catch uncaught errors + unhandled promise rejections
  position: 'top-right',     // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  accent: '#22c55e',         // any CSS color/gradient for the launcher & active filter chips
  open: false                // true = start expanded instead of collapsed
});
```

**Turn it off in production:** `initDebugConsole({ enabled: process.env.NODE_ENV !== 'production' })`.

## Framework setup

It's the same everywhere: **call `initDebugConsole()` at the top of your entry file,
before your app mounts** — so even startup logs are caught. No tags or registration needed.

| Framework | Entry file | Put the call… |
|---|---|---|
| Angular | `src/main.ts` | before `bootstrapApplication(...)` |
| React | `src/main.tsx` | before `createRoot(...).render(...)` |
| Vue | `src/main.ts` | before `createApp(...).mount(...)` |
| Svelte | `src/main.ts` | before `new App(...)` |
| SvelteKit | `src/routes/+layout.svelte` | inside `onMount(() => ...)` |
| Plain HTML | your page `<head>` | the CDN snippet from [Install](#install) |

<details>
<summary><b>Rather place the <code>&lt;debug-console&gt;</code> tag in your own markup?</b></summary>

Start capture without auto-mounting, register the element, then use the tag:

```ts
import { defineDebugConsole, startCapture } from '@neuradigi/debug-console';

startCapture();        // begin mirroring console.* + errors (no UI)
defineDebugConsole();  // register the <debug-console> element
```

```html
<debug-console data-position="top-right"></debug-console>
```

Framework-specific bits when you use the tag in a template:

- **Angular** — add `CUSTOM_ELEMENTS_SCHEMA` to the component:
  ```ts
  @Component({ /* ... */, schemas: [CUSTOM_ELEMENTS_SCHEMA] })
  ```
- **React (TypeScript)** — declare the tag once (any `.d.ts`):
  ```tsx
  declare global {
    namespace JSX {
      interface IntrinsicElements {
        'debug-console': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
  ```
- **Vue** — mark it as a custom element in the compiler options:
  ```ts
  vue({ template: { compilerOptions: { isCustomElement: t => t === 'debug-console' } } })
  ```
- **Svelte** — nothing to configure; unknown tags pass straight through.

(Not needed when you use `initDebugConsole()` — it registers and mounts for you.)

</details>

## Panel controls

| Control | What it does |
|---|---|
| **Launcher** (corner button) | Opens the panel. While closed, shows a badge with the error/warning count (red if any errors, amber if only warnings). |
| **Filter chips** | `All / Log / Info / Warn / Error` (Log also includes `debug`). |
| **Auto-scroll** | Toggle following the newest line. |
| **Scroll to bottom** | Jump to the latest entry. |
| **Download** | Save all logs to a timestamped `.log` file. |
| **Clear** | Empty the buffer. |
| **Close** | Collapse back to the launcher. |

Levels are colour-coded: error red, warn amber, info blue, log/debug gray.

## API

Most apps only need `initDebugConsole()`. It returns a handle for programmatic control
(or `null` when disabled / no DOM):

```ts
const dc = initDebugConsole();
dc?.show();      // open the panel
dc?.hide();      // close it
dc?.toggle();
dc?.clear();     // empty the buffer
dc?.destroy();   // remove the overlay
```

<details>
<summary><b>Other exports (declarative setup, reading the buffer)</b></summary>

| Export | Purpose |
|---|---|
| `startCapture(opts?)` | Begin mirroring `console.*` + errors, no UI. Accepts `{ max, captureGlobalErrors }`. |
| `defineDebugConsole(name?)` | Register the `<debug-console>` element (default tag `debug-console`). |
| `ELEMENT_NAME` | The default tag name (`'debug-console'`). |
| `logger` | The capture core — read/observe the buffer yourself. |

```ts
import { logger } from '@neuradigi/debug-console';

logger.entries;              // readonly LogEntry[] (oldest → newest)
logger.limit;                // configured buffer cap
logger.clear();              // empty the buffer
const off = logger.subscribe(e => {   // e is { type: 'add', entry } | { type: 'clear' }
  if (e.type === 'add') myTelemetry(e.entry);
});
// ...later: off();
```

Types exported: `DebugConsoleOptions`, `DebugConsoleHandle`, `LauncherPosition`,
`LogEntry`, `LogLevel`, `LogEvent`.

```ts
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
interface LogEntry { id: number; level: LogLevel; time: Date; text: string; }
```

</details>

## Theming

The panel uses a fixed dark "terminal" look. Change the accent in one line:

```ts
initDebugConsole({ accent: '#22c55e' });
```

Or override any colour with a CSS custom property (they inherit through the shadow boundary):

```css
debug-console { --dc-accent: #22c55e; --dc-bg: #0d1117; }
```

<details>
<summary><b>All CSS variables & shadow parts</b></summary>

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

Two shadow parts are exposed for structural styling:

```css
debug-console::part(launcher) { /* the corner button */ }
debug-console::part(panel)    { /* the sliding panel */ }
```

</details>

## Notes & limits

- Captures `log / info / warn / error / debug`. Not `console.trace/table/dir/group/assert`.
- Native browser messages (failed network / CORS / CSP) only appear if your code logs them.
- Buffer is bounded (default 500); safely stringifies circular refs, `bigint`, and `Error`.
- Uses `position: fixed` — a `transform`/`filter` on an ancestor re-anchors it (standard CSS).
- SSR-safe: every call no-ops when there is no DOM.

## Develop

```bash
npm install
npm run build   # bundle to dist/ (ESM + CJS + types)
npm run dev     # rebuild on change
```

Live demo: run `npm run build`, serve the repo root (`npx serve .`), and open `/demo/`.

## License

MIT © Neuradigi Technologies
