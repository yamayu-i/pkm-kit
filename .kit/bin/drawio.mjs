// cli/drawio.ts
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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
var DRAWIO_SVG_SUFFIX = ".drawio.svg";
var MAX_SVG_BYTES = 10 * 1024 * 1024;
var MAX_XML_CHARS = 20 * 1024 * 1024;
function isDrawioSvgPath(path) {
  return path.toLowerCase().endsWith(DRAWIO_SVG_SUFFIX) && path.length > DRAWIO_SVG_SUFFIX.length && !path.endsWith(`/${DRAWIO_SVG_SUFFIX}`);
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
  return candidates.filter(isDrawioSvgPath);
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
      if (extractDiagramXml(svg).kind === "plain-svg") warnings.push(`${path}: \u7DE8\u96C6\u7528 XML \u304C\u306A\u3044\uFF08\u666E\u901A\u306E SVG \u3068\u3057\u3066\u57CB\u3081\u8FBC\u3080\uFF09`);
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

// cli/drawio.ts
var USAGE = `\u4F7F\u3044\u65B9:
  drawio.mjs export <\u30CE\u30FC\u30C8.md|.html> [--output <\u30D1\u30B9>] [--vault <\u30EB\u30FC\u30C8>]
  drawio.mjs check <\u30D5\u30A1\u30A4\u30EB\u304B\u30D5\u30A9\u30EB\u30C0\u2026> [--vault <\u30EB\u30FC\u30C8>]
  drawio.mjs extract <\u56F3.drawio.svg>
  drawio.mjs strip <\u56F3.drawio.svg> [--output <\u30D1\u30B9>]`;
function parseArgs(args) {
  const positional = [];
  const options = /* @__PURE__ */ new Map();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
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
function runSvg(command, positional, options, io) {
  const [input] = positional;
  if (!input || positional.length > 1) {
    io.err(USAGE);
    return 2;
  }
  const svg = readFileSync(resolve(io.cwd, input), "utf8");
  if (command === "extract") {
    const r = extractDiagramXml(svg);
    if (r.kind !== "diagram") {
      io.err(`${input}: \u7DE8\u96C6\u7528 XML \u304C\u306A\u3044\uFF08\u666E\u901A\u306E SVG\uFF09`);
      return 1;
    }
    io.out(r.xml);
    return 0;
  }
  const sharing = toSharingSvg(svg);
  const output = options.get("output");
  if (output === void 0) {
    io.out(sharing);
    return 0;
  }
  const full = resolve(io.cwd, output);
  if (existsSync(full)) {
    io.err(`${output} \u306F\u65E2\u306B\u3042\u308A\u307E\u3059\uFF08\u4E0A\u66F8\u304D\u3057\u307E\u305B\u3093\uFF09`);
    return 1;
  }
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, sharing);
  return 0;
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
      case "extract":
      case "strip":
        return runSvg(command, positional, options, io);
      default:
        io.err(USAGE);
        return 2;
    }
  } catch (e) {
    io.err(`\u30A8\u30E9\u30FC: ${e instanceof DrawioFormatError ? e.message : e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}
var invoked = process.argv[1] ?? "";
if (/drawio\.(mjs|ts)$/.test(invoked)) {
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
