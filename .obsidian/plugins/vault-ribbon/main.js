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
  default: () => VaultRibbonPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var BUTTONS = [
  { icon: "calendar", title: "\u4ECA\u65E5\u306E\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u3092\u958B\u304F", command: "vault-template:open-todays-daily", plugin: "vault-template" },
  { icon: "calendar-check", title: "Daily \u3092\u958B\u304F", command: "vault-task:open-daily", plugin: "vault-task" }
];
var VaultRibbonPlugin = class extends import_obsidian.Plugin {
  onload() {
    const commands = this.app.commands;
    for (const b of BUTTONS) {
      this.addRibbonIcon(b.icon, b.title, () => {
        if (!commands.executeCommandById(b.command)) new import_obsidian.Notice(`${b.title}: ${b.plugin} \u304C\u6709\u52B9\u306B\u306A\u3063\u3066\u3044\u307E\u305B\u3093`);
      });
    }
  }
};
