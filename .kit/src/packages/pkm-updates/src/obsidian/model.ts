import { TFile, normalizePath, type App, type EventRef } from "obsidian";
import { localDateTime, localToday } from "../../../pkm-task/src/core/dates";
import { buildSections, uniqueCount, type NoteRecord, type Section } from "../core/sections";
import { appendViewedLine, isViewedLogPath, latestViewed, serializeViewed, viewedLogPath } from "../core/viewed-log";

/** Plugin#registerEvent。プラグインの unload で外れる */
type RegisterEvent = (ref: EventRef) => void;

/**
 * PKM Updates の中身（ADR-0070）。ノートは metadataCache から、Viewed のログはファイルを読んで持ち、
 * 変更があったら少し待ってから作り直す
 */
export class UpdatesModel {
	sections: Section[] = [];
	count = 0;
	/** 基準の日時（ミリ秒）。まだ一度も Viewed を押していなければ null */
	since: number | null = null;
	/** 作り直すたびに増える。UI の再描画に使う */
	version = 0;

	private readonly logs = new Map<string, string>();
	private readonly listeners = new Set<() => void>();
	private timer: number | null = null;

	constructor(private readonly app: App) {}

	async load(registerEvent: RegisterEvent): Promise<void> {
		const { vault, metadataCache } = this.app;
		await Promise.all(vault.getFiles().filter((f) => isViewedLogPath(f.path)).map((f) => this.readLog(f)));
		for (const ref of [
			metadataCache.on("changed", () => this.schedule()),
			metadataCache.on("deleted", () => this.schedule()),
			vault.on("create", (file) => this.onFile(file)),
			vault.on("modify", (file) => this.onFile(file)),
			vault.on("delete", (file) => {
				this.logs.delete(file.path);
				this.schedule();
			}),
			vault.on("rename", (file, oldPath) => {
				this.logs.delete(oldPath);
				this.onFile(file);
				this.schedule();
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

	/** 今の日時を記録し、リストを空にする。記録の書き込みを待たずに基準を進める */
	async markViewed(device: string, now: Date = new Date()): Promise<void> {
		const path = normalizePath(viewedLogPath(device, now));
		const line = serializeViewed(localDateTime(now));
		// 秒までで記録するので、基準も秒に切り捨てる（同じ秒に付いた updated は載せない）
		this.since = Math.max(this.since ?? 0, Math.floor(now.getTime() / 1000) * 1000);
		this.rebuild();
		const file = await this.getOrCreate(path);
		await this.app.vault.process(file, (text) => appendViewedLine(text, line));
	}

	private onFile(file: unknown): void {
		if (file instanceof TFile && isViewedLogPath(file.path)) void this.readLog(file).then(() => this.schedule());
		else this.schedule();
	}

	private async readLog(file: TFile): Promise<void> {
		this.logs.set(file.path, await this.app.vault.cachedRead(file));
	}

	private async getOrCreate(path: string): Promise<TFile> {
		const existing = this.app.vault.getFileByPath(path);
		if (existing) return existing;
		const parts = path.split("/").slice(0, -1);
		for (let i = 1; i <= parts.length; i++) {
			const folder = parts.slice(0, i).join("/");
			if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
		}
		return this.app.vault.create(path, "");
	}

	private schedule(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => {
			this.timer = null;
			this.rebuild();
		}, 300);
	}

	private rebuild(): void {
		const logged = latestViewed(this.logs.values());
		if (logged !== null) this.since = Math.max(this.since ?? logged, logged);
		const notes: NoteRecord[] = this.app.vault.getMarkdownFiles().map((file) => {
			const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
			return { path: file.path, basename: file.basename, frontmatter: fm ? { ...fm } : null };
		});
		this.sections = buildSections(notes, this.since, localToday());
		this.count = uniqueCount(this.sections);
		this.version++;
		for (const fn of this.listeners) fn();
	}
}
