import { Keymap, Notice, Platform, type App } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import { formatDateTime } from "../core/format";
import { PAGE_SIZE, totalRows, visibleSections } from "../core/paging";
import type { UpdatesModel } from "../obsidian/model";

export interface UpdatesProps {
	app: App;
	model: UpdatesModel;
	/** Viewed の記録に使う端末名。なければ空 */
	deviceName: () => string;
}

/** Obsidian の公開の型にはないが、コマンドの実行に使う（ない ID なら false を返す） */
interface Commands {
	executeCommandById(id: string): boolean;
}

function useModelVersion(model: UpdatesModel): number {
	const [version, setVersion] = useState(model.version);
	useEffect(() => model.subscribe(() => setVersion(model.version)), [model]);
	return version;
}

/** PKM Updates（ADR-0070）: 一覧ごとのセクションに、前回の確認より後に変わったノートを出す */
export function UpdatesView({ app, model, deviceName }: UpdatesProps) {
	useModelVersion(model);
	const [limit, setLimit] = useState(PAGE_SIZE);
	const [saving, setSaving] = useState(false);
	const sentinel = useRef<HTMLDivElement>(null);
	const total = totalRows(model.sections);
	const shown = visibleSections(model.sections, limit);
	const more = limit < total;

	// 最後の行が見えたら、次の 50 行を足す
	useEffect(() => {
		const el = sentinel.current;
		if (!el || !more) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + PAGE_SIZE);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [more, limit]);

	const openList = (title: string, command: string) => {
		const commands = (app as unknown as { commands: Commands }).commands;
		if (!commands.executeCommandById(command)) new Notice(`${title} を開けません: ${command.split(":")[0]} が有効になっていません`);
	};
	const openNote = (path: string, newTab: boolean) => {
		const file = app.vault.getFileByPath(path);
		if (file) void openInNotePane(app.workspace, file, { newTab, phone: Platform.isPhone });
	};
	const device = deviceName();
	const viewed = async () => {
		setSaving(true);
		try {
			await model.markViewed(device);
			setLimit(PAGE_SIZE);
		} catch (e) {
			console.error("pkm-updates: Viewed を記録できませんでした", e);
			new Notice(`Viewed を記録できませんでした${e instanceof Error ? `: ${e.message}` : ""}`);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div class="vt-upd-page">
			<p class="vt-upd-since">{model.since === null ? "Not viewed yet. Showing all notes" : `Last viewed: ${formatDateTime(model.since)}`}</p>
			{shown.length === 0 ? (
				<div class="vt-upd-empty">No notes changed since you last viewed</div>
			) : (
				shown.map((s) => (
					<section key={s.id} class="vt-upd-section" aria-labelledby={`vt-upd-${s.id}`}>
						<h2 class="vt-upd-heading" id={`vt-upd-${s.id}`}>
							<button type="button" class="vt-upd-heading-link" onClick={() => openList(s.title, s.command)}>
								{s.title}
							</button>
							<span class="vt-upd-count">{model.sections.find((x) => x.id === s.id)?.items.length ?? s.items.length}</span>
						</h2>
						<ul class="vt-upd-list">
							{s.items.map((item) => (
								<li key={item.path}>
									<button type="button" class="vt-upd-row" onClick={(e) => openNote(item.path, Keymap.isModEvent(e) !== false)}>
										<span class="vt-upd-title">{item.title}</span>
										<span class="vt-upd-time">{formatDateTime(item.updatedMs)}</span>
									</button>
								</li>
							))}
						</ul>
					</section>
				))
			)}
			{more && <div ref={sentinel} class="vt-upd-sentinel" aria-hidden="true" />}
			<div class="vt-upd-footer">
				{!device && <span class="vt-upd-note">Set a device name in pkm-task or pkm-git settings to record Viewed</span>}
				<button type="button" class="vt-upd-viewed" disabled={!device || saving} onClick={() => void viewed()}>
					Viewed
				</button>
			</div>
		</div>
	);
}
