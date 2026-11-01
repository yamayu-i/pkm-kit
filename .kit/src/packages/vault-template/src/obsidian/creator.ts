import { MarkdownView, normalizePath, type App, type TFile } from "obsidian";
import {
	mergeTemplateEntries,
	parseTemplateConfig,
	serializeTemplateConfig,
	TEMPLATE_CONFIG_PATH,
	TEMPLATE_DIR,
	type TemplateEntry,
} from "../core/config";
import {
	extractPrompts,
	offsetToPos,
	renderTemplate,
	resolveDailyPath,
	resolveOutputPath,
	type PromptField,
} from "../core/template";

export interface LoadedTemplate {
	entry: TemplateEntry;
	rawContent: string;
	prompts: PromptField[];
}

export class TemplateManager {
	constructor(private readonly app: App) {}

	/** `template/file/` 直下の `.md` ファイル名一覧を返す */
	listTemplateFiles(): string[] {
		const prefix = `${TEMPLATE_DIR}/`;
		const names: string[] = [];
		for (const file of this.app.vault.getFiles()) {
			if (!file.path.startsWith(prefix)) continue;
			const rest = file.path.slice(prefix.length);
			if (!rest.includes("/") && rest.endsWith(".md")) {
				names.push(rest);
			}
		}
		return names.sort((a, b) => a.localeCompare(b));
	}

	/** `template/config.json` と `template/file/*.md` を突き合わせて設定一覧を返す */
	async loadConfig(): Promise<{ entries: TemplateEntry[]; problems: string[] }> {
		const actualFiles = this.listTemplateFiles();
		const configFile = this.app.vault.getFileByPath(TEMPLATE_CONFIG_PATH);
		if (!configFile) {
			return { entries: mergeTemplateEntries([], actualFiles), problems: [] };
		}
		const text = await this.app.vault.read(configFile);
		const { templates, problems } = parseTemplateConfig(text);
		return {
			entries: mergeTemplateEntries(templates, actualFiles),
			problems,
		};
	}

	/** `template/config.json` に設定を保存する */
	async saveConfig(entries: readonly TemplateEntry[]): Promise<void> {
		const existing = this.app.vault.getFileByPath(TEMPLATE_CONFIG_PATH);
		if (existing) {
			const currentText = await this.app.vault.read(existing);
			const { problems } = parseTemplateConfig(currentText);
			if (problems.length > 0) {
				throw new Error(`${TEMPLATE_CONFIG_PATH} に書式エラーがあるため上書きできません: ${problems.join(", ")}`);
			}
			await this.app.vault.modify(existing, serializeTemplateConfig(entries));
			return;
		}
		await this.ensureFolder(TEMPLATE_CONFIG_PATH);
		await this.app.vault.create(TEMPLATE_CONFIG_PATH, serializeTemplateConfig(entries));
	}

	/** テンプレート 1 件の中身とプロンプト定義を読み込む。ファイルがなければ null */
	private async loadTemplate(entry: TemplateEntry): Promise<LoadedTemplate | null> {
		const file = this.app.vault.getFileByPath(`${TEMPLATE_DIR}/${entry.file}`);
		if (!file) return null;
		const rawContent = await this.app.vault.cachedRead(file);
		return { entry, rawContent, prompts: extractPrompts(rawContent) };
	}

	/** モーダルに表示する有効なテンプレートとその中身・プロンプト定義を読み込む */
	async loadEnabledTemplates(): Promise<LoadedTemplate[]> {
		const { entries } = await this.loadConfig();
		const loaded: LoadedTemplate[] = [];
		for (const entry of entries.filter((e) => e.enabled)) {
			const template = await this.loadTemplate(entry);
			if (template) loaded.push(template);
		}
		return loaded;
	}

	/** `{{id:…}}` の連番を決めるための、Vault 内のすべてのノートの basename（vault-task と同じ見方） */
	takenNames(): string[] {
		return this.app.vault.getMarkdownFiles().map((f) => f.basename);
	}

	/**
	 * 今日のデイリーノートを開く。なければ `template/file/daily.md` から作る。
	 * 生成先は `template/config.json` の daily.md の設定に従う（有効・無効は問わない）。
	 */
	async openTodaysDaily(now: Date = new Date()): Promise<TFile> {
		const { entries } = await this.loadConfig();
		const entry = entries.find((e) => e.file === "daily.md");
		const resolved = resolveDailyPath(entry, now);
		if (resolved.error) throw new Error(resolved.error);

		const path = normalizePath(resolved.path);
		const existing = this.app.vault.getFileByPath(path);
		if (existing) {
			await this.app.workspace.getLeaf(false).openFile(existing);
			return existing;
		}

		const template = await this.loadTemplate(
			entry ?? { file: "daily.md", enabled: false, folder: "", fileNamePattern: "" },
		);
		if (!template) throw new Error(`${TEMPLATE_DIR}/daily.md がありません`);
		return this.createNoteFromTemplate({ template, titleInput: "", prompts: {}, now });
	}

	fileExists(path: string): boolean {
		return Boolean(this.app.vault.getFileByPath(normalizePath(path)));
	}

	/** テンプレートを展開してファイルを作成し、エディタで開いてカーソルを移動する */
	async createNoteFromTemplate(params: {
		template: LoadedTemplate;
		titleInput: string;
		prompts: Record<string, string>;
		now?: Date;
		newTab?: boolean;
	}): Promise<TFile> {
		const now = params.now ?? new Date();
		const takenNames = this.takenNames();
		const resolved = resolveOutputPath({
			folder: params.template.entry.folder,
			fileNamePattern: params.template.entry.fileNamePattern,
			titleInput: params.titleInput,
			now,
			prompts: params.prompts,
			takenNames,
		});
		if (resolved.error) {
			throw new Error(resolved.error);
		}
		const normalized = normalizePath(resolved.path);
		if (this.fileExists(normalized)) {
			throw new Error(`すでに同じ名前のファイルがあります: ${normalized}`);
		}

		const rendered = renderTemplate(params.template.rawContent, {
			now,
			title: resolved.title,
			path: normalized,
			folder: resolved.folder,
			prompts: params.prompts,
			takenNames,
		});

		await this.ensureFolder(normalized);
		const created = await this.app.vault.create(normalized, rendered.content);

		const leaf = this.app.workspace.getLeaf(params.newTab ? "tab" : false);
		await leaf.openFile(created);

		const view =
			this.app.workspace.getActiveViewOfType(MarkdownView) ??
			(leaf as unknown as { view?: { editor?: { setCursor(pos: { line: number; ch: number }): void; focus(): void } } }).view;
		const editor = view?.editor;
		if (editor) {
			const offset = rendered.cursorOffset ?? rendered.content.length;
			editor.setCursor(offsetToPos(rendered.content, offset));
			editor.focus();
		}
		return created;
	}

	private async ensureFolder(filePath: string): Promise<void> {
		const parts = filePath.split("/").slice(0, -1);
		for (let i = 1; i <= parts.length; i++) {
			const folder = parts.slice(0, i).join("/");
			if (!this.app.vault.getFolderByPath(folder)) {
				await this.app.vault.createFolder(folder);
			}
		}
	}
}
