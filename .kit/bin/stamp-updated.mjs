#!/usr/bin/env node

// cli/stamp-updated.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// src/stamp/updated.ts
var EXCLUDED_DIRS = /* @__PURE__ */ new Set(["temporary", "template", "tmp"]);
function isTargetPath(path) {
  if (!path.endsWith(".md")) return false;
  const parts = path.split("/");
  if (parts.some((p) => p.startsWith("."))) return false;
  if (parts[parts.length - 1] === "README.md") return false;
  if (parts.length > 1 && EXCLUDED_DIRS.has(parts[0])) return false;
  return true;
}
function frontmatterEnd(lines) {
  if (lines[0]?.replace(/\r$/, "") !== "---") return null;
  for (let i = 1; i < lines.length; i++) if (lines[i].replace(/\r$/, "") === "---") return i;
  return null;
}
var UPDATED_RE = /^updated:/;
function findLine(lines, end, re) {
  for (let i = 1; i < end; i++) if (re.test(lines[i])) return i;
  return -1;
}
function setUpdated(text, iso) {
  const lines = text.split("\n");
  const end = frontmatterEnd(lines);
  if (end === null) return text;
  const cr = lines[0].endsWith("\r") ? "\r" : "";
  const at = findLine(lines, end, UPDATED_RE);
  if (lines.slice(1, end).filter((l) => UPDATED_RE.test(l)).length > 1) throw new Error("updated \u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059");
  if (at !== -1) {
    const value = lines[at].slice("updated:".length).replace(/\r$/, "").trim();
    if (/^\s/.test(lines[at + 1] ?? "") && at + 1 < end) throw new Error("updated \u306F\u5358\u4E00\u306E\u65E5\u6642\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
    if (/\s/.test(value.replace(/^(["'])(.*)\1$/, "$2"))) throw new Error("updated \u306F\u5358\u4E00\u306E\u65E5\u6642\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
    const quote = value.startsWith("'") ? "'" : value === "" || value.startsWith('"') ? '"' : "";
    lines[at] = `updated: ${quote}${iso}${quote}${cr}`;
  } else {
    const created = findLine(lines, end, /^created:/);
    lines.splice(created !== -1 ? created + 1 : end, 0, `updated: "${iso}"${cr}`);
  }
  return lines.join("\n");
}
function withoutUpdated(text) {
  const lines = text.split("\n");
  const end = frontmatterEnd(lines);
  if (end === null) return text;
  const at = findLine(lines, end, UPDATED_RE);
  if (at !== -1) lines.splice(at, 1);
  return lines.join("\n");
}
function shouldStamp(old, next) {
  if (frontmatterEnd(next.split("\n")) === null) return false;
  if (old === null) return true;
  return withoutUpdated(old) !== withoutUpdated(next);
}
var pad = (n) => String(n).padStart(2, "0");
function formatIso(date, offsetMinutes = date.getTimezoneOffset()) {
  const l = new Date(date.getTime() - offsetMinutes * 6e4);
  const stamp = `${l.getUTCFullYear()}-${pad(l.getUTCMonth() + 1)}-${pad(l.getUTCDate())}T${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}:${pad(l.getUTCSeconds())}`;
  if (offsetMinutes === 0) return `${stamp}Z`;
  const abs = Math.abs(offsetMinutes);
  return `${stamp}${offsetMinutes < 0 ? "+" : "-"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// cli/stamp-updated.mjs
function git(repo, args, input) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", input, maxBuffer: 256 * 1024 * 1024 });
}
function inSync(repo) {
  return ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply"].some(
    (name) => existsSync(join(repo, git(repo, ["rev-parse", "--git-path", name]).trim()))
  );
}
function stampStaged(repo, { now = /* @__PURE__ */ new Date(), offsetMinutes } = {}) {
  if (inSync(repo)) return [];
  const iso = formatIso(now, offsetMinutes);
  const parts = git(repo, ["diff", "--cached", "--name-status", "-z", "--no-renames", "--diff-filter=ADM"]).split("\0");
  const stamped = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const [status, path] = [parts[i], parts[i + 1]];
    if (!isTargetPath(path)) continue;
    if (path.startsWith("sources/") && status !== "A") throw new Error(`${path}: \u30B3\u30DF\u30C3\u30C8\u6E08\u307F\u306E\u5143\u8CC7\u6599\u306F\u5909\u66F4\u30FB\u524A\u9664\u3067\u304D\u307E\u305B\u3093`);
    if (status === "D") continue;
    const entry = git(repo, ["ls-files", "-s", "--", path]).split("	")[0].split(" ");
    if (!["100644", "100755"].includes(entry[0]) || entry[2] !== "0") continue;
    const staged = git(repo, ["show", `:${path}`]);
    const old = status === "A" ? null : git(repo, ["show", `HEAD:${path}`]);
    if (!shouldStamp(old, staged)) continue;
    let next;
    try {
      next = setUpdated(staged, iso);
    } catch (e) {
      throw new Error(`${path}: ${e.message}`);
    }
    if (next === staged) continue;
    const mode = entry[0];
    const oid = git(repo, ["hash-object", "-w", "--stdin"], next).trim();
    git(repo, ["update-index", "--cacheinfo", `${mode},${oid},${path}`]);
    const file = join(repo, path);
    if (existsSync(file) && readFileSync(file, "utf8") === staged) writeFileSync(file, next);
    stamped.push(path);
  }
  return stamped;
}
function migrate(repo, { offsetMinutes } = {}) {
  const done = [];
  for (const path of git(repo, ["ls-files", "-z"]).split("\0")) {
    if (!path || !isTargetPath(path)) continue;
    const file = join(repo, path);
    const text = readFileSync(file, "utf8");
    const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text);
    if (!m) continue;
    const line = m[1].split(/\r?\n/).find((l) => l.startsWith("updated:"));
    if (line !== void 0 && line.slice("updated:".length).trim() !== "") continue;
    const last = git(repo, ["log", "-1", "--format=%aI", "--", path]).trim();
    const iso = last || formatIso(statSync(file).mtime, offsetMinutes);
    try {
      writeFileSync(file, setUpdated(text, iso));
      done.push(path);
    } catch (e) {
      console.error(`stamp-updated: ${path}: ${e.message}(\u30B9\u30AD\u30C3\u30D7)`);
    }
  }
  return done;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
  const mode = process.argv[2];
  if (mode === "--staged") {
    let stamped;
    try {
      stamped = stampStaged(repo);
    } catch (e) {
      console.error(`stamp-updated: ${e.message}`);
      process.exit(1);
    }
    if (stamped.length) console.error(`stamp-updated: ${stamped.length} \u4EF6\u306B updated \u3092\u4ED8\u4E0E\u3057\u307E\u3057\u305F`);
  } else if (mode === "--migrate") {
    const done = migrate(repo);
    console.log(`stamp-updated: ${done.length} \u4EF6\u306E updated \u3092\u57CB\u3081\u307E\u3057\u305F`);
    for (const p of done) console.log(`  ${p}`);
  } else {
    console.error("\u4F7F\u3044\u65B9: stamp-updated.mjs --staged | --migrate");
    process.exit(2);
  }
}
export {
  migrate,
  stampStaged
};
