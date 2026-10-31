import { Keymap } from "obsidian";
import { useState } from "preact/hooks";
import { localToday, WEEKDAY_NAMES } from "../core/dates";
import { formatMinutes } from "../core/format";
import { groupKeys } from "../core/groups";
import { routineOccursOn } from "../core/index";
import { describeRepeat, parseMonthSpec, parseRepeat } from "../core/repeat";
import type { Routine } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { PreactModal } from "../obsidian/modals";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";
import { linkProps } from "../ui/a11y";

type Every = "day" | "week" | "month";

/** routine を作るフォーム。月は `15, last, 2th-tue, last-fri` のように書く（ADR-0010） */
function RoutineForm(props: { groups: string[]; onSubmit: (summary: string, repeat: Record<string, unknown>, extra: { group: string | null; estimated: number | null }) => void }) {
	const [summary, setSummary] = useState("");
	const [every, setEvery] = useState<Every>("week");
	const [interval, setInterval] = useState(1);
	const [weekdays, setWeekdays] = useState<string[]>(["mon"]);
	const [monthText, setMonthText] = useState("1");
	const [group, setGroup] = useState("");
	const [estimated, setEstimated] = useState("");
	const on = every === "week" ? weekdays : every === "month" ? monthText.split(/[,\s]+/).filter(Boolean).map((s) => (/^\d+$/.test(s) ? Number(s) : s)) : undefined;
	const repeat: Record<string, unknown> = { every, ...(interval > 1 ? { interval } : {}), ...(on ? { on } : {}) };
	const parsed = parseRepeat(repeat);
	const badMonth = every === "month" && (on as unknown[]).some((v) => parseMonthSpec(v) === null);
	const error = !summary.trim() ? "summary を入れてください" : !parsed.ok ? parsed.error : badMonth ? "日付の書き方が読めません" : null;
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (error === null) props.onSubmit(summary.trim(), repeat, { group: group || null, estimated: Number(estimated) > 0 ? Number(estimated) : null });
			}}
		>
			<label class="vt-text-field">
				<span>summary</span>
				<input type="text" value={summary} placeholder="例: 週次レビュー" onInput={(e) => setSummary(e.currentTarget.value)} />
			</label>
			<div class="vt-text-field">
				<span>くり返し</span>
				<div class="vt-chip-row">
					{(
						[
							["day", "毎日"],
							["week", "毎週"],
							["month", "毎月"],
						] as const
					).map(([v, label]) => (
						<button type="button" class={`vt-filter-chip${every === v ? " is-on" : ""}`} onClick={() => setEvery(v)}>
							{label}
						</button>
					))}
					<span class="vt-muted">間隔</span>
					<input class="vt-small-input" type="number" min={1} value={interval} onInput={(e) => setInterval(Math.max(1, Number(e.currentTarget.value) || 1))} />
				</div>
			</div>
			{every === "week" && (
				<div class="vt-chip-row">
					{[1, 2, 3, 4, 5, 6, 0].map((w) => {
						const name = WEEKDAY_NAMES[w]!;
						const onDay = weekdays.includes(name);
						return (
							<button
								type="button"
								class={`vt-filter-chip${onDay ? " is-on" : ""}`}
								onClick={() => setWeekdays(onDay ? weekdays.filter((x) => x !== name) : [...weekdays, name])}
							>
								{name}
							</button>
						);
					})}
				</div>
			)}
			{every === "month" && (
				<label class="vt-text-field">
					<span>日付（カンマ区切り。15 / last = 月末 / 2th-tue = 第 2 火曜 / last-fri = 最終金曜）</span>
					<input type="text" value={monthText} onInput={(e) => setMonthText(e.currentTarget.value)} />
				</label>
			)}
			<div class="vt-chip-row">
				<label class="vt-text-field">
					<span>グループ（任意）</span>
					<select class="dropdown" value={group} onChange={(e) => setGroup(e.currentTarget.value)}>
						<option value="">未分類</option>
						{props.groups.map((g) => (
							<option value={g}>{g}</option>
						))}
					</select>
				</label>
				<label class="vt-text-field">
					<span>estimated（分・任意）</span>
					<input class="vt-small-input" type="number" min={0} value={estimated} onInput={(e) => setEstimated(e.currentTarget.value)} />
				</label>
			</div>
			<div class="vt-muted">{parsed.ok ? describeRepeat(parsed.value) : ""}</div>
			{error !== null && summary && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="submit" class="mod-cta" disabled={error !== null}>
					作成
				</button>
			</div>
		</form>
	);
}

/** Routine List（ADR-0010）: 一覧・作成・一時停止 */
export function RoutineListView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	const today = localToday();
	const routines = [...index.routines.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
	const create = () =>
		new PreactModal(ctx.app, "routine を作成", (close) => (
			<RoutineForm
				groups={groupKeys(index.data.groups)}
				onSubmit={(summary, repeat, extra) => {
					close();
					void ctx.writer.createRoutine(summary, repeat, { ...extra, start: today }).catch((e) => ctx.report("routine を作れませんでした", e));
				}}
			/>
		)).open();
	const toggle = (r: Routine) => void ctx.writer.update(r.path, { active: !r.active }).catch((e) => ctx.report("切り替えられませんでした", e));
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Routines</h2>
				<span class="vt-count">{routines.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-primary" onClick={create}>
					<Icon name="plus" /> routine を作成
				</button>
			</header>
			{routines.length === 0 && <div class="vt-empty">routine はまだありません。毎日・毎週のようにくり返すタスクを登録できます（task board にだけ出ます）</div>}
			<div class="vt-routine-list">
				{routines.map((r) => (
					<div class={`vt-routine-item${r.active ? "" : " is-paused"}`} key={r.id}>
						<span class="vt-badge vt-id vt-routine-id">{r.id}</span>
						<div class="vt-routine-main" {...linkProps((e) => void ctx.openPath(r.path, Keymap.isModEvent(e) !== false))}>
							<span class="vt-routine-summary">{r.summary || "（summary なし）"}</span>
							<span class="vt-muted">
								{r.repeat ? describeRepeat(r.repeat) : "repeat が読めません"}
								{r.group ? ` · ${r.group}` : ""}
								{r.estimated ? ` · ${formatMinutes(r.estimated)}` : ""}
							</span>
						</div>
						{routineOccursOn(r, today) && <span class="vt-chip-mini is-today">今日</span>}
						<button class={`vt-switch${r.active ? " is-on" : ""}`} role="switch" aria-checked={r.active} title={r.active ? "一時停止する" : "再開する"} onClick={() => toggle(r)}>
							<span class="vt-switch-thumb" />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
