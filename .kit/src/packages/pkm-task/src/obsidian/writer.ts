import { TFile, normalizePath, parseYaml, type App } from "obsidian";
import { dailyNotePath, emptyBoard } from "../core/board";
import { boardLogPath, newBoardLogId, nextBoardAt, serializeBoardLogEntry, type BoardOp } from "../core/board-log";
import { closeBoardNote } from "../core/board-note";
import { unstarOps } from "../core/board-lanes";
import { localDateTime, localToday, type LocalDate } from "../core/dates";
import { nextIds, pathForId } from "../core/ids";
import { newDailyContent, newIssueContent, newMemberContent, newRoutineContent } from "../core/issue-file";
import { fileKind } from "../core/load";
import { STATUSES, type Status } from "../core/schema";
import { statusLogLine, statusLogPath, type StatusVia } from "../core/status-log";
import { canTransition, completeIssuePatch, completeSubPatch, reopenSubOnPeriod, stopsTimer, ticklerError, timerStartStatus, transitionError } from "../core/transition";
import { assertUnused, labelUsage, renameLabelField, type LabelSavePlan } from "../core/label-edit";
import { DEFAULT_LABEL_COLOR, LABELS_PATH, serializeLabels, type LabelDef } from "../core/labels";
import { newPresetContent, type IssuePreset } from "../core/presets";
import {
	appendParentBodyText,
	dependentsOf,
	dropPosition,
	insertSubIssuesText,
	stepPosition,
	moveSubIssueText,
	newSubId,
	newSubIssueInput,
	normalizeSubPatch,
	parseSubIssues,
	removeSubIssueText,
	subKey,
	touchedSubErrors,
	updateSubIssueText,
	type SubIssue,
	type SubIssuePatch,
} from "../core/sub-issue";
import { appendWorklogLine, newWorklogId, replaceWorklogLine, serializeWorklogEntry, stopWorklogLines, workKey, workTarget, worklogPath, type WorklogEntry } from "../core/worklog";
import type { TaskStore } from "./store";

/** frontmatter の値。null / undefined / 空配列は欄ごと消す */
export type FieldValue = string | number | boolean | string[] | Record<string, unknown> | null | undefined;

/** issue の status を変えたこと（取り消しのトースト用。ADR-0031） */
export interface StatusChange {
	path: string;
	id: string;
	from: Status;
	to: Status;
	/** 変える前の値（変えた欄だけ。なかった欄は undefined）。これで update すると元に戻る */
	before: Record<string, FieldValue>;
	via: StatusVia;
}

const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

/**
 * Vault への書き込み。ノートは Vault API で書く（開いているエディタとキャッシュに反映させるため）。
 * frontmatter の更新は processFrontMatter に任せ、ほかの欄や書式を壊さない
 */
export class TaskWriter {
	/** この端末が最後に書いたボードの操作の時刻（索引に載る前の次の操作のため） */
	private lastBoardAt = 0;
	/** issue の status を変えたら呼ぶ（取り消しのトースト。ADR-0031） */
	onStatusChange: ((change: StatusChange) => void) | null = null;

	constructor(
		private readonly app: App,
		private readonly store: TaskStore,
		/** status の記録（statuslog）に使う端末名 */
		private readonly deviceName: () => string = () => "",
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

	/**
	 * frontmatter の欄をまとめて更新する。issue の status は遷移表（ADR-0183）にある遷移だけを書き、ほかは例外にする（取り消しの undo は除く）。
	 * status が変わったら、statuslog に書き、★ を外し、今の作業でなくなればタイマーを止め、onStatusChange を呼ぶ（ADR-0031, 0184, 0183）
	 */
	async update(path: string, fields: Record<string, FieldValue>, via: StatusVia = "ui"): Promise<void> {
		const before: Record<string, FieldValue> = {};
		let from: unknown;
		let id: unknown;
		await this.app.fileManager.processFrontMatter(this.file(path), (fm: Record<string, unknown>) => {
			from = fm.status;
			id = fm.id;
			const next = fields.status;
			if (via !== "undo" && fileKind(path) === "issue" && isStatus(from) && isStatus(next) && from !== next) {
				const reopenTo = typeof fm.id === "string" ? this.store.index.reopenStatus(fm.id) : null;
				if (!canTransition(from, next, reopenTo)) throw new Error(transitionError(from, next, reopenTo));
				fields = completeIssuePatch(next, fields, from);
			}
			// Tickler は open だけが持つ（ADR-0183）。書いた後の status が open でなければ付けない
			const after = isStatus(next) ? next : from;
			if (via !== "undo" && fileKind(path) === "issue" && typeof fields.tickler === "string" && fields.tickler !== "" && isStatus(after) && after !== "open") {
				throw new Error(ticklerError(after));
			}
			for (const [key, value] of Object.entries(fields)) {
				before[key] = structuredClone(fm[key]) as FieldValue;
				if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === "") delete fm[key];
				else fm[key] = value;
			}
		});
		this.store.refreshSoon();
		const to = fields.status;
		if (fileKind(path) !== "issue" || !isStatus(from) || !isStatus(to) || from === to || typeof id !== "string") return;
		await this.recordStatus(id, from, to, via);
		await this.unstar(id, to);
		if (stopsTimer(to)) {
			const running = this.store.index.running(id);
			if (running.length > 0) await this.stopTimer(running);
		}
		this.onStatusChange?.({ path, id, from, to, before, via });
	}

	/**
	 * サブの項目を書き換える（ADR-0135）。key は合成キー。status が変わったら statuslog に task と sub で書き、
	 * 今の作業でなくなればそのサブの記録中のタイマーを止める。遷移表にない遷移は例外（ADR-0183）。親の status は変えない
	 */
	async updateSub(key: string, patch: SubIssuePatch, via: StatusVia = "ui"): Promise<void> {
		const sub = this.store.index.sub(key);
		if (!sub) throw new Error(`サブがありません: ${key}`);
		// someday に期間を入れたら open に戻す（ADR-0190）
		let fixed = normalizeSubPatch(reopenSubOnPeriod(sub.status, patch));
		const next = fixed.status;
		if (via !== "undo" && next !== undefined && next !== sub.status) {
			const reopenTo = this.store.index.reopenStatus(sub.key);
			if (!canTransition(sub.status, next, reopenTo)) throw new Error(transitionError(sub.status, next, reopenTo));
			fixed = completeSubPatch(next, fixed);
		}
		let change: { from: Status; to: Status } | null = null;
		await this.app.vault.process(this.file(sub.path), (text) => {
			// 書く前に、今の md の姿で検査する（ADR-0135）。通らなければ書かない
			const siblings = parseSubIssues(sub.path, sub.parent, text, parseYaml).subs.map((s) => (s.id === sub.id ? { ...s, ...fixed, id: s.id } : s));
			this.assertSubs(siblings, [sub.id]);
			const r = updateSubIssueText(sub.path, sub.parent, text, sub.id, fixed, parseYaml);
			change = r.before.status !== r.after.status ? { from: r.before.status, to: r.after.status } : null;
			return r.text;
		});
		this.store.refreshSoon();
		const done = change as { from: Status; to: Status } | null;
		if (done === null) return;
		await this.afterSubStatusChange(sub, done.from, done.to, via);
	}

	/**
	 * サブの status が変わった後の処理: statuslog に task と sub で書き、closed / canceled ならそのサブの記録中のタイマーを止める。
	 * エディタの文書を直接書き換えたとき（ADR-0161）も、ファイルを書き換えたときと同じにするために公開している
	 */
	async afterSubStatusChange(sub: Pick<SubIssue, "parent" | "id" | "key">, from: Status, to: Status, via: StatusVia = "ui"): Promise<void> {
		await this.recordStatus(sub.parent, from, to, via, sub.id);
		await this.unstar(sub.key, to);
		if (stopsTimer(to)) {
			const running = this.store.index.running(sub.key);
			if (running.length > 0) await this.stopTimer(running);
		}
	}

	private assertSubs(subs: Parameters<typeof touchedSubErrors>[0], touched: string[]): void {
		const errors = touchedSubErrors(subs, touched, new Set(this.store.index.members.keys()));
		if (errors.length > 0) throw new Error(errors.join("\n"));
	}

	/** サブを足す（ADR-0142）。summaries の順に末尾へ。作ったサブの合成キーを返す */
	async createSubs(parentId: string, summaries: string[]): Promise<string[]> {
		const issue = this.store.index.issues.get(parentId);
		if (!issue) throw new Error(`issue がありません: ${parentId}`);
		if (summaries.length === 0) return [];
		const created = localDateTime();
		let keys: string[] = [];
		await this.app.vault.process(this.file(issue.path), (text) => {
			const existing = parseSubIssues(issue.path, issue.id, text, parseYaml).subs;
			const taken = existing.map((s) => s.id);
			const subs = summaries.map((summary) => {
				const id = newSubId(taken);
				taken.push(id);
				return newSubIssueInput({ summary }, id, created);
			});
			this.assertSubs([...existing, ...subs], subs.map((s) => s.id));
			keys = subs.map((s) => subKey(issue.id, s.id));
			return insertSubIssuesText(issue.path, issue.id, text, subs, parseYaml);
		});
		this.store.refreshSoon();
		return keys;
	}

	/** サブを to の位置へ移す（md のブロックの並びで数える） */
	async moveSub(key: string, to: number): Promise<void> {
		await this.moveSubWith(key, () => to);
	}

	/** サブを before の前へ移す（null なら末尾。ドラッグ。ADR-0142）。位置は今の md のブロックの並び（読めないブロックを含む）で決める */
	async moveSubBefore(key: string, before: string | null): Promise<void> {
		const target = before === null ? null : this.store.index.sub(before);
		await this.moveSubWith(key, (ids, id) => dropPosition(ids, id, target ? target.id : null));
	}

	/** サブを、出ている隣の行（visible の合成キー）をまたいで 1 つ上（-1）か下（1）へ移す（Move up / down） */
	async stepSub(key: string, visible: readonly string[], dir: -1 | 1): Promise<void> {
		const ids = visible.map((k) => this.store.index.sub(k)?.id).filter((x): x is string => x !== undefined);
		await this.moveSubWith(key, (all, id) => stepPosition(all, ids, id, dir));
	}

	private async moveSubWith(key: string, position: (ids: (string | null)[], id: string) => number | null): Promise<void> {
		const sub = this.store.index.sub(key);
		if (!sub) throw new Error(`サブがありません: ${key}`);
		await this.app.vault.process(this.file(sub.path), (text) => {
			const ids = parseSubIssues(sub.path, sub.parent, text, parseYaml).blocks.map((b) => b.sub?.id ?? null);
			const to = position(ids, sub.id);
			return to === null ? text : moveSubIssueText(sub.path, sub.parent, text, sub.id, to, parseYaml);
		});
		this.store.refreshSoon();
	}

	/** サブを本文ごと消す。記録中のタイマーは止める。worklog の行は残す（ADR-0135）。依存されていたら消さない */
	async deleteSub(key: string): Promise<void> {
		const sub = this.store.index.sub(key);
		if (!sub) throw new Error(`サブがありません: ${key}`);
		const dependents = dependentsOf(this.store.index.subs(sub.parent), sub.id);
		if (dependents.length > 0) throw new Error(`${dependents.join(", ")} の depends_on にあるので消せません。先に外してください`);
		const running = this.store.index.running(key);
		if (running.length > 0) await this.stopTimer(running);
		await this.app.vault.process(this.file(sub.path), (text) => removeSubIssueText(sub.path, sub.parent, text, sub.id, parseYaml));
		this.store.refreshSoon();
	}

	/** statuslog に 1 行追記する。端末名がなければ書かない。書けなくても status の変更は止めない */
	/** waiting / delegated にしたら、今日のボードの ★ を外す（ADR-0184）。失敗しても status の変更は止めない */
	private async unstar(key: string, to: Status): Promise<void> {
		const device = this.deviceName();
		const today = localToday();
		const ops = unstarOps(this.store.index, today, key, to);
		if (!device || ops.length === 0) return;
		try {
			await this.appendBoardOps(today, device, ops);
		} catch (e) {
			console.error("pkm-task: ★ を外せませんでした", e);
		}
	}

	private async recordStatus(task: string, from: Status, to: Status, via: StatusVia, sub: string | null = null): Promise<void> {
		const device = this.deviceName();
		if (!device) return;
		try {
			const now = new Date();
			const line = statusLogLine(task, from, to, via, now, Math.random, sub);
			if (line === null) return;
			const file = await this.getOrCreate(normalizePath(statusLogPath(device, now)), "");
			await this.app.vault.process(file, (text) => appendWorklogLine(text, line));
		} catch (e) {
			console.error("pkm-task: status の記録を書けませんでした", e);
		}
	}

	private takenIds(): string[] {
		const { index } = this.store;
		const ids = [...index.issues.keys(), ...index.routines.keys(), ...index.members.keys(), ...index.data.presets.map((p) => p.id)];
		// 索引にまだ載っていないファイルも見る（作った直後など）
		for (const f of this.app.vault.getMarkdownFiles()) ids.push(f.basename);
		return ids;
	}

	/** issue を作る。clarified を渡さなければ Inbox に入る（ADR-0011, 0148）。作れなかった summary は failed に入る */
	async createIssues(summaries: string[], extra: { clarified?: boolean } = {}): Promise<{ created: TFile[]; failed: string[] }> {
		const ids = nextIds("i", this.takenIds(), summaries.length);
		const created: TFile[] = [];
		const failed: string[] = [];
		const now = localDateTime();
		for (const [i, summary] of summaries.entries()) {
			const path = normalizePath(pathForId(ids[i]!));
			try {
				await this.ensureFolder(path);
				created.push(await this.app.vault.create(path, newIssueContent(ids[i]!, summary, now, extra)));
			} catch (e) {
				console.error("pkm-task: issue を作れませんでした", path, e);
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
		await this.writeLabelsFile(labels);
	}

	/**
	 * Labels 画面の保存（ADR-0024, 0036）。改名した label が付いた issue・routine・member を書き換えてから labels.json を書く。
	 * 途中で失敗しても、改名の元の名前が labels.json に残るので、もう一度保存すれば残りが書き換わる
	 */
	async saveLabels(plan: LabelSavePlan): Promise<void> {
		if (this.store.problems.some((p) => p.path === LABELS_PATH)) throw new Error(`${LABELS_PATH} を直してから保存してください`);
		const { index } = this.store;
		assertUnused(plan.removed, labelUsage(index));
		if (plan.renames.size > 0) {
			const targets = [...index.issues.values(), ...index.routines.values(), ...index.members.values()].filter((x) => x.labels.some((l) => plan.renames.has(l)));
			for (const { path } of targets) {
				await this.app.fileManager.processFrontMatter(this.file(path), (fm: Record<string, unknown>) => {
					const next = renameLabelField(fm.label, plan.renames);
					if (next !== undefined) fm.label = next;
				});
			}
		}
		await this.writeLabelsFile(plan.labels);
	}

	private async writeLabelsFile(labels: LabelDef[]): Promise<void> {
		const text = serializeLabels(labels);
		const file = this.app.vault.getFileByPath(LABELS_PATH);
		if (file) await this.app.vault.modify(file, text);
		else {
			await this.ensureFolder(LABELS_PATH);
			await this.app.vault.create(LABELS_PATH, text);
		}
		this.store.refreshSoon();
	}

	/** プリセットの md を作る（ADR-0186）。作った ID を返す */
	async createPreset(name: string): Promise<string> {
		const [id] = nextIds("p", this.takenIds());
		const path = normalizePath(pathForId(id!));
		await this.ensureFolder(path);
		await this.app.vault.create(path, newPresetContent(id!, name, localDateTime()));
		this.store.refreshSoon();
		return id!;
	}

	/**
	 * プリセットを issue に当てる（ADR-0186）。1 回の書き込みで、サブを末尾へ足し（素早い追加と同じ既定値）、
	 * 本文を親の本文の末尾に追記する。作ったサブの合成キーを返す
	 */
	async applyPreset(parentId: string, preset: Pick<IssuePreset, "subIssues" | "body">): Promise<string[]> {
		const issue = this.store.index.issues.get(parentId);
		if (!issue) throw new Error(`issue がありません: ${parentId}`);
		const created = localDateTime();
		let keys: string[] = [];
		await this.app.vault.process(this.file(issue.path), (text) => {
			const existing = parseSubIssues(issue.path, issue.id, text, parseYaml).subs;
			const taken = existing.map((s) => s.id);
			const subs = preset.subIssues.map((summary) => {
				const id = newSubId(taken);
				taken.push(id);
				return newSubIssueInput({ summary }, id, created);
			});
			this.assertSubs([...existing, ...subs], subs.map((s) => s.id));
			keys = subs.map((s) => subKey(issue.id, s.id));
			const withBody = appendParentBodyText(text, preset.body);
			return subs.length > 0 ? insertSubIssuesText(issue.path, issue.id, withBody, subs, parseYaml) : withBody;
		});
		this.store.refreshSoon();
		return keys;
	}

	/** worklog の 1 行を書き換える。next が null なら行を消す（ADR-0012） */
	async updateWorklog(entry: WorklogEntry, next: Pick<WorklogEntry, "from" | "to" | "description"> | null): Promise<void> {
		await this.app.vault.process(this.file(entry.path), (text) => replaceWorklogLine(text, entry, next));
		this.store.refreshSoon();
	}

	/**
	 * 記録を始める（ADR-0004: worklog/<端末名>/YYYY-MM.jsonl に追記）。すでに記録中のものは除く。
	 * taskIds は記録の鍵（issue / routine の ID か、サブの合成キー。ADR-0135）。
	 * open の issue とサブは in-progress にする（ADR-0031）
	 */
	async startTimer(taskIds: string[], device: string): Promise<void> {
		if (!device) throw new Error("設定で端末名を入れてください（worklog の保存先に使います）");
		const running = new Set(this.store.index.running().map(workKey));
		const targets = taskIds.filter((id) => !running.has(id));
		if (targets.length === 0) return;
		const now = new Date();
		const from = localDateTime(now);
		const path = normalizePath(worklogPath(device, now));
		const file = await this.getOrCreate(path, "");
		await this.app.vault.process(file, (text) =>
			targets.reduce((t, key) => appendWorklogLine(t, serializeWorklogEntry({ id: newWorklogId(), ...workTarget(key), from, to: null, description: "" })), text),
		);
		this.store.refreshSoon();
		for (const id of targets) {
			const sub = this.store.index.sub(id);
			if (sub) {
				const to = timerStartStatus(sub.status);
				if (to) await this.updateSub(id, { status: to }, "timer");
				continue;
			}
			const issue = this.store.index.issues.get(id);
			const to = issue ? timerStartStatus(issue.status) : null;
			if (issue && to) await this.update(issue.path, { status: to, delegated_to: null }, "timer");
		}
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

	/** routine を作る（ADR-0010） */
	async createRoutine(
		summary: string,
		repeat: Record<string, unknown>,
		extra: { estimated?: number | null; start?: string | null } = {},
	): Promise<TFile> {
		const [id] = nextIds("r", this.takenIds());
		const path = normalizePath(pathForId(id!));
		await this.ensureFolder(path);
		const file = await this.app.vault.create(path, newRoutineContent(id!, summary, repeat, localDateTime(), extra));
		this.store.refreshSoon();
		return file;
	}
}
