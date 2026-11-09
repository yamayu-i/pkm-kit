// cli/diagram.ts
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

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
var MAX_SVG_BYTES = 10 * 1024 * 1024;
function isDiagramSvgPath(path) {
  const base = path.split("/").pop() ?? "";
  return base.toLowerCase().endsWith(".svg") && base.length > ".svg".length;
}
var SvgFormatError = class extends Error {
  name = "SvgFormatError";
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
      if (end < 0) throw new SvgFormatError("XML \u5BA3\u8A00\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      i = end + 2;
    } else if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i + 4);
      if (end < 0) throw new SvgFormatError("\u30B3\u30E1\u30F3\u30C8\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      i = end + 3;
    } else if (/^<!DOCTYPE\b/i.test(text.slice(i, i + 9))) {
      const end = text.indexOf(">", i);
      if (end < 0) throw new SvgFormatError("DOCTYPE \u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      if (text.slice(i, end).includes("[")) throw new SvgFormatError("DOCTYPE \u306B\u5B9F\u4F53\u306E\u5BA3\u8A00\u304C\u3042\u308B");
      i = end + 1;
    } else {
      break;
    }
  }
  if (!/^<svg[\s>/]/.test(text.slice(i, i + 5))) throw new SvgFormatError("SVG \u3067\u306F\u306A\u3044\uFF08\u30EB\u30FC\u30C8\u304C <svg> \u3067\u306F\u306A\u3044\uFF09");
  const start = i;
  i += 4;
  const attributes = [];
  for (; ; ) {
    const before = i;
    skipSpace();
    if (i >= text.length) throw new SvgFormatError("<svg> \u306E\u958B\u59CB\u30BF\u30B0\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
    if (text[i] === ">") return { start, end: i + 1, attributes };
    if (text.startsWith("/>", i)) return { start, end: i + 2, attributes };
    if (i === before) throw new SvgFormatError("<svg> \u306E\u5C5E\u6027\u306E\u9593\u306B\u7A7A\u767D\u304C\u306A\u3044");
    const nameMatch = /^[^\s=/>"']+/.exec(text.slice(i, i + 256));
    if (!nameMatch) throw new SvgFormatError("<svg> \u306E\u5C5E\u6027\u3092\u8AAD\u3081\u306A\u3044");
    const name = nameMatch[0];
    i += name.length;
    skipSpace();
    if (text[i] !== "=") throw new SvgFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306B\u5024\u304C\u306A\u3044`);
    i++;
    skipSpace();
    const quote = text[i];
    if (quote !== '"' && quote !== "'") throw new SvgFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306E\u5024\u304C\u5F15\u7528\u7B26\u3067\u56F2\u307E\u308C\u3066\u3044\u306A\u3044`);
    const close = text.indexOf(quote, i + 1);
    if (close < 0) throw new SvgFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306E\u5024\u304C\u9589\u3058\u3066\u3044\u306A\u3044`);
    const raw = text.slice(i + 1, close);
    if (raw.includes("<")) throw new SvgFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u306E\u5024\u306B < \u304C\u3042\u308B`);
    if (attributes.some((a) => a.name === name)) throw new SvgFormatError(`<svg> \u306E\u5C5E\u6027 ${name} \u304C\u91CD\u8907\u3057\u3066\u3044\u308B`);
    attributes.push({ name, raw, start: before, end: close + 1 });
    i = close + 1;
  }
}
function toSharingSvg(svg) {
  if (svg.length > MAX_SVG_BYTES) throw new SvgFormatError("SVG \u304C\u5927\u304D\u3059\u304E\u308B\uFF0810 MiB \u307E\u3067\uFF09");
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
function diagramCandidates(sourcePath, ref, kind) {
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
      const sharing = toSharingSvg(svg);
      const problems = findSvgProblems(sharing);
      for (const p of problems.errors) errors.push(`${path}: ${p}\u304C\u3042\u308B`);
      for (const p of problems.warnings) warnings.push(`${path}: ${p}\u304C\u3042\u308B\uFF08\u66F8\u304D\u51FA\u3057\u305F\u5148\u3067\u306F\u8868\u793A\u3055\u308C\u306A\u3044\uFF09`);
      if (problems.errors.length === 0) uri = svgDataUri(sharing);
    } catch (e) {
      errors.push(`${path}: ${e instanceof SvgFormatError ? e.message : String(e)}`);
    }
    uris.set(path, uri);
    return uri;
  };
  for (const ref of findImageReferences(text, options.kind)) {
    const candidates = diagramCandidates(options.sourcePath, ref, options.kind);
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
    if (diagramCandidates(sourcePath, ref, kind).length > 0) {
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

// ../design/generated/tokens.ts
var diagram = {
  light: { "neutral": { "text": "#2b2a28", "muted": "#57564f", "nodeFill": "#f6f5f2", "nodeStroke": "#7f7e76", "groupFill": "#efeeea", "groupStroke": "#7f7e76", "edge": "#57564f", "labelBg": "#f6f5f2" }, "colors": { "blue": { "fill": "#d3e3fd", "stroke": "#0b57d0", "text": "#041e49" }, "green": { "fill": "#c4eed0", "stroke": "#1e8e3e", "text": "#072711" }, "purple": { "fill": "#eaddff", "stroke": "#6750a4", "text": "#21005d" }, "gray": { "fill": "#e3e3e3", "stroke": "#747775", "text": "#1f1f1f" }, "sky": { "fill": "#c2e7ff", "stroke": "#00639b", "text": "#001d35" }, "pink": { "fill": "#ffd8e4", "stroke": "#c2185b", "text": "#3e001d" }, "red": { "fill": "#f9dedc", "stroke": "#d93025", "text": "#410e0b" }, "amber": { "fill": "#ffecb3", "stroke": "#b06d00", "text": "#3a2a00" } } },
  dark: { "neutral": { "text": "#d0d0d0", "muted": "#b3b3b3", "nodeFill": "#1e1e1e", "nodeStroke": "#7a7a7a", "groupFill": "#242424", "groupStroke": "#7a7a7a", "edge": "#b3b3b3", "labelBg": "#1e1e1e" }, "colors": { "blue": { "fill": "#0842a0", "stroke": "#a8c7fa", "text": "#d3e3fd" }, "green": { "fill": "#0f5223", "stroke": "#6dd58c", "text": "#c4eed0" }, "purple": { "fill": "#4f378b", "stroke": "#d0bcff", "text": "#eaddff" }, "gray": { "fill": "#444746", "stroke": "#c4c7c5", "text": "#e3e3e3" }, "sky": { "fill": "#004a77", "stroke": "#7fcfff", "text": "#c2e7ff" }, "pink": { "fill": "#8c1d4f", "stroke": "#ffb0c8", "text": "#ffd8e4" }, "red": { "fill": "#8c1d18", "stroke": "#f2b8b5", "text": "#f9dedc" }, "amber": { "fill": "#5c4300", "stroke": "#ffd54f", "text": "#ffecb3" } } }
};
var diagramColors = ["blue", "green", "purple", "gray", "sky", "pink", "red", "amber"];

// src/core/plain-svg.ts
var COLOR_NAMES = diagramColors;
var STYLE_ID = "pkm-diagram-style";
var DEFS_ID = "pkm-diagram-defs";
var DARK_ID = "pkm-diagram-dark";
var NOTE_WIDTH = 700;
var MIN_TEXT_PX = 9;
var TEXT_PX = { base: 13, label: 12, small: 11 };
var FONT = 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif';
var SHAPES = ["rect", "ellipse", "circle", "polygon", "path"];
function shapeSel(scope) {
  return SHAPES.map((s) => `${scope} > ${s}`).join(", ");
}
function rules(p) {
  const n = p.neutral;
  const out = [
    `text { font-family: ${FONT}; font-size: ${TEXT_PX.base}px; fill: ${n.text}; }`,
    `.center { text-anchor: middle; dominant-baseline: central; }`,
    `.title { font-weight: 600; }`,
    `.muted { fill: ${n.muted}; }`,
    `.small { font-size: ${TEXT_PX.small}px; }`,
    `${shapeSel(".node")} { fill: ${n.nodeFill}; stroke: ${n.nodeStroke}; stroke-width: 1.5; }`,
    `${shapeSel(".group")} { fill: ${n.groupFill}; stroke: ${n.groupStroke}; stroke-width: 1.5; }`,
    `.edge { fill: none; stroke: ${n.edge}; stroke-width: 1.5; marker-end: url(#pkm-arrow); }`,
    `.edge.both { marker-start: url(#pkm-arrow); }`,
    `.edge.plain { marker-start: none; marker-end: none; }`,
    `.dashed, .dashed > * { stroke-dasharray: 6 4; }`,
    `.label { font-size: ${TEXT_PX.label}px; fill: ${n.muted}; paint-order: stroke; stroke: ${n.labelBg}; stroke-width: 5px; stroke-linejoin: round; }`,
    `.pkm-arrowhead { fill: ${n.edge}; stroke: none; }`
  ];
  for (const name of COLOR_NAMES) {
    const c = p.colors[name];
    out.push(
      `${shapeSel(`.node.${name}`)} { fill: ${c.fill}; stroke: ${c.stroke}; }`,
      `.node.${name} text { fill: ${c.text}; }`,
      `${shapeSel(`.group.${name}`)} { fill: ${c.fill}; fill-opacity: 0.45; stroke: ${c.stroke}; }`,
      `.group.${name} > text { fill: ${c.text}; }`,
      `.edge.${name} { stroke: ${c.stroke}; marker-end: url(#pkm-arrow-${name}); }`,
      `.edge.both.${name} { marker-start: url(#pkm-arrow-${name}); }`,
      `.edge.plain.${name} { marker-start: none; marker-end: none; }`,
      `text.${name}, .label.${name} { fill: ${c.text}; }`,
      `#pkm-arrow-${name} .pkm-arrowhead { fill: ${c.stroke}; }`
    );
  }
  return out;
}
function diagramStyle() {
  const light = rules(diagram.light).join("\n");
  const dark = rules(diagram.dark).map((r) => `  ${r}`).join("\n");
  return `<style id="${STYLE_ID}">
${light}
@media (prefers-color-scheme: dark) {
${dark}
}
</style>`;
}
function marker(id) {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="pkm-arrowhead" d="M0,0 L10,5 L0,10 z"/></marker>`;
}
function diagramDefs() {
  return `<defs id="${DEFS_ID}">${[marker("pkm-arrow"), ...COLOR_NAMES.map((n) => marker(`pkm-arrow-${n}`))].join("")}</defs>`;
}
function rootOpenEnd(svg) {
  const m = /<svg\b[^>]*>/i.exec(svg);
  if (!m) throw new Error("\u30EB\u30FC\u30C8\u306E <svg> \u304C\u306A\u3044");
  return m.index + m[0].length;
}
function removeById(svg, tag, id) {
  return svg.replace(new RegExp(`\\s*<${tag}\\s+id="${id}"[^>]*>[\\s\\S]*?</${tag}>`, "g"), "");
}
function styleSvg(svg) {
  const clean = removeById(removeById(svg, "style", STYLE_ID), "defs", DEFS_ID);
  const at = rootOpenEnd(clean);
  return `${clean.slice(0, at)}
${diagramStyle()}
${diagramDefs()}${clean.slice(at)}`;
}
function darkenSvg(svg) {
  const clean = removeById(svg, "style", DARK_ID);
  const map2 = /* @__PURE__ */ new Map();
  const add = (prop, light, dark) => {
    if (light.toLowerCase() === dark.toLowerCase()) return;
    const key = `[${prop}="${light}" i]`;
    if (!map2.has(key)) map2.set(key, /* @__PURE__ */ new Set());
    map2.get(key)?.add(`${prop}: ${dark}`);
  };
  for (const name of COLOR_NAMES) {
    const l = diagram.light.colors[name];
    const d = diagram.dark.colors[name];
    add("fill", l.fill, d.fill);
    add("fill", l.text, d.text);
    add("stroke", l.stroke, d.stroke);
  }
  const body = [...map2].map(([sel, decls]) => `  ${sel} { ${[...decls][0]}; }`).join("\n");
  const style = `<style id="${DARK_ID}">
@media (prefers-color-scheme: dark) {
${body}
}
</style>`;
  const at = rootOpenEnd(clean);
  return `${clean.slice(0, at)}
${style}${clean.slice(at)}`;
}
var COLOR_PROPS = ["fill", "stroke", "color", "stop-color", "flood-color", "lighting-color"];
var ALLOWED_COLOR = /^(none|transparent|currentcolor|inherit|url\(#[\w.-]+\))$/i;
function rootWidth(svg) {
  const m = /<svg\b([^>]*)>/i.exec(svg);
  if (!m) return null;
  const attrs = m[1];
  const vb = /\bviewBox\s*=\s*["']([^"']*)["']/i.exec(attrs);
  if (vb) {
    const parts = vb[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && Number.isFinite(parts[2]) && parts[2] > 0) return parts[2];
  }
  const w = /\bwidth\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(attrs);
  return w ? Number(w[1]) : null;
}
function textSizes(body) {
  const sizes = [];
  let sawText = false;
  for (const m of body.matchAll(/<(text|tspan)\b([^>]*)>/gi)) {
    sawText = true;
    const attrs = m[2];
    const fs = /\bfont-size\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(attrs) ?? /font-size\s*:\s*([\d.]+)px/i.exec(attrs);
    if (fs) sizes.push(Number(fs[1]));
    else {
      const cls = /\bclass\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1]?.split(/\s+/) ?? [];
      if (cls.includes("small")) sizes.push(TEXT_PX.small);
      else if (cls.includes("label")) sizes.push(TEXT_PX.label);
      else if (m[1].toLowerCase() === "text") sizes.push(TEXT_PX.base);
    }
  }
  for (const m of body.matchAll(/font-size\s*:\s*([\d.]+)px/gi)) sizes.push(Number(m[1]));
  return sawText ? sizes : [];
}
function checkPlainSvg(svg, options = {}) {
  const noteWidth = options.noteWidth ?? NOTE_WIDTH;
  const minPx = options.minTextPx ?? MIN_TEXT_PX;
  const errors = /* @__PURE__ */ new Set();
  const warnings = /* @__PURE__ */ new Set();
  const base = findSvgProblems(svg);
  for (const e of base.errors) errors.add(e);
  for (const w of base.warnings) errors.add(w);
  if (/<foreignObject\b/i.test(svg)) errors.add("<foreignObject>\uFF08PNG \u306B\u3067\u304D\u306A\u3044\u3002\u6587\u5B57\u306F <text> \u3067\u66F8\u304F\uFF09");
  if (!/<svg\b/i.test(svg)) errors.add("\u30EB\u30FC\u30C8\u306E <svg> \u304C\u306A\u3044");
  const body = removeById(removeById(removeById(svg, "style", STYLE_ID), "defs", DEFS_ID), "style", DARK_ID);
  if (!options.allowColors) {
    if (/<style\b/i.test(body)) errors.add("\u72EC\u81EA\u306E <style>\uFF08\u30B9\u30BF\u30A4\u30EB\u306F svg-style \u304C\u5DEE\u3057\u8FBC\u3080\u3002\u30AF\u30E9\u30B9\u3060\u3051\u3092\u4F7F\u3046\uFF09");
    const bad = /* @__PURE__ */ new Set();
    for (const m of body.matchAll(new RegExp(`\\s(${COLOR_PROPS.join("|")})\\s*=\\s*["']([^"']*)["']`, "gi"))) {
      if (!ALLOWED_COLOR.test(m[2].trim())) bad.add(`${m[1]}="${m[2]}"`);
    }
    for (const m of body.matchAll(/\sstyle\s*=\s*["']([^"']*)["']/gi)) {
      for (const d of m[1].split(";")) {
        const [k, v] = d.split(":").map((s) => s.trim());
        if (k && v && COLOR_PROPS.includes(k.toLowerCase()) && !ALLOWED_COLOR.test(v)) bad.add(`style \u306E ${k}: ${v}`);
      }
    }
    if (bad.size > 0) errors.add(`\u8272\u306E\u5024\u3092\u76F4\u63A5\u66F8\u3044\u3066\u3044\u308B\uFF08\u30AF\u30E9\u30B9\u306E\u8272\u306E\u540D\u524D\u3092\u4F7F\u3046: ${COLOR_NAMES.join(" / ")}\uFF09: ${[...bad].slice(0, 5).join(", ")}${bad.size > 5 ? " \u307B\u304B" : ""}`);
  }
  const width = rootWidth(svg);
  if (width === null) errors.add("\u56F3\u306E\u5E45\u304C\u306A\u3044\uFF08\u30EB\u30FC\u30C8\u306E <svg> \u306B viewBox \u304B width \u3092\u66F8\u304F\uFF09");
  const sizes = textSizes(body);
  let minTextPx = null;
  if (width !== null && sizes.length > 0) {
    minTextPx = Math.min(...sizes) * Math.min(1, noteWidth / width);
    if (minTextPx < minPx) {
      warnings.add(
        `\u30CE\u30FC\u30C8\u306E\u5E45\uFF08${noteWidth}px\uFF09\u306B\u7E2E\u3081\u308B\u3068\u3001\u3044\u3061\u3070\u3093\u5C0F\u3055\u3044\u6587\u5B57\u304C ${minTextPx.toFixed(1)}px \u306B\u306A\u308B\uFF08${minPx}px \u672A\u6E80\uFF09\u3002\u56F3\u3092\u5206\u3051\u308B\u304B\u3001\u5411\u304D\u3092\u5909\u3048\u3066\u5E45\u3092 ${Math.floor(Math.min(...sizes) / minPx * noteWidth)}px \u4EE5\u4E0B\u306B\u3059\u308B`
      );
    }
  }
  return { errors: [...errors], warnings: [...warnings], minTextPx, width };
}

// src/core/d2.ts
function themeOverrides(p) {
  const n = p.neutral;
  return {
    N1: n.text,
    N2: n.muted,
    N3: n.muted,
    // N4〜N6 は、ひし形・六角形などの面に使われる
    N4: n.groupFill,
    N5: n.groupFill,
    N6: n.groupFill,
    N7: n.nodeFill,
    B1: n.nodeStroke,
    B2: n.edge,
    // B3 は人（person）の面
    B3: n.groupFill,
    B4: n.groupFill,
    B5: n.groupFill,
    B6: n.nodeFill,
    AA2: n.nodeStroke,
    AA4: n.groupFill,
    AA5: n.nodeFill,
    AB4: n.groupFill,
    AB5: n.nodeFill
  };
}
function map(entries) {
  return Object.entries(entries).map(([k, v]) => `${k}: "${v}"`).join("; ");
}
var D2_DARK_THEME_ID = 200;
function d2Preamble(layout = "elk") {
  const classes = COLOR_NAMES.map((name) => {
    const c = diagram.light.colors[name];
    return `  ${name}: { style: { fill: "${c.fill}"; stroke: "${c.stroke}"; font-color: "${c.text}" } }`;
  }).join("\n");
  return [
    "# pkm-diagram \u304C\u4ED8\u3051\u305F\u30C6\u30FC\u30DE\uFF08ADR-0102\uFF09",
    "vars: {",
    "  d2-config: {",
    `    layout-engine: ${layout}`,
    `    dark-theme-id: ${D2_DARK_THEME_ID}`,
    `    theme-overrides: { ${map(themeOverrides(diagram.light))} }`,
    `    dark-theme-overrides: { ${map(themeOverrides(diagram.dark))} }`,
    "  }",
    "}",
    "classes: {",
    classes,
    "}",
    ""
  ].join("\n");
}

// src/core/names.ts
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

// cli/diagram.ts
var USAGE = `\u4F7F\u3044\u65B9:
  diagram.mjs export <\u30CE\u30FC\u30C8.md|.html> [--output <\u30D1\u30B9>] [--vault <\u30EB\u30FC\u30C8>]
  diagram.mjs check <\u30D5\u30A1\u30A4\u30EB\u304B\u30D5\u30A9\u30EB\u30C0\u2026> [--vault <\u30EB\u30FC\u30C8>]
  diagram.mjs svg-style <\u56F3.svg> [--output <\u56F3.svg>]
  diagram.mjs svg-check <\u56F3.svg\u2026> [--allow-colors]
  diagram.mjs d2 <\u56F3.d2> [--output <\u56F3.svg>] [--layout elk|dagre] [--d2 <d2 \u30B3\u30DE\u30F3\u30C9>]`;
var FLAGS = /* @__PURE__ */ new Set(["allow-colors"]);
function parseArgs(args) {
  const positional = [];
  const options = /* @__PURE__ */ new Map();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--") && FLAGS.has(a.slice(2))) {
      options.set(a.slice(2), "true");
    } else if (a.startsWith("--")) {
      const value = args[i + 1];
      if (value === void 0 || value.startsWith("--")) throw new Error(`${a} \u306B\u5024\u304C\u306A\u3044`);
      options.set(a.slice(2), value);
      i++;
    } else {
      positional.push(a);
    }
  }
  return { positional, options };
}
function vaultPath(root, file) {
  const rel = relative(root, file);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
  return rel.split(sep).join("/");
}
function readInVault(root, path) {
  const full = join(root, ...path.split("/"));
  if (!existsSync(full) || !statSync(full).isFile()) return null;
  return readFileSync(full, "utf8");
}
function walk(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).sort().flatMap((name) => walk(join(path, name))).filter((p) => documentKind(p) !== null);
}
async function runExport(positional, options, io) {
  const [input] = positional;
  if (!input || positional.length > 1) {
    io.err(USAGE);
    return 2;
  }
  const root = resolve(io.cwd, options.get("vault") ?? ".");
  const inputFull = resolve(io.cwd, input);
  const source = vaultPath(root, inputFull);
  const kind = documentKind(inputFull);
  if (!source || !kind) {
    io.err(`${input}: Vault\uFF08${root}\uFF09\u306E\u4E2D\u306E md \u304B html \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044`);
    return 2;
  }
  const text = readFileSync(inputFull, "utf8");
  const result = await embedDiagrams(text, { sourcePath: source, kind, readText: async (p) => readInVault(root, p) });
  for (const w of result.warnings) io.err(`\u8B66\u544A: ${w}`);
  if (result.errors.length > 0) {
    for (const e of result.errors) io.err(`\u30A8\u30E9\u30FC: ${e}`);
    io.err("\u66F8\u304D\u51FA\u3057\u3066\u3044\u307E\u305B\u3093");
    return 1;
  }
  const output = options.has("output") ? resolve(io.cwd, options.get("output")) : join(root, ...exportPath(source, (p) => existsSync(join(root, ...p.split("/")))).split("/"));
  if (existsSync(output)) {
    io.err(`${output} \u306F\u65E2\u306B\u3042\u308A\u307E\u3059\uFF08\u4E0A\u66F8\u304D\u3057\u307E\u305B\u3093\uFF09`);
    return 1;
  }
  const problems = checkExported(result.text, kind, vaultPath(root, output) ?? source);
  if (problems.length > 0) {
    for (const p of problems) io.err(`\u30A8\u30E9\u30FC: ${p}`);
    io.err("\u66F8\u304D\u51FA\u3057\u3066\u3044\u307E\u305B\u3093");
    return 1;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, result.text);
  io.out(`${relative(io.cwd, output) || output}\uFF08\u56F3 ${result.diagrams.length} \u4EF6\uFF09`);
  return 0;
}
function runCheck(positional, options, io) {
  if (positional.length === 0) {
    io.err(USAGE);
    return 2;
  }
  const root = resolve(io.cwd, options.get("vault") ?? ".");
  let failed = 0;
  for (const target of positional) {
    const full = resolve(io.cwd, target);
    if (!existsSync(full)) {
      io.err(`${target}: \u306A\u3044`);
      failed++;
      continue;
    }
    for (const file of walk(full)) {
      const kind = documentKind(file);
      if (!kind) continue;
      const problems = checkExported(readFileSync(file, "utf8"), kind, vaultPath(root, file) ?? "");
      for (const p of problems) io.err(`${relative(io.cwd, file)}: ${p}`);
      if (problems.length > 0) failed++;
    }
  }
  if (failed > 0) return 1;
  io.out("\u554F\u984C\u306A\u3057");
  return 0;
}
function report(io, name, r) {
  for (const e of r.errors) io.err(`${name}: \u8AA4\u308A: ${e}`);
  for (const w of r.warnings) io.err(`${name}: \u8B66\u544A: ${w}`);
  return r.errors.length === 0;
}
function writeIfChanged(outFull, text, io, note) {
  const before = existsSync(outFull) ? readFileSync(outFull, "utf8") : null;
  const shown = relative(io.cwd, outFull) || outFull;
  if (before === text) {
    io.out(`${shown}\uFF08\u5909\u308F\u3089\u306A\u3044\uFF09`);
    return;
  }
  mkdirSync(dirname(outFull), { recursive: true });
  writeFileSync(outFull, text);
  io.out(`${shown}${note}`);
}
function runSvgStyle(positional, options, io) {
  const [input] = positional;
  if (!input || positional.length > 1 || !input.endsWith(".svg") || input.endsWith(".drawio.svg")) {
    io.err(`${USAGE}
\uFF08svg-style \u306F AI \u304C\u66F8\u3044\u305F .svg \u306B\u4F7F\u3046\u3002.drawio.svg \u306F\u4EE5\u524D\u306E Draw.io \u306E\u56F3\u3067\u3001\u76F4\u3059\u306A\u3089\u63CF\u304D\u76F4\u3059\uFF09`);
    return 2;
  }
  const inputFull = resolve(io.cwd, input);
  const styled = styleSvg(readFileSync(inputFull, "utf8"));
  const r = checkPlainSvg(styled);
  if (!report(io, input, r)) return 1;
  writeIfChanged(resolve(io.cwd, options.get("output") ?? input), styled, io, r.minTextPx === null ? "" : `\uFF08\u5E45 ${r.width}px\u3001\u30CE\u30FC\u30C8\u3067\u306E\u6700\u5C0F\u306E\u6587\u5B57 ${r.minTextPx.toFixed(1)}px\uFF09`);
  return 0;
}
function runSvgCheck(positional, options, io) {
  if (positional.length === 0) {
    io.err(USAGE);
    return 2;
  }
  let ok = true;
  for (const input of positional) {
    const r = checkPlainSvg(readFileSync(resolve(io.cwd, input), "utf8"), { allowColors: options.has("allow-colors") });
    if (report(io, input, r)) io.out(`${input}: OK${r.minTextPx === null ? "" : `\uFF08\u30CE\u30FC\u30C8\u3067\u306E\u6700\u5C0F\u306E\u6587\u5B57 ${r.minTextPx.toFixed(1)}px\uFF09`}`);
    else ok = false;
  }
  return ok ? 0 : 1;
}
var D2_INSTALL = "d2 \u30B3\u30DE\u30F3\u30C9\u304C\u898B\u3064\u304B\u3089\u306A\u3044\u3002\u5165\u308C\u65B9: go install oss.terrastruct.com/d2@v0.7.1\uFF08\u307E\u305F\u306F https://d2lang.com \u306E\u624B\u9806\uFF09\u3002\u5834\u6240\u306F --d2 \u304B\u74B0\u5883\u5909\u6570 D2_BIN \u3067\u6E21\u305B\u308B";
function runD2(positional, options, io) {
  const [input] = positional;
  if (!input || positional.length > 1 || !input.endsWith(".d2")) {
    io.err(USAGE);
    return 2;
  }
  const layout = options.get("layout") ?? "elk";
  if (layout !== "elk" && layout !== "dagre") {
    io.err("--layout \u306F elk \u304B dagre");
    return 2;
  }
  const output = options.get("output") ?? input.replace(/\.d2$/, ".svg");
  if (!output.endsWith(".svg") || output.endsWith(".drawio.svg")) {
    io.err("--output \u306F .svg\uFF08.drawio.svg \u306F\u4F7F\u308F\u306A\u3044\uFF09");
    return 2;
  }
  const bin = options.get("d2") ?? process.env.D2_BIN ?? "d2";
  const work = mkdtempSync(join(tmpdir(), "pkm-diagram-d2-"));
  try {
    const src = join(work, "diagram.d2");
    const out = join(work, "diagram.svg");
    writeFileSync(src, `${d2Preamble(layout)}
${readFileSync(resolve(io.cwd, input), "utf8")}`);
    const run = spawnSync(bin, ["--pad", "16", "--dark-theme", String(D2_DARK_THEME_ID), src, out], { encoding: "utf8" });
    if (run.error) {
      io.err(run.error.code === "ENOENT" ? D2_INSTALL : `d2 \u3092\u5B9F\u884C\u3067\u304D\u306A\u3044: ${run.error.message}`);
      return 1;
    }
    if (run.status !== 0 || !existsSync(out)) {
      io.err(`d2 \u304C\u5931\u6557\u3057\u305F\uFF08\u884C\u306E\u756A\u53F7\u306F\u3001\u524D\u306B\u4ED8\u3051\u305F\u30C6\u30FC\u30DE\u306E\u5206\u3060\u3051\u305A\u308C\u308B\uFF09:
${(run.stderr || run.stdout).trim()}`);
      return 1;
    }
    const svg = darkenSvg(readFileSync(out, "utf8"));
    const r = checkPlainSvg(svg, { allowColors: true });
    if (!report(io, output, r)) return 1;
    writeIfChanged(resolve(io.cwd, output), svg, io, r.minTextPx === null ? "" : `\uFF08\u5E45 ${r.width}px\u3001\u30CE\u30FC\u30C8\u3067\u306E\u6700\u5C0F\u306E\u6587\u5B57 ${r.minTextPx.toFixed(1)}px\uFF09`);
    return 0;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
async function main(argv, io) {
  const [command, ...rest] = argv;
  try {
    const { positional, options } = parseArgs(rest);
    switch (command) {
      case "export":
        return await runExport(positional, options, io);
      case "check":
        return runCheck(positional, options, io);
      case "svg-style":
        return runSvgStyle(positional, options, io);
      case "svg-check":
        return runSvgCheck(positional, options, io);
      case "d2":
        return runD2(positional, options, io);
      default:
        io.err(USAGE);
        return 2;
    }
  } catch (e) {
    io.err(`\u30A8\u30E9\u30FC: ${e instanceof SvgFormatError ? e.message : e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}
var invoked = process.argv[1] ?? "";
if (/diagram\.(mjs|ts)$/.test(invoked)) {
  process.exitCode = await main(process.argv.slice(2), {
    cwd: process.cwd(),
    out: (t) => process.stdout.write(`${t}
`),
    err: (t) => process.stderr.write(`${t}
`)
  });
}
export {
  main
};
