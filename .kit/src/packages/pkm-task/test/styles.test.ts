import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = fileURLToPath(new URL("../styles.css", import.meta.url));

/** Obsidian が Live Preview で Properties 欄を表示するルール（app.css） */
const OBSIDIAN_SHOW_PROPERTIES = ".markdown-source-view.is-live-preview.show-properties .metadata-container:not(.mod-error)";

/** class だけのセレクタの詳細度（:has() と :not() の中の class も数える） */
function classSpecificity(selector: string): number {
	return selector.match(/\.[\w-]+/g)?.length ?? 0;
}

describe("画面のヘッダーがあるときの Properties 欄", () => {
	it("Obsidian の表示ルールより詳細度の高いルールで隠す", () => {
		const hidden = [...readFileSync(stylesPath, "utf8").matchAll(/([^{}]*:has\(\.vt-header\)[^{}]*\.metadata-container[^{}]*)\{\s*display:\s*none;/g)];
		expect(hidden).toHaveLength(1);
		const selector = hidden[0]?.[1]?.replace(/\/\*[\s\S]*?\*\//g, "").trim() ?? "";
		expect(classSpecificity(selector)).toBeGreaterThan(classSpecificity(OBSIDIAN_SHOW_PROPERTIES));
	});
});
