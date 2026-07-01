import { icons } from './icons';
import { logger, type LogEvent } from './logger';
import { STYLES } from './styles';
import type { LogEntry, LogLevel } from './types';

interface FilterDef {
  value: string;
  label: string;
  match: (level: LogLevel) => boolean;
}

const FILTERS: readonly FilterDef[] = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'log', label: 'Log', match: level => level === 'log' || level === 'debug' },
  { value: 'info', label: 'Info', match: level => level === 'info' },
  { value: 'warn', label: 'Warn', match: level => level === 'warn' },
  { value: 'error', label: 'Error', match: level => level === 'error' }
];

const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
const fmtTime = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
const fmtDateTime = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${fmtTime(d)}`;
const fmtFileStamp = (d: Date): string =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

// SSR-safe base: in a non-browser runtime `HTMLElement` is undefined, so extend
// a harmless stub. The DOM-touching methods only ever run in the browser.
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement);

/**
 * `<debug-console>` custom element. Renders the launcher + panel inside a shadow
 * root (full style isolation) and mirrors {@link logger}'s buffer in real time.
 * Register it with `defineDebugConsole()` or mount it via `initDebugConsole()`.
 */
export class DebugConsoleElement extends HTMLElementBase {
  private readonly root: ShadowRoot;

  private launcherEl!: HTMLButtonElement;
  private badgeEl!: HTMLElement;
  private panelEl!: HTMLElement;
  private countEl!: HTMLElement;
  private listEl!: HTMLElement;
  private emptyEl!: HTMLElement;
  private autoScrollBtn!: HTMLButtonElement;
  private downloadBtn!: HTMLButtonElement;
  private clearBtn!: HTMLButtonElement;

  private unsubscribe: (() => void) | null = null;
  private isOpen = false;
  private autoScroll = true;
  private filter: FilterDef = FILTERS[0];

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    this.replayExisting();
    this.unsubscribe = logger.subscribe(event => this.onLog(event));
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /** Open the panel. */
  show(): void {
    this.setOpen(true);
  }

  /** Close the panel. */
  hide(): void {
    this.setOpen(false);
  }

  /** Toggle the panel. */
  toggle(): void {
    this.setOpen(!this.isOpen);
  }

  private render(): void {
    this.root.innerHTML = `
      <style>${STYLES}</style>
      <button class="dc-launcher" type="button" part="launcher" data-tip="Show application logs" aria-label="Show application logs">
        ${icons.terminal}
        <span class="dc-badge" hidden></span>
      </button>
      <section class="dc-panel" part="panel" role="log" aria-live="polite" aria-label="Application logs">
        <header class="dc-header">
          <div class="dc-title">
            <span class="dc-title-icon">${icons.terminal}</span>
            <span class="dc-title-text">Application Logs</span>
            <span class="dc-count" hidden>0</span>
          </div>
          <div class="dc-actions">
            <button class="dc-action dc-action--active" type="button" data-act="autoscroll" data-tip="Auto-scroll: on (following newest)" aria-label="Toggle auto-scroll">${icons.pin}</button>
            <button class="dc-action" type="button" data-act="bottom" data-tip="Scroll to bottom" aria-label="Scroll to bottom">${icons.chevronsDown}</button>
            <button class="dc-action" type="button" data-act="download" data-tip="Download logs" aria-label="Download logs" disabled>${icons.download}</button>
            <button class="dc-action" type="button" data-act="clear" data-tip="Clear logs" aria-label="Clear logs" disabled>${icons.trash}</button>
            <button class="dc-action" type="button" data-act="close" data-tip="Close" aria-label="Close application logs">${icons.close}</button>
          </div>
        </header>
        <div class="dc-filters"></div>
        <div class="dc-list"></div>
        <div class="dc-empty">No log entries captured yet.</div>
      </section>
    `;

    this.launcherEl = this.query('.dc-launcher');
    this.badgeEl = this.query('.dc-badge');
    this.panelEl = this.query('.dc-panel');
    this.countEl = this.query('.dc-count');
    this.listEl = this.query('.dc-list');
    this.emptyEl = this.query('.dc-empty');
    this.autoScrollBtn = this.query('[data-act="autoscroll"]');
    this.downloadBtn = this.query('[data-act="download"]');
    this.clearBtn = this.query('[data-act="clear"]');

    this.launcherEl.addEventListener('click', () => this.setOpen(true));

    this.query('.dc-actions').addEventListener('click', (event: Event) => {
      const btn = (event.target as HTMLElement).closest('.dc-action') as HTMLElement | null;
      switch (btn?.dataset['act']) {
        case 'autoscroll':
          this.toggleAutoScroll();
          break;
        case 'bottom':
          this.scrollToBottom();
          break;
        case 'download':
          this.download();
          break;
        case 'clear':
          logger.clear();
          break;
        case 'close':
          this.setOpen(false);
          break;
      }
    });

    const filtersEl = this.query('.dc-filters');
    for (const def of FILTERS) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'dc-chip' + (def === this.filter ? ' dc-chip--active' : '');
      chip.textContent = def.label;
      chip.addEventListener('click', () => this.setFilter(def, chip));
      filtersEl.appendChild(chip);
    }
  }

  private query<T extends Element>(selector: string): T {
    return this.root.querySelector(selector) as T;
  }

  private replayExisting(): void {
    for (const entry of logger.entries) {
      this.appendRow(entry);
    }
    this.refresh();
    this.scrollToBottomIfFollowing();
  }

  private onLog(event: LogEvent): void {
    if (event.type === 'clear') {
      this.listEl.replaceChildren();
    } else {
      this.appendRow(event.entry);
    }
    this.refresh();
    if (event.type === 'add') {
      this.scrollToBottomIfFollowing();
    }
  }

  /** Build one row (XSS-safe via textContent) and trim the DOM to the buffer cap. */
  private appendRow(entry: LogEntry): void {
    const row = document.createElement('div');
    row.className = `dc-row dc-row--${entry.level}`;
    row.dataset['level'] = entry.level;
    row.hidden = !this.filter.match(entry.level);

    const time = document.createElement('span');
    time.className = 'dc-time';
    time.textContent = fmtTime(entry.time);

    const tag = document.createElement('span');
    tag.className = 'dc-tag';
    tag.textContent = entry.level;

    const text = document.createElement('pre');
    text.className = 'dc-text';
    text.textContent = entry.text;

    row.append(time, tag, text);
    this.listEl.appendChild(row);

    while (this.listEl.childElementCount > logger.limit) {
      this.listEl.firstElementChild?.remove();
    }
  }

  /** Recompute counts, badge, count pill, disabled states and the empty message. */
  private refresh(): void {
    let errors = 0;
    let warnings = 0;
    for (const entry of logger.entries) {
      if (entry.level === 'error') {
        errors++;
      } else if (entry.level === 'warn') {
        warnings++;
      }
    }
    const total = logger.entries.length;

    this.countEl.textContent = String(total);
    this.countEl.hidden = total === 0;

    const badge = errors + warnings;
    this.badgeEl.hidden = this.isOpen || badge === 0;
    this.badgeEl.textContent = String(badge);
    this.badgeEl.className = 'dc-badge ' + (errors > 0 ? 'dc-badge--error' : 'dc-badge--warn');

    this.downloadBtn.disabled = total === 0;
    this.clearBtn.disabled = total === 0;

    this.emptyEl.hidden = !!this.listEl.querySelector('.dc-row:not([hidden])');
  }

  private setOpen(open: boolean): void {
    this.isOpen = open;
    this.panelEl.classList.toggle('dc-panel--open', open);
    this.launcherEl.hidden = open;
    this.refresh();
    if (open) {
      this.scrollToBottomIfFollowing();
    }
  }

  private toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
    this.autoScrollBtn.classList.toggle('dc-action--active', this.autoScroll);
    this.autoScrollBtn.dataset['tip'] = this.autoScroll ? 'Auto-scroll: on (following newest)' : 'Auto-scroll: off';
    this.scrollToBottomIfFollowing();
  }

  private setFilter(def: FilterDef, chip: HTMLElement): void {
    this.filter = def;
    this.root.querySelectorAll('.dc-chip').forEach(c => c.classList.toggle('dc-chip--active', c === chip));
    this.listEl.querySelectorAll<HTMLElement>('.dc-row').forEach(row => {
      row.hidden = !def.match(row.dataset['level'] as LogLevel);
    });
    this.refresh();
    this.scrollToBottomIfFollowing();
  }

  private scrollToBottom(): void {
    this.listEl.scrollTop = this.listEl.scrollHeight;
  }

  private scrollToBottomIfFollowing(): void {
    if (!this.isOpen || !this.autoScroll) {
      return;
    }
    requestAnimationFrame(() => {
      this.listEl.scrollTop = this.listEl.scrollHeight;
    });
  }

  private download(): void {
    const entries = logger.entries;
    if (entries.length === 0) {
      return;
    }
    const content = entries.map(e => `[${fmtDateTime(e.time)}] ${e.level.toUpperCase()} ${e.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `application-logs-${fmtFileStamp(new Date())}.log`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
