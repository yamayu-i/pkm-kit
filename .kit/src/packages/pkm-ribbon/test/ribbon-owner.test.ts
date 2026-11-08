import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packages = fileURLToPath(new URL("../../", import.meta.url));

function sources(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return name === "node_modules" ? [] : sources(path);
		return /\.(ts|tsx)$/.test(name) ? [path] : [];
	});
}

describe("リボンのボタンの持ち主（ADR-0070 の 5）", () => {
	it("自作プラグインの src/ で addRibbonIcon を使ってよいのは pkm-ribbon だけ", () => {
		const offenders = readdirSync(packages)
			.filter((id) => id !== "pkm-ribbon")
			.flatMap((id) => {
				try {
					return sources(join(packages, id, "src"));
				} catch {
					return [];
				}
			})
			.filter((path) => readFileSync(path, "utf8").includes("addRibbonIcon"))
			.map((path) => path.slice(packages.length));
		expect(offenders).toEqual([]);
	});
});
