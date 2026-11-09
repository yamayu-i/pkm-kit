import git, { Errors, type AuthCallback, type HttpClient, type PromiseFsClient } from "isomorphic-git";
import { dirname, type FileStore } from "../fs/file-store";
import { AuthTargetError, assertAuthTarget } from "./auth-target";
import { createGitFs, GIT_DIR_ROOT } from "../fs/git-fs";
import { assertSafeWorktreePath } from "../merge/path-safety";
import { formatIso, isTargetPath, setUpdated, shouldStamp } from "../stamp/updated";
import { commonBaseTree, mergeTrees, type MergeConflict, type ResultEntry, type TreeEntry } from "../merge/tree-merge";
import { conflictRecordPath, encodeConflictRecord, isPkmGitPath, newConflictRecord } from "./conflict-records";
import { readTreeMap, writeTreeMap } from "./tree";

export interface Author {
	name: string;
	email: string;
}

export interface EngineOptions {
	store: FileStore;
	http: HttpClient;
	/** 端末名。コミットメッセージやコンフリクト版ファイル名に入る */
	deviceName: string;
	author: Author;
	/** 認証情報。トークンは呼ばれるたびに取り出し、エンジン内に保持しない */
	getAuth(): { username: string; password: string } | null;
	/** 認証情報を送ってよいホスト名。http クライアントにも同じ値を渡すこと */
	authHost: string;
	remote?: string;
	now?: () => Date;
	/** 処理名と経過時間のみ。パス・本文・認証情報は渡さない */
	onTiming?: (phase: string, elapsedMs: number) => void;
	/** 通信した工程の、リクエスト数と送受信したバイト数（body のみ。ヘッダーと TLS を除く）。URL・本文・認証情報は渡さない */
	onTransfer?: (phase: string, transfer: Transfer) => void;
}

export interface Transfer {
	requests: number;
	sentBytes: number;
	receivedBytes: number;
}

export type PullResult =
	| { kind: "up-to-date"; snapshot: boolean }
	/** ローカルが先行しているだけ。取り込むものはない */
	| { kind: "ahead"; snapshot: boolean }
	| { kind: "fast-forward"; snapshot: boolean; changed: string[] }
	| { kind: "merged"; snapshot: boolean; changed: string[]; conflicts: MergeConflict[] };

export type PushResult =
	/** リモートに未取り込みのコミットがある。何もしていない */
	| { kind: "behind" }
	| { kind: "nothing" }
	| { kind: "pushed"; snapshot: boolean }
	/** fetch から push までの間に他の端末が push した */
	| { kind: "rejected"; snapshot: boolean };

/** 同期の結果（ADR-0089 の 3・6） */
export type SyncStatus =
	/** 始めまでの編集とコミットを送った */
	| "shared"
	/** 送っていないものが残った（push の拒否が続いた、同期中の編集、外からのコミット） */
	| "pending"
	/** リモートにつながらなかった */
	| "offline"
	/** 認証・接続先の設定の問題 */
	| "auth";

export type PendingReason = "rejected" | "worktree-changed" | "branch-moved";

export interface SyncResult {
	status: SyncStatus;
	/** この同期で snapshot のコミットを作った */
	snapshot: boolean;
	/** 作業ツリーで書き換えたパス（取り込み） */
	changed: string[];
	conflicts: MergeConflict[];
	/** push を試みた回数 */
	attempts: number;
	recovery: RecoveryResult | null;
	/** この同期のマージごとの共通祖先の数（1 以外は同期の記録に残す。ADR-0103 の 4） */
	mergeBases: number[];
	reason?: PendingReason;
	/** pending の理由に関わるパス、offline / auth の元のエラー */
	paths?: string[];
	error?: unknown;
}

/** 取り込みの途中で落ちた後の復旧の結果（ADR-0089 の 5） */
export type RecoveryResult =
	/** 終わっていた。記録を消しただけ */
	| { action: "finished" }
	/** 書きかけのパスを揃えて、ブランチを進めた */
	| { action: "completed"; paths: string[] }
	/** 落ちた後に編集されたパスがあるので、ブランチを進めずに snapshot とマージに任せた */
	| { action: "fallback"; paths: string[] }
	/** ブランチが記録と違う（外で変わった）。記録を消しただけ */
	| { action: "discarded" };

export interface ShareState {
	/** ブランチがリモートの追跡ブランチと違う（送っていないコミットがある） */
	unpushed: boolean;
	/** 作業ツリーで HEAD と違うパス（.gitignore に当たるものを除く） */
	changed: string[];
}

/** ブランチを書き換える直前に、同期の始めの値から変わっていた（PC の Git CLI のコミットなど） */
export class BranchMovedError extends Error {
	constructor(readonly expected: string, readonly actual: string | null) {
		super("同期の間に、ほかの仕組みがブランチを変えました");
		this.name = "BranchMovedError";
	}
}

/** 取り込みの記録が読めない、または知らない形 */
export class ApplyJournalError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ApplyJournalError";
	}
}

/** HTTP の送受信そのものの失敗（つながらない） */
export class NetworkError extends Error {
	constructor(override readonly cause: unknown) {
		super(cause instanceof Error ? cause.message : String(cause));
		this.name = "NetworkError";
	}
}

/** 取り込みの記録（ADR-0089 の 5）。.git の中なのでコミットにも同期にも入らない */
export const APPLY_JOURNAL = ".git/pkm-git/apply.json";
const MAX_PUSH_ATTEMPTS = 3;

interface ApplyJournal {
	schemaVersion: 1;
	branch: string;
	from: string;
	to: string;
}

/** 通信の失敗を、同期の状態に分ける。それ以外は null（想定外のエラーとして扱う） */
export function classifyNetworkError(e: unknown): "offline" | "auth" | null {
	if (e instanceof AuthTargetError || e instanceof Errors.UserCanceledError) return "auth";
	if (e instanceof Errors.HttpError) {
		const status = (e.data as { statusCode?: number } | undefined)?.statusCode ?? 0;
		if (status === 401 || status === 403 || status === 404) return "auth";
		return "offline";
	}
	if (e instanceof NetworkError) return "offline";
	return null;
}

export class WorktreeChangedError extends Error {
	constructor(readonly paths: string[]) {
		super(`処理中にファイルが編集されました: ${paths.join(", ")}`);
		this.name = "WorktreeChangedError";
	}
}

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

export type VersionKind = "synced" | "kept" | "merged" | "other";

export interface FileVersion {
	commit: string;
	/** コミットの時刻（ミリ秒） */
	time: number;
	/** コミットの author の名前（既定は端末名） */
	author: string;
	kind: VersionKind;
	/** kind === "kept" のときの名前（空でもよい） */
	name?: string;
}

export interface FileHistory {
	versions: FileVersion[];
	/** 手元の履歴の始まりに着いた */
	atStart: boolean;
	/** 手元の履歴の始まりに着き、shallow なので取り足せる */
	canDeepen: boolean;
}

/** PKM Git のコミットメッセージから、版の種類を読む（ほかのツールのコミットは other） */
export function describeCommit(oid: string, commit: { message: string; author: { name: string; timestamp: number } }): FileVersion {
	const subject = commit.message.split("\n")[0] ?? "";
	const base = { commit: oid, time: commit.author.timestamp * 1000, author: commit.author.name };
	if (/^vault: snapshot \(/.test(subject)) return { ...base, kind: "synced" };
	if (/^vault: merge /.test(subject)) return { ...base, kind: "merged" };
	const keep = /^vault: keep(?: (.*))? \([^()]*\)$/.exec(subject);
	if (keep) return { ...base, kind: "kept", name: keep[1] ?? "" };
	return { ...base, kind: "other" };
}

export function formatStamp(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** ファイル名に使えない文字を除いた端末名 */
export function sanitizeDeviceName(name: string): string {
	return name.replace(/[\\/:*?"<>|#^[\]\n\r\t]/g, "-").trim() || "device";
}

/** 送受信した body のバイト数を数える。中身は見ない。送受信の失敗は NetworkError にする */
function countingHttp(inner: HttpClient, traffic: Transfer): HttpClient {
	async function* count(
		body: AsyncIterableIterator<Uint8Array>, key: "sentBytes" | "receivedBytes",
	): AsyncIterableIterator<Uint8Array> {
		for await (const chunk of body) {
			traffic[key] += chunk.byteLength;
			yield chunk;
		}
	}
	return {
		async request(req) {
			traffic.requests++;
			let res;
			try {
				res = await inner.request(req.body ? { ...req, body: count(req.body, "sentBytes") } : req);
			} catch (e) {
				// 接続先の検査で止めたものは、そのまま伝える（つながらないのとは別）
				if (e instanceof AuthTargetError) throw e;
				throw new NetworkError(e);
			}
			return res.body ? { ...res, body: count(res.body, "receivedBytes") } : res;
		},
	};
}

export class PkmGit {
	private readonly store: FileStore;
	private readonly fs: PromiseFsClient;
	private readonly dir = GIT_DIR_ROOT;
	private readonly cache = {};
	private readonly remote: string;
	private readonly now: () => Date;
	private readonly http: HttpClient;
	/** これまでの通信の累計。工程ごとの差分を onTransfer に渡す */
	private readonly traffic: Transfer = { requests: 0, sentBytes: 0, receivedBytes: 0 };

	constructor(private readonly opts: EngineOptions) {
		this.store = opts.store;
		this.fs = createGitFs(opts.store);
		this.remote = opts.remote ?? "origin";
		this.now = opts.now ?? (() => new Date());
		this.http = countingHttp(opts.http, this.traffic);
	}

	/** 最後に始めた工程の名前（失敗の記録に使う） */
	lastPhase = "";

	private async measure<T>(phase: string, run: () => Promise<T>): Promise<T> {
		this.lastPhase = phase;
		const start = performance.now();
		try {
			return await this.countTransfer(phase, run);
		} finally {
			// 診断コードの失敗で同期の結果を変えない。
			try { this.opts.onTiming?.(phase, performance.now() - start); } catch { /* diagnostic only */ }
		}
	}

	/** run の間の通信量を onTransfer に渡す。通信しなかったら何も渡さない */
	private async countTransfer<T>(phase: string, run: () => Promise<T>): Promise<T> {
		const before = { ...this.traffic };
		try {
			return await run();
		} finally {
			const requests = this.traffic.requests - before.requests;
			if (requests > 0) {
				try {
					this.opts.onTransfer?.(phase, {
						requests,
						sentBytes: this.traffic.sentBytes - before.sentBytes,
						receivedBytes: this.traffic.receivedBytes - before.receivedBytes,
					});
				} catch { /* diagnostic only */ }
			}
		}
	}

	private get ctx() {
		return { fs: this.fs, dir: this.dir, cache: this.cache };
	}

	private get net() {
		const onAuth: AuthCallback = (url) => {
			// トークンを取り出す前に接続先を検査する
			assertAuthTarget(url, this.opts.authHost);
			return this.opts.getAuth() ?? undefined;
		};
		return {
			http: this.http,
			onAuth,
			// 同じ認証情報で再試行し続けないようにする
			onAuthFailure: () => ({ cancel: true }),
		};
	}

	private signature() {
		const d = this.now();
		return {
			...this.opts.author,
			timestamp: Math.floor(d.getTime() / 1000),
			timezoneOffset: d.getTimezoneOffset(),
		};
	}

	private get device(): string {
		return sanitizeDeviceName(this.opts.deviceName);
	}

	async isRepo(): Promise<boolean> {
		return (await this.store.stat(".git/HEAD")) !== null;
	}

	async clone(url: string, branch: string): Promise<void> {
		await this.countTransfer("clone", () =>
			// 最新の版だけを取る（ADR-0106）。その後の fetch は差分だけを足す
			git.clone({ ...this.ctx, ...this.net, url, ref: branch, singleBranch: true, noCheckout: true, depth: 1 }));
		// 展開する前に、Vault の外や .git に書くパスがないか確かめる
		const tree = await readTreeMap(this.ctx, await git.resolveRef({ ...this.ctx, ref: branch }));
		for (const path of tree.keys()) assertSafeWorktreePath(path);
		await git.checkout({ ...this.ctx, ref: branch, force: true });
	}

	async currentBranch(): Promise<string> {
		const branch = await git.currentBranch({ ...this.ctx, fullname: false });
		if (!branch) throw new Error("ブランチがチェックアウトされていません（detached HEAD）");
		return branch;
	}

	/**
	 * jj の「作業コピーもコミット」の考え方。未コミットの変更を全部コミットする。
	 * @returns コミットしたら true
	 */
	async snapshot(message?: string): Promise<boolean> {
		const indexStat = await this.store.stat(".git/index");
		const matrix = await git.statusMatrix({ ...this.ctx });
		const racy = await this.racyChanges(matrix, indexStat?.mtime ?? 0);
		const toAdd: string[] = [];
		const toRemove: string[] = [];
		let changed = false;
		for (const row of matrix) {
			const [path, head, , stage] = row;
			const workdir = racy.has(path) ? 2 : row[2];
			if (head === 1 && workdir === 1 && stage === 1) continue;
			if (workdir === 0) toRemove.push(path);
			else toAdd.push(path);
			if ((head === 0 && workdir !== 0) || (head === 1 && workdir !== 1)) changed = true;
		}
		for (const path of toRemove) await git.remove({ ...this.ctx, filepath: path });
		if (toAdd.length > 0) {
			// コミットする変更ノートに updated を付与する(1 回のコミットでは同じ時刻。ADR-0028)
			const inHead = new Map(matrix.map(([path, head]) => [path, head === 1]));
			await this.stampUpdated(toAdd.filter(isTargetPath), inHead, formatIso(this.now()));
		}
		if (toAdd.length > 0) await git.add({ ...this.ctx, filepath: toAdd });
		if (!changed) return false;
		await git.commit({
			...this.ctx,
			message: message ?? `vault: snapshot (${this.device})\n`,
			author: this.signature(),
		});
		return true;
	}

	/**
	 * 変更ノートの updated を iso にする(ADR-0028)。付与できない(曖昧な updated、読み込めない、
	 * 読んでから書くまでの間に編集された)ノートは見送り、同期は止めない。
	 * コミット済みの元資料(sources/)は変更されていても付与しない。
	 */
	private async stampUpdated(paths: string[], inHead: ReadonlyMap<string, boolean>, iso: string): Promise<void> {
		const decoder = new TextDecoder("utf-8", { fatal: true });
		const encoder = new TextEncoder();
		let headOid: string | null = null;
		for (const path of paths) {
			try {
				const stat = await this.store.stat(path);
				if (!stat || stat.type !== "file") continue;
				const bytes = await this.store.read(path);
				const text = decoder.decode(bytes);
				let old: string | null = null;
				if (inHead.get(path)) {
					if (path.startsWith("sources/")) continue;
					headOid ??= await git.resolveRef({ ...this.ctx, ref: "HEAD" });
					old = decoder.decode((await git.readBlob({ ...this.ctx, oid: headOid, filepath: path })).blob);
				}
				if (!shouldStamp(old, text)) continue;
				const next = setUpdated(text, iso);
				if (next === text) continue;
				// 書き込みの直前に、読んだ内容から変わっていないことを確かめる
				const current = await this.store.read(path);
				if (current.length !== bytes.length || current.some((b, i) => b !== bytes[i])) continue;
				await this.store.write(path, encoder.encode(next));
			} catch {
				// このノートへの付与は見送る
			}
		}
	}

	/**
	 * isomorphic-git はファイルの更新時刻を秒単位でしか比べないため、
	 * インデックスを書いたのと同じ秒にサイズを変えずに編集すると変更を見落とす（racy git）。
	 * その可能性があるファイルだけ中身のハッシュを HEAD と比べる。
	 */
	private async racyChanges(
		matrix: Array<[string, number, number, number]>,
		indexMtime: number,
	): Promise<Set<string>> {
		const racy = new Set<string>();
		const indexSec = Math.floor(indexMtime / 1000);
		const candidates: string[] = [];
		for (const [path, head, workdir, stage] of matrix) {
			if (head !== 1 || workdir !== 1 || stage !== 1) continue;
			const stat = await this.store.stat(path);
			if (stat && Math.floor(stat.mtime / 1000) >= indexSec) candidates.push(path);
		}
		if (candidates.length === 0) return racy;
		const headMap = await readTreeMap(this.ctx, await git.resolveRef({ ...this.ctx, ref: "HEAD" }));
		for (const path of candidates) {
			if ((await this.worktreeOid(path)) !== headMap.get(path)?.oid) racy.add(path);
		}
		return racy;
	}

	async fetch(branch: string): Promise<string | null> {
		await git.fetch({
			...this.ctx,
			...this.net,
			remote: this.remote,
			// isomorphic-git は singleBranch のとき、ref が指すコミット 1 つだけを「持っている」と
			// サーバーに伝える。ローカルの先端が未 push のコミットだとサーバーはそれを知らず、
			// 共通の履歴がないとみなして全履歴の pack を返す。前回取得したリモートの先端を ref にして、
			// サーバーも知っているコミットを伝える。取得する先は remoteRef で指定する
			ref: await this.haveRef(branch),
			remoteRef: branch,
			singleBranch: true,
			tags: false,
		});
		return this.remoteHead(branch);
	}

	/** fetch で「持っている」と伝えるコミットの ref。追跡ブランチがなければローカルのブランチ */
	private async haveRef(branch: string): Promise<string> {
		const tracking = `refs/remotes/${this.remote}/${branch}`;
		return (await this.remoteHead(branch)) ? tracking : `refs/heads/${branch}`;
	}

	private async remoteHead(branch: string): Promise<string | null> {
		try {
			return await git.resolveRef({ ...this.ctx, ref: `refs/remotes/${this.remote}/${branch}` });
		} catch (e) {
			if (e instanceof Errors.NotFoundError) return null;
			throw e;
		}
	}

	/** 共通祖先をすべて返す（ADR-0103 の 4）。ふつうは 1 つ */
	private async mergeBases(a: string, b: string): Promise<string[]> {
		const bases: string[] = await git.findMergeBase({ ...this.ctx, oids: [a, b] });
		return [...new Set(bases)].sort();
	}

	async pull(): Promise<PullResult> {
		const branch = await this.currentBranch();
		const snapshot = await this.measure("snapshot", () => this.snapshot());
		const remote = await this.measure("fetch", () => this.fetch(branch));
		const local = await git.resolveRef({ ...this.ctx, ref: branch });
		const res = await this.integrate(branch, local, remote);
		switch (res.kind) {
			case "up-to-date":
			case "ahead":
				return { kind: res.kind, snapshot };
			case "fast-forward":
				return { kind: res.kind, snapshot, changed: res.changed };
			case "merged":
				return { kind: res.kind, snapshot, changed: res.changed, conflicts: res.conflicts };
		}
	}

	/** fetch した remote を local に取り込む（作業ツリーとブランチを進める） */
	private async integrate(branch: string, local: string, remote: string | null): Promise<
		| { kind: "up-to-date" | "ahead" }
		| { kind: "fast-forward"; changed: string[] }
		| { kind: "merged"; changed: string[]; conflicts: MergeConflict[]; bases: number }
	> {
		if (!remote || remote === local) return { kind: "up-to-date" };

		const bases = await this.measure("merge-base", () => this.mergeBases(local, remote));
		if (bases.includes(remote)) return { kind: "ahead" };
		if (bases.includes(local)) {
			const changed = await this.measure("moveTo", () => this.moveTo(branch, local, remote));
			return { kind: "fast-forward", changed };
		}

		const [baseMaps, oursMap, theirsMap] = await this.measure("read-trees", () => Promise.all([
			Promise.all(bases.map((b) => readTreeMap(this.ctx, b))),
			readTreeMap(this.ctx, local),
			readTreeMap(this.ctx, remote),
		]));
		const baseMap = baseMaps.length === 1 ? (baseMaps[0] as Map<string, TreeEntry>) : commonBaseTree(baseMaps);
		const { entries, conflicts } = await this.measure("merge", () => mergeTrees({
			base: baseMap,
			ours: oursMap,
			theirs: theirsMap,
			readBlob: async (oid) => (await git.readBlob({ ...this.ctx, oid })).blob,
			labels: { ours: `local (${this.device})`, theirs: `remote (${this.remote}/${branch})` },
			copySuffix: `${this.device} ${formatStamp(this.now())}`,
		}));
		this.addConflictRecords(entries, conflicts, { local, remote, bases });
		const tree = await this.measure("write-tree", () => writeTreeMap(this.ctx, entries));
		const merged = await git.commit({
			...this.ctx,
			message: this.mergeMessage(branch, conflicts),
			author: this.signature(),
			tree,
			parent: [local, remote],
			noUpdateBranch: true,
		});
		const changed = await this.measure("moveTo", () => this.moveTo(branch, local, merged, oursMap));
		return { kind: "merged", changed, conflicts, bases: bases.length };
	}

	/**
	 * 削除と編集の衝突を、マージの結果のツリーに記録として入れる（ADR-0103 の 2）。
	 * マージのコミットと記録が同じコミットになる。.pkm-git/ の中どうしの衝突は記録しない
	 */
	private addConflictRecords(
		entries: Map<string, ResultEntry>, conflicts: MergeConflict[], commits: { local: string; remote: string; bases: string[] },
	): void {
		const now = this.now();
		for (const c of conflicts) {
			if (c.kind !== "kept-modified" || isPkmGitPath(c.path)) continue;
			const record = newConflictRecord({ path: c.path, deleted: c.deleted ?? "remote", device: this.device, ...commits }, now);
			const path = conflictRecordPath(record, now, (p) => entries.has(p));
			entries.set(path, { mode: "100644", content: encodeConflictRecord(record) });
			c.recordPath = path;
		}
	}

	private mergeMessage(branch: string, conflicts: MergeConflict[]): string {
		let msg = `vault: merge ${this.remote}/${branch} (${this.device})\n`;
		if (conflicts.length > 0) {
			msg += "\nConflicts:\n";
			for (const c of conflicts) msg += `  ${c.path} (${c.kind}${c.copyPath ? ` -> ${c.copyPath}` : ""})\n`;
		}
		return msg;
	}

	/**
	 * 作業ツリー・インデックス・ブランチを from から to に進める。
	 * 途中で落ちても「リモートの変更を巻き戻すコミット」が作られないよう、ブランチの更新は最後に行う。
	 */
	private async moveTo(
		branch: string, from: string, to: string, knownFrom?: ReadonlyMap<string, TreeEntry>,
	): Promise<string[]> {
		// マージ時は既に展開した local のツリーを再利用する。
		// 作業ファイルの内容は以下で必ず再確認する。
		const [fromMap, toMap] = await Promise.all([
			knownFrom ?? readTreeMap(this.ctx, from), readTreeMap(this.ctx, to),
		]);
		const writes: string[] = [];
		const deletes: string[] = [];
		for (const [path, e] of toMap) {
			const prev = fromMap.get(path);
			if (!prev || prev.oid !== e.oid) writes.push(path);
		}
		for (const path of fromMap.keys()) if (!toMap.has(path)) deletes.push(path);
		for (const path of [...writes, ...deletes]) assertSafeWorktreePath(path);

		// snapshot 後に編集されたファイルを上書きしない
		const touched: string[] = [];
		for (const path of [...writes, ...deletes]) {
			const expected = fromMap.get(path)?.oid ?? null;
			const actual = await this.worktreeOid(path);
			if (actual !== expected) touched.push(path);
		}
		if (touched.length > 0) throw new WorktreeChangedError(touched);

		// 書く前に記録を残す。途中で落ちても、次の同期の始めに続きを判断できる（ADR-0089 の 5）
		await this.assertBranchAt(branch, from);
		await this.writeJournal({ schemaVersion: 1, branch, from, to });
		await this.applyPaths(toMap, writes, deletes);
		// 外のコミットをブランチから外さない
		await this.assertBranchAt(branch, from);
		await git.writeRef({ ...this.ctx, ref: `refs/heads/${branch}`, value: to, force: true });
		await this.removeJournal();
		return [...writes, ...deletes].sort();
	}

	/** 作業ファイルとインデックスを toMap に合わせる（ブランチは変えない） */
	private async applyPaths(toMap: ReadonlyMap<string, TreeEntry>, writes: string[], deletes: string[]): Promise<void> {
		for (const path of writes) {
			const { blob } = await git.readBlob({ ...this.ctx, oid: (toMap.get(path) as TreeEntry).oid });
			await this.store.write(path, blob);
		}
		for (const path of deletes) {
			if (await this.store.stat(path)) {
				await this.store.remove(path);
				await this.removeEmptyParents(path);
			}
		}
		if (writes.length > 0) await git.add({ ...this.ctx, filepath: writes, force: true });
		for (const path of deletes) await git.remove({ ...this.ctx, filepath: path });
	}

	private async assertBranchAt(branch: string, expected: string): Promise<void> {
		let actual: string | null = null;
		try {
			actual = await git.resolveRef({ ...this.ctx, ref: `refs/heads/${branch}` });
		} catch { /* ない */ }
		if (actual !== expected) throw new BranchMovedError(expected, actual);
	}

	private async writeJournal(journal: ApplyJournal): Promise<void> {
		await this.store.write(APPLY_JOURNAL, new TextEncoder().encode(`${JSON.stringify(journal)}\n`));
	}

	private async removeJournal(): Promise<void> {
		if (await this.store.stat(APPLY_JOURNAL)) await this.store.remove(APPLY_JOURNAL);
	}

	/**
	 * 前回の取り込みが途中で終わっていたら、続きを判断する（ADR-0089 の 5）。
	 * 判断できないときは、今の振る舞い（snapshot とマージ）に任せて、内容を失わない。
	 */
	async recover(branch: string): Promise<RecoveryResult | null> {
		if (!(await this.store.stat(APPLY_JOURNAL))) return null;
		let journal: ApplyJournal;
		try {
			journal = JSON.parse(new TextDecoder().decode(await this.store.read(APPLY_JOURNAL))) as ApplyJournal;
		} catch {
			throw new ApplyJournalError(`取り込みの記録（${APPLY_JOURNAL}）が読めません`);
		}
		if (
			journal?.schemaVersion !== 1 || typeof journal.branch !== "string"
			|| typeof journal.from !== "string" || typeof journal.to !== "string"
		) {
			throw new ApplyJournalError(`取り込みの記録（${APPLY_JOURNAL}）が知らない形です。PKM Git を更新してください`);
		}
		let head: string | null = null;
		try {
			head = await git.resolveRef({ ...this.ctx, ref: `refs/heads/${journal.branch}` });
		} catch { /* ない */ }
		if (journal.branch !== branch || head !== journal.from) {
			await this.removeJournal();
			return head === journal.to && journal.branch === branch ? { action: "finished" } : { action: "discarded" };
		}

		let fromMap: Map<string, TreeEntry>;
		let toMap: Map<string, TreeEntry>;
		try {
			[fromMap, toMap] = await Promise.all([readTreeMap(this.ctx, journal.from), readTreeMap(this.ctx, journal.to)]);
		} catch {
			// 記録の版が読めない。続きは判断できないので、今の振る舞い（snapshot とマージ）に任せる。
			// 記録を残すと、同期のたびに同じところで止まり続ける
			await this.removeJournal();
			return { action: "discarded" };
		}
		const paths = new Set<string>();
		for (const [path, e] of toMap) if (fromMap.get(path)?.oid !== e.oid) paths.add(path);
		for (const path of fromMap.keys()) if (!toMap.has(path)) paths.add(path);
		const writes: string[] = [];
		const deletes: string[] = [];
		const ambiguous: string[] = [];
		for (const path of paths) {
			assertSafeWorktreePath(path);
			const actual = await this.worktreeOid(path);
			const want = toMap.get(path)?.oid ?? null;
			const before = fromMap.get(path)?.oid ?? null;
			if (actual !== want && actual !== before) ambiguous.push(path);
			else if (want === null) deletes.push(path);
			else writes.push(path);
		}
		if (ambiguous.length > 0) {
			await this.removeJournal();
			return { action: "fallback", paths: ambiguous.sort() };
		}
		await this.applyPaths(toMap, writes, deletes);
		await this.assertBranchAt(branch, journal.from);
		await git.writeRef({ ...this.ctx, ref: `refs/heads/${branch}`, value: journal.to, force: true });
		await this.removeJournal();
		return { action: "completed", paths: [...paths].sort() };
	}

	private async worktreeOid(path: string): Promise<string | null> {
		const stat = await this.store.stat(path);
		if (!stat || stat.type !== "file") return null;
		const { oid } = await git.hashBlob({ object: await this.store.read(path) });
		return oid;
	}

	private async removeEmptyParents(path: string): Promise<void> {
		for (let dir = dirname(path); dir !== ""; dir = dirname(dir)) {
			const stat = await this.store.stat(dir);
			if (!stat || (await this.store.list(dir)).length > 0) return;
			await this.store.rmdir(dir);
		}
	}

	/**
	 * 1 回の同期（ADR-0089 の 3）。復旧 → fetch → snapshot → 取り込み → push。
	 * push が拒否されたら fetch からやり直す（MAX_PUSH_ATTEMPTS 回まで）。
	 * つながらない・認証の失敗・同期中の編集・外からのコミットは、例外ではなく状態で返す。
	 * keep を渡すと、fetch の前に（オフラインでも）その名前で snapshot する（「この版を残す」）。
	 */
	async sync(opts: { keep?: string } = {}): Promise<SyncResult> {
		const branch = await this.currentBranch();
		const recovery = await this.measure("recover", () => this.recover(branch));
		const result: SyncResult = { status: "shared", snapshot: false, changed: [], conflicts: [], attempts: 0, recovery, mergeBases: [] };
		const changed = new Set<string>();
		const finish = (patch: Partial<SyncResult>): SyncResult => ({ ...result, ...patch, changed: [...changed].sort() });

		if (opts.keep !== undefined) {
			result.snapshot = await this.measure("snapshot", () => this.snapshot(this.keepMessage(opts.keep ?? "")));
		}
		try {
			for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
				let remote: string | null;
				try {
					remote = await this.measure("fetch", () => this.fetch(branch));
				} catch (e) {
					const status = classifyNetworkError(e);
					if (status) return finish({ status, error: e });
					throw e;
				}
				if (await this.measure("snapshot", () => this.snapshot())) result.snapshot = true;
				const local = await git.resolveRef({ ...this.ctx, ref: branch });
				const res = await this.integrate(branch, local, remote);
				if (res.kind === "fast-forward" || res.kind === "merged") for (const p of res.changed) changed.add(p);
				if (res.kind === "merged") {
					result.conflicts.push(...res.conflicts);
					result.mergeBases.push(res.bases);
				}
				const head = await git.resolveRef({ ...this.ctx, ref: branch });
				if (head === remote) return finish({ status: "shared" });

				result.attempts = attempt;
				try {
					const pushed = await this.measure("push", () => git.push({ ...this.ctx, ...this.net, remote: this.remote, ref: branch }));
					if (pushed.ok) return finish({ status: "shared" });
				} catch (e) {
					if (e instanceof Errors.PushRejectedError) continue;
					const status = classifyNetworkError(e);
					if (status) return finish({ status, error: e });
					throw e;
				}
			}
			return finish({ status: "pending", reason: "rejected" });
		} catch (e) {
			if (e instanceof WorktreeChangedError) return finish({ status: "pending", reason: "worktree-changed", paths: e.paths });
			if (e instanceof BranchMovedError) return finish({ status: "pending", reason: "branch-moved" });
			throw e;
		}
	}

	/**
	 * ファイルを変えたコミットを新しい順に返す（ADR-0110 の 3）。skip 件を飛ばして limit 件まで。
	 * 手元の履歴の始まりに着いたら atStart。shallow の端末では、その先を deepen で取り足せる（canDeepen）
	 */
	async fileHistory(path: string, opts: { skip?: number; limit?: number } = {}): Promise<FileHistory> {
		assertSafeWorktreePath(path);
		const skip = opts.skip ?? 0;
		const limit = opts.limit ?? 30;
		const branch = await this.currentBranch();
		let commits: Awaited<ReturnType<typeof git.log>>;
		try {
			commits = await this.measure("file-history", () =>
				git.log({ ...this.ctx, ref: branch, filepath: path, depth: skip + limit + 1, follow: false }));
		} catch (e) {
			// 一度もコミットされていないファイル
			if (e instanceof Errors.NotFoundError) commits = [];
			else throw e;
		}
		const versions = commits.slice(skip, skip + limit).map((c) => describeCommit(c.oid, c.commit));
		const atStart = commits.length <= skip + limit;
		return { versions, atStart, canDeepen: atStart && (await this.shallowCommits()).length > 0 };
	}

	/** コミットにあるファイルの中身。なければ null */
	async readVersion(commit: string, path: string): Promise<Uint8Array | null> {
		assertSafeWorktreePath(path);
		try {
			return (await git.readBlob({ ...this.ctx, oid: commit, filepath: path })).blob;
		} catch (e) {
			if (e instanceof Errors.NotFoundError) return null;
			throw e;
		}
	}

	/**
	 * shallow の端末の履歴を、commits 個のコミット分だけ取り足す（ADR-0110 の 4）。
	 * 増えたら "deepened"、リモートにもそれより前がなければ "complete"。つながらなければ offline / auth
	 */
	async deepen(commits: number): Promise<"deepened" | "complete" | "offline" | "auth"> {
		const branch = await this.currentBranch();
		const before = (await this.shallowCommits()).join("\n");
		if (before === "") return "complete";
		try {
			await this.measure("deepen", () => this.countTransfer("deepen", () => git.fetch({
				...this.ctx,
				...this.net,
				remote: this.remote,
				ref: `refs/remotes/${this.remote}/${branch}`,
				remoteRef: branch,
				singleBranch: true,
				tags: false,
				depth: commits,
				relative: true,
			})));
		} catch (e) {
			const status = classifyNetworkError(e);
			if (status) return status;
			throw e;
		}
		const after = (await this.shallowCommits()).join("\n");
		return after === before ? "complete" : "deepened";
	}

	/** .git/shallow のコミット（shallow でなければ空） */
	private async shallowCommits(): Promise<string[]> {
		if (!(await this.store.stat(".git/shallow"))) return [];
		const text = new TextDecoder().decode(await this.store.read(".git/shallow"));
		return text.split("\n").map((l) => l.trim()).filter((l) => /^[0-9a-f]{40}$/.test(l)).sort();
	}

	/** 戻す前に、今の内容をコミットする（ADR-0110 の 3）。変更がなければコミットしない */
	async snapshotBeforeRestore(path: string): Promise<boolean> {
		return this.measure("snapshot", () => this.snapshot(this.keepMessage(`before restore ${path}`)));
	}

	private keepMessage(name: string): string {
		const clean = name.replace(/\s+/g, " ").trim().slice(0, 100);
		return `vault: keep${clean ? ` ${clean}` : ""} (${this.device})\n`;
	}

	/**
	 * 共有の状態（ADR-0089 の 6）。paths を渡すと、そのパスだけを HEAD と比べる。
	 * 渡さないと作業ツリー全体を調べる（起動時などに 1 回）。
	 */
	async shareState(paths?: string[]): Promise<ShareState> {
		const branch = await this.currentBranch();
		const head = await git.resolveRef({ ...this.ctx, ref: branch });
		const unpushed = head !== (await this.remoteHead(branch));
		if (paths && paths.length === 0) return { unpushed, changed: [] };
		const indexStat = await this.store.stat(".git/index");
		const matrix = await git.statusMatrix({ ...this.ctx, ...(paths ? { filepaths: paths } : {}) });
		const racy = await this.racyChanges(matrix, indexStat?.mtime ?? 0);
		const changed: string[] = [];
		for (const row of matrix) {
			const [path, headStatus] = row;
			const workdir = racy.has(path) ? 2 : row[2];
			if ((headStatus === 1 && workdir === 1) || (headStatus === 0 && workdir === 0)) continue;
			changed.push(path);
		}
		return { unpushed, changed: changed.sort() };
	}

	/** 失敗の記録用。読めなければ null */
	async refsState(): Promise<{ branch?: string; local: string | null; remote: string | null }> {
		try {
			const branch = await this.currentBranch();
			const local = await git.resolveRef({ ...this.ctx, ref: branch }).catch(() => null);
			return { branch, local, remote: await this.remoteHead(branch).catch(() => null) };
		} catch {
			return { local: null, remote: null };
		}
	}

	async push(): Promise<PushResult> {
		const branch = await this.currentBranch();
		const remote = await this.measure("fetch", () => this.fetch(branch));
		const before = await git.resolveRef({ ...this.ctx, ref: branch });
		if (remote && remote !== before && !(await this.measure("merge-base", () => this.mergeBases(before, remote))).includes(remote)) {
			return { kind: "behind" };
		}
		const snapshot = await this.measure("snapshot", () => this.snapshot());
		const local = await git.resolveRef({ ...this.ctx, ref: branch });
		if (local === remote) return { kind: "nothing" };
		try {
			const res = await this.measure("push", () => git.push({ ...this.ctx, ...this.net, remote: this.remote, ref: branch }));
			if (!res.ok) return { kind: "rejected", snapshot };
		} catch (e) {
			if (e instanceof Errors.PushRejectedError) return { kind: "rejected", snapshot };
			throw e;
		}
		return { kind: "pushed", snapshot };
	}
}
