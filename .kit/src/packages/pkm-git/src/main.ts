import { Errors } from "isomorphic-git";
import { MarkdownView, Notice, Platform, Plugin, requestUrl, TFile, type TAbstractFile } from "obsidian";
import { AuthTargetError } from "./git/auth-target";
import { ApplyJournalError, PkmGit, type SyncResult, type Transfer } from "./git/engine";
import { createHttpClient, redactSecrets } from "./git/http";
import { listConflictRecords, removeConflictRecord, type ConflictRecord } from "./git/conflict-records";
import { SyncLog } from "./git/sync-log";
import type { MergeConflict } from "./merge/tree-merge";
import { hasConflictMarkers } from "./merge/text-merge";
import { ConfirmModal, ConflictsModal, KeepVersionModal, SyncLogModal, type ConflictItem } from "./obsidian/modals";
import { DEFAULT_SETTINGS, normalizeMinutes, PkmGitSettingTab, type PkmGitSettings } from "./obsidian/settings";
import { SyncController, type RunOutcome, type ShareView, type Trigger } from "./sync/controller";
import { VaultFileStore } from "./obsidian/vault-store";
import { loadPluginDataOrLegacy } from "../../shared/src/legacy-data";

/** 固定の工程名と時間だけを出力し、診断の失敗を同期へ伝播させない。 */
function reportTiming(phase: string, elapsedMs: number): void {
	try {
		console.debug(`[pkm-git] ${phase}: ${elapsedMs.toFixed(1)} ms`);
	} catch { /* diagnostic only */ }
}

/** 固定の工程名と、リクエスト数・body のバイト数だけを出力する。URL・本文・認証情報は出さない。 */
function reportTransfer(phase: string, t: Transfer): void {
	try {
		console.debug(`[pkm-git] ${phase}: ${t.requests} requests, sent ${t.sentBytes} B, received ${t.receivedBytes} B`);
	} catch { /* diagnostic only */ }
}

const CONFLICT_COPY_NAME = / \(conflict [^)]+\)(\.[^/]*)?$/;

function keptModifiedNote(record: ConflictRecord): string {
	return record.deleted === "local"
		? `${record.device} で削除し、ほかの端末で編集されていたので、編集側を残しました`
		: `ほかの端末で削除し、${record.device} で編集されていたので、編集側を残しました`;
}

const CONFLICT_NOTES: Record<MergeConflict["kind"], string> = {
	markers: "コンフリクトマーカー入り",
	copy: "リモート版を採用、ローカル版は別名で保存",
	"kept-modified": "削除と編集が衝突したので編集側を残した",
};

/** ステータスバーの共有の状態（ADR-0089 の 6。文言は ADR-0076 で英語） */
const VIEW_TEXT: Record<ShareView, string> = {
	checking: "Git: Checking…",
	syncing: "Git: Syncing…",
	shared: "Git: Synced",
	pending: "Git: Not synced",
	offline: "Git: Offline",
	auth: "Git: Check connection",
	error: "Git: Sync failed",
	"not-repo": "Git: Not cloned",
};

/** 定期の確認の間隔。実際に同期するかは設定の間隔で決める */
const TICK_MS = 30_000;
const MANUAL: ReadonlySet<Trigger> = new Set(["manual", "keep", "pull", "push"]);

export default class PkmGitPlugin extends Plugin {
	override settings: PkmGitSettings = { ...DEFAULT_SETTINGS };
	private cloning = false;
	private statusEl!: HTMLElement;
	private view: ShareView = "checking";
	private unresolved = 0;
	private authNoticeShown = false;
	private controller!: SyncController;
	private log!: SyncLog;
	/** 読めない衝突の記録のうち、この起動で同期の記録に残したもの（数え直すたびに残さない） */
	private readonly loggedUnreadable = new Set<string>();

	override async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new PkmGitSettingTab(this.app, this));

		this.statusEl = this.addStatusBarItem();
		this.statusEl.addClass("mod-clickable");
		this.statusEl.addEventListener("click", () => void this.showUnresolved());

		this.log = new SyncLog({
			store: new VaultFileStore(this.app),
			pluginVersion: this.manifest?.version ?? "unknown",
			platform: Platform.isMobile ? "mobile" : "desktop",
			secrets: () => [this.token()],
		});
		this.controller = new SyncController({
			engine: () => this.engine(),
			log: (entry) => this.log.write(entry),
			now: () => Date.now(),
			intervalMinutes: () => normalizeMinutes(this.settings.autoSyncMinutes),
			saveEditors: () => this.saveOpenEditors(),
			onView: (view) => this.setView(view),
		});

		// リボンのボタンは pkm-ribbon が並びの表で出し、このコマンドを呼ぶ（ADR-0070）
		this.addCommand({ id: "sync", name: "Sync now", callback: () => void this.sync() });
		this.addCommand({ id: "keep-version", name: "Keep this version", callback: () => this.keepVersion() });
		this.addCommand({ id: "show-sync-log", name: "Show sync log", callback: () => void this.showSyncLog() });
		// 以前のコマンド。どちらも同期する（取り込んでから送る。ADR-0089 の 3）
		this.addCommand({ id: "pull", name: "Pull", callback: () => void this.pull() });
		this.addCommand({ id: "push", name: "Push (commit and send)", callback: () => void this.push() });
		this.addCommand({
			id: "show-conflicts",
			name: "List unresolved conflicts",
			callback: () => void this.showUnresolved(),
		});
		this.addCommand({ id: "clone", name: "Clone the remote into this vault (first time only)", callback: () => void this.clone() });

		this.registerTriggers();
		this.app.workspace.onLayoutReady(() => {
			// 起動中の Vault の読み込みでは、全ファイルの create が届く。読み込みの後から数える
			this.registerVaultEvents();
			void this.startup();
		});
	}

	override onunload(): void {
		this.controller?.setPaused(true);
	}

	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...((await loadPluginDataOrLegacy(this, "vault-git")) as Partial<PkmGitSettings> | null) };
		this.settings.autoSyncMinutes = normalizeMinutes(this.settings.autoSyncMinutes);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private token(): string | null {
		const id = this.settings.tokenSecretId;
		return id ? this.app.secretStorage.getSecret(id) : null;
	}

	private engine(): PkmGit {
		const s = this.settings;
		return new PkmGit({
			store: new VaultFileStore(this.app),
			http: createHttpClient(async ({ url, method, headers, body }) => {
				const res = await requestUrl({
					url,
					method,
					headers,
					body,
					contentType: headers["content-type"] ?? headers["Content-Type"],
					throw: false,
				});
				return { status: res.status, headers: res.headers, arrayBuffer: res.arrayBuffer };
			}, s.authHost),
			deviceName: s.deviceName,
			onTiming: reportTiming,
			onTransfer: reportTransfer,
			author: {
				name: s.authorName || s.deviceName,
				email: s.authorEmail || "pkm-git@localhost",
			},
			authHost: s.authHost,
			getAuth: () => {
				const token = this.token();
				return token ? { username: s.username || "x-access-token", password: token } : null;
			},
		});
	}

	/** 編集を「共有待ち」に数えるためのイベント（ADR-0089 の 6） */
	private registerVaultEvents(): void {
		const vault = this.app.vault as unknown as {
			on?: (name: string, cb: (file: TAbstractFile, oldPath?: string) => void) => unknown;
		};
		if (typeof vault.on !== "function") return;
		for (const name of ["create", "modify", "delete"]) {
			this.registerEvent(vault.on(name, (file) => this.controller.noteChange(file.path)) as never);
		}
		this.registerEvent(vault.on("rename", (file, oldPath) => {
			this.controller.noteChange(file.path);
			if (oldPath) this.controller.noteChange(oldPath);
		}) as never);
	}

	/** 前景での一定の間隔と、再フォーカス（ADR-0089 の 3）。バックグラウンドの実行は前提にしない */
	private registerTriggers(): void {
		const doc = typeof document === "undefined" ? null : document;
		const win = typeof window === "undefined" ? null : window;
		const visible = () => !doc || doc.visibilityState !== "hidden";
		if (win) {
			this.registerInterval(win.setInterval(() => {
				if (visible()) void this.handle(this.controller.tick());
			}, TICK_MS));
			this.registerDomEvent(win, "focus", () => void this.handle(this.controller.focus()));
		}
		if (doc) {
			this.registerDomEvent(doc, "visibilitychange", () => {
				if (visible()) void this.handle(this.controller.focus());
			});
		}
	}

	private async startup(): Promise<void> {
		// 先に同期をキューに入れる（後から来た手の同期が、起動時の同期より先に走らないように）
		const started = this.controller.start();
		await this.refreshUnresolved();
		await this.handle(started);
	}

	/** 開いているエディタの未保存の内容を先にディスクへ書く */
	private async saveOpenEditors(): Promise<void> {
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			if (leaf.view instanceof MarkdownView) await leaf.view.save();
		}
	}

	async sync(): Promise<void> {
		await this.request("manual");
	}

	async pull(): Promise<void> {
		await this.request("pull");
	}

	async push(): Promise<void> {
		await this.request("push");
	}

	private keepVersion(): void {
		new KeepVersionModal(this.app, (name) => void this.request("keep", { keep: name })).open();
	}

	private async request(trigger: Trigger, opts: { keep?: string } = {}): Promise<void> {
		if (this.cloning) {
			new Notice("Git: clone の途中です。終わってから実行してください");
			return;
		}
		if (this.controller.running) new Notice("Git: 同期の途中です。終わったら続けて実行します");
		await this.handle(this.controller.request(trigger, opts));
	}

	/** 同期の結果を通知する。自動の同期では、使う人が知るべきことだけを出す（ADR-0089 の 6） */
	private async handle(pending: Promise<RunOutcome | null> | null): Promise<void> {
		if (!pending) return;
		let outcome: RunOutcome | null;
		try {
			outcome = await pending;
		} catch (e) {
			const message = redactSecrets(String(e), [this.token()]);
			console.error(`[pkm-git] sync failed: ${message}`);
			return;
		}
		if (!outcome || outcome.skipped) return;
		const manual = MANUAL.has(outcome.trigger);
		try {
			if (outcome.result && (outcome.result.changed.length > 0 || outcome.result.conflicts.length > 0)) {
				await this.refreshUnresolved();
			}
			this.report(outcome, manual);
		} catch (e) {
			const message = redactSecrets(String(e), [this.token()]);
			console.error(`[pkm-git] report failed: ${message}`);
		}
	}

	private report(outcome: RunOutcome, manual: boolean): void {
		if (outcome.notRepo) {
			if (manual) new Notice("Git: この Vault はまだ git リポジトリではありません。「clone」コマンドを使ってください");
			return;
		}
		if (outcome.error !== undefined) {
			if (manual || outcome.previous !== "error") this.reportError(outcome.error, outcome.trigger);
			return;
		}
		const res = outcome.result as SyncResult;
		if (res.conflicts.length > 0) {
			new Notice(`Git: マージしました。コンフリクト ${res.conflicts.length} 件はそのまま残しています`, 8_000);
			if (manual) {
				new ConflictsModal(
					this.app,
					"コンフリクトがありました",
					res.conflicts.map((c) => ({
						path: c.copyPath ?? c.path,
						note: c.copyPath
							? `${c.path} の${CONFLICT_NOTES[c.kind]}`
							: `${CONFLICT_NOTES[c.kind]}${c.recordPath ? "（「List unresolved conflicts」で残すか削除するかを選べます）" : ""}`,
					})),
				).open();
			}
		}
		if (outcome.trigger === "keep" && res.status !== "auth") {
			if (!res.snapshot) new Notice("Git: 変更がないので、今の版がそのまま残っています");
			else if (res.status === "shared") new Notice("Git: この版を残して送りました");
			else new Notice("Git: この版を残しました。次の同期で送ります");
			return;
		}
		switch (res.status) {
			case "auth":
				if (manual || !this.authNoticeShown) this.reportAuth(res.error);
				return;
			case "offline":
				if (manual) new Notice("Git: リモートにつながりませんでした。編集はこの端末に残っていて、次につながったときに送ります");
				return;
			case "pending":
				if (!manual) return;
				if (res.reason === "worktree-changed") new Notice("Git: 同期の間にファイルが編集されたので、取り込みを止めました。次の同期で続けます");
				else if (res.reason === "branch-moved") new Notice("Git: 同期の間にほかの仕組み（Git の CLI など）がコミットしたので、次の同期で続けます");
				else new Notice("Git: ほかの端末と送るのが重なり続けたので、次の同期でもう一度送ります");
				return;
			case "shared":
				if (manual && res.conflicts.length === 0) {
					new Notice(res.changed.length > 0 ? `Git: 同期しました（取り込み ${res.changed.length} 件）` : "Git: 同期しました");
				}
		}
	}

	private reportAuth(error: unknown): void {
		this.authNoticeShown = true;
		if (error instanceof AuthTargetError) {
			new Notice(`Git: ${error.message}\n接続先（.git/config の origin）か、設定の「トークンを送るホスト」を確認してください`, 10_000);
		} else if (error instanceof Errors.UserCanceledError) {
			new Notice("Git: 認証に失敗しました。設定のアクセストークンを確認してください", 10_000);
		} else {
			const message = redactSecrets(error instanceof Error ? error.message : String(error), [this.token()]);
			new Notice(`Git: リモートに入れませんでした。接続先とアクセストークンを確認してください\n${message}`, 10_000);
		}
	}

	private reportError(error: unknown, trigger: Trigger): void {
		const message = redactSecrets(error instanceof Error ? error.message : String(error), [this.token()]);
		const hint = error instanceof ApplyJournalError ? "" : "\n内容は失われていません。コマンド「Show sync log」で記録を見られます";
		new Notice(`Git: 同期できませんでした\n${message}${hint}`, 10_000);
		console.error(`[pkm-git] ${trigger} failed: ${message}`);
	}

	private async showSyncLog(): Promise<void> {
		new SyncLogModal(this.app, await this.log.read()).open();
	}

	async clone(): Promise<void> {
		const git = this.engine();
		if (await git.isRepo()) {
			new Notice("Git: この Vault はすでに git リポジトリです");
			return;
		}
		const { cloneUrl, cloneBranch } = this.settings;
		if (!/^https:\/\/[^/@\s]+\/\S+$/.test(cloneUrl)) {
			new Notice("Git: 設定に https:// のリモート URL を入れてください（URL に認証情報は含めない）");
			return;
		}
		new ConfirmModal(
			this.app,
			"リモートを clone します",
			`${cloneUrl} (${cloneBranch}) をこの Vault に展開します。同じ名前のファイルはリモートの内容で上書きされます。`,
			() => void this.doClone(cloneUrl, cloneBranch),
		).open();
	}

	private async doClone(url: string, branch: string): Promise<void> {
		if (this.cloning) return;
		this.cloning = true;
		this.controller.setPaused(true);
		await this.controller.idle();
		this.statusEl.setText("Git: Cloning…");
		try {
			await this.engine().clone(url, branch);
			new Notice("Git: clone しました");
		} catch (e) {
			const message = redactSecrets(e instanceof Error ? e.message : String(e), [this.token()]);
			new Notice(`Git: clone に失敗しました\n${message}`, 10_000);
			await this.log.write({ level: "error", event: "clone-failed", trigger: "manual", phase: "clone", error: e });
		} finally {
			this.cloning = false;
			this.controller.setPaused(false);
			await this.refreshUnresolved();
			await this.handle(this.controller.start());
		}
	}

	/** マーカー入りのノートと、コンフリクト版ファイルを探し、衝突の記録を足す（ADR-0103） */
	private async findUnresolved(): Promise<ConflictItem[]> {
		const items: ConflictItem[] = [];
		try {
			items.push(...(await this.recordItems()));
		} catch (error) {
			await this.log.write({ level: "error", event: "conflict-records-failed", phase: "conflict-records", error });
		}
		for (const file of this.app.vault.getFiles()) {
			if (CONFLICT_COPY_NAME.test(file.path)) {
				items.push({ path: file.path, note: "コンフリクト版（不要なら削除）" });
			} else if (["md", "markdown", "txt"].includes(file.extension)) {
				if (hasConflictMarkers(await this.app.vault.cachedRead(file))) {
					items.push({ path: file.path, note: "コンフリクトマーカー入り" });
				}
			}
		}
		return items;
	}

	/**
	 * 衝突の記録の行（ADR-0103 の 3）。ファイルがもうない記録は解決済みとして消す。
	 * 読めない記録は自動では消さず、「Delete record」だけを付ける
	 */
	private async recordItems(): Promise<ConflictItem[]> {
		const store = new VaultFileStore(this.app);
		const items: ConflictItem[] = [];
		for (const loaded of await listConflictRecords(store)) {
			if ("error" in loaded) {
				if (!this.loggedUnreadable.has(loaded.file)) {
					this.loggedUnreadable.add(loaded.file);
					await this.log.write({
						level: "warn", event: "conflict-record-unreadable", phase: "conflict-records", detail: loaded.error, paths: [loaded.file],
					});
				}
				items.push({
					path: loaded.file,
					note: `読めない衝突の記録（${loaded.error}）。新しい版のプラグインが書いたものかもしれません`,
					openable: false,
					actions: [{ label: "Delete record", run: () => this.resolveRecord(loaded.file) }],
				});
				continue;
			}
			const { file, record } = loaded;
			if (!(await store.stat(record.path))) {
				await removeConflictRecord(store, file);
				this.controller.noteChange(file);
				continue;
			}
			items.push({
				path: record.path,
				note: keptModifiedNote(record),
				actions: [
					{ label: "Keep", run: () => this.resolveRecord(file) },
					{ label: "Delete", run: () => this.confirmDeleteKept(record.path, file) },
				],
			});
		}
		return items;
	}

	/** 記録を消して（解決）、同期する。解決は次の同期でほかの端末にも届く */
	private async resolveRecord(file: string): Promise<void> {
		try {
			await removeConflictRecord(new VaultFileStore(this.app), file);
			this.controller.noteChange(file);
		} catch (e) {
			new Notice(`Git: 記録を消せませんでした\n${e instanceof Error ? e.message : String(e)}`, 8_000);
			return;
		} finally {
			await this.refreshUnresolved();
		}
		await this.sync();
	}

	private confirmDeleteKept(path: string, file: string): void {
		new ConfirmModal(
			this.app,
			"Delete file",
			`${path} を削除します（Obsidian の「削除したファイル」の設定に従います）。衝突の記録も消します。`,
			() => void this.deleteKept(path, file),
		).open();
	}

	private async deleteKept(path: string, file: string): Promise<void> {
		try {
			const target = this.app.vault.getAbstractFileByPath(path);
			if (target instanceof TFile) await this.app.fileManager.trashFile(target);
			else if (await this.app.vault.adapter.exists(path)) await this.app.vault.adapter.trashLocal(path);
			this.controller.noteChange(path);
		} catch (e) {
			new Notice(`Git: 削除できませんでした\n${e instanceof Error ? e.message : String(e)}`, 8_000);
			return;
		}
		await this.resolveRecord(file);
	}

	/** 未解決の件数を数え直す（全ノートを読むので、起動時と取り込んだときだけ。ADR-0089 の 6） */
	private async refreshUnresolved(): Promise<void> {
		const start = performance.now();
		try {
			this.unresolved = (await this.findUnresolved()).length;
			this.renderStatus();
		} catch (e) {
			console.error("[pkm-git] refreshStatus failed", e);
		} finally {
			reportTiming("refreshStatus", performance.now() - start);
		}
	}

	private setView(view: ShareView): void {
		this.view = view;
		this.renderStatus();
	}

	private renderStatus(): void {
		this.statusEl?.setText(`${VIEW_TEXT[this.view]}${this.unresolved > 0 ? ` · ⚠ ${this.unresolved}` : ""}`);
	}

	private async showUnresolved(): Promise<void> {
		const items = await this.findUnresolved();
		this.unresolved = items.length;
		this.renderStatus();
		new ConflictsModal(this.app, "未解決のコンフリクト", items).open();
	}
}
