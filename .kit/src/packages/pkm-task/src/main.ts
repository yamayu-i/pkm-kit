import { Notice, Platform, Plugin } from "obsidian";
import { loadPluginDataOrLegacy } from "../../shared/src/legacy-data.ts";
import { openInNotePane, openListView } from "../../shared/src/list-pane.ts";
import { installTaskHeaders } from "./header/extension";
import { openCaptureModal } from "./obsidian/capture";
import type { TaskContext } from "./obsidian/context";
import { DEFAULT_SETTINGS, TaskSettingTab, sanitizeDeviceName, type TaskSettings } from "./obsidian/settings";
import { StatusUndo } from "./obsidian/status-undo";
import { TaskStore } from "./obsidian/store";
import { preactViewCreator, type ViewSpec } from "./obsidian/view";
import { TaskWriter } from "./obsidian/writer";
import { DailyView } from "./views/DailyView";
import { GroupManagerView } from "./views/GroupManagerView";
import { InboxView } from "./views/InboxView";
import { LabelManagerView } from "./views/LabelManagerView";
import { MemberListView } from "./views/MemberListView";
import { IssueListView } from "./views/IssueListView";
import { OrganizeView } from "./views/OrganizeView";
import { RoutineListView } from "./views/RoutineListView";
import { ScheduledView } from "./views/ScheduledView";
import { SidebarView } from "./views/SidebarView";
import { SomedayView } from "./views/SomedayView";

/** View の一覧（ADR-0009, 0010, 0021, 0035） */
const VIEWS: ViewSpec[] = [
	{ type: "pkm-task-daily", title: "Daily", icon: "calendar-check", component: DailyView },
	{ type: "pkm-task-issues", title: "Issues", icon: "list-todo", component: IssueListView },
	{ type: "pkm-task-inbox", title: "Inbox", icon: "inbox", component: InboxView },
	{ type: "pkm-task-organize", title: "Organize", icon: "layers", component: OrganizeView },
	{ type: "pkm-task-scheduled", title: "Scheduled", icon: "calendar-range", component: ScheduledView },
	{ type: "pkm-task-someday", title: "Someday", icon: "cloud", component: SomedayView },
	{ type: "pkm-task-routines", title: "Routines", icon: "repeat", component: RoutineListView },
	{ type: "pkm-task-groups", title: "Board groups", icon: "layout-grid", component: GroupManagerView },
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
			this.addCommand({ id: `open-${spec.type.replace("pkm-task-", "")}`, name: `${spec.title} を開く`, icon: spec.icon, callback: () => void ctx.openView(spec.type) });
		}
		this.registerView(SIDEBAR_VIEW.type, preactViewCreator(SIDEBAR_VIEW, ctx));
		this.addCommand({ id: "open-sidebar", name: "Tasks サイドバーを開く", icon: SIDEBAR_VIEW.icon, callback: () => void openSidebar(true) });
		installTaskHeaders(ctx, this);
		this.addCommand({ id: "capture-issues", name: "issue をまとめて作成", callback: () => openCaptureModal(ctx) });
		// リボンのボタン（Daily を開く、issue をまとめて作成）は pkm-ribbon が並びの表で出し、コマンドを呼ぶ（ADR-0029、ADR-0070）
		this.addSettingTab(new TaskSettingTab(this.app, this, this.taskSettings, () => this.saveData(this.taskSettings)));
		this.app.workspace.onLayoutReady(() => {
			void store.load((ref) => this.registerEvent(ref)).catch((e) => ctx.report("タスクの索引を作れませんでした", e));
			void openSidebar(false).catch((e) => ctx.report("サイドバーを開けませんでした", e));
		});
	}

	override onunload(): void {
		this.store?.unload();
		this.undo?.dismiss();
	}

	private async loadSettings(): Promise<void> {
		const saved = ((await loadPluginDataOrLegacy(this, "vault-task")) ?? {}) as Partial<TaskSettings>;
		Object.assign(this.taskSettings, DEFAULT_SETTINGS, saved);
		if (!this.taskSettings.deviceName) {
			// 端末名の初期値は pkm-git の端末名にする（同じ端末なら同じ名前がよい）
			const git = (this.app as unknown as { plugins?: { plugins?: Record<string, { data?: { deviceName?: unknown } }> } }).plugins?.plugins?.["pkm-git"];
			const name = git?.data?.deviceName;
			if (typeof name === "string" && name) this.taskSettings.deviceName = sanitizeDeviceName(name);
		}
	}
}
