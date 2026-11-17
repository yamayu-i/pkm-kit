import { createRequire as __kitCreateRequire } from "node:module";
const require = __kitCreateRequire(import.meta.url);

// cli/mcp-hook.ts
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// cli/mcp-log.ts
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
function logDir(root) {
  return existsSync(join(root, ".kit-local")) ? join(root, ".claude/mcp-log") : join(root, ".kit/harness/mcp-log");
}
function logEnabled(env = process.env) {
  return (env.PKM_MCP_LOG ?? "").toLowerCase() !== "off";
}
var pad = (n) => String(n).padStart(2, "0");
function monthDir(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function stamp(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
var McpLogger = class _McpLogger {
  constructor(root, fileName, start, now = () => /* @__PURE__ */ new Date()) {
    this.root = root;
    this.now = now;
    this.path = join(logDir(root), monthDir(start), fileName);
  }
  root;
  now;
  path;
  /** サーバーの起動 1 回ぶんのロガー */
  static forServer(root, now = () => /* @__PURE__ */ new Date()) {
    const start = now();
    return new _McpLogger(root, `${stamp(start)}-${randomBytes(3).toString("hex")}.jsonl`, start, now);
  }
  write(kind, fields) {
    const line = { ts: this.now().toISOString(), kind, ...fields };
    try {
      mkdirSync(join(this.path, ".."), { recursive: true });
      appendFileSync(this.path, `${JSON.stringify(line)}
`);
    } catch {
    }
  }
};
var TASK_DIRS = /* @__PURE__ */ new Set(["issue", "routine", "member", "worklog", "board", "statuslog", "updates"]);
function pathArea(rel) {
  const p = rel.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
  if (p === "" || p === ".") return "vault";
  const segs = p.split("/");
  if (segs.some((s) => s.startsWith(".") || s === "node_modules")) return "hidden";
  const top = segs[0];
  if (top === "daily") return "daily";
  if (top === "wiki") return "wiki";
  if (top === "sources") return "sources";
  if (top === "asset") return "asset";
  if (top === "tmp") return "tmp";
  if (top === "template") return "template";
  if (top === "slide") return "slide";
  if (TASK_DIRS.has(top)) return "task";
  return "note";
}
var BYPASS_TOOLS = /* @__PURE__ */ new Set(["Read", "Edit", "Write", "MultiEdit", "NotebookEdit", "Grep", "Glob"]);
function recordBypass(root, payload, now = () => /* @__PURE__ */ new Date()) {
  const tool = payload.tool_name ?? "";
  if (!BYPASS_TOOLS.has(tool)) return null;
  const input = payload.tool_input ?? {};
  const raw = [input.file_path, input.notebook_path, input.path].find((v) => typeof v === "string");
  const isSearch = tool === "Grep" || tool === "Glob";
  if (raw === void 0 && !isSearch) return null;
  const abs = raw === void 0 ? root : isAbsolute(raw) ? raw : join(payload.cwd ?? root, raw);
  const rel = relative(root, abs).split(sep).join("/");
  if (rel.startsWith("..") || isAbsolute(rel)) return null;
  const area = pathArea(rel);
  if (area === "hidden" || area === "tmp") return null;
  if (!isSearch && area !== "asset" && !rel.endsWith(".md")) return null;
  if (isSearch && area !== "vault" && existsSync(abs) && !statSync(abs).isDirectory() && !rel.endsWith(".md")) return null;
  const session = (payload.session_id ?? "unknown").replace(/[^A-Za-z0-9-]/g, "").slice(0, 64) || "unknown";
  const start = now();
  new McpLogger(root, `hook-${session}.jsonl`, start, now).write("bypass", { op: tool, area });
  return area;
}

// cli/mcp-hook.ts
function handleHook(input, env = process.env) {
  if (!logEnabled(env)) return;
  const payload = JSON.parse(input);
  const root = env.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd();
  recordBypass(root, payload);
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => input += d);
  process.stdin.on("end", () => {
    try {
      handleHook(input);
    } catch {
    }
    process.exit(0);
  });
}
export {
  handleHook
};
