import { describe, expect, it } from "vitest";
import { collectViews, matchViews, type CommandLike } from "../src/views";

const TASK_VIEWS = ["daily", "issues", "inbox", "organize", "scheduled", "someday", "routines", "groups", "members", "labels", "sidebar"];
const TEMPLATE_VIEWS = ["daily-list", "note-list", "source-list"];

/** 今の pkm-task と pkm-template が登録するコマンド（Obsidian は名前の前にプラグイン名を付ける） */
const COMMANDS: CommandLike[] = [
	{ id: "pkm-template:create-from-template", name: "PKM Template: テンプレートから新規ファイルを作成" },
	{ id: "pkm-template:open-todays-daily", name: "PKM Template: 今日のデイリーノートを開く" },
	{ id: "pkm-template:open-daily-list", name: "PKM Template: Daily notes を開く", icon: "calendar-days" },
	{ id: "pkm-template:open-note-list", name: "PKM Template: Notes を開く", icon: "notebook" },
	{ id: "pkm-template:open-source-list", name: "PKM Template: Sources を開く", icon: "library" },
	{ id: "pkm-task:open-daily", name: "PKM Task: Daily を開く", icon: "calendar-check" },
	{ id: "pkm-task:open-issues", name: "PKM Task: Issues を開く", icon: "list-todo" },
	{ id: "pkm-task:open-inbox", name: "PKM Task: Inbox を開く", icon: "inbox" },
	{ id: "pkm-task:open-organize", name: "PKM Task: Organize を開く", icon: "layers" },
	{ id: "pkm-task:open-scheduled", name: "PKM Task: Scheduled を開く", icon: "calendar-range" },
	{ id: "pkm-task:open-someday", name: "PKM Task: Someday を開く", icon: "cloud" },
	{ id: "pkm-task:open-routines", name: "PKM Task: Routines を開く", icon: "repeat" },
	{ id: "pkm-task:open-groups", name: "PKM Task: Board groups を開く", icon: "layout-grid" },
	{ id: "pkm-task:open-members", name: "PKM Task: Members を開く", icon: "users" },
	{ id: "pkm-task:open-labels", name: "PKM Task: Labels を開く", icon: "tag" },
	{ id: "pkm-task:open-sidebar", name: "PKM Task: Tasks サイドバーを開く", icon: "check-square" },
	{ id: "pkm-task:capture-issues", name: "PKM Task: issue をまとめて作成" },
	{ id: "other:open-foo", name: "Other: Foo を開く" },
];

const VIEW_TYPES = new Set([...TASK_VIEWS.map((v) => `pkm-task-${v}`), ...TEMPLATE_VIEWS.map((v) => `pkm-template-${v}`), "other-foo", "markdown"]);

const collect = (commands = COMMANDS, types = VIEW_TYPES, open = new Set<string>()) =>
	collectViews(
		commands,
		(t) => types.has(t),
		(t) => open.has(t),
	);

describe("collectViews（ADR-0072）", () => {
	it("pkm-task の 11 個と pkm-template の 3 個を、View を開くコマンドだけ集める", () => {
		const entries = collect();
		expect(entries.map((e) => e.viewType)).toEqual([...TASK_VIEWS.map((v) => `pkm-task-${v}`), ...TEMPLATE_VIEWS.map((v) => `pkm-template-${v}`)]);
		expect(entries.map((e) => e.commandId)).not.toContain("pkm-template:open-todays-daily");
		expect(entries.map((e) => e.commandId)).not.toContain("other:open-foo");
	});

	it("名前はプラグイン名と「を開く」を除いたもの。アイコンはコマンドのもの", () => {
		const entries = collect();
		expect(entries.find((e) => e.viewType === "pkm-task-groups")).toMatchObject({ name: "Board groups", plugin: "pkm-task", icon: "layout-grid" });
		expect(entries.find((e) => e.viewType === "pkm-task-sidebar")?.name).toBe("Tasks サイドバー");
		expect(entries.find((e) => e.viewType === "pkm-template-note-list")?.name).toBe("Notes");
	});

	it("片方のプラグインが無効（コマンドも View もない）なら、その分は出ない", () => {
		const noTask = COMMANDS.filter((c) => !c.id.startsWith("pkm-task:"));
		const entries = collect(noTask, new Set([...VIEW_TYPES].filter((t) => !t.startsWith("pkm-task-"))));
		expect(entries.map((e) => e.plugin)).toEqual(["pkm-template", "pkm-template", "pkm-template"]);
	});

	it("コマンドがあっても View が登録されていなければ出さない。新しい View は open-<名前> を登録すれば出る", () => {
		const added = [...COMMANDS, { id: "pkm-task:open-weekly", name: "PKM Task: Weekly を開く" }];
		expect(collect(added).map((e) => e.name)).not.toContain("Weekly");
		expect(collect(added, new Set([...VIEW_TYPES, "pkm-task-weekly"])).map((e) => e.name)).toContain("Weekly");
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
		expect(names("daily").slice(0, 2)).toEqual(["Daily", "Daily notes"]);
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
