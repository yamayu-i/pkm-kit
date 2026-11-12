"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  VIEW_TYPE: () => VIEW_TYPE,
  default: () => PkmUpdatesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// ../shared/src/list-pane.ts
var LIST_VIEW_PREFIXES = ["pkm-task-", "pkm-template-", "pkm-updates-", "pkm-slide-"];
var NOT_LIST_VIEWS = /* @__PURE__ */ new Set(["pkm-task-sidebar"]);
function isListViewType(type) {
  return !NOT_LIST_VIEWS.has(type) && LIST_VIEW_PREFIXES.some((p3) => type.startsWith(p3));
}
function leafType(leaf) {
  return leaf.getViewState().type;
}
function rootLeaves(workspace) {
  const leaves = [];
  workspace.iterateRootLeaves((leaf) => {
    leaves.push(leaf);
  });
  return leaves;
}
function findListLeaf(workspace, leaves) {
  const lists = leaves.filter((l3) => isListViewType(leafType(l3)));
  const recent = workspace.getMostRecentLeaf();
  if (recent && lists.includes(recent)) return recent;
  return lists[0] ?? null;
}
async function openListView(workspace, type, options) {
  const existing = workspace.getLeavesOfType(type)[0];
  if (existing) {
    existing.setPinned(true);
    await workspace.revealLeaf(existing);
    return;
  }
  let leaf;
  const listLeaf = options.phone ? null : findListLeaf(workspace, rootLeaves(workspace));
  if (listLeaf) {
    workspace.setActiveLeaf(listLeaf, { focus: false });
    leaf = workspace.getLeaf("tab");
  } else {
    const base = options.phone ? null : workspace.getMostRecentLeaf();
    leaf = base ? workspace.createLeafBySplit(base, "vertical", true) : workspace.getLeaf("tab");
  }
  await leaf.setViewState({ type, active: true });
  leaf.setPinned(true);
  await workspace.revealLeaf(leaf);
}
async function openInNotePane(workspace, file, options) {
  const fallback = options.newTab ? "tab" : false;
  const leaves = options.phone ? [] : rootLeaves(workspace);
  const listLeaf = findListLeaf(workspace, leaves);
  if (!listLeaf) {
    const leaf = workspace.getLeaf(fallback);
    await leaf.openFile(file, { active: true });
    return leaf;
  }
  const container = listLeaf.getContainer();
  const notes = leaves.filter((l3) => l3.parent !== listLeaf.parent && !isListViewType(leafType(l3)) && l3.getContainer() === container);
  let target;
  const first = notes[0];
  if (!first) {
    target = workspace.createLeafBySplit(listLeaf, "vertical", false);
  } else {
    const recent = workspace.getMostRecentLeaf();
    const group = recent && notes.includes(recent) ? recent.parent : first.parent;
    const inGroup = workspace.getMostRecentLeaf(group);
    target = inGroup && notes.includes(inGroup) ? inGroup : first;
    if (options.newTab) {
      workspace.setActiveLeaf(target, { focus: false });
      target = workspace.getLeaf("tab");
    }
  }
  await target.openFile(file, { active: true });
  return target;
}

// src/obsidian/model.ts
var import_obsidian = require("obsidian");

// ../shared/src/dates.ts
var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
var DAY_MS = 864e5;
var WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function toEpochDay(date) {
  const m3 = DATE_RE.exec(date);
  if (!m3) return null;
  const y3 = Number(m3[1]);
  const mo = Number(m3[2]);
  const d3 = Number(m3[3]);
  const t3 = Date.UTC(y3, mo - 1, d3);
  const back = new Date(t3);
  if (back.getUTCFullYear() !== y3 || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d3) return null;
  return t3 / DAY_MS;
}
function isLocalDate(value) {
  return typeof value === "string" && toEpochDay(value) !== null;
}
function localToday(now = /* @__PURE__ */ new Date()) {
  const y3 = now.getFullYear();
  const m3 = String(now.getMonth() + 1).padStart(2, "0");
  const d3 = String(now.getDate()).padStart(2, "0");
  return `${y3}-${m3}-${d3}`;
}

// ../pkm-task/src/core/dates.ts
function normalizeDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const s3 = value.trim();
    return isLocalDate(s3) ? s3 : null;
  }
  return null;
}
function localDateTime(now = /* @__PURE__ */ new Date()) {
  const pad = (n2) => String(Math.trunc(Math.abs(n2))).padStart(2, "0");
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return `${localToday(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
}

// ../pkm-task/src/core/board.ts
var BOARD_KEY = "board";
function emptyBoard() {
  return { issues: [], groups: {}, routines: {}, carried: [], closed: false };
}
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function parseBoard(value) {
  const raw = record(value);
  const board = emptyBoard();
  if (Array.isArray(raw.issues)) {
    for (const id of raw.issues) if (typeof id === "string" && !board.issues.includes(id)) board.issues.push(id);
  }
  if (Array.isArray(raw.carried)) {
    for (const id of raw.carried) if (typeof id === "string" && !board.carried.includes(id)) board.carried.push(id);
  }
  for (const [id, g2] of Object.entries(record(raw.groups))) if (typeof g2 === "string" && g2) board.groups[id] = g2;
  for (const [id, r3] of Object.entries(record(raw.routines))) if (r3 === "closed" || r3 === "canceled") board.routines[id] = r3;
  board.closed = raw.closed === true;
  return board;
}
function dailyNotePath(date) {
  return `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
}
var DAILY_PATH_RE = /^daily\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/;
function markCarried(board, ids) {
  for (const id of ids) if (!board.carried.includes(id)) board.carried.push(id);
}

// ../pkm-task/src/core/worklog.ts
var WORKLOG_PATH_RE = /^worklog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
function sanitizeDeviceName(name) {
  return name.trim().replace(/[\\/:*?"<>|#^[\]]/g, "-").replace(/^\.+/, "");
}
function parseWorklog(path, text2) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text2.split("\n").forEach((raw, i3) => {
    const line = i3 + 1;
    if (!raw.trim()) return;
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      problem(line, "invalid-json", "JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
      return;
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      problem(line, "invalid-json", "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    const o3 = obj;
    if (typeof o3.id !== "string" || !o3.id) return problem(line, "invalid-worklog", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    if (typeof o3.task_id !== "string" || !o3.task_id) return problem(line, "invalid-worklog", "task_id \u304C\u3042\u308A\u307E\u305B\u3093");
    const fromMs = typeof o3.from === "string" ? Date.parse(o3.from) : Number.NaN;
    if (Number.isNaN(fromMs)) return problem(line, "invalid-worklog", "from \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    let toMs = null;
    if (o3.to !== null && o3.to !== void 0) {
      toMs = typeof o3.to === "string" ? Date.parse(o3.to) : Number.NaN;
      if (Number.isNaN(toMs)) return problem(line, "invalid-worklog", "to \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    }
    entries.push({
      path,
      line,
      id: o3.id,
      taskId: o3.task_id,
      from: o3.from,
      to: toMs === null ? null : o3.to,
      description: typeof o3.description === "string" ? o3.description : "",
      fromMs,
      toMs
    });
  });
  return { entries, problems };
}

// ../pkm-task/src/core/board-log.ts
var BOARD_LOG_PATH_RE = /^board\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
function parseOp(o3) {
  const task = typeof o3.task === "string" && o3.task ? o3.task : null;
  switch (o3.op) {
    case "add":
    case "remove":
    case "carry":
      return task ? { op: o3.op, task } : null;
    case "place":
      return task && (o3.group === null || typeof o3.group === "string" && o3.group) ? { op: "place", task, group: o3.group } : null;
    case "routine":
      return task && (o3.result === null || o3.result === "closed" || o3.result === "canceled") ? { op: "routine", task, result: o3.result } : null;
    case "close":
      return Array.isArray(o3.tasks) && o3.tasks.every((id) => typeof id === "string" && id) ? { op: "close", tasks: o3.tasks } : null;
    case "reopen":
      return { op: "reopen" };
    case "order":
      return (o3.group === null || typeof o3.group === "string" && o3.group) && Array.isArray(o3.tasks) && o3.tasks.every((id) => typeof id === "string" && id) ? { op: "order", group: o3.group, tasks: o3.tasks } : null;
    default:
      return null;
  }
}
function parseBoardLog(path, text2) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text2.split("\n").forEach((raw, i3) => {
    const line = i3 + 1;
    if (!raw.trim()) return;
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      problem(line, "invalid-json", "JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
      return;
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      problem(line, "invalid-json", "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    const o3 = obj;
    if (typeof o3.id !== "string" || !o3.id) return problem(line, "invalid-board-log", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    const atMs = typeof o3.at === "string" ? Date.parse(o3.at) : Number.NaN;
    if (Number.isNaN(atMs)) return problem(line, "invalid-board-log", "at \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (typeof o3.date !== "string" || !isLocalDate(o3.date)) return problem(line, "invalid-board-log", "date \u304C\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const op = parseOp(o3);
    if (!op) return problem(line, "invalid-board-log", "\u64CD\u4F5C\u304C\u4E0D\u6B63\u3067\u3059");
    entries.push({ path, line, id: o3.id, at: o3.at, atMs, date: o3.date, op });
  });
  return { entries, problems };
}
function compareEntries(a3, b2) {
  if (a3.atMs !== b2.atMs) return a3.atMs - b2.atMs;
  if (a3.path !== b2.path) return a3.path < b2.path ? -1 : 1;
  return a3.line - b2.line;
}
function apply(board, op) {
  switch (op.op) {
    case "add":
      if (!board.issues.includes(op.task)) board.issues.push(op.task);
      board.carried = board.carried.filter((id) => id !== op.task);
      board.closed = false;
      break;
    case "remove":
      board.issues = board.issues.filter((id) => id !== op.task);
      board.carried = board.carried.filter((id) => id !== op.task);
      delete board.groups[op.task];
      break;
    case "place":
      if (op.group === null) delete board.groups[op.task];
      else board.groups[op.task] = op.group;
      break;
    case "routine":
      if (op.result === null) delete board.routines[op.task];
      else board.routines[op.task] = op.result;
      break;
    case "carry":
      if (board.issues.includes(op.task)) markCarried(board, [op.task]);
      break;
    case "close":
    case "reopen":
      board.closed = op.op === "close";
      break;
    case "order":
      break;
  }
}
function replayBoard(initial, entries) {
  const board = { ...emptyBoard(), ...structuredClone(initial) };
  let lastClose = null;
  for (const e3 of [...entries].sort(compareEntries)) {
    apply(board, e3.op);
    if (e3.op.op === "close") lastClose = e3.op.tasks;
  }
  const seen = lastClose;
  if (board.closed && seen !== null && board.issues.some((id) => !seen.includes(id))) board.closed = false;
  return board;
}
function removedTasks(entries) {
  const last = /* @__PURE__ */ new Map();
  for (const e3 of [...entries].sort(compareEntries)) {
    if (e3.op.op === "add" || e3.op.op === "remove") last.set(e3.op.task, e3.op.op);
  }
  return [...last].filter(([, op]) => op === "remove").map(([id]) => id);
}
function placementHistory(initial, entries) {
  const records = [];
  for (const [date, board] of initial) {
    for (const [task, group] of Object.entries(board.groups)) records.push({ task, date, atMs: Number.NEGATIVE_INFINITY, group });
  }
  for (const e3 of [...entries].sort(compareEntries)) {
    if (e3.op.op === "place") records.push({ task: e3.op.task, date: e3.date, atMs: e3.atMs, group: e3.op.group });
  }
  return records.sort((a3, b2) => a3.date !== b2.date ? a3.date.localeCompare(b2.date) : a3.atMs - b2.atMs);
}
function orderHistory(entries) {
  const records = [];
  for (const e3 of [...entries].sort(compareEntries)) {
    if (e3.op.op === "order") records.push({ group: e3.op.group ?? "", date: e3.date, atMs: e3.atMs, tasks: e3.op.tasks });
  }
  return records.sort((a3, b2) => a3.date !== b2.date ? a3.date.localeCompare(b2.date) : a3.atMs - b2.atMs);
}

// ../pkm-task/src/core/repeat.ts
function parseWeekday(s3) {
  const i3 = WEEKDAY_NAMES.indexOf(s3.toLowerCase());
  return i3 < 0 ? null : i3;
}
function parseMonthSpec(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 && value <= 31 ? { kind: "day", day: value } : null;
  }
  if (typeof value !== "string") return null;
  const s3 = value.trim().toLowerCase();
  if (/^\d+$/.test(s3)) return parseMonthSpec(Number(s3));
  if (s3 === "last") return { kind: "last" };
  const nth = /^([1-5])(?:th|st|nd|rd)-([a-z]{3})$/.exec(s3);
  if (nth) {
    const weekday = parseWeekday(nth[2]);
    return weekday === null ? null : { kind: "nth", n: Number(nth[1]), weekday };
  }
  const last = /^last-([a-z]{3})$/.exec(s3);
  if (last) {
    const weekday = parseWeekday(last[1]);
    return weekday === null ? null : { kind: "lastWeekday", weekday };
  }
  return null;
}
function asList(value) {
  if (value === void 0 || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
function parseRepeat(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "repeat \u304C\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093" };
  }
  const raw = value;
  const interval = raw.interval === void 0 || raw.interval === null ? 1 : raw.interval;
  if (typeof interval !== "number" || !Number.isInteger(interval) || interval < 1) {
    return { ok: false, error: `repeat.interval \u306F 1 \u4EE5\u4E0A\u306E\u6574\u6570\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(raw.interval)}` };
  }
  const on = asList(raw.on);
  switch (raw.every) {
    case "day":
      return { ok: true, value: { every: "day", interval } };
    case "week": {
      const weekdays = [];
      for (const v3 of on) {
        const w3 = typeof v3 === "string" ? parseWeekday(v3.trim()) : null;
        if (w3 === null) return { ok: false, error: `repeat.on \u306E\u66DC\u65E5\u304C\u8AAD\u3081\u307E\u305B\u3093: ${String(v3)}` };
        if (!weekdays.includes(w3)) weekdays.push(w3);
      }
      if (weekdays.length === 0) return { ok: false, error: "every: week \u306B\u306F repeat.on \u3067\u66DC\u65E5\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" };
      return { ok: true, value: { every: "week", interval, weekdays } };
    }
    case "month": {
      const days = [];
      for (const v3 of on) {
        const spec = parseMonthSpec(v3);
        if (spec === null) return { ok: false, error: `repeat.on \u306E\u65E5\u4ED8\u304C\u8AAD\u3081\u307E\u305B\u3093: ${String(v3)}` };
        days.push(spec);
      }
      if (days.length === 0) return { ok: false, error: "every: month \u306B\u306F repeat.on \u3067\u65E5\u4ED8\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" };
      return { ok: true, value: { every: "month", interval, days } };
    }
    default:
      return { ok: false, error: `repeat.every \u306F day / week / month \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(raw.every)}` };
  }
}

// ../pkm-task/src/core/ids.ts
function idNumber(id, prefix) {
  const m3 = new RegExp(`^${prefix}-([1-9]\\d*)$`).exec(id);
  return m3 ? Number(m3[1]) : null;
}
function isId(value, prefix) {
  return typeof value === "string" && idNumber(value, prefix) !== null;
}

// ../pkm-task/src/core/schema.ts
var SCHEMA_VERSION = 1;
var STATUSES = ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"];
var PRIORITIES = ["high", "mid", "low", "chore"];
var Reader = class {
  constructor(path, fm) {
    this.path = path;
    this.fm = fm;
  }
  path;
  fm;
  problems = [];
  problem(code, message, severity = "error") {
    this.problems.push({ severity, path: this.path, code, message });
  }
  has(key) {
    const v3 = this.fm[key];
    return v3 !== void 0 && v3 !== null && v3 !== "";
  }
  string(key) {
    if (!this.has(key)) return null;
    const v3 = this.fm[key];
    if (typeof v3 === "string") return v3.trim();
    if (typeof v3 === "number") return String(v3);
    this.problem("invalid-field", `${key} \u304C\u6587\u5B57\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093`);
    return null;
  }
  oneOf(key, values) {
    const v3 = this.string(key);
    if (v3 === null) return null;
    if (values.includes(v3)) return v3;
    this.problem("invalid-field", `${key} \u306F ${values.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${v3}`);
    return null;
  }
  date(key) {
    if (!this.has(key)) return null;
    const d3 = normalizeDate(this.fm[key]);
    if (d3 === null) this.problem("invalid-date", `${key} \u304C YYYY-MM-DD \u306E\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(this.fm[key])}`);
    return d3;
  }
  datetime(key) {
    if (!this.has(key)) return null;
    const v3 = this.fm[key];
    if (v3 instanceof Date && !Number.isNaN(v3.getTime())) return v3.toISOString();
    if (typeof v3 === "string" && !Number.isNaN(Date.parse(v3))) return v3.trim();
    this.problem("invalid-date", `${key} \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(v3)}`);
    return null;
  }
  minutes(key) {
    if (!this.has(key)) return null;
    const v3 = this.fm[key];
    if (typeof v3 === "number" && Number.isFinite(v3) && v3 >= 0) return v3;
    this.problem("invalid-field", `${key} \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(v3)}`);
    return null;
  }
  list(key) {
    if (!this.has(key)) return [];
    const v3 = this.fm[key];
    return Array.isArray(v3) ? v3.filter((x2) => x2 !== null && x2 !== "") : [v3];
  }
  strings(key) {
    const out = [];
    for (const v3 of this.list(key)) {
      if (typeof v3 === "string" || typeof v3 === "number") {
        const s3 = String(v3).trim();
        if (s3 && !out.includes(s3)) out.push(s3);
      } else {
        this.problem("invalid-field", `${key} \u306B\u6587\u5B57\u5217\u3067\u306A\u3044\u5024\u304C\u3042\u308A\u307E\u3059`);
      }
    }
    return out;
  }
  dates(key) {
    const out = /* @__PURE__ */ new Set();
    for (const v3 of this.list(key)) {
      const d3 = normalizeDate(v3);
      if (d3 === null) this.problem("invalid-date", `${key} \u306B\u65E5\u4ED8\u3067\u306A\u3044\u5024\u304C\u3042\u308A\u307E\u3059: ${String(v3)}`);
      else out.add(d3);
    }
    return [...out].sort();
  }
  ref(key, prefix) {
    const v3 = this.string(key);
    if (v3 === null) return null;
    if (isId(v3, prefix)) return v3;
    this.problem("invalid-ref", `${key} \u304C ${prefix}-N \u306E ID \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${v3}`);
    return null;
  }
  common(type, prefix) {
    if (this.fm.type !== type) this.problem("invalid-type", `type \u304C ${type} \u3067\u306F\u3042\u308A\u307E\u305B\u3093`);
    if (this.has("schema") && this.fm.schema !== SCHEMA_VERSION) {
      this.problem("unknown-schema", `schema ${String(this.fm.schema)} \u306F\u6271\u3048\u307E\u305B\u3093\uFF08${SCHEMA_VERSION} \u306E\u307F\uFF09`);
    }
    const id = this.string("id");
    if (id === null || !isId(id, prefix)) {
      this.problem("invalid-id", `id \u304C ${prefix}-N \u306E\u5F62\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(this.fm.id)}`);
      return null;
    }
    const expected = this.path.replace(/^.*\//, "").replace(/\.md$/, "");
    if (expected !== id) this.problem("id-path-mismatch", `id\uFF08${id}\uFF09\u3068\u30D5\u30A1\u30A4\u30EB\u540D\uFF08${expected}\uFF09\u304C\u9055\u3044\u307E\u3059`);
    return id;
  }
};
function parseIssue(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("issue", "i");
  const summary = r3.string("summary") ?? "";
  if (!summary) r3.problem("missing-summary", "summary \u304C\u3042\u308A\u307E\u305B\u3093", "warning");
  const status = r3.oneOf("status", STATUSES);
  if (status === null && !r3.has("status")) r3.problem("missing-status", "status \u304C\u3042\u308A\u307E\u305B\u3093");
  if (r3.has("mid_due")) r3.problem("legacy-mid-due", "mid_due \u306F soft_deadline \u306B\u6539\u540D\u3057\u307E\u3057\u305F\uFF08ADR-0032\uFF09\u3002\u30AD\u30FC\u3092 soft_deadline \u306B\u76F4\u3057\u3066\u304F\u3060\u3055\u3044");
  const issue = {
    path,
    id: id ?? "",
    summary,
    status: status ?? "open",
    statusDetail: r3.string("status-detail") ?? "",
    delegatedTo: r3.ref("delegated_to", "m"),
    priority: r3.oneOf("priority", PRIORITIES),
    labels: r3.strings("label"),
    parent: r3.ref("parent", "i"),
    related: r3.strings("related"),
    estimated: r3.minutes("estimated"),
    scheduled: r3.dates("scheduled"),
    softDeadline: r3.date("soft_deadline"),
    deadline: r3.date("deadline"),
    revisit: r3.date("revisit"),
    reviewed: r3.date("reviewed"),
    created: r3.datetime("created")
  };
  return { value: id === null ? null : issue, problems: r3.problems };
}
function parseRoutine(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("routine", "r");
  let repeat = null;
  const parsed = parseRepeat(fm.repeat);
  if (parsed.ok) repeat = parsed.value;
  else r3.problem("invalid-repeat", parsed.error);
  const active = fm.active === void 0 || fm.active === null ? true : fm.active;
  if (typeof active !== "boolean") r3.problem("invalid-field", "active \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const routine = {
    path,
    id: id ?? "",
    summary: r3.string("summary") ?? "",
    repeat,
    start: r3.date("start"),
    end: r3.date("end"),
    active: active !== false,
    group: r3.string("group"),
    priority: r3.oneOf("priority", PRIORITIES),
    labels: r3.strings("label"),
    estimated: r3.minutes("estimated"),
    created: r3.datetime("created")
  };
  return { value: id === null ? null : routine, problems: r3.problems };
}
function parseMember(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("member", "m");
  const name = r3.string("name") ?? "";
  if (!name) r3.problem("missing-name", "name \u304C\u3042\u308A\u307E\u305B\u3093");
  const nickname = r3.string("nickname") || name;
  const alias = (r3.string("alias") ?? "").replace(/^@+/, "").trim();
  if (id === null) return { value: null, problems: r3.problems };
  return { value: { path, id, name, nickname, alias: alias || id, labels: r3.strings("label"), created: r3.datetime("created") }, problems: r3.problems };
}

// ../pkm-task/src/core/status-log.ts
var STATUS_VIAS = ["ui", "timer", "undo", "mcp"];
var STATUS_LOG_PATH_RE = /^statuslog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
var isStatus = (v3) => typeof v3 === "string" && STATUSES.includes(v3);
function parseStatusLog(path, text2) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text2.split("\n").forEach((raw, i3) => {
    const line = i3 + 1;
    if (!raw.trim()) return;
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      problem(line, "invalid-json", "JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
      return;
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      problem(line, "invalid-json", "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    const o3 = obj;
    if (typeof o3.id !== "string" || !o3.id) return problem(line, "invalid-status-log", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    const atMs = typeof o3.at === "string" ? Date.parse(o3.at) : Number.NaN;
    if (Number.isNaN(atMs)) return problem(line, "invalid-status-log", "at \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (typeof o3.task !== "string" || !o3.task) return problem(line, "invalid-status-log", "task \u304C\u3042\u308A\u307E\u305B\u3093");
    if (!isStatus(o3.from) || !isStatus(o3.to)) return problem(line, "invalid-status-log", "from / to \u304C status \u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const via = STATUS_VIAS.includes(o3.via) ? o3.via : null;
    if (via === null) return problem(line, "invalid-status-log", "via \u304C\u4E0D\u6B63\u3067\u3059");
    entries.push({ path, line, id: o3.id, at: o3.at, atMs, task: o3.task, from: o3.from, to: o3.to, via });
  });
  return { entries, problems };
}
function compareStatusLog(a3, b2) {
  if (a3.atMs !== b2.atMs) return a3.atMs - b2.atMs;
  if (a3.path !== b2.path) return a3.path < b2.path ? -1 : 1;
  return a3.line - b2.line;
}

// ../pkm-task/src/core/index.ts
var INACTIVE_STATUSES = ["closed", "canceled", "someday"];
function isActive(issue) {
  return !INACTIVE_STATUSES.includes(issue.status);
}
function isInbox(issue) {
  return issue.status === "open" && issue.scheduled.length === 0 && issue.softDeadline === null && issue.deadline === null;
}
function isScheduledAhead(issue, today) {
  return isActive(issue) && issue.scheduled.some((d3) => d3 >= today);
}
function compareNullableAsc(a3, b2) {
  if (a3 === b2) return 0;
  if (a3 === null) return -1;
  if (b2 === null) return 1;
  return a3 < b2 ? -1 : 1;
}
function organizeQueue(issues, today) {
  const inbox = [];
  const revisitDue = [];
  const someday = [];
  for (const issue of issues) {
    if (isInbox(issue)) inbox.push(issue);
    else if (issue.status === "someday") {
      if (issue.revisit !== null && issue.revisit <= today) revisitDue.push(issue);
      else someday.push(issue);
    }
  }
  inbox.sort((a3, b2) => compareNullableAsc(a3.created, b2.created));
  revisitDue.sort((a3, b2) => compareNullableAsc(a3.revisit, b2.revisit));
  someday.sort((a3, b2) => compareNullableAsc(a3.reviewed, b2.reviewed));
  return [...inbox, ...revisitDue, ...someday];
}

// ../pkm-task/src/core/groups.ts
var GROUPS_PATH = "issue/board-groups.json";
function parseGroup(value, depth, problems) {
  const o3 = typeof value === "object" && value !== null ? value : {};
  const name = typeof o3.name === "string" ? o3.name.trim() : "";
  if (!name || name.includes("/")) {
    problems.push(`\u30B0\u30EB\u30FC\u30D7\u540D\u304C\u306A\u3044\u304B\u3001/ \u3092\u542B\u3093\u3067\u3044\u307E\u3059: ${JSON.stringify(value)}`);
    return null;
  }
  const children = [];
  if (Array.isArray(o3.children)) {
    if (depth >= 1 && o3.children.length > 0) problems.push(`\u30B0\u30EB\u30FC\u30D7\u306F 2 \u968E\u5C64\u307E\u3067\u3067\u3059: ${name}`);
    else
      for (const c3 of o3.children) {
        const g2 = parseGroup(c3, depth + 1, problems);
        if (g2 && !children.some((x2) => x2.name === g2.name)) children.push(g2);
      }
  }
  return { name, children };
}
function parseGroups(text2) {
  const messages = [];
  let data;
  try {
    data = JSON.parse(text2);
  } catch {
    data = null;
    messages.push("JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
  }
  const groups = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      const g2 = parseGroup(item, 0, messages);
      if (g2 && !groups.some((x2) => x2.name === g2.name)) groups.push(g2);
    }
  } else if (data !== null) messages.push("\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
  return { groups, problems: messages.map((message) => ({ severity: "error", path: GROUPS_PATH, code: "invalid-groups", message })) };
}

// ../pkm-task/src/core/labels.ts
var LABELS_PATH = "issue/labels.json";
var DEFAULT_LABEL_COLOR = "#d0d0d0";
function parseLabels(text2) {
  const problems = [];
  const problem = (message) => problems.push({ severity: "error", path: LABELS_PATH, code: "invalid-labels", message });
  let data;
  try {
    data = JSON.parse(text2);
  } catch {
    problem("JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
    return { labels: [], problems };
  }
  if (!Array.isArray(data)) {
    problem("\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    return { labels: [], problems };
  }
  const labels = [];
  for (const item of data) {
    const o3 = typeof item === "object" && item !== null ? item : {};
    if (typeof o3.name !== "string" || !o3.name.trim()) {
      problem(`name \u306E\u306A\u3044 label \u304C\u3042\u308A\u307E\u3059: ${JSON.stringify(item)}`);
      continue;
    }
    const name = o3.name.trim();
    if (labels.some((l3) => l3.name === name)) {
      problem(`label \u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059: ${name}`);
      continue;
    }
    const color = typeof o3.color === "string" && /^#[0-9a-f]{3,8}$/i.test(o3.color) ? o3.color : DEFAULT_LABEL_COLOR;
    labels.push({ name, color });
  }
  return { labels, problems };
}

// ../pkm-task/src/core/load.ts
function fileKind(path) {
  if (path === LABELS_PATH) return "labels";
  if (path === GROUPS_PATH) return "groups";
  if (DAILY_PATH_RE.test(path)) return "daily";
  if (WORKLOG_PATH_RE.test(path)) return "worklog";
  if (BOARD_LOG_PATH_RE.test(path)) return "board";
  if (STATUS_LOG_PATH_RE.test(path)) return "statuslog";
  const m3 = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
  return m3 ? m3[1] : null;
}
function collectVault(input) {
  const data = { issues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], groups: [], statusLogs: [], placements: [], orders: [] };
  const problems = [];
  const initialBoards = /* @__PURE__ */ new Map();
  for (const { path, frontmatter } of [...input.markdown].sort((a3, b2) => a3.path.localeCompare(b2.path, "en", { numeric: true }))) {
    const kind = fileKind(path);
    if (kind === "daily") {
      if (frontmatter && frontmatter[BOARD_KEY] !== void 0) {
        initialBoards.set(DAILY_PATH_RE.exec(path)[1], parseBoard(frontmatter[BOARD_KEY]));
      }
      continue;
    }
    if (kind !== "issue" && kind !== "routine" && kind !== "member") continue;
    if (frontmatter === null) {
      problems.push({ severity: "error", path, code: "missing-frontmatter", message: "frontmatter \u304C\u306A\u3044\u304B\u3001YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093" });
      continue;
    }
    if (kind === "issue") {
      const r3 = parseIssue(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) data.issues.push(r3.value);
    } else if (kind === "routine") {
      const r3 = parseRoutine(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) data.routines.push(r3.value);
    } else {
      const r3 = parseMember(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) data.members.push(r3.value);
    }
  }
  for (const { path, text: text2 } of [...input.worklogs].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseWorklog(path, text2);
    problems.push(...r3.problems);
    data.worklogs.push(...r3.entries);
  }
  const logsByDate = /* @__PURE__ */ new Map();
  const allLogs = [];
  for (const { path, text: text2 } of [...input.boardLogs ?? []].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseBoardLog(path, text2);
    problems.push(...r3.problems);
    allLogs.push(...r3.entries);
    for (const e3 of r3.entries) logsByDate.set(e3.date, [...logsByDate.get(e3.date) ?? [], e3]);
  }
  for (const date of [.../* @__PURE__ */ new Set([...initialBoards.keys(), ...logsByDate.keys()])].sort()) {
    const logs = logsByDate.get(date) ?? [];
    const removed = removedTasks(logs);
    data.boards.push({
      date,
      path: dailyNotePath(date),
      board: replayBoard(initialBoards.get(date) ?? emptyBoard(), logs),
      ...logs.length > 0 ? { latestAt: Math.max(...logs.map((e3) => e3.atMs)) } : {},
      ...removed.length > 0 ? { removed } : {}
    });
  }
  data.placements = placementHistory(initialBoards, allLogs);
  data.orders = orderHistory(allLogs);
  for (const { path, text: text2 } of [...input.statusLogs ?? []].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseStatusLog(path, text2);
    problems.push(...r3.problems);
    data.statusLogs.push(...r3.entries);
  }
  data.statusLogs.sort(compareStatusLog);
  if (input.labels !== null) {
    const r3 = parseLabels(input.labels);
    problems.push(...r3.problems);
    data.labels = r3.labels;
  }
  if (input.groups) {
    const r3 = parseGroups(input.groups);
    problems.push(...r3.problems);
    data.groups = r3.groups;
  }
  return { data, problems };
}

// ../pkm-template/src/core/note-title.ts
var WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
function text(value) {
  const s3 = typeof value === "string" ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  const t3 = s3.trim();
  return t3 === "" ? null : t3;
}
function noteTitle(frontmatter, basename) {
  return text(frontmatter?.title) ?? text(frontmatter?.name) ?? basename;
}
function dailyDate(basename) {
  const m3 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(basename);
  if (!m3) return null;
  const [year, month, day] = [Number(m3[1]), Number(m3[2]), Number(m3[3])];
  const d3 = new Date(Date.UTC(year, month - 1, day));
  if (d3.getUTCFullYear() !== year || d3.getUTCMonth() !== month - 1 || d3.getUTCDate() !== day) return null;
  const weekday = d3.getUTCDay();
  return { date: basename, weekday, label: `${basename} ${WEEKDAYS[weekday]}` };
}

// src/core/sections.ts
var issuePaths = (issues) => [...issues].map((i3) => i3.path);
var SECTIONS = [
  // 閉じた変更も見えるよう、Issues は closed / canceled / someday も含むすべて
  { id: "issues", title: "Issues", command: "pkm-task:open-issues", paths: (p3) => issuePaths(p3.issues) },
  { id: "inbox", title: "Inbox", command: "pkm-task:open-inbox", paths: (p3) => issuePaths(p3.issues.filter(isInbox)) },
  { id: "organize", title: "Organize", command: "pkm-task:open-organize", paths: (p3) => issuePaths(organizeQueue(p3.issues, p3.today)) },
  { id: "scheduled", title: "Scheduled", command: "pkm-task:open-scheduled", paths: (p3) => issuePaths(p3.issues.filter((i3) => isScheduledAhead(i3, p3.today))) },
  { id: "someday", title: "Someday", command: "pkm-task:open-someday", paths: (p3) => issuePaths(p3.issues.filter((i3) => i3.status === "someday")) },
  { id: "routines", title: "Routines", command: "pkm-task:open-routines", paths: (p3) => p3.routinePaths },
  { id: "members", title: "Members", command: "pkm-task:open-members", paths: (p3) => p3.memberPaths },
  { id: "daily", title: "Daily notes", command: "pkm-template:open-daily-list", paths: (p3) => p3.byType("daily") },
  { id: "notes", title: "Notes", command: "pkm-template:open-note-list", paths: (p3) => p3.byType("note") },
  { id: "sources", title: "Sources", command: "pkm-template:open-source-list", paths: (p3) => p3.byType("source") }
];
function updatedMs(value) {
  const ms = value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(ms) ? null : ms;
}
function prepare(notes, today) {
  const task = notes.filter((n2) => {
    const kind = fileKind(n2.path);
    return kind === "issue" || kind === "routine" || kind === "member";
  });
  const { data } = collectVault({ markdown: task.map((n2) => ({ path: n2.path, frontmatter: n2.frontmatter })), worklogs: [], labels: null });
  const titles = /* @__PURE__ */ new Map();
  for (const i3 of data.issues) titles.set(i3.path, `${i3.id} ${i3.summary}`.trim());
  for (const r3 of data.routines) titles.set(r3.path, `${r3.id} ${r3.summary}`.trim());
  for (const m3 of data.members) titles.set(m3.path, m3.nickname || m3.name || m3.id);
  const typed = /* @__PURE__ */ new Map();
  for (const n2 of notes) {
    const type = n2.frontmatter?.type;
    if (typeof type !== "string") continue;
    typed.set(type, [...typed.get(type) ?? [], n2.path]);
    if (!titles.has(n2.path)) {
      const title = type === "daily" ? dailyDate(n2.basename)?.label ?? n2.basename : noteTitle(n2.frontmatter ?? void 0, n2.basename);
      titles.set(n2.path, title);
    }
  }
  return {
    issues: data.issues,
    routinePaths: data.routines.map((r3) => r3.path),
    memberPaths: data.members.map((m3) => m3.path),
    byType: (type) => typed.get(type) ?? [],
    today,
    titles
  };
}
function buildSections(notes, since, today) {
  const changed = /* @__PURE__ */ new Map();
  for (const n2 of notes) {
    const ms = updatedMs(n2.frontmatter?.updated);
    if (ms !== null && (since === null || ms > since)) changed.set(n2.path, ms);
  }
  if (changed.size === 0) return [];
  const p3 = prepare(notes, today);
  const out = [];
  for (const def of SECTIONS) {
    const items = [...new Set(def.paths(p3))].filter((path) => changed.has(path)).map((path) => ({ path, title: p3.titles.get(path) ?? path, updatedMs: changed.get(path) })).sort((a3, b2) => b2.updatedMs - a3.updatedMs || a3.path.localeCompare(b2.path, "en", { numeric: true }));
    if (items.length > 0) out.push({ id: def.id, title: def.title, command: def.command, items });
  }
  return out;
}
function uniqueCount(sections) {
  return new Set(sections.flatMap((s3) => s3.items.map((i3) => i3.path))).size;
}

// src/core/viewed-log.ts
var VIEWED_LOG_PATH_RE = /^updates\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
function isViewedLogPath(path) {
  return VIEWED_LOG_PATH_RE.test(path);
}
function viewedLogPath(device, at) {
  const safe = sanitizeDeviceName(device);
  if (!safe) throw new Error("\u7AEF\u672B\u540D\u304C\u7A7A\u3067\u3059");
  const month = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
  return `updates/${safe}/${month}.jsonl`;
}
function serializeViewed(viewedAt) {
  return JSON.stringify({ viewed_at: viewedAt });
}
function appendViewedLine(text2, line) {
  const base = text2 === "" || text2.endsWith("\n") ? text2 : `${text2}
`;
  return `${base}${line}
`;
}
function latestViewed(texts) {
  let latest = null;
  for (const text2 of texts) {
    for (const line of text2.split("\n")) {
      if (line.trim() === "") continue;
      let value;
      try {
        value = JSON.parse(line);
      } catch {
        continue;
      }
      const at = typeof value === "object" && value !== null ? value.viewed_at : void 0;
      const ms = typeof at === "string" ? Date.parse(at) : NaN;
      if (!Number.isNaN(ms) && (latest === null || ms > latest)) latest = ms;
    }
  }
  return latest;
}

// src/obsidian/model.ts
var UpdatesModel = class {
  constructor(app) {
    this.app = app;
  }
  app;
  sections = [];
  count = 0;
  /** 基準の日時（ミリ秒）。まだ一度も Viewed を押していなければ null */
  since = null;
  /** 作り直すたびに増える。UI の再描画に使う */
  version = 0;
  logs = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  timer = null;
  async load(registerEvent) {
    const { vault, metadataCache } = this.app;
    await Promise.all(vault.getFiles().filter((f4) => isViewedLogPath(f4.path)).map((f4) => this.readLog(f4)));
    for (const ref of [
      metadataCache.on("changed", () => this.schedule()),
      metadataCache.on("deleted", () => this.schedule()),
      vault.on("create", (file) => this.onFile(file)),
      vault.on("modify", (file) => this.onFile(file)),
      vault.on("delete", (file) => {
        this.logs.delete(file.path);
        this.schedule();
      }),
      vault.on("rename", (file, oldPath) => {
        this.logs.delete(oldPath);
        this.onFile(file);
        this.schedule();
      })
    ])
      registerEvent(ref);
    this.rebuild();
  }
  unload() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.listeners.clear();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  /** 今の日時を記録し、リストを空にする。記録の書き込みを待たずに基準を進める */
  async markViewed(device, now = /* @__PURE__ */ new Date()) {
    const path = (0, import_obsidian.normalizePath)(viewedLogPath(device, now));
    const line = serializeViewed(localDateTime(now));
    this.since = Math.max(this.since ?? 0, Math.floor(now.getTime() / 1e3) * 1e3);
    this.rebuild();
    const file = await this.getOrCreate(path);
    await this.app.vault.process(file, (text2) => appendViewedLine(text2, line));
  }
  onFile(file) {
    if (file instanceof import_obsidian.TFile && isViewedLogPath(file.path)) void this.readLog(file).then(() => this.schedule());
    else this.schedule();
  }
  async readLog(file) {
    this.logs.set(file.path, await this.app.vault.cachedRead(file));
  }
  async getOrCreate(path) {
    const existing = this.app.vault.getFileByPath(path);
    if (existing) return existing;
    const parts = path.split("/").slice(0, -1);
    for (let i3 = 1; i3 <= parts.length; i3++) {
      const folder = parts.slice(0, i3).join("/");
      if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
    }
    return this.app.vault.create(path, "");
  }
  schedule() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.rebuild();
    }, 300);
  }
  rebuild() {
    const logged = latestViewed(this.logs.values());
    if (logged !== null) this.since = Math.max(this.since ?? logged, logged);
    const notes = this.app.vault.getMarkdownFiles().map((file) => {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      return { path: file.path, basename: file.basename, frontmatter: fm ? { ...fm } : null };
    });
    this.sections = buildSections(notes, this.since, localToday());
    this.count = uniqueCount(this.sections);
    this.version++;
    for (const fn of this.listeners) fn();
  }
};

// src/obsidian/view.ts
var import_obsidian2 = require("obsidian");

// ../../node_modules/.pnpm/preact@10.29.8/node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var a;
var s;
var h;
var p;
var v;
var y;
var d = {};
var w = [];
var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var g = Array.isArray;
function m(n2, l3) {
  for (var u4 in l3) n2[u4] = l3[u4];
  return n2;
}
function b(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function k(l3, u4, t3) {
  var i3, r3, o3, e3 = {};
  for (o3 in u4) "key" == o3 ? i3 = u4[o3] : "ref" == o3 ? r3 = u4[o3] : e3[o3] = u4[o3];
  if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
  return x(l3, e3, i3, r3, null);
}
function x(n2, t3, i3, r3, o3) {
  var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
  return null == o3 && null != l.vnode && l.vnode(e3), e3;
}
function S(n2) {
  return n2.children;
}
function C(n2, l3) {
  this.props = n2, this.context = l3;
}
function $(n2, l3) {
  if (null == l3) return n2.__ ? $(n2.__, n2.__i + 1) : null;
  for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
  return "function" == typeof n2.type ? $(n2) : null;
}
function I(n2) {
  if (n2.__P && n2.__d) {
    var u4 = n2.__v, t3 = u4.__e, i3 = [], r3 = [], o3 = m({}, u4);
    o3.__v = u4.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u4, n2.__n, n2.__P.namespaceURI, 32 & u4.__u ? [t3] : null, i3, null == t3 ? $(u4) : t3, !!(32 & u4.__u), r3), o3.__v = u4.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u4.__e = u4.__ = null, o3.__e != t3 && P(o3);
  }
}
function P(n2) {
  if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l3) {
    if (null != l3 && null != l3.__e) return n2.__e = n2.__c.base = l3.__e;
  }), P(n2);
}
function A(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
}
function H() {
  try {
    for (var n2, l3 = 1; i.length; ) i.length > l3 && i.sort(e), n2 = i.shift(), l3 = i.length, I(n2);
  } finally {
    i.length = H.__r = 0;
  }
}
function L(n2, l3, u4, t3, i3, r3, o3, e3, f4, c3, a3) {
  var s3, h3, p3, v3, y3, _2, g2 = t3 && t3.__k || w, m3 = l3.length;
  for (f4 = T(u4, l3, g2, f4, m3), s3 = 0; s3 < m3; s3++) null != (p3 = u4.__k[s3]) && (h3 = -1 != p3.__i && g2[p3.__i] || d, p3.__i = s3, _2 = q(n2, p3, h3, i3, r3, o3, e3, f4, c3, a3), v3 = p3.__e, p3.ref && h3.ref != p3.ref && (h3.ref && J(h3.ref, null, p3), a3.push(p3.ref, p3.__c || v3, p3)), null == y3 && null != v3 && (y3 = v3), 4 & p3.__u ? (f4 = j(p3, f4, n2), h3.__e && (h3.__e = null)) : "function" == typeof p3.type && void 0 !== _2 ? f4 = _2 : v3 && (f4 = v3.nextSibling), p3.__u &= -7);
  return u4.__e = y3, f4;
}
function T(n2, l3, u4, t3, i3) {
  var r3, o3, e3, f4, c3, a3 = u4.length, s3 = a3, h3 = 0;
  for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f4 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = O(o3, u4, f4, s3)) && (s3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > a3 ? h3-- : i3 < a3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h3-- : c3 == f4 + 1 ? h3++ : (c3 > f4 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
  if (s3) for (r3 = 0; r3 < a3; r3++) null != (e3 = u4[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = $(e3)), K(e3, e3));
  return t3;
}
function j(n2, l3, u4) {
  var t3, i3;
  if ("function" == typeof n2.type) {
    for (t3 = n2.__k, i3 = 0; t3 && i3 < t3.length; i3++) t3[i3] && (t3[i3].__ = n2, l3 = j(t3[i3], l3, u4));
    return l3;
  }
  n2.__e != l3 && (l3 && n2.type && !l3.parentNode && (l3 = $(n2)), l3 = u4.insertBefore(n2.__e, l3 || null));
  do {
    l3 = l3 && l3.nextSibling;
  } while (null != l3 && 8 == l3.nodeType);
  return l3;
}
function O(n2, l3, u4, t3) {
  var i3, r3, o3, e3 = n2.key, f4 = n2.type, c3 = l3[u4], a3 = null != c3 && 0 == (2 & c3.__u);
  if (null === c3 && null == e3 || a3 && e3 == c3.key && f4 == c3.type) return u4;
  if (t3 > (a3 ? 1 : 0)) {
    for (i3 = u4 - 1, r3 = u4 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f4 == c3.type) return o3;
  }
  return -1;
}
function z(n2, l3, u4) {
  "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || _.test(l3) ? u4 : u4 + "px";
}
function N(n2, l3, u4, t3, i3) {
  var r3, o3;
  n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
  else {
    if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || z(n2.style, l3, "");
    if (u4) for (l3 in u4) t3 && u4[l3] == t3[l3] || z(n2.style, l3, u4[l3]);
  }
  else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(s, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u4, u4 ? t3 ? u4[a] = t3[a] : (u4[a] = h, n2.addEventListener(l3, r3 ? v : p, r3)) : n2.removeEventListener(l3, r3 ? v : p, r3);
  else {
    if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
      n2[l3] = null == u4 ? "" : u4;
      break n;
    } catch (n3) {
    }
    "function" == typeof u4 || (null == u4 || false === u4 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
  }
}
function V(n2) {
  return function(u4) {
    if (this.l) {
      var t3 = this.l[u4.type + n2];
      if (null == u4[c]) u4[c] = h++;
      else if (u4[c] < t3[a]) return;
      return t3(l.event ? l.event(u4) : u4);
    }
  };
}
function q(n2, u4, t3, i3, r3, o3, e3, f4, c3, a3) {
  var s3, h3, p3, v3, y3, d3, _2, k3, x2, M, I2, P2, A3, H2, T3, j3, F = u4.type;
  if (void 0 !== u4.constructor) return null;
  128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f4 = u4.__e = t3.__e]), (s3 = l.__b) && s3(u4);
  n: if ("function" == typeof F) {
    h3 = e3.length;
    try {
      if (x2 = u4.props, M = F.prototype && F.prototype.render, I2 = (s3 = F.contextType) && i3[s3.__c], P2 = s3 ? I2 ? I2.props.value : s3.__ : i3, t3.__c ? k3 = (p3 = u4.__c = t3.__c).__ = p3.__E : (M ? u4.__c = p3 = new F(x2, P2) : (u4.__c = p3 = new C(x2, P2), p3.constructor = F, p3.render = Q), I2 && I2.sub(p3), p3.state || (p3.state = {}), p3.__n = i3, v3 = p3.__d = true, p3.__h = [], p3._sb = []), M && null == p3.__s && (p3.__s = p3.state), M && null != F.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = m({}, p3.__s)), m(p3.__s, F.getDerivedStateFromProps(x2, p3.__s))), y3 = p3.props, d3 = p3.state, p3.__v = u4, v3) M && null == F.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), M && null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
      else {
        if (M && null == F.getDerivedStateFromProps && x2 !== y3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(x2, P2), u4.__v == t3.__v || !p3.__e && null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(x2, p3.__s, P2)) {
          u4.__v != t3.__v && (p3.props = x2, p3.state = p3.__s, p3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
            n3 && (n3.__ = u4);
          }), w.push.apply(p3.__h, p3._sb), p3._sb = [], p3.__h.length && e3.push(p3), f4 = $(t3);
          break n;
        }
        null != p3.componentWillUpdate && p3.componentWillUpdate(x2, p3.__s, P2), M && null != p3.componentDidUpdate && p3.__h.push(function() {
          p3.componentDidUpdate(y3, d3, _2);
        });
      }
      if (p3.context = P2, p3.props = x2, p3.__P = n2, p3.__e = false, A3 = l.__r, H2 = 0, M) p3.state = p3.__s, p3.__d = false, A3 && A3(u4), s3 = p3.render(p3.props, p3.state, p3.context), w.push.apply(p3.__h, p3._sb), p3._sb = [];
      else do {
        p3.__d = false, A3 && A3(u4), s3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
      } while (p3.__d && ++H2 < 25);
      p3.state = p3.__s, null != p3.getChildContext && (i3 = m(m({}, i3), p3.getChildContext())), M && !v3 && null != p3.getSnapshotBeforeUpdate && (_2 = p3.getSnapshotBeforeUpdate(y3, d3)), T3 = null != s3 && s3.type === S && null == s3.key ? E(s3.props.children) : s3, f4 = L(n2, g(T3) ? T3 : [T3], u4, t3, i3, r3, o3, e3, f4, c3, a3), p3.base = u4.__e, u4.__u &= -161, p3.__h.length && e3.push(p3), k3 && (p3.__E = p3.__ = null);
    } catch (n3) {
      if (e3.length = h3, u4.__v = null, c3 || null != o3) {
        if (n3.then) {
          for (u4.__u |= c3 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
          null != o3 && (o3[o3.indexOf(f4)] = null), u4.__e = f4;
        } else if (null != o3) for (j3 = o3.length; j3--; ) b(o3[j3]);
      } else u4.__e = t3.__e;
      null == u4.__k && (u4.__k = t3.__k || []), n3.then || B(u4), l.__e(n3, u4, t3);
    }
  } else null == o3 && u4.__v == t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : f4 = u4.__e = G(t3.__e, u4, t3, i3, r3, o3, e3, c3, a3);
  return (s3 = l.diffed) && s3(u4), 128 & u4.__u ? void 0 : f4;
}
function B(n2) {
  n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
}
function D(n2, u4, t3) {
  for (var i3 = 0; i3 < t3.length; i3++) J(t3[i3], t3[++i3], t3[++i3]);
  l.__c && l.__c(u4, n2), n2.some(function(u5) {
    try {
      n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
        n3.call(u5);
      });
    } catch (n3) {
      l.__e(n3, u5.__v);
    }
  });
}
function E(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m({}, n2);
}
function G(u4, t3, i3, r3, o3, e3, f4, c3, a3) {
  var s3, h3, p3, v3, y3, w3, _2, m3 = i3.props || d, k3 = t3.props, x2 = t3.type;
  if ("svg" == x2 ? o3 = "http://www.w3.org/2000/svg" : "math" == x2 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
    for (s3 = 0; s3 < e3.length; s3++) if ((y3 = e3[s3]) && "setAttribute" in y3 == !!x2 && (x2 ? y3.localName == x2 : 3 == y3.nodeType)) {
      u4 = y3, e3[s3] = null;
      break;
    }
  }
  if (null == u4) {
    if (null == x2) return document.createTextNode(k3);
    u4 = document.createElementNS(o3, x2, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
  }
  if (null == x2) m3 === k3 || c3 && u4.data == k3 || (u4.data = k3);
  else {
    if (e3 = "textarea" == x2 && null != k3.defaultValue ? null : e3 && n.call(u4.childNodes), !c3 && null != e3) for (m3 = {}, s3 = 0; s3 < u4.attributes.length; s3++) m3[(y3 = u4.attributes[s3]).name] = y3.value;
    for (s3 in m3) y3 = m3[s3], "dangerouslySetInnerHTML" == s3 ? p3 = y3 : "children" == s3 || s3 in k3 || "value" == s3 && "defaultValue" in k3 || "checked" == s3 && "defaultChecked" in k3 || N(u4, s3, null, y3, o3);
    for (s3 in k3) y3 = k3[s3], "children" == s3 ? v3 = y3 : "dangerouslySetInnerHTML" == s3 ? h3 = y3 : "value" == s3 ? w3 = y3 : "checked" == s3 ? _2 = y3 : c3 && "function" != typeof y3 || m3[s3] === y3 || N(u4, s3, y3, m3[s3], o3);
    if (h3) c3 || p3 && (h3.__html == p3.__html || h3.__html == u4.innerHTML) || (u4.innerHTML = h3.__html), t3.__k = [];
    else if (p3 && (u4.innerHTML = ""), L("template" == t3.type ? u4.content : u4, g(v3) ? v3 : [v3], t3, i3, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e3, f4, e3 ? e3[0] : i3.__k && $(i3, 0), c3, a3), null != e3) for (s3 = e3.length; s3--; ) b(e3[s3]);
    c3 && "textarea" != x2 || (s3 = "value", "progress" == x2 && null == w3 ? u4.removeAttribute("value") : null != w3 && (w3 !== u4[s3] || "progress" == x2 && !w3 || "option" == x2 && w3 != m3[s3]) && N(u4, s3, w3, m3[s3], o3), s3 = "checked", null != _2 && _2 != u4[s3] && N(u4, s3, _2, m3[s3], o3));
  }
  return u4;
}
function J(n2, u4, t3) {
  try {
    if ("function" == typeof n2) {
      var i3 = "function" == typeof n2.__u;
      i3 && n2.__u(), i3 && null == u4 || (n2.__u = n2(u4));
    } else n2.current = u4;
  } catch (n3) {
    l.__e(n3, t3);
  }
}
function K(n2, u4, t3) {
  var i3, r3;
  if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || J(i3, null, u4)), null != (i3 = n2.__c)) {
    if (i3.componentWillUnmount) try {
      i3.componentWillUnmount();
    } catch (n3) {
      l.__e(n3, u4);
    }
    i3.base = i3.__P = i3.__n = null;
  }
  if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && K(i3[r3], u4, t3 || "function" != typeof n2.type);
  t3 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function Q(n2, l3, u4) {
  return this.constructor(n2, u4);
}
function R(u4, t3, i3) {
  var r3, o3, e3, f4;
  t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f4 = [], q(t3, u4 = (!r3 && i3 || t3).__k = k(S, null, [u4]), o3 || d, d, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f4), D(e3, u4, f4), u4.props.children = null;
}
n = w.slice, l = { __e: function(n2, l3, u4, t3) {
  for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
    if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3) return i3.__E = i3;
  } catch (l4) {
    n2 = l4;
  }
  throw n2;
} }, u = 0, t = function(n2) {
  return null != n2 && void 0 === n2.constructor;
}, C.prototype.setState = function(n2, l3) {
  var u4;
  u4 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u4), this.props)), n2 && m(u4, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), A(this));
}, C.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
}, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
  return n2.__v.__b - l3.__v.__b;
}, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

// src/obsidian/view.ts
function preactViewCreator(spec, component, props) {
  class PreactView extends import_obsidian2.ItemView {
    getViewType() {
      return spec.type;
    }
    getDisplayText() {
      return spec.title;
    }
    getIcon() {
      return spec.icon;
    }
    async onOpen() {
      this.contentEl.addClass("vt-upd-view");
      R(k(component, props), this.contentEl);
    }
    async onClose() {
      R(null, this.contentEl);
    }
  }
  return (leaf) => new PreactView(leaf);
}

// src/views/UpdatesView.tsx
var import_obsidian3 = require("obsidian");

// ../../node_modules/.pnpm/preact@10.29.8/node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var p2 = c2.__;
function s2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
}
function d2(n2) {
  return o2 = 1, y2(D2, n2);
}
function y2(n2, u4, i3) {
  var o3 = s2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u4) : D2(void 0, u4), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
    t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r2, !r2.__f)) {
    var f4 = function(n3, t3, r3) {
      if (!o3.__c.__H) return true;
      var u5 = false, i4 = o3.__c.props !== n3;
      if (o3.__c.__H.__.some(function(n4) {
        if (n4.__N) {
          u5 = true;
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
        }
      }), c3) {
        var f5 = c3.call(this, n3, t3, r3);
        return u5 ? f5 || i4 : f5;
      }
      return !u5 || i4;
    };
    r2.__f = true;
    var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
    r2.componentWillUpdate = function(n3, t3, r3) {
      if (this.__e) {
        var u5 = c3;
        c3 = void 0, f4(n3, t3, r3), c3 = u5;
      }
      e3 && e3.call(this, n3, t3, r3);
    }, r2.shouldComponentUpdate = f4;
  }
  return o3.__N || o3.__;
}
function h2(n2, u4) {
  var i3 = s2(t2++, 3);
  !c2.__s && C2(i3.__H, u4) && (i3.__ = n2, i3.u = u4, r2.__H.__h.push(i3));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r3) {
  var u4 = s2(t2++, 7);
  return C2(u4.__H, r3) && (u4.__ = n2(), u4.__H = r3, u4.__h = n2), u4.__;
}
function j2() {
  for (var n2; n2 = f2.shift(); ) {
    var t3 = n2.__H;
    if (n2.__P && t3) try {
      t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
    } catch (r3) {
      t3.__h = [], c2.__e(r3, n2.__v);
    }
  }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), p2 && p2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i3 = (r2 = n2.__c).__H;
  i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
    n3.u && (n3.__H = n3.u, n3.u = void 0);
  })), u2 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.some(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
};
var k2 = "function" == typeof requestAnimationFrame;
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u4), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u4 = setTimeout(r3, 35);
  k2 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u4 = n2.__c;
  "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}
function D2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
}

// src/core/format.ts
function formatDateTime(ms, now = /* @__PURE__ */ new Date()) {
  const d3 = new Date(ms);
  const pad = (n2) => String(n2).padStart(2, "0");
  const md = `${pad(d3.getMonth() + 1)}/${pad(d3.getDate())} ${pad(d3.getHours())}:${pad(d3.getMinutes())}`;
  return d3.getFullYear() === now.getFullYear() ? md : `${d3.getFullYear()}/${md}`;
}

// src/core/paging.ts
var PAGE_SIZE = 50;
function visibleSections(sections, limit) {
  const out = [];
  let left = Math.max(0, limit);
  for (const s3 of sections) {
    if (left === 0) break;
    const items = s3.items.slice(0, left);
    left -= items.length;
    out.push({ ...s3, items });
  }
  return out;
}
function totalRows(sections) {
  return sections.reduce((n2, s3) => n2 + s3.items.length, 0);
}

// ../../node_modules/.pnpm/preact@10.29.8/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f3 = 0;
function u3(e3, t3, n2, o3, i3, u4) {
  t3 || (t3 = {});
  var a3, c3, p3 = t3;
  if ("ref" in p3) for (c3 in p3 = {}, t3) "ref" == c3 ? a3 = t3[c3] : p3[c3] = t3[c3];
  var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
  if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c3 in a3) void 0 === p3[c3] && (p3[c3] = a3[c3]);
  return l.vnode && l.vnode(l3), l3;
}

// src/views/UpdatesView.tsx
function useModelVersion(model) {
  const [version, setVersion] = d2(model.version);
  h2(() => model.subscribe(() => setVersion(model.version)), [model]);
  return version;
}
function UpdatesView({ app, model, deviceName }) {
  useModelVersion(model);
  const [limit, setLimit] = d2(PAGE_SIZE);
  const [saving, setSaving] = d2(false);
  const sentinel = A2(null);
  const total = totalRows(model.sections);
  const shown = visibleSections(model.sections, limit);
  const more = limit < total;
  h2(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e3) => e3.isIntersecting)) setLimit((n2) => n2 + PAGE_SIZE);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [more, limit]);
  const openList = (title, command) => {
    const commands = app.commands;
    if (!commands.executeCommandById(command)) new import_obsidian3.Notice(`${title} \u3092\u958B\u3051\u307E\u305B\u3093: ${command.split(":")[0]} \u304C\u6709\u52B9\u306B\u306A\u3063\u3066\u3044\u307E\u305B\u3093`);
  };
  const openNote = (path, newTab) => {
    const file = app.vault.getFileByPath(path);
    if (file) void openInNotePane(app.workspace, file, { newTab, phone: import_obsidian3.Platform.isPhone });
  };
  const device = deviceName();
  const viewed = async () => {
    setSaving(true);
    try {
      await model.markViewed(device);
      setLimit(PAGE_SIZE);
    } catch (e3) {
      console.error("pkm-updates: Viewed \u3092\u8A18\u9332\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
      new import_obsidian3.Notice(`Viewed \u3092\u8A18\u9332\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F${e3 instanceof Error ? `: ${e3.message}` : ""}`);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ u3("div", { class: "vt-upd-page", children: [
    /* @__PURE__ */ u3("p", { class: "vt-upd-since", children: model.since === null ? "Not viewed yet. Showing all notes" : `Last viewed: ${formatDateTime(model.since)}` }),
    shown.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-upd-empty", children: "No notes changed since you last viewed" }) : shown.map((s3) => /* @__PURE__ */ u3("section", { class: "vt-upd-section", "aria-labelledby": `vt-upd-${s3.id}`, children: [
      /* @__PURE__ */ u3("h2", { class: "vt-upd-heading", id: `vt-upd-${s3.id}`, children: [
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-upd-heading-link", onClick: () => openList(s3.title, s3.command), children: s3.title }),
        /* @__PURE__ */ u3("span", { class: "vt-upd-count", children: model.sections.find((x2) => x2.id === s3.id)?.items.length ?? s3.items.length })
      ] }),
      /* @__PURE__ */ u3("ul", { class: "vt-upd-list", children: s3.items.map((item) => /* @__PURE__ */ u3("li", { children: /* @__PURE__ */ u3("button", { type: "button", class: "vt-upd-row", onClick: (e3) => openNote(item.path, import_obsidian3.Keymap.isModEvent(e3) !== false), children: [
        /* @__PURE__ */ u3("span", { class: "vt-upd-title", children: item.title }),
        /* @__PURE__ */ u3("span", { class: "vt-upd-time", children: formatDateTime(item.updatedMs) })
      ] }) }, item.path)) })
    ] }, s3.id)),
    more && /* @__PURE__ */ u3("div", { ref: sentinel, class: "vt-upd-sentinel", "aria-hidden": "true" }),
    /* @__PURE__ */ u3("div", { class: "vt-upd-footer", children: [
      !device && /* @__PURE__ */ u3("span", { class: "vt-upd-note", children: "Set a device name in pkm-task or pkm-git settings to record Viewed" }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-upd-viewed", disabled: !device || saving, onClick: () => void viewed(), children: "Viewed" })
    ] })
  ] });
}

// src/main.ts
var VIEW_TYPE = "pkm-updates-view";
var OPEN_COMMAND = "pkm-updates:open-view";
var BADGE_CHANGED_EVENT = "pkm-ribbon:badge-changed";
var BADGE_INTERVAL_MS = 1e3;
var PkmUpdatesPlugin = class extends import_obsidian4.Plugin {
  model = null;
  async onload() {
    const model = new UpdatesModel(this.app);
    this.model = model;
    this.registerView(VIEW_TYPE, preactViewCreator({ type: VIEW_TYPE, title: "PKM Updates", icon: "bell" }, UpdatesView, { app: this.app, model, deviceName: () => this.deviceName() }));
    this.addCommand({ id: "open-view", name: "Open PKM Updates", icon: "bell", callback: () => void openListView(this.app.workspace, VIEW_TYPE, { phone: import_obsidian4.Platform.isPhone }) });
    let lastCount = null;
    let lastSent = 0;
    let timer = null;
    const notify = () => {
      if (model.count === lastCount) return;
      const wait = lastSent + BADGE_INTERVAL_MS - Date.now();
      if (wait > 0) {
        if (timer === null)
          timer = window.setTimeout(() => {
            timer = null;
            notify();
          }, wait);
        return;
      }
      lastCount = model.count;
      lastSent = Date.now();
      this.app.workspace.trigger(BADGE_CHANGED_EVENT, OPEN_COMMAND);
    };
    const unsubscribe = model.subscribe(notify);
    this.register(() => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    });
    this.app.workspace.onLayoutReady(() => {
      void model.load((ref) => this.registerEvent(ref)).catch((e3) => console.error("pkm-updates: \u5909\u66F4\u306E\u4E00\u89A7\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    });
  }
  onunload() {
    this.model?.unload();
  }
  /** pkm-ribbon が尋ねるバッジの数（ADR-0070 の 6）。重複を除いたノートの数 */
  getRibbonBadge(command) {
    return command === OPEN_COMMAND ? this.model?.count ?? null : null;
  }
  /** Viewed の記録に使う端末名。pkm-task の設定、なければ pkm-git の設定から読む */
  deviceName() {
    const plugins = this.app.plugins?.plugins;
    for (const name of [plugins?.["pkm-task"]?.taskSettings?.deviceName, plugins?.["pkm-git"]?.settings?.deviceName]) {
      if (typeof name === "string" && name.trim()) return name.trim();
    }
    return "";
  }
};
