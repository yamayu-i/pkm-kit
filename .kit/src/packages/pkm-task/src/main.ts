import { Notice, Platform, Plugin } from "obsidian";
import { h } from "preact";
import { loadPluginDataOrLegacy } from "../../shared/src/legacy-data.ts";
import { openInNotePane, openListView } from "../../shared/src/list-pane.ts";
import { installTaskHeaders } from "./header/extension";
import { installSubCards } from "./header/sub-cards";
import { PreactModal } from "./obsidian/modals";
import { openCaptureModal } from "./obsidian/capture";
import type { TaskContext } from "./obsidian/context";
import { sanitizeSubOpen } from "./core/sub-issue";
import { DEFAULT_SETTINGS, TaskSettingTab, sanitizeDeviceName, type TaskSettings } from "./obsidian/settings";
import { registerRunningStatusBar } from "./obsidian/status-bar";
import { workKey } from "./core/worklog";
import { StatusUndo } from "./obsidian/status-undo";
import { TaskStore } from "./obsidian/store";
import { preactViewCreator, type ViewSpec } from "./obsidian/view";
import { TaskWriter } from "./obsidian/writer";
import { DailyView } from "./views/DailyView";
import { InboxView } from "./views/InboxView";
import { LabelManagerView } from "./views/LabelManagerView";
import { MemberListView } from "./views/MemberListView";
import { IssueListView } from "./views/IssueListView";
import { OrganizeView } from "./views/OrganizeView";
import { RoutineListView } from "./views/RoutineListView";
import { ScheduledView } from "./views/ScheduledView";
import { SidebarView } from "./views/SidebarView";
import { SomedayView } from "./views/SomedayView";
import { TasksNowDialog } from "./views/TasksNowDialog";

/** リボンのボタン（pkm-ribbon）が呼ぶコマンドの ID と、バッジの数が変わったことを知らせるイベント（ADR-0070 の 6） */
const TASKS_NOW_COMMAND = "pkm-task:open-tasks-now";
const BADGE_CHANGED_EVENT = "pkm-ribbon:badge-changed";

/** View の一覧（ADR-0009, 0010, 0021, 0035） */
const VIEWS: ViewSpec[] = [
	{ type: "pkm-task-daily", title: "Today", icon: "sun", component: DailyView },
	{ type: "pkm-task-issues", title: "Issues", icon: "list-todo", component: IssueListView },
	{ type: "pkm-task-inbox", title: "Inbox", icon: "inbox", component: InboxView },
	{ type: "pkm-task-organize", title: "Organize", icon: "layers", component: OrganizeView },
	{ type: "pkm-task-scheduled", title: "Scheduled", icon: "calendar-range", component: ScheduledView },
	{ type: "pkm-task-someday", title: "Someday", icon: "cloud", component: SomedayView },
	{ type: "pkm-task-routines", title: "Routines", icon: "repeat", component: RoutineListView },
	{ type: "pkm-task-members", title: "Members", icon: "users", component: MemberListView },
	{ type: "pkm-task-labels", title: "Labels", icon: "tag", component: LabelManagerView },
];

const SIDEBAR_VIEW: ViewSpec = { type: "pkm-task-sidebar", title: "Tasks", icon: "check-square", component: SidebarView };

export default class PkmTaskPlugin extends Plugin {
	private store: TaskStore | null = null;
	private undo: StatusUndo | null = null;
	taskSettings: TaskSettings = { ...DEFAULT_SETTINGS };

	override async onload(): Promise<void> {
		await this.loadSettings();
		const store = new TaskStore(this.app);
		this.store = store;
		const report = (message: string, error?: unknown) => {
			if (error !== undefined) console.error(`pkm-task: ${message}`, error);
			const detail = error instanceof Error ? `: ${error.message}` : "";
			new Notice(`${message}${detail}`);
		};
		const writer = new TaskWriter(this.app, store, () => this.taskSettings.deviceName);
		const undo = new StatusUndo(report);
		this.undo = undo;
		// status を変えたら取り消しのトーストを出す。戻した変更（undo）には出さない（ADR-0031）
		writer.onStatusChange = (c) => {
			if (c.via !== "undo") undo.push(c.id, () => writer.update(c.path, c.before, "undo"));
		};
		const ctx: TaskContext = {
			app: this.app,
			store,
			writer,
			undo,
			settings: this.taskSettings,
			saveSettings: () => this.saveData(this.taskSettings),
			// 一覧の View は左の固定ペインに、そこから開くノートは右のノートペインに出す（ADR-0033）
			openPath: async (path, newTab = false) => {
				const file = this.app.vault.getFileByPath(path);
				if (file) await openInNotePane(this.app.workspace, file, { newTab, phone: Platform.isPhone });
			},
			openView: (type) => openListView(this.app.workspace, type, { phone: Platform.isPhone }),
			report,
		};

		const openSidebar = async (reveal = true) => {
			const { workspace } = this.app;
			const existing = workspace.getLeavesOfType?.(SIDEBAR_VIEW.type)[0];
			const leaf = existing ?? workspace.getLeftLeaf?.(false);
			if (!leaf) return;
			if (!existing) await leaf.setViewState({ type: SIDEBAR_VIEW.type, active: reveal });
			if (reveal) await workspace.revealLeaf(leaf);
		};

		for (const spec of VIEWS) {
			this.registerView(spec.type, preactViewCreator(spec, ctx));
			this.addCommand({ id: `open-${spec.type.replace("pkm-task-", "")}`, name: `Open ${spec.title}`, icon: spec.icon, callback: () => void ctx.openView(spec.type) });
		}
		this.registerView(SIDEBAR_VIEW.type, preactViewCreator(SIDEBAR_VIEW, ctx));
		this.addCommand({ id: "open-sidebar", name: "Open Tasks sidebar", icon: SIDEBAR_VIEW.icon, callback: () => void openSidebar(true) });
		installTaskHeaders(ctx, this);
		installSubCards(ctx, this);
		this.addCommand({ id: "capture-issues", name: "Capture issues", callback: () => openCaptureModal(ctx) });
		// リボンの「Tasks Now」（pkm-ribbon がこのコマンドを呼ぶ。ADR-0154）
		this.addCommand({
			id: "open-tasks-now",
			name: "Open Tasks Now",
			icon: "timer",
			callback: () => {
				const modal = new PreactModal(this.app, "Tasks Now", (_close, scope) => h(TasksNowDialog, { ctx, scope }));
				modal.modalEl.addClass("vt-now-modal");
				modal.open();
			},
		});
		// リボンのボタン（Open Today、Capture issues）は pkm-ribbon が並びの表で出し、コマンドを呼ぶ（ADR-0029、ADR-0070）
		// 記録中のタスクの数を、リボンの Tasks Now のバッジに出す（ADR-0154）。数が変わったときだけ pkm-ribbon に知らせる
		let lastBadge: number | null = null;
		this.register(
			store.subscribe(() => {
				const count = this.getRibbonBadge(TASKS_NOW_COMMAND);
				if (count === lastBadge) return;
				lastBadge = count;
				this.app.workspace.trigger(BADGE_CHANGED_EVENT, TASKS_NOW_COMMAND);
			}),
		);
		// 記録中のタイマーを PC のステータスバーに出す（ADR-0075）
		registerRunningStatusBar(this, store, { path: (path) => void ctx.openPath(path), sidebar: () => void openSidebar(true) });
		this.addSettingTab(new TaskSettingTab(this.app, this, this.taskSettings, () => this.saveData(this.taskSettings)));
		this.app.workspace.onLayoutReady(() => {
			void store.load((ref) => this.registerEvent(ref)).catch((e) => ctx.report("タスクの索引を作れませんでした", e));
			void openSidebar(false).catch((e) => ctx.report("サイドバーを開けませんでした", e));
		});
	}

	/** pkm-ribbon が尋ねるバッジの数（ADR-0070 の 6）。Tasks Now は、記録中のタスクの数（なければ null） */
	getRibbonBadge(command: string): number | null {
		if (command !== TASKS_NOW_COMMAND || !this.store) return null;
		const n = new Set(this.store.index.running().map(workKey)).size;
		return n > 0 ? n : null;
	}

	override onunload(): void {
		this.store?.unload();
		this.undo?.dismiss();
	}

	private async loadSettings(): Promise<void> {
		const saved = ((await loadPluginDataOrLegacy(this, "vault-task")) ?? {}) as Partial<TaskSettings>;
		Object.assign(this.taskSettings, DEFAULT_SETTINGS, saved);
		this.taskSettings.subOpen = sanitizeSubOpen(saved.subOpen);
		if (!this.taskSettings.deviceName) {
			// 端末名の初期値は pkm-git の端末名にする（同じ端末なら同じ名前がよい）
			const git = (this.app as unknown as { plugins?: { plugins?: Record<string, { data?: { deviceName?: unknown } }> } }).plugins?.plugins?.["pkm-git"];
			const name = git?.data?.deviceName;
			if (typeof name === "string" && name) this.taskSettings.deviceName = sanitizeDeviceName(name);
		}
	}
}
