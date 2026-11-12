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
  default: () => PkmSlidePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

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

// src/obsidian/actions.ts
var import_obsidian2 = require("obsidian");

// ../pkm-html/src/obsidian/open-external.ts
var import_obsidian = require("obsidian");

// ../pkm-html/src/core/policy.ts
var MAX_IMAGE_BYTES = 10 * 1024 * 1024;
function isSlideDeck(path) {
  return /^slide\/(?:[^/]+\/)+index\.html$/.test(path);
}

// ../pkm-html/src/obsidian/open-external.ts
function openSlideInBrowser(app, file) {
  if (!isSlideDeck(file.path)) return;
  const open = app.openWithDefaultApp;
  if (typeof open !== "function") {
    new import_obsidian.Notice("\u3053\u306E\u7AEF\u672B\u3067\u306F\u3001\u30D6\u30E9\u30A6\u30B6\u3067\u958B\u3051\u307E\u305B\u3093\u3002PC \u3067\u30B9\u30E9\u30A4\u30C9\u306E index.html \u3092\u30D6\u30E9\u30A6\u30B6\u3067\u958B\u3044\u3066\u304F\u3060\u3055\u3044");
    return;
  }
  try {
    open.call(app, file.path);
  } catch (e3) {
    console.error("pkm-html: \u30D6\u30E9\u30A6\u30B6\u3067\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    new import_obsidian.Notice(`\u30D6\u30E9\u30A6\u30B6\u3067\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F: ${e3 instanceof Error ? e3.message : String(e3)}`);
  }
}

// src/core/decks.ts
var SLIDE_ROOT = "slide";
var DECK_SOURCE = "deck.html";
var DECK_BUILD = "index.html";
var NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function nameError(name) {
  if (name === "") return "\u540D\u524D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  if (!NAME.test(name)) return "\u540D\u524D\u306F\u82F1\u5C0F\u6587\u5B57\u30FB\u6570\u5B57\u30FB\u30CF\u30A4\u30D5\u30F3\u3067\u66F8\u304D\u307E\u3059\uFF08\u4F8B: 2026-roadmap\uFF09";
  return null;
}
function baseName(path) {
  return path.slice(path.lastIndexOf("/") + 1);
}
function parentOf(path) {
  const i3 = path.lastIndexOf("/");
  return i3 === -1 ? "" : path.slice(0, i3);
}
function isWithin(a3, b2) {
  return a3 === b2 || a3.startsWith(`${b2}/`);
}
function classify(files, folders) {
  const fileSet = new Set(files);
  const deckPaths = files.filter((f4) => isWithin(f4, SLIDE_ROOT) && baseName(f4) === DECK_SOURCE && parentOf(f4) !== SLIDE_ROOT).map(parentOf).filter((d3, _2, all) => !all.some((o3) => o3 !== d3 && isWithin(d3, o3))).sort();
  const decks = deckPaths.map((path) => ({ path, built: fileSet.has(`${path}/${DECK_BUILD}`) }));
  const organizing = folders.filter((f4) => isWithin(f4, SLIDE_ROOT) && !deckPaths.some((d3) => isWithin(f4, d3)));
  const set = /* @__PURE__ */ new Set([SLIDE_ROOT, ...organizing]);
  return { decks, folders: [...set].sort() };
}
function deckTitle(source, path) {
  const m3 = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(source);
  const title = decodeEntities((m3?.[1] ?? "").replace(/\s+/g, " ").trim());
  return title || baseName(path);
}
function slideCount(source) {
  return source.replace(/<!--[\s\S]*?-->/g, "").match(/<section[\s>]/gi)?.length ?? 0;
}
function decodeEntities(text) {
  return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}
function escapeAttr(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function retargetDeck(html, deckPath) {
  const m3 = /<html\b[^>]*>/i.exec(html);
  if (m3 === null) return null;
  const tag = m3[0];
  if (!/\sdata-deck="[^"]*"/.test(tag)) return null;
  const next = tag.replace(/(\sdata-deck=")[^"]*(")/, (_2, a3, b2) => `${a3}${escapeAttr(deckPath)}${b2}`);
  return html.slice(0, m3.index) + next + html.slice(m3.index + tag.length);
}
function movedDecks(decks, from, to) {
  return decks.filter((d3) => isWithin(d3, from)).map((d3) => ({ from: d3, to: to + d3.slice(from.length) }));
}
function moveTarget(tree, source, destFolder, exists) {
  if (!tree.folders.includes(destFolder)) return { error: "\u884C\u304D\u5148\u306F slide/ \u304B\u3001\u6574\u7406\u306E\u30D5\u30A9\u30EB\u30C0\u306B\u3057\u307E\u3059\uFF08\u30C7\u30C3\u30AD\u306E\u4E2D\u306B\u306F\u7F6E\u3051\u307E\u305B\u3093\uFF09" };
  if (isWithin(destFolder, source)) return { error: "\u30D5\u30A9\u30EB\u30C0\u3092\u3001\u305D\u306E\u30D5\u30A9\u30EB\u30C0\u81EA\u8EAB\u3084\u305D\u306E\u4E0B\u306B\u306F\u52D5\u304B\u305B\u307E\u305B\u3093" };
  if (parentOf(source) === destFolder) return { error: "\u3059\u3067\u306B\u305D\u306E\u30D5\u30A9\u30EB\u30C0\u306B\u3042\u308A\u307E\u3059" };
  const path = `${destFolder}/${baseName(source)}`;
  if (exists(path)) return { error: `${path} \u304C\u3059\u3067\u306B\u3042\u308A\u307E\u3059` };
  return { path };
}
function renameTarget(source, name, exists) {
  const bad = nameError(name);
  if (bad !== null) return { error: bad };
  const path = `${parentOf(source)}/${name}`;
  if (path === source) return { error: "\u540C\u3058\u540D\u524D\u3067\u3059" };
  if (exists(path)) return { error: `${path} \u304C\u3059\u3067\u306B\u3042\u308A\u307E\u3059` };
  return { path };
}
function folderLabel(path) {
  return path === SLIDE_ROOT ? "All" : baseName(path);
}
function markdownLink(title, deckPath) {
  const text = title.replace(/[[\]]/g, (c3) => `\\${c3}`);
  return `[${text}](${deckPath.split("/").map(encodeURIComponent).join("/")}/${DECK_BUILD})`;
}

// src/obsidian/actions.ts
var KEEP = ".gitkeep";
var SlideActions = class {
  constructor(app, tree) {
    this.app = app;
    this.tree = tree;
  }
  app;
  tree;
  exists = (path) => this.app.vault.getAbstractFileByPath(path) !== null;
  /** 整理のフォルダを作る。git は空のフォルダを残さないので .gitkeep を置く */
  newFolder(parent) {
    new NameModal(this.app, { title: "New folder", cta: "Create", initial: "", check: (name) => nameError(name) ?? (this.exists(`${parent}/${name}`) ? `${parent}/${name} \u304C\u3059\u3067\u306B\u3042\u308A\u307E\u3059` : null) }, async (name) => {
      const path = `${parent}/${name}`;
      await this.app.vault.createFolder(path);
      await this.app.vault.create(`${path}/${KEEP}`, "");
    }).open();
  }
  rename(path) {
    const current = path.slice(path.lastIndexOf("/") + 1);
    new NameModal(this.app, { title: "Rename", cta: "Rename", initial: current, check: (name) => name === current ? null : errorOf(renameTarget(path, name, this.exists)) }, async (name) => {
      if (name === current) return;
      const target = renameTarget(path, name, this.exists);
      if ("error" in target) throw new Error(target.error);
      await this.relocate(path, target.path);
    }).open();
  }
  /** 行き先の整理のフォルダを選んで動かす */
  moveTo(path) {
    const tree = this.tree();
    const choices = tree.folders.filter((f4) => !("error" in moveTarget(tree, path, f4, this.exists)));
    if (choices.length === 0) {
      new import_obsidian2.Notice("\u52D5\u304B\u305B\u308B\u5148\u306E\u30D5\u30A9\u30EB\u30C0\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u5148\u306B New folder \u3067\u30D5\u30A9\u30EB\u30C0\u3092\u4F5C\u3063\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    new FolderModal(this.app, choices, (dest) => void this.move(path, dest)).open();
  }
  /** ドラッグで落としたときにも使う */
  async move(path, dest) {
    const target = moveTarget(this.tree(), path, dest, this.exists);
    if ("error" in target) {
      new import_obsidian2.Notice(target.error);
      return;
    }
    await this.relocate(path, target.path);
  }
  /** デッキのない整理のフォルダを消す（ゴミ箱へ） */
  async deleteFolder(path) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!(folder instanceof import_obsidian2.TFolder)) return;
    if (this.tree().decks.some((d3) => d3.path.startsWith(`${path}/`))) {
      new import_obsidian2.Notice("\u30C7\u30C3\u30AD\u306E\u5165\u3063\u3066\u3044\u308B\u30D5\u30A9\u30EB\u30C0\u306F\u6D88\u305B\u307E\u305B\u3093\u3002\u5148\u306B\u30C7\u30C3\u30AD\u3092\u52D5\u304B\u3057\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    await this.app.fileManager.trashFile(folder);
  }
  async open(deck, newTab) {
    if (deck.index === null) {
      new import_obsidian2.Notice("\u307E\u3060\u30D3\u30EB\u30C9\u3057\u3066\u3044\u307E\u305B\u3093\u3002PC \u3067 node .kit/bin/slide.mjs build \u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    await openInNotePane(this.app.workspace, deck.index, { phone: import_obsidian2.Platform.isPhone, newTab });
  }
  openInBrowser(deck) {
    if (deck.index === null) new import_obsidian2.Notice("\u307E\u3060\u30D3\u30EB\u30C9\u3057\u3066\u3044\u307E\u305B\u3093\u3002PC \u3067 node .kit/bin/slide.mjs build \u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
    else openSlideInBrowser(this.app, deck.index);
  }
  async copyLink(deck) {
    await navigator.clipboard.writeText(markdownLink(deck.title, deck.path));
    new import_obsidian2.Notice("\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F");
  }
  /** フォルダ（デッキか整理のフォルダ）を動かし、その下のデッキの index.html のパスを直す */
  async relocate(from, to) {
    const node = this.app.vault.getAbstractFileByPath(from);
    if (node === null) return;
    const decks = movedDecks(
      this.tree().decks.map((d3) => d3.path),
      from,
      to
    );
    await this.app.fileManager.renameFile(node, to);
    const failed = [];
    for (const d3 of decks) {
      const index = this.app.vault.getAbstractFileByPath(`${d3.to}/index.html`);
      if (!(index instanceof import_obsidian2.TFile)) continue;
      let ok = true;
      await this.app.vault.process(index, (html) => {
        const next = retargetDeck(html, d3.to);
        if (next === null) {
          ok = false;
          return html;
        }
        return next;
      });
      if (!ok) failed.push(d3.to);
    }
    if (failed.length > 0) new import_obsidian2.Notice(`index.html \u306E\u30D1\u30B9\u3092\u76F4\u305B\u307E\u305B\u3093\u3067\u3057\u305F\u3002PC \u3067 node .kit/bin/slide.mjs build --all \u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044: ${failed.join(", ")}`);
    else if (decks.length > 0) new import_obsidian2.Notice(`${to} \u306B\u52D5\u304B\u3057\u307E\u3057\u305F\uFF08\u30D6\u30E9\u30A6\u30B6\u306B\u6B8B\u3057\u305F\u30EC\u30D3\u30E5\u30FC\u306E\u30B3\u30E1\u30F3\u30C8\u306F\u3001\u524D\u306E\u5834\u6240\u306E\u3082\u306E\u3068\u3057\u3066\u6B8B\u308A\u307E\u3059\uFF09`);
    else new import_obsidian2.Notice(`${to} \u306B\u52D5\u304B\u3057\u307E\u3057\u305F`);
  }
};
function errorOf(r3) {
  return "error" in r3 ? r3.error : null;
}
var NameModal = class extends import_obsidian2.Modal {
  constructor(app, spec, submit) {
    super(app);
    this.spec = spec;
    this.submit = submit;
  }
  spec;
  submit;
  onOpen() {
    this.setTitle(this.spec.title);
    this.contentEl.addClass("vt-ui", "vt-sl-modal");
    let value = this.spec.initial;
    const HINT = "Lowercase letters, digits and hyphens (e.g. 2026-roadmap)";
    const hint = createEl("p", { cls: "vt-sl-hint", text: HINT });
    let button = null;
    const update = () => {
      const error = this.spec.check(value);
      hint.setText(error ?? HINT);
      hint.toggleClass("is-error", error !== null && value !== "");
      if (button) button.disabled = error !== null;
    };
    const run = async () => {
      if (this.spec.check(value) !== null) return;
      try {
        await this.submit(value);
        this.close();
      } catch (e3) {
        new import_obsidian2.Notice(`\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${e3 instanceof Error ? e3.message : String(e3)}`);
      }
    };
    new import_obsidian2.Setting(this.contentEl).setName("Name").addText((text) => {
      text.setValue(value).onChange((v3) => {
        value = v3.trim();
        update();
      });
      text.inputEl.addEventListener("keydown", (e3) => {
        if (e3.key === "Enter" && !e3.isComposing) {
          e3.preventDefault();
          void run();
        }
      });
      window.setTimeout(() => text.inputEl.select(), 0);
    });
    this.contentEl.appendChild(hint);
    new import_obsidian2.Setting(this.contentEl).addButton((b2) => b2.setButtonText("Cancel").onClick(() => this.close())).addButton((b2) => {
      button = b2.buttonEl;
      b2.setButtonText(this.spec.cta).setCta().onClick(() => void run());
    });
    update();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var FolderModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, folders, choose) {
    super(app);
    this.folders = folders;
    this.choose = choose;
    this.setPlaceholder("Move to folder\u2026");
  }
  folders;
  choose;
  getItems() {
    return this.folders;
  }
  getItemText(folder) {
    return folder === "slide" ? `slide/\uFF08${folderLabel(folder)}\uFF09` : `${folder}/`;
  }
  onChooseItem(folder) {
    this.choose(folder);
  }
};

// src/obsidian/model.ts
var import_obsidian3 = require("obsidian");
var EMPTY = { tree: { decks: [], folders: [SLIDE_ROOT] }, decks: [] };
var DEBOUNCE_MS = 300;
var SlideModel = class {
  constructor(app) {
    this.app = app;
  }
  app;
  snapshot = EMPTY;
  listeners = /* @__PURE__ */ new Set();
  timer = null;
  version = 0;
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  load(register) {
    const touch = (file, oldPath) => {
      if (isWithin(file.path, SLIDE_ROOT) || oldPath !== void 0 && isWithin(oldPath, SLIDE_ROOT)) this.schedule();
    };
    register(this.app.vault.on("create", (f4) => touch(f4)));
    register(this.app.vault.on("delete", (f4) => touch(f4)));
    register(this.app.vault.on("modify", (f4) => touch(f4)));
    register(this.app.vault.on("rename", (f4, old) => touch(f4, old)));
    return this.refresh();
  }
  unload() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.listeners.clear();
  }
  schedule() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.refresh().catch((e3) => console.error("pkm-slide: \u30B9\u30E9\u30A4\u30C9\u306E\u4E00\u89A7\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    }, DEBOUNCE_MS);
  }
  async refresh() {
    const version = ++this.version;
    const root = this.app.vault.getAbstractFileByPath(SLIDE_ROOT);
    const files = [];
    const folders = [];
    const walk = (node) => {
      if (node instanceof import_obsidian3.TFolder) {
        folders.push(node.path);
        for (const c3 of node.children) walk(c3);
      } else files.push(node.path);
    };
    if (root instanceof import_obsidian3.TFolder) walk(root);
    const tree = classify(files, folders);
    const decks = [];
    for (const entry of tree.decks) {
      const source = this.app.vault.getAbstractFileByPath(`${entry.path}/deck.html`);
      const index = this.app.vault.getAbstractFileByPath(`${entry.path}/index.html`);
      const text = source instanceof import_obsidian3.TFile ? await this.app.vault.cachedRead(source) : "";
      const sourceTime = source instanceof import_obsidian3.TFile ? source.stat.mtime : 0;
      const indexFile = index instanceof import_obsidian3.TFile ? index : null;
      decks.push({
        path: entry.path,
        title: deckTitle(text, entry.path),
        slides: slideCount(text),
        mtime: Math.max(sourceTime, indexFile?.stat.mtime ?? 0),
        index: indexFile
      });
    }
    if (version !== this.version) return;
    this.snapshot = { tree, decks };
    for (const l3 of this.listeners) l3();
  }
};

// src/obsidian/view.ts
var import_obsidian4 = require("obsidian");

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
  class PreactView extends import_obsidian4.ItemView {
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
      this.contentEl.addClass("vt-sl-view");
      R(k(component, props), this.contentEl);
    }
    async onClose() {
      R(null, this.contentEl);
    }
  }
  return (leaf) => new PreactView(leaf);
}

// src/views/SlidesView.tsx
var import_obsidian5 = require("obsidian");

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

// src/views/SlidesView.tsx
var DRAG_TYPE = "text/x-pkm-slide";
function Icon({ name }) {
  const ref = A2(null);
  h2(() => {
    if (ref.current) (0, import_obsidian5.setIcon)(ref.current, name);
  }, [name]);
  return /* @__PURE__ */ u3("span", { class: "vt-sl-icon", ref, "aria-hidden": "true" });
}
function useSnapshot(model) {
  const [snapshot, setSnapshot] = d2(model.snapshot);
  h2(() => model.subscribe(() => setSnapshot(model.snapshot)), [model]);
  return snapshot;
}
function formatTime(ms) {
  if (ms === 0) return "";
  const d3 = new Date(ms);
  const p3 = (n2) => String(n2).padStart(2, "0");
  return `${d3.getFullYear()}-${p3(d3.getMonth() + 1)}-${p3(d3.getDate())} ${p3(d3.getHours())}:${p3(d3.getMinutes())}`;
}
function SlidesView({ app, model, actions }) {
  const { tree, decks } = useSnapshot(model);
  const [folder, setFolder] = d2(SLIDE_ROOT);
  const [query, setQuery] = d2("");
  const [sort, setSort] = d2("updated");
  const [dropOn, setDropOn] = d2(null);
  const current = tree.folders.includes(folder) ? folder : SLIDE_ROOT;
  const canDrag = !import_obsidian5.Platform.isMobile;
  const shown = T2(() => {
    const q2 = query.trim().toLowerCase();
    const list = decks.filter((d3) => isWithin(d3.path, current) && (q2 === "" || d3.title.toLowerCase().includes(q2) || d3.path.toLowerCase().includes(q2)));
    return list.sort((a3, b2) => sort === "updated" ? b2.mtime - a3.mtime : a3.title.localeCompare(b2.title, "ja"));
  }, [decks, current, query, sort]);
  const countIn = (f4) => decks.filter((d3) => isWithin(d3.path, f4)).length;
  const folderMenu = (e3, f4) => {
    e3.preventDefault();
    e3.stopPropagation();
    const menu = new import_obsidian5.Menu();
    menu.addItem((i3) => i3.setTitle("New folder").setIcon("folder-plus").onClick(() => actions.newFolder(f4)));
    if (f4 !== SLIDE_ROOT) {
      menu.addItem((i3) => i3.setTitle("Rename").setIcon("pencil").onClick(() => actions.rename(f4)));
      menu.addItem((i3) => i3.setTitle("Move to\u2026").setIcon("folder-input").onClick(() => actions.moveTo(f4)));
      menu.addSeparator();
      menu.addItem(
        (i3) => i3.setTitle("Delete").setIcon("trash-2").setDisabled(countIn(f4) > 0).onClick(() => void actions.deleteFolder(f4))
      );
    }
    menu.showAtMouseEvent(e3);
  };
  const deckMenu = (e3, d3) => {
    e3.preventDefault();
    e3.stopPropagation();
    const menu = new import_obsidian5.Menu();
    menu.addItem((i3) => i3.setTitle("Open in new tab").setIcon("file-plus").onClick(() => void actions.open(d3, true)));
    menu.addItem((i3) => i3.setTitle("Open in browser").setIcon("presentation").onClick(() => actions.openInBrowser(d3)));
    menu.addItem((i3) => i3.setTitle("Copy link").setIcon("link").onClick(() => void actions.copyLink(d3)));
    menu.addSeparator();
    menu.addItem((i3) => i3.setTitle("Rename").setIcon("pencil").onClick(() => actions.rename(d3.path)));
    menu.addItem((i3) => i3.setTitle("Move to\u2026").setIcon("folder-input").onClick(() => actions.moveTo(d3.path)));
    menu.showAtMouseEvent(e3);
  };
  const dragProps = (path) => canDrag ? {
    draggable: true,
    onDragStart: (e3) => {
      e3.dataTransfer?.setData(DRAG_TYPE, path);
      if (e3.dataTransfer) e3.dataTransfer.effectAllowed = "move";
    }
  } : {};
  const dropProps = (f4) => ({
    onDragOver: (e3) => {
      if (!e3.dataTransfer?.types.includes(DRAG_TYPE)) return;
      e3.preventDefault();
      e3.dataTransfer.dropEffect = "move";
      setDropOn(f4);
    },
    onDragLeave: () => setDropOn((cur) => cur === f4 ? null : cur),
    onDrop: (e3) => {
      const path = e3.dataTransfer?.getData(DRAG_TYPE);
      setDropOn(null);
      if (!path) return;
      e3.preventDefault();
      void actions.move(path, f4);
    }
  });
  return /* @__PURE__ */ u3("div", { class: "vt-sl-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-sl-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-sl-title", children: "Slides" }),
      /* @__PURE__ */ u3("span", { class: "vt-sl-count", children: decks.length }),
      /* @__PURE__ */ u3("div", { class: "vt-sl-tools", children: [
        /* @__PURE__ */ u3("label", { class: "vt-sl-search", children: [
          /* @__PURE__ */ u3(Icon, { name: "search" }),
          /* @__PURE__ */ u3("input", { type: "search", placeholder: "Search slides", "aria-label": "Search slides", value: query, onInput: (e3) => setQuery(e3.target.value) })
        ] }),
        /* @__PURE__ */ u3("select", { class: "vt-sl-sort", "aria-label": "Sort", value: sort, onChange: (e3) => setSort(e3.target.value), children: [
          /* @__PURE__ */ u3("option", { value: "updated", children: "Updated" }),
          /* @__PURE__ */ u3("option", { value: "title", children: "Title" })
        ] }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-sl-btn", onClick: () => actions.newFolder(current), children: [
          /* @__PURE__ */ u3(Icon, { name: "folder-plus" }),
          "New folder"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-sl-body", children: [
      /* @__PURE__ */ u3("nav", { class: "vt-sl-tree", "aria-label": "Folders", children: tree.folders.map((f4) => {
        const depth = f4 === SLIDE_ROOT ? 0 : f4.split("/").length - 1;
        return /* @__PURE__ */ u3("div", { class: `vt-sl-folder${f4 === current ? " is-selected" : ""}${dropOn === f4 ? " is-drop" : ""}`, "data-depth": Math.min(depth, 4), ...dropProps(f4), onContextMenu: (e3) => folderMenu(e3, f4), children: [
          /* @__PURE__ */ u3("button", { type: "button", class: "vt-sl-folder-main", "aria-current": f4 === current ? "true" : void 0, onClick: () => setFolder(f4), ...f4 === SLIDE_ROOT ? {} : dragProps(f4), children: [
            /* @__PURE__ */ u3(Icon, { name: f4 === SLIDE_ROOT ? "layers" : "folder" }),
            /* @__PURE__ */ u3("span", { class: "vt-sl-folder-name", children: folderLabel(f4) }),
            /* @__PURE__ */ u3("span", { class: "vt-sl-folder-count", children: countIn(f4) })
          ] }),
          /* @__PURE__ */ u3("button", { type: "button", class: "vt-sl-more", "aria-label": `More for ${folderLabel(f4)}`, onClick: (e3) => folderMenu(e3, f4), children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
        ] }, f4);
      }) }),
      /* @__PURE__ */ u3("section", { class: "vt-sl-main", "aria-label": current === SLIDE_ROOT ? "All slides" : `Slides in ${baseName(current)}`, children: shown.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-sl-empty", children: decks.length === 0 ? /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("p", { children: "No slides yet." }),
        /* @__PURE__ */ u3("p", { children: "Ask Claude Code to make a slide deck. Decks are created under slide/." })
      ] }) : /* @__PURE__ */ u3("p", { children: query ? "No matching slides" : "No slides in this folder. Drag a slide here, or use Move to\u2026 on a slide." }) }) : /* @__PURE__ */ u3("ul", { class: "vt-sl-grid", children: shown.map((d3) => /* @__PURE__ */ u3("li", { class: "vt-sl-card", onContextMenu: (e3) => deckMenu(e3, d3), ...dragProps(d3.path), children: [
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-sl-card-main", onClick: (e3) => void actions.open(d3, e3.ctrlKey || e3.metaKey), children: [
          /* @__PURE__ */ u3("div", { class: "vt-sl-thumb", children: d3.index ? /* @__PURE__ */ u3("iframe", { sandbox: "", loading: "lazy", tabIndex: -1, "aria-hidden": "true", title: "", src: `${app.vault.getResourcePath(d3.index)}#thumb` }) : /* @__PURE__ */ u3("span", { class: "vt-sl-unbuilt", children: "Not built" }) }),
          /* @__PURE__ */ u3("span", { class: "vt-sl-card-title", children: d3.title }),
          /* @__PURE__ */ u3("span", { class: "vt-sl-card-meta", children: [
            d3.slides,
            " slides \xB7 ",
            parentOf(d3.path) === SLIDE_ROOT ? "slide/" : baseName(parentOf(d3.path)),
            " \xB7 ",
            formatTime(d3.mtime)
          ] })
        ] }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-sl-more vt-sl-card-more", "aria-label": `More for ${d3.title}`, onClick: (e3) => deckMenu(e3, d3), children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
      ] }, d3.path)) }) })
    ] })
  ] });
}

// src/main.ts
var VIEW_TYPE = "pkm-slide-list";
var PkmSlidePlugin = class extends import_obsidian6.Plugin {
  model = null;
  async onload() {
    const model = new SlideModel(this.app);
    this.model = model;
    const actions = new SlideActions(this.app, () => model.snapshot.tree);
    this.registerView(VIEW_TYPE, preactViewCreator({ type: VIEW_TYPE, title: "Slides", icon: "presentation" }, SlidesView, { app: this.app, model, actions }));
    this.addCommand({ id: "open-list", name: "Open Slides", icon: "presentation", callback: () => void openListView(this.app.workspace, VIEW_TYPE, { phone: import_obsidian6.Platform.isPhone }) });
    this.app.workspace.onLayoutReady(() => {
      void model.load((ref) => this.registerEvent(ref)).catch((e3) => console.error("pkm-slide: \u30B9\u30E9\u30A4\u30C9\u306E\u4E00\u89A7\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    });
  }
  onunload() {
    this.model?.unload();
  }
};
