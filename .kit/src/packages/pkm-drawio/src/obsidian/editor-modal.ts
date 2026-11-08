/**
 * Draw.io の編集画面（ADR-0064）。Obsidian の中の Modal に embed の iframe を出し、保存で .drawio.svg 全体を書く。
 * - 書くのは vault.process() の中で、今の中身が編集を始めたとき（か前の保存）と同じときだけ
 * - 違えば上書きせず、別名で保存・上書き・編集に戻るを選ぶ
 * - 保存していない変更があるまま閉じるときは確かめる
 */
import { Modal, Notice, type App, type TFile } from "obsidian";
import { editedCopyPath, freePath } from "../core/names.ts";
import { EditSession, type Effect } from "../core/protocol.ts";
import { DRAWIO_SVG_SUFFIX } from "../core/svg.ts";
import { choose } from "./dialogs.ts";
import { mountEditorFrame, type EditorFrame } from "./frame.ts";

export type EditTarget =
	/** 既にある図。base は編集を始めたときのファイルの中身 */
	| { kind: "existing"; file: TFile; base: string; xml: string }
	/** 新しい図。最初の保存で path に作る（あれば別名） */
	| { kind: "new"; path: string; onCreated?: (file: TFile) => void };

class ConflictError extends Error {}

export class DrawioEditorModal extends Modal {
	private readonly session: EditSession;
	private readonly title: string;
	private frame: EditorFrame | null = null;
	private forced = false;
	private confirming = false;

	constructor(
		app: App,
		private target: EditTarget,
	) {
		super(app);
		const title = target.kind === "existing" ? target.file.basename.replace(/\.drawio$/i, "") : (target.path.split("/").pop() ?? "").replace(/\.drawio\.svg$/i, "");
		this.title = title;
		this.session = new EditSession(target.kind === "existing" ? target.xml : null, title);
	}

	override onOpen(): void {
		this.modalEl.addClass("vt-drawio-modal");
		this.contentEl.addClass("vt-drawio-modal-content");
		// 閉じるボタン（×）は残す。Draw.io が読み込めない（オフライン）ときも、モバイルで閉じられるように
		this.setTitle(`Draw.io: ${this.title}`);
		this.frame = mountEditorFrame(this.contentEl, (msg) => this.apply(this.session.handle(msg)));
	}

	override onClose(): void {
		this.session.dispose();
		this.frame?.destroy();
		this.frame = null;
		this.contentEl.empty();
	}

	/** Esc・× ボタン・外側を押したときも、ここを通る */
	override close(): void {
		if (this.forced || !this.session.dirty) {
			super.close();
			return;
		}
		if (this.confirming) return;
		this.confirming = true;
		void choose(this.app, "保存していない変更があります", "Draw.io で保存してから閉じるか、変更を捨てて閉じるかを選んでください。", [
			{ label: "Back to editing", value: "back" as const, style: "cta" },
			{ label: "Copy XML and close", value: "copy" as const },
			{ label: "Discard and close", value: "discard" as const, style: "warning" },
		]).then(async (choice) => {
			this.confirming = false;
			if (choice === "copy") {
				const xml = this.session.unsavedXml;
				if (xml) {
					try {
						await navigator.clipboard.writeText(xml);
						new Notice("保存していない図の XML をコピーしました");
					} catch {
						new Notice("XML をコピーできませんでした。閉じずに残します");
						return;
					}
				}
			}
			if (choice === "copy" || choice === "discard") this.forceClose();
		});
	}

	private forceClose(): void {
		this.forced = true;
		this.close();
	}

	private apply(effects: Effect[]): void {
		for (const effect of effects) {
			switch (effect.type) {
				case "post":
					this.frame?.post(effect.message);
					break;
				case "write":
					void this.write(effect.svg).then(
						() => this.apply(this.session.writeDone(effect.generation, true)),
						(e: unknown) => this.apply(this.session.writeDone(effect.generation, false, e instanceof Error ? e.message : String(e))),
					);
					break;
				case "close":
					this.forceClose();
					break;
				case "error":
					new Notice(`pkm-drawio: ${effect.message}`, 8000);
					break;
			}
		}
	}

	/** SVG 全体を書く。失敗したら投げる（編集画面は残る） */
	private async write(svg: string): Promise<void> {
		const target = this.target;
		if (target.kind === "new") {
			const vault = this.app.vault;
			const folder = target.path.includes("/") ? target.path.slice(0, target.path.lastIndexOf("/")) : "";
			if (folder && !vault.getAbstractFileByPath(folder)) await vault.createFolder(folder);
			const stem = (target.path.split("/").pop() ?? "").slice(0, -DRAWIO_SVG_SUFFIX.length);
			const path = vault.getAbstractFileByPath(target.path) ? freePath(folder, stem, DRAWIO_SVG_SUFFIX, (p) => vault.getAbstractFileByPath(p) !== null) : target.path;
			const file = await vault.create(path, svg);
			this.target = { kind: "existing", file, base: svg, xml: "" };
			new Notice(`${file.path} を作りました`);
			target.onCreated?.(file);
			return;
		}
		try {
			await this.app.vault.process(target.file, (current) => {
				if (current !== target.base) throw new ConflictError();
				return svg;
			});
			target.base = svg;
		} catch (e) {
			if (!(e instanceof ConflictError)) throw e;
			await this.resolveConflict(target, svg);
		}
	}

	/** 編集中にファイルが変わっていた（同期・別の画面・外のエディタ） */
	private async resolveConflict(target: Extract<EditTarget, { kind: "existing" }>, svg: string): Promise<void> {
		const choice = await choose(this.app, "図のファイルが編集中に変わりました", `${target.file.path} は、編集を始めてから別の場所で変更されています（同期など）。どうしますか。`, [
			{ label: "Save mine as a copy", value: "copy" as const, style: "cta" },
			{ label: "Overwrite", value: "overwrite" as const, style: "warning" },
			{ label: "Back to editing (don't save)", value: "back" as const },
		]);
		if (choice === "copy") {
			const vault = this.app.vault;
			const path = editedCopyPath(target.file.path, new Date(), (p) => vault.getAbstractFileByPath(p) !== null);
			const file = await vault.create(path, svg);
			// 以降の保存は別名の版に書く
			this.target = { kind: "existing", file, base: svg, xml: "" };
			new Notice(`${file.path} に保存しました。以降の保存もこのファイルに書きます`, 8000);
			return;
		}
		if (choice === "overwrite") {
			await this.app.vault.modify(target.file, svg);
			target.base = svg;
			return;
		}
		throw new Error("保存しませんでした（ファイルが編集中に変わったため）");
	}
}
