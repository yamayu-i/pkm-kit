/**
 * 子の Vault の基本の色の CLI（ADR-0121）。.kit/bin/theme.mjs の中身。
 *
 *   list   上書きできる色と、上流の値
 *   check  theme.json が規約を満たすか、スニペットと appearance.json が theme.json と合っているか
 *   build  規約を満たすときだけ、スニペットを作り、appearance.json を合わせる（満たさなければ何も書かない）
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { toHex } from "../src/color.ts";
import { applyTheme, checkTheme, LOCAL_SNIPPET_FILE, LOCAL_SNIPPET_NAME, parseTheme, THEME_FILE, themeAccent, themeSnippet, vaultColorNames } from "../src/theme.ts";
import { resolveColor, type Token } from "../src/tokens.ts";

export interface CliResult {
	code: number;
	out: string[];
	err: string[];
}

const APPEARANCE = ".obsidian/appearance.json";

function readJson(path: string): { value?: unknown; error?: string } {
	try {
		return { value: JSON.parse(readFileSync(path, "utf8")) };
	} catch (e) {
		return { error: `${path} が JSON として読めません（${(e as Error).message}）` };
	}
}

function appearanceProblems(root: string, accent: string): string[] {
	const path = join(root, APPEARANCE);
	const a = existsSync(path) ? readJson(path).value : undefined;
	const obj = (typeof a === "object" && a !== null ? a : {}) as Record<string, unknown>;
	const problems: string[] = [];
	if (typeof obj.accentColor !== "string" || obj.accentColor.toLowerCase() !== accent) {
		problems.push(`${APPEARANCE}: accentColor が ${JSON.stringify(obj.accentColor)}（${accent} にする。node .kit/bin/theme.mjs build で合わせる）`);
	}
	if (!Array.isArray(obj.enabledCssSnippets) || !obj.enabledCssSnippets.includes(LOCAL_SNIPPET_NAME)) {
		problems.push(`${APPEARANCE}: enabledCssSnippets に "${LOCAL_SNIPPET_NAME}" がない（node .kit/bin/theme.mjs build で合わせる）`);
	}
	return problems;
}

/** accentColor と enabledCssSnippets だけを書き換え、ほかのキーは残す。Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない */
function writeAppearance(root: string, accent: string): void {
	const path = join(root, APPEARANCE);
	const a = existsSync(path) ? readJson(path).value : undefined;
	const obj = { ...((typeof a === "object" && a !== null && !Array.isArray(a) ? a : {}) as Record<string, unknown>) };
	obj.accentColor = accent;
	const snippets = Array.isArray(obj.enabledCssSnippets) ? [...obj.enabledCssSnippets] : [];
	if (!snippets.includes(LOCAL_SNIPPET_NAME)) snippets.push(LOCAL_SNIPPET_NAME);
	obj.enabledCssSnippets = snippets;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(obj, null, 2));
}

/** theme.json を読み、重ねて検査する。誤りがあれば themed は返さない */
function load(root: string, tokens: readonly Token[]): { themed?: Token[]; problems: string[] } {
	const path = join(root, THEME_FILE);
	const json = readJson(path);
	if (json.error) return { problems: [json.error] };
	const { theme, errors } = parseTheme(json.value, tokens);
	if (errors.length > 0) return { problems: errors };
	const themed = applyTheme(tokens, theme);
	const problems = checkTheme(themed);
	return problems.length > 0 ? { problems } : { themed, problems: [] };
}

export function runTheme(args: readonly string[], root: string, tokens: readonly Token[]): CliResult {
	const out: string[] = [];
	const err: string[] = [];
	const [command] = args;
	const hasTheme = existsSync(join(root, THEME_FILE));
	const hasSnippet = existsSync(join(root, LOCAL_SNIPPET_FILE));

	if (command === "list") {
		out.push(`${THEME_FILE} で上書きできる色（上流の値: ライト / ダーク）`);
		for (const name of vaultColorNames(tokens)) {
			const t = tokens.find((x) => x.path === `color.${name}`) as Token;
			const v = (mode: "light" | "dark") => toHex(resolveColor(tokens, t.path, mode));
			out.push(`  ${name}: ${v("light")} / ${v("dark")}  ${t.description}`);
		}
		return { code: 0, out, err };
	}

	if (command === "check") {
		if (!hasTheme) {
			if (hasSnippet) {
				err.push(`${LOCAL_SNIPPET_FILE} があるのに ${THEME_FILE} がありません（色を戻すならスニペットも消し、appearance.json から外す）`);
				return { code: 1, out, err };
			}
			out.push(`基本の色: ${THEME_FILE} がないので、上流の色のまま`);
			return { code: 0, out, err };
		}
		const { themed, problems } = load(root, tokens);
		if (!themed) {
			err.push(...problems);
			return { code: 1, out, err };
		}
		const expected = themeSnippet(tokens, themed);
		const actual = hasSnippet ? readFileSync(join(root, LOCAL_SNIPPET_FILE), "utf8") : null;
		if (actual !== expected) {
			err.push(`${LOCAL_SNIPPET_FILE} が ${THEME_FILE} から作ったものと違います（node .kit/bin/theme.mjs build で作り直す。手で直さない）`);
		}
		err.push(...appearanceProblems(root, themeAccent(themed)));
		if (err.length > 0) return { code: 1, out, err };
		out.push("基本の色: OK");
		return { code: 0, out, err };
	}

	if (command === "build") {
		if (!hasTheme) {
			err.push(`${THEME_FILE} がありません。上書きする色を書いてから実行する（node .kit/bin/theme.mjs list で一覧）`);
			return { code: 1, out, err };
		}
		const { themed, problems } = load(root, tokens);
		if (!themed) {
			err.push("デザイン規約に合わないので、何も書きませんでした:", ...problems.map((p) => `  ${p}`));
			return { code: 1, out, err };
		}
		const path = join(root, LOCAL_SNIPPET_FILE);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, themeSnippet(tokens, themed));
		writeAppearance(root, themeAccent(themed));
		out.push(`${LOCAL_SNIPPET_FILE} と ${APPEARANCE} を書きました。Obsidian を開き直すと反映されます`);
		// スライドは primary を index.html に埋め込むので、ビルドし直すまで前の色のまま（ADR-0125）
		if (existsSync(join(root, "slide"))) out.push("スライドの primary も変わります。node .kit/bin/slide.mjs build --all でビルドし直し、index.html も一緒にコミットしてください");
		return { code: 0, out, err };
	}

	err.push("使い方: node .kit/bin/theme.mjs <list | check | build>");
	return { code: 1, out, err };
}
