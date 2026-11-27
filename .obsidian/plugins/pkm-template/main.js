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
var import_obsidian16 = require("obsidian");

// ../shared/src/list-pane.ts
var LIST_VIEW_PREFIXES = ["pkm-task-", "pkm-template-", "pkm-updates-", "pkm-slide-"];
var NOT_LIST_VIEWS = /* @__PURE__ */ new Set(["pkm-task-sidebar", "pkm-slide-notes"]);
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
  const target = notePaneLeaf(workspace, options);
  await target.openFile(file, { active: true });
  return target;
}
function notePaneLeaf(workspace, options) {
  const fallback = options.newTab ? "tab" : false;
  const leaves = options.phone ? [] : rootLeaves(workspace);
  const listLeaf = findListLeaf(workspace, leaves);
  if (!listLeaf) return workspace.getLeaf(fallback);
  const container = listLeaf.getContainer();
  const notes = leaves.filter((l3) => l3.parent !== listLeaf.parent && !isListViewType(leafType(l3)) && l3.getContainer() === container);
  const first = notes[0];
  if (!first) return workspace.createLeafBySplit(listLeaf, "vertical", false);
  const recent = workspace.getMostRecentLeaf();
  const group = recent && notes.includes(recent) ? recent.parent : first.parent;
  const inGroup = workspace.getMostRecentLeaf(group);
  const target = inGroup && notes.includes(inGroup) ? inGroup : first;
  if (!options.newTab) return target;
  workspace.setActiveLeaf(target, { focus: false });
  return workspace.getLeaf("tab");
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
var ID_PREFIXES = ["i", "r", "m", "p"];
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
var DATE_WORDS = { today: 0, tomorrow: 1, yesterday: -1 };
var DATE_UNIT_RE = /(\d*)(mo|y|w|d)/g;
function relativeDate(today, sign, body) {
  if (/^\d+$/.test(body)) return addDays(today, sign * Number(body));
  let rest = body;
  let months = 0;
  let days = 0;
  const seen = /* @__PURE__ */ new Set();
  for (const m3 of body.matchAll(DATE_UNIT_RE)) {
    const unit = m3[2];
    if (seen.has(unit)) return null;
    seen.add(unit);
    const n2 = m3[1] === "" ? 1 : Number(m3[1]);
    if (unit === "y") months += 12 * n2;
    else if (unit === "mo") months += n2;
    else if (unit === "w") days += 7 * n2;
    else days += n2;
    rest = rest.replace(m3[0], "");
  }
  if (seen.size === 0 || rest !== "") return null;
  return addDays(addMonths(today, sign * months), sign * days);
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
  if (s3 in DATE_WORDS) return addDays(today, DATE_WORDS[s3]);
  const bare = WEEKDAY_NAMES.indexOf(s3);
  if (bare >= 0) return addWeekdays(today, bare, 1, 1);
  const m3 = /^([+-])(.+)$/.exec(s3);
  if (!m3) return null;
  const sign = m3[1] === "+" ? 1 : -1;
  const weekday = /^(\d*)([a-z]{3})$/.exec(m3[2]);
  const weekdayIndex = weekday ? WEEKDAY_NAMES.indexOf(weekday[2]) : -1;
  if (weekday && weekdayIndex >= 0) {
    const n2 = weekday[1] === "" ? 1 : Number(weekday[1]);
    return n2 < 1 ? null : addWeekdays(today, weekdayIndex, sign, n2);
  }
  return relativeDate(today, sign, m3[2]);
}
var MINUTES_PER_DAY = 24 * 60;
function formatDateLabel(date) {
  return `${date} ${WEEKDAY_NAMES[weekdayOf(date)].toUpperCase()}`;
}
var DATE_INPUT_EXAMPLES = "e.g. 15 / 1224 / +1d / fri / +2w / +mo / tomorrow";
var DATE_INPUT_ERROR = "\u65E5\u4ED8\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093";

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

// ../shared/src/month-calendar.tsx
var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var WEEKDAY_INITIALS = WEEKDAY_NAMES.map((w3) => w3.charAt(0).toUpperCase());
function formatMonthTitle(month) {
  const [y3, m3] = month.split("-").map(Number);
  return `${MONTH_NAMES[m3 - 1] ?? ""} ${y3}`;
}
function shiftMonth(month, n2) {
  const [y3, m3] = month.split("-").map(Number);
  return new Date(Date.UTC(y3, m3 - 1 + n2, 1)).toISOString().slice(0, 7);
}
function yearOptions(displayYear, todayYear) {
  const years = Array.from({ length: 21 }, (_2, i3) => todayYear - 10 + i3);
  if (!years.includes(displayYear)) years.push(displayYear);
  return years.sort((a3, b2) => a3 - b2);
}
function monthWeeks(month) {
  const days = monthGridDays(month).map((d3) => d3.startsWith(month) ? d3 : null);
  const weeks = [];
  for (let i3 = 0; i3 < days.length; i3 += 7) {
    const week = days.slice(i3, i3 + 7);
    if (week.some((d3) => d3 !== null)) weeks.push(week);
  }
  return weeks;
}
function Chevron(props) {
  return /* @__PURE__ */ u3("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", children: /* @__PURE__ */ u3("path", { d: props.dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6" }) });
}
function DropArrow() {
  return /* @__PURE__ */ u3("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true", fill: "currentColor", children: /* @__PURE__ */ u3("path", { d: "M7 10l5 5 5-5z" }) });
}
function OptionList(props) {
  const ref = A2(null);
  h2(() => {
    const list = ref.current;
    const selected = list?.querySelector(".is-selected");
    if (list && selected) list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.offsetHeight / 2;
  }, []);
  return /* @__PURE__ */ u3("div", { class: "vt-cal-options", role: "group", "aria-label": props.label, ref, children: props.options.map((o3) => /* @__PURE__ */ u3("button", { type: "button", class: `vt-cal-option${o3.selected ? " is-selected" : ""}`, "aria-pressed": o3.selected, onClick: () => props.onPick(o3.value), children: o3.text }, o3.value)) });
}
function MonthCalendar(props) {
  const { month, today } = props;
  const [view, setView] = d2("days");
  const [year, monthNumber] = month.split("-").map(Number);
  const toggle = (next) => setView(view === next ? "days" : next);
  const pick = (y3, m3) => {
    props.onMonth(`${y3}-${String(m3).padStart(2, "0")}`);
    setView("days");
  };
  return /* @__PURE__ */ u3("div", { class: "vt-cal", children: [
    /* @__PURE__ */ u3("div", { class: "vt-cal-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-cal-title", "aria-live": "polite", children: [
        /* @__PURE__ */ u3("button", { type: "button", class: `vt-cal-menu${view === "months" ? " is-open" : ""}`, "aria-expanded": view === "months", "aria-label": `Choose month (${MONTH_NAMES[monthNumber - 1]})`, onClick: () => toggle("months"), children: [
          MONTH_NAMES[monthNumber - 1],
          /* @__PURE__ */ u3(DropArrow, {})
        ] }),
        /* @__PURE__ */ u3("button", { type: "button", class: `vt-cal-menu${view === "years" ? " is-open" : ""}`, "aria-expanded": view === "years", "aria-label": `Choose year (${year})`, onClick: () => toggle("years"), children: [
          year,
          /* @__PURE__ */ u3(DropArrow, {})
        ] })
      ] }),
      view === "days" && /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-cal-nav", "aria-label": "Previous month", title: "Previous month", onClick: () => props.onMonth(shiftMonth(month, -1)), children: /* @__PURE__ */ u3(Chevron, { dir: "left" }) }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-cal-nav", "aria-label": "Next month", title: "Next month", onClick: () => props.onMonth(shiftMonth(month, 1)), children: /* @__PURE__ */ u3(Chevron, { dir: "right" }) })
      ] })
    ] }),
    view === "months" && /* @__PURE__ */ u3(
      OptionList,
      {
        label: "Months",
        options: MONTH_NAMES.map((name, i3) => ({ value: i3 + 1, text: name.slice(0, 3), selected: i3 + 1 === monthNumber })),
        onPick: (m3) => pick(year, m3)
      }
    ),
    view === "years" && /* @__PURE__ */ u3(
      OptionList,
      {
        label: "Years",
        options: yearOptions(year, Number(today.slice(0, 4))).map((y3) => ({ value: y3, text: String(y3), selected: y3 === year })),
        onPick: (y3) => pick(y3, monthNumber)
      }
    ),
    view === "days" && /* @__PURE__ */ u3("div", { class: "vt-cal-grid", role: "group", "aria-label": formatMonthTitle(month), children: [
      WEEKDAY_INITIALS.map((w3, i3) => /* @__PURE__ */ u3("span", { class: "vt-cal-weekday", "aria-hidden": "true", title: WEEKDAY_NAMES[i3], children: w3 })),
      monthWeeks(month).flat().map((d3, i3) => {
        if (d3 === null) return /* @__PURE__ */ u3("span", { class: "vt-cal-blank" }, `b${i3}`);
        const selected = props.isSelected(d3);
        const mark = props.mark?.(d3) ?? null;
        const cls = ["vt-cal-day", ...mark?.classes ?? []];
        if (d3 === today) cls.push("is-today");
        if (selected) cls.push("is-selected");
        const notes = [d3 === today ? "Today" : null, ...mark?.notes ?? []].filter(Boolean);
        const label = notes.length > 0 ? `${d3} (${notes.join(" \xB7 ")})` : d3;
        return /* @__PURE__ */ u3("button", { type: "button", class: cls.join(" "), "aria-pressed": selected, "aria-label": label, title: label, onClick: () => props.onPick(d3), children: Number(d3.slice(8, 10)) }, d3);
      })
    ] })
  ] });
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
  return weekday ? formatDateLabel(date) : date;
}

// ../shared/src/modal-keys.ts
function registerCloseKey(modal) {
  modal.scope.register(["Mod"], "w", () => {
    modal.close();
    return false;
  });
}

// src/obsidian/DatePromptModal.tsx
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
              "aria-label": "Date",
              placeholder: `${DATE_INPUT_EXAMPLES} / +2 -d`,
              value: text2,
              onInput: (e3) => {
                const value = e3.currentTarget.value;
                setText(value);
                const next = parseDatePromptInput(value, today);
                if (next !== null) setMonth(next.date.slice(0, 7));
              }
            }
          ),
          /* @__PURE__ */ u3("div", { class: `vt-tpl-preview${output === null ? " is-error" : ""}`, "aria-live": "polite", children: output === null ? DATE_INPUT_ERROR : `Inserts: ${output}` }),
          /* @__PURE__ */ u3("label", { class: "vt-tpl-check", children: [
            /* @__PURE__ */ u3("input", { type: "checkbox", checked: weekday, disabled: parsed?.weekday === true, onChange: (e3) => setWeekdayChecked(e3.currentTarget.checked) }),
            "Add weekday (-d)"
          ] })
        ] }),
        /* @__PURE__ */ u3(
          MonthCalendar,
          {
            month,
            onMonth: setMonth,
            today,
            isSelected: (d3) => d3 === parsed?.date,
            onPick: (d3) => props.onSubmit(formatPromptDate(d3, weekday))
          }
        ),
        /* @__PURE__ */ u3("div", { class: "vt-tpl-actions", children: [
          !import_obsidian.Platform.isMobile && /* @__PURE__ */ u3("span", { class: "vt-tpl-hint", children: "Enter to insert" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "vt-tpl-button is-primary", disabled: output === null, children: "Insert" })
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
    registerCloseKey(this);
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
  const { templates, manager, linkEditor, onCreated, onReport } = props;
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
  const submit = (newTab, link = false) => {
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
        newTab,
        ...link && linkEditor ? { linkInto: linkEditor } : {}
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
      if (e3.altKey) {
        if (linkEditor) submit(false, true);
        return;
      }
      submit(e3.shiftKey);
    }
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-modal", onKeyDown: handleKeyDown, children: [
    /* @__PURE__ */ u3("div", { class: "vt-tpl-section", children: [
      /* @__PURE__ */ u3("div", { class: "vt-tpl-label", children: "TEMPLATE" }),
      /* @__PURE__ */ u3("div", { class: "vt-tpl-chips", role: "listbox", "aria-label": "Templates", children: templates.map((tpl, i3) => {
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
      /* @__PURE__ */ u3("label", { class: "vt-tpl-label", for: "vt-tpl-title-input", children: idFileName ? "Title" : "File name / Title" }),
      /* @__PURE__ */ u3(
        "input",
        {
          id: "vt-tpl-title-input",
          ref: titleRef,
          type: "text",
          class: "vt-tpl-input",
          placeholder: idFileName ? "Title (the file name comes from the ID)" : defaultFileNameHint ? `Empty: ${defaultFileNameHint}` : "Title (e.g. my-note)",
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
            placeholder: prompt.defaultValue ? `Default: ${prompt.defaultValue}` : prompt.label,
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
      /* @__PURE__ */ u3("div", { class: `vt-tpl-preview${errorMessage ? " is-error" : ""}`, children: errorMessage ? errorMessage : `Creates: ${resolved.path}` }),
      /* @__PURE__ */ u3("div", { class: "vt-tpl-actions", children: [
        !import_obsidian2.Platform.isMobile && /* @__PURE__ */ u3("span", { class: "vt-tpl-hint", children: [
          "Enter / Mod+Enter to create",
          linkEditor ? " / Mod+Alt+Enter to create and link" : ""
        ] }),
        linkEditor && /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-button", disabled: !canSubmit, onClick: () => submit(false, true), children: "Create and link" }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-button", disabled: !canSubmit, onClick: () => submit(true), children: "Open in new tab" }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-button is-primary", disabled: !canSubmit, onClick: () => submit(false), children: "Create" })
      ] })
    ] })
  ] });
}
var CreateNoteModal = class extends import_obsidian2.Modal {
  constructor(app, manager, templates, onReport, linkEditor = null) {
    super(app);
    this.manager = manager;
    this.templates = templates;
    this.onReport = onReport;
    this.linkEditor = linkEditor;
    registerCloseKey(this);
  }
  manager;
  templates;
  onReport;
  linkEditor;
  onOpen() {
    this.setTitle("Create new file from template");
    R(
      /* @__PURE__ */ u3(
        CreateNoteForm,
        {
          app: this.app,
          templates: this.templates,
          manager: this.manager,
          linkEditor: this.linkEditor,
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

// src/core/note-link.ts
function escapeLabel(label) {
  return label.replace(/([\\[\]])/g, "\\$1");
}
function encodePath(path) {
  return path.replace(/[ ()<>%]/g, (c3) => `%${c3.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}
function noteLink(path, frontmatter) {
  const basename = (path.split("/").pop() ?? path).replace(/\.md$/i, "");
  return `[${escapeLabel(noteTitle(frontmatter, basename))}](${encodePath(path)})`;
}

// src/core/snippet.ts
var SNIPPET_DIR = "template/snippet";
var UPSTREAM_SNIPPET_DIR = ".kit/templates/snippet";
var INLINE_DIR = "template/inline";
var UPSTREAM_INLINE_DIR = ".kit/templates/inline";
var KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var COMMAND_RE = /^[a-z0-9-]+:[A-Za-z0-9_-]+$/;
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
  const command = fields.command;
  if (command !== void 0 && !COMMAND_RE.test(command)) {
    return fail(`command \u306F <\u30D7\u30E9\u30B0\u30A4\u30F3 ID>:<\u30B3\u30DE\u30F3\u30C9> \u306E\u5F62\u306B\u3057\u307E\u3059\uFF08${command}\uFF09`);
  }
  const snippet = { file, name: fields.name, alias: fields.alias, body };
  if (command !== void 0) snippet.command = command;
  return { snippet, problem: null };
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
function inlineBody(body) {
  return body.replace(/(?:\r?\n)+$/, "");
}
var SLASH_TRIGGER = {
  char: "/",
  canStartAt: (pos, doc) => doc.lineStartAt(pos) === pos
};
var AT_TRIGGER = {
  char: "@",
  canStartAt: (pos, doc) => doc.lineStartAt(pos) === pos || doc.slice(pos - 1, pos) === " "
};
var QUERY_TAIL_RE = /^[A-Za-z0-9-]*$/;
function nextTriggerSession(trigger, prev, update, doc, newId2) {
  let candidate = null;
  const typed = update.typedAt;
  if (typed !== null && trigger.canStartAt(typed, doc)) candidate = { id: newId2(), from: typed };
  else if (prev) candidate = { id: prev.id, from: update.mapPos(prev.from) };
  if (!candidate) return null;
  const { from } = candidate;
  const { head } = update;
  if (!update.empty || head <= from) return null;
  if (!trigger.canStartAt(from, doc) || doc.lineStartAt(head) !== doc.lineStartAt(from)) return null;
  const typedText = doc.slice(from, head);
  if (!typedText.startsWith(trigger.char) || !QUERY_TAIL_RE.test(typedText.slice(trigger.char.length))) return null;
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
  loadSnippets() {
    return this.loadSnippetDirs(UPSTREAM_SNIPPET_DIR, SNIPPET_DIR);
  }
  /**
   * インラインテンプレート（ADR-0067）。スニペットと同じ書式と重ね方で、上流の `.kit/templates/inline/` に
   * その Vault の `template/inline/` を重ねる
   */
  loadInlineTemplates() {
    return this.loadSnippetDirs(UPSTREAM_INLINE_DIR, INLINE_DIR);
  }
  async loadSnippetDirs(upstreamDir, localDir) {
    const problems = [];
    const parseAll = (items, dir) => items.flatMap(({ file, text: text2 }) => {
      const { snippet, problem } = parseSnippet(file, text2);
      if (problem) problems.push(`${dir}/${problem}`);
      return snippet ? [snippet] : [];
    });
    const upstream = [];
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(upstreamDir)) {
      const prefix = `${upstreamDir}/`;
      for (const p3 of (await adapter.list(upstreamDir)).files) {
        const name = p3.startsWith(prefix) ? p3.slice(prefix.length) : p3;
        if (name.includes("/") || !name.endsWith(".md")) continue;
        upstream.push({ file: name, text: await adapter.read(`${prefix}${name}`) });
      }
    }
    const local = [];
    const localPrefix = `${localDir}/`;
    for (const f4 of this.app.vault.getFiles()) {
      if (!f4.path.startsWith(localPrefix)) continue;
      const name = f4.path.slice(localPrefix.length);
      if (name.includes("/") || !name.endsWith(".md")) continue;
      local.push({ file: name, text: await this.app.vault.cachedRead(f4) });
    }
    const snippets = layerSnippets(parseAll(upstream, upstreamDir), parseAll(local, localDir));
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
    const { path, existing } = await this.todaysDaily(now);
    if (existing) {
      await openInNotePane(this.app.workspace, existing, { newTab: false, phone: import_obsidian3.Platform.isPhone });
      return existing;
    }
    return this.createTodaysDaily(now, true, path);
  }
  /** 今日の daily のパスと、あればそのファイル */
  async todaysDaily(now = /* @__PURE__ */ new Date()) {
    const { entries } = await this.loadConfig();
    const resolved = resolveDailyPath(entries.find((e3) => e3.file === "daily.md"), now);
    if (resolved.error) throw new Error(resolved.error);
    const path = (0, import_obsidian3.normalizePath)(resolved.path);
    return { path, existing: this.app.vault.getFileByPath(path) };
  }
  /** 今日の daily をテンプレートから作る。open が false なら開かない（@daily でリンクを入れるとき。ADR-0194） */
  async createTodaysDaily(now = /* @__PURE__ */ new Date(), open = false, path) {
    const { entries } = await this.loadConfig();
    const entry = entries.find((e3) => e3.file === "daily.md");
    const target = path ?? (await this.todaysDaily(now)).path;
    const existing = this.app.vault.getFileByPath(target);
    if (existing) return existing;
    const template = await this.loadTemplate(
      entry ?? { file: "daily.md", enabled: false, folder: "", fileNamePattern: "" }
    );
    if (!template) throw new Error(`daily.md \u306E\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093\uFF08${TEMPLATE_DIR}/ \u306B\u3082 ${UPSTREAM_TEMPLATE_DIR}/ \u306B\u3082\u306A\u3044\uFF09`);
    return this.createNoteFromTemplate({ template, titleInput: "", prompts: {}, now, open });
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
    if (params.linkInto) {
      params.linkInto.replaceSelection(noteLink(created2.path, frontmatterOf(rendered.content)));
      params.linkInto.focus();
      return created2;
    }
    if (params.open === false) return created2;
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
function frontmatterOf(content) {
  const m3 = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (!m3) return void 0;
  try {
    const parsed = (0, import_obsidian3.parseYaml)(m3[1]);
    return parsed && typeof parsed === "object" ? parsed : void 0;
  } catch {
    return void 0;
  }
}

// src/obsidian/header-mount.ts
var import_obsidian5 = require("obsidian");

// ../shared/src/header-mount.ts
var HEADER_SIZERS = ".cm-sizer, .markdown-preview-sizer";
function headerContainer(sizer) {
  if (!sizer.className.split(" ").includes("markdown-preview-sizer")) return sizer;
  return Array.from(sizer.children).find((c3) => c3.className.split(" ").includes("mod-header")) ?? null;
}
function findHost(sizer, className) {
  for (const child of Array.from(sizer.children)) if (child.className === className) return child;
  return null;
}
function keepFirst(sizer, host) {
  if (sizer.firstElementChild === host) return false;
  sizer.prepend(host);
  return true;
}
function placeHeaders(sizers, className, show, create) {
  const hosts = [];
  const removed = [];
  for (const sizer of sizers) {
    let host = findHost(sizer, className);
    if (!show) {
      if (host) {
        host.remove();
        removed.push(host);
      }
      continue;
    }
    if (!host) host = create();
    keepFirst(sizer, host);
    hosts.push(host);
  }
  return { hosts, removed };
}
function headerMissing(sizers, className) {
  return sizers.some((sizer) => sizer.firstElementChild?.className !== className);
}
function eachSafely(items, fn) {
  const errors = [];
  for (const item2 of items) {
    try {
      fn(item2);
    } catch (e3) {
      errors.push(e3);
    }
  }
  return errors;
}
function remeasureEditor(view) {
  const cm = view.editor?.cm;
  cm?.requestMeasure?.();
}
function installHeaderMount(options) {
  const { plugin, className } = options;
  const { app } = plugin;
  const observers = /* @__PURE__ */ new Map();
  const resizers = /* @__PURE__ */ new Map();
  const scrolls = /* @__PURE__ */ new Map();
  const report = (errors) => {
    for (const e3 of errors) console.error(`[${plugin.manifest.id}] header`, e3);
  };
  const sizersOf = (view) => Array.from(view.contentEl.querySelectorAll(HEADER_SIZERS)).flatMap((sizer) => {
    const target = headerContainer(sizer);
    return target ? [target] : [];
  });
  const watch = (view, sizer, host) => {
    unwatch(sizer);
    const keep = new MutationObserver(() => {
      keepFirst(sizer, host);
    });
    keep.observe(sizer, { childList: true });
    const list = [keep];
    const parent = sizer.parentElement;
    if (parent) {
      const replaced = new MutationObserver(() => {
        if (!sizer.isConnected) check(view);
      });
      replaced.observe(parent, { childList: true });
      list.push(replaced);
    }
    observers.set(sizer, list);
    if (options.resized && !resizers.has(host) && typeof ResizeObserver !== "undefined") {
      const resized = options.resized;
      const ro = new ResizeObserver(() => {
        try {
          resized(view);
        } catch (e3) {
          report([e3]);
        }
      });
      ro.observe(host);
      resizers.set(host, ro);
    }
  };
  const unwatch = (sizer) => {
    for (const o3 of observers.get(sizer) ?? []) o3.disconnect();
    observers.delete(sizer);
  };
  const unresize = (host) => {
    resizers.get(host)?.disconnect();
    resizers.delete(host);
  };
  let pending = /* @__PURE__ */ new Set();
  let frame;
  const check = (view) => {
    pending.add(view);
    if (frame !== void 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = void 0;
      const views = Array.from(pending);
      pending = /* @__PURE__ */ new Set();
      report(
        eachSafely(views, (v3) => {
          if (scrolls.get(v3.contentEl)?.shown && headerMissing(sizersOf(v3), className)) mount(v3);
        })
      );
    });
  };
  const listenScroll = (view, shown) => {
    const el = view.contentEl;
    const entry = scrolls.get(el);
    if (entry) {
      entry.shown = shown;
      return;
    }
    const onScroll = () => check(view);
    el.addEventListener("scroll", onScroll, { capture: true, passive: true });
    scrolls.set(el, { off: () => el.removeEventListener("scroll", onScroll, { capture: true }), shown });
  };
  const mount = (view) => {
    const sizers = sizersOf(view);
    const model = options.model(view);
    const { hosts, removed } = placeHeaders(sizers, className, model !== null, () => {
      const el = document.createElement("div");
      el.className = className;
      return el;
    });
    for (const host of removed) {
      unresize(host);
      options.clear(host);
    }
    for (const sizer of sizers) {
      const host = findHost(sizer, className);
      if (host) watch(view, sizer, host);
      else unwatch(sizer);
    }
    listenScroll(view, model !== null);
    if (model !== null) report(eachSafely(hosts, (host) => options.draw(host, model, view)));
  };
  const refresh = () => {
    const views = options.views();
    report(eachSafely(views, mount));
    for (const sizer of Array.from(observers.keys())) if (!sizer.isConnected) unwatch(sizer);
    for (const host of Array.from(resizers.keys())) if (!host.isConnected) unresize(host);
    const open = new Set(views.map((v3) => v3.contentEl));
    for (const [el, entry] of Array.from(scrolls)) {
      if (open.has(el) && el.isConnected) continue;
      entry.off();
      scrolls.delete(el);
    }
  };
  let timer;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(refresh, 100);
  };
  const now = () => {
    const view = options.activeView();
    if (view) report(eachSafely([view], mount));
    schedule();
  };
  const on = (ref) => plugin.registerEvent(ref);
  on(app.workspace.on("file-open", now));
  on(app.workspace.on("active-leaf-change", now));
  on(app.workspace.on("layout-change", schedule));
  on(app.metadataCache.on("changed", schedule));
  on(app.metadataCache.on("resolved", schedule));
  app.workspace.onLayoutReady(refresh);
  plugin.register(() => {
    window.clearTimeout(timer);
    if (frame !== void 0) window.cancelAnimationFrame(frame);
    for (const list of observers.values()) for (const o3 of list) o3.disconnect();
    observers.clear();
    for (const ro of resizers.values()) ro.disconnect();
    resizers.clear();
    for (const entry of scrolls.values()) entry.off();
    scrolls.clear();
    const selector = className.split(" ").map((c3) => `.${c3}`).join("");
    for (const host of Array.from(document.querySelectorAll(selector))) {
      options.clear(host);
      host.remove();
    }
  });
}

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

// src/core/tmp-list.ts
var TMP_FOLDER = "tmp";
function isTmpPath(path) {
  return path.startsWith(`${TMP_FOLDER}/`);
}
function collectTmpEntries(files) {
  return files.filter((f4) => isTmpPath(f4.path)).map((f4) => ({ path: f4.path, name: f4.path.slice(TMP_FOLDER.length + 1), ext: f4.extension.toLowerCase(), mtime: f4.stat.mtime, size: f4.stat.size }));
}
function filterTmpEntries(entries, query) {
  const q2 = query.trim().toLowerCase();
  if (q2 === "") return [...entries];
  return entries.filter((e3) => e3.name.toLowerCase().includes(q2));
}
function sortTmpEntries(entries, key, order) {
  const sign = order === "asc" ? 1 : -1;
  return [...entries].sort((a3, b2) => {
    const byName = a3.name.localeCompare(b2.name);
    if (key === "name") return sign * byName;
    const d3 = key === "modified" ? a3.mtime - b2.mtime : a3.size - b2.size;
    return d3 !== 0 ? sign * d3 : byName;
  });
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i3 = 0;
  while (value >= 1024 && i3 < units.length - 1) {
    value /= 1024;
    i3++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i3]}`;
}
function formatModified(mtime) {
  const d3 = new Date(mtime);
  const pad = (n2) => String(n2).padStart(2, "0");
  return `${d3.getFullYear()}-${pad(d3.getMonth() + 1)}-${pad(d3.getDate())} ${pad(d3.getHours())}:${pad(d3.getMinutes())}`;
}
var OPENABLE = /* @__PURE__ */ new Set(["md", "canvas", "base", "html", "htm", "avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp", "flac", "m4a", "mp3", "ogg", "wav", "3gp", "mkv", "mov", "mp4", "ogv", "webm", "pdf"]);
function openableInObsidian(ext) {
  return OPENABLE.has(ext.toLowerCase());
}

// src/core/note-list.ts
var WIKI_TYPES = ["concept", "entity", "topic", "answer"];
var TASK_TYPES = ["issue", "routine", "member", "preset"];
function withoutTmp(notes) {
  return notes.filter((n2) => !isTmpPath(n2.path));
}
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
  return !/^(issue|routine|member|preset)\/[^/]+\.md$/.test(path);
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
      model.weekday !== null && /* @__PURE__ */ u3("ol", { class: "vt-tpl-week", "aria-label": "Weekdays", children: WEEKDAYS2.map((w3, i3) => /* @__PURE__ */ u3("li", { class: i3 === model.weekday ? "vt-tpl-week-day is-current" : "vt-tpl-week-day", "aria-current": i3 === model.weekday ? "date" : void 0, children: w3 }, w3)) })
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
function installNoteHeaders(plugin) {
  const { app } = plugin;
  const model = (view) => {
    const file = view.file;
    const info = file ? noteInfo(app, file) : null;
    if (!info || !hasNoteHeader(info.path, info.frontmatter)) return null;
    const type = info.frontmatter.type;
    const needsVault = type === "source" || typeof type === "string" && WIKI_TYPES.includes(type);
    return buildHeader(info, { notes: needsVault ? collectNotes(app) : [], backlinks: needsVault ? backlinkCount(app, info.path) : 0 });
  };
  installHeaderMount({
    plugin,
    className: HEADER_CLASS,
    views: () => {
      const views = [];
      app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof import_obsidian5.MarkdownView) views.push(leaf.view);
      });
      return views;
    },
    activeView: () => app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView),
    model,
    draw: (host, m3) => R(k(NoteHeader, { app, model: m3 }), host),
    clear: (host) => R(null, host),
    resized: remeasureEditor
  });
}

// src/obsidian/link-insert.ts
var import_obsidian8 = require("obsidian");

// ../shared/src/link-chips.ts
var import_state = require("@codemirror/state");
var import_view = require("@codemirror/view");
var import_obsidian6 = require("obsidian");

// ../shared/src/link-query.ts
var PAGE_SIZE = 50;
function parseLinkQuery(input, keys = [], idPrefix = "") {
  const words = [];
  const filters = {};
  for (const token of input.trim().split(/\s+/)) {
    if (token === "") continue;
    const m3 = /^([a-z]+):(.*)$/.exec(token);
    if (m3 && keys.includes(m3[1])) {
      const values = m3[2].split(",").map((v3) => v3.trim().toLowerCase()).filter((v3) => v3 !== "");
      filters[m3[1]] = [...filters[m3[1]] ?? [], ...values];
      continue;
    }
    words.push(token.toLowerCase());
  }
  let number = null;
  if (words.length === 1) {
    const w3 = words[0];
    const re = idPrefix ? new RegExp(`^(?:${idPrefix}-)?(\\d+)$`) : /^(\d+)$/;
    const m3 = re.exec(w3);
    if (m3) number = m3[1];
  }
  return { words: number === null ? words : [], number, filters };
}
function matchRank(haystacks, words) {
  if (words.length === 0) return 1;
  const hs = haystacks.map((h3) => h3.toLowerCase());
  for (const w3 of words) if (!hs.some((h3) => h3.includes(w3))) return null;
  return hs.some((h3) => h3.startsWith(words[0])) ? 0 : 1;
}
function idRank(id, number) {
  const m3 = /(\d+)$/.exec(id);
  if (!m3) return null;
  if (m3[1] === number) return 0;
  return m3[1].startsWith(number) ? 1 : null;
}
function searchItems(items, query, opts) {
  const ranked = [];
  items.forEach((item2, index) => {
    const rank = query.number !== null ? opts.id ? idRank(opts.id(item2), query.number) : null : matchRank(opts.haystacks(item2), query.words);
    if (rank === null) return;
    ranked.push({ item: item2, rank, recency: opts.recency?.(item2) ?? 0, index });
  });
  ranked.sort((a3, b2) => a3.rank - b2.rank || b2.recency - a3.recency || a3.index - b2.index);
  return ranked.map((r3) => r3.item);
}
function pageOf(items, shown) {
  return { items: items.slice(0, shown), rest: Math.max(0, items.length - shown) };
}
function escapeLinkText(text2) {
  return text2.replace(/([\\[\]])/g, "\\$1");
}
function encodeLinkPath(path) {
  return path.replace(/[ ()<>%]/g, (c3) => `%${c3.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}
function markdownLink(text2, path, anchor) {
  return `[${escapeLinkText(text2)}](${encodeLinkPath(path)}${anchor ? `#${encodeLinkPath(anchor)}` : ""})`;
}
function splitLinkTarget(target) {
  const t3 = target.trim().replace(/^<(.*)>$/, "$1");
  if (t3 === "" || t3.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(t3)) return null;
  const hash = t3.indexOf("#");
  const rawPath = hash < 0 ? t3 : t3.slice(0, hash);
  const rawAnchor = hash < 0 ? "" : t3.slice(hash + 1);
  const decode = (s3) => {
    try {
      return decodeURIComponent(s3);
    } catch {
      return s3;
    }
  };
  return { path: decode(rawPath), anchor: decode(rawAnchor) };
}
var LINK_RE = /(!?)\[((?:\\.|[^\]\\\n])*)\]\(([^()\s]+|<[^>\n]+>)\)/g;
function findMarkdownLinks(doc, range) {
  const found = [];
  let offset = 0;
  let fence = null;
  let lineNo = 0;
  let inFrontmatter = false;
  for (const line of doc.split("\n")) {
    const start = offset;
    offset += line.length + 1;
    if (lineNo === 0 && line.trim() === "---") {
      inFrontmatter = true;
      lineNo++;
      continue;
    }
    lineNo++;
    if (inFrontmatter) {
      if (/^(---|\.\.\.)\s*$/.test(line)) inFrontmatter = false;
      continue;
    }
    const f4 = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence !== null) {
      if (f4 && f4[1][0] === fence[0] && f4[1].length >= fence.length && line.trim() === f4[1]) fence = null;
      continue;
    }
    if (f4) {
      fence = f4[1];
      continue;
    }
    if (range && (offset <= range.from || start > range.to)) continue;
    const masked = line.replace(/(`+)[^`]*?\1/g, (m3) => " ".repeat(m3.length));
    for (const m3 of masked.matchAll(LINK_RE)) {
      if (m3[1] === "!") continue;
      const target = splitLinkTarget(m3[3]);
      if (!target) continue;
      const from = start + m3.index;
      found.push({ from, to: from + m3[0].length, text: m3[2].replace(/\\(.)/g, "$1"), ...target });
    }
  }
  return found;
}

// ../shared/src/link-chips.ts
function resolveVaultPath(app, path, source) {
  if (path === "") return null;
  if (app.vault.getFileByPath(path)) return path;
  return app.metadataCache.getFirstLinkpathDest(path, source)?.path ?? null;
}
function openPath(app, path, source, evt, onOpened) {
  void app.workspace.openLinkText(path, source, import_obsidian6.Keymap.isModEvent(evt)).then(() => onOpened?.()).catch((e3) => console.error(e3));
}
var ChipWidget = class extends import_view.WidgetType {
  chip;
  app;
  source;
  constructor(chip, app, source) {
    super();
    this.chip = chip;
    this.app = app;
    this.source = source;
  }
  eq(other) {
    return other.chip.key === this.chip.key && other.chip.mode === this.chip.mode;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = `vt-link-chip is-${this.chip.mode}`;
    this.chip.render(el);
    if (this.chip.mode === "replace") {
      el.setAttribute("role", "link");
      el.addEventListener("mousedown", (e3) => e3.preventDefault());
      el.addEventListener("click", (e3) => {
        e3.preventDefault();
        openPath(this.app, this.chip.open ?? "", this.source, e3, this.chip.onOpened);
      });
    }
    return el;
  }
  ignoreEvent() {
    return this.chip.mode === "replace";
  }
};
function touches(state, from, to) {
  return state.selection.ranges.some((r3) => r3.from <= to && r3.to >= from);
}
function buildDecorations(view, app, opts) {
  return chipDecorations(view.state, view.visibleRanges, app, opts);
}
function chipDecorations(state, visible, app, opts) {
  if (!state.field(import_obsidian6.editorLivePreviewField, false)) return import_view.Decoration.none;
  const source = state.field(import_obsidian6.editorInfoField, false)?.file?.path ?? "";
  const doc = state.doc.toString();
  const ranges = [];
  const seen = /* @__PURE__ */ new Set();
  for (const vr of visible) {
    for (const link of findMarkdownLinks(doc, vr)) {
      if (seen.has(link.from)) continue;
      seen.add(link.from);
      const chip = opts.resolve({ path: link.path, anchor: link.anchor, text: link.text, source });
      if (!chip) continue;
      const widget = new ChipWidget(chip, app, source);
      if (chip.mode === "replace") {
        if (touches(state, link.from, link.to)) continue;
        ranges.push(import_view.Decoration.replace({ widget }).range(link.from, link.to));
      } else {
        ranges.push(import_view.Decoration.widget({ widget, side: -1 }).range(link.from));
      }
    }
  }
  return import_view.Decoration.set(ranges, true);
}
function installLinkChips(plugin, opts) {
  const app = plugin.app;
  const refresh = import_state.StateEffect.define();
  const viewPlugin = import_view.ViewPlugin.fromClass(
    class {
      decorations;
      constructor(view) {
        this.decorations = buildDecorations(view, app, opts);
      }
      update(u4) {
        const modeChanged = u4.startState.field(import_obsidian6.editorLivePreviewField, false) !== u4.state.field(import_obsidian6.editorLivePreviewField, false);
        const asked = u4.transactions.some((t3) => t3.effects.some((e3) => e3.is(refresh)));
        if (u4.docChanged || u4.selectionSet || u4.viewportChanged || modeChanged || asked) this.decorations = buildDecorations(u4.view, app, opts);
      }
    },
    { decorations: (v3) => v3.decorations }
  );
  plugin.registerEditorExtension(viewPlugin);
  plugin.register(
    opts.subscribe(() => {
      app.workspace.iterateAllLeaves((leaf) => {
        const cm = leaf.view.editor?.cm;
        if (cm instanceof import_view.EditorView) cm.dispatch({ effects: refresh.of(null) });
      });
    })
  );
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    for (const a3 of Array.from(el.querySelectorAll("a.internal-link"))) {
      const href = a3.getAttribute("data-href") ?? a3.getAttribute("href") ?? "";
      const target = splitLinkTarget(href);
      if (!target) continue;
      const text2 = a3.textContent ?? "";
      let lead = null;
      let replaced = false;
      let current = null;
      const undo = () => {
        lead?.remove();
        lead = null;
        if (replaced) {
          a3.removeClass("vt-link-chip", "is-replace");
          a3.setText(text2);
          replaced = false;
        }
      };
      const draw = () => {
        undo();
        const chip = opts.resolve({ ...target, text: text2, source: ctx.sourcePath });
        current = chip;
        if (!chip) return;
        if (chip.mode === "replace") {
          a3.empty();
          a3.addClass("vt-link-chip", "is-replace");
          chip.render(a3);
          replaced = true;
          return;
        }
        lead = document.createElement("span");
        lead.className = "vt-link-chip is-before";
        chip.render(lead);
        a3.prepend(lead);
      };
      draw();
      a3.addEventListener("click", (e3) => {
        const chip = current;
        if (!chip?.onOpened || chip.open === void 0) return;
        e3.preventDefault();
        e3.stopPropagation();
        openPath(app, chip.open, ctx.sourcePath, e3, chip.onOpened);
      });
      const child = new import_obsidian6.MarkdownRenderChild(a3);
      child.onload = () => child.register(opts.subscribe(draw));
      ctx.addChild(child);
    }
  });
}

// ../shared/src/link-picker.ts
var import_obsidian7 = require("obsidian");
var LinkPicker = class extends import_obsidian7.SuggestModal {
  shown = PAGE_SIZE;
  lastQuery = null;
  source;
  constructor(app, source) {
    super(app);
    this.source = source;
    registerCloseKey(this);
    this.limit = Number.MAX_SAFE_INTEGER;
    this.modalEl.addClass("vt-link-picker");
    this.apply(source);
    this.inputEl.addEventListener("keydown", (e3) => {
      if (e3.key !== "Backspace" || this.inputEl.value !== "" || !this.source.back) return;
      if (this.source.back(this)) e3.preventDefault();
    });
  }
  /** 中身を差し替える（2 段階の検索の次の段）。打った文字は消す */
  setSource(source, query = "") {
    this.source = source;
    this.apply(source);
    this.setQuery(query);
  }
  setQuery(query) {
    this.inputEl.value = query;
    this.inputEl.dispatchEvent(new Event("input"));
  }
  apply(source) {
    this.setPlaceholder(source.placeholder);
    this.emptyStateText = source.empty ?? "No matches";
    this.setInstructions(source.hint ? [{ command: "", purpose: source.hint }] : []);
  }
  getSuggestions(query) {
    if (query !== this.lastQuery) {
      this.shown = PAGE_SIZE;
      this.lastQuery = query;
    }
    const { items, rest } = pageOf(this.source.search(query), this.shown);
    const rows = items.map((item2) => ({ item: item2 }));
    if (rest > 0) rows.push({ more: rest });
    return rows;
  }
  renderSuggestion(row, el) {
    if ("more" in row) {
      el.addClass("vt-link-more");
      el.setText(`Load more (${row.more})`);
      return;
    }
    el.addClass("vt-link-row");
    this.source.render(row.item, el);
  }
  selectSuggestion(row, _evt) {
    if ("more" in row) {
      this.shown += PAGE_SIZE;
      this.inputEl.dispatchEvent(new Event("input"));
      return;
    }
    if (this.source.choose(row.item, this) === "stay") return;
    this.close();
  }
  onChooseSuggestion() {
  }
};
function insertAtCursor(editor, text2) {
  editor.replaceSelection(text2);
  editor.focus();
}
function renderRow(el, parts) {
  const lead = el.createSpan({ cls: "vt-link-row-lead" });
  parts.lead?.(lead);
  el.createSpan({ cls: `vt-link-row-title${parts.done ? " is-done" : ""}`, text: parts.title });
  if (parts.note) el.createSpan({ cls: "vt-link-row-note", text: parts.note });
}

// src/core/link-search.ts
var NOTE_EXCLUDED = ["issue/", "routine/", "member/", "daily/", "tmp/", "template/"];
var TASK_FOLDERS = ["issue/", "routine/", "member/"];
function aliasesOf(fm) {
  const a3 = fm.aliases;
  return Array.isArray(a3) ? a3.filter((x2) => typeof x2 === "string") : typeof a3 === "string" ? [a3] : [];
}
function isLinkableNote(path) {
  return !path.startsWith(".") && !NOTE_EXCLUDED.some((f4) => path.startsWith(f4));
}
function searchNotes(notes, input, recency) {
  const q2 = parseLinkQuery(input, ["t", "f"]);
  const types = (q2.filters.t ?? []).flatMap((t3) => t3 === "wiki" ? [...WIKI_TYPES] : [t3]);
  const folders = (q2.filters.f ?? []).map((f4) => f4.replace(/^\/+/, ""));
  const words = q2.number !== null ? [q2.number] : q2.words;
  const pool = notes.filter(
    (n2) => isLinkableNote(n2.path) && (types.length === 0 || types.includes(String(n2.frontmatter.type ?? ""))) && (folders.length === 0 || folders.some((f4) => n2.path.toLowerCase().startsWith(f4)))
  );
  return searchItems(pool, { ...q2, words, number: null }, {
    haystacks: (n2) => [noteTitle(n2.frontmatter, n2.basename), ...aliasesOf(n2.frontmatter), n2.path],
    recency: (n2) => recency(n2.path)
  });
}
function noteLinkOf(n2) {
  return markdownLink(noteTitle(n2.frontmatter, n2.basename), n2.path);
}
function searchHeadings(headings, input) {
  const q2 = parseLinkQuery(input);
  const words = q2.number !== null ? [q2.number] : q2.words;
  return searchItems(headings, { ...q2, words, number: null }, { haystacks: (h3) => [h3.heading] });
}
function headingLink(n2, heading) {
  return markdownLink(`${noteTitle(n2.frontmatter, n2.basename)} \u203A ${heading}`, n2.path, heading);
}
function dailyEntries(paths) {
  return paths.flatMap((path) => {
    if (!path.startsWith("daily/") || !path.endsWith(".md")) return [];
    const d3 = dailyDate((path.split("/").pop() ?? "").replace(/\.md$/, ""));
    return d3 ? [{ path, date: d3.date, label: d3.label }] : [];
  });
}
function searchDailies(entries, input) {
  const q2 = parseLinkQuery(input);
  const words = q2.number !== null ? [q2.number] : q2.words;
  const sorted = [...entries].sort((a3, b2) => b2.date.localeCompare(a3.date));
  return sorted.filter((e3) => words.every((w3) => e3.label.toLowerCase().includes(w3) || e3.date.replace(/-/g, "").includes(w3.replace(/-/g, ""))));
}
function dailyLink(e3) {
  return markdownLink(e3.label, e3.path);
}
function searchDecks(decks, input) {
  const q2 = parseLinkQuery(input);
  const words = q2.number !== null ? [q2.number] : q2.words;
  return searchItems(decks, { ...q2, words, number: null }, { haystacks: (d3) => [d3.title, d3.path], recency: (d3) => d3.mtime });
}
function linkIcon(path, anchor, type) {
  if (TASK_FOLDERS.some((f4) => path.startsWith(f4))) return null;
  if (path.startsWith("slide/")) return "presentation";
  if (!path.endsWith(".md")) return null;
  if (anchor !== "") return "hash";
  if (path.startsWith("daily/")) return "calendar";
  if (typeof type === "string" && WIKI_TYPES.includes(type)) return "book-open";
  if (type === "source") return "library";
  return "file-text";
}

// src/obsidian/link-insert.ts
function icon(el, name) {
  const span = el.createSpan({ cls: "vt-icon", attr: { "aria-hidden": "true" } });
  (0, import_obsidian8.setIcon)(span, name);
}
var recencyOf = (app) => (path) => app.vault.getFileByPath(path)?.stat.mtime ?? 0;
function noteRow(n2, el) {
  const folder = n2.path.includes("/") ? n2.path.slice(0, n2.path.lastIndexOf("/")) : "";
  renderRow(el, { lead: (l3) => icon(l3, linkIcon(n2.path, "", n2.frontmatter.type) ?? "file-text"), title: noteTitle(n2.frontmatter, n2.basename), note: folder });
}
function noteSource(app, editor) {
  const notes = collectNotes(app);
  return {
    placeholder: "Search notes",
    hint: "t:wiki / t:<type> \xB7 f:<folder>/",
    search: (q2) => searchNotes(notes, q2, recencyOf(app)),
    render: noteRow,
    choose: (n2) => insertAtCursor(editor, noteLinkOf(n2))
  };
}
function headingSource(app, editor) {
  const notes = collectNotes(app);
  const headingsStep = (n2) => {
    const file = app.vault.getFileByPath(n2.path);
    const headings = (file ? app.metadataCache.getFileCache(file)?.headings : void 0) ?? [];
    const list = headings.map((h3) => ({ heading: h3.heading, level: h3.level }));
    return {
      placeholder: `Headings in ${noteTitle(n2.frontmatter, n2.basename)}`,
      hint: "Backspace: back to notes",
      search: (q2) => searchHeadings(list, q2).map((heading) => ({ heading, of: n2 })),
      render: (row, el) => {
        if (!("heading" in row)) return;
        renderRow(el, { lead: (l3) => l3.createSpan({ cls: "vt-link-row-note", text: "#".repeat(row.heading.level) }), title: row.heading.heading });
      },
      choose: (row) => {
        if ("heading" in row) insertAtCursor(editor, headingLink(row.of, row.heading.heading));
      },
      back: (picker) => {
        picker.setSource(first);
        return true;
      },
      empty: "No headings"
    };
  };
  const first = {
    placeholder: "Search notes, then a heading",
    hint: "t:wiki / t:<type> \xB7 f:<folder>/",
    search: (q2) => searchNotes(notes, q2, recencyOf(app)).map((note) => ({ note })),
    render: (row, el) => {
      if ("note" in row) noteRow(row.note, el);
    },
    choose: (row, picker) => {
      if (!("note" in row)) return;
      picker.setSource(headingsStep(row.note));
      return "stay";
    }
  };
  return first;
}
async function dailySource(app, manager, editor, report) {
  const entries = dailyEntries(app.vault.getMarkdownFiles().map((f4) => f4.path));
  const { path, existing } = await manager.todaysDaily();
  const d3 = dailyDate((path.split("/").pop() ?? "").replace(/\.md$/, ""));
  const today = !existing && d3 ? { path, date: d3.date, label: d3.label } : null;
  return {
    placeholder: "Search daily notes (e.g. 1120, 2026-11)",
    search: (q2) => {
      const rows = searchDailies(entries, q2).map((entry) => ({ entry }));
      if (today && searchDailies([today], q2).length > 0) rows.unshift({ today });
      return rows;
    },
    render: (row, el) => {
      const e3 = "today" in row ? row.today : row.entry;
      renderRow(el, { lead: (l3) => icon(l3, "calendar"), title: e3.label, note: "today" in row ? "Today (create)" : "" });
    },
    choose: async (row) => {
      if ("entry" in row) return insertAtCursor(editor, dailyLink(row.entry));
      try {
        await manager.createTodaysDaily();
        insertAtCursor(editor, dailyLink(row.today));
      } catch (e3) {
        report("\u4ECA\u65E5\u306E\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
      }
    }
  };
}
var DECK_BUILD = "index.html";
async function loadDecks(app) {
  const builds = app.vault.getFiles().filter((f4) => f4.path.startsWith("slide/") && f4.name === DECK_BUILD);
  return Promise.all(
    builds.map(async (f4) => {
      const folder = f4.parent?.path ?? "";
      const source = app.vault.getFileByPath(`${folder}/deck.html`) ?? f4;
      const text2 = await app.vault.cachedRead(source).catch(() => "");
      const m3 = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text2);
      const title = (m3?.[1] ?? "").replace(/\s+/g, " ").trim() || folder.split("/").pop() || folder;
      return { path: f4.path, title, mtime: source.stat.mtime };
    })
  );
}
function slideSource(decks, editor) {
  return {
    placeholder: "Search slide decks",
    search: (q2) => searchDecks(decks, q2),
    render: (d3, el) => renderRow(el, { lead: (l3) => icon(l3, "presentation"), title: d3.title, note: d3.path.replace(/^slide\//, "").replace(/\/index\.html$/, "") }),
    choose: (d3) => insertAtCursor(editor, markdownLink(d3.title, d3.path)),
    empty: "No slide decks"
  };
}
function chipFor(app, t3) {
  const path = resolveVaultPath(app, t3.path, t3.source);
  if (!path) return null;
  const file = app.vault.getFileByPath(path);
  if (!(file instanceof import_obsidian8.TFile)) return null;
  const type = file.extension === "md" ? app.metadataCache.getFileCache(file)?.frontmatter?.type : void 0;
  const name = linkIcon(path, t3.anchor, type);
  if (!name) return null;
  return { mode: "before", key: name, render: (el) => (0, import_obsidian8.setIcon)(el, name) };
}
function installLinkInsert(plugin, manager, report) {
  const app = plugin.app;
  const open = (source) => new LinkPicker(app, source).open();
  plugin.addCommand({ id: "insert-note-link", name: "Insert link to note", icon: "link", editorCallback: (editor) => open(noteSource(app, editor)) });
  plugin.addCommand({ id: "insert-heading-link", name: "Insert link to heading", icon: "link", editorCallback: (editor) => open(headingSource(app, editor)) });
  plugin.addCommand({
    id: "insert-daily-link",
    name: "Insert link to daily note",
    icon: "link",
    editorCallback: (editor) => {
      dailySource(app, manager, editor, report).then(open, (e3) => report("\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u306E\u4E00\u89A7\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    }
  });
  plugin.addCommand({
    id: "insert-slide-link",
    name: "Insert link to slide deck",
    icon: "link",
    editorCallback: (editor) => {
      loadDecks(app).then((decks) => open(slideSource(decks, editor)), (e3) => report("\u30B9\u30E9\u30A4\u30C9\u306E\u4E00\u89A7\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    }
  });
  installLinkChips(plugin, {
    resolve: (t3) => chipFor(app, t3),
    subscribe: (fn) => {
      let timer;
      const bump = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(fn, 300);
      };
      const meta = app.metadataCache.on("resolved", bump);
      const files = [app.vault.on("create", bump), app.vault.on("delete", bump), app.vault.on("rename", bump)];
      return () => {
        window.clearTimeout(timer);
        app.metadataCache.offref(meta);
        for (const r3 of files) app.vault.offref(r3);
      };
    }
  });
}

// src/obsidian/snippet-session.ts
var import_state2 = require("@codemirror/state");
var lastId = 0;
var newId = () => ++lastId;
function typedCharAt(tr, char) {
  if (!tr.docChanged || !tr.isUserEvent("input.type")) return null;
  let at = null;
  let count = 0;
  tr.changes.iterChanges((fromA, toA, fromB, _toB, inserted) => {
    count++;
    if (fromA === toA && inserted.toString() === char) at = fromB;
  });
  return count === 1 ? at : null;
}
function sessionField(trigger) {
  return import_state2.StateField.define({
    create: () => null,
    update(prev, tr) {
      if (!tr.docChanged && !tr.selection) return prev;
      const doc = tr.state.doc;
      const sel = tr.state.selection.main;
      return nextTriggerSession(
        trigger,
        prev,
        { typedAt: typedCharAt(tr, trigger.char), mapPos: (p3) => tr.changes.mapPos(p3, 1), head: sel.head, empty: sel.empty },
        { lineStartAt: (pos) => doc.lineAt(pos).from, slice: (from, to) => doc.sliceString(Math.max(0, from), to) },
        newId
      );
    }
  });
}
var slashSessionField = sessionField(SLASH_TRIGGER);
var atSessionField = sessionField(AT_TRIGGER);

// src/obsidian/SnippetSuggest.ts
var import_obsidian9 = require("obsidian");
var SNIPPET_KIND = {
  label: "Snippet",
  field: slashSessionField,
  load: (m3) => m3.loadSnippets(),
  bodyOf: (s3) => s3.body
};
var INLINE_KIND = {
  label: "Inline template",
  field: atSessionField,
  load: (m3) => m3.loadInlineTemplates(),
  bodyOf: (s3) => inlineBody(s3.body)
};
var SnippetSuggest = class extends import_obsidian9.EditorSuggest {
  constructor(app, manager, kind = SNIPPET_KIND) {
    super(app);
    this.manager = manager;
    this.kind = kind;
  }
  manager;
  kind;
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
    const session = view?.state.field(this.kind.field, false) ?? null;
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
        snippets: this.kind.load(this.manager).then(({ snippets, problems }) => {
          for (const p3 of problems) console.warn(`pkm-template: ${this.kind.label} \u3092\u8AAD\u3081\u307E\u305B\u3093\u3067\u3057\u305F: ${p3}`);
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
    if (snippet.command !== void 0) {
      this.runCommand(snippet.command, editor, start, end);
      return;
    }
    const body = this.kind.bodyOf(snippet);
    void askDates(this.app, extractDatePrompts(body)).then((dates) => {
      if (dates === null) {
        editor.focus();
        return;
      }
      const rendered = renderTemplate(body, {
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
  /**
   * command のあるスニペット（ADR-0094）とインラインテンプレート（ADR-0194）。打った `/…` や `@…` を消してカーソルをそこに置き、コマンドを実行する。
   * 実行できなければ打った文字を戻して知らせる
   */
  runCommand(command, editor, start, end) {
    const typed = editor.getRange(start, end);
    editor.replaceRange("", start, end);
    editor.setCursor(start);
    editor.focus();
    const commands = this.app.commands;
    if (commands.executeCommandById(command)) return;
    editor.replaceRange(typed, start);
    editor.setCursor(editor.offsetToPos(editor.posToOffset(start) + typed.length));
    new import_obsidian9.Notice(`${command} \u3092\u5B9F\u884C\u3067\u304D\u307E\u305B\u3093\uFF08${command.split(":")[0]} \u304C\u6709\u52B9\u306B\u306A\u3063\u3066\u3044\u307E\u305B\u3093\uFF09`);
  }
};

// src/obsidian/view.ts
var import_obsidian10 = require("obsidian");
function preactViewCreator(spec, app) {
  class PreactView extends import_obsidian10.ItemView {
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
var import_obsidian13 = require("obsidian");

// src/views/NoteFolders.tsx
var import_obsidian12 = require("obsidian");

// src/core/note-folders.ts
var NOTE_ROOT = "note";
var KEEP_FILE = ".gitkeep";
var BAD_CHARS = /[\\/:*?"<>|#^[\]]/;
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
function isHidden(path) {
  return path.split("/").some((part) => part.startsWith("."));
}
function noteFolders(folders) {
  const set = /* @__PURE__ */ new Set([NOTE_ROOT, ...folders.filter((f4) => isWithin(f4, NOTE_ROOT) && !isHidden(f4))]);
  return [...set].sort((a3, b2) => a3.localeCompare(b2));
}
function childrenOf(folders, notes, parent) {
  const direct = (p3) => p3 !== parent && parentOf(p3) === parent;
  return { folders: folders.filter(direct).sort((a3, b2) => a3.localeCompare(b2)), notes: notes.filter(direct) };
}
function countIn(notes, folder) {
  return notes.filter((n2) => isWithin(n2, folder)).length;
}
function outsideNotes(notes) {
  return notes.filter((n2) => !isWithin(n2, NOTE_ROOT));
}
function locationOf(path) {
  const parent = parentOf(path);
  if (isWithin(parent, NOTE_ROOT)) return parent === NOTE_ROOT ? "" : parent.slice(NOTE_ROOT.length + 1);
  return parent === "" ? "/" : parent;
}
function folderNameError(name) {
  if (name === "") return "\u540D\u524D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  if (BAD_CHARS.test(name)) return '\u540D\u524D\u306B \\ / : * ? " < > | # ^ [ ] \u306F\u4F7F\u3048\u307E\u305B\u3093';
  if (name.startsWith(".")) return "\u540D\u524D\u3092 . \u3067\u59CB\u3081\u308B\u3068\u3001\u96A0\u3057\u30D5\u30A9\u30EB\u30C0\u306B\u306A\u308A\u307E\u3059";
  return null;
}
function moveTarget(folders, source, dest, exists) {
  if (source === NOTE_ROOT) return { error: "note/ \u305D\u306E\u3082\u306E\u306F\u52D5\u304B\u305B\u307E\u305B\u3093" };
  if (!folders.includes(dest)) return { error: "\u884C\u304D\u5148\u306F note/ \u304B\u3001\u305D\u306E\u4E0B\u306E\u30D5\u30A9\u30EB\u30C0\u306B\u3057\u307E\u3059" };
  if (isWithin(dest, source)) return { error: "\u30D5\u30A9\u30EB\u30C0\u3092\u3001\u305D\u306E\u30D5\u30A9\u30EB\u30C0\u81EA\u8EAB\u3084\u305D\u306E\u4E0B\u306B\u306F\u52D5\u304B\u305B\u307E\u305B\u3093" };
  if (parentOf(source) === dest) return { error: "\u3059\u3067\u306B\u305D\u306E\u30D5\u30A9\u30EB\u30C0\u306B\u3042\u308A\u307E\u3059" };
  const path = `${dest}/${baseName(source)}`;
  if (exists(path)) return { error: `${path} \u304C\u3059\u3067\u306B\u3042\u308A\u307E\u3059` };
  return { path };
}
function renameTarget(source, name, exists) {
  if (source === NOTE_ROOT) return { error: "note/ \u305D\u306E\u3082\u306E\u306E\u540D\u524D\u306F\u5909\u3048\u3089\u308C\u307E\u305B\u3093" };
  const bad = folderNameError(name);
  if (bad !== null) return { error: bad };
  const path = `${parentOf(source)}/${name}`;
  if (path === source) return { error: "\u540C\u3058\u540D\u524D\u3067\u3059" };
  if (exists(path)) return { error: `${path} \u304C\u3059\u3067\u306B\u3042\u308A\u307E\u3059` };
  return { path };
}
function isDeletable(files, folder) {
  if (folder === NOTE_ROOT) return false;
  return files.every((f4) => !isWithin(f4, folder) || baseName(f4) === KEEP_FILE);
}

// src/obsidian/note-folder-actions.ts
var import_obsidian11 = require("obsidian");
function collectNoteFolders(app) {
  const folders = [];
  const files = [];
  const walk = (node) => {
    if (node instanceof import_obsidian11.TFolder) {
      folders.push(node.path);
      for (const c3 of node.children) walk(c3);
    } else files.push(node.path);
  };
  const root = app.vault.getAbstractFileByPath(NOTE_ROOT);
  if (root instanceof import_obsidian11.TFolder) walk(root);
  return { folders: noteFolders(folders), files };
}
var NoteFolderActions = class {
  constructor(app) {
    this.app = app;
  }
  app;
  exists = (path) => this.app.vault.getAbstractFileByPath(path) !== null;
  async ensureRoot() {
    if (!this.exists(NOTE_ROOT)) await this.app.vault.createFolder(NOTE_ROOT);
  }
  /** フォルダを作り、.gitkeep を置く */
  newFolder(parent) {
    new NameModal(this.app, { title: "New folder", cta: "Create", initial: "", check: (name) => folderNameError(name) ?? (this.exists(`${parent}/${name}`) ? `${parent}/${name} \u304C\u3059\u3067\u306B\u3042\u308A\u307E\u3059` : null) }, async (name) => {
      await this.ensureRoot();
      const path = `${parent}/${name}`;
      await this.app.vault.createFolder(path);
      await this.app.vault.create(`${path}/${KEEP_FILE}`, "");
    }).open();
  }
  rename(folder) {
    const current = folder.slice(folder.lastIndexOf("/") + 1);
    new NameModal(this.app, { title: "Rename folder", cta: "Rename", initial: current, check: (name) => name === current ? null : errorOf(renameTarget(folder, name, this.exists)) }, async (name) => {
      if (name === current) return;
      const target = renameTarget(folder, name, this.exists);
      if ("error" in target) throw new Error(target.error);
      await this.relocate(folder, target.path);
    }).open();
  }
  /** 行き先のフォルダを選んで動かす */
  moveTo(path) {
    const { folders } = collectNoteFolders(this.app);
    const choices = folders.filter((f4) => !("error" in moveTarget(folders, path, f4, this.exists)));
    if (choices.length === 0) {
      new import_obsidian11.Notice("\u52D5\u304B\u305B\u308B\u5148\u306E\u30D5\u30A9\u30EB\u30C0\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u5148\u306B New folder \u3067\u30D5\u30A9\u30EB\u30C0\u3092\u4F5C\u3063\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    new FolderModal(this.app, choices, (dest) => void this.move(path, dest)).open();
  }
  /** ドラッグで落としたときにも使う */
  async move(path, dest) {
    const { folders } = collectNoteFolders(this.app);
    const target = moveTarget(folders, path, dest, this.exists);
    if ("error" in target) {
      new import_obsidian11.Notice(target.error);
      return;
    }
    await this.ensureRoot();
    await this.relocate(path, target.path);
  }
  /** 中に .gitkeep しかないフォルダを消す（ゴミ箱へ） */
  async deleteFolder(path) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!(folder instanceof import_obsidian11.TFolder)) return;
    if (!isDeletable(collectNoteFolders(this.app).files, path)) {
      new import_obsidian11.Notice("\u30D5\u30A1\u30A4\u30EB\u306E\u5165\u3063\u3066\u3044\u308B\u30D5\u30A9\u30EB\u30C0\u306F\u6D88\u305B\u307E\u305B\u3093\u3002\u5148\u306B\u4E2D\u306E\u30CE\u30FC\u30C8\u3092\u52D5\u304B\u3057\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    await this.app.fileManager.trashFile(folder);
  }
  async open(path, newTab) {
    const file = this.app.vault.getFileByPath(path);
    if (file) await openInNotePane(this.app.workspace, file, { phone: import_obsidian11.Platform.isPhone, newTab });
  }
  async relocate(from, to) {
    const node = this.app.vault.getAbstractFileByPath(from);
    if (node === null) return;
    try {
      await this.app.fileManager.renameFile(node, to);
      new import_obsidian11.Notice(`${node instanceof import_obsidian11.TFile ? node.basename : from} \u3092 ${parentOfPath(to)}/ \u306B\u52D5\u304B\u3057\u307E\u3057\u305F`);
    } catch (e3) {
      new import_obsidian11.Notice(`\u52D5\u304B\u305B\u307E\u305B\u3093\u3067\u3057\u305F: ${e3 instanceof Error ? e3.message : String(e3)}`);
    }
  }
};
function parentOfPath(path) {
  return path.slice(0, path.lastIndexOf("/"));
}
function errorOf(r3) {
  return "error" in r3 ? r3.error : null;
}
var NameModal = class extends import_obsidian11.Modal {
  constructor(app, spec, submit) {
    super(app);
    this.spec = spec;
    this.submit = submit;
    registerCloseKey(this);
  }
  spec;
  submit;
  onOpen() {
    this.setTitle(this.spec.title);
    this.contentEl.addClass("vt-ui", "vt-tpl-modal");
    let value = this.spec.initial;
    const HINT = "Folder name under note/";
    const hint = createEl("p", { cls: "vt-tpl-hint", text: HINT });
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
        new import_obsidian11.Notice(`\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${e3 instanceof Error ? e3.message : String(e3)}`);
      }
    };
    new import_obsidian11.Setting(this.contentEl).setName("Name").addText((text2) => {
      text2.setValue(value).onChange((v3) => {
        value = v3.trim();
        update();
      });
      text2.inputEl.addEventListener("keydown", (e3) => {
        if (e3.key === "Enter" && !e3.isComposing) {
          e3.preventDefault();
          void run();
        }
      });
      window.setTimeout(() => text2.inputEl.select(), 0);
    });
    this.contentEl.appendChild(hint);
    new import_obsidian11.Setting(this.contentEl).addButton((b2) => b2.setButtonText("Cancel").onClick(() => this.close())).addButton((b2) => {
      button = b2.buttonEl;
      b2.setButtonText(this.spec.cta).setCta().onClick(() => void run());
    });
    update();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var FolderModal = class extends import_obsidian11.FuzzySuggestModal {
  constructor(app, folders, choose) {
    super(app);
    this.folders = folders;
    this.choose = choose;
    registerCloseKey(this);
    this.setPlaceholder("Move to folder\u2026");
  }
  folders;
  choose;
  getItems() {
    return this.folders;
  }
  getItemText(folder) {
    return `${folder}/`;
  }
  onChooseItem(folder) {
    this.choose(folder);
  }
};

// src/views/NoteFolders.tsx
var DRAG_TYPE = "text/x-pkm-note";
var OPEN_KEY = "pkm-template-note-open-folders";
var OTHER = "\0other";
function Icon({ name }) {
  const ref = A2(null);
  h2(() => {
    if (ref.current) (0, import_obsidian12.setIcon)(ref.current, name);
  }, [name]);
  return /* @__PURE__ */ u3("span", { class: "vt-tpl-icon", ref, "aria-hidden": "true" });
}
function loadOpen(app) {
  try {
    const v3 = app.loadLocalStorage(OPEN_KEY);
    return new Set(Array.isArray(v3) ? v3.filter((x2) => typeof x2 === "string") : []);
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function NoteFolders({ app, notes, tick, query }) {
  const actions = T2(() => new NoteFolderActions(app), [app]);
  const [sort, setSort] = d2("created");
  const [open, setOpen] = d2(() => loadOpen(app));
  const [dropOn, setDropOn] = d2(null);
  const canDrag = !import_obsidian12.Platform.isMobile;
  const snapshot = T2(() => collectNoteFolders(app), [app, tick]);
  const byPath = T2(() => new Map(notes.map((n2) => [n2.path, n2])), [notes]);
  const paths = T2(() => notes.map((n2) => n2.path), [notes]);
  const order = (list) => sortNotes(
    list.map((p3) => byPath.get(p3)).filter((n2) => n2 !== void 0),
    sort,
    sort === "title" ? "asc" : "desc"
  );
  const found = query.trim() === "" ? null : sortNotes(filterByQuery(notes, query), sort, sort === "title" ? "asc" : "desc");
  const other = order(outsideNotes(paths));
  const toggle = (f4) => {
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(f4)) next.delete(f4);
      else next.add(f4);
      try {
        app.saveLocalStorage(OPEN_KEY, [...next]);
      } catch {
      }
      return next;
    });
  };
  const folderMenu = (e3, f4) => {
    e3.preventDefault();
    e3.stopPropagation();
    const menu = new import_obsidian12.Menu();
    menu.addItem((i3) => i3.setTitle("New folder").setIcon("folder-plus").onClick(() => actions.newFolder(f4)));
    menu.addItem((i3) => i3.setTitle("Rename").setIcon("pencil").onClick(() => actions.rename(f4)));
    menu.addItem((i3) => i3.setTitle("Move to\u2026").setIcon("folder-input").onClick(() => actions.moveTo(f4)));
    menu.addSeparator();
    menu.addItem(
      (i3) => i3.setTitle("Delete").setIcon("trash-2").setDisabled(!isDeletable(snapshot.files, f4)).onClick(() => void actions.deleteFolder(f4))
    );
    menu.showAtMouseEvent(e3);
  };
  const noteMenu = (e3, n2) => {
    e3.preventDefault();
    e3.stopPropagation();
    const menu = new import_obsidian12.Menu();
    menu.addItem((i3) => i3.setTitle("Open in new tab").setIcon("file-plus").onClick(() => void actions.open(n2.path, true)));
    menu.addItem((i3) => i3.setTitle("Move to\u2026").setIcon("folder-input").onClick(() => actions.moveTo(n2.path)));
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
      e3.stopPropagation();
      e3.dataTransfer.dropEffect = "move";
      setDropOn(f4);
    },
    onDragLeave: (e3) => {
      if (e3.currentTarget instanceof Node && e3.relatedTarget instanceof Node && e3.currentTarget.contains(e3.relatedTarget)) return;
      setDropOn((cur) => cur === f4 ? null : cur);
    },
    onDrop: (e3) => {
      const path = e3.dataTransfer?.getData(DRAG_TYPE);
      setDropOn(null);
      if (!path) return;
      e3.preventDefault();
      e3.stopPropagation();
      void actions.move(path, f4);
    }
  });
  const noteRow2 = (n2, where) => {
    const tags = tagList(n2.frontmatter.tags).join(" ");
    return /* @__PURE__ */ u3("li", { class: "vt-tpl-item", role: "none", children: /* @__PURE__ */ u3("div", { class: "vt-tpl-row", onContextMenu: (e3) => noteMenu(e3, n2), ...dragProps(n2.path), children: [
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-row-main", role: "treeitem", onClick: (e3) => void actions.open(n2.path, e3.ctrlKey || e3.metaKey), children: [
        /* @__PURE__ */ u3("span", { class: "vt-tpl-twisty", "aria-hidden": "true" }),
        /* @__PURE__ */ u3(Icon, { name: "file-text" }),
        /* @__PURE__ */ u3("span", { class: "vt-tpl-name", children: noteTitle(n2.frontmatter, n2.basename) || n2.basename }),
        where ? /* @__PURE__ */ u3("span", { class: "vt-tpl-where", children: where }) : null,
        /* @__PURE__ */ u3("span", { class: "vt-tpl-row-meta", children: [
          tags ? /* @__PURE__ */ u3("span", { class: "vt-tpl-row-tags", children: tags }) : null,
          /* @__PURE__ */ u3("span", { children: shortDate(n2.frontmatter.created) })
        ] })
      ] }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-more", "aria-label": `More for ${baseName(n2.path)}`, onClick: (e3) => noteMenu(e3, n2), children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
    ] }) }, n2.path);
  };
  const folderRow = (key, label, count, isOpen, extra, children, more) => /* @__PURE__ */ u3("li", { class: "vt-tpl-item", role: "none", children: [
    /* @__PURE__ */ u3("div", { class: `vt-tpl-row is-folder${dropOn === key ? " is-drop" : ""}`, ...extra, children: [
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-row-main", role: "treeitem", "aria-expanded": isOpen, onClick: () => toggle(key), children: [
        /* @__PURE__ */ u3("span", { class: "vt-tpl-twisty", children: /* @__PURE__ */ u3(Icon, { name: isOpen ? "chevron-down" : "chevron-right" }) }),
        /* @__PURE__ */ u3(Icon, { name: isOpen ? "folder-open" : "folder" }),
        /* @__PURE__ */ u3("span", { class: "vt-tpl-name", children: label }),
        /* @__PURE__ */ u3("span", { class: "vt-tpl-row-meta", children: count })
      ] }),
      more ? /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-more", "aria-label": `More for ${label}`, onClick: more, children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) }) : null
    ] }),
    isOpen ? /* @__PURE__ */ u3("ul", { class: "vt-tpl-group", role: "group", children }) : null
  ] }, key);
  const level = (parent) => {
    const kids = childrenOf(snapshot.folders, paths, parent);
    return /* @__PURE__ */ u3(S, { children: [
      kids.folders.map((f4) => {
        const empty = countIn(paths, f4) === 0 && childrenOf(snapshot.folders, paths, f4).folders.length === 0;
        return folderRow(
          f4,
          baseName(f4),
          countIn(paths, f4),
          open.has(f4),
          { ...dropProps(f4), ...dragProps(f4), onContextMenu: (e3) => folderMenu(e3, f4) },
          /* @__PURE__ */ u3(S, { children: [
            level(f4),
            empty ? /* @__PURE__ */ u3("li", { class: "vt-tpl-item vt-tpl-blank", role: "none", children: "Empty. Drag a note here, or use Move to\u2026." }) : null
          ] }),
          (e3) => folderMenu(e3, f4)
        );
      }),
      order(kids.notes).map((n2) => noteRow2(n2))
    ] });
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-folders", children: [
    /* @__PURE__ */ u3("div", { class: "vt-tpl-folder-tools", children: [
      /* @__PURE__ */ u3("select", { class: "vt-tpl-select", "aria-label": "Sort", value: sort, onChange: (e3) => setSort(e3.currentTarget.value), children: [
        /* @__PURE__ */ u3("option", { value: "created", children: "Created" }),
        /* @__PURE__ */ u3("option", { value: "title", children: "Title" })
      ] }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-button", onClick: () => actions.newFolder(NOTE_ROOT), children: [
        /* @__PURE__ */ u3(Icon, { name: "folder-plus" }),
        "New folder"
      ] })
    ] }),
    found !== null ? found.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-tpl-empty", children: "No matching notes" }) : /* @__PURE__ */ u3("ul", { class: "vt-tpl-tree", role: "tree", "aria-label": "Matching notes", children: found.map((n2) => noteRow2(n2, locationOf(n2.path))) }) : notes.length === 0 && snapshot.folders.length <= 1 ? /* @__PURE__ */ u3("div", { class: "vt-tpl-empty", children: "No notes" }) : /* @__PURE__ */ u3("ul", { class: `vt-tpl-tree${dropOn === NOTE_ROOT ? " is-drop" : ""}`, role: "tree", "aria-label": "Notes", ...dropProps(NOTE_ROOT), children: [
      level(NOTE_ROOT),
      other.length > 0 ? folderRow(OTHER, "Other locations", other.length, open.has(OTHER), {}, other.map((n2) => noteRow2(n2, locationOf(n2.path)))) : null
    ] })
  ] });
}

// src/views/NoteListView.tsx
var MODE_KEY = "pkm-template-note-list-mode";
function loadMode(app) {
  try {
    return app.loadLocalStorage(MODE_KEY) === "folders" ? "folders" : "table";
  } catch {
    return "table";
  }
}
var created = { label: "Created", sort: "created", cell: (n2) => shortDate(n2.frontmatter.created) };
var titleColumn = { label: "Title", sort: "title", cell: (n2) => noteTitle(n2.frontmatter, n2.basename) };
var SPECS = {
  daily: {
    type: "daily",
    empty: "No daily notes",
    sort: "name",
    columns: [{ label: "Date", sort: "name", cell: (n2) => dailyDate(n2.basename)?.label ?? n2.basename }, created]
  },
  note: {
    type: "note",
    empty: "No notes",
    sort: "created",
    columns: [titleColumn, { label: "Tags", cell: (n2) => tagList(n2.frontmatter.tags).join(" ") }, created],
    folders: true
  },
  source: {
    type: "source",
    empty: "No sources",
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
  const [mode, setMode] = d2(() => spec.folders ? loadMode(app) : "table");
  const all = T2(() => withoutTmp(collectNotes(app)), [app, tick]);
  const imported = T2(() => importedSourcePaths(all), [all]);
  const ofType = T2(() => notesOfType(all, spec.type), [all, spec]);
  const rows = T2(() => sortNotes(filterByQuery(ofType, query), sort.key, sort.order), [ofType, query, sort]);
  const toggle = (key) => setSort((s3) => s3.key === key ? { key, order: s3.order === "asc" ? "desc" : "asc" } : { key, order: key === "title" ? "asc" : "desc" });
  const open = (path) => {
    const file = app.vault.getFileByPath(path);
    if (file) void openInNotePane(app.workspace, file, { newTab: false, phone: import_obsidian13.Platform.isPhone });
  };
  const choose = (next) => {
    setMode(next);
    try {
      app.saveLocalStorage(MODE_KEY, next);
    } catch {
    }
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-list", children: [
    spec.folders ? /* @__PURE__ */ u3("div", { class: "vt-tpl-segmented", role: "group", "aria-label": "View", children: ["table", "folders"].map((m3) => /* @__PURE__ */ u3("button", { type: "button", class: `vt-tpl-segmented-button${mode === m3 ? " is-on" : ""}`, "aria-pressed": mode === m3, onClick: () => mode !== m3 && choose(m3), children: m3 === "table" ? "Table" : "Folders" }, m3)) }) : null,
    /* @__PURE__ */ u3("input", { class: "vt-tpl-search", type: "search", placeholder: "Filter by title", "aria-label": "Filter by title", value: query, onInput: (e3) => setQuery(e3.currentTarget.value) }),
    mode === "folders" ? /* @__PURE__ */ u3(NoteFolders, { app, notes: ofType, tick, query }) : rows.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-tpl-empty", children: query.trim() === "" ? spec.empty : "No matching notes" }) : /* @__PURE__ */ u3("table", { class: "vt-tpl-table", children: [
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

// src/views/TmpListView.tsx
var import_obsidian15 = require("obsidian");

// src/obsidian/ConfirmDeleteModal.ts
var import_obsidian14 = require("obsidian");
var ConfirmDeleteModal = class extends import_obsidian14.Modal {
  constructor(app, path, onConfirm) {
    super(app);
    this.path = path;
    this.onConfirm = onConfirm;
    registerCloseKey(this);
  }
  path;
  onConfirm;
  onOpen() {
    this.setTitle("Delete file");
    this.contentEl.createEl("p", { text: `${this.path} \u3092\u524A\u9664\u3057\u307E\u3059\uFF08Obsidian \u306E\u300C\u524A\u9664\u3057\u305F\u30D5\u30A1\u30A4\u30EB\u300D\u306E\u8A2D\u5B9A\u306B\u5F93\u3044\u307E\u3059\uFF09\u3002` });
    new import_obsidian14.Setting(this.contentEl).addButton(
      (b2) => b2.setButtonText("Delete").setWarning().onClick(() => {
        this.close();
        this.onConfirm();
      })
    ).addButton((b2) => b2.setButtonText("Cancel").onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/views/TmpListView.tsx
var COLUMNS = [{ label: "Name", sort: "name" }, { label: "Type" }, { label: "Modified", sort: "modified" }, { label: "Size", sort: "size" }, { label: "" }];
function useTmpModify(app) {
  const [n2, setN] = d2(0);
  h2(() => {
    const ref = app.vault.on("modify", (file) => {
      if (isTmpPath(file.path)) setN((x2) => x2 + 1);
    });
    return () => app.vault.offref(ref);
  }, [app]);
  return n2;
}
function TmpListView({ app }) {
  const tick = useVaultChanges(app);
  const modified = useTmpModify(app);
  const [query, setQuery] = d2("");
  const [sort, setSort] = d2({ key: "modified", order: "desc" });
  const all = T2(() => collectTmpEntries(app.vault.getFiles()), [app, tick, modified]);
  const rows = T2(() => sortTmpEntries(filterTmpEntries(all, query), sort.key, sort.order), [all, query, sort]);
  const toggle = (key) => setSort((s3) => s3.key === key ? { key, order: s3.order === "asc" ? "desc" : "asc" } : { key, order: key === "name" ? "asc" : "desc" });
  const open = (entry) => {
    const file = app.vault.getFileByPath(entry.path);
    if (!file) return;
    if (openableInObsidian(entry.ext)) {
      void openInNotePane(app.workspace, file, { newTab: false, phone: import_obsidian15.Platform.isPhone });
      return;
    }
    const withDefault = app;
    if (import_obsidian15.Platform.isDesktopApp && typeof withDefault.openWithDefaultApp === "function") withDefault.openWithDefaultApp(file.path);
    else new import_obsidian15.Notice(`${entry.name} \u306F Obsidian \u3067\u958B\u3051\u307E\u305B\u3093`);
  };
  const remove = (entry) => {
    new ConfirmDeleteModal(app, entry.path, () => {
      const file = app.vault.getAbstractFileByPath(entry.path);
      if (!(file instanceof import_obsidian15.TFile)) return;
      app.fileManager.trashFile(file).catch((e3) => {
        console.error("pkm-template: \u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
        new import_obsidian15.Notice(`\u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${e3 instanceof Error ? e3.message : String(e3)}`);
      });
    }).open();
  };
  return /* @__PURE__ */ u3("div", { class: "vt-tpl-list", children: [
    /* @__PURE__ */ u3("input", { class: "vt-tpl-search", type: "search", placeholder: "Filter by name", "aria-label": "Filter by name", value: query, onInput: (e3) => setQuery(e3.currentTarget.value) }),
    rows.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-tpl-empty", children: query.trim() === "" ? "No temporary files" : "No matching files" }) : /* @__PURE__ */ u3("table", { class: "vt-tpl-table vt-tpl-tmp-table", children: [
      /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: COLUMNS.map((c3) => /* @__PURE__ */ u3("th", { "aria-sort": c3.sort && c3.sort === sort.key ? sort.order === "asc" ? "ascending" : "descending" : void 0, children: c3.sort ? /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-sort", onClick: () => toggle(c3.sort), children: [
        c3.label,
        c3.sort === sort.key ? sort.order === "asc" ? " \u2191" : " \u2193" : ""
      ] }) : c3.label }, c3.label)) }) }),
      /* @__PURE__ */ u3("tbody", { children: rows.map((e3) => /* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("td", { children: /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-link", onClick: () => open(e3), children: e3.name }) }),
        /* @__PURE__ */ u3("td", { children: e3.ext }),
        /* @__PURE__ */ u3("td", { class: "vt-tpl-nowrap", children: formatModified(e3.mtime) }),
        /* @__PURE__ */ u3("td", { class: "vt-tpl-nowrap", children: formatSize(e3.size) }),
        /* @__PURE__ */ u3("td", { children: /* @__PURE__ */ u3("button", { type: "button", class: "vt-tpl-delete", "aria-label": `Delete ${e3.name}`, onClick: () => remove(e3), children: "Delete" }) })
      ] }, e3.path)) })
    ] })
  ] });
}

// src/main.ts
var LIST_VIEWS = [
  { type: "pkm-template-daily-list", title: "Daily notes", icon: "calendar-days", component: DailyListView },
  { type: "pkm-template-note-list", title: "Notes", icon: "notebook", component: NoteListView },
  { type: "pkm-template-source-list", title: "Sources", icon: "library", component: SourceListView },
  // tmp/ のファイル（ADR-0045）。Markdown 以外も出す
  { type: "pkm-template-tmp-list", title: "Temporary files", icon: "folder-clock", component: TmpListView }
];
var PkmTemplatePlugin = class extends import_obsidian16.Plugin {
  manager;
  async onload() {
    this.manager = new TemplateManager(this.app);
    const openCreateModal = async () => {
      const view = this.app.workspace.getActiveViewOfType(import_obsidian16.MarkdownView);
      const linkEditor = view && view.getMode() === "source" && view.editor.hasFocus() ? view.editor : null;
      try {
        const templates = await this.manager.loadEnabledTemplates();
        new CreateNoteModal(this.app, this.manager, templates, (msg, err) => this.report(msg, err), linkEditor).open();
      } catch (err) {
        this.report("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F", err);
      }
    };
    this.addCommand({
      id: "create-from-template",
      name: "Create new file from template",
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
      name: "Open today's daily note",
      callback: () => void openToday()
    });
    for (const spec of LIST_VIEWS) {
      this.registerView(spec.type, preactViewCreator(spec, this.app));
      this.addCommand({ id: `open-${spec.type.replace("pkm-template-", "")}`, name: `Open ${spec.title}`, icon: spec.icon, callback: () => void this.openView(spec.type) });
    }
    installNoteHeaders(this);
    this.registerEditorExtension(slashSessionField);
    this.registerEditorSuggest(new SnippetSuggest(this.app, this.manager));
    this.registerEditorExtension(atSessionField);
    this.registerEditorSuggest(new SnippetSuggest(this.app, this.manager, INLINE_KIND));
    installLinkInsert(this, this.manager, (msg, err) => this.report(msg, err));
  }
  /** 一覧 View は左の固定ペインに開く（ADR-0033） */
  async openView(type) {
    await openListView(this.app.workspace, type, { phone: import_obsidian16.Platform.isPhone });
  }
  report(message, error) {
    if (error !== void 0) console.error(`pkm-template: ${message}`, error);
    const detail = error instanceof Error ? `: ${error.message}` : "";
    new import_obsidian16.Notice(`${message}${detail}`);
  }
};
