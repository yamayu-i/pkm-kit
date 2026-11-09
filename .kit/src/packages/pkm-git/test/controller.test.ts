import { describe, expect, it } from "vitest";
import type { ShareState, SyncResult } from "../src/git/engine";
import { ApplyJournalError } from "../src/git/engine";
import type { SyncLogInput } from "../src/git/sync-log";
import { FOCUS_MIN_GAP_MS, SyncController, type ShareView, type SyncEngine } from "../src/sync/controller";

const shared: SyncResult = { status: "shared", snapshot: true, changed: [], conflicts: [], attempts: 1, recovery: null, mergeBases: [] };

/** sync の結果と、HEAD と違うパスを決めておけるエンジン */
class FakeEngine implements SyncEngine {
	lastPhase = "";
	calls: Array<{ keep?: string }> = [];
	results: Array<SyncResult | Error> = [];
	/** HEAD と違うパス */
	changed = new Set<string>();
	unpushed = false;
	repo = true;
	/** sync の途中で呼ぶ（同期中の編集を模す） */
	during?: () => void;
	private gate?: Promise<void>;
	private open?: () => void;

	hold(): void {
		this.gate = new Promise((r) => { this.open = r; });
	}

	release(): void {
		this.open?.();
		this.gate = undefined;
	}

	async isRepo() {
		return this.repo;
	}

	async sync(opts: { keep?: string } = {}): Promise<SyncResult> {
		this.calls.push(opts);
		this.lastPhase = "fetch";
		this.during?.();
		if (this.gate) await this.gate;
		const next = this.results.shift() ?? shared;
		if (next instanceof Error) throw next;
		return next;
	}

	async shareState(paths?: string[]): Promise<ShareState> {
		const changed = [...this.changed].filter((p) => !paths || paths.includes(p)).sort();
		return { unpushed: this.unpushed, changed };
	}

	async refsState() {
		return { branch: "main", local: "aaa", remote: "bbb" };
	}
}

function setup(minutes = 5) {
	const engine = new FakeEngine();
	const logs: SyncLogInput[] = [];
	const views: ShareView[] = [];
	let now = 1_000_000;
	let interval = minutes;
	const controller = new SyncController({
		engine: () => engine,
		log: (e) => { logs.push(e); },
		now: () => now,
		intervalMinutes: () => interval,
		saveEditors: async () => {},
		onView: (v) => { views.push(v); },
	});
	return {
		engine, logs, views, controller,
		advance: (ms: number) => { now += ms; },
		setInterval: (m: number) => { interval = m; },
	};
}

describe("SyncController（ADR-0089 の 3・6・8）", () => {
	it("S3: 実行中に来たきっかけは、終わった後の 1 回にまとめる", async () => {
		const { engine, controller } = setup();
		engine.hold();
		const first = controller.request("manual");
		const a = controller.request("manual");
		const b = controller.request("push");
		const c = controller.request("pull");
		engine.release();
		await Promise.all([first, a, b, c]);
		expect(engine.calls).toHaveLength(2);
		expect((await b).trigger).toBe("push");
	});

	it("S3: 同期中の編集は、同期が終わっても共有待ちに残る", async () => {
		const { engine, controller } = setup();
		controller.noteChange("before.md");
		engine.during = () => {
			controller.noteChange("during.md");
			engine.changed.add("during.md");
		};
		const out = await controller.request("manual");
		expect(out.view).toBe("pending");
		engine.during = undefined;
		engine.changed.clear();
		expect((await controller.request("manual")).view).toBe("shared");
	});

	it("同期中に updated を書いたイベント（HEAD と同じ内容）は編集として残さない", async () => {
		const { engine, controller } = setup();
		controller.noteChange("note.md");
		engine.during = () => controller.noteChange("note.md");
		expect((await controller.request("manual")).view).toBe("shared");
	});

	it("共有済みの後に編集したら共有待ちを出す。送っていないコミットがあれば共有待ち", async () => {
		const { engine, controller } = setup();
		await controller.request("manual");
		expect(controller.current).toBe("shared");
		controller.noteChange("x.md");
		expect(controller.current).toBe("pending");
		engine.unpushed = true;
		engine.results.push({ ...shared, status: "pending", reason: "rejected", attempts: 3 });
		expect((await controller.request("manual")).view).toBe("pending");
	});

	it(".git の中のイベントは編集として数えない", async () => {
		const { controller } = setup();
		await controller.request("manual");
		controller.noteChange(".git/index");
		expect(controller.current).toBe("shared");
	});

	it("定期の確認は間隔がたってから。0 分なら自動の同期をしない", async () => {
		const { engine, controller, advance, setInterval } = setup(5);
		await controller.request("startup");
		expect(controller.tick()).toBeNull();
		advance(5 * 60_000);
		await controller.tick();
		expect(engine.calls).toHaveLength(2);
		setInterval(0);
		advance(60 * 60_000);
		expect(controller.tick()).toBeNull();
		expect(controller.focus()).toBeNull();
		expect((await controller.request("startup")).skipped).toBe(true);
		await controller.request("manual");
		expect(engine.calls).toHaveLength(3);
	});

	it("再フォーカスは前回から 1 分以上たっていれば", async () => {
		const { engine, controller, advance } = setup();
		await controller.request("manual");
		expect(controller.focus()).toBeNull();
		advance(FOCUS_MIN_GAP_MS);
		await controller.focus();
		expect(engine.calls).toHaveLength(2);
	});

	it("自動の同期が続けて失敗したら間隔を倍にする（上限 30 分）。手で実行したときは待たない", async () => {
		const { engine, controller, advance } = setup(5);
		const offline: SyncResult = { ...shared, status: "offline", snapshot: false, attempts: 0 };
		engine.results.push(offline, offline, offline, offline);
		await controller.request("startup"); // 1 回目の失敗。次まで 5 分
		advance(5 * 60_000 - 1);
		expect((await controller.request("interval")).skipped).toBe(true);
		advance(1);
		await controller.request("interval"); // 2 回目。次まで 10 分
		advance(10 * 60_000 - 1);
		expect((await controller.request("focus")).skipped).toBe(true);
		await controller.request("manual"); // 手では待たない。3 回目。次まで 20 分
		expect(engine.calls).toHaveLength(3);
		advance(20 * 60_000 - 1);
		expect((await controller.request("interval")).skipped).toBe(true);
		advance(1);
		await controller.request("interval"); // 4 回目。40 分ではなく上限の 30 分
		advance(30 * 60_000 - 1);
		expect((await controller.request("interval")).skipped).toBe(true);
		advance(1);
		expect((await controller.request("interval")).view).toBe("shared");
		// 成功したら戻る
		advance(5 * 60_000);
		expect((await controller.request("interval")).skipped).toBeUndefined();
	});

	it("オフラインと接続の確認は、状態が変わったときだけ記録する", async () => {
		const { engine, controller, logs } = setup();
		const offline: SyncResult = { ...shared, status: "offline", snapshot: false, attempts: 0, error: new TypeError("fetch failed") };
		engine.results.push(offline, offline);
		await controller.request("manual");
		await controller.request("manual");
		expect(logs.filter((l) => l.event === "offline")).toHaveLength(1);
		expect(logs[0]).toMatchObject({ level: "warn", trigger: "manual", phase: "fetch" });
		engine.results.push({ ...offline, status: "auth" });
		await controller.request("manual");
		expect(logs.map((l) => l.event)).toEqual(["offline", "auth"]);
	});

	it("想定外のエラーは工程とコミットを付けて記録し、同期できませんを出す。次の同期はやり直せる", async () => {
		const { engine, controller, logs } = setup();
		engine.results.push(new TypeError("boom"));
		const out = await controller.request("interval");
		expect(out.view).toBe("error");
		expect(logs[0]).toMatchObject({
			level: "error", event: "unexpected-error", trigger: "interval", phase: "fetch",
			state: { branch: "main", local: "aaa", remote: "bbb" },
		});
		expect((logs[0]?.error as Error).message).toBe("boom");
		expect((await controller.request("manual")).view).toBe("shared");
	});

	it("取り込みの記録が読めないときは、その種類で記録する", async () => {
		const { engine, controller, logs } = setup();
		engine.results.push(new ApplyJournalError("知らない形"));
		await controller.request("manual");
		expect(logs[0]?.event).toBe("apply-journal-unreadable");
	});

	it("自動の回復と、共有待ちの理由を記録する", async () => {
		const { engine, controller, logs } = setup();
		engine.results.push(
			{ ...shared, recovery: { action: "fallback", paths: ["a.md"] } },
			{ ...shared, status: "pending", reason: "rejected", attempts: 3 },
			{ ...shared, status: "pending", reason: "worktree-changed", paths: ["n.md"] },
			{ ...shared, status: "pending", reason: "branch-moved" },
			{ ...shared, recovery: { action: "finished" } },
		);
		for (let i = 0; i < 5; i++) await controller.request("manual");
		expect(logs.map((l) => l.event)).toEqual(["recovered-apply-fallback", "push-rejected", "worktree-changed", "branch-moved"]);
		expect(logs[0]?.paths).toEqual(["a.md"]);
		expect(logs[1]?.state).toMatchObject({ attempt: 3 });
		expect(logs[2]?.paths).toEqual(["n.md"]);
	});

	it("記録や表示に失敗しても、同期の結果を変えない", async () => {
		const engine = new FakeEngine();
		engine.results.push(new Error("boom"));
		const controller = new SyncController({
			engine: () => engine,
			log: () => { throw new Error("log failed"); },
			now: () => 0,
			intervalMinutes: () => 5,
			saveEditors: async () => {},
			onView: () => { throw new Error("view failed"); },
		});
		expect((await controller.request("manual")).view).toBe("error");
		expect((await controller.request("manual")).view).toBe("shared");
	});

	it("この版を残す: 名前を渡し、重なった依頼の名前はまとめる", async () => {
		const { engine, controller } = setup();
		engine.hold();
		const first = controller.request("manual");
		const k1 = controller.request("keep", { keep: "朝" });
		const k2 = controller.request("keep", { keep: "" });
		const k3 = controller.request("keep", { keep: "夜" });
		engine.release();
		await Promise.all([first, k1, k2, k3]);
		expect(engine.calls).toEqual([{}, { keep: "朝 / 夜" }]);
	});

	it("自動の同期が無効なら、起動時は作業ツリーを調べて状態を出す。推測で共有済みにしない", async () => {
		const { engine, controller, views } = setup(0);
		engine.changed.add("draft.md");
		await controller.start();
		expect(views).toEqual(["pending"]);
		expect(engine.calls).toHaveLength(0);
	});

	it("git リポジトリでなければ同期しない", async () => {
		const { engine, controller } = setup();
		engine.repo = false;
		expect(await controller.request("manual")).toMatchObject({ notRepo: true, view: "not-repo" });
		expect(engine.calls).toHaveLength(0);
	});

	it("止めている間（clone の間）は実行しない", async () => {
		const { engine, controller } = setup();
		controller.setPaused(true);
		expect((await controller.request("manual")).skipped).toBe(true);
		expect(engine.calls).toHaveLength(0);
	});
});
