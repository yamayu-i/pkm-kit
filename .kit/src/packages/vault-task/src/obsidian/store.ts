import { TFile, type App, type EventRef } from "obsidian";

/** Plugin#registerEvent。プラグインの unload で外れる */
type RegisterEvent = (ref: EventRef) => void;
import { TaskIndex, emptyVaultData } from "../core/index";
import { collectVault, fileKind, type VaultInput } from "../core/load";
import type { Problem } from "../core/problem";

/**
 * メモリ上の索引（ADR-0002）。issue / routine / member は metadataCache から、
 * worklog とボードの操作ログと labels.json はファイルを読んで持つ。変更があったら少し待ってから作り直す
 */
export class TaskStore {
	index = new TaskIndex(emptyVaultData());
	problems: Problem[] = [];
	/** 作り直すたびに増える。UI の再描画に使う */
	version = 0;

	private readonly texts = new Map<string, string>();
	private readonly listeners = new Set<() => void>();
	private timer: number | null = null;

	constructor(private readonly app: App) {}

	async load(registerEvent: RegisterEvent): Promise<void> {
		await Promise.all(this.app.vault.getFiles().map((f) => this.readText(f)));
		const { vault, metadataCache } = this.app;
		for (const ref of [
			metadataCache.on("changed", (file) => this.touch(file)),
			vault.on("create", (file) => file instanceof TFile && void this.readText(file).then(() => this.touch(file))),
			vault.on("modify", (file) => file instanceof TFile && void this.readText(file).then(() => this.touch(file))),
			vault.on("delete", (file) => {
				this.texts.delete(file.path);
				if (file instanceof TFile) this.touch(file);
			}),
			vault.on("rename", (file, oldPath) => {
				this.texts.delete(oldPath);
				if (file instanceof TFile) void this.readText(file).then(() => this.schedule());
			}),
		])
			registerEvent(ref);
		this.rebuild();
	}

	unload(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.listeners.clear();
	}

	subscribe(fn: () => void): () => void {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	/** 書き込んだ直後に UI へ反映したいとき用（metadataCache の更新を待たない） */
	refreshSoon(): void {
		this.schedule();
	}

	mtime(path: string): number | null {
		const file = this.app.vault.getFileByPath(path);
		return file ? file.stat.mtime : null;
	}

	private async readText(file: TFile): Promise<void> {
		const kind = fileKind(file.path);
		if (kind === "worklog" || kind === "board" || kind === "labels" || kind === "groups") this.texts.set(file.path, await this.app.vault.cachedRead(file));
	}

	private touch(file: TFile): void {
		if (fileKind(file.path) !== null) this.schedule();
	}

	private schedule(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => {
			this.timer = null;
			this.rebuild();
		}, 50);
	}

	private rebuild(): void {
		const input: VaultInput = { markdown: [], worklogs: [], labels: null, groups: null, boardLogs: [] };
		for (const file of this.app.vault.getMarkdownFiles()) {
			const kind = fileKind(file.path);
			if (kind !== "issue" && kind !== "routine" && kind !== "member" && kind !== "daily") continue;
			const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
			input.markdown.push({ path: file.path, frontmatter: fm ? { ...fm } : null });
		}
		for (const [path, text] of this.texts) {
			const kind = fileKind(path);
			if (kind === "worklog") input.worklogs.push({ path, text });
			else if (kind === "board") input.boardLogs!.push({ path, text });
			else if (kind === "labels") input.labels = text;
			else if (kind === "groups") input.groups = text;
		}
		const { data, problems } = collectVault(input);
		this.index = new TaskIndex(data);
		this.problems = problems;
		this.version++;
		for (const fn of this.listeners) fn();
	}
}
