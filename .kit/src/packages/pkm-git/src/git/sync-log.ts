import type { FileStore } from "../fs/file-store";
import { redactSecrets } from "./http";
import { formatIso } from "../stamp/updated";

/** 同期の記録（ADR-0089 の 8）。.git の中なので、コミットにも同期にも入らない */
export const SYNC_LOG = ".git/pkm-git/log.jsonl";
export const SYNC_LOG_OLD = ".git/pkm-git/log.1.jsonl";
export const SYNC_LOG_MAX_BYTES = 256 * 1024;
const MAX_PATHS = 20;
const MAX_STACK_LINES = 8;
const MAX_MESSAGE = 2000;

export type SyncLogLevel = "error" | "warn";

export interface SyncLogInput {
	level: SyncLogLevel;
	/** 何が起きたか（固定の名前。例: unexpected-error、recovered-apply、push-rejected） */
	event: string;
	trigger?: string;
	phase?: string;
	error?: unknown;
	/** 補足の短い文 */
	detail?: string;
	state?: { branch?: string; local?: string | null; remote?: string | null; attempt?: number };
	paths?: string[];
}

export interface SyncLogEntry {
	schemaVersion: 1;
	time: string;
	level: SyncLogLevel;
	event: string;
	trigger?: string;
	phase?: string;
	kind?: string;
	code?: string;
	message?: string;
	stack?: string;
	detail?: string;
	state?: SyncLogInput["state"];
	paths?: string[];
	pluginVersion: string;
	platform: string;
}

export interface SyncLogOptions {
	store: FileStore;
	pluginVersion: string;
	platform: string;
	/** 伏せる値（トークン）。呼ばれるたびに取り出す */
	secrets: () => Array<string | null | undefined>;
	now?: () => Date;
	maxBytes?: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function describeError(error: unknown, secrets: Array<string | null | undefined>) {
	if (error === undefined) return {};
	const redact = (s: string) => redactSecrets(s, secrets);
	if (error instanceof Error) {
		const code = (error as { code?: unknown }).code;
		return {
			kind: error.name,
			code: typeof code === "string" ? code : undefined,
			message: redact(error.message).slice(0, MAX_MESSAGE),
			stack: error.stack ? redact(error.stack.split("\n").slice(0, MAX_STACK_LINES).join("\n")) : undefined,
		};
	}
	return { kind: typeof error, message: redact(String(error)).slice(0, MAX_MESSAGE) };
}

/**
 * 失敗と自動の回復を、1 行 1 件で残す。書き込みに失敗しても例外を外に出さない（同期の結果を変えない）。
 * 書き込みは直列にする（同時に書いて行が混ざらないように）。
 */
export class SyncLog {
	private queue: Promise<void> = Promise.resolve();
	private readonly now: () => Date;
	private readonly maxBytes: number;

	constructor(private readonly opts: SyncLogOptions) {
		this.now = opts.now ?? (() => new Date());
		this.maxBytes = opts.maxBytes ?? SYNC_LOG_MAX_BYTES;
	}

	/** 項目を作る（テストと表示で使う）。トークンはここで伏せる */
	entry(input: SyncLogInput): SyncLogEntry {
		const secrets = this.opts.secrets();
		const redact = (s: string) => redactSecrets(s, secrets);
		const entry: SyncLogEntry = {
			schemaVersion: 1,
			time: formatIso(this.now()),
			level: input.level,
			event: input.event,
			...(input.trigger ? { trigger: input.trigger } : {}),
			...(input.phase ? { phase: input.phase } : {}),
			...describeError(input.error, secrets),
			...(input.detail ? { detail: redact(input.detail).slice(0, MAX_MESSAGE) } : {}),
			...(input.state ? { state: input.state } : {}),
			...(input.paths && input.paths.length > 0 ? { paths: input.paths.slice(0, MAX_PATHS).map(redact) } : {}),
			pluginVersion: this.opts.pluginVersion,
			platform: this.opts.platform,
		};
		for (const key of Object.keys(entry) as Array<keyof SyncLogEntry>) {
			if (entry[key] === undefined) delete entry[key];
		}
		return entry;
	}

	write(input: SyncLogInput): Promise<void> {
		this.queue = this.queue.then(async () => {
			try {
				const line = encoder.encode(`${JSON.stringify(this.entry(input))}\n`);
				const current = (await this.opts.store.stat(SYNC_LOG)) ? await this.opts.store.read(SYNC_LOG) : new Uint8Array();
				if (current.length > 0 && current.length + line.length > this.maxBytes) {
					await this.opts.store.write(SYNC_LOG_OLD, current);
					await this.opts.store.write(SYNC_LOG, line);
					return;
				}
				const next = new Uint8Array(current.length + line.length);
				next.set(current);
				next.set(line, current.length);
				await this.opts.store.write(SYNC_LOG, next);
			} catch {
				// 記録の失敗で同期の結果を変えない
			}
		});
		return this.queue;
	}

	/** 新しい順。読めない行は飛ばす */
	async read(): Promise<SyncLogEntry[]> {
		await this.queue;
		const out: SyncLogEntry[] = [];
		for (const path of [SYNC_LOG_OLD, SYNC_LOG]) {
			try {
				if (!(await this.opts.store.stat(path))) continue;
				for (const line of decoder.decode(await this.opts.store.read(path)).split("\n")) {
					if (!line.trim()) continue;
					try {
						out.push(JSON.parse(line) as SyncLogEntry);
					} catch { /* 壊れた行は飛ばす */ }
				}
			} catch { /* 読めないファイルは飛ばす */ }
		}
		return out.reverse();
	}
}
