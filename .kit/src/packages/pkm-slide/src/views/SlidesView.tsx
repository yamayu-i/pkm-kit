/**
 * 一覧の View「Slides」（ADR-0120、ADR-0124）: slide/ を 1 本の木で見せる。
 * フォルダの行を押すと開閉し、中のフォルダとデッキの行を字下げして並べる。デッキの縮小と題は、PC でホバーしたときだけカードで出す。
 * フォルダを作る・名前を変える・動かす・消す、デッキを動かす（メニューとドラッグ）
 */
import { Menu, Platform, setIcon, type App } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { baseName, childrenOf, isWithin, parentOf, SLIDE_ROOT } from "../core/decks.ts";
import type { SlideActions } from "../obsidian/actions.ts";
import type { Deck, SlideModel } from "../obsidian/model.ts";

export interface SlidesViewProps {
	app: App;
	model: SlideModel;
	actions: SlideActions;
}

type Sort = "updated" | "name";
const DRAG_TYPE = "text/x-pkm-slide";
/** 開いているフォルダを端末ごとに覚える（Vault の中には書かない） */
const OPEN_KEY = "pkm-slide-open-folders";
/** ホバーしてからカードを出すまでの待ち */
const PREVIEW_DELAY_MS = 350;
/** カードの大きさ（styles.css の .vt-sl-preview と同じ） */
const PREVIEW_WIDTH = 288;
const PREVIEW_HEIGHT = 228;

interface Preview {
	deck: Deck;
	top: number;
	left: number;
}

function Icon({ name }: { name: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (ref.current) setIcon(ref.current, name);
	}, [name]);
	return <span class="vt-sl-icon" ref={ref} aria-hidden="true" />;
}

function useSnapshot(model: SlideModel) {
	const [snapshot, setSnapshot] = useState(model.snapshot);
	useEffect(() => model.subscribe(() => setSnapshot(model.snapshot)), [model]);
	return snapshot;
}

function formatTime(ms: number): string {
	if (ms === 0) return "";
	const d = new Date(ms);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** slide/ からの位置（検索の結果に出す）。slide/ の直下は空 */
function location(path: string): string {
	const parent = parentOf(path);
	return parent === SLIDE_ROOT ? "" : parent.slice(SLIDE_ROOT.length + 1);
}

function loadOpen(app: App): Set<string> {
	try {
		const v: unknown = app.loadLocalStorage(OPEN_KEY);
		return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
	} catch {
		return new Set();
	}
}

export function SlidesView({ app, model, actions }: SlidesViewProps) {
	const { tree, decks } = useSnapshot(model);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<Sort>("updated");
	const [open, setOpen] = useState<Set<string>>(() => loadOpen(app));
	const [dropOn, setDropOn] = useState<string | null>(null);
	const [preview, setPreview] = useState<Preview | null>(null);
	const pageRef = useRef<HTMLDivElement>(null);
	const timer = useRef<number | null>(null);
	const canDrag = !Platform.isMobile;
	const canHover = !Platform.isMobile;

	const byPath = useMemo(() => new Map(decks.map((d) => [d.path, d])), [decks]);
	const deckPaths = useMemo(() => decks.map((d) => d.path), [decks]);
	const order = (list: Deck[]) => list.sort((a, b) => (sort === "updated" ? b.mtime - a.mtime : baseName(a.path).localeCompare(baseName(b.path), "ja")));
	const countIn = (f: string) => decks.filter((d) => isWithin(d.path, f)).length;

	const q = query.trim().toLowerCase();
	const found = q === "" ? [] : order(decks.filter((d) => baseName(d.path).includes(q) || d.title.toLowerCase().includes(q) || d.path.toLowerCase().includes(q)));

	useEffect(() => () => {
		if (timer.current !== null) window.clearTimeout(timer.current);
	}, []);

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

	const hidePreview = () => {
		if (timer.current !== null) window.clearTimeout(timer.current);
		timer.current = null;
		setPreview(null);
	};

	const showPreview = (e: MouseEvent, d: Deck) => {
		if (!canHover) return;
		const row = e.currentTarget as HTMLElement;
		hidePreview();
		timer.current = window.setTimeout(() => {
			const page = pageRef.current;
			const name = row.querySelector(".vt-sl-name");
			if (!page || !name) return;
			const p = page.getBoundingClientRect();
			const r = row.getBoundingClientRect();
			const n = name.getBoundingClientRect();
			const below = r.bottom + PREVIEW_HEIGHT + 8 <= window.innerHeight;
			const top = below ? r.bottom - p.top + 4 : r.top - p.top - PREVIEW_HEIGHT - 4;
			const left = Math.max(0, Math.min(n.left - p.left, p.width - PREVIEW_WIDTH));
			setPreview({ deck: d, top, left });
		}, PREVIEW_DELAY_MS);
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
				.setDisabled(countIn(f) > 0)
				.onClick(() => void actions.deleteFolder(f)),
		);
		menu.showAtMouseEvent(e);
	};

	const deckMenu = (e: MouseEvent, d: Deck) => {
		e.preventDefault();
		e.stopPropagation();
		hidePreview();
		const menu = new Menu();
		menu.addItem((i) => i.setTitle("Open in new tab").setIcon("file-plus").onClick(() => void actions.open(d, true)));
		menu.addItem((i) => i.setTitle("Open in browser").setIcon("presentation").onClick(() => actions.openInBrowser(d)));
		menu.addItem((i) => i.setTitle("Copy link").setIcon("link").onClick(() => void actions.copyLink(d)));
		menu.addItem((i) => i.setTitle("Edit notes").setIcon("notebook-pen").onClick(() => void actions.editNotes(d, false)));
		menu.addSeparator();
		menu.addItem((i) => i.setTitle("Rename").setIcon("pencil").onClick(() => actions.rename(d.path)));
		menu.addItem((i) => i.setTitle("Move to…").setIcon("folder-input").onClick(() => actions.moveTo(d.path)));
		menu.showAtMouseEvent(e);
	};

	const dragProps = (path: string) =>
		canDrag
			? {
					draggable: true,
					onDragStart: (e: DragEvent) => {
						hidePreview();
						e.dataTransfer?.setData(DRAG_TYPE, path);
						if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
					},
				}
			: {};

	/** 落とす先。フォルダの行で受けたら、外側（slide/ の直下）には伝えない */
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

	const deckRow = (d: Deck, where?: string) => (
		<li key={d.path} class="vt-sl-item" role="none">
			<div class="vt-sl-row" onContextMenu={(e) => deckMenu(e, d)} onMouseEnter={(e) => showPreview(e, d)} onMouseLeave={hidePreview} {...dragProps(d.path)}>
				<button type="button" class="vt-sl-row-main" role="treeitem" onClick={(e) => void actions.open(d, e.ctrlKey || e.metaKey)} onFocus={hidePreview}>
					<span class="vt-sl-twisty" aria-hidden="true" />
					<Icon name="presentation" />
					<span class="vt-sl-name">{baseName(d.path)}</span>
					{where ? <span class="vt-sl-where">{where}</span> : null}
					<span class="vt-sl-meta">
						{d.index ? `${d.slides} slides` : "Not built"}
						<span class="vt-sl-time">{formatTime(d.mtime)}</span>
					</span>
				</button>
				<button type="button" class="vt-sl-more" aria-label={`More for ${baseName(d.path)}`} onClick={(e) => deckMenu(e, d)}>
					<Icon name="more-horizontal" />
				</button>
			</div>
		</li>
	);

	const level = (parent: string) => {
		const kids = childrenOf(tree.folders, deckPaths, parent);
		const items = order(kids.decks.map((p) => byPath.get(p)).filter((d): d is Deck => d !== undefined));
		return (
			<>
				{kids.folders.map((f) => {
					const isOpen = open.has(f);
					return (
						<li key={f} class="vt-sl-item" role="none">
							<div class={`vt-sl-row is-folder${dropOn === f ? " is-drop" : ""}`} {...dropProps(f)} onContextMenu={(e) => folderMenu(e, f)} {...dragProps(f)}>
								<button type="button" class="vt-sl-row-main" role="treeitem" aria-expanded={isOpen} onClick={() => toggle(f)}>
									<span class="vt-sl-twisty">
										<Icon name={isOpen ? "chevron-down" : "chevron-right"} />
									</span>
									<Icon name={isOpen ? "folder-open" : "folder"} />
									<span class="vt-sl-name">{baseName(f)}</span>
									<span class="vt-sl-count-in">{countIn(f)}</span>
								</button>
								<button type="button" class="vt-sl-more" aria-label={`More for ${baseName(f)}`} onClick={(e) => folderMenu(e, f)}>
									<Icon name="more-horizontal" />
								</button>
							</div>
							{isOpen ? (
								<ul class="vt-sl-group" role="group">
									{level(f)}
									{countIn(f) === 0 && childrenOf(tree.folders, deckPaths, f).folders.length === 0 ? (
										<li class="vt-sl-item vt-sl-blank" role="none">
											Empty. Drag a slide here, or use Move to….
										</li>
									) : null}
								</ul>
							) : null}
						</li>
					);
				})}
				{items.map((d) => deckRow(d))}
			</>
		);
	};

	return (
		<div class="vt-sl-page" ref={pageRef}>
			<header class="vt-sl-head">
				<h2 class="vt-sl-title">Slides</h2>
				<span class="vt-sl-count">{decks.length}</span>
				<div class="vt-sl-tools">
					<label class="vt-sl-search">
						<Icon name="search" />
						<input type="search" placeholder="Search slides" aria-label="Search slides" value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
					</label>
					<select class="vt-sl-sort" aria-label="Sort" value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as Sort)}>
						<option value="updated">Updated</option>
						<option value="name">Name</option>
					</select>
					<button type="button" class="vt-sl-btn" onClick={() => actions.newFolder(SLIDE_ROOT)}>
						<Icon name="folder-plus" />
						New folder
					</button>
				</div>
			</header>
			{decks.length === 0 && tree.folders.length <= 1 ? (
				<div class="vt-sl-empty">
					<p>No slides yet.</p>
					<p>Ask Claude Code to make a slide deck. Decks are created under slide/.</p>
				</div>
			) : q !== "" ? (
				found.length === 0 ? (
					<div class="vt-sl-empty">
						<p>No matching slides</p>
					</div>
				) : (
					<ul class="vt-sl-tree" role="tree" aria-label="Matching slides">
						{found.map((d) => deckRow(d, location(d.path)))}
					</ul>
				)
			) : (
				<ul class={`vt-sl-tree${dropOn === SLIDE_ROOT ? " is-drop" : ""}`} role="tree" aria-label="Slides" {...dropProps(SLIDE_ROOT)}>
					{level(SLIDE_ROOT)}
				</ul>
			)}
			{preview ? (
				<div class="vt-sl-preview" style={{ top: `${preview.top}px`, left: `${preview.left}px` }} aria-hidden="true">
					<div class="vt-sl-thumb">
						{preview.deck.index ? (
							<iframe sandbox="" loading="lazy" tabIndex={-1} title="" src={`${app.vault.getResourcePath(preview.deck.index)}#thumb`} />
						) : (
							<span class="vt-sl-unbuilt">Not built</span>
						)}
					</div>
					<span class="vt-sl-preview-title">{preview.deck.title}</span>
					<span class="vt-sl-preview-meta">
						{preview.deck.slides} slides · {preview.deck.path}
					</span>
				</div>
			) : null}
		</div>
	);
}
