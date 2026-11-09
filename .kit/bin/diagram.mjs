// cli/diagram.ts
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

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

// src/core/xml.ts
var NAME = /^[A-Za-z_][\w:.-]*/;
function parseXml(xml) {
  if (/<!(DOCTYPE|ENTITY)/i.test(xml)) throw new DrawioFormatError("XML \u306B DOCTYPE\u30FB\u5B9F\u4F53\u306E\u5BA3\u8A00\u304C\u3042\u308B");
  let i = 0;
  const stack = [];
  let root = null;
  while (i < xml.length) {
    const lt = xml.indexOf("<", i);
    const textEnd = lt < 0 ? xml.length : lt;
    if (textEnd > i) {
      const text = xml.slice(i, textEnd);
      const top = stack[stack.length - 1];
      if (top) top.text += decodeXmlEntities(text);
      else if (text.trim() !== "") throw new DrawioFormatError("XML \u306E\u30EB\u30FC\u30C8\u306E\u5916\u306B\u6587\u5B57\u304C\u3042\u308B");
    }
    if (lt < 0) break;
    i = lt;
    if (xml.startsWith("<?", i)) {
      const end = xml.indexOf("?>", i);
      if (end < 0) throw new DrawioFormatError("XML \u5BA3\u8A00\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      i = end + 2;
      continue;
    }
    if (xml.startsWith("<!--", i)) {
      const end = xml.indexOf("-->", i);
      if (end < 0) throw new DrawioFormatError("\u30B3\u30E1\u30F3\u30C8\u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", i)) {
      const end = xml.indexOf("]]>", i);
      if (end < 0) throw new DrawioFormatError("CDATA \u304C\u9589\u3058\u3066\u3044\u306A\u3044");
      const top = stack[stack.length - 1];
      if (top) top.text += xml.slice(i + 9, end);
      i = end + 3;
      continue;
    }
    if (xml.startsWith("</", i)) {
      const m2 = NAME.exec(xml.slice(i + 2, i + 258));
      const close = xml.indexOf(">", i);
      const top = stack.pop();
      if (!m2 || close < 0 || !top || top.name !== m2[0]) throw new DrawioFormatError("XML \u306E\u9589\u3058\u30BF\u30B0\u304C\u5408\u308F\u306A\u3044");
      i = close + 1;
      continue;
    }
    const m = NAME.exec(xml.slice(i + 1, i + 257));
    if (!m) throw new DrawioFormatError("XML \u306E\u30BF\u30B0\u3092\u8AAD\u3081\u306A\u3044");
    const el = { name: m[0], attrs: {}, children: [], text: "" };
    i += 1 + m[0].length;
    for (; ; ) {
      while (/\s/.test(xml[i] ?? "")) i++;
      if (i >= xml.length) throw new DrawioFormatError(`<${el.name}> \u304C\u9589\u3058\u3066\u3044\u306A\u3044`);
      if (xml[i] === ">" || xml.startsWith("/>", i)) break;
      const a = NAME.exec(xml.slice(i, i + 256));
      if (!a) throw new DrawioFormatError(`<${el.name}> \u306E\u5C5E\u6027\u3092\u8AAD\u3081\u306A\u3044`);
      i += a[0].length;
      while (/\s/.test(xml[i] ?? "")) i++;
      if (xml[i] !== "=") throw new DrawioFormatError(`<${el.name}> \u306E\u5C5E\u6027 ${a[0]} \u306B\u5024\u304C\u306A\u3044`);
      i++;
      while (/\s/.test(xml[i] ?? "")) i++;
      const q = xml[i];
      if (q !== '"' && q !== "'") throw new DrawioFormatError(`<${el.name}> \u306E\u5C5E\u6027 ${a[0]} \u304C\u5F15\u7528\u7B26\u3067\u56F2\u307E\u308C\u3066\u3044\u306A\u3044`);
      const close = xml.indexOf(q, i + 1);
      if (close < 0) throw new DrawioFormatError(`<${el.name}> \u306E\u5C5E\u6027 ${a[0]} \u304C\u9589\u3058\u3066\u3044\u306A\u3044`);
      el.attrs[a[0]] = decodeXmlEntities(xml.slice(i + 1, close));
      i = close + 1;
    }
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(el);
    else if (root) throw new DrawioFormatError("XML \u306E\u30EB\u30FC\u30C8\u304C 2 \u3064\u3042\u308B");
    else root = el;
    if (xml[i] === ">") {
      stack.push(el);
      i++;
    } else {
      i += 2;
    }
  }
  if (stack.length > 0) throw new DrawioFormatError(`<${stack[stack.length - 1]?.name}> \u304C\u9589\u3058\u3066\u3044\u306A\u3044`);
  if (!root) throw new DrawioFormatError("XML \u304C\u7A7A");
  return root;
}
function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "&#10;");
}
function serializeXml(el) {
  const attrs = Object.entries(el.attrs).map(([k, v]) => ` ${k}="${escapeXml(v)}"`).join("");
  if (el.children.length === 0 && el.text === "") return `<${el.name}${attrs}/>`;
  return `<${el.name}${attrs}>${escapeXml(el.text)}${el.children.map(serializeXml).join("")}</${el.name}>`;
}

// src/core/model.ts
function parseStyle(style) {
  const map2 = /* @__PURE__ */ new Map();
  const names = [];
  for (const part of style.split(";")) {
    const p = part.trim();
    if (p === "") continue;
    const eq = p.indexOf("=");
    if (eq < 0) names.push(p);
    else map2.set(p.slice(0, eq).trim(), p.slice(eq + 1).trim());
  }
  return { map: map2, names };
}
function num(v, fallback = 0) {
  if (v === void 0) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function readPoint(el) {
  return { x: num(el.attrs.x), y: num(el.attrs.y) };
}
function readGeometry(el) {
  const g = {
    x: num(el.attrs.x),
    y: num(el.attrs.y),
    width: num(el.attrs.width),
    height: num(el.attrs.height),
    relative: el.attrs.relative === "1",
    points: [],
    sourcePoint: null,
    targetPoint: null,
    offset: null
  };
  for (const c of el.children) {
    if (c.name === "mxPoint" && c.attrs.as === "sourcePoint") g.sourcePoint = readPoint(c);
    else if (c.name === "mxPoint" && c.attrs.as === "targetPoint") g.targetPoint = readPoint(c);
    else if (c.name === "mxPoint" && c.attrs.as === "offset") g.offset = readPoint(c);
    else if (c.name === "Array" && c.attrs.as === "points") g.points = c.children.filter((p) => p.name === "mxPoint").map(readPoint);
  }
  return g;
}
function readCell(el, wrapper) {
  const id = wrapper?.attrs.id ?? el.attrs.id ?? "";
  const value = wrapper ? wrapper.attrs.label ?? "" : el.attrs.value ?? "";
  const { map: map2, names } = parseStyle(el.attrs.style ?? "");
  const geo = el.children.find((c) => c.name === "mxGeometry");
  return {
    id,
    parent: el.attrs.parent ?? null,
    value,
    style: map2,
    styleNames: names,
    vertex: el.attrs.vertex === "1",
    edge: el.attrs.edge === "1",
    source: el.attrs.source ?? null,
    target: el.attrs.target ?? null,
    geometry: geo ? readGeometry(geo) : null
  };
}
function readModel(model) {
  const root = model.children.find((c) => c.name === "root");
  if (!root) return [];
  const cells = [];
  for (const c of root.children) {
    if (c.name === "mxCell") cells.push(readCell(c, null));
    else if (c.name === "UserObject" || c.name === "object") {
      const inner = c.children.find((x) => x.name === "mxCell");
      if (inner) cells.push(readCell(inner, c));
    }
  }
  return cells;
}
function base64ToBytes(b64) {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function inflateDiagram(text) {
  let bytes;
  try {
    bytes = base64ToBytes(text.trim());
  } catch {
    throw new DrawioFormatError("\u5727\u7E2E\u3057\u305F\u30DA\u30FC\u30B8\u3092 base64 \u3068\u3057\u3066\u8AAD\u3081\u306A\u3044");
  }
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const inflated = await new Response(stream).text();
    return decodeURIComponent(inflated);
  } catch {
    throw new DrawioFormatError("\u5727\u7E2E\u3057\u305F\u30DA\u30FC\u30B8\u3092\u5C55\u958B\u3067\u304D\u306A\u3044");
  }
}
async function parseDiagramFile(xml) {
  const root = parseXml(xml.trim());
  if (root.name === "mxGraphModel") return [{ id: "page-1", name: "Page-1", cells: readModel(root) }];
  if (root.name !== "mxfile") throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u304C <mxfile> / <mxGraphModel> \u3067\u306F\u306A\u3044");
  const pages = [];
  for (const [i, d] of root.children.filter((c) => c.name === "diagram").entries()) {
    let model = d.children.find((c) => c.name === "mxGraphModel");
    if (!model && d.text.trim() !== "") model = parseXml(await inflateDiagram(d.text));
    pages.push({ id: d.attrs.id ?? `page-${i + 1}`, name: d.attrs.name ?? `Page-${i + 1}`, cells: model ? readModel(model) : [] });
  }
  if (pages.length === 0) throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u306B\u30DA\u30FC\u30B8\uFF08<diagram>\uFF09\u304C\u306A\u3044");
  return pages;
}
function absoluteOrigin(cell, byId) {
  let x = 0;
  let y = 0;
  const seen = /* @__PURE__ */ new Set();
  let c = cell;
  while (c && !seen.has(c.id)) {
    seen.add(c.id);
    if (c.vertex && c.geometry && !c.geometry.relative) {
      x += c.geometry.x;
      y += c.geometry.y;
    }
    c = c.parent ? byId.get(c.parent) : void 0;
  }
  return { x, y };
}
function labelText(cell) {
  const html = cell.style.get("html") === "1";
  let v = cell.value;
  if (html) {
    v = v.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(div|p|li|h[1-6])>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d{1,7});/g, (m, d) => Number(d) <= 1114111 ? String.fromCodePoint(Number(d)) : m).replace(/&amp;/g, "&");
  }
  return v.replace(/\n+$/, "");
}
async function decompressDiagramFile(xml) {
  const root = parseXml(xml.trim());
  if (root.name !== "mxfile") return xml.trim();
  const compressed = root.children.filter((d) => d.name === "diagram" && !d.children.some((c) => c.name === "mxGraphModel") && d.text.trim() !== "");
  if (compressed.length === 0) return xml.trim();
  for (const d of compressed) {
    d.children = [parseXml(await inflateDiagram(d.text))];
    d.text = "";
  }
  return serializeXml(root);
}

// src/core/render.ts
var DEFAULT_FONT = "Helvetica";
var LINE_HEIGHT = 1.2;
function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}
function charWidth(ch, fontSize) {
  const c = ch.codePointAt(0) ?? 0;
  if (ch === " ") return fontSize * 0.3;
  if (c >= 4352 && c <= 4447 || c >= 11904 && c <= 42191 || c >= 44032 && c <= 55203 || c >= 63744 && c <= 64255 || c >= 65072 && c <= 65103 || c >= 65280 && c <= 65376 || c >= 65504 && c <= 65510 || c >= 127744)
    return fontSize;
  if (/[A-Z@#%&mwMW]/.test(ch)) return fontSize * 0.72;
  if (/[il.,:;'|!]/.test(ch)) return fontSize * 0.3;
  return fontSize * 0.56;
}
function textWidth(text, fontSize) {
  let w = 0;
  for (const ch of text) w += charWidth(ch, fontSize);
  return w;
}
var NO_LINE_START = /^[)\]}）］｝〕〉》」』】、。，．,.:;：；!?！？ーぁぃぅぇぉっゃゅょァィゥェォッャュョ・]/u;
function wrapLines(text, maxWidth, fontSize) {
  const out = [];
  for (const para of text.split("\n")) {
    if (maxWidth <= 0 || textWidth(para, fontSize) <= maxWidth) {
      out.push(para);
      continue;
    }
    const units = para.match(/[!-ɏ]+\s*|\s+|./gu) ?? [];
    let line = "";
    for (const u of units) {
      if (line !== "" && !NO_LINE_START.test(u) && textWidth(line + u.trimEnd(), fontSize) > maxWidth) {
        out.push(line.trimEnd());
        line = u.trimStart();
      } else {
        line += u;
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}
var COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$/;
function color(cell, key, fallback, warnings) {
  const v = cell.style.get(key);
  if (v === void 0 || v === "default" || v === "") return fallback;
  if (COLOR.test(v)) return v;
  warnings.add(`\u8272 ${key} \u306E\u5024\uFF08${v.slice(0, 40)}\uFF09\u3092\u8AAD\u3081\u306A\u3044`);
  return fallback;
}
function num2(cell, key, fallback) {
  const v = cell.style.get(key);
  if (v === void 0) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function fontFamily(cell) {
  const v = cell.style.get("fontFamily") ?? DEFAULT_FONT;
  const safe = v.replace(/[^\w\s,\-　-鿿]/g, "").trim();
  return safe === "" ? DEFAULT_FONT : safe;
}
function shapeName(cell) {
  const shape = cell.style.get("shape");
  if (shape) return shape;
  const first = cell.styleNames.find((n) => !n.includes("="));
  return first ?? "rect";
}
var SHAPES = /* @__PURE__ */ new Set([
  "rect",
  "rectangle",
  "label",
  "ellipse",
  "doubleEllipse",
  "rhombus",
  "hexagon",
  "parallelogram",
  "triangle",
  "cylinder",
  "cylinder3",
  "note",
  "document",
  "umlActor",
  "actor",
  "text",
  "swimlane",
  "group",
  "process",
  "step",
  "cloud"
]);
function isEdge(cell) {
  return cell.edge && !cell.vertex;
}
function extend(ctx, x, y, w = 0, h = 0) {
  ctx.minX = Math.min(ctx.minX, x);
  ctx.minY = Math.min(ctx.minY, y);
  ctx.maxX = Math.max(ctx.maxX, x + w);
  ctx.maxY = Math.max(ctx.maxY, y + h);
}
function vertexBox(cell, byId) {
  if (!cell.vertex || !cell.geometry || cell.geometry.relative) return null;
  const o = absoluteOrigin(cell.parent ? byId.get(cell.parent) : void 0, byId);
  return { x: o.x + cell.geometry.x, y: o.y + cell.geometry.y, w: cell.geometry.width, h: cell.geometry.height };
}
function strokeAttrs(cell, ctx, fallbackStroke = "#000000") {
  const stroke = color(cell, "strokeColor", fallbackStroke, ctx.warnings);
  const width = num2(cell, "strokeWidth", 1);
  let s = ` stroke="${escapeXml(stroke)}"`;
  if (width !== 1) s += ` stroke-width="${fmt(width)}"`;
  if (cell.style.get("dashed") === "1") {
    const pattern = (cell.style.get("dashPattern") ?? "3 3").replace(/[^\d.\s]/g, "").trim() || "3 3";
    s += ` stroke-dasharray="${pattern.split(/\s+/).map((p) => fmt(Number(p) * width)).join(" ")}"`;
  }
  return s;
}
function opacityAttr(cell) {
  const o = num2(cell, "opacity", 100);
  return o < 100 ? ` opacity="${fmt(Math.max(0, o) / 100)}"` : "";
}
function poly(points) {
  return points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ");
}
function drawShape(cell, b, ctx) {
  const name = shapeName(cell);
  if (name === "text" || name === "group") return "";
  if (!SHAPES.has(name)) ctx.warnings.add(`\u5F62 ${name.slice(0, 40)} \u306F\u63CF\u3051\u306A\u3044\uFF08\u56DB\u89D2\u3067\u63CF\u3044\u305F\uFF09`);
  const fillDefault = name === "swimlane" ? "#ffffff" : "#ffffff";
  const fill = color(cell, "fillColor", fillDefault, ctx.warnings);
  const common = ` fill="${escapeXml(fill)}"${strokeAttrs(cell, ctx)}${opacityAttr(cell)}`;
  const { x, y, w, h } = b;
  switch (name) {
    case "ellipse":
      return `<ellipse cx="${fmt(x + w / 2)}" cy="${fmt(y + h / 2)}" rx="${fmt(w / 2)}" ry="${fmt(h / 2)}"${common}/>`;
    case "doubleEllipse":
      return `<ellipse cx="${fmt(x + w / 2)}" cy="${fmt(y + h / 2)}" rx="${fmt(w / 2)}" ry="${fmt(h / 2)}"${common}/><ellipse cx="${fmt(x + w / 2)}" cy="${fmt(y + h / 2)}" rx="${fmt(Math.max(0, w / 2 - 4))}" ry="${fmt(Math.max(0, h / 2 - 4))}" fill="none"${strokeAttrs(cell, ctx)}/>`;
    case "rhombus":
      return `<polygon points="${poly([
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
        [x, y + h / 2]
      ])}"${common}/>`;
    case "hexagon": {
      const s = cell.style.get("fixedSize") === "1" ? num2(cell, "size", 20) : w * num2(cell, "size", 0.25);
      return `<polygon points="${poly([
        [x + s, y],
        [x + w - s, y],
        [x + w, y + h / 2],
        [x + w - s, y + h],
        [x + s, y + h],
        [x, y + h / 2]
      ])}"${common}/>`;
    }
    case "parallelogram": {
      const s = cell.style.get("fixedSize") === "1" ? num2(cell, "size", 20) : w * num2(cell, "size", 0.2);
      return `<polygon points="${poly([
        [x + s, y],
        [x + w, y],
        [x + w - s, y + h],
        [x, y + h]
      ])}"${common}/>`;
    }
    case "step": {
      const s = cell.style.get("fixedSize") === "1" ? num2(cell, "size", 20) : w * num2(cell, "size", 0.2);
      return `<polygon points="${poly([
        [x, y],
        [x + w - s, y],
        [x + w, y + h / 2],
        [x + w - s, y + h],
        [x, y + h],
        [x + s, y + h / 2]
      ])}"${common}/>`;
    }
    case "triangle": {
      const dir = cell.style.get("direction") ?? "east";
      const pts = dir === "north" ? [
        [x, y + h],
        [x + w / 2, y],
        [x + w, y + h]
      ] : dir === "south" ? [
        [x, y],
        [x + w, y],
        [x + w / 2, y + h]
      ] : dir === "west" ? [
        [x + w, y],
        [x + w, y + h],
        [x, y + h / 2]
      ] : [
        [x, y],
        [x + w, y + h / 2],
        [x, y + h]
      ];
      return `<polygon points="${poly(pts)}"${common}/>`;
    }
    case "cylinder":
    case "cylinder3": {
      const s = Math.min(num2(cell, "size", 15), h / 2);
      const rx = w / 2;
      return `<path d="M ${fmt(x)} ${fmt(y + s)} A ${fmt(rx)} ${fmt(s)} 0 0 1 ${fmt(x + w)} ${fmt(y + s)} L ${fmt(x + w)} ${fmt(y + h - s)} A ${fmt(rx)} ${fmt(s)} 0 0 1 ${fmt(x)} ${fmt(y + h - s)} Z"${common}/><path d="M ${fmt(x)} ${fmt(y + s)} A ${fmt(rx)} ${fmt(s)} 0 0 0 ${fmt(x + w)} ${fmt(y + s)}" fill="none"${strokeAttrs(cell, ctx)}/>`;
    }
    case "note": {
      const s = Math.min(num2(cell, "size", 30), w, h);
      return `<polygon points="${poly([
        [x, y],
        [x + w - s, y],
        [x + w, y + s],
        [x + w, y + h],
        [x, y + h]
      ])}"${common}/><polyline points="${poly([
        [x + w - s, y],
        [x + w - s, y + s],
        [x + w, y + s]
      ])}" fill="none"${strokeAttrs(cell, ctx)}/>`;
    }
    case "document": {
      const d = h * num2(cell, "size", 0.3) * 0.5;
      return `<path d="M ${fmt(x)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y + h - d)} C ${fmt(x + w * 0.75)} ${fmt(y + h - 3 * d)} ${fmt(x + w * 0.25)} ${fmt(y + h + d)} ${fmt(x)} ${fmt(y + h - d)} Z"${common}/>`;
    }
    case "cloud":
      return `<path d="M ${fmt(x + 0.25 * w)} ${fmt(y + 0.25 * h)} C ${fmt(x + 0.05 * w)} ${fmt(y + 0.25 * h)} ${fmt(x)} ${fmt(y + 0.5 * h)} ${fmt(x + 0.16 * w)} ${fmt(y + 0.55 * h)} C ${fmt(x)} ${fmt(y + 0.66 * h)} ${fmt(x + 0.18 * w)} ${fmt(y + 0.9 * h)} ${fmt(x + 0.31 * w)} ${fmt(y + 0.8 * h)} C ${fmt(x + 0.4 * w)} ${fmt(y + h)} ${fmt(x + 0.7 * w)} ${fmt(y + h)} ${fmt(x + 0.8 * w)} ${fmt(y + 0.8 * h)} C ${fmt(x + w)} ${fmt(y + 0.8 * h)} ${fmt(x + w)} ${fmt(y + 0.6 * h)} ${fmt(x + 0.875 * w)} ${fmt(y + 0.5 * h)} C ${fmt(x + w)} ${fmt(y + 0.3 * h)} ${fmt(x + 0.8 * w)} ${fmt(y + 0.1 * h)} ${fmt(x + 0.625 * w)} ${fmt(y + 0.2 * h)} C ${fmt(x + 0.5 * w)} ${fmt(y + 0.05 * h)} ${fmt(x + 0.3 * w)} ${fmt(y + 0.05 * h)} ${fmt(x + 0.25 * w)} ${fmt(y + 0.25 * h)} Z"${common}/>`;
    case "umlActor":
    case "actor": {
      const headR = Math.min(w / 4, h / 8);
      const cx = x + w / 2;
      const neck = y + 2 * headR;
      const hip = y + h * 0.6;
      const arms = y + h / 3;
      return `<ellipse cx="${fmt(cx)}" cy="${fmt(y + headR)}" rx="${fmt(headR)}" ry="${fmt(headR)}"${common}/><path d="M ${fmt(cx)} ${fmt(neck)} L ${fmt(cx)} ${fmt(hip)} M ${fmt(x)} ${fmt(arms)} L ${fmt(x + w)} ${fmt(arms)} M ${fmt(cx)} ${fmt(hip)} L ${fmt(x)} ${fmt(y + h)} M ${fmt(cx)} ${fmt(hip)} L ${fmt(x + w)} ${fmt(y + h)}" fill="none"${strokeAttrs(cell, ctx)}/>`;
    }
    case "process": {
      const s = w * 0.1;
      return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"${common}/><path d="M ${fmt(x + s)} ${fmt(y)} L ${fmt(x + s)} ${fmt(y + h)} M ${fmt(x + w - s)} ${fmt(y)} L ${fmt(x + w - s)} ${fmt(y + h)}" fill="none"${strokeAttrs(cell, ctx)}/>`;
    }
    case "swimlane": {
      const start = num2(cell, "startSize", 23);
      const horizontal = cell.style.get("horizontal") !== "0";
      const body = color(cell, "swimlaneFillColor", "none", ctx.warnings);
      const outline = `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" fill="${escapeXml(body)}"${strokeAttrs(cell, ctx)}${opacityAttr(cell)}/>`;
      const head = horizontal ? `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(Math.min(start, h))}"${common}/>` : `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(Math.min(start, w))}" height="${fmt(h)}"${common}/>`;
      return outline + head;
    }
    default: {
      const rounded = cell.style.get("rounded") === "1";
      let r = "";
      if (rounded) {
        const arc = cell.style.get("absoluteArcSize") === "1" ? num2(cell, "arcSize", 10) / 2 : Math.min(w, h) * num2(cell, "arcSize", 15) / 100;
        r = ` rx="${fmt(arc)}" ry="${fmt(arc)}"`;
      }
      return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"${r}${common}/>`;
    }
  }
}
function drawText(cell, text, box, ctx, opts = {}) {
  if (text === "") return "";
  const fontSize = num2(cell, "fontSize", 12);
  const fontColor = color(cell, "fontColor", "#000000", ctx.warnings);
  const fontStyle = num2(cell, "fontStyle", 0);
  const align = opts.align ?? cell.style.get("align") ?? "center";
  const valign = opts.valign ?? cell.style.get("verticalAlign") ?? "middle";
  const spacing = num2(cell, "spacing", 2);
  const left = box.x + spacing + num2(cell, "spacingLeft", 0);
  const right = box.x + box.w - spacing - num2(cell, "spacingRight", 0);
  const top = box.y + spacing + num2(cell, "spacingTop", 0);
  const bottom = box.y + box.h - spacing - num2(cell, "spacingBottom", 0);
  const wrap = opts.wrap ?? cell.style.get("whiteSpace") === "wrap";
  const lines = wrap ? wrapLines(text, right - left, fontSize) : text.split("\n");
  const lh = fontSize * LINE_HEIGHT;
  const blockH = lines.length * lh;
  const y0 = valign === "top" ? top : valign === "bottom" ? bottom - blockH : (top + bottom) / 2 - blockH / 2;
  const anchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
  const tx = align === "left" ? left : align === "right" ? right : (left + right) / 2;
  const widest = Math.max(...lines.map((l) => textWidth(l, fontSize)));
  const bx = anchor === "start" ? tx : anchor === "end" ? tx - widest : tx - widest / 2;
  extend(ctx, bx, y0, widest, blockH);
  let attrs = ` font-family="${escapeXml(fontFamily(cell))}" font-size="${fmt(fontSize)}px" fill="${escapeXml(fontColor)}" text-anchor="${anchor}"`;
  if (fontStyle & 1) attrs += ` font-weight="bold"`;
  if (fontStyle & 2) attrs += ` font-style="italic"`;
  if (fontStyle & 4) attrs += ` text-decoration="underline"`;
  let out = "";
  if (opts.background) {
    out += `<rect x="${fmt(bx - 2)}" y="${fmt(y0)}" width="${fmt(widest + 4)}" height="${fmt(blockH)}" fill="${escapeXml(opts.background)}" stroke="none"/>`;
  }
  const tspans = lines.map((l, i) => `<tspan x="${fmt(tx)}" y="${fmt(y0 + i * lh + lh / 2 + fontSize * 0.35)}">${escapeXml(l)}</tspan>`).join("");
  out += `<text${attrs}>${tspans}</text>`;
  return out;
}
function labelBox(cell, b) {
  const name = shapeName(cell);
  const vpos = cell.style.get("verticalLabelPosition");
  const hpos = cell.style.get("labelPosition");
  if (vpos === "bottom") return { box: { x: b.x - b.w, y: b.y + b.h, w: b.w * 3, h: 0 }, valign: "top" };
  if (vpos === "top") return { box: { x: b.x - b.w, y: b.y - 0, w: b.w * 3, h: 0 }, valign: "bottom" };
  if (hpos === "right") return { box: { x: b.x + b.w, y: b.y, w: b.w * 2, h: b.h }, align: "left" };
  if (hpos === "left") return { box: { x: b.x - b.w * 2, y: b.y, w: b.w * 2, h: b.h }, align: "right" };
  if (name === "swimlane") {
    const start = num2(cell, "startSize", 23);
    if (cell.style.get("horizontal") === "0") return { box: { x: b.x, y: b.y, w: Math.min(start, b.w), h: b.h } };
    return { box: { x: b.x, y: b.y, w: b.w, h: Math.min(start, b.h) } };
  }
  if (cell.style.get("container") === "1" && cell.style.get("verticalAlign") === void 0) return { box: b, valign: "top" };
  return { box: b };
}
function center(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}
function perimeter(b, toward, elliptic) {
  const c = center(b);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (dx === 0 && dy === 0) return c;
  if (elliptic) {
    const a = b.w / 2;
    const bb = b.h / 2;
    const t2 = 1 / Math.sqrt(dx * dx / (a * a || 1) + dy * dy / (bb * bb || 1));
    return { x: c.x + dx * t2, y: c.y + dy * t2 };
  }
  const tx = dx === 0 ? Infinity : b.w / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : b.h / 2 / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: c.x + dx * t, y: c.y + dy * t };
}
function isElliptic(cell) {
  if (!cell) return false;
  const n = shapeName(cell);
  return n === "ellipse" || n === "doubleEllipse";
}
function fixedPort(cell, b, prefix) {
  const px = cell.style.get(`${prefix}X`);
  const py = cell.style.get(`${prefix}Y`);
  if (px === void 0 || py === void 0) return null;
  const x = Number(px);
  const y = Number(py);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: b.x + b.w * x, y: b.y + b.h * y };
}
function elbow(a, b, verticalFirst) {
  if (Math.abs(a.x - b.x) < 0.5 || Math.abs(a.y - b.y) < 0.5) return [a, b];
  if (verticalFirst) {
    const my = (a.y + b.y) / 2;
    return [a, { x: a.x, y: my }, { x: b.x, y: my }, b];
  }
  const mx = (a.x + b.x) / 2;
  return [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b];
}
function routeEdge(cell, ctx) {
  const src = cell.source ? ctx.byId.get(cell.source) : void 0;
  const tgt = cell.target ? ctx.byId.get(cell.target) : void 0;
  const sb = src ? vertexBox(src, ctx.byId) : null;
  const tb = tgt ? vertexBox(tgt, ctx.byId) : null;
  const o = absoluteOrigin(cell.parent ? ctx.byId.get(cell.parent) : void 0, ctx.byId);
  const g = cell.geometry;
  const way = (g?.points ?? []).map((p) => ({ x: p.x + o.x, y: p.y + o.y }));
  const sp = g?.sourcePoint ? { x: g.sourcePoint.x + o.x, y: g.sourcePoint.y + o.y } : null;
  const tp = g?.targetPoint ? { x: g.targetPoint.x + o.x, y: g.targetPoint.y + o.y } : null;
  if (!sb && !sp) return null;
  if (!tb && !tp) return null;
  const es = cell.style.get("edgeStyle") ?? "";
  const orthogonal = /orthogonal|elbow|entityRelation|segment/.test(es);
  const exit = sb ? fixedPort(cell, sb, "exit") : null;
  const entry = tb ? fixedPort(cell, tb, "entry") : null;
  if (!orthogonal) {
    const firstToward = way[0] ?? (tb ? center(tb) : tp);
    const start = exit ?? (sb ? perimeter(sb, firstToward, isElliptic(src)) : sp);
    const lastFrom = way[way.length - 1] ?? start;
    const end = entry ?? (tb ? perimeter(tb, way.length > 0 ? lastFrom : sb ? center(sb) : start, isElliptic(tgt)) : tp);
    return [start, ...way, end];
  }
  const sBox = sb ?? { x: sp.x, y: sp.y, w: 0, h: 0 };
  const tBox = tb ?? { x: tp.x, y: tp.y, w: 0, h: 0 };
  if (way.length === 0) {
    const gapY = Math.max(tBox.y - (sBox.y + sBox.h), sBox.y - (tBox.y + tBox.h));
    const gapX = Math.max(tBox.x - (sBox.x + sBox.w), sBox.x - (tBox.x + tBox.w));
    const vertical = exit && entry ? exit.y === sBox.y || exit.y === sBox.y + sBox.h : gapY >= gapX;
    const sc = center(sBox);
    const tc = center(tBox);
    let a;
    let b;
    if (vertical) {
      const down = tc.y >= sc.y;
      a = exit ?? { x: sc.x, y: down ? sBox.y + sBox.h : sBox.y };
      b = entry ?? { x: tc.x, y: down ? tBox.y : tBox.y + tBox.h };
    } else {
      const rightward = tc.x >= sc.x;
      a = exit ?? { x: rightward ? sBox.x + sBox.w : sBox.x, y: sc.y };
      b = entry ?? { x: rightward ? tBox.x : tBox.x + tBox.w, y: tc.y };
    }
    if (!sb) a = sp;
    if (!tb) b = tp;
    return elbow(a, b, vertical);
  }
  const first = way[0];
  const last = way[way.length - 1];
  const sideToward = (b, p) => {
    const c = center(b);
    if (p.x >= b.x && p.x <= b.x + b.w) return { point: { x: p.x, y: p.y >= c.y ? b.y + b.h : b.y }, vertical: true };
    if (p.y >= b.y && p.y <= b.y + b.h) return { point: { x: p.x >= c.x ? b.x + b.w : b.x, y: p.y }, vertical: false };
    const vertical = Math.abs(p.y - c.y) > Math.abs(p.x - c.x);
    return vertical ? { point: { x: c.x, y: p.y >= c.y ? b.y + b.h : b.y }, vertical } : { point: { x: p.x >= c.x ? b.x + b.w : b.x, y: c.y }, vertical };
  };
  const s = exit ? { point: exit, vertical: false } : sb ? sideToward(sb, first) : { point: sp, vertical: false };
  const t = entry ? { point: entry, vertical: false } : tb ? sideToward(tb, last) : { point: tp, vertical: false };
  const pts = [s.point];
  let prev = s.point;
  let vert = s.vertical;
  for (const p of [...way, t.point]) {
    const seg = elbow(prev, p, vert);
    pts.push(...seg.slice(1));
    vert = !vert;
    prev = p;
  }
  return pts;
}
function arrowHead(tip, from, kind, filled, size, stroke, strokeAttrs2) {
  if (kind === "none" || kind === "") return { svg: "", inset: 0 };
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const back = { x: tip.x - ux * size, y: tip.y - uy * size };
  const l = { x: back.x + nx * size * 0.5, y: back.y + ny * size * 0.5 };
  const r = { x: back.x - nx * size * 0.5, y: back.y - ny * size * 0.5 };
  const fill = filled ? escapeXml(stroke) : "#ffffff";
  if (kind === "open") {
    return { svg: `<polyline points="${poly([[l.x, l.y], [tip.x, tip.y], [r.x, r.y]])}" fill="none"${strokeAttrs2}/>`, inset: 0 };
  }
  if (kind === "classic" || kind === "classicThin") {
    const notch = { x: tip.x - ux * size * 0.7, y: tip.y - uy * size * 0.7 };
    return {
      svg: `<polygon points="${poly([[tip.x, tip.y], [l.x, l.y], [notch.x, notch.y], [r.x, r.y]])}" fill="${fill}"${strokeAttrs2.replace(/ stroke-dasharray="[^"]*"/, "")}/>`,
      inset: size * 0.7
    };
  }
  if (kind === "oval") {
    const c = { x: tip.x - ux * size * 0.5, y: tip.y - uy * size * 0.5 };
    return { svg: `<ellipse cx="${fmt(c.x)}" cy="${fmt(c.y)}" rx="${fmt(size / 2)}" ry="${fmt(size / 2)}" fill="${fill}"${strokeAttrs2}/>`, inset: size };
  }
  return {
    svg: `<polygon points="${poly([[tip.x, tip.y], [l.x, l.y], [r.x, r.y]])}" fill="${fill}"${strokeAttrs2.replace(/ stroke-dasharray="[^"]*"/, "")}/>`,
    inset: size
  };
}
function pointAlong(pts, fraction) {
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lens.push(l);
    total += l;
  }
  let want = total * Math.min(1, Math.max(0, fraction));
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i];
    if (want <= l || i === lens.length - 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const t = l === 0 ? 0 : want / l;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    want -= l;
  }
  return pts[0];
}
var KNOWN_ARROWS = /* @__PURE__ */ new Set(["none", "classic", "classicThin", "block", "blockThin", "open", "openThin", "oval", ""]);
function drawEdge(cell, pts, ctx, labels) {
  const stroke = color(cell, "strokeColor", "#000000", ctx.warnings);
  const sAttrs = strokeAttrs(cell, ctx);
  const width = num2(cell, "strokeWidth", 1);
  const size = (num2(cell, "endSize", 6) + 2) * Math.max(1, width * 0.75);
  const endKind = cell.style.get("endArrow") ?? "classic";
  const startKind = cell.style.get("startArrow") ?? "none";
  for (const k of [endKind, startKind]) if (!KNOWN_ARROWS.has(k)) ctx.warnings.add(`\u77E2\u5370 ${k.slice(0, 40)} \u306F\u63CF\u3051\u306A\u3044\uFF08\u4E09\u89D2\u3067\u63CF\u3044\u305F\uFF09`);
  const kindOf = (k) => k.replace(/Thin$/, "");
  const line = pts.map((p) => ({ ...p }));
  let heads = "";
  if (line.length >= 2) {
    const end = arrowHead(line[line.length - 1], line[line.length - 2], kindOf(endKind), cell.style.get("endFill") !== "0", size, stroke, sAttrs.replace(/ stroke-dasharray="[^"]*"/, ""));
    const start = arrowHead(line[0], line[1], kindOf(startKind), cell.style.get("startFill") !== "0", size, stroke, sAttrs.replace(/ stroke-dasharray="[^"]*"/, ""));
    heads = end.svg + start.svg;
    const shorten = (i, j, by) => {
      const a = line[i];
      const b = line[j];
      const len = Math.hypot(a.x - b.x, a.y - b.y);
      if (len === 0 || by === 0) return;
      const t = Math.min(by, len) / len;
      line[i] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };
    shorten(line.length - 1, line.length - 2, end.inset);
    shorten(0, 1, start.inset);
  }
  for (const p of pts) extend(ctx, p.x - size, p.y - size, size * 2, size * 2);
  let out = `<path d="M ${line.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join(" L ")}" fill="none"${sAttrs}${opacityAttr(cell)}/>${heads}`;
  const bg = cell.style.get("labelBackgroundColor");
  const background = bg === "none" ? null : bg && COLOR.test(bg) ? bg : "#ffffff";
  const own = labelText(cell);
  if (own !== "") {
    const frac = cell.geometry ? (cell.geometry.x + 1) / 2 : 0.5;
    const p = pointAlong(pts, Number.isFinite(frac) ? frac : 0.5);
    const off = cell.geometry?.offset ?? { x: 0, y: 0 };
    out += drawText(cell, own, { x: p.x + off.x - 200, y: p.y + off.y, w: 400, h: 0 }, ctx, { background, wrap: false });
  }
  for (const lc of labels) {
    const t = labelText(lc);
    if (t === "") continue;
    const frac = lc.geometry ? (lc.geometry.x + 1) / 2 : 0.5;
    const p = pointAlong(pts, Number.isFinite(frac) ? frac : 0.5);
    const off = lc.geometry?.offset ?? { x: 0, y: 0 };
    const lbg = lc.style.get("labelBackgroundColor");
    const lbackground = lbg === "none" ? null : lbg && COLOR.test(lbg) ? lbg : "#ffffff";
    out += `<g data-cell-id="${escapeXml(lc.id)}">${drawText(lc, t, { x: p.x + off.x - 200, y: p.y + off.y, w: 400, h: 0 }, ctx, { background: lbackground, wrap: false })}</g>`;
  }
  return out;
}
function renderPage(page) {
  const byId = new Map(page.cells.map((c) => [c.id, c]));
  const ctx = { byId, warnings: /* @__PURE__ */ new Set(), minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const edgeLabels = /* @__PURE__ */ new Map();
  for (const c of page.cells) {
    const parent = c.parent ? byId.get(c.parent) : void 0;
    if (c.vertex && parent && isEdge(parent)) {
      const list = edgeLabels.get(parent.id) ?? [];
      list.push(c);
      edgeLabels.set(parent.id, list);
    }
  }
  const hidden = (c) => {
    const seen = /* @__PURE__ */ new Set();
    let x2 = c;
    while (x2 && !seen.has(x2.id)) {
      if (x2.style.get("visible") === "0") return true;
      seen.add(x2.id);
      x2 = x2.parent ? byId.get(x2.parent) : void 0;
    }
    return false;
  };
  const parts = [];
  for (const c of page.cells) {
    if (hidden(c)) continue;
    if (c.style.has("image") || shapeName(c) === "image") ctx.warnings.add("\u753B\u50CF\u306E\u30BB\u30EB\u306F\u63CF\u3051\u306A\u3044\uFF08\u56DB\u89D2\u3067\u63CF\u3044\u305F\uFF09");
    if (isEdge(c)) {
      const pts = routeEdge(c, ctx);
      if (!pts) {
        ctx.warnings.add(`\u8FBA ${c.id.slice(0, 40)} \u306E\u7AEF\u304C\u306A\u3044\uFF08\u63CF\u304B\u306A\u304B\u3063\u305F\uFF09`);
        continue;
      }
      parts.push(`<g data-cell-id="${escapeXml(c.id)}">${drawEdge(c, pts, ctx, edgeLabels.get(c.id) ?? [])}</g>`);
      continue;
    }
    if (!c.vertex) continue;
    const parent = c.parent ? byId.get(c.parent) : void 0;
    if (parent && isEdge(parent)) continue;
    const b = vertexBox(c, byId);
    if (!b) continue;
    extend(ctx, b.x, b.y, b.w, b.h);
    const shape = drawShape(c, b, ctx);
    const lb = labelBox(c, b);
    const text = drawText(c, labelText(c), lb.box, ctx, { align: lb.align, valign: lb.valign, wrap: lb.box === b ? void 0 : false });
    parts.push(`<g data-cell-id="${escapeXml(c.id)}">${shape}${text}</g>`);
  }
  if (!Number.isFinite(ctx.minX)) {
    ctx.minX = 0;
    ctx.minY = 0;
    ctx.maxX = 10;
    ctx.maxY = 10;
  }
  const x = Math.floor(ctx.minX) - 1;
  const y = Math.floor(ctx.minY) - 1;
  return {
    body: parts.join(""),
    bounds: { x, y, width: Math.ceil(ctx.maxX) + 1 - x, height: Math.ceil(ctx.maxY) + 1 - y },
    warnings: [...ctx.warnings].sort()
  };
}
function drawioSvg(xml, rendered) {
  const { x, y, width, height } = rendered.bounds;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Rendered by pkm-kit (drawio.mjs). Open in draw.io to re-render exactly. -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${width}px" height="${height}px" viewBox="${x} ${y} ${width} ${height}" content="${escapeXml(xml)}"><defs/><g>${rendered.body}</g></svg>
`;
}

// src/core/build.ts
var PALETTE = {
  white: { fill: "#ffffff", stroke: "#000000" },
  gray: { fill: "#f5f5f5", stroke: "#666666", font: "#333333" },
  blue: { fill: "#dae8fc", stroke: "#6c8ebf" },
  green: { fill: "#d5e8d4", stroke: "#82b366" },
  orange: { fill: "#ffe6cc", stroke: "#d79b00" },
  yellow: { fill: "#fff2cc", stroke: "#d6b656" },
  red: { fill: "#f8cecc", stroke: "#b85450" },
  purple: { fill: "#e1d5e7", stroke: "#9673a6" },
  dark: { fill: "#333333", stroke: "#000000", font: "#ffffff" },
  none: { fill: "none", stroke: "#000000" }
};
var SHAPE_STYLES = {
  box: "rounded=0;whiteSpace=wrap;html=1;",
  rounded: "rounded=1;whiteSpace=wrap;html=1;",
  ellipse: "ellipse;whiteSpace=wrap;html=1;",
  circle: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;",
  diamond: "rhombus;whiteSpace=wrap;html=1;",
  hexagon: "shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;",
  parallelogram: "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;",
  step: "shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;",
  triangle: "triangle;whiteSpace=wrap;html=1;",
  cylinder: "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;",
  note: "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;size=20;",
  document: "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;",
  process: "shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;",
  cloud: "ellipse;shape=cloud;whiteSpace=wrap;html=1;",
  actor: "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;",
  text: "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;"
};
var ID = /^[A-Za-z0-9_.:-]{1,64}$/;
var COLOR2 = /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$|^none$/;
var RAW_STYLE = /^[A-Za-z0-9_.:#%=;,\- ]*$/;
var FONT = 12;
var RANK_GAP = { down: 60, right: 80 };
var NODE_GAP = 40;
var PAD = { top: 36, side: 20, bottom: 20 };
function fail(where, message) {
  throw new DrawioFormatError(`spec \u306E ${where}: ${message}`);
}
function checkObject(v, where) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) fail(where, "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u306A\u3044");
  return v;
}
function checkKeys(o, allowed, where) {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(where, `\u77E5\u3089\u306A\u3044\u9805\u76EE ${k}\uFF08\u4F7F\u3048\u308B\u306E\u306F ${allowed.join(", ")}\uFF09`);
}
function str(o, k, where) {
  const v = o[k];
  if (v === void 0) return void 0;
  if (typeof v !== "string") fail(where, `${k} \u304C\u6587\u5B57\u5217\u3067\u306F\u306A\u3044`);
  return v;
}
function numv(o, k, where, min = -1e5, max = 1e5) {
  const v = o[k];
  if (v === void 0) return void 0;
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) fail(where, `${k} \u304C ${min}\u301C${max} \u306E\u6570\u3067\u306F\u306A\u3044`);
  return v;
}
function oneOf(o, k, values, where) {
  const v = str(o, k, where);
  if (v === void 0) return void 0;
  if (!values.includes(v)) fail(where, `${k} \u306F ${values.join(" / ")} \u306E\u3069\u308C\u304B`);
  return v;
}
function colorName(o, k, where) {
  const v = str(o, k, where);
  if (v === void 0) return void 0;
  if (k === "color") {
    if (!(v in PALETTE)) fail(where, `color \u306F ${Object.keys(PALETTE).join(" / ")} \u306E\u3069\u308C\u304B`);
    return v;
  }
  if (!COLOR2.test(v)) fail(where, `${k} \u306F #rrggbb \u304B none`);
  return v;
}
function rawStyle(o, where) {
  const v = str(o, "style", where);
  if (v === void 0) return void 0;
  if (!RAW_STYLE.test(v) || v.length > 1e3) fail(where, "style \u306B\u4F7F\u3048\u306A\u3044\u6587\u5B57\u304C\u3042\u308B");
  return v;
}
function bool(o, k, where) {
  const v = o[k];
  if (v === void 0) return void 0;
  if (typeof v !== "boolean") fail(where, `${k} \u304C true / false \u3067\u306F\u306A\u3044`);
  return v;
}
function readPage(v, where) {
  const o = checkObject(v, where);
  checkKeys(o, ["name", "direction", "layout", "columns", "nodes", "edges", "groups"], where);
  const list = (k) => {
    const x = o[k];
    if (x === void 0) return [];
    if (!Array.isArray(x)) fail(where, `${k} \u304C\u914D\u5217\u3067\u306F\u306A\u3044`);
    return x;
  };
  const nodes = list("nodes").map((n, i) => {
    const w = `${where}nodes[${i}]`;
    const no = checkObject(n, w);
    checkKeys(no, ["id", "label", "shape", "color", "fill", "stroke", "fontColor", "fontSize", "bold", "dashed", "group", "width", "height", "x", "y", "style"], w);
    const id = str(no, "id", w);
    if (id === void 0 || !ID.test(id) || id === "0" || id === "1") fail(w, "id \u306F\u82F1\u6570\u5B57\u3068 _ . : - \u306E 64 \u6587\u5B57\u307E\u3067\uFF080 \u3068 1 \u306F\u4F7F\u3048\u306A\u3044\uFF09");
    const shape = str(no, "shape", w);
    if (shape !== void 0 && !(shape in SHAPE_STYLES)) fail(w, `shape \u306F ${Object.keys(SHAPE_STYLES).join(" / ")} \u306E\u3069\u308C\u304B`);
    return {
      id,
      label: str(no, "label", w),
      shape,
      color: colorName(no, "color", w),
      fill: colorName(no, "fill", w),
      stroke: colorName(no, "stroke", w),
      fontColor: colorName(no, "fontColor", w),
      fontSize: numv(no, "fontSize", w, 6, 72),
      bold: bool(no, "bold", w),
      dashed: bool(no, "dashed", w),
      group: str(no, "group", w),
      width: numv(no, "width", w, 1, 5e3),
      height: numv(no, "height", w, 1, 5e3),
      x: numv(no, "x", w),
      y: numv(no, "y", w),
      style: rawStyle(no, w)
    };
  });
  const groups = list("groups").map((g, i) => {
    const w = `${where}groups[${i}]`;
    const go = checkObject(g, w);
    checkKeys(go, ["id", "label", "color", "group", "style", "direction", "layout", "columns", "x", "y"], w);
    const id = str(go, "id", w);
    if (id === void 0 || !ID.test(id) || id === "0" || id === "1") fail(w, "id \u306F\u82F1\u6570\u5B57\u3068 _ . : - \u306E 64 \u6587\u5B57\u307E\u3067\uFF080 \u3068 1 \u306F\u4F7F\u3048\u306A\u3044\uFF09");
    return {
      id,
      label: str(go, "label", w),
      color: colorName(go, "color", w),
      group: str(go, "group", w),
      style: rawStyle(go, w),
      direction: oneOf(go, "direction", ["down", "right"], w),
      layout: oneOf(go, "layout", ["layered", "grid", "none"], w),
      columns: numv(go, "columns", w, 1, 100),
      x: numv(go, "x", w),
      y: numv(go, "y", w)
    };
  });
  const edges = list("edges").map((e, i) => {
    const w = `${where}edges[${i}]`;
    const eo = checkObject(e, w);
    checkKeys(eo, ["id", "from", "to", "label", "dashed", "arrow", "color", "width", "line", "style"], w);
    const from = str(eo, "from", w);
    const to = str(eo, "to", w);
    if (from === void 0 || to === void 0) fail(w, "from \u3068 to \u304C\u8981\u308B");
    const id = str(eo, "id", w);
    if (id !== void 0 && (!ID.test(id) || id === "0" || id === "1")) fail(w, "id \u306F\u82F1\u6570\u5B57\u3068 _ . : - \u306E 64 \u6587\u5B57\u307E\u3067\uFF080 \u3068 1 \u306F\u4F7F\u3048\u306A\u3044\uFF09");
    const c = str(eo, "color", w);
    if (c !== void 0 && !(c in PALETTE) && !COLOR2.test(c)) fail(w, "color \u306F\u8272\u306E\u540D\u524D\u304B #rrggbb");
    return {
      id,
      from,
      to,
      label: str(eo, "label", w),
      dashed: bool(eo, "dashed", w),
      arrow: oneOf(eo, "arrow", ["end", "start", "both", "none"], w),
      color: c,
      width: numv(eo, "width", w, 0.5, 20),
      line: oneOf(eo, "line", ["orthogonal", "straight", "curved"], w),
      style: rawStyle(eo, w)
    };
  });
  return {
    name: str(o, "name", where),
    direction: oneOf(o, "direction", ["down", "right"], where),
    layout: oneOf(o, "layout", ["layered", "grid", "none"], where),
    columns: numv(o, "columns", where, 1, 100),
    nodes,
    edges,
    groups
  };
}
function readSpec(json) {
  const o = checkObject(json, "\u30EB\u30FC\u30C8");
  if (o.pages !== void 0) {
    checkKeys(o, ["pages"], "\u30EB\u30FC\u30C8");
    if (!Array.isArray(o.pages) || o.pages.length === 0) fail("pages", "1 \u3064\u4EE5\u4E0A\u306E\u30DA\u30FC\u30B8\u306E\u914D\u5217\u306B\u3059\u308B");
    return o.pages.map((p, i) => readPage(p, `pages[${i}].`));
  }
  return [readPage(o, "")];
}
function estimateNode(n) {
  const shape = n.shape ?? "rounded";
  const fontSize = n.fontSize ?? FONT;
  const label = n.label ?? n.id;
  if (shape === "actor") return { w: n.width ?? 30, h: n.height ?? 60 };
  const lineW = Math.max(0, ...label.split("\n").map((l) => textWidth(l, fontSize)));
  const factor = shape === "diamond" ? 1.6 : shape === "ellipse" || shape === "circle" || shape === "cloud" ? 1.35 : shape === "hexagon" || shape === "parallelogram" || shape === "step" ? 1.25 : 1;
  const maxW = 200 * Math.max(1, factor * 0.9);
  let w = Math.max(shape === "text" ? 40 : 120, Math.ceil((lineW + 24) * factor / 10) * 10);
  if (w > maxW) w = Math.ceil(maxW / 10) * 10;
  const inner = w / factor - 8;
  const lines = wrapLines(label, inner, fontSize).length;
  const minH = shape === "text" ? 30 : shape === "diamond" ? 80 : shape === "cylinder" ? 80 : 60;
  let h = Math.max(minH, Math.ceil((lines * fontSize * 1.2 + 20) * (shape === "diamond" ? 1.6 : shape === "cylinder" || shape === "document" ? 1.3 : 1) / 10) * 10);
  if (shape === "circle") {
    const s = Math.max(w, h);
    w = s;
    h = s;
  }
  return { w: n.width ?? w, h: n.height ?? h };
}
function layered(level) {
  const { items, direction } = level;
  const index = new Map(items.map((it, i) => [it.id, i]));
  const n = items.length;
  const out = items.map(() => []);
  const seenPair = /* @__PURE__ */ new Set();
  for (const [a, b] of level.links) {
    const ia = index.get(a);
    const ib = index.get(b);
    if (ia === void 0 || ib === void 0 || ia === ib) continue;
    const key = `${ia}>${ib}`;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    out[ia]?.push(ib);
  }
  const state = new Array(n).fill(0);
  const forward = [];
  const visit = (u) => {
    state[u] = 1;
    for (const v of out[u] ?? []) {
      if (state[v] === 1) forward.push([v, u]);
      else {
        forward.push([u, v]);
        if (state[v] === 0) visit(v);
      }
    }
    state[u] = 2;
  };
  const indeg = new Array(n).fill(0);
  for (const list of out) for (const v of list) indeg[v] = (indeg[v] ?? 0) + 1;
  for (let i = 0; i < n; i++) if (state[i] === 0 && indeg[i] === 0) visit(i);
  for (let i = 0; i < n; i++) if (state[i] === 0) visit(i);
  const preds = items.map(() => []);
  const succs = items.map(() => []);
  for (const [a, b] of forward) {
    if (!succs[a]?.includes(b)) succs[a]?.push(b);
    if (!preds[b]?.includes(a)) preds[b]?.push(a);
  }
  const rank = new Array(n).fill(0);
  const remaining = preds.map((p) => p.length);
  const queue = [];
  for (let i = 0; i < n; i++) if (remaining[i] === 0) queue.push(i);
  while (queue.length > 0) {
    queue.sort((a, b) => a - b);
    const u = queue.shift();
    for (const v of succs[u] ?? []) {
      rank[v] = Math.max(rank[v] ?? 0, (rank[u] ?? 0) + 1);
      remaining[v] = (remaining[v] ?? 0) - 1;
      if (remaining[v] === 0) queue.push(v);
    }
  }
  for (let i = 0; i < n; i++) {
    if ((preds[i]?.length ?? 0) === 0 && (succs[i]?.length ?? 0) > 0) {
      rank[i] = Math.max(0, Math.min(...(succs[i] ?? []).map((s) => rank[s] ?? 0)) - 1);
    }
  }
  const ranks = [];
  for (let i = 0; i < n; i++) (ranks[rank[i] ?? 0] ??= []).push(i);
  for (let r = 0; r < ranks.length; r++) ranks[r] ??= [];
  const pos = new Array(n).fill(0);
  const setPos = () => {
    for (const row of ranks) row.forEach((v, i) => pos[v] = i);
  };
  setPos();
  const bary = (v, nbrs) => nbrs.length === 0 ? pos[v] ?? 0 : nbrs.reduce((s, x) => s + (pos[x] ?? 0), 0) / nbrs.length;
  for (let sweep = 0; sweep < 8; sweep++) {
    const down = sweep % 2 === 0;
    const order = down ? ranks.map((_, i) => i) : ranks.map((_, i) => ranks.length - 1 - i);
    for (const r of order.slice(1)) {
      const row = ranks[r];
      const key = new Map(row.map((v) => [v, bary(v, down ? preds[v] ?? [] : succs[v] ?? [])]));
      row.sort((a, b) => key.get(a) - key.get(b) || (pos[a] ?? 0) - (pos[b] ?? 0) || a - b);
      setPos();
    }
  }
  const mainSize = (it) => direction === "down" ? it.h + it.below : it.w;
  const crossSize = (it) => direction === "down" ? it.w : it.h + it.below;
  const center2 = new Array(n).fill(0);
  const pack = (row, desired) => {
    const left = [];
    row.forEach((v, i) => {
      const half = crossSize(items[v]) / 2;
      const want = desired[i];
      if (i === 0) left.push(want);
      else {
        const pv = row[i - 1];
        left.push(Math.max(want, left[i - 1] + crossSize(items[pv]) / 2 + NODE_GAP + half));
      }
    });
    const right = new Array(row.length);
    for (let i = row.length - 1; i >= 0; i--) {
      const v = row[i];
      const want = desired[i];
      if (i === row.length - 1) right[i] = want;
      else {
        const nv = row[i + 1];
        right[i] = Math.min(want, right[i + 1] - crossSize(items[nv]) / 2 - NODE_GAP - crossSize(items[v]) / 2);
      }
    }
    const avg = row.map((_, i) => (left[i] + right[i]) / 2);
    for (let i = 1; i < row.length; i++) {
      const min = avg[i - 1] + crossSize(items[row[i - 1]]) / 2 + NODE_GAP + crossSize(items[row[i]]) / 2;
      if (avg[i] < min) avg[i] = min;
    }
    row.forEach((v, i) => center2[v] = avg[i]);
  };
  const evenly = (row) => {
    let total = -NODE_GAP;
    for (const v of row) total += crossSize(items[v]) + NODE_GAP;
    let c = -total / 2;
    return row.map((v) => {
      const s = crossSize(items[v]);
      const mid = c + s / 2;
      c += s + NODE_GAP;
      return mid;
    });
  };
  ranks.forEach((row, r) => {
    if (r === 0) {
      pack(row, evenly(row));
      return;
    }
    const base = evenly(row);
    const desired = row.map((v, i) => {
      const p = preds[v] ?? [];
      return p.length === 0 ? base[i] : p.reduce((s, x) => s + (center2[x] ?? 0), 0) / p.length;
    });
    pack(row, desired);
  });
  for (let r = ranks.length - 2; r >= 0; r--) {
    const row = ranks[r];
    const desired = row.map((v) => {
      const s = succs[v] ?? [];
      const p = preds[v] ?? [];
      if (s.length === 0) return center2[v];
      const sc = s.reduce((acc, x) => acc + (center2[x] ?? 0), 0) / s.length;
      return p.length === 0 ? sc : (center2[v] + sc) / 2;
    });
    pack(row, desired);
  }
  let main2 = 0;
  const minCross = Math.min(...items.map((it, i) => center2[i] - crossSize(it) / 2));
  for (const row of ranks) {
    const thick = Math.max(0, ...row.map((v) => mainSize(items[v])));
    for (const v of row) {
      const it = items[v];
      const m = main2 + (thick - mainSize(it)) / 2;
      const c = center2[v] - crossSize(it) / 2 - minCross;
      if (direction === "down") {
        it.x = Math.round(c);
        it.y = Math.round(m);
      } else {
        it.x = Math.round(m);
        it.y = Math.round(c);
      }
    }
    main2 += thick + RANK_GAP[direction];
  }
}
function grid(level) {
  const { items } = level;
  const cols = Math.max(1, Math.min(items.length, level.columns ?? Math.ceil(Math.sqrt(items.length))));
  const colW = [];
  const rowH = [];
  items.forEach((it, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    colW[c] = Math.max(colW[c] ?? 0, it.w);
    rowH[r] = Math.max(rowH[r] ?? 0, it.h + it.below);
  });
  items.forEach((it, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x0 = colW.slice(0, c).reduce((s, w) => s + w + NODE_GAP, 0);
    const y0 = rowH.slice(0, r).reduce((s, h) => s + h + NODE_GAP, 0);
    it.x = Math.round(x0 + (colW[c] - it.w) / 2);
    it.y = Math.round(y0 + (rowH[r] - it.h) / 2);
  });
}
function fixed(level, where) {
  for (const it of level.items) {
    if (it.fixed.x === void 0 || it.fixed.y === void 0) fail(where, `layout: none \u3067\u306F ${it.id} \u306B x \u3068 y \u304C\u8981\u308B`);
    it.x = it.fixed.x;
    it.y = it.fixed.y;
  }
}
function arrange(level, where) {
  if (level.items.length === 0) return;
  if (level.layout === "none") fixed(level, where);
  else if (level.layout === "grid") grid(level);
  else layered(level);
}
function htmlLabel(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").split("\n").join("<br>");
}
function nodeStyle(n) {
  let s = SHAPE_STYLES[n.shape ?? "rounded"];
  const pal = n.color ? PALETTE[n.color] : void 0;
  const fill = n.fill ?? pal?.fill;
  const stroke = n.stroke ?? pal?.stroke;
  const font = n.fontColor ?? pal?.font;
  if (n.shape === "text") {
    if (n.fill) s += `fillColor=${n.fill};`;
    if (n.stroke) s += `strokeColor=${n.stroke};`;
  } else {
    if (fill) s += `fillColor=${fill};`;
    if (stroke) s += `strokeColor=${stroke};`;
  }
  if (font) s += `fontColor=${font};`;
  if (n.fontSize) s += `fontSize=${n.fontSize};`;
  if (n.bold) s += "fontStyle=1;";
  if (n.dashed) s += "dashed=1;";
  if (n.style) s += n.style.endsWith(";") ? n.style : `${n.style};`;
  return s;
}
function groupStyle(g) {
  const pal = PALETTE[g.color ?? "gray"] ?? PALETTE.gray;
  let s = `rounded=1;arcSize=4;whiteSpace=wrap;html=1;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=8;spacingTop=2;fontStyle=1;fillColor=${pal?.fill};strokeColor=${pal?.stroke};`;
  if (pal?.font) s += `fontColor=${pal.font};`;
  if (g.style) s += g.style.endsWith(";") ? g.style : `${g.style};`;
  return s;
}
function edgeStyle(e, ports) {
  const line = e.line ?? "orthogonal";
  let s = line === "straight" ? "html=1;rounded=0;" : line === "curved" ? "html=1;curved=1;" : `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;${ports}`;
  const arrow = e.arrow ?? "end";
  if (arrow === "none") s += "endArrow=none;";
  if (arrow === "start") s += "endArrow=none;startArrow=classic;";
  if (arrow === "both") s += "startArrow=classic;";
  if (e.dashed) s += "dashed=1;";
  if (e.color) s += `strokeColor=${PALETTE[e.color]?.stroke ?? e.color};`;
  if (e.width) s += `strokeWidth=${e.width};`;
  if (e.style) s += e.style.endsWith(";") ? e.style : `${e.style};`;
  return s;
}
function pageXml(page, pageIndex, where) {
  const nodes = page.nodes ?? [];
  const groups = page.groups ?? [];
  const edges = page.edges ?? [];
  const ids = /* @__PURE__ */ new Set();
  for (const x of [...groups, ...nodes]) {
    if (ids.has(x.id)) fail(where, `id ${x.id} \u304C\u91CD\u8907\u3057\u3066\u3044\u308B`);
    ids.add(x.id);
  }
  const groupById = new Map(groups.map((g) => [g.id, g]));
  for (const x of [...groups, ...nodes]) {
    if (x.group !== void 0 && !groupById.has(x.group)) fail(where, `${x.id} \u306E group ${x.group} \u304C\u306A\u3044`);
  }
  for (const g of groups) {
    const seen = /* @__PURE__ */ new Set();
    let c = g;
    while (c?.group !== void 0) {
      if (seen.has(c.id)) fail(where, `\u30B0\u30EB\u30FC\u30D7 ${g.id} \u306E\u5165\u308C\u5B50\u304C\u5FAA\u74B0\u3057\u3066\u3044\u308B`);
      seen.add(c.id);
      c = groupById.get(c.group);
    }
  }
  for (const e of edges) {
    for (const end of [e.from, e.to]) if (!ids.has(end)) fail(where, `\u8FBA ${e.from} \u2192 ${e.to} \u306E ${end} \u304C\u306A\u3044`);
  }
  const direction = page.direction ?? "down";
  const parentOf = /* @__PURE__ */ new Map();
  for (const x of [...groups, ...nodes]) parentOf.set(x.id, x.group ?? "");
  const ancestors = (id) => {
    const list = [id];
    let p = parentOf.get(id) ?? "";
    while (p !== "") {
      list.push(p);
      p = parentOf.get(p) ?? "";
    }
    return list;
  };
  const items = /* @__PURE__ */ new Map();
  nodes.forEach((n, i) => {
    const s = estimateNode(n);
    const below = n.shape === "actor" ? Math.ceil(((n.label ?? n.id).split("\n").length * (n.fontSize ?? FONT) * 1.2 + 6) / 2) * 2 : 0;
    items.set(n.id, { id: n.id, kind: "node", w: s.w, h: s.h, below, x: 0, y: 0, fixed: { x: n.x, y: n.y }, order: i });
  });
  groups.forEach((g, i) => items.set(g.id, { id: g.id, kind: "group", w: 0, h: 0, below: 0, x: 0, y: 0, fixed: { x: g.x, y: g.y }, order: i - groups.length }));
  const depth = (gid) => ancestors(gid).length;
  const levels = ["", ...[...groups].sort((a, b) => depth(b.id) - depth(a.id)).map((g) => g.id)];
  const ordered = [...levels.slice(1), ""];
  for (const lv of ordered) {
    const members = [...items.values()].filter((it) => (parentOf.get(it.id) ?? "") === lv).sort((a, b) => a.order - b.order);
    const memberSet = new Set(members.map((m) => m.id));
    const toMember = (id) => {
      for (const a of ancestors(id)) if (memberSet.has(a)) return a;
      return null;
    };
    const links = [];
    for (const e of edges) {
      const a = toMember(e.from);
      const b = toMember(e.to);
      if (a && b && a !== b) links.push([a, b]);
    }
    const g = lv === "" ? void 0 : groupById.get(lv);
    const level = {
      items: members,
      links,
      direction: g?.direction ?? direction,
      layout: g?.layout ?? page.layout ?? "layered",
      columns: g?.columns ?? (lv === "" ? page.columns : void 0)
    };
    arrange(level, where);
    if (g) {
      const it = items.get(g.id);
      const label = g.label ?? "";
      const labelW = textWidth(label, FONT) + 24;
      if (members.length === 0) {
        it.w = Math.max(120, labelW);
        it.h = 60;
      } else {
        const minX = Math.min(...members.map((m) => m.x));
        const minY = Math.min(...members.map((m) => m.y));
        for (const m of members) {
          m.x = m.x - minX + PAD.side;
          m.y = m.y - minY + PAD.top;
        }
        const maxX = Math.max(...members.map((m) => m.x + m.w));
        const maxY = Math.max(...members.map((m) => m.y + m.h + m.below));
        it.w = Math.max(maxX + PAD.side, labelW);
        it.h = maxY + PAD.bottom;
      }
    }
  }
  const cells = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const write = (id) => {
    const it = items.get(id);
    const parent = parentOf.get(id) || "1";
    const geo = `<mxGeometry x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" as="geometry"/>`;
    if (it.kind === "group") {
      const g = groupById.get(id);
      cells.push(`<mxCell id="${escapeXml(id)}" value="${escapeXml(htmlLabel(g.label ?? ""))}" style="${escapeXml(groupStyle(g))}" vertex="1" parent="${escapeXml(parent)}">${geo}</mxCell>`);
      const children = [...items.values()].filter((c) => parentOf.get(c.id) === id).sort((a, b) => a.order - b.order);
      for (const c of children) write(c.id);
    } else {
      const n = nodeById.get(id);
      cells.push(`<mxCell id="${escapeXml(id)}" value="${escapeXml(htmlLabel(n.label ?? n.id))}" style="${escapeXml(nodeStyle(n))}" vertex="1" parent="${escapeXml(parent)}">${geo}</mxCell>`);
    }
  };
  for (const it of [...items.values()].filter((x) => (parentOf.get(x.id) ?? "") === "").sort((a, b) => a.order - b.order)) write(it.id);
  const absolute = (id) => {
    let x = 0;
    let y = 0;
    for (const a of ancestors(id)) {
      const it2 = items.get(a);
      x += it2.x;
      y += it2.y;
    }
    const it = items.get(id);
    return { x, y, w: it.w, h: it.h };
  };
  const edgeIds = /* @__PURE__ */ new Set();
  const tops = [...items.values()].filter((x) => (parentOf.get(x.id) ?? "") === "");
  const farX = Math.max(0, ...tops.map((t) => t.x + t.w));
  const farY = Math.max(0, ...tops.map((t) => t.y + t.h + t.below));
  let lanes = 0;
  const boxes = [...items.keys()].map((id) => ({ id, box: absolute(id) }));
  const detour = (from, to, a, b, swap) => {
    const T = (r) => swap ? { x: r.y, y: r.x, w: r.h, h: r.w } : r;
    const pt = (x, y) => swap ? `<mxPoint x="${Math.round(y)}" y="${Math.round(x)}"/>` : `<mxPoint x="${Math.round(x)}" y="${Math.round(y)}"/>`;
    const skip = /* @__PURE__ */ new Set([...ancestors(from), ...ancestors(to)]);
    const obstacles = boxes.filter((o) => !skip.has(o.id)).map((o) => T(o.box));
    const A = T(a);
    const B = T(b);
    const ax = A.x + A.w / 2;
    const bx = B.x + B.w / 2;
    const top = A.y + A.h;
    const bottom = B.y;
    const my = (top + bottom) / 2;
    const hits = (segs) => obstacles.filter(
      (o) => segs.some(([x1, y12, x2, y22]) => Math.max(x1, x2) > o.x && Math.min(x1, x2) < o.x + o.w && Math.max(y12, y22) > o.y && Math.min(y12, y22) < o.y + o.h)
    );
    const straight = [
      [ax, top, ax, my],
      [ax, my, bx, my],
      [bx, my, bx, bottom]
    ];
    const blocking = hits(straight);
    if (blocking.length === 0) return "";
    const y1 = top + Math.min(20, (bottom - top) / 3);
    const y2 = bottom - Math.min(20, (bottom - top) / 3);
    const between = obstacles.filter((o) => o.y < y2 && o.y + o.h > y1);
    const right = Math.max(...between.map((o) => o.x + o.w)) + 20;
    const left = Math.min(...between.map((o) => o.x)) - 20;
    const lane = Math.abs(right - (ax + bx) / 2) <= Math.abs((ax + bx) / 2 - left) ? right : left;
    return `<Array as="points">${pt(ax, y1)}${pt(lane, y1)}${pt(lane, y2)}${pt(bx, y2)}</Array>`;
  };
  edges.forEach((e, i) => {
    let id = e.id ?? `e${i + 1}`;
    while (ids.has(id) || edgeIds.has(id)) id = `${id}_`;
    edgeIds.add(id);
    let ports = "";
    let points = "";
    const orthogonal = (e.line ?? "orthogonal") === "orthogonal";
    if (e.from !== e.to && orthogonal) {
      const a = absolute(e.from);
      const b = absolute(e.to);
      if (direction === "down" && b.y >= a.y + a.h) {
        ports = "exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;";
        points = detour(e.from, e.to, a, b, false);
      } else if (direction === "right" && b.x >= a.x + a.w) {
        ports = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;";
        points = detour(e.from, e.to, a, b, true);
      } else if (direction === "down" && b.y + b.h <= a.y) {
        lanes++;
        const lane = farX + 30 * lanes;
        ports = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;";
        points = `<Array as="points"><mxPoint x="${lane}" y="${a.y + a.h / 2}"/><mxPoint x="${lane}" y="${b.y + b.h / 2}"/></Array>`;
      } else if (direction === "right" && b.x + b.w <= a.x) {
        lanes++;
        const lane = farY + 30 * lanes;
        ports = "exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;";
        points = `<Array as="points"><mxPoint x="${a.x + a.w / 2}" y="${lane}"/><mxPoint x="${b.x + b.w / 2}" y="${lane}"/></Array>`;
      }
    }
    cells.push(
      `<mxCell id="${escapeXml(id)}" value="${escapeXml(htmlLabel(e.label ?? ""))}" style="${escapeXml(edgeStyle(e, ports))}" edge="1" parent="1" source="${escapeXml(e.from)}" target="${escapeXml(e.to)}">${points ? `<mxGeometry relative="1" as="geometry">${points}</mxGeometry>` : `<mxGeometry relative="1" as="geometry"/>`}</mxCell>`
    );
  });
  const name = page.name ?? `Page-${pageIndex + 1}`;
  return `<diagram id="page-${pageIndex + 1}" name="${escapeXml(name)}"><mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("")}</root></mxGraphModel></diagram>`;
}
function buildXml(pages) {
  const body = pages.map((p, i) => pageXml(p, i, pages.length > 1 ? `pages[${i}]` : "\u30DA\u30FC\u30B8")).join("");
  return `<mxfile host="pkm-kit" agent="pkm-diagram-cli" version="1">${body}</mxfile>`;
}

// src/core/author.ts
function xmlFromInput(text) {
  const t = text.replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>[]*>\s*)?<svg[\s>]/.test(t)) {
    const r = extractDiagramXml(t);
    if (r.kind !== "diagram") throw new DrawioFormatError("\u7DE8\u96C6\u7528 XML \u304C\u306A\u3044\uFF08\u666E\u901A\u306E SVG\uFF09");
    return r.xml;
  }
  const xml = t.replace(/^<\?xml[^>]*\?>\s*/, "").trim();
  if (!/^<(mxfile|mxGraphModel)[\s>/]/.test(xml)) throw new DrawioFormatError("\u56F3\u306E SVG\u30FB.drawio\u30FB<mxfile> \u306E XML \u306E\u3069\u308C\u3067\u3082\u306A\u3044");
  return xml;
}
async function renderDiagram(xml, pageNumber = 1) {
  const pages = await parseDiagramFile(xml);
  const page = pages[pageNumber - 1];
  if (!page) throw new DrawioFormatError(`\u30DA\u30FC\u30B8 ${pageNumber} \u304C\u306A\u3044\uFF08${pages.length} \u30DA\u30FC\u30B8\uFF09`);
  const rendered = renderPage(page);
  const svg = drawioSvg(xml, rendered);
  verify(svg, xml);
  return { svg, pages: pages.length, warnings: rendered.warnings };
}
async function buildDiagram(spec) {
  const xml = buildXml(readSpec(spec));
  const r = await renderDiagram(xml);
  return { ...r, xml };
}
function verify(svg, xml) {
  if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG \u304C\u5927\u304D\u3059\u304E\u308B\uFF0810 MiB \u307E\u3067\uFF09");
  const back = extractDiagramXml(svg);
  if (back.kind !== "diagram" || back.xml !== xml.trim()) throw new DrawioFormatError("\u66F8\u3044\u305F SVG \u304B\u3089\u540C\u3058\u7DE8\u96C6\u7528 XML \u3092\u8AAD\u3081\u306A\u3044");
  if (countPages(back.xml) !== countPages(xml)) throw new DrawioFormatError("\u30DA\u30FC\u30B8\u306E\u6570\u304C\u5408\u308F\u306A\u3044");
  const problems = findSvgProblems(toSharingSvg(svg));
  if (problems.errors.length > 0) throw new DrawioFormatError(`\u63CF\u753B\u306B\u4F7F\u3048\u306A\u3044\u3082\u306E\u304C\u3042\u308B: ${problems.errors.join("\u3001")}`);
}
function short(text, max = 60) {
  const one = text.replace(/\s*\n\s*/g, " / ");
  return one.length > max ? `${one.slice(0, max - 1)}\u2026` : one;
}
function describeCell(c, byId) {
  const label = labelText(c);
  if (c.edge && !c.vertex) {
    const from = c.source ?? "(\u70B9)";
    const to = c.target ?? "(\u70B9)";
    const via = c.geometry?.points.length ? ` \u7D4C\u7531 ${c.geometry.points.length} \u70B9` : "";
    return `  ${c.id}  \u8FBA ${from} -> ${to}${label ? `  "${short(label)}"` : ""}${via}`;
  }
  if (!c.vertex) return null;
  const parent = c.parent ? byId.get(c.parent) : void 0;
  if (parent?.edge) return `  ${c.id}  \u8FBA\u306E\u30E9\u30D9\u30EB\uFF08${parent.id}\uFF09  "${short(label)}"`;
  const b = vertexBox(c, byId);
  const geo = b ? `  x=${Math.round(b.x)} y=${Math.round(b.y)} w=${Math.round(b.w)} h=${Math.round(b.h)}` : "";
  const inside = parent?.vertex ? `  \u4E2D: ${parent.id}` : "";
  return `  ${c.id}  ${shapeName(c)}${label ? `  "${short(label)}"` : ""}${geo}${inside}`;
}
async function inspectDiagram(xml) {
  const pages = await parseDiagramFile(xml);
  const lines = [`\u30DA\u30FC\u30B8 ${pages.length}`];
  pages.forEach((p, i) => {
    const byId = new Map(p.cells.map((c) => [c.id, c]));
    const shown = p.cells.map((c) => describeCell(c, byId)).filter((l) => l !== null);
    lines.push(`[${i + 1}] ${p.name}\uFF08id ${p.id}\u3001\u30BB\u30EB ${shown.length}\uFF09`);
    lines.push(...shown);
    const { warnings } = renderPage(p);
    for (const w of warnings) lines.push(`  ! ${w}`);
  });
  return lines.join("\n");
}

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
var FONT2 = 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif';
var SHAPES2 = ["rect", "ellipse", "circle", "polygon", "path"];
function shapeSel(scope) {
  return SHAPES2.map((s) => `${scope} > ${s}`).join(", ");
}
function rules(p) {
  const n = p.neutral;
  const out = [
    `text { font-family: ${FONT2}; font-size: ${TEXT_PX.base}px; fill: ${n.text}; }`,
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
  diagram.mjs extract <\u56F3.drawio.svg> [--plain]
  diagram.mjs strip <\u56F3.drawio.svg> [--output <\u30D1\u30B9>]
  diagram.mjs build <spec.json|-> --output <asset/\u540D\u524D.drawio.svg> [--force]
  diagram.mjs render <\u56F3.drawio.svg|.drawio|.xml> [--output <\u56F3.drawio.svg>] [--page <N>]
  diagram.mjs inspect <\u56F3.drawio.svg|.drawio|.xml>
  diagram.mjs svg-style <\u56F3.svg> [--output <\u56F3.svg>]
  diagram.mjs svg-check <\u56F3.svg\u2026> [--allow-colors]
  diagram.mjs d2 <\u56F3.d2> [--output <\u56F3.svg>] [--layout elk|dagre] [--d2 <d2 \u30B3\u30DE\u30F3\u30C9>]`;
var FLAGS = /* @__PURE__ */ new Set(["force", "plain", "allow-colors"]);
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
async function runSvg(command, positional, options, io) {
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
    io.out(options.has("plain") ? await decompressDiagramFile(r.xml) : r.xml);
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
function warn(io, warnings) {
  for (const w of warnings) io.err(`\u8B66\u544A: ${w}`);
}
function checkDiagramOutput(output, io) {
  if (!output.toLowerCase().endsWith(".drawio.svg")) {
    io.err(`${output}: \u66F8\u304D\u51FA\u3057\u5148\u306F .drawio.svg \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    return false;
  }
  return true;
}
async function runBuild(positional, options, io) {
  const [input] = positional;
  const output = options.get("output");
  if (!input || positional.length > 1 || output === void 0) {
    io.err(USAGE);
    return 2;
  }
  if (!checkDiagramOutput(output, io)) return 2;
  const full = resolve(io.cwd, output);
  if (existsSync(full) && !options.has("force")) {
    io.err(`${output} \u306F\u65E2\u306B\u3042\u308A\u307E\u3059\uFF08\u4E0A\u66F8\u304D\u3059\u308B\u306A\u3089 --force\u3002\u4ECA\u306E\u56F3\u3092\u76F4\u3059\u306A\u3089 extract \u2192 render\uFF09`);
    return 1;
  }
  let text;
  if (input === "-") {
    if (!io.stdin) throw new Error("\u6A19\u6E96\u5165\u529B\u3092\u8AAD\u3081\u306A\u3044");
    text = await io.stdin();
  } else {
    text = readFileSync(resolve(io.cwd, input), "utf8");
  }
  let spec;
  try {
    spec = JSON.parse(text);
  } catch (e) {
    io.err(`\u30A8\u30E9\u30FC: spec \u3092 JSON \u3068\u3057\u3066\u8AAD\u3081\u306A\u3044\uFF08${e instanceof Error ? e.message : String(e)}\uFF09`);
    return 1;
  }
  const r = await buildDiagram(spec);
  warn(io, r.warnings);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, r.svg);
  io.out(`${relative(io.cwd, full) || full}\uFF08\u30DA\u30FC\u30B8 ${r.pages}\uFF09`);
  return 0;
}
async function runRender(positional, options, io) {
  const [input] = positional;
  if (!input || positional.length > 1) {
    io.err(USAGE);
    return 2;
  }
  const inputFull = resolve(io.cwd, input);
  const output = options.get("output");
  const outFull = output === void 0 ? inputFull : resolve(io.cwd, output);
  if (!checkDiagramOutput(output ?? input, io)) return 2;
  const page = options.has("page") ? Number(options.get("page")) : 1;
  if (!Number.isInteger(page) || page < 1) {
    io.err("--page \u306F 1 \u4EE5\u4E0A\u306E\u6574\u6570");
    return 2;
  }
  const r = await renderDiagram(xmlFromInput(readFileSync(inputFull, "utf8")), page);
  warn(io, r.warnings);
  const before = existsSync(outFull) ? readFileSync(outFull, "utf8") : null;
  if (before === r.svg) {
    io.out(`${relative(io.cwd, outFull) || outFull}\uFF08\u5909\u308F\u3089\u306A\u3044\uFF09`);
    return 0;
  }
  mkdirSync(dirname(outFull), { recursive: true });
  writeFileSync(outFull, r.svg);
  io.out(`${relative(io.cwd, outFull) || outFull}\uFF08\u30DA\u30FC\u30B8 ${r.pages}\u3001\u63CF\u3044\u305F\u306E\u306F ${page} \u30DA\u30FC\u30B8\u76EE\uFF09`);
  return 0;
}
async function runInspect(positional, io) {
  const [input] = positional;
  if (!input || positional.length > 1) {
    io.err(USAGE);
    return 2;
  }
  io.out(await inspectDiagram(xmlFromInput(readFileSync(resolve(io.cwd, input), "utf8"))));
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
\uFF08svg-style \u306F AI \u304C\u66F8\u3044\u305F .svg \u306B\u4F7F\u3046\u3002.drawio.svg \u306F render\uFF09`);
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
    io.err("--output \u306F .svg\uFF08.drawio.svg \u3067\u306F\u306A\u3044\uFF09");
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
      case "extract":
      case "strip":
        return await runSvg(command, positional, options, io);
      case "build":
        return await runBuild(positional, options, io);
      case "render":
        return await runRender(positional, options, io);
      case "inspect":
        return await runInspect(positional, io);
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
    io.err(`\u30A8\u30E9\u30FC: ${e instanceof DrawioFormatError ? e.message : e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}
var invoked = process.argv[1] ?? "";
if (/(diagram|drawio)\.(mjs|ts)$/.test(invoked)) {
  process.exitCode = await main(process.argv.slice(2), {
    cwd: process.cwd(),
    out: (t) => process.stdout.write(`${t}
`),
    err: (t) => process.stderr.write(`${t}
`),
    stdin: async () => {
      const chunks = [];
      for await (const c of process.stdin) chunks.push(c);
      return Buffer.concat(chunks).toString("utf8");
    }
  });
}
export {
  main
};
