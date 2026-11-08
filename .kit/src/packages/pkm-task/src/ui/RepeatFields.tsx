import { WEEKDAY_NAMES } from "../core/dates";
import { describeRepeat, parseMonthSpec, parseRepeat, serializeRepeat, type RepeatRule } from "../core/repeat";

type Every = "day" | "week" | "month";

/** くり返しの入力中の値 */
export interface RepeatDraft {
	every: Every;
	interval: number;
	weekdays: string[];
	monthText: string;
}

export function defaultRepeatDraft(): RepeatDraft {
	return { every: "week", interval: 1, weekdays: ["mon"], monthText: "1" };
}

export function repeatDraftOf(rule: RepeatRule | null): RepeatDraft {
	if (rule === null) return defaultRepeatDraft();
	const on = (serializeRepeat(rule).on ?? []) as (string | number)[];
	return {
		...defaultRepeatDraft(),
		every: rule.every,
		interval: rule.interval,
		...(rule.every === "week" ? { weekdays: on as string[] } : {}),
		...(rule.every === "month" ? { monthText: on.join(", ") } : {}),
	};
}

/** 入力を frontmatter の形にする。読めなければ error を返す */
export function readRepeatDraft(draft: RepeatDraft): { repeat: Record<string, unknown>; error: string | null; description: string } {
	const { every, interval } = draft;
	const on =
		every === "week"
			? draft.weekdays
			: every === "month"
				? draft.monthText
						.split(/[,\s]+/)
						.filter(Boolean)
						.map((s) => (/^\d+$/.test(s) ? Number(s) : s))
				: undefined;
	const repeat: Record<string, unknown> = { every, ...(interval > 1 ? { interval } : {}), ...(on ? { on } : {}) };
	const parsed = parseRepeat(repeat);
	const badMonth = every === "month" && (on as unknown[]).some((v) => parseMonthSpec(v) === null);
	return {
		repeat,
		error: !parsed.ok ? parsed.error : badMonth ? "日付の書き方が読めません" : null,
		description: parsed.ok ? describeRepeat(parsed.value) : "",
	};
}

/** くり返しの入力欄。月は `15, last, 2th-tue, last-fri` のように書く（ADR-0010） */
export function RepeatFields(props: { draft: RepeatDraft; onChange: (draft: RepeatDraft) => void }) {
	const { draft, onChange } = props;
	const set = (patch: Partial<RepeatDraft>) => onChange({ ...draft, ...patch });
	return (
		<>
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
						<button type="button" class={`vt-filter-chip${draft.every === v ? " is-on" : ""}`} onClick={() => set({ every: v })}>
							{label}
						</button>
					))}
					<span class="vt-muted">間隔</span>
					<input class="vt-small-input" type="number" min={1} value={draft.interval} onInput={(e) => set({ interval: Math.max(1, Number(e.currentTarget.value) || 1) })} />
				</div>
			</div>
			{draft.every === "week" && (
				<div class="vt-chip-row">
					{[1, 2, 3, 4, 5, 6, 0].map((w) => {
						const name = WEEKDAY_NAMES[w]!;
						const onDay = draft.weekdays.includes(name);
						return (
							<button
								type="button"
								class={`vt-filter-chip${onDay ? " is-on" : ""}`}
								onClick={() => set({ weekdays: onDay ? draft.weekdays.filter((x) => x !== name) : [...draft.weekdays, name] })}
							>
								{name}
							</button>
						);
					})}
				</div>
			)}
			{draft.every === "month" && (
				<label class="vt-text-field">
					<span>日付（カンマ区切り。15 / last = 月末 / 2th-tue = 第 2 火曜 / last-fri = 最終金曜）</span>
					<input type="text" value={draft.monthText} onInput={(e) => set({ monthText: e.currentTarget.value })} />
				</label>
			)}
			<div class="vt-muted">{readRepeatDraft(draft).description}</div>
		</>
	);
}
