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
  default: () => PkmHtmlPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/core/policy.ts
var HTML_EXTENSIONS = ["html", "htm"];
var CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; form-action 'none'";
var IMAGE_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml"
};
var MAX_IMAGE_BYTES = 10 * 1024 * 1024;
var SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
var EXTERNAL_SCHEMES = /* @__PURE__ */ new Set(["http:", "https:", "mailto:"]);
function normalize(segments) {
  const out = [];
  for (const s of segments) {
    if (s === "" || s === ".") continue;
    if (s === "..") {
      if (out.length === 0) return null;
      out.pop();
      continue;
    }
    out.push(s);
  }
  return out.length === 0 ? null : out.join("/");
}
function decode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}
function splitRef(ref) {
  const hashAt = ref.indexOf("#");
  const hash = hashAt >= 0 ? ref.slice(hashAt) : "";
  let path = hashAt >= 0 ? ref.slice(0, hashAt) : ref;
  const queryAt = path.indexOf("?");
  if (queryAt >= 0) path = path.slice(0, queryAt);
  return { path, hash };
}
function candidatePaths(from, ref) {
  const trimmed = ref.trim();
  if (trimmed === "" || SCHEME_RE.test(trimmed) || trimmed.startsWith("//") || trimmed.startsWith("\\")) return [];
  const decoded = decode(splitRef(trimmed).path);
  if (decoded === null || decoded === "" || decoded.includes("\\") || decoded.includes("\0")) return [];
  const parts = decoded.split("/");
  const dir = from.split("/").slice(0, -1);
  const result = [];
  const add = (p) => {
    if (p !== null && !result.includes(p)) result.push(p);
  };
  if (!decoded.startsWith("/")) add(normalize([...dir, ...parts]));
  add(normalize(parts));
  return result;
}
function imageType(path) {
  const dot = path.lastIndexOf(".");
  if (dot < 0 || dot < path.lastIndexOf("/")) return null;
  return IMAGE_TYPES[path.slice(dot + 1).toLowerCase()] ?? null;
}
function classifyLink(from, href) {
  const trimmed = href.trim();
  if (trimmed === "") return { kind: "none" };
  if (trimmed.startsWith("#")) {
    const id = decode(trimmed.slice(1));
    return id ? { kind: "anchor", id } : { kind: "none" };
  }
  if (SCHEME_RE.test(trimmed)) {
    let url;
    try {
      url = new URL(trimmed);
    } catch {
      return { kind: "none" };
    }
    return EXTERNAL_SCHEMES.has(url.protocol) ? { kind: "external", url: url.href } : { kind: "none" };
  }
  const candidates = candidatePaths(from, trimmed);
  if (candidates.length === 0) return { kind: "none" };
  const hash = splitRef(trimmed).hash;
  const subpath = hash.length > 1 ? `#${decode(hash.slice(1)) ?? ""}` : "";
  return { kind: "vault", candidates, subpath: subpath === "#" ? "" : subpath };
}
function isScriptUrl(value) {
  const compact = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, "").toLowerCase();
  return compact.startsWith("javascript:") || compact.startsWith("vbscript:");
}
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function firstSrcsetUrl(srcset) {
  const first = srcset.trim().split(/\s+/)[0];
  if (!first) return null;
  return first.endsWith(",") ? first.slice(0, -1) : first;
}

// src/obsidian/export.ts
var import_obsidian = require("obsidian");

// ../pkm-drawio/src/core/svg.ts
var MAX_SVG_BYTES = 10 * 1024 * 1024;
var MAX_XML_CHARS = 20 * 1024 * 1024;
var DrawioFormatError = class extends Error {
  name = "DrawioFormatError";
};
function parseRootSvg(text) {
  let i = text.charCodeAt(0) === 65279 ? 1 : 0;
  const skipSpace = () => {
    while (i < text.length && /\s/.test(text[i])) i++;
  };
  for (; ; ) {
    skipSpace();
    if (text.startsWith("<?", i)) {
      const end = text.indexOf("?>", i + 2);
      if (end < 0) throw new DrawioFormatError("XML \u5BA3\u8A00\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      i = end + 2;
    } else if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i + 4);
      if (end < 0) throw new DrawioFormatError("\u30B3\u30E1\u30F3\u30C8\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      i = end + 3;
    } else if (/^<!DOCTYPE\b/i.test(text.slice(i, i + 9))) {
      const end = text.indexOf(">", i);
      if (end < 0) throw new DrawioFormatError("DOCTYPE \u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      if (text.slice(i, end).includes("[")) throw new DrawioFormatError("DOCTYPE \u306B\u5B9F\u4F53\u306E\u5BA3\u8A00\u304C\u3042\u308B");
      i = end + 1;
    } else {
      break;
    }
  }
  if (!/^<svg[\s>/]/.test(text.slice(i, i + 5))) throw new DrawioFormatError("SVG \u3067\u306F\u306A\u3044\uFF08\u30EB\u30FC\u30C8\u304C <svg> \u3067\u306F\u306A\u3044\uFF09");
  const start = i;
  i += 4;
  const attributes = [];
  for (; ; ) {
    const before = i;
    skipSpace();
    if (i >= text.length) throw new DrawioFormatError("<svg> \u306E\u958B\u59CB\u30BF\u30B0\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
    if (text[i] === ">") return { start, end: i + 1, attributes };
    if (text.startsWith("/>", i)) return { start, end: i + 2, attributes };
    if (i === before) throw new DrawioFormatError("<svg> \u306E\u5C5E\u6027\u306E\u9593\u306B\u7A7A\u767D\u304C\u306A\u3044");
    const nameMatch = /^[^\s=/>"']+/.exec(text.slice(i, i + 256));
    if (!nameMatch) throw new DrawioFormatError("<svg> \u306E\u5C5E\u6027\u3092\u8AAD\u3081\u306A\u3044");
    const name = nameMatch[0];
    i += name.length;
    skipSpace();
    if (text[i] !== "=") throw new DrawioFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306B\u5024\u304C\u306A\u3044`);
    i++;
    skipSpace();
    const quote = text[i];
    if (quote !== '"' && quote !== "'") throw new DrawioFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306E\u5024\u304C\u5F15\u7528\u7B26\u3067\u56F2\u307E\u308C\u3066\u3044\u306A\u3044`);
    const close = text.indexOf(quote, i + 1);
    if (close < 0) throw new DrawioFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306E\u5024\u304C\u9589\u3058\u3066\u3044\u306A\u3044`);
    const raw = text.slice(i + 1, close);
    if (raw.includes("<")) throw new DrawioFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306E\u5024\u306B < \u304C\u3042\u308B`);
    if (attributes.some((a) => a.name === name)) throw new DrawioFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u304C\u91CD\u8907\u3057\u3066\u3044\u308B`);
    attributes.push({ name, raw, start: before, end: close + 1 });
    i = close + 1;
  }
}
function toSharingSvg(svg) {
  if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG \u304C\u5927\u304D\u3059\u304E\u308B\uFF0810 MiB \u307E\u3067\uFF09");
  const root = parseRootSvg(svg);
  const content = root.attributes.find((a) => a.name === "content");
  if (!content) return svg;
  return svg.slice(0, content.start) + svg.slice(content.end);
}

// ../pkm-drawio/src/core/names.ts
var TMP_FOLDER = "tmp";
function freePath(folder, stem, ext, taken) {
  for (let n = 1; ; n++) {
    const path = `${folder}/${stem}${n > 1 ? ` ${n}` : ""}${ext}`;
    if (!taken(path)) return path;
  }
}
function exportPath(sourcePath, taken) {
  const base = sourcePath.slice(sourcePath.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return freePath(TMP_FOLDER, dot > 0 ? base.slice(0, dot) : base, dot > 0 ? base.slice(dot) : "", taken);
}

// src/core/sanitize.ts
var REMOVED_ELEMENTS = ["script", "noscript", "base", "meta[http-equiv]", "link", "iframe", "frame", "frameset", "object", "embed", "portal", "applet"];
var URL_ATTRIBUTES = /* @__PURE__ */ new Set(["href", "src", "action", "formaction", "data", "poster", "background", "xlink:href", "srcset", "ping", "cite", "longdesc", "to", "from", "values", "by"]);
var MARK_ATTRIBUTE = "data-pkm-html";
function stripDangerous(doc) {
  for (const el of [...doc.querySelectorAll(REMOVED_ELEMENTS.join(","))]) el.remove();
  for (const el of [...doc.querySelectorAll("*")]) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" || URL_ATTRIBUTES.has(name) && isScriptUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
}
async function inlineImages(doc, from, readImage) {
  const toDataUrl = async (ref) => {
    const candidates = candidatePaths(from, ref).filter((p) => imageType(p) !== null);
    if (candidates.length === 0) return null;
    const bytes = await readImage(candidates);
    if (bytes === null || bytes.length > MAX_IMAGE_BYTES) return null;
    const type = imageType(candidates[0]);
    return `data:${type};base64,${bytesToBase64(bytes)}`;
  };
  for (const img of [...doc.querySelectorAll("img[src]")]) {
    const src = img.getAttribute("src") ?? "";
    const url = await toDataUrl(src);
    if (url !== null) img.setAttribute("src", url);
  }
  for (const el of [...doc.querySelectorAll("img[srcset], source[srcset]")]) {
    const first = firstSrcsetUrl(el.getAttribute("srcset") ?? "");
    const url = first === null ? null : await toDataUrl(first);
    if (url !== null) el.setAttribute("srcset", url);
  }
}
function schemeCss(theme) {
  return `:root { color-scheme: ${theme}; }`;
}
function fontCss(fontVars2) {
  const decls = Object.entries(fontVars2).filter(([name, value]) => /^--font-[\w-]+$/.test(name) && !/[;{}<>]/.test(value) && value.trim() !== "").map(([name, value]) => `	${name}: ${value.trim()};`);
  return decls.length === 0 ? "" : `body {
${decls.join("\n")}
}`;
}
function addGuards(doc, { theme, tokensCss, fontVars: fontVars2 = {} }) {
  const head = doc.head;
  const style = (kind, css) => {
    const el = doc.createElement("style");
    el.setAttribute(MARK_ATTRIBUTE, kind);
    el.textContent = css;
    return el;
  };
  const meta = doc.createElement("meta");
  meta.setAttribute("http-equiv", "Content-Security-Policy");
  meta.setAttribute("content", CSP);
  head.prepend(meta, style("scheme", schemeCss(theme)), style("tokens", `${tokensCss}
${fontCss(fontVars2)}`));
  doc.body.classList.remove("theme-light", "theme-dark");
  doc.body.classList.add(`theme-${theme}`);
}
async function buildSrcdoc(html, options) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  stripDangerous(doc);
  await inlineImages(doc, options.path, options.readImage);
  addGuards(doc, options);
  return `<!DOCTYPE html>
${doc.documentElement.outerHTML}`;
}

// src/core/standalone.ts
var HEAD_ELEMENTS = /* @__PURE__ */ new Set(["title", "meta", "style", "link", "base"]);
function normalizeStructure(doc) {
  const html = doc.documentElement;
  const head = doc.head;
  const body = doc.body;
  for (const node of [...html.childNodes]) {
    if (node === head || node === body) continue;
    const name = node.nodeType === 1 ? node.tagName.toLowerCase() : "";
    if (HEAD_ELEMENTS.has(name)) head.append(node);
    else if (node.nodeType === 3 && (node.textContent ?? "").trim() === "") node.remove();
    else body.append(node);
  }
}
function sharingImages(readImage) {
  return async (candidates) => {
    const bytes = await readImage(candidates);
    if (bytes === null || !(candidates[0] ?? "").toLowerCase().endsWith(".drawio.svg")) return bytes;
    try {
      return new TextEncoder().encode(toSharingSvg(new TextDecoder().decode(bytes)));
    } catch {
      return null;
    }
  };
}
function asDocument(html) {
  return /<html[\s>]/i.test(html) ? html : `<!DOCTYPE html>
<html><head></head><body>${html}</body></html>`;
}
async function buildStandalone(html, options) {
  const doc = options.parse(asDocument(html));
  normalizeStructure(doc);
  stripDangerous(doc);
  await inlineImages(doc, options.path, sharingImages(options.readImage));
  addStandaloneHead(doc, options.standaloneCss);
  return `<!DOCTYPE html>
${doc.documentElement.outerHTML}
`;
}
function addStandaloneHead(doc, standaloneCss) {
  const head = doc.head;
  const meta = (attrs) => {
    const el = doc.createElement("meta");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  const first = [];
  for (const el of [...head.querySelectorAll("meta[charset]")]) el.remove();
  first.push(meta({ charset: "utf-8" }));
  first.push(meta({ "http-equiv": "Content-Security-Policy", content: CSP }));
  if (!head.querySelector('meta[name="viewport"]')) first.push(meta({ name: "viewport", content: "width=device-width, initial-scale=1" }));
  const style = doc.createElement("style");
  style.setAttribute(MARK_ATTRIBUTE, "tokens");
  style.textContent = standaloneCss;
  first.push(style);
  head.prepend(...first);
  doc.body.classList.remove("theme-light", "theme-dark");
  if (doc.body.getAttribute("class") === "") doc.body.removeAttribute("class");
}

// tokens-standalone.css
var tokens_standalone_default = '/* \u751F\u6210\u7269\u3002\u624B\u3067\u7DE8\u96C6\u3057\u306A\u3044\u3002\u6B63\u672C\u306F .kit/src/packages/design/tokens.json\uFF08pnpm --filter design build \u3067\u4F5C\u308A\u76F4\u3059\uFF09 */\n:root {\n	color-scheme: light dark;\n	--font-interface: system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif;\n	--font-text: system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif;\n	--font-monospace: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;\n	--vt-surface: #f6f5f2;\n	--vt-surface-container: #efeeea;\n	--vt-surface-container-high: #e8e7e2;\n	--vt-on-surface: #2b2a28;\n	--vt-on-surface-variant: #57564f;\n	--vt-outline: #7f7e76;\n	--vt-outline-variant: #2b2a2824;\n	--vt-state-hover: #2b2a2814;\n	--vt-state-press: #2b2a281f;\n	--vt-primary: #6750a4;\n	--vt-on-primary: #ffffff;\n	--vt-primary-state-hover: #6750a414;\n	--vt-on-primary-state-hover: #ffffff14;\n	--vt-secondary-container: #e8def8;\n	--vt-on-secondary-container: #1d192b;\n	--vt-error: #b3261e;\n	--vt-focus-ring: var(--vt-primary);\n	--vt-green-container: #c4eed0;\n	--vt-on-green-container: #072711;\n	--vt-green: #1e8e3e;\n	--vt-blue-container: #d3e3fd;\n	--vt-on-blue-container: #041e49;\n	--vt-blue: #0b57d0;\n	--vt-purple-container: #eaddff;\n	--vt-on-purple-container: #21005d;\n	--vt-purple: #6750a4;\n	--vt-gray-container: #e3e3e3;\n	--vt-on-gray-container: #1f1f1f;\n	--vt-gray: #747775;\n	--vt-sky-container: #c2e7ff;\n	--vt-on-sky-container: #001d35;\n	--vt-sky: #00639b;\n	--vt-pink-container: #ffd8e4;\n	--vt-on-pink-container: #3e001d;\n	--vt-pink: #c2185b;\n	--vt-red-container: #f9dedc;\n	--vt-on-red-container: #410e0b;\n	--vt-red: #d93025;\n	--vt-amber-container: #ffecb3;\n	--vt-on-amber-container: #3a2a00;\n	--vt-amber: #b06d00;\n	--vt-scheduled: #188038;\n	--vt-scheduled-hover: #137333;\n	--vt-on-scheduled: #ffffff;\n	--vt-due-3: #fff8e1;\n	--vt-due-2: #ffe082;\n	--vt-due-1: #ffb74d;\n	--vt-on-due: #3a2a00;\n	--vt-due-0: #d93025;\n	--vt-on-due-0: #ffffff;\n	--vt-on-label: #1f1f1f;\n	--vt-radius-xs: 4px;\n	--vt-radius-s: 8px;\n	--vt-radius-m: 12px;\n	--vt-radius-l: 16px;\n	--vt-radius-xl: 28px;\n	--vt-radius-full: 9999px;\n	--vt-space-2: 2px;\n	--vt-space-4: 4px;\n	--vt-space-8: 8px;\n	--vt-space-12: 12px;\n	--vt-space-16: 16px;\n	--vt-space-20: 20px;\n	--vt-space-24: 24px;\n	--vt-space-32: 32px;\n	--vt-space-40: 40px;\n	--vt-space-48: 48px;\n	--vt-space-64: 64px;\n	--vt-space-96: 96px;\n	--vt-size-grid: 4px;\n	--vt-size-target-min: 24px;\n	--vt-border-width-thin: 1px;\n	--vt-border-width-thick: 2px;\n	--vt-breakpoint-pane-narrow: 480px;\n	--vt-breakpoint-pane-compact: 300px;\n	--vt-breakpoint-pane-medium: 720px;\n	--vt-weight-regular: 400;\n	--vt-weight-medium: 500;\n	--vt-weight-semibold: 600;\n	--vt-weight-bold: 700;\n	--vt-type-headline-small-size: 24px;\n	--vt-type-headline-small-line-height: 1.3333;\n	--vt-type-headline-small-weight: var(--vt-weight-semibold);\n	--vt-type-headline-small-tracking: -0.24px;\n	--vt-type-title-large-size: 20px;\n	--vt-type-title-large-line-height: 1.4;\n	--vt-type-title-large-weight: var(--vt-weight-semibold);\n	--vt-type-title-large-tracking: 0;\n	--vt-type-title-medium-size: 16px;\n	--vt-type-title-medium-line-height: 1.5;\n	--vt-type-title-medium-weight: var(--vt-weight-semibold);\n	--vt-type-title-medium-tracking: 0.15px;\n	--vt-type-body-medium-size: 15px;\n	--vt-type-body-medium-line-height: 1.5;\n	--vt-type-body-medium-weight: var(--vt-weight-regular);\n	--vt-type-body-medium-tracking: 0;\n	--vt-type-body-small-size: 13px;\n	--vt-type-body-small-line-height: 1.5;\n	--vt-type-body-small-weight: var(--vt-weight-regular);\n	--vt-type-body-small-tracking: 0;\n	--vt-type-label-medium-size: 12px;\n	--vt-type-label-medium-line-height: 1.3333;\n	--vt-type-label-medium-weight: var(--vt-weight-medium);\n	--vt-type-label-medium-tracking: 0.5px;\n	--vt-type-label-small-size: 11px;\n	--vt-type-label-small-line-height: 1.4545;\n	--vt-type-label-small-weight: var(--vt-weight-medium);\n	--vt-type-label-small-tracking: 0.5px;\n	--vt-duration-short2: 100ms;\n	--vt-duration-short3: 150ms;\n	--vt-duration-short4: 200ms;\n	--vt-duration-pulse: 1400ms;\n	--vt-duration-spin: 4200ms;\n	--vt-easing-standard: cubic-bezier(0.2, 0, 0, 1);\n	--vt-elevation-1: 0 1px 2px 0 #0000000f;\n	--vt-elevation-2: 0 1px 3px 0 #0000001f;\n	--vt-elevation-3: 0 2px 8px 0 #0000001f;\n	--vt-elevation-4: 0 4px 16px 0 #00000029;\n	--vt-elevation-5: 0 6px 24px 0 #00000024;\n	--vt-opacity-disabled: 0.38;\n	--vt-opacity-state-hover: 0.08;\n	--vt-opacity-state-press: 0.12;\n	--vt-scale-press-small: 0.92;\n	--vt-scale-press-medium: 0.97;\n	--vt-scale-press-large: 0.99;\n}\n\n@media (prefers-color-scheme: dark) {\n	:root {\n		--vt-surface: #1e1e1e;\n		--vt-surface-container: #242424;\n		--vt-surface-container-high: #2b2b2b;\n		--vt-on-surface: #d0d0d0;\n		--vt-on-surface-variant: #b3b3b3;\n		--vt-outline: #7a7a7a;\n		--vt-outline-variant: #d0d0d024;\n		--vt-state-hover: #d0d0d014;\n		--vt-state-press: #d0d0d01f;\n		--vt-primary: #d0bcff;\n		--vt-on-primary: #381e72;\n		--vt-primary-state-hover: #d0bcff14;\n		--vt-on-primary-state-hover: #381e7214;\n		--vt-secondary-container: #3d3749;\n		--vt-on-secondary-container: #e8def8;\n		--vt-error: #f2b8b5;\n		--vt-green-container: #0f5223;\n		--vt-on-green-container: #c4eed0;\n		--vt-green: #6dd58c;\n		--vt-blue-container: #0842a0;\n		--vt-on-blue-container: #d3e3fd;\n		--vt-blue: #a8c7fa;\n		--vt-purple-container: #4f378b;\n		--vt-on-purple-container: #eaddff;\n		--vt-purple: #d0bcff;\n		--vt-gray-container: #444746;\n		--vt-on-gray-container: #e3e3e3;\n		--vt-gray: #c4c7c5;\n		--vt-sky-container: #004a77;\n		--vt-on-sky-container: #c2e7ff;\n		--vt-sky: #7fcfff;\n		--vt-pink-container: #8c1d4f;\n		--vt-on-pink-container: #ffd8e4;\n		--vt-pink: #ffb0c8;\n		--vt-red-container: #8c1d18;\n		--vt-on-red-container: #f9dedc;\n		--vt-red: #f2b8b5;\n		--vt-amber-container: #5c4300;\n		--vt-on-amber-container: #ffecb3;\n		--vt-amber: #ffd54f;\n		--vt-scheduled: #2e7d32;\n		--vt-scheduled-hover: #296e2c;\n		--vt-due-3: #4a3f14;\n		--vt-due-2: #6b5300;\n		--vt-due-1: #8a4b00;\n		--vt-on-due: #fff3d6;\n		--vt-due-0: #b3261e;\n	}\n}\n';

// src/obsidian/export.ts
function findFile(app, candidates) {
  for (const path of candidates) {
    const file = app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian.TFile) return file;
  }
  return null;
}
async function exportHtmlToTmp(app, file) {
  const vault = app.vault;
  try {
    const html = await vault.read(file);
    const out = await buildStandalone(html, {
      path: file.path,
      standaloneCss: tokens_standalone_default,
      parse: (text) => new DOMParser().parseFromString(text, "text/html"),
      readImage: async (candidates) => {
        const image = findFile(app, candidates);
        if (!image || image.stat.size > MAX_IMAGE_BYTES) return null;
        return new Uint8Array(await vault.readBinary(image));
      }
    });
    if (!vault.getAbstractFileByPath(TMP_FOLDER)) await vault.createFolder(TMP_FOLDER);
    const path = exportPath(file.path, (p) => vault.getAbstractFileByPath(p) !== null);
    const created = await vault.create(path, out);
    new import_obsidian.Notice(`${path} \u306B\u66F8\u304D\u51FA\u3057\u307E\u3057\u305F`);
    return created;
  } catch (e) {
    console.error("pkm-html: \u66F8\u304D\u51FA\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e);
    new import_obsidian.Notice(`\u66F8\u304D\u51FA\u305B\u307E\u305B\u3093\u3067\u3057\u305F: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

// src/obsidian/html-view.ts
var import_obsidian2 = require("obsidian");

// src/ui/frame.ts
var SANDBOX = "allow-same-origin";
function linkOf(target) {
  const el = target;
  if (!el || typeof el.closest !== "function") return null;
  return el.closest("a[href], area[href]");
}
function mountFrame(container, srcdoc, handlers) {
  const iframe = container.ownerDocument.createElement("iframe");
  iframe.className = "pkm-html-frame";
  iframe.setAttribute("sandbox", SANDBOX);
  iframe.setAttribute("referrerpolicy", "no-referrer");
  iframe.setAttribute("title", handlers.from);
  const onClick = (e) => {
    const link = linkOf(e.target);
    if (!link) return;
    e.preventDefault();
    if (e.type !== "click") return;
    const target = classifyLink(handlers.from, link.getAttribute("href") ?? "");
    if (target.kind === "vault") handlers.openVault(target);
    else if (target.kind === "external") handlers.openExternal(target.url);
    else if (target.kind === "anchor") {
      const doc2 = iframe.contentDocument;
      const el = doc2?.getElementById(target.id) ?? doc2?.getElementsByName(target.id)[0];
      el?.scrollIntoView();
    }
  };
  const onSubmit = (e) => e.preventDefault();
  let doc = null;
  const onLoad = () => {
    doc = iframe.contentDocument;
    if (!doc) return;
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("auxclick", onClick, true);
    doc.addEventListener("submit", onSubmit, true);
  };
  iframe.addEventListener("load", onLoad);
  iframe.srcdoc = srcdoc;
  container.appendChild(iframe);
  return {
    iframe,
    setTheme(theme) {
      const d = iframe.contentDocument;
      if (!d?.body) return;
      d.body.classList.remove("theme-light", "theme-dark");
      d.body.classList.add(`theme-${theme}`);
      const scheme = d.querySelector(`style[${MARK_ATTRIBUTE}="scheme"]`);
      if (scheme) scheme.textContent = schemeCss(theme);
    },
    destroy() {
      iframe.removeEventListener("load", onLoad);
      if (doc) {
        doc.removeEventListener("click", onClick, true);
        doc.removeEventListener("auxclick", onClick, true);
        doc.removeEventListener("submit", onSubmit, true);
      }
      iframe.remove();
    }
  };
}

// tokens.css
var tokens_default = "/* \u751F\u6210\u7269\u3002\u624B\u3067\u7DE8\u96C6\u3057\u306A\u3044\u3002\u6B63\u672C\u306F .kit/src/packages/design/tokens.json\uFF08pnpm --filter design build \u3067\u4F5C\u308A\u76F4\u3059\uFF09 */\n\n/* \u30E2\u30FC\u30C0\u30EB\u3067\u3082\u4F7F\u3046\u306E\u3067 body \u306B\u7F6E\u304F */\nbody {\n	--vt-surface: #f6f5f2;\n	--vt-surface-container: #efeeea;\n	--vt-surface-container-high: #e8e7e2;\n	--vt-on-surface: #2b2a28;\n	--vt-on-surface-variant: #57564f;\n	--vt-outline: #7f7e76;\n	--vt-outline-variant: #2b2a2824;\n	--vt-state-hover: #2b2a2814;\n	--vt-state-press: #2b2a281f;\n	--vt-primary: #6750a4;\n	--vt-on-primary: #ffffff;\n	--vt-primary-state-hover: #6750a414;\n	--vt-on-primary-state-hover: #ffffff14;\n	--vt-secondary-container: #e8def8;\n	--vt-on-secondary-container: #1d192b;\n	--vt-error: #b3261e;\n	--vt-focus-ring: var(--vt-primary);\n	--vt-green-container: #c4eed0;\n	--vt-on-green-container: #072711;\n	--vt-green: #1e8e3e;\n	--vt-blue-container: #d3e3fd;\n	--vt-on-blue-container: #041e49;\n	--vt-blue: #0b57d0;\n	--vt-purple-container: #eaddff;\n	--vt-on-purple-container: #21005d;\n	--vt-purple: #6750a4;\n	--vt-gray-container: #e3e3e3;\n	--vt-on-gray-container: #1f1f1f;\n	--vt-gray: #747775;\n	--vt-sky-container: #c2e7ff;\n	--vt-on-sky-container: #001d35;\n	--vt-sky: #00639b;\n	--vt-pink-container: #ffd8e4;\n	--vt-on-pink-container: #3e001d;\n	--vt-pink: #c2185b;\n	--vt-red-container: #f9dedc;\n	--vt-on-red-container: #410e0b;\n	--vt-red: #d93025;\n	--vt-amber-container: #ffecb3;\n	--vt-on-amber-container: #3a2a00;\n	--vt-amber: #b06d00;\n	--vt-scheduled: #188038;\n	--vt-scheduled-hover: #137333;\n	--vt-on-scheduled: #ffffff;\n	--vt-due-3: #fff8e1;\n	--vt-due-2: #ffe082;\n	--vt-due-1: #ffb74d;\n	--vt-on-due: #3a2a00;\n	--vt-due-0: #d93025;\n	--vt-on-due-0: #ffffff;\n	--vt-on-label: #1f1f1f;\n	--vt-radius-xs: 4px;\n	--vt-radius-s: 8px;\n	--vt-radius-m: 12px;\n	--vt-radius-l: 16px;\n	--vt-radius-xl: 28px;\n	--vt-radius-full: 9999px;\n	--vt-space-2: 2px;\n	--vt-space-4: 4px;\n	--vt-space-8: 8px;\n	--vt-space-12: 12px;\n	--vt-space-16: 16px;\n	--vt-space-20: 20px;\n	--vt-space-24: 24px;\n	--vt-space-32: 32px;\n	--vt-space-40: 40px;\n	--vt-space-48: 48px;\n	--vt-space-64: 64px;\n	--vt-space-96: 96px;\n	--vt-size-grid: 4px;\n	--vt-size-target-min: 24px;\n	--vt-border-width-thin: 1px;\n	--vt-border-width-thick: 2px;\n	--vt-breakpoint-pane-narrow: 480px;\n	--vt-breakpoint-pane-compact: 300px;\n	--vt-breakpoint-pane-medium: 720px;\n	--vt-weight-regular: 400;\n	--vt-weight-medium: 500;\n	--vt-weight-semibold: 600;\n	--vt-weight-bold: 700;\n	--vt-type-headline-small-size: 24px;\n	--vt-type-headline-small-line-height: 1.3333;\n	--vt-type-headline-small-weight: var(--vt-weight-semibold);\n	--vt-type-headline-small-tracking: -0.24px;\n	--vt-type-title-large-size: 20px;\n	--vt-type-title-large-line-height: 1.4;\n	--vt-type-title-large-weight: var(--vt-weight-semibold);\n	--vt-type-title-large-tracking: 0;\n	--vt-type-title-medium-size: 16px;\n	--vt-type-title-medium-line-height: 1.5;\n	--vt-type-title-medium-weight: var(--vt-weight-semibold);\n	--vt-type-title-medium-tracking: 0.15px;\n	--vt-type-body-medium-size: 15px;\n	--vt-type-body-medium-line-height: 1.5;\n	--vt-type-body-medium-weight: var(--vt-weight-regular);\n	--vt-type-body-medium-tracking: 0;\n	--vt-type-body-small-size: 13px;\n	--vt-type-body-small-line-height: 1.5;\n	--vt-type-body-small-weight: var(--vt-weight-regular);\n	--vt-type-body-small-tracking: 0;\n	--vt-type-label-medium-size: 12px;\n	--vt-type-label-medium-line-height: 1.3333;\n	--vt-type-label-medium-weight: var(--vt-weight-medium);\n	--vt-type-label-medium-tracking: 0.5px;\n	--vt-type-label-small-size: 11px;\n	--vt-type-label-small-line-height: 1.4545;\n	--vt-type-label-small-weight: var(--vt-weight-medium);\n	--vt-type-label-small-tracking: 0.5px;\n	--vt-duration-short2: 100ms;\n	--vt-duration-short3: 150ms;\n	--vt-duration-short4: 200ms;\n	--vt-duration-pulse: 1400ms;\n	--vt-duration-spin: 4200ms;\n	--vt-easing-standard: cubic-bezier(0.2, 0, 0, 1);\n	--vt-elevation-1: 0 1px 2px 0 #0000000f;\n	--vt-elevation-2: 0 1px 3px 0 #0000001f;\n	--vt-elevation-3: 0 2px 8px 0 #0000001f;\n	--vt-elevation-4: 0 4px 16px 0 #00000029;\n	--vt-elevation-5: 0 6px 24px 0 #00000024;\n	--vt-opacity-disabled: 0.38;\n	--vt-opacity-state-hover: 0.08;\n	--vt-opacity-state-press: 0.12;\n	--vt-scale-press-small: 0.92;\n	--vt-scale-press-medium: 0.97;\n	--vt-scale-press-large: 0.99;\n}\n\nbody.theme-dark {\n	--vt-surface: #1e1e1e;\n	--vt-surface-container: #242424;\n	--vt-surface-container-high: #2b2b2b;\n	--vt-on-surface: #d0d0d0;\n	--vt-on-surface-variant: #b3b3b3;\n	--vt-outline: #7a7a7a;\n	--vt-outline-variant: #d0d0d024;\n	--vt-state-hover: #d0d0d014;\n	--vt-state-press: #d0d0d01f;\n	--vt-primary: #d0bcff;\n	--vt-on-primary: #381e72;\n	--vt-primary-state-hover: #d0bcff14;\n	--vt-on-primary-state-hover: #381e7214;\n	--vt-secondary-container: #3d3749;\n	--vt-on-secondary-container: #e8def8;\n	--vt-error: #f2b8b5;\n	--vt-green-container: #0f5223;\n	--vt-on-green-container: #c4eed0;\n	--vt-green: #6dd58c;\n	--vt-blue-container: #0842a0;\n	--vt-on-blue-container: #d3e3fd;\n	--vt-blue: #a8c7fa;\n	--vt-purple-container: #4f378b;\n	--vt-on-purple-container: #eaddff;\n	--vt-purple: #d0bcff;\n	--vt-gray-container: #444746;\n	--vt-on-gray-container: #e3e3e3;\n	--vt-gray: #c4c7c5;\n	--vt-sky-container: #004a77;\n	--vt-on-sky-container: #c2e7ff;\n	--vt-sky: #7fcfff;\n	--vt-pink-container: #8c1d4f;\n	--vt-on-pink-container: #ffd8e4;\n	--vt-pink: #ffb0c8;\n	--vt-red-container: #8c1d18;\n	--vt-on-red-container: #f9dedc;\n	--vt-red: #f2b8b5;\n	--vt-amber-container: #5c4300;\n	--vt-on-amber-container: #ffecb3;\n	--vt-amber: #ffd54f;\n	--vt-scheduled: #2e7d32;\n	--vt-scheduled-hover: #296e2c;\n	--vt-due-3: #4a3f14;\n	--vt-due-2: #6b5300;\n	--vt-due-1: #8a4b00;\n	--vt-on-due: #fff3d6;\n	--vt-due-0: #b3261e;\n}\n";

// src/obsidian/html-view.ts
var VIEW_TYPE = "pkm-html";
var FONT_VARS = ["--font-interface", "--font-text", "--font-monospace"];
function currentTheme() {
  return document.body.classList.contains("theme-dark") ? "dark" : "light";
}
function fontVars() {
  const style = getComputedStyle(document.body);
  return Object.fromEntries(FONT_VARS.map((name) => [name, style.getPropertyValue(name)]));
}
var HtmlView = class extends import_obsidian2.FileView {
  allowNoFile = false;
  frame = null;
  /** 読み込みの途中で別のファイルに変わったら、古い結果を捨てる */
  generation = 0;
  constructor(leaf) {
    super(leaf);
    this.contentEl.addClass("pkm-html-view");
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return this.file?.basename ?? "HTML";
  }
  getIcon() {
    return "file-code";
  }
  canAcceptExtension(extension) {
    return HTML_EXTENSIONS.includes(extension.toLowerCase());
  }
  async onOpen() {
    this.registerEvent(this.app.workspace.on("css-change", () => this.frame?.setTheme(currentTheme())));
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian2.TFile && file === this.file) void this.render(file);
      })
    );
  }
  async onLoadFile(file) {
    await this.render(file);
  }
  async onUnloadFile() {
    this.generation++;
    this.clear();
  }
  async onClose() {
    this.generation++;
    this.clear();
  }
  clear() {
    this.frame?.destroy();
    this.frame = null;
    this.contentEl.empty();
  }
  findFile(candidates) {
    for (const path of candidates) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian2.TFile) return file;
    }
    return null;
  }
  async render(file) {
    const generation = ++this.generation;
    const html = await this.app.vault.cachedRead(file);
    const srcdoc = await buildSrcdoc(html, {
      path: file.path,
      theme: currentTheme(),
      tokensCss: tokens_default,
      fontVars: fontVars(),
      readImage: async (candidates) => {
        const image = this.findFile(candidates);
        if (!image || image.stat.size > MAX_IMAGE_BYTES) return null;
        return new Uint8Array(await this.app.vault.readBinary(image));
      }
    });
    if (generation !== this.generation) return;
    this.clear();
    this.frame = mountFrame(this.contentEl, srcdoc, {
      from: file.path,
      openVault: ({ candidates, subpath }) => {
        const target = this.findFile(candidates);
        if (!target) {
          new import_obsidian2.Notice(`\u30D5\u30A1\u30A4\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ${candidates[0] ?? ""}`);
          return;
        }
        this.app.workspace.setActiveLeaf(this.leaf, { focus: true });
        void this.app.workspace.openLinkText(`${target.path}${subpath}`, file.path, false);
      },
      openExternal: (url) => {
        window.open(url, "_blank");
      }
    });
  }
};

// src/main.ts
var PkmHtmlPlugin = class extends import_obsidian3.Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new HtmlView(leaf));
    try {
      this.registerExtensions([...HTML_EXTENSIONS], VIEW_TYPE);
    } catch (e) {
      new import_obsidian3.Notice(`pkm-html: .html \u3092\u767B\u9332\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF08${e instanceof Error ? e.message : String(e)}\uFF09`);
    }
    this.addCommand({
      id: "export-to-tmp",
      name: "Export HTML to tmp/",
      icon: "file-output",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!isHtml(file)) return false;
        if (!checking) void exportHtmlToTmp(this.app, file);
        return true;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!isHtml(file)) return;
        menu.addItem((item) => item.setTitle("Export HTML to tmp/").setIcon("file-output").onClick(() => void exportHtmlToTmp(this.app, file)));
      })
    );
  }
};
function isHtml(file) {
  return file instanceof import_obsidian3.TFile && HTML_EXTENSIONS.includes(file.extension.toLowerCase());
}
