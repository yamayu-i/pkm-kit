import { MarkdownView, normalizePath, Platform, type App, type TFile } from "obsidian";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import {
	parseTemplateConfig,
	resolveTemplateEntries,
	TEMPLATE_DIR,
	UPSTREAM_TEMPLATE_CONFIG_PATH,
	UPSTREAM_TEMPLATE_DIR,
	type TemplateEntry,
} from "../core/config";
import { layerSnippets, parseSnippet, SNIPPET_DIR, UPSTREAM_SNIPPET_DIR, type Snippet } from "../core/snippet";
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

	/** その Vault の `template/file/` 直下の `.md` ファイル名一覧 */
	listLocalTemplateFiles(): string[] {
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

	/** 上流の `.kit/templates/file/` 直下の `.md` ファイル名一覧。隠しパスなのでアダプタで読む */
	async listUpstreamTemplateFiles(): Promise<string[]> {
		const adapter = this.app.vault.adapter;
		if (!(await adapter.exists(UPSTREAM_TEMPLATE_DIR))) return [];
		const prefix = `${UPSTREAM_TEMPLATE_DIR}/`;
		return (await adapter.list(UPSTREAM_TEMPLATE_DIR)).files
			.map((p) => (p.startsWith(prefix) ? p.slice(prefix.length) : p))
			.filter((name) => !name.includes("/") && name.endsWith(".md"))
			.sort((a, b) => a.localeCompare(b));
	}

	/** 使えるテンプレートのファイル名（上流と、その Vault の和） */
	async listTemplateFiles(): Promise<string[]> {
		const names = new Set([...(await this.listUpstreamTemplateFiles()), ...this.listLocalTemplateFiles()]);
		return [...names].sort((a, b) => a.localeCompare(b));
	}

	/** 上流の既定の設定（`.kit/templates/config.json`）。なければ空 */
	private async loadUpstreamConfig(): Promise<{ templates: TemplateEntry[]; problems: string[] }> {
		const adapter = this.app.vault.adapter;
		if (!(await adapter.exists(UPSTREAM_TEMPLATE_CONFIG_PATH))) return { templates: [], problems: [] };
		const { templates, problems } = parseTemplateConfig(await adapter.read(UPSTREAM_TEMPLATE_CONFIG_PATH));
		return { templates, problems: problems.map((p) => `${UPSTREAM_TEMPLATE_CONFIG_PATH}: ${p}`) };
	}

	/**
	 * 上流の設定（`.kit/templates/config.json`）と、使えるテンプレートを合わせた設定一覧を返す。設定は子が上書きしない（ADR-0061）。
	 * テンプレートのファイルは、同じ名前ならその Vault の `template/file/` を優先する
	 */
	async loadConfig(): Promise<{ entries: TemplateEntry[]; problems: string[] }> {
		const files = await this.listTemplateFiles();
		const upstream = await this.loadUpstreamConfig();
		return { entries: resolveTemplateEntries({ upstream: upstream.templates, files }), problems: upstream.problems };
	}

	/** テンプレート 1 件の中身とプロンプト定義を読み込む。その Vault の `template/file/` を先に見る。どちらにもなければ null */
	private async loadTemplate(entry: TemplateEntry): Promise<LoadedTemplate | null> {
		const file = this.app.vault.getFileByPath(`${TEMPLATE_DIR}/${entry.file}`);
		let rawContent: string;
		if (file) rawContent = await this.app.vault.cachedRead(file);
		else {
			const upstreamPath = `${UPSTREAM_TEMPLATE_DIR}/${entry.file}`;
			if (!(await this.app.vault.adapter.exists(upstreamPath))) return null;
			rawContent = await this.app.vault.adapter.read(upstreamPath);
		}
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

	/**
	 * スニペット（ADR-0060）。上流の `.kit/templates/snippet/` に、その Vault の `template/snippet/` を重ねる
	 * （同じファイル名ならその Vault のもの）。どちらも直下の `.md` だけ
	 */
	async loadSnippets(): Promise<{ snippets: Snippet[]; problems: string[] }> {
		const problems: string[] = [];
		const parseAll = (items: { file: string; text: string }[], dir: string) =>
			items.flatMap(({ file, text }) => {
				const { snippet, problem } = parseSnippet(file, text);
				if (problem) problems.push(`${dir}/${problem}`);
				return snippet ? [snippet] : [];
			});

		const upstream: { file: string; text: string }[] = [];
		const adapter = this.app.vault.adapter;
		if (await adapter.exists(UPSTREAM_SNIPPET_DIR)) {
			const prefix = `${UPSTREAM_SNIPPET_DIR}/`;
			for (const p of (await adapter.list(UPSTREAM_SNIPPET_DIR)).files) {
				const name = p.startsWith(prefix) ? p.slice(prefix.length) : p;
				if (name.includes("/") || !name.endsWith(".md")) continue;
				upstream.push({ file: name, text: await adapter.read(`${prefix}${name}`) });
			}
		}

		const local: { file: string; text: string }[] = [];
		const localPrefix = `${SNIPPET_DIR}/`;
		for (const f of this.app.vault.getFiles()) {
			if (!f.path.startsWith(localPrefix)) continue;
			const name = f.path.slice(localPrefix.length);
			if (name.includes("/") || !name.endsWith(".md")) continue;
			local.push({ file: name, text: await this.app.vault.cachedRead(f) });
		}

		const snippets = layerSnippets(parseAll(upstream, UPSTREAM_SNIPPET_DIR), parseAll(local, SNIPPET_DIR));
		return { snippets, problems };
	}

	/** `{{id:…}}` の連番を決めるための、Vault 内のすべてのノートの basename（pkm-task と同じ見方） */
	takenNames(): string[] {
		return this.app.vault.getMarkdownFiles().map((f) => f.basename);
	}

	/**
	 * 今日のデイリーノートを開く。なければ daily.md のテンプレート（`template/file/` か `.kit/templates/file/`）から作る。
	 * 生成先は `.kit/templates/config.json` の daily.md の設定に従う（有効・無効は問わない）。
	 */
	async openTodaysDaily(now: Date = new Date()): Promise<TFile> {
		const { entries } = await this.loadConfig();
		const entry = entries.find((e) => e.file === "daily.md");
		const resolved = resolveDailyPath(entry, now);
		if (resolved.error) throw new Error(resolved.error);

		const path = normalizePath(resolved.path);
		const existing = this.app.vault.getFileByPath(path);
		if (existing) {
			await openInNotePane(this.app.workspace, existing, { newTab: false, phone: Platform.isPhone });
			return existing;
		}

		const template = await this.loadTemplate(
			entry ?? { file: "daily.md", enabled: false, folder: "", fileNamePattern: "" },
		);
		if (!template) throw new Error(`daily.md のテンプレートがありません（${TEMPLATE_DIR}/ にも ${UPSTREAM_TEMPLATE_DIR}/ にもない）`);
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

		const leaf = await openInNotePane(this.app.workspace, created, { newTab: params.newTab === true, phone: Platform.isPhone });

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
