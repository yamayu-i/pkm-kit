/**
 * 0007: テンプレートの設定を上流（.kit/templates/config.json）で固定する（.kit/src/docs/adr/0039-fixed-template-config.md）。
 * vault-template は子の template/config.json を読まなくなったので、消す。捨てる値は変えたこととして挙げる。
 * template/ が空になれば template/ も消す。読めないファイルは変えずに、check が止める
 */
import { readdirSync, rmdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { CONFIG, readConfig } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const config = readConfig(root);
	if (!config || config.error) return [];
	if (!dryRun) {
		rmSync(join(root, CONFIG));
		try {
			if (readdirSync(join(root, "template")).length === 0) rmdirSync(join(root, "template"));
		} catch {
			// ない
		}
	}
	const changes = [`${CONFIG}: 消す（設定は上流で固定。README）`];
	for (const d of config.discarded) changes.push(`${CONFIG}: 捨てる値 ${d}`);
	return changes;
}
