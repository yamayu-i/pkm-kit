import { SuggestModal, type App, type Editor } from "obsidian";
import { PAGE_SIZE, pageOf } from "./link-query.ts";
import { registerCloseKey } from "./modal-keys.ts";

/** 検索ダイアログの中身（ADR-0194）。種類ごとに、探し方・描き方・選んだときの処理を決める */
export interface PickerSource<T> {
	placeholder: string;
	/** 絞り込みの書き方などの説明（ダイアログの下に出す） */
	hint?: string;
	/** 打った文字列に合うものすべてを、出す順に */
	search(query: string): T[];
	render(item: T, el: HTMLElement): void;
	/**
	 * 選んだとき。"stay" を返すとダイアログを閉じない（2 段階の検索で次の段に進むとき）。
	 * それ以外はダイアログを閉じる
	 */
	choose(item: T, picker: LinkPicker<T>): "stay" | void | Promise<void>;
	/** 空の欄で Backspace を押したとき（2 段階の検索で前の段に戻る）。true なら処理した */
	back?(picker: LinkPicker<T>): boolean;
	/** 何も出ないときの文言 */
	empty?: string;
}

type Row<T> = { item: T } | { more: number };

/** 「Load more」で 50 件ずつ足す検索ダイアログ */
export class LinkPicker<T> extends SuggestModal<Row<T>> {
	private shown = PAGE_SIZE;
	private lastQuery: string | null = null;
	private source: PickerSource<T>;

	constructor(app: App, source: PickerSource<T>) {
		super(app);
		this.source = source;
		registerCloseKey(this);
		// 件数は自分で絞る（PAGE_SIZE と「Load more」の行）
		this.limit = Number.MAX_SAFE_INTEGER;
		this.modalEl.addClass("vt-link-picker");
		this.apply(source);
		this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key !== "Backspace" || this.inputEl.value !== "" || !this.source.back) return;
			if (this.source.back(this)) e.preventDefault();
		});
	}

	/** 中身を差し替える（2 段階の検索の次の段）。打った文字は消す */
	setSource(source: PickerSource<T>, query = ""): void {
		this.source = source;
		this.apply(source);
		this.setQuery(query);
	}

	setQuery(query: string): void {
		this.inputEl.value = query;
		this.inputEl.dispatchEvent(new Event("input"));
	}

	private apply(source: PickerSource<T>): void {
		this.setPlaceholder(source.placeholder);
		this.emptyStateText = source.empty ?? "No matches";
		this.setInstructions(source.hint ? [{ command: "", purpose: source.hint }] : []);
	}

	override getSuggestions(query: string): Row<T>[] {
		if (query !== this.lastQuery) {
			this.shown = PAGE_SIZE;
			this.lastQuery = query;
		}
		const { items, rest } = pageOf(this.source.search(query), this.shown);
		const rows: Row<T>[] = items.map((item) => ({ item }));
		if (rest > 0) rows.push({ more: rest });
		return rows;
	}

	override renderSuggestion(row: Row<T>, el: HTMLElement): void {
		if ("more" in row) {
			el.addClass("vt-link-more");
			el.setText(`Load more (${row.more})`);
			return;
		}
		el.addClass("vt-link-row");
		this.source.render(row.item, el);
	}

	override selectSuggestion(row: Row<T>, _evt: MouseEvent | KeyboardEvent): void {
		if ("more" in row) {
			this.shown += PAGE_SIZE;
			// 打った文字は変えずに、候補だけを出し直す（同じ文字なので件数は戻らない）
			this.inputEl.dispatchEvent(new Event("input"));
			return;
		}
		if (this.source.choose(row.item, this) === "stay") return;
		this.close();
	}

	override onChooseSuggestion(): void {
		// selectSuggestion で処理する
	}
}

/** エディタのカーソルの位置にリンクを入れる。ダイアログを閉じた後にエディタへ戻る */
export function insertAtCursor(editor: Editor, text: string): void {
	editor.replaceSelection(text);
	editor.focus();
}

/** 検索の行の形: 先頭の印（バッジなど）・題・右の補足 */
export function renderRow(el: HTMLElement, parts: { lead?: (el: HTMLElement) => void; title: string; note?: string; done?: boolean }): void {
	const lead = el.createSpan({ cls: "vt-link-row-lead" });
	parts.lead?.(lead);
	el.createSpan({ cls: `vt-link-row-title${parts.done ? " is-done" : ""}`, text: parts.title });
	if (parts.note) el.createSpan({ cls: "vt-link-row-note", text: parts.note });
}
