/** 0001 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const BASELINE = JSON.parse(readFileSync(new URL("./baseline.json", import.meta.url), "utf8"));
export const FILE_DIR = "template/file";
export const CONFIG = "template/config.json";
const FIELDS = ["enabled", "folder", "fileNamePattern"];

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** 子の template/file/ のうち、切り出した時点の上流と同じ中身のもの */
export function identicalTemplates(root) {
	const dir = join(root, FILE_DIR);
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith(".md") && BASELINE.files[f] === sha256(readFileSync(join(dir, f))))
		.map((f) => `${FILE_DIR}/${f}`);
}

/**
 * 子の template/config.json を、上流と違う項目だけの形にしたもの（vault-template の diffTemplateEntries と同じ形）。
 * null: ファイルがない。"delete": 上流と同じなので消せる。{ error }: 読めない
 */
export function reducedConfig(root) {
	const path = join(root, CONFIG);
	if (!existsSync(path)) return null;
	let data;
	try {
		data = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return { error: `${CONFIG} が JSON として読めない` };
	}
	if (!Array.isArray(data?.templates)) return { error: `${CONFIG} に templates 配列がない` };
	const base = new Map(BASELINE.config.map((e) => [e.file, e]));
	const overrides = [];
	for (const item of data.templates) {
		if (typeof item?.file !== "string") return { error: `${CONFIG} に file のない項目がある` };
		const b = base.get(item.file);
		const o = { file: item.file };
		for (const k of FIELDS) if (k in item && (!b || item[k] !== b[k])) o[k] = item[k];
		overrides.push(o);
	}
	const sameOrder = overrides.length === BASELINE.config.length && overrides.every((o, i) => o.file === BASELINE.config[i].file);
	if (sameOrder && overrides.every((o) => Object.keys(o).length === 1)) return "delete";
	return { text: `${JSON.stringify({ templates: overrides }, null, 2)}\n`, current: readFileSync(path, "utf8") };
}
