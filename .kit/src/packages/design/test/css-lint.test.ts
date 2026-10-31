import { describe, expect, it } from "vitest";
import { readTokens } from "../node/build.ts";
import { lintCss, parseCss, type CssRuleId } from "../src/css-lint.ts";

const tokens = readTokens();
const FOOTER = `
.x:focus-visible { outline: 2px solid var(--vt-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .x { transition: none; } }
`;
const rules = (css: string) => lintCss(css + FOOTER, { tokens }).map((p) => p.rule);

describe("parseCss", () => {
	it("宣言・文脈・行番号を取る", () => {
		const { decls, blocks } = parseCss(`/* c; } */\n.a {\n  color: red;\n  content: "a;b";\n}\n@media x { .b { gap: 4px } }`);
		expect(decls.map((d) => [d.prop, d.value, d.line])).toEqual([
			["color", "red", 3],
			["content", '"a;b"', 4],
			["gap", "4px", 6],
		]);
		expect(decls[2]?.context).toEqual(["@media x", ".b"]);
		expect(blocks.map((b) => b.prelude)).toEqual([".a", "@media x", ".b"]);
	});
});

describe("lintCss", () => {
	it("ルールに沿った CSS は問題なし", () => {
		const ok = `
.a {
	--vt-dot: var(--vt-green);
	color: var(--vt-on-surface);
	background: var(--vt-surface-container);
	border: 1px solid var(--vt-outline);
	border-radius: var(--vt-radius-m);
	padding: 8px 12px;
	margin-left: -8px;
	gap: 4px 12px;
	width: 36px;
	grid-template-columns: 52px minmax(0, 1fr) auto 20px;
	font-size: var(--vt-type-label-small-size);
	font-weight: var(--vt-weight-medium);
	letter-spacing: var(--vt-type-label-small-tracking);
	line-height: 1;
	font-family: var(--font-monospace);
	box-shadow: inset 0 0 0 1px var(--vt-outline);
	opacity: var(--vt-opacity-disabled);
	transition: background-color var(--vt-duration-short3) var(--vt-easing-standard);
	transform: scale(var(--vt-scale-press-small));
	background: var(--vt-dot);
}
.b { box-shadow: var(--vt-elevation-1), inset 0 0 0 2px var(--vt-red); }
@container (max-width: 480px) { .a { flex: none; } }
@keyframes p { 50% { opacity: 0.35; transform: scale(0.7); } }
`;
		expect(lintCss(ok + FOOTER, { tokens })).toEqual([]);
	});

	const cases: [string, string, CssRuleId][] = [
		["16 進の色", ".a { color: #fff; }", "color/no-literal"],
		["rgba()", ".a { box-shadow: 0 1px 2px rgba(0,0,0,.1); }", "color/no-literal"],
		["color-mix()", ".a { background: color-mix(in srgb, var(--vt-primary) 10%, transparent); }", "color/no-literal"],
		["色の名前", ".a { border-color: white; }", "color/no-literal"],
		["知らない変数", ".a { color: var(--text-normal); }", "var/known"],
		["トークンの上書き", ".a { --vt-primary: var(--vt-red); }", "var/local"],
		["ローカル変数に直接の値", ".a { --vt-dot: 4px; }", "var/local"],
		["px の font-size", ".a { font-size: 12px; }", "type/font-size"],
		["em の font-size", ".a { font-size: 1.6em; }", "type/font-size"],
		["数の font-weight", ".a { font-weight: 600; }", "type/font-weight"],
		["em の字間", ".a { letter-spacing: 0.06em; }", "type/letter-spacing"],
		["行の高さ", ".a { line-height: 1.3; }", "type/line-height"],
		["フォントの直書き", ".a { font-family: sans-serif; }", "type/font-family"],
		["角丸の直書き", ".a { border-radius: 4px; }", "shape/radius"],
		["50% の角丸", ".a { border-radius: 50%; }", "shape/radius"],
		["4px 刻みでない余白", ".a { padding: 6px; }", "space/scale"],
		["4px 刻みでない gap", ".a { gap: 10px; }", "space/scale"],
		["4 の倍数でない大きさ", ".a { height: 26px; }", "size/grid"],
		["太い枠線", ".a { border: 3px solid var(--vt-outline); }", "border/width"],
		["影の直書き", ".a { box-shadow: 0 1px 2px var(--vt-outline); }", "elevation/shadow"],
		["文字を薄くする opacity", ".a { opacity: 0.7; }", "state/opacity"],
		["時間の直書き", ".a { transition: opacity 120ms var(--vt-easing-standard); }", "motion/tokens"],
		["ease", ".a { transition: opacity var(--vt-duration-short3) ease; }", "motion/tokens"],
		["scale の直書き", ".a { transform: scale(0.94); }", "motion/scale"],
		["filter", ".a { filter: brightness(0.96); }", "color/no-filter"],
		["!important", ".a { gap: 4px !important; }", "css/no-important"],
		["画面幅の @media", "@media (max-width: 600px) { .a { gap: 4px; } }", "layout/no-viewport-media"],
		["トークンにない幅の @container", "@container (max-width: 500px) { .a { gap: 4px; } }", "layout/container-breakpoint"],
		["outline: none", ".a { outline: none; }", "a11y/no-outline-none"],
	];
	for (const [name, css, rule] of cases) {
		it(`見つける: ${name}`, () => {
			expect(rules(css)).toContain(rule);
		});
	}

	it(":focus-visible と prefers-reduced-motion がないと見つける", () => {
		const problems = lintCss(".a { transition: opacity var(--vt-duration-short3) var(--vt-easing-standard); }", { tokens }).map((p) => p.rule);
		expect(problems).toContain("a11y/focus-visible");
		expect(problems).toContain("a11y/reduced-motion");
	});
});
