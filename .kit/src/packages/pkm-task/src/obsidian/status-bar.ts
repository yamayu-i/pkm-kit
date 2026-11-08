import { setTooltip } from "obsidian";
import { runningStatus } from "../core/running";
import type { TaskStore } from "./store";

/** 記録中のタイマーの更新間隔（サイドバーと同じ） */
const REFRESH_MS = 30_000;

export interface RunningStatusBarHost {
	addStatusBarItem(): HTMLElement;
	register(cb: () => unknown): void;
	registerInterval(id: number): number;
}

/**
 * 記録中のタイマーを PC のステータスバーに出す（ADR-0075）。状態を見せるだけで、警告も停止もしない。
 * 押すと、1 つならそのノート、2 つ以上（か索引にないタスク）なら Tasks サイドバーを開く。スマホ版にはステータスバーがない
 */
export function registerRunningStatusBar(host: RunningStatusBarHost, store: TaskStore, open: { path(path: string): void; sidebar(): void }): void {
	const el = host.addStatusBarItem();
	el.addClass("mod-clickable", "pkm-task-running-status");
	let path: string | null = null;
	const render = () => {
		const s = runningStatus(store.index, Date.now());
		path = s?.path ?? null;
		el.toggle(s !== null);
		el.setText(s?.text ?? "");
		setTooltip(el, s?.tooltip ?? "", { placement: "top" });
	};
	el.addEventListener("click", () => (path ? open.path(path) : open.sidebar()));
	host.register(store.subscribe(render));
	host.registerInterval(window.setInterval(render, REFRESH_MS));
	render();
}
