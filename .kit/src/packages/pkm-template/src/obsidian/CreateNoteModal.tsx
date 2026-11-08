import { Modal, Platform, type App } from "obsidian";
import { render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { formatDateTime } from "../core/date-format";
import { resolveOutputPath, usesIdFileName } from "../core/template";
import type { LoadedTemplate, TemplateManager } from "./creator";
import { askDates } from "./DatePromptModal";

function templateLabel(file: string): string {
	return file.replace(/\.md$/i, "");
}

function CreateNoteForm(props: {
	app: App;
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
		// {{prompt-date}} があれば、ファイルを作る前に日付を尋ねる。キャンセルなら作らない（ADR-0065）
		void askDates(props.app, current.datePrompts)
			.then(async (dates) => {
				if (dates === null) {
					setSubmitting(false);
					return;
				}
				await manager.createNoteFromTemplate({
					template: current,
					titleInput,
					prompts: promptValues,
					dates,
					now,
					newTab,
				});
				onCreated();
			})
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
				<div class="vt-tpl-chips" role="listbox" aria-label="Templates">
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
					{idFileName ? "Title" : "File name / Title"}
				</label>
				<input
					id="vt-tpl-title-input"
					ref={titleRef}
					type="text"
					class="vt-tpl-input"
					placeholder={
						idFileName
							? "Title (the file name comes from the ID)"
							: defaultFileNameHint
								? `Empty: ${defaultFileNameHint}`
								: "Title (e.g. my-note)"
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
							placeholder={prompt.defaultValue ? `Default: ${prompt.defaultValue}` : prompt.label}
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
					{errorMessage ? errorMessage : `Creates: ${resolved.path}`}
				</div>
				<div class="vt-tpl-actions">
					{!Platform.isMobile && <span class="vt-tpl-hint">Enter / Mod+Enter to create</span>}
					<button type="button" class="vt-tpl-button" disabled={!canSubmit} onClick={() => submit(true)}>
						Open in new tab
					</button>
					<button type="button" class="vt-tpl-button is-primary" disabled={!canSubmit} onClick={() => submit(false)}>
						Create
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
		this.setTitle("Create new file from template");
		render(
			<CreateNoteForm
				app={this.app}
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
