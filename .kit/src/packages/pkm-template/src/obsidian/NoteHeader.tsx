import { Platform, type App } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import { parseEdit, type EditField, type HeaderEdit } from "../core/note-edit";
import type { HeaderModel, HeaderValue } from "../core/note-header";
import { WEEKDAYS } from "../core/note-title";
import { Icon } from "./Icon";

function Value({ app, v }: { app: App; v: HeaderValue }) {
	if (v.path !== undefined) {
		const path = v.path;
		return (
			<button
				type="button"
				class="vt-tpl-link"
				onClick={() => {
					const file = app.vault.getFileByPath(path);
					if (file) void openInNotePane(app.workspace, file, { newTab: false, phone: Platform.isPhone });
				}}
			>
				{v.text}
			</button>
		);
	}
	if (v.url !== undefined) {
		return (
			<a class="vt-tpl-link" href={v.url} rel="noopener noreferrer">
				{v.text}
			</a>
		);
	}
	return <span class="vt-tpl-value">{v.text}</span>;
}

const EDIT_LABEL: Record<EditField, string> = {
	title: "Edit title",
	tags: "Edit tags",
	origin: "Edit origin",
	retrieved: "Edit retrieved date",
	sources: "Edit sources",
};

const PLACEHOLDER: Partial<Record<EditField, string>> = {
	tags: "tag1, tag2",
	origin: "https://…",
	retrieved: "YYYY-MM-DD",
	sources: "One per line: sources/… or https://…",
};

/** 表示の横に置く編集アイコンボタン(ADR-0238) */
function EditButton({ field, onClick }: { field: EditField; onClick: () => void }) {
	return (
		<button type="button" class="vt-tpl-icon-button vt-tpl-edit-button" aria-label={EDIT_LABEL[field]} title={EDIT_LABEL[field]} onClick={onClick}>
			<Icon name="pencil" />
		</button>
	);
}

/**
 * その場の入力欄。Enter(sources は Ctrl/Cmd+Enter)か欄を離れたときに保存し、Escape は保存せずに戻る。
 * 保存できなければ欄を残して説明を出す
 */
function EditInput(props: { edit: HeaderEdit; save: (field: EditField, value: string | string[]) => Promise<void>; close: () => void }) {
	const { edit, save, close } = props;
	const [draft, setDraft] = useState(edit.initial);
	const [error, setError] = useState<string | null>(null);
	const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	// Escape と Enter で閉じた後の blur で、もう一度保存しない
	const done = useRef(false);
	useEffect(() => {
		ref.current?.focus();
		ref.current?.select();
	}, []);
	const commit = () => {
		if (done.current) return;
		if (draft === edit.initial) {
			done.current = true;
			close();
			return;
		}
		const r = parseEdit(edit.field, draft);
		if (!r.ok) {
			setError(r.error);
			return;
		}
		done.current = true;
		save(edit.field, r.value).then(close, (e: unknown) => {
			done.current = false;
			setError(`保存できませんでした: ${e instanceof Error ? e.message : String(e)}`);
		});
	};
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.isComposing) return;
		if (e.key === "Escape") {
			e.preventDefault();
			done.current = true;
			close();
		} else if (e.key === "Enter" && (!edit.multiline || e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			commit();
		}
	};
	const common = {
		ref,
		class: `vt-tpl-edit-input${edit.field === "title" ? " is-title" : ""}`,
		value: draft,
		placeholder: PLACEHOLDER[edit.field],
		"aria-label": EDIT_LABEL[edit.field],
		"aria-invalid": error !== null,
		onInput: (e: Event) => {
			setDraft((e.currentTarget as HTMLInputElement).value);
			setError(null);
		},
		onBlur: commit,
		onKeyDown,
	};
	return (
		<span class="vt-tpl-edit">
			{edit.multiline ? <textarea rows={Math.max(2, draft.split("\n").length)} {...common} /> : <input type="text" {...common} />}
			{error !== null && <span class="vt-tpl-edit-error">{error}</span>}
		</span>
	);
}

/** ノートのヘッダー(ADR-0026)。note・source・wiki のページは、表示している項目をその場で直せる(ADR-0238)。daily は右に日曜始まりの 7 枠を出す */
export function NoteHeader({ app, model, path }: { app: App; model: HeaderModel; path: string | null }) {
	// 同時に直すのは 1 項目だけ
	const [editing, setEditing] = useState<EditField | null>(null);
	const save = async (field: EditField, value: string | string[]) => {
		const file = path === null ? null : app.vault.getFileByPath(path);
		if (!file) throw new Error("ノートが見つかりません");
		await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			fm[field] = value;
		});
	};
	const close = () => setEditing(null);
	const titleEdit = model.titleEdit;
	return (
		<div class="vt-tpl-note-header-body" data-hide-properties={model.hideProperties ? "true" : undefined}>
			<div class="vt-tpl-note-header-top">
				{titleEdit && editing === "title" ? (
					<EditInput edit={titleEdit} save={save} close={close} />
				) : (
					<div class="vt-tpl-note-title-row">
						<div class="vt-tpl-note-title">{model.title}</div>
						{titleEdit && <EditButton field="title" onClick={() => setEditing("title")} />}
					</div>
				)}
				{model.weekday !== null && (
					<ol class="vt-tpl-week" aria-label="Weekdays">
						{WEEKDAYS.map((w, i) => (
							<li key={w} class={i === model.weekday ? "vt-tpl-week-day is-current" : "vt-tpl-week-day"} aria-current={i === model.weekday ? "date" : undefined}>
								{w}
							</li>
						))}
					</ol>
				)}
			</div>
			{model.items.length > 0 && (
				<dl class="vt-tpl-meta">
					{model.items.map((it) => (
						<div key={it.label} class="vt-tpl-meta-row">
							<dt>{it.label}</dt>
							<dd>
								{it.edit && editing === it.edit.field ? (
									<EditInput edit={it.edit} save={save} close={close} />
								) : (
									<>
										{it.values.length === 0 ? <span class="vt-tpl-value is-empty">Not set</span> : it.values.map((v, i) => <Value key={`${v.text}-${i}`} app={app} v={v} />)}
										{it.edit && <EditButton field={it.edit.field} onClick={() => setEditing(it.edit!.field)} />}
									</>
								)}
							</dd>
						</div>
					))}
				</dl>
			)}
		</div>
	);
}
