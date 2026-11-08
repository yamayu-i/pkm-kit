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
const repo = join(pluginSrc, "../..");
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
		text.split("\n").forEach((line, i) => {
			// テスト用のダミー値など、意図的なものは行末コメントで明示して除外する
			if (line.includes("security-scan: allow")) return;
			for (const [re, label] of patterns) if (re.test(line)) problems.push(`${file}:${i + 1}: ${label}らしき文字列`);
		});
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
		[/\.srcdoc\s*=|setAttribute\(\s*["']srcdoc["']/, "srcdoc への HTML 文字列の挿入"],
		[/child_process|require\(\s*["'](fs|net|http|https)["']\s*\)|from\s+["']node:/, "Node API の直接利用（モバイルで動かず、権限も広い）"],
		[/(?<![.\w])(?<!async )fetch\s*\(|XMLHttpRequest|WebSocket/, "requestUrl 以外の通信"],
		[/localStorage|sessionStorage/, "Web Storage（秘密情報は SecretStorage に置く）"],
		[/console\.(log|info|debug|warn|error)\([^)]*(token|password|secret)/i, "認証情報をログに出している可能性"],
	];
	// ADR-0037: srcdoc に入れてよいのは、sandbox と CSP を付ける pkm-html の 1 ファイルだけ
	const allowed = { "srcdoc への HTML 文字列の挿入": [".kit/src/packages/pkm-html/src/ui/frame.ts"] };
	const problems = [];
	for (const pkg of packages) {
		for (const file of walk(join(pkg, "src"))) {
			const lines = readFileSync(file, "utf8").split("\n");
			lines.forEach((line, i) => {
				for (const [re, label] of rules) {
					if (allowed[label]?.includes(relative(repo, file))) continue;
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

/** ビルド成果物をコミットしているプラグイン。outdirEnv はビルド先を一時フォルダに変える環境変数 */
const plugins = [
	{ id: "pkm-git", outdirEnv: "PKM_GIT_OUTDIR", files: ["main.js", "manifest.json"], bins: ["stamp-updated.mjs"], allowedRequires: ["obsidian"] },
	{
		id: "pkm-task",
		outdirEnv: "PKM_TASK_OUTDIR",
		files: ["main.js", "manifest.json", "styles.css"],
		bins: ["lint.mjs", "worklog-review.mjs", "mcp.mjs"],
		// CodeMirror は Obsidian 本体が提供するもの（同梱しない）
		allowedRequires: ["obsidian", "@codemirror/state", "@codemirror/view"],
	},
	{
		id: "pkm-template",
		outdirEnv: "PKM_TEMPLATE_OUTDIR",
		files: ["main.js", "manifest.json", "styles.css"],
		bins: [],
		allowedRequires: ["obsidian"],
	},
	// ADR-0029: リボンのボタンだけ。ほかのプラグインのコマンドを ID で呼ぶ
	{ id: "pkm-ribbon", outdirEnv: "PKM_RIBBON_OUTDIR", files: ["main.js", "manifest.json"], bins: [], allowedRequires: ["obsidian"] },
	// ADR-0037: HTML を sandbox の iframe に出す
	{ id: "pkm-html", outdirEnv: "PKM_HTML_OUTDIR", files: ["main.js", "manifest.json", "styles.css"], bins: [], allowedRequires: ["obsidian"] },
];

check("コミット済みの main.js と .kit/bin の CLI がソースから再現できる", () => {
	const problems = [];
	for (const plugin of plugins) {
		const out = mkdtempSync(join(tmpdir(), `${plugin.id}-build-`));
		const bin = mkdtempSync(join(tmpdir(), `${plugin.id}-bin-`));
		try {
			execFileSync("pnpm", ["--filter", plugin.id, "build"], {
				cwd: pluginSrc,
				stdio: "pipe",
				env: { ...process.env, [plugin.outdirEnv]: `${out}/`, KIT_BINDIR: `${bin}/` },
			});
			for (const name of plugin.bins) {
				const committed = readFileSync(join(repo, ".kit/bin", name), "utf8");
				if (readFileSync(join(bin, name), "utf8") !== committed) {
					problems.push(`.kit/bin/${name} がソースからのビルド結果と一致しない（ビルド忘れ、または改ざん）`);
				}
			}
			for (const name of plugin.files) {
				const committed = readFileSync(join(repo, ".obsidian/plugins", plugin.id, name), "utf8");
				if (readFileSync(join(out, name), "utf8") !== committed) {
					problems.push(`${plugin.id}/${name} がソースからのビルド結果と一致しない（ビルド忘れ、または改ざん）`);
				}
			}
		} finally {
			rmSync(out, { recursive: true, force: true });
			rmSync(bin, { recursive: true, force: true });
		}
	}
	return problems;
});

check("バンドルが Obsidian の提供するもの以外を require しない", () => {
	const problems = [];
	for (const plugin of plugins) {
		const bundle = readFileSync(join(repo, ".obsidian/plugins", plugin.id, "main.js"), "utf8");
		const requires = new Set([...bundle.matchAll(/require\(["']([^"']+)["']\)/g)].map((m) => m[1]));
		for (const r of requires) if (!plugin.allowedRequires.includes(r)) problems.push(`${plugin.id}: require("${r}")`);
	}
	return problems;
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
