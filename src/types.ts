/** Console levels mirrored into the in-app buffer. */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/** A single captured log line. */
export interface LogEntry {
  id: number;
  level: LogLevel;
  time: Date;
  text: string;
}

/** Where the round launcher button is pinned. */
export type LauncherPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/** Options for {@link initDebugConsole}. */
export interface DebugConsoleOptions {
  /** Master switch. When `false`, the console is NOT patched and nothing is mounted. Default `true`. */
  enabled?: boolean;
  /** Max buffered entries (oldest dropped). Default `500`. */
  max?: number;
  /** Also capture `window` `error` + `unhandledrejection` events. Default `true`. */
  captureGlobalErrors?: boolean;
  /** Launcher corner. Default `'top-right'`. */
  position?: LauncherPosition;
  /** Accent color (any CSS color or gradient) for the launcher, count pill and active chips. */
  accent?: string;
  /** Open the panel immediately. Default `false`. */
  open?: boolean;
}

/** Runtime handle returned by {@link initDebugConsole}. */
export interface DebugConsoleHandle {
  /** The mounted custom element. */
  readonly element: HTMLElement;
  /** Open the panel. */
  show(): void;
  /** Close the panel. */
  hide(): void;
  /** Toggle the panel. */
  toggle(): void;
  /** Empty the buffer. */
  clear(): void;
  /** Remove the element from the DOM. */
  destroy(): void;
}
