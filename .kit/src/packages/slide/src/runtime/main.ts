/**
 * index.html に入れる共通のスクリプト（ADR-0117）。一覧、Slide Show、PDF（印刷）、レビュー、発表者ビュー。
 * 外部に通信しない。ブラウザに保存するのは、レビューのコメントと表示の設定だけ（localStorage）。
 * 画面に常に出る短い文言は英語、読ませる文は日本語（design.md「文言の言語」）
 */
import { buildReport, hashText, type Comment } from "./report.ts";

const root = document.documentElement;
const deckPath = root.dataset.deck ?? "";
const build = root.dataset.build ?? "";
const cells = [...document.querySelectorAll<HTMLElement>(".sl-cell")];
const total = cells.length;
const presenter = location.hash === "#presenter";

// ---- 保存（使えない環境では、その場かぎりで動く）
const KEY = `pkm-slide:${deckPath}`;
function load<T>(name: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(`${KEY}:${name}`);
		return raw === null ? fallback : (JSON.parse(raw) as T);
	} catch {
		return fallback;
	}
}
function save(name: string, value: unknown): void {
	try {
		localStorage.setItem(`${KEY}:${name}`, JSON.stringify(value));
	} catch {
		// 保存できなくても動かす
	}
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	if (className !== "") el.className = className;
	if (text !== "") el.textContent = text;
	return el;
}
function button(label: string, title: string, onClick: () => void, className = ""): HTMLButtonElement {
	const b = h("button", `sl-btn ${className}`.trim(), label);
	b.type = "button";
	b.title = title;
	b.addEventListener("click", (e) => {
		e.stopPropagation();
		onClick();
	});
	return b;
}
let toastTimer = 0;
function toast(message: string): void {
	document.querySelector(".sl-toast")?.remove();
	const t = h("div", "sl-toast", message);
	t.setAttribute("role", "status");
	document.body.append(t);
	clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => t.remove(), 4000);
}

// ---- 位置（スライドとステップ）
let index = 0;
let step = 0;
let showing = false;
function stepsOf(i: number): number {
	let max = 0;
	for (const el of cells[i]?.querySelectorAll<HTMLElement>("[data-step]") ?? []) max = Math.max(max, Number(el.dataset.step) || 0);
	return max;
}
function render(): void {
	cells.forEach((cell, i) => {
		cell.classList.toggle("sl-current", i === index);
		cell.classList.toggle("sl-next", presenter && i === index + 1);
		for (const el of cell.querySelectorAll<HTMLElement>("[data-step]")) {
			// 発表者ビューの「次」と、過ぎたスライドはすべて出す
			el.classList.toggle("sl-on", i < index || i > index || (Number(el.dataset.step) || 0) <= step);
		}
	});
	const bar = document.querySelector<HTMLElement>(".sl-progress");
	if (bar) bar.style.width = `${((index + 1) / total) * 100}%`;
	const pos = document.querySelector(".sl-pos");
	if (pos) pos.textContent = `${index + 1} / ${total}`;
	if (showing) history.replaceState(null, "", `#/${index + 1}`);
}
function go(i: number, s = 0, broadcast = true): void {
	index = Math.max(0, Math.min(total - 1, i));
	step = Math.max(0, Math.min(stepsOf(index), s));
	render();
	if (broadcast) send({ type: "go", index, step });
}
function next(): void {
	if (step < stepsOf(index)) go(index, step + 1);
	else if (index < total - 1) go(index + 1, 0);
}
function prev(): void {
	if (step > 0) go(index, step - 1);
	else if (index > 0) go(index - 1, stepsOf(index - 1));
}

// ---- 発表者ビューとの同期（file:// でも動くように、開いたウィンドウどうしで postMessage する）
let peer: Window | null = presenter ? window.opener : null;
function send(message: Record<string, unknown>): void {
	try {
		if (peer && !peer.closed) peer.postMessage({ pkmSlide: build, ...message }, "*");
	} catch {
		// 相手がいなければ何もしない
	}
}
window.addEventListener("message", (e) => {
	const data = e.data as { pkmSlide?: string; type?: string; index?: number; step?: number } | null;
	if (!data || data.pkmSlide !== build) return;
	if (data.type === "go") go(data.index ?? 0, data.step ?? 0, false);
	if (data.type === "hello") {
		peer = e.source as Window;
		send({ type: "go", index, step });
	}
});
function openPresenter(): void {
	peer = window.open(`${location.href.split("#")[0]}#presenter`, "pkm-slide-presenter", "width=1100,height=760");
	if (!peer) toast("発表者ビューを開けませんでした。ポップアップを許可してください");
}

// ---- Slide Show
let idleTimer = 0;
function startShow(from: number): void {
	showing = true;
	root.classList.add("sl-show");
	go(from, 0);
	root.requestFullscreen?.().catch(() => {
		// 最大化できない環境（埋め込みなど）では、ウィンドウの中で見せる
	});
}
function endShow(): void {
	if (!showing) return;
	showing = false;
	root.classList.remove("sl-show", "sl-idle");
	history.replaceState(null, "", location.pathname + location.search);
	if (document.fullscreenElement) void document.exitFullscreen();
	cells[index]?.scrollIntoView({ block: "center" });
	for (const el of document.querySelectorAll(".sl-on")) el.classList.remove("sl-on");
}
document.addEventListener("fullscreenchange", () => {
	// Esc で最大化が解けたら、一覧に戻る
	if (!document.fullscreenElement && showing) endShow();
});
document.addEventListener("mousemove", () => {
	if (!showing) return;
	root.classList.remove("sl-idle");
	clearTimeout(idleTimer);
	idleTimer = window.setTimeout(() => root.classList.add("sl-idle"), 2500);
});

document.addEventListener("keydown", (e) => {
	const target = e.target as HTMLElement;
	if (target.closest("textarea, input")) return;
	if (e.metaKey || e.ctrlKey || e.altKey) return;
	if (showing || presenter) {
		const keys: Record<string, () => void> = {
			ArrowRight: next,
			ArrowDown: next,
			PageDown: next,
			" ": next,
			Enter: next,
			ArrowLeft: prev,
			ArrowUp: prev,
			PageUp: prev,
			Backspace: prev,
			Home: () => go(0),
			End: () => go(total - 1, stepsOf(total - 1)),
		};
		const action = keys[e.key];
		if (action) {
			e.preventDefault();
			action();
			return;
		}
		if (showing && e.key === "Escape") endShow();
		if (showing && e.key.toLowerCase() === "f") {
			if (document.fullscreenElement) void document.exitFullscreen();
			else void root.requestFullscreen?.();
		}
		if (showing && e.key.toLowerCase() === "p") openPresenter();
		return;
	}
	if (e.key === "Escape" && reviewing) closeEditor();
	else if (e.key.toLowerCase() === "s") startShow(0);
	else if (e.key.toLowerCase() === "r") setReview(!reviewing);
});

// スワイプ（スマホ・タブレット）
let touchX = 0;
document.addEventListener("touchstart", (e) => (touchX = e.changedTouches[0]?.clientX ?? 0), { passive: true });
document.addEventListener(
	"touchend",
	(e) => {
		if (!showing) return;
		const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX;
		if (dx < -40) next();
		else if (dx > 40) prev();
	},
	{ passive: true },
);

// ---- PDF（ブラウザの印刷。「PDF に保存」で、文字がテキストのまま入る）
function printPdf(): void {
	toast("印刷の画面で「PDF に保存」を選んでください（用紙はスライドの大きさ、余白なしに設定済み）");
	window.setTimeout(() => window.print(), 300);
}

// ---- レビュー
let reviewing = false;
let comments: Comment[] = load<Comment[]>("comments", []);
let editor: HTMLElement | null = null;
/** 選べる部品。押した場所から最も近いものを選ぶ */
const COMPONENTS = "h1, h2, h3, p, li, figure, img, svg, table, tr, blockquote, pre, dl, .card, .big, .chip, .callout, .cols, .matrix";

function slideOf(cell: HTMLElement): HTMLElement {
	return cell.querySelector<HTMLElement>(".slide") as HTMLElement;
}
function pathOf(slide: HTMLElement, el: Element): number[] {
	const path: number[] = [];
	for (let cur: Element = el; cur !== slide; cur = cur.parentElement as Element) {
		path.unshift([...(cur.parentElement as Element).children].indexOf(cur));
	}
	return path;
}
function resolve(c: Comment): HTMLElement | null {
	const cell = cells[c.n - 1];
	if (!cell) return null;
	let el: Element | undefined = slideOf(cell);
	for (const i of c.path ?? []) el = el?.children[i];
	return (el as HTMLElement | undefined) ?? null;
}
function kindOf(el: Element): string {
	if (el.classList.contains("slide")) return "slide";
	const cls = [...el.classList].filter((c) => !c.startsWith("sl-"))[0];
	return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
}
function excerptOf(el: Element): string {
	const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
	if (text !== "") return text.length > 60 ? `${text.slice(0, 60)}…` : text;
	return el.getAttribute("alt") ?? el.getAttribute("src") ?? "";
}
function contentHash(el: Element): string {
	return hashText(el.outerHTML.replace(/ data-l="\d+"/g, "").replace(/ class="[^"]*"/g, ""));
}
/** コメントを付けた後に、その部品かスライドが変わったか */
function stateOf(c: Comment): "" | "Updated" | "Not found" {
	if (c.n === 0) return "";
	const el = resolve(c);
	if (!el) return "Not found";
	return contentHash(el) === c.hash ? "" : "Updated";
}

function closeEditor(): void {
	editor?.remove();
	editor = null;
	for (const el of document.querySelectorAll(".sl-hover")) el.classList.remove("sl-hover");
}
function openEditor(target: HTMLElement | null, n: number, existing?: Comment): void {
	closeEditor();
	target?.classList.add("sl-hover");
	const box = h("div", "sl-editor");
	box.setAttribute("role", "dialog");
	box.setAttribute("aria-label", "Review comment");
	const where = n === 0 ? "Whole deck" : `Slide ${n} · ${target ? kindOf(target) : "slide"}`;
	box.append(h("p", "sl-target", `${where}${target && n !== 0 ? ` — ${excerptOf(target)}` : ""}`));
	const input = h("textarea", "sl-note-input");
	input.placeholder = "What should change?";
	input.setAttribute("aria-label", "Comment");
	input.value = existing?.text ?? "";
	const row = h("div", "sl-row");
	const commit = () => {
		const text = input.value.trim();
		if (text === "") return closeEditor();
		if (existing) existing.text = text;
		else {
			const slide = n === 0 ? null : slideOf(cells[n - 1] as HTMLElement);
			const el = target ?? slide;
			comments.push({
				id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
				n,
				title: n === 0 ? "" : (cells[n - 1]?.dataset.title ?? ""),
				path: slide && target && target !== slide ? pathOf(slide, target) : null,
				kind: el ? kindOf(el) : "deck",
				line: Number(el?.getAttribute("data-l") ?? 0) || 0,
				excerpt: el && el !== slide ? excerptOf(el) : "",
				hash: el ? contentHash(el) : "",
				text,
			});
		}
		save("comments", comments);
		closeEditor();
		renderReview();
	};
	row.append(button("Cancel", "Esc", closeEditor, "text"), button(existing ? "Update" : "Add", "Ctrl+Enter", commit, "filled"));
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit();
		if (e.key === "Escape") closeEditor();
		e.stopPropagation();
	});
	box.append(input, row);
	box.addEventListener("click", (e) => e.stopPropagation());
	document.body.append(box);
	// 部品の近く（下、入らなければ上）に置く
	const r = (target ?? document.querySelector(".sl-panel") ?? document.body).getBoundingClientRect();
	const top = r.bottom + 8 + box.offsetHeight > window.innerHeight ? Math.max(8, r.top - box.offsetHeight - 8) : r.bottom + 8;
	box.style.top = `${top}px`;
	box.style.left = `${Math.max(8, Math.min(window.innerWidth - box.offsetWidth - 8, r.left))}px`;
	editor = box;
	input.focus();
}

async function copyReport(): Promise<void> {
	if (comments.length === 0) return toast("コメントがありません。スライドの部品を選んでコメントを書いてください");
	const text = buildReport(deckPath, build, comments.map((c) => ({ ...c, state: stateOf(c) })));
	let ok = false;
	try {
		await navigator.clipboard.writeText(text);
		ok = true;
	} catch {
		const area = h("textarea");
		area.value = text;
		document.body.append(area);
		area.select();
		try {
			ok = document.execCommand("copy");
		} catch {
			ok = false;
		}
		area.remove();
	}
	if (ok) return toast(`レビュー（${comments.length} 件）をコピーしました。Claude Code に貼り付けてください`);
	// コピーできない環境では、自分で選んでコピーできるように出す
	closeEditor();
	const box = h("div", "sl-editor");
	box.append(h("p", "sl-target", "コピーできませんでした。下を選んでコピーしてください"));
	const area = h("textarea", "sl-note-input sl-report");
	area.value = text;
	area.readOnly = true;
	const row = h("div", "sl-row");
	row.append(button("Close", "", closeEditor, "text"));
	box.append(area, row);
	document.body.append(box);
	box.style.top = "80px";
	box.style.right = "24px";
	editor = box;
	area.select();
}

function renderReview(): void {
	for (const el of document.querySelectorAll(".sl-pin")) el.remove();
	for (const el of document.querySelectorAll(".sl-commented")) el.classList.remove("sl-commented");
	const list = document.querySelector(".sl-comments");
	const count = document.querySelector(".sl-count");
	if (count) count.textContent = comments.length === 0 ? "" : ` (${comments.length})`;
	if (!list) return;
	list.replaceChildren();
	const ordered = [...comments].sort((a, b) => a.n - b.n);
	ordered.forEach((c, i) => {
		const state = stateOf(c);
		const el = c.n === 0 ? null : resolve(c);
		if (el && reviewing) {
			if (c.path !== null) el.classList.add("sl-commented");
			const frame = el.closest<HTMLElement>(".sl-frame");
			if (frame) {
				const fr = frame.getBoundingClientRect();
				const r = el.getBoundingClientRect();
				const pin = h("span", "sl-pin", String(i + 1));
				pin.style.left = `${((r.left - fr.left) / fr.width) * 100}%`;
				pin.style.top = `${((r.top - fr.top) / fr.height) * 100}%`;
				frame.append(pin);
			}
		}
		const item = h("li", "sl-comment");
		const where = h("div", "sl-where");
		where.append(h("span", "sl-num", String(i + 1)), h("span", "", c.n === 0 ? "Whole deck" : `Slide ${c.n} · ${c.kind}`));
		if (state !== "") {
			const tag = h("span", "sl-tag", state);
			tag.title = state === "Updated" ? "コメントの後に、この部品が変わりました" : "コメントを付けた部品が見つかりません";
			where.append(tag);
		}
		item.append(where);
		if (c.excerpt !== "") item.append(h("p", "sl-excerpt", c.excerpt));
		item.append(h("p", "sl-text", c.text));
		const row = h("div", "sl-row");
		row.append(
			button("Edit", "Edit this comment", () => openEditor(el, c.n, c), "text"),
			button("Done", "Remove this comment", () => {
				comments = comments.filter((x) => x.id !== c.id);
				save("comments", comments);
				renderReview();
			}, "text"),
		);
		item.append(row);
		item.addEventListener("click", () => (el ?? cells[c.n - 1])?.scrollIntoView({ block: "center", behavior: "smooth" }));
		list.append(item);
	});
}
function setReview(on: boolean): void {
	reviewing = on;
	root.classList.toggle("sl-review", on);
	document.querySelector(".sl-review-btn")?.setAttribute("aria-pressed", String(on));
	try {
		sessionStorage.setItem(`${KEY}:review`, on ? "1" : "");
	} catch {
		// 覚えられなくても動かす
	}
	closeEditor();
	renderReview();
}

// ---- 前回から変わったスライド
function showUpdated(): void {
	const seen = load<{ build: string; hashes: string[] } | null>("seen", null);
	const hashes = cells.map((c) => c.dataset.h ?? "");
	const markSeen = () => save("seen", { build, hashes });
	if (seen === null) return markSeen();
	if (seen.build === build) return;
	const old = new Set(seen.hashes);
	const changed = cells.filter((c) => !old.has(c.dataset.h ?? ""));
	if (changed.length === 0) return markSeen();
	for (const cell of changed) cell.querySelector(".sl-caption")?.insertBefore(h("span", "sl-badge", "Updated"), cell.querySelector(".sl-pattern"));
	const note = h("div", "sl-updated");
	note.setAttribute("role", "status");
	note.append(
		h("p", "", `前回見たときから ${changed.length} 枚が変わりました（スライド ${changed.map((c) => c.dataset.n).join("、")}）`),
		button("Show first", "Scroll to the first updated slide", () => changed[0]?.scrollIntoView({ block: "center", behavior: "smooth" }), "text"),
		button("Mark as seen", "Hide the Updated badges", () => {
			markSeen();
			note.remove();
			for (const b of document.querySelectorAll(".sl-badge")) b.remove();
		}),
	);
	document.querySelector(".sl-layout")?.before(note);
}

// ---- 画面を組み立てる
function setTheme(theme: string): void {
	root.dataset.theme = theme;
	save("theme", theme);
}

function init(): void {
	root.classList.add("sl-js");
	const savedTheme = load<string | null>("theme", null);
	if (savedTheme === "light" || savedTheme === "dark") root.dataset.theme = savedTheme;

	if (presenter) {
		root.classList.add("sl-presenter");
		document.title = `Presenter — ${document.title}`;
		const clock = h("div", "sl-clock");
		const elapsed = h("span", "sl-elapsed", "00:00");
		const now = h("span", "sl-now");
		let started = Date.now();
		const tick = () => {
			const s = Math.floor((Date.now() - started) / 1000);
			elapsed.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
			now.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		};
		clock.append(elapsed, button("Reset", "Reset the timer", () => {
			started = Date.now();
			tick();
		}, "text"), now, h("span", "sl-pos"));
		document.querySelector(".sl-deck")?.append(clock);
		setInterval(tick, 1000);
		tick();
		go(0, 0, false);
		send({ type: "hello" });
		return;
	}

	const actions = h("div", "sl-actions");
	const reviewBtn = button("Review", "Select a part of a slide and leave a comment for the AI (R)", () => setReview(!reviewing), "sl-review-btn");
	reviewBtn.setAttribute("aria-pressed", "false");
	reviewBtn.append(h("span", "sl-count"));
	const notesBtn = button("Notes", "Show speaker notes under each slide", () => {
		const on = root.classList.toggle("sl-with-notes");
		notesBtn.setAttribute("aria-pressed", String(on));
	});
	notesBtn.setAttribute("aria-pressed", "false");
	if (!document.querySelector(".sl-notes")) notesBtn.hidden = true;
	actions.append(
		button("Slide Show", "Start the slide show in full screen (S). Arrow keys to move, Esc to exit", () => startShow(0), "filled"),
		button("Download as PDF", "Open the print dialog; choose “Save as PDF”", printPdf),
		reviewBtn,
		button("Presenter", "Open the presenter view (next slide, notes, timer) in another window", openPresenter),
		notesBtn,
		button("Theme", "Switch between light and dark", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"), "text"),
	);
	document.querySelector(".sl-bar")?.append(actions);

	const panel = h("aside", "sl-panel");
	panel.setAttribute("aria-label", "Review comments");
	const panelActions = h("div", "sl-panel-actions");
	panelActions.append(
		button("Copy review", "Copy all comments as a report for the AI", () => void copyReport(), "filled"),
		button("Whole deck", "Comment on the deck as a whole", () => openEditor(null, 0)),
		button("Clear", "Remove all comments", () => {
			if (comments.length === 0 || !confirm(`コメント ${comments.length} 件をすべて消しますか？`)) return;
			comments = [];
			save("comments", comments);
			renderReview();
		}, "text"),
	);
	panel.append(
		h("h2", "", "Review"),
		h("p", "sl-help", "スライドの部品（見出し・カード・図・項目など）を押してコメントを書きます。書き終えたら「Copy review」でコピーし、Claude Code に貼り付けてください。直ったコメントは「Done」で消します。"),
		panelActions,
		h("ul", "sl-comments"),
	);
	document.querySelector(".sl-layout")?.append(panel);
	document.body.append(h("div", "sl-progress"));

	cells.forEach((cell, i) => {
		const frame = cell.querySelector<HTMLElement>(".sl-frame") as HTMLElement;
		frame.tabIndex = 0;
		frame.setAttribute("role", "button");
		frame.setAttribute("aria-label", `Slide ${i + 1}: ${cell.dataset.title ?? ""}`);
		frame.addEventListener("click", (e) => {
			if (showing) {
				// 右の 2/3 で次、左の 1/3 で前
				if ((e.target as HTMLElement).closest("a")) return;
				if (e.clientX < window.innerWidth / 3) prev();
				else next();
				return;
			}
			if (reviewing) {
				e.preventDefault();
				const slide = slideOf(cell);
				const hit = (e.target as HTMLElement).closest<HTMLElement>(COMPONENTS);
				openEditor(hit && slide.contains(hit) ? hit : slide, i + 1);
				return;
			}
			if (!(e.target as HTMLElement).closest("a")) startShow(i);
		});
		frame.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && !showing && !reviewing) {
				e.stopPropagation();
				startShow(i);
			}
		});
		frame.addEventListener("mouseover", (e) => {
			if (!reviewing || editor) return;
			for (const el of document.querySelectorAll(".sl-hover")) el.classList.remove("sl-hover");
			const hit = (e.target as HTMLElement).closest<HTMLElement>(COMPONENTS);
			(hit && slideOf(cell).contains(hit) ? hit : slideOf(cell)).classList.add("sl-hover");
		});
		frame.addEventListener("mouseleave", () => {
			if (!editor) for (const el of document.querySelectorAll(".sl-hover")) el.classList.remove("sl-hover");
		});
	});
	window.addEventListener("resize", () => reviewing && renderReview());

	showUpdated();
	let restoreReview = false;
	try {
		restoreReview = sessionStorage.getItem(`${KEY}:review`) === "1";
	} catch {
		restoreReview = false;
	}
	// 直してもらった後の再読み込みで、レビューの画面に戻る
	if (restoreReview) setReview(true);
	else renderReview();

	// #/3 で開いたら、そのスライドから始める（最大化はブラウザが許さないので、ウィンドウの中で見せる）
	const m = /^#\/(\d+)$/.exec(location.hash);
	if (m) {
		showing = true;
		root.classList.add("sl-show");
		go(Number(m[1]) - 1, 0);
	}
}

init();
