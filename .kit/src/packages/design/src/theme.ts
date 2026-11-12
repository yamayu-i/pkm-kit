/**
 * 子の Vault の基本の色（ADR-0121）。`.kit-local/theme.json` の上書きを上流のトークンに重ね、
 * デザイン規約（contrast と面の段差）を確かめて、子のスニペット pkm-theme-local.css を作る。
 * Node の API を使わない（ファイルの読み書きは node/theme-cli.ts）
 */
import { formatRatio, parseHex, relativeLuminance, toHex } from "./color.ts";
import { diagramPalette, mermaidCss } from "./diagram.ts";
import { containerOf, lightenUntil, onColorOf } from "./primary.ts";
import { checkContrast } from "./contrast.ts";
import { aliasTarget, MODES, resolveColor, type Mode, type Token } from "./tokens.ts";

/** 子の設定（Vault のルートから） */
export const THEME_FILE = ".kit-local/theme.json";
/** 子のスニペットの名前（appearance.json の enabledCssSnippets に入れる） */
export const LOCAL_SNIPPET_NAME = "pkm-theme-local";
export const LOCAL_SNIPPET_FILE = `.obsidian/snippets/${LOCAL_SNIPPET_NAME}.css`;

const MODE_TEXT: Record<Mode, string> = { light: "ライト", dark: "ダーク" };

/** モードごとに、色の名前（`primary`。color. を省く）→ `#rrggbb` */
export type VaultTheme = Record<Mode, Record<string, string>>;

const nameOf = (path: string) => path.replace(/^color\./, "");

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 子が上書きできる色の名前 */
export function vaultColorNames(tokens: readonly Token[]): string[] {
	return tokens.filter((t) => t.vault).map((t) => nameOf(t.path));
}

/** theme.json を読む。誤りは文で返す（1 つでもあれば使わない） */
export function parseTheme(json: unknown, tokens: readonly Token[]): { theme: VaultTheme; errors: string[] } {
	const theme: VaultTheme = { light: {}, dark: {} };
	const errors: string[] = [];
	if (!isObject(json)) return { theme, errors: [`${THEME_FILE}: 中身を { "light": { ... }, "dark": { ... } } のオブジェクトにしてください`] };
	const allowed = new Set(vaultColorNames(tokens));
	for (const [key, value] of Object.entries(json)) {
		if (key === "$comment") continue;
		if (!(MODES as readonly string[]).includes(key)) {
			errors.push(`${THEME_FILE}: 知らないキー「${key}」（light / dark だけ）`);
			continue;
		}
		if (!isObject(value)) {
			errors.push(`${THEME_FILE}: ${key} は { "色の名前": "#rrggbb" } にしてください`);
			continue;
		}
		for (const [name, hex] of Object.entries(value)) {
			if (!allowed.has(name)) {
				errors.push(`${THEME_FILE}: ${key}.${name} は上書きできません（上書きできるのは ${[...allowed].join(", ")}）`);
				continue;
			}
			if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) {
				errors.push(`${THEME_FILE}: ${key}.${name} は不透明な #rrggbb で書いてください（${JSON.stringify(hex)}）`);
				continue;
			}
			theme[key as Mode][name] = hex.toLowerCase();
		}
	}
	return { theme, errors };
}

function colorJson(hex: string, alpha?: number): Record<string, unknown> {
	const c = parseHex(hex);
	const components = [c.r, c.g, c.b].map((v) => +(v / 255).toFixed(4));
	return { colorSpace: "srgb", components, ...(alpha === undefined || alpha >= 1 ? {} : { alpha }), hex };
}

/** 上書きを vault の色に重ねる（derive と follow はまだ） */
function withOverrides(tokens: readonly Token[], theme: VaultTheme): Token[] {
	return tokens.map((t) => {
		if (!t.vault) return t;
		const raw = { ...t.raw };
		for (const mode of MODES) {
			const hex = theme[mode][nameOf(t.path)];
			if (hex !== undefined) raw[mode] = colorJson(hex);
		}
		return { ...t, raw };
	});
}

/** derive の色を元の色に追従させる（透明度は自分のもの） */
function withDerived(out: readonly Token[]): Token[] {
	return out.map((t) => {
		if (t.derive === undefined) return t;
		const raw = { ...t.raw };
		for (const mode of MODES) {
			const from = resolveColor(out, t.derive, mode);
			const own = resolveColor(out, t.path, mode);
			raw[mode] = colorJson(toHex({ ...from, a: 1 }), (t.raw[mode] as { alpha?: number }).alpha ?? own.a);
		}
		return { ...t, raw };
	});
}

/** follow の作り方（tokens.ts の FOLLOW_RULES） */
function followValue(tokens: readonly Token[], t: Token & { follow: NonNullable<Token["follow"]> }, mode: Mode): string {
	const from = resolveColor(tokens, t.follow.from, mode);
	switch (t.follow.rule) {
		case "container":
			return toHex(containerOf(resolveColor(tokens, "color.surface", mode), from));
		case "on-container":
			return toHex(resolveColor(tokens, "color.on-surface", mode));
		case "on-color":
			return toHex(onColorOf(from, resolveColor(tokens, "color.on-surface", "light")));
	}
}

const cloneTheme = (theme: VaultTheme): VaultTheme => ({ light: { ...theme.light }, dark: { ...theme.dark } });

/** 元の色を上書きしたモードで、書いていない follow の色を作って足す */
function fillFollow(tokens: readonly Token[], theme: VaultTheme, mode: Mode): void {
	const base = withOverrides(tokens, theme);
	for (const t of tokens) {
		if (t.follow === undefined) continue;
		const name = nameOf(t.path);
		if (theme[mode][nameOf(t.follow.from)] === undefined || theme[mode][name] !== undefined) continue;
		theme[mode][name] = followValue(base, t as Token & { follow: NonNullable<Token["follow"]> }, mode);
	}
}

const PRIMARY = "primary";

/**
 * theme.json に書いていない色を足した設定（ADR-0129）。
 * - ライトの primary だけなら、ダークの primary は、ライトを白に寄せて、ダークの primary と on-primary が規約を満たす最初の色
 * - primary を変えたモードでは、書いていない follow の色（secondary-container など）を primary から作る
 */
export function completeTheme(tokens: readonly Token[], theme: VaultTheme): VaultTheme {
	const out = cloneTheme(theme);
	const light = out.light[PRIMARY];
	if (light !== undefined && out.dark[PRIMARY] === undefined) {
		const dark = lightenUntil(parseHex(light), (c) => {
			const trial = cloneTheme(out);
			trial.dark[PRIMARY] = toHex(c);
			fillFollow(tokens, trial, "dark");
			const themed = withDerived(withOverrides(tokens, trial));
			return checkContrast(themed).every((r) => r.ok || r.mode !== "dark" || (r.token !== `color.${PRIMARY}` && r.token !== "color.on-primary"));
		});
		out.dark[PRIMARY] = toHex(dark);
	}
	for (const mode of MODES) fillFollow(tokens, out, mode);
	return out;
}

/** completeTheme が作った色の名前（tokens.json の順） */
export function madeColors(tokens: readonly Token[], theme: VaultTheme): Record<Mode, string[]> {
	const full = completeTheme(tokens, theme);
	const names = tokens.filter((t) => t.vault).map((t) => nameOf(t.path));
	const made = (mode: Mode) => names.filter((n) => theme[mode][n] === undefined && full[mode][n] !== undefined);
	return { light: made("light"), dark: made("dark") };
}

/** 上流のトークンに上書きを重ねた新しい一覧（元の一覧は変えない）。書いていない色を作り（ADR-0129）、derive の色は元の色に追従させる */
export function applyTheme(tokens: readonly Token[], theme: VaultTheme): Token[] {
	return withDerived(withOverrides(tokens, completeTheme(tokens, theme)));
}

/** 面の明るさの段差（design.md の役割）。ライトでは奥ほど暗く、ダークでは奥ほど明るい */
const SURFACE_STEPS = ["color.surface", "color.surface-container", "color.surface-container-high"];

/** 規約に合わないところを文で返す（空なら使ってよい） */
export function checkTheme(tokens: readonly Token[]): string[] {
	const problems: string[] = [];
	for (const r of checkContrast(tokens)) {
		if (r.ok) continue;
		problems.push(`コントラスト不足: ${nameOf(r.token)}（${MODE_TEXT[r.mode]}）on ${r.on.map(nameOf).join(" + ")} = ${formatRatio(r.ratio)} < ${r.min}`);
	}
	for (const mode of MODES) {
		const lum = SURFACE_STEPS.map((p) => relativeLuminance(resolveColor(tokens, p, mode)));
		for (let i = 1; i < lum.length; i++) {
			const prev = lum[i - 1] as number;
			const cur = lum[i] as number;
			const ok = mode === "light" ? cur <= prev : cur >= prev;
			if (!ok) {
				problems.push(
					`面の段差（${MODE_TEXT[mode]}）: ${nameOf(SURFACE_STEPS[i] as string)} は ${nameOf(SURFACE_STEPS[i - 1] as string)} より${mode === "light" ? "暗く" : "明るく"}してください`,
				);
			}
		}
	}
	return problems;
}

/** Obsidian の accentColor（ライトの primary） */
export function themeAccent(tokens: readonly Token[]): string {
	return toHex(resolveColor(tokens, "color.primary", "light"));
}

/**
 * 子のスニペット。上流の値から変わった色だけを書く。セレクタは、プラグインの `body` / `body.theme-dark` と
 * pkm-theme.css の `body.theme-*` より強くして、読み込み順に頼らない
 */
export function themeSnippet(base: readonly Token[], themed: readonly Token[]): string {
	const lines = [
		`/* 生成物。手で編集しない。正本は ${THEME_FILE}（node .kit/bin/theme.mjs build で作り直す） */`,
		"/* 子の Vault の基本の色（.kit/src/docs/adr/0121-vault-theme.md）。上流の値から変わった色だけを書く */",
	];
	for (const mode of MODES) {
		const body: string[] = [];
		for (const t of themed) {
			if (t.type !== "color") continue;
			const now = toHex(resolveColor(themed, t.path, mode));
			if (now === toHex(resolveColor(base, t.path, mode))) continue;
			// 別名は var() で元の色に追従する
			if (t.plugin && aliasTarget(t.raw[mode]) === null) body.push(`\t${t.cssVar}: ${now};`);
			for (const name of t.obsidian) body.push(`\t${name}: ${now};`);
		}
		if (body.length > 0) lines.push("", `html body.theme-${mode} {`, ...body, "}");
	}
	// Mermaid の配色は pkm-theme.css に値で書いてあるので、変わったモードだけ上書き後の値で書き直す（ADR-0129）
	const mermaidModes = MODES.filter((mode) => JSON.stringify(diagramPalette(base, mode)) !== JSON.stringify(diagramPalette(themed, mode)));
	if (mermaidModes.length > 0) lines.push(mermaidCss(themed, { root: "html body", modes: mermaidModes }).replace(/\n$/, ""));
	lines.push("");
	return lines.join("\n");
}
