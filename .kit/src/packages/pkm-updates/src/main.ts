import { Platform, Plugin } from "obsidian";
import { openListView } from "../../shared/src/list-pane.ts";
import { UpdatesModel } from "./obsidian/model";
import { preactViewCreator } from "./obsidian/view";
import { UpdatesView } from "./views/UpdatesView";

/** View の型。一覧ペインの接頭辞 pkm-updates- を持つ（ADR-0033、ADR-0070 の 1） */
export const VIEW_TYPE = "pkm-updates-view";
/** リボンのボタン（pkm-ribbon）が呼ぶコマンドの ID */
const OPEN_COMMAND = "pkm-updates:open-view";
/** pkm-ribbon に数が変わったことを知らせるイベント（ADR-0070 の 6） */
const BADGE_CHANGED_EVENT = "pkm-ribbon:badge-changed";
/** イベントを出す間隔の下限 */
const BADGE_INTERVAL_MS = 1000;

export default class PkmUpdatesPlugin extends Plugin {
	private model: UpdatesModel | null = null;

	override async onload(): Promise<void> {
		const model = new UpdatesModel(this.app);
		this.model = model;
		this.registerView(VIEW_TYPE, preactViewCreator({ type: VIEW_TYPE, title: "PKM Updates", icon: "bell" }, UpdatesView, { app: this.app, model, deviceName: () => this.deviceName() }));
		this.addCommand({ id: "open-view", name: "PKM Updates を開く", callback: () => void openListView(this.app.workspace, VIEW_TYPE, { phone: Platform.isPhone }) });

		// リボンのバッジの数が変わったら、間引いて pkm-ribbon に知らせる
		let lastCount: number | null = null;
		let lastSent = 0;
		let timer: number | null = null;
		const notify = () => {
			if (model.count === lastCount) return;
			const wait = lastSent + BADGE_INTERVAL_MS - Date.now();
			if (wait > 0) {
				if (timer === null)
					timer = window.setTimeout(() => {
						timer = null;
						notify();
					}, wait);
				return;
			}
			lastCount = model.count;
			lastSent = Date.now();
			this.app.workspace.trigger(BADGE_CHANGED_EVENT, OPEN_COMMAND);
		};
		const unsubscribe = model.subscribe(notify);
		this.register(() => {
			unsubscribe();
			if (timer !== null) window.clearTimeout(timer);
		});

		this.app.workspace.onLayoutReady(() => {
			void model.load((ref) => this.registerEvent(ref)).catch((e) => console.error("pkm-updates: 変更の一覧を作れませんでした", e));
		});
	}

	override onunload(): void {
		this.model?.unload();
	}

	/** pkm-ribbon が尋ねるバッジの数（ADR-0070 の 6）。重複を除いたノートの数 */
	getRibbonBadge(command: string): number | null {
		return command === OPEN_COMMAND ? (this.model?.count ?? null) : null;
	}

	/** Viewed の記録に使う端末名。pkm-task の設定、なければ pkm-git の設定から読む */
	private deviceName(): string {
		const plugins = (this.app as unknown as { plugins?: { plugins?: Record<string, { taskSettings?: { deviceName?: unknown }; settings?: { deviceName?: unknown } }> } }).plugins?.plugins;
		for (const name of [plugins?.["pkm-task"]?.taskSettings?.deviceName, plugins?.["pkm-git"]?.settings?.deviceName]) {
			if (typeof name === "string" && name.trim()) return name.trim();
		}
		return "";
	}
}
