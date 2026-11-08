/** tmp/ のファイルの一覧 View（ADR-0045）。Markdown 以外も出し、開く・消す */
import { Notice, Platform, TFile, type App } from "obsidian";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import { useEffect, useMemo, useState } from "preact/hooks";
import { collectTmpEntries, filterTmpEntries, formatModified, formatSize, isTmpPath, openableInObsidian, sortTmpEntries, type SortOrder, type TmpEntry, type TmpSortKey } from "../core/tmp-list";
import { ConfirmDeleteModal } from "../obsidian/ConfirmDeleteModal";
import { useVaultChanges } from "../obsidian/note-index";

/** PC の Obsidian が持つ、OS の既定のアプリで開く関数（公開の API にはない） */
type WithDefaultApp = App & { openWithDefaultApp?: (path: string) => void };

const COLUMNS: { label: string; sort?: TmpSortKey }[] = [{ label: "Name", sort: "name" }, { label: "Type" }, { label: "Modified", sort: "modified" }, { label: "Size", sort: "size" }, { label: "" }];

/** tmp/ のファイルの中身が変わったら再描画させる（Markdown 以外は metadataCache の通知が来ないので、更新日時と大きさが古くなる） */
function useTmpModify(app: App): number {
	const [n, setN] = useState(0);
	useEffect(() => {
		const ref = app.vault.on("modify", (file) => {
			if (isTmpPath(file.path)) setN((x) => x + 1);
		});
		return () => app.vault.offref(ref);
	}, [app]);
	return n;
}

export function TmpListView({ app }: { app: App }) {
	const tick = useVaultChanges(app);
	const modified = useTmpModify(app);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<{ key: TmpSortKey; order: SortOrder }>({ key: "modified", order: "desc" });

	const all = useMemo(() => collectTmpEntries(app.vault.getFiles()), [app, tick, modified]);
	const rows = useMemo(() => sortTmpEntries(filterTmpEntries(all, query), sort.key, sort.order), [all, query, sort]);

	const toggle = (key: TmpSortKey) => setSort((s) => (s.key === key ? { key, order: s.order === "asc" ? "desc" : "asc" } : { key, order: key === "name" ? "asc" : "desc" }));

	const open = (entry: TmpEntry) => {
		const file = app.vault.getFileByPath(entry.path);
		if (!file) return;
		if (openableInObsidian(entry.ext)) {
			void openInNotePane(app.workspace, file, { newTab: false, phone: Platform.isPhone });
			return;
		}
		const withDefault = app as WithDefaultApp;
		if (Platform.isDesktopApp && typeof withDefault.openWithDefaultApp === "function") withDefault.openWithDefaultApp(file.path);
		else new Notice(`${entry.name} は Obsidian で開けません`);
	};

	const remove = (entry: TmpEntry) => {
		new ConfirmDeleteModal(app, entry.path, () => {
			const file = app.vault.getAbstractFileByPath(entry.path);
			if (!(file instanceof TFile)) return;
			app.fileManager.trashFile(file).catch((e: unknown) => {
				console.error("pkm-template: 削除できませんでした", e);
				new Notice(`削除できませんでした: ${e instanceof Error ? e.message : String(e)}`);
			});
		}).open();
	};

	return (
		<div class="vt-tpl-list">
			<input class="vt-tpl-search" type="search" placeholder="Filter by name" aria-label="Filter by name" value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
			{rows.length === 0 ? (
				<div class="vt-tpl-empty">{query.trim() === "" ? "No temporary files" : "No matching files"}</div>
			) : (
				<table class="vt-tpl-table vt-tpl-tmp-table">
					<thead>
						<tr>
							{COLUMNS.map((c) => (
								<th key={c.label} aria-sort={c.sort && c.sort === sort.key ? (sort.order === "asc" ? "ascending" : "descending") : undefined}>
									{c.sort ? (
										<button type="button" class="vt-tpl-sort" onClick={() => toggle(c.sort as TmpSortKey)}>
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
						{rows.map((e) => (
							<tr key={e.path}>
								<td>
									<button type="button" class="vt-tpl-link" onClick={() => open(e)}>
										{e.name}
									</button>
								</td>
								<td>{e.ext}</td>
								<td class="vt-tpl-nowrap">{formatModified(e.mtime)}</td>
								<td class="vt-tpl-nowrap">{formatSize(e.size)}</td>
								<td>
									<button type="button" class="vt-tpl-delete" aria-label={`Delete ${e.name}`} onClick={() => remove(e)}>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
