import type { PaneType, TFile, Workspace, WorkspaceLeaf, WorkspaceParent } from "obsidian";

/**
 * 一覧の View を左の固定ペイン（一覧ペイン）に、そこから開くノートを右のノートペインに出す（ADR-0033）。
 * pkm-task・pkm-template・pkm-updates が同じ規則で一覧ペインを見分けるため、ここに 1 つだけ置く。
 * Obsidian の値は import しない（型だけ）。スマホかどうかは呼ぶ側が Platform.isPhone を渡す
 */

const LIST_VIEW_PREFIXES = ["pkm-task-", "pkm-template-", "pkm-updates-"];
/** 一覧の接頭辞を持つが、左サイドバーに常駐するもの（ADR-0021） */
const NOT_LIST_VIEWS = new Set(["pkm-task-sidebar"]);

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
	const fallback: PaneType | false = options.newTab ? "tab" : false;
	const leaves = options.phone ? [] : rootLeaves(workspace);
	const listLeaf = findListLeaf(workspace, leaves);
	if (!listLeaf) {
		const leaf = workspace.getLeaf(fallback);
		await leaf.openFile(file, { active: true });
		return leaf;
	}
	const container = listLeaf.getContainer();
	const notes = leaves.filter((l) => l.parent !== listLeaf.parent && !isListViewType(leafType(l)) && l.getContainer() === container);
	let target: WorkspaceLeaf;
	const first = notes[0];
	if (!first) {
		target = workspace.createLeafBySplit(listLeaf, "vertical", false);
	} else {
		const recent = workspace.getMostRecentLeaf();
		const group: WorkspaceParent = recent && notes.includes(recent) ? recent.parent : first.parent;
		const inGroup = workspace.getMostRecentLeaf(group);
		target = inGroup && notes.includes(inGroup) ? inGroup : first;
		if (options.newTab) {
			workspace.setActiveLeaf(target, { focus: false });
			target = workspace.getLeaf("tab");
		}
	}
	await target.openFile(file, { active: true });
	return target;
}
