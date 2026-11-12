/** トークンから生成物（プラグインの CSS、Obsidian のスニペット、一覧の文書、TS の定数）を作る */
import { formatRatio, toHex } from "./color.ts";
import { checkContrast, worstContrast } from "./contrast.ts";
import { diagramTs, mermaidCss } from "./diagram.ts";
import { aliasTarget, colorValue, cssVarOf, MODES, resolveColor, resolveValue, type Mode, type Token } from "./tokens.ts";

const GENERATED = "生成物。手で編集しない。正本は .kit/src/packages/design/tokens.json（pnpm --filter design build で作り直す）";

function num(n: number): string {
	return String(+n.toFixed(4));
}

function dim(v: unknown): string {
	const d = v as { value: number; unit: string };
	return d.value === 0 ? "0" : `${num(d.value)}${d.unit}`;
}

function colorCss(v: unknown): string {
	return toHex(colorValue(v));
}

/** 1 つの値を CSS に。別名は var() にしてテーマの切り替えに追従させる */
export function cssValue(token: Token, raw: unknown): string {
	const target = aliasTarget(raw);
	if (target !== null) return `var(${cssVarOf(target)})`;
	switch (token.type) {
		case "color":
			return colorCss(raw);
		case "dimension":
		case "duration":
			return dim(raw);
		case "number":
		case "fontWeight":
			return typeof raw === "number" ? num(raw) : String(raw);
		case "cubicBezier":
			return `cubic-bezier(${(raw as number[]).map(num).join(", ")})`;
		case "shadow": {
			const list = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[];
			return list
				.map((s) => {
					const color = aliasTarget(s.color) !== null ? `var(${cssVarOf(aliasTarget(s.color) as string)})` : colorCss(s.color);
					return `${s.inset ? "inset " : ""}${dim(s.offsetX)} ${dim(s.offsetY)} ${dim(s.blur)} ${dim(s.spread)} ${color}`;
				})
				.join(", ");
		}
	}
}

/** プラグイン（pkm-task）の styles.css の先頭に付けるトークン */
export function pluginCss(tokens: readonly Token[]): string {
	const own = tokens.filter((t) => t.plugin);
	const lines = [`/* ${GENERATED} */`, "", "/* モーダルでも使うので body に置く */", "body {"];
	for (const t of own) lines.push(`\t${t.cssVar}: ${cssValue(t, t.raw.light)};`);
	lines.push("}", "", "body.theme-dark {");
	for (const t of own) {
		if (JSON.stringify(t.raw.dark) !== JSON.stringify(t.raw.light)) lines.push(`\t${t.cssVar}: ${cssValue(t, t.raw.dark)};`);
	}
	lines.push("}", "");
	return lines.join("\n");
}

/** 書き出した HTML（ADR-0044）でフォントの変数に入れる、OS のフォント。Obsidian の外にはその変数がない */
export const STANDALONE_FONTS: Readonly<Record<string, string>> = {
	"--font-interface": 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif',
	"--font-text": 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif',
	"--font-monospace": 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

/**
 * Vault の外で開く HTML に埋め込むトークン（ADR-0044）。テーマのクラスがないので、
 * ライトを :root に置き、ダークは prefers-color-scheme で切り替える
 */
export function standaloneCss(tokens: readonly Token[]): string {
	const own = tokens.filter((t) => t.plugin);
	const lines = [`/* ${GENERATED} */`, ":root {", "\tcolor-scheme: light dark;"];
	for (const [name, value] of Object.entries(STANDALONE_FONTS)) lines.push(`\t${name}: ${value};`);
	for (const t of own) lines.push(`\t${t.cssVar}: ${cssValue(t, t.raw.light)};`);
	lines.push("}", "", "@media (prefers-color-scheme: dark) {", "\t:root {");
	for (const t of own) {
		if (JSON.stringify(t.raw.dark) !== JSON.stringify(t.raw.light)) lines.push(`\t\t${t.cssVar}: ${cssValue(t, t.raw.dark)};`);
	}
	lines.push("\t}", "}", "");
	return lines.join("\n");
}

/**
 * スライド（ADR-0117）に埋め込むトークン。ブラウザで開くのでテーマのクラスがない。
 * ライトを :root に置き、ダークは <html data-theme="dark"> で切り替える（デッキが決め、閲覧の画面で切り替える）
 */
export function slideCss(tokens: readonly Token[]): string {
	const own = tokens.filter((t) => t.plugin);
	const lines = [`/* ${GENERATED} */`, ":root {", "\tcolor-scheme: light;"];
	for (const [name, value] of Object.entries(STANDALONE_FONTS)) lines.push(`\t${name}: ${value};`);
	for (const t of own) lines.push(`\t${t.cssVar}: ${cssValue(t, t.raw.light)};`);
	lines.push("}", "", ':root[data-theme="dark"] {', "\tcolor-scheme: dark;");
	for (const t of own) {
		if (JSON.stringify(t.raw.dark) !== JSON.stringify(t.raw.light)) lines.push(`\t${t.cssVar}: ${cssValue(t, t.raw.dark)};`);
	}
	lines.push("}", "");
	return lines.join("\n");
}

/** Obsidian 本体の CSS 変数を同じ値に固定するスニペット（.obsidian/snippets/pkm-theme.css） */
export function obsidianSnippet(tokens: readonly Token[]): string {
	const lines = [
		`/* ${GENERATED} */`,
		"/* Obsidian 本体の色をデザイントークンと同じ値に固定する（.kit/src/docs/design.md「Obsidian 側の固定」） */",
	];
	for (const mode of MODES) {
		lines.push("", `body.theme-${mode} {`);
		for (const t of tokens) {
			for (const name of t.obsidian) lines.push(`\t${name}: ${toHex(resolveColor(tokens, t.path, mode))};`);
		}
		lines.push("}");
	}
	lines.push(mermaidCss(tokens));
	return lines.join("\n");
}

/** TS から使う色の値（label の文字色の検査など） */
export function tsModule(tokens: readonly Token[]): string {
	const colors = (mode: Mode) =>
		tokens
			.filter((t) => t.type === "color")
			.map((t) => `\t\t${JSON.stringify(t.path)}: ${JSON.stringify(toHex(resolveColor(tokens, t.path, mode)))},`)
			.join("\n");
	return `// ${GENERATED}\n\nexport const colors = {\n\tlight: {\n${colors("light")}\n\t},\n\tdark: {\n${colors("dark")}\n\t},\n} as const;\n\nexport type ColorToken = keyof typeof colors.light;\n${diagramTs(tokens)}`;
}

function displayValue(tokens: readonly Token[], t: Token, mode: Mode): string {
	const raw = t.raw[mode];
	const target = aliasTarget(raw);
	if (t.type === "color") {
		const hex = toHex(resolveColor(tokens, t.path, mode));
		return target !== null ? `\`${hex}\`（= ${cssVarOf(target)}）` : `\`${hex}\``;
	}
	const resolved = resolveValue(tokens, t.path, mode);
	const value = cssValue(t, resolved);
	return target !== null ? `\`${value}\`（= ${cssVarOf(target)}）` : `\`${value}\``;
}

const ROLE_TEXT: Record<string, string> = {
	surface: "面",
	text: "文字",
	graphic: "印",
	state: "状態",
	decorative: "飾り",
};

/** docs/design-tokens.md */
export function tokensDoc(tokens: readonly Token[]): string {
	const results = checkContrast(tokens);
	const out: string[] = [
		"# デザイントークン一覧",
		"",
		`<!-- ${GENERATED} -->`,
		"",
		"ルールは [design.md](design.md)。ここは値の一覧で、`tokens.json` から生成している。",
		"コントラスト比は、そのトークンに書いた面（`contrast.on`）の中で一番低いもの。半透明の面は下の面に重ねて測る（WCAG 2.2 の相対輝度）。",
		"",
		"## 色",
		"",
		"「Vault」の列: ○ は子の Vault が `.kit-local/theme.json` で上書きできる色、「追従」は上書きした元の色に合わせて変わる色（ADR-0121）。「から作る」は、子が元の色を変えてこの色を書かなかったときに、元の色から作る色（ADR-0129）。",
		"",
		"| CSS 変数 | 役割 | Vault | ライト | ダーク | 基準 | 最低の比（ライト / ダーク） | 用途 | 根拠 |",
		"|---|---|---|---|---|---|---|---|---|",
	];
	for (const t of tokens.filter((x) => x.type === "color")) {
		const req = t.contrast ? `${t.contrast.min}:1` : "—";
		const worst = t.contrast
			? MODES.map((m) => {
					const w = worstContrast(results, t.path, m);
					return w ? `${formatRatio(w.ratio)}${w.ok ? "" : " ✗"}` : "—";
				}).join(" / ")
			: "—";
		const usage = [t.description, t.plugin ? "" : "（プラグインでは使わない）", t.obsidian.length ? `Obsidian: ${t.obsidian.map((v) => `\`${v}\``).join(" ")}` : ""]
			.filter(Boolean)
			.join(" ");
		const follows = t.derive ?? aliasTarget(t.raw.light);
		const vault = t.vault ? (t.follow ? `○（書かなければ ${cssVarOf(t.follow.from)} から作る）` : "○") : follows !== null && tokens.find((x) => x.path === follows)?.vault ? `追従（${cssVarOf(follows)}）` : "—";
		out.push(
			`| \`${t.cssVar}\` | ${ROLE_TEXT[t.role ?? ""] ?? "—"} | ${vault} | ${displayValue(tokens, t, "light")} | ${displayValue(tokens, t, "dark")} | ${req} | ${worst} | ${usage} | ${t.source ?? ""} |`,
		);
	}
	const groups = new Map<string, Token[]>();
	for (const t of tokens.filter((x) => x.type !== "color")) {
		const g = t.path.split(".")[0] as string;
		groups.set(g, [...(groups.get(g) ?? []), t]);
	}
	for (const [g, list] of groups) {
		out.push("", `## ${g}`, "", "| CSS 変数 | 値 | 用途 | 根拠 |", "|---|---|---|---|");
		for (const t of list) {
			const dark = JSON.stringify(t.raw.dark) !== JSON.stringify(t.raw.light) ? ` / ダーク ${displayValue(tokens, t, "dark")}` : "";
			out.push(`| \`${t.cssVar}\` | ${displayValue(tokens, t, "light")}${dark} | ${t.description} | ${t.source ?? ""} |`);
		}
	}
	out.push("");
	return out.join("\n");
}
