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
  default: () => PkmTemplatePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian9 = require("obsidian");

// ../shared/src/list-pane.ts
var LIST_VIEW_PREFIXES = ["pkm-task-", "pkm-template-"];
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

// src/obsidian/CreateNoteModal.tsx
var import_obsidian2 = require("obsidian");

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

// src/core/date-format.ts
var WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
var TOKEN_RE = /\[([^\]]*)\]|YYYY|YY|MM|M|ddd|DDD|DD|D|HH|H|mm|m|ss|s|Z/g;
function pad2(n2) {
  return String(Math.trunc(Math.abs(n2))).padStart(2, "0");
}
function formatOffset(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return `${sign}${pad2(offset / 60)}:${pad2(offset % 60)}`;
}
function formatDateTime(date, format = "YYYY-MM-DD") {
  return format.replace(TOKEN_RE, (match, literal) => {
    if (literal !== void 0) return literal;
    switch (match) {
      case "YYYY":
        return String(date.getFullYear()).padStart(4, "0");
      case "YY":
        return String(date.getFullYear()).slice(-2);
      case "MM":
        return pad2(date.getMonth() + 1);
      case "M":
        return String(date.getMonth() + 1);
      case "ddd":
        return WEEKDAYS[date.getDay()] ?? "sun";
      case "DDD":
        return (WEEKDAYS[date.getDay()] ?? "sun").toUpperCase();
      case "DD":
        return pad2(date.getDate());
      case "D":
        return String(date.getDate());
      case "HH":
        return pad2(date.getHours());
      case "H":
        return String(date.getHours());
      case "mm":
        return pad2(date.getMinutes());
      case "m":
        return String(date.getMinutes());
      case "ss":
        return pad2(date.getSeconds());
      case "s":
        return String(date.getSeconds());
      case "Z":
        return formatOffset(date);
      default:
        return match;
    }
  });
}

// src/core/ids.ts
var ID_PREFIXES = ["i", "r", "m"];
function isIdPrefix(value) {
  return ID_PREFIXES.includes(value);
}
function idNumber(id, prefix) {
  const m3 = new RegExp(`^${prefix}-([1-9]\\d*)$`).exec(id);
  return m3 ? Number(m3[1]) : null;
}
function nextId(prefix, existingNames) {
  let max = 0;
  for (const name of existingNames) {
    const n2 = idNumber(name, prefix);
    if (n2 !== null && n2 > max) max = n2;
  }
  return `${prefix}-${max + 1}`;
}

// src/core/template.ts
var PLACEHOLDER_RE = /\{\{([^{}\n]+)\}\}/g;
function parsePromptSpec(body) {
  if (!body.startsWith("prompt:")) return null;
  const rest = body.slice("prompt:".length);
  const colon = rest.indexOf(":");
  const label = (colon === -1 ? rest : rest.slice(0, colon)).trim();
  const defaultValue = colon === -1 ? "" : rest.slice(colon + 1);
  if (!label) return null;
  return { label, defaultValue };
}
function extractPrompts(template) {
  const seen = /* @__PURE__ */ new Set();
  const fields = [];
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const spec = parsePromptSpec((match[1] ?? "").trim());
    if (!spec || seen.has(spec.label)) continue;
    seen.add(spec.label);
    fields.push(spec);
  }
  return fields;
}
var DEFAULT_DATE_PROMPT_LABEL = "\u65E5\u4ED8";
function parseDatePromptSpec(body) {
  if (body === "prompt-date") return DEFAULT_DATE_PROMPT_LABEL;
  if (!body.startsWith("prompt-date:")) return null;
  return body.slice("prompt-date:".length).trim() || DEFAULT_DATE_PROMPT_LABEL;
}
function extractDatePrompts(template) {
  const labels = [];
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const label = parseDatePromptSpec((match[1] ?? "").trim());
    if (label !== null && !labels.includes(label)) labels.push(label);
  }
  return labels;
}
function expandInlineToken(token, ctx) {
  if (token === "date") return formatDateTime(ctx.now, "YYYY-MM-DD");
  if (token.startsWith("date:")) return formatDateTime(ctx.now, token.slice("date:".length) || "YYYY-MM-DD");
  if (token === "time") return formatDateTime(ctx.now, "HH:mm");
  if (token.startsWith("time:")) return formatDateTime(ctx.now, token.slice("time:".length) || "HH:mm");
  if (token === "title") return ctx.title;
  if (token === "path") return ctx.path;
  if (token === "folder") return ctx.folder;
  if (token.startsWith("id:")) {
    const prefix = token.slice("id:".length).trim();
    return isIdPrefix(prefix) ? nextId(prefix, ctx.takenNames ?? []) : null;
  }
  const dateLabel = parseDatePromptSpec(token);
  if (dateLabel !== null) return ctx.dates?.[dateLabel] ?? null;
  const prompt = parsePromptSpec(token);
  if (prompt) {
    const val = ctx.prompts[prompt.label];
    return val !== void 0 && val !== "" ? val : prompt.defaultValue;
  }
  return null;
}
function frontmatterEnd(template) {
  if (!/^---\r?\n/.test(template)) return -1;
  const close = /\r?\n---[ \t]*(?:\r?\n|$)/.exec(template.slice(3));
  return close ? 3 + close.index : -1;
}
function quoteAt(template, position) {
  const lineStart = template.lastIndexOf("\n", position - 1) + 1;
  let quote = null;
  for (let i3 = lineStart; i3 < position; i3++) {
    const c3 = template[i3];
    if (quote === '"') {
      if (c3 === "\\") i3++;
      else if (c3 === '"') quote = null;
    } else if (quote === "'") {
      if (c3 === "'" && template[i3 + 1] === "'") i3++;
      else if (c3 === "'") quote = null;
    } else if (c3 === '"' || c3 === "'") quote = c3;
  }
  return quote;
}
function escapeForQuote(value, quote) {
  return quote === '"' ? JSON.stringify(value).slice(1, -1) : value.replace(/'/g, "''");
}
function renderTemplate(template, ctx) {
  let out = "";
  let cursorOffset = null;
  let lastIndex = 0;
  const fmEnd = frontmatterEnd(template);
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const index = match.index ?? 0;
    const full = match[0];
    const token = (match[1] ?? "").trim();
    out += template.slice(lastIndex, index);
    lastIndex = index + full.length;
    if (token === "cursor") {
      if (cursorOffset === null) cursorOffset = out.length;
      continue;
    }
    const expanded = expandInlineToken(token, ctx);
    if (expanded === null) {
      out += full;
      continue;
    }
    const quote = index < fmEnd ? quoteAt(template, index) : null;
    out += quote ? escapeForQuote(expanded, quote) : expanded;
  }
  out += template.slice(lastIndex);
  return { content: out, cursorOffset };
}
var ID_FILE_NAME_RE = /\{\{\s*id:[irm]\s*\}\}/;
function usesIdFileName(fileNamePattern) {
  return ID_FILE_NAME_RE.test(fileNamePattern);
}
function expandPathPattern(pattern, now, title, prompts, takenNames = []) {
  return pattern.replace(PLACEHOLDER_RE, (full, raw) => {
    const token = raw.trim();
    const expanded = expandInlineToken(token, { now, title, path: "", folder: "", prompts, takenNames });
    return expanded !== null ? expanded : full;
  });
}
function validateSegments(segments) {
  for (const seg of segments) {
    if (!seg || seg === ".") return "\u30D1\u30B9\u306B\u7A7A\u306E\u968E\u5C64\u304C\u3042\u308A\u307E\u3059";
    if (seg === "..") return "\u30D1\u30B9\u306B .. \u306F\u4F7F\u3048\u307E\u305B\u3093";
    if (seg.startsWith(".")) return `\u96A0\u3057\u30D5\u30A9\u30EB\u30C0\u30FB\u96A0\u3057\u30D5\u30A1\u30A4\u30EB\uFF08${seg}\uFF09\u306B\u306F\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093`;
    if (/[\\:*?"<>|]/.test(seg)) return `\u30D5\u30A1\u30A4\u30EB\u540D\u306B\u4F7F\u3048\u306A\u3044\u6587\u5B57\u304C\u542B\u307E\u308C\u3066\u3044\u307E\u3059: ${seg}`;
  }
  return null;
}
function resolveOutputPath(input) {
  if (usesIdFileName(input.fileNamePattern)) return resolveIdOutputPath(input);
  const rawNameInput = input.titleInput.trim();
  const rawBaseName = rawNameInput || expandPathPattern(input.fileNamePattern.trim(), input.now, "", input.prompts).trim();
  if (!rawBaseName) {
    return { path: "", folder: "", fileName: "", title: "", error: "\u30D5\u30A1\u30A4\u30EB\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" };
  }
  const prelimTitle = (rawBaseName.split("/").pop() ?? rawBaseName).replace(/\.md$/i, "").trim();
  const expandedName = expandPathPattern(rawBaseName, input.now, prelimTitle, input.prompts).trim();
  const expandedFolder = expandPathPattern(input.folder.trim(), input.now, prelimTitle, input.prompts).trim().replace(/^\/+|\/+$/g, "");
  if (expandedName.startsWith("/") || input.folder.trim().startsWith("/")) {
    return { path: "", folder: "", fileName: "", title: "", error: "\u30D1\u30B9\u306E\u5148\u982D\u306B / \u306F\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093" };
  }
  const combined = expandedFolder ? `${expandedFolder}/${expandedName}` : expandedName;
  const rawSegments = combined.split("/");
  const lastSeg = rawSegments.pop() ?? "";
  const title = lastSeg.replace(/\.md$/i, "").trim();
  if (!title) {
    return { path: "", folder: "", fileName: "", title: "", error: "\u30D5\u30A1\u30A4\u30EB\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" };
  }
  const fileName = `${title}.md`;
  const allSegments = [...rawSegments, fileName];
  const error = validateSegments(allSegments);
  if (error) {
    return { path: "", folder: "", fileName: "", title: "", error };
  }
  const folder = rawSegments.join("/");
  const path = allSegments.join("/");
  return { path, folder, fileName, title, error: null };
}
function resolveIdOutputPath(input) {
  const fail = (error2) => ({ path: "", folder: "", fileName: "", title: "", error: error2 });
  const title = input.titleInput.trim();
  if (!title) return fail("\u30BF\u30A4\u30C8\u30EB\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
  const takenNames = input.takenNames ?? [];
  const name = expandPathPattern(input.fileNamePattern.trim(), input.now, title, input.prompts, takenNames).trim().replace(/\.md$/i, "");
  const folder = expandPathPattern(input.folder.trim(), input.now, title, input.prompts, takenNames).trim().replace(/^\/+|\/+$/g, "");
  if (input.folder.trim().startsWith("/")) return fail("\u30D1\u30B9\u306E\u5148\u982D\u306B / \u306F\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093");
  const folderSegments = folder ? folder.split("/") : [];
  const fileName = `${name}.md`;
  const error = validateSegments([...folderSegments, fileName]);
  if (error) return fail(error);
  return { path: [...folderSegments, fileName].join("/"), folder, fileName, title, error: null };
}
var DEFAULT_DAILY_FOLDER = "daily/{{date:YYYY}}/{{date:MM}}";
var DEFAULT_DAILY_PATTERN = "{{date:YYYY-MM-DD}}";
function resolveDailyPath(entry, now) {
  return resolveOutputPath({
    folder: entry?.folder || DEFAULT_DAILY_FOLDER,
    fileNamePattern: entry?.fileNamePattern || DEFAULT_DAILY_PATTERN,
    titleInput: "",
    now,
    prompts: {}
  });
}
function offsetToPos(text2, offset) {
  const clamped = Math.max(0, Math.min(offset, text2.length));
  const lines = text2.slice(0, clamped).split("\n");
  return {
    line: lines.length - 1,
    ch: (lines.at(-1) ?? "").length
  };
}

// src/obsidian/DatePromptModal.tsx
var import_obsidian = require("obsidian");

// ../shared/src/dates.ts
var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
var DAY_MS = 864e5;
var WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function toEpochDay(date) {
  const m3 = DATE_RE.exec(date);
  if (!m3) return null;
  const y3 = Number(m3[1]);
  const mo = Number(m3[2]);
  const d3 = Number(m3[3]);
  const t3 = Date.UTC(y3, mo - 1, d3);
  const back = new Date(t3);
  if (back.getUTCFullYear() !== y3 || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d3) return null;
  return t3 / DAY_MS;
}
function fromEpochDay(day) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}
function isLocalDate(value) {
  return typeof value === "string" && toEpochDay(value) !== null;
}
function requireDay(date) {
  const day = toEpochDay(date);
  if (day === null) throw new RangeError(`\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${date}`);
  return day;
}
function addDays(date, days) {
  return fromEpochDay(requireDay(date) + days);
}
function weekdayOf(date) {
  return new Date(requireDay(date) * DAY_MS).getUTCDay();
}
function localToday(now = /* @__PURE__ */ new Date()) {
  const y3 = now.getFullYear();
  const m3 = String(now.getMonth() + 1).padStart(2, "0");
  const d3 = String(now.getDate()).padStart(2, "0");
  return `${y3}-${m3}-${d3}`;
}
function monthGridDays(month) {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayOf(first));
  return Array.from({ length: 42 }, (_2, i3) => addDays(start, i3));
}

// ../shared/src/date-input.ts
function ymd(year, month, day) {
  const date = `${year}-${month}-${day}`;
  return isLocalDate(date) ? date : null;
}
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function addMonths(date, n2) {
  const [y3, m3, d3] = date.split("-").map(Number);
  const first = new Date(Date.UTC(y3, m3 - 1 + n2, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth() + 1;
  return fromEpochDay(Date.UTC(year, month - 1, Math.min(d3, daysInMonth(year, month))) / 864e5);
}
function addWeekdays(date, weekday, sign, n2) {
  const gap = (sign * (weekday - weekdayOf(date)) + 7) % 7 || 7;
  return addDays(date, sign * (gap + (n2 - 1) * 7));
}
function parseDateInput(input, today) {
  const s3 = input.trim().toLowerCase();
  const separated = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(s3);
  if (separated) return ymd(separated[1], separated[2], separated[3]);
  if (/^\d+$/.test(s3)) {
    const [year, month] = today.split("-");
    if (s3.length === 2) return ymd(year, month, s3);
    if (s3.length === 4) return ymd(year, s3.slice(0, 2), s3.slice(2));
    if (s3.length === 6) return ymd(`20${s3.slice(0, 2)}`, s3.slice(2, 4), s3.slice(4));
    if (s3.length === 8) return ymd(s3.slice(0, 4), s3.slice(4, 6), s3.slice(6));
    return null;
  }
  const bare = WEEKDAY_NAMES.indexOf(s3);
  if (bare >= 0) return addWeekdays(today, bare, 1, 1);
  const m3 = /^([+-])(\d*)([a-z]*)$/.exec(s3);
  if (!m3) return null;
  const sign = m3[1] === "+" ? 1 : -1;
  const digits = m3[2];
  const unit = m3[3];
  const n2 = digits === "" ? 1 : Number(digits);
  if (unit === "") return digits === "" ? null : addDays(today, sign * n2);
  if (unit === "w") return addDays(today, sign * n2 * 7);
  if (unit === "m") return addMonths(today, sign * n2);
  const weekday = WEEKDAY_NAMES.indexOf(unit);
  if (weekday < 0 || n2 < 1) return null;
  return addWeekdays(today, weekday, sign, n2);
}

// src/core/date-prompt.ts
function parseDatePromptInput(input, today) {
  const words = input.trim().split(/\s+/).filter((w3) => w3 !== "");
  const weekday = words.some((w3) => w3.toLowerCase() === "-d");
  const rest = words.filter((w3) => w3.toLowerCase() !== "-d");
  if (rest.length === 0) return { date: today, weekday };
  if (rest.length > 1) return null;
  const date = parseDateInput(rest[0], today);
  return date === null ? null : { date, weekday };
}
function formatPromptDate(date, weekday) {
  return weekday ? `${date} ${(WEEKDAY_NAMES[weekdayOf(date)] ?? "sun").toUpperCase()}` : date;
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

// src/obsidian/DatePromptModal.tsx
function MonthCalendar(props) {
  const today = localToday();
  const { month } = props;
  const shift = (n2) => {
    const [y3, m3] = month.split("-").map(Number);
    props.onMonth(new Date(Date.UTC(y3, m3 - 1 + n2, 1)).toISOString().slice(0, 7));
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-calendar", children: [
    /* @__PURE__ */ u3("div", { class: "vt-tpl-calendar-nav", children: [
      /* @__PURE__ */ u3("button", { type: "button", "aria-label": "\u524D\u306E\u6708", onClick: () => shift(-1), children: "\u2039" }),
      /* @__PURE__ */ u3("span", { children: month.replace("-", " / ") }),
      /* @__PURE__ */ u3("button", { type: "button", "aria-label": "\u6B21\u306E\u6708", onClick: () => shift(1), children: "\u203A" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-tpl-calendar-grid", children: [
      WEEKDAY_NAMES.map((w3) => /* @__PURE__ */ u3("span", { class: "vt-tpl-weekday", children: w3 })),
      monthGridDays(month).map((d3) => {
        const w3 = weekdayOf(d3);
        const cls = ["vt-tpl-day"];
        if (w3 === 0 || w3 === 6) cls.push("is-weekend");
        if (!d3.startsWith(month)) cls.push("is-dimmed");
        if (d3 === today) cls.push("is-today");
        if (d3 === props.selected) cls.push("is-selected");
        const label = d3 === today ? `${d3}\uFF08\u4ECA\u65E5\uFF09` : d3;
        return /* @__PURE__ */ u3("button", { type: "button", class: cls.join(" "), "aria-pressed": d3 === props.selected, "aria-label": label, title: label, onClick: () => props.onPick(d3), children: Number(d3.slice(8, 10)) });
      })
    ] })
  ] });
}
function DatePromptForm(props) {
  const today = localToday();
  const [text2, setText] = d2("");
  const [weekdayChecked, setWeekdayChecked] = d2(false);
  const [month, setMonth] = d2(today.slice(0, 7));
  const ref = A2(null);
  h2(() => ref.current?.focus(), []);
  const parsed = parseDatePromptInput(text2, today);
  const weekday = weekdayChecked || parsed?.weekday === true;
  const output = parsed ? formatPromptDate(parsed.date, weekday) : null;
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-tpl-modal",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (output !== null) props.onSubmit(output);
      },
      children: [
        /* @__PURE__ */ u3("div", { class: "vt-tpl-section", children: [
          /* @__PURE__ */ u3(
            "input",
            {
              ref,
              type: "text",
              class: "vt-tpl-input",
              "aria-label": "\u65E5\u4ED8",
              placeholder: "\u4F8B: 15 / 1224 / +3 / mon / +2w / +2 -d",
              value: text2,
              onInput: (e3) => {
                const value = e3.currentTarget.value;
                setText(value);
                const next = parseDatePromptInput(value, today);
                if (next !== null) setMonth(next.date.slice(0, 7));
              }
            }
          ),
          /* @__PURE__ */ u3("div", { class: `vt-tpl-preview${output === null ? " is-error" : ""}`, "aria-live": "polite", children: output === null ? "\u65E5\u4ED8\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093" : `\u5165\u308B\u5024: ${output}` }),
          /* @__PURE__ */ u3("label", { class: "vt-tpl-check", children: [
            /* @__PURE__ */ u3("input", { type: "checkbox", checked: weekday, disabled: parsed?.weekday === true, onChange: (e3) => setWeekdayChecked(e3.currentTarget.checked) }),
            "\u66DC\u65E5\u3092\u4ED8\u3051\u308B\uFF08-d\uFF09"
          ] })
        ] }),
        /* @__PURE__ */ u3(
          MonthCalendar,
          {
            month,
            onMonth: setMonth,
            selected: parsed?.date ?? null,
            onPick: (d3) => props.onSubmit(formatPromptDate(d3, weekday))
          }
        ),
        /* @__PURE__ */ u3("div", { class: "vt-tpl-actions", children: [
          !import_obsidian.Platform.isMobile && /* @__PURE__ */ u3("span", { class: "vt-tpl-hint", children: "Enter \u3067\u633F\u5165" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "vt-tpl-button is-primary", disabled: output === null, children: "\u633F\u5165" })
        ] })
      ]
    }
  );
}
var DatePromptModal = class extends import_obsidian.Modal {
  constructor(app, label, resolve) {
    super(app);
    this.label = label;
    this.resolve = resolve;
  }
  label;
  resolve;
  done = false;
  onOpen() {
    this.setTitle(this.label);
    R(
      /* @__PURE__ */ u3(
        DatePromptForm,
        {
          onSubmit: (value) => {
            this.done = true;
            this.close();
            this.resolve(value);
          }
        }
      ),
      this.contentEl
    );
  }
  onClose() {
    R(null, this.contentEl);
    if (!this.done) this.resolve(null);
  }
};
async function askDates(app, labels) {
  const values = {};
  for (const label of labels) {
    const value = await new Promise((resolve) => new DatePromptModal(app, label, resolve).open());
    if (value === null) return null;
    values[label] = value;
  }
  return values;
}

// src/obsidian/CreateNoteModal.tsx
function templateLabel(file) {
  return file.replace(/\.md$/i, "");
}
function CreateNoteForm(props) {
  const { templates, manager, onCreated, onReport } = props;
  const [selectedIdx, setSelectedIdx] = d2(0);
  const [titleInput, setTitleInput] = d2("");
  const [promptValues, setPromptValues] = d2({});
  const [submitting, setSubmitting] = d2(false);
  const titleRef = A2(null);
  const now = T2(() => /* @__PURE__ */ new Date(), []);
  const takenNames = T2(() => manager.takenNames(), [manager]);
  h2(() => {
    titleRef.current?.focus();
  }, [selectedIdx]);
  if (templates.length === 0) {
    return /* @__PURE__ */ u3("div", { class: "vt-tpl-empty", children: "\u6709\u52B9\u306A\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u30D7\u30E9\u30B0\u30A4\u30F3\u8A2D\u5B9A\u3001template/file/\u3001.kit/templates/file/ \u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002" });
  }
  const current = templates[selectedIdx] ?? templates[0];
  const idFileName = usesIdFileName(current.entry.fileNamePattern);
  const defaultFileNameHint = !idFileName && current.entry.fileNamePattern ? formatDateTime(now, current.entry.fileNamePattern.replace(/\{\{date(?::([^{}]+))?\}\}/g, (_2, f4) => f4 || "YYYY-MM-DD")) : "";
  const resolved = resolveOutputPath({
    folder: current.entry.folder,
    fileNamePattern: current.entry.fileNamePattern,
    titleInput,
    now,
    prompts: promptValues,
    takenNames
  });
  const alreadyExists = !resolved.error && resolved.path ? manager.fileExists(resolved.path) : false;
  const errorMessage = resolved.error ?? (alreadyExists ? `\u3059\u3067\u306B\u540C\u3058\u540D\u524D\u306E\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u3059: ${resolved.path}` : null);
  const canSubmit = !submitting && !errorMessage && Boolean(resolved.path);
  const submit = (newTab) => {
    if (!canSubmit) return;
    setSubmitting(true);
    void askDates(props.app, current.datePrompts).then(async (dates) => {
      if (dates === null) {
        setSubmitting(false);
        return;
      }
      await manager.createNoteFromTemplate({
        template: current,
        titleInput,
        prompts: promptValues,
        dates,
        now,
        newTab
      });
      onCreated();
    }).catch((err) => {
      setSubmitting(false);
      onReport("\u30CE\u30FC\u30C8\u3092\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", err);
    });
  };
  const handleKeyDown = (e3) => {
    if (e3.isComposing) return;
    if (e3.altKey && (e3.key === "ArrowUp" || e3.key === "ArrowDown")) {
      e3.preventDefault();
      const next = (selectedIdx + (e3.key === "ArrowDown" ? 1 : templates.length - 1)) % templates.length;
      setSelectedIdx(next);
      return;
    }
    if (e3.key === "Enter" && (e3.metaKey || e3.ctrlKey)) {
      e3.preventDefault();
      submit(e3.shiftKey);
    }
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-modal", onKeyDown: handleKeyDown, children: [
    /* @__PURE__ */ u3("div", { class: "vt-tpl-section", children: [
      /* @__PURE__ */ u3("div", { class: "vt-tpl-label", children: "TEMPLATE" }),
      /* @__PURE__ */ u3("div", { class: "vt-tpl-chips", role: "listbox", "aria-label": "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u9078\u629E", children: templates.map((tpl, i3) => {
        const active = i3 === selectedIdx;
        return /* @__PURE__ */ u3(
          "button",
          {
            type: "button",
            role: "option",
            "aria-selected": active,
            class: `vt-tpl-chip${active ? " is-active" : ""}`,
            onClick: () => setSelectedIdx(i3),
            children: /* @__PURE__ */ u3("span", { children: templateLabel(tpl.entry.file) })
          },
          tpl.entry.file
        );
      }) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-tpl-section", children: [
      /* @__PURE__ */ u3("label", { class: "vt-tpl-label", for: "vt-tpl-title-input", children: idFileName ? "\u30BF\u30A4\u30C8\u30EB" : "\u30D5\u30A1\u30A4\u30EB\u540D / \u30BF\u30A4\u30C8\u30EB" }),
      /* @__PURE__ */ u3(
        "input",
        {
          id: "vt-tpl-title-input",
          ref: titleRef,
          type: "text",
          class: "vt-tpl-input",
          placeholder: idFileName ? "\u30BF\u30A4\u30C8\u30EB\u3092\u5165\u529B\uFF08\u30D5\u30A1\u30A4\u30EB\u540D\u306F ID \u3067\u6C7A\u307E\u308A\u307E\u3059\uFF09" : defaultFileNameHint ? `\u7A7A\u6B04\u306A\u3089 ${defaultFileNameHint}` : "\u30BF\u30A4\u30C8\u30EB\u3092\u5165\u529B\uFF08\u4F8B: my-note\uFF09",
          value: titleInput,
          onInput: (e3) => setTitleInput(e3.currentTarget.value),
          onKeyDown: (e3) => {
            if (e3.key === "Enter" && !e3.metaKey && !e3.ctrlKey && !e3.isComposing && current.prompts.length === 0) {
              e3.preventDefault();
              submit(e3.shiftKey);
            }
          }
        }
      )
    ] }),
    current.prompts.map((prompt, idx) => {
      const inputId = `vt-tpl-prompt-${idx}`;
      const isLast = idx === current.prompts.length - 1;
      return /* @__PURE__ */ u3("div", { class: "vt-tpl-section", children: [
        /* @__PURE__ */ u3("label", { class: "vt-tpl-label", for: inputId, children: prompt.label }),
        /* @__PURE__ */ u3(
          "input",
          {
            id: inputId,
            type: "text",
            class: "vt-tpl-input",
            placeholder: prompt.defaultValue ? `\u65E2\u5B9A\u5024: ${prompt.defaultValue}` : `${prompt.label}\u3092\u5165\u529B`,
            value: promptValues[prompt.label] ?? "",
            onInput: (e3) => setPromptValues((prev) => ({
              ...prev,
              [prompt.label]: e3.currentTarget.value
            })),
            onKeyDown: (e3) => {
              if (isLast && e3.key === "Enter" && !e3.metaKey && !e3.ctrlKey && !e3.isComposing) {
                e3.preventDefault();
                submit(e3.shiftKey);
              }
            }
          }
        )
      ] }, prompt.label);
    }),
    /* @__PURE__ */ u3("div", { class: "vt-tpl-footer", children: [
      /* @__PURE__ */ u3("div", { class: `vt-tpl-preview${errorMessage ? " is-error" : ""}`, children: errorMessage ? errorMessage : `\u4F5C\u6210\u5148: ${resolved.path}` }),
      /* @__PURE__ */ u3("div", { class: "vt-tpl-actions", children: [
        !import_obsidian2.Platform.isMobile && /* @__PURE__ */ u3("span", { class: "vt-tpl-hint", children: "Enter / Mod+Enter \u3067\u4F5C\u6210" }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-button", disabled: !canSubmit, onClick: () => submit(true), children: "\u65B0\u30BF\u30D6\u3067\u958B\u304F" }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-button is-primary", disabled: !canSubmit, onClick: () => submit(false), children: "\u4F5C\u6210" })
      ] })
    ] })
  ] });
}
var CreateNoteModal = class extends import_obsidian2.Modal {
  constructor(app, manager, templates, onReport) {
    super(app);
    this.manager = manager;
    this.templates = templates;
    this.onReport = onReport;
  }
  manager;
  templates;
  onReport;
  onOpen() {
    this.setTitle("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304B\u3089\u65B0\u898F\u30D5\u30A1\u30A4\u30EB\u3092\u4F5C\u6210");
    R(
      /* @__PURE__ */ u3(
        CreateNoteForm,
        {
          app: this.app,
          templates: this.templates,
          manager: this.manager,
          onCreated: () => this.close(),
          onReport: this.onReport
        }
      ),
      this.contentEl
    );
  }
  onClose() {
    R(null, this.contentEl);
  }
};

// src/obsidian/creator.ts
var import_obsidian3 = require("obsidian");

// src/core/config.ts
var TEMPLATE_DIR = "template/file";
var UPSTREAM_TEMPLATE_DIR = ".kit/templates/file";
var UPSTREAM_TEMPLATE_CONFIG_PATH = ".kit/templates/config.json";
function isValidTemplateFileName(file) {
  return Boolean(file) && file.endsWith(".md") && !file.includes("/") && !file.includes("\\") && !file.startsWith(".");
}
function parseTemplateConfig(text2) {
  const problems = [];
  let data;
  try {
    data = JSON.parse(text2);
  } catch {
    return { templates: [], problems: ["JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093"] };
  }
  const obj = typeof data === "object" && data !== null && !Array.isArray(data) ? data : null;
  if (!obj || !Array.isArray(obj.templates)) {
    return { templates: [], problems: ["templates \u914D\u5217\u304C\u3042\u308A\u307E\u305B\u3093"] };
  }
  const templates = [];
  const seen = /* @__PURE__ */ new Set();
  for (const raw of obj.templates) {
    const item2 = typeof raw === "object" && raw !== null ? raw : {};
    const file = typeof item2.file === "string" ? item2.file.trim() : "";
    if (!isValidTemplateFileName(file)) {
      problems.push(`\u4E0D\u6B63\u306A\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u30D5\u30A1\u30A4\u30EB\u540D\u3067\u3059: ${JSON.stringify(raw)}`);
      continue;
    }
    if (seen.has(file)) {
      problems.push(`\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u8A2D\u5B9A\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059: ${file}`);
      continue;
    }
    seen.add(file);
    templates.push({
      file,
      enabled: typeof item2.enabled === "boolean" ? item2.enabled : true,
      folder: typeof item2.folder === "string" ? item2.folder.trim().replace(/^\/+|\/+$/g, "") : "",
      fileNamePattern: typeof item2.fileNamePattern === "string" ? item2.fileNamePattern.trim() : ""
    });
  }
  return { templates, problems };
}
var defaultEntry = (file) => ({ file, enabled: true, folder: "", fileNamePattern: "" });
function resolveTemplateEntries(params) {
  const actual = new Set(params.files.filter(isValidTemplateFileName));
  const listed = params.upstream.filter((e3) => actual.has(e3.file));
  const listedFiles = new Set(listed.map((e3) => e3.file));
  const rest = [...actual].filter((f4) => !listedFiles.has(f4)).sort((a3, b2) => a3.localeCompare(b2));
  return [...listed.map((e3) => ({ ...e3 })), ...rest.map(defaultEntry)];
}

// src/core/snippet.ts
var SNIPPET_DIR = "template/snippet";
var UPSTREAM_SNIPPET_DIR = ".kit/templates/snippet";
var KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function unquote(value) {
  const v3 = value.trim();
  if (v3.length >= 2 && v3.startsWith('"') && v3.endsWith('"')) return v3.slice(1, -1);
  if (v3.length >= 2 && v3.startsWith("'") && v3.endsWith("'")) return v3.slice(1, -1).replace(/''/g, "'");
  return v3;
}
function parseSnippet(file, text2) {
  const fail = (problem) => ({ snippet: null, problem: `${file}: ${problem}` });
  const open = /^---\r?\n/.exec(text2);
  if (!open) return fail("frontmatter \u304C\u3042\u308A\u307E\u305B\u3093");
  const close = /^---[ \t]*(?:\r?\n|$)/m;
  const rest = text2.slice(open[0].length);
  const m3 = close.exec(rest);
  if (!m3) return fail("frontmatter \u304C\u9589\u3058\u3066\u3044\u307E\u305B\u3093");
  const fm = rest.slice(0, m3.index);
  const body = rest.slice(m3.index + m3[0].length);
  const fields = {};
  for (const line of fm.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):(.*)$/.exec(line);
    if (kv) fields[kv[1]] = unquote(kv[2]);
  }
  for (const key of ["name", "alias"]) {
    const v3 = fields[key];
    if (v3 === void 0 || v3 === "") return fail(`${key} \u304C\u3042\u308A\u307E\u305B\u3093`);
    if (!KEBAB_RE.test(v3)) return fail(`${key} \u306F\u30B1\u30D0\u30D6\u30B1\u30FC\u30B9\u306B\u3057\u307E\u3059\uFF08${v3}\uFF09`);
  }
  return { snippet: { file, name: fields.name, alias: fields.alias, body }, problem: null };
}
function layerSnippets(upstream, local) {
  const byFile = /* @__PURE__ */ new Map();
  for (const s3 of upstream) byFile.set(s3.file, s3);
  for (const s3 of local) byFile.set(s3.file, s3);
  return [...byFile.values()];
}
function filterSnippets(snippets, query) {
  const q2 = query.toLowerCase();
  return snippets.filter((s3) => s3.name.startsWith(q2) || s3.alias.startsWith(q2)).sort((a3, b2) => a3.alias.localeCompare(b2.alias) || a3.name.localeCompare(b2.name));
}
var QUERY_RE = /^\/[A-Za-z0-9-]*$/;
function nextSlashSession(prev, update, doc, newId2) {
  let candidate = null;
  const typed = update.typedSlashAt;
  if (typed !== null && doc.lineStartAt(typed) === typed) candidate = { id: newId2(), from: typed };
  else if (prev) candidate = { id: prev.id, from: update.mapPos(prev.from) };
  if (!candidate) return null;
  const { from } = candidate;
  const { head } = update;
  if (!update.empty || head <= from) return null;
  if (doc.lineStartAt(from) !== from || doc.lineStartAt(head) !== from) return null;
  if (!QUERY_RE.test(doc.slice(from, head))) return null;
  return candidate;
}

// src/obsidian/creator.ts
var TemplateManager = class {
  constructor(app) {
    this.app = app;
  }
  app;
  /** その Vault の `template/file/` 直下の `.md` ファイル名一覧 */
  listLocalTemplateFiles() {
    const prefix = `${TEMPLATE_DIR}/`;
    const names = [];
    for (const file of this.app.vault.getFiles()) {
      if (!file.path.startsWith(prefix)) continue;
      const rest = file.path.slice(prefix.length);
      if (!rest.includes("/") && rest.endsWith(".md")) {
        names.push(rest);
      }
    }
    return names.sort((a3, b2) => a3.localeCompare(b2));
  }
  /** 上流の `.kit/templates/file/` 直下の `.md` ファイル名一覧。隠しパスなのでアダプタで読む */
  async listUpstreamTemplateFiles() {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(UPSTREAM_TEMPLATE_DIR)) return [];
    const prefix = `${UPSTREAM_TEMPLATE_DIR}/`;
    return (await adapter.list(UPSTREAM_TEMPLATE_DIR)).files.map((p3) => p3.startsWith(prefix) ? p3.slice(prefix.length) : p3).filter((name) => !name.includes("/") && name.endsWith(".md")).sort((a3, b2) => a3.localeCompare(b2));
  }
  /** 使えるテンプレートのファイル名（上流と、その Vault の和） */
  async listTemplateFiles() {
    const names = /* @__PURE__ */ new Set([...await this.listUpstreamTemplateFiles(), ...this.listLocalTemplateFiles()]);
    return [...names].sort((a3, b2) => a3.localeCompare(b2));
  }
  /** 上流の既定の設定（`.kit/templates/config.json`）。なければ空 */
  async loadUpstreamConfig() {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(UPSTREAM_TEMPLATE_CONFIG_PATH)) return { templates: [], problems: [] };
    const { templates, problems } = parseTemplateConfig(await adapter.read(UPSTREAM_TEMPLATE_CONFIG_PATH));
    return { templates, problems: problems.map((p3) => `${UPSTREAM_TEMPLATE_CONFIG_PATH}: ${p3}`) };
  }
  /**
   * 上流の設定（`.kit/templates/config.json`）と、使えるテンプレートを合わせた設定一覧を返す。設定は子が上書きしない（ADR-0061）。
   * テンプレートのファイルは、同じ名前ならその Vault の `template/file/` を優先する
   */
  async loadConfig() {
    const files = await this.listTemplateFiles();
    const upstream = await this.loadUpstreamConfig();
    return { entries: resolveTemplateEntries({ upstream: upstream.templates, files }), problems: upstream.problems };
  }
  /** テンプレート 1 件の中身とプロンプト定義を読み込む。その Vault の `template/file/` を先に見る。どちらにもなければ null */
  async loadTemplate(entry) {
    const file = this.app.vault.getFileByPath(`${TEMPLATE_DIR}/${entry.file}`);
    let rawContent;
    if (file) rawContent = await this.app.vault.cachedRead(file);
    else {
      const upstreamPath = `${UPSTREAM_TEMPLATE_DIR}/${entry.file}`;
      if (!await this.app.vault.adapter.exists(upstreamPath)) return null;
      rawContent = await this.app.vault.adapter.read(upstreamPath);
    }
    return { entry, rawContent, prompts: extractPrompts(rawContent), datePrompts: extractDatePrompts(rawContent) };
  }
  /** モーダルに表示する有効なテンプレートとその中身・プロンプト定義を読み込む */
  async loadEnabledTemplates() {
    const { entries } = await this.loadConfig();
    const loaded = [];
    for (const entry of entries.filter((e3) => e3.enabled)) {
      const template = await this.loadTemplate(entry);
      if (template) loaded.push(template);
    }
    return loaded;
  }
  /**
   * スニペット（ADR-0060）。上流の `.kit/templates/snippet/` に、その Vault の `template/snippet/` を重ねる
   * （同じファイル名ならその Vault のもの）。どちらも直下の `.md` だけ
   */
  async loadSnippets() {
    const problems = [];
    const parseAll = (items, dir) => items.flatMap(({ file, text: text2 }) => {
      const { snippet, problem } = parseSnippet(file, text2);
      if (problem) problems.push(`${dir}/${problem}`);
      return snippet ? [snippet] : [];
    });
    const upstream = [];
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(UPSTREAM_SNIPPET_DIR)) {
      const prefix = `${UPSTREAM_SNIPPET_DIR}/`;
      for (const p3 of (await adapter.list(UPSTREAM_SNIPPET_DIR)).files) {
        const name = p3.startsWith(prefix) ? p3.slice(prefix.length) : p3;
        if (name.includes("/") || !name.endsWith(".md")) continue;
        upstream.push({ file: name, text: await adapter.read(`${prefix}${name}`) });
      }
    }
    const local = [];
    const localPrefix = `${SNIPPET_DIR}/`;
    for (const f4 of this.app.vault.getFiles()) {
      if (!f4.path.startsWith(localPrefix)) continue;
      const name = f4.path.slice(localPrefix.length);
      if (name.includes("/") || !name.endsWith(".md")) continue;
      local.push({ file: name, text: await this.app.vault.cachedRead(f4) });
    }
    const snippets = layerSnippets(parseAll(upstream, UPSTREAM_SNIPPET_DIR), parseAll(local, SNIPPET_DIR));
    return { snippets, problems };
  }
  /** `{{id:…}}` の連番を決めるための、Vault 内のすべてのノートの basename（pkm-task と同じ見方） */
  takenNames() {
    return this.app.vault.getMarkdownFiles().map((f4) => f4.basename);
  }
  /**
   * 今日のデイリーノートを開く。なければ daily.md のテンプレート（`template/file/` か `.kit/templates/file/`）から作る。
   * 生成先は `.kit/templates/config.json` の daily.md の設定に従う（有効・無効は問わない）。
   */
  async openTodaysDaily(now = /* @__PURE__ */ new Date()) {
    const { entries } = await this.loadConfig();
    const entry = entries.find((e3) => e3.file === "daily.md");
    const resolved = resolveDailyPath(entry, now);
    if (resolved.error) throw new Error(resolved.error);
    const path = (0, import_obsidian3.normalizePath)(resolved.path);
    const existing = this.app.vault.getFileByPath(path);
    if (existing) {
      await openInNotePane(this.app.workspace, existing, { newTab: false, phone: import_obsidian3.Platform.isPhone });
      return existing;
    }
    const template = await this.loadTemplate(
      entry ?? { file: "daily.md", enabled: false, folder: "", fileNamePattern: "" }
    );
    if (!template) throw new Error(`daily.md \u306E\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093\uFF08${TEMPLATE_DIR}/ \u306B\u3082 ${UPSTREAM_TEMPLATE_DIR}/ \u306B\u3082\u306A\u3044\uFF09`);
    return this.createNoteFromTemplate({ template, titleInput: "", prompts: {}, now });
  }
  fileExists(path) {
    return Boolean(this.app.vault.getFileByPath((0, import_obsidian3.normalizePath)(path)));
  }
  /** テンプレートを展開してファイルを作成し、エディタで開いてカーソルを移動する */
  async createNoteFromTemplate(params) {
    const now = params.now ?? /* @__PURE__ */ new Date();
    const takenNames = this.takenNames();
    const resolved = resolveOutputPath({
      folder: params.template.entry.folder,
      fileNamePattern: params.template.entry.fileNamePattern,
      titleInput: params.titleInput,
      now,
      prompts: params.prompts,
      takenNames
    });
    if (resolved.error) {
      throw new Error(resolved.error);
    }
    const normalized = (0, import_obsidian3.normalizePath)(resolved.path);
    if (this.fileExists(normalized)) {
      throw new Error(`\u3059\u3067\u306B\u540C\u3058\u540D\u524D\u306E\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u3059: ${normalized}`);
    }
    const rendered = renderTemplate(params.template.rawContent, {
      now,
      title: resolved.title,
      path: normalized,
      folder: resolved.folder,
      prompts: params.prompts,
      takenNames,
      dates: params.dates ?? {}
    });
    await this.ensureFolder(normalized);
    const created2 = await this.app.vault.create(normalized, rendered.content);
    const leaf = await openInNotePane(this.app.workspace, created2, { newTab: params.newTab === true, phone: import_obsidian3.Platform.isPhone });
    const view = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView) ?? leaf.view;
    const editor = view?.editor;
    if (editor) {
      const offset = rendered.cursorOffset ?? rendered.content.length;
      editor.setCursor(offsetToPos(rendered.content, offset));
      editor.focus();
    }
    return created2;
  }
  async ensureFolder(filePath) {
    const parts = filePath.split("/").slice(0, -1);
    for (let i3 = 1; i3 <= parts.length; i3++) {
      const folder = parts.slice(0, i3).join("/");
      if (!this.app.vault.getFolderByPath(folder)) {
        await this.app.vault.createFolder(folder);
      }
    }
  }
};

// src/obsidian/header-mount.ts
var import_obsidian5 = require("obsidian");

// src/core/note-format.ts
function shortDate(value) {
  if (typeof value !== "string") return "";
  const m3 = /^(\d{4}-\d{2}-\d{2})(?:$|[T ])/.exec(value.trim());
  return m3 ? m3[1] ?? "" : "";
}
function tagList(value) {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\s]+/) : [];
  const out = [];
  for (const item2 of items) {
    if (typeof item2 !== "string") continue;
    const tag = item2.trim().replace(/^#/, "");
    if (tag !== "") out.push(tag);
  }
  return out;
}

// src/core/note-title.ts
var WEEKDAYS2 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
function text(value) {
  const s3 = typeof value === "string" ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  const t3 = s3.trim();
  return t3 === "" ? null : t3;
}
function noteTitle(frontmatter, basename) {
  return text(frontmatter?.title) ?? text(frontmatter?.name) ?? basename;
}
function dailyDate(basename) {
  const m3 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(basename);
  if (!m3) return null;
  const [year, month, day] = [Number(m3[1]), Number(m3[2]), Number(m3[3])];
  const d3 = new Date(Date.UTC(year, month - 1, day));
  if (d3.getUTCFullYear() !== year || d3.getUTCMonth() !== month - 1 || d3.getUTCDate() !== day) return null;
  const weekday = d3.getUTCDay();
  return { date: basename, weekday, label: `${basename} ${WEEKDAYS2[weekday]}` };
}

// src/core/note-list.ts
var WIKI_TYPES = ["concept", "entity", "topic", "answer"];
var TASK_TYPES = ["issue", "routine", "member"];
function notesOfType(notes, type) {
  return notes.filter((n2) => n2.frontmatter.type === type);
}
function filterByQuery(notes, query) {
  const q2 = query.trim().toLowerCase();
  if (q2 === "") return [...notes];
  return notes.filter((n2) => noteTitle(n2.frontmatter, n2.basename).toLowerCase().includes(q2) || n2.basename.toLowerCase().includes(q2));
}
function createdOf(n2) {
  const v3 = n2.frontmatter.created;
  const t3 = v3 instanceof Date ? v3.getTime() : typeof v3 === "string" ? Date.parse(v3) : NaN;
  return Number.isNaN(t3) ? null : t3;
}
function sortNotes(notes, key, order) {
  const sign = order === "asc" ? 1 : -1;
  const titleOf = (n2) => noteTitle(n2.frontmatter, n2.basename);
  return [...notes].sort((a3, b2) => {
    if (key === "created") {
      const [x3, y4] = [createdOf(a3), createdOf(b2)];
      if (x3 === null && y4 === null) return 0;
      if (x3 === null) return 1;
      if (y4 === null) return -1;
      return sign * (x3 - y4);
    }
    const [x2, y3] = key === "title" ? [titleOf(a3), titleOf(b2)] : [a3.basename, b2.basename];
    return sign * x2.localeCompare(y3);
  });
}
function importedSourcePaths(notes) {
  const out = /* @__PURE__ */ new Set();
  for (const n2 of notes) {
    const type = n2.frontmatter.type;
    if (typeof type !== "string" || !WIKI_TYPES.includes(type)) continue;
    const sources = n2.frontmatter.sources;
    if (!Array.isArray(sources)) continue;
    for (const s3 of sources) if (typeof s3 === "string") out.add(s3);
  }
  return out;
}
function hasNoteHeader(path, frontmatter) {
  const type = frontmatter?.type;
  if (typeof type === "string" && TASK_TYPES.includes(type)) return false;
  return !/^(issue|routine|member)\/[^/]+\.md$/.test(path);
}

// src/core/note-header.ts
var PROPERTY_HEADER_TYPES = ["daily", "note", "source", ...WIKI_TYPES];
function isWebUrl(value) {
  return /^https?:\/\/\S+$/i.test(value);
}
function item(label, values) {
  return values.length > 0 ? [{ label, values }] : [];
}
function buildHeader(note, ctx) {
  const fm = note.frontmatter;
  const type = typeof fm.type === "string" ? fm.type : "";
  const hideProperties = PROPERTY_HEADER_TYPES.includes(type);
  if (type === "daily") {
    const d3 = dailyDate(note.basename);
    if (d3) return { title: d3.label, weekday: d3.weekday, items: [], hideProperties };
  }
  const title = noteTitle(fm, note.basename);
  let items = [];
  if (type === "note") {
    const created2 = shortDate(fm.created);
    items = [...item("Tags", tagList(fm.tags).map((text2) => ({ text: text2 }))), ...item("Created", created2 ? [{ text: created2 }] : [])];
  } else if (type === "source") {
    const origin = typeof fm.origin === "string" ? fm.origin.trim() : "";
    const retrieved = shortDate(fm.retrieved);
    const citedBy = ctx.notes.filter((n2) => typeof n2.frontmatter.type === "string" && WIKI_TYPES.includes(n2.frontmatter.type) && Array.isArray(n2.frontmatter.sources) && n2.frontmatter.sources.includes(note.path)).map((n2) => ({ text: noteTitle(n2.frontmatter, n2.basename), path: n2.path }));
    items = [
      ...item("Origin", origin ? [isWebUrl(origin) ? { text: origin, url: origin } : { text: origin }] : []),
      ...item("Retrieved", retrieved ? [{ text: retrieved }] : []),
      ...item("Cited by", citedBy)
    ];
  } else if (WIKI_TYPES.includes(type)) {
    const byPath = new Map(ctx.notes.map((n2) => [n2.path, n2]));
    const sources = [];
    for (const s3 of Array.isArray(fm.sources) ? fm.sources : []) {
      if (typeof s3 !== "string" || s3.trim() === "") continue;
      const found = byPath.get(s3);
      if (found) sources.push({ text: noteTitle(found.frontmatter, found.basename), path: found.path });
      else sources.push(isWebUrl(s3) ? { text: s3, url: s3 } : { text: s3 });
    }
    items = [...item("Sources", sources), ...item("Backlinks", ctx.backlinks > 0 ? [{ text: String(ctx.backlinks) }] : [])];
  }
  return { title, weekday: null, items, hideProperties };
}

// src/obsidian/NoteHeader.tsx
var import_obsidian4 = require("obsidian");
function Value({ app, v: v3 }) {
  if (v3.path !== void 0) {
    const path = v3.path;
    return /* @__PURE__ */ u3(
      "button",
      {
        type: "button",
        class: "vt-tpl-link",
        onClick: () => {
          const file = app.vault.getFileByPath(path);
          if (file) void openInNotePane(app.workspace, file, { newTab: false, phone: import_obsidian4.Platform.isPhone });
        },
        children: v3.text
      }
    );
  }
  if (v3.url !== void 0) {
    return /* @__PURE__ */ u3("a", { class: "vt-tpl-link", href: v3.url, rel: "noopener noreferrer", children: v3.text });
  }
  return /* @__PURE__ */ u3("span", { class: "vt-tpl-value", children: v3.text });
}
function NoteHeader({ app, model }) {
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-note-header-body", "data-hide-properties": model.hideProperties ? "true" : void 0, children: [
    /* @__PURE__ */ u3("div", { class: "vt-tpl-note-header-top", children: [
      /* @__PURE__ */ u3("div", { class: "vt-tpl-note-title", children: model.title }),
      model.weekday !== null && /* @__PURE__ */ u3("ol", { class: "vt-tpl-week", "aria-label": "\u66DC\u65E5", children: WEEKDAYS2.map((w3, i3) => /* @__PURE__ */ u3("li", { class: i3 === model.weekday ? "vt-tpl-week-day is-current" : "vt-tpl-week-day", "aria-current": i3 === model.weekday ? "date" : void 0, children: w3 }, w3)) })
    ] }),
    model.items.length > 0 && /* @__PURE__ */ u3("dl", { class: "vt-tpl-meta", children: model.items.map((it) => /* @__PURE__ */ u3("div", { class: "vt-tpl-meta-row", children: [
      /* @__PURE__ */ u3("dt", { children: it.label }),
      /* @__PURE__ */ u3("dd", { children: it.values.map((v3, i3) => /* @__PURE__ */ u3(Value, { app, v: v3 }, `${v3.text}-${i3}`)) })
    ] }, it.label)) })
  ] });
}

// src/obsidian/note-index.ts
function collectNotes(app) {
  return app.vault.getMarkdownFiles().map((file) => noteInfo(app, file));
}
function noteInfo(app, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return { path: file.path, basename: file.basename, frontmatter: fm ? { ...fm } : {} };
}
function backlinkCount(app, path) {
  let count = 0;
  for (const [from, targets] of Object.entries(app.metadataCache.resolvedLinks)) {
    if (from !== path && (targets[path] ?? 0) > 0) count++;
  }
  return count;
}
function useVaultChanges(app) {
  const [tick, setTick] = d2(0);
  h2(() => {
    let timer;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTick((n2) => n2 + 1), 150);
    };
    const metaRefs = [app.metadataCache.on("resolved", bump), app.metadataCache.on("changed", bump)];
    const vaultRefs = [app.vault.on("create", bump), app.vault.on("delete", bump), app.vault.on("rename", bump)];
    return () => {
      window.clearTimeout(timer);
      for (const ref of metaRefs) app.metadataCache.offref(ref);
      for (const ref of vaultRefs) app.vault.offref(ref);
    };
  }, [app]);
  return tick;
}

// src/obsidian/header-mount.ts
var HEADER_CLASS = "vt-tpl-note-header";
var SIZERS = ".cm-sizer, .markdown-preview-sizer";
function installNoteHeaders(plugin) {
  const { app } = plugin;
  const mount = (view) => {
    const file = view.file;
    const info = file ? noteInfo(app, file) : null;
    const show = info !== null && hasNoteHeader(info.path, info.frontmatter);
    let model = null;
    if (info && show) {
      const type = info.frontmatter.type;
      const needsVault = type === "source" || typeof type === "string" && WIKI_TYPES.includes(type);
      model = buildHeader(info, { notes: needsVault ? collectNotes(app) : [], backlinks: needsVault ? backlinkCount(app, info.path) : 0 });
    }
    for (const sizer of Array.from(view.contentEl.querySelectorAll(SIZERS))) {
      let host = sizer.querySelector(`:scope > .${HEADER_CLASS}`);
      if (!model) {
        if (host) {
          R(null, host);
          host.remove();
        }
        continue;
      }
      if (!host) {
        host = document.createElement("div");
        host.className = HEADER_CLASS;
        sizer.prepend(host);
      } else if (sizer.firstElementChild !== host) {
        sizer.prepend(host);
      }
      R(k(NoteHeader, { app, model }), host);
    }
  };
  const refresh = () => {
    app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof import_obsidian5.MarkdownView) mount(leaf.view);
    });
  };
  let timer;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(refresh, 100);
  };
  plugin.registerEvent(app.workspace.on("file-open", schedule));
  plugin.registerEvent(app.workspace.on("layout-change", schedule));
  plugin.registerEvent(app.workspace.on("active-leaf-change", schedule));
  plugin.registerEvent(app.metadataCache.on("changed", schedule));
  plugin.registerEvent(app.metadataCache.on("resolved", schedule));
  app.workspace.onLayoutReady(refresh);
  plugin.register(() => {
    window.clearTimeout(timer);
    for (const host of Array.from(document.querySelectorAll(`.${HEADER_CLASS}`))) {
      R(null, host);
      host.remove();
    }
  });
}

// src/obsidian/snippet-session.ts
var import_state = require("@codemirror/state");
var lastId = 0;
var newId = () => ++lastId;
function typedSlashAt(tr) {
  if (!tr.docChanged || !tr.isUserEvent("input.type")) return null;
  let at = null;
  let count = 0;
  tr.changes.iterChanges((fromA, toA, fromB, _toB, inserted) => {
    count++;
    if (fromA === toA && inserted.toString() === "/") at = fromB;
  });
  return count === 1 ? at : null;
}
var slashSessionField = import_state.StateField.define({
  create: () => null,
  update(prev, tr) {
    if (!tr.docChanged && !tr.selection) return prev;
    const doc = tr.state.doc;
    const sel = tr.state.selection.main;
    return nextSlashSession(
      prev,
      { typedSlashAt: typedSlashAt(tr), mapPos: (p3) => tr.changes.mapPos(p3, 1), head: sel.head, empty: sel.empty },
      { lineStartAt: (pos) => doc.lineAt(pos).from, slice: (from, to) => doc.sliceString(from, to) },
      newId
    );
  }
});

// src/obsidian/SnippetSuggest.ts
var import_obsidian6 = require("obsidian");
var SnippetSuggest = class extends import_obsidian6.EditorSuggest {
  constructor(app, manager) {
    super(app);
    this.manager = manager;
  }
  manager;
  /** いま候補を出しているセッション */
  sessionId = null;
  /** Escape で閉じたか、候補を選んで終えたセッション。同じセッションでは開き直さない */
  dismissedId = null;
  /** 最後に出した候補の数。0 件で閉じたとき（打ち直せばまた出る）と区別する */
  shownCount = 0;
  cache = null;
  /**
   * Escape・候補の選択・クリックで閉じたら、そのセッションでは開き直さない。
   * onTrigger が null を返して閉じるとき（セッションが終わった）と、候補が 0 件で閉じるときは除く
   */
  close() {
    if (this.sessionId !== null && this.shownCount > 0) this.dismissedId = this.sessionId;
    super.close();
  }
  onTrigger(cursor, editor, _file) {
    const view = editor.cm;
    const session = view?.state.field(slashSessionField, false) ?? null;
    if (!session || session.id === this.dismissedId) {
      this.sessionId = null;
      return null;
    }
    this.sessionId = session.id;
    const start = editor.offsetToPos(session.from);
    return { start, end: cursor, query: editor.getRange(start, cursor).slice(1) };
  }
  async getSuggestions(context) {
    const id = this.sessionId ?? -1;
    if (!this.cache || this.cache.sessionId !== id) {
      this.cache = {
        sessionId: id,
        snippets: this.manager.loadSnippets().then(({ snippets, problems }) => {
          for (const p3 of problems) console.warn(`pkm-template: \u30B9\u30CB\u30DA\u30C3\u30C8\u3092\u8AAD\u3081\u307E\u305B\u3093\u3067\u3057\u305F: ${p3}`);
          return snippets;
        })
      };
    }
    const found = filterSnippets(await this.cache.snippets, context.query);
    this.shownCount = found.length;
    return found;
  }
  renderSuggestion(snippet, el) {
    el.setText(`${snippet.alias}: ${snippet.name}`);
  }
  selectSuggestion(snippet, _evt) {
    const ctx = this.context;
    if (!ctx) return;
    const { editor, file, start, end } = ctx;
    this.close();
    void askDates(this.app, extractDatePrompts(snippet.body)).then((dates) => {
      if (dates === null) {
        editor.focus();
        return;
      }
      const rendered = renderTemplate(snippet.body, {
        now: /* @__PURE__ */ new Date(),
        title: file?.basename ?? "",
        path: file?.path ?? "",
        folder: file?.parent && file.parent.path !== "/" ? file.parent.path : "",
        prompts: {},
        takenNames: this.manager.takenNames(),
        dates
      });
      const startOffset = editor.posToOffset(start);
      editor.replaceRange(rendered.content, start, end);
      editor.setCursor(editor.offsetToPos(startOffset + (rendered.cursorOffset ?? rendered.content.length)));
      editor.focus();
    });
  }
};

// src/obsidian/view.ts
var import_obsidian7 = require("obsidian");
function preactViewCreator(spec, app) {
  class PreactView extends import_obsidian7.ItemView {
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
      this.contentEl.addClass("vt-tpl-view");
      R(k(spec.component, { app }), this.contentEl);
    }
    async onClose() {
      R(null, this.contentEl);
    }
  }
  return (leaf) => new PreactView(leaf);
}

// src/views/NoteListView.tsx
var import_obsidian8 = require("obsidian");
var created = { label: "Created", sort: "created", cell: (n2) => shortDate(n2.frontmatter.created) };
var titleColumn = { label: "Title", sort: "title", cell: (n2) => noteTitle(n2.frontmatter, n2.basename) };
var SPECS = {
  daily: {
    type: "daily",
    empty: "\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093",
    sort: "name",
    columns: [{ label: "Date", sort: "name", cell: (n2) => dailyDate(n2.basename)?.label ?? n2.basename }, created]
  },
  note: {
    type: "note",
    empty: "\u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093",
    sort: "created",
    columns: [titleColumn, { label: "Tags", cell: (n2) => tagList(n2.frontmatter.tags).join(" ") }, created]
  },
  source: {
    type: "source",
    empty: "\u5143\u8CC7\u6599\u304C\u3042\u308A\u307E\u305B\u3093",
    sort: "created",
    columns: [
      titleColumn,
      { label: "Origin", cell: (n2) => typeof n2.frontmatter.origin === "string" ? n2.frontmatter.origin : "" },
      { label: "Retrieved", cell: (n2) => shortDate(n2.frontmatter.retrieved) },
      { label: "Imported", cell: (n2, ctx) => ctx.imported.has(n2.path) ? "Yes" : "No" }
    ]
  }
};
function NoteList({ app, spec }) {
  const tick = useVaultChanges(app);
  const [query, setQuery] = d2("");
  const [sort, setSort] = d2({ key: spec.sort, order: "desc" });
  const all = T2(() => collectNotes(app), [app, tick]);
  const imported = T2(() => importedSourcePaths(all), [all]);
  const rows = T2(() => sortNotes(filterByQuery(notesOfType(all, spec.type), query), sort.key, sort.order), [all, spec, query, sort]);
  const toggle = (key) => setSort((s3) => s3.key === key ? { key, order: s3.order === "asc" ? "desc" : "asc" } : { key, order: key === "title" ? "asc" : "desc" });
  const open = (path) => {
    const file = app.vault.getFileByPath(path);
    if (file) void openInNotePane(app.workspace, file, { newTab: false, phone: import_obsidian8.Platform.isPhone });
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-list", children: [
    /* @__PURE__ */ u3("input", { class: "vt-tpl-search", type: "search", placeholder: "\u30BF\u30A4\u30C8\u30EB\u3067\u7D5E\u308A\u8FBC\u3080", "aria-label": "\u30BF\u30A4\u30C8\u30EB\u3067\u7D5E\u308A\u8FBC\u3080", value: query, onInput: (e3) => setQuery(e3.currentTarget.value) }),
    rows.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-tpl-empty", children: query.trim() === "" ? spec.empty : "\u4E00\u81F4\u3059\u308B\u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093" }) : /* @__PURE__ */ u3("table", { class: "vt-tpl-table", children: [
      /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: spec.columns.map((c3) => /* @__PURE__ */ u3("th", { "aria-sort": c3.sort && c3.sort === sort.key ? sort.order === "asc" ? "ascending" : "descending" : void 0, children: c3.sort ? /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-sort", onClick: () => toggle(c3.sort), children: [
        c3.label,
        c3.sort === sort.key ? sort.order === "asc" ? " \u2191" : " \u2193" : ""
      ] }) : c3.label }, c3.label)) }) }),
      /* @__PURE__ */ u3("tbody", { children: rows.map((n2) => /* @__PURE__ */ u3("tr", { children: spec.columns.map((c3, i3) => /* @__PURE__ */ u3("td", { children: i3 === 0 ? /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-link", onClick: () => open(n2.path), children: c3.cell(n2, { imported }) || n2.basename }) : c3.cell(n2, { imported }) }, c3.label)) }, n2.path)) })
    ] })
  ] });
}
var make = (spec) => ({ app }) => /* @__PURE__ */ u3(NoteList, { app, spec });
var DailyListView = make(SPECS.daily);
var NoteListView = make(SPECS.note);
var SourceListView = make(SPECS.source);

// src/main.ts
var LIST_VIEWS = [
  { type: "pkm-template-daily-list", title: "Daily notes", icon: "calendar-days", component: DailyListView },
  { type: "pkm-template-note-list", title: "Notes", icon: "notebook", component: NoteListView },
  { type: "pkm-template-source-list", title: "Sources", icon: "library", component: SourceListView }
];
var PkmTemplatePlugin = class extends import_obsidian9.Plugin {
  manager;
  async onload() {
    this.manager = new TemplateManager(this.app);
    const openCreateModal = async () => {
      try {
        const templates = await this.manager.loadEnabledTemplates();
        new CreateNoteModal(this.app, this.manager, templates, (msg, err) => this.report(msg, err)).open();
      } catch (err) {
        this.report("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F", err);
      }
    };
    this.addCommand({
      id: "create-from-template",
      name: "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304B\u3089\u65B0\u898F\u30D5\u30A1\u30A4\u30EB\u3092\u4F5C\u6210",
      callback: () => void openCreateModal()
    });
    const openToday = async () => {
      try {
        await this.manager.openTodaysDaily();
      } catch (err) {
        this.report("\u4ECA\u65E5\u306E\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", err);
      }
    };
    this.addCommand({
      id: "open-todays-daily",
      name: "\u4ECA\u65E5\u306E\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u3092\u958B\u304F",
      callback: () => void openToday()
    });
    for (const spec of LIST_VIEWS) {
      this.registerView(spec.type, preactViewCreator(spec, this.app));
      this.addCommand({ id: `open-${spec.type.replace("pkm-template-", "")}`, name: `${spec.title} \u3092\u958B\u304F`, icon: spec.icon, callback: () => void this.openView(spec.type) });
    }
    this.addRibbonIcon("file-plus-2", "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304B\u3089\u65B0\u898F\u30D5\u30A1\u30A4\u30EB\u3092\u4F5C\u6210", () => void openCreateModal());
    installNoteHeaders(this);
    this.registerEditorExtension(slashSessionField);
    this.registerEditorSuggest(new SnippetSuggest(this.app, this.manager));
  }
  /** 一覧 View は左の固定ペインに開く（ADR-0033） */
  async openView(type) {
    await openListView(this.app.workspace, type, { phone: import_obsidian9.Platform.isPhone });
  }
  report(message, error) {
    if (error !== void 0) console.error(`pkm-template: ${message}`, error);
    const detail = error instanceof Error ? `: ${error.message}` : "";
    new import_obsidian9.Notice(`${message}${detail}`);
  }
};
