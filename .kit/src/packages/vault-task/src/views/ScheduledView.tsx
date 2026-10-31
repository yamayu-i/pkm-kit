import { Keymap } from "obsidian";
import { addDays, localToday, WEEKDAY_NAMES, weekdayOf } from "../core/dates";
import { isActive } from "../core/index";
import type { TaskContext } from "../obsidian/context";
import { IdBadge } from "../ui/badges";
import { DayCell } from "../ui/forms";
import { useNow, useStoreVersion } from "../ui/hooks";
import { linkProps } from "../ui/a11y";

const DAYS = 14;

/** Scheduled（ADR-0009）: 今日以降に実行日がある issue × 14 日。セルで on / off */
export function ScheduledView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const today = localToday(new Date(useNow(60_000)));
	const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i));
	const issues = [...ctx.store.index.issues.values()]
		.filter((i) => isActive(i) && i.scheduled.some((d) => d >= today))
		.sort((a, b) => (a.scheduled.find((d) => d >= today) ?? "").localeCompare(b.scheduled.find((d) => d >= today) ?? "") || a.id.localeCompare(b.id, "en", { numeric: true }));
	const toggle = (path: string, scheduled: string[], d: string) => {
		const next = scheduled.includes(d) ? scheduled.filter((x) => x !== d) : [...scheduled, d].sort();
		void ctx.writer.update(path, { scheduled: next }).catch((e) => ctx.report("実行日を変えられませんでした", e));
	};
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Scheduled</h2>
				<span class="vt-count">{issues.length}</span>
			</header>
			{issues.length === 0 ? (
				<div class="vt-empty">今日以降に実行日がある issue はありません</div>
			) : (
				<div class="vt-sched-scroll">
					<table class="vt-sched">
						<thead>
							<tr>
								<th class="vt-sched-sticky" />
								{days.map((d) => (
									<th class={weekdayOf(d) % 6 === 0 ? "is-weekend" : ""}>
										<span class="vt-weekday">{WEEKDAY_NAMES[weekdayOf(d)]}</span>
										<span class="vt-sched-date">{d === today ? "今日" : `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`}</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{issues.map((i) => (
								<tr key={i.id}>
									<th class="vt-sched-sticky">
										<span class="vt-sched-issue" {...linkProps((e) => void ctx.openPath(i.path, Keymap.isModEvent(e) !== false))}>
											<IdBadge issue={i} />
											<span class="vt-cell-summary" title={i.summary}>
												{i.summary}
											</span>
										</span>
									</th>
									{days.map((d) => (
										<td>
											<DayCell date={d} scheduled={i.scheduled.includes(d)} midDue={i.midDue} deadline={i.deadline} today={today} onClick={() => toggle(i.path, i.scheduled, d)} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
