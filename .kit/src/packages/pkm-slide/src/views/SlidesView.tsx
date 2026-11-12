/**
 * 一覧の View「Slides」（ADR-0120）: 左に整理のフォルダの木、右に選んだフォルダの下のデッキのカード。
 * フォルダを作る・名前を変える・動かす・消す、デッキを動かす（メニューとドラッグ）
 */
import { Menu, Platform, setIcon, type App } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { baseName, folderLabel, isWithin, parentOf, SLIDE_ROOT } from "../core/decks.ts";
import type { SlideActions } from "../obsidian/actions.ts";
import type { Deck, SlideModel } from "../obsidian/model.ts";

export interface SlidesViewProps {
	app: App;
	model: SlideModel;
	actions: SlideActions;
}

type Sort = "updated" | "title";
const DRAG_TYPE = "text/x-pkm-slide";

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

export function SlidesView({ app, model, actions }: SlidesViewProps) {
	const { tree, decks } = useSnapshot(model);
	const [folder, setFolder] = useState(SLIDE_ROOT);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<Sort>("updated");
	const [dropOn, setDropOn] = useState<string | null>(null);
	const current = tree.folders.includes(folder) ? folder : SLIDE_ROOT;
	const canDrag = !Platform.isMobile;

	const shown = useMemo(() => {
		const q = query.trim().toLowerCase();
		const list = decks.filter((d) => isWithin(d.path, current) && (q === "" || d.title.toLowerCase().includes(q) || d.path.toLowerCase().includes(q)));
		return list.sort((a, b) => (sort === "updated" ? b.mtime - a.mtime : a.title.localeCompare(b.title, "ja")));
	}, [decks, current, query, sort]);

	const countIn = (f: string) => decks.filter((d) => isWithin(d.path, f)).length;

	const folderMenu = (e: MouseEvent, f: string) => {
		e.preventDefault();
		e.stopPropagation();
		const menu = new Menu();
		menu.addItem((i) => i.setTitle("New folder").setIcon("folder-plus").onClick(() => actions.newFolder(f)));
		if (f !== SLIDE_ROOT) {
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
		}
		menu.showAtMouseEvent(e);
	};

	const deckMenu = (e: MouseEvent, d: Deck) => {
		e.preventDefault();
		e.stopPropagation();
		const menu = new Menu();
		menu.addItem((i) => i.setTitle("Open in new tab").setIcon("file-plus").onClick(() => void actions.open(d, true)));
		menu.addItem((i) => i.setTitle("Open in browser").setIcon("presentation").onClick(() => actions.openInBrowser(d)));
		menu.addItem((i) => i.setTitle("Copy link").setIcon("link").onClick(() => void actions.copyLink(d)));
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
						e.dataTransfer?.setData(DRAG_TYPE, path);
						if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
					},
				}
			: {};

	const dropProps = (f: string) => ({
		onDragOver: (e: DragEvent) => {
			if (!e.dataTransfer?.types.includes(DRAG_TYPE)) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			setDropOn(f);
		},
		onDragLeave: () => setDropOn((cur) => (cur === f ? null : cur)),
		onDrop: (e: DragEvent) => {
			const path = e.dataTransfer?.getData(DRAG_TYPE);
			setDropOn(null);
			if (!path) return;
			e.preventDefault();
			void actions.move(path, f);
		},
	});

	return (
		<div class="vt-sl-page">
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
						<option value="title">Title</option>
					</select>
					<button type="button" class="vt-sl-btn" onClick={() => actions.newFolder(current)}>
						<Icon name="folder-plus" />
						New folder
					</button>
				</div>
			</header>
			<div class="vt-sl-body">
				<nav class="vt-sl-tree" aria-label="Folders">
					{tree.folders.map((f) => {
						const depth = f === SLIDE_ROOT ? 0 : f.split("/").length - 1;
						return (
							<div key={f} class={`vt-sl-folder${f === current ? " is-selected" : ""}${dropOn === f ? " is-drop" : ""}`} data-depth={Math.min(depth, 4)} {...dropProps(f)} onContextMenu={(e) => folderMenu(e, f)}>
								<button type="button" class="vt-sl-folder-main" aria-current={f === current ? "true" : undefined} onClick={() => setFolder(f)} {...(f === SLIDE_ROOT ? {} : dragProps(f))}>
									<Icon name={f === SLIDE_ROOT ? "layers" : "folder"} />
									<span class="vt-sl-folder-name">{folderLabel(f)}</span>
									<span class="vt-sl-folder-count">{countIn(f)}</span>
								</button>
								<button type="button" class="vt-sl-more" aria-label={`More for ${folderLabel(f)}`} onClick={(e) => folderMenu(e, f)}>
									<Icon name="more-horizontal" />
								</button>
							</div>
						);
					})}
				</nav>
				<section class="vt-sl-main" aria-label={current === SLIDE_ROOT ? "All slides" : `Slides in ${baseName(current)}`}>
					{shown.length === 0 ? (
						<div class="vt-sl-empty">
							{decks.length === 0 ? (
								<>
									<p>No slides yet.</p>
									<p>Ask Claude Code to make a slide deck. Decks are created under slide/.</p>
								</>
							) : (
								<p>{query ? "No matching slides" : "No slides in this folder. Drag a slide here, or use Move to… on a slide."}</p>
							)}
						</div>
					) : (
						<ul class="vt-sl-grid">
							{shown.map((d) => (
								<li key={d.path} class="vt-sl-card" onContextMenu={(e) => deckMenu(e, d)} {...dragProps(d.path)}>
									<button type="button" class="vt-sl-card-main" onClick={(e) => void actions.open(d, e.ctrlKey || e.metaKey)}>
										<div class="vt-sl-thumb">
											{d.index ? (
												<iframe sandbox="" loading="lazy" tabIndex={-1} aria-hidden="true" title="" src={`${app.vault.getResourcePath(d.index)}#thumb`} />
											) : (
												<span class="vt-sl-unbuilt">Not built</span>
											)}
										</div>
										<span class="vt-sl-card-title">{d.title}</span>
										<span class="vt-sl-card-meta">
											{d.slides} slides · {parentOf(d.path) === SLIDE_ROOT ? "slide/" : baseName(parentOf(d.path))} · {formatTime(d.mtime)}
										</span>
									</button>
									<button type="button" class="vt-sl-more vt-sl-card-more" aria-label={`More for ${d.title}`} onClick={(e) => deckMenu(e, d)}>
										<Icon name="more-horizontal" />
									</button>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</div>
	);
}
