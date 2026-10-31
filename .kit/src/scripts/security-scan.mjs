#!/usr/bin/env node
/**
 * 自作プラグインのセキュリティチェックのうち、機械的に判定できる部分。
 * 判断が必要な項目は .claude/skills/security-check/SKILL.md の手順で人（Claude）が見る。
 *
 * 使い方: pnpm security:scan [--offline]
 *   --offline  pnpm audit（ネットワークが必要）を飛ばす
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const pluginSrc = fileURLToPath(new URL("..", import.meta.url));
const repo = join(pluginSrc, "..");
const offline = process.argv.includes("--offline");
const results = [];

function check(name, fn) {
	try {
		const problems = fn() ?? [];
		results.push({ name, ok: problems.length === 0, problems });
	} catch (e) {
		results.push({ name, ok: false, problems: [`チェック自体が失敗: ${e.message}`] });
	}
}

function git(...args) {
	return execFileSync("git", args, { cwd: repo, encoding: "utf8" });
}

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...walk(p));
		else out.push(p);
	}
	return out;
}

const packages = readdirSync(join(pluginSrc, "packages")).map((name) => join(pluginSrc, "packages", name));

check("秘密情報がリポジトリに含まれていない", () => {
	const patterns = [
		[/gh[pousr]_[A-Za-z0-9]{36,}/, "GitHub トークン"],
		[/github_pat_[A-Za-z0-9_]{40,}/, "GitHub fine-grained トークン"],
		[/AKIA[0-9A-Z]{16}/, "AWS アクセスキー"],
		[/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "秘密鍵"],
		[/xox[abpr]-[A-Za-z0-9-]{10,}/, "Slack トークン"],
		[/https?:\/\/[^\s/:@]+:[^\s/@]+@/, "URL に埋め込まれた認証情報"],
	];
	const problems = [];
	for (const file of git("ls-files", "-z").split("\0").filter(Boolean)) {
		let text;
		try {
			text = readFileSync(join(repo, file), "utf8");
		} catch {
			continue;
		}
		for (const [re, label] of patterns) if (re.test(text)) problems.push(`${file}: ${label}らしき文字列`);
	}
	return problems;
});

check("プラグインの data.json が追跡されていない", () =>
	git("ls-files", ".obsidian/plugins/*/data.json")
		.split("\n")
		.filter(Boolean)
		.map((f) => `${f} が git 管理下にある（端末設定・秘密情報の漏えい源）`),
);

check("危険な API を使っていない", () => {
	const rules = [
		[/\beval\s*\(/, "eval"],
		[/new\s+Function\s*\(/, "new Function"],
		[/\.(innerHTML|outerHTML)\s*=/, "innerHTML/outerHTML への代入"],
		[/insertAdjacentHTML|document\.write/, "HTML 文字列の挿入"],
		[/child_process|require\(\s*["'](fs|net|http|https)["']\s*\)|from\s+["']node:/, "Node API の直接利用（モバイルで動かず、権限も広い）"],
		[/(?<![.\w])(?<!async )fetch\s*\(|XMLHttpRequest|WebSocket/, "requestUrl 以外の通信"],
		[/localStorage|sessionStorage/, "Web Storage（秘密情報は SecretStorage に置く）"],
		[/console\.(log|info|debug|warn|error)\([^)]*(token|password|secret)/i, "認証情報をログに出している可能性"],
	];
	const problems = [];
	for (const pkg of packages) {
		for (const file of walk(join(pkg, "src"))) {
			const lines = readFileSync(file, "utf8").split("\n");
			lines.forEach((line, i) => {
				for (const [re, label] of rules) {
					if (re.test(line)) problems.push(`${relative(repo, file)}:${i + 1}: ${label}`);
				}
			});
		}
	}
	return problems;
});

check("依存はバージョン固定（^ や ~ なし）", () => {
	const problems = [];
	for (const pkg of packages) {
		const json = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
		for (const field of ["dependencies", "devDependencies"]) {
			for (const [name, v] of Object.entries(json[field] ?? {})) {
				if (!/^\d+\.\d+\.\d+$/.test(v)) problems.push(`${relative(repo, pkg)}: ${name}@${v}`);
			}
		}
	}
	return problems;
});

check("lockfile と package.json が一致している", () => {
	execFileSync("pnpm", ["install", "--frozen-lockfile", "--offline"], { cwd: pluginSrc, stdio: "pipe" });
	return [];
});

check("コミット済みの main.js がソースから再現できる", () => {
	const problems = [];
	const out = mkdtempSync(join(tmpdir(), "vault-git-build-"));
	try {
		execFileSync("pnpm", ["--filter", "vault-git", "build"], {
			cwd: pluginSrc,
			stdio: "pipe",
			env: { ...process.env, VAULT_GIT_OUTDIR: `${out}/` },
		});
		for (const name of ["main.js", "manifest.json"]) {
			const committed = readFileSync(join(repo, ".obsidian/plugins/vault-git", name), "utf8");
			if (readFileSync(join(out, name), "utf8") !== committed) {
				problems.push(`${name} がソースからのビルド結果と一致しない（ビルド忘れ、または改ざん）`);
			}
		}
	} finally {
		rmSync(out, { recursive: true, force: true });
	}
	return problems;
});

check("バンドルが obsidian 以外を require しない", () => {
	const bundle = readFileSync(join(repo, ".obsidian/plugins/vault-git/main.js"), "utf8");
	const requires = [...bundle.matchAll(/require\(["']([^"']+)["']\)/g)].map((m) => m[1]);
	return [...new Set(requires)].filter((r) => r !== "obsidian").map((r) => `require("${r}")`);
});

if (!offline) {
	check("既知の脆弱性がない（pnpm audit）", () => {
		let raw;
		try {
			raw = execFileSync("pnpm", ["audit", "--json"], { cwd: pluginSrc, encoding: "utf8", stdio: "pipe" });
		} catch (e) {
			// 脆弱性があると終了コードが 0 以外になる
			raw = e.stdout?.toString() ?? "";
			if (!raw) throw e;
		}
		const report = JSON.parse(raw);
		const advisories = Object.values(report.advisories ?? {});
		return advisories.map((a) => `${a.module_name}: ${a.severity} ${a.title} (${a.url})`);
	});
}

let failed = 0;
for (const r of results) {
	console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
	for (const p of r.problems) console.log(`      - ${p}`);
	if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} passed${offline ? "（pnpm audit は --offline のため未実行）" : ""}`);
process.exit(failed > 0 ? 1 : 0);
