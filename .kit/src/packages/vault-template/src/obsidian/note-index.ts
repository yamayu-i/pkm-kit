import type { App, EventRef, TFile } from "obsidian";
import { useEffect, useState } from "preact/hooks";
import type { NoteInfo } from "../core/note-list";

/** Vault の Markdown を、frontmatter 付きの一覧にする。frontmatter は metadataCache から読む */
export function collectNotes(app: App): NoteInfo[] {
	return app.vault.getMarkdownFiles().map((file) => noteInfo(app, file));
}

export function noteInfo(app: App, file: TFile): NoteInfo {
	const fm = app.metadataCache.getFileCache(file)?.frontmatter;
	return { path: file.path, basename: file.basename, frontmatter: fm ? { ...fm } : {} };
}

/** このノートを指しているノートの数(自分自身は数えない) */
export function backlinkCount(app: App, path: string): number {
	let count = 0;
	for (const [from, targets] of Object.entries(app.metadataCache.resolvedLinks)) {
		if (from !== path && (targets[path] ?? 0) > 0) count++;
	}
	return count;
}

/** metadataCache と vault の変更を購読して、変わるたびに再描画させる。連続した変更は 1 回にまとめる */
export function useVaultChanges(app: App): number {
	const [tick, setTick] = useState(0);
	useEffect(() => {
		let timer: number | undefined;
		const bump = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(() => setTick((n) => n + 1), 150);
		};
		const metaRefs: EventRef[] = [app.metadataCache.on("resolved", bump), app.metadataCache.on("changed", bump)];
		const vaultRefs: EventRef[] = [app.vault.on("create", bump), app.vault.on("delete", bump), app.vault.on("rename", bump)];
		return () => {
			window.clearTimeout(timer);
			for (const ref of metaRefs) app.metadataCache.offref(ref);
			for (const ref of vaultRefs) app.vault.offref(ref);
		};
	}, [app]);
	return tick;
}
