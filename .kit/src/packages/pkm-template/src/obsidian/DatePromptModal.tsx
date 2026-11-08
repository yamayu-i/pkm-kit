import { Modal, Platform, type App } from "obsidian";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { localToday, monthGridDays, weekdayOf, WEEKDAY_NAMES, type LocalDate } from "../../../shared/src/dates.ts";
import { formatPromptDate, parseDatePromptInput } from "../core/date-prompt";

/** 月のカレンダー（pkm-task の日付の入力と同じ形。ADR-0017・ADR-0065）。日を押すとその日で決める */
function MonthCalendar(props: { month: string; onMonth: (month: string) => void; selected: LocalDate | null; onPick: (date: LocalDate) => void }) {
	const today = localToday();
	const { month } = props;
	const shift = (n: number) => {
		const [y, m] = month.split("-").map(Number) as [number, number];
		props.onMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));
	};
	return (
		<div class="vt-tpl-calendar">
			<div class="vt-tpl-calendar-nav">
				<button type="button" aria-label="Previous month" onClick={() => shift(-1)}>
					‹
				</button>
				<span>{month.replace("-", " / ")}</span>
				<button type="button" aria-label="Next month" onClick={() => shift(1)}>
					›
				</button>
			</div>
			<div class="vt-tpl-calendar-grid">
				{WEEKDAY_NAMES.map((w) => (
					<span class="vt-tpl-weekday">{w}</span>
				))}
				{monthGridDays(month).map((d) => {
					const w = weekdayOf(d);
					const cls = ["vt-tpl-day"];
					if (w === 0 || w === 6) cls.push("is-weekend");
					if (!d.startsWith(month)) cls.push("is-dimmed");
					if (d === today) cls.push("is-today");
					if (d === props.selected) cls.push("is-selected");
					const label = d === today ? `${d} (today)` : d;
					return (
						<button type="button" class={cls.join(" ")} aria-pressed={d === props.selected} aria-label={label} title={label} onClick={() => props.onPick(d)}>
							{Number(d.slice(8, 10))}
						</button>
					);
				})}
			</div>
		</div>
	);
}

/** 日付を 1 つ選ぶ（ADR-0065）。短い書き方の入力欄（`-d` で曜日付き）、曜日のチェックボックス、カレンダー */
function DatePromptForm(props: { onSubmit: (value: string) => void }) {
	const today = localToday();
	const [text, setText] = useState("");
	const [weekdayChecked, setWeekdayChecked] = useState(false);
	const [month, setMonth] = useState(today.slice(0, 7));
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => ref.current?.focus(), []);

	const parsed = parseDatePromptInput(text, today);
	const weekday = weekdayChecked || parsed?.weekday === true;
	const output = parsed ? formatPromptDate(parsed.date, weekday) : null;

	return (
		<form
			class="vt-tpl-modal"
			onSubmit={(e) => {
				e.preventDefault();
				if (output !== null) props.onSubmit(output);
			}}
		>
			<div class="vt-tpl-section">
				<input
					ref={ref}
					type="text"
					class="vt-tpl-input"
					aria-label="Date"
					placeholder="e.g. 15 / 1224 / +3 / mon / +2w / +2 -d"
					value={text}
					onInput={(e) => {
						const value = e.currentTarget.value;
						setText(value);
						const next = parseDatePromptInput(value, today);
						if (next !== null) setMonth(next.date.slice(0, 7));
					}}
				/>
				<div class={`vt-tpl-preview${output === null ? " is-error" : ""}`} aria-live="polite">
					{output === null ? "日付として読めません" : `Inserts: ${output}`}
				</div>
				<label class="vt-tpl-check">
					<input type="checkbox" checked={weekday} disabled={parsed?.weekday === true} onChange={(e) => setWeekdayChecked(e.currentTarget.checked)} />
					Add weekday (-d)
				</label>
			</div>
			<MonthCalendar
				month={month}
				onMonth={setMonth}
				selected={parsed?.date ?? null}
				onPick={(d) => props.onSubmit(formatPromptDate(d, weekday))}
			/>
			<div class="vt-tpl-actions">
				{!Platform.isMobile && <span class="vt-tpl-hint">Enter to insert</span>}
				<button type="submit" class="vt-tpl-button is-primary" disabled={output === null}>
					Insert
				</button>
			</div>
		</form>
	);
}

class DatePromptModal extends Modal {
	private done = false;

	constructor(
		app: App,
		private readonly label: string,
		private readonly resolve: (value: string | null) => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle(this.label);
		render(
			<DatePromptForm
				onSubmit={(value) => {
					this.done = true;
					this.close();
					this.resolve(value);
				}}
			/>,
			this.contentEl,
		);
	}

	override onClose(): void {
		render(null, this.contentEl);
		if (!this.done) this.resolve(null);
	}
}

/**
 * `{{prompt-date}}` のラベルごとに、出てくる順に日付のダイアログを開く（ADR-0065）。
 * どれかをキャンセルしたら null（何も作らない・挿入しない）。ラベルがなければダイアログは開かない
 */
export async function askDates(app: App, labels: readonly string[]): Promise<Record<string, string> | null> {
	const values: Record<string, string> = {};
	for (const label of labels) {
		const value = await new Promise<string | null>((resolve) => new DatePromptModal(app, label, resolve).open());
		if (value === null) return null;
		values[label] = value;
	}
	return values;
}
