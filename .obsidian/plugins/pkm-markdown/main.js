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
var import_obsidian4 = require("obsidian");

// src/obsidian/live-preview.ts
var import_view = require("@codemirror/view");

// src/core/blockquote.ts
var PREFIX = /^(?: {0,3}>[ \t]?)+/;
var OUTER = /^ {0,3}>[ \t]?/;
var CALLOUT_HEAD = /^\[![^\]\s]+\][+-]?(?:\s|$)/;
function quotePrefix(line) {
  return PREFIX.exec(line)?.[0] ?? null;
}
function pasteIntoQuote(line, ch, text) {
  const prefix = quotePrefix(line);
  if (prefix === null || ch < prefix.length) return null;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length < 2) return null;
  const last = lines.length - 1;
  return lines.map((l, i) => i === 0 ? l : l === "" && i < last ? prefix.trimEnd() : prefix + l).join("\n");
}
function quoteBlock(lineAt, n) {
  const isQuote = (i) => {
    const line = lineAt(i);
    return line !== null && quotePrefix(line) !== null;
  };
  if (!isQuote(n)) return null;
  let first = n;
  let last = n;
  while (isQuote(first - 1)) first--;
  while (isQuote(last + 1)) last++;
  return { first, last };
}
function quoteSource(lines) {
  const body = lines.map((l) => l.replace(OUTER, ""));
  if (body.length > 0 && CALLOUT_HEAD.test(body[0] ?? "")) body.shift();
  return body.join("\n");
}

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
var QUOTE_SELECTOR = ".cm-line.HyperMD-quote";
var CALLOUT_SELECTOR = ".cm-callout";
var EDIT_BUTTON_SELECTOR = ".edit-block-button";
var HIDE_DELAY_MS = 200;
var FLOATING_CLASS = "vt-md-copy-floating";
var INSIDE_CLASS = "is-inside";
var INSET = 4;
var MarkdownCopy = class {
  constructor(view) {
    this.view = view;
    this.button = createCopyButton(view.dom.ownerDocument, () => this.current);
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
    if (target === this.button || this.button.contains(target)) return this.cancelHide();
    const el = target instanceof Element ? target : null;
    const code = el?.closest(CODE_SELECTOR);
    const found = code instanceof HTMLElement ? this.codeAt(code) : this.quoteLineAt(el?.closest(QUOTE_SELECTOR)) ?? this.calloutAt(el?.closest(CALLOUT_SELECTOR));
    if (!found) {
      if (code) return this.hide();
      return this.scheduleHide();
    }
    this.cancelHide();
    this.current = found.text;
    this.place(found);
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
  posOf(el) {
    try {
      return this.view.posAtDOM(el);
    } catch {
      return null;
    }
  }
  /** コードの最初の行の箱の右上（折り返したコードでも、ボタンは 1 行目に出す） */
  codeAt(el) {
    const pos = this.posOf(el);
    if (pos === null) return null;
    const line = this.view.state.doc.lineAt(pos);
    const code = findInlineCode(line.text, pos - line.from);
    if (!code) return null;
    const span = { from: line.from + code.from, to: line.from + code.to };
    if (cursorInside(span, this.view.state.selection.ranges.map((r) => r.head))) return null;
    return { text: code.text, box: el.getClientRects()[0] ?? el.getBoundingClientRect(), inside: false };
  }
  /** pos を含む、ひと続きの引用の行の生の文 */
  quoteTextAt(pos) {
    const doc = this.view.state.doc;
    const lineAt = (n) => n >= 1 && n <= doc.lines ? doc.line(n).text : null;
    const range = quoteBlock(lineAt, doc.lineAt(pos).number);
    if (!range) return null;
    const lines = [];
    for (let n = range.first; n <= range.last; n++) lines.push(doc.line(n).text);
    return { text: quoteSource(lines), firstFrom: doc.line(range.first).from };
  }
  /** 引用の行。ボタンは、ひと続きの引用の 1 行目の右上に置く（1 行目が描かれていなければ、乗せた行） */
  quoteLineAt(el) {
    if (!(el instanceof HTMLElement)) return null;
    const pos = this.posOf(el);
    if (pos === null) return null;
    const quote = this.quoteTextAt(pos);
    if (!quote) return null;
    return { text: quote.text, box: this.lineBox(quote.firstFrom) ?? el.getBoundingClientRect(), inside: true };
  }
  /** 描かれたコールアウト（カーソルが外にあるとき）。ボタンは右上の「編集」のボタンの左に置く */
  calloutAt(el) {
    if (!(el instanceof HTMLElement)) return null;
    const pos = this.posOf(el);
    if (pos === null) return null;
    const quote = this.quoteTextAt(pos);
    if (!quote) return null;
    const box = el.getBoundingClientRect();
    const edit = el.querySelector(EDIT_BUTTON_SELECTOR);
    const right = edit instanceof HTMLElement && edit.offsetParent !== null ? edit.getBoundingClientRect().left : box.right;
    return { text: quote.text, box: new DOMRect(box.left, box.top, right - box.left, box.height), inside: true };
  }
  lineBox(from) {
    try {
      const { node } = this.view.domAtPos(from);
      const line = (node instanceof Element ? node : node.parentElement)?.closest(".cm-line");
      return line instanceof HTMLElement ? line.getBoundingClientRect() : null;
    } catch {
      return null;
    }
  }
  place(target) {
    const base = this.view.dom.getBoundingClientRect();
    const inset = target.inside ? INSET : 0;
    this.button.classList.toggle(INSIDE_CLASS, target.inside);
    this.button.style.left = `${target.box.right - inset - base.left}px`;
    this.button.style.top = `${target.box.top + inset - base.top}px`;
    this.button.hidden = false;
  }
};
var livePreviewCopy = import_view.ViewPlugin.fromClass(MarkdownCopy, {
  eventHandlers: {
    mouseover(event) {
      this.onPointer(event.target);
    },
    mouseleave() {
      this.scheduleHide();
    }
  }
});

// src/obsidian/paste.ts
var import_obsidian2 = require("obsidian");
function autoConvertHtml(app) {
  const vault = app.vault;
  try {
    return vault.getConfig?.("autoConvertHtml") !== false;
  } catch {
    return true;
  }
}
function pastedText(data, convertHtml) {
  const html = convertHtml ? data.getData("text/html") : "";
  return html ? (0, import_obsidian2.htmlToMarkdown)(html) : data.getData("text/plain");
}
function handleQuotePaste(app, evt, editor) {
  if (evt.defaultPrevented) return;
  const data = evt.clipboardData;
  if (!data || data.files.length > 0) return;
  if (editor.listSelections().length !== 1) return;
  const from = editor.getCursor("from");
  const text = pasteIntoQuote(editor.getLine(from.line), from.ch, pastedText(data, autoConvertHtml(app)));
  if (text === null) return;
  evt.preventDefault();
  editor.replaceSelection(text);
}

// src/obsidian/reading.ts
var import_obsidian3 = require("obsidian");

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
var QUOTE_CLASS = "vt-md-quote";
var ACTIVE_CLASS = "is-active";
function toggleOnTap(target, holder) {
  if (!import_obsidian3.Platform.isMobile) return;
  const doc = holder.ownerDocument;
  target.addEventListener("click", () => {
    for (const other of Array.from(doc.querySelectorAll(`.${WRAP_CLASS}.${ACTIVE_CLASS}, .${QUOTE_CLASS}.${ACTIVE_CLASS}`))) {
      if (other !== holder) other.classList.remove(ACTIVE_CLASS);
    }
    holder.classList.toggle(ACTIVE_CLASS);
  });
}
function addCopyButtons(root) {
  for (const code of Array.from(root.querySelectorAll("code"))) {
    if (!isInlineCode(code) || code.parentElement?.classList.contains(WRAP_CLASS)) continue;
    const doc = code.ownerDocument;
    const wrap = doc.createElement("span");
    wrap.className = WRAP_CLASS;
    code.replaceWith(wrap);
    wrap.append(code, createCopyButton(doc, () => code.textContent ?? ""));
    toggleOnTap(code, wrap);
  }
}
function quoteText(section, quote, ctx) {
  const info = ctx.getSectionInfo(section);
  if (info) {
    const lines = info.text.split("\n").slice(info.lineStart, info.lineEnd + 1);
    const start = lines.findIndex((l) => quotePrefix(l) !== null);
    const range = start < 0 ? null : quoteBlock((n) => lines[n] ?? null, start);
    if (range) return quoteSource(lines.slice(range.first, range.last + 1));
  }
  const body = quote.matches(".callout") ? quote.querySelector(".callout-content") : quote;
  return (body instanceof HTMLElement ? body.innerText : quote.innerText).trim();
}
function addQuoteButtons(section, ctx) {
  for (const quote of Array.from(section.querySelectorAll(":scope > blockquote, :scope > .callout"))) {
    if (!(quote instanceof HTMLElement) || quote.classList.contains(QUOTE_CLASS)) continue;
    quote.classList.add(QUOTE_CLASS);
    quote.append(createCopyButton(quote.ownerDocument, () => quoteText(section, quote, ctx)));
    toggleOnTap(quote, quote);
  }
}
function untag(root) {
  for (const tag of Array.from(root.querySelectorAll("a.tag"))) {
    if (isBodyTag(tag)) tag.replaceWith(tag.ownerDocument.createTextNode(tag.textContent ?? ""));
  }
}
var readingProcessor = (el, ctx) => {
  untag(el);
  addCopyButtons(el);
  addQuoteButtons(el, ctx);
};

// src/main.ts
var LIVE_TAG = ".markdown-source-view .cm-hashtag";
var PkmMarkdownPlugin = class extends import_obsidian4.Plugin {
  onload() {
    this.registerMarkdownPostProcessor(readingProcessor);
    if (!import_obsidian4.Platform.isMobile) this.registerEditorExtension(livePreviewCopy);
    this.registerEvent(this.app.workspace.on("editor-paste", (evt, editor) => handleQuotePaste(this.app, evt, editor)));
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
