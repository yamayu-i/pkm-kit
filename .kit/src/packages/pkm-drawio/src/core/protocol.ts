/**
 * Draw.io の embed（JSON protocol）との通信の状態（ADR-0064）。DOM にも Obsidian にも依存しない。
 * 受け取ったメッセージを、親が行うこと（effect）に変える。iframe とファイルの読み書きは親が行う。
 *
 * 保存の流れ: save（XML）→ その XML を指定して export（xmlsvg）→ 返った SVG を検査 → 親が書く → writeDone
 */
import { decodeDataUri, SVG_MIME, utf8 } from "./encoding.ts";
import { countPages, DrawioFormatError, extractDiagramXml, MAX_SVG_BYTES } from "./svg.ts";

/** 編集画面の origin。postMessage の送り先と、受け取るメッセージの origin */
export const EMBED_ORIGIN = "https://embed.diagrams.net";

/** 編集画面の URL。saveAndExit で「保存して閉じる」を出す。lang は日本語 */
export function embedUrl(): string {
	const params = new URLSearchParams({ embed: "1", proto: "json", spin: "1", saveAndExit: "1", libraries: "1", noExitBtn: "0", lang: "ja" });
	return `${EMBED_ORIGIN}/?${params.toString()}`;
}

/** 受け取るメッセージの大きさの上限（文字数） */
export const MAX_MESSAGE_CHARS = 2 * MAX_SVG_BYTES + 1024 * 1024;

export type IncomingMessage =
	| { event: "init" }
	| { event: "autosave"; xml: string }
	| { event: "save"; xml: string; exit: boolean }
	| { event: "export"; format: string; data: string }
	| { event: "exit"; modified: boolean };

/** iframe から届いた data を読む。知らない形・大きすぎるものは null */
export function parseMessage(data: unknown): IncomingMessage | null {
	if (typeof data !== "string" || data.length > MAX_MESSAGE_CHARS) return null;
	let msg: unknown;
	try {
		msg = JSON.parse(data);
	} catch {
		return null;
	}
	if (typeof msg !== "object" || msg === null) return null;
	const m = msg as Record<string, unknown>;
	switch (m.event) {
		case "init":
			return { event: "init" };
		case "autosave":
			return typeof m.xml === "string" ? { event: "autosave", xml: m.xml } : null;
		case "save":
			return typeof m.xml === "string" ? { event: "save", xml: m.xml, exit: m.exit === true } : null;
		case "export":
			return typeof m.data === "string" && typeof m.format === "string" ? { event: "export", format: m.format, data: m.data } : null;
		case "exit":
			return { event: "exit", modified: m.modified === true };
		default:
			return null;
	}
}

export type Effect =
	/** iframe へ送る（JSON にして送る） */
	| { type: "post"; message: Record<string, unknown> }
	/** SVG 全体を書く。終わったら writeDone(generation, …) を呼ぶ */
	| { type: "write"; svg: string; xml: string; generation: number }
	/** 画面を閉じる */
	| { type: "close" }
	/** 保存に失敗した・受け取れないものが届いた */
	| { type: "error"; message: string };

type Phase = "starting" | "ready" | "exporting" | "writing" | "closed";

export class EditSession {
	private phase: Phase = "starting";
	/** 最後に書けた XML（新しい図なら null） */
	private savedXml: string | null;
	/** 編集画面の最新の XML（autosave / save で更新） */
	private latestXml: string | null;
	/** 保存中の XML と、その世代 */
	private pending: { xml: string; exit: boolean; generation: number } | null = null;
	/** 保存中に届いた次の保存 */
	private queued: { xml: string; exit: boolean } | null = null;
	private closeAfterSave = false;
	/** 最後の保存が失敗した（成功するまで未保存として扱う） */
	private failed = false;
	private generation = 0;

	constructor(
		private readonly initialXml: string | null,
		private readonly title: string,
	) {
		this.savedXml = initialXml;
		this.latestXml = initialXml;
	}

	/** 保存していない変更があるか */
	get dirty(): boolean {
		return this.failed || this.latestXml !== this.savedXml || this.pending !== null || this.queued !== null;
	}

	/** 保存していない変更の XML（退避用） */
	get unsavedXml(): string | null {
		return this.dirty ? (this.queued?.xml ?? this.latestXml) : null;
	}

	get busy(): boolean {
		return this.phase === "exporting" || this.phase === "writing";
	}

	handle(msg: IncomingMessage): Effect[] {
		if (this.phase === "closed") return [];
		switch (msg.event) {
			case "init":
				if (this.phase !== "starting") return [];
				this.phase = "ready";
				return [{ type: "post", message: { action: "load", xml: this.initialXml ?? "", autosave: 1, title: this.title } }];
			case "autosave":
				this.latestXml = msg.xml;
				return [];
			case "save":
				this.latestXml = msg.xml;
				if (this.busy) {
					this.queued = { xml: msg.xml, exit: msg.exit || (this.queued?.exit ?? false) };
					return [];
				}
				return this.startExport(msg.xml, msg.exit);
			case "export":
				return this.onExport(msg);
			case "exit":
				if (this.busy) {
					this.closeAfterSave = true;
					return [];
				}
				return this.close();
		}
	}

	/** 親がファイルを書き終えた（ok = false なら失敗） */
	writeDone(generation: number, ok: boolean, error?: string): Effect[] {
		if (this.phase !== "writing" || !this.pending || this.pending.generation !== generation) return [];
		const done = this.pending;
		this.pending = null;
		this.phase = "ready";
		if (!ok) {
			this.failed = true;
			this.queued = null;
			this.closeAfterSave = false;
			return [
				{ type: "post", message: { action: "spinner", show: false } },
				{ type: "post", message: { action: "status", message: "保存できませんでした", modified: true } },
				{ type: "error", message: error ?? "保存できませんでした" },
			];
		}
		this.savedXml = done.xml;
		this.failed = false;
		const effects: Effect[] = [
			{ type: "post", message: { action: "spinner", show: false } },
			{ type: "post", message: { action: "status", message: "保存しました", modified: this.dirty } },
		];
		if (this.queued) {
			const next = this.queued;
			this.queued = null;
			return [...effects, ...this.startExport(next.xml, next.exit || done.exit)];
		}
		if (done.exit || this.closeAfterSave) return [...effects, ...this.close()];
		return effects;
	}

	/** 閉じた（親が Modal を閉じた） */
	dispose(): void {
		this.phase = "closed";
	}

	private startExport(xml: string, exit: boolean): Effect[] {
		this.generation += 1;
		this.pending = { xml, exit, generation: this.generation };
		this.phase = "exporting";
		return [
			{ type: "post", message: { action: "spinner", show: true, messageKey: "saving" } },
			// 保存した XML を指定して描く。描いている間の編集を混ぜない
			{ type: "post", message: { action: "export", format: "xmlsvg", xml, spinKey: "saving" } },
		];
	}

	private onExport(msg: { format: string; data: string }): Effect[] {
		if (this.phase !== "exporting" || !this.pending || msg.format !== "xmlsvg") {
			return [{ type: "error", message: "頼んでいない書き出しの結果が届いたので無視しました" }];
		}
		const pending = this.pending;
		try {
			const svg = verifyExportedSvg(msg.data, pending.xml);
			this.phase = "writing";
			return [{ type: "write", svg, xml: pending.xml, generation: pending.generation }];
		} catch (e) {
			this.pending = null;
			this.queued = null;
			this.closeAfterSave = false;
			this.failed = true;
			this.phase = "ready";
			const message = e instanceof DrawioFormatError ? e.message : String(e);
			return [
				{ type: "post", message: { action: "spinner", show: false } },
				{ type: "post", message: { action: "status", message: "保存できませんでした", modified: true } },
				{ type: "error", message: `Draw.io から受け取った SVG を保存できません: ${message}` },
			];
		}
	}

	private close(): Effect[] {
		this.phase = "closed";
		return [{ type: "close" }];
	}
}

/** export の data（SVG の data URI）を検査して SVG の文字列にする。保存した XML とページの数が合わなければエラー */
export function verifyExportedSvg(data: string, savedXml: string): string {
	const decoded = decodeDataUri(data);
	if (!decoded || decoded.mime !== SVG_MIME) throw new DrawioFormatError("SVG の data URI ではない");
	if (decoded.bytes.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG が大きすぎる（10 MiB まで）");
	const svg = utf8(decoded.bytes);
	if (svg === null) throw new DrawioFormatError("UTF-8 として読めない");
	const embedded = extractDiagramXml(svg);
	if (embedded.kind !== "diagram") throw new DrawioFormatError("編集用 XML が入っていない");
	const saved = savedXml.trim();
	if (saved.startsWith("<") && countPages(embedded.xml) !== countPages(saved)) {
		throw new DrawioFormatError(`ページの数が合わない（保存 ${countPages(saved)}、SVG ${countPages(embedded.xml)}）`);
	}
	return svg;
}
