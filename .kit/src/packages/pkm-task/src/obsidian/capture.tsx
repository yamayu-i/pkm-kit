import { Notice, Platform, type TFile } from "obsidian";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { parseCaptureText } from "../core/capture";
import type { TaskContext } from "./context";
import { PreactModal } from "./modals";

const NOTICE_MS = 5000;

function CaptureForm(props: { onSubmit: (summaries: string[]) => void }) {
	const [text, setText] = useState("");
	const ref = useRef<HTMLTextAreaElement>(null);
	useEffect(() => ref.current?.focus(), []);
	const summaries = parseCaptureText(text);
	const submit = () => summaries.length > 0 && props.onSubmit(summaries);
	return (
		<div class="vt-capture">
			<textarea
				ref={ref}
				rows={6}
				placeholder={"One summary per line\n- You can paste a bulleted list"}
				value={text}
				onInput={(e) => setText(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.isComposing) {
						e.preventDefault();
						submit();
					}
				}}
			/>
			<div class="vt-form">
				<span class="vt-muted">
					Create {summaries.length}{Platform.isMobile ? "" : " (Mod+Enter)"}
				</span>
				<button class="mod-cta" disabled={summaries.length === 0} onClick={submit}>
					Create
				</button>
			</div>
		</div>
	);
}

async function openAll(ctx: TaskContext, files: TFile[]): Promise<void> {
	let first = null;
	for (const file of files) {
		// 一覧ペインがあれば、ノートペインにタブを足す（ADR-0033）
		const leaf = await openInNotePane(ctx.app.workspace, file, { newTab: true, phone: Platform.isPhone });
		first ??= leaf;
	}
	if (first) ctx.app.workspace.setActiveLeaf(first, { focus: true });
}

function showCreatedNotice(ctx: TaskContext, created: TFile[], failed: string[]): void {
	const fragment = document.createDocumentFragment();
	const ids = created.map((f) => f.basename);
	const range = ids.length <= 1 ? ids.join("") : `${ids[0]}〜${ids[ids.length - 1]}`;
	const message = created.length > 0 ? `${created.length} 件の issue を作成しました（${range}）` : "issue を作成できませんでした";
	fragment.createEl("div", { text: failed.length > 0 ? `${message}。${failed.length} 件は失敗` : message });
	let notice: Notice | null = null;
	if (created.length > 0) {
		const button = fragment.createEl("button", { text: "Open all in tabs", cls: "vt-notice-button" });
		button.addEventListener("click", (e) => {
			e.stopPropagation();
			notice?.hide();
			void openAll(ctx, created).catch((err) => ctx.report("タブで開けませんでした", err));
		});
	}
	notice = new Notice(fragment, NOTICE_MS);
}

/** issue の一括登録（ADR-0011）。`parent` を渡すと、その issue の子として作る（ADR-0012） */
export function openCaptureModal(ctx: TaskContext, parent: string | null = null): void {
	new PreactModal(ctx.app, parent === null ? "Capture issues" : "Capture child issues", (close) => (
		<CaptureForm
			onSubmit={(summaries) => {
				close();
				void ctx.writer
					.createIssues(summaries, parent)
					.then(({ created, failed }) => showCreatedNotice(ctx, created, failed))
					.catch((e) => ctx.report("issue を作成できませんでした", e));
			}}
		/>
	)).open();
}
