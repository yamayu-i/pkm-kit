import { describe, expect, it } from "vitest";
import { collectViews, matchViews, type CommandLike } from "../src/views";

const TASK_VIEWS = ["daily", "issues", "inbox", "organize", "scheduled", "someday", "routines", "groups", "members", "labels", "sidebar"];
const TEMPLATE_VIEWS = ["daily-list", "note-list", "source-list"];

/** 今の pkm-task・pkm-template・pkm-updates が登録するコマンド（Obsidian は名前の前にプラグイン名を付ける） */
const COMMANDS: CommandLike[] = [
	{ id: "pkm-template:create-from-template", name: "PKM Template: Create new file from template" },
	{ id: "pkm-template:open-todays-daily", name: "PKM Template: Open today's daily note" },
	{ id: "pkm-template:open-daily-list", name: "PKM Template: Open Daily notes", icon: "calendar-days" },
	{ id: "pkm-template:open-note-list", name: "PKM Template: Open Notes", icon: "notebook" },
	{ id: "pkm-template:open-source-list", name: "PKM Template: Open Sources", icon: "library" },
	{ id: "pkm-task:open-daily", name: "PKM Task: Open Today", icon: "sun" },
	{ id: "pkm-task:open-issues", name: "PKM Task: Open Issues", icon: "list-todo" },
	{ id: "pkm-task:open-inbox", name: "PKM Task: Open Inbox", icon: "inbox" },
	{ id: "pkm-task:open-organize", name: "PKM Task: Open Organize", icon: "layers" },
	{ id: "pkm-task:open-scheduled", name: "PKM Task: Open Scheduled", icon: "calendar-range" },
	{ id: "pkm-task:open-someday", name: "PKM Task: Open Someday", icon: "cloud" },
	{ id: "pkm-task:open-routines", name: "PKM Task: Open Routines", icon: "repeat" },
	{ id: "pkm-task:open-groups", name: "PKM Task: Open Board groups", icon: "layout-grid" },
	{ id: "pkm-task:open-members", name: "PKM Task: Open Members", icon: "users" },
	{ id: "pkm-task:open-labels", name: "PKM Task: Open Labels", icon: "tag" },
	{ id: "pkm-task:open-sidebar", name: "PKM Task: Open Tasks sidebar", icon: "check-square" },
	{ id: "pkm-task:capture-issues", name: "PKM Task: Capture issues" },
	{ id: "pkm-updates:open-view", name: "PKM Updates: Open PKM Updates", icon: "bell" },
	{ id: "other:open-foo", name: "Other: Open Foo" },
];

const VIEW_TYPES = new Set([...TASK_VIEWS.map((v) => `pkm-task-${v}`), ...TEMPLATE_VIEWS.map((v) => `pkm-template-${v}`), "pkm-updates-view", "other-foo", "markdown"]);

const collect = (commands = COMMANDS, types = VIEW_TYPES, open = new Set<string>()) =>
	collectViews(
		commands,
		(t) => types.has(t),
		(t) => open.has(t),
	);

describe("collectViews（ADR-0072）", () => {
	it("pkm-task の 11 個、pkm-template の 3 個、pkm-updates の 1 個を、View を開くコマンドだけ集める", () => {
		const entries = collect();
		expect(entries.map((e) => e.viewType)).toEqual([...TASK_VIEWS.map((v) => `pkm-task-${v}`), ...TEMPLATE_VIEWS.map((v) => `pkm-template-${v}`), "pkm-updates-view"]);
		expect(entries.map((e) => e.commandId)).not.toContain("pkm-template:open-todays-daily");
		expect(entries.map((e) => e.commandId)).not.toContain("other:open-foo");
	});

	it("名前はプラグイン名と「Open 」を除いたもの。アイコンはコマンドのもの", () => {
		const entries = collect();
		expect(entries.find((e) => e.viewType === "pkm-task-groups")).toMatchObject({ name: "Board groups", plugin: "pkm-task", icon: "layout-grid" });
		expect(entries.find((e) => e.viewType === "pkm-task-sidebar")?.name).toBe("Tasks sidebar");
		expect(entries.find((e) => e.viewType === "pkm-template-note-list")?.name).toBe("Notes");
		expect(entries.find((e) => e.viewType === "pkm-updates-view")).toMatchObject({ name: "PKM Updates", icon: "bell" });
	});

	it("片方のプラグインが無効（コマンドも View もない）なら、その分は出ない", () => {
		const noTask = COMMANDS.filter((c) => !c.id.startsWith("pkm-task:"));
		const entries = collect(noTask, new Set([...VIEW_TYPES].filter((t) => !t.startsWith("pkm-task-"))));
		expect(entries.map((e) => e.plugin)).toEqual(["pkm-template", "pkm-template", "pkm-template", "pkm-updates"]);
	});

	it("コマンドがあっても View が登録されていなければ出さない。新しい View は open-<名前> を登録すれば出る", () => {
		const added = [...COMMANDS, { id: "pkm-task:open-weekly", name: "PKM Task: Open Weekly" }];
		expect(collect(added).map((e) => e.name)).not.toContain("Weekly");
		expect(collect(added, new Set([...VIEW_TYPES, "pkm-task-weekly"])).map((e) => e.name)).toContain("Weekly");
	});

	it("前の形のコマンド名（「<View> を開く」）からも名前を取り出す", () => {
		const old = [{ id: "pkm-task:open-inbox", name: "PKM Task: Inbox を開く", icon: "inbox" }];
		expect(collect(old).map((e) => e.name)).toEqual(["Inbox"]);
	});

	it("開いている View に印を付ける", () => {
		const entries = collect(COMMANDS, VIEW_TYPES, new Set(["pkm-task-inbox"]));
		expect(entries.filter((e) => e.open).map((e) => e.name)).toEqual(["Inbox"]);
	});
});

describe("matchViews", () => {
	const entries = collect();
	const names = (q: string) => matchViews(q, entries).map((e) => e.name);

	it("空の検索は元の並び", () => {
		expect(names("")).toEqual(entries.map((e) => e.name));
	});

	it("大文字と小文字を区別しない", () => {
		expect(names("issues")[0]).toBe("Issues");
		expect(names("INBOX")[0]).toBe("Inbox");
		expect(names("notes")).toContain("Notes");
	});

	it("名前の先頭で当たるものを上にする", () => {
		expect(names("s").slice(0, 3)).toEqual(["Someday", "Sources", "Scheduled"]);
		// タスクの View は Today（#38）。daily ではデイリーノートの一覧が先頭に出る
		expect(names("daily")[0]).toBe("Daily notes");
		expect(names("today")[0]).toBe("Today");
	});

	it("文字が順に現れれば当たる。空白は無視する", () => {
		expect(names("bg")).toContain("Board groups");
		expect(names("board g")[0]).toBe("Board groups");
	});

	it("プラグイン名でも絞り込める", () => {
		expect(names("pkm-template")).toEqual(["Daily notes", "Notes", "Sources"]);
	});

	it("当たらなければ空", () => {
		expect(names("zzz")).toEqual([]);
	});
});
