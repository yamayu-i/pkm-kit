import { MarkdownView, type Plugin } from "obsidian";
import { h, render } from "preact";
import { installHeaderMount } from "../../../shared/src/header-mount.ts";
import type { TaskContext } from "../obsidian/context";
import { IssueHeader } from "./IssueHeader";
import { MemberHeader } from "./MemberHeader";
import { RoutineHeader } from "./RoutineHeader";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;
const ROUTINE_PATH_RE = /^routine\/[^/]+\.md$/;
const MEMBER_PATH_RE = /^member\/[^/]+\.md$/;

/** 差し込む要素の class。styles.css の `.vt-header` と、Properties 欄を隠す `:has(.vt-header)` が使う */
const HEADER_CLASS = "vt-header vt-ui";

/** 画面のヘッダーを出すノートか（パスで決める） */
export function isTaskNotePath(path: string): boolean {
	return ISSUE_PATH_RE.test(path) || ROUTINE_PATH_RE.test(path) || MEMBER_PATH_RE.test(path);
}

function headerFor(path: string) {
	if (ROUTINE_PATH_RE.test(path)) return RoutineHeader;
	if (MEMBER_PATH_RE.test(path)) return MemberHeader;
	return IssueHeader;
}

/**
 * issue・routine・member の md を開いたとき、ページの一番上に画面のヘッダーを差し込む（ADR-0077。中身は ADR-0012, 0018, 0035）。
 * 編集（ソース / Live Preview）とリーディングの両方に同じヘッダーを出し、どちらでも編集できる。本文はふつうのエディタのまま。
 * Properties 欄は CSS で隠す。Live Preview の生の frontmatter は、Obsidian が Properties 欄として描くので出ない。
 * ソースモードでは frontmatter を見せる（壊れたときに直せるように）
 */
export function installTaskHeaders(ctx: TaskContext, plugin: Plugin): void {
	const { app } = ctx;
	installHeaderMount<MarkdownView, string>({
		plugin,
		className: HEADER_CLASS,
		views: () => {
			const views: MarkdownView[] = [];
			app.workspace.iterateAllLeaves((leaf) => {
				if (leaf.view instanceof MarkdownView) views.push(leaf.view);
			});
			return views;
		},
		activeView: () => app.workspace.getActiveViewOfType(MarkdownView),
		model: (view) => {
			const path = view.file?.path ?? null;
			return path !== null && isTaskNotePath(path) ? path : null;
		},
		// 別のノートに切り替わったら、ヘッダーの状態（開いた入力欄など）を持ち越さない
		draw: (host, path) => render(h(headerFor(path), { key: path, ctx, path }), host),
		clear: (host) => render(null, host),
	});
}
