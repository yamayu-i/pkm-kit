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
  default: () => PkmMarkdownPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/obsidian/live-preview.ts
var import_view = require("@codemirror/view");

// src/core/inline-code.ts
function runLength(line, at) {
  let n = 0;
  while (line[at + n] === "`") n++;
  return n;
}
function inlineCodes(line) {
  const found = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === "\\") {
      i += 2;
      continue;
    }
    if (line[i] !== "`") {
      i++;
      continue;
    }
    const n = runLength(line, i);
    let j = i + n;
    let close = -1;
    while (j < line.length) {
      if (line[j] !== "`") {
        j++;
        continue;
      }
      const m = runLength(line, j);
      if (m === n) {
        close = j;
        break;
      }
      j += m;
    }
    if (close < 0) {
      i += n;
      continue;
    }
    let text = line.slice(i + n, close);
    if (text.length >= 2 && text.startsWith(" ") && text.endsWith(" ") && text.trim() !== "") text = text.slice(1, -1);
    found.push({ from: i, to: close + n, text });
    i = close + n;
  }
  return found;
}
function findInlineCode(line, offset) {
  return inlineCodes(line).find((c) => offset >= c.from && offset <= c.to) ?? null;
}
function cursorInside(span, cursors) {
  return cursors.some((p) => p >= span.from && p <= span.to);
}

// src/obsidian/copy-button.ts
var import_obsidian = require("obsidian");

// src/core/copy.ts
var COPIED = "\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F";
var COPY_FAILED = "\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F";
async function copyText(text, clipboard, notify) {
  try {
    if (!clipboard) throw new Error("no clipboard");
    await clipboard.writeText(text);
    notify(COPIED);
    return true;
  } catch {
    notify(COPY_FAILED);
    return false;
  }
}

// src/obsidian/copy-button.ts
var BUTTON_CLASS = "vt-md-copy";
function createCopyButton(doc, text) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = BUTTON_CLASS;
  button.setAttribute("aria-label", "\u30B3\u30D4\u30FC");
  (0, import_obsidian.setIcon)(button, "copy");
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const value = text();
    if (value === null) return;
    void copyText(value, navigator.clipboard, (m) => new import_obsidian.Notice(m));
  });
  return button;
}

// src/obsidian/live-preview.ts
var CODE_SELECTOR = ".cm-inline-code";
var HIDE_DELAY_MS = 200;
var FLOATING_CLASS = "vt-md-copy-floating";
var InlineCodeCopy = class {
  constructor(view) {
    this.view = view;
    this.button = createCopyButton(view.dom.ownerDocument, () => this.current?.text ?? null);
    this.button.classList.add(FLOATING_CLASS);
    this.button.hidden = true;
    this.button.addEventListener("mouseenter", () => this.cancelHide());
    this.button.addEventListener("mouseleave", () => this.scheduleHide());
    view.dom.appendChild(this.button);
    view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
  }
  view;
  button;
  current = null;
  hideTimer = null;
  onScroll = () => this.hide();
  update(update) {
    if (update.docChanged || update.selectionSet || update.viewportChanged || update.geometryChanged) this.hide();
  }
  destroy() {
    this.cancelHide();
    this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
    this.button.remove();
  }
  onPointer(target) {
    const el = target instanceof Element ? target.closest(CODE_SELECTOR) : null;
    if (!(el instanceof HTMLElement)) {
      if (target !== this.button && !this.button.contains(target)) this.scheduleHide();
      return;
    }
    const code = this.codeAt(el);
    if (!code) return this.hide();
    this.cancelHide();
    this.current = code;
    this.place(el);
  }
  scheduleHide() {
    this.cancelHide();
    this.hideTimer = window.setTimeout(() => this.hide(), HIDE_DELAY_MS);
  }
  cancelHide() {
    if (this.hideTimer !== null) window.clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }
  hide() {
    this.cancelHide();
    this.current = null;
    this.button.hidden = true;
  }
  codeAt(el) {
    let pos;
    try {
      pos = this.view.posAtDOM(el);
    } catch {
      return null;
    }
    const line = this.view.state.doc.lineAt(pos);
    const code = findInlineCode(line.text, pos - line.from);
    if (!code) return null;
    const span = { from: line.from + code.from, to: line.from + code.to };
    if (cursorInside(span, this.view.state.selection.ranges.map((r) => r.head))) return null;
    return code;
  }
  /** コードの最初の行の箱の右上に置く（折り返したコードでも、ボタンは 1 行目に出す） */
  place(el) {
    const box = el.getClientRects()[0] ?? el.getBoundingClientRect();
    const base = this.view.dom.getBoundingClientRect();
    this.button.style.left = `${box.right - base.left}px`;
    this.button.style.top = `${box.top - base.top}px`;
    this.button.hidden = false;
  }
};
var livePreviewCopy = import_view.ViewPlugin.fromClass(InlineCodeCopy, {
  eventHandlers: {
    mouseover(event) {
      this.onPointer(event.target);
    },
    mouseleave() {
      this.scheduleHide();
    }
  }
});

// src/obsidian/reading.ts
var import_obsidian2 = require("obsidian");

// src/core/targets.ts
function isInlineCode(el) {
  return el.matches("code") && el.closest("pre") === null;
}
var PROPERTIES = ".metadata-container, .frontmatter-container";
function isBodyTag(el) {
  return el.matches("a.tag") && el.closest(PROPERTIES) === null;
}

// src/obsidian/reading.ts
var WRAP_CLASS = "vt-md-code";
var ACTIVE_CLASS = "is-active";
function addCopyButtons(root) {
  for (const code of Array.from(root.querySelectorAll("code"))) {
    if (!isInlineCode(code) || code.parentElement?.classList.contains(WRAP_CLASS)) continue;
    const doc = code.ownerDocument;
    const wrap = doc.createElement("span");
    wrap.className = WRAP_CLASS;
    code.replaceWith(wrap);
    wrap.append(code, createCopyButton(doc, () => code.textContent ?? ""));
    if (!import_obsidian2.Platform.isMobile) continue;
    code.addEventListener("click", () => {
      for (const other of Array.from(doc.querySelectorAll(`.${WRAP_CLASS}.${ACTIVE_CLASS}`))) if (other !== wrap) other.classList.remove(ACTIVE_CLASS);
      wrap.classList.toggle(ACTIVE_CLASS);
    });
  }
}
function untag(root) {
  for (const tag of Array.from(root.querySelectorAll("a.tag"))) {
    if (isBodyTag(tag)) tag.replaceWith(tag.ownerDocument.createTextNode(tag.textContent ?? ""));
  }
}
var readingProcessor = (el) => {
  untag(el);
  addCopyButtons(el);
};

// src/main.ts
var LIVE_TAG = ".markdown-source-view .cm-hashtag";
var PkmMarkdownPlugin = class extends import_obsidian3.Plugin {
  onload() {
    this.registerMarkdownPostProcessor(readingProcessor);
    if (!import_obsidian3.Platform.isMobile) this.registerEditorExtension(livePreviewCopy);
    this.guardTagClicks(activeDocument);
    this.registerEvent(this.app.workspace.on("window-open", (win) => this.guardTagClicks(win.doc)));
  }
  guardTagClicks(doc) {
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (e.target instanceof Element && e.target.closest(LIVE_TAG)) e.stopPropagation();
      },
      { capture: true }
    );
  }
};
