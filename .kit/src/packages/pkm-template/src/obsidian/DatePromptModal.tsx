import { Modal, Platform, type App } from "obsidian";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { localToday } from "../../../shared/src/dates.ts";
import { MonthCalendar } from "../../../shared/src/month-calendar.tsx";
import { formatPromptDate, parseDatePromptInput } from "../core/date-prompt";

/** 日付を 1 つ選ぶ（ADR-0065）。カレンダーは pkm-task と共有（ADR-0078）。短い書き方の入力欄（`-d` で曜日付き）、曜日のチェックボックス、カレンダー */
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
					placeholder="e.g. 15 / 1224 / +1d / mon / +2w / +2 -d"
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
				today={today}
				isSelected={(d) => d === parsed?.date}
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
