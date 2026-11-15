import { StateEffect, StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { MarkdownRenderChild, editorInfoField, editorLivePreviewField, parseYaml, type Plugin } from "obsidian";
import { h, render } from "preact";
import { pickSticky, type StickyRegion } from "../core/sub-sticky";
import {
	cursorInside,
	isSubOpen,
	layoutSubIssues,
	parseSubIssues,
	subHeadChange,
	subSectionRole,
	toggleSubOpen,
	type SubIssue,
	type SubLayout,
} from "../core/sub-issue";
import type { TaskContext } from "../obsidian/context";
import { ReadingCard, StickySubRow, SubCard, UnreadableCard, issueIdOf, type SaveSub } from "../obsidian/sub-card";
import { StickyOverlay, stickyBox } from "./sub-sticky-overlay";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;

/** Live Preview: 題は、入力が止まって 600 ms で保存する（ADR-0161） */
const LIVE_PREVIEW_SAVE_MS = 600;

/** カードの描き直しだけを頼む（開閉を変えたとき） */
const refresh = StateEffect.define<null>();

/** 開いているサブを切り替えて、この端末に保存する（ADR-0158）。ids は今ある読めるサブの id */
function toggleOpen(ctx: TaskContext, path: string, id: string, ids: string[]): void {
	ctx.settings.subOpen = toggleSubOpen(ctx.settings.subOpen, path, id, ids);
	void ctx.saveSettings().catch((e) => ctx.report("展開の状態を保存できませんでした", e));
}

// ---------- Reading ----------

const CLOSED_CLASS = "vt-sub-body-closed";

/** Reading で描いたセクション。scroller は、DOM にあるのを見たときのスクロール領域（画面外では DOM から外れるため覚えておく） */
interface SectionEntry {
	id: string;
	el: HTMLElement;
	line: number;
	scroller?: HTMLElement;
}
const bodies = new Map<string, Set<SectionEntry>>();
const cards = new Map<string, Set<SectionEntry>>();
/** 開閉を変えたことを、Reading のカードに知らせる（浮かべた行から閉じたとき、カードの矢印を描き直す） */
const openListeners = new Set<() => void>();

function addEntry(map: Map<string, Set<SectionEntry>>, path: string, entry: SectionEntry, mctx: { addChild: (c: MarkdownRenderChild) => void }): void {
	const set = map.get(path) ?? new Set();
	map.set(path, set);
	set.add(entry);
	const child = new MarkdownRenderChild(entry.el);
	child.onunload = () => {
		set.delete(entry);
		if (set.size === 0) map.delete(path);
	};
	mctx.addChild(child);
}

/** Reading で、開閉を本文のセクションに反映する（描き直さずに class を付け外しする） */
function syncReading(ctx: TaskContext, path: string): void {
	for (const b of bodies.get(path) ?? []) b.el.toggleClass(CLOSED_CLASS, !isSubOpen(ctx.settings.subOpen, path, b.id));
	for (const fn of openListeners) fn();
	readingSticky?.scheduleAll();
}

/** Reading: 開いたサブの題の行を、スクロール領域の上端に浮かべる（ADR-0161 の追記） */
class ReadingSticky {
	private readonly overlays = new Map<HTMLElement, StickyOverlay>();
	private readonly pending = new Set<HTMLElement>();
	private frame = 0;

	constructor(private readonly ctx: TaskContext) {}

	schedule(scroller: HTMLElement): void {
		this.pending.add(scroller);
		if (this.frame === 0) this.frame = window.requestAnimationFrame(() => this.flush());
	}

	scheduleAll(): void {
		for (const s of this.overlays.keys()) this.schedule(s);
		for (const set of cards.values()) for (const c of set) if (c.scroller) this.schedule(c.scroller);
	}

	private flush(): void {
		this.frame = 0;
		const list = [...this.pending];
		this.pending.clear();
		for (const s of list) this.update(s);
	}

	/** 入れ物（スクロール領域の親）が消えたものは片付ける */
	private overlayOf(scroller: HTMLElement): StickyOverlay | null {
		let o = this.overlays.get(scroller);
		if (!scroller.isConnected || !scroller.parentElement) {
			o?.destroy();
			this.overlays.delete(scroller);
			return null;
		}
		if (!o) {
			o = new StickyOverlay(scroller.parentElement);
			this.overlays.set(scroller, o);
		}
		return o;
	}

	private update(scroller: HTMLElement): void {
		const overlay = this.overlayOf(scroller);
		if (!overlay) return;
		const tag = (e: SectionEntry) => {
			if (e.el.isConnected && scroller.contains(e.el)) e.scroller = scroller;
			return e.scroller === scroller;
		};
		const found: { path: string; card: SectionEntry; region: StickyRegion; box: HTMLElement | null }[] = [];
		for (const [path, set] of cards) {
			const mine = [...set].filter(tag);
			if (mine.length === 0) continue;
			const ownBodies = [...(bodies.get(path) ?? [])].filter(tag).sort((a, b) => a.line - b.line);
			for (const card of mine) {
				if (!isSubOpen(this.ctx.settings.subOpen, path, card.id)) continue;
				const bs = ownBodies.filter((b) => b.id === card.id);
				const shown = bs.filter((b) => b.el.isConnected);
				const last = bs[bs.length - 1];
				let top: number;
				let bottom: number;
				if (card.el.isConnected) top = card.el.getBoundingClientRect().top;
				else if (shown.length > 0) top = -Infinity;
				else continue;
				if (last?.el.isConnected) bottom = last.el.getBoundingClientRect().bottom;
				else if (shown.length > 0) bottom = Infinity;
				else bottom = card.el.getBoundingClientRect().bottom;
				found.push({ path, card, region: { top, bottom }, box: card.el.isConnected ? card.el : (shown[0]?.el ?? null) });
			}
		}
		found.sort((a, b) => a.card.line - b.card.line);
		const rect = scroller.getBoundingClientRect();
		const pick = pickSticky(
			found.map((f) => f.region),
			rect.top,
			overlay.rowHeight,
		);
		const f = pick === null ? null : found[pick.index]!;
		const subs = f === null ? [] : parseSubIssues(f.path, issueIdOf(f.path), this.ctx.store.text(f.path) ?? "", parseYaml).subs;
		const sub = f === null ? undefined : subs.find((s) => s.id === f.card.id);
		if (!f || !sub || !f.box || pick === null) return overlay.hide();
		const box = stickyBox(scroller, f.box.getBoundingClientRect());
		const { ctx } = this;
		overlay.show(
			`${f.path}\n${JSON.stringify(sub)}`,
			() =>
				h(StickySubRow, {
					ctx,
					sub,
					save: (patch) => ctx.writer.updateSub(sub.key, patch),
					onToggle: () => {
						toggleOpen(
							ctx,
							f.path,
							sub.id,
							subs.map((s) => s.id),
						);
						syncReading(ctx, f.path);
						if (f.card.el.isConnected) f.card.el.scrollIntoView({ block: "start" });
					},
				}),
			box,
			pick.offset,
		);
	}

	destroy(): void {
		if (this.frame !== 0) window.cancelAnimationFrame(this.frame);
		for (const o of this.overlays.values()) o.destroy();
		this.overlays.clear();
	}
}

let readingSticky: ReadingSticky | null = null;

function installReading(ctx: TaskContext, plugin: Plugin): void {
	const sticky = new ReadingSticky(ctx);
	readingSticky = sticky;
	plugin.register(() => {
		sticky.destroy();
		if (readingSticky === sticky) readingSticky = null;
	});
	// スクロールは泡立たないので、捕捉で受ける。Reading のスクロール領域だけを見る（DOM のない検査の環境では登録しない）
	if (typeof document === "undefined") return installReadingCards(ctx, plugin);
	plugin.registerDomEvent(
		document,
		"scroll",
		(e) => {
			const t = e.target;
			if (t instanceof HTMLElement && t.classList.contains("markdown-preview-view")) sticky.schedule(t);
		},
		{ capture: true, passive: true },
	);
	plugin.registerDomEvent(window, "resize", () => sticky.scheduleAll());
	plugin.register(ctx.store.subscribe(() => sticky.scheduleAll()));
	installReadingCards(ctx, plugin);
}

function installReadingCards(ctx: TaskContext, plugin: Plugin): void {
	let memo: { path: string; text: string; layout: SubLayout[] } | null = null;
	const layoutOf = (path: string, text: string): SubLayout[] => {
		if (memo?.path !== path || memo.text !== text) memo = { path, text, layout: layoutSubIssues(path, issueIdOf(path), text, parseYaml) };
		return memo.layout;
	};
	plugin.registerMarkdownPostProcessor((el, mctx) => {
		const path = mctx.sourcePath;
		if (!ISSUE_PATH_RE.test(path)) return;
		const info = mctx.getSectionInfo(el);
		if (!info) return;
		const layout = layoutOf(path, info.text);
		const r = subSectionRole(layout, info.lineStart, info.lineEnd);
		if (r.role === "hide") {
			el.addClass("vt-subissue-area-hidden");
		} else if (r.role === "card") {
			el.addClass("vt-sub-card-section");
			const b = layout[r.index]!;
			const raw = info.text.slice(b.from, b.cardTo ?? layout[r.index + 1]?.from ?? info.text.length).trimEnd();
			if (r.id !== null) addEntry(cards, path, { id: r.id, el, line: info.lineStart }, mctx);
			const host = el.createDiv();
			render(
				h(ReadingCard, {
					ctx,
					path,
					id: r.id,
					raw,
					open: () => r.id !== null && isSubOpen(ctx.settings.subOpen, path, r.id),
					subscribeOpen: (fn: () => void) => {
						openListeners.add(fn);
						return () => openListeners.delete(fn);
					},
					onToggle: (ids: string[]) => {
						if (r.id === null) return;
						toggleOpen(ctx, path, r.id, ids);
						syncReading(ctx, path);
					},
				}),
				host,
			);
			const child = new MarkdownRenderChild(host);
			child.onunload = () => render(null, host);
			mctx.addChild(child);
		} else if (r.role === "body") {
			addEntry(bodies, path, { id: r.id, el, line: info.lineStart }, mctx);
			el.toggleClass(CLOSED_CLASS, !isSubOpen(ctx.settings.subOpen, path, r.id));
		}
	});
}

// ---------- Live Preview ----------

/** カードの編集は、エディタの文書の項目の範囲だけを置き換える（本文と入力中の状態に触れない。ADR-0161） */
function editorSave(ctx: TaskContext, view: EditorView, path: string, id: string): SaveSub {
	return async (patch) => {
		const text = view.state.doc.toString();
		const r = subHeadChange(path, issueIdOf(path), text, id, patch, parseYaml, new Set(ctx.store.index.members.keys()));
		if (r.change.insert !== text.slice(r.change.from, r.change.to)) view.dispatch({ changes: r.change, userEvent: "input.sub-card" });
		if (r.before.status !== r.after.status) await ctx.writer.afterSubStatusChange(r.after, r.before.status, r.after.status);
	};
}

/** 開閉を切り替える。閉じるとき、カーソルが本文の中にあれば項目のカードの終わりに移してから隠す */
function editorToggle(ctx: TaskContext, view: EditorView, path: string, id: string): void {
	const parent = issueIdOf(path);
	const layout = layoutSubIssues(path, parent, view.state.doc.toString(), parseYaml);
	const wasOpen = isSubOpen(ctx.settings.subOpen, path, id);
	toggleOpen(
		ctx,
		path,
		id,
		layout.flatMap((b) => (b.id ? [b.id] : [])),
	);
	const b = layout.find((x) => x.id === id);
	const inBody = wasOpen && b && b.cardTo !== null && b.bodyFrom !== null && b.bodyTo !== null && view.state.selection.ranges.some((r) => r.from <= b.bodyTo! && r.to >= b.bodyFrom!);
	view.dispatch({ effects: refresh.of(null), ...(inBody ? { selection: { anchor: b!.cardTo! } } : {}) });
	syncReading(ctx, path);
}

/** そのブロックの生の md を見せる（項目の範囲の中、先頭の次にカーソルを置く） */
function showSource(view: EditorView, from: number, cardTo: number): void {
	view.dispatch({ selection: { anchor: Math.min(from + 1, cardTo) }, scrollIntoView: true });
	view.focus();
}

class SubCardWidget extends WidgetType {
	constructor(
		private readonly ctx: TaskContext,
		private readonly path: string,
		/** 読めなかったブロックは null */
		private readonly sub: SubIssue | null,
		private readonly siblings: SubIssue[],
		private readonly open: boolean,
		private readonly raw: string,
		private readonly range: { from: number; cardTo: number },
	) {
		super();
	}

	/** 同じ内容なら DOM に触れない。変わったら、DOM を作り直さず中身だけを更新する（入力中のフォーカスを失わないため） */
	private get signature(): string {
		return [this.path, this.open, this.raw, this.siblings.map((s) => `${s.id}:${s.summary}`).join("|")].join("\n");
	}

	override eq(other: SubCardWidget): boolean {
		return other.signature === this.signature;
	}

	private mount(dom: HTMLElement, view: EditorView): void {
		const { ctx, path, sub } = this;
		const onShowSource = () => showSource(view, this.range.from, this.range.cardTo);
		if (sub === null) {
			render(h(UnreadableCard, { raw: this.raw, onShowSource }), dom);
			return;
		}
		render(
			h(SubCard, {
				ctx,
				sub,
				siblings: this.siblings,
				open: this.open,
				onToggle: () => editorToggle(ctx, view, path, sub.id),
				save: editorSave(ctx, view, path, sub.id),
				delayMs: LIVE_PREVIEW_SAVE_MS,
				onShowSource,
			}),
			dom,
		);
	}

	override toDOM(view: EditorView): HTMLElement {
		const dom = document.createElement("div");
		dom.className = "vt-sub-card-host";
		this.mount(dom, view);
		return dom;
	}

	override updateDOM(dom: HTMLElement, view: EditorView): boolean {
		this.mount(dom, view);
		return true;
	}

	override destroy(dom: HTMLElement): void {
		render(null, dom);
	}

	// 入力欄やボタンの操作はエディタに渡さない
	override ignoreEvent(): boolean {
		return true;
	}
}

interface Built {
	/** 項目のカードと、閉じたサブの本文を隠す置き換え */
	all: DecorationSet;
	/** 隠した本文（カーソルが入らない範囲） */
	folds: DecorationSet;
}

const NONE: Built = { all: Decoration.none, folds: Decoration.none };

function build(ctx: TaskContext, state: EditorState): Built {
	const path = state.field(editorInfoField, false)?.file?.path;
	if (!path || !ISSUE_PATH_RE.test(path) || !state.field(editorLivePreviewField, false)) return NONE;
	const text = state.doc.toString();
	const parent = issueIdOf(path);
	const layout = layoutSubIssues(path, parent, text, parseYaml);
	if (layout.length === 0) return NONE;
	const subs = parseSubIssues(path, parent, text, parseYaml).subs;
	const touches = (from: number, to: number) => state.selection.ranges.some((r) => cursorInside(r, from, to));
	const all: Range<Decoration>[] = [];
	const folds: Range<Decoration>[] = [];
	for (const b of layout) {
		if (b.cardTo === null || b.bodyFrom === null || b.bodyTo === null) continue;
		const sub = b.id === null ? null : (subs.find((s) => s.id === b.id) ?? null);
		const open = sub !== null && isSubOpen(ctx.settings.subOpen, path, sub.id);
		// 閉じたサブは末尾の空行までカードに含める。項目と本文を別々に隠すと空行だけが残る。
		const sectionTo = layout[b.index + 1] ? layout[b.index + 1]!.from - 1 : text.length;
		const collapsed = sub !== null && !open && !touches(b.cardTo, sectionTo);
		const cardTo = collapsed ? sectionTo : b.cardTo;
		// カーソルが項目や閉じた本文にある間は、生の md を見せる
		if (!touches(b.from, cardTo)) {
			all.push(Decoration.replace({ widget: new SubCardWidget(ctx, path, sub, subs, open, text.slice(b.from, b.cardTo), { from: b.from, cardTo: b.cardTo }), block: true }).range(b.from, cardTo));
		}
		if (collapsed && sectionTo > b.cardTo) {
			folds.push(Decoration.replace({ block: true }).range(b.cardTo, sectionTo));
		}
	}
	return { all: Decoration.set(all, true), folds: Decoration.set(folds, true) };
}

interface EditorStickyMeasure {
	path: string;
	b: SubLayout;
	sub: SubIssue;
	offset: number;
	box: ReturnType<typeof stickyBox>;
}

/** Live Preview: 開いたサブの題の行を、スクロール領域の上端に浮かべる（ADR-0161 の追記）。位置は CodeMirror の高さの情報から求める（カードが画面外で DOM になくてもよい） */
function editorSticky(ctx: TaskContext) {
	return ViewPlugin.fromClass(
		class {
			private readonly overlay: StickyOverlay;
			private readonly onScroll = () => this.schedule();
			private memo: { doc: EditorState["doc"]; layout: SubLayout[]; subs: SubIssue[] } | null = null;

			constructor(private readonly view: EditorView) {
				this.overlay = new StickyOverlay(view.dom);
				view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
				this.schedule();
			}

			update(u: ViewUpdate): void {
				if (u.docChanged || u.geometryChanged || u.viewportChanged || u.transactions.some((t) => t.effects.some((e) => e.is(refresh)))) this.schedule();
			}

			private schedule(): void {
				this.view.requestMeasure({ key: this, read: () => this.read(), write: (m) => this.write(m) });
			}

			private read(): EditorStickyMeasure | null {
				const { view } = this;
				const state = view.state;
				const path = state.field(editorInfoField, false)?.file?.path;
				if (!path || !ISSUE_PATH_RE.test(path) || !state.field(editorLivePreviewField, false)) return null;
				if (this.memo?.doc !== state.doc) {
					const text = state.doc.toString();
					const parent = issueIdOf(path);
					this.memo = { doc: state.doc, layout: layoutSubIssues(path, parent, text, parseYaml), subs: parseSubIssues(path, parent, text, parseYaml).subs };
				}
				const { layout, subs } = this.memo;
				const open: { b: SubLayout; sub: SubIssue; region: StickyRegion }[] = [];
				for (const b of layout) {
					if (b.cardTo === null || b.id === null || !isSubOpen(ctx.settings.subOpen, path, b.id)) continue;
					const sub = subs.find((s) => s.id === b.id);
					if (!sub) continue;
					const end = b.bodyFrom !== null && b.bodyTo !== null && b.bodyTo > b.bodyFrom ? b.bodyTo : b.cardTo;
					open.push({ b, sub, region: { top: view.lineBlockAt(b.from).top, bottom: view.lineBlockAt(end).bottom } });
				}
				if (open.length === 0) return null;
				const rect = view.scrollDOM.getBoundingClientRect();
				const pick = pickSticky(
					open.map((o) => o.region),
					rect.top - view.documentTop,
					this.overlay.rowHeight,
				);
				if (pick === null) return null;
				const host = view.contentDOM.querySelector<HTMLElement>(".vt-sub-card-host");
				let card: { left: number; right: number };
				if (host) {
					card = host.getBoundingClientRect();
				} else {
					const r = view.contentDOM.getBoundingClientRect();
					const cs = getComputedStyle(view.contentDOM);
					card = { left: r.left + (parseFloat(cs.paddingLeft) || 0), right: r.right - (parseFloat(cs.paddingRight) || 0) };
				}
				const box = stickyBox(view.scrollDOM, card);
				const o = open[pick.index]!;
				return { path, b: o.b, sub: o.sub, offset: pick.offset, box };
			}

			private write(m: EditorStickyMeasure | null): void {
				if (m === null) return this.overlay.hide();
				const { view } = this;
				const { path, b, sub } = m;
				this.overlay.show(
					`${path}\n${JSON.stringify(sub)}`,
					() =>
						h(StickySubRow, {
							ctx,
							sub,
							save: editorSave(ctx, view, path, sub.id),
							onToggle: () => {
								editorToggle(ctx, view, path, sub.id);
								// 閉じると本文が消えるので、そのカードを上端に出す（読んでいた位置を見失わない）
								view.dispatch({ effects: EditorView.scrollIntoView(b.from, { y: "start" }) });
							},
						}),
					m.box,
					m.offset,
				);
			}

			destroy(): void {
				this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
				this.overlay.destroy();
			}
		},
	);
}

/**
 * issue の md のサブの項目を、サブごとのカードに描く（ADR-0161。ADR-0158 の「領域全体を 1 つのウィジェットにする」を置き換える）。
 * - Live Preview: 項目のブロック（マーカーから `-->` まで）をカードに置き換える。本文は置き換えず、issue 本体の Live Preview が描く。
 *   閉じたサブの本文は隠す。ブロックの中にカーソルがある間は、生の md を見せる。ソースモードでは描き替えない
 * - Reading: マーカーを含むセクションにカードを描き、閉じたサブの本文のセクションを隠す
 * - どちらも、開いたサブの題の行を、スクロールで上端を越えたら、そのサブの本文の終わりまで上端に浮かべる
 */
export function installSubCards(ctx: TaskContext, plugin: Plugin): void {
	const field = StateField.define<Built>({
		create: (state) => build(ctx, state),
		update: (_value, tr) => build(ctx, tr.state),
		provide: (f) => [EditorView.decorations.from(f, (v) => v.all), EditorView.atomicRanges.of((view) => view.state.field(f).folds)],
	});
	plugin.registerEditorExtension([field, editorSticky(ctx)]);
	installReading(ctx, plugin);
}
