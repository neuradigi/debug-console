/**
 * Shadow-DOM stylesheet for the debug console. Self-contained fixed dark
 * "terminal" palette (theme-independent), with a handful of `--dc-*` custom
 * properties consumers can override (e.g. `--dc-accent`). Because it lives in a
 * shadow root, none of these rules leak into or out of the host application.
 */
export const STYLES = `
:host {
  --dc-bg: #0b0e14;
  --dc-surface: #11151f;
  --dc-border: #232a3a;
  --dc-text: #c9d1d9;
  --dc-muted: #8b949e;
  --dc-row-hover: rgba(255, 255, 255, 0.04);
  --dc-shadow: 0 10px 34px rgba(0, 0, 0, 0.5);
  --dc-accent: linear-gradient(135deg, #57bdff, #4f77fb, #3a5fcc);
  --dc-error: #ff6b6b;
  --dc-warn: #ffc107;
  --dc-info: #57bdff;
  --dc-badge-error: #dc3545;
  --dc-badge-warn: #ffc107;
  font-family: 'Cascadia Code', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

/* ===== Launcher ===== */
.dc-launcher {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483000;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--dc-accent);
  color: #fff;
  cursor: pointer;
  box-shadow: var(--dc-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.dc-launcher svg { width: 22px; height: 22px; }
.dc-launcher:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(79, 119, 251, 0.45); }
:host([data-position="top-left"]) .dc-launcher { top: 16px; left: 16px; right: auto; }
:host([data-position="bottom-right"]) .dc-launcher { top: auto; bottom: 16px; right: 16px; }
:host([data-position="bottom-left"]) .dc-launcher { top: auto; bottom: 16px; left: 16px; right: auto; }

/* ===== Badge ===== */
.dc-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  border-radius: 999px;
  border: 2px solid var(--dc-bg);
}
.dc-badge--error { background: var(--dc-badge-error); color: #fff; }
.dc-badge--warn { background: var(--dc-badge-warn); color: #000; }

/* ===== Panel ===== */
.dc-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2147482000;
  display: flex;
  flex-direction: column;
  max-height: 50vh;
  background: var(--dc-bg);
  color: var(--dc-text);
  border-bottom: 1px solid var(--dc-border);
  box-shadow: var(--dc-shadow);
  transform: translateY(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.dc-panel--open { transform: translateY(0); }

/* ===== Header ===== */
.dc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  background: var(--dc-surface);
  border-bottom: 1px solid var(--dc-border);
  flex-shrink: 0;
}
.dc-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dc-title-icon { display: inline-flex; color: var(--dc-info); }
.dc-title-icon svg { width: 20px; height: 20px; }
.dc-title-text { font-size: 14px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; color: var(--dc-text); }
.dc-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  background: var(--dc-accent);
  border-radius: 999px;
}

/* ===== Actions ===== */
.dc-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.dc-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--dc-muted);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}
.dc-action svg { width: 18px; height: 18px; }
.dc-action:hover:not(:disabled) { color: var(--dc-text); background: var(--dc-row-hover); }
.dc-action:disabled { opacity: 0.35; cursor: default; }
.dc-action--active { color: var(--dc-info); }

/* ===== Tooltips (self-contained; no host overlay layer) ===== */
.dc-action[data-tip]:hover::after,
.dc-launcher[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute;
  padding: 4px 8px;
  border-radius: 6px;
  background: #000;
  color: #fff;
  font-size: 11px;
  font-family: system-ui, -apple-system, sans-serif;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}
.dc-action[data-tip]:hover::after {
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
}
.dc-launcher[data-tip]:hover::after {
  top: 50%;
  right: calc(100% + 8px);
  transform: translateY(-50%);
}
:host([data-position="top-left"]) .dc-launcher[data-tip]:hover::after,
:host([data-position="bottom-left"]) .dc-launcher[data-tip]:hover::after {
  right: auto;
  left: calc(100% + 8px);
}

/* ===== Filter chips ===== */
.dc-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 16px;
  background: var(--dc-surface);
  border-bottom: 1px solid var(--dc-border);
  flex-shrink: 0;
}
.dc-chip {
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--dc-muted);
  background: transparent;
  border: 1px solid var(--dc-border);
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.dc-chip:hover { color: var(--dc-text); border-color: #4f77fb; }
.dc-chip--active { color: #fff; border-color: transparent; background: var(--dc-accent); }

/* ===== List ===== */
.dc-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--dc-border) transparent;
}
.dc-list::-webkit-scrollbar { width: 10px; }
.dc-list::-webkit-scrollbar-thumb { background: var(--dc-border); border-radius: 999px; }
.dc-list::-webkit-scrollbar-track { background: transparent; }

.dc-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  padding: 4px 16px;
  border-left: 3px solid transparent;
  font-size: 12px;
  line-height: 1.5;
}
.dc-row:hover { background: var(--dc-row-hover); }
.dc-row--error { border-left-color: var(--dc-error); }
.dc-row--error .dc-tag, .dc-row--error .dc-text { color: var(--dc-error); }
.dc-row--warn { border-left-color: var(--dc-warn); }
.dc-row--warn .dc-tag { color: var(--dc-warn); }
.dc-row--info { border-left-color: var(--dc-info); }
.dc-row--info .dc-tag { color: var(--dc-info); }
.dc-row--log, .dc-row--debug { border-left-color: var(--dc-muted); }
.dc-row--log .dc-tag, .dc-row--debug .dc-tag { color: var(--dc-muted); }

.dc-time { color: var(--dc-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.dc-tag { min-width: 42px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
.dc-text { margin: 0; min-width: 0; font-family: inherit; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; color: var(--dc-text); }

.dc-empty { padding: 24px 16px; text-align: center; font-size: 13px; color: var(--dc-muted); }

@media (max-width: 600px) {
  .dc-panel { max-height: 65vh; }
}
`;
