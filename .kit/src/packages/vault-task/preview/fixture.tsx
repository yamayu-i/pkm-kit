/** プレビュー用のデータ。#header / #daily などで描く画面を選ぶ（preview.mjs が順に撮る） */
import { h, render, type FunctionComponent } from "preact";
import { addDays, localDateTime, localToday } from "../src/core/dates";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { IssueHeader } from "../src/header/IssueHeader";
import { DailyView } from "../src/views/DailyView";
import { GroupManagerView } from "../src/views/GroupManagerView";
import { InboxView } from "../src/views/InboxView";
import { IssueListView } from "../src/views/IssueListView";
import { OrganizeView } from "../src/views/OrganizeView";
import { RoutineListView } from "../src/views/RoutineListView";
import { ScheduledView } from "../src/views/ScheduledView";
import { SomedayView } from "../src/views/SomedayView";

const t = localToday();
const at = (day: string, hm: string) => localDateTime(new Date(`${day}T${hm}:00`));
const logs = [
	JSON.stringify({ id: "run", task_id: "i-2", from: new Date(Date.now() - 30 * 60_000).toISOString(), to: null, description: "" }),
	...Array.from({ length: 13 }, (_, i) => {
		const day = addDays(t, -(i + 1));
		return JSON.stringify({ id: `w${i}`, task_id: "i-2", from: at(day, "10:00"), to: at(day, "11:30"), description: i % 3 ? `作業 ${i}` : "" });
	}),
];
const issue = (id: string, fm: Record<string, unknown>) => ({ path: `issue/${id}.md`, frontmatter: { type: "issue", id, status: "open", ...fm } });
const { data } = collectVault({
	markdown: [
		issue("i-1", { summary: "親の issue", status: "in-progress", priority: "mid" }),
		issue("i-2", {
			summary: "請求書の送付フローを見直す",
			status: "delegated",
			delegated_to: "m-1",
			"status-detail": "返事待ち",
			priority: "high",
			label: ["仕事", "経理"],
			parent: "i-1",
			estimated: 300,
			scheduled: [t, addDays(t, 2), addDays(t, 20)],
			mid_due: addDays(t, 1),
			deadline: addDays(t, 4),
			created: "2026-10-30T10:00:00+09:00",
		}),
		issue("i-3", { summary: "子その1", status: "closed", parent: "i-2" }),
		issue("i-4", { summary: "子その2（長めの表題がここに入る）", parent: "i-2", scheduled: [t], priority: "low" }),
		issue("i-5", { summary: "見積書を作る", scheduled: [t], priority: "high", deadline: addDays(t, -1) }),
		issue("i-6", { summary: "会議の議事録をまとめる", status: "in-progress", scheduled: [t, addDays(t, 1)], label: ["仕事"] }),
		issue("i-7", { summary: "歯医者を予約する", created: "2026-10-28T09:00:00+09:00" }),
		issue("i-8", { summary: "本棚を整理する", created: "2026-10-29T09:00:00+09:00", label: ["私用"] }),
		issue("i-9", { summary: "いつか: 写真を整理する", status: "someday", revisit: addDays(t, 10) }),
		issue("i-10", { summary: "いつか: 英語の勉強を再開", status: "someday", reviewed: addDays(t, -30) }),
		issue("i-11", { summary: "部屋の掃除", scheduled: [addDays(t, 3), addDays(t, 5)], priority: "chore", mid_due: addDays(t, -2) }),
		{ path: "routine/r-1.md", frontmatter: { type: "routine", id: "r-1", summary: "朝のメール確認", repeat: { every: "day" }, start: addDays(t, -30), group: "午前", estimated: 15 } },
		{ path: "routine/r-2.md", frontmatter: { type: "routine", id: "r-2", summary: "週次レビュー", repeat: { every: "week", on: ["fri"] }, start: addDays(t, -30) } },
		{ path: "routine/r-3.md", frontmatter: { type: "routine", id: "r-3", summary: "家計簿をつける", repeat: { every: "month", on: ["2th-tue", "last"] }, start: addDays(t, -30), active: false } },
		{ path: "member/m-1.md", frontmatter: { type: "member", id: "m-1", name: "佐藤さん" } },
		{ path: `daily/${t.slice(0, 4)}/${t.slice(5, 7)}/${t}.md`, frontmatter: { board: { issues: ["i-6", "i-1", "i-2"], groups: { "i-6": "午前/集中", "i-2": "午後" } } } },
	],
	worklogs: [{ path: "worklog/pc/2026-10.jsonl", text: logs.join("\n") }],
	labels: '[{"name":"仕事","color":"#c6e6ff"},{"name":"経理","color":"#ffd6e0"},{"name":"私用","color":"#d9f5d0"}]',
	groups: JSON.stringify([
		{ name: "午前", children: [{ name: "集中" }, { name: "雑務" }] },
		{ name: "午後" },
	]),
});

const store = { index: new TaskIndex(data), version: 1, subscribe: () => () => {}, mtime: () => Date.now(), problems: [] };
const noop = async () => {};
const ctx = {
	app: { vault: { getFileByPath: () => null } },
	store,
	writer: new Proxy({}, { get: () => noop }),
	settings: { deviceName: "pc", presets: [] },
	saveSettings: noop,
	openPath: noop,
	openView: noop,
	report: (m: string) => console.log("report", m),
};

const VIEWS: Record<string, FunctionComponent<{ ctx: never }>> = {
	daily: DailyView,
	board: DailyView,
	issues: IssueListView,
	inbox: InboxView,
	organize: OrganizeView,
	scheduled: ScheduledView,
	someday: SomedayView,
	routines: RoutineListView,
	groups: GroupManagerView,
};

const name = location.hash.slice(1) || "header";
if (name === "header") {
	for (const [id, width] of [
		["wide", 760],
		["narrow", 360],
	] as const) {
		const el = document.createElement("div");
		el.className = "vt-header";
		el.id = id;
		el.style.width = `${width}px`;
		el.style.margin = "8px";
		document.body.append(el);
		render(h(IssueHeader, { ctx: ctx as never, path: "issue/i-2.md" }), el);
	}
} else {
	for (const [id, width] of [
		["wide", 1000],
		["narrow", 380],
	] as const) {
		const el = document.createElement("div");
		el.className = "vt-view";
		el.id = id;
		el.style.width = `${width}px`;
		el.style.border = "1px solid #8884";
		el.style.margin = "8px";
		document.body.append(el);
		render(h(VIEWS[name]!, { ctx: ctx as never }), el);
		// board は DailyView の最後の段階を開いた状態
		if (name === "board") setTimeout(() => el.querySelector<HTMLButtonElement>(".vt-step:last-child")?.click(), 0);
	}
}
