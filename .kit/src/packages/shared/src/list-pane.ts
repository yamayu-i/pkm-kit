import type { PaneType, TFile, Workspace, WorkspaceLeaf, WorkspaceParent } from "obsidian";

/**
 * 一覧の View を左の固定ペイン（一覧ペイン）に、そこから開くノートを右のノートペインに出す（ADR-0033）。
 * pkm-task・pkm-template・pkm-updates が同じ規則で一覧ペインを見分けるため、ここに 1 つだけ置く。
 * Obsidian の値は import しない（型だけ）。スマホかどうかは呼ぶ側が Platform.isPhone を渡す
 */

const LIST_VIEW_PREFIXES = ["pkm-task-", "pkm-template-", "pkm-updates-", "pkm-slide-"];
/** 一覧の接頭辞を持つが、一覧ではないもの: 左サイドバーに常駐するもの（ADR-0021）、ノートペインに開く編集の画面（ADR-0132） */
const NOT_LIST_VIEWS = new Set(["pkm-task-sidebar", "pkm-slide-notes"]);

export interface PaneOptions {
	/** スマホ（画面を分割できない） */
	phone: boolean;
}

/** 一覧の View の種類か */
export function isListViewType(type: string): boolean {
	return !NOT_LIST_VIEWS.has(type) && LIST_VIEW_PREFIXES.some((p) => type.startsWith(p));
}

/** 起動時に読み込みを後回しにされたタブでも種類が分かるよう、View ではなく保存された状態から読む */
function leafType(leaf: WorkspaceLeaf): string {
	return leaf.getViewState().type;
}

function rootLeaves(workspace: Workspace): WorkspaceLeaf[] {
	const leaves: WorkspaceLeaf[] = [];
	workspace.iterateRootLeaves((leaf) => {
		leaves.push(leaf);
	});
	return leaves;
}

/** 一覧ペインの代表のタブ。最後に使った一覧のタブを優先する */
function findListLeaf(workspace: Workspace, leaves: WorkspaceLeaf[]): WorkspaceLeaf | null {
	const lists = leaves.filter((l) => isListViewType(leafType(l)));
	const recent = workspace.getMostRecentLeaf();
	if (recent && lists.includes(recent)) return recent;
	return lists[0] ?? null;
}

/** 一覧の View を開く。すでに開いていればそれを表示する */
export async function openListView(workspace: Workspace, type: string, options: PaneOptions): Promise<void> {
	const existing = workspace.getLeavesOfType(type)[0];
	if (existing) {
		existing.setPinned(true);
		await workspace.revealLeaf(existing);
		return;
	}
	let leaf: WorkspaceLeaf;
	const listLeaf = options.phone ? null : findListLeaf(workspace, rootLeaves(workspace));
	if (listLeaf) {
		// 新しいタブは、アクティブなタブグループに足される
		workspace.setActiveLeaf(listLeaf, { focus: false });
		leaf = workspace.getLeaf("tab");
	} else {
		const base = options.phone ? null : workspace.getMostRecentLeaf();
		leaf = base ? workspace.createLeafBySplit(base, "vertical", true) : workspace.getLeaf("tab");
	}
	await leaf.setViewState({ type, active: true });
	leaf.setPinned(true);
	await workspace.revealLeaf(leaf);
}

/** ノートを開き、開いたタブを返す。一覧ペインがあれば、その右のノートペインで */
export async function openInNotePane(workspace: Workspace, file: TFile, options: PaneOptions & { newTab: boolean }): Promise<WorkspaceLeaf> {
	const target = notePaneLeaf(workspace, options);
	await target.openFile(file, { active: true });
	return target;
}

/** ノートではない View（編集の画面など。ADR-0132）を、ノートと同じ場所に開く */
export async function openViewInNotePane(workspace: Workspace, state: { type: string; state?: Record<string, unknown> }, options: PaneOptions & { newTab: boolean }): Promise<WorkspaceLeaf> {
	const target = notePaneLeaf(workspace, options);
	await target.setViewState({ type: state.type, state: state.state, active: true });
	await workspace.revealLeaf(target);
	return target;
}

/** ノートを開くタブ。一覧ペインがあれば、その右のノートペインの、最近使ったタブ（なければ分けて作る） */
function notePaneLeaf(workspace: Workspace, options: PaneOptions & { newTab: boolean }): WorkspaceLeaf {
	const fallback: PaneType | false = options.newTab ? "tab" : false;
	const leaves = options.phone ? [] : rootLeaves(workspace);
	const listLeaf = findListLeaf(workspace, leaves);
	if (!listLeaf) return workspace.getLeaf(fallback);
	const container = listLeaf.getContainer();
	const notes = leaves.filter((l) => l.parent !== listLeaf.parent && !isListViewType(leafType(l)) && l.getContainer() === container);
	const first = notes[0];
	if (!first) return workspace.createLeafBySplit(listLeaf, "vertical", false);
	const recent = workspace.getMostRecentLeaf();
	const group: WorkspaceParent = recent && notes.includes(recent) ? recent.parent : first.parent;
	const inGroup = workspace.getMostRecentLeaf(group);
	const target = inGroup && notes.includes(inGroup) ? inGroup : first;
	if (!options.newTab) return target;
	workspace.setActiveLeaf(target, { focus: false });
	return workspace.getLeaf("tab");
}
