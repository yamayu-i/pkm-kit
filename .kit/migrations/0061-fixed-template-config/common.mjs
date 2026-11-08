/** 0061 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CONFIG = "template/config.json";
const FIELDS = ["enabled", "folder", "fileNamePattern"];

/**
 * 子の template/config.json の状態。
 * null: ファイルがない。{ error }: 読めない。{ discarded }: 消せる。discarded は捨てる値の説明（0001 のあとは上流と違う値だけが残っている）
 */
export function readConfig(root) {
	const path = join(root, CONFIG);
	if (!existsSync(path)) return null;
	let data;
	try {
		data = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return { error: `${CONFIG} が JSON として読めない` };
	}
	if (!Array.isArray(data?.templates)) return { error: `${CONFIG} に templates 配列がない` };
	const discarded = [];
	for (const item of data.templates) {
		if (typeof item?.file !== "string") return { error: `${CONFIG} に file のない項目がある` };
		const values = FIELDS.filter((k) => k in item).map((k) => `${k} = ${JSON.stringify(item[k])}`);
		if (values.length) discarded.push(`${item.file}: ${values.join(", ")}`);
	}
	return { discarded };
}
