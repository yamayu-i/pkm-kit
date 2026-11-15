import { StateEffect, StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { MarkdownRenderChild, editorInfoField, editorLivePreviewField, parseYaml, type Plugin } from "obsidian";
import { h, render } from "preact";
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
import { ReadingCard, SubCard, UnreadableCard, issueIdOf, type SaveSub } from "../obsidian/sub-card";

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
const bodies = new Map<string, Set<{ id: string; el: HTMLElement }>>();

/** Reading で、開閉を本文のセクションに反映する（描き直さずに class を付け外しする） */
function syncReading(ctx: TaskContext, path: string): void {
	for (const b of bodies.get(path) ?? []) b.el.toggleClass(CLOSED_CLASS, !isSubOpen(ctx.settings.subOpen, path, b.id));
}

function installReading(ctx: TaskContext, plugin: Plugin): void {
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
			const host = el.createDiv();
			render(
				h(ReadingCard, {
					ctx,
					path,
					id: r.id,
					raw,
					open: () => r.id !== null && isSubOpen(ctx.settings.subOpen, path, r.id),
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
			const entry = { id: r.id, el };
			const set = bodies.get(path) ?? new Set();
			bodies.set(path, set);
			set.add(entry);
			el.toggleClass(CLOSED_CLASS, !isSubOpen(ctx.settings.subOpen, path, r.id));
			const child = new MarkdownRenderChild(el);
			child.onunload = () => set.delete(entry);
			mctx.addChild(child);
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

/**
 * issue の md のサブの項目を、サブごとのカードに描く（ADR-0161。ADR-0158 の「領域全体を 1 つのウィジェットにする」を置き換える）。
 * - Live Preview: 項目のブロック（マーカーから `-->` まで）をカードに置き換える。本文は置き換えず、issue 本体の Live Preview が描く。
 *   閉じたサブの本文は隠す。ブロックの中にカーソルがある間は、生の md を見せる。ソースモードでは描き替えない
 * - Reading: マーカーを含むセクションにカードを描き、閉じたサブの本文のセクションを隠す
 */
export function installSubCards(ctx: TaskContext, plugin: Plugin): void {
	const field = StateField.define<Built>({
		create: (state) => build(ctx, state),
		update: (_value, tr) => build(ctx, tr.state),
		provide: (f) => [EditorView.decorations.from(f, (v) => v.all), EditorView.atomicRanges.of((view) => view.state.field(f).folds)],
	});
	plugin.registerEditorExtension(field);
	installReading(ctx, plugin);
}
