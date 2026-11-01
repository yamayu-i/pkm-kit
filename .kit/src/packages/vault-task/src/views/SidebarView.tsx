import { Keymap } from "obsidian";
import { localToday } from "../core/dates";
import { formatMinutes } from "../core/format";
import { sidebarCounts } from "../core/index";
import { stopTimer } from "../obsidian/board-actions";
import { openCaptureModal } from "../obsidian/capture";
import type { TaskContext } from "../obsidian/context";
import { Icon } from "../ui/Icon";
import { linkProps } from "../ui/a11y";
import { useNow, useStoreVersion } from "../ui/hooks";

interface NavItem {
	type: string;
	title: string;
	icon: string;
	count?: number;
}

/** 左サイドバー常駐のナビゲーション View（ADR-0021） */
export function SidebarView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const now = useNow(30_000);
	const today = localToday(new Date(now));
	const index = ctx.store.index;
	const counts = sidebarCounts(index, today);

	// 記録中のタスク（同じ taskId の複数ログは 1 行にまとめる）
	const runningByTask = new Map<string, number>();
	for (const l of index.running()) {
		const elapsed = Math.max(0, now - l.fromMs);
		runningByTask.set(l.taskId, Math.max(runningByTask.get(l.taskId) ?? 0, elapsed));
	}

	const items: NavItem[] = [
		{ type: "vault-task-daily", title: "Daily", icon: "calendar-check", count: counts.daily },
		{ type: "vault-task-inbox", title: "Inbox", icon: "inbox", count: counts.inbox },
		{ type: "vault-task-organize", title: "Organize", icon: "layers", count: counts.organize },
		{ type: "vault-task-scheduled", title: "Scheduled", icon: "calendar-range", count: counts.scheduled },
		{ type: "vault-task-issues", title: "Issues", icon: "list-todo", count: counts.issues },
		{ type: "vault-task-someday", title: "Someday", icon: "cloud", count: counts.someday },
		{ type: "vault-task-routines", title: "Routines", icon: "repeat", count: counts.routines },
		{ type: "vault-task-groups", title: "Board groups", icon: "layout-grid" },
		{ type: "vault-task-labels", title: "Labels", icon: "tag" },
	];

	return (
		<div class="vt-sidebar">
			<button class="vt-button is-primary vt-sidebar-capture" onClick={() => openCaptureModal(ctx)}>
				<Icon name="plus" /> issue をまとめて作成
			</button>
			{runningByTask.size > 0 && (
				<section class="vt-sidebar-section">
					<div class="vt-field-label">記録中</div>
					<div class="vt-sidebar-running">
						{[...runningByTask.entries()].map(([taskId, elapsed]) => {
							const issue = index.issues.get(taskId);
							const routine = index.routines.get(taskId);
							const summary = issue?.summary || routine?.summary || taskId;
							const path = issue?.path ?? routine?.path ?? null;
							return (
								<div class="vt-task is-running" key={taskId}>
									<div class="vt-task-top">
										{path ? (
											<span class="vt-task-summary" title={`${taskId} ${summary}`} {...linkProps((e) => void ctx.openPath(path, Keymap.isModEvent(e) !== false))}>
												{summary}
											</span>
										) : (
											<span class="vt-task-summary">{summary}</span>
										)}
										<button
											class="vt-play is-running"
											aria-label="記録を止める"
											title="記録を止める"
											onClick={() => void stopTimer(ctx, [taskId])}
										>
											<Icon name="square" />
											<span class="vt-num">{formatMinutes(elapsed / 60_000)}</span>
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}
			<nav class="vt-sidebar-nav" aria-label="Vault Task Views">
				{items.map((item) => (
					<button class="vt-nav-item" key={item.type} onClick={() => void ctx.openView(item.type)}>
						<Icon name={item.icon} />
						<span class="vt-nav-label">{item.title}</span>
						<span class="vt-spacer" />
						{item.count !== undefined && item.count > 0 && <span class="vt-count">{item.count}</span>}
					</button>
				))}
			</nav>
		</div>
	);
}
