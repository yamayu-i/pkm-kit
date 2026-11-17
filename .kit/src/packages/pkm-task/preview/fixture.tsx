/** プレビュー用のデータ。#header / #daily などで描く画面を選ぶ（preview.mjs が順に撮る） */
import { h, render, type FunctionComponent } from "preact";
import { parse } from "yaml";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { addDays, localDateTime, localToday } from "../src/core/dates";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { IssueHeader } from "../src/header/IssueHeader";
import { SubTimeline } from "../src/header/SubTimeline";
import { visibleSubs } from "../src/core/sub-issue";
import { StatusUndo } from "../src/obsidian/status-undo";
import { SubCard } from "../src/obsidian/sub-card";
import { RoutineHeader } from "../src/header/RoutineHeader";
import { MemberHeader } from "../src/header/MemberHeader";
import { PresetHeader } from "../src/header/PresetHeader";
import { CalendarForm, DateForm, WorklogForm } from "../src/ui/forms";
import { ClockPicker, WorklogTimesForm } from "../src/ui/WorklogTimesForm";
import { DailyView } from "../src/views/DailyView";
import { InboxView } from "../src/views/InboxView";
import { IssueListView } from "../src/views/IssueListView";
import { LabelManagerView } from "../src/views/LabelManagerView";
import { PresetListView } from "../src/views/PresetListView";
import { MemberListView } from "../src/views/MemberListView";
import { OrganizeView } from "../src/views/OrganizeView";
import { RoutineListView } from "../src/views/RoutineListView";
import { ScheduledView } from "../src/views/ScheduledView";
import { SidebarView } from "../src/views/SidebarView";
import { SomedayView } from "../src/views/SomedayView";

const t = localToday();
const at = (day: string, hm: string) => localDateTime(new Date(`${day}T${hm}:00`));
const logs = [
	JSON.stringify({ id: "run", task_id: "i-2", from: new Date(Date.now() - 30 * 60_000).toISOString(), to: null, description: "" }),
	JSON.stringify({ id: "subrun", task_id: "i-2", sub: "bbbbbb", from: new Date(Date.now() - 50 * 60_000).toISOString(), to: null, description: "" }),
	JSON.stringify({ id: "r1a", task_id: "r-1", from: at(addDays(t, -1), "08:00"), to: at(addDays(t, -1), "08:15"), description: "メール処理" }),
	JSON.stringify({ id: "r1b", task_id: "r-1", from: at(addDays(t, -2), "08:00"), to: at(addDays(t, -2), "08:25"), description: "" }),
	...Array.from({ length: 13 }, (_, i) => {
		const day = addDays(t, -(i + 1));
		return JSON.stringify({ id: `w${i}`, task_id: "i-2", from: at(day, "10:00"), to: at(day, "11:30"), description: i % 3 ? `作業 ${i}` : "" });
	}),
];
const issue = (id: string, fm: Record<string, unknown>, text?: string) => ({ path: `issue/${id}.md`, frontmatter: { type: "issue", id, status: "open", ...fm }, ...(text ? { text } : {}) });
/** i-2 のサブイシュー（ADR-0142 のヘッダーの一覧。closed は既定で隠れる） */
const sub = (id: string, fm: string, body = "") => `<!-- sub-issue\nid: ${id}\n${fm}-->\n${body}`;
const i2Subs = [
	sub("aaaaaa", `summary: "送付先の一覧を確かめる"\nstatus: closed\n`),
	sub("bbbbbb", `summary: "新しいフローの手順を書く"\nstatus: in-progress\nstart: ${t}\nend: ${addDays(t, 3)}\nestimated: 120\n`, "下書きは共有フォルダにある。\n\n- 承認の段を 1 つ減らす\n"),
	sub("cccccc", `summary: "経理に確認してもらう（長めの表題がここに入るとどうなるか）"\nstatus: delegated\ndelegated_to: m-1\nscheduled: ${addDays(t, 2)}\ndepends_on: [bbbbbb]\n`),
	sub("dddddd", `summary: "旧フローの資料を片付ける"\nstatus: open\n`),
	sub("eeeeee", `summary: "新しいフローで試しに送る"\nstatus: open\nstart: ${addDays(t, 4)}\nend: ${addDays(t, 9)}\ndepends_on: [bbbbbb]\n`),
	sub("ffffff", `summary: "結果を共有する"\nstatus: waiting\nstart: ${addDays(t, 7)}\nend: ${addDays(t, 24)}\ndepends_on: [eeeeee, bbbbbb]\n`),
	sub("gggggg", `summary: "例外の扱いを決める"\nstatus: open\nstart: ${addDays(t, 1)}\nend: ${addDays(t, 5)}\ndepends_on: [bbbbbb]\n`),
	sub("hhhhhh", `summary: "手順書を清書する"\nstatus: open\nstart: ${addDays(t, 10)}\nend: ${addDays(t, 12)}\ndepends_on: [gggggg, eeeeee, bbbbbb]\n`),
].join("\n");
const boardOp = (date: string, op: BoardOp) => serializeBoardLogEntry({ id: "bo_preview", at: `${date}T00:00:00.000Z`, date, ...op });
const boardLog = [
	// 欄（ADR-0137）: 作業中は i-2 とそのサブ、★ は 2 件、次にやる順に同じ親のサブが隣り合う
	...["i-6", "i-1", "i-2", "i-12", "i-13", "i-2#aaaaaa", "i-2#bbbbbb", "i-2#cccccc", "i-2#dddddd", "i-2#eeeeee", "i-2#gggggg"].map((task) => boardOp(t, { op: "add", task })),
	boardOp(t, { op: "star", task: "i-2#eeeeee", on: true }),
	boardOp(t, { op: "star", task: "i-6", on: true }),
	boardOp(t, { op: "order", tasks: ["i-2#eeeeee", "i-6", "i-2#dddddd", "i-2#gggggg", "i-1"] }),
	boardOp(addDays(t, -1), { op: "routine", task: "r-1", result: "closed" }),
	boardOp(t, { op: "routine", task: "r-5", result: "closed" }),
	boardOp(addDays(t, -2), { op: "routine", task: "r-1", result: "canceled" }),
];

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
			estimated: 300,
			scheduled: t,
			clarified: true,
			soft_deadline: addDays(t, 1),
			deadline: addDays(t, 4),
			created: "2026-10-30T10:00:00+09:00",
		}, `---\n---\n\n${i2Subs}`),
		issue("i-3", { summary: "請求先を確認する", status: "closed" }),
		issue("i-4", { summary: "送付の手順を書く（長めの表題がここに入る）", scheduled: t, priority: "low" }),
		issue("i-5", { summary: "見積書を作る", scheduled: t, priority: "high", deadline: addDays(t, -1), clarified: true }),
		issue("i-6", { summary: "会議の議事録をまとめる", status: "in-progress", scheduled: t, label: ["仕事"], clarified: true }),
		issue("i-7", { summary: "歯医者を予約する", created: "2026-10-28T09:00:00+09:00" }),
		issue("i-8", { summary: "本棚を整理する", created: "2026-10-29T09:00:00+09:00", label: ["私用"] }),
		issue("i-9", { summary: "いつか: 写真を整理する", status: "someday", revisit: addDays(t, 10) }),
		issue("i-10", { summary: "いつか: 英語の勉強を再開", status: "someday", reviewed: addDays(t, -30) }),
		// 完了の欄（ADR-0031）
		issue("i-12", { summary: "経費を精算する", status: "closed", scheduled: t, priority: "chore" }),
		issue("i-13", { summary: "先方の返事を待つ", status: "waiting", scheduled: t, priority: "mid" }),
		issue("i-11", { summary: "部屋の掃除", scheduled: addDays(t, 3), priority: "chore", soft_deadline: addDays(t, -2), clarified: true }),
		// Next（ADR-0148）と Missed・Tickler（ADR-0152）。Daily の Pick と Calendar に出る
		issue("i-14", { summary: "引っ越し業者を比べる", clarified: true, priority: "mid", estimated: 60, label: ["私用"], reviewed: addDays(t, -20) }, `---\n---\n\n${sub("kkkkkk", `summary: "見積もりを 3 社から取る"\nstatus: open\nstart: ${addDays(t, -5)}\nend: ${addDays(t, -1)}\n`)}`),
		issue("i-15", { summary: "図書館に本を返す", clarified: true, priority: "high", deadline: addDays(t, 5) }),
		issue("i-16", { summary: "役所に書類を出す（窓口は木曜だけ）", clarified: true, scheduled: addDays(t, -2) }),
		issue("i-17", { summary: "返金が届いたか確かめる", tickler: addDays(t, 4), clarified: true }),
		// Pick のサブ（ADR-0150）: 親は行に出さず、小さい見出しの下にサブを並べる
		issue(
			"i-18",
			{ summary: "引っ越しを終える（新居で暮らし始め、旧居の手続きが済んでいる）", clarified: true, priority: "high", deadline: addDays(t, 30) },
			`---\n---\n\n${[sub("mmmmmm", `summary: "退去の連絡方法と期限を確かめる"\nstatus: open\n`), sub("nnnnnn", `summary: "大型の荷物の処理方法を調べる"\nstatus: open\nestimated: 30\n`), sub("pppppp", `summary: "荷造りをする"\nstatus: open\nstart: ${addDays(t, 10)}\n`)].join("\n")}`,
		),
		{ path: "routine/r-1.md", frontmatter: { type: "routine", id: "r-1", summary: "朝のメール確認", repeat: { every: "day" }, start: addDays(t, -30), estimated: 15 } },
		{ path: "routine/r-2.md", frontmatter: { type: "routine", id: "r-2", summary: "週次レビュー", repeat: { every: "week", on: ["fri"] }, start: addDays(t, -30) } },
		// closing の routine（ADR-0206）。Closing の画面の上に並び順で出る
		{ path: "routine/r-4.md", frontmatter: { type: "routine", id: "r-4", summary: "日次振り返りを書く", repeat: { every: "day" }, start: addDays(t, -30), category: "closing", order: 2 } },
		{ path: "routine/r-5.md", frontmatter: { type: "routine", id: "r-5", summary: "明日の予定を確かめる", repeat: { every: "day" }, start: addDays(t, -30), category: "closing", order: 1 } },
		{ path: "routine/r-3.md", frontmatter: { type: "routine", id: "r-3", summary: "家計簿をつける", repeat: { every: "month", on: ["2th-tue", "last"] }, start: addDays(t, -30), active: false } },
		{ path: "member/m-1.md", frontmatter: { type: "member", id: "m-1", name: "佐藤 花子", nickname: "佐藤さん", alias: "sato-san", label: ["仕事", "経理"] } },
		{ path: "member/m-2.md", frontmatter: { type: "member", id: "m-2", name: "田中 太郎", nickname: "たなぽん", alias: "tanapon", label: ["仕事"] } },
		{ path: "member/m-3.md", frontmatter: { type: "member", id: "m-3", name: "鈴木" } },
		{
			path: "preset/p-1.md",
			frontmatter: { type: "preset", id: "p-1", name: "リリース", sub_issues: ["変更点をまとめる", "タグを付ける", "告知する"], created: "2026-11-01T10:00:00+09:00" },
			text: "---\n---\n\n## 確認\n\n- [ ] テストが通っている\n",
		},
		{ path: "preset/p-2.md", frontmatter: { type: "preset", id: "p-2", name: "引っ越し", sub_issues: ["退去の連絡", "荷造り"] }, text: "---\n---\n" },
	],
	worklogs: [{ path: "worklog/pc/2026-10.jsonl", text: logs.join("\n") }],
	parseYaml: parse,
	boardLogs: [{ path: "board/pc/2026-10.jsonl", text: boardLog.join("\n") }],
	labels: '[{"name":"仕事","color":"#c6e6ff"},{"name":"経理","color":"#ffd6e0"},{"name":"私用","color":"#d9f5d0"},{"name":"読書","color":"#f5e6c8"}]',
});

export const store = { index: new TaskIndex(data), version: 1, subscribe: () => () => {}, mtime: () => Date.now(), problems: [] };
const noop = async () => {};
/** Closing の Notes（ADR-0206）に出るノート */
const note = (path: string, hoursAgo: number, created: string | null, title?: string) => ({ path, basename: path.replace(/^.*\//, "").replace(/\.md$/, ""), stat: { mtime: Date.now() - hoursAgo * 3_600_000 }, fm: { created, ...(title ? { title } : {}) } });
const notes = [note("wiki/llm-wiki.md", 0.5, "2026-10-01T10:00:00+09:00", "LLM wiki の仕組み"), note("会議メモ.md", 1, localDateTime()), note("issue/i-2.md", 2, null)];
export const ctx = {
	app: {
		vault: { getFileByPath: () => null, getMarkdownFiles: () => notes },
		metadataCache: { getFileCache: (f: { fm: unknown }) => ({ frontmatter: f.fm }) },
		workspace: { getLeavesOfType: () => [], revealLeaf: noop },
	},
	store,
	writer: new Proxy({}, { get: () => noop }),
	settings: { deviceName: "pc", presets: [] },
	saveSettings: noop,
	openPath: noop,
	openView: noop,
	report: (m: string) => console.log("report", m),
	undo: new StatusUndo((m: string) => console.log("report", m), 60_000),
};

export const VIEWS: Record<string, FunctionComponent<{ ctx: never }>> = {
	daily: DailyView,
	board: DailyView,
	pick: DailyView,
	closing: DailyView,
	issues: IssueListView,
	inbox: InboxView,
	organize: OrganizeView,
	scheduled: ScheduledView,
	someday: SomedayView,
	routines: RoutineListView,
	labels: LabelManagerView,
	presets: PresetListView,
	members: MemberListView,
	sidebar: SidebarView,
	forms: () => (
		<div style={{ display: "grid", gap: "24px", padding: "16px" }}>
			<DateForm initial={t} onSubmit={() => {}} />
			{/* 期限の印（ADR-0030）: soft_deadline と deadline のある issue の「calendar >」 */}
			<CalendarForm initial={[t]} softDeadline={addDays(t, 3)} deadline={addDays(t, 5)} onSubmit={() => {}} />
			<WorklogForm initial={{ fromMs: Date.now() - 3_600_000, toMs: Date.now(), description: "作業" }} onSubmit={() => {}} onDelete={() => {}} />
			{/* 記録の開始・終了を直すダイアログと時計（ADR-0193） */}
			<WorklogTimesForm summary="見積もりを出す" running initialFromMs={Date.now() - 1_800_000} onSubmit={() => {}} />
			<ClockPicker hour={22} minute={38} onChange={() => {}} onDone={() => {}} />
			{/* 開いたサブのカード（ADR-0161）。Depends on は 1 行のボタンとメニュー */}
			{["hhhhhh", "dddddd"].map((id) => {
				const subs = store.index.subs("i-2");
				return <SubCard ctx={ctx as never} sub={subs.find((s) => s.id === id)!} siblings={subs} open onToggle={() => {}} save={noop} delayMs={null} />;
			})}
		</div>
	),
};

if (!new URLSearchParams(location.search).has("guide-only")) {
const name = location.hash.slice(1) || "header";
const headerPaths: Record<string, string> = {
	header: "issue/i-2.md",
	"header-unpicked": "issue/i-14.md",
	"header-picked": "issue/i-1.md",
	"header-someday": "issue/i-9.md",
	"header-closed": "issue/i-12.md",
};
if (name in headerPaths || name === "routine" || name === "member" || name === "preset" || name === "timeline") {
	for (const [id, width] of [
		["wide", 760],
		["narrow", 360],
	] as const) {
		const el = document.createElement("div");
		el.className = "vt-header vt-ui";
		el.id = id;
		el.style.width = `${width}px`;
		el.style.margin = "8px";
		document.body.append(el);
		// ガントチャート（ADR-0143）: Day と Week を縦に並べる
		const subs = visibleSubs(store.index.subs("i-2"), false);
		const timeline = h("div", { class: "vt-subissues", style: "display:flex;flex-direction:column;gap:16px" }, [
			h(SubTimeline, { ctx: ctx as never, subs, scale: "day", onScale: () => {} }),
			h(SubTimeline, { ctx: ctx as never, subs, scale: "week", onScale: () => {} }),
		]);
		const header =
			name === "timeline"
				? timeline
				: name === "routine"
				? h(RoutineHeader, { ctx: ctx as never, path: "routine/r-1.md" })
				: name === "member"
					? h(MemberHeader, { ctx: ctx as never, path: "member/m-1.md" })
					: name === "preset"
						? h(PresetHeader, { ctx: ctx as never, path: "preset/p-1.md" })
						: h(IssueHeader, { ctx: ctx as never, path: headerPaths[name]! });
		render(header, el);
	}
} else {
	for (const [id, width] of [
		["wide", 1000],
		["narrow", 380],
	] as const) {
		const el = document.createElement("div");
		el.className = "vt-view vt-ui";
		// Obsidian の .view-content.vt-view と同じ（幅に応じた表示を確かめる）
		el.style.containerType = "inline-size";
		el.id = id;
		el.style.width = `${width}px`;
		el.style.border = "1px solid #8884";
		el.style.margin = "8px";
		document.body.append(el);
		render(h(VIEWS[name]!, { ctx: ctx as never }), el);
		// board は DailyView の最後の段階、pick は Pick の段階（ADR-0150）を開いた状態
		if (name === "board") setTimeout(() => el.querySelector<HTMLButtonElement>(".vt-step:last-child")?.click(), 0);
		// closing はボードの Close board を押した状態（ADR-0206）
		if (name === "closing")
			setTimeout(() => {
				el.querySelector<HTMLButtonElement>(".vt-step:last-child")?.click();
				setTimeout(() => el.querySelector<HTMLButtonElement>(".vt-board-foot .is-primary")?.click(), 0);
			}, 0);
		if (name === "pick") setTimeout(() => el.querySelectorAll<HTMLButtonElement>(".vt-step")[2]?.click(), 0);
	}
	// 取り消しのトースト（ADR-0031）。画面の右下に固定で出る
	if (name === "board") {
		ctx.undo.push("i-12", noop);
		ctx.undo.push("i-6", noop);
	}
}

}
