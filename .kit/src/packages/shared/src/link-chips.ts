import { StateEffect, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { Keymap, MarkdownRenderChild, editorInfoField, editorLivePreviewField, type App, type Plugin } from "obsidian";
import { findMarkdownLinks, splitLinkTarget } from "./link-query.ts";

/**
 * 本文の Markdown リンクのインラインビュー（ADR-0194）。リンクを見つけ、Live Preview と Reading で描き替え、押したら開く。
 * どう描くか（チップに置き換えるか、前に印を足すか）は、プラグインごとの resolve が決める
 */

export interface ChipTarget {
	/** リンク先のパス（デコードしたもの。アンカーを除く。相対のこともある） */
	path: string;
	/** `#` の後ろ。なければ空 */
	anchor: string;
	/** リンクの文字 */
	text: string;
	/** リンクを書いたノートのパス */
	source: string;
}

export interface LinkChip {
	/** replace: リンクをチップに置き換える。before: リンクはそのままで、前に印を足す */
	mode: "replace" | "before";
	/** 描く中身が同じなら同じ値（Live Preview で DOM を作り直さないため） */
	key: string;
	render(el: HTMLElement): void;
	/** 押したときに開くパス（replace のとき） */
	open?: string;
	/**
	 * 押してノートを開いた後に呼ぶ（サブへのリンクで、そのサブを開いて上端に出す。ADR-0197）。
	 * Reading では、これがあるときだけ、Obsidian の代わりにリンクを開く（アンカーを Obsidian に渡しても、行き先がないため）
	 */
	onOpened?: () => void;
}

export interface LinkChipOptions {
	resolve(target: ChipTarget): LinkChip | null;
	/** 描き直すきっかけ（索引の変更など）。解除する関数を返す */
	subscribe(fn: () => void): () => void;
}

/** Vault ルートからのパスとして探し、なければ、リンクを書いたノートからの相対で探す */
export function resolveVaultPath(app: App, path: string, source: string): string | null {
	if (path === "") return null;
	if (app.vault.getFileByPath(path)) return path;
	return app.metadataCache.getFirstLinkpathDest(path, source)?.path ?? null;
}

function openPath(app: App, path: string, source: string, evt: MouseEvent, onOpened?: () => void): void {
	void app.workspace
		.openLinkText(path, source, Keymap.isModEvent(evt))
		.then(() => onOpened?.())
		.catch((e: unknown) => console.error(e));
}

class ChipWidget extends WidgetType {
	readonly chip: LinkChip;
	readonly app: App;
	readonly source: string;
	constructor(chip: LinkChip, app: App, source: string) {
		super();
		this.chip = chip;
		this.app = app;
		this.source = source;
	}

	override eq(other: ChipWidget): boolean {
		return other.chip.key === this.chip.key && other.chip.mode === this.chip.mode;
	}

	override toDOM(): HTMLElement {
		const el = document.createElement("span");
		el.className = `vt-link-chip is-${this.chip.mode}`;
		this.chip.render(el);
		if (this.chip.mode === "replace") {
			el.setAttribute("role", "link");
			el.addEventListener("mousedown", (e) => e.preventDefault());
			el.addEventListener("click", (e) => {
				e.preventDefault();
				openPath(this.app, this.chip.open ?? "", this.source, e, this.chip.onOpened);
			});
		}
		return el;
	}

	override ignoreEvent(): boolean {
		// チップの上の押下は、エディタにカーソルを移させない（押すと開く）
		return this.chip.mode === "replace";
	}
}

/** 選択がリンクの範囲に触れているか（触れていれば、生の md を見せる） */
function touches(state: EditorState, from: number, to: number): boolean {
	return state.selection.ranges.some((r) => r.from <= to && r.to >= from);
}

function buildDecorations(view: EditorView, app: App, opts: LinkChipOptions): DecorationSet {
	return chipDecorations(view.state, view.visibleRanges, app, opts);
}

/** Live Preview の装飾。ソースモードでは何もしない。visible は描く範囲（画面に見えている範囲） */
export function chipDecorations(state: EditorState, visible: readonly { from: number; to: number }[], app: App, opts: LinkChipOptions): DecorationSet {
	if (!state.field(editorLivePreviewField, false)) return Decoration.none;
	const source = state.field(editorInfoField, false)?.file?.path ?? "";
	const doc = state.doc.toString();
	const ranges: Range<Decoration>[] = [];
	const seen = new Set<number>();
	for (const vr of visible) {
		for (const link of findMarkdownLinks(doc, vr)) {
			if (seen.has(link.from)) continue;
			seen.add(link.from);
			const chip = opts.resolve({ path: link.path, anchor: link.anchor, text: link.text, source });
			if (!chip) continue;
			const widget = new ChipWidget(chip, app, source);
			if (chip.mode === "replace") {
				if (touches(state, link.from, link.to)) continue;
				ranges.push(Decoration.replace({ widget }).range(link.from, link.to));
			} else {
				ranges.push(Decoration.widget({ widget, side: -1 }).range(link.from));
			}
		}
	}
	return Decoration.set(ranges, true);
}

/** Live Preview の拡張と Reading の post processor を登録する */
export function installLinkChips(plugin: Plugin, opts: LinkChipOptions): void {
	const app = plugin.app;
	const refresh = StateEffect.define<null>();
	const viewPlugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, app, opts);
			}
			update(u: ViewUpdate) {
				const modeChanged = u.startState.field(editorLivePreviewField, false) !== u.state.field(editorLivePreviewField, false);
				const asked = u.transactions.some((t) => t.effects.some((e) => e.is(refresh)));
				if (u.docChanged || u.selectionSet || u.viewportChanged || modeChanged || asked) this.decorations = buildDecorations(u.view, app, opts);
			}
		},
		{ decorations: (v) => v.decorations },
	);
	plugin.registerEditorExtension(viewPlugin);
	plugin.register(
		opts.subscribe(() => {
			app.workspace.iterateAllLeaves((leaf) => {
				const cm = (leaf.view as unknown as { editor?: { cm?: EditorView } }).editor?.cm;
				if (cm instanceof EditorView) cm.dispatch({ effects: refresh.of(null) });
			});
		}),
	);

	plugin.registerMarkdownPostProcessor((el, ctx) => {
		for (const a of Array.from(el.querySelectorAll<HTMLAnchorElement>("a.internal-link"))) {
			const href = a.getAttribute("data-href") ?? a.getAttribute("href") ?? "";
			const target = splitLinkTarget(href);
			if (!target) continue;
			const text = a.textContent ?? "";
			// この登録で描いたものだけを戻す（ほかのプラグインの描き替えに触れない）
			let lead: HTMLElement | null = null;
			let replaced = false;
			let current: LinkChip | null = null;
			const undo = () => {
				lead?.remove();
				lead = null;
				if (replaced) {
					a.removeClass("vt-link-chip", "is-replace");
					a.setText(text);
					replaced = false;
				}
			};
			const draw = () => {
				undo();
				const chip = opts.resolve({ ...target, text, source: ctx.sourcePath });
				current = chip;
				if (!chip) return;
				if (chip.mode === "replace") {
					a.empty();
					a.addClass("vt-link-chip", "is-replace");
					chip.render(a);
					replaced = true;
					return;
				}
				lead = document.createElement("span");
				lead.className = "vt-link-chip is-before";
				chip.render(lead);
				a.prepend(lead);
			};
			draw();
			a.addEventListener("click", (e) => {
				const chip = current;
				if (!chip?.onOpened || chip.open === undefined) return;
				e.preventDefault();
				e.stopPropagation();
				openPath(app, chip.open, ctx.sourcePath, e, chip.onOpened);
			});
			const child = new MarkdownRenderChild(a);
			child.onload = () => child.register(opts.subscribe(draw));
			ctx.addChild(child);
		}
	});
}
