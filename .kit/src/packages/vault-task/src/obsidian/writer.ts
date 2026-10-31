import { TFile, normalizePath, type App } from "obsidian";
import { localDateTime } from "../core/dates";
import { nextIds, pathForId } from "../core/ids";
import { newIssueContent, newMemberContent } from "../core/issue-file";
import { DEFAULT_LABEL_COLOR, LABELS_PATH, type LabelDef } from "../core/labels";
import { replaceWorklogLine, type WorklogEntry } from "../core/worklog";
import type { TaskStore } from "./store";

/** frontmatter の値。null / undefined / 空配列は欄ごと消す */
export type FieldValue = string | number | boolean | string[] | null | undefined;

/**
 * Vault への書き込み。ノートは Vault API で書く（開いているエディタとキャッシュに反映させるため）。
 * frontmatter の更新は processFrontMatter に任せ、ほかの欄や書式を壊さない
 */
export class TaskWriter {
	constructor(
		private readonly app: App,
		private readonly store: TaskStore,
	) {}

	private file(path: string): TFile {
		const file = this.app.vault.getFileByPath(path);
		if (!file) throw new Error(`ファイルがありません: ${path}`);
		return file;
	}

	private async ensureFolder(path: string): Promise<void> {
		const folder = path.slice(0, path.lastIndexOf("/"));
		if (folder && !this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
	}

	/** frontmatter の欄をまとめて更新する */
	async update(path: string, fields: Record<string, FieldValue>): Promise<void> {
		await this.app.fileManager.processFrontMatter(this.file(path), (fm: Record<string, unknown>) => {
			for (const [key, value] of Object.entries(fields)) {
				if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === "") delete fm[key];
				else fm[key] = value;
			}
		});
		this.store.refreshSoon();
	}

	private takenIds(): string[] {
		const { index } = this.store;
		const ids = [...index.issues.keys(), ...index.routines.keys(), ...index.members.keys()];
		// 索引にまだ載っていないファイルも見る（作った直後など）
		for (const f of this.app.vault.getMarkdownFiles()) ids.push(f.basename);
		return ids;
	}

	/** Inbox に issue を作る（ADR-0011）。作れなかった summary は failed に入る */
	async createIssues(summaries: string[], parent: string | null = null): Promise<{ created: TFile[]; failed: string[] }> {
		const ids = nextIds("i", this.takenIds(), summaries.length);
		const created: TFile[] = [];
		const failed: string[] = [];
		const now = localDateTime();
		for (const [i, summary] of summaries.entries()) {
			const path = normalizePath(pathForId(ids[i]!));
			try {
				await this.ensureFolder(path);
				created.push(await this.app.vault.create(path, newIssueContent(ids[i]!, summary, now, parent)));
			} catch (e) {
				console.error("vault-task: issue を作れませんでした", path, e);
				failed.push(summary);
			}
		}
		this.store.refreshSoon();
		return { created, failed };
	}

	async createMember(name: string): Promise<string> {
		const [id] = nextIds("m", this.takenIds());
		const path = normalizePath(pathForId(id!));
		await this.ensureFolder(path);
		await this.app.vault.create(path, newMemberContent(id!, name, localDateTime()));
		this.store.refreshSoon();
		return id!;
	}

	/** labels.json に label を足す（すでにあれば何もしない） */
	async addLabel(name: string, color = DEFAULT_LABEL_COLOR): Promise<void> {
		// 読めない定義があるまま書き戻すと、その定義が消える
		if (this.store.problems.some((p) => p.path === LABELS_PATH)) throw new Error(`${LABELS_PATH} を直してから label を追加してください`);
		const labels: LabelDef[] = [...this.store.index.data.labels];
		if (labels.some((l) => l.name === name)) return;
		labels.push({ name, color });
		const text = `${JSON.stringify(labels, null, 2)}\n`;
		const file = this.app.vault.getFileByPath(LABELS_PATH);
		if (file) await this.app.vault.modify(file, text);
		else {
			await this.ensureFolder(LABELS_PATH);
			await this.app.vault.create(LABELS_PATH, text);
		}
		this.store.refreshSoon();
	}

	/** worklog の 1 行を書き換える。next が null なら行を消す（ADR-0012） */
	async updateWorklog(entry: WorklogEntry, next: Pick<WorklogEntry, "from" | "to" | "description"> | null): Promise<void> {
		await this.app.vault.process(this.file(entry.path), (text) => replaceWorklogLine(text, entry, next));
		this.store.refreshSoon();
	}
}
