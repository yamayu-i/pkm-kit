import { TFile, normalizePath, type App } from "obsidian";
import { dailyNotePath, emptyBoard } from "../core/board";
import { boardLogPath, newBoardLogId, nextBoardAt, serializeBoardLogEntry, type BoardOp } from "../core/board-log";
import { closeBoardNote } from "../core/board-note";
import { localDateTime, type LocalDate } from "../core/dates";
import { GROUPS_PATH, serializeGroups, type GroupDef } from "../core/groups";
import { nextIds, pathForId } from "../core/ids";
import { newDailyContent, newIssueContent, newMemberContent, newRoutineContent } from "../core/issue-file";
import { DEFAULT_LABEL_COLOR, LABELS_PATH, type LabelDef } from "../core/labels";
import { appendWorklogLine, newWorklogId, replaceWorklogLine, serializeWorklogEntry, stopWorklogLines, worklogPath, type WorklogEntry } from "../core/worklog";
import type { TaskStore } from "./store";

/** frontmatter の値。null / undefined / 空配列は欄ごと消す */
export type FieldValue = string | number | boolean | string[] | Record<string, unknown> | null | undefined;

/**
 * Vault への書き込み。ノートは Vault API で書く（開いているエディタとキャッシュに反映させるため）。
 * frontmatter の更新は processFrontMatter に任せ、ほかの欄や書式を壊さない
 */
export class TaskWriter {
	/** この端末が最後に書いたボードの操作の時刻（索引に載る前の次の操作のため） */
	private lastBoardAt = 0;

	constructor(
		private readonly app: App,
		private readonly store: TaskStore,
	) {}

	private file(path: string): TFile {
		const file = this.app.vault.getFileByPath(path);
		if (!file) throw new Error(`ファイルがありません: ${path}`);
		return file;
	}

	/** 親フォルダを（途中の階層も）作る */
	private async ensureFolder(path: string): Promise<void> {
		const parts = path.split("/").slice(0, -1);
		for (let i = 1; i <= parts.length; i++) {
			const folder = parts.slice(0, i).join("/");
			if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
		}
	}

	private async getOrCreate(path: string, initial: string): Promise<TFile> {
		const existing = this.app.vault.getFileByPath(path);
		if (existing) return existing;
		await this.ensureFolder(path);
		return this.app.vault.create(path, initial);
	}

	/** 同じ欄の更新を複数の issue に（DailyTaskView などの一括操作） */
	async updateMany(paths: string[], fields: Record<string, FieldValue> | ((path: string) => Record<string, FieldValue>)): Promise<void> {
		for (const path of paths) await this.update(path, typeof fields === "function" ? fields(path) : fields);
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

	/** issue を作る。scheduled がなければ Inbox に入る（ADR-0011）。作れなかった summary は failed に入る */
	async createIssues(summaries: string[], parent: string | null = null, scheduled: LocalDate[] = []): Promise<{ created: TFile[]; failed: string[] }> {
		const ids = nextIds("i", this.takenIds(), summaries.length);
		const created: TFile[] = [];
		const failed: string[] = [];
		const now = localDateTime();
		for (const [i, summary] of summaries.entries()) {
			const path = normalizePath(pathForId(ids[i]!));
			try {
				await this.ensureFolder(path);
				created.push(await this.app.vault.create(path, newIssueContent(ids[i]!, summary, now, parent, scheduled)));
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

	/** 記録を始める（ADR-0004: worklog/<端末名>/YYYY-MM.jsonl に追記）。すでに記録中のものは除く */
	async startTimer(taskIds: string[], device: string): Promise<void> {
		if (!device) throw new Error("設定で端末名を入れてください（worklog の保存先に使います）");
		const running = new Set(this.store.index.running().map((l) => l.taskId));
		const targets = taskIds.filter((id) => !running.has(id));
		if (targets.length === 0) return;
		const now = new Date();
		const from = localDateTime(now);
		const path = normalizePath(worklogPath(device, now));
		const file = await this.getOrCreate(path, "");
		await this.app.vault.process(file, (text) =>
			targets.reduce((t, taskId) => appendWorklogLine(t, serializeWorklogEntry({ id: newWorklogId(), taskId, from, to: null, description: "" })), text),
		);
		this.store.refreshSoon();
	}

	/** 記録を止める（to を今にする） */
	async stopTimer(entries: WorklogEntry[]): Promise<void> {
		const now = new Date();
		const to = localDateTime(now);
		const byFile = new Map<string, WorklogEntry[]>();
		for (const e of entries) byFile.set(e.path, [...(byFile.get(e.path) ?? []), e]);
		for (const [path, list] of byFile) {
			await this.app.vault.process(this.file(path), (text) => stopWorklogLines(text, list, to, now.getTime()));
		}
		this.store.refreshSoon();
	}

	/** worklog を手で足す。保存先は開始日の月のファイル */
	async addWorklog(taskId: string, device: string, entry: Pick<WorklogEntry, "from" | "to" | "description">, fromDate: Date): Promise<void> {
		if (!device) throw new Error("設定で端末名を入れてください（worklog の保存先に使います）");
		const file = await this.getOrCreate(normalizePath(worklogPath(device, fromDate)), "");
		await this.app.vault.process(file, (text) => appendWorklogLine(text, serializeWorklogEntry({ id: newWorklogId(), taskId, ...entry })));
		this.store.refreshSoon();
	}

	/** その日のボードの操作を、この端末のログに追記する（ADR-0020） */
	async appendBoardOps(date: LocalDate, device: string, ops: BoardOp[]): Promise<void> {
		if (!device) throw new Error("設定で端末名を入れてください（ボードの保存先に使います）");
		const file = await this.getOrCreate(normalizePath(boardLogPath(device, date)), "");
		let latest = Math.max(this.store.index.board(date)?.latestAt ?? 0, this.lastBoardAt) || null;
		const now = Date.now();
		const lines = ops.map((op) => {
			latest = nextBoardAt(now, latest);
			return serializeBoardLogEntry({ id: newBoardLogId(), at: new Date(latest).toISOString(), date, ...op });
		});
		await this.app.vault.process(file, (text) => lines.reduce(appendWorklogLine, text));
		if (latest !== null) this.lastBoardAt = latest;
		this.store.refreshSoon();
	}

	/** 未完了を再検査して本文に要約を書き、それから close を追記する。途中で失敗しても締め直せば要約は置き換わる */
	async closeBoard(date: LocalDate, device: string): Promise<void> {
		const { index } = this.store;
		const board = index.board(date)?.board ?? emptyBoard();
		if (board.closed) return;
		if (!device) throw new Error("設定で端末名を入れてください（ボードの保存先に使います）");
		// 締められないならノートを作らない
		closeBoardNote("", date, index, board);
		const note = await this.getOrCreate(normalizePath(dailyNotePath(date)), newDailyContent(localDateTime()));
		await this.app.vault.process(note, (text) => closeBoardNote(text, date, index, board));
		await this.appendBoardOps(date, device, [{ op: "close", tasks: board.issues }]);
	}

	/** task board のグループの定義を保存する */
	async saveGroups(groups: GroupDef[]): Promise<void> {
		if (this.store.problems.some((p) => p.path === GROUPS_PATH)) throw new Error(`${GROUPS_PATH} を直してから保存してください`);
		const file = await this.getOrCreate(GROUPS_PATH, "[]\n");
		await this.app.vault.modify(file, serializeGroups(groups));
		this.store.refreshSoon();
	}

	/** routine を作る（ADR-0010） */
	async createRoutine(
		summary: string,
		repeat: Record<string, unknown>,
		extra: { group?: string | null; estimated?: number | null; start?: string | null } = {},
	): Promise<TFile> {
		const [id] = nextIds("r", this.takenIds());
		const path = normalizePath(pathForId(id!));
		await this.ensureFolder(path);
		const file = await this.app.vault.create(path, newRoutineContent(id!, summary, repeat, localDateTime(), extra));
		this.store.refreshSoon();
		return file;
	}
}
