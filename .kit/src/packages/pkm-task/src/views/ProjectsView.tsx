import { useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { loadItems, needsEstimate, projectGroups } from "../core/projects";
import type { SubIssue } from "../core/sub-issue";
import type { TimelineScale } from "../core/timeline";
import { closedLabel } from "../header/ClosedToggle";
import { revealSub } from "../header/sub-reveal";
import { TimelineChart, type ChartRow } from "../header/SubTimeline";
import type { TaskContext } from "../obsidian/context";
import { useStoreVersion } from "../ui/hooks";

/**
 * Projects（ADR-0231）: Project を横断するタイムライン。Project の行と、その下のサブの行を 1 ページに並べ、
 * 日の列の見出しの下に負荷の行（見積もりの合計と使える時間）を出す
 */
export function ProjectsView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	// 閉じたサブの表示と目盛りは保存しない。目盛りの既定は Week（数か月を見渡すため）
	const [showClosed, setShowClosed] = useState(false);
	const [scale, setScale] = useState<TimelineScale>("week");
	const index = ctx.store.index;
	const today = localToday();
	const groups = projectGroups(index, showClosed);
	const rows: ChartRow[] = groups.flatMap((g) => [{ kind: "project" as const, issue: g.issue, subs: g.subs }, ...g.subs.map((sub) => ({ kind: "sub" as const, sub }))]);
	const closed = groups.reduce((n, g) => n + g.closed, 0);
	const noEstimate = groups.reduce((n, g) => n + g.subs.filter((s) => needsEstimate(s, today)).length, 0);
	// サブの題: 親の issue のノートを開いてから、そのサブの下部のカードを上端に出す（ADR-0179）
	const openSub = (sub: SubIssue) =>
		void ctx
			.openPath(sub.path)
			.then(() => window.setTimeout(() => revealSub(sub), 50))
			.catch((e) => ctx.report("サブを開けませんでした", e));
	return (
		<div class="vt-page vt-projects">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Projects</h2>
				<span class="vt-count">{groups.length}</span>
				{noEstimate > 0 && (
					<span class="vt-badge vt-projects-no-estimate" title="Sub-issues in the next 14 days without an estimate">
						No estimate {noEstimate}
					</span>
				)}
				<span class="vt-spacer" />
				{closed > 0 && (
					<button type="button" class="vt-text-button" onClick={() => setShowClosed((v) => !v)}>
						{closedLabel(closed, showClosed)}
					</button>
				)}
			</header>
			{groups.length === 0 ? (
				<div class="vt-empty">No projects</div>
			) : (
				<TimelineChart ctx={ctx} rows={rows} scale={scale} onScale={setScale} load={{ capacity: ctx.settings.capacity, items: loadItems(groups, index) }} onSubLabel={openSub} />
			)}
		</div>
	);
}
