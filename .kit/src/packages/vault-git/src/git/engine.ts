import git, { Errors, type AuthCallback, type HttpClient, type PromiseFsClient } from "isomorphic-git";
import { dirname, type FileStore } from "../fs/file-store";
import { assertAuthTarget } from "./auth-target";
import { createGitFs, GIT_DIR_ROOT } from "../fs/git-fs";
import { assertSafeWorktreePath } from "../merge/path-safety";
import { formatIso, isTargetPath, setUpdated, shouldStamp } from "../stamp/updated";
import { mergeTrees, type MergeConflict, type TreeEntry } from "../merge/tree-merge";
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

export class WorktreeChangedError extends Error {
	constructor(readonly paths: string[]) {
		super(`処理中にファイルが編集されました: ${paths.join(", ")}`);
		this.name = "WorktreeChangedError";
	}
}

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

export function formatStamp(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** ファイル名に使えない文字を除いた端末名 */
export function sanitizeDeviceName(name: string): string {
	return name.replace(/[\\/:*?"<>|#^[\]\n\r\t]/g, "-").trim() || "device";
}

export class VaultGit {
	private readonly store: FileStore;
	private readonly fs: PromiseFsClient;
	private readonly dir = GIT_DIR_ROOT;
	private readonly cache = {};
	private readonly remote: string;
	private readonly now: () => Date;

	constructor(private readonly opts: EngineOptions) {
		this.store = opts.store;
		this.fs = createGitFs(opts.store);
		this.remote = opts.remote ?? "origin";
		this.now = opts.now ?? (() => new Date());
	}

	private async measure<T>(phase: string, run: () => Promise<T>): Promise<T> {
		const start = performance.now();
		try {
			return await run();
		} finally {
			// 診断コードの失敗で同期の結果を変えない。
			try { this.opts.onTiming?.(phase, performance.now() - start); } catch { /* diagnostic only */ }
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
			http: this.opts.http,
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
		await git.clone({ ...this.ctx, ...this.net, url, ref: branch, singleBranch: true, noCheckout: true });
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
	async snapshot(): Promise<boolean> {
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
			message: `vault: snapshot (${this.device})\n`,
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
			ref: branch,
			singleBranch: true,
			tags: false,
		});
		return this.remoteHead(branch);
	}

	private async remoteHead(branch: string): Promise<string | null> {
		try {
			return await git.resolveRef({ ...this.ctx, ref: `refs/remotes/${this.remote}/${branch}` });
		} catch (e) {
			if (e instanceof Errors.NotFoundError) return null;
			throw e;
		}
	}

	private async mergeBase(a: string, b: string): Promise<string | null> {
		const bases: string[] = await git.findMergeBase({ ...this.ctx, oids: [a, b] });
		return bases[0] ?? null;
	}

	async pull(): Promise<PullResult> {
		const branch = await this.currentBranch();
		const snapshot = await this.measure("snapshot", () => this.snapshot());
		const remote = await this.measure("fetch", () => this.fetch(branch));
		const local = await git.resolveRef({ ...this.ctx, ref: branch });
		if (!remote || remote === local) return { kind: "up-to-date", snapshot };

		const base = await this.measure("merge-base", () => this.mergeBase(local, remote));
		if (base === remote) return { kind: "ahead", snapshot };
		if (base === local) {
			const changed = await this.measure("moveTo", () => this.moveTo(branch, local, remote));
			return { kind: "fast-forward", snapshot, changed };
		}

		const [baseMap, oursMap, theirsMap] = await this.measure("read-trees", () => Promise.all([
			base ? readTreeMap(this.ctx, base) : Promise.resolve(new Map<string, TreeEntry>()),
			readTreeMap(this.ctx, local),
			readTreeMap(this.ctx, remote),
		]));
		const { entries, conflicts } = await this.measure("merge", () => mergeTrees({
			base: baseMap,
			ours: oursMap,
			theirs: theirsMap,
			readBlob: async (oid) => (await git.readBlob({ ...this.ctx, oid })).blob,
			labels: { ours: `local (${this.device})`, theirs: `remote (${this.remote}/${branch})` },
			copySuffix: `${this.device} ${formatStamp(this.now())}`,
		}));
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
		return { kind: "merged", snapshot, changed, conflicts };
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

		for (const path of writes) {
			const { blob } = await git.readBlob({ ...this.ctx, oid: (toMap.get(path) as TreeEntry).oid });
			await this.store.write(path, blob);
		}
		for (const path of deletes) {
			await this.store.remove(path);
			await this.removeEmptyParents(path);
		}
		if (writes.length > 0) await git.add({ ...this.ctx, filepath: writes, force: true });
		for (const path of deletes) await git.remove({ ...this.ctx, filepath: path });
		await git.writeRef({ ...this.ctx, ref: `refs/heads/${branch}`, value: to, force: true });
		return [...writes, ...deletes].sort();
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

	async push(): Promise<PushResult> {
		const branch = await this.currentBranch();
		const remote = await this.measure("fetch", () => this.fetch(branch));
		const before = await git.resolveRef({ ...this.ctx, ref: branch });
		if (remote && remote !== before && (await this.measure("merge-base", () => this.mergeBase(before, remote))) !== remote) {
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
