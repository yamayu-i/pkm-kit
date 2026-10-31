/** プレビュー用のデータ。issue 画面のヘッダーを、広いペインと狭いペインの 2 つで描く */
import { h, render } from "preact";
import { addDays, localToday } from "../src/core/dates";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { IssueHeader } from "../src/header/IssueHeader";

const t = localToday();
const logs = [
	JSON.stringify({ id: "run", task_id: "i-2", from: new Date(Date.now() - 30 * 60_000).toISOString(), to: null, description: "" }),
	...Array.from({ length: 13 }, (_, i) =>
		JSON.stringify({
			id: `w${i}`,
			task_id: "i-2",
			from: `2026-10-${10 + i}T10:00:00+09:00`,
			to: `2026-10-${10 + i}T11:30:00+09:00`,
			description: i % 3 ? `作業 ${i}` : "",
		}),
	),
];
const { data } = collectVault({
	markdown: [
		{ path: "issue/i-1.md", frontmatter: { type: "issue", id: "i-1", summary: "親の issue", status: "in-progress" } },
		{
			path: "issue/i-2.md",
			frontmatter: {
				type: "issue",
				id: "i-2",
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
			},
		},
		{ path: "issue/i-3.md", frontmatter: { type: "issue", id: "i-3", summary: "子その1", status: "closed", parent: "i-2" } },
		{ path: "issue/i-4.md", frontmatter: { type: "issue", id: "i-4", summary: "子その2（長めの表題がここに入る）", status: "open", parent: "i-2" } },
		{ path: "member/m-1.md", frontmatter: { type: "member", id: "m-1", name: "佐藤さん" } },
	],
	worklogs: [{ path: "worklog/pc/2026-10.jsonl", text: logs.join("\n") }],
	labels: '[{"name":"仕事","color":"#c6e6ff"},{"name":"経理","color":"#ffd6e0"}]',
});

const store = { index: new TaskIndex(data), version: 1, subscribe: () => () => {}, mtime: () => Date.now(), problems: [] };
const ctx = {
	app: {},
	store,
	writer: { update: async () => {}, updateWorklog: async () => {} },
	openPath: async () => {},
	report: (m: string) => console.log("report", m),
};
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
