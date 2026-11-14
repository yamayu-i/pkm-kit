/**
 * 発表者ノートの編集の画面の中身（ADR-0132）。スライドごとに番号・見出し・ノートの入力欄を並べる。
 * ノートは素の文字で書く（空行で段落、`- ` で箇条書き、`1. ` で番号付き、スペース 2 つで 1 段下げる）。
 * 保存すると、変えたスライドのノートだけを deck.html に書き、プラグインの中でビルドし直して index.html も書く
 */
import { TFile, type App } from "obsidian";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { Problem } from "../../../slide/src/core/build.ts";
import { SOURCE_FILE, type SlideNote } from "../core/rebuild.ts";
import { loadDeck, saveNotes } from "../obsidian/notes-io.ts";

export interface NotesController {
	isDirty: () => boolean;
	save: () => Promise<void>;
}

export interface NotesViewProps {
	app: App;
	deckPath: string;
	register: (controller: NotesController | null) => void;
}

type Loaded = { kind: "loading" } | { kind: "missing" } | { kind: "error"; message: string } | { kind: "ready"; source: string; title: string; slides: SlideNote[] };
type Status = { kind: "none" } | { kind: "saved"; warnings: Problem[] } | { kind: "failed"; message: string; problems: Problem[] } | { kind: "changed" };

const HELP = "Blank line: new paragraph · “- ”: bullet · “1. ”: numbered · 2 spaces: indent";

/** 行の数に合わせて入力欄の高さを決める（最低 3 行） */
const rowsOf = (text: string) => Math.max(3, text.split("\n").length + 1);

function problemLine(p: Problem): string {
	const where = [p.slide > 0 ? `Slide ${p.slide}` : "", p.line > 0 ? `line ${p.line}` : ""].filter(Boolean).join(", ");
	return `${where === "" ? "" : `${where}: `}${p.message}`;
}

export function NotesView({ app, deckPath, register }: NotesViewProps) {
	const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
	const [drafts, setDrafts] = useState<ReadonlyMap<number, string>>(new Map());
	const [status, setStatus] = useState<Status>({ kind: "none" });
	const [saving, setSaving] = useState(false);
	const state = useRef({ loaded, drafts, saving });
	state.current = { loaded, drafts, saving };
	/** 最後に自分で書いた deck.html（その modify を、ほかでの変更と見分ける） */
	const written = useRef<string | null>(null);

	const changes = useCallback((): Map<number, string> => {
		const { loaded: l, drafts: d } = state.current;
		const out = new Map<number, string>();
		if (l.kind !== "ready") return out;
		for (const s of l.slides) {
			const text = d.get(s.n);
			if (text !== undefined && text.trim() !== s.text.trim()) out.set(s.n, text);
		}
		return out;
	}, []);

	const reload = useCallback(async () => {
		const deck = await loadDeck(app, deckPath);
		setDrafts(new Map());
		if (deck === null) setLoaded({ kind: "missing" });
		else if ("error" in deck.notes) setLoaded({ kind: "error", message: deck.notes.error });
		else setLoaded({ kind: "ready", source: deck.source, title: deck.notes.title, slides: deck.notes.slides });
	}, [app, deckPath]);

	const save = useCallback(async () => {
		const { loaded: l, saving: busy } = state.current;
		const changed = changes();
		if (l.kind !== "ready" || busy || changed.size === 0) return;
		setSaving(true);
		try {
			const result = await saveNotes(app, deckPath, l.source, changed);
			if (!result.ok) {
				setStatus({ kind: "failed", message: result.message, problems: result.problems });
				return;
			}
			written.current = result.source;
			setStatus({ kind: "saved", warnings: result.warnings });
			await reload();
		} catch (e) {
			setStatus({ kind: "failed", message: `保存できませんでした: ${e instanceof Error ? e.message : String(e)}`, problems: [] });
		} finally {
			setSaving(false);
		}
	}, [app, deckPath, changes, reload]);

	useEffect(() => {
		void reload();
	}, [reload]);

	useEffect(() => {
		register({ isDirty: () => changes().size > 0, save });
		return () => register(null);
	}, [register, changes, save]);

	// ほかで deck.html が変わったら（Claude Code、同期）、変更がなければ読み直し、あれば知らせる
	useEffect(() => {
		const path = `${deckPath}/${SOURCE_FILE}`;
		const ref = app.vault.on("modify", (file) => {
			if (file.path !== path || !(file instanceof TFile) || state.current.saving) return;
			void app.vault.cachedRead(file).then((text) => {
				const l = state.current.loaded;
				// 自分で保存したもの、読んだときと同じものは、ほかでの変更ではない
				if (text === written.current || (l.kind === "ready" && text === l.source)) return;
				if (changes().size === 0) void reload();
				else setStatus({ kind: "changed" });
			});
		});
		return () => app.vault.offref(ref);
	}, [app, deckPath, changes, reload]);

	const dirty = changes().size;

	return (
		<div class="vt-sl-page vt-sl-notes">
			<div class="vt-sl-head vt-sl-notes-head">
				<h1 class="vt-sl-title">Notes</h1>
				{loaded.kind === "ready" && <span class="vt-sl-count">{loaded.slides.length} slides</span>}
				<div class="vt-sl-tools">
					<button type="button" class="vt-sl-btn is-text" onClick={() => void reload().then(() => setStatus({ kind: "none" }))} disabled={saving}>
						Reload
					</button>
					<button type="button" class="vt-sl-btn is-primary" onClick={() => void save()} disabled={saving || dirty === 0} title="Save (Ctrl/Cmd+S)">
						{saving ? "Saving…" : dirty > 0 ? `Save (${dirty})` : "Save"}
					</button>
				</div>
			</div>
			<p class="vt-sl-notes-deck">
				{loaded.kind === "ready" && loaded.title !== "" ? `${loaded.title} · ` : ""}
				{deckPath}
			</p>
			<div role="status" class="vt-sl-notes-status">
				{status.kind === "saved" && (
					<p class={status.warnings.length > 0 ? "vt-sl-notes-msg is-warning" : "vt-sl-notes-msg"}>
						{status.warnings.length > 0 ? `Saved. ${status.warnings.length} warning(s) from the build:` : "Saved. index.html was rebuilt."}
					</p>
				)}
				{status.kind === "failed" && <p class="vt-sl-notes-msg is-error">{status.message}</p>}
				{status.kind === "changed" && <p class="vt-sl-notes-msg is-error">deck.html がほかで変わりました。保存すると失敗します。直した内容を控えてから Reload で読み直してください</p>}
				{(status.kind === "saved" ? status.warnings : status.kind === "failed" ? status.problems : []).length > 0 && (
					<ul class="vt-sl-notes-problems">
						{(status.kind === "saved" ? status.warnings : status.kind === "failed" ? status.problems : []).map((p) => (
							<li>{problemLine(p)}</li>
						))}
					</ul>
				)}
			</div>
			{loaded.kind === "loading" && <p class="vt-sl-notes-msg">Loading…</p>}
			{loaded.kind === "missing" && <p class="vt-sl-notes-msg is-error">{deckPath}/{SOURCE_FILE} がありません</p>}
			{loaded.kind === "error" && <p class="vt-sl-notes-msg is-error">{loaded.message}</p>}
			{loaded.kind === "ready" && (
				<>
					<p class="vt-sl-notes-help">{HELP}</p>
					<ol class="vt-sl-notes-list">
						{loaded.slides.map((s) => {
							const text = drafts.get(s.n) ?? s.text;
							const edited = text.trim() !== s.text.trim();
							const id = `vt-sl-note-${s.n}`;
							return (
								<li class="vt-sl-notes-item" key={s.n}>
									<label class="vt-sl-notes-label" for={id}>
										<span class="vt-sl-notes-n">{s.n}</span>
										<span class="vt-sl-notes-heading">{s.title === "" ? "(no heading)" : s.title}</span>
										{edited && <span class="vt-sl-notes-edited">Edited</span>}
									</label>
									<textarea
										id={id}
										class="vt-sl-notes-input"
										rows={rowsOf(text)}
										value={text}
										placeholder="Speaker notes"
										spellcheck={false}
										onInput={(e) => {
											const value = (e.currentTarget as HTMLTextAreaElement).value;
											setDrafts((d) => new Map(d).set(s.n, value));
										}}
									/>
								</li>
							);
						})}
					</ol>
				</>
			)}
		</div>
	);
}
