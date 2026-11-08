import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { endOutput, logDir, main, readOutputs, recordIssue, startOutput, summary } from "../output-log.mjs";
import { tempVault } from "./helpers.mjs";

const at = (s) => new Date(`2026-11-08T${s}Z`);

test("置き場所: 子は .claude/output-log、上流は .kit/harness/output-log", () => {
	assert.equal(logDir(tempVault({ ".kit-local/upstream.json": "{}" })).endsWith(".claude/output-log"), true);
	assert.equal(logDir(tempVault()).endsWith(".kit/harness/output-log"), true);
});

test("start と end を 1 出力 1 ファイルに追記し、時間を求める", () => {
	const root = tempVault();
	const id = startOutput(root, { stage: "2", reader: "human", kind: "wiki-query の回答", skill: "wiki-query", format: "chat" }, at("10:00:00"));
	assert.match(id, /^20261108-100000-[0-9a-f]{4}$/);
	endOutput(root, { id, model: "model-a" }, at("10:01:30"));
	const dir = join(logDir(root), "2026-11");
	assert.deepEqual(readdirSync(dir), [`${id}.jsonl`]);
	assert.equal(readFileSync(join(dir, `${id}.jsonl`), "utf8").trim().split("\n").length, 2);
	const [o] = readOutputs(root);
	assert.deepEqual(o.stages, [2]);
	assert.equal(o.seconds, 90);
	assert.equal(o.model, "model-a");
	assert.equal(o.format, "chat");
});

test("段階を混ぜた出力と、既定からの上げ下げを記録する", () => {
	const root = tempVault();
	const id = startOutput(root, { stage: "3,4", reader: "both", kind: "PR の本文", default: "3", reason: "検証の結果は全件" }, at("10:00:00"));
	const [o] = readOutputs(root);
	assert.deepEqual(o.stages, [3, 4]);
	assert.equal(o.default, 3);
	assert.equal(o.id, id);
});

test("LLM だけが読む出力は段階を持たない", () => {
	const root = tempVault();
	startOutput(root, { reader: "llm", kind: "引き継ぎのメモ" }, at("10:00:00"));
	assert.deepEqual(readOutputs(root)[0].stages, []);
	assert.throws(() => startOutput(root, { reader: "llm", stage: "2", kind: "x" }), /LLM だけ/);
});

test("入力を検証する", () => {
	const root = tempVault();
	assert.throws(() => startOutput(root, { reader: "human", kind: "x" }), /--stage/);
	assert.throws(() => startOutput(root, { reader: "human", stage: "6", kind: "x" }), /1〜5/);
	assert.throws(() => startOutput(root, { reader: "robot", stage: "1", kind: "x" }), /--reader/);
	assert.throws(() => startOutput(root, { reader: "human", stage: "1" }), /--kind/);
	const id = startOutput(root, { reader: "human", stage: "1", kind: "完了の報告" }, at("10:00:00"));
	assert.throws(() => endOutput(root, { id }), /--model/);
	assert.throws(() => endOutput(root, { id: "20990101-000000-ffff", model: "m" }), /見つからない/);
	assert.throws(() => recordIssue(root, { id, type: "bad", summary: "x" }), /--type/);
	assert.throws(() => recordIssue(root, { id, type: "long", summary: "あ".repeat(201) }), /200 字/);
});

test("last は最後に始めた出力を指す（end は終わっていないものから）", () => {
	const root = tempVault();
	const a = startOutput(root, { reader: "human", stage: "1", kind: "a" }, at("10:00:00"));
	const b = startOutput(root, { reader: "human", stage: "2", kind: "b" }, at("10:05:00"));
	endOutput(root, { id: "last", model: "m" }, at("10:06:00"));
	recordIssue(root, { type: "long", summary: "長いと言われた" }, at("10:07:00"));
	const byId = Object.fromEntries(readOutputs(root).map((o) => [o.id, o]));
	assert.equal(byId[b].seconds, 60);
	assert.equal(byId[a].seconds, null);
	assert.equal(byId[b].issues.length, 1);
	endOutput(root, { id: "last", model: "m" }, at("10:08:00"));
	assert.equal(readOutputs(root).find((o) => o.id === a).seconds, 480);
});

test("段階ごとに、回数・時間・モデル・問題を集計する", () => {
	const root = tempVault();
	const a = startOutput(root, { reader: "human", stage: "2", kind: "回答" }, at("10:00:00"));
	endOutput(root, { id: a, model: "model-a" }, at("10:01:00"));
	const b = startOutput(root, { reader: "human", stage: "2", kind: "回答" }, at("11:00:00"));
	endOutput(root, { id: b, model: "model-b" }, at("11:03:00"));
	recordIssue(root, { id: b, type: "missing", summary: "比較の観点が抜けていた" }, at("11:10:00"));
	startOutput(root, { reader: "human", stage: "4", default: "3", reason: "ユーザーが全部と言った", kind: "点検" }, at("12:00:00"));
	startOutput(root, { reader: "llm", kind: "素材" }, at("13:00:00"));
	const s = summary(root, "2026-11-01", "2026-11-30");
	assert.match(s, /\| 2 答える \| 2 \| 2分0秒 \| 3分0秒 \| 1 \| 0 \|/);
	assert.match(s, /\| 4 確かめる \| 1 \| - \| - \| 0 \| 1 \|/);
	assert.match(s, /\| LLM だけ \| 1 \| - \| - \| 0 \| 1 \|/);
	assert.match(s, /\| model-b \| 2 \| 1 \| 3分0秒 \|/);
	assert.match(s, /既定 3 → 4: 1 件/);
	assert.match(s, /ユーザーが全部と言った/);
	assert.match(s, /足りない.*比較の観点が抜けていた/);
	assert.doesNotMatch(summary(root, "2026-12-01", "2026-12-31"), /\| 2 答える \| [1-9]/);
});

test("CLI: start は id を出力し、summary は表を出す", () => {
	const root = tempVault();
	const out = [];
	main(["start", "--stage", "1", "--reader", "human", "--kind", "完了の報告"], root, (l) => out.push(l));
	assert.match(out[0], /^\d{8}-\d{6}-[0-9a-f]{4}$/);
	main(["end", "--id", out[0], "--model", "m"], root, (l) => out.push(l));
	main(["summary", "--since", "2000-01-01"], root, (l) => out.push(l));
	assert.match(out.at(-1), /1 知らせる \| 1/);
	assert.equal(existsSync(logDir(root)), true);
});
