/**
 * 0156: MCP サーバーの名前を pkm にする（.kit/src/docs/adr/0156-pkm-mcp.md）。
 * - Vault ルートの .mcp.json で、.kit/bin/mcp.mjs を pkm-task などの名前で登録していたら、pkm に改める（引数はそのまま）
 * - .mcp.json がなければ何もしない（新しい Vault はセットアップが置く。ほかの場所の設定は README のとおり AI が直す）
 * - 読めない .mcp.json は変えない（check が止める）
 * 何度実行しても同じ結果になる
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { MCP_JSON, oldKeys, readMcpJson } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const read = readMcpJson(root);
	if (!read || read.error) return [];
	const keys = oldKeys(read.value);
	if (keys.length === 0) return [];
	const servers = {};
	for (const [key, v] of Object.entries(read.value.mcpServers)) {
		if (keys.includes(key)) {
			// pkm がすでにあればそちらを残す
			if (!("pkm" in read.value.mcpServers) && !("pkm" in servers)) servers.pkm = v;
		} else servers[key] = v;
	}
	if (!dryRun) writeFileSync(join(root, MCP_JSON), `${JSON.stringify({ ...read.value, mcpServers: servers }, null, 2)}\n`);
	return [`${MCP_JSON}: MCP サーバー ${keys.join("、")} を pkm にする`];
}
