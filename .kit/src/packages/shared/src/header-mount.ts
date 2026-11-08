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

/**
 * 差し込むべき sizer のどれかで、先頭にヘッダーがないか。
 * Obsidian が sizer を作り直したり、中身を描き直してヘッダーを外したりしたあと（スクロールなど）に確かめる（#99）
 */
export function headerMissing<E extends ElementLike>(sizers: readonly E[], className: string): boolean {
	return sizers.some((sizer) => sizer.firstElementChild?.className !== className);
}

/** すべての要素に fn を行う。途中で投げても残りを続け、投げたものを返す（1 つのビューの失敗で、ほかのビューのヘッダーを止めない） */
export function eachSafely<T>(items: readonly T[], fn: (item: T) => void): unknown[] {
	const errors: unknown[] = [];
	for (const item of items) {
		try {
			fn(item);
		} catch (e) {
			errors.push(e);
		}
	}
	return errors;
}

/**
 * Markdown のビューのエディタ（CodeMirror 6）に、高さを測り直させる。ヘッダーの resized に渡す。
 * Obsidian の型には cm がないので、あるときだけ呼ぶ（リーディングビューでは何もしない）
 */
export function remeasureEditor(view: { editor?: unknown }): void {
	const cm = (view.editor as { cm?: { requestMeasure?: () => void } } | undefined)?.cm;
	cm?.requestMeasure?.();
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
	/**
	 * ヘッダーの高さが変わった。エディタに測り直させる（CodeMirror は、本文の上の要素の高さの変化を知らない。#99）
	 */
	resized?(view: V): void;
}

/**
 * ノートを開いたときは、今のビューにすぐ差し込む（遅れて出て、ちらつかないように）。
 * 続けて起きるイベントは 100ms まとめて、すべてのビューを描き直す。
 * Obsidian が sizer の中身を描き直してヘッダーが外れたら（リーディングビューなど）、同じ要素を先頭に戻す。
 * sizer そのものが作り直されたときと、スクロールのあとも確かめて、外れていれば差し込み直す（#99）
 */
export function installHeaderMount<V extends { contentEl: HTMLElement }, M>(options: HeaderMountOptions<V, M>): void {
	const { plugin, className } = options;
	const { app } = plugin;
	/** sizer ごとの見張り（直下の子と、親の直下の子） */
	const observers = new Map<HTMLElement, MutationObserver[]>();
	/** ヘッダーごとの高さの見張り */
	const resizers = new Map<HTMLElement, ResizeObserver>();
	/** ビューの contentEl ごとの、スクロールの見張りと、最後に差し込んだか */
	const scrolls = new Map<HTMLElement, { off: () => void; shown: boolean }>();

	const report = (errors: unknown[]): void => {
		for (const e of errors) console.error(`[${plugin.manifest.id}] header`, e);
	};

	const sizersOf = (view: V): HTMLElement[] => Array.from(view.contentEl.querySelectorAll<HTMLElement>(HEADER_SIZERS));

	const watch = (view: V, sizer: HTMLElement, host: HTMLElement): void => {
		unwatch(sizer);
		const keep = new MutationObserver(() => {
			keepFirst(sizer, host);
		});
		keep.observe(sizer, { childList: true });
		const list = [keep];
		// sizer が外されて作り直されたら（親の直下の子が変わったら）、そのビューを差し込み直す
		const parent = sizer.parentElement;
		if (parent) {
			const replaced = new MutationObserver(() => {
				if (!sizer.isConnected) check(view);
			});
			replaced.observe(parent, { childList: true });
			list.push(replaced);
		}
		observers.set(sizer, list);
		if (options.resized && !resizers.has(host) && typeof ResizeObserver !== "undefined") {
			const resized = options.resized;
			const ro = new ResizeObserver(() => {
				try {
					resized(view);
				} catch (e) {
					report([e]);
				}
			});
			ro.observe(host);
			resizers.set(host, ro);
		}
	};
	const unwatch = (sizer: HTMLElement): void => {
		for (const o of observers.get(sizer) ?? []) o.disconnect();
		observers.delete(sizer);
	};
	const unresize = (host: HTMLElement): void => {
		resizers.get(host)?.disconnect();
		resizers.delete(host);
	};

	/** ヘッダーを出したビューで、外れていたら差し込み直す。次のフレームにまとめる */
	let pending = new Set<V>();
	let frame: number | undefined;
	const check = (view: V): void => {
		pending.add(view);
		if (frame !== undefined) return;
		frame = window.requestAnimationFrame(() => {
			frame = undefined;
			const views = Array.from(pending);
			pending = new Set();
			report(
				eachSafely(views, (v) => {
					if (scrolls.get(v.contentEl)?.shown && headerMissing(sizersOf(v), className)) mount(v);
				}),
			);
		});
	};

	const listenScroll = (view: V, shown: boolean): void => {
		const el = view.contentEl;
		const entry = scrolls.get(el);
		if (entry) {
			entry.shown = shown;
			return;
		}
		// scroll は泡立たないので、捕捉で受ける（本文の .cm-scroller とリーディングビューのスクロール）
		const onScroll = () => check(view);
		el.addEventListener("scroll", onScroll, { capture: true, passive: true });
		scrolls.set(el, { off: () => el.removeEventListener("scroll", onScroll, { capture: true }), shown });
	};

	const mount = (view: V): void => {
		const sizers = sizersOf(view);
		const model = options.model(view);
		const { hosts, removed } = placeHeaders(sizers, className, model !== null, () => {
			const el = document.createElement("div");
			el.className = className;
			return el;
		});
		for (const host of removed) {
			unresize(host);
			options.clear(host);
		}
		for (const sizer of sizers) {
			const host = findHost(sizer, className);
			if (host) watch(view, sizer, host);
			else unwatch(sizer);
		}
		listenScroll(view, model !== null);
		if (model !== null) report(eachSafely(hosts, (host) => options.draw(host, model, view)));
	};

	const refresh = (): void => {
		const views = options.views();
		report(eachSafely(views, mount));
		// 閉じたビューの sizer・ヘッダー・スクロールは見張らない
		for (const sizer of Array.from(observers.keys())) if (!sizer.isConnected) unwatch(sizer);
		for (const host of Array.from(resizers.keys())) if (!host.isConnected) unresize(host);
		const open = new Set(views.map((v) => v.contentEl));
		for (const [el, entry] of Array.from(scrolls)) {
			if (open.has(el) && el.isConnected) continue;
			entry.off();
			scrolls.delete(el);
		}
	};

	let timer: number | undefined;
	const schedule = (): void => {
		window.clearTimeout(timer);
		timer = window.setTimeout(refresh, 100);
	};
	const now = (): void => {
		const view = options.activeView();
		if (view) report(eachSafely([view], mount));
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
		if (frame !== undefined) window.cancelAnimationFrame(frame);
		for (const list of observers.values()) for (const o of list) o.disconnect();
		observers.clear();
		for (const ro of resizers.values()) ro.disconnect();
		resizers.clear();
		for (const entry of scrolls.values()) entry.off();
		scrolls.clear();
		const selector = className.split(" ").map((c) => `.${c}`).join("");
		for (const host of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
			options.clear(host);
			host.remove();
		}
	});
}
