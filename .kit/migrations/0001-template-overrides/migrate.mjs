/**
 * 0001: 子の template/ を、上流の既定（.kit/templates/）への上書きだけにする。
 * - 切り出した時点の上流と同じ中身のテンプレートを消す（上流の改善が届くように）
 * - template/config.json を、上流と違う項目だけの形にする。上流と同じなら消す
 * 子が変えたテンプレートと、子だけのテンプレートは残す。何度実行しても同じ結果になる
 */
import { readdirSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG, FILE_DIR, identicalTemplates, reducedConfig } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	for (const path of identicalTemplates(root)) {
		if (!dryRun) rmSync(join(root, path));
		changes.push(`${path}: 上流と同じなので消す`);
	}
	const config = reducedConfig(root);
	if (config === "delete") {
		if (!dryRun) rmSync(join(root, CONFIG));
		changes.push(`${CONFIG}: 上流と同じなので消す`);
	} else if (config?.text && config.text !== config.current) {
		if (!dryRun) writeFileSync(join(root, CONFIG), config.text);
		changes.push(`${CONFIG}: 上流と違う項目だけにする`);
	}
	// 空になったフォルダを消す
	for (const dir of [FILE_DIR, "template"]) {
		try {
			if (!dryRun && readdirSync(join(root, dir)).length === 0) rmdirSync(join(root, dir));
		} catch {
			// ない
		}
	}
	return changes;
}
