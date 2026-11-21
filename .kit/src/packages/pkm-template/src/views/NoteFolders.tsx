/**
 * Notes の一覧の Folders（ADR-0213）: note/ を 1 本の木で見せる。Slides の一覧（ADR-0124）と同じ見た目と操作。
 * note/ の外の type: note は、木の最後の「Other locations」にまとめる
 */
import { Menu, Platform, setIcon, type App } from "obsidian";
import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { shortDate, tagList } from "../core/note-format";
import { filterByQuery, sortNotes, type NoteInfo, type SortKey } from "../core/note-list";
import { baseName, childrenOf, countIn, isDeletable, locationOf, NOTE_ROOT, outsideNotes } from "../core/note-folders";
import { noteTitle } from "../core/note-title";
import { collectNoteFolders, NoteFolderActions } from "../obsidian/note-folder-actions";

const DRAG_TYPE = "text/x-pkm-note";
/** 開いているフォルダを端末ごとに覚える（Vault の中には書かない） */
const OPEN_KEY = "pkm-template-note-open-folders";
const OTHER = "\u0000other";

function Icon({ name }: { name: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (ref.current) setIcon(ref.current, name);
	}, [name]);
	return <span class="vt-tpl-icon" ref={ref} aria-hidden="true" />;
}

function loadOpen(app: App): Set<string> {
	try {
		const v: unknown = app.loadLocalStorage(OPEN_KEY);
		return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
	} catch {
		return new Set();
	}
}

export function NoteFolders({ app, notes, tick, query }: { app: App; notes: NoteInfo[]; tick: number; query: string }) {
	const actions = useMemo(() => new NoteFolderActions(app), [app]);
	const [sort, setSort] = useState<SortKey>("created");
	const [open, setOpen] = useState<Set<string>>(() => loadOpen(app));
	const [dropOn, setDropOn] = useState<string | null>(null);
	const canDrag = !Platform.isMobile;

	const snapshot = useMemo(() => collectNoteFolders(app), [app, tick]);
	const byPath = useMemo(() => new Map(notes.map((n) => [n.path, n])), [notes]);
	const paths = useMemo(() => notes.map((n) => n.path), [notes]);
	const order = (list: string[]) =>
		sortNotes(
			list.map((p) => byPath.get(p)).filter((n): n is NoteInfo => n !== undefined),
			sort,
			sort === "title" ? "asc" : "desc",
		);

	const found = query.trim() === "" ? null : sortNotes(filterByQuery(notes, query), sort, sort === "title" ? "asc" : "desc");
	const other = order(outsideNotes(paths));

	const toggle = (f: string) => {
		setOpen((cur) => {
			const next = new Set(cur);
			if (next.has(f)) next.delete(f);
			else next.add(f);
			try {
				app.saveLocalStorage(OPEN_KEY, [...next]);
			} catch {
				// 覚えられなくても、開閉はできる
			}
			return next;
		});
	};

	const folderMenu = (e: MouseEvent, f: string) => {
		e.preventDefault();
		e.stopPropagation();
		const menu = new Menu();
		menu.addItem((i) => i.setTitle("New folder").setIcon("folder-plus").onClick(() => actions.newFolder(f)));
		menu.addItem((i) => i.setTitle("Rename").setIcon("pencil").onClick(() => actions.rename(f)));
		menu.addItem((i) => i.setTitle("Move to…").setIcon("folder-input").onClick(() => actions.moveTo(f)));
		menu.addSeparator();
		menu.addItem((i) =>
			i
				.setTitle("Delete")
				.setIcon("trash-2")
				.setDisabled(!isDeletable(snapshot.files, f))
				.onClick(() => void actions.deleteFolder(f)),
		);
		menu.showAtMouseEvent(e);
	};

	const noteMenu = (e: MouseEvent, n: NoteInfo) => {
		e.preventDefault();
		e.stopPropagation();
		const menu = new Menu();
		menu.addItem((i) => i.setTitle("Open in new tab").setIcon("file-plus").onClick(() => void actions.open(n.path, true)));
		menu.addItem((i) => i.setTitle("Move to…").setIcon("folder-input").onClick(() => actions.moveTo(n.path)));
		menu.showAtMouseEvent(e);
	};

	const dragProps = (path: string) =>
		canDrag
			? {
					draggable: true,
					onDragStart: (e: DragEvent) => {
						e.dataTransfer?.setData(DRAG_TYPE, path);
						if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
					},
				}
			: {};

	/** 落とす先。フォルダの行で受けたら、外側（note/ の直下）には伝えない */
	const dropProps = (f: string) => ({
		onDragOver: (e: DragEvent) => {
			if (!e.dataTransfer?.types.includes(DRAG_TYPE)) return;
			e.preventDefault();
			e.stopPropagation();
			e.dataTransfer.dropEffect = "move";
			setDropOn(f);
		},
		onDragLeave: (e: DragEvent) => {
			if (e.currentTarget instanceof Node && e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
			setDropOn((cur) => (cur === f ? null : cur));
		},
		onDrop: (e: DragEvent) => {
			const path = e.dataTransfer?.getData(DRAG_TYPE);
			setDropOn(null);
			if (!path) return;
			e.preventDefault();
			e.stopPropagation();
			void actions.move(path, f);
		},
	});

	const noteRow = (n: NoteInfo, where?: string) => {
		const tags = tagList(n.frontmatter.tags).join(" ");
		return (
			<li key={n.path} class="vt-tpl-item" role="none">
				<div class="vt-tpl-row" onContextMenu={(e) => noteMenu(e, n)} {...dragProps(n.path)}>
					<button type="button" class="vt-tpl-row-main" role="treeitem" onClick={(e) => void actions.open(n.path, e.ctrlKey || e.metaKey)}>
						<span class="vt-tpl-twisty" aria-hidden="true" />
						<Icon name="file-text" />
						<span class="vt-tpl-name">{noteTitle(n.frontmatter, n.basename) || n.basename}</span>
						{where ? <span class="vt-tpl-where">{where}</span> : null}
						<span class="vt-tpl-row-meta">
							{tags ? <span class="vt-tpl-row-tags">{tags}</span> : null}
							<span>{shortDate(n.frontmatter.created)}</span>
						</span>
					</button>
					<button type="button" class="vt-tpl-more" aria-label={`More for ${baseName(n.path)}`} onClick={(e) => noteMenu(e, n)}>
						<Icon name="more-horizontal" />
					</button>
				</div>
			</li>
		);
	};

	const folderRow = (key: string, label: string, count: number, isOpen: boolean, extra: object, children: ComponentChildren, more?: (e: MouseEvent) => void) => (
		<li key={key} class="vt-tpl-item" role="none">
			<div class={`vt-tpl-row is-folder${dropOn === key ? " is-drop" : ""}`} {...extra}>
				<button type="button" class="vt-tpl-row-main" role="treeitem" aria-expanded={isOpen} onClick={() => toggle(key)}>
					<span class="vt-tpl-twisty">
						<Icon name={isOpen ? "chevron-down" : "chevron-right"} />
					</span>
					<Icon name={isOpen ? "folder-open" : "folder"} />
					<span class="vt-tpl-name">{label}</span>
					<span class="vt-tpl-row-meta">{count}</span>
				</button>
				{more ? (
					<button type="button" class="vt-tpl-more" aria-label={`More for ${label}`} onClick={more}>
						<Icon name="more-horizontal" />
					</button>
				) : null}
			</div>
			{isOpen ? (
				<ul class="vt-tpl-group" role="group">
					{children}
				</ul>
			) : null}
		</li>
	);

	const level = (parent: string): ComponentChildren => {
		const kids = childrenOf(snapshot.folders, paths, parent);
		return (
			<>
				{kids.folders.map((f) => {
					const empty = countIn(paths, f) === 0 && childrenOf(snapshot.folders, paths, f).folders.length === 0;
					return folderRow(
						f,
						baseName(f),
						countIn(paths, f),
						open.has(f),
						{ ...dropProps(f), ...dragProps(f), onContextMenu: (e: MouseEvent) => folderMenu(e, f) },
						<>
							{level(f)}
							{empty ? (
								<li class="vt-tpl-item vt-tpl-blank" role="none">
									Empty. Drag a note here, or use Move to….
								</li>
							) : null}
						</>,
						(e) => folderMenu(e, f),
					);
				})}
				{order(kids.notes).map((n) => noteRow(n))}
			</>
		);
	};

	return (
		<div class="vt-tpl-folders">
			<div class="vt-tpl-folder-tools">
				<select class="vt-tpl-select" aria-label="Sort" value={sort} onChange={(e) => setSort(e.currentTarget.value as SortKey)}>
					<option value="created">Created</option>
					<option value="title">Title</option>
				</select>
				<button type="button" class="vt-tpl-button" onClick={() => actions.newFolder(NOTE_ROOT)}>
					<Icon name="folder-plus" />
					New folder
				</button>
			</div>
			{found !== null ? (
				found.length === 0 ? (
					<div class="vt-tpl-empty">No matching notes</div>
				) : (
					<ul class="vt-tpl-tree" role="tree" aria-label="Matching notes">
						{found.map((n) => noteRow(n, locationOf(n.path)))}
					</ul>
				)
			) : notes.length === 0 && snapshot.folders.length <= 1 ? (
				<div class="vt-tpl-empty">No notes</div>
			) : (
				<ul class={`vt-tpl-tree${dropOn === NOTE_ROOT ? " is-drop" : ""}`} role="tree" aria-label="Notes" {...dropProps(NOTE_ROOT)}>
					{level(NOTE_ROOT)}
					{other.length > 0 ? folderRow(OTHER, "Other locations", other.length, open.has(OTHER), {}, other.map((n) => noteRow(n, locationOf(n.path)))) : null}
				</ul>
			)}
		</div>
	);
}
