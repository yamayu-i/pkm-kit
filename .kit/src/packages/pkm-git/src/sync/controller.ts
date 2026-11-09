import { ApplyJournalError, type ShareState, type SyncResult } from "../git/engine";
import type { SyncLogInput } from "../git/sync-log";

/** 同期のきっかけ（ADR-0089 の 3） */
export type Trigger = "interval" | "focus" | "startup" | "manual" | "keep" | "pull" | "push";

const AUTO: ReadonlySet<Trigger> = new Set(["interval", "focus", "startup"]);
export const FOCUS_MIN_GAP_MS = 60_000;
export const MAX_BACKOFF_MS = 30 * 60_000;

/** ステータスバーに出す共有の状態（ADR-0089 の 6） */
export type ShareView =
	| "checking"
	| "syncing"
	| "shared"
	| "pending"
	| "offline"
	| "auth"
	| "error"
	| "not-repo";

/** コントローラーが使うエンジンの部分（テストで差し替える） */
export interface SyncEngine {
	isRepo(): Promise<boolean>;
	sync(opts?: { keep?: string }): Promise<SyncResult>;
	shareState(paths?: string[]): Promise<ShareState>;
	refsState(): Promise<{ branch?: string; local: string | null; remote: string | null }>;
	readonly lastPhase: string;
}

export interface RunOutcome {
	trigger: Trigger;
	/** 自動のきっかけで、間隔や待ちのために実行しなかった */
	skipped?: boolean;
	/** Vault がまだ git リポジトリでない */
	notRepo?: boolean;
	result?: SyncResult;
	error?: unknown;
	/** この結果で、共有の状態が変わったか（通知を 1 回にするため） */
	previous: ShareView;
	view: ShareView;
}

export interface ControllerDeps {
	engine(): SyncEngine;
	log(input: SyncLogInput): Promise<void> | void;
	now(): number;
	/** 自動の同期の間隔（分）。0 なら自動の同期をしない */
	intervalMinutes(): number;
	/** 開いているエディタを保存する */
	saveEditors(): Promise<void>;
	onView(view: ShareView): void;
}

interface Waiter {
	trigger: Trigger;
	keep?: string;
	resolve(outcome: RunOutcome): void;
}

/**
 * 1 つの Vault の同期を直列に実行する（ADR-0089 の 3）。
 * 実行中に来たきっかけは、終わった後の 1 回にまとめる。
 * 共有の状態は、Vault のイベントで分かる編集と、エンジンの shareState から決める（ADR-0089 の 6）。
 */
export class SyncController {
	private waiting: Waiter[] = [];
	private loop: Promise<void> | null = null;
	/** drain の中にいる間 true。drain が終わるのと同じ同期の区間で false にする（後から来た依頼を取りこぼさない） */
	private active = false;
	private view: ShareView = "checking";
	private seq = 0;
	/** 共有していないかもしれない編集（パス → 最後のイベントの番号） */
	private readonly dirty = new Map<string, number>();
	private lastStart = Number.NEGATIVE_INFINITY;
	private lastEnd = Number.NEGATIVE_INFINITY;
	private failures = 0;
	private lastFailure = Number.NEGATIVE_INFINITY;
	private paused = false;

	constructor(private readonly deps: ControllerDeps) {}

	get current(): ShareView {
		return this.view;
	}

	get running(): boolean {
		return this.active;
	}

	/** clone の間など、同期を止める */
	setPaused(paused: boolean): void {
		this.paused = paused;
	}

	/** 起動時。自動の同期が有効なら同期し、無効なら作業ツリーを調べて状態を出す */
	async start(): Promise<RunOutcome | null> {
		if (this.deps.intervalMinutes() > 0) return this.request("startup");
		try {
			const engine = this.deps.engine();
			if (!(await engine.isRepo())) {
				this.setView("not-repo");
				return null;
			}
			const state = await engine.shareState();
			for (const path of state.changed) this.dirty.set(path, this.seq);
			this.setView(state.unpushed || state.changed.length > 0 ? "pending" : "shared");
		} catch (error) {
			await this.safeLog({ level: "error", event: "unexpected-error", trigger: "startup", phase: "share-state", error });
			this.setView("error");
		}
		return null;
	}

	/** Vault のファイルが作られた・変わった・消えた・改名された */
	noteChange(path: string): void {
		if (path === ".git" || path.startsWith(".git/")) return;
		this.seq++;
		this.dirty.set(path, this.seq);
		if (this.view === "shared") this.setView("pending");
	}

	/** 定期の確認（画面が表示されているときだけ呼ぶ） */
	tick(): Promise<RunOutcome> | null {
		const minutes = this.deps.intervalMinutes();
		if (minutes <= 0 || this.running) return null;
		if (this.deps.now() - this.lastStart < minutes * 60_000) return null;
		return this.request("interval");
	}

	/** 再フォーカス・画面が表示に戻った */
	focus(): Promise<RunOutcome> | null {
		if (this.deps.intervalMinutes() <= 0 || this.running) return null;
		if (this.deps.now() - this.lastEnd < FOCUS_MIN_GAP_MS) return null;
		return this.request("focus");
	}

	request(trigger: Trigger, opts: { keep?: string } = {}): Promise<RunOutcome> {
		if (AUTO.has(trigger) && !this.autoAllowed()) {
			return Promise.resolve({ trigger, skipped: true, previous: this.view, view: this.view });
		}
		return new Promise<RunOutcome>((resolve) => {
			this.waiting.push({ trigger, keep: opts.keep, resolve });
			if (!this.active) {
				this.active = true;
				this.loop = this.drain();
			}
		});
	}

	/** 終わるのを待つ（テストと終了時に使う） */
	async idle(): Promise<void> {
		while (this.active && this.loop) await this.loop;
	}

	private autoAllowed(): boolean {
		if (this.paused || this.deps.intervalMinutes() <= 0) return false;
		if (this.failures === 0) return true;
		const wait = Math.min(this.deps.intervalMinutes() * 60_000 * 2 ** (this.failures - 1), MAX_BACKOFF_MS);
		return this.deps.now() - this.lastFailure >= wait;
	}

	private async drain(): Promise<void> {
		// 最後の確認と active = false を同じ同期の区間で行う（間に await を挟まない）。
		// runOnce は例外を外に出さないので、ここで止まることはない
		for (;;) {
			if (this.waiting.length === 0) {
				this.active = false;
				return;
			}
			const batch = this.waiting.splice(0);
			// 手で実行したきっかけがあれば、その名前で通知などを決める
			const lead = batch.find((w) => !AUTO.has(w.trigger)) ?? (batch[0] as Waiter);
			const keeps = batch.filter((w) => w.keep !== undefined).map((w) => (w.keep ?? "").trim());
			const keep = keeps.length > 0 ? keeps.filter((k) => k).join(" / ") : undefined;
			let outcome: RunOutcome;
			try {
				outcome = await this.runOnce(lead.trigger, keep);
			} catch (error) {
				outcome = { trigger: lead.trigger, error, previous: this.view, view: this.view };
			}
			for (const w of batch) w.resolve({ ...outcome, trigger: w.trigger });
		}
	}

	private async runOnce(trigger: Trigger, keep: string | undefined): Promise<RunOutcome> {
		const previous = this.view;
		if (this.paused) return { trigger, skipped: true, previous, view: previous };
		this.lastStart = this.deps.now();
		const startSeq = this.seq;
		let engine: SyncEngine | null = null;
		try {
			engine = this.deps.engine();
			if (!(await engine.isRepo())) {
				this.setView("not-repo");
				return { trigger, notRepo: true, previous, view: "not-repo" };
			}
			this.setView("syncing");
			await this.deps.saveEditors();
			const result = await engine.sync(keep !== undefined ? { keep } : {});
			const view = await this.afterSync(engine, result, startSeq);
			await this.logResult(trigger, previous, view, result, engine);
			this.setView(view);
			return { trigger, result, previous, view };
		} catch (error) {
			this.recordFailure();
			const journal = error instanceof ApplyJournalError;
			await this.safeLog({
				level: "error",
				event: journal ? "apply-journal-unreadable" : "unexpected-error",
				trigger,
				phase: engine?.lastPhase,
				error,
				state: engine ? await engine.refsState().catch(() => undefined) : undefined,
			});
			this.setView("error");
			return { trigger, error, previous, view: "error" };
		} finally {
			this.lastEnd = this.deps.now();
		}
	}

	private async afterSync(engine: SyncEngine, result: SyncResult, startSeq: number): Promise<ShareView> {
		if (result.status === "offline" || result.status === "auth") {
			this.recordFailure();
			return result.status;
		}
		this.failures = 0;
		if (result.status === "shared") {
			// 始めより前の編集は、この同期の snapshot に入った
			for (const [path, seq] of this.dirty) if (seq <= startSeq) this.dirty.delete(path);
		}
		// 残った編集のうち、HEAD と同じもの（updated の付与、取り込んだファイル、元に戻した編集）は除く
		const state = await engine.shareState([...this.dirty.keys()]);
		const changed = new Set(state.changed);
		for (const path of [...this.dirty.keys()]) if (!changed.has(path)) this.dirty.delete(path);
		if (result.status === "pending") return "pending";
		return state.unpushed || this.dirty.size > 0 ? "pending" : "shared";
	}

	private recordFailure(): void {
		this.failures++;
		this.lastFailure = this.deps.now();
	}

	private async logResult(trigger: Trigger, previous: ShareView, view: ShareView, result: SyncResult, engine: SyncEngine): Promise<void> {
		const base = { trigger, state: { attempt: result.attempts } };
		const r = result.recovery;
		if (r && r.action !== "finished") {
			await this.safeLog({
				...base, level: "warn", event: `recovered-apply-${r.action}`, phase: "recover",
				paths: "paths" in r ? r.paths : undefined,
			});
		}
		if (result.status === "pending") {
			const event = result.reason === "rejected" ? "push-rejected" : result.reason ?? "pending";
			await this.safeLog({
				...base, level: "warn", event, phase: result.reason === "rejected" ? "push" : "moveTo", paths: result.paths,
				state: { ...(await engine.refsState().catch(() => ({}))), attempt: result.attempts },
			});
		}
		// 共通祖先が 1 つでないマージ（ADR-0103 の 4）。まれなので、起きたら毎回残す
		for (const count of result.mergeBases ?? []) {
			if (count === 1) continue;
			await this.safeLog({
				...base, level: "warn", event: count === 0 ? "no-merge-base" : "multiple-merge-bases", phase: "merge-base",
				detail: `bases: ${count}`,
			});
		}
		// オフラインと接続の確認は、状態が変わったときだけ残す
		if ((view === "offline" || view === "auth") && previous !== view) {
			await this.safeLog({ ...base, level: "warn", event: view, phase: engine.lastPhase, error: result.error });
		}
	}

	private async safeLog(input: SyncLogInput): Promise<void> {
		try {
			await this.deps.log(input);
		} catch { /* 記録の失敗で同期の結果を変えない */ }
	}

	private setView(view: ShareView): void {
		this.view = view;
		try {
			this.deps.onView(view);
		} catch { /* 表示の失敗で同期の結果を変えない */ }
	}
}
