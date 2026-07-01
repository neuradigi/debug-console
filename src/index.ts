import { DebugConsoleElement } from './console-element';
import { logger } from './logger';
import type { DebugConsoleHandle, DebugConsoleOptions } from './types';

/** The custom element tag name. */
export const ELEMENT_NAME = 'debug-console';

/**
 * Register the `<debug-console>` custom element (idempotent, browser-only).
 * Call this if you want to place `<debug-console>` in your own markup/JSX/template
 * instead of using {@link initDebugConsole}. You still need to call
 * {@link startCapture} (or `initDebugConsole`) once to begin capturing.
 */
export function defineDebugConsole(name: string = ELEMENT_NAME): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get(name)) {
    customElements.define(name, DebugConsoleElement);
  }
}

/**
 * Begin patching the console + capturing errors, without mounting any UI.
 * Useful when you render `<debug-console>` yourself. Idempotent.
 */
export function startCapture(options: Pick<DebugConsoleOptions, 'max' | 'captureGlobalErrors'> = {}): void {
  logger.init({ max: options.max, captureGlobalErrors: options.captureGlobalErrors });
}

/**
 * One-call setup: start capturing and mount the overlay at the document root.
 *
 * Returns a handle to control/destroy it, or `null` when disabled or when there
 * is no DOM (SSR). When `enabled` is `false` the console is NOT patched and no
 * element is mounted.
 */
export function initDebugConsole(options: DebugConsoleOptions = {}): DebugConsoleHandle | null {
  if (options.enabled === false || typeof document === 'undefined') {
    return null;
  }

  startCapture(options);
  defineDebugConsole();

  // Idempotent: reuse an already-mounted overlay (e.g. a second call, or dev HMR)
  // instead of stacking a second launcher/panel on top.
  const existing = document.querySelector(ELEMENT_NAME) as DebugConsoleElement | null;
  const element: DebugConsoleElement = existing ?? (document.createElement(ELEMENT_NAME) as DebugConsoleElement);

  if (!existing) {
    if (options.position) {
      element.setAttribute('data-position', options.position);
    }
    if (options.accent) {
      element.style.setProperty('--dc-accent', options.accent);
    }

    const mount = (): void => {
      document.body.appendChild(element);
      if (options.open) {
        element.show();
      }
    };
    if (document.body) {
      mount();
    } else {
      window.addEventListener('DOMContentLoaded', mount, { once: true });
    }
  }

  return {
    element,
    show: () => element.show(),
    hide: () => element.hide(),
    toggle: () => element.toggle(),
    clear: () => logger.clear(),
    destroy: () => element.remove()
  };
}

export { logger } from './logger';
export { DebugConsoleElement } from './console-element';
export type { LogEvent } from './logger';
export type { DebugConsoleHandle, DebugConsoleOptions, LauncherPosition, LogEntry, LogLevel } from './types';
