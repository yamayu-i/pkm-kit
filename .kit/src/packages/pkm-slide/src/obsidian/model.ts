/**
 * Vault から slide/ のデッキと整理のフォルダを集め、変わったら作り直す（ADR-0120）
 */
import { TFile, TFolder, type App, type EventRef, type TAbstractFile } from "obsidian";
import { classify, deckTitle, isWithin, SLIDE_ROOT, slideCount, type SlideTree } from "../core/decks.ts";

export interface Deck {
	path: string;
	title: string;
	slides: number;
	/** 更新日時（deck.html と index.html の新しい方。ms） */
	mtime: number;
	/** index.html（ビルドしたもの）。なければ null（まだビルドしていない） */
	index: TFile | null;
}

export interface Snapshot {
	tree: SlideTree;
	decks: Deck[];
}

const EMPTY: Snapshot = { tree: { decks: [], folders: [SLIDE_ROOT] }, decks: [] };
/** まとめて作り直すまでの待ち */
const DEBOUNCE_MS = 300;

export class SlideModel {
	snapshot: Snapshot = EMPTY;
	private listeners = new Set<() => void>();
	private timer: number | null = null;
	private version = 0;

	constructor(private readonly app: App) {}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	load(register: (ref: EventRef) => void): Promise<void> {
		const touch = (file: TAbstractFile, oldPath?: string) => {
			if (isWithin(file.path, SLIDE_ROOT) || (oldPath !== undefined && isWithin(oldPath, SLIDE_ROOT))) this.schedule();
		};
		register(this.app.vault.on("create", (f) => touch(f)));
		register(this.app.vault.on("delete", (f) => touch(f)));
		register(this.app.vault.on("modify", (f) => touch(f)));
		register(this.app.vault.on("rename", (f, old) => touch(f, old)));
		return this.refresh();
	}

	unload(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.listeners.clear();
	}

	private schedule(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => {
			this.timer = null;
			void this.refresh().catch((e) => console.error("pkm-slide: スライドの一覧を作れませんでした", e));
		}, DEBOUNCE_MS);
	}

	async refresh(): Promise<void> {
		const version = ++this.version;
		const root = this.app.vault.getAbstractFileByPath(SLIDE_ROOT);
		const files: string[] = [];
		const folders: string[] = [];
		const walk = (node: TAbstractFile) => {
			if (node instanceof TFolder) {
				folders.push(node.path);
				for (const c of node.children) walk(c);
			} else files.push(node.path);
		};
		if (root instanceof TFolder) walk(root);
		const tree = classify(files, folders);
		const decks: Deck[] = [];
		for (const entry of tree.decks) {
			const source = this.app.vault.getAbstractFileByPath(`${entry.path}/deck.html`);
			const index = this.app.vault.getAbstractFileByPath(`${entry.path}/index.html`);
			const text = source instanceof TFile ? await this.app.vault.cachedRead(source) : "";
			const sourceTime = source instanceof TFile ? source.stat.mtime : 0;
			const indexFile = index instanceof TFile ? index : null;
			decks.push({
				path: entry.path,
				title: deckTitle(text, entry.path),
				slides: slideCount(text),
				mtime: Math.max(sourceTime, indexFile?.stat.mtime ?? 0),
				index: indexFile,
			});
		}
		if (version !== this.version) return;
		this.snapshot = { tree, decks };
		for (const l of this.listeners) l();
	}
}
