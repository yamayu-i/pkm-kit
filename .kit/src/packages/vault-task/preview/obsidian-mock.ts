/** プレビュー用の Obsidian API のモック（見た目の確認だけに使う。プラグインには入らない） */
export class Menu { items: any[] = []; addItem(cb: any) { const it: any = { setTitle(t: string) { it.t = t; return it; }, setChecked() { return it; }, onClick(f: any) { it.f = f; return it; } }; cb(it); this.items.push(it); return this; } showAtMouseEvent() { (window as any).lastMenu = this.items.map((i) => i.t); return this; } }
export class Modal { contentEl = document.createElement("div"); constructor(public app: any) {} setTitle() {} open() { document.body.append(this.contentEl); (this as any).onOpen?.(); } close() { (this as any).onClose?.(); this.contentEl.remove(); } }
export class SuggestModal extends Modal { setPlaceholder() {} }
export class FuzzySuggestModal extends SuggestModal {}
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
  tag: '<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.59-8.59a1 1 0 0 0 0-1.41Z"/>',
};
export function setIcon(el: HTMLElement, name: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  // 固定の SVG パスだけを入れる（入力は入らない）
  svg.innerHTML = PATHS[name] ?? '<circle cx="12" cy="12" r="4"/>';
  el.append(svg);
}
