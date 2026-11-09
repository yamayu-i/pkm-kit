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
  default: () => PkmDrawioPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// ../pkm-html/src/core/policy.ts
var MAX_IMAGE_BYTES = 10 * 1024 * 1024;
var SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
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
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// src/core/encoding.ts
var SVG_MIME = "image/svg+xml";
function svgDataUri(svg) {
  return `data:${SVG_MIME};base64,${bytesToBase64(new TextEncoder().encode(svg))}`;
}
function decodeDataUri(uri) {
  const m = /^data:([^;,]*)((?:;[^;,]*)*),/i.exec(uri);
  if (!m) return null;
  const mime = (m[1] || "text/plain").toLowerCase();
  const params = (m[2] ?? "").toLowerCase().split(";");
  const body = uri.slice(m[0].length);
  try {
    if (params.includes("base64")) {
      const binary = atob(body.replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { mime, bytes };
    }
    return { mime, bytes: new TextEncoder().encode(decodeURIComponent(body)) };
  } catch {
    return null;
  }
}
function utf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

// src/core/svg.ts
var DRAWIO_SVG_SUFFIX = ".drawio.svg";
var MAX_SVG_BYTES = 10 * 1024 * 1024;
var MAX_XML_CHARS = 20 * 1024 * 1024;
function isDrawioSvgPath(path) {
  return path.toLowerCase().endsWith(DRAWIO_SVG_SUFFIX) && path.length > DRAWIO_SVG_SUFFIX.length && !path.endsWith(`/${DRAWIO_SVG_SUFFIX}`);
}
function isDiagramSvgPath(path) {
  const base = path.split("/").pop() ?? "";
  return base.toLowerCase().endsWith(".svg") && base.length > ".svg".length;
}
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
var NAMED_ENTITIES = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
function decodeXmlEntities(raw) {
  if (/&(?![^;&\s]{1,16};)/.test(raw)) throw new DrawioFormatError("& \u304C\u5B9F\u4F53\u53C2\u7167\u306B\u306A\u3063\u3066\u3044\u306A\u3044");
  return raw.replace(/&([^;&\s]{1,16});/g, (_, ref) => {
    if (ref.startsWith("#x") || ref.startsWith("#X")) {
      const code = Number.parseInt(ref.slice(2), 16);
      if (!/^[0-9a-f]+$/i.test(ref.slice(2)) || code > 1114111) throw new DrawioFormatError(`\u8AAD\u3081\u306A\u3044\u6587\u5B57\u53C2\u7167 &${ref};`);
      return String.fromCodePoint(code);
    }
    if (ref.startsWith("#")) {
      const code = Number.parseInt(ref.slice(1), 10);
      if (!/^[0-9]+$/.test(ref.slice(1)) || code > 1114111) throw new DrawioFormatError(`\u8AAD\u3081\u306A\u3044\u6587\u5B57\u53C2\u7167 &${ref};`);
      return String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[ref];
    if (named === void 0) throw new DrawioFormatError(`\u77E5\u3089\u306A\u3044\u5B9F\u4F53\u53C2\u7167 &${ref};`);
    return named;
  });
}
function utf8FromBase64(b64) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length % 4 !== 0) return null;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
function extractDiagramXml(svg) {
  if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG \u304C\u5927\u304D\u3059\u304E\u308B\uFF0810 MiB \u307E\u3067\uFF09");
  const root = parseRootSvg(svg);
  const content = root.attributes.find((a) => a.name === "content");
  if (!content) return { kind: "plain-svg" };
  let xml = decodeXmlEntities(content.raw).trim();
  if (!xml.startsWith("<")) {
    const decoded = utf8FromBase64(xml);
    if (decoded === null || !decoded.trimStart().startsWith("<")) throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u306E\u5F62\u5F0F\u3092\u8AAD\u3081\u306A\u3044");
    xml = decoded.trim();
  }
  if (xml.length > MAX_XML_CHARS) throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u304C\u5927\u304D\u3059\u304E\u308B");
  if (!/^<(mxfile|mxGraphModel)[\s>/]/.test(xml)) throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u304C <mxfile> / <mxGraphModel> \u3067\u306F\u306A\u3044");
  if (/<!(DOCTYPE|ENTITY)/i.test(xml)) throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u306B DOCTYPE\u30FB\u5B9F\u4F53\u306E\u5BA3\u8A00\u304C\u3042\u308B");
  return { kind: "diagram", xml };
}
function countPages(xml) {
  if (xml.startsWith("<mxGraphModel")) return 1;
  return (xml.match(/<diagram[\s>]/g) ?? []).length;
}
function toSharingSvg(svg) {
  if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG \u304C\u5927\u304D\u3059\u304E\u308B\uFF0810 MiB \u307E\u3067\uFF09");
  const root = parseRootSvg(svg);
  const content = root.attributes.find((a) => a.name === "content");
  if (!content) return svg;
  return svg.slice(0, content.start) + svg.slice(content.end);
}
function decodeLoosely(value) {
  return value.replace(/&#(x[0-9a-f]{1,6}|[0-9]{1,7});?|&colon;/gi, (m, ref) => {
    if (ref === void 0) return ":";
    const code = ref[0] === "x" || ref[0] === "X" ? Number.parseInt(ref.slice(1), 16) : Number.parseInt(ref, 10);
    return code <= 1114111 ? String.fromCodePoint(code) : m;
  });
}
function findSvgProblems(svg) {
  const errors = /* @__PURE__ */ new Set();
  const warnings = /* @__PURE__ */ new Set();
  if (/<!ENTITY/i.test(svg)) errors.add("\u5B9F\u4F53\u306E\u5BA3\u8A00\uFF08<!ENTITY>\uFF09");
  for (const m of svg.matchAll(/<([a-zA-Z][\w:.-]*)\b([^>]*)>/g)) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const local = tag.includes(":") ? tag.slice(tag.indexOf(":") + 1) : tag;
    if (["script", "iframe", "object", "embed", "frame", "frameset", "handler", "listener"].includes(local)) errors.add(`<${local}> \u8981\u7D20`);
    if (/(^|\s)on[a-z]+\s*=/i.test(attrs)) errors.add("\u30A4\u30D9\u30F3\u30C8\u5C5E\u6027\uFF08on*\uFF09");
    for (const v of attrs.matchAll(/=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      const value = decodeLoosely(v[1] ?? v[2] ?? "").replace(/[\u0000-\u0020]/g, "").toLowerCase();
      if (value.startsWith("javascript:") || value.startsWith("vbscript:") || value.startsWith("data:text/html")) errors.add("\u30B9\u30AF\u30EA\u30D7\u30C8\u3092\u52D5\u304B\u3059 URL");
    }
    if (["image", "use", "feimage"].includes(local) && /(^|\s)(xlink:)?href\s*=\s*["']\s*(https?:|\/\/)/i.test(attrs)) {
      warnings.add(`\u5916\u90E8\u306E\u753B\u50CF\u30FB\u56F3\u5F62\u306E\u8AAD\u307F\u8FBC\u307F\uFF08<${local}>\uFF09`);
    }
    if (/url\(\s*["']?\s*(https?:|\/\/)/i.test(attrs)) warnings.add("\u5916\u90E8\u306E url()");
  }
  if (/@import/i.test(svg)) warnings.add("CSS \u306E @import");
  if (/url\(\s*["']?\s*(https?:|\/\/)/i.test(svg.replace(/<[^>]*>/g, ""))) warnings.add("\u5916\u90E8\u306E url()");
  return { errors: [...errors], warnings: [...warnings] };
}

// src/core/document.ts
function documentKind(path) {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "html" || ext === "htm") return "html";
  return null;
}
function markdownSkipRanges(text) {
  const ranges = [];
  let offset = 0;
  let fence = null;
  const prose = [];
  let proseStart = 0;
  for (const line of text.split(/(?<=\n)/)) {
    const body = line.replace(/\r?\n$/, "");
    const stripped = body.replace(/^(?:\s*>)*\s*(?:(?:[-*+]|\d{1,9}[.)])\s+)?/, "");
    if (fence) {
      const close = new RegExp(`^${fence.char === "`" ? "`" : "~"}{${fence.len},}\\s*$`);
      if (close.test(stripped)) {
        ranges.push([fence.start, offset + line.length]);
        fence = null;
        proseStart = offset + line.length;
      }
    } else {
      const open = /^(`{3,}|~{3,})(.*)$/.exec(stripped);
      if (open && !(open[1]?.startsWith("`") && open[2]?.includes("`"))) {
        prose.push([proseStart, offset]);
        fence = { char: open[1][0], len: open[1].length, start: offset };
      }
    }
    offset += line.length;
  }
  if (fence) ranges.push([fence.start, text.length]);
  else prose.push([proseStart, text.length]);
  for (const [from, to] of prose) {
    let i = from;
    while (i < to) {
      const ch = text[i];
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (text.startsWith("<!--", i)) {
        const end = text.indexOf("-->", i + 4);
        const stop = end < 0 || end + 3 > to ? to : end + 3;
        ranges.push([i, stop]);
        i = stop;
        continue;
      }
      if (ch === "`") {
        let n = 0;
        while (text[i + n] === "`") n++;
        let j = i + n;
        let found = -1;
        while (j < to) {
          const k = text.indexOf("`", j);
          if (k < 0 || k >= to) break;
          let m = 0;
          while (text[k + m] === "`") m++;
          if (m === n) {
            found = k;
            break;
          }
          j = k + m;
        }
        if (found >= 0) {
          ranges.push([i, found + n]);
          i = found + n;
        } else {
          i += n;
        }
        continue;
      }
      i++;
    }
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}
function inRanges(ranges, pos) {
  return ranges.some(([a, b]) => pos >= a && pos < b);
}
function isEscaped(text, pos) {
  let n = 0;
  for (let i = pos - 1; i >= 0 && text[i] === "\\"; i--) n++;
  return n % 2 === 1;
}
function readMarkdownImage(text, pos) {
  let i = pos + 2;
  let depth = 0;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "\n" && text[i + 1] === "\n") return null;
    if (ch === "[") depth++;
    else if (ch === "]") {
      if (depth === 0) break;
      depth--;
    }
  }
  if (text[i] !== "]" || text[i + 1] !== "(") return null;
  i += 2;
  while (text[i] === " " || text[i] === "	" || text[i] === "\n") i++;
  let start;
  let end;
  if (text[i] === "<") {
    start = i + 1;
    const close = text.indexOf(">", start);
    if (close < 0 || text.slice(start, close).includes("\n")) return null;
    end = close;
    i = close + 1;
  } else {
    start = i;
    let parens = 0;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === "\\") {
        i++;
        continue;
      }
      if (/\s/.test(ch)) break;
      if (ch === "(") parens++;
      else if (ch === ")") {
        if (parens === 0) break;
        parens--;
      }
    }
    end = i;
    if (end === start) return null;
  }
  while (text[i] === " " || text[i] === "	" || text[i] === "\n") i++;
  const q = text[i];
  if (q === '"' || q === "'" || q === "(") {
    const closeQ = q === "(" ? ")" : q;
    const close = text.indexOf(closeQ, i + 1);
    if (close < 0) return null;
    i = close + 1;
    while (text[i] === " " || text[i] === "	" || text[i] === "\n") i++;
  }
  if (text[i] !== ")") return null;
  return { start, end, url: text.slice(start, end), syntax: "markdown" };
}
function readImgSrc(text, tagStart, tagEnd) {
  const tag = text.slice(tagStart, tagEnd);
  const m = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(tag);
  if (!m) return null;
  const value = m[1] ?? m[2] ?? m[3] ?? "";
  const valueOffset = m.index + m[0].length - value.length - (m[3] === void 0 ? 1 : 0);
  const start = tagStart + valueOffset;
  return { start, end: start + value.length, url: value, syntax: "html" };
}
function findImgTags(text, skip) {
  const refs = [];
  for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
    if (inRanges(skip, m.index)) continue;
    const ref = readImgSrc(text, m.index, m.index + m[0].length);
    if (ref) refs.push(ref);
  }
  return refs;
}
function findImageReferences(text, kind) {
  if (kind === "html") {
    const skip2 = [];
    for (const m of text.matchAll(/<!--[\s\S]*?(?:-->|$)/g)) skip2.push([m.index, m.index + m[0].length]);
    for (const m of text.matchAll(/<(script|style|template|textarea)\b[\s\S]*?(?:<\/\1\s*>|$)/gi)) skip2.push([m.index, m.index + m[0].length]);
    return findImgTags(text, skip2);
  }
  const skip = markdownSkipRanges(text);
  const refs = [];
  for (let pos = text.indexOf("!["); pos >= 0; pos = text.indexOf("![", pos + 1)) {
    if (inRanges(skip, pos) || isEscaped(text, pos)) continue;
    const ref = readMarkdownImage(text, pos);
    if (ref) refs.push(ref);
  }
  refs.push(...findImgTags(text, skip));
  return refs.sort((a, b) => a.start - b.start);
}
function unescapeUrl(ref) {
  if (ref.syntax === "markdown") return ref.url.replace(/\\([!-/:-@[-`{-~])/g, "$1");
  return ref.url.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" })[e] ?? "");
}
function drawioCandidates(sourcePath, ref, kind) {
  const url = unescapeUrl(ref);
  const candidates = kind === "markdown" && ref.syntax === "markdown" ? candidatePaths("", url) : candidatePaths(sourcePath, url);
  return candidates.filter(isDiagramSvgPath);
}
async function embedDiagrams(text, options) {
  const errors = [];
  const warnings = [];
  const raw = /* @__PURE__ */ new Map();
  const uris = /* @__PURE__ */ new Map();
  const replacements = [];
  const read = async (path) => {
    if (!raw.has(path)) raw.set(path, await options.readText(path));
    return raw.get(path) ?? null;
  };
  const toUri = (path, svg) => {
    if (uris.has(path)) return uris.get(path) ?? null;
    let uri = null;
    try {
      if (isDrawioSvgPath(path) && extractDiagramXml(svg).kind === "plain-svg") warnings.push(`${path}: \u7DE8\u96C6\u7528 XML \u304C\u306A\u3044\uFF08\u666E\u901A\u306E SVG \u3068\u3057\u3066\u57CB\u3081\u8FBC\u3080\uFF09`);
      const sharing = toSharingSvg(svg);
      const problems = findSvgProblems(sharing);
      for (const p of problems.errors) errors.push(`${path}: ${p}\u304C\u3042\u308B`);
      for (const p of problems.warnings) warnings.push(`${path}: ${p}\u304C\u3042\u308B\uFF08\u66F8\u304D\u51FA\u3057\u305F\u5148\u3067\u306F\u8868\u793A\u3055\u308C\u306A\u3044\uFF09`);
      if (problems.errors.length === 0) uri = svgDataUri(sharing);
    } catch (e) {
      errors.push(`${path}: ${e instanceof DrawioFormatError ? e.message : String(e)}`);
    }
    uris.set(path, uri);
    return uri;
  };
  for (const ref of findImageReferences(text, options.kind)) {
    const candidates = drawioCandidates(options.sourcePath, ref, options.kind);
    if (candidates.length === 0) continue;
    let found = false;
    for (const path of candidates) {
      const svg = await read(path);
      if (svg === null) continue;
      found = true;
      const uri = toUri(path, svg);
      if (uri) replacements.push({ ref, uri });
      break;
    }
    if (!found) errors.push(`${ref.url}: \u56F3\u306E\u30D5\u30A1\u30A4\u30EB\u304C\u898B\u3064\u304B\u3089\u306A\u3044`);
  }
  let out = text;
  for (const { ref, uri } of [...replacements].sort((a, b) => b.ref.start - a.ref.start)) {
    out = out.slice(0, ref.start) + uri + out.slice(ref.end);
  }
  const diagrams = [...uris.entries()].filter(([, v]) => v !== null).map(([k]) => k);
  return { text: out, diagrams, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}
function checkExported(text, kind, sourcePath = "") {
  const problems = [];
  for (const ref of findImageReferences(text, kind)) {
    if (drawioCandidates(sourcePath, ref, kind).length > 0) {
      problems.push(`\u56F3\u306E\u30D5\u30A1\u30A4\u30EB\u3078\u306E\u53C2\u7167\u304C\u6B8B\u3063\u3066\u3044\u308B: ${ref.url}`);
      continue;
    }
    if (!ref.url.toLowerCase().startsWith(`data:${SVG_MIME}`)) continue;
    const decoded = decodeDataUri(ref.url);
    const svg = decoded ? utf8(decoded.bytes) : null;
    if (svg === null) {
      problems.push("SVG \u306E data URI \u3092\u8AAD\u3081\u306A\u3044");
      continue;
    }
    try {
      if (parseRootSvg(svg).attributes.some((a) => a.name === "content")) problems.push("\u57CB\u3081\u8FBC\u3093\u3060 SVG \u306B\u7DE8\u96C6\u7528 XML \u304C\u6B8B\u3063\u3066\u3044\u308B");
    } catch (e) {
      problems.push(`\u57CB\u3081\u8FBC\u3093\u3060 SVG \u3092\u8AAD\u3081\u306A\u3044\uFF08${e instanceof Error ? e.message : String(e)}\uFF09`);
    }
  }
  return problems;
}

// src/core/names.ts
var ASSET_FOLDER = "asset";
var TMP_FOLDER = "tmp";
function invalidDiagramName(name) {
  const trimmed = name.trim();
  if (trimmed === "") return "\u540D\u524D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  if (/[\\/:*?"<>|#^[\]\u0000-\u001f]/.test(trimmed)) return '\u4F7F\u3048\u306A\u3044\u6587\u5B57\uFF08/ \\ : * ? " < > | # ^ [ ]\uFF09\u304C\u5165\u3063\u3066\u3044\u307E\u3059';
  if (trimmed.startsWith(".")) return "\u540D\u524D\u3092 . \u3067\u59CB\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044";
  if (trimmed.length > 100) return "\u540D\u524D\u304C\u9577\u3059\u304E\u307E\u3059\uFF08100 \u6587\u5B57\u307E\u3067\uFF09";
  return null;
}
function diagramPath(name) {
  return `${ASSET_FOLDER}/${name.trim()}${DRAWIO_SVG_SUFFIX}`;
}
function diagramName(path) {
  const base = path.slice(path.lastIndexOf("/") + 1);
  return base.toLowerCase().endsWith(DRAWIO_SVG_SUFFIX) ? base.slice(0, -DRAWIO_SVG_SUFFIX.length) : base;
}
function markdownImage(alt, path) {
  const url = path.split("/").map((s) => encodeURIComponent(s)).join("/");
  return `![${alt.replace(/[[\]\\]/g, (c) => `\\${c}`)}](${url})`;
}
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
function editedCopyPath(path, now, taken) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}`;
  const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ASSET_FOLDER;
  return freePath(folder, `${diagramName(path)} (\u7DE8\u96C6 ${stamp})`, DRAWIO_SVG_SUFFIX, taken);
}

// ../design/generated/tokens.ts
var diagram = {
  light: { "neutral": { "text": "#2b2a28", "muted": "#57564f", "nodeFill": "#f6f5f2", "nodeStroke": "#7f7e76", "groupFill": "#efeeea", "groupStroke": "#7f7e76", "edge": "#57564f", "labelBg": "#f6f5f2" }, "colors": { "blue": { "fill": "#d3e3fd", "stroke": "#0b57d0", "text": "#041e49" }, "green": { "fill": "#c4eed0", "stroke": "#1e8e3e", "text": "#072711" }, "purple": { "fill": "#eaddff", "stroke": "#6750a4", "text": "#21005d" }, "gray": { "fill": "#e3e3e3", "stroke": "#747775", "text": "#1f1f1f" }, "sky": { "fill": "#c2e7ff", "stroke": "#00639b", "text": "#001d35" }, "pink": { "fill": "#ffd8e4", "stroke": "#c2185b", "text": "#3e001d" }, "red": { "fill": "#f9dedc", "stroke": "#d93025", "text": "#410e0b" }, "amber": { "fill": "#ffecb3", "stroke": "#b06d00", "text": "#3a2a00" } } },
  dark: { "neutral": { "text": "#d0d0d0", "muted": "#b3b3b3", "nodeFill": "#1e1e1e", "nodeStroke": "#7a7a7a", "groupFill": "#242424", "groupStroke": "#7a7a7a", "edge": "#b3b3b3", "labelBg": "#1e1e1e" }, "colors": { "blue": { "fill": "#0842a0", "stroke": "#a8c7fa", "text": "#d3e3fd" }, "green": { "fill": "#0f5223", "stroke": "#6dd58c", "text": "#c4eed0" }, "purple": { "fill": "#4f378b", "stroke": "#d0bcff", "text": "#eaddff" }, "gray": { "fill": "#444746", "stroke": "#c4c7c5", "text": "#e3e3e3" }, "sky": { "fill": "#004a77", "stroke": "#7fcfff", "text": "#c2e7ff" }, "pink": { "fill": "#8c1d4f", "stroke": "#ffb0c8", "text": "#ffd8e4" }, "red": { "fill": "#8c1d18", "stroke": "#f2b8b5", "text": "#f9dedc" }, "amber": { "fill": "#5c4300", "stroke": "#ffd54f", "text": "#ffecb3" } } }
};

// src/core/png.ts
var PNG_BACKGROUND = diagram.light.neutral.labelBg;
function blockEnd(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return css.length;
}
function stripDarkMedia(css) {
  let out = "";
  let pos = 0;
  const re = /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/gi;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    const open = m.index + m[0].length - 1;
    out += css.slice(pos, m.index);
    pos = blockEnd(css, open);
    re.lastIndex = pos;
  }
  return out + css.slice(pos);
}
function forceLightSvg(svg) {
  return svg.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, body, close) => `${open}${stripDarkMedia(body)}${close}`);
}
function darkToLightColors() {
  const map = /* @__PURE__ */ new Map();
  const add = (dark, light) => {
    const key = dark.toLowerCase();
    if (!map.has(key)) map.set(key, light.toLowerCase());
  };
  for (const role of Object.keys(diagram.dark.neutral)) add(diagram.dark.neutral[role], diagram.light.neutral[role]);
  for (const name of Object.keys(diagram.dark.colors)) {
    const d = diagram.dark.colors[name];
    const l = diagram.light.colors[name];
    add(d.fill, l.fill);
    add(d.stroke, l.stroke);
    add(d.text, l.text);
  }
  return map;
}
function cssColorToHex(value) {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (hex) {
    const h = hex[1];
    return h.length === 3 ? `#${[...h].map((c) => c + c).join("")}` : `#${h}`;
  }
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
  if (!rgb) return null;
  if (rgb[4] !== void 0) {
    const a = rgb[4].endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
    if (a === 0) return null;
  }
  return `#${[rgb[1], rgb[2], rgb[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, "0")).join("")}`;
}
function saveMethods(env) {
  const out = [];
  if (env.picker) out.push("picker");
  if (env.share) out.push("share");
  out.push("tmp");
  return out;
}
function pngFileName(base) {
  const stem = base.replace(/\.drawio\.svg$/i, "").replace(/\.(svg|md|html?)$/i, "").replace(/[\\/:*?"<>|#^[\]\u0000-\u001f]+/g, "-").trim();
  return `${stem || "diagram"}.png`;
}

// src/obsidian/copy.ts
var import_obsidian = require("obsidian");
var COPY_FORMATS = [
  { format: "png", label: "Copy as PNG", icon: "image" },
  { format: "svg", label: "Copy as SVG (without editable XML)", icon: "file-image" },
  { format: "xml", label: "Copy as XML (editable in Draw.io)", icon: "file-code" }
];
function copyFormatsFor(drawio) {
  return drawio ? COPY_FORMATS : COPY_FORMATS.filter((f) => f.format !== "xml");
}
var PNG_SCALE = 2;
var MAX_PNG_SIDE = 8192;
function clipboardItemCtor() {
  return typeof ClipboardItem === "function" ? ClipboardItem : null;
}
function supports(type) {
  const ctor = clipboardItemCtor();
  if (!ctor) return false;
  return typeof ctor.supports === "function" ? ctor.supports(type) : true;
}
async function copyDiagram(svg, format, doc) {
  try {
    if (format === "xml") {
      const r = extractDiagramXml(svg);
      if (r.kind !== "diagram") {
        new import_obsidian.Notice("\u3053\u306E SVG \u306B\u306F\u7DE8\u96C6\u7528 XML \u304C\u3042\u308A\u307E\u305B\u3093\uFF08Draw.io \u306E\u56F3\u3067\u306F\u306A\u3044\uFF09");
        return;
      }
      await navigator.clipboard.writeText(r.xml);
      new import_obsidian.Notice("XML \u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F");
      return;
    }
    const sharing = toSharingSvg(svg);
    if (format === "svg") {
      const Item2 = clipboardItemCtor();
      if (Item2 && supports(SVG_MIME)) {
        try {
          await navigator.clipboard.write([
            new Item2({ [SVG_MIME]: new Blob([sharing], { type: SVG_MIME }), "text/plain": new Blob([sharing], { type: "text/plain" }) })
          ]);
          new import_obsidian.Notice("SVG \u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F");
          return;
        } catch {
        }
      }
      await navigator.clipboard.writeText(sharing);
      new import_obsidian.Notice("SVG \u3092\u30C6\u30AD\u30B9\u30C8\u3068\u3057\u3066\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\uFF08\u3053\u306E\u74B0\u5883\u3067\u306F\u753B\u50CF\u3068\u3057\u3066\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\uFF09");
      return;
    }
    const Item = clipboardItemCtor();
    if (!Item || !supports("image/png")) {
      new import_obsidian.Notice("\u3053\u306E\u74B0\u5883\u3067\u306F PNG \u3092\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3002SVG \u304B XML \u3067\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    await navigator.clipboard.write([new Item({ "image/png": renderPng(sharing, doc) })]);
    new import_obsidian.Notice("PNG \u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F");
  } catch (e) {
    const message = e instanceof DrawioFormatError ? e.message : e instanceof Error ? e.message : String(e);
    new import_obsidian.Notice(`\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${message}`, 8e3);
  }
}
function svgSize(svg) {
  const root = svg.documentElement;
  const num = (v) => {
    const n = v === null ? Number.NaN : Number.parseFloat(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const vb = (root.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  const width = num(root.getAttribute("width")) ?? (vb.length === 4 && vb[2] && vb[2] > 0 ? vb[2] : null) ?? 300;
  const height = num(root.getAttribute("height")) ?? (vb.length === 4 && vb[3] && vb[3] > 0 ? vb[3] : null) ?? 150;
  return { width, height };
}
async function draw(svgText, doc, size) {
  const img = doc.createElement("img");
  img.decoding = "async";
  img.src = svgDataUri(svgText);
  await img.decode();
  const scale = Math.min(PNG_SCALE, MAX_PNG_SIDE / size.width, MAX_PNG_SIDE / size.height);
  const canvas = doc.createElement("canvas");
  canvas.width = Math.max(1, Math.round(size.width * scale));
  canvas.height = Math.max(1, Math.round(size.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas \u3092\u4F7F\u3048\u306A\u3044");
  ctx.fillStyle = PNG_BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG \u3092\u4F5C\u308C\u306A\u3044")), "image/png");
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
async function renderPng(svg, doc) {
  const sharingSvg = forceLightSvg(svg);
  const parsed = new DOMParser().parseFromString(sharingSvg, SVG_MIME);
  if (parsed.getElementsByTagName("parsererror").length > 0) throw new DrawioFormatError("SVG \u3092\u8AAD\u3081\u306A\u3044");
  const size = svgSize(parsed);
  try {
    return await draw(sharingSvg, doc, size);
  } catch {
    for (const fo of [...parsed.getElementsByTagNameNS("http://www.w3.org/2000/svg", "foreignObject")]) {
      if (fo.parentElement?.localName === "switch") fo.remove();
    }
    return await draw(new XMLSerializer().serializeToString(parsed), doc, size);
  }
}

// src/obsidian/dialogs.ts
var import_obsidian2 = require("obsidian");
function choose(app, title, message, choices) {
  return new Promise((resolve) => {
    let done = false;
    const modal = new class extends import_obsidian2.Modal {
      onOpen() {
        this.setTitle(title);
        this.contentEl.createEl("p", { text: message });
        const setting = new import_obsidian2.Setting(this.contentEl);
        for (const c of choices) {
          setting.addButton((b) => {
            b.setButtonText(c.label).onClick(() => {
              done = true;
              resolve(c.value);
              this.close();
            });
            if (c.style === "cta") b.setCta();
            if (c.style === "warning") b.setWarning();
          });
        }
      }
      onClose() {
        this.contentEl.empty();
        if (!done) resolve(null);
      }
    }(app);
    modal.open();
  });
}
function askDiagramName(app, initial = "") {
  return new Promise((resolve) => {
    let done = false;
    const modal = new class extends import_obsidian2.Modal {
      onOpen() {
        this.setTitle("New diagram");
        let value = initial;
        const error = this.contentEl.createEl("p", { cls: "vt-drawio-error" });
        const submit = () => {
          const problem = invalidDiagramName(value);
          error.setText(problem ?? "");
          if (problem) return;
          done = true;
          resolve(value.trim());
          this.close();
        };
        new import_obsidian2.Setting(this.contentEl).setName("Name").setDesc("Saved as asset/<name>.drawio.svg").addText((t) => {
          t.setValue(initial).onChange((v) => {
            value = v;
          });
          t.inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.isComposing) {
              e.preventDefault();
              submit();
            }
          });
          window.setTimeout(() => t.inputEl.focus(), 0);
        });
        new import_obsidian2.Setting(this.contentEl).addButton((b) => b.setButtonText("Draw in Draw.io").setCta().onClick(submit));
      }
      onClose() {
        this.contentEl.empty();
        if (!done) resolve(null);
      }
    }(app);
    modal.open();
  });
}
function pick(app, placeholder, items, label) {
  return new Promise((resolve) => {
    let chosen = false;
    const modal = new class extends import_obsidian2.SuggestModal {
      getSuggestions(query) {
        const q = query.trim().toLowerCase();
        return items.filter((i) => label(i).toLowerCase().includes(q));
      }
      renderSuggestion(item, el) {
        el.setText(label(item));
      }
      onChooseSuggestion(item) {
        chosen = true;
        resolve(item);
      }
      onClose() {
        window.setTimeout(() => {
          if (!chosen) resolve(null);
        }, 0);
      }
    }(app);
    modal.setPlaceholder(placeholder);
    modal.open();
  });
}

// src/obsidian/editor-modal.ts
var import_obsidian3 = require("obsidian");

// src/core/protocol.ts
var EMBED_ORIGIN = "https://embed.diagrams.net";
function embedUrl() {
  const params = new URLSearchParams({ embed: "1", proto: "json", spin: "1", saveAndExit: "1", libraries: "1", noExitBtn: "0", lang: "ja" });
  return `${EMBED_ORIGIN}/?${params.toString()}`;
}
var EXPORT_TIMEOUT_MS = 3e4;
var MAX_MESSAGE_CHARS = 2 * MAX_SVG_BYTES + 1024 * 1024;
function parseMessage(data) {
  if (typeof data !== "string" || data.length > MAX_MESSAGE_CHARS) return null;
  let msg;
  try {
    msg = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof msg !== "object" || msg === null) return null;
  const m = msg;
  switch (m.event) {
    case "init":
      return { event: "init" };
    case "autosave":
      return typeof m.xml === "string" ? { event: "autosave", xml: m.xml } : null;
    case "save":
      return typeof m.xml === "string" ? { event: "save", xml: m.xml, exit: m.exit === true } : null;
    case "export":
      return typeof m.data === "string" && typeof m.format === "string" ? { event: "export", format: m.format, data: m.data } : null;
    case "exit":
      return { event: "exit", modified: m.modified === true };
    default:
      return null;
  }
}
var EditSession = class {
  constructor(initialXml, title) {
    this.initialXml = initialXml;
    this.title = title;
    this.savedXml = initialXml;
    this.latestXml = initialXml;
  }
  initialXml;
  title;
  phase = "starting";
  /** 最後に書けた XML（新しい図なら null） */
  savedXml;
  /** 編集画面の最新の XML（autosave / save で更新） */
  latestXml;
  /** 保存中の XML と、その世代 */
  pending = null;
  /** 保存中に届いた次の保存 */
  queued = null;
  closeAfterSave = false;
  /** 最後の保存が失敗した（成功するまで未保存として扱う） */
  failed = false;
  generation = 0;
  /** 保存していない変更があるか */
  get dirty() {
    return this.failed || this.latestXml !== this.savedXml || this.pending !== null || this.queued !== null;
  }
  /** 保存していない変更の XML（退避用） */
  get unsavedXml() {
    return this.dirty ? this.queued?.xml ?? this.latestXml : null;
  }
  get busy() {
    return this.phase === "exporting" || this.phase === "writing";
  }
  handle(msg) {
    if (this.phase === "closed") return [];
    switch (msg.event) {
      case "init":
        if (this.phase !== "starting") return [];
        this.phase = "ready";
        return [{ type: "post", message: { action: "load", xml: this.initialXml ?? "", autosave: 1, title: this.title } }];
      case "autosave":
        this.latestXml = msg.xml;
        return [];
      case "save":
        this.latestXml = msg.xml;
        if (this.busy) {
          this.queued = { xml: msg.xml, exit: msg.exit || (this.queued?.exit ?? false) };
          return [];
        }
        return this.startExport(msg.xml, msg.exit);
      case "export":
        return this.onExport(msg);
      case "exit":
        if (this.busy) {
          this.closeAfterSave = true;
          return [];
        }
        return this.close();
    }
  }
  /** 親がファイルを書き終えた（ok = false なら失敗） */
  writeDone(generation, ok, error) {
    if (this.phase !== "writing" || !this.pending || this.pending.generation !== generation) return [];
    const done = this.pending;
    this.pending = null;
    this.phase = "ready";
    if (!ok) {
      this.failed = true;
      this.queued = null;
      this.closeAfterSave = false;
      return [
        { type: "post", message: { action: "spinner", show: false } },
        { type: "post", message: { action: "status", message: "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", modified: true } },
        { type: "error", message: error ?? "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F" }
      ];
    }
    this.savedXml = done.xml;
    this.failed = false;
    const effects = [
      { type: "post", message: { action: "spinner", show: false } },
      { type: "post", message: { action: "status", message: "Saved", modified: this.dirty } }
    ];
    if (this.queued) {
      const next = this.queued;
      this.queued = null;
      return [...effects, ...this.startExport(next.xml, next.exit || done.exit)];
    }
    if (done.exit || this.closeAfterSave) return [...effects, ...this.close()];
    return effects;
  }
  /** export を頼んだ世代の返事が、待つ時間を過ぎても来なかった */
  exportTimedOut(generation) {
    if (this.phase !== "exporting" || !this.pending || this.pending.generation !== generation) return [];
    return this.failExport("Draw.io \u304B\u3089 SVG \u304C\u8FD4\u3063\u3066\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u4FDD\u5B58\u3057\u3066\u304F\u3060\u3055\u3044");
  }
  /** 閉じた（親が Modal を閉じた） */
  dispose() {
    this.phase = "closed";
  }
  startExport(xml, exit) {
    this.generation += 1;
    this.pending = { xml, exit, generation: this.generation };
    this.phase = "exporting";
    return [
      // 保存した XML を指定して描く。描いている間の編集を混ぜない。
      // スピナーは spinKey で Draw.io が出す。先に spinner を送ると、Draw.io は「スピナーが出ている」として export をしない（#98）
      { type: "post", message: { action: "export", format: "xmlsvg", xml, spinKey: "saving" } },
      { type: "wait", generation: this.generation, ms: EXPORT_TIMEOUT_MS }
    ];
  }
  onExport(msg) {
    if (this.phase !== "exporting" || !this.pending || msg.format !== "xmlsvg") {
      return [{ type: "error", message: "\u983C\u3093\u3067\u3044\u306A\u3044\u66F8\u304D\u51FA\u3057\u306E\u7D50\u679C\u304C\u5C4A\u3044\u305F\u306E\u3067\u7121\u8996\u3057\u307E\u3057\u305F" }];
    }
    const pending = this.pending;
    try {
      const svg = verifyExportedSvg(msg.data, pending.xml);
      this.phase = "writing";
      return [{ type: "write", svg, xml: pending.xml, generation: pending.generation }];
    } catch (e) {
      const message = e instanceof DrawioFormatError ? e.message : String(e);
      return this.failExport(`Draw.io \u304B\u3089\u53D7\u3051\u53D6\u3063\u305F SVG \u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093: ${message}`);
    }
  }
  /** export の段階で保存をやめ、編集画面に戻す */
  failExport(message) {
    this.pending = null;
    this.queued = null;
    this.closeAfterSave = false;
    this.failed = true;
    this.phase = "ready";
    return [
      { type: "post", message: { action: "spinner", show: false } },
      { type: "post", message: { action: "status", message: "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", modified: true } },
      { type: "error", message }
    ];
  }
  close() {
    this.phase = "closed";
    return [{ type: "close" }];
  }
};
function verifyExportedSvg(data, savedXml) {
  const decoded = decodeDataUri(data);
  if (!decoded || decoded.mime !== SVG_MIME) throw new DrawioFormatError("SVG \u306E data URI \u3067\u306F\u306A\u3044");
  if (decoded.bytes.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG \u304C\u5927\u304D\u3059\u304E\u308B\uFF0810 MiB \u307E\u3067\uFF09");
  const svg = utf8(decoded.bytes);
  if (svg === null) throw new DrawioFormatError("UTF-8 \u3068\u3057\u3066\u8AAD\u3081\u306A\u3044");
  const embedded = extractDiagramXml(svg);
  if (embedded.kind !== "diagram") throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u304C\u5165\u3063\u3066\u3044\u306A\u3044");
  const saved = savedXml.trim();
  if (saved.startsWith("<") && countPages(embedded.xml) !== countPages(saved)) {
    throw new DrawioFormatError(`\u30DA\u30FC\u30B8\u306E\u6570\u304C\u5408\u308F\u306A\u3044\uFF08\u4FDD\u5B58 ${countPages(saved)}\u3001SVG ${countPages(embedded.xml)}\uFF09`);
  }
  return svg;
}

// src/obsidian/frame.ts
var EDITOR_SANDBOX = "allow-scripts allow-same-origin allow-forms";
function mountEditorFrame(container, onMessage) {
  const doc = container.ownerDocument;
  const win = doc.defaultView ?? window;
  const iframe = doc.createElement("iframe");
  iframe.className = "vt-drawio-frame";
  iframe.setAttribute("sandbox", EDITOR_SANDBOX);
  iframe.setAttribute("referrerpolicy", "no-referrer");
  iframe.setAttribute("allow", "clipboard-read; clipboard-write");
  iframe.setAttribute("title", "Draw.io");
  const listener = (e) => {
    if (e.origin !== EMBED_ORIGIN || e.source !== iframe.contentWindow) return;
    const msg = parseMessage(e.data);
    if (msg) onMessage(msg);
  };
  win.addEventListener("message", listener);
  iframe.setAttribute("src", embedUrl());
  container.appendChild(iframe);
  return {
    iframe,
    post(message) {
      iframe.contentWindow?.postMessage(JSON.stringify(message), EMBED_ORIGIN);
    },
    destroy() {
      win.removeEventListener("message", listener);
      iframe.remove();
    }
  };
}

// src/obsidian/editor-modal.ts
var ConflictError = class extends Error {
};
var DrawioEditorModal = class extends import_obsidian3.Modal {
  constructor(app, target) {
    super(app);
    this.target = target;
    const title = target.kind === "existing" ? target.file.basename.replace(/\.drawio$/i, "") : (target.path.split("/").pop() ?? "").replace(/\.drawio\.svg$/i, "");
    this.title = title;
    this.session = new EditSession(target.kind === "existing" ? target.xml : null, title);
  }
  target;
  session;
  title;
  frame = null;
  forced = false;
  confirming = false;
  exportTimer;
  onOpen() {
    this.modalEl.addClass("vt-drawio-modal");
    this.contentEl.addClass("vt-drawio-modal-content");
    this.setTitle(`Draw.io: ${this.title}`);
    this.frame = mountEditorFrame(this.contentEl, (msg) => this.apply(this.session.handle(msg)));
  }
  onClose() {
    window.clearTimeout(this.exportTimer);
    this.session.dispose();
    this.frame?.destroy();
    this.frame = null;
    this.contentEl.empty();
  }
  /** Esc・× ボタン・外側を押したときも、ここを通る */
  close() {
    if (this.forced || !this.session.dirty) {
      super.close();
      return;
    }
    if (this.confirming) return;
    this.confirming = true;
    void choose(this.app, "\u4FDD\u5B58\u3057\u3066\u3044\u306A\u3044\u5909\u66F4\u304C\u3042\u308A\u307E\u3059", "Draw.io \u3067\u4FDD\u5B58\u3057\u3066\u304B\u3089\u9589\u3058\u308B\u304B\u3001\u5909\u66F4\u3092\u6368\u3066\u3066\u9589\u3058\u308B\u304B\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002", [
      { label: "Back to editing", value: "back", style: "cta" },
      { label: "Copy XML and close", value: "copy" },
      { label: "Discard and close", value: "discard", style: "warning" }
    ]).then(async (choice) => {
      this.confirming = false;
      if (choice === "copy") {
        const xml = this.session.unsavedXml;
        if (xml) {
          try {
            await navigator.clipboard.writeText(xml);
            new import_obsidian3.Notice("\u4FDD\u5B58\u3057\u3066\u3044\u306A\u3044\u56F3\u306E XML \u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F");
          } catch {
            new import_obsidian3.Notice("XML \u3092\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u9589\u3058\u305A\u306B\u6B8B\u3057\u307E\u3059");
            return;
          }
        }
      }
      if (choice === "copy" || choice === "discard") this.forceClose();
    });
  }
  forceClose() {
    this.forced = true;
    this.close();
  }
  apply(effects) {
    for (const effect of effects) {
      switch (effect.type) {
        case "post":
          this.frame?.post(effect.message);
          break;
        case "write":
          void this.write(effect.svg).then(
            () => this.apply(this.session.writeDone(effect.generation, true)),
            (e) => this.apply(this.session.writeDone(effect.generation, false, e instanceof Error ? e.message : String(e)))
          );
          break;
        case "wait":
          window.clearTimeout(this.exportTimer);
          this.exportTimer = window.setTimeout(() => this.apply(this.session.exportTimedOut(effect.generation)), effect.ms);
          break;
        case "close":
          this.forceClose();
          break;
        case "error":
          new import_obsidian3.Notice(`pkm-diagram: ${effect.message}`, 8e3);
          break;
      }
    }
  }
  /** SVG 全体を書く。失敗したら投げる（編集画面は残る） */
  async write(svg) {
    const target = this.target;
    if (target.kind === "new") {
      const vault = this.app.vault;
      const folder = target.path.includes("/") ? target.path.slice(0, target.path.lastIndexOf("/")) : "";
      if (folder && !vault.getAbstractFileByPath(folder)) await vault.createFolder(folder);
      const stem = (target.path.split("/").pop() ?? "").slice(0, -DRAWIO_SVG_SUFFIX.length);
      const path = vault.getAbstractFileByPath(target.path) ? freePath(folder, stem, DRAWIO_SVG_SUFFIX, (p) => vault.getAbstractFileByPath(p) !== null) : target.path;
      const file = await vault.create(path, svg);
      this.target = { kind: "existing", file, base: svg, xml: "" };
      new import_obsidian3.Notice(`${file.path} \u3092\u4F5C\u308A\u307E\u3057\u305F`);
      target.onCreated?.(file);
      return;
    }
    try {
      await this.app.vault.process(target.file, (current) => {
        if (current !== target.base) throw new ConflictError();
        return svg;
      });
      target.base = svg;
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
      await this.resolveConflict(target, svg);
    }
  }
  /** 編集中にファイルが変わっていた（同期・別の画面・外のエディタ） */
  async resolveConflict(target, svg) {
    const choice = await choose(this.app, "\u56F3\u306E\u30D5\u30A1\u30A4\u30EB\u304C\u7DE8\u96C6\u4E2D\u306B\u5909\u308F\u308A\u307E\u3057\u305F", `${target.file.path} \u306F\u3001\u7DE8\u96C6\u3092\u59CB\u3081\u3066\u304B\u3089\u5225\u306E\u5834\u6240\u3067\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u3059\uFF08\u540C\u671F\u306A\u3069\uFF09\u3002\u3069\u3046\u3057\u307E\u3059\u304B\u3002`, [
      { label: "Save mine as a copy", value: "copy", style: "cta" },
      { label: "Overwrite", value: "overwrite", style: "warning" },
      { label: "Back to editing (don't save)", value: "back" }
    ]);
    if (choice === "copy") {
      const vault = this.app.vault;
      const path = editedCopyPath(target.file.path, /* @__PURE__ */ new Date(), (p) => vault.getAbstractFileByPath(p) !== null);
      const file = await vault.create(path, svg);
      this.target = { kind: "existing", file, base: svg, xml: "" };
      new import_obsidian3.Notice(`${file.path} \u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F\u3002\u4EE5\u964D\u306E\u4FDD\u5B58\u3082\u3053\u306E\u30D5\u30A1\u30A4\u30EB\u306B\u66F8\u304D\u307E\u3059`, 8e3);
      return;
    }
    if (choice === "overwrite") {
      await this.app.vault.modify(target.file, svg);
      target.base = svg;
      return;
    }
    throw new Error("\u4FDD\u5B58\u3057\u307E\u305B\u3093\u3067\u3057\u305F\uFF08\u30D5\u30A1\u30A4\u30EB\u304C\u7DE8\u96C6\u4E2D\u306B\u5909\u308F\u3063\u305F\u305F\u3081\uFF09");
  }
};

// src/obsidian/export.ts
var import_obsidian4 = require("obsidian");
async function exportToTmp(app, file) {
  const kind = documentKind(file.path);
  if (!kind) {
    new import_obsidian4.Notice("\u66F8\u304D\u51FA\u305B\u308B\u306E\u306F md \u3068 html \u3060\u3051\u3067\u3059");
    return null;
  }
  const vault = app.vault;
  const text = await vault.read(file);
  const result = await embedDiagrams(text, {
    sourcePath: file.path,
    kind,
    readText: async (path) => {
      const f = vault.getAbstractFileByPath(path);
      return f instanceof import_obsidian4.TFile ? await vault.read(f) : null;
    }
  });
  if (result.errors.length > 0) {
    console.warn("pkm-diagram: \u66F8\u304D\u51FA\u305B\u307E\u305B\u3093\u3067\u3057\u305F", result.errors);
    new import_obsidian4.Notice(`\u66F8\u304D\u51FA\u305B\u307E\u305B\u3093\u3067\u3057\u305F\uFF08\u4F55\u3082\u66F8\u3044\u3066\u3044\u307E\u305B\u3093\uFF09:
${result.errors.join("\n")}`, 12e3);
    return null;
  }
  if (!vault.getAbstractFileByPath(TMP_FOLDER)) await vault.createFolder(TMP_FOLDER);
  const out = exportPath(file.path, (p) => vault.getAbstractFileByPath(p) !== null);
  const created = await vault.create(out, result.text);
  const problems = checkExported(result.text, kind, out);
  const lines = [`${out} \u306B\u66F8\u304D\u51FA\u3057\u307E\u3057\u305F\uFF08\u56F3 ${result.diagrams.length} \u4EF6\uFF09`, ...result.warnings, ...problems];
  new import_obsidian4.Notice(lines.join("\n"), result.warnings.length + problems.length > 0 ? 12e3 : 5e3);
  return created;
}

// src/obsidian/mermaid.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "fill-opacity", "stroke-opacity", "opacity", "font-family", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline", "visibility"];
var COLOR_PROPS = /* @__PURE__ */ new Set(["fill", "stroke"]);
function findMermaidSvg(el) {
  const box = el?.closest(".mermaid");
  return box?.querySelector("svg") ?? null;
}
function viewBoxSize(svg) {
  const vb = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) return { width: vb[2], height: vb[3] };
  const r = svg.getBoundingClientRect();
  return { width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) };
}
function textFromForeignObject(fo, win, mapColor) {
  const doc = fo.ownerDocument;
  const x = Number(fo.getAttribute("x") ?? 0) || 0;
  const y = Number(fo.getAttribute("y") ?? 0) || 0;
  const w = Number(fo.getAttribute("width") ?? 0) || 0;
  const h = Number(fo.getAttribute("height") ?? 0) || 0;
  const inner = fo.querySelector("span, p, div") ?? fo;
  const style = win.getComputedStyle(inner);
  const lines = (inner.innerText ?? inner.textContent ?? "").split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const out = [];
  const bgEl = fo.querySelector(".labelBkg, .edgeLabel, span") ?? inner;
  const bg = cssColorToHex(win.getComputedStyle(bgEl).backgroundColor);
  if (bg && w > 0 && h > 0 && lines.length > 0) {
    const rect = doc.createElementNS(SVG_NS, "rect");
    for (const [k, v] of Object.entries({ x, y, width: w, height: h })) rect.setAttribute(k, String(v));
    rect.setAttribute("fill", mapColor(bg));
    out.push(rect);
  }
  if (lines.length === 0) return out;
  const size = Number.parseFloat(style.fontSize) || 14;
  const lineHeight = size * 1.25;
  const text = doc.createElementNS(SVG_NS, "text");
  text.setAttribute("x", String(x + w / 2));
  text.setAttribute("y", String(y + h / 2 - (lines.length - 1) * lineHeight / 2));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("font-size", String(size));
  text.setAttribute("font-family", style.fontFamily);
  if (style.fontWeight && style.fontWeight !== "400" && style.fontWeight !== "normal") text.setAttribute("font-weight", style.fontWeight);
  const color = cssColorToHex(style.color);
  if (color) text.setAttribute("fill", mapColor(color));
  lines.forEach((line, i) => {
    const t = doc.createElementNS(SVG_NS, "tspan");
    t.setAttribute("x", String(x + w / 2));
    if (i > 0) t.setAttribute("dy", String(lineHeight));
    t.textContent = line;
    text.appendChild(t);
  });
  out.push(text);
  return out;
}
function mermaidSvgText(svg, light) {
  const win = svg.ownerDocument.defaultView ?? window;
  const toLight = light && svg.ownerDocument.body.classList.contains("theme-dark") ? darkToLightColors() : null;
  const mapColor = (hex) => toLight?.get(hex) ?? hex;
  const clone = svg.cloneNode(true);
  const originals = [svg, ...svg.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  const replace = [];
  originals.forEach((orig, i) => {
    const copy = copies[i];
    if (!copy || copy.namespaceURI !== SVG_NS) return;
    if (orig.localName === "foreignObject") {
      replace.push([copy, textFromForeignObject(orig, win, mapColor)]);
      return;
    }
    if (orig.closest("foreignObject")) return;
    const cs = win.getComputedStyle(orig);
    const decls = [];
    for (const p of PROPS) {
      let v = cs.getPropertyValue(p);
      if (!v) continue;
      if (COLOR_PROPS.has(p)) {
        const hex = cssColorToHex(v);
        if (hex) v = mapColor(hex);
        else if (!/^(none|url\()/.test(v)) continue;
      }
      decls.push(`${p}:${v}`);
    }
    if (decls.length > 0) copy.setAttribute("style", decls.join(";"));
  });
  for (const [fo, items] of replace) {
    for (const item of items) fo.parentNode?.insertBefore(item, fo);
    fo.remove();
  }
  for (const s of [...clone.querySelectorAll("style")]) s.remove();
  const size = viewBoxSize(svg);
  clone.setAttribute("width", String(size.width));
  clone.setAttribute("height", String(size.height));
  clone.removeAttribute("id");
  clone.setAttribute("xmlns", SVG_NS);
  return new XMLSerializer().serializeToString(clone);
}

// src/obsidian/save.ts
var import_obsidian5 = require("obsidian");
var TMP = "tmp";
function isAbort(e) {
  return e instanceof Error && e.name === "AbortError";
}
async function freeTmpPath(app, name) {
  const stem = name.replace(/\.png$/i, "");
  for (let n = 1; ; n++) {
    const path = (0, import_obsidian5.normalizePath)(`${TMP}/${n === 1 ? stem : `${stem} ${n}`}.png`);
    if (!await app.vault.adapter.exists(path)) return path;
  }
}
async function saveToTmp(app, png, name) {
  if (!await app.vault.adapter.exists(TMP)) await app.vault.adapter.mkdir(TMP);
  const path = await freeTmpPath(app, name);
  await app.vault.adapter.writeBinary(path, await png.arrayBuffer());
  new import_obsidian5.Notice(`PNG \u3092 ${path} \u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F`);
}
async function savePng(app, png, name, doc) {
  const win = doc.defaultView ?? window;
  const nav = (doc.defaultView ?? window).navigator;
  const methods = saveMethods({
    picker: typeof win.showSaveFilePicker === "function",
    share: typeof nav.share === "function" && typeof nav.canShare === "function"
  });
  try {
    for (const method of methods) {
      if (method === "picker") {
        let handle;
        try {
          handle = await win.showSaveFilePicker({
            suggestedName: name,
            types: [{ description: "PNG", accept: { "image/png": [".png"] } }]
          });
        } catch (e) {
          if (isAbort(e)) return;
          continue;
        }
        const writable = await handle.createWritable();
        await writable.write(await png);
        await writable.close();
        new import_obsidian5.Notice("PNG \u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
        return;
      }
      if (method === "share") {
        const file = new File([await png], name, { type: "image/png" });
        if (!nav.canShare({ files: [file] })) continue;
        try {
          await nav.share({ files: [file], title: name });
          return;
        } catch (e) {
          if (isAbort(e)) return;
          continue;
        }
      }
      await saveToTmp(app, await png, name);
      return;
    }
  } catch (e) {
    new import_obsidian5.Notice(`PNG \u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${e instanceof Error ? e.message : String(e)}`, 8e3);
  }
}

// src/obsidian/toolbar.ts
var import_obsidian6 = require("obsidian");
var HIDE_DELAY = 300;
var INSET = 8;
function asElement(el) {
  return el && typeof el.closest === "function" ? el : null;
}
var DocToolbar = class {
  constructor(doc, host) {
    this.doc = doc;
    this.host = host;
    this.el = doc.body.createDiv({ cls: "vt-drawio-toolbar", attr: { role: "toolbar", "aria-label": "Diagram actions" } });
    this.el.hidden = true;
    const button = (icon, label, onClick) => {
      const b = this.el.createEl("button", { cls: "vt-drawio-tool", attr: { type: "button", "aria-label": label, title: label } });
      (0, import_obsidian6.setIcon)(b, icon);
      b.createSpan({ cls: "vt-drawio-tool-label", text: label });
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.current) onClick(this.current.target, b);
      });
      return b;
    };
    button("copy", "Copy", (target, anchor) => this.host.copy(target, anchor));
    button("download", "Save PNG", (target) => this.host.save(target));
    button("maximize-2", "Expand", (target) => {
      this.hide();
      this.host.expand(target);
    });
    this.editButton = button("pencil", "Edit", (target) => {
      if (target.kind !== "file") return;
      this.hide();
      this.host.edit(target.file);
    });
    this.el.addEventListener("pointerenter", () => this.cancelHide());
    this.el.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse" && !this.pinned) this.scheduleHide();
    });
    this.el.addEventListener("focusout", (e) => {
      if (!this.el.contains(e.relatedTarget)) this.scheduleHide();
    });
  }
  doc;
  host;
  el;
  current = null;
  editButton;
  hideTimer = null;
  pinned = false;
  show(found, pinned) {
    this.cancelHide();
    this.current = found;
    this.pinned = pinned;
    this.editButton.hidden = !(found.target.kind === "file" && found.target.drawio);
    this.el.hidden = false;
    this.place();
  }
  hide() {
    this.cancelHide();
    this.current = null;
    this.pinned = false;
    this.el.hidden = true;
  }
  scheduleHide() {
    this.cancelHide();
    this.hideTimer = this.doc.defaultView?.setTimeout(() => this.hide(), HIDE_DELAY) ?? null;
  }
  cancelHide() {
    if (this.hideTimer !== null) this.doc.defaultView?.clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }
  /** 画像の右上の内側に置く。画像が小さければ画像の上に出す */
  place() {
    if (!this.current) return;
    const rect = this.current.el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }
    const bar = this.el.getBoundingClientRect();
    const top = rect.height >= bar.height + 2 * INSET ? rect.top + INSET : rect.top - bar.height - INSET / 2;
    const left = Math.max(INSET, rect.right - bar.width - INSET);
    this.el.style.top = `${Math.max(INSET, Math.round(top))}px`;
    this.el.style.left = `${Math.round(left)}px`;
  }
  onPointerOver(e) {
    if (e.pointerType !== "mouse" || this.pinned) return;
    const target = e.target;
    if (this.el.contains(target)) {
      this.cancelHide();
      return;
    }
    const el = asElement(target);
    const found = el ? this.host.resolve(el) : null;
    if (found) {
      if (this.current?.el === found.el) {
        this.cancelHide();
        return;
      }
      this.show(found, false);
      return;
    }
    if (this.current) this.scheduleHide();
  }
  onPointerDown(e) {
    const target = e.target;
    if (this.el.contains(target)) return;
    const el = asElement(target);
    if (e.pointerType !== "mouse" && el) {
      const found = this.host.resolve(el);
      if (found) {
        this.show(found, true);
        return;
      }
    }
    if (this.pinned || this.current) this.hide();
  }
  onScroll() {
    if (this.current) this.hide();
  }
  destroy() {
    this.cancelHide();
    this.el.remove();
  }
};
var DiagramToolbar = class {
  constructor(host) {
    this.host = host;
  }
  host;
  bars = /* @__PURE__ */ new Map();
  /** 文書（本体とポップアウトのウィンドウ）ごとに 1 つ。イベントは register に渡す（プラグインの終了で外れる） */
  attach(doc, register) {
    if (this.bars.has(doc)) return;
    const bar = new DocToolbar(doc, this.host);
    this.bars.set(doc, bar);
    register(doc, "pointerover", (e) => bar.onPointerOver(e));
    register(doc, "pointerdown", (e) => bar.onPointerDown(e), true);
    register(doc, "scroll", () => bar.onScroll(), true);
    register(doc, "keydown", (e) => {
      if (e.key === "Escape") bar.hide();
    });
  }
  detach(doc) {
    this.bars.get(doc)?.destroy();
    this.bars.delete(doc);
  }
  hideAll() {
    for (const bar of this.bars.values()) bar.hide();
  }
  destroy() {
    for (const bar of this.bars.values()) bar.destroy();
    this.bars.clear();
  }
};

// src/obsidian/zoom-modal.ts
var import_obsidian7 = require("obsidian");

// src/core/viewport.ts
var MIN_SCALE = 0.05;
var MAX_SCALE = 8;
var FIT_MAX_SCALE = 2;
var FIT_PADDING = 16;
var ZOOM_STEP = 1.25;
function clampScale(scale) {
  if (!Number.isFinite(scale) || scale <= 0) return MIN_SCALE;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
function centered(content, stage, scale) {
  return { scale, x: (stage.width - content.width * scale) / 2, y: (stage.height - content.height * scale) / 2 };
}
function fit(content, stage, padding = FIT_PADDING) {
  if (content.width <= 0 || content.height <= 0) return { scale: 1, x: 0, y: 0 };
  const w = Math.max(1, stage.width - 2 * padding);
  const h = Math.max(1, stage.height - 2 * padding);
  return centered(content, stage, clampScale(Math.min(w / content.width, h / content.height, FIT_MAX_SCALE)));
}
function actualSize(content, stage, padding = FIT_PADDING) {
  const v = centered(content, stage, 1);
  return { scale: 1, x: content.width > stage.width ? padding : v.x, y: content.height > stage.height ? padding : v.y };
}
function zoomAt(view, factor, at) {
  const scale = clampScale(view.scale * factor);
  const k = scale / view.scale;
  return { scale, x: at.x - (at.x - view.x) * k, y: at.y - (at.y - view.y) * k };
}
function pan(view, dx, dy) {
  return { scale: view.scale, x: view.x + dx, y: view.y + dy };
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function middle(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function pinch(start, a0, b0, a, b) {
  const d0 = distance(a0, b0);
  if (d0 === 0) return start;
  const m0 = middle(a0, b0);
  const m = middle(a, b);
  const zoomed = zoomAt(start, distance(a, b) / d0, m0);
  return pan(zoomed, m.x - m0.x, m.y - m0.y);
}
function wheelFactor(deltaY, deltaMode = 0) {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  return Math.exp(-Math.max(-200, Math.min(200, px)) * 2e-3);
}

// src/obsidian/zoom-modal.ts
var FALLBACK = { width: 800, height: 600 };
var DiagramZoomModal = class extends import_obsidian7.Modal {
  constructor(app, source) {
    super(app);
    this.source = source;
  }
  source;
  view = { scale: 1, x: 0, y: 0 };
  content = FALLBACK;
  img = null;
  stage = null;
  percent = null;
  /** 画面に触れている指（pointerId → 位置） */
  pointers = /* @__PURE__ */ new Map();
  gesture = null;
  resizeObserver = null;
  onOpen() {
    this.modalEl.addClass("vt-diagram-zoom");
    this.titleEl.setText(this.source.title);
    const bar = this.contentEl.createDiv({ cls: "vt-diagram-zoom-bar", attr: { role: "toolbar", "aria-label": "Zoom" } });
    const button = (icon, label, onClick) => {
      const b = bar.createEl("button", { cls: "vt-diagram-zoom-button", attr: { type: "button", "aria-label": label, title: label } });
      (0, import_obsidian7.setIcon)(b, icon);
      b.addEventListener("click", onClick);
    };
    button("zoom-out", "Zoom out", () => this.zoomBy(1 / ZOOM_STEP));
    this.percent = bar.createSpan({ cls: "vt-diagram-zoom-percent", attr: { "aria-live": "polite" } });
    button("zoom-in", "Zoom in", () => this.zoomBy(ZOOM_STEP));
    button("maximize", "Fit", () => this.fit());
    button("scan", "100%", () => this.actual());
    const stage = this.contentEl.createDiv({ cls: "vt-diagram-zoom-stage" });
    this.stage = stage;
    const img = stage.createEl("img", { cls: "vt-diagram-zoom-image", attr: { alt: this.source.title, draggable: "false" } });
    this.img = img;
    img.src = this.source.src;
    void img.decode().catch(() => void 0).then(() => {
      this.content = img.naturalWidth > 0 && img.naturalHeight > 0 ? { width: img.naturalWidth, height: img.naturalHeight } : FALLBACK;
      img.style.width = `${this.content.width}px`;
      img.style.height = `${this.content.height}px`;
      this.fit();
    });
    stage.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
    stage.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    stage.addEventListener("pointermove", (e) => this.onPointerMove(e));
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) stage.addEventListener(type, (e) => this.onPointerUp(e));
    stage.addEventListener("dblclick", (e) => this.apply(zoomAt(this.view, 2, this.local(e))));
    this.scope.register([], "0", () => (this.fit(), false));
    this.scope.register([], "1", () => (this.actual(), false));
    for (const key of ["+", "="]) this.scope.register([], key, () => (this.zoomBy(ZOOM_STEP), false));
    this.scope.register([], "-", () => (this.zoomBy(1 / ZOOM_STEP), false));
    const win = this.modalEl.ownerDocument.defaultView;
    if (win && "ResizeObserver" in win) {
      let first = true;
      this.resizeObserver = new win.ResizeObserver(() => {
        if (first) {
          first = false;
          return;
        }
        this.fit();
      });
      this.resizeObserver.observe(stage);
    }
  }
  onClose() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.pointers.clear();
    this.contentEl.empty();
  }
  stageSize() {
    const r = this.stage?.getBoundingClientRect();
    return { width: r?.width ?? 0, height: r?.height ?? 0 };
  }
  local(e) {
    const r = this.stage?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  }
  apply(view) {
    this.view = view;
    if (this.img) this.img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    if (this.percent) this.percent.setText(`${Math.round(view.scale * 100)}%`);
  }
  fit() {
    this.apply(fit(this.content, this.stageSize()));
  }
  actual() {
    this.apply(actualSize(this.content, this.stageSize()));
  }
  zoomBy(factor) {
    const s = this.stageSize();
    this.apply(zoomAt(this.view, factor, { x: s.width / 2, y: s.height / 2 }));
  }
  onWheel(e) {
    e.preventDefault();
    if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.apply(pan(this.view, -e.deltaX, -e.deltaY));
      return;
    }
    this.apply(zoomAt(this.view, wheelFactor(e.deltaY, e.deltaMode), this.local(e)));
  }
  onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this.stage?.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, this.local(e));
    this.stage?.addClass("is-dragging");
    this.startGesture();
  }
  /** 指の数が変わるたびに、そのときの表示と指の位置を起点にする */
  startGesture() {
    const [a, b] = [...this.pointers.values()];
    this.gesture = a ? { view: this.view, a, b: b ?? a } : null;
  }
  onPointerMove(e) {
    if (!this.pointers.has(e.pointerId) || !this.gesture) return;
    this.pointers.set(e.pointerId, this.local(e));
    const [a, b] = [...this.pointers.values()];
    if (!a) return;
    if (b) this.apply(pinch(this.gesture.view, this.gesture.a, this.gesture.b, a, b));
    else this.apply(pan(this.gesture.view, a.x - this.gesture.a.x, a.y - this.gesture.a.y));
  }
  onPointerUp(e) {
    if (!this.pointers.delete(e.pointerId)) return;
    if (this.pointers.size === 0) this.stage?.removeClass("is-dragging");
    this.startGesture();
  }
};

// src/main.ts
function resourceKey(url) {
  const cut = url.split(/[?#]/)[0] ?? "";
  try {
    return decodeURI(cut);
  } catch {
    return cut;
  }
}
var PkmDrawioPlugin = class extends import_obsidian8.Plugin {
  toolbar = null;
  /** getResourcePath() の値（? を除く）→ 図のファイル。ファイルが増減・改名したら作り直す */
  resources = null;
  async onload() {
    const toolbar = new DiagramToolbar({
      resolve: (el) => this.resolveDiagram(el),
      copy: (target, anchor) => this.showCopyMenu(target, anchor),
      save: (target) => this.save(target, activeDocument),
      expand: (target) => this.expand(target),
      edit: (file) => void this.edit(file)
    });
    this.toolbar = toolbar;
    const register = (doc, type, cb, capture = false) => this.registerDomEvent(doc, type, cb, { capture });
    toolbar.attach(document, register);
    this.registerEvent(this.app.workspace.on("window-open", (win) => toolbar.attach(win.doc, register)));
    this.registerEvent(this.app.workspace.on("window-close", (win) => toolbar.detach(win.doc)));
    this.registerEvent(this.app.workspace.on("layout-change", () => toolbar.hideAll()));
    for (const event of ["create", "delete", "rename"]) {
      this.registerEvent(this.app.vault.on(event, () => this.resources = null));
    }
    this.addCommand({ id: "create-diagram", name: "New diagram (asset/*.drawio.svg)", callback: () => void this.create() });
    this.addCommand({
      id: "edit-diagram",
      name: "Edit a diagram in this note",
      checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => void this.edit(file))
    });
    this.addCommand({
      id: "copy-diagram",
      name: "Copy a diagram in this note (PNG / SVG / XML)",
      checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => {
        void pick(this.app, "Copy as", copyFormatsFor(isDrawioSvgPath(file.path)), (f) => f.label).then((choice) => {
          if (choice) void this.copy(file, choice.format);
        });
      })
    });
    this.addCommand({
      id: "save-diagram-png",
      name: "Save a diagram in this note as PNG",
      checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => this.save(this.fileTarget(file), activeDocument))
    });
    this.addCommand({
      id: "expand-diagram",
      name: "Expand a diagram in this note",
      checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => this.expand(this.fileTarget(file)))
    });
    this.addCommand({
      id: "export-to-tmp",
      name: "Export this note to tmp/ (embed diagrams)",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !documentKind(file.path)) return false;
        if (!checking) void exportToTmp(this.app, file);
        return true;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof import_obsidian8.TFile)) return;
        if (isDiagramSvgPath(file.path)) {
          const drawio = isDrawioSvgPath(file.path);
          if (drawio) menu.addItem((i) => i.setTitle("Edit in Draw.io").setIcon("pencil").onClick(() => void this.edit(file)));
          for (const f of copyFormatsFor(drawio)) menu.addItem((i) => i.setTitle(f.label).setIcon(f.icon).onClick(() => void this.copy(file, f.format)));
          menu.addItem((i) => i.setTitle("Save as PNG").setIcon("download").onClick(() => this.save(this.fileTarget(file), activeDocument)));
        } else if (documentKind(file.path)) {
          menu.addItem((i) => i.setTitle("Export to tmp/ (embed diagrams)").setIcon("file-output").onClick(() => void exportToTmp(this.app, file)));
        }
      })
    );
  }
  onunload() {
    this.toolbar?.destroy();
    this.toolbar = null;
  }
  fileTarget(file) {
    return { kind: "file", file, drawio: isDrawioSvgPath(file.path) };
  }
  /** 要素が図なら、その図。画像は Vault の SVG の図を指すもの、それ以外は Mermaid の図の中の要素 */
  resolveDiagram(el) {
    if (el.tagName === "IMG") {
      const file = this.resolveImage(el);
      return file ? { el, target: this.fileTarget(file) } : null;
    }
    const svg = findMermaidSvg(el);
    return svg ? { el: svg, target: { kind: "mermaid", svg } } : null;
  }
  /** 図の SVG の文字列。light なら PNG 用（ライトの色。Draw.io の図は編集用 XML を除く） */
  async svgText(target, light) {
    if (target.kind === "mermaid") return mermaidSvgText(target.svg, light);
    const svg = await this.app.vault.cachedRead(target.file);
    return light ? toSharingSvg(svg) : svg;
  }
  diagramFileName(target) {
    if (target.kind === "file") return pngFileName(target.file.name);
    return pngFileName(`${this.app.workspace.getActiveFile()?.basename ?? "note"}-diagram`);
  }
  save(target, doc) {
    const png = this.svgText(target, true).then((svg) => renderPng(svg, doc));
    png.catch(() => void 0);
    void savePng(this.app, png, this.diagramFileName(target), doc);
  }
  expand(target) {
    try {
      const src = target.kind === "file" ? this.app.vault.getResourcePath(target.file) : svgDataUri(mermaidSvgText(target.svg, false));
      const title = target.kind === "file" ? target.file.basename.replace(/\.drawio$/i, "") : this.app.workspace.getActiveFile()?.basename ?? "Mermaid";
      new DiagramZoomModal(this.app, { src, title }).open();
    } catch (e) {
      new import_obsidian8.Notice(`\u56F3\u3092\u62E1\u5927\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${e instanceof Error ? e.message : String(e)}`, 8e3);
    }
  }
  /** 画像（Reading view・Live Preview・画像の View）が指す図のファイル */
  resolveImage(img) {
    const embedSrc = img.closest(".internal-embed, .image-embed")?.getAttribute("src");
    if (embedSrc) {
      const file = this.fileFromLink(embedSrc);
      if (file) return file;
    }
    const src = img.getAttribute("src") ?? "";
    if (/^(data|blob):/i.test(src)) return null;
    if (/^(app|capacitor|https?|file):/i.test(src)) return this.fileFromResource(src);
    return this.fileFromLink(src);
  }
  /** リンクの文字列（Vault ルートからのパス。なければ Obsidian のリンクの解決） */
  fileFromLink(link) {
    for (const path of candidatePaths("", link)) {
      const f = this.app.vault.getAbstractFileByPath(path);
      if (f instanceof import_obsidian8.TFile && isDiagramSvgPath(f.path)) return f;
    }
    const linkpath = resourceKey(link);
    const dest = this.app.metadataCache.getFirstLinkpathDest(linkpath, this.app.workspace.getActiveFile()?.path ?? "");
    return dest && isDiagramSvgPath(dest.path) ? dest : null;
  }
  fileFromResource(url) {
    if (!this.resources) {
      this.resources = /* @__PURE__ */ new Map();
      for (const f of this.app.vault.getFiles()) {
        if (isDiagramSvgPath(f.path)) this.resources.set(resourceKey(this.app.vault.getResourcePath(f)), f);
      }
    }
    return this.resources.get(resourceKey(url)) ?? null;
  }
  /** 開いているノートの中の図（重複なし）。ノートが図そのものなら、その図 */
  async diagramsInActive() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return [];
    if (isDiagramSvgPath(file.path)) return [file];
    const kind = documentKind(file.path);
    if (!kind) return [];
    const text = await this.app.vault.cachedRead(file);
    const found = /* @__PURE__ */ new Map();
    for (const ref of findImageReferences(text, kind)) {
      for (const path of drawioCandidates(file.path, ref, kind)) {
        const f = this.app.vault.getAbstractFileByPath(path);
        if (f instanceof import_obsidian8.TFile) {
          found.set(f.path, f);
          break;
        }
      }
    }
    return [...found.values()];
  }
  withDiagramsInActive(checking, run) {
    const active = this.app.workspace.getActiveFile();
    if (!active || !(isDiagramSvgPath(active.path) || documentKind(active.path))) return false;
    if (checking) return true;
    void this.diagramsInActive().then(async (files) => {
      if (files.length === 0) {
        new import_obsidian8.Notice("\u3053\u306E\u30CE\u30FC\u30C8\u306B\u56F3\uFF08asset/ \u306E SVG\uFF09\u304C\u3042\u308A\u307E\u305B\u3093\u3002Mermaid \u306E\u56F3\u306F\u3001\u56F3\u306E\u53F3\u4E0A\u306E\u64CD\u4F5C\u30D0\u30FC\u3092\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044");
        return;
      }
      const file = files.length === 1 ? files[0] : await pick(this.app, "Choose a diagram", files, (f) => f.path);
      if (file) run(file);
    });
    return true;
  }
  showCopyMenu(target, anchor) {
    const content = target.kind === "file" ? this.app.vault.cachedRead(target.file) : Promise.resolve(mermaidSvgText(target.svg, true));
    const menu = new import_obsidian8.Menu();
    for (const f of copyFormatsFor(target.kind === "file" && target.drawio)) {
      menu.addItem(
        (i) => i.setTitle(f.label).setIcon(f.icon).onClick(() => void content.then((svg) => copyDiagram(svg, f.format, anchor.ownerDocument)))
      );
    }
    const rect = anchor.getBoundingClientRect();
    menu.showAtPosition({ x: rect.left, y: rect.bottom }, anchor.ownerDocument);
  }
  async copy(file, format) {
    await copyDiagram(await this.app.vault.cachedRead(file), format, activeDocument);
  }
  async edit(file) {
    const svg = await this.app.vault.read(file);
    let xml;
    try {
      const r = extractDiagramXml(svg);
      if (r.kind !== "diagram") {
        new import_obsidian8.Notice(`${file.path} \u306B\u306F\u7DE8\u96C6\u7528 XML \u304C\u306A\u3044\u306E\u3067\u3001Draw.io \u306E\u56F3\u3068\u3057\u3066\u7DE8\u96C6\u3067\u304D\u307E\u305B\u3093\uFF08\u666E\u901A\u306E SVG\uFF09`, 8e3);
        return;
      }
      xml = r.xml;
    } catch (e) {
      new import_obsidian8.Notice(`${file.path} \u3092\u8AAD\u3081\u307E\u305B\u3093: ${e instanceof DrawioFormatError ? e.message : String(e)}`, 8e3);
      return;
    }
    new DrawioEditorModal(this.app, { kind: "existing", file, base: svg, xml }).open();
  }
  /** 新しい図を作る。開いていたノートのカーソルの位置に、図の参照を入れる */
  async create() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian8.MarkdownView);
    const notePath = view?.file?.path ?? null;
    const editor = view?.editor ?? null;
    const cursor = editor?.getCursor() ?? null;
    const name = await askDiagramName(this.app);
    if (name === null) return;
    const path = diagramPath(name);
    if (this.app.vault.getAbstractFileByPath(path)) {
      new import_obsidian8.Notice(`${path} \u306F\u65E2\u306B\u3042\u308A\u307E\u3059\u3002\u5225\u306E\u540D\u524D\u306B\u3059\u308B\u304B\u3001\u305D\u306E\u56F3\u3092\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044`);
      return;
    }
    new DrawioEditorModal(this.app, {
      kind: "new",
      path,
      onCreated: (file) => {
        const link = markdownImage(diagramName(file.path), file.path);
        if (view && editor && cursor && view.file?.path === notePath && view.editor === editor) {
          editor.replaceRange(link, cursor);
        } else {
          void navigator.clipboard.writeText(link).then(() => new import_obsidian8.Notice("\u56F3\u306E\u53C2\u7167\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\u3002\u30CE\u30FC\u30C8\u306B\u8CBC\u308A\u4ED8\u3051\u3066\u304F\u3060\u3055\u3044"));
        }
      }
    }).open();
  }
};
