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
  default: () => PkmRibbonPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/core/buttons.ts
var BUTTONS = [
  { icon: "calendar", title: "\u4ECA\u65E5\u306E\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u3092\u958B\u304F", command: "pkm-template:open-todays-daily" },
  { icon: "sun", title: "\u4ECA\u65E5\u306E\u30BF\u30B9\u30AF\u3092\u958B\u304F", command: "pkm-task:open-daily" },
  { icon: "bell", title: "PKM Updates \u3092\u958B\u304F", command: "pkm-updates:open-view" },
  { icon: "list-plus", title: "issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210", command: "pkm-task:capture-issues" },
  { icon: "arrow-down-to-line", title: "Git: pull", command: "pkm-git:pull" },
  { icon: "arrow-up-from-line", title: "Git: push", command: "pkm-git:push" }
];
var BADGE_CHANGED_EVENT = "pkm-ribbon:badge-changed";
function pluginIdOf(command) {
  const i = command.indexOf(":");
  return i < 0 ? command : command.slice(0, i);
}
function badgeText(count) {
  if (typeof count !== "number" || !Number.isFinite(count)) return null;
  const n = Math.floor(count);
  if (n <= 0) return null;
  return n >= 100 ? "99+" : String(n);
}

// src/main.ts
var BADGE_CLASS = "vt-ribbon-badge";
var PkmRibbonPlugin = class extends import_obsidian.Plugin {
  onload() {
    const app = this.app;
    const icons = /* @__PURE__ */ new Map();
    for (const b of BUTTONS) {
      const el = this.addRibbonIcon(b.icon, b.title, () => {
        if (!app.commands.executeCommandById(b.command)) new import_obsidian.Notice(`${b.title}: ${pluginIdOf(b.command)} \u304C\u6709\u52B9\u306B\u306A\u3063\u3066\u3044\u307E\u305B\u3093`);
      });
      icons.set(b.command, { button: b, el });
    }
    const refresh = (command) => {
      const icon = icons.get(command);
      if (!icon) return;
      let count = null;
      try {
        count = app.plugins?.getPlugin?.(pluginIdOf(command))?.getRibbonBadge?.(command) ?? null;
      } catch (e) {
        console.error(`pkm-ribbon: ${command} \u306E\u30D0\u30C3\u30B8\u306E\u6570\u3092\u8AAD\u3081\u307E\u305B\u3093\u3067\u3057\u305F`, e);
      }
      setBadge(icon.el, icon.button.title, badgeText(count));
    };
    const refreshAll = () => {
      for (const command of icons.keys()) refresh(command);
    };
    this.registerEvent(this.app.workspace.on(BADGE_CHANGED_EVENT, (command) => typeof command === "string" && refresh(command)));
    this.app.workspace.onLayoutReady(refreshAll);
  }
};
function setBadge(el, title, text) {
  let badge = el.querySelector(`.${BADGE_CLASS}`);
  if (text === null) {
    badge?.remove();
    el.removeClass?.("vt-ribbon-badge-host");
    el.setAttribute("aria-label", title);
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = BADGE_CLASS;
    badge.setAttribute("aria-hidden", "true");
    el.appendChild(badge);
  }
  el.addClass?.("vt-ribbon-badge-host");
  badge.textContent = text;
  el.setAttribute("aria-label", `${title}\uFF08${text} \u4EF6\uFF09`);
}
