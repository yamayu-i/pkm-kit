import { TFile, setIcon, type App, type Editor, type Plugin } from "obsidian";
import { installLinkChips, resolveVaultPath, type ChipTarget, type LinkChip } from "../../../shared/src/link-chips.ts";
import { LinkPicker, insertAtCursor, renderRow, type PickerSource } from "../../../shared/src/link-picker.ts";
import { markdownLink } from "../../../shared/src/link-query.ts";
import {
	dailyEntries,
	dailyLink,
	headingLink,
	linkIcon,
	noteLinkOf,
	searchDailies,
	searchDecks,
	searchHeadings,
	searchNotes,
	type DailyEntry,
	type DeckInfo,
	type HeadingInfo,
} from "../core/link-search";
import type { NoteInfo } from "../core/note-list";
import { dailyDate, noteTitle } from "../core/note-title";
import type { TemplateManager } from "./creator";
import { collectNotes } from "./note-index";

/**
 * @note・@heading・@daily・@slide（ADR-0194）。検索ダイアログで選んだものへのリンクをカーソルの位置に入れ、
 * 本文のノートへのリンクの前に印を足す
 */

type Report = (message: string, error?: unknown) => void;

function icon(el: HTMLElement, name: string): void {
	const span = el.createSpan({ cls: "vt-icon", attr: { "aria-hidden": "true" } });
	setIcon(span, name);
}

const recencyOf = (app: App) => (path: string) => app.vault.getFileByPath(path)?.stat.mtime ?? 0;

function noteRow(n: NoteInfo, el: HTMLElement): void {
	const folder = n.path.includes("/") ? n.path.slice(0, n.path.lastIndexOf("/")) : "";
	renderRow(el, { lead: (l) => icon(l, linkIcon(n.path, "", n.frontmatter.type) ?? "file-text"), title: noteTitle(n.frontmatter, n.basename), note: folder });
}

function noteSource(app: App, editor: Editor): PickerSource<NoteInfo> {
	const notes = collectNotes(app);
	return {
		placeholder: "Search notes",
		hint: "t:wiki / t:<type> · f:<folder>/",
		search: (q) => searchNotes(notes, q, recencyOf(app)),
		render: noteRow,
		choose: (n) => insertAtCursor(editor, noteLinkOf(n)),
	};
}

/** @heading: ① ノート → ② その見出し。② の空の欄で Backspace を押すと ① に戻る */
type HeadingRow = { note: NoteInfo } | { heading: HeadingInfo; of: NoteInfo };

function headingSource(app: App, editor: Editor): PickerSource<HeadingRow> {
	const notes = collectNotes(app);
	const headingsStep = (n: NoteInfo): PickerSource<HeadingRow> => {
		const file = app.vault.getFileByPath(n.path);
		const headings = (file ? app.metadataCache.getFileCache(file)?.headings : undefined) ?? [];
		const list: HeadingInfo[] = headings.map((h) => ({ heading: h.heading, level: h.level }));
		return {
			placeholder: `Headings in ${noteTitle(n.frontmatter, n.basename)}`,
			hint: "Backspace: back to notes",
			search: (q) => searchHeadings(list, q).map((heading) => ({ heading, of: n })),
			render: (row, el) => {
				if (!("heading" in row)) return;
				renderRow(el, { lead: (l) => l.createSpan({ cls: "vt-link-row-note", text: "#".repeat(row.heading.level) }), title: row.heading.heading });
			},
			choose: (row) => {
				if ("heading" in row) insertAtCursor(editor, headingLink(row.of, row.heading.heading));
			},
			back: (picker) => {
				picker.setSource(first);
				return true;
			},
			empty: "No headings",
		};
	};
	const first: PickerSource<HeadingRow> = {
		placeholder: "Search notes, then a heading",
		hint: "t:wiki / t:<type> · f:<folder>/",
		search: (q) => searchNotes(notes, q, recencyOf(app)).map((note) => ({ note })),
		render: (row, el) => {
			if ("note" in row) noteRow(row.note, el);
		},
		choose: (row, picker) => {
			if (!("note" in row)) return;
			picker.setSource(headingsStep(row.note));
			return "stay";
		},
	};
	return first;
}

/** @daily: ある daily（新しい順）。今日の daily がなければ先頭に「Today」を出し、選ぶと作ってからリンクを入れる */
type DailyRow = { entry: DailyEntry } | { today: DailyEntry };

async function dailySource(app: App, manager: TemplateManager, editor: Editor, report: Report): Promise<PickerSource<DailyRow>> {
	const entries = dailyEntries(app.vault.getMarkdownFiles().map((f) => f.path));
	const { path, existing } = await manager.todaysDaily();
	const d = dailyDate((path.split("/").pop() ?? "").replace(/\.md$/, ""));
	const today: DailyEntry | null = !existing && d ? { path, date: d.date, label: d.label } : null;
	return {
		placeholder: "Search daily notes (e.g. 1120, 2026-11)",
		search: (q) => {
			const rows: DailyRow[] = searchDailies(entries, q).map((entry) => ({ entry }));
			if (today && searchDailies([today], q).length > 0) rows.unshift({ today });
			return rows;
		},
		render: (row, el) => {
			const e = "today" in row ? row.today : row.entry;
			renderRow(el, { lead: (l) => icon(l, "calendar"), title: e.label, note: "today" in row ? "Today (create)" : "" });
		},
		choose: async (row) => {
			if ("entry" in row) return insertAtCursor(editor, dailyLink(row.entry));
			try {
				await manager.createTodaysDaily();
				insertAtCursor(editor, dailyLink(row.today));
			} catch (e) {
				report("今日のデイリーノートを作れませんでした", e);
			}
		},
	};
}

const DECK_BUILD = "index.html";

async function loadDecks(app: App): Promise<DeckInfo[]> {
	const builds = app.vault.getFiles().filter((f) => f.path.startsWith("slide/") && f.name === DECK_BUILD);
	return Promise.all(
		builds.map(async (f) => {
			const folder = f.parent?.path ?? "";
			const source = app.vault.getFileByPath(`${folder}/deck.html`) ?? f;
			const text = await app.vault.cachedRead(source).catch(() => "");
			const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
			const title = (m?.[1] ?? "").replace(/\s+/g, " ").trim() || folder.split("/").pop() || folder;
			return { path: f.path, title, mtime: source.stat.mtime };
		}),
	);
}

function slideSource(decks: DeckInfo[], editor: Editor): PickerSource<DeckInfo> {
	return {
		placeholder: "Search slide decks",
		search: (q) => searchDecks(decks, q),
		render: (d, el) => renderRow(el, { lead: (l) => icon(l, "presentation"), title: d.title, note: d.path.replace(/^slide\//, "").replace(/\/index\.html$/, "") }),
		choose: (d) => insertAtCursor(editor, markdownLink(d.title, d.path)),
		empty: "No slide decks",
	};
}

// ---------- 印 ----------

export function chipFor(app: App, t: ChipTarget): LinkChip | null {
	const path = resolveVaultPath(app, t.path, t.source);
	if (!path) return null;
	const file = app.vault.getFileByPath(path);
	if (!(file instanceof TFile)) return null;
	const type = file.extension === "md" ? app.metadataCache.getFileCache(file)?.frontmatter?.type : undefined;
	const name = linkIcon(path, t.anchor, type);
	if (!name) return null;
	return { mode: "before", key: name, render: (el) => setIcon(el, name) };
}

export function installLinkInsert(plugin: Plugin, manager: TemplateManager, report: Report): void {
	const app = plugin.app;
	const open = <T>(source: PickerSource<T>) => new LinkPicker(app, source).open();
	plugin.addCommand({ id: "insert-note-link", name: "Insert link to note", icon: "link", editorCallback: (editor) => open(noteSource(app, editor)) });
	plugin.addCommand({ id: "insert-heading-link", name: "Insert link to heading", icon: "link", editorCallback: (editor) => open(headingSource(app, editor)) });
	plugin.addCommand({
		id: "insert-daily-link",
		name: "Insert link to daily note",
		icon: "link",
		editorCallback: (editor) => {
			dailySource(app, manager, editor, report).then(open, (e) => report("デイリーノートの一覧を作れませんでした", e));
		},
	});
	plugin.addCommand({
		id: "insert-slide-link",
		name: "Insert link to slide deck",
		icon: "link",
		editorCallback: (editor) => {
			loadDecks(app).then((decks) => open(slideSource(decks, editor)), (e) => report("スライドの一覧を作れませんでした", e));
		},
	});
	installLinkChips(plugin, {
		resolve: (t) => chipFor(app, t),
		subscribe: (fn) => {
			let timer: number | undefined;
			const bump = () => {
				window.clearTimeout(timer);
				timer = window.setTimeout(fn, 300);
			};
			const meta = app.metadataCache.on("resolved", bump);
			const files = [app.vault.on("create", bump), app.vault.on("delete", bump), app.vault.on("rename", bump)];
			return () => {
				window.clearTimeout(timer);
				app.metadataCache.offref(meta);
				for (const r of files) app.vault.offref(r);
			};
		},
	});
}
