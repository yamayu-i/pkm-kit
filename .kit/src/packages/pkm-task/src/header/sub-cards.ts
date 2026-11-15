import { StateEffect, StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { MarkdownRenderChild, MarkdownView, editorInfoField, editorLivePreviewField, parseYaml, type Plugin } from "obsidian";
import { h, render } from "preact";
import { pickSticky, toggleScrollDelta, type StickyRegion } from "../core/sub-sticky";
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
import { setSubRevealer } from "./sub-reveal";
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

/** 開閉で描き直した後に、題の行の位置を戻す（ADR-0179）。Reading の遅延描画で位置が変わるので、次の描画でもう一度確かめる */
function keepReadingScroll(scroller: HTMLElement, el: HTMLElement, before: number, floating: boolean, tries = 2): void {
	window.requestAnimationFrame(() => {
		if (!el.isConnected) return;
		const d = toggleScrollDelta(before, el.getBoundingClientRect().top, scroller.getBoundingClientRect().top, floating);
		if (d !== 0) scroller.scrollTop += d;
		if (tries > 1) keepReadingScroll(scroller, el, before, floating, tries - 1);
	});
}

/** Reading で、そのサブのカードのセクション（DOM にあるもの） */
function readingCardEl(path: string, id: string, scroller: HTMLElement): HTMLElement | null {
	for (const c of cards.get(path) ?? []) if (c.id === id && c.el.isConnected && scroller.contains(c.el)) return c.el;
	return null;
}

/** Reading で、そのサブのカードの題をスクロール領域の上端に出す。カードが DOM になければ、行番号で近くまでスクロールしてから合わせる */
function readingScrollToCard(ctx: TaskContext, scroller: HTMLElement, path: string, id: string, line: number): void {
	const el = readingCardEl(path, id, scroller);
	if (el) return keepReadingScroll(scroller, el, 0, true);
	const view = ctx.app.workspace
		.getLeavesOfType("markdown")
		.map((l) => l.view)
		.find((v): v is MarkdownView => v instanceof MarkdownView && v.previewMode.containerEl.contains(scroller));
	view?.previewMode.applyScroll(line);
	window.requestAnimationFrame(() => {
		const found = readingCardEl(path, id, scroller);
		if (found) keepReadingScroll(scroller, found, 0, true);
	});
}

/** Reading のスクロール領域 */
function readingScroller(el: HTMLElement): HTMLElement | null {
	return el.matches(".markdown-preview-view") ? el : (el.closest<HTMLElement>(".markdown-preview-view") ?? el.querySelector<HTMLElement>(".markdown-preview-view"));
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
						// 閉じると本文が消えるので、そのカードの題を上端に出す（ADR-0179）
						readingScrollToCard(ctx, scroller, f.path, sub.id, f.card.line);
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
						// 押した題の行の位置を保つ（ADR-0179）
						const before = el.getBoundingClientRect().top;
						const scroller = readingScroller(el);
						toggleOpen(ctx, path, r.id, ids);
						syncReading(ctx, path);
						if (scroller) keepReadingScroll(scroller, el, before, false);
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

/** Live Preview の、文書の位置の行の上端（画面の座標） */
function editorTop(view: EditorView, pos: number): number {
	return view.lineBlockAt(pos).top + view.documentTop;
}

/** 開閉で描き直した後に、題の行の位置を戻す（ADR-0179）。画面外の高さは見積もりなので、描いた後にもう一度確かめる */
function keepEditorScroll(view: EditorView, pos: number, before: number, floating: boolean, tries = 2): void {
	view.requestMeasure({
		read: () => toggleScrollDelta(before, editorTop(view, pos), view.scrollDOM.getBoundingClientRect().top, floating),
		write: (d) => {
			if (d === 0) return;
			view.scrollDOM.scrollTop += d;
			if (tries > 1) keepEditorScroll(view, pos, before, floating, tries - 1);
		},
	});
}

/**
 * 開閉を切り替える。閉じるとき、カーソルが本文の中にあれば項目のカードの終わりに移してから隠す。
 * 押した題の行の位置を保つ。上端に浮かんだ行から閉じたとき（floating）は、そのカードの題を上端に出す（ADR-0179）
 */
function editorToggle(ctx: TaskContext, view: EditorView, path: string, id: string, floating = false): void {
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
	const before = b ? editorTop(view, b.from) : 0;
	const inBody = wasOpen && b && b.cardTo !== null && b.bodyFrom !== null && b.bodyTo !== null && view.state.selection.ranges.some((r) => r.from <= b.bodyTo! && r.to >= b.bodyFrom!);
	view.dispatch({ effects: refresh.of(null), ...(inBody ? { selection: { anchor: b!.cardTo! } } : {}) });
	syncReading(ctx, path);
	if (b) keepEditorScroll(view, b.from, before, floating);
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

/** 開いている Live Preview のエディタ（「Open note」でカードを探すため） */
const liveViews = new Set<EditorView>();

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
				liveViews.add(view);
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
				const { path, sub } = m;
				this.overlay.show(
					`${path}\n${JSON.stringify(sub)}`,
					() =>
						h(StickySubRow, {
							ctx,
							sub,
							save: editorSave(ctx, view, path, sub.id),
							// 閉じると本文が消えるので、そのカードの題を上端に出す（読んでいた位置を見失わない）
							onToggle: () => editorToggle(ctx, view, path, sub.id, true),
						}),
					m.box,
					m.offset,
				);
			}

			destroy(): void {
				liveViews.delete(this.view);
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
	setSubRevealer((sub) => revealSubIn(ctx, sub));
	plugin.register(() => setSubRevealer(null));
	installReading(ctx, plugin);
}

/**
 * サブを開き、下部のカードの題を画面の上端に出す（「Open note」。ADR-0179）。
 * そのノートを開いているビュー（今のビューを優先）の表示に合わせて、Live Preview ではエディタ、Reading では描いたセクションを動かす
 */
function revealSubIn(ctx: TaskContext, sub: SubIssue): void {
	const { path, id } = sub;
	if (!isSubOpen(ctx.settings.subOpen, path, id)) {
		toggleOpen(
			ctx,
			path,
			id,
			ctx.store.index.subs(sub.parent).map((s) => s.id),
		);
	}
	syncReading(ctx, path);
	const active = ctx.app.workspace.getActiveViewOfType(MarkdownView);
	const view =
		active?.file?.path === path
			? active
			: ctx.app.workspace
					.getLeavesOfType("markdown")
					.map((l) => l.view)
					.find((v): v is MarkdownView => v instanceof MarkdownView && v.file?.path === path);
	if (!view) return;
	if (view.getMode() === "preview") {
		const scroller = readingScroller(view.previewMode.containerEl);
		const b = layoutSubIssues(path, sub.parent, ctx.store.text(path) ?? "", parseYaml).find((x) => x.id === id);
		if (scroller && b) readingScrollToCard(ctx, scroller, path, id, b.startLine);
		return;
	}
	const ev = [...liveViews].find((v) => view.containerEl.contains(v.dom));
	if (!ev) return;
	const b = layoutSubIssues(path, sub.parent, ev.state.doc.toString(), parseYaml).find((x) => x.id === id);
	if (!b) return;
	ev.dispatch({ effects: [refresh.of(null), EditorView.scrollIntoView(b.from, { y: "start" })] });
}
