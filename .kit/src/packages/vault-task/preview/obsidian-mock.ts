/** プレビュー用の Obsidian API のモック（見た目の確認だけに使う。プラグインには入らない） */
export class Menu { items: any[] = []; addItem(cb: any) { const it: any = { setTitle(t: string) { it.t = t; return it; }, setChecked() { return it; }, setIcon() { return it; }, onClick(f: any) { it.f = f; return it; } }; cb(it); this.items.push(it); return this; } addSeparator() { return this; } showAtMouseEvent() { (window as any).lastMenu = this.items.map((i) => i.t); return this; } }
export class Modal { contentEl = document.createElement("div"); constructor(public app: any) {} setTitle() {} open() { document.body.append(this.contentEl); (this as any).onOpen?.(); } close() { (this as any).onClose?.(); this.contentEl.remove(); } }
export class SuggestModal extends Modal { setPlaceholder() {} }
export class FuzzySuggestModal extends SuggestModal {}
export const prepareFuzzySearch = (q: string) => (t: string) => (t.includes(q) ? { score: 0 } : null);
export const Keymap = { isModEvent: () => false };
export class Notice { constructor(m: any) { console.log("notice", m); } }
export const Platform = { isMobile: false };
const PATHS: Record<string, string> = {
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  "calendar-clock": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-circle-2": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  "calendar-plus": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',
  "calendar-check": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18m-12 6 2 2 4-4"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "more-horizontal": '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  "arrow-right": '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  "arrow-up": '<path d="m5 12 7-7 7 7M12 19V5"/>',
  "arrow-down": '<path d="M12 5v14m7-7-7 7-7-7"/>',
  "layout-grid": '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  "layout-dashboard": '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4m0 4h.01"/>',
  "alarm-clock-off": '<circle cx="12" cy="13" r="8"/><path d="M5 3 2 6m20 0-3-3M12 9v4l2 2"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  "trash-2": '<path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  "undo-2": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  "external-link": '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  "party-popper": '<path d="M5.8 11.3 2 22l10.7-3.8M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/>',
  "arrow-down-wide-narrow": '<path d="m3 16 4 4 4-4M7 20V4m4 0h10m-10 4h7m-7 4h4"/>',
  "corner-down-right": '<path d="m15 10 5 5-5 5"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
  tag: '<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.59-8.59a1 1 0 0 0 0-1.41Z"/>',
};
export function setIcon(el: HTMLElement, name: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  // 固定の SVG パスだけを入れる（入力は入らない）
  svg.innerHTML = PATHS[name] ?? '<circle cx="12" cy="12" r="4"/>';
  el.append(svg);
}
