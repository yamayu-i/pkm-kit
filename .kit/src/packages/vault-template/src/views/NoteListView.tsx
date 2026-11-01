import type { App } from "obsidian";
import type { FunctionComponent } from "preact";
import { useMemo, useState } from "preact/hooks";
import { shortDate, tagList } from "../core/note-format";
import { filterByQuery, importedSourcePaths, notesOfType, sortNotes, type NoteInfo, type SortKey, type SortOrder } from "../core/note-list";
import { dailyDate, noteTitle } from "../core/note-title";
import { collectNotes, useVaultChanges } from "../obsidian/note-index";

interface Column {
	label: string;
	/** 見出しで並べ替えられる列の、並べ替えの種類 */
	sort?: SortKey;
	cell: (note: NoteInfo, ctx: { imported: Set<string> }) => string;
}

interface ListSpec {
	type: string;
	empty: string;
	/** 既定の並べ替え */
	sort: SortKey;
	columns: Column[];
}

const created: Column = { label: "作成", sort: "created", cell: (n) => shortDate(n.frontmatter.created) };
const titleColumn: Column = { label: "タイトル", sort: "title", cell: (n) => noteTitle(n.frontmatter, n.basename) };

/** daily は title を使わず、ファイル名の日付から `2026-11-01 SUN` にする */
const SPECS = {
	daily: {
		type: "daily",
		empty: "デイリーノートがありません",
		sort: "name",
		columns: [{ label: "日付", sort: "name", cell: (n) => dailyDate(n.basename)?.label ?? n.basename }, created],
	},
	note: {
		type: "note",
		empty: "ノートがありません",
		sort: "created",
		columns: [titleColumn, { label: "タグ", cell: (n) => tagList(n.frontmatter.tags).join(" ") }, created],
	},
	source: {
		type: "source",
		empty: "元資料がありません",
		sort: "created",
		columns: [
			titleColumn,
			{ label: "出典", cell: (n) => (typeof n.frontmatter.origin === "string" ? n.frontmatter.origin : "") },
			{ label: "取得", cell: (n) => shortDate(n.frontmatter.retrieved) },
			{ label: "取り込み", cell: (n, ctx) => (ctx.imported.has(n.path) ? "済" : "未") },
		],
	},
} satisfies Record<string, ListSpec>;

function NoteList({ app, spec }: { app: App; spec: ListSpec }) {
	const tick = useVaultChanges(app);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<{ key: SortKey; order: SortOrder }>({ key: spec.sort, order: "desc" });

	const all = useMemo(() => collectNotes(app), [app, tick]);
	const imported = useMemo(() => importedSourcePaths(all), [all]);
	const rows = useMemo(() => sortNotes(filterByQuery(notesOfType(all, spec.type), query), sort.key, sort.order), [all, spec, query, sort]);

	const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, order: s.order === "asc" ? "desc" : "asc" } : { key, order: key === "title" ? "asc" : "desc" }));
	const open = (path: string) => {
		const file = app.vault.getFileByPath(path);
		if (file) void app.workspace.getLeaf(false).openFile(file);
	};

	return (
		<div class="vt-tpl-list">
			<input class="vt-tpl-search" type="search" placeholder="タイトルで絞り込む" aria-label="タイトルで絞り込む" value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
			{rows.length === 0 ? (
				<div class="vt-tpl-empty">{query.trim() === "" ? spec.empty : "一致するノートがありません"}</div>
			) : (
				<table class="vt-tpl-table">
					<thead>
						<tr>
							{spec.columns.map((c) => (
								<th key={c.label} aria-sort={c.sort && c.sort === sort.key ? (sort.order === "asc" ? "ascending" : "descending") : undefined}>
									{c.sort ? (
										<button type="button" class="vt-tpl-sort" onClick={() => toggle(c.sort as SortKey)}>
											{c.label}
											{c.sort === sort.key ? (sort.order === "asc" ? " ↑" : " ↓") : ""}
										</button>
									) : (
										c.label
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((n) => (
							<tr key={n.path}>
								{spec.columns.map((c, i) => (
									<td key={c.label}>
										{i === 0 ? (
											<button type="button" class="vt-tpl-link" onClick={() => open(n.path)}>
												{c.cell(n, { imported }) || n.basename}
											</button>
										) : (
											c.cell(n, { imported })
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

const make = (spec: ListSpec): FunctionComponent<{ app: App }> => ({ app }) => <NoteList app={app} spec={spec} />;

export const DailyListView = make(SPECS.daily);
export const NoteListView = make(SPECS.note);
export const SourceListView = make(SPECS.source);
