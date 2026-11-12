/**
 * tokens.json（Design Tokens Format Module 2025.10）を読み、検査して平らな一覧にする。
 * https://www.designtokens.org/tr/2025.10/format/
 *
 * 独自の情報は `$extensions["com.yamayu-pkm"]` に置く:
 * - `dark`: ダークテーマの値（ない場合はライトと同じ）
 * - `role`: 色の役割（surface / text / graphic / state / decorative）
 * - `contrast`: { min, on }。on の各項目は面のトークン、または下から重ねる面の並び
 * - `obsidian`: Obsidian 側で同じ値に固定する CSS 変数（スニペットに出す）
 * - `plugin`: false ならプラグインの CSS には出さない（Obsidian のためだけの値）
 * - `source`: 値の根拠
 * - `vault`: true なら子の Vault が `.kit-local/theme.json` で上書きできる（ADR-0121）
 * - `derive`: 元の色のパス（`{color.on-surface}`）。色相は元の色と同じで、透明度だけを持つ。上書きで元の色が変わると追従する
 */
import { isHex, parseHex, toHex, type Rgba } from "./color.ts";

export const EXT = "com.yamayu-pkm";
export const PREFIX = "--vt-";

export type TokenType = "color" | "dimension" | "number" | "fontWeight" | "duration" | "cubicBezier" | "shadow";
export type ColorRole = "surface" | "text" | "graphic" | "state" | "decorative";
export type Mode = "light" | "dark";
export const MODES: readonly Mode[] = ["light", "dark"];

const TYPES: readonly TokenType[] = ["color", "dimension", "number", "fontWeight", "duration", "cubicBezier", "shadow"];
const ROLES: readonly ColorRole[] = ["surface", "text", "graphic", "state", "decorative"];
const FONT_WEIGHTS: Record<string, number> = { thin: 100, light: 300, normal: 400, regular: 400, medium: 500, bold: 700 };

export interface ContrastRule {
	min: number;
	/** 各項目は下から重ねる面の並び（トークンのパス） */
	on: string[][];
}

export interface Token {
	/** `color.on-surface` のようなパス */
	path: string;
	/** CSS 変数名（`--vt-on-surface`） */
	cssVar: string;
	type: TokenType;
	description: string;
	/** モードごとの生の値（別名は `{...}` のまま） */
	raw: Record<Mode, unknown>;
	role?: ColorRole;
	contrast?: ContrastRule;
	obsidian: string[];
	plugin: boolean;
	source?: string;
	/** 子の Vault が上書きできる（ADR-0121） */
	vault: boolean;
	/** 色相を合わせる元の色のパス（ADR-0121） */
	derive?: string;
}

export class TokenError extends Error {}

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

const ALIAS = /^\{([^{}]+)\}$/;

export function aliasTarget(value: unknown): string | null {
	return typeof value === "string" ? (ALIAS.exec(value)?.[1] ?? null) : null;
}

export function cssVarOf(path: string): string {
	const parts = path.split(".");
	if (parts[0] === "color") parts.shift();
	return PREFIX + parts.join("-");
}

/** tokens.json を読んで平らにする。書式の誤りは TokenError でまとめて報告する */
export function loadTokens(json: unknown): Token[] {
	const errors: string[] = [];
	const tokens: Token[] = [];
	if (!isObject(json)) throw new TokenError("tokens.json の中身がオブジェクトではありません");

	interface Inherited {
		type?: TokenType;
		description?: string;
		source?: string;
	}
	const walk = (node: Record<string, unknown>, path: string[], inherited: Inherited) => {
		const groupType = (node.$type as TokenType | undefined) ?? inherited.type;
		const ext = isObject(node.$extensions) ? node.$extensions[EXT] : undefined;
		const group: Inherited = {
			type: groupType,
			description: path.length > 0 && typeof node.$description === "string" ? node.$description : inherited.description,
			source: isObject(ext) && typeof ext.source === "string" ? ext.source : inherited.source,
		};
		if (node.$type !== undefined && !TYPES.includes(node.$type as TokenType)) {
			errors.push(`${path.join(".")}: 知らない $type「${String(node.$type)}」`);
		}
		for (const [key, child] of Object.entries(node)) {
			if (key.startsWith("$")) continue;
			// 名前に使えない文字（仕様: { } . を含めない）
			if (/[{}.]/.test(key)) errors.push(`${[...path, key].join(".")}: 名前に { } . は使えません`);
			if (!isObject(child)) {
				errors.push(`${[...path, key].join(".")}: グループかトークンのオブジェクトにしてください`);
				continue;
			}
			const childPath = [...path, key];
			if ("$value" in child) tokens.push(readToken(child, childPath, (child.$type as TokenType | undefined) ?? groupType, group, errors));
			else walk(child, childPath, group);
		}
	};
	walk(json, [], {});

	const byPath = new Map(tokens.map((t) => [t.path, t]));
	const names = new Map<string, string>();
	for (const t of tokens) {
		const prev = names.get(t.cssVar);
		if (prev) errors.push(`${t.path}: CSS 変数名 ${t.cssVar} が ${prev} と重なります`);
		names.set(t.cssVar, t.path);
		for (const mode of MODES) {
			const target = aliasTarget(t.raw[mode]);
			if (target !== null) {
				const ref = byPath.get(target);
				if (!ref) errors.push(`${t.path}: 別名の参照先 ${target} がありません`);
				else if (ref.type !== t.type) errors.push(`${t.path}: 別名の参照先 ${target} の型が違います（${ref.type}）`);
			}
		}
		for (const layers of t.contrast?.on ?? []) {
			for (const p of layers) {
				const ref = byPath.get(p);
				if (!ref) errors.push(`${t.path}: contrast.on の ${p} がありません`);
				else if (ref.type !== "color") errors.push(`${t.path}: contrast.on の ${p} は色ではありません`);
			}
		}
	}
	// 別名の循環
	for (const t of tokens) {
		for (const mode of MODES) {
			try {
				resolveRaw(byPath, t.path, mode);
			} catch (e) {
				errors.push((e as Error).message);
			}
		}
	}
	for (const t of tokens) {
		if (t.derive === undefined) continue;
		const ref = byPath.get(t.derive);
		if (!ref || ref.type !== "color") {
			errors.push(`${t.path}: derive の参照先 ${t.derive} がありません（または色ではありません）`);
			continue;
		}
		if (ref.derive !== undefined) errors.push(`${t.path}: derive の参照先 ${t.derive} も derive です（元の色を指してください）`);
	}
	if (errors.length > 0) throw new TokenError(errors.join("\n"));
	for (const t of tokens) {
		if (t.derive === undefined) continue;
		for (const mode of MODES) {
			const own = resolveColor(tokens, t.path, mode);
			const from = resolveColor(tokens, t.derive, mode);
			if (own.r !== from.r || own.g !== from.g || own.b !== from.b) {
				errors.push(`${t.path}: derive の元 ${t.derive}（${mode}）と色相が合いません（${toHex({ ...from, a: 1 })} にする）`);
			}
		}
	}
	// contrast.on の一番下は不透明な色（半透明だと下に何があるかで比が変わる）
	for (const t of tokens) {
		for (const layers of t.contrast?.on ?? []) {
			for (const mode of MODES) {
				if (resolveColor(tokens, layers[0] as string, mode).a < 1) errors.push(`${t.path}: contrast.on の一番下（${layers[0]}、${mode}）は不透明な色にしてください`);
			}
		}
	}
	if (errors.length > 0) throw new TokenError(errors.join("\n"));
	return tokens;
}

function readToken(
	node: Record<string, unknown>,
	path: string[],
	type: TokenType | undefined,
	group: { description?: string; source?: string },
	errors: string[],
): Token {
	const p = path.join(".");
	if (!type || !TYPES.includes(type)) errors.push(`${p}: $type がありません（または知らない型です）`);
	const t = (type ?? "number") as TokenType;
	const ext = isObject(node.$extensions) ? node.$extensions[EXT] : undefined;
	const e = isObject(ext) ? ext : {};
	if (ext !== undefined && !isObject(ext)) errors.push(`${p}: $extensions.${EXT} はオブジェクトにしてください`);
	for (const key of Object.keys(e)) {
		if (!["dark", "role", "contrast", "obsidian", "plugin", "source", "vault", "derive"].includes(key)) errors.push(`${p}: 知らない拡張「${key}」`);
	}
	const light = node.$value;
	const dark = "dark" in e ? e.dark : light;
	validateValue(t, light, `${p}`, errors);
	if ("dark" in e) validateValue(t, dark, `${p}（dark）`, errors);

	const token: Token = {
		path: p,
		cssVar: cssVarOf(p),
		type: t,
		// 説明と根拠がなければ、グループのものを使う（type.label-small.size など）
		description: typeof node.$description === "string" ? node.$description : (group.description ?? ""),
		raw: { light, dark },
		obsidian: [],
		plugin: e.plugin !== false,
		vault: e.vault === true,
	};
	if ("vault" in e) {
		if (typeof e.vault !== "boolean") errors.push(`${p}: vault は true / false にしてください`);
		else if (e.vault && (t !== "color" || aliasTarget(light) !== null || aliasTarget(dark) !== null || "derive" in e)) {
			errors.push(`${p}: vault は、別名でも derive でもない色だけに付けられます`);
		}
	}
	if ("derive" in e) {
		const target = aliasTarget(e.derive);
		if (t !== "color" || target === null) errors.push(`${p}: derive は色に、{path} の別名で書いてください`);
		else token.derive = target;
	}
	if (typeof e.source === "string") token.source = e.source;
	else if (group.source !== undefined) token.source = group.source;
	if ("role" in e) {
		if (t !== "color") errors.push(`${p}: role は色だけに付けられます`);
		if (!ROLES.includes(e.role as ColorRole)) errors.push(`${p}: 知らない role「${String(e.role)}」`);
		token.role = e.role as ColorRole;
	} else if (t === "color" && path[0] === "color") {
		errors.push(`${p}: 色には role を付けてください（${ROLES.join(" / ")}）`);
	}
	if ("contrast" in e) {
		const c = e.contrast;
		if (!isObject(c) || typeof c.min !== "number" || !Array.isArray(c.on)) {
			errors.push(`${p}: contrast は { min: 数, on: [...] } にしてください`);
		} else {
			const on: string[][] = [];
			for (const item of c.on) {
				const layers = (Array.isArray(item) ? item : [item]).map(aliasTarget);
				if (layers.length === 0 || layers.some((l) => l === null)) errors.push(`${p}: contrast.on は {path} の別名で書いてください`);
				else on.push(layers as string[]);
			}
			token.contrast = { min: c.min, on };
		}
	}
	// role ごとに必要なコントラストの下限（WCAG 1.4.3 / 1.4.11）
	if (token.role === "text" || token.role === "graphic") {
		const floor = token.role === "text" ? 4.5 : 3;
		if (!token.contrast) errors.push(`${p}: ${token.role} の色には contrast を書いてください`);
		else if (token.contrast.min < floor) errors.push(`${p}: ${token.role} の contrast.min は ${floor} 以上にしてください`);
	}
	if ("obsidian" in e) {
		if (!Array.isArray(e.obsidian) || e.obsidian.some((v) => typeof v !== "string" || !v.startsWith("--"))) {
			errors.push(`${p}: obsidian は CSS 変数名の配列にしてください`);
		} else token.obsidian = e.obsidian as string[];
	}
	return token;
}

function isDimension(v: unknown, units: readonly string[]): boolean {
	return isObject(v) && typeof v.value === "number" && Number.isFinite(v.value) && units.includes(v.unit as string);
}

function validateValue(type: TokenType, value: unknown, where: string, errors: string[]): void {
	if (aliasTarget(value) !== null) return;
	switch (type) {
		case "color": {
			const err = colorError(value);
			if (err) errors.push(`${where}: ${err}`);
			return;
		}
		case "dimension":
			if (!isDimension(value, ["px", "rem"])) errors.push(`${where}: dimension は { value, unit: "px" | "rem" } にしてください`);
			return;
		case "duration":
			if (!isDimension(value, ["ms", "s"])) errors.push(`${where}: duration は { value, unit: "ms" | "s" } にしてください`);
			return;
		case "number":
			if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${where}: number は数にしてください`);
			return;
		case "fontWeight":
			if (!(typeof value === "number" && value >= 1 && value <= 1000) && !(typeof value === "string" && value in FONT_WEIGHTS)) {
				errors.push(`${where}: fontWeight は 1〜1000 の数か、決まった名前にしてください`);
			}
			return;
		case "cubicBezier":
			if (!Array.isArray(value) || value.length !== 4 || value.some((v) => typeof v !== "number")) {
				errors.push(`${where}: cubicBezier は数 4 つの配列にしてください`);
			} else if ([value[0], value[2]].some((x) => (x as number) < 0 || (x as number) > 1)) {
				errors.push(`${where}: cubicBezier の x は 0〜1 にしてください`);
			}
			return;
		case "shadow": {
			const list = Array.isArray(value) ? value : [value];
			for (const s of list) {
				if (!isObject(s)) {
					errors.push(`${where}: shadow はオブジェクトにしてください`);
					continue;
				}
				for (const k of ["offsetX", "offsetY", "blur", "spread"]) {
					if (!isDimension(s[k], ["px", "rem"])) errors.push(`${where}: shadow の ${k} は dimension にしてください`);
				}
				const err = aliasTarget(s.color) === null ? colorError(s.color) : null;
				if (err) errors.push(`${where}: shadow の color: ${err}`);
			}
			return;
		}
	}
}

/** DTCG の色（srgb）。components と hex が食い違っていないかも見る */
function colorError(value: unknown): string | null {
	if (!isObject(value)) return "色は { colorSpace, components, alpha?, hex? } にしてください";
	if (value.colorSpace !== "srgb") return "colorSpace は srgb だけを使います";
	const comp = value.components;
	if (!Array.isArray(comp) || comp.length !== 3 || comp.some((c) => typeof c !== "number" || c < 0 || c > 1)) {
		return "components は 0〜1 の数 3 つにしてください";
	}
	if (value.alpha !== undefined && (typeof value.alpha !== "number" || value.alpha < 0 || value.alpha > 1)) {
		return "alpha は 0〜1 にしてください";
	}
	if (typeof value.hex !== "string" || !isHex(value.hex) || value.hex.length !== 7) return "hex（#rrggbb）を書いてください";
	const h = parseHex(value.hex);
	const expected = [h.r, h.g, h.b].map((v) => v / 255);
	if (expected.some((v, i) => Math.abs(v - (comp[i] as number)) > 0.5 / 255)) {
		return `components が hex ${value.hex} と合いません（${expected.map((v) => +v.toFixed(4)).join(", ")}）`;
	}
	return null;
}

function resolveRaw(byPath: ReadonlyMap<string, Token>, path: string, mode: Mode, seen: string[] = []): { token: Token; value: unknown } {
	if (seen.includes(path)) throw new TokenError(`別名が循環しています: ${[...seen, path].join(" → ")}`);
	const token = byPath.get(path);
	if (!token) throw new TokenError(`トークン ${path} がありません`);
	const target = aliasTarget(token.raw[mode]);
	if (target === null) return { token, value: token.raw[mode] };
	return resolveRaw(byPath, target, mode, [...seen, path]);
}

/** 別名をたどった実際の値 */
export function resolveValue(tokens: readonly Token[], path: string, mode: Mode): unknown {
	return resolveRaw(new Map(tokens.map((t) => [t.path, t])), path, mode).value;
}

export function colorValue(value: unknown): Rgba {
	const v = value as { hex: string; alpha?: number };
	const c = parseHex(v.hex);
	return { ...c, a: v.alpha ?? 1 };
}

export function resolveColor(tokens: readonly Token[], path: string, mode: Mode): Rgba {
	return colorValue(resolveValue(tokens, path, mode));
}

export function dimensionPx(value: unknown): number {
	const v = value as { value: number; unit: string };
	return v.unit === "rem" ? v.value * 16 : v.value;
}
