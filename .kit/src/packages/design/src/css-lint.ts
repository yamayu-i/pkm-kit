/**
 * プラグインの CSS がデザインルール（docs/design.md）に従っているかを調べる。
 * 値はトークン（tokens.json）から取り、ルールの ID は design.md の「検査の一覧」と対応させる。
 */
import { dimensionPx, resolveValue, type Token } from "./tokens.ts";

export interface CssDecl {
	prop: string;
	value: string;
	important: boolean;
	line: number;
	/** 外側から順に、セレクタと at-rule の前置き */
	context: string[];
}

export interface CssRuleBlock {
	prelude: string;
	line: number;
}

export interface ParsedCss {
	decls: CssDecl[];
	blocks: CssRuleBlock[];
}

/** コメントを空白に置き換える（行番号を保つ） */
function stripComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

/** 宣言とブロックだけを取り出す簡単な構文解析（このリポジトリの CSS で使う範囲） */
export function parseCss(source: string): ParsedCss {
	const text = stripComments(source);
	const decls: CssDecl[] = [];
	const blocks: CssRuleBlock[] = [];
	const stack: string[] = [];
	let buf = "";
	let line = 1;
	let quote: string | null = null;
	let paren = 0;
	let bufLine = 1;
	const flushDecl = () => {
		const s = buf.trim();
		if (s) {
			const i = s.indexOf(":");
			if (i > 0) {
				let value = s.slice(i + 1).trim();
				const important = /!important\s*$/i.test(value);
				if (important) value = value.replace(/!important\s*$/i, "").trim();
				decls.push({ prop: s.slice(0, i).trim().toLowerCase(), value, important, line: bufLine, context: [...stack] });
			}
		}
		buf = "";
	};
	for (let i = 0; i < text.length; i++) {
		const ch = text[i] as string;
		if (buf.trim() === "" && !/\s/.test(ch)) bufLine = line;
		if (ch === "\n") line++;
		if (quote) {
			buf += ch;
			if (ch === quote && text[i - 1] !== "\\") quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			buf += ch;
			continue;
		}
		if (ch === "(") paren++;
		if (ch === ")") paren--;
		if (paren > 0) {
			buf += ch;
			continue;
		}
		if (ch === "{") {
			const prelude = buf.trim().replace(/\s+/g, " ");
			blocks.push({ prelude, line: bufLine });
			stack.push(prelude);
			buf = "";
		} else if (ch === ";") {
			flushDecl();
		} else if (ch === "}") {
			flushDecl();
			stack.pop();
		} else {
			buf += ch;
		}
	}
	return { decls, blocks };
}

export interface LintProblem {
	rule: string;
	line: number;
	message: string;
}

/** ルールの ID と説明。design.md の「検査の一覧」に同じ ID を書く（テストで照合する） */
export const CSS_RULES = {
	"color/no-literal": "色を直接書かない（16 進、rgb() などの関数、色の名前、color-mix()）。トークンを使う",
	"var/known": "var() はトークン、このファイルで定義した --vt- の変数、Obsidian のフォントの変数だけ",
	"var/local": "ファイル内で定義する変数は --vt- で始め、トークンと同じ名前にせず、値はトークン 1 つの var() か数にする",
	"type/font-size": "font-size は文字の役割のトークン（--vt-type-*-size）",
	"type/font-weight": "font-weight はトークン（--vt-weight-* / --vt-type-*-weight）",
	"type/letter-spacing": "letter-spacing はトークン（--vt-type-*-tracking）か normal / 0",
	"type/line-height": "line-height はトークン（--vt-type-*-line-height）か normal / 1",
	"type/font-family": "font-family は inherit か Obsidian のフォントの変数",
	"shape/radius": "角丸はトークン（--vt-radius-*）か 0",
	"space/scale": "余白・位置（padding / margin / gap / inset / outline-offset）は space の値（4px 刻み）",
	"size/grid": "大きさ（width / height / flex-basis / grid の列）の px は 4 の倍数",
	"border/width": "枠線の太さは border-width の値（1px / 2px）",
	"elevation/shadow": "box-shadow は none、elevation のトークン、枠線の代わりの (inset) 0 0 0 (1|2)px var(--vt-*) だけ",
	"state/opacity": "opacity は 0 / 1 / トークン（--vt-opacity-*）。文字を薄くするのに使わない（@keyframes の中は除く）",
	"motion/tokens": "transition / animation の時間と緩急はトークン（--vt-duration-* / --vt-easing-*）",
	"motion/scale": "scale() はトークン（--vt-scale-*）（@keyframes の中は除く）",
	"color/no-filter": "filter / backdrop-filter / mix-blend-mode を使わない（色とコントラストが決まらなくなる）",
	"css/no-important": "!important を使わない",
	"layout/no-viewport-media": "画面の幅・高さの @media を使わない。ペインの幅（@container）で切り替える",
	"layout/container-breakpoint": "@container の幅は breakpoint のトークンの値",
	"a11y/focus-visible": ":focus-visible で --vt-focus-ring の outline を付ける",
	"a11y/no-outline-none": "outline: none / 0 で枠を消さない",
	"a11y/reduced-motion": "transition / animation を使うなら @media (prefers-reduced-motion: reduce) で止める",
} as const;

export type CssRuleId = keyof typeof CSS_RULES;

/** Obsidian 側で決まる（このリポジトリでは固定しない）もののうち、使ってよい変数 */
export const EXTERNAL_VARS = ["--font-interface", "--font-text", "--font-monospace"] as const;

const NAMED_COLORS =
	"aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(
		" ",
	);
const NAMED_COLOR_RE = new RegExp(`(^|[\\s,(])(${NAMED_COLORS.join("|")})(?=$|[\\s,)])`, "i");
const COLOR_PROPS = /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|text-decoration(-color)?|column-rule(-color)?|--.*)$/;
const VAR_RE = /var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)/g;
const PX_RE = /(-?\d*\.?\d+)px\b/g;

const SPACE_PROPS = /^(padding|margin)(-(top|right|bottom|left|block|inline)(-(start|end))?)?$|^(gap|row-gap|column-gap|inset|top|right|bottom|left|outline-offset)$/;
const SIZE_PROPS = /^((min-|max-)?(width|height)|flex-basis|grid-template-(columns|rows)|grid-auto-(columns|rows))$/;
const BORDER_PROPS = /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|outline(-width)?)$/;
const RADIUS_PROPS = /^border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius$/;

function withoutVars(value: string): string {
	return value.replace(VAR_RE, " VAR ");
}

function varsIn(value: string): string[] {
	return [...value.matchAll(VAR_RE)].map((m) => m[1] as string);
}

/** 値を空白とカンマで区切る（関数の中は区切らない） */
function parts(value: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let cur = "";
	for (const ch of value) {
		if (ch === "(") depth++;
		if (ch === ")") depth--;
		if (depth === 0 && (ch === " " || ch === "," || ch === "/")) {
			if (cur) out.push(cur);
			cur = "";
		} else cur += ch;
	}
	if (cur) out.push(cur);
	return out;
}

export interface LintContext {
	tokens: readonly Token[];
}

export function lintCss(source: string, { tokens }: LintContext): LintProblem[] {
	const problems: LintProblem[] = [];
	const add = (rule: CssRuleId, line: number, message: string) => problems.push({ rule, line, message: `${CSS_RULES[rule]}: ${message}` });
	const { decls, blocks } = parseCss(source);

	const own = tokens.filter((t) => t.plugin);
	const tokenVars = new Set(own.map((t) => t.cssVar));
	const group = (g: string) => own.filter((t) => t.path.startsWith(`${g}.`));
	const pxSet = (g: string) => new Set(group(g).map((t) => dimensionPx(resolveValue(tokens, t.path, "light"))));
	const space = pxSet("space");
	const borders = pxSet("border-width");
	const breakpoints = pxSet("breakpoint");
	const gridToken = tokens.find((t) => t.path === "size.grid");
	const grid = gridToken ? dimensionPx(resolveValue(tokens, gridToken.path, "light")) : 4;

	const localVars = new Set(decls.filter((d) => d.prop.startsWith("--")).map((d) => d.prop));
	const isVar = (v: string, re: RegExp) => {
		const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(v);
		return m !== null && re.test(m[1] as string) && tokenVars.has(m[1] as string);
	};
	const inKeyframes = (d: CssDecl) => d.context.some((c) => /^@(-\w+-)?keyframes\b/.test(c));

	for (const d of decls) {
		const { prop, value, line } = d;
		const plain = withoutVars(value);

		if (d.important) add("css/no-important", line, `${prop}: ${value} !important`);

		// 色
		if (/#[0-9a-f]{3,8}\b/i.test(plain) || /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i.test(plain)) {
			add("color/no-literal", line, `${prop}: ${value}`);
		} else if (COLOR_PROPS.test(prop) && NAMED_COLOR_RE.test(plain)) {
			add("color/no-literal", line, `${prop}: ${value}`);
		}

		// 変数
		for (const v of varsIn(value)) {
			if (!tokenVars.has(v) && !localVars.has(v) && !(EXTERNAL_VARS as readonly string[]).includes(v)) {
				add("var/known", line, `${v} はトークンではありません`);
			}
		}
		if (prop.startsWith("--")) {
			if (!prop.startsWith("--vt-")) add("var/local", line, `${prop}`);
			else if (tokenVars.has(prop)) add("var/local", line, `${prop} はトークンと同じ名前です（トークンを上書きしない）`);
			// 値はトークン 1 つの var() か、数（列の数など。TSX の style からも渡す）
			else if (!/^\d+$/.test(value) && (!/^var\(\s*--vt-[\w-]+\s*\)$/.test(value) || !tokenVars.has(varsIn(value)[0] as string))) {
				add("var/local", line, `${prop}: ${value}`);
			}
		}

		// 文字
		if (prop === "font-size" && value !== "inherit" && !isVar(value, /^--vt-type-[\w-]+-size$/)) add("type/font-size", line, value);
		if (prop === "font-weight" && value !== "inherit" && !isVar(value, /^--vt-(weight-[\w-]+|type-[\w-]+-weight)$/)) {
			add("type/font-weight", line, value);
		}
		if (prop === "letter-spacing" && !["normal", "0"].includes(value) && !isVar(value, /^--vt-type-[\w-]+-tracking$/)) {
			add("type/letter-spacing", line, value);
		}
		if (prop === "line-height" && !["normal", "inherit", "1"].includes(value) && !isVar(value, /^--vt-type-[\w-]+-line-height$/)) {
			add("type/line-height", line, value);
		}
		if (prop === "font-family" && value !== "inherit" && !EXTERNAL_VARS.some((v) => value === `var(${v})`)) add("type/font-family", line, value);
		if (prop === "font") add("type/font-size", line, "font の一括指定は使わない");

		// 形
		if (RADIUS_PROPS.test(prop)) {
			for (const p of parts(value)) {
				if (p !== "0" && p !== "inherit" && !isVar(p, /^--vt-radius-[\w-]+$/)) add("shape/radius", line, `${prop}: ${value}`);
			}
		}

		// 余白
		if (SPACE_PROPS.test(prop)) {
			for (const p of parts(value)) {
				if (["0", "auto", "inherit"].includes(p) || /%$/.test(p) || isVar(p, /^--vt-space-[\w-]+$/)) continue;
				const m = /^(-?\d*\.?\d+)px$/.exec(p);
				if (!m || !space.has(Math.abs(Number(m[1])))) add("space/scale", line, `${prop}: ${value}（使える値: ${[...space].join(" / ")}px）`);
			}
		}

		// 大きさ
		if (SIZE_PROPS.test(prop)) {
			for (const m of plain.matchAll(PX_RE)) {
				if (Number(m[1]) % grid !== 0) add("size/grid", line, `${prop}: ${value}`);
			}
		}

		// 枠線
		if (BORDER_PROPS.test(prop)) {
			if (prop.startsWith("outline") && /^(none|0)\b/.test(value)) add("a11y/no-outline-none", line, `${prop}: ${value}`);
			for (const m of plain.matchAll(PX_RE)) {
				if (Number(m[1]) !== 0 && !borders.has(Number(m[1]))) add("border/width", line, `${prop}: ${value}`);
			}
		}

		// 影
		if (prop === "box-shadow" && value !== "none") {
			for (const layer of value.split(/,(?![^(]*\))/).map((s) => s.trim())) {
				if (isVar(layer, /^--vt-elevation-[\w-]+$/)) continue;
				// 枠線の代わり（内側）と、選んだものの輪（外側）
				const m = /^(?:inset )?0 0 0 (\d+)px (var\(--vt-[\w-]+\))$/.exec(layer);
				if (m && borders.has(Number(m[1])) && isVar(m[2] as string, /^--vt-/)) continue;
				add("elevation/shadow", line, layer);
			}
		}

		// 不透明度
		if (prop === "opacity" && !inKeyframes(d) && !["0", "1"].includes(value) && !isVar(value, /^--vt-opacity-[\w-]+$/)) {
			add("state/opacity", line, value);
		}

		// 動き
		if (/^(transition|animation)(-duration|-timing-function|-delay)?$/.test(prop) && value !== "none") {
			if (/(^|[\s,])-?\d*\.?\d+m?s\b/.test(plain)) add("motion/tokens", line, `${prop}: ${value}（時間は --vt-duration-*）`);
			if (/\b(ease|ease-in|ease-out|ease-in-out|step-start|step-end)\b|\b(cubic-bezier|steps)\(/.test(plain)) {
				add("motion/tokens", line, `${prop}: ${value}（緩急は --vt-easing-*）`);
			}
			for (const v of varsIn(value)) {
				if (!/^--vt-(duration|easing)-/.test(v)) add("motion/tokens", line, `${prop} に ${v} は使えません`);
			}
		}
		if (prop === "transform" && !inKeyframes(d)) {
			for (const m of value.matchAll(/\bscale[XYZ3d]*\((var\([^)]*\)|[^)]*)\)/g)) {
				if (!isVar((m[1] as string).trim(), /^--vt-scale-[\w-]+$/)) add("motion/scale", line, value);
			}
		}

		if (/^(filter|backdrop-filter|mix-blend-mode)$/.test(prop) && !["none", "normal"].includes(value)) add("color/no-filter", line, `${prop}: ${value}`);
	}

	for (const b of blocks) {
		if (/^@media\b/.test(b.prelude) && /\b(min-|max-)?(device-)?(width|height|aspect-ratio)\b/.test(b.prelude)) {
			add("layout/no-viewport-media", b.line, b.prelude);
		}
		if (/^@container\b/.test(b.prelude)) {
			for (const m of b.prelude.matchAll(PX_RE)) {
				if (!breakpoints.has(Number(m[1]))) add("layout/container-breakpoint", b.line, `${b.prelude}（使える値: ${[...breakpoints].join(" / ")}px）`);
			}
		}
	}

	const focus = decls.filter((d) => d.context.some((c) => c.includes(":focus-visible")));
	if (!focus.some((d) => d.prop.startsWith("outline") && d.value.includes("var(--vt-focus-ring)"))) {
		add("a11y/focus-visible", 1, ":focus-visible のルールがありません");
	}
	const moves = decls.some((d) => /^(transition|animation)$/.test(d.prop) && d.value !== "none");
	const reduced = blocks.some((b) => /^@media\b.*prefers-reduced-motion:\s*reduce/.test(b.prelude));
	if (moves && !reduced) add("a11y/reduced-motion", 1, "@media (prefers-reduced-motion: reduce) がありません");

	return problems.sort((a, b) => a.line - b.line);
}
