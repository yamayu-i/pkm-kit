#!/usr/bin/env node
/**
 * 出力の記録（write-for-reader の段階ごとの、使われた回数・時間・モデル・問題）。
 * 決定: .kit/harness/docs/adr/0013-output-by-reader-and-stage.md
 * 手順: .claude/skills/write-for-reader/recording.md
 *
 * 置き場所: 子（.kit-local/ がある）は .claude/output-log/、上流は .kit/harness/output-log/。
 * 1 出力 1 ファイル（<置き場所>/YYYY-MM/<id>.jsonl）に追記するので、端末をまたいでも衝突しない。
 *
 * 使い方:
 *   node .claude/scripts/output-log.mjs start --reader human|llm|both [--stage N[,M]] --kind <出力の種類>
 *        [--skill <スキル>] [--format <形式>] [--default N --reason <上げ下げの理由>]   → id を出力する
 *   node .claude/scripts/output-log.mjs end --id <id|last> --model <モデル名> [--format <形式>]
 *   node .claude/scripts/output-log.mjs issue [--id <id|last>] --type <種類> --summary <200 字以内>
 *   node .claude/scripts/output-log.mjs summary [--since YYYY-MM-DD] [--until YYYY-MM-DD]（既定は 30 日前から今日）
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const STAGES = { 1: "知らせる", 2: "答える", 3: "決める", 4: "確かめる", 5: "引く" };
export const READERS = { human: "人だけ", llm: "LLM だけ", both: "両方" };
export const ISSUE_TYPES = {
	long: "長い",
	missing: "足りない",
	unclear: "要点が分からない",
	stage: "段階が違う",
	format: "形式・表示",
	wrong: "内容の誤り",
	other: "その他",
};
const SUMMARY_MAX = 200;

export function logDir(root) {
	return existsSync(join(root, ".kit-local")) ? join(root, ".claude/output-log") : join(root, ".kit/harness/output-log");
}

function fail(message) {
	throw new Error(message);
}

function parseStages(stage, reader) {
	if (reader === "llm") {
		if (stage) fail("LLM だけが読む出力は段階を持たない（--stage を付けない）");
		return [];
	}
	if (!stage) fail("--stage が要る（人が読む出力。両方なら人が読む層の段階）");
	const list = String(stage).split(",").map((s) => Number(s.trim()));
	if (list.some((n) => !Number.isInteger(n) || !STAGES[n])) fail("--stage は 1〜5（混ぜるなら 3,4 のように主な段階を先に）");
	return list;
}

const compact = (d) => d.toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-");

function fileOf(root, id) {
	const m = id.match(/^(\d{4})(\d{2})\d{2}-\d{6}-[0-9a-f]{4}$/);
	if (!m) fail(`id の形が違う: ${id}`);
	return join(logDir(root), `${m[1]}-${m[2]}`, `${id}.jsonl`);
}

function append(root, id, record) {
	const file = fileOf(root, id);
	mkdirSync(join(file, ".."), { recursive: true });
	appendFileSync(file, `${JSON.stringify(record)}\n`);
}

/** 出力を始める。id を返す。 */
export function startOutput(root, opts, now = new Date()) {
	if (!READERS[opts.reader]) fail(`--reader は ${Object.keys(READERS).join(" / ")}`);
	const stages = parseStages(opts.stage, opts.reader);
	if (!opts.kind) fail("--kind が要る（出力の種類。例: wiki-query の回答）");
	const record = { event: "start", at: now.toISOString(), reader: opts.reader, stages, kind: opts.kind, skill: opts.skill ?? null };
	if (opts.format) record.format = opts.format;
	if (opts.default !== undefined) {
		const d = Number(opts.default);
		if (!STAGES[d]) fail("--default は 1〜5");
		record.default = d;
		if (opts.reason) record.reason = opts.reason;
	}
	const id = `${compact(now)}-${randomBytes(2).toString("hex")}`;
	append(root, id, { id, ...record });
	return id;
}

function resolveId(root, id, { unfinished }) {
	if (id && id !== "last") {
		if (!existsSync(fileOf(root, id))) fail(`記録が見つからない: ${id}`);
		return id;
	}
	const candidates = readOutputs(root).filter((o) => !unfinished || !o.endAt);
	if (!candidates.length) fail(unfinished ? "終わっていない出力の記録がない" : "出力の記録がない");
	return candidates.sort((a, b) => a.startAt.localeCompare(b.startAt)).at(-1).id;
}

/** 出力を終える（ユーザーに渡した時点）。 */
export function endOutput(root, opts, now = new Date()) {
	if (!opts.model) fail("--model が要る（出力したモデルの名前。分からなければ unknown）");
	const id = resolveId(root, opts.id, { unfinished: true });
	const record = { id, event: "end", at: now.toISOString(), model: opts.model };
	if (opts.format) record.format = opts.format;
	append(root, id, record);
	return id;
}

/** 出力に問題があった会話を記録する。 */
export function recordIssue(root, opts, now = new Date()) {
	if (!ISSUE_TYPES[opts.type]) fail(`--type は ${Object.keys(ISSUE_TYPES).join(" / ")}`);
	if (!opts.summary) fail("--summary が要る");
	if ([...opts.summary].length > SUMMARY_MAX) fail(`--summary は ${SUMMARY_MAX} 字以内`);
	const id = resolveId(root, opts.id, { unfinished: false });
	append(root, id, { id, event: "issue", at: now.toISOString(), type: opts.type, summary: opts.summary });
	return id;
}

/** 記録を出力ごとにまとめて返す。 */
export function readOutputs(root) {
	const dir = logDir(root);
	if (!existsSync(dir)) return [];
	const outputs = [];
	for (const month of readdirSync(dir).filter((d) => /^\d{4}-\d{2}$/.test(d)).sort()) {
		for (const f of readdirSync(join(dir, month)).filter((f) => f.endsWith(".jsonl")).sort()) {
			const lines = readFileSync(join(dir, month, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
			const start = lines.find((l) => l.event === "start");
			if (!start) continue;
			const end = lines.filter((l) => l.event === "end").at(-1);
			outputs.push({
				id: start.id,
				startAt: start.at,
				endAt: end?.at ?? null,
				seconds: end ? Math.round((Date.parse(end.at) - Date.parse(start.at)) / 1000) : null,
				model: end?.model ?? null,
				reader: start.reader,
				stages: start.stages,
				kind: start.kind,
				skill: start.skill,
				format: end?.format ?? start.format ?? null,
				default: start.default ?? null,
				reason: start.reason ?? null,
				issues: lines.filter((l) => l.event === "issue"),
			});
		}
	}
	return outputs;
}

const duration = (s) => (s === null || s === undefined ? "-" : `${Math.floor(s / 60)}分${s % 60}秒`);

function median(values) {
	if (!values.length) return null;
	const v = [...values].sort((a, b) => a - b);
	const mid = Math.floor(v.length / 2);
	return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
}

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

/** 段階ごとの集計（Markdown）。 */
export function summary(root, since = daysAgo(30), until = new Date().toISOString().slice(0, 10)) {
	const outputs = readOutputs(root).filter((o) => o.startAt.slice(0, 10) >= since && o.startAt.slice(0, 10) <= until);
	const out = [`# 出力の記録（${since} 〜 ${until}）`, "", `出力: ${outputs.length} 件`, ""];

	const groups = [
		...Object.entries(STAGES).map(([n, name]) => [`${n} ${name}`, (o) => o.stages.includes(Number(n))]),
		["LLM だけ", (o) => o.reader === "llm"],
	];
	out.push("## 段階ごと", "", "| 段階 | 回数 | 時間の中央値 | 最長 | 問題 | 未完了 |", "|---|---|---|---|---|---|");
	for (const [label, match] of groups) {
		const g = outputs.filter(match);
		const secs = g.map((o) => o.seconds).filter((s) => s !== null);
		const issues = g.reduce((n, o) => n + o.issues.length, 0);
		out.push(`| ${label} | ${g.length} | ${duration(median(secs))} | ${duration(secs.length ? Math.max(...secs) : null)} | ${issues} | ${g.filter((o) => !o.endAt).length} |`);
	}

	out.push("", "## モデルごと", "", "| モデル | 段階 | 回数 | 時間の中央値 |", "|---|---|---|---|");
	const byModel = new Map();
	for (const o of outputs.filter((o) => o.model)) {
		for (const s of o.stages.length ? o.stages : ["LLM"]) {
			const key = `${o.model}\t${s}`;
			byModel.set(key, [...(byModel.get(key) ?? []), o.seconds]);
		}
	}
	if (!byModel.size) out.push("| なし | - | - | - |");
	for (const [key, secs] of [...byModel].sort()) {
		const [model, stage] = key.split("\t");
		out.push(`| ${model} | ${stage} | ${secs.length} | ${duration(median(secs))} |`);
	}

	out.push("", "## 既定からの上げ下げ", "");
	const shifted = outputs.filter((o) => o.default !== null && o.stages[0] !== o.default);
	if (!shifted.length) out.push("- なし");
	const shifts = new Map();
	for (const o of shifted) {
		const key = `既定 ${o.default} → ${o.stages[0]}`;
		shifts.set(key, [...(shifts.get(key) ?? []), o]);
	}
	for (const [key, list] of shifts) {
		out.push(`- ${key}: ${list.length} 件`);
		for (const o of list) out.push(`  - ${o.kind}${o.reason ? `: ${o.reason}` : ""}`);
	}

	out.push("", "## 問題の記録", "");
	const issues = outputs.flatMap((o) => o.issues.map((i) => ({ o, i })));
	if (!issues.length) out.push("- なし");
	for (const { o, i } of issues.sort((a, b) => a.i.at.localeCompare(b.i.at))) {
		const stage = o.stages.length ? `段階 ${o.stages.join(",")}` : "LLM だけ";
		out.push(`- ${i.at.slice(0, 10)} ${stage} ${o.kind}（${o.model ?? "未完了"}）: ${ISSUE_TYPES[i.type]} — ${i.summary}`);
	}
	return out.join("\n");
}

function parseArgs(args) {
	const opts = {};
	for (let i = 0; i < args.length; i++) {
		const m = args[i].match(/^--([a-z]+)$/);
		if (!m) fail(`分からない引数: ${args[i]}`);
		opts[m[1]] = args[++i];
	}
	return opts;
}

export function main(argv, root, print = console.log) {
	const [command, ...rest] = argv;
	const opts = parseArgs(rest);
	if (command === "start") print(startOutput(root, opts));
	else if (command === "end") print(endOutput(root, opts));
	else if (command === "issue") print(recordIssue(root, opts));
	else if (command === "summary") print(summary(root, opts.since, opts.until));
	else fail("コマンドは start / end / issue / summary");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		main(process.argv.slice(2), fileURLToPath(new URL("../..", import.meta.url)));
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
}
