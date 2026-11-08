import { Errors } from "isomorphic-git";
import { MarkdownView, Notice, Plugin, requestUrl } from "obsidian";
import { AuthTargetError } from "./git/auth-target";
import { PkmGit, WorktreeChangedError, type PullResult } from "./git/engine";
import { createHttpClient, redactSecrets } from "./git/http";
import type { MergeConflict } from "./merge/tree-merge";
import { hasConflictMarkers } from "./merge/text-merge";
import { BehindModal, ConfirmModal, ConflictsModal, type ConflictItem } from "./obsidian/modals";
import { DEFAULT_SETTINGS, PkmGitSettingTab, type PkmGitSettings } from "./obsidian/settings";
import { VaultFileStore } from "./obsidian/vault-store";
import { loadPluginDataOrLegacy } from "../../shared/src/legacy-data";

/** 固定の工程名と時間だけを出力し、診断の失敗を同期へ伝播させない。 */
function reportTiming(phase: string, elapsedMs: number): void {
	try {
		console.debug(`[pkm-git] ${phase}: ${elapsedMs.toFixed(1)} ms`);
	} catch { /* diagnostic only */ }
}

const CONFLICT_COPY_NAME = / \(conflict [^)]+\)(\.[^/]*)?$/;

const CONFLICT_NOTES: Record<MergeConflict["kind"], string> = {
	markers: "コンフリクトマーカー入り",
	copy: "リモート版を採用、ローカル版は別名で保存",
	"kept-modified": "削除と編集が衝突したので編集側を残した",
};

export default class PkmGitPlugin extends Plugin {
	override settings: PkmGitSettings = { ...DEFAULT_SETTINGS };
	private busy = false;
	private statusEl!: HTMLElement;

	override async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new PkmGitSettingTab(this.app, this));

		this.statusEl = this.addStatusBarItem();
		this.statusEl.addClass("mod-clickable");
		this.statusEl.addEventListener("click", () => void this.showUnresolved());

		// リボンのボタンは pkm-ribbon が並びの表で出し、このコマンドを呼ぶ（ADR-0070）
		this.addCommand({ id: "pull", name: "Pull", callback: () => void this.pull() });
		this.addCommand({ id: "push", name: "Push (commit and send)", callback: () => void this.push() });
		this.addCommand({
			id: "show-conflicts",
			name: "List unresolved conflicts",
			callback: () => void this.showUnresolved(),
		});
		this.addCommand({ id: "clone", name: "Clone the remote into this vault (first time only)", callback: () => void this.clone() });

		this.app.workspace.onLayoutReady(() => void this.refreshStatus());
	}

	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...((await loadPluginDataOrLegacy(this, "vault-git")) as Partial<PkmGitSettings> | null) };
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

	/** 多重実行を防ぎ、エラーはトークンを伏せて表示する */
	private async run(label: string, fn: (git: PkmGit) => Promise<void>): Promise<void> {
		if (this.busy) {
			new Notice("Git: 別の処理を実行中です");
			return;
		}
		this.busy = true;
		this.statusEl.setText(`Git: ${label}…`);
		try {
			const git = this.engine();
			if (!(await git.isRepo())) {
				new Notice("Git: この Vault はまだ git リポジトリではありません。「clone」コマンドを使ってください");
				return;
			}
			await this.saveOpenEditors();
			await fn(git);
		} catch (e) {
			if (e instanceof WorktreeChangedError) {
				new Notice("Git: 処理中にファイルが編集されたので中断しました。もう一度実行してください");
			} else if (e instanceof AuthTargetError) {
				new Notice(`Git: ${e.message}\n接続先（.git/config の origin）か、設定の「トークンを送るホスト」を確認してください`, 10_000);
			} else if (e instanceof Errors.UserCanceledError) {
				new Notice("Git: 認証に失敗しました。設定のアクセストークンを確認してください", 10_000);
			} else {
				const message = redactSecrets(e instanceof Error ? e.message : String(e), [this.token()]);
				new Notice(`Git: ${label} に失敗しました\n${message}`, 10_000);
				console.error(`[pkm-git] ${label} failed: ${message}`);
			}
		} finally {
			this.busy = false;
			await this.refreshStatus();
		}
	}

	/** 未保存のエディタ内容を先にディスクへ書く */
	private async saveOpenEditors(): Promise<void> {
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			if (leaf.view instanceof MarkdownView) await leaf.view.save();
		}
	}

	async pull(): Promise<void> {
		await this.run("pull", async (git) => {
			this.reportPull(await git.pull());
		});
	}

	private reportPull(res: PullResult): void {
		switch (res.kind) {
			case "up-to-date":
				new Notice("Git: 最新です");
				return;
			case "ahead":
				new Notice("Git: 取り込む変更はありません（ローカルの方が新しいので push できます）");
				return;
			case "fast-forward":
				new Notice(`Git: ${res.changed.length} 件のファイルを取り込みました`);
				return;
			case "merged":
				if (res.conflicts.length === 0) {
					new Notice(`Git: マージしました（${res.changed.length} 件）`);
					return;
				}
				new Notice(`Git: マージしました。コンフリクト ${res.conflicts.length} 件はそのまま残しています`, 8_000);
				new ConflictsModal(
					this.app,
					"コンフリクトがありました",
					res.conflicts.map((c) => ({
						path: c.copyPath ?? c.path,
						note: c.copyPath ? `${c.path} の${CONFLICT_NOTES[c.kind]}` : CONFLICT_NOTES[c.kind],
					})),
				).open();
		}
	}

	async push(): Promise<void> {
		await this.run("push", async (git) => {
			const res = await git.push();
			switch (res.kind) {
				case "behind":
				case "rejected":
					new BehindModal(this.app, () => void this.pull()).open();
					return;
				case "nothing":
					new Notice("Git: push するものはありません");
					return;
				case "pushed":
					new Notice("Git: push しました");
			}
		});
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
		if (this.busy) return;
		this.busy = true;
		this.statusEl.setText("Git: clone…");
		try {
			await this.engine().clone(url, branch);
			new Notice("Git: clone しました");
		} catch (e) {
			const message = redactSecrets(e instanceof Error ? e.message : String(e), [this.token()]);
			new Notice(`Git: clone に失敗しました\n${message}`, 10_000);
		} finally {
			this.busy = false;
			await this.refreshStatus();
		}
	}

	/** マーカー入りのノートと、コンフリクト版ファイルを探す */
	private async findUnresolved(): Promise<ConflictItem[]> {
		const items: ConflictItem[] = [];
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

	private async refreshStatus(): Promise<void> {
		if (this.busy) return;
		const start = performance.now();
		try {
			const n = (await this.findUnresolved()).length;
			this.statusEl.setText(n > 0 ? `Git: ⚠ ${n} unresolved` : "Git: ✓");
		} finally {
			reportTiming("refreshStatus", performance.now() - start);
		}
	}

	private async showUnresolved(): Promise<void> {
		new ConflictsModal(this.app, "Unresolved conflicts", await this.findUnresolved()).open();
	}
}
