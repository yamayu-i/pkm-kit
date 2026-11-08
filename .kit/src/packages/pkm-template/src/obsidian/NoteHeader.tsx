import { Platform, type App } from "obsidian";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import type { HeaderModel, HeaderValue } from "../core/note-header";
import { WEEKDAYS } from "../core/note-title";

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

/** ノートのヘッダー(ADR-0026)。表示のみ。daily は右に日曜始まりの 7 枠を出す */
export function NoteHeader({ app, model }: { app: App; model: HeaderModel }) {
	return (
		<div class="vt-tpl-note-header-body" data-hide-properties={model.hideProperties ? "true" : undefined}>
			<div class="vt-tpl-note-header-top">
				<div class="vt-tpl-note-title">{model.title}</div>
				{model.weekday !== null && (
					<ol class="vt-tpl-week" aria-label="曜日">
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
								{it.values.map((v, i) => (
									<Value key={`${v.text}-${i}`} app={app} v={v} />
								))}
							</dd>
						</div>
					))}
				</dl>
			)}
		</div>
	);
}
