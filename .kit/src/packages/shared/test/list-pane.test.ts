import { describe, expect, it } from "vitest";
import type { TFile, Workspace, WorkspaceLeaf } from "obsidian";
import { isListViewType, openInNotePane, openListView } from "../src/list-pane.ts";

/** Obsidian の workspace の、一覧ペインの処理が使う部分だけを真似る */
class FakeGroup {
	leaves: FakeLeaf[] = [];
	readonly container: string;
	constructor(container = "main") {
		this.container = container;
	}
}

class FakeLeaf {
	type = "empty";
	pinned = false;
	file: string | null = null;
	readonly ws: FakeWorkspace;
	parent: FakeGroup;
	constructor(ws: FakeWorkspace, parent: FakeGroup) {
		this.ws = ws;
		this.parent = parent;
		parent.leaves.push(this);
	}
	getViewState() {
		return { type: this.type };
	}
	getContainer() {
		return this.parent.container;
	}
	async setViewState(s: { type: string }) {
		this.type = s.type;
	}
	setPinned(p: boolean) {
		this.pinned = p;
	}
	async openFile(f: { path: string }) {
		this.type = "markdown";
		this.file = f.path;
		this.ws.active = this;
	}
}

class FakeWorkspace {
	/** 左から右への並び。createLeafBySplit で前後に入る */
	groups: FakeGroup[] = [];
	active: FakeLeaf | null = null;
	recent: FakeLeaf[] = [];

	group(container = "main"): FakeGroup {
		const g = new FakeGroup(container);
		this.groups.push(g);
		return g;
	}
	leaf(g: FakeGroup, type: string): FakeLeaf {
		const l = new FakeLeaf(this, g);
		l.type = type;
		return l;
	}
	all(): FakeLeaf[] {
		return this.groups.flatMap((g) => g.leaves);
	}
	getLeavesOfType(type: string) {
		return this.all().filter((l) => l.type === type);
	}
	iterateRootLeaves(cb: (l: FakeLeaf) => void) {
		for (const l of this.all()) cb(l);
	}
	getMostRecentLeaf(root?: FakeGroup) {
		const pool = root ? root.leaves : this.all();
		if (this.active && pool.includes(this.active)) return this.active;
		return [...this.recent].reverse().find((l) => pool.includes(l)) ?? pool[0] ?? null;
	}
	setActiveLeaf(l: FakeLeaf) {
		this.active = l;
		this.recent.push(l);
	}
	async revealLeaf(l: FakeLeaf) {
		this.setActiveLeaf(l);
	}
	createLeafBySplit(l: FakeLeaf, _dir: string, before = false) {
		const g = new FakeGroup(l.parent.container);
		const i = this.groups.indexOf(l.parent);
		this.groups.splice(before ? i : i + 1, 0, g);
		return new FakeLeaf(this, g);
	}
	/** 新しいタブは、アクティブなタブグループに足す（なければ最初のグループ） */
	getLeaf(newLeaf?: string | boolean) {
		if (newLeaf === "tab" || newLeaf === true) {
			const g = this.active?.parent ?? this.groups[0] ?? this.group();
			return new FakeLeaf(this, g);
		}
		const navigable = this.getMostRecentLeaf();
		if (navigable && !navigable.pinned && !isListViewType(navigable.type)) return navigable;
		return new FakeLeaf(this, this.active?.parent ?? this.groups[0] ?? this.group());
	}
}

const asWs = (ws: FakeWorkspace) => ws as unknown as Workspace;
const file = (path: string) => ({ path }) as unknown as TFile;
const index = (ws: FakeWorkspace, l: FakeLeaf) => ws.groups.indexOf(l.parent);

describe("isListViewType", () => {
	it("pkm-task・pkm-template・pkm-updates の View は一覧。サイドバーとノートは違う", () => {
		expect(isListViewType("pkm-task-daily")).toBe(true);
		expect(isListViewType("pkm-task-issues")).toBe(true);
		expect(isListViewType("pkm-template-note-list")).toBe(true);
		expect(isListViewType("pkm-updates-view")).toBe(true);
		expect(isListViewType("pkm-task-sidebar")).toBe(false);
		expect(isListViewType("markdown")).toBe(false);
		expect(isListViewType("empty")).toBe(false);
	});
});

describe("openListView", () => {
	it("一覧ペインがなければ、最後に使ったタブの左に分けて開き、固定する", async () => {
		const ws = new FakeWorkspace();
		const note = ws.leaf(ws.group(), "markdown");
		ws.setActiveLeaf(note);
		await openListView(asWs(ws), "pkm-task-daily", { phone: false });
		const [daily] = ws.getLeavesOfType("pkm-task-daily");
		expect(daily).toBeDefined();
		expect(daily!.pinned).toBe(true);
		expect(index(ws, daily!)).toBe(0);
		expect(index(ws, note)).toBe(1);
		expect(ws.active).toBe(daily);
	});

	it("一覧ペインがあれば、そこに新しいタブで開く", async () => {
		const ws = new FakeWorkspace();
		const daily = ws.leaf(ws.group(), "pkm-task-daily");
		const note = ws.leaf(ws.group(), "markdown");
		ws.setActiveLeaf(note);
		await openListView(asWs(ws), "pkm-template-note-list", { phone: false });
		const [list] = ws.getLeavesOfType("pkm-template-note-list");
		expect(list!.parent).toBe(daily.parent);
		expect(list!.pinned).toBe(true);
		expect(ws.groups).toHaveLength(2);
	});

	it("すでに開いていれば、場所を変えずに固定して表示する", async () => {
		const ws = new FakeWorkspace();
		const g = ws.group();
		const inbox = ws.leaf(g, "pkm-task-inbox");
		ws.leaf(g, "markdown");
		await openListView(asWs(ws), "pkm-task-inbox", { phone: false });
		expect(ws.getLeavesOfType("pkm-task-inbox")).toEqual([inbox]);
		expect(inbox.pinned).toBe(true);
		expect(ws.active).toBe(inbox);
		expect(ws.groups).toHaveLength(1);
	});

	it("タブが 1 つもなければ、新しいタブで開く", async () => {
		const ws = new FakeWorkspace();
		await openListView(asWs(ws), "pkm-task-daily", { phone: false });
		expect(ws.getLeavesOfType("pkm-task-daily")[0]!.pinned).toBe(true);
	});

	it("スマホでは分けずに、タブで開いて固定する", async () => {
		const ws = new FakeWorkspace();
		const g = ws.group();
		ws.setActiveLeaf(ws.leaf(g, "markdown"));
		await openListView(asWs(ws), "pkm-task-daily", { phone: true });
		const [daily] = ws.getLeavesOfType("pkm-task-daily");
		expect(daily!.parent).toBe(g);
		expect(daily!.pinned).toBe(true);
		expect(ws.groups).toHaveLength(1);
	});
});

describe("openInNotePane", () => {
	it("一覧ペインがあれば、右のノートペインの最後に使ったタブで開く", async () => {
		const ws = new FakeWorkspace();
		const daily = ws.leaf(ws.group(), "pkm-task-daily");
		const right = ws.group();
		const a = ws.leaf(right, "markdown");
		const b = ws.leaf(right, "markdown");
		ws.setActiveLeaf(b);
		ws.setActiveLeaf(daily);
		await openInNotePane(asWs(ws), file("issue/i-1.md"), { newTab: false, phone: false });
		expect(b.file).toBe("issue/i-1.md");
		expect(a.file).toBeNull();
		expect(ws.active).toBe(b);
	});

	it("新しいタブのときは、ノートペインにタブを足す", async () => {
		const ws = new FakeWorkspace();
		const daily = ws.leaf(ws.group(), "pkm-task-daily");
		const right = ws.group();
		ws.leaf(right, "markdown");
		ws.setActiveLeaf(daily);
		await openInNotePane(asWs(ws), file("issue/i-2.md"), { newTab: true, phone: false });
		expect(right.leaves).toHaveLength(2);
		expect(right.leaves[1]!.file).toBe("issue/i-2.md");
		expect(daily.parent.leaves).toHaveLength(1);
	});

	it("ノートペインがなければ、一覧ペインの右に分けて作る", async () => {
		const ws = new FakeWorkspace();
		const daily = ws.leaf(ws.group(), "pkm-task-daily");
		ws.setActiveLeaf(daily);
		await openInNotePane(asWs(ws), file("issue/i-3.md"), { newTab: false, phone: false });
		expect(ws.groups).toHaveLength(2);
		expect(ws.groups[1]!.leaves[0]!.file).toBe("issue/i-3.md");
		expect(daily.type).toBe("pkm-task-daily");
	});

	it("別のウィンドウのタブはノートペインにしない", async () => {
		const ws = new FakeWorkspace();
		const daily = ws.leaf(ws.group(), "pkm-task-daily");
		const popout = ws.leaf(ws.group("popout"), "markdown");
		ws.setActiveLeaf(daily);
		await openInNotePane(asWs(ws), file("issue/i-4.md"), { newTab: false, phone: false });
		expect(popout.file).toBeNull();
		expect(ws.groups[1]!.container).toBe("main");
		expect(ws.groups[1]!.leaves[0]!.file).toBe("issue/i-4.md");
	});

	it("一覧ペインがなければ、今までどおり getLeaf で開く", async () => {
		const ws = new FakeWorkspace();
		const note = ws.leaf(ws.group(), "markdown");
		ws.setActiveLeaf(note);
		await openInNotePane(asWs(ws), file("a.md"), { newTab: false, phone: false });
		expect(note.file).toBe("a.md");
		expect(ws.groups).toHaveLength(1);
	});

	it("スマホでは getLeaf で開く（固定した一覧のタブは使われない）", async () => {
		const ws = new FakeWorkspace();
		const g = ws.group();
		const daily = ws.leaf(g, "pkm-task-daily");
		daily.pinned = true;
		ws.setActiveLeaf(daily);
		await openInNotePane(asWs(ws), file("issue/i-5.md"), { newTab: false, phone: true });
		expect(daily.type).toBe("pkm-task-daily");
		expect(ws.groups).toHaveLength(1);
		expect(g.leaves.some((l) => l.file === "issue/i-5.md")).toBe(true);
	});
});
