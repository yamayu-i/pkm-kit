/**
 * 子の Vault の .obsidian/*.json を、上流の .kit/obsidian-required.json の「必要なキーと値」に合わせる（ADR-0009）。
 * ファイルごとは上書きしない。ここにあるキーだけを書き、ほかのキー（Obsidian 本体やユーザーの設定）は残す。
 * 依存なしの Node。セットアップ（.kit/setup.mjs）と検査（.claude/scripts/check-obsidian-config.mjs）が使う。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function readRequired(root) {
	const json = JSON.parse(readFileSync(join(root, ".kit/obsidian-required.json"), "utf8"));
	delete json.$comment;
	return json;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** 1 ファイル分。required が配列なら「この要素を含む」、オブジェクトなら「このキーがこの値」。足りないものを返す */
export function missing(current, required) {
	if (Array.isArray(required)) {
		const have = Array.isArray(current) ? current : [];
		return required.filter((v) => !have.some((h) => same(h, v))).map((v) => ({ item: v }));
	}
	const obj = typeof current === "object" && current !== null && !Array.isArray(current) ? current : {};
	return Object.entries(required)
		.filter(([k, v]) => !same(obj[k], v))
		.map(([key, value]) => ({ key, from: obj[key], to: value }));
}

/** 足りないものだけを書き足した中身を返す */
export function apply(current, required) {
	if (Array.isArray(required)) {
		const have = Array.isArray(current) ? [...current] : [];
		for (const v of required) if (!have.some((h) => same(h, v))) have.push(v);
		return have;
	}
	const obj = typeof current === "object" && current !== null && !Array.isArray(current) ? { ...current } : {};
	for (const [k, v] of Object.entries(required)) obj[k] = v;
	return obj;
}

function readJson(path) {
	if (!existsSync(path)) return undefined;
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		throw new Error(`${path} が JSON として読めない`);
	}
}

/** 検査: 足りないキーを「ファイル: 内容」の文で返す */
export function checkObsidianRequired(obsidianDir, required) {
	const problems = [];
	for (const [file, req] of Object.entries(required)) {
		for (const m of missing(readJson(join(obsidianDir, file)), req)) {
			problems.push(
				"item" in m
					? `${file}: ${JSON.stringify(m.item)} が入っていない（上流の .kit/obsidian-required.json。node .kit/setup.mjs で合わせる）`
					: `${file}: ${m.key} が ${JSON.stringify(m.from)}（${JSON.stringify(m.to)} にする。node .kit/setup.mjs で合わせる）`,
			);
		}
	}
	return problems;
}

/**
 * 必要なキーを書き込む。書いたものを返す。Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
 * （.claude/scripts/check-obsidian-config.mjs と合わせる）
 */
export function applyObsidianRequired(obsidianDir, required, { dryRun = false } = {}) {
	const changes = [];
	for (const [file, req] of Object.entries(required)) {
		const path = join(obsidianDir, file);
		const current = readJson(path);
		const diff = missing(current, req);
		if (diff.length === 0) continue;
		changes.push(...diff.map((d) => ({ file, ...d })));
		if (dryRun) continue;
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, JSON.stringify(apply(current, req), null, 2));
	}
	return changes;
}
