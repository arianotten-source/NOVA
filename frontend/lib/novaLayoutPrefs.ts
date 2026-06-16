const STORAGE_LAYOUT = 'nova_dashboard_layout';

export const NOVA_LAYOUT_MODES = {
  COMPACT: 'compact',
  STANDARD: 'standard',
  ADVANCED: 'advanced',
} as const;

export type NovaLayoutMode = (typeof NOVA_LAYOUT_MODES)[keyof typeof NOVA_LAYOUT_MODES];

export function loadNovaLayoutMode(): NovaLayoutMode {
  try {
    const raw = localStorage.getItem(STORAGE_LAYOUT);
    if (raw && Object.values(NOVA_LAYOUT_MODES).includes(raw as NovaLayoutMode)) {
      return raw as NovaLayoutMode;
    }
  } catch {
    /* ignore */
  }
  return NOVA_LAYOUT_MODES.STANDARD;
}

export function saveNovaLayoutMode(mode: NovaLayoutMode): void {
  localStorage.setItem(STORAGE_LAYOUT, mode);
}
