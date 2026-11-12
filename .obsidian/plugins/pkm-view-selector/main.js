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
  default: () => PkmViewSelectorPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/views.ts
var SOURCE_PLUGINS = ["pkm-task", "pkm-template", "pkm-updates", "pkm-slide"];
var OPEN_PREFIX = /^Open\s+/;
var OPEN_SUFFIX = /\s*を開く$/;
function collectViews(commands, isViewType, isOpen) {
  const entries = [];
  for (const plugin of SOURCE_PLUGINS) {
    const prefix = `${plugin}:open-`;
    for (const c of commands) {
      if (!c.id.startsWith(prefix)) continue;
      const viewType = `${plugin}-${c.id.slice(prefix.length)}`;
      if (!isViewType(viewType)) continue;
      const bare = c.name.replace(/^[^:]*:\s*/, "");
      entries.push({ commandId: c.id, viewType, name: bare.replace(OPEN_PREFIX, "").replace(OPEN_SUFFIX, "") || bare, plugin, icon: c.icon, open: isOpen(viewType) });
    }
  }
  return entries;
}
function matchViews(query, entries) {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return [...entries];
  const scored = [];
  entries.forEach((entry, index) => {
    const score = Math.max(scoreOf(q, entry.name.toLowerCase()), scoreOf(q, entry.plugin.toLowerCase()) - 100);
    if (score > Number.NEGATIVE_INFINITY) scored.push({ entry, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.entry);
}
function scoreOf(q, text) {
  if (text.startsWith(q)) return 1e3 - text.length;
  const at = text.indexOf(q);
  if (at >= 0) return 500 - at;
  let pos = 0;
  let gaps = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, pos);
    if (found < 0) return Number.NEGATIVE_INFINITY;
    gaps += found - pos;
    pos = found + 1;
  }
  return 100 - gaps;
}

// src/main.ts
var ViewSelectorModal = class extends import_obsidian.SuggestModal {
  constructor(app, entries, run) {
    super(app);
    this.entries = entries;
    this.run = run;
    this.setPlaceholder("Find a View (Issues, Inbox, Notes \u2026)");
    this.emptyStateText = entries.length ? "No matching Views" : "View \u304C\u3042\u308A\u307E\u305B\u3093\uFF08pkm-task \u304B pkm-template \u304C\u6709\u52B9\u306B\u306A\u3063\u3066\u3044\u307E\u305B\u3093\uFF09";
    this.setInstructions([
      { command: "\u2191\u2193", purpose: "to navigate" },
      { command: "\u21B5", purpose: "to open" },
      { command: "esc", purpose: "to dismiss" }
    ]);
  }
  entries;
  run;
  getSuggestions(query) {
    return matchViews(query, this.entries);
  }
  renderSuggestion(entry, el) {
    el.addClass("mod-complex");
    const icon = el.createDiv({ cls: "suggestion-icon" }).createSpan({ cls: "suggestion-flair" });
    (0, import_obsidian.setIcon)(icon, entry.icon ?? "layout-list");
    const content = el.createDiv({ cls: "suggestion-content" });
    content.createDiv({ cls: "suggestion-title", text: entry.name });
    content.createDiv({ cls: "suggestion-note", text: entry.plugin });
    if (entry.open) el.createDiv({ cls: "suggestion-aux" }).createSpan({ cls: "suggestion-hotkey", text: "open" });
  }
  onChooseSuggestion(entry) {
    this.run(entry);
  }
};
var PkmViewSelectorPlugin = class extends import_obsidian.Plugin {
  onload() {
    this.addCommand({
      id: "open",
      name: "Find and open a View",
      icon: "layout-list",
      hotkeys: [{ modifiers: ["Mod"], key: "k" }],
      callback: () => this.openSelector()
    });
  }
  openSelector() {
    const app = this.app;
    const entries = collectViews(
      Object.values(app.commands.commands),
      (type) => type in app.viewRegistry.viewByType,
      (type) => app.workspace.getLeavesOfType(type).length > 0
    );
    new ViewSelectorModal(this.app, entries, (entry) => {
      app.commands.executeCommandById(entry.commandId);
    }).open();
  }
};
