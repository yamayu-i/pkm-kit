/**
 * Claude Code の PostToolUse フック（ADR-0156 の 6）。AI が MCP を通さずに Vault のノートを読み書きしたら、
 * 利用ログに bypass として区分だけを記録する。何があっても終了コード 0 で、何も出力しない（作業を止めない）
 *
 * 使い方（.claude/settings.json）: node "$CLAUDE_PROJECT_DIR/.kit/bin/mcp-hook.mjs"
 */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { logEnabled, recordBypass, type HookPayload } from "./mcp-log";

export function handleHook(input: string, env: NodeJS.ProcessEnv = process.env): void {
	if (!logEnabled(env)) return;
	const payload = JSON.parse(input) as HookPayload;
	const root = env.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd();
	recordBypass(root, payload);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	let input = "";
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", (d) => (input += d));
	process.stdin.on("end", () => {
		try {
			handleHook(input);
		} catch {
			// 記録できなくても作業を止めない
		}
		process.exit(0);
	});
}
