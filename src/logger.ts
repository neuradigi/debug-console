import type { LogEntry, LogLevel } from './types';

/** Emitted to subscribers whenever the buffer changes. */
export type LogEvent = { type: 'add'; entry: LogEntry } | { type: 'clear' };

type LogListener = (event: LogEvent) => void;

const LEVELS: readonly LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

/**
 * Framework-agnostic capture core. Patches the global `console`, buffers entries
 * (bounded, oldest dropped), captures uncaught errors, and notifies subscribers.
 * A single shared instance is exported as {@link logger}.
 *
 * Patched methods always call the original first, so DevTools keeps working —
 * this MIRRORS console output, it never swallows it.
 */
class LoggerCore {
  private readonly _entries: LogEntry[] = [];
  private readonly listeners = new Set<LogListener>();
  private nextId = 0;
  private max = 500;
  private patched = false;
  private errorsHooked = false;

  /** The current buffer, oldest → newest (read-only). */
  get entries(): readonly LogEntry[] {
    return this._entries;
  }

  /** The configured buffer cap. */
  get limit(): number {
    return this.max;
  }

  /** Patch the console and (optionally) global error handlers. Idempotent. */
  init(options: { max?: number; captureGlobalErrors?: boolean } = {}): void {
    if (typeof options.max === 'number' && options.max > 0) {
      this.max = Math.floor(options.max);
    }
    this.patchConsole();
    if (options.captureGlobalErrors !== false) {
      this.captureGlobalErrors();
    }
  }

  /** Subscribe to buffer changes. Returns an unsubscribe function. */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Empty the buffer (does not unpatch the console). */
  clear(): void {
    this._entries.length = 0;
    this.emit({ type: 'clear' });
  }

  private patchConsole(): void {
    if (this.patched || typeof console === 'undefined') {
      return;
    }
    this.patched = true;

    // Cast to a writable record of only the levels we patch; every other native
    // console method is left untouched.
    const con = console as unknown as Record<LogLevel, (...args: unknown[]) => void>;
    for (const level of LEVELS) {
      const original = con[level].bind(console);
      con[level] = (...args: unknown[]): void => {
        original(...args); // mirror — forward to the real console first
        this.push(level, this.stringifyArgs(args));
      };
    }
  }

  private captureGlobalErrors(): void {
    if (this.errorsHooked || typeof window === 'undefined') {
      return;
    }
    this.errorsHooked = true;

    window.addEventListener('error', (event: ErrorEvent): void => {
      const text = event.error != null ? this.stringifyValue(event.error) : event.message || 'Uncaught error';
      this.push('error', text);
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): void => {
      this.push('error', `Unhandled promise rejection: ${this.stringifyValue(event.reason)}`);
    });
  }

  private push(level: LogLevel, text: string): void {
    const entry: LogEntry = { id: this.nextId++, level, time: new Date(), text };
    this._entries.push(entry);
    if (this._entries.length > this.max) {
      this._entries.splice(0, this._entries.length - this.max);
    }
    this.emit({ type: 'add', entry });
  }

  private emit(event: LogEvent): void {
    // A subscriber error must never break the patched console it was triggered from.
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch {
        /* swallow — the mirror must not affect the app's own console call */
      }
    });
  }

  private stringifyArgs(args: unknown[]): string {
    return args.map(arg => this.stringifyValue(arg)).join(' ');
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }

    try {
      const seen = new WeakSet<object>();
      const json = JSON.stringify(
        value,
        (_key: string, val: unknown) => {
          if (typeof val === 'bigint') {
            return val.toString();
          }
          if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) {
              return '[Circular]';
            }
            seen.add(val);
          }
          return val;
        },
        2
      );
      return json ?? String(value);
    } catch {
      return String(value);
    }
  }
}

/** The shared capture core (console is global, so there is exactly one). */
export const logger = new LoggerCore();
