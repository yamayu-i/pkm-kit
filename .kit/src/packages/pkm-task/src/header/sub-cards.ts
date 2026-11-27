import { StateEffect, StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { MarkdownRenderChild, MarkdownView, editorInfoField, editorLivePreviewField, parseYaml, type Plugin } from "obsidian";
import { h, render } from "preact";
import { pickSticky, toggleScrollDelta, type StickyRegion } from "../core/sub-sticky";
import {
	cursorInside,
	forgetSubOpen,
	isDone,
	isSubOpen,
	layoutSubIssues,
	openSub,
	parseSubIssues,
	subHeadChange,
	subSectionRole,
	toggleSubOpen,
	type SubIssue,
	type SubLayout,
	type SubOpenMap,
} from "../core/sub-issue";
import type { TaskContext } from "../obsidian/context";
import { ReadingCard, StickySubRow, SubCard, UnreadableCard, issueIdOf, type SaveSub } from "../obsidian/sub-card";
import { ClosedToggle, closedLabel } from "./ClosedToggle";
import { setSubRevealer } from "./sub-reveal";
import { StickyOverlay, stickyBox } from "./sub-sticky-overlay";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;

/** Live Preview: 題は、入力が止まって 600 ms で保存する（ADR-0161） */
const LIVE_PREVIEW_SAVE_MS = 600;

/** カードの描き直しだけを頼む（開閉を変えたとき） */
const refresh = StateEffect.define<null>();

/**
 * 終わったサブ（closed / canceled）を出しているノートのパス（ADR-0181）。保存しない（開き直すと隠れる。ヘッダーと同じ）。
 * 終わったサブは md の末尾に集まるので、本文では隠して「Show N closed」で出す
 */
const closedShown = new Set<string>();
/**
 * 開いているサブ（ADR-0197）。issue ごとに多くても 1 つ。メモリだけで持ち、保存しない。
 * Live Preview と Reading、同じノートを開いた 2 つのペインで共有する。そのノートを表示するペインがなくなったら忘れる
 */
let subOpen: SubOpenMap = new Map();

/** 検査用: 開いているサブを置き換える */
export function setSubOpenForTest(map: SubOpenMap): void {
	subOpen = map;
}

/** 出す・隠すを変えたことを、Reading のボタンに知らせる */
const closedListeners = new Set<() => void>();

/** 終わったサブの表示を切り替える。Live Preview のエディタは描き直しを頼む */
function toggleClosed(ctx: TaskContext, path: string, view?: EditorView): void {
	if (!closedShown.delete(path)) closedShown.add(path);
	view?.dispatch({ effects: refresh.of(null) });
	syncReading(ctx, path);
}

/** 開いているサブを切り替える。開くと、そのノートでほかに開いていたサブは閉じる（ADR-0197） */
function toggleOpen(path: string, id: string): void {
	subOpen = toggleSubOpen(subOpen, path, id);
}

/** どのペインでも表示していないノートの、開いているサブと「Show N closed」を忘れる（ADR-0197） */
function forgetHidden(ctx: TaskContext): void {
	const shown = new Set<string>();
	for (const leaf of ctx.app.workspace.getLeavesOfType("markdown")) {
		const path = leaf.view instanceof MarkdownView ? leaf.view.file?.path : undefined;
		if (path) shown.add(path);
	}
	subOpen = forgetSubOpen(subOpen, shown);
	for (const path of [...closedShown]) if (!shown.has(path)) closedShown.delete(path);
}

// ---------- Reading ----------

const CLOSED_CLASS = "vt-sub-body-closed";
const AREA_HIDDEN = "vt-subissue-area-hidden";
/** 開いたサブの本文と、次のサブの題の行の間に余白を置く（Reading は本文のセクション、Live Preview は本文の最後の行に付ける） */
const BODY_SECTION = "vt-sub-body-section";
const BODY_END = Decoration.line({ class: "vt-sub-body-end" });

/** Reading で描いたセクション。scroller は、DOM にあるのを見たときのスクロール領域（画面外では DOM から外れるため覚えておく） */
interface SectionEntry {
	id: string;
	el: HTMLElement;
	line: number;
	scroller?: HTMLElement;
	/** 終わったサブのもの。出す・隠すの切り替えで class を付け外しする（ADR-0181） */
	done?: boolean;
	/** カードのセクションのうち、終わったときに隠す要素（ボタンは隠さない） */
	target?: HTMLElement;
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

/**
 * 開閉を、そのノートを表示しているほかのペインに反映する。Reading は描き直さずに class を付け外しし、
 * Live Preview のエディタ（except のほか）は描き直しを頼む（同じノートの 2 つのペインで開いているサブを共有する。ADR-0197）
 */
function syncReading(ctx: TaskContext, path: string, except?: EditorView): void {
	for (const v of liveViews) if (v !== except && v.state.field(editorInfoField, false)?.file?.path === path) v.dispatch({ effects: refresh.of(null) });
	const shown = closedShown.has(path);
	for (const b of bodies.get(path) ?? []) b.el.toggleClass(CLOSED_CLASS, !isSubOpen(subOpen, path, b.id) || (b.done === true && !shown));
	for (const c of cards.get(path) ?? []) if (c.done) (c.target ?? c.el).toggleClass(AREA_HIDDEN, !shown);
	for (const fn of openListeners) fn();
	for (const fn of closedListeners) fn();
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

/** Reading で、カードの DOM が描かれるのを待つフレーム数（行番号でスクロールした後、遅延描画で描かれるまで） */
const READING_CARD_WAIT_FRAMES = 30;

/**
 * Reading で、そのサブのカードの題をスクロール領域の上端に出す。カードが DOM になければ、行番号で近くまでスクロールしてから、
 * 描かれるまで何フレームか待って合わせる（遅延描画は 1 フレームで終わらないことがある）
 */
function readingScrollToCard(ctx: TaskContext, scroller: HTMLElement, path: string, id: string, line: number): void {
	const el = readingCardEl(path, id, scroller);
	if (el) return keepReadingScroll(scroller, el, 0, true, 3);
	const view = ctx.app.workspace
		.getLeavesOfType("markdown")
		.map((l) => l.view)
		.find((v): v is MarkdownView => v instanceof MarkdownView && v.previewMode.containerEl.contains(scroller));
	view?.previewMode.applyScroll(line);
	const wait = (frames: number) =>
		window.requestAnimationFrame(() => {
			const found = readingCardEl(path, id, scroller);
			if (found) keepReadingScroll(scroller, found, 0, true, 3);
			else if (frames > 1) wait(frames - 1);
		});
	wait(READING_CARD_WAIT_FRAMES);
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
				if (!isSubOpen(subOpen, path, card.id)) continue;
				if (card.done && !closedShown.has(path)) continue;
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
						toggleOpen(f.path, sub.id);
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
	let subsMemo: { path: string; text: string; subs: SubIssue[] } | null = null;
	const subsOf = (path: string, text: string): SubIssue[] => {
		if (subsMemo?.path !== path || subsMemo.text !== text) subsMemo = { path, text, subs: parseSubIssues(path, issueIdOf(path), text, parseYaml).subs };
		return subsMemo.subs;
	};
	plugin.registerMarkdownPostProcessor((el, mctx) => {
		const path = mctx.sourcePath;
		if (!ISSUE_PATH_RE.test(path)) return;
		const info = mctx.getSectionInfo(el);
		if (!info) return;
		const layout = layoutOf(path, info.text);
		const r = subSectionRole(layout, info.lineStart, info.lineEnd);
		const subs = r.role === "card" || r.role === "body" ? subsOf(path, info.text) : [];
		const doneIds = subs.filter(isDone).map((s) => s.id);
		const isDoneId = (id: string | null) => id !== null && doneIds.includes(id);
		if (r.role === "hide") {
			el.addClass(AREA_HIDDEN);
		} else if (r.role === "card") {
			el.addClass("vt-sub-card-section");
			const b = layout[r.index]!;
			const raw = info.text.slice(b.from, b.cardTo ?? layout[r.index + 1]?.from ?? info.text.length).trimEnd();
			const done = isDoneId(r.id);
			// 終わったサブの最初の 1 つに「Show N closed」を置く（終わったサブは末尾に集まる。ADR-0181）
			const toggleHost = done && r.id === doneIds[0] ? el.createDiv() : null;
			const host = el.createDiv();
			if (r.id !== null) addEntry(cards, path, { id: r.id, el, line: info.lineStart, done, target: toggleHost ? host : el }, mctx);
			if (done) (toggleHost ? host : el).toggleClass(AREA_HIDDEN, !closedShown.has(path));
			if (toggleHost) {
				render(
					h(ClosedToggle, {
						count: doneIds.length,
						shown: () => closedShown.has(path),
						subscribe: (fn: () => void) => {
							closedListeners.add(fn);
							return () => closedListeners.delete(fn);
						},
						onToggle: () => toggleClosed(ctx, path),
					}),
					toggleHost,
				);
				const toggleChild = new MarkdownRenderChild(toggleHost);
				toggleChild.onunload = () => render(null, toggleHost);
				mctx.addChild(toggleChild);
			}
			render(
				h(ReadingCard, {
					ctx,
					path,
					id: r.id,
					raw,
					open: () => r.id !== null && isSubOpen(subOpen, path, r.id),
					subscribeOpen: (fn: () => void) => {
						openListeners.add(fn);
						return () => openListeners.delete(fn);
					},
					onToggle: () => {
						if (r.id === null) return;
						// 押した題の行の位置を保つ（ADR-0179）。ほかのサブが閉じて押した行が動いても戻す（ADR-0197）
						const before = el.getBoundingClientRect().top;
						const scroller = readingScroller(el);
						toggleOpen(path, r.id);
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
			const done = isDoneId(r.id);
			el.addClass(BODY_SECTION);
			addEntry(bodies, path, { id: r.id, el, line: info.lineStart, done }, mctx);
			el.toggleClass(CLOSED_CLASS, !isSubOpen(subOpen, path, r.id) || (done && !closedShown.has(path)));
		}
	});
}

// ---------- Live Preview ----------

/** カードの編集は、エディタの文書の項目の範囲だけを置き換える（本文と入力中の状態に触れない。ADR-0161） */
function editorSave(ctx: TaskContext, view: EditorView, path: string, id: string): SaveSub {
	return async (patch) => {
		const text = view.state.doc.toString();
		// 期間の規則（ADR-0210）。ファイルに書くとき（updateSub）と同じ検査
		const current = parseSubIssues(path, issueIdOf(path), text, parseYaml).subs.find((s) => s.id === id) ?? null;
		ctx.writer.assertSubPeriod(issueIdOf(path), current, patch);
		const r = subHeadChange(path, issueIdOf(path), text, id, patch, parseYaml, new Set(ctx.store.index.members.keys()));
		// status が終わりに変わるときは、項目の書き換えとブロックの末尾への移動を 1 回で行う（ADR-0181）
		if (r.changes.length > 1 || r.change.insert !== text.slice(r.change.from, r.change.to)) view.dispatch({ changes: r.changes, userEvent: "input.sub-card" });
		if (r.before.status !== r.after.status) await ctx.writer.afterSubStatusChange(r.after, r.before.status, r.after.status);
	};
}

/** Live Preview の、文書の位置の行の上端（画面の座標） */
function editorTop(view: EditorView, pos: number): number {
	return view.lineBlockAt(pos).top + view.documentTop;
}

/** 題の行の位置を測って、ずれた分だけスクロールを戻す（1 回） */
function correctEditorScroll(view: EditorView, pos: number, before: number, floating: boolean): void {
	view.requestMeasure({
		read: () => toggleScrollDelta(before, editorTop(view, pos), view.scrollDOM.getBoundingClientRect().top, floating),
		write: (d) => {
			if (d !== 0) view.scrollDOM.scrollTop += d;
		},
	});
}

/**
 * 開閉で描き直した後に、題の行の位置を戻す（ADR-0179）。
 * CodeMirror は計測の最後に、上端の行の位置を保つように自分でもスクロールを直す。同じ計測の中で直すと二重にかかることがあるので、
 * 次の描画で、CodeMirror の補正が済んだ位置からもう一度確かめる。画面外の高さの見積もりのずれもここで直る
 */
function keepEditorScroll(view: EditorView, pos: number, before: number, floating: boolean): void {
	if (!floating) correctEditorScroll(view, pos, before, floating);
	window.requestAnimationFrame(() => correctEditorScroll(view, pos, before, floating));
}

/**
 * 開閉を切り替える。開くと、ほかに開いていたサブは閉じる（ADR-0197）。閉じるサブの本文の中にカーソルがあれば、項目のカードの終わりに移してから隠す。
 * 押した題の行の位置を保つ。上端に浮かんだ行から閉じたとき（floating）は、そのカードの題を上端に出す（ADR-0179）
 */
function editorToggle(ctx: TaskContext, view: EditorView, path: string, id: string, floating = false): void {
	const parent = issueIdOf(path);
	const layout = layoutSubIssues(path, parent, view.state.doc.toString(), parseYaml);
	// 閉じるサブ: 押したサブが開いていればそれ、閉じていれば前に開いていたサブ
	const closing = isSubOpen(subOpen, path, id) ? id : (subOpen.get(path) ?? null);
	toggleOpen(path, id);
	const b = layout.find((x) => x.id === id);
	const c = closing === null ? undefined : layout.find((x) => x.id === closing);
	const before = b ? editorTop(view, b.from) : 0;
	const inBody = c && c.cardTo !== null && c.bodyFrom !== null && c.bodyTo !== null && view.state.selection.ranges.some((r) => r.from <= c.bodyTo! && r.to >= c.bodyFrom!);
	// 浮かんだ行から閉じたときは、題を上端に出すのを CodeMirror に任せる（上端の行を保つ補正と重ならない）
	const effects = floating && b ? [refresh.of(null), EditorView.scrollIntoView(b.from, { y: "start", yMargin: 0 })] : refresh.of(null);
	view.dispatch({ effects, ...(inBody ? { selection: { anchor: c!.cardTo! } } : {}) });
	syncReading(ctx, path, view);
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

/** Live Preview の「Show N closed / Hide closed」（ADR-0181） */
class ClosedToggleWidget extends WidgetType {
	constructor(
		private readonly ctx: TaskContext,
		private readonly path: string,
		private readonly count: number,
		private readonly shown: boolean,
	) {
		super();
	}

	override eq(other: ClosedToggleWidget): boolean {
		return other.path === this.path && other.count === this.count && other.shown === this.shown;
	}

	override toDOM(view: EditorView): HTMLElement {
		const dom = document.createElement("div");
		dom.className = "vt-sub-closed-host";
		const button = dom.createEl("button", { cls: "vt-text-button vt-sub-closed-toggle", text: closedLabel(this.count, this.shown) });
		button.type = "button";
		button.addEventListener("click", () => toggleClosed(this.ctx, this.path, view));
		return dom;
	}

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
	const shownClosed = closedShown.has(path);
	const doneCount = subs.filter(isDone).length;
	let toggled = false;
	for (const b of layout) {
		if (b.cardTo === null || b.bodyFrom === null || b.bodyTo === null) continue;
		const sub = b.id === null ? null : (subs.find((s) => s.id === b.id) ?? null);
		const open = sub !== null && isSubOpen(subOpen, path, sub.id);
		// 閉じたサブは末尾の空行までカードに含める。項目と本文を別々に隠すと空行だけが残る。
		const sectionTo = layout[b.index + 1] ? layout[b.index + 1]!.from - 1 : text.length;
		if (sub !== null && isDone(sub)) {
			// 終わったサブ（ADR-0181）: 最初の 1 つの前に「Show N closed」を置き、押すまでカードと本文を隠す。カーソルがある間は生の md を見せる
			if (!toggled) {
				toggled = true;
				all.push(Decoration.widget({ widget: new ClosedToggleWidget(ctx, path, doneCount, shownClosed), block: true, side: -1 }).range(b.from));
			}
			if (!shownClosed && !touches(b.from, sectionTo)) {
				all.push(Decoration.replace({ block: true }).range(b.from, sectionTo));
				folds.push(Decoration.replace({ block: true }).range(b.from, sectionTo));
				continue;
			}
		}
		const collapsed = sub !== null && !open && !touches(b.cardTo, sectionTo);
		const cardTo = collapsed ? sectionTo : b.cardTo;
		// カーソルが項目や閉じた本文にある間は、生の md を見せる
		if (!touches(b.from, cardTo)) {
			all.push(Decoration.replace({ widget: new SubCardWidget(ctx, path, sub, subs, open, text.slice(b.from, b.cardTo), { from: b.from, cardTo: b.cardTo }), block: true }).range(b.from, cardTo));
		}
		if (collapsed && sectionTo > b.cardTo) {
			folds.push(Decoration.replace({ block: true }).range(b.cardTo, sectionTo));
		}
		if (!collapsed && layout[b.index + 1] && b.bodyTo > b.bodyFrom) {
			all.push(BODY_END.range(state.doc.lineAt(b.bodyTo).from));
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
					if (b.cardTo === null || b.id === null || !isSubOpen(subOpen, path, b.id)) continue;
					const sub = subs.find((s) => s.id === b.id);
					if (!sub || (isDone(sub) && !closedShown.has(path))) continue;
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
	// 表示しているペインがなくなったノートの開閉を忘れる（タブを閉じた、同じタブで別のノートへ移った。ADR-0197）。DOM のない検査の環境では登録しない
	if (typeof document !== "undefined") {
		plugin.registerEvent(ctx.app.workspace.on("layout-change", () => forgetHidden(ctx)));
		plugin.registerEvent(ctx.app.workspace.on("file-open", () => forgetHidden(ctx)));
	}
	plugin.register(() => {
		subOpen = new Map();
	});
	installReading(ctx, plugin);
}

/** 「Open note」で、ノートのビューやカードがまだ描かれていないときに待つフレーム数（ノートを開いた直後に呼ばれるため） */
const REVEAL_WAIT_FRAMES = 30;
/** 題を上端に出した後に、位置を確かめ直すフレーム数（Obsidian がノートを開いた後にスクロール位置を戻すことがあるため） */
const REVEAL_PIN_FRAMES = 3;

/**
 * サブを開き（ほかは閉じる。ADR-0197）、下部のカードの題を画面の上端に出す（「Open note」。ADR-0179）。
 * そのノートを開いているビュー（今のビューを優先）の表示に合わせて、Live Preview ではエディタ、Reading では描いたセクションを動かす
 */
function revealSubIn(ctx: TaskContext, sub: SubIssue): void {
	const { path, id } = sub;
	// 終わったサブは隠れているので、出す（ADR-0181）
	if (isDone(sub)) closedShown.add(path);
	const closing = subOpen.get(path) ?? null;
	subOpen = openSub(subOpen, path, id);
	syncReading(ctx, path);
	scrollToRevealed(ctx, sub, closing, REVEAL_WAIT_FRAMES);
}

/** そのノートを表示しているビュー（今のビューを優先） */
function markdownViewOf(ctx: TaskContext, path: string): MarkdownView | undefined {
	const active = ctx.app.workspace.getActiveViewOfType(MarkdownView);
	if (active?.file?.path === path) return active;
	return ctx.app.workspace
		.getLeavesOfType("markdown")
		.map((l) => l.view)
		.find((v): v is MarkdownView => v instanceof MarkdownView && v.file?.path === path);
}

/** 開いたサブのカードの題を上端に出す。ビューやエディタがまだなければ、次のフレームで探し直す（waits フレームまで） */
function scrollToRevealed(ctx: TaskContext, sub: SubIssue, closing: string | null, waits: number): void {
	const { path, id } = sub;
	const retry = () => {
		if (waits > 0) window.requestAnimationFrame(() => scrollToRevealed(ctx, sub, closing, waits - 1));
	};
	const view = markdownViewOf(ctx, path);
	if (!view) return retry();
	if (view.getMode() === "preview") {
		const scroller = readingScroller(view.previewMode.containerEl);
		const b = layoutSubIssues(path, sub.parent, ctx.store.text(path) ?? "", parseYaml).find((x) => x.id === id);
		if (!scroller || !b) return retry();
		readingScrollToCard(ctx, scroller, path, id, b.startLine);
		return;
	}
	const ev = [...liveViews].find((v) => view.containerEl.contains(v.dom) && v.state.field(editorInfoField, false)?.file?.path === path);
	if (!ev) return retry();
	const layout = layoutSubIssues(path, sub.parent, ev.state.doc.toString(), parseYaml);
	const b = layout.find((x) => x.id === id);
	if (!b) return;
	// 閉じたサブの本文の中にカーソルがあれば、そのカードの終わりに移してから隠す（editorToggle と同じ）
	const c = closing === null || closing === id ? undefined : layout.find((x) => x.id === closing);
	const inBody = c && c.cardTo !== null && c.bodyFrom !== null && c.bodyTo !== null && ev.state.selection.ranges.some((r) => r.from <= c.bodyTo! && r.to >= c.bodyFrom!);
	ev.dispatch({ effects: [refresh.of(null), EditorView.scrollIntoView(b.from, { y: "start", yMargin: 0 })], ...(inBody ? { selection: { anchor: c!.cardTo! } } : {}) });
	pinEditorTop(ev, b.from, REVEAL_PIN_FRAMES);
}

/**
 * CodeMirror のスクロールの後に、題の行が上端からずれていれば直す。次のフレームから frames 回確かめる
 * （画面外の高さの見積もりのずれと、ノートを開いた直後の Obsidian のスクロールの復元を直す）
 */
function pinEditorTop(view: EditorView, pos: number, frames: number): void {
	if (frames <= 0) return;
	window.requestAnimationFrame(() => {
		if (pos > view.state.doc.length) return;
		correctEditorScroll(view, pos, 0, true);
		pinEditorTop(view, pos, frames - 1);
	});
}
