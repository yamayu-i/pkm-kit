import type { EventRef, Plugin } from "obsidian";

/**
 * ノートの一番上（Obsidian が標準のタイトルと Properties 欄を置く場所）にヘッダーを差し込む（ADR-0026、ADR-0077）。
 * pkm-task（issue / routine / member）と pkm-template（ほかのノート）が同じ規則で差し込むため、ここに 1 つだけ置く。
 * Obsidian の値は import しない（型だけ）。どのビューが Markdown か、何を描くかは呼ぶ側が渡す
 */

/** 編集（ソース / Live Preview）とリーディングの、本文の入れ物 */
export const HEADER_SIZERS = ".cm-sizer, .markdown-preview-sizer";

/** 差し込みの規則に要る要素の操作だけ（テストで DOM の環境を足さないため） */
export interface ElementLike {
	className: string;
	readonly parentElement: ElementLike | null;
	readonly children: ArrayLike<ElementLike>;
	readonly firstElementChild: ElementLike | null;
	prepend(el: never): void;
	remove(): void;
}

function findHost<E extends ElementLike>(sizer: E, className: string): E | null {
	for (const child of Array.from(sizer.children)) if (child.className === className) return child as E;
	return null;
}

/** host を sizer の先頭に置く。動かしたら true */
export function keepFirst<E extends ElementLike>(sizer: E, host: E): boolean {
	if (sizer.firstElementChild === host) return false;
	(sizer.prepend as (el: E) => void)(host);
	return true;
}

/**
 * 各 sizer の直下に、className のヘッダーを先頭に 1 つだけ置く（show が false なら外す）。
 * 描くべき host と、外した host を返す。ほかのプラグインのヘッダーには触れない
 */
export function placeHeaders<E extends ElementLike>(sizers: readonly E[], className: string, show: boolean, create: () => E): { hosts: E[]; removed: E[] } {
	const hosts: E[] = [];
	const removed: E[] = [];
	for (const sizer of sizers) {
		let host = findHost(sizer, className);
		if (!show) {
			if (host) {
				host.remove();
				removed.push(host);
			}
			continue;
		}
		if (!host) host = create();
		keepFirst(sizer, host);
		hosts.push(host);
	}
	return { hosts, removed };
}

export interface HeaderMountOptions<V extends { contentEl: HTMLElement }, M> {
	plugin: Plugin;
	/** 差し込む要素の class（プラグインごとに違うもの） */
	className: string;
	/** 開いている Markdown のビューすべて */
	views(): V[];
	/** 今いる Markdown のビュー */
	activeView(): V | null;
	/** そのビューに出すもの。null なら出さない */
	model(view: V): M | null;
	draw(host: HTMLElement, model: M, view: V): void;
	clear(host: HTMLElement): void;
}

/**
 * ノートを開いたときは、今のビューにすぐ差し込む（遅れて出て、ちらつかないように）。
 * 続けて起きるイベントは 100ms まとめて、すべてのビューを描き直す。
 * Obsidian が sizer の中身を描き直してヘッダーが外れたら（リーディングビューなど）、同じ要素を先頭に戻す
 */
export function installHeaderMount<V extends { contentEl: HTMLElement }, M>(options: HeaderMountOptions<V, M>): void {
	const { plugin, className } = options;
	const { app } = plugin;
	const observers = new Map<HTMLElement, MutationObserver>();

	const watch = (sizer: HTMLElement, host: HTMLElement): void => {
		observers.get(sizer)?.disconnect();
		const observer = new MutationObserver(() => {
			keepFirst(sizer, host);
		});
		observer.observe(sizer, { childList: true });
		observers.set(sizer, observer);
	};
	const unwatch = (sizer: HTMLElement): void => {
		observers.get(sizer)?.disconnect();
		observers.delete(sizer);
	};

	const mount = (view: V): void => {
		const sizers = Array.from(view.contentEl.querySelectorAll<HTMLElement>(HEADER_SIZERS));
		const model = options.model(view);
		const { hosts, removed } = placeHeaders(sizers, className, model !== null, () => {
			const el = document.createElement("div");
			el.className = className;
			return el;
		});
		for (const host of removed) options.clear(host);
		for (const sizer of sizers) {
			const host = findHost(sizer, className);
			if (host) watch(sizer, host);
			else unwatch(sizer);
		}
		if (model !== null) for (const host of hosts) options.draw(host, model, view);
	};

	const refresh = (): void => {
		for (const view of options.views()) mount(view);
		// 閉じたビューの sizer は見張らない
		for (const sizer of Array.from(observers.keys())) if (!sizer.isConnected) unwatch(sizer);
	};

	let timer: number | undefined;
	const schedule = (): void => {
		window.clearTimeout(timer);
		timer = window.setTimeout(refresh, 100);
	};
	const now = (): void => {
		const view = options.activeView();
		if (view) mount(view);
		schedule();
	};

	const on = (ref: EventRef): void => plugin.registerEvent(ref);
	on(app.workspace.on("file-open", now));
	on(app.workspace.on("active-leaf-change", now));
	on(app.workspace.on("layout-change", schedule));
	on(app.metadataCache.on("changed", schedule));
	on(app.metadataCache.on("resolved", schedule));
	app.workspace.onLayoutReady(refresh);

	plugin.register(() => {
		window.clearTimeout(timer);
		for (const observer of observers.values()) observer.disconnect();
		observers.clear();
		const selector = className.split(" ").map((c) => `.${c}`).join("");
		for (const host of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
			options.clear(host);
			host.remove();
		}
	});
}
