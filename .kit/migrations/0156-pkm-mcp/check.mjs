/** 0156 が終わった状態か。終わっていなければ、残っているものを返す */
import { MCP_JSON, oldKeys, readMcpJson } from "./common.mjs";

export function check(root) {
	const read = readMcpJson(root);
	if (!read) return [];
	if (read.error) return [`${MCP_JSON}: JSON として読めない（${read.error}）。直してから移行し直す`];
	return oldKeys(read.value).map((key) => `${MCP_JSON}: MCP サーバー ${key} を pkm にしていない`);
}
