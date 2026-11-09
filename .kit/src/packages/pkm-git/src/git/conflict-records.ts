import { dirname, type FileStore } from "../fs/file-store";
import { isSafeWorktreePath } from "../merge/path-safety";
import { formatIso } from "../stamp/updated";

/**
 * 中身から分からない衝突の記録（ADR-0103）。
 * 1 件 1 ファイルで、マージのコミットに入れる。作った後は書き換えず、解決したら消す。
 */
export const CONFLICT_RECORD_ROOT = ".pkm-git";
export const CONFLICT_RECORD_DIR = `${CONFLICT_RECORD_ROOT}/conflicts`;

export interface ConflictRecord {
	schemaVersion: 1;
	kind: "kept-modified";
	/** 編集側を残したファイル */
	path: string;
	/** 削除したのが、マージした端末の側か、リモートの側か */
	deleted: "local" | "remote";
	/** マージした端末の名前 */
	device: string;
	at: string;
	local: string;
	remote: string;
	bases: string[];
}

export type LoadedRecord =
	| { file: string; record: ConflictRecord }
	/** 読めない、または知らない schemaVersion。自動では消さない */
	| { file: string; error: string };

/** PKM Git が持つパス（.pkm-git/ の中）。衝突の記録の対象にしない */
export function isPkmGitPath(path: string): boolean {
	return path === CONFLICT_RECORD_ROOT || path.startsWith(`${CONFLICT_RECORD_ROOT}/`);
}

/** FNV-1a（32 bit）。ID を短くするためだけ。秘密の保護には使わない */
function fnv1a(text: string): string {
	let h = 0x811c9dc5;
	for (const b of new TextEncoder().encode(text)) {
		h ^= b;
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h.toString(16).padStart(8, "0");
}

function utcStamp(d: Date): string {
	return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** 記録のファイル名。端末名とパスはファイル名に入れない */
export function conflictRecordPath(record: Pick<ConflictRecord, "path" | "device">, now: Date, taken: (p: string) => boolean): string {
	const id = `${utcStamp(now)}-${fnv1a(`${record.path}\0${record.device}\0${now.toISOString()}`)}`;
	for (let n = 1; ; n++) {
		const candidate = `${CONFLICT_RECORD_DIR}/${id}${n > 1 ? `-${n}` : ""}.json`;
		if (!taken(candidate)) return candidate;
	}
}

export function newConflictRecord(input: Omit<ConflictRecord, "schemaVersion" | "kind" | "at">, now: Date): ConflictRecord {
	return { schemaVersion: 1, kind: "kept-modified", ...input, at: formatIso(now) };
}

export function encodeConflictRecord(record: ConflictRecord): Uint8Array {
	return new TextEncoder().encode(`${JSON.stringify(record, null, 2)}\n`);
}

function isOid(v: unknown): v is string {
	return typeof v === "string" && /^[0-9a-f]{40}$/.test(v);
}

/** 記録を検証する。形が違えば理由を投げる */
export function parseConflictRecord(text: string): ConflictRecord {
	let v: unknown;
	try {
		v = JSON.parse(text);
	} catch {
		throw new Error("JSON として読めません");
	}
	if (typeof v !== "object" || v === null) throw new Error("JSON のオブジェクトではありません");
	const r = v as Record<string, unknown>;
	if (r.schemaVersion !== 1) throw new Error(`知らない schemaVersion です: ${JSON.stringify(r.schemaVersion)}`);
	if (r.kind !== "kept-modified") throw new Error(`知らない kind です: ${JSON.stringify(r.kind)}`);
	if (typeof r.path !== "string" || !isSafeWorktreePath(r.path) || isPkmGitPath(r.path)) throw new Error("path が正しくありません");
	if (r.deleted !== "local" && r.deleted !== "remote") throw new Error("deleted が正しくありません");
	if (typeof r.device !== "string" || typeof r.at !== "string") throw new Error("device か at が正しくありません");
	if (!isOid(r.local) || !isOid(r.remote) || !Array.isArray(r.bases) || !r.bases.every(isOid)) {
		throw new Error("コミットの指定が正しくありません");
	}
	return {
		schemaVersion: 1, kind: "kept-modified", path: r.path, deleted: r.deleted, device: r.device, at: r.at,
		local: r.local, remote: r.remote, bases: [...r.bases],
	};
}

/** 作業ツリーにある記録を読む。読めないものも一覧に出すために返す */
export async function listConflictRecords(store: FileStore): Promise<LoadedRecord[]> {
	if ((await store.stat(CONFLICT_RECORD_DIR))?.type !== "folder") return [];
	const out: LoadedRecord[] = [];
	for (const name of (await store.list(CONFLICT_RECORD_DIR)).sort()) {
		const file = `${CONFLICT_RECORD_DIR}/${name}`;
		if (!name.endsWith(".json") || (await store.stat(file))?.type !== "file") continue;
		try {
			out.push({ file, record: parseConflictRecord(new TextDecoder().decode(await store.read(file))) });
		} catch (e) {
			out.push({ file, error: e instanceof Error ? e.message : String(e) });
		}
	}
	return out;
}

/** 記録を消す（解決）。記録のフォルダの外は消さない。空になったフォルダも片付ける */
export async function removeConflictRecord(store: FileStore, file: string): Promise<void> {
	if (dirname(file) !== CONFLICT_RECORD_DIR || !file.endsWith(".json") || !isSafeWorktreePath(file)) {
		throw new Error(`衝突の記録ではありません: ${JSON.stringify(file)}`);
	}
	if (await store.stat(file)) await store.remove(file);
	for (const dir of [CONFLICT_RECORD_DIR, CONFLICT_RECORD_ROOT]) {
		const stat = await store.stat(dir);
		if (!stat || stat.type !== "folder" || (await store.list(dir)).length > 0) return;
		await store.rmdir(dir);
	}
}
