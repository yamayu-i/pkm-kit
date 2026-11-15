/** 0156 の共有の判定（.kit/src/docs/adr/0156-pkm-mcp.md） */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MCP_JSON = ".mcp.json";
const BIN = ".kit/bin/mcp.mjs";

/** .mcp.json を読む。ないなら null。読めないなら error */
export function readMcpJson(root) {
	const full = join(root, MCP_JSON);
	if (!existsSync(full)) return null;
	try {
		return { value: JSON.parse(readFileSync(full, "utf8")) };
	} catch (e) {
		return { error: e instanceof Error ? e.message : String(e) };
	}
}

/** 上流の MCP サーバー（.kit/bin/mcp.mjs）を pkm 以外の名前で登録しているもの */
export function oldKeys(value) {
	const servers = value?.mcpServers;
	if (!servers || typeof servers !== "object") return [];
	return Object.entries(servers)
		.filter(([key, v]) => key !== "pkm" && Array.isArray(v?.args) && v.args.some((a) => String(a).replace(/\\/g, "/").endsWith(BIN)))
		.map(([key]) => key);
}
