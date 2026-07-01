/**
 * Inline, line-style SVG icons (currentColor-driven, no icon-font dependency).
 * 24×24 viewBox, 2px stroke — resolution-independent and themeable via `color`.
 */
const svg = (paths: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

export const icons = {
  /** Terminal window with a prompt — launcher + panel title. */
  terminal: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3"/><path d="M13 15h4"/>'),
  /** Pin — "pinned to the newest line" (auto-scroll on). */
  pin: svg('<path d="M12 17v5"/><path d="M9 10.8V6a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8"/><path d="M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.7l-1.8-.9A2 2 0 0 1 15 10.8V6a1 1 0 0 0-1-1"/>'),
  /** Double chevron down — jump to latest. */
  chevronsDown: svg('<path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/>'),
  /** Tray with down arrow — download. */
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  /** Trash — clear. */
  trash: svg('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  /** X — close. */
  close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')
} as const;
