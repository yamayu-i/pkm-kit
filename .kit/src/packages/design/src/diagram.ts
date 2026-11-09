/**
 * 図の配色（ADR-0102）。トークンから、図の役割ごとの色を決める。
 * - Mermaid: Obsidian のスニペット（pkm-theme.css）に CSS を足す（本文の中の SVG なので CSS が効く）
 * - SVG（AI が書く）・D2: generated/tokens.ts の `diagram` を pkm-diagram の CLI が読み、スタイルとテーマを作る
 * AI は色の値を書かず、ここの色の名前（DIAGRAM_COLORS）だけを使う
 */
import { toHex } from "./color.ts";
import { MODES, resolveColor, type Mode, type Token } from "./tokens.ts";

/** 図で使える色の名前。トークンの `<名前>`・`<名前>-container`・`on-<名前>-container` を使う */
export const DIAGRAM_COLORS = ["blue", "green", "purple", "gray", "sky", "pink", "red", "amber"] as const;
export type DiagramColor = (typeof DIAGRAM_COLORS)[number];

/** 色の付かない要素の役割と、使うトークン */
const NEUTRAL = {
	/** 文字 */
	text: "color.on-surface",
	/** 補助の文字（辺のラベル） */
	muted: "color.on-surface-variant",
	/** ノードの面 */
	nodeFill: "color.surface",
	/** ノードの枠 */
	nodeStroke: "color.outline",
	/** グループの面 */
	groupFill: "color.surface-container",
	/** グループの枠 */
	groupStroke: "color.outline",
	/** 辺と矢印 */
	edge: "color.on-surface-variant",
	/** ラベルの背景（辺のラベルを線から浮かせる） */
	labelBg: "color.surface",
} as const;

export type NeutralRole = keyof typeof NEUTRAL;

export interface DiagramSwatch {
	/** 面 */
	fill: string;
	/** 枠・線 */
	stroke: string;
	/** 面の上の文字 */
	text: string;
}

export interface DiagramPalette {
	neutral: Record<NeutralRole, string>;
	colors: Record<DiagramColor, DiagramSwatch>;
}

export function diagramPalette(tokens: readonly Token[], mode: Mode): DiagramPalette {
	const hex = (path: string) => toHex(resolveColor(tokens, path, mode));
	const neutral = Object.fromEntries(Object.entries(NEUTRAL).map(([role, path]) => [role, hex(path)])) as Record<NeutralRole, string>;
	const colors = Object.fromEntries(
		DIAGRAM_COLORS.map((name) => [name, { fill: hex(`color.${name}-container`), stroke: hex(`color.${name}`), text: hex(`color.on-${name}-container`) }]),
	) as Record<DiagramColor, DiagramSwatch>;
	return { neutral, colors };
}

/**
 * Obsidian が描く Mermaid の色を、図の配色に揃える CSS（pkm-theme.css に足す）。
 * Mermaid は SVG の中に id 付きのセレクタで色を書くので、!important で上書きする。
 * 色は `A:::blue` / `class A blue`（classDef は要らない）で付ける
 */
export function mermaidCss(tokens: readonly Token[]): string {
	const lines = ["", "/* Mermaid の図の色を、図の配色（ADR-0102）に揃える。色は A:::blue か class A blue で付ける */"];
	const rule = (selectors: string[], decls: Record<string, string>) => {
		lines.push(`${selectors.join(",\n")} {`);
		for (const [k, v] of Object.entries(decls)) lines.push(`\t${k}: ${v} !important;`);
		lines.push("}");
	};
	for (const mode of MODES) {
		const p = diagramPalette(tokens, mode);
		const at = (s: string) => `body.theme-${mode} .mermaid ${s}`;
		const shapes = (scope: string) => ["rect", "circle", "ellipse", "polygon", "path.basic", ".label-container"].map((s) => at(`${scope} ${s}`));
		lines.push("");
		rule(shapes(".node"), { fill: p.neutral.nodeFill, stroke: p.neutral.nodeStroke });
		rule([at(".node .nodeLabel"), at(".node .label"), at(".node text")], { color: p.neutral.text, fill: p.neutral.text });
		rule([at(".cluster rect"), at(".cluster polygon")], { fill: p.neutral.groupFill, stroke: p.neutral.groupStroke });
		rule([at(".cluster .nodeLabel"), at(".cluster-label"), at(".cluster text")], { color: p.neutral.text, fill: p.neutral.text });
		rule([at(".flowchart-link"), at(".edgePath .path"), at(".messageLine0"), at(".messageLine1"), at(".transition")], { stroke: p.neutral.edge });
		rule([at("marker path"), at(".arrowheadPath"), at(".arrowMarkerPath"), at("#arrowhead path")], { fill: p.neutral.edge, stroke: p.neutral.edge });
		rule([at(".edgeLabel"), at(".edgeLabel p"), at(".edgeLabel span"), at(".labelBkg")], { color: p.neutral.muted, "background-color": p.neutral.labelBg });
		rule([at(".edgeLabel rect")], { fill: p.neutral.labelBg });
		rule([at(".actor"), at(".statediagram-state rect"), at(".stateGroup rect")], { fill: p.neutral.nodeFill, stroke: p.neutral.nodeStroke });
		rule([at(".messageText"), at("text.actor > tspan"), at(".noteText")], { fill: p.neutral.text });
		rule([at(".note")], { fill: p.colors.amber.fill, stroke: p.colors.amber.stroke });
		for (const name of DIAGRAM_COLORS) {
			const c = p.colors[name];
			rule([...shapes(`.node.${name}`), at(`.cluster.${name} rect`), at(`.cluster.${name} polygon`)], { fill: c.fill, stroke: c.stroke });
			rule([at(`.node.${name} .nodeLabel`), at(`.node.${name} text`), at(`.cluster.${name} .nodeLabel`), at(`.cluster.${name} text`)], { color: c.text, fill: c.text });
		}
	}
	lines.push("");
	return lines.join("\n");
}

/** generated/tokens.ts に入れる図の配色 */
export function diagramTs(tokens: readonly Token[]): string {
	const body = MODES.map((mode) => `\t${mode}: ${JSON.stringify(diagramPalette(tokens, mode))},`).join("\n");
	return `\n/** 図の配色（ADR-0102。design/src/diagram.ts） */\nexport const diagram = {\n${body}\n} as const;\n\nexport const diagramColors = ${JSON.stringify(DIAGRAM_COLORS)} as const;\n`;
}
