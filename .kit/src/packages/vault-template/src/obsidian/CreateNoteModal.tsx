import { Modal, Platform, type App } from "obsidian";
import { render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { formatDateTime } from "../core/date-format";
import { resolveOutputPath, usesIdFileName } from "../core/template";
import type { LoadedTemplate, TemplateManager } from "./creator";

function templateLabel(file: string): string {
	return file.replace(/\.md$/i, "");
}

function CreateNoteForm(props: {
	templates: LoadedTemplate[];
	manager: TemplateManager;
	onCreated: () => void;
	onReport: (msg: string, err?: unknown) => void;
}) {
	const { templates, manager, onCreated, onReport } = props;
	const [selectedIdx, setSelectedIdx] = useState(0);
	const [titleInput, setTitleInput] = useState("");
	const [promptValues, setPromptValues] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const titleRef = useRef<HTMLInputElement>(null);
	const now = useMemo(() => new Date(), []);
	const takenNames = useMemo(() => manager.takenNames(), [manager]);

	useEffect(() => {
		titleRef.current?.focus();
	}, [selectedIdx]);

	if (templates.length === 0) {
		return (
			<div class="vt-tpl-empty">
				有効なテンプレートがありません。プラグイン設定、template/file/、.kit/templates/file/ を確認してください。
			</div>
		);
	}

	const current = templates[selectedIdx] ?? templates[0]!;
	const idFileName = usesIdFileName(current.entry.fileNamePattern);
	const defaultFileNameHint = !idFileName && current.entry.fileNamePattern
		? formatDateTime(now, current.entry.fileNamePattern.replace(/\{\{date(?::([^{}]+))?\}\}/g, (_, f) => f || "YYYY-MM-DD"))
		: "";

	const resolved = resolveOutputPath({
		folder: current.entry.folder,
		fileNamePattern: current.entry.fileNamePattern,
		titleInput,
		now,
		prompts: promptValues,
		takenNames,
	});

	const alreadyExists = !resolved.error && resolved.path ? manager.fileExists(resolved.path) : false;
	const errorMessage = resolved.error ?? (alreadyExists ? `すでに同じ名前のファイルがあります: ${resolved.path}` : null);
	const canSubmit = !submitting && !errorMessage && Boolean(resolved.path);

	const submit = (newTab: boolean) => {
		if (!canSubmit) return;
		setSubmitting(true);
		void manager
			.createNoteFromTemplate({
				template: current,
				titleInput,
				prompts: promptValues,
				now,
				newTab,
			})
			.then(() => onCreated())
			.catch((err) => {
				setSubmitting(false);
				onReport("ノートを作成できませんでした", err);
			});
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.isComposing) return;
		if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
			e.preventDefault();
			const next = (selectedIdx + (e.key === "ArrowDown" ? 1 : templates.length - 1)) % templates.length;
			setSelectedIdx(next);
			return;
		}
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			submit(e.shiftKey);
		}
	};

	return (
		<div class="vt-tpl-modal" onKeyDown={handleKeyDown}>
			<div class="vt-tpl-section">
				<div class="vt-tpl-label">TEMPLATE</div>
				<div class="vt-tpl-chips" role="listbox" aria-label="テンプレート選択">
					{templates.map((tpl, i) => {
						const active = i === selectedIdx;
						return (
							<button
								key={tpl.entry.file}
								type="button"
								role="option"
								aria-selected={active}
								class={`vt-tpl-chip${active ? " is-active" : ""}`}
								onClick={() => setSelectedIdx(i)}
							>
								<span>{templateLabel(tpl.entry.file)}</span>
							</button>
						);
					})}
				</div>
			</div>

			<div class="vt-tpl-section">
				<label class="vt-tpl-label" for="vt-tpl-title-input">
					{idFileName ? "タイトル" : "ファイル名 / タイトル"}
				</label>
				<input
					id="vt-tpl-title-input"
					ref={titleRef}
					type="text"
					class="vt-tpl-input"
					placeholder={
						idFileName
							? "タイトルを入力（ファイル名は ID で決まります）"
							: defaultFileNameHint
								? `空欄なら ${defaultFileNameHint}`
								: "タイトルを入力（例: my-note）"
					}
					value={titleInput}
					onInput={(e) => setTitleInput(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.isComposing && current.prompts.length === 0) {
							e.preventDefault();
							submit(e.shiftKey);
						}
					}}
				/>
			</div>

			{current.prompts.map((prompt, idx) => {
				const inputId = `vt-tpl-prompt-${idx}`;
				const isLast = idx === current.prompts.length - 1;
				return (
					<div key={prompt.label} class="vt-tpl-section">
						<label class="vt-tpl-label" for={inputId}>
							{prompt.label}
						</label>
						<input
							id={inputId}
							type="text"
							class="vt-tpl-input"
							placeholder={prompt.defaultValue ? `既定値: ${prompt.defaultValue}` : `${prompt.label}を入力`}
							value={promptValues[prompt.label] ?? ""}
							onInput={(e) =>
								setPromptValues((prev) => ({
									...prev,
									[prompt.label]: e.currentTarget.value,
								}))
							}
							onKeyDown={(e) => {
								if (isLast && e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.isComposing) {
									e.preventDefault();
									submit(e.shiftKey);
								}
							}}
						/>
					</div>
				);
			})}

			<div class="vt-tpl-footer">
				<div class={`vt-tpl-preview${errorMessage ? " is-error" : ""}`}>
					{errorMessage ? errorMessage : `作成先: ${resolved.path}`}
				</div>
				<div class="vt-tpl-actions">
					{!Platform.isMobile && <span class="vt-tpl-hint">Enter / Mod+Enter で作成</span>}
					<button type="button" class="vt-tpl-button" disabled={!canSubmit} onClick={() => submit(true)}>
						新タブで開く
					</button>
					<button type="button" class="vt-tpl-button is-primary" disabled={!canSubmit} onClick={() => submit(false)}>
						作成
					</button>
				</div>
			</div>
		</div>
	);
}

export class CreateNoteModal extends Modal {
	constructor(
		app: App,
		private readonly manager: TemplateManager,
		private readonly templates: LoadedTemplate[],
		private readonly onReport: (msg: string, err?: unknown) => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("テンプレートから新規ファイルを作成");
		render(
			<CreateNoteForm
				templates={this.templates}
				manager={this.manager}
				onCreated={() => this.close()}
				onReport={this.onReport}
			/>,
			this.contentEl,
		);
	}

	override onClose(): void {
		render(null, this.contentEl);
	}
}
