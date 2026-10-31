/** トークンに書いたコントラストの条件（$extensions.contrast）を、ライト / ダークの両方で確かめる */
import { contrastRatio, stack } from "./color.ts";
import { MODES, resolveColor, type Mode, type Token } from "./tokens.ts";

export interface ContrastResult {
	token: string;
	mode: Mode;
	/** 下から重ねた面 */
	on: string[];
	ratio: number;
	min: number;
	ok: boolean;
}

export function checkContrast(tokens: readonly Token[]): ContrastResult[] {
	const results: ContrastResult[] = [];
	for (const t of tokens) {
		if (!t.contrast) continue;
		for (const mode of MODES) {
			for (const layers of t.contrast.on) {
				const bg = stack(layers.map((p) => resolveColor(tokens, p, mode)));
				const ratio = contrastRatio(resolveColor(tokens, t.path, mode), bg);
				results.push({ token: t.path, mode, on: layers, ratio, min: t.contrast.min, ok: ratio >= t.contrast.min });
			}
		}
	}
	return results;
}

/** トークンごと・モードごとの一番低い比 */
export function worstContrast(results: readonly ContrastResult[], token: string, mode: Mode): ContrastResult | undefined {
	return results.filter((r) => r.token === token && r.mode === mode).sort((a, b) => a.ratio - b.ratio)[0];
}
