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
  default: () => VaultTaskPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian19 = require("obsidian");

// src/header/extension.ts
var import_state = require("@codemirror/state");
var import_view = require("@codemirror/view");
var import_obsidian6 = require("obsidian");

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

// src/core/dates.ts
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
function normalizeDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const s3 = value.trim();
    return isLocalDate(s3) ? s3 : null;
  }
  return null;
}
function requireDay(date) {
  const day = toEpochDay(date);
  if (day === null) throw new RangeError(`\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${date}`);
  return day;
}
function addDays(date, days) {
  return fromEpochDay(requireDay(date) + days);
}
function diffDays(a3, b2) {
  return requireDay(a3) - requireDay(b2);
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
function localDateTime(now = /* @__PURE__ */ new Date()) {
  const pad = (n2) => String(Math.trunc(Math.abs(n2))).padStart(2, "0");
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return `${localToday(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
}
function monthGridDays(month) {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayOf(first));
  return Array.from({ length: 42 }, (_2, i3) => addDays(start, i3));
}
function formatShortDate(date) {
  return `${date.slice(5, 7)}/${date.slice(8, 10)} (${WEEKDAY_NAMES[weekdayOf(date)]})`;
}

// src/core/ids.ts
function idNumber(id, prefix) {
  const m3 = new RegExp(`^${prefix}-([1-9]\\d*)$`).exec(id);
  return m3 ? Number(m3[1]) : null;
}
function isId(value, prefix) {
  return typeof value === "string" && idNumber(value, prefix) !== null;
}
function nextIds(prefix, existing, count = 1) {
  let max = 0;
  for (const id of existing) {
    const n2 = idNumber(id, prefix);
    if (n2 !== null && n2 > max) max = n2;
  }
  return Array.from({ length: count }, (_2, i3) => `${prefix}-${max + 1 + i3}`);
}
function pathForId(id) {
  const folder = id.startsWith("i-") ? "issue" : id.startsWith("r-") ? "routine" : "member";
  return `${folder}/${id}.md`;
}

// src/core/repeat.ts
function parseWeekday(s3) {
  const i3 = WEEKDAY_NAMES.indexOf(s3.toLowerCase());
  return i3 < 0 ? null : i3;
}
function parseMonthSpec(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 && value <= 31 ? { kind: "day", day: value } : null;
  }
  if (typeof value !== "string") return null;
  const s3 = value.trim().toLowerCase();
  if (/^\d+$/.test(s3)) return parseMonthSpec(Number(s3));
  if (s3 === "last") return { kind: "last" };
  const nth = /^([1-5])(?:th|st|nd|rd)-([a-z]{3})$/.exec(s3);
  if (nth) {
    const weekday = parseWeekday(nth[2]);
    return weekday === null ? null : { kind: "nth", n: Number(nth[1]), weekday };
  }
  const last = /^last-([a-z]{3})$/.exec(s3);
  if (last) {
    const weekday = parseWeekday(last[1]);
    return weekday === null ? null : { kind: "lastWeekday", weekday };
  }
  return null;
}
function asList(value) {
  if (value === void 0 || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
function serializeMonthSpec(spec) {
  switch (spec.kind) {
    case "day":
      return spec.day;
    case "last":
      return "last";
    case "nth":
      return `${spec.n}th-${WEEKDAY_NAMES[spec.weekday]}`;
    case "lastWeekday":
      return `last-${WEEKDAY_NAMES[spec.weekday]}`;
  }
}
function serializeRepeat(rule) {
  const interval = rule.interval > 1 ? { interval: rule.interval } : {};
  if (rule.every === "day") return { every: "day", ...interval };
  if (rule.every === "week") return { every: "week", ...interval, on: rule.weekdays.map((w3) => WEEKDAY_NAMES[w3]) };
  return { every: "month", ...interval, on: rule.days.map(serializeMonthSpec) };
}
function parseRepeat(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "repeat \u304C\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093" };
  }
  const raw = value;
  const interval = raw.interval === void 0 || raw.interval === null ? 1 : raw.interval;
  if (typeof interval !== "number" || !Number.isInteger(interval) || interval < 1) {
    return { ok: false, error: `repeat.interval \u306F 1 \u4EE5\u4E0A\u306E\u6574\u6570\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(raw.interval)}` };
  }
  const on = asList(raw.on);
  switch (raw.every) {
    case "day":
      return { ok: true, value: { every: "day", interval } };
    case "week": {
      const weekdays = [];
      for (const v3 of on) {
        const w3 = typeof v3 === "string" ? parseWeekday(v3.trim()) : null;
        if (w3 === null) return { ok: false, error: `repeat.on \u306E\u66DC\u65E5\u304C\u8AAD\u3081\u307E\u305B\u3093: ${String(v3)}` };
        if (!weekdays.includes(w3)) weekdays.push(w3);
      }
      if (weekdays.length === 0) return { ok: false, error: "every: week \u306B\u306F repeat.on \u3067\u66DC\u65E5\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" };
      return { ok: true, value: { every: "week", interval, weekdays } };
    }
    case "month": {
      const days = [];
      for (const v3 of on) {
        const spec = parseMonthSpec(v3);
        if (spec === null) return { ok: false, error: `repeat.on \u306E\u65E5\u4ED8\u304C\u8AAD\u3081\u307E\u305B\u3093: ${String(v3)}` };
        days.push(spec);
      }
      if (days.length === 0) return { ok: false, error: "every: month \u306B\u306F repeat.on \u3067\u65E5\u4ED8\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" };
      return { ok: true, value: { every: "month", interval, days } };
    }
    default:
      return { ok: false, error: `repeat.every \u306F day / week / month \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(raw.every)}` };
  }
}
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function matchesMonthSpec(spec, year, month, day, weekday) {
  const last = daysInMonth(year, month);
  switch (spec.kind) {
    case "day":
      return spec.day === day;
    case "last":
      return day === last;
    case "nth":
      return weekday === spec.weekday && Math.ceil(day / 7) === spec.n;
    case "lastWeekday":
      return weekday === spec.weekday && day + 7 > last;
  }
}
function mondayOffset(date) {
  return (weekdayOf(date) + 6) % 7;
}
function occursOn(rule, anchor, date) {
  const elapsed = diffDays(date, anchor);
  if (elapsed < 0) return false;
  switch (rule.every) {
    case "day":
      return elapsed % rule.interval === 0;
    case "week": {
      if (!rule.weekdays.includes(weekdayOf(date))) return false;
      const weeks = (elapsed + mondayOffset(anchor) - mondayOffset(date)) / 7;
      return weeks % rule.interval === 0;
    }
    case "month": {
      const [y3, m3, d3] = date.split("-").map(Number);
      const [ay, am] = anchor.split("-").map(Number);
      const months = (y3 - ay) * 12 + (m3 - am);
      if (months % rule.interval !== 0) return false;
      const weekday = weekdayOf(date);
      return rule.days.some((spec) => matchesMonthSpec(spec, y3, m3, d3, weekday));
    }
  }
}
var ORDINAL = ["", "\u7B2C 1", "\u7B2C 2", "\u7B2C 3", "\u7B2C 4", "\u7B2C 5"];
function describeRepeat(rule) {
  const every = (unit, each) => rule.interval === 1 ? each : `${rule.interval} ${unit}\u3054\u3068`;
  switch (rule.every) {
    case "day":
      return every("\u65E5", "\u6BCE\u65E5");
    case "week":
      return `${rule.interval === 2 ? "\u9694\u9031" : every("\u9031", "\u6BCE\u9031")} ${rule.weekdays.map((w3) => WEEKDAY_NAMES[w3]).join(", ")}`;
    case "month": {
      const days = rule.days.map((d3) => {
        switch (d3.kind) {
          case "day":
            return `${d3.day} \u65E5`;
          case "last":
            return "\u6708\u672B";
          case "nth":
            return `${ORDINAL[d3.n]} ${WEEKDAY_NAMES[d3.weekday]}`;
          case "lastWeekday":
            return `\u6700\u7D42 ${WEEKDAY_NAMES[d3.weekday]}`;
        }
      });
      return `${rule.interval === 2 ? "\u9694\u6708" : every("\u304B\u6708", "\u6BCE\u6708")} ${days.join(", ")}`;
    }
  }
}

// src/core/schema.ts
var SCHEMA_VERSION = 1;
var STATUSES = ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"];
var PRIORITIES = ["high", "mid", "low", "chore"];
var STATUS_DETAIL_MAX = 20;
var Reader = class {
  constructor(path, fm) {
    this.path = path;
    this.fm = fm;
  }
  path;
  fm;
  problems = [];
  problem(code, message, severity = "error") {
    this.problems.push({ severity, path: this.path, code, message });
  }
  has(key) {
    const v3 = this.fm[key];
    return v3 !== void 0 && v3 !== null && v3 !== "";
  }
  string(key) {
    if (!this.has(key)) return null;
    const v3 = this.fm[key];
    if (typeof v3 === "string") return v3.trim();
    if (typeof v3 === "number") return String(v3);
    this.problem("invalid-field", `${key} \u304C\u6587\u5B57\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093`);
    return null;
  }
  oneOf(key, values) {
    const v3 = this.string(key);
    if (v3 === null) return null;
    if (values.includes(v3)) return v3;
    this.problem("invalid-field", `${key} \u306F ${values.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${v3}`);
    return null;
  }
  date(key) {
    if (!this.has(key)) return null;
    const d3 = normalizeDate(this.fm[key]);
    if (d3 === null) this.problem("invalid-date", `${key} \u304C YYYY-MM-DD \u306E\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(this.fm[key])}`);
    return d3;
  }
  datetime(key) {
    if (!this.has(key)) return null;
    const v3 = this.fm[key];
    if (v3 instanceof Date && !Number.isNaN(v3.getTime())) return v3.toISOString();
    if (typeof v3 === "string" && !Number.isNaN(Date.parse(v3))) return v3.trim();
    this.problem("invalid-date", `${key} \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(v3)}`);
    return null;
  }
  minutes(key) {
    if (!this.has(key)) return null;
    const v3 = this.fm[key];
    if (typeof v3 === "number" && Number.isFinite(v3) && v3 >= 0) return v3;
    this.problem("invalid-field", `${key} \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(v3)}`);
    return null;
  }
  list(key) {
    if (!this.has(key)) return [];
    const v3 = this.fm[key];
    return Array.isArray(v3) ? v3.filter((x2) => x2 !== null && x2 !== "") : [v3];
  }
  strings(key) {
    const out = [];
    for (const v3 of this.list(key)) {
      if (typeof v3 === "string" || typeof v3 === "number") {
        const s3 = String(v3).trim();
        if (s3 && !out.includes(s3)) out.push(s3);
      } else {
        this.problem("invalid-field", `${key} \u306B\u6587\u5B57\u5217\u3067\u306A\u3044\u5024\u304C\u3042\u308A\u307E\u3059`);
      }
    }
    return out;
  }
  dates(key) {
    const out = /* @__PURE__ */ new Set();
    for (const v3 of this.list(key)) {
      const d3 = normalizeDate(v3);
      if (d3 === null) this.problem("invalid-date", `${key} \u306B\u65E5\u4ED8\u3067\u306A\u3044\u5024\u304C\u3042\u308A\u307E\u3059: ${String(v3)}`);
      else out.add(d3);
    }
    return [...out].sort();
  }
  ref(key, prefix) {
    const v3 = this.string(key);
    if (v3 === null) return null;
    if (isId(v3, prefix)) return v3;
    this.problem("invalid-ref", `${key} \u304C ${prefix}-N \u306E ID \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${v3}`);
    return null;
  }
  common(type, prefix) {
    if (this.fm.type !== type) this.problem("invalid-type", `type \u304C ${type} \u3067\u306F\u3042\u308A\u307E\u305B\u3093`);
    if (this.has("schema") && this.fm.schema !== SCHEMA_VERSION) {
      this.problem("unknown-schema", `schema ${String(this.fm.schema)} \u306F\u6271\u3048\u307E\u305B\u3093\uFF08${SCHEMA_VERSION} \u306E\u307F\uFF09`);
    }
    const id = this.string("id");
    if (id === null || !isId(id, prefix)) {
      this.problem("invalid-id", `id \u304C ${prefix}-N \u306E\u5F62\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(this.fm.id)}`);
      return null;
    }
    const expected = this.path.replace(/^.*\//, "").replace(/\.md$/, "");
    if (expected !== id) this.problem("id-path-mismatch", `id\uFF08${id}\uFF09\u3068\u30D5\u30A1\u30A4\u30EB\u540D\uFF08${expected}\uFF09\u304C\u9055\u3044\u307E\u3059`);
    return id;
  }
};
function parseIssue(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("issue", "i");
  const summary = r3.string("summary") ?? "";
  if (!summary) r3.problem("missing-summary", "summary \u304C\u3042\u308A\u307E\u305B\u3093", "warning");
  const status = r3.oneOf("status", STATUSES);
  if (status === null && !r3.has("status")) r3.problem("missing-status", "status \u304C\u3042\u308A\u307E\u305B\u3093");
  const issue = {
    path,
    id: id ?? "",
    summary,
    status: status ?? "open",
    statusDetail: r3.string("status-detail") ?? "",
    delegatedTo: r3.ref("delegated_to", "m"),
    priority: r3.oneOf("priority", PRIORITIES),
    labels: r3.strings("label"),
    parent: r3.ref("parent", "i"),
    related: r3.strings("related"),
    estimated: r3.minutes("estimated"),
    scheduled: r3.dates("scheduled"),
    midDue: r3.date("mid_due"),
    deadline: r3.date("deadline"),
    revisit: r3.date("revisit"),
    reviewed: r3.date("reviewed"),
    created: r3.datetime("created")
  };
  return { value: id === null ? null : issue, problems: r3.problems };
}
function parseRoutine(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("routine", "r");
  let repeat = null;
  const parsed = parseRepeat(fm.repeat);
  if (parsed.ok) repeat = parsed.value;
  else r3.problem("invalid-repeat", parsed.error);
  const active = fm.active === void 0 || fm.active === null ? true : fm.active;
  if (typeof active !== "boolean") r3.problem("invalid-field", "active \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const routine = {
    path,
    id: id ?? "",
    summary: r3.string("summary") ?? "",
    repeat,
    start: r3.date("start"),
    end: r3.date("end"),
    active: active !== false,
    group: r3.string("group"),
    priority: r3.oneOf("priority", PRIORITIES),
    labels: r3.strings("label"),
    estimated: r3.minutes("estimated"),
    created: r3.datetime("created")
  };
  return { value: id === null ? null : routine, problems: r3.problems };
}
function parseMember(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("member", "m");
  const name = r3.string("name") ?? "";
  if (!name) r3.problem("missing-name", "name \u304C\u3042\u308A\u307E\u305B\u3093");
  return { value: id === null ? null : { path, id, name }, problems: r3.problems };
}

// src/core/issue-file.ts
var ISSUE_BODY_TEMPLATE = "## ToDo\n\n- [ ] \n\n## Description\n\n## Note\n";
function yamlString(s3) {
  return JSON.stringify(s3);
}
function newIssueContent(id, summary, created, parent = null, scheduled = []) {
  const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: issue", `id: ${id}`, `summary: ${yamlString(summary)}`, "status: open"];
  if (parent !== null) lines.push(`parent: ${parent}`);
  if (scheduled.length > 0) lines.push(`scheduled: ${JSON.stringify(scheduled)}`);
  lines.push(`created: ${created}`, `updated: ${created}`, "---", "", ISSUE_BODY_TEMPLATE);
  return lines.join("\n");
}
function newMemberContent(id, name, created) {
  return ["---", `schema: ${SCHEMA_VERSION}`, "type: member", `id: ${id}`, `name: ${yamlString(name)}`, `created: ${created}`, `updated: ${created}`, "---", ""].join(
    "\n"
  );
}
function newRoutineContent(id, summary, repeat, created, extra = {}) {
  const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: routine", `id: ${id}`, `summary: ${yamlString(summary)}`, `repeat: ${JSON.stringify(repeat)}`];
  if (extra.start) lines.push(`start: ${extra.start}`);
  lines.push("active: true");
  if (extra.group) lines.push(`group: ${yamlString(extra.group)}`);
  if (extra.estimated) lines.push(`estimated: ${extra.estimated}`);
  lines.push(`created: ${created}`, `updated: ${created}`, "---", "", "## \u624B\u9806", "", "- [ ] ", "");
  return lines.join("\n");
}
function frontmatterRange(text) {
  const m3 = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?=\r?\n|$)/.exec(text);
  return m3 ? { from: 0, to: m3[0].length } : null;
}
function newDailyContent(created) {
  return `---
type: daily
created: ${created}
updated: ${created}
---
`;
}

// src/header/IssueHeader.tsx
var import_obsidian4 = require("obsidian");

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

// src/core/board.ts
var BOARD_KEY = "board";
function emptyBoard() {
  return { issues: [], groups: {}, routines: {}, carried: [], closed: false };
}
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function parseBoard(value) {
  const raw = record(value);
  const board = emptyBoard();
  if (Array.isArray(raw.issues)) {
    for (const id of raw.issues) if (typeof id === "string" && !board.issues.includes(id)) board.issues.push(id);
  }
  if (Array.isArray(raw.carried)) {
    for (const id of raw.carried) if (typeof id === "string" && !board.carried.includes(id)) board.carried.push(id);
  }
  for (const [id, g2] of Object.entries(record(raw.groups))) if (typeof g2 === "string" && g2) board.groups[id] = g2;
  for (const [id, r3] of Object.entries(record(raw.routines))) if (r3 === "closed" || r3 === "canceled") board.routines[id] = r3;
  board.closed = raw.closed === true;
  return board;
}
function dailyNotePath(date) {
  return `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
}
var DAILY_PATH_RE = /^daily\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/;
function boardItems(index, date, board) {
  const issues = board.issues.map((id) => index.issues.get(id)).filter((i3) => i3 !== void 0);
  return { issues, routines: index.routinesOn(date) };
}
function unfinished(index, date, board) {
  const items = boardItems(index, date, board);
  return {
    issues: items.issues.filter((i3) => isActive(i3) && !board.carried.includes(i3.id)),
    routines: items.routines.filter((r3) => board.routines[r3.id] === void 0)
  };
}
function markCarried(board, ids) {
  for (const id of ids) if (!board.carried.includes(id)) board.carried.push(id);
}
function routineResults(index, routine, today, days) {
  return Array.from({ length: days }, (_2, i3) => {
    const date = addDays(today, i3 - days + 1);
    const result = index.board(date)?.board.routines[routine.id];
    return { date, state: result ?? (routineOccursOn(routine, date) ? "none" : "off") };
  });
}
function pendingBoards(index, boards, today) {
  return boards.filter((b2) => b2.date < today && !b2.board.closed).filter((b2) => {
    const u4 = unfinished(index, b2.date, b2.board);
    return u4.issues.length > 0 || u4.routines.length > 0;
  }).sort((a3, b2) => a3.date.localeCompare(b2.date));
}
function placementOf(board, id, fallback, keys) {
  const key = board.groups[id] ?? fallback ?? "";
  return key !== "" && keys.includes(key) ? key : "";
}

// src/core/daily.ts
var byDate = (key) => (a3, b2) => (a3[key] ?? "").localeCompare(b2[key] ?? "") || a3.id.localeCompare(b2.id, "en", { numeric: true });
function deadIssues(issues, today) {
  const deadline = [];
  const midDue = [];
  for (const i3 of issues) {
    if (!isActive(i3)) continue;
    if (i3.deadline !== null && i3.deadline < today) deadline.push(i3);
    if (i3.midDue !== null && i3.midDue < today) midDue.push(i3);
  }
  return { deadline: deadline.sort(byDate("deadline")), midDue: midDue.sort(byDate("midDue")) };
}
function cautionIssues(issues, today, days = 3) {
  const within = (d3) => d3 !== null && diffDays(d3, today) >= 0 && diffDays(d3, today) <= days;
  const deadline = [];
  const midDue = [];
  for (const i3 of issues) {
    if (!isActive(i3)) continue;
    if (within(i3.deadline)) deadline.push(i3);
    if (within(i3.midDue)) midDue.push(i3);
  }
  return { deadline: deadline.sort(byDate("deadline")), midDue: midDue.sort(byDate("midDue")) };
}
function scheduledOn(issues, date, exclude = /* @__PURE__ */ new Set()) {
  return [...issues].filter((i3) => isActive(i3) && i3.scheduled.includes(date) && !exclude.has(i3.id)).sort((a3, b2) => a3.id.localeCompare(b2.id, "en", { numeric: true }));
}

// src/core/effort.ts
function prorateEffort(intervals, now) {
  const events = [];
  for (const iv of intervals) {
    const to = iv.toMs ?? Math.max(now, iv.fromMs);
    if (!(to > iv.fromMs)) continue;
    events.push({ t: iv.fromMs, delta: 1, taskId: iv.taskId }, { t: to, delta: -1, taskId: iv.taskId });
  }
  events.sort((a3, b2) => a3.t - b2.t);
  const result = /* @__PURE__ */ new Map();
  const active = /* @__PURE__ */ new Map();
  let k3 = 0;
  let prev = 0;
  for (let i3 = 0; i3 < events.length; ) {
    const t3 = events[i3].t;
    if (k3 > 0 && t3 > prev) {
      const share = (t3 - prev) / k3;
      for (const [taskId, count] of active) result.set(taskId, (result.get(taskId) ?? 0) + share * count);
    }
    for (; i3 < events.length && events[i3].t === t3; i3++) {
      const e3 = events[i3];
      const count = (active.get(e3.taskId) ?? 0) + e3.delta;
      if (count === 0) active.delete(e3.taskId);
      else active.set(e3.taskId, count);
      k3 += e3.delta;
      if (!result.has(e3.taskId)) result.set(e3.taskId, 0);
    }
    prev = t3;
  }
  return result;
}

// src/core/index.ts
function emptyVaultData() {
  return { issues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], groups: [] };
}
var INACTIVE_STATUSES = ["closed", "canceled", "someday"];
function isActive(issue) {
  return !INACTIVE_STATUSES.includes(issue.status);
}
function isInbox(issue) {
  return issue.status === "open" && issue.scheduled.length === 0 && issue.midDue === null && issue.deadline === null;
}
function routineAnchor(routine) {
  return routine.start ?? (routine.created ? routine.created.slice(0, 10) : null);
}
function routineOccursOn(routine, date) {
  if (!routine.active || routine.repeat === null) return false;
  const anchor = routineAnchor(routine);
  if (anchor === null) return false;
  if (routine.end !== null && diffDays(date, routine.end) > 0) return false;
  return occursOn(routine.repeat, anchor, date);
}
function compareNullableAsc(a3, b2) {
  if (a3 === b2) return 0;
  if (a3 === null) return -1;
  if (b2 === null) return 1;
  return a3 < b2 ? -1 : 1;
}
function organizeQueue(issues, today) {
  const inbox = [];
  const revisitDue = [];
  const someday = [];
  for (const issue of issues) {
    if (isInbox(issue)) inbox.push(issue);
    else if (issue.status === "someday") {
      if (issue.revisit !== null && issue.revisit <= today) revisitDue.push(issue);
      else someday.push(issue);
    }
  }
  inbox.sort((a3, b2) => compareNullableAsc(a3.created, b2.created));
  revisitDue.sort((a3, b2) => compareNullableAsc(a3.revisit, b2.revisit));
  someday.sort((a3, b2) => compareNullableAsc(a3.reviewed, b2.reviewed));
  return [...inbox, ...revisitDue, ...someday];
}
var TaskIndex = class {
  constructor(data) {
    this.data = data;
    for (const i3 of data.issues) if (!this.issues.has(i3.id)) this.issues.set(i3.id, i3);
    for (const r3 of data.routines) if (!this.routines.has(r3.id)) this.routines.set(r3.id, r3);
    for (const m3 of data.members) if (!this.members.has(m3.id)) this.members.set(m3.id, m3);
    for (const i3 of data.issues) this.issuesByPath.set(i3.path, i3);
    for (const issue of this.issues.values()) {
      if (issue.parent === null) continue;
      const list = this.childrenOf.get(issue.parent) ?? [];
      list.push(issue);
      this.childrenOf.set(issue.parent, list);
    }
  }
  data;
  issues = /* @__PURE__ */ new Map();
  routines = /* @__PURE__ */ new Map();
  members = /* @__PURE__ */ new Map();
  issuesByPath = /* @__PURE__ */ new Map();
  childrenOf = /* @__PURE__ */ new Map();
  children(id) {
    return this.childrenOf.get(id) ?? [];
  }
  /** 親をたどった一覧（近い順）。循環していたら、そこで止める */
  ancestors(id) {
    const out = [];
    const seen = /* @__PURE__ */ new Set([id]);
    let parent = this.issues.get(id)?.parent ?? null;
    while (parent !== null && !seen.has(parent)) {
      seen.add(parent);
      const issue = this.issues.get(parent);
      if (!issue) break;
      out.push(issue);
      parent = issue.parent;
    }
    return out;
  }
  /** `childId` の親に `parentId` を選べるか（自分自身と子孫は選べない。ADR-0012） */
  canSetParent(childId, parentId) {
    if (childId === parentId || !this.issues.has(parentId)) return false;
    return !this.ancestors(parentId).some((a3) => a3.id === childId);
  }
  /** 按分後の実績（分）。タスクの ID ごと（ADR-0005） */
  effortMinutes(now) {
    const ms = prorateEffort(this.data.worklogs, now);
    return new Map([...ms].map(([id, v3]) => [id, v3 / 6e4]));
  }
  /** routine 画面の工数（ADR-0021）: 按分後の累計（分）・worklog がある日数・1 日あたりの平均（分、0 日なら null） */
  routineEffort(taskId, now) {
    const total = this.effortMinutes(now).get(taskId) ?? 0;
    const dates = /* @__PURE__ */ new Set();
    for (const l3 of this.data.worklogs) {
      if (l3.taskId !== taskId) continue;
      const to = l3.toMs ?? Math.max(now, l3.fromMs);
      if (to > l3.fromMs) dates.add(localToday(new Date(l3.fromMs)));
    }
    const days = dates.size;
    return { total, days, average: days > 0 ? total / days : null };
  }
  board(date) {
    return this.data.boards.find((b2) => b2.date === date);
  }
  /** 記録中（to が空）の worklog */
  running(taskId) {
    return this.data.worklogs.filter((l3) => l3.toMs === null && (taskId === void 0 || l3.taskId === taskId));
  }
  routinesOn(date) {
    return [...this.routines.values()].filter((r3) => routineOccursOn(r3, date));
  }
};
function sidebarCounts(index, today) {
  const issues = [...index.issues.values()];
  const dead = deadIssues(issues, today);
  const pending = pendingBoards(index, index.data.boards, today);
  const todayBoard = index.board(today)?.board ?? emptyBoard();
  const scheduledToday = scheduledOn(issues, today, new Set(todayBoard.issues));
  const todayLeft = unfinished(index, today, todayBoard);
  const previousCount = pending.reduce((n2, b2) => {
    const u4 = unfinished(index, b2.date, b2.board);
    return n2 + u4.issues.length + u4.routines.length;
  }, 0);
  return {
    daily: dead.deadline.length + dead.midDue.length + previousCount + scheduledToday.length + todayLeft.issues.length + todayLeft.routines.length,
    inbox: issues.filter(isInbox).length,
    organize: organizeQueue(issues, today).length,
    scheduled: issues.filter((i3) => isActive(i3) && i3.scheduled.some((d3) => d3 >= today)).length,
    issues: issues.filter(isActive).length,
    someday: issues.filter((i3) => i3.status === "someday").length,
    routines: [...index.routines.values()].filter((r3) => r3.active).length
  };
}

// src/core/due.ts
function dueLevel(issue, due, today) {
  if (due === null || !isActive(issue)) return "none";
  const left = diffDays(due, today);
  if (left < 0) return "overdue";
  if (left > 3) return "none";
  return String(left);
}

// src/core/format.ts
var MINUTES_PER_DAY = 8 * 60;
function formatMinutes(minutes) {
  const sign = minutes < 0 ? "-" : "";
  let rest = Math.round(Math.abs(minutes));
  const d3 = Math.floor(rest / MINUTES_PER_DAY);
  rest -= d3 * MINUTES_PER_DAY;
  const h3 = Math.floor(rest / 60);
  const m3 = rest - h3 * 60;
  const parts = [d3 ? `${d3}d` : "", h3 ? `${h3}h` : "", m3 ? `${m3}m` : ""].join("");
  return sign + (parts || "0m");
}
function parseDaysInput(input) {
  const m3 = /^\s*(\d+(?:\.\d+)?)\s*d?\s*$/i.exec(input);
  if (!m3) return null;
  return Math.round(Number(m3[1]) * MINUTES_PER_DAY);
}

// src/obsidian/issue-editors.tsx
var import_obsidian3 = require("obsidian");

// src/core/actions.ts
function cancelPatch() {
  return { status: "canceled", mid_due: null, deadline: null, delegated_to: null, revisit: null };
}
function closePatch() {
  return { status: "closed", delegated_to: null, revisit: null };
}
function inboxPatch() {
  return { status: "open", scheduled: null, mid_due: null, deadline: null, delegated_to: null, revisit: null };
}
function somedayPatch(revisit = null) {
  return { status: "someday", scheduled: null, mid_due: null, deadline: null, delegated_to: null, revisit };
}
function reopenPatch() {
  return { status: "open", revisit: null };
}
function statusPatch(status, delegatedTo = null) {
  if (status === "closed") return closePatch();
  if (status === "canceled") return cancelPatch();
  if (status === "someday") return somedayPatch();
  return { status, delegated_to: status === "delegated" ? delegatedTo : null, revisit: null };
}
function duePatch(issue, key, date) {
  return { [key]: date, ...issue.status === "someday" && date !== null ? reopenPatch() : {} };
}
function scheduledPatch(issue, dates) {
  return { scheduled: dates, ...issue.status === "someday" && dates.length > 0 ? reopenPatch() : {} };
}
function canConfirmSchedule(selectedCount, needEstimate, estimated) {
  return selectedCount > 0 && (!needEstimate || estimated !== null);
}
function organizeSchedulePatch(issue, dates, estimated) {
  const patch = scheduledPatch(issue, [...new Set(dates)].sort());
  if (estimated !== null) patch.estimated = estimated;
  return patch;
}
function reschedulePatch(issue, target, to, from = null) {
  if (target !== "scheduled") return { [target]: to };
  const dates = new Set(issue.scheduled);
  if (from !== null) dates.delete(from);
  dates.add(to);
  return { scheduled: [...dates].sort() };
}
function schedulePatch(issue, dates, estimated = null) {
  const patch = { scheduled: [.../* @__PURE__ */ new Set([...issue.scheduled, ...dates])].sort() };
  if (issue.status === "someday") Object.assign(patch, reopenPatch());
  if (estimated !== null) patch.estimated = estimated;
  return patch;
}

// src/core/date-input.ts
function ymd(year, month, day) {
  const date = `${year}-${month}-${day}`;
  return isLocalDate(date) ? date : null;
}
function daysInMonth2(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function addMonths(date, n2) {
  const [y3, m3, d3] = date.split("-").map(Number);
  const first = new Date(Date.UTC(y3, m3 - 1 + n2, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth() + 1;
  return fromEpochDay(Date.UTC(year, month - 1, Math.min(d3, daysInMonth2(year, month))) / 864e5);
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
function parseTimeInput(input) {
  const m3 = /^(\d{2}):?(\d{2})$/.exec(input.trim());
  if (!m3 || Number(m3[1]) > 23 || Number(m3[2]) > 59) return null;
  return `${m3[1]}:${m3[2]}`;
}

// src/ui/Icon.tsx
var import_obsidian = require("obsidian");

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

// src/ui/Icon.tsx
function Icon(props) {
  const ref = A2(null);
  h2(() => {
    if (!ref.current) return;
    ref.current.replaceChildren();
    (0, import_obsidian.setIcon)(ref.current, props.name);
  }, [props.name]);
  return /* @__PURE__ */ u3("span", { ref, class: `vt-icon ${props.class ?? ""}`, "aria-hidden": "true" });
}

// src/ui/forms.tsx
function TextForm(props) {
  const [value, setValue] = d2(props.initial);
  const ref = A2(null);
  h2(() => ref.current?.focus(), []);
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        props.onSubmit(value.trim());
      },
      children: [
        /* @__PURE__ */ u3(
          "input",
          {
            ref,
            type: "text",
            value,
            maxLength: props.maxLength,
            placeholder: props.placeholder,
            onInput: (e3) => setValue(e3.currentTarget.value)
          }
        ),
        props.maxLength !== void 0 && /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
          value.length,
          " / ",
          props.maxLength
        ] }),
        /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", children: "\u4FDD\u5B58" })
      ]
    }
  );
}
function MonthCalendar(props) {
  const today = localToday();
  const { month } = props;
  const days = monthGridDays(month);
  const shift = (n2) => {
    const [y3, m3] = month.split("-").map(Number);
    props.onMonth(new Date(Date.UTC(y3, m3 - 1 + n2, 1)).toISOString().slice(0, 7));
  };
  return /* @__PURE__ */ u3("div", { class: "vt-calendar", children: [
    /* @__PURE__ */ u3("div", { class: "vt-calendar-nav", children: [
      /* @__PURE__ */ u3("button", { type: "button", "aria-label": "\u524D\u306E\u6708", onClick: () => shift(-1), children: "\u2039" }),
      /* @__PURE__ */ u3("span", { children: month.replace("-", " / ") }),
      /* @__PURE__ */ u3("button", { type: "button", "aria-label": "\u6B21\u306E\u6708", onClick: () => shift(1), children: "\u203A" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-calendar-grid", children: [
      [0, 1, 2, 3, 4, 5, 6].map((w3) => /* @__PURE__ */ u3("span", { class: "vt-weekday", children: WEEKDAY_NAMES[w3] })),
      days.map((d3) => /* @__PURE__ */ u3(
        DayCell,
        {
          date: d3,
          dimmed: !d3.startsWith(month),
          scheduled: props.isSelected(d3),
          midDue: props.midDue ?? null,
          deadline: props.deadline ?? null,
          today,
          onClick: () => props.onPick(d3)
        }
      ))
    ] })
  ] });
}
function DateHint(props) {
  if (props.text.trim() === "") return /* @__PURE__ */ u3("div", { class: "vt-date-hint", children: "\u4F8B: 15 / 1224 / +3 / mon / +2w / +m" });
  if (props.parsed === null) return /* @__PURE__ */ u3("div", { class: "vt-error", children: "\u65E5\u4ED8\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093" });
  return /* @__PURE__ */ u3("div", { class: "vt-date-hint", children: `${props.parsed.slice(0, 4)}/${formatShortDate(props.parsed)}` });
}
function DateForm(props) {
  const today = localToday();
  const [text, setText] = d2(props.initial ?? "");
  const [month, setMonth] = d2((props.initial ?? today).slice(0, 7));
  const ref = A2(null);
  h2(() => ref.current?.select(), []);
  const parsed = parseDateInput(text, today);
  const invalid = text.trim() !== "" && parsed === null;
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-date-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (!invalid) props.onSubmit(parsed);
      },
      children: [
        /* @__PURE__ */ u3("div", { class: "vt-date-field", children: [
          /* @__PURE__ */ u3(
            "input",
            {
              ref,
              type: "text",
              "aria-label": "\u65E5\u4ED8",
              value: text,
              onInput: (e3) => {
                const value = e3.currentTarget.value;
                setText(value);
                const next = parseDateInput(value, today);
                if (next !== null) setMonth(next.slice(0, 7));
              }
            }
          ),
          /* @__PURE__ */ u3(DateHint, { text, parsed })
        ] }),
        props.presets !== false && /* @__PURE__ */ u3("div", { class: "vt-date-presets", children: [
          ["\u4ECA\u65E5", 0],
          ["\u660E\u65E5", 1],
          ["\u6765\u9031", 7]
        ].map(([label, n2]) => /* @__PURE__ */ u3("button", { type: "button", class: "vt-field-chip", onClick: () => props.onSubmit(addDays(today, n2)), children: label })) }),
        /* @__PURE__ */ u3(MonthCalendar, { month, onMonth: setMonth, isSelected: (d3) => d3 === parsed, onPick: (d3) => props.onSubmit(d3) }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: [
          props.allowClear !== false && /* @__PURE__ */ u3("button", { type: "button", onClick: () => props.onSubmit(null), children: "\u30AF\u30EA\u30A2" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: invalid, children: "\u4FDD\u5B58" })
        ] })
      ]
    }
  );
}
function CalendarForm(props) {
  const [selected, setSelected] = d2(new Set(props.initial));
  const [month, setMonth] = d2(localToday().slice(0, 7));
  const enabled = props.canSubmit?.(selected.size) ?? true;
  const toggle2 = (d3) => {
    const next = new Set(selected);
    if (next.has(d3)) next.delete(d3);
    else next.add(d3);
    setSelected(next);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-calendar", children: [
    /* @__PURE__ */ u3(MonthCalendar, { month, onMonth: setMonth, isSelected: (d3) => selected.has(d3), onPick: toggle2, midDue: props.midDue, deadline: props.deadline }),
    props.children,
    /* @__PURE__ */ u3("div", { class: "vt-form", children: [
      /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
        selected.size,
        " \u65E5"
      ] }),
      /* @__PURE__ */ u3("button", { class: "mod-cta", disabled: !enabled, onClick: () => enabled && props.onSubmit([...selected].sort()), children: props.submitLabel ?? "\u4FDD\u5B58" })
    ] })
  ] });
}
function DayCell(props) {
  const w3 = weekdayOf(props.date);
  const cls = ["vt-day"];
  if (w3 === 0 || w3 === 6) cls.push("is-weekend");
  if (props.date === props.midDue) cls.push("is-mid-due");
  if (props.date === props.deadline) cls.push("is-deadline");
  if (props.deadline !== null && props.date > props.deadline) cls.push("is-after-deadline");
  if (props.scheduled) cls.push("is-scheduled");
  if (props.date === props.today) cls.push("is-today");
  if (props.dimmed) cls.push("is-dimmed");
  const marks = [props.date === props.today ? "\u4ECA\u65E5" : null, props.date === props.midDue ? "mid_due" : null, props.date === props.deadline ? "deadline" : null].filter(Boolean).join("\u30FB");
  const label = marks ? `${props.date}\uFF08${marks}\uFF09` : props.date;
  return /* @__PURE__ */ u3("button", { type: "button", class: cls.join(" "), onClick: props.onClick, "aria-pressed": props.scheduled, "aria-label": label, title: label, children: Number(props.date.slice(8, 10)) });
}
var pad2 = (n2) => String(n2).padStart(2, "0");
function dateOfMs(ms) {
  if (ms === null) return "";
  const d3 = new Date(ms);
  return `${d3.getFullYear()}-${pad2(d3.getMonth() + 1)}-${pad2(d3.getDate())}`;
}
function timeOfMs(ms) {
  if (ms === null) return "";
  const d3 = new Date(ms);
  return `${pad2(d3.getHours())}:${pad2(d3.getMinutes())}`;
}
function DateTimeField(props) {
  const today = localToday();
  const parsed = parseDateInput(props.date, today);
  const [open, setOpen] = d2(false);
  const [month, setMonth] = d2((parsed ?? today).slice(0, 7));
  return /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
    /* @__PURE__ */ u3("span", { children: props.label }),
    /* @__PURE__ */ u3("div", { class: "vt-datetime", children: [
      /* @__PURE__ */ u3(
        "input",
        {
          type: "text",
          "aria-label": `${props.label}\u306E\u65E5\u4ED8`,
          placeholder: "\u65E5\u4ED8",
          value: props.date,
          onInput: (e3) => {
            props.onDate(e3.currentTarget.value);
            const next = parseDateInput(e3.currentTarget.value, today);
            if (next !== null) setMonth(next.slice(0, 7));
          }
        }
      ),
      /* @__PURE__ */ u3("input", { class: "vt-time-input", type: "text", "aria-label": `${props.label}\u306E\u6642\u523B`, placeholder: "hhmm", value: props.time, onInput: (e3) => props.onTime(e3.currentTarget.value) }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-calendar-toggle", "aria-label": `${props.label}\u306E\u30AB\u30EC\u30F3\u30C0\u30FC`, "aria-expanded": open, onClick: () => setOpen(!open), children: /* @__PURE__ */ u3(Icon, { name: "calendar" }) })
    ] }),
    props.date.trim() !== "" && /* @__PURE__ */ u3(DateHint, { text: props.date, parsed }),
    open && /* @__PURE__ */ u3(
      MonthCalendar,
      {
        month,
        onMonth: setMonth,
        isSelected: (d3) => d3 === parsed,
        onPick: (d3) => {
          props.onDate(d3);
          setOpen(false);
        }
      }
    )
  ] });
}
function toMs(date, time) {
  const d3 = parseDateInput(date, localToday());
  const t3 = parseTimeInput(time);
  return d3 === null || t3 === null ? null : (/* @__PURE__ */ new Date(`${d3}T${t3}:00`)).getTime();
}
function WorklogForm(props) {
  const [fromDate, setFromDate] = d2(dateOfMs(props.initial.fromMs));
  const [fromTime, setFromTime] = d2(timeOfMs(props.initial.fromMs));
  const [toDate, setToDate] = d2(dateOfMs(props.initial.toMs));
  const [toTime, setToTime] = d2(timeOfMs(props.initial.toMs));
  const [description, setDescription] = d2(props.initial.description);
  const [confirming, setConfirming] = d2(false);
  const fromMs = toMs(fromDate, fromTime);
  const running = toDate.trim() === "" && toTime.trim() === "";
  const endMs = running ? null : toMs(toDate.trim() === "" ? fromDate : toDate, toTime);
  const error = fromMs === null ? "\u958B\u59CB\u306E\u65E5\u4ED8\u3068\u6642\u523B\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" : !running && endMs === null ? "\u7D42\u4E86\u306E\u65E5\u4ED8\u3068\u6642\u523B\u3092\u78BA\u304B\u3081\u3066\u304F\u3060\u3055\u3044" : endMs !== null && endMs <= fromMs ? "\u7D42\u4E86\u306F\u958B\u59CB\u3088\u308A\u5F8C\u306B\u3057\u3066\u304F\u3060\u3055\u3044" : null;
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (error === null) props.onSubmit({ fromMs, toMs: endMs, description: description.trim() });
      },
      children: [
        /* @__PURE__ */ u3(DateTimeField, { label: "\u958B\u59CB", date: fromDate, time: fromTime, onDate: setFromDate, onTime: setFromTime }),
        /* @__PURE__ */ u3(DateTimeField, { label: "\u7D42\u4E86\uFF08\u7A7A\u306A\u3089\u8A18\u9332\u4E2D\uFF09", date: toDate, time: toTime, onDate: setToDate, onTime: setToTime }),
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "\u5185\u5BB9" }),
          /* @__PURE__ */ u3("input", { type: "text", value: description, onInput: (e3) => setDescription(e3.currentTarget.value) })
        ] }),
        error !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: error }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: [
          props.onDelete && /* @__PURE__ */ u3("button", { type: "button", class: confirming ? "mod-warning" : "vt-danger-text", onClick: () => confirming ? props.onDelete() : setConfirming(true), children: confirming ? "\u3082\u3046\u4E00\u5EA6\u62BC\u3059\u3068\u524A\u9664" : "\u524A\u9664" }),
          /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: error !== null, children: "\u4FDD\u5B58" })
        ] })
      ]
    }
  );
}

// src/ui/LabelForm.tsx
function LabelForm(props) {
  const [selected, setSelected] = d2(new Set(props.initial));
  const [extra, setExtra] = d2([]);
  const [draft, setDraft] = d2("");
  const names = [...props.labels.map((l3) => l3.name), ...extra.filter((n2) => !props.labels.some((l3) => l3.name === n2))];
  for (const n2 of props.initial) if (!names.includes(n2)) names.push(n2);
  const toggle2 = (name) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };
  const create = (e3) => {
    e3.preventDefault();
    const name = draft.trim();
    if (!name) return;
    props.onCreate(name).then(() => {
      setExtra([...extra, name]);
      setSelected(/* @__PURE__ */ new Set([...selected, name]));
      setDraft("");
    }).catch(props.onError);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-label-form", children: [
    /* @__PURE__ */ u3("div", { class: "vt-label-list", children: names.map((name) => /* @__PURE__ */ u3("label", { class: "vt-check", children: [
      /* @__PURE__ */ u3("input", { type: "checkbox", checked: selected.has(name), onChange: () => toggle2(name) }),
      name
    ] })) }),
    /* @__PURE__ */ u3("form", { class: "vt-form", onSubmit: create, children: [
      /* @__PURE__ */ u3("input", { type: "text", placeholder: "\u65B0\u3057\u3044 label", value: draft, onInput: (e3) => setDraft(e3.currentTarget.value) }),
      /* @__PURE__ */ u3("button", { type: "submit", children: "\u8FFD\u52A0" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { class: "mod-cta", onClick: () => props.onSubmit(names.filter((n2) => selected.has(n2))), children: "\u4FDD\u5B58" }) })
  ] });
}

// src/obsidian/modals.ts
var import_obsidian2 = require("obsidian");
var PreactModal = class extends import_obsidian2.Modal {
  constructor(app, title, view) {
    super(app);
    this.title = title;
    this.view = view;
  }
  title;
  view;
  onOpen() {
    this.setTitle(this.title);
    R(k(() => this.view(() => this.close()), {}), this.contentEl);
  }
  onClose() {
    R(null, this.contentEl);
  }
};
var IssueSuggestModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, items, onChoose, placeholder = "issue \u3092\u691C\u7D22\uFF08ID / summary\uFF09") {
    super(app);
    this.items = items;
    this.onChoose = onChoose;
    this.setPlaceholder(placeholder);
  }
  items;
  onChoose;
  getItems() {
    return this.items;
  }
  getItemText(issue) {
    return `${issue.id} ${issue.summary}`;
  }
  onChooseItem(issue) {
    this.onChoose(issue);
  }
};
var BoardIssueModal = class extends import_obsidian2.SuggestModal {
  constructor(app, items, onChoose) {
    super(app);
    this.items = items;
    this.onChoose = onChoose;
    this.setPlaceholder("issue \u3092\u691C\u7D22\u3002\u306A\u3051\u308C\u3070 summary \u3092\u5165\u529B\u3057\u3066\u65B0\u898F\u4F5C\u6210");
  }
  items;
  onChoose;
  getSuggestions(query) {
    const summary = query.trim();
    if (!summary) return this.items.map((issue) => ({ kind: "issue", issue }));
    const match = (0, import_obsidian2.prepareFuzzySearch)(summary);
    const hits = this.items.map((issue) => ({ issue, result: match(`${issue.id} ${issue.summary}`) })).filter((h3) => h3.result !== null).sort((a3, b2) => b2.result.score - a3.result.score).map(({ issue }) => ({ kind: "issue", issue }));
    return [...hits, { kind: "create", summary }];
  }
  renderSuggestion(choice, el) {
    if (choice.kind === "issue") el.createEl("div", { text: `${choice.issue.id} ${choice.issue.summary}` });
    else el.createEl("div", { text: `\uFF0B\u300C${choice.summary}\u300D\u3092\u4F5C\u6210\u3057\u3066\u30DC\u30FC\u30C9\u306B\u8F09\u305B\u308B` });
  }
  onChooseSuggestion(choice) {
    this.onChoose(choice);
  }
};
var MemberSuggestModal = class extends import_obsidian2.SuggestModal {
  constructor(app, members, onChoose) {
    super(app);
    this.members = members;
    this.onChoose = onChoose;
    this.setPlaceholder("\u59D4\u4EFB\u5148\u3092\u540D\u524D\u3067\u691C\u7D22\u3002\u306A\u3051\u308C\u3070\u540D\u524D\u3092\u5165\u529B\u3057\u3066\u65B0\u898F\u4F5C\u6210");
  }
  members;
  onChoose;
  getSuggestions(query) {
    const q2 = query.trim().toLowerCase();
    const hits = this.members.filter((m3) => m3.name.toLowerCase().includes(q2)).map((member) => ({ kind: "member", member }));
    if (q2 && !this.members.some((m3) => m3.name.toLowerCase() === q2)) hits.push({ kind: "create", name: query.trim() });
    return hits;
  }
  renderSuggestion(choice, el) {
    if (choice.kind === "member") el.createEl("div", { text: choice.member.name });
    else el.createEl("div", { text: `\uFF0B\u300C${choice.name}\u300D\u3092\u65B0\u3057\u304F\u4F5C\u308B` });
  }
  onChooseSuggestion(choice) {
    this.onChoose(choice);
  }
};

// src/obsidian/issue-editors.tsx
var ESTIMATE_PRESETS = [15, 30, 60, 120, 300, 480];
var saveIssue = (ctx, issue) => (fields) => void ctx.writer.update(issue.path, fields).catch((e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
function pickMember(ctx, onPick) {
  new MemberSuggestModal(ctx.app, [...ctx.store.index.members.values()], (choice) => {
    if (choice.kind === "member") onPick(choice.member.id);
    else
      void ctx.writer.createMember(choice.name).then(onPick).catch((e3) => ctx.report("\u59D4\u4EFB\u5148\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  }).open();
}
function priorityMenu(e3, current, save) {
  const m3 = new import_obsidian3.Menu();
  for (const p3 of PRIORITIES) m3.addItem((item) => item.setTitle(p3).setChecked(p3 === current).onClick(() => save({ priority: p3 })));
  m3.addItem((item) => item.setTitle("\u306A\u3057").onClick(() => save({ priority: null })));
  m3.showAtMouseEvent(e3);
}
function editLabels(ctx, current, save) {
  new PreactModal(ctx.app, "label", (close) => /* @__PURE__ */ u3(
    LabelForm,
    {
      labels: ctx.store.index.data.labels,
      initial: current,
      onCreate: (name) => ctx.writer.addLabel(name),
      onSubmit: (names) => {
        close();
        save({ label: names });
      },
      onError: (e3) => ctx.report("label \u3092\u8FFD\u52A0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)
    }
  )).open();
}
function editStatusDetail(ctx, current, save) {
  new PreactModal(ctx.app, "status-detail", (close) => /* @__PURE__ */ u3(
    TextForm,
    {
      initial: current,
      maxLength: STATUS_DETAIL_MAX,
      placeholder: "\u4F8B: \u8FD4\u4E8B\u5F85\u3061",
      onSubmit: (v3) => {
        close();
        save({ "status-detail": v3 });
      }
    }
  )).open();
}
function estimateMenu(ctx, e3, current, save) {
  const m3 = new import_obsidian3.Menu();
  for (const min of ESTIMATE_PRESETS) m3.addItem((item) => item.setTitle(formatMinutes(min)).onClick(() => save({ estimated: min })));
  m3.addItem(
    (item) => item.setTitle("\u65E5\u6570\u3067\u5165\u529B\u2026").onClick(
      () => new PreactModal(ctx.app, "estimated\uFF08\u65E5\u6570\u30021d = 8h\uFF09", (close) => /* @__PURE__ */ u3(
        TextForm,
        {
          initial: current === null ? "" : String(current / 480),
          placeholder: "\u4F8B: 0.5",
          onSubmit: (v3) => {
            const min = parseDaysInput(v3);
            if (min === null) return ctx.report(`\u65E5\u6570\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093: ${v3}`);
            close();
            save({ estimated: min });
          }
        }
      )).open()
    )
  );
  m3.addItem((item) => item.setTitle("\u30AF\u30EA\u30A2").onClick(() => save({ estimated: null })));
  m3.showAtMouseEvent(e3);
}
function statusMenu(ctx, e3, issue) {
  const save = saveIssue(ctx, issue);
  const m3 = new import_obsidian3.Menu();
  for (const s3 of STATUSES) {
    m3.addItem(
      (item) => item.setTitle(s3).setChecked(s3 === issue.status).onClick(() => {
        if (s3 === issue.status) return;
        if (s3 === "delegated") pickMember(ctx, (id) => save(statusPatch(s3, id)));
        else save(statusPatch(s3));
      })
    );
  }
  m3.showAtMouseEvent(e3);
}
function editDue(ctx, issue, key) {
  new PreactModal(ctx.app, key, (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: key === "mid_due" ? issue.midDue : issue.deadline,
      onSubmit: (v3) => {
        close();
        saveIssue(ctx, issue)(duePatch(issue, key, v3));
      }
    }
  )).open();
}
function editScheduled(ctx, issue) {
  new PreactModal(ctx.app, "\u5B9F\u884C\u65E5", (close) => /* @__PURE__ */ u3(
    CalendarForm,
    {
      initial: issue.scheduled,
      midDue: issue.midDue,
      deadline: issue.deadline,
      onSubmit: (dates) => {
        close();
        saveIssue(ctx, issue)(scheduledPatch(issue, dates));
      }
    }
  )).open();
}
function editSummary(ctx, issue) {
  new PreactModal(ctx.app, "summary", (close) => /* @__PURE__ */ u3(
    TextForm,
    {
      initial: issue.summary,
      onSubmit: (v3) => {
        close();
        if (v3 && v3 !== issue.summary) saveIssue(ctx, issue)({ summary: v3 });
      }
    }
  )).open();
}
function issueRowMenu(ctx, e3, issue) {
  const save = saveIssue(ctx, issue);
  const m3 = new import_obsidian3.Menu();
  m3.addItem((item) => item.setTitle("summary").setIcon("pencil").onClick(() => editSummary(ctx, issue)));
  m3.addItem((item) => item.setTitle("status").setIcon("circle-dot").onClick(() => statusMenu(ctx, e3, issue)));
  m3.addItem((item) => item.setTitle("status-detail").setIcon("pencil").onClick(() => editStatusDetail(ctx, issue.statusDetail, save)));
  m3.addItem((item) => item.setTitle("priority").setIcon("flag").onClick(() => priorityMenu(e3, issue.priority, save)));
  m3.addItem((item) => item.setTitle("label").setIcon("tag").onClick(() => editLabels(ctx, issue.labels, save)));
  m3.addSeparator();
  m3.addItem((item) => item.setTitle("\u5B9F\u884C\u65E5").setIcon("calendar").onClick(() => editScheduled(ctx, issue)));
  m3.addItem((item) => item.setTitle("mid_due").setIcon("calendar").onClick(() => editDue(ctx, issue, "mid_due")));
  m3.addItem((item) => item.setTitle("deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "deadline")));
  m3.addItem((item) => item.setTitle("estimated").setIcon("clock").onClick(() => estimateMenu(ctx, e3, issue.estimated, save)));
  m3.showAtMouseEvent(e3);
}

// src/ui/badges.tsx
function StatusBadge(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-badge vt-status vt-status-${props.status}${props.wide ? " is-wide" : ""}`, onClick: props.onClick, disabled: !props.onClick, children: [
    /* @__PURE__ */ u3("span", { class: "vt-dot" }),
    props.status,
    props.onClick && props.wide && /* @__PURE__ */ u3(Icon, { name: "chevron-down", class: "vt-trailing" })
  ] });
}
function IdBadge(props) {
  return /* @__PURE__ */ u3("span", { class: `vt-badge vt-id vt-status-${props.issue.status}`, children: props.issue.id });
}
var PRIORITY_ICONS = { high: "\u25B2", mid: "\u25A0", low: "\u25BC", chore: "\xB7", none: "+" };
function PriorityBadge(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-badge vt-priority vt-priority-${props.priority ?? "none"}`, onClick: props.onClick, disabled: !props.onClick, children: [
    /* @__PURE__ */ u3("span", { class: "vt-priority-icon", "aria-hidden": "true", children: PRIORITY_ICONS[props.priority ?? "none"] }),
    props.priority ?? "priority",
    props.onClick && /* @__PURE__ */ u3(Icon, { name: "chevron-down", class: "vt-trailing" })
  ] });
}
function LabelBadge(props) {
  return /* @__PURE__ */ u3("span", { class: "vt-badge vt-label", style: { backgroundColor: props.color }, children: props.name });
}

// src/ui/hooks.ts
function useStoreVersion(store) {
  const [version, setVersion] = d2(store.version);
  h2(() => store.subscribe(() => setVersion(store.version)), [store]);
  return version;
}
function useNow(intervalMs = 3e4) {
  const [now, setNow] = d2(Date.now());
  h2(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

// src/ui/Pager.tsx
function pageItems(current, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_2, i3) => i3);
  const keep = new Set([0, pages - 1, current - 1, current, current + 1].filter((i3) => i3 >= 0 && i3 < pages));
  const out = [];
  let prev = -1;
  for (const i3 of [...keep].sort((a3, b2) => a3 - b2)) {
    if (i3 - prev > 1) out.push(null);
    out.push(i3);
    prev = i3;
  }
  return out;
}
function Pager(props) {
  const { current, pages, onChange } = props;
  return /* @__PURE__ */ u3("nav", { class: "vt-pager", "aria-label": "\u30DA\u30FC\u30B8", children: [
    /* @__PURE__ */ u3("button", { class: "vt-pager-step", disabled: current === 0, onClick: () => onChange(current - 1), "aria-label": "\u65B0\u3057\u3044\u65B9\u3078", children: /* @__PURE__ */ u3(Icon, { name: "chevron-left" }) }),
    pageItems(current, pages).map(
      (i3) => i3 === null ? /* @__PURE__ */ u3("span", { class: "vt-pager-gap", children: "\u2026" }) : /* @__PURE__ */ u3("button", { class: `vt-pager-page${i3 === current ? " is-current" : ""}`, "aria-current": i3 === current ? "page" : void 0, onClick: () => onChange(i3), children: i3 + 1 })
    ),
    /* @__PURE__ */ u3("button", { class: "vt-pager-step", disabled: current >= pages - 1, onClick: () => onChange(current + 1), "aria-label": "\u53E4\u3044\u65B9\u3078", children: /* @__PURE__ */ u3(Icon, { name: "chevron-right" }) })
  ] });
}

// src/ui/a11y.ts
function linkProps(open) {
  return {
    role: "link",
    tabIndex: 0,
    onClick: (e3) => open(e3),
    onKeyDown: (e3) => {
      if (e3.key === "Enter") {
        e3.preventDefault();
        open(e3);
      }
    }
  };
}

// src/header/IssueHeader.tsx
var WORKLOG_PAGE = 5;
function formatDateTime(value) {
  if (value === null) return "\u2014";
  const d3 = new Date(value);
  if (Number.isNaN(d3.getTime())) return "\u2014";
  const pad = (n2) => String(n2).padStart(2, "0");
  return `${d3.getFullYear()}-${pad(d3.getMonth() + 1)}-${pad(d3.getDate())} ${pad(d3.getHours())}:${pad(d3.getMinutes())}`;
}
function sortCandidates(issues) {
  return [...issues].sort((a3, b2) => Number(!isActive(a3)) - Number(!isActive(b2)) || a3.id.localeCompare(b2.id, "en", { numeric: true }));
}
function IssueHeader(props) {
  const { ctx, path } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const issue = index.issuesByPath.get(path);
  if (!issue) {
    return /* @__PURE__ */ u3("div", { class: "vt-header-missing", children: "issue \u306E frontmatter \u3092\u8AAD\u3081\u307E\u305B\u3093\uFF08type / id / status \u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\uFF09" });
  }
  const save = (fields, target = path) => void ctx.writer.update(target, fields).catch((e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  return /* @__PURE__ */ u3("div", { class: "vt-issue", children: [
    /* @__PURE__ */ u3("div", { class: "vt-meta", children: [
      /* @__PURE__ */ u3("span", { children: [
        "created ",
        formatDateTime(issue.created)
      ] }),
      /* @__PURE__ */ u3("span", { children: [
        "updated ",
        formatDateTime(ctx.store.mtime(path))
      ] })
    ] }),
    /* @__PURE__ */ u3(SummaryField, { badge: /* @__PURE__ */ u3(IdBadge, { issue }), summary: issue.summary, save }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: [
      /* @__PURE__ */ u3("div", { class: "vt-row vt-halves", children: /* @__PURE__ */ u3(StatusField, { ctx, issue, index, save }) }),
      /* @__PURE__ */ u3("div", { class: "vt-row vt-chips", children: [
        /* @__PURE__ */ u3(PriorityBadge, { priority: issue.priority, onClick: (e3) => priorityMenu(e3, issue.priority, save) }),
        /* @__PURE__ */ u3(LabelsField, { ctx, labels: issue.labels, index, save })
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: /* @__PURE__ */ u3("div", { class: "vt-row vt-schedule", children: [
      /* @__PURE__ */ u3(ScheduleStrip, { ctx, issue, save }),
      /* @__PURE__ */ u3(DueFields, { ctx, issue, save })
    ] }) }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: /* @__PURE__ */ u3(Relations, { ctx, issue, index, save }) }),
    /* @__PURE__ */ u3(Effort, { ctx, issue, index, save }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" }),
    /* @__PURE__ */ u3(Worklog, { ctx, taskId: issue.id, index }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" })
  ] });
}
function SummaryField(props) {
  const { summary, save } = props;
  const [editing, setEditing] = d2(false);
  const commit = (value) => {
    setEditing(false);
    if (value.trim() && value.trim() !== summary) save({ summary: value.trim() });
  };
  return /* @__PURE__ */ u3("div", { class: "vt-title", children: [
    props.badge,
    editing ? /* @__PURE__ */ u3(
      "input",
      {
        class: "vt-summary-input",
        value: summary,
        ref: (el) => el?.focus(),
        onBlur: (e3) => commit(e3.currentTarget.value),
        onKeyDown: (e3) => {
          if (e3.key === "Enter" && !e3.isComposing) commit(e3.currentTarget.value);
          if (e3.key === "Escape") setEditing(false);
        }
      }
    ) : /* @__PURE__ */ u3("span", { class: "vt-summary", onClick: () => setEditing(true), title: "\u30AF\u30EA\u30C3\u30AF\u3067\u7DE8\u96C6", children: [
      summary || "\uFF08summary \u306A\u3057\uFF09",
      /* @__PURE__ */ u3(Icon, { name: "pencil", class: "vt-hover-icon" })
    ] })
  ] });
}
function StatusField(props) {
  const { ctx, issue, index, save } = props;
  const change = (next) => {
    if (next === issue.status) return;
    if (next === "delegated") {
      pickMember(ctx, (id) => save({ status: next, delegated_to: id }));
      return;
    }
    const fields = { status: next, delegated_to: null };
    if (next === "someday") Object.assign(fields, { scheduled: null, mid_due: null, deadline: null });
    else fields.revisit = null;
    save(fields);
  };
  const menu = (e3) => {
    const m3 = new import_obsidian4.Menu();
    for (const s3 of STATUSES) m3.addItem((item) => item.setTitle(s3).setChecked(s3 === issue.status).onClick(() => change(s3)));
    m3.showAtMouseEvent(e3);
  };
  const editDetail = () => editStatusDetail(ctx, issue.statusDetail, save);
  const editRevisit = () => new PreactModal(ctx.app, "revisit\uFF08\u3053\u306E\u65E5\u3092\u904E\u304E\u305F\u3089 Organize \u306B\u51FA\u3059\uFF09", (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: issue.revisit,
      onSubmit: (v3) => {
        close();
        save({ revisit: v3 });
      }
    }
  )).open();
  const member = issue.delegatedTo === null ? null : index.members.get(issue.delegatedTo);
  return /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3(StatusBadge, { status: issue.status, wide: true, onClick: menu }),
    /* @__PURE__ */ u3("div", { class: "vt-status-detail", children: [
      issue.status === "delegated" && /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: () => pickMember(ctx, (id) => save({ delegated_to: id })), children: [
        /* @__PURE__ */ u3(Icon, { name: "user" }),
        member ? member.name : issue.delegatedTo ?? "\u59D4\u4EFB\u5148\u3092\u9078\u3076"
      ] }),
      issue.status === "someday" && /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: editRevisit, children: [
        /* @__PURE__ */ u3(Icon, { name: "calendar-clock" }),
        "revisit ",
        issue.revisit ? formatShortDate(issue.revisit) : "\u2014"
      ] }),
      /* @__PURE__ */ u3("button", { class: `vt-field-chip${issue.statusDetail ? "" : " is-placeholder"}`, onClick: editDetail, children: [
        /* @__PURE__ */ u3(Icon, { name: "pencil" }),
        issue.statusDetail || "\u8A73\u7D30\u3092\u8FFD\u52A0"
      ] })
    ] })
  ] });
}
function LabelsField(props) {
  const { ctx, labels, index, save } = props;
  const colors2 = new Map(index.data.labels.map((l3) => [l3.name, l3.color]));
  return /* @__PURE__ */ u3("button", { class: "vt-labels", onClick: () => editLabels(ctx, labels, save), title: "label \u3092\u7DE8\u96C6", children: [
    labels.map((name) => /* @__PURE__ */ u3(LabelBadge, { name, color: colors2.get(name) ?? "var(--background-modifier-border)" })),
    /* @__PURE__ */ u3("span", { class: "vt-badge vt-label is-empty", children: [
      /* @__PURE__ */ u3(Icon, { name: labels.length === 0 ? "tag" : "pencil" }),
      labels.length === 0 ? "label" : ""
    ] })
  ] });
}
function ScheduleStrip(props) {
  const { ctx, issue, save } = props;
  const today = localToday();
  const days = Array.from({ length: 7 }, (_2, i3) => addDays(today, i3));
  const scheduled = new Set(issue.scheduled);
  const toggle2 = (d3) => {
    const next = new Set(scheduled);
    if (next.has(d3)) next.delete(d3);
    else next.add(d3);
    save({ scheduled: [...next].sort() });
  };
  const openCalendar = () => new PreactModal(ctx.app, "\u5B9F\u884C\u65E5", (close) => /* @__PURE__ */ u3(
    CalendarForm,
    {
      initial: issue.scheduled,
      midDue: issue.midDue,
      deadline: issue.deadline,
      onSubmit: (dates) => {
        close();
        save({ scheduled: dates });
      }
    }
  )).open();
  const later = issue.scheduled.filter((d3) => d3 > days[6]).length;
  return /* @__PURE__ */ u3("div", { class: "vt-strip", children: [
    /* @__PURE__ */ u3("div", { class: "vt-strip-days", children: days.map((d3) => /* @__PURE__ */ u3("div", { class: "vt-strip-col", children: [
      /* @__PURE__ */ u3("span", { class: "vt-weekday", children: WEEKDAY_NAMES[weekdayOf(d3)] }),
      /* @__PURE__ */ u3(DayCell, { date: d3, scheduled: scheduled.has(d3), midDue: issue.midDue, deadline: issue.deadline, today, onClick: () => toggle2(d3) })
    ] })) }),
    /* @__PURE__ */ u3("button", { class: "vt-text-button", onClick: openCalendar, children: [
      "calendar >",
      later > 0 ? `\uFF08\u307B\u304B ${later} \u65E5\uFF09` : ""
    ] })
  ] });
}
function DueFields(props) {
  const { ctx, issue, save } = props;
  const today = localToday();
  const edit = (key, current) => () => new PreactModal(ctx.app, key, (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: current,
      onSubmit: (v3) => {
        close();
        save({ [key]: v3 });
      }
    }
  )).open();
  const row = (label, key, value) => /* @__PURE__ */ u3("button", { class: `vt-due vt-due-${dueLevel(issue, value, today)}`, onClick: edit(key, value), children: [
    /* @__PURE__ */ u3("span", { class: "vt-due-label", children: label }),
    /* @__PURE__ */ u3("span", { class: "vt-due-value", children: value ? formatShortDate(value) : "\u672A\u8A2D\u5B9A" }),
    /* @__PURE__ */ u3(Icon, { name: "calendar", class: "vt-trailing" })
  ] });
  return /* @__PURE__ */ u3("div", { class: "vt-dues", children: [
    row("mid_due", "mid_due", issue.midDue),
    row("deadline", "deadline", issue.deadline)
  ] });
}
function IssueLink(props) {
  return /* @__PURE__ */ u3("span", { class: "vt-relation", children: [
    /* @__PURE__ */ u3(IdBadge, { issue: props.issue }),
    /* @__PURE__ */ u3("span", { class: "vt-link", ...linkProps((e3) => void props.ctx.openPath(props.issue.path, import_obsidian4.Keymap.isModEvent(e3) !== false)), children: props.issue.summary }),
    props.onRemove && /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u5916\u3059", title: "\u5916\u3059", onClick: props.onRemove, children: /* @__PURE__ */ u3(Icon, { name: "x" }) })
  ] });
}
function Relations(props) {
  const { ctx, issue, index, save } = props;
  const parent = issue.parent === null ? null : index.issues.get(issue.parent);
  const children = index.children(issue.id);
  const pickParent = () => {
    const candidates = sortCandidates([...index.issues.values()].filter((c3) => index.canSetParent(issue.id, c3.id)));
    new IssueSuggestModal(ctx.app, candidates, (p3) => save({ parent: p3.id }), "\u89AA\u306B\u3059\u308B issue \u3092\u691C\u7D22").open();
  };
  const addChild = (e3) => {
    const m3 = new import_obsidian4.Menu();
    m3.addItem(
      (item) => item.setTitle("\u65E2\u5B58\u306E issue \u3092\u5B50\u306B\u3059\u308B").onClick(() => {
        const candidates = sortCandidates([...index.issues.values()].filter((c3) => c3.parent !== issue.id && index.canSetParent(c3.id, issue.id)));
        new IssueSuggestModal(ctx.app, candidates, (c3) => save({ parent: issue.id }, c3.path), "\u5B50\u306B\u3059\u308B issue \u3092\u691C\u7D22").open();
      })
    );
    m3.addItem(
      (item) => item.setTitle("\u65B0\u3057\u304F\u4F5C\u308B").onClick(
        () => new PreactModal(ctx.app, "\u5B50 issue \u306E summary", (close) => /* @__PURE__ */ u3(
          TextForm,
          {
            initial: "",
            onSubmit: (summary) => {
              close();
              if (!summary) return;
              void ctx.writer.createIssues([summary], issue.id).then((r3) => r3.failed.length > 0 && ctx.report("\u5B50 issue \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F")).catch((err) => ctx.report("\u5B50 issue \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", err));
            }
          }
        )).open()
      )
    );
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-row vt-halves vt-small vt-relations", children: [
    /* @__PURE__ */ u3("div", { class: "vt-relation-col", children: [
      /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
        "Parent",
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u89AA\u3092\u9078\u3076", title: "\u89AA\u3092\u9078\u3076", onClick: pickParent, children: /* @__PURE__ */ u3(Icon, { name: "pencil" }) })
      ] }),
      parent ? /* @__PURE__ */ u3(IssueLink, { ctx, issue: parent, onRemove: () => save({ parent: null }) }) : issue.parent !== null ? /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
        issue.parent,
        "\uFF08\u898B\u3064\u304B\u308A\u307E\u305B\u3093\uFF09"
      ] }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-relation-col", children: [
      /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
        "Children",
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u5B50\u3092\u8FFD\u52A0", title: "\u5B50\u3092\u8FFD\u52A0", onClick: addChild, children: /* @__PURE__ */ u3(Icon, { name: "plus" }) })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-wrap", children: [
        children.length === 0 && /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" }),
        children.map((c3) => /* @__PURE__ */ u3(IssueLink, { ctx, issue: c3, onRemove: () => save({ parent: null }, c3.path) }))
      ] })
    ] })
  ] });
}
function Effort(props) {
  const { ctx, issue, index, save } = props;
  const actual = index.effortMinutes(Date.now()).get(issue.id) ?? 0;
  const menu = (e3) => estimateMenu(ctx, e3, issue.estimated, save);
  return /* @__PURE__ */ u3("div", { class: "vt-effort", children: [
    /* @__PURE__ */ u3("button", { class: "vt-effort-cell is-editable", onClick: menu, children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: [
        "estimated",
        /* @__PURE__ */ u3(Icon, { name: "chevron-down", class: "vt-trailing" })
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: issue.estimated === null ? "\u2014" : formatMinutes(issue.estimated) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: "worklog \u304B\u3089\u81EA\u52D5\u3067\u8A08\u7B97", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "actual" }),
      /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: formatMinutes(actual) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: "estimated \u2212 actual", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "remained" }),
      /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: issue.estimated === null ? "\u2014" : formatMinutes(issue.estimated - actual) })
    ] })
  ] });
}
function formatTime(ms) {
  return formatDateTime(ms).slice(11);
}
function WorklogItem(props) {
  const { ctx, log } = props;
  const date = formatDateTime(log.fromMs).slice(0, 10);
  const running = log.toMs === null;
  const edit = () => new PreactModal(ctx.app, "worklog \u3092\u7DE8\u96C6", (close) => /* @__PURE__ */ u3(
    WorklogForm,
    {
      initial: { fromMs: log.fromMs, toMs: log.toMs, description: log.description },
      onSubmit: (d3) => {
        close();
        void ctx.writer.updateWorklog(log, {
          from: localDateTime(new Date(d3.fromMs)),
          to: d3.toMs === null ? null : localDateTime(new Date(d3.toMs)),
          description: d3.description
        }).catch((e3) => ctx.report("worklog \u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      },
      onDelete: () => {
        close();
        void ctx.writer.updateWorklog(log, null).catch((e3) => ctx.report("worklog \u3092\u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    }
  )).open();
  return /* @__PURE__ */ u3("button", { class: `vt-log${running ? " is-running" : ""}`, onClick: edit, title: "\u30AF\u30EA\u30C3\u30AF\u3067\u7DE8\u96C6", children: [
    /* @__PURE__ */ u3("span", { class: "vt-log-date", children: [
      /* @__PURE__ */ u3("span", { class: "vt-log-day", children: date.slice(5).replace("-", "/") }),
      /* @__PURE__ */ u3("span", { class: "vt-log-weekday", children: WEEKDAY_NAMES[weekdayOf(date)] })
    ] }),
    /* @__PURE__ */ u3("span", { class: "vt-log-main", children: [
      /* @__PURE__ */ u3("span", { class: "vt-log-time vt-num", children: [
        formatTime(log.fromMs),
        " \u2013 ",
        running ? "\u8A18\u9332\u4E2D" : formatTime(log.toMs)
      ] }),
      /* @__PURE__ */ u3("span", { class: `vt-log-desc${log.description ? "" : " is-placeholder"}`, children: log.description || "\u5185\u5BB9\u306A\u3057" })
    ] }),
    /* @__PURE__ */ u3("span", { class: "vt-log-duration vt-num", children: [
      running && /* @__PURE__ */ u3("span", { class: "vt-live-dot" }),
      formatMinutes(((log.toMs ?? Date.now()) - log.fromMs) / 6e4)
    ] }),
    /* @__PURE__ */ u3(Icon, { name: "pencil", class: "vt-log-edit" })
  ] });
}
function Worklog(props) {
  const { ctx, taskId } = props;
  const [page, setPage] = d2(0);
  const add = () => {
    const now = Date.now();
    new PreactModal(ctx.app, "worklog \u3092\u8FFD\u52A0", (close) => /* @__PURE__ */ u3(
      WorklogForm,
      {
        initial: { fromMs: now - 36e5, toMs: now, description: "" },
        onSubmit: (d3) => {
          close();
          const from = new Date(d3.fromMs);
          void ctx.writer.addWorklog(taskId, ctx.settings.deviceName, { from: localDateTime(from), to: d3.toMs === null ? null : localDateTime(new Date(d3.toMs)), description: d3.description }, from).catch((e3) => ctx.report("worklog \u3092\u8FFD\u52A0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
        }
      }
    )).open();
  };
  const logs = props.index.data.worklogs.filter((l3) => l3.taskId === taskId).sort((a3, b2) => b2.fromMs - a3.fromMs);
  const pages = Math.max(1, Math.ceil(logs.length / WORKLOG_PAGE));
  const current = Math.min(page, pages - 1);
  const shown = logs.slice(current * WORKLOG_PAGE, (current + 1) * WORKLOG_PAGE);
  return /* @__PURE__ */ u3("section", { class: "vt-worklog", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "worklog" }),
      logs.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-count", children: [
        logs.length,
        " \u4EF6"
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-text-button", onClick: add, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " \u8FFD\u52A0"
      ] })
    ] }),
    logs.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093" }),
    /* @__PURE__ */ u3("div", { class: "vt-log-list", children: shown.map((l3) => /* @__PURE__ */ u3(WorklogItem, { ctx: props.ctx, log: l3 }, l3.id)) }),
    pages > 1 && /* @__PURE__ */ u3(Pager, { current, pages, onChange: setPage })
  ] });
}

// src/header/RoutineHeader.tsx
var import_obsidian5 = require("obsidian");

// src/core/groups.ts
var GROUPS_PATH = "issue/board-groups.json";
var UNGROUPED = "";
function parseGroup(value, depth, problems) {
  const o3 = typeof value === "object" && value !== null ? value : {};
  const name = typeof o3.name === "string" ? o3.name.trim() : "";
  if (!name || name.includes("/")) {
    problems.push(`\u30B0\u30EB\u30FC\u30D7\u540D\u304C\u306A\u3044\u304B\u3001/ \u3092\u542B\u3093\u3067\u3044\u307E\u3059: ${JSON.stringify(value)}`);
    return null;
  }
  const children = [];
  if (Array.isArray(o3.children)) {
    if (depth >= 1 && o3.children.length > 0) problems.push(`\u30B0\u30EB\u30FC\u30D7\u306F 2 \u968E\u5C64\u307E\u3067\u3067\u3059: ${name}`);
    else
      for (const c3 of o3.children) {
        const g2 = parseGroup(c3, depth + 1, problems);
        if (g2 && !children.some((x2) => x2.name === g2.name)) children.push(g2);
      }
  }
  return { name, children };
}
function parseGroups(text) {
  const messages = [];
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
    messages.push("JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
  }
  const groups = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      const g2 = parseGroup(item, 0, messages);
      if (g2 && !groups.some((x2) => x2.name === g2.name)) groups.push(g2);
    }
  } else if (data !== null) messages.push("\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
  return { groups, problems: messages.map((message) => ({ severity: "error", path: GROUPS_PATH, code: "invalid-groups", message })) };
}
function serializeGroups(groups) {
  const strip = (g2) => ({ name: g2.name, ...g2.children.length > 0 ? { children: g2.children.map(strip) } : {} });
  return `${JSON.stringify(groups.map(strip), null, 2)}
`;
}
function groupNameError(name, siblings, current) {
  const n2 = name.trim();
  if (!n2) return "\u540D\u524D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  if (n2.includes("/")) return "/ \u306F\u4F7F\u3048\u307E\u305B\u3093";
  if (n2 !== current && siblings.some((g2) => g2.name === n2)) return "\u540C\u3058\u540D\u524D\u304C\u3042\u308A\u307E\u3059";
  return null;
}
function groupKeys(groups) {
  return groups.flatMap((g2) => [g2.name, ...g2.children.map((c3) => `${g2.name}/${c3.name}`)]);
}
function inGroup(key, group) {
  return key === group || key.startsWith(`${group}/`);
}

// src/ui/RepeatFields.tsx
function defaultRepeatDraft() {
  return { every: "week", interval: 1, weekdays: ["mon"], monthText: "1" };
}
function repeatDraftOf(rule) {
  if (rule === null) return defaultRepeatDraft();
  const on = serializeRepeat(rule).on ?? [];
  return {
    ...defaultRepeatDraft(),
    every: rule.every,
    interval: rule.interval,
    ...rule.every === "week" ? { weekdays: on } : {},
    ...rule.every === "month" ? { monthText: on.join(", ") } : {}
  };
}
function readRepeatDraft(draft) {
  const { every, interval } = draft;
  const on = every === "week" ? draft.weekdays : every === "month" ? draft.monthText.split(/[,\s]+/).filter(Boolean).map((s3) => /^\d+$/.test(s3) ? Number(s3) : s3) : void 0;
  const repeat = { every, ...interval > 1 ? { interval } : {}, ...on ? { on } : {} };
  const parsed = parseRepeat(repeat);
  const badMonth = every === "month" && on.some((v3) => parseMonthSpec(v3) === null);
  return {
    repeat,
    error: !parsed.ok ? parsed.error : badMonth ? "\u65E5\u4ED8\u306E\u66F8\u304D\u65B9\u304C\u8AAD\u3081\u307E\u305B\u3093" : null,
    description: parsed.ok ? describeRepeat(parsed.value) : ""
  };
}
function RepeatFields(props) {
  const { draft, onChange } = props;
  const set = (patch) => onChange({ ...draft, ...patch });
  return /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
      /* @__PURE__ */ u3("span", { children: "\u304F\u308A\u8FD4\u3057" }),
      /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: [
        [
          ["day", "\u6BCE\u65E5"],
          ["week", "\u6BCE\u9031"],
          ["month", "\u6BCE\u6708"]
        ].map(([v3, label]) => /* @__PURE__ */ u3("button", { type: "button", class: `vt-filter-chip${draft.every === v3 ? " is-on" : ""}`, onClick: () => set({ every: v3 }), children: label })),
        /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u9593\u9694" }),
        /* @__PURE__ */ u3("input", { class: "vt-small-input", type: "number", min: 1, value: draft.interval, onInput: (e3) => set({ interval: Math.max(1, Number(e3.currentTarget.value) || 1) }) })
      ] })
    ] }),
    draft.every === "week" && /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: [1, 2, 3, 4, 5, 6, 0].map((w3) => {
      const name = WEEKDAY_NAMES[w3];
      const onDay = draft.weekdays.includes(name);
      return /* @__PURE__ */ u3(
        "button",
        {
          type: "button",
          class: `vt-filter-chip${onDay ? " is-on" : ""}`,
          onClick: () => set({ weekdays: onDay ? draft.weekdays.filter((x2) => x2 !== name) : [...draft.weekdays, name] }),
          children: name
        }
      );
    }) }),
    draft.every === "month" && /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
      /* @__PURE__ */ u3("span", { children: "\u65E5\u4ED8\uFF08\u30AB\u30F3\u30DE\u533A\u5207\u308A\u300215 / last = \u6708\u672B / 2th-tue = \u7B2C 2 \u706B\u66DC / last-fri = \u6700\u7D42\u91D1\u66DC\uFF09" }),
      /* @__PURE__ */ u3("input", { type: "text", value: draft.monthText, onInput: (e3) => set({ monthText: e3.currentTarget.value }) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-muted", children: readRepeatDraft(draft).description })
  ] });
}

// src/header/RoutineHeader.tsx
var RESULT_DAYS = 14;
var RESULT_MARK = { closed: "\u2713", canceled: "\xD7", none: "\u30FB", off: "" };
var RESULT_LABEL = { closed: "closed", canceled: "canceled", none: "\u672A\u8A18\u9332", off: "\u4E88\u5B9A\u306A\u3057" };
function RepeatForm(props) {
  const [draft, setDraft] = d2(repeatDraftOf(props.rule));
  const read = readRepeatDraft(draft);
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (read.error === null) props.onSubmit(read.repeat);
      },
      children: [
        /* @__PURE__ */ u3(RepeatFields, { draft, onChange: setDraft }),
        read.error !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: read.error }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: read.error !== null, children: "\u4FDD\u5B58" }) })
      ]
    }
  );
}
function Results(props) {
  return /* @__PURE__ */ u3("div", { class: "vt-routine-results", children: [
    /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
      "\u76F4\u8FD1 ",
      RESULT_DAYS,
      " \u65E5"
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-results", children: props.results.map((r3) => {
      const label = `${r3.date} ${RESULT_LABEL[r3.state]}`;
      return /* @__PURE__ */ u3("div", { class: `vt-result is-${r3.state}`, title: label, "aria-label": label, role: "img", children: [
        /* @__PURE__ */ u3("span", { class: "vt-result-weekday", children: WEEKDAY_NAMES[weekdayOf(r3.date)] }),
        /* @__PURE__ */ u3("span", { class: "vt-num", children: Number(r3.date.slice(8, 10)) }),
        /* @__PURE__ */ u3("span", { class: "vt-result-mark", children: RESULT_MARK[r3.state] })
      ] });
    }) }),
    /* @__PURE__ */ u3("div", { class: "vt-muted", children: "\u2713 closed\u3000\xD7 canceled\u3000\u30FB \u672A\u8A18\u9332\u3000\u7A7A\u6B04 \u4E88\u5B9A\u306A\u3057" })
  ] });
}
function RoutineHeader(props) {
  const { ctx, path } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const routine = [...index.routines.values()].find((r3) => r3.path === path);
  if (!routine) {
    return /* @__PURE__ */ u3("div", { class: "vt-header-missing", children: "routine \u306E frontmatter \u3092\u8AAD\u3081\u307E\u305B\u3093\uFF08type / id \u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\uFF09" });
  }
  const save = (fields) => void ctx.writer.update(path, fields).catch((e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  const editRepeat = () => new PreactModal(ctx.app, "\u304F\u308A\u8FD4\u3057", (close) => /* @__PURE__ */ u3(
    RepeatForm,
    {
      rule: routine.repeat,
      onSubmit: (repeat) => {
        close();
        save({ repeat });
      }
    }
  )).open();
  const editDate = (key, current) => () => new PreactModal(ctx.app, key, (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: current,
      onSubmit: (v3) => {
        close();
        save({ [key]: v3 });
      }
    }
  )).open();
  const groupMenu = (e3) => {
    const m3 = new import_obsidian5.Menu();
    for (const key of ["", ...groupKeys(index.data.groups)]) {
      m3.addItem(
        (item) => item.setTitle(key || "\u672A\u5206\u985E").setChecked((routine.group ?? "") === key).onClick(() => save({ group: key || null }))
      );
    }
    m3.showAtMouseEvent(e3);
  };
  const effort = index.routineEffort(routine.id, Date.now());
  return /* @__PURE__ */ u3("div", { class: "vt-issue", children: [
    /* @__PURE__ */ u3("div", { class: "vt-meta", children: [
      /* @__PURE__ */ u3("span", { children: [
        "created ",
        formatDateTime(routine.created)
      ] }),
      /* @__PURE__ */ u3("span", { children: [
        "updated ",
        formatDateTime(ctx.store.mtime(path))
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-routine-title", children: [
      /* @__PURE__ */ u3(SummaryField, { badge: /* @__PURE__ */ u3("span", { class: "vt-badge vt-id vt-routine-id", children: routine.id }), summary: routine.summary, save }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: `vt-switch${routine.active ? " is-on" : ""}`,
          role: "switch",
          "aria-checked": routine.active,
          "aria-label": routine.active ? "\u4E00\u6642\u505C\u6B62\u3059\u308B" : "\u518D\u958B\u3059\u308B",
          title: routine.active ? "\u4E00\u6642\u505C\u6B62\u3059\u308B" : "\u518D\u958B\u3059\u308B",
          onClick: () => save({ active: !routine.active }),
          children: /* @__PURE__ */ u3("span", { class: "vt-switch-thumb" })
        }
      )
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: [
      /* @__PURE__ */ u3("div", { class: "vt-row vt-chips", children: [
        /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: editRepeat, children: [
          /* @__PURE__ */ u3(Icon, { name: "repeat" }),
          routine.repeat ? describeRepeat(routine.repeat) : "repeat \u304C\u8AAD\u3081\u307E\u305B\u3093"
        ] }),
        /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: editDate("start", routine.start), children: [
          /* @__PURE__ */ u3(Icon, { name: "calendar" }),
          "start ",
          routine.start ? formatShortDate(routine.start) : "\u2014"
        ] }),
        /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: editDate("end", routine.end), children: [
          /* @__PURE__ */ u3(Icon, { name: "calendar" }),
          "end ",
          routine.end ? formatShortDate(routine.end) : "\u2014"
        ] })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-row vt-chips", children: [
        /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: groupMenu, children: [
          /* @__PURE__ */ u3(Icon, { name: "layout-grid" }),
          routine.group ?? "\u672A\u5206\u985E"
        ] }),
        /* @__PURE__ */ u3(PriorityBadge, { priority: routine.priority, onClick: (e3) => priorityMenu(e3, routine.priority, save) }),
        /* @__PURE__ */ u3(LabelsField, { ctx, labels: routine.labels, index, save })
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: /* @__PURE__ */ u3(Results, { results: routineResults(index, routine, localToday(), RESULT_DAYS) }) }),
    /* @__PURE__ */ u3("div", { class: "vt-effort", children: [
      /* @__PURE__ */ u3("button", { class: "vt-effort-cell is-editable", onClick: (e3) => estimateMenu(ctx, e3, routine.estimated, save), children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: [
          "estimated",
          /* @__PURE__ */ u3(Icon, { name: "chevron-down", class: "vt-trailing" })
        ] }),
        /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: routine.estimated === null ? "\u2014" : formatMinutes(routine.estimated) })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: "worklog \u304B\u3089\u81EA\u52D5\u3067\u8A08\u7B97", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "total" }),
        /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: formatMinutes(effort.total) })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: effort.days > 0 ? `\u8A18\u9332\u306E\u3042\u308B ${effort.days} \u65E5\u5206\u306E 1 \u65E5\u3042\u305F\u308A\u5E73\u5747` : "worklog \u304B\u3089\u81EA\u52D5\u3067\u8A08\u7B97", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "average" }),
        /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: effort.average === null ? "\u2014" : formatMinutes(effort.average) })
      ] })
    ] }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" }),
    /* @__PURE__ */ u3(Worklog, { ctx, taskId: routine.id, index }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" })
  ] });
}

// src/header/extension.ts
var ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;
var ROUTINE_PATH_RE = /^routine\/[^/]+\.md$/;
var HeaderWidget = class extends import_view.WidgetType {
  constructor(ctx, path) {
    super();
    this.ctx = ctx;
    this.path = path;
  }
  ctx;
  path;
  eq(other) {
    return other.path === this.path;
  }
  toDOM() {
    const el = document.createElement("div");
    el.className = "vt-header";
    R(k(ROUTINE_PATH_RE.test(this.path) ? RoutineHeader : IssueHeader, { ctx: this.ctx, path: this.path }), el);
    return el;
  }
  destroy(dom) {
    R(null, dom);
  }
  /** ヘッダーの中のクリックや入力をエディタに渡さない */
  ignoreEvent() {
    return true;
  }
};
function issueHeaderExtension(ctx) {
  const pathOf = (state) => {
    const path = state.field(import_obsidian6.editorInfoField, false)?.file?.path ?? null;
    return path !== null && (ISSUE_PATH_RE.test(path) || ROUTINE_PATH_RE.test(path)) ? path : null;
  };
  const livePreviewOf = (state) => state.field(import_obsidian6.editorLivePreviewField, false) === true;
  const build = (state) => {
    const path = pathOf(state);
    const livePreview = livePreviewOf(state);
    if (path === null) return { path, livePreview, decorations: import_view.Decoration.none };
    const widget = new HeaderWidget(ctx, path);
    const range = livePreview ? frontmatterRange(state.doc.toString()) : null;
    const decoration = range ? import_view.Decoration.replace({ widget, block: true }).range(range.from, range.to) : import_view.Decoration.widget({ widget, block: true, side: -1 }).range(0);
    return { path, livePreview, decorations: import_view.Decoration.set([decoration]) };
  };
  return import_state.StateField.define({
    create: build,
    update(value, tr) {
      if (tr.docChanged || pathOf(tr.state) !== value.path || livePreviewOf(tr.state) !== value.livePreview) return build(tr.state);
      return value;
    },
    provide: (field) => [
      import_view.EditorView.decorations.from(field, (v3) => v3.decorations),
      // カーソルが隠した frontmatter の中に入らないようにする
      import_view.EditorView.atomicRanges.of((view) => view.state.field(field).decorations)
    ]
  });
}

// src/obsidian/capture.tsx
var import_obsidian7 = require("obsidian");

// src/core/capture.ts
var LIST_MARKER_RE = /^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/;
function parseCaptureText(text) {
  return text.split(/\r?\n/).map((line) => line.replace(LIST_MARKER_RE, "").trim()).filter((line) => line.length > 0);
}

// src/obsidian/capture.tsx
var NOTICE_MS = 5e3;
function CaptureForm(props) {
  const [text, setText] = d2("");
  const ref = A2(null);
  h2(() => ref.current?.focus(), []);
  const summaries = parseCaptureText(text);
  const submit = () => summaries.length > 0 && props.onSubmit(summaries);
  return /* @__PURE__ */ u3("div", { class: "vt-capture", children: [
    /* @__PURE__ */ u3(
      "textarea",
      {
        ref,
        rows: 6,
        placeholder: "1 \u884C\u306B 1 \u4EF6\u3001summary \u3092\u66F8\u304F\n- \u7B87\u6761\u66F8\u304D\u3092\u8CBC\u308A\u4ED8\u3051\u3066\u3082\u3088\u3044",
        value: text,
        onInput: (e3) => setText(e3.currentTarget.value),
        onKeyDown: (e3) => {
          if (e3.key === "Enter" && (e3.metaKey || e3.ctrlKey) && !e3.isComposing) {
            e3.preventDefault();
            submit();
          }
        }
      }
    ),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: [
      /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
        summaries.length,
        " \u4EF6\u4F5C\u6210\u3057\u307E\u3059",
        import_obsidian7.Platform.isMobile ? "" : "\uFF08Mod+Enter\uFF09"
      ] }),
      /* @__PURE__ */ u3("button", { class: "mod-cta", disabled: summaries.length === 0, onClick: submit, children: "\u4F5C\u6210" })
    ] })
  ] });
}
async function openAll(ctx, files) {
  let first = null;
  for (const file of files) {
    const leaf = ctx.app.workspace.getLeaf("tab");
    await leaf.openFile(file, { active: false });
    first ??= leaf;
  }
  if (first) ctx.app.workspace.setActiveLeaf(first, { focus: true });
}
function showCreatedNotice(ctx, created, failed) {
  const fragment = document.createDocumentFragment();
  const ids = created.map((f4) => f4.basename);
  const range = ids.length <= 1 ? ids.join("") : `${ids[0]}\u301C${ids[ids.length - 1]}`;
  const message = created.length > 0 ? `${created.length} \u4EF6\u306E issue \u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\uFF08${range}\uFF09` : "issue \u3092\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F";
  fragment.createEl("div", { text: failed.length > 0 ? `${message}\u3002${failed.length} \u4EF6\u306F\u5931\u6557` : message });
  let notice = null;
  if (created.length > 0) {
    const button = fragment.createEl("button", { text: "\u3059\u3079\u3066\u30BF\u30D6\u3067\u958B\u304F", cls: "vt-notice-button" });
    button.addEventListener("click", (e3) => {
      e3.stopPropagation();
      notice?.hide();
      void openAll(ctx, created).catch((err) => ctx.report("\u30BF\u30D6\u3067\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", err));
    });
  }
  notice = new import_obsidian7.Notice(fragment, NOTICE_MS);
}
function openCaptureModal(ctx) {
  new PreactModal(ctx.app, "issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210", (close) => /* @__PURE__ */ u3(
    CaptureForm,
    {
      onSubmit: (summaries) => {
        close();
        void ctx.writer.createIssues(summaries).then(({ created, failed }) => showCreatedNotice(ctx, created, failed)).catch((e3) => ctx.report("issue \u3092\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    }
  )).open();
}

// src/obsidian/settings.ts
var import_obsidian8 = require("obsidian");

// src/core/worklog.ts
var WORKLOG_PATH_RE = /^worklog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
function sanitizeDeviceName(name) {
  return name.trim().replace(/[\\/:*?"<>|#^[\]]/g, "-").replace(/^\.+/, "");
}
function worklogPath(device, from) {
  const safe = sanitizeDeviceName(device);
  if (!safe) throw new Error("\u7AEF\u672B\u540D\u304C\u7A7A\u3067\u3059");
  const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
  return `worklog/${safe}/${month}.jsonl`;
}
function parseWorklog(path, text) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text.split("\n").forEach((raw, i3) => {
    const line = i3 + 1;
    if (!raw.trim()) return;
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      problem(line, "invalid-json", "JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
      return;
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      problem(line, "invalid-json", "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    const o3 = obj;
    if (typeof o3.id !== "string" || !o3.id) return problem(line, "invalid-worklog", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    if (typeof o3.task_id !== "string" || !o3.task_id) return problem(line, "invalid-worklog", "task_id \u304C\u3042\u308A\u307E\u305B\u3093");
    const fromMs = typeof o3.from === "string" ? Date.parse(o3.from) : Number.NaN;
    if (Number.isNaN(fromMs)) return problem(line, "invalid-worklog", "from \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    let toMs2 = null;
    if (o3.to !== null && o3.to !== void 0) {
      toMs2 = typeof o3.to === "string" ? Date.parse(o3.to) : Number.NaN;
      if (Number.isNaN(toMs2)) return problem(line, "invalid-worklog", "to \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    }
    entries.push({
      path,
      line,
      id: o3.id,
      taskId: o3.task_id,
      from: o3.from,
      to: toMs2 === null ? null : o3.to,
      description: typeof o3.description === "string" ? o3.description : "",
      fromMs,
      toMs: toMs2
    });
  });
  return { entries, problems };
}
function serializeWorklogEntry(e3) {
  return JSON.stringify({ id: e3.id, task_id: e3.taskId, from: e3.from, to: e3.to, description: e3.description });
}
function replaceWorklogLine(text, entry, next) {
  const lines = text.split("\n");
  const i3 = entry.line - 1;
  let current;
  try {
    current = JSON.parse(lines[i3] ?? "");
  } catch {
    current = null;
  }
  if (typeof current !== "object" || current === null || current.id !== entry.id) {
    throw new Error("worklog \u306E\u30D5\u30A1\u30A4\u30EB\u304C\u5909\u308F\u3063\u3066\u3044\u307E\u3059\u3002\u958B\u304D\u76F4\u3057\u3066\u304B\u3089\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044");
  }
  if (next === null) lines.splice(i3, 1);
  else lines[i3] = serializeWorklogEntry({ id: entry.id, taskId: entry.taskId, ...next });
  return lines.join("\n");
}
var MIN_WORKLOG_MS = 6e4;
function stopWorklogLines(text, entries, to, toMs2) {
  return [...entries].sort((a3, b2) => b2.line - a3.line).reduce((t3, e3) => replaceWorklogLine(t3, e3, toMs2 - e3.fromMs < MIN_WORKLOG_MS ? null : { from: e3.from, to, description: e3.description }), text);
}
function newWorklogId(random = Math.random) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return `wl_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}
function appendWorklogLine(text, line) {
  return `${text}${text.length > 0 && !text.endsWith("\n") ? "\n" : ""}${line}
`;
}

// src/obsidian/settings.ts
var DEFAULT_SETTINGS = { deviceName: "", presets: [] };
var TaskSettingTab = class extends import_obsidian8.PluginSettingTab {
  constructor(app, plugin, settings, save) {
    super(app, plugin);
    this.settings = settings;
    this.save = save;
  }
  settings;
  save;
  display() {
    this.containerEl.empty();
    new import_obsidian8.Setting(this.containerEl).setName("\u7AEF\u672B\u540D").setDesc("worklog \u3092 worklog/<\u7AEF\u672B\u540D>/ \u306B\u66F8\u304D\u307E\u3059\u3002\u7AEF\u672B\u3054\u3068\u306B\u9055\u3046\u540D\u524D\u306B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08vault-git \u306E\u7AEF\u672B\u540D\u3068\u540C\u3058\u304C\u304A\u3059\u3059\u3081\uFF09").addText(
      (t3) => t3.setPlaceholder("\u4F8B: iphone").setValue(this.settings.deviceName).onChange(async (v3) => {
        this.settings.deviceName = sanitizeDeviceName(v3);
        await this.save();
      })
    );
  }
};

// src/obsidian/store.ts
var import_obsidian9 = require("obsidian");

// src/core/board-log.ts
var BOARD_LOG_PATH_RE = /^board\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
function boardLogPath(device, date) {
  const safe = sanitizeDeviceName(device);
  if (!safe) throw new Error("\u7AEF\u672B\u540D\u304C\u7A7A\u3067\u3059");
  return `board/${safe}/${date.slice(0, 7)}.jsonl`;
}
function nextBoardAt(nowMs, latestMs) {
  return latestMs === null ? nowMs : Math.max(nowMs, latestMs + 1);
}
function parseOp(o3) {
  const task = typeof o3.task === "string" && o3.task ? o3.task : null;
  switch (o3.op) {
    case "add":
    case "remove":
    case "carry":
      return task ? { op: o3.op, task } : null;
    case "place":
      return task && (o3.group === null || typeof o3.group === "string" && o3.group) ? { op: "place", task, group: o3.group } : null;
    case "routine":
      return task && (o3.result === null || o3.result === "closed" || o3.result === "canceled") ? { op: "routine", task, result: o3.result } : null;
    case "close":
      return Array.isArray(o3.tasks) && o3.tasks.every((id) => typeof id === "string" && id) ? { op: "close", tasks: o3.tasks } : null;
    case "reopen":
      return { op: "reopen" };
    default:
      return null;
  }
}
function parseBoardLog(path, text) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text.split("\n").forEach((raw, i3) => {
    const line = i3 + 1;
    if (!raw.trim()) return;
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      problem(line, "invalid-json", "JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
      return;
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      problem(line, "invalid-json", "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    const o3 = obj;
    if (typeof o3.id !== "string" || !o3.id) return problem(line, "invalid-board-log", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    const atMs = typeof o3.at === "string" ? Date.parse(o3.at) : Number.NaN;
    if (Number.isNaN(atMs)) return problem(line, "invalid-board-log", "at \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (typeof o3.date !== "string" || !isLocalDate(o3.date)) return problem(line, "invalid-board-log", "date \u304C\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const op = parseOp(o3);
    if (!op) return problem(line, "invalid-board-log", "\u64CD\u4F5C\u304C\u4E0D\u6B63\u3067\u3059");
    entries.push({ path, line, id: o3.id, at: o3.at, atMs, date: o3.date, op });
  });
  return { entries, problems };
}
function serializeBoardLogEntry(e3) {
  return JSON.stringify(e3);
}
function newBoardLogId(random = Math.random) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return `bo_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}
function compareEntries(a3, b2) {
  if (a3.atMs !== b2.atMs) return a3.atMs - b2.atMs;
  if (a3.path !== b2.path) return a3.path < b2.path ? -1 : 1;
  return a3.line - b2.line;
}
function apply(board, op) {
  switch (op.op) {
    case "add":
      if (!board.issues.includes(op.task)) board.issues.push(op.task);
      board.carried = board.carried.filter((id) => id !== op.task);
      board.closed = false;
      break;
    case "remove":
      board.issues = board.issues.filter((id) => id !== op.task);
      board.carried = board.carried.filter((id) => id !== op.task);
      delete board.groups[op.task];
      break;
    case "place":
      if (op.group === null) delete board.groups[op.task];
      else board.groups[op.task] = op.group;
      break;
    case "routine":
      if (op.result === null) delete board.routines[op.task];
      else board.routines[op.task] = op.result;
      break;
    case "carry":
      if (board.issues.includes(op.task)) markCarried(board, [op.task]);
      break;
    case "close":
    case "reopen":
      board.closed = op.op === "close";
      break;
  }
}
function replayBoard(initial, entries) {
  const board = { ...emptyBoard(), ...structuredClone(initial) };
  let lastClose = null;
  for (const e3 of [...entries].sort(compareEntries)) {
    apply(board, e3.op);
    if (e3.op.op === "close") lastClose = e3.op.tasks;
  }
  const seen = lastClose;
  if (board.closed && seen !== null && board.issues.some((id) => !seen.includes(id))) board.closed = false;
  return board;
}

// src/core/labels.ts
var LABELS_PATH = "issue/labels.json";
var DEFAULT_LABEL_COLOR = "#d0d0d0";
function parseLabels(text) {
  const problems = [];
  const problem = (message) => problems.push({ severity: "error", path: LABELS_PATH, code: "invalid-labels", message });
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    problem("JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
    return { labels: [], problems };
  }
  if (!Array.isArray(data)) {
    problem("\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    return { labels: [], problems };
  }
  const labels = [];
  for (const item of data) {
    const o3 = typeof item === "object" && item !== null ? item : {};
    if (typeof o3.name !== "string" || !o3.name.trim()) {
      problem(`name \u306E\u306A\u3044 label \u304C\u3042\u308A\u307E\u3059: ${JSON.stringify(item)}`);
      continue;
    }
    const name = o3.name.trim();
    if (labels.some((l3) => l3.name === name)) {
      problem(`label \u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059: ${name}`);
      continue;
    }
    const color = typeof o3.color === "string" && /^#[0-9a-f]{3,8}$/i.test(o3.color) ? o3.color : DEFAULT_LABEL_COLOR;
    labels.push({ name, color });
  }
  return { labels, problems };
}
function serializeLabels(labels) {
  return `${JSON.stringify(labels.map((l3) => ({ name: l3.name, color: l3.color })), null, 2)}
`;
}

// src/core/load.ts
function fileKind(path) {
  if (path === LABELS_PATH) return "labels";
  if (path === GROUPS_PATH) return "groups";
  if (DAILY_PATH_RE.test(path)) return "daily";
  if (WORKLOG_PATH_RE.test(path)) return "worklog";
  if (BOARD_LOG_PATH_RE.test(path)) return "board";
  const m3 = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
  return m3 ? m3[1] : null;
}
function collectVault(input) {
  const data = { issues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], groups: [] };
  const problems = [];
  const initialBoards = /* @__PURE__ */ new Map();
  for (const { path, frontmatter } of [...input.markdown].sort((a3, b2) => a3.path.localeCompare(b2.path, "en", { numeric: true }))) {
    const kind = fileKind(path);
    if (kind === "daily") {
      if (frontmatter && frontmatter[BOARD_KEY] !== void 0) {
        initialBoards.set(DAILY_PATH_RE.exec(path)[1], parseBoard(frontmatter[BOARD_KEY]));
      }
      continue;
    }
    if (kind !== "issue" && kind !== "routine" && kind !== "member") continue;
    if (frontmatter === null) {
      problems.push({ severity: "error", path, code: "missing-frontmatter", message: "frontmatter \u304C\u306A\u3044\u304B\u3001YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093" });
      continue;
    }
    if (kind === "issue") {
      const r3 = parseIssue(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) data.issues.push(r3.value);
    } else if (kind === "routine") {
      const r3 = parseRoutine(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) data.routines.push(r3.value);
    } else {
      const r3 = parseMember(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) data.members.push(r3.value);
    }
  }
  for (const { path, text } of [...input.worklogs].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseWorklog(path, text);
    problems.push(...r3.problems);
    data.worklogs.push(...r3.entries);
  }
  const logsByDate = /* @__PURE__ */ new Map();
  for (const { path, text } of [...input.boardLogs ?? []].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseBoardLog(path, text);
    problems.push(...r3.problems);
    for (const e3 of r3.entries) logsByDate.set(e3.date, [...logsByDate.get(e3.date) ?? [], e3]);
  }
  for (const date of [.../* @__PURE__ */ new Set([...initialBoards.keys(), ...logsByDate.keys()])].sort()) {
    const logs = logsByDate.get(date) ?? [];
    data.boards.push({
      date,
      path: dailyNotePath(date),
      board: replayBoard(initialBoards.get(date) ?? emptyBoard(), logs),
      ...logs.length > 0 ? { latestAt: Math.max(...logs.map((e3) => e3.atMs)) } : {}
    });
  }
  if (input.labels !== null) {
    const r3 = parseLabels(input.labels);
    problems.push(...r3.problems);
    data.labels = r3.labels;
  }
  if (input.groups) {
    const r3 = parseGroups(input.groups);
    problems.push(...r3.problems);
    data.groups = r3.groups;
  }
  return { data, problems };
}

// src/obsidian/store.ts
var TaskStore = class {
  constructor(app) {
    this.app = app;
  }
  app;
  index = new TaskIndex(emptyVaultData());
  problems = [];
  /** 作り直すたびに増える。UI の再描画に使う */
  version = 0;
  texts = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  timer = null;
  async load(registerEvent) {
    await Promise.all(this.app.vault.getFiles().map((f4) => this.readText(f4)));
    const { vault, metadataCache } = this.app;
    for (const ref of [
      metadataCache.on("changed", (file) => this.touch(file)),
      vault.on("create", (file) => file instanceof import_obsidian9.TFile && void this.readText(file).then(() => this.touch(file))),
      vault.on("modify", (file) => file instanceof import_obsidian9.TFile && void this.readText(file).then(() => this.touch(file))),
      vault.on("delete", (file) => {
        this.texts.delete(file.path);
        if (file instanceof import_obsidian9.TFile) this.touch(file);
      }),
      vault.on("rename", (file, oldPath) => {
        this.texts.delete(oldPath);
        if (file instanceof import_obsidian9.TFile) void this.readText(file).then(() => this.schedule());
      })
    ])
      registerEvent(ref);
    this.rebuild();
  }
  unload() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.listeners.clear();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  /** 書き込んだ直後に UI へ反映したいとき用（metadataCache の更新を待たない） */
  refreshSoon() {
    this.schedule();
  }
  mtime(path) {
    const file = this.app.vault.getFileByPath(path);
    return file ? file.stat.mtime : null;
  }
  async readText(file) {
    const kind = fileKind(file.path);
    if (kind === "worklog" || kind === "board" || kind === "labels" || kind === "groups") this.texts.set(file.path, await this.app.vault.cachedRead(file));
  }
  touch(file) {
    if (fileKind(file.path) !== null) this.schedule();
  }
  schedule() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.rebuild();
    }, 50);
  }
  rebuild() {
    const input = { markdown: [], worklogs: [], labels: null, groups: null, boardLogs: [] };
    for (const file of this.app.vault.getMarkdownFiles()) {
      const kind = fileKind(file.path);
      if (kind !== "issue" && kind !== "routine" && kind !== "member" && kind !== "daily") continue;
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      input.markdown.push({ path: file.path, frontmatter: fm ? { ...fm } : null });
    }
    for (const [path, text] of this.texts) {
      const kind = fileKind(path);
      if (kind === "worklog") input.worklogs.push({ path, text });
      else if (kind === "board") input.boardLogs.push({ path, text });
      else if (kind === "labels") input.labels = text;
      else if (kind === "groups") input.groups = text;
    }
    const { data, problems } = collectVault(input);
    this.index = new TaskIndex(data);
    this.problems = problems;
    this.version++;
    for (const fn of this.listeners) fn();
  }
};

// src/obsidian/view.ts
var import_obsidian10 = require("obsidian");
function preactViewCreator(spec, ctx) {
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
      this.contentEl.addClass("vt-view");
      R(k(spec.component, { ctx }), this.contentEl);
    }
    async onClose() {
      R(null, this.contentEl);
    }
  }
  return (leaf) => new PreactView(leaf);
}

// src/obsidian/writer.ts
var import_obsidian11 = require("obsidian");

// src/core/summary.ts
var SECTION = "## Task board";
function hm(ms) {
  const d3 = new Date(ms);
  return `${String(d3.getHours()).padStart(2, "0")}:${String(d3.getMinutes()).padStart(2, "0")}`;
}
function sameLocalDate(ms, date) {
  const d3 = new Date(ms);
  return `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, "0")}-${String(d3.getDate()).padStart(2, "0")}` === date;
}
function boardSummary(index, date, board) {
  const link = (id) => {
    const issue = index.issues.get(id);
    if (issue) return `[${issue.id} ${issue.summary}](${issue.path})`;
    const routine = index.routines.get(id);
    return routine ? `[${routine.id} ${routine.summary}](${routine.path})` : id;
  };
  const lines = [SECTION, ""];
  const closed = board.issues.filter((id) => index.issues.get(id)?.status === "closed");
  const others = board.issues.filter((id) => !closed.includes(id));
  const routines = Object.entries(board.routines);
  lines.push("### \u5B8C\u4E86", "");
  if (closed.length === 0 && routines.every(([, r3]) => r3 !== "closed")) lines.push("- \u306A\u3057");
  for (const id of closed) lines.push(`- ${link(id)}`);
  for (const [id, r3] of routines) if (r3 === "closed") lines.push(`- ${link(id)}`);
  if (others.length > 0 || routines.some(([, r3]) => r3 === "canceled")) {
    lines.push("", "### \u6301\u3061\u8D8A\u3057\u30FB\u4E2D\u6B62", "");
    for (const id of others) {
      const note = board.carried.includes(id) ? "\u6301\u3061\u8D8A\u3057" : index.issues.get(id)?.status ?? "?";
      lines.push(`- ${link(id)}\uFF08${note}\uFF09`);
    }
    for (const [id, r3] of routines) if (r3 === "canceled") lines.push(`- ${link(id)}\uFF08canceled\uFF09`);
  }
  const logs = index.data.worklogs.filter((l3) => sameLocalDate(l3.fromMs, date) && l3.toMs !== null).sort((a3, b2) => a3.fromMs - b2.fromMs);
  if (logs.length > 0) {
    lines.push("", "### worklog", "");
    for (const l3 of logs) {
      const desc = l3.description ? ` ${l3.description}` : "";
      lines.push(`- ${hm(l3.fromMs)}\u2013${hm(l3.toMs)}\uFF08${formatMinutes((l3.toMs - l3.fromMs) / 6e4)}\uFF09 ${link(l3.taskId)}${desc}`);
    }
  }
  return `${lines.join("\n")}
`;
}
function upsertSummary(text, summary) {
  const fm = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
  const head = fm ? fm[0] : "";
  const body = text.slice(head.length);
  const start = body.split("\n").findIndex((l3) => l3.trim() === SECTION);
  if (start < 0) {
    const sep = body.length === 0 || body.endsWith("\n\n") ? "" : body.endsWith("\n") ? "\n" : "\n\n";
    return head + body + sep + summary;
  }
  const lines = body.split("\n");
  let end = lines.findIndex((l3, i3) => i3 > start && /^## /.test(l3));
  if (end < 0) end = lines.length;
  const after = lines.slice(end).join("\n");
  return head + [...lines.slice(0, start), summary.trimEnd(), ...after ? ["", after] : [""]].join("\n");
}

// src/core/board-note.ts
function closeBoardNote(text, date, index, board) {
  if (!isLocalDate(date)) throw new Error("\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059");
  if (/^(?:<{7}|={7}|>{7})(?: |\r?$)/m.test(text)) throw new Error("\u540C\u671F\u306E\u7AF6\u5408\u3092\u89E3\u6D88\u3057\u3066\u304B\u3089\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3066\u304F\u3060\u3055\u3044");
  for (const id of board.issues) {
    if (!index.issues.has(id)) throw new Error(`issue \u304C\u3042\u308A\u307E\u305B\u3093: ${id}`);
  }
  const remaining = unfinished(index, date, board);
  if (remaining.issues.length + remaining.routines.length > 0) throw new Error("\u672A\u5B8C\u4E86\u306E\u30BF\u30B9\u30AF\u304C\u3042\u308B\u305F\u3081\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3089\u308C\u307E\u305B\u3093");
  return upsertSummary(text, boardSummary(index, date, board));
}

// ../design/src/color.ts
var HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function isHex(text) {
  return HEX.test(text);
}
function parseHex(text) {
  if (!isHex(text)) throw new Error(`\u8272\u306E\u66F8\u5F0F\u304C\u9055\u3044\u307E\u3059: ${text}`);
  let h3 = text.slice(1);
  if (h3.length <= 4) h3 = [...h3].map((c3) => c3 + c3).join("");
  const n2 = (i3) => Number.parseInt(h3.slice(i3, i3 + 2), 16);
  return { r: n2(0), g: n2(2), b: n2(4), a: h3.length === 8 ? n2(6) / 255 : 1 };
}
function over(top, bottom) {
  const a3 = top.a;
  return {
    r: top.r * a3 + bottom.r * (1 - a3),
    g: top.g * a3 + bottom.g * (1 - a3),
    b: top.b * a3 + bottom.b * (1 - a3),
    a: 1
  };
}
function stack(layers) {
  const [first, ...rest] = layers;
  if (!first) throw new Error("\u91CD\u306D\u308B\u8272\u304C\u3042\u308A\u307E\u305B\u3093");
  if (first.a < 1) throw new Error("\u4E00\u756A\u4E0B\u306E\u8272\u306F\u4E0D\u900F\u660E\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  return rest.reduce((acc, c3) => over(c3, acc), first);
}
function channel(v3) {
  const s3 = v3 / 255;
  return s3 <= 0.04045 ? s3 / 12.92 : ((s3 + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(c3) {
  return 0.2126 * channel(c3.r) + 0.7152 * channel(c3.g) + 0.0722 * channel(c3.b);
}
function contrastRatio(foreground, background) {
  if (background.a < 1) throw new Error("\u80CC\u666F\u306F\u4E0D\u900F\u660E\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const fg = foreground.a < 1 ? over(foreground, background) : foreground;
  const l1 = relativeLuminance(fg);
  const l22 = relativeLuminance(background);
  return (Math.max(l1, l22) + 0.05) / (Math.min(l1, l22) + 0.05);
}
function formatRatio(ratio) {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

// ../design/generated/tokens.ts
var colors = {
  light: {
    "color.surface": "#f6f5f2",
    "color.surface-container": "#efeeea",
    "color.surface-container-high": "#e8e7e2",
    "color.on-surface": "#2b2a28",
    "color.on-surface-variant": "#57564f",
    "color.outline": "#7f7e76",
    "color.outline-variant": "#2b2a2824",
    "color.state-hover": "#2b2a2814",
    "color.state-press": "#2b2a281f",
    "color.primary": "#6750a4",
    "color.on-primary": "#ffffff",
    "color.primary-state-hover": "#6750a414",
    "color.on-primary-state-hover": "#ffffff14",
    "color.secondary-container": "#e8def8",
    "color.on-secondary-container": "#1d192b",
    "color.error": "#b3261e",
    "color.focus-ring": "#6750a4",
    "color.text-faint": "#696860",
    "color.green-container": "#c4eed0",
    "color.on-green-container": "#072711",
    "color.green": "#1e8e3e",
    "color.blue-container": "#d3e3fd",
    "color.on-blue-container": "#041e49",
    "color.blue": "#0b57d0",
    "color.purple-container": "#eaddff",
    "color.on-purple-container": "#21005d",
    "color.purple": "#6750a4",
    "color.gray-container": "#e3e3e3",
    "color.on-gray-container": "#1f1f1f",
    "color.gray": "#747775",
    "color.sky-container": "#c2e7ff",
    "color.on-sky-container": "#001d35",
    "color.sky": "#00639b",
    "color.pink-container": "#ffd8e4",
    "color.on-pink-container": "#3e001d",
    "color.pink": "#c2185b",
    "color.red-container": "#f9dedc",
    "color.on-red-container": "#410e0b",
    "color.red": "#d93025",
    "color.amber-container": "#ffecb3",
    "color.on-amber-container": "#3a2a00",
    "color.amber": "#b06d00",
    "color.scheduled": "#188038",
    "color.scheduled-hover": "#137333",
    "color.on-scheduled": "#ffffff",
    "color.due-3": "#fff8e1",
    "color.due-2": "#ffe082",
    "color.due-1": "#ffb74d",
    "color.on-due": "#3a2a00",
    "color.due-0": "#d93025",
    "color.on-due-0": "#ffffff",
    "color.on-label": "#1f1f1f"
  },
  dark: {
    "color.surface": "#1e1e1e",
    "color.surface-container": "#242424",
    "color.surface-container-high": "#2b2b2b",
    "color.on-surface": "#d0d0d0",
    "color.on-surface-variant": "#b3b3b3",
    "color.outline": "#7a7a7a",
    "color.outline-variant": "#d0d0d024",
    "color.state-hover": "#d0d0d014",
    "color.state-press": "#d0d0d01f",
    "color.primary": "#d0bcff",
    "color.on-primary": "#381e72",
    "color.primary-state-hover": "#d0bcff14",
    "color.on-primary-state-hover": "#381e7214",
    "color.secondary-container": "#3d3749",
    "color.on-secondary-container": "#e8def8",
    "color.error": "#f2b8b5",
    "color.focus-ring": "#d0bcff",
    "color.text-faint": "#8c8c8c",
    "color.green-container": "#0f5223",
    "color.on-green-container": "#c4eed0",
    "color.green": "#6dd58c",
    "color.blue-container": "#0842a0",
    "color.on-blue-container": "#d3e3fd",
    "color.blue": "#a8c7fa",
    "color.purple-container": "#4f378b",
    "color.on-purple-container": "#eaddff",
    "color.purple": "#d0bcff",
    "color.gray-container": "#444746",
    "color.on-gray-container": "#e3e3e3",
    "color.gray": "#c4c7c5",
    "color.sky-container": "#004a77",
    "color.on-sky-container": "#c2e7ff",
    "color.sky": "#7fcfff",
    "color.pink-container": "#8c1d4f",
    "color.on-pink-container": "#ffd8e4",
    "color.pink": "#ffb0c8",
    "color.red-container": "#8c1d18",
    "color.on-red-container": "#f9dedc",
    "color.red": "#f2b8b5",
    "color.amber-container": "#5c4300",
    "color.on-amber-container": "#ffecb3",
    "color.amber": "#ffd54f",
    "color.scheduled": "#2e7d32",
    "color.scheduled-hover": "#296e2c",
    "color.on-scheduled": "#ffffff",
    "color.due-3": "#4a3f14",
    "color.due-2": "#6b5300",
    "color.due-1": "#8a4b00",
    "color.on-due": "#fff3d6",
    "color.due-0": "#b3261e",
    "color.on-due-0": "#ffffff",
    "color.on-label": "#1f1f1f"
  }
};

// src/core/lint.ts
var LABEL_CONTRAST_MIN = 4.5;
function labelContrast(color) {
  return Math.min(
    ...["light", "dark"].map((mode) => {
      const bg = stack([parseHex(colors[mode]["color.surface-container"]), parseHex(color)]);
      return contrastRatio(parseHex(colors[mode]["color.on-label"]), bg);
    })
  );
}

// src/core/label-edit.ts
function labelNameError(name, others) {
  const n2 = name.trim();
  if (!n2) return "\u540D\u524D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  if (others.some((o3) => o3.trim() === n2)) return "\u540C\u3058\u540D\u524D\u306E label \u304C\u3042\u308A\u307E\u3059";
  return null;
}
function labelColorError(color) {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return "#rrggbb \u306E\u5F62\u3067\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  const ratio = labelContrast(color);
  if (ratio < LABEL_CONTRAST_MIN) return `\u6587\u5B57\u3068\u306E\u6BD4\u304C ${formatRatio(ratio)} \u3067\u3001${LABEL_CONTRAST_MIN} \u306B\u5C4A\u304D\u307E\u305B\u3093`;
  return null;
}
function labelUsage(index) {
  const usage = /* @__PURE__ */ new Map();
  for (const item of [...index.issues.values(), ...index.routines.values()]) {
    for (const l3 of item.labels) usage.set(l3, (usage.get(l3) ?? 0) + 1);
  }
  return usage;
}
function renameLabelField(raw, renames) {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : null;
  if (list === null) return void 0;
  let changed = false;
  const next = [];
  for (const v3 of list) {
    const to = typeof v3 === "string" ? renames.get(v3.trim()) : void 0;
    if (to !== void 0) changed = true;
    const value = to ?? v3;
    if (typeof value === "string" && next.some((x2) => typeof x2 === "string" && x2.trim() === value.trim())) {
      changed = true;
      continue;
    }
    next.push(value);
  }
  if (!changed) return void 0;
  return typeof raw === "string" && next.length === 1 ? next[0] : next;
}
function planLabelSave(original, drafts, usage) {
  const labels = [];
  const renames = /* @__PURE__ */ new Map();
  for (const d3 of drafts) {
    const name = d3.name.trim();
    const error = labelNameError(name, drafts.filter((x2) => x2.key !== d3.key).map((x2) => x2.name)) ?? labelColorError(d3.color);
    if (error) throw new Error(`label\u300C${name}\u300D: ${error}`);
    labels.push({ name, color: d3.color });
    if (d3.from !== null && d3.from !== name) renames.set(d3.from, name);
  }
  const kept = new Set(drafts.map((d3) => d3.from));
  const removed = original.map((l3) => l3.name).filter((n2) => !kept.has(n2));
  assertUnused(removed, usage);
  return { labels, renames, removed };
}
function assertUnused(removed, usage) {
  const used = removed.filter((n2) => (usage.get(n2) ?? 0) > 0);
  if (used.length > 0) throw new Error(`\u4F7F\u308F\u308C\u3066\u3044\u308B label \u306F\u524A\u9664\u3067\u304D\u307E\u305B\u3093: ${used.join(", ")}`);
}

// src/obsidian/writer.ts
var TaskWriter = class {
  constructor(app, store) {
    this.app = app;
    this.store = store;
  }
  app;
  store;
  /** この端末が最後に書いたボードの操作の時刻（索引に載る前の次の操作のため） */
  lastBoardAt = 0;
  file(path) {
    const file = this.app.vault.getFileByPath(path);
    if (!file) throw new Error(`\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u305B\u3093: ${path}`);
    return file;
  }
  /** 親フォルダを（途中の階層も）作る */
  async ensureFolder(path) {
    const parts = path.split("/").slice(0, -1);
    for (let i3 = 1; i3 <= parts.length; i3++) {
      const folder = parts.slice(0, i3).join("/");
      if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
    }
  }
  async getOrCreate(path, initial) {
    const existing = this.app.vault.getFileByPath(path);
    if (existing) return existing;
    await this.ensureFolder(path);
    return this.app.vault.create(path, initial);
  }
  /** 同じ欄の更新を複数の issue に（DailyTaskView などの一括操作） */
  async updateMany(paths, fields) {
    for (const path of paths) await this.update(path, typeof fields === "function" ? fields(path) : fields);
  }
  /** frontmatter の欄をまとめて更新する */
  async update(path, fields) {
    await this.app.fileManager.processFrontMatter(this.file(path), (fm) => {
      for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === void 0 || Array.isArray(value) && value.length === 0 || value === "") delete fm[key];
        else fm[key] = value;
      }
    });
    this.store.refreshSoon();
  }
  takenIds() {
    const { index } = this.store;
    const ids = [...index.issues.keys(), ...index.routines.keys(), ...index.members.keys()];
    for (const f4 of this.app.vault.getMarkdownFiles()) ids.push(f4.basename);
    return ids;
  }
  /** issue を作る。scheduled がなければ Inbox に入る（ADR-0011）。作れなかった summary は failed に入る */
  async createIssues(summaries, parent = null, scheduled = []) {
    const ids = nextIds("i", this.takenIds(), summaries.length);
    const created = [];
    const failed = [];
    const now = localDateTime();
    for (const [i3, summary] of summaries.entries()) {
      const path = (0, import_obsidian11.normalizePath)(pathForId(ids[i3]));
      try {
        await this.ensureFolder(path);
        created.push(await this.app.vault.create(path, newIssueContent(ids[i3], summary, now, parent, scheduled)));
      } catch (e3) {
        console.error("vault-task: issue \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", path, e3);
        failed.push(summary);
      }
    }
    this.store.refreshSoon();
    return { created, failed };
  }
  async createMember(name) {
    const [id] = nextIds("m", this.takenIds());
    const path = (0, import_obsidian11.normalizePath)(pathForId(id));
    await this.ensureFolder(path);
    await this.app.vault.create(path, newMemberContent(id, name, localDateTime()));
    this.store.refreshSoon();
    return id;
  }
  /** labels.json に label を足す（すでにあれば何もしない） */
  async addLabel(name, color = DEFAULT_LABEL_COLOR) {
    if (this.store.problems.some((p3) => p3.path === LABELS_PATH)) throw new Error(`${LABELS_PATH} \u3092\u76F4\u3057\u3066\u304B\u3089 label \u3092\u8FFD\u52A0\u3057\u3066\u304F\u3060\u3055\u3044`);
    const labels = [...this.store.index.data.labels];
    if (labels.some((l3) => l3.name === name)) return;
    labels.push({ name, color });
    await this.writeLabelsFile(labels);
  }
  /**
   * Labels 画面の保存（ADR-0024）。改名した label が付いた issue と routine を書き換えてから labels.json を書く。
   * 途中で失敗しても、改名の元の名前が labels.json に残るので、もう一度保存すれば残りが書き換わる
   */
  async saveLabels(plan) {
    if (this.store.problems.some((p3) => p3.path === LABELS_PATH)) throw new Error(`${LABELS_PATH} \u3092\u76F4\u3057\u3066\u304B\u3089\u4FDD\u5B58\u3057\u3066\u304F\u3060\u3055\u3044`);
    const { index } = this.store;
    assertUnused(plan.removed, labelUsage(index));
    if (plan.renames.size > 0) {
      const targets = [...index.issues.values(), ...index.routines.values()].filter((x2) => x2.labels.some((l3) => plan.renames.has(l3)));
      for (const { path } of targets) {
        await this.app.fileManager.processFrontMatter(this.file(path), (fm) => {
          const next = renameLabelField(fm.label, plan.renames);
          if (next !== void 0) fm.label = next;
        });
      }
    }
    await this.writeLabelsFile(plan.labels);
  }
  async writeLabelsFile(labels) {
    const text = serializeLabels(labels);
    const file = this.app.vault.getFileByPath(LABELS_PATH);
    if (file) await this.app.vault.modify(file, text);
    else {
      await this.ensureFolder(LABELS_PATH);
      await this.app.vault.create(LABELS_PATH, text);
    }
    this.store.refreshSoon();
  }
  /** worklog の 1 行を書き換える。next が null なら行を消す（ADR-0012） */
  async updateWorklog(entry, next) {
    await this.app.vault.process(this.file(entry.path), (text) => replaceWorklogLine(text, entry, next));
    this.store.refreshSoon();
  }
  /** 記録を始める（ADR-0004: worklog/<端末名>/YYYY-MM.jsonl に追記）。すでに記録中のものは除く */
  async startTimer(taskIds, device) {
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08worklog \u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    const running = new Set(this.store.index.running().map((l3) => l3.taskId));
    const targets = taskIds.filter((id) => !running.has(id));
    if (targets.length === 0) return;
    const now = /* @__PURE__ */ new Date();
    const from = localDateTime(now);
    const path = (0, import_obsidian11.normalizePath)(worklogPath(device, now));
    const file = await this.getOrCreate(path, "");
    await this.app.vault.process(
      file,
      (text) => targets.reduce((t3, taskId) => appendWorklogLine(t3, serializeWorklogEntry({ id: newWorklogId(), taskId, from, to: null, description: "" })), text)
    );
    this.store.refreshSoon();
  }
  /** 記録を止める（to を今にする） */
  async stopTimer(entries) {
    const now = /* @__PURE__ */ new Date();
    const to = localDateTime(now);
    const byFile = /* @__PURE__ */ new Map();
    for (const e3 of entries) byFile.set(e3.path, [...byFile.get(e3.path) ?? [], e3]);
    for (const [path, list] of byFile) {
      await this.app.vault.process(this.file(path), (text) => stopWorklogLines(text, list, to, now.getTime()));
    }
    this.store.refreshSoon();
  }
  /** worklog を手で足す。保存先は開始日の月のファイル */
  async addWorklog(taskId, device, entry, fromDate) {
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08worklog \u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    const file = await this.getOrCreate((0, import_obsidian11.normalizePath)(worklogPath(device, fromDate)), "");
    await this.app.vault.process(file, (text) => appendWorklogLine(text, serializeWorklogEntry({ id: newWorklogId(), taskId, ...entry })));
    this.store.refreshSoon();
  }
  /** その日のボードの操作を、この端末のログに追記する（ADR-0020） */
  async appendBoardOps(date, device, ops) {
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08\u30DC\u30FC\u30C9\u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    const file = await this.getOrCreate((0, import_obsidian11.normalizePath)(boardLogPath(device, date)), "");
    let latest = Math.max(this.store.index.board(date)?.latestAt ?? 0, this.lastBoardAt) || null;
    const now = Date.now();
    const lines = ops.map((op) => {
      latest = nextBoardAt(now, latest);
      return serializeBoardLogEntry({ id: newBoardLogId(), at: new Date(latest).toISOString(), date, ...op });
    });
    await this.app.vault.process(file, (text) => lines.reduce(appendWorklogLine, text));
    if (latest !== null) this.lastBoardAt = latest;
    this.store.refreshSoon();
  }
  /** 未完了を再検査して本文に要約を書き、それから close を追記する。途中で失敗しても締め直せば要約は置き換わる */
  async closeBoard(date, device) {
    const { index } = this.store;
    const board = index.board(date)?.board ?? emptyBoard();
    if (board.closed) return;
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08\u30DC\u30FC\u30C9\u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    closeBoardNote("", date, index, board);
    const note = await this.getOrCreate((0, import_obsidian11.normalizePath)(dailyNotePath(date)), newDailyContent(localDateTime()));
    await this.app.vault.process(note, (text) => closeBoardNote(text, date, index, board));
    await this.appendBoardOps(date, device, [{ op: "close", tasks: board.issues }]);
  }
  /** task board のグループの定義を保存する */
  async saveGroups(groups) {
    if (this.store.problems.some((p3) => p3.path === GROUPS_PATH)) throw new Error(`${GROUPS_PATH} \u3092\u76F4\u3057\u3066\u304B\u3089\u4FDD\u5B58\u3057\u3066\u304F\u3060\u3055\u3044`);
    const file = await this.getOrCreate(GROUPS_PATH, "[]\n");
    await this.app.vault.modify(file, serializeGroups(groups));
    this.store.refreshSoon();
  }
  /** routine を作る（ADR-0010） */
  async createRoutine(summary, repeat, extra = {}) {
    const [id] = nextIds("r", this.takenIds());
    const path = (0, import_obsidian11.normalizePath)(pathForId(id));
    await this.ensureFolder(path);
    const file = await this.app.vault.create(path, newRoutineContent(id, summary, repeat, localDateTime(), extra));
    this.store.refreshSoon();
    return file;
  }
};

// src/obsidian/issue-actions.tsx
function askDate(ctx, title, initial = null) {
  return new Promise((resolve) => {
    let done = false;
    const modal = new PreactModal(ctx.app, title, (close) => /* @__PURE__ */ u3(
      DateForm,
      {
        initial,
        allowClear: false,
        onSubmit: (v3) => {
          done = true;
          close();
          resolve(v3);
        }
      }
    ));
    const onClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      onClose();
      if (!done) resolve(null);
    };
    modal.open();
  });
}
async function patchAll(ctx, issues, patch, label) {
  try {
    await ctx.writer.updateMany(
      issues.map((i3) => i3.path),
      (path) => {
        const issue = issues.find((i3) => i3.path === path);
        return typeof patch === "function" ? patch(issue) : patch;
      }
    );
  } catch (e3) {
    ctx.report(`${label}\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F`, e3);
  }
}
var closeIssues = (ctx, issues) => patchAll(ctx, issues, closePatch(), "\u9589\u3058\u308B\u3053\u3068\u304C");
var cancelIssues = (ctx, issues) => patchAll(ctx, issues, cancelPatch(), "Cancel ");
var inboxIssues = (ctx, issues) => patchAll(ctx, issues, inboxPatch(), "Inbox \u306B\u623B\u3059\u3053\u3068\u304C");
var somedayIssues = (ctx, issues, revisit = null) => patchAll(ctx, issues, somedayPatch(revisit), "Someday \u306B\u79FB\u3059\u3053\u3068\u304C");
async function scheduleToday(ctx, issues) {
  await patchAll(ctx, issues, (i3) => schedulePatch(i3, [localToday()]), "\u4ECA\u65E5\u306E\u4E88\u5B9A\u306B\u5165\u308C\u308B\u3053\u3068\u304C");
  ctx.report(`${issues.length} \u4EF6\u3092\u4ECA\u65E5\u306E\u4E88\u5B9A\u306B\u5165\u308C\u307E\u3057\u305F`);
}
async function scheduleIssues(ctx, issues) {
  const date = await askDate(ctx, "\u5B9F\u884C\u65E5\u3092\u8DB3\u3059");
  if (date === null) return;
  await patchAll(ctx, issues, (i3) => schedulePatch(i3, [date]), "\u5B9F\u884C\u65E5\u3092\u8DB3\u3059\u3053\u3068\u304C");
}
async function rescheduleIssues(ctx, issues, target, from = null) {
  const title = target === "scheduled" ? "\u5B9F\u884C\u65E5\u3092\u79FB\u3059" : `${target} \u3092\u30EA\u30B9\u30B1`;
  const date = await askDate(ctx, title, target === "scheduled" ? null : localToday());
  if (date === null) return;
  await patchAll(ctx, issues, (i3) => reschedulePatch(i3, target, date, from), "\u30EA\u30B9\u30B1");
}

// src/obsidian/board-actions.ts
function guard(ctx, label, p3) {
  return p3.then(
    () => void 0,
    (e3) => ctx.report(label, e3)
  );
}
var addToBoard = (ctx, date, ids) => guard(
  ctx,
  "\u30DC\u30FC\u30C9\u306B\u8F09\u305B\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F",
  ctx.writer.appendBoardOps(date, ctx.settings.deviceName, ids.map((task) => ({ op: "add", task })))
);
async function createOnBoard(ctx, date, summary) {
  try {
    const { created } = await ctx.writer.createIssues([summary], null, [date]);
    const file = created[0];
    if (!file) throw new Error(`\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${summary}`);
    await addToBoard(ctx, date, [file.basename]);
  } catch (e3) {
    ctx.report("issue \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
var removeFromBoard = (ctx, date, id) => guard(ctx, "\u30DC\u30FC\u30C9\u304B\u3089\u5916\u305B\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "remove", task: id }]));
var setPlacement = (ctx, date, id, group) => guard(
  ctx,
  "\u30B0\u30EB\u30FC\u30D7\u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F",
  ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "place", task: id, group: group === UNGROUPED ? null : group }])
);
var setRoutineResult = (ctx, date, id, result) => guard(ctx, "routine \u3092\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "routine", task: id, result }]));
async function carryIssues(ctx, date, issues, kind, fixedTo = null) {
  let to = fixedTo;
  if (kind === "reschedule" && to === null) {
    to = await askDate(ctx, "\u5B9F\u884C\u65E5\u3092\u79FB\u3059");
    if (to === null) return;
  }
  try {
    for (const issue of issues) {
      await ctx.writer.update(issue.path, kind === "inbox" ? inboxPatch() : reschedulePatch(issue, "scheduled", to, date));
    }
    await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, issues.map((i3) => ({ op: "carry", task: i3.id })));
  } catch (e3) {
    ctx.report("\u7247\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
async function closeBoard(ctx, date) {
  try {
    await ctx.writer.closeBoard(date, ctx.settings.deviceName);
  } catch (e3) {
    ctx.report("\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
var reopenBoard = (ctx, date) => guard(ctx, "\u30DC\u30FC\u30C9\u3092\u958B\u304D\u76F4\u305B\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "reopen" }]));
function startTimer(ctx, ids) {
  return guard(ctx, "\u8A18\u9332\u3092\u59CB\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.startTimer(ids, ctx.settings.deviceName));
}
function stopTimer(ctx, ids) {
  const running = ctx.store.index.running().filter((l3) => ids.includes(l3.taskId));
  if (running.length === 0) return Promise.resolve();
  return guard(ctx, "\u8A18\u9332\u3092\u6B62\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.stopTimer(running));
}

// src/ui/IssueTable.tsx
var import_obsidian12 = require("obsidian");
function IssueTable(props) {
  const { ctx, issues, selected, onSelect } = props;
  const columns = props.columns ?? ["status-detail", "mid_due", "deadline"];
  const today = localToday();
  const toggle2 = (id) => {
    if (!selected || !onSelect) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect(next);
  };
  const all = selected !== void 0 && issues.length > 0 && issues.every((i3) => selected.has(i3.id));
  if (issues.length === 0) return /* @__PURE__ */ u3("div", { class: "vt-empty", children: props.empty ?? "\u3042\u308A\u307E\u305B\u3093" });
  const due = (issue, value) => value ? /* @__PURE__ */ u3("span", { class: `vt-due-chip vt-due-${dueLevel(issue, value, today)}`, children: formatShortDate(value) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
  const editable = (issue, c3, open, content) => /* @__PURE__ */ u3("button", { class: "vt-cell-edit", "aria-label": `${issue.id} \u306E ${c3} \u3092\u7DE8\u96C6`, title: `${c3} \u3092\u7DE8\u96C6`, onClick: open, children: content });
  const text = (value) => value ? /* @__PURE__ */ u3("span", { class: "vt-cell-detail", children: value }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
  const cell = (issue, c3) => {
    const save = saveIssue(ctx, issue);
    switch (c3) {
      case "status-detail":
        return editable(issue, c3, () => editStatusDetail(ctx, issue.statusDetail, save), text(issue.statusDetail));
      case "mid_due":
        return editable(issue, c3, () => editDue(ctx, issue, "mid_due"), due(issue, issue.midDue));
      case "deadline":
        return editable(issue, c3, () => editDue(ctx, issue, "deadline"), due(issue, issue.deadline));
      case "labels":
        return editable(issue, c3, () => editLabels(ctx, issue.labels, save), text(issue.labels.join(", ")));
      case "estimated":
        return editable(issue, c3, (e3) => estimateMenu(ctx, e3, issue.estimated, save), issue.estimated === null ? /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" }) : /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(issue.estimated) }));
      case "next": {
        const next = issue.scheduled.find((d3) => d3 >= today);
        return editable(issue, c3, () => editScheduled(ctx, issue), next ? /* @__PURE__ */ u3("span", { class: "vt-num", children: formatShortDate(next) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" }));
      }
      case "revisit":
        return issue.revisit ? /* @__PURE__ */ u3("span", { class: "vt-num", children: formatShortDate(issue.revisit) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
      case "reviewed":
        return issue.reviewed ? /* @__PURE__ */ u3("span", { class: "vt-num", children: formatShortDate(issue.reviewed) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u672A" });
      case "created":
        return issue.created ? /* @__PURE__ */ u3("span", { class: "vt-num", children: issue.created.slice(0, 10) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
    }
  };
  return /* @__PURE__ */ u3("div", { class: "vt-table", role: "table", style: { "--vt-cols": String(columns.length) }, children: [
    /* @__PURE__ */ u3("div", { class: "vt-tr vt-thead", role: "row", children: [
      onSelect && /* @__PURE__ */ u3("input", { type: "checkbox", "aria-label": "\u3059\u3079\u3066\u9078\u629E", checked: all, onChange: () => onSelect(all ? /* @__PURE__ */ new Set() : new Set(issues.map((i3) => i3.id))) }),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-main", children: "issue" }),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-priority", children: "priority" }),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-status", children: "status" }),
      columns.map((c3) => /* @__PURE__ */ u3("span", { class: `vt-th vt-col-${c3}`, children: c3 })),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-menu" })
    ] }),
    issues.map((issue) => /* @__PURE__ */ u3("div", { class: `vt-tr${selected?.has(issue.id) ? " is-selected" : ""}`, role: "row", children: [
      onSelect && /* @__PURE__ */ u3("input", { type: "checkbox", checked: selected?.has(issue.id) ?? false, onChange: () => toggle2(issue.id), "aria-label": `${issue.id} \u3092\u9078\u629E` }),
      /* @__PURE__ */ u3("span", { class: "vt-col-main", ...linkProps((e3) => void ctx.openPath(issue.path, import_obsidian12.Keymap.isModEvent(e3) !== false)), children: [
        props.lead?.(issue),
        /* @__PURE__ */ u3(IdBadge, { issue }),
        /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: issue.summary, children: issue.summary })
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-col-priority", children: /* @__PURE__ */ u3(PriorityBadge, { priority: issue.priority, onClick: (e3) => priorityMenu(e3, issue.priority, saveIssue(ctx, issue)) }) }),
      /* @__PURE__ */ u3("span", { class: "vt-col-status", children: /* @__PURE__ */ u3(StatusBadge, { status: issue.status, onClick: (e3) => statusMenu(ctx, e3, issue) }) }),
      columns.map((c3) => /* @__PURE__ */ u3("span", { class: `vt-col-${c3}`, children: cell(issue, c3) })),
      /* @__PURE__ */ u3("span", { class: "vt-col-menu", children: /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": `${issue.id} \u3092\u7DE8\u96C6`, title: "\u7DE8\u96C6", onClick: (e3) => issueRowMenu(ctx, e3, issue), children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) }) })
    ] }, issue.id))
  ] });
}
function ActionBar(props) {
  return /* @__PURE__ */ u3("div", { class: `vt-actionbar${props.count > 0 ? " is-active" : ""}`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-actionbar-count", children: props.count > 0 ? `${props.count} \u4EF6\u3092\u9078\u629E\u4E2D` : "\u884C\u3092\u9078\u3076\u3068\u64CD\u4F5C\u3067\u304D\u307E\u3059" }),
    /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
    props.actions.map((a3) => /* @__PURE__ */ u3("button", { class: `vt-button${a3.tone ? ` is-${a3.tone}` : ""}`, disabled: props.count === 0, onClick: a3.run, children: a3.label }))
  ] });
}

// src/views/Board.tsx
var import_obsidian13 = require("obsidian");
var itemId = (it) => it.kind === "issue" ? it.issue.id : it.routine.id;
var QUICK_STATUSES = ["open", "in-progress", "waiting", "closed", "canceled"];
function routineStatus(board, r3) {
  return board.routines[r3.id] ?? "open";
}
function TaskCard(props) {
  const { ctx, date, board, item, now } = props;
  const id = itemId(item);
  const running = ctx.store.index.running(id);
  const elapsed = running.reduce((m3, l3) => Math.max(m3, now - l3.fromMs), 0);
  const issue = item.kind === "issue" ? item.issue : null;
  const status = issue ? issue.status : routineStatus(board, item.routine);
  const summary = issue ? issue.summary : item.routine.summary;
  const path = issue ? issue.path : item.routine.path;
  const done = status === "closed" || status === "canceled";
  const statusMenu2 = (e3) => {
    const m3 = new import_obsidian13.Menu();
    for (const s3 of QUICK_STATUSES) {
      if (!issue && s3 !== "open" && s3 !== "closed" && s3 !== "canceled") continue;
      m3.addItem(
        (mi) => mi.setTitle(s3).setChecked(s3 === status).onClick(() => {
          if (!issue) return void setRoutineResult(ctx, date, id, s3 === "open" ? null : s3);
          const patch = s3 === "closed" ? closePatch() : s3 === "canceled" ? cancelPatch() : { status: s3 };
          void ctx.writer.update(issue.path, patch).catch((err) => ctx.report("status \u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", err));
        })
      );
    }
    m3.showAtMouseEvent(e3);
  };
  const moreMenu = (e3) => {
    const m3 = new import_obsidian13.Menu();
    for (const key of [UNGROUPED, ...props.keys]) {
      m3.addItem(
        (mi) => mi.setTitle(key === UNGROUPED ? "\u2192 \u672A\u5206\u985E" : `\u2192 ${key}`).setChecked((board.groups[id] ?? "") === key).onClick(() => void setPlacement(ctx, date, id, key))
      );
    }
    m3.addSeparator();
    m3.addItem((mi) => mi.setTitle("\u958B\u304F").setIcon("file-text").onClick(() => void ctx.openPath(path)));
    if (issue) m3.addItem((mi) => mi.setTitle("\u30DC\u30FC\u30C9\u304B\u3089\u5916\u3059").setIcon("x").onClick(() => void removeFromBoard(ctx, date, id)));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3(
    "div",
    {
      class: `vt-task${done ? " is-done" : ""}${running.length > 0 ? " is-running" : ""}`,
      draggable: true,
      onDragStart: (e3) => e3.dataTransfer?.setData("text/plain", id),
      children: [
        /* @__PURE__ */ u3("div", { class: "vt-task-top", children: [
          /* @__PURE__ */ u3("span", { class: "vt-task-summary", title: `${id} ${summary}`, ...linkProps((e3) => void ctx.openPath(path, import_obsidian13.Keymap.isModEvent(e3) !== false)), children: summary }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: `vt-play${running.length > 0 ? " is-running" : ""}`,
              "aria-label": running.length > 0 ? "\u8A18\u9332\u3092\u6B62\u3081\u308B" : "\u8A18\u9332\u3092\u59CB\u3081\u308B",
              title: running.length > 0 ? "\u8A18\u9332\u3092\u6B62\u3081\u308B" : "\u8A18\u9332\u3092\u59CB\u3081\u308B",
              onClick: () => void (running.length > 0 ? stopTimer(ctx, [id]) : startTimer(ctx, [id])),
              children: [
                /* @__PURE__ */ u3(Icon, { name: running.length > 0 ? "square" : "play" }),
                running.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(elapsed / 6e4) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-task-bottom", children: [
          issue ? /* @__PURE__ */ u3(PriorityBadge, { priority: issue.priority }) : /* @__PURE__ */ u3("span", { class: "vt-badge vt-priority", children: "routine" }),
          /* @__PURE__ */ u3(StatusBadge, { status, onClick: statusMenu2 }),
          /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
          /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u30E1\u30CB\u30E5\u30FC", title: "\u30B0\u30EB\u30FC\u30D7\u306E\u79FB\u52D5\u306A\u3069", onClick: moreMenu, children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
        ] })
      ]
    }
  );
}
function GroupBox(props) {
  const { ctx, date, groupKey } = props;
  const [over2, setOver] = d2(false);
  const all = props.items.filter((it) => groupKey === UNGROUPED ? props.placement(it) === UNGROUPED : inGroup(props.placement(it), groupKey));
  const own = props.items.filter((it) => props.placement(it) === groupKey);
  const ids = all.filter((it) => it.kind === "issue" ? isActive(it.issue) : routineStatus(props.board, it.routine) === "open").map(itemId);
  const runningIds = ctx.store.index.running().map((l3) => l3.taskId).filter((id) => all.some((it) => itemId(it) === id));
  return /* @__PURE__ */ u3(
    "section",
    {
      class: `vt-group${props.sub ? " is-sub" : ""}${props.ungrouped ? " is-ungrouped" : ""}${over2 ? " is-over" : ""}`,
      onDragOver: (e3) => {
        e3.preventDefault();
        e3.stopPropagation();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e3) => {
        e3.preventDefault();
        e3.stopPropagation();
        setOver(false);
        const id = e3.dataTransfer?.getData("text/plain");
        if (id) void setPlacement(ctx, date, id, groupKey);
      },
      children: [
        /* @__PURE__ */ u3("header", { class: "vt-group-head", children: [
          /* @__PURE__ */ u3("span", { class: "vt-group-name", children: props.name }),
          /* @__PURE__ */ u3("span", { class: "vt-count", children: all.length }),
          /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
          runningIds.length > 0 ? /* @__PURE__ */ u3("button", { class: "vt-play is-running", title: "\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u306E\u8A18\u9332\u3092\u3059\u3079\u3066\u6B62\u3081\u308B", onClick: () => void stopTimer(ctx, runningIds), children: /* @__PURE__ */ u3(Icon, { name: "square" }) }) : /* @__PURE__ */ u3("button", { class: "vt-play", title: "\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u3092\u307E\u3068\u3081\u3066\u8A18\u9332\u3059\u308B", disabled: ids.length === 0, onClick: () => void startTimer(ctx, ids), children: /* @__PURE__ */ u3(Icon, { name: "play" }) })
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-group-cards", children: [
          own.map((it) => /* @__PURE__ */ u3(TaskCard, { ctx, date, board: props.board, item: it, keys: props.keys, now: props.now }, itemId(it))),
          own.length === 0 && !props.children && /* @__PURE__ */ u3("div", { class: "vt-drop-hint", children: "\u3053\u3053\u306B\u30AB\u30FC\u30C9\u3092\u79FB\u305B\u307E\u3059" })
        ] }),
        props.children && /* @__PURE__ */ u3("div", { class: "vt-subgroups", children: props.children })
      ]
    }
  );
}
function Board(props) {
  const { ctx, index, date, board } = props;
  const now = useNow(3e4);
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const groups = index.data.groups;
  const keys = groupKeys(groups);
  const { issues, routines } = boardItems(index, date, board);
  const items = [...issues.map((issue) => ({ kind: "issue", issue })), ...routines.map((routine) => ({ kind: "routine", routine }))];
  const placement = (it) => placementOf(board, itemId(it), it.kind === "routine" ? it.routine.group : null, keys);
  const left = unfinished(index, date, board);
  const leftIssues = left.issues;
  const sel = leftIssues.filter((i3) => selected.has(i3.id));
  const addIssue = () => {
    const candidates = [...index.issues.values()].filter((i3) => isActive(i3) && !board.issues.includes(i3.id));
    new BoardIssueModal(ctx.app, candidates, (choice) => void (choice.kind === "issue" ? addToBoard(ctx, date, [choice.issue.id]) : createOnBoard(ctx, date, choice.summary))).open();
  };
  const ungrouped = items.filter((it) => placement(it) === UNGROUPED);
  return /* @__PURE__ */ u3("div", { class: "vt-board", children: [
    /* @__PURE__ */ u3("div", { class: "vt-board-head", children: [
      /* @__PURE__ */ u3("h3", { class: "vt-h", children: [
        "Task board \xB7 ",
        formatShortDate(date)
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button", onClick: addIssue, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " issue \u3092\u8F09\u305B\u308B"
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void ctx.openView("vault-task-groups"), children: [
        /* @__PURE__ */ u3(Icon, { name: "layout-grid" }),
        " \u30B0\u30EB\u30FC\u30D7\u3092\u7DE8\u96C6"
      ] })
    ] }),
    items.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "\u30DC\u30FC\u30C9\u306F\u7A7A\u3067\u3059\u3002\u300C\u4ECA\u65E5\u306E\u4E88\u5B9A\u300D\u304B\u3089\u8F09\u305B\u308B\u304B\u3001\u4E0A\u306E\u30DC\u30BF\u30F3\u3067\u8FFD\u52A0\u3057\u307E\u3059" }),
    ungrouped.length > 0 && /* @__PURE__ */ u3(GroupBox, { ctx, date, board, name: "\u672A\u5206\u985E", groupKey: UNGROUPED, items, placement, keys, now, ungrouped: true }),
    /* @__PURE__ */ u3("div", { class: "vt-board-columns", children: groups.map((g2) => /* @__PURE__ */ u3(GroupBox, { ctx, date, board, name: g2.name, groupKey: g2.name, items, placement, keys, now, children: g2.children.length > 0 && g2.children.map((c3) => /* @__PURE__ */ u3(
      GroupBox,
      {
        ctx,
        date,
        board,
        name: c3.name,
        groupKey: `${g2.name}/${c3.name}`,
        items,
        placement,
        keys,
        now,
        sub: true
      }
    )) })) }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-unfinished", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "\u672A\u5B8C\u4E86" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: leftIssues.length + left.routines.length }),
        /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
        board.closed ? /* @__PURE__ */ u3(S, { children: [
          /* @__PURE__ */ u3("span", { class: "vt-done-label", children: [
            /* @__PURE__ */ u3(Icon, { name: "check-circle-2" }),
            " \u7DE0\u3081\u307E\u3057\u305F"
          ] }),
          /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void reopenBoard(ctx, date), children: "\u958B\u304D\u76F4\u3059" })
        ] }) : /* @__PURE__ */ u3(
          "button",
          {
            class: "vt-button is-primary",
            disabled: leftIssues.length + left.routines.length > 0 || items.length === 0,
            title: "\u672A\u5B8C\u4E86\u304C 0 \u306B\u306A\u308B\u3068\u7DE0\u3081\u3089\u308C\u307E\u3059",
            onClick: () => void closeBoard(ctx, date),
            children: [
              /* @__PURE__ */ u3(Icon, { name: "check" }),
              " \u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u308B"
            ]
          }
        )
      ] }),
      leftIssues.length + left.routines.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-empty", children: items.length === 0 ? "\u2014" : "\u3059\u3079\u3066\u7247\u4ED8\u304D\u307E\u3057\u305F" }) : /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3(IssueTable, { ctx, issues: leftIssues, selected, onSelect: setSelected, columns: ["status-detail", "next", "deadline", "estimated"], empty: "issue \u306F\u3059\u3079\u3066\u7247\u4ED8\u304D\u307E\u3057\u305F" }),
        leftIssues.length > 0 && /* @__PURE__ */ u3(
          ActionBar,
          {
            count: sel.length,
            actions: [
              { label: "Do Tomorrow", icon: "calendar-plus", tone: "primary", run: () => void carryIssues(ctx, date, sel, "reschedule", addDays(date, 1)).then(() => setSelected(/* @__PURE__ */ new Set())) },
              { label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(() => setSelected(/* @__PURE__ */ new Set())) },
              { label: "Reschedule", icon: "calendar", run: () => void carryIssues(ctx, date, sel, "reschedule").then(() => setSelected(/* @__PURE__ */ new Set())) },
              { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(() => setSelected(/* @__PURE__ */ new Set())) },
              { label: "Inbox", icon: "inbox", run: () => void carryIssues(ctx, date, sel, "inbox").then(() => setSelected(/* @__PURE__ */ new Set())) }
            ]
          }
        ),
        /* @__PURE__ */ u3(RoutineRows, { ctx, date, routines: left.routines })
      ] })
    ] })
  ] });
}
function RoutineRows(props) {
  if (props.routines.length === 0) return null;
  return /* @__PURE__ */ u3("div", { class: "vt-routine-rows", children: props.routines.map((r3) => /* @__PURE__ */ u3("div", { class: "vt-routine-row", children: [
    props.showDate && /* @__PURE__ */ u3("span", { class: "vt-date-chip", children: formatShortDate(props.date) }),
    /* @__PURE__ */ u3("span", { class: "vt-badge vt-id vt-routine-id", children: r3.id }),
    /* @__PURE__ */ u3("span", { class: "vt-cell-summary", children: r3.summary }),
    /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
    /* @__PURE__ */ u3("button", { class: "vt-button", onClick: () => void setRoutineResult(props.ctx, props.date, r3.id, "closed"), children: "Close" }),
    /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void setRoutineResult(props.ctx, props.date, r3.id, "canceled"), children: "Cancel" })
  ] })) });
}

// src/views/DailyView.tsx
var STEPS = [
  { key: "dead", label: "\u671F\u9650\u5207\u308C", icon: "alarm-clock-off" },
  { key: "previous", label: "\u524D\u56DE\u306E\u30DC\u30FC\u30C9", icon: "history" },
  { key: "caution", label: "\u671F\u9650\u304C\u8FD1\u3044", icon: "alert-triangle" },
  { key: "scheduled", label: "\u4ECA\u65E5\u306E\u4E88\u5B9A", icon: "calendar-check" },
  { key: "board", label: "\u30DC\u30FC\u30C9", icon: "layout-dashboard" }
];
function DueStep(props) {
  const sections = [
    { key: "deadline", title: "deadline", issues: props.lists.deadline },
    { key: "mid_due", title: "mid_due", issues: props.lists.midDue }
  ];
  return /* @__PURE__ */ u3(S, { children: sections.map((s3) => /* @__PURE__ */ u3(DueSection, { ctx: props.ctx, target: s3.key, title: s3.title, issues: s3.issues, empty: props.empty, canScheduleToday: props.canScheduleToday })) });
}
function DueSection(props) {
  const { ctx, target, issues } = props;
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  return /* @__PURE__ */ u3("section", { class: "vt-card", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: props.title }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["status-detail", "next", "mid_due", "deadline"], empty: props.empty }),
    issues.length > 0 && /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          ...props.canScheduleToday ? [{ label: "Do Today", icon: "calendar-check", tone: "primary", run: () => void scheduleToday(ctx, sel).then(done) }] : [],
          { label: "Schedule", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
          { label: "Reschedule", icon: "calendar", run: () => void rescheduleIssues(ctx, sel, target).then(done) },
          { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
          { label: "Inbox", icon: "inbox", run: () => void inboxIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}
function PreviousStep(props) {
  const { ctx } = props;
  const index = ctx.store.index;
  return /* @__PURE__ */ u3(S, { children: [
    props.boards.map((b2) => /* @__PURE__ */ u3(PreviousBoard, { ctx, board: b2, issues: unfinished(index, b2.date, b2.board).issues }, b2.date)),
    props.boards.map((b2) => /* @__PURE__ */ u3(RoutineRows, { ctx, date: b2.date, routines: unfinished(index, b2.date, b2.board).routines, showDate: true }))
  ] });
}
function PreviousBoard(props) {
  const { ctx, board, issues } = props;
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  if (issues.length === 0) return null;
  return /* @__PURE__ */ u3("section", { class: "vt-card", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: [
        formatShortDate(board.date),
        " \u306E\u30DC\u30FC\u30C9"
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["status-detail", "next", "deadline", "estimated"] }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Do Today", icon: "calendar-check", tone: "primary", run: () => void carryIssues(ctx, board.date, sel, "reschedule", localToday()).then(done) },
          { label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(done) },
          { label: "Reschedule", icon: "calendar", run: () => void carryIssues(ctx, board.date, sel, "reschedule").then(done) },
          { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
          { label: "Inbox", icon: "inbox", run: () => void carryIssues(ctx, board.date, sel, "inbox").then(done) }
        ]
      }
    )
  ] });
}
function ScheduledStep(props) {
  const { ctx, issues, today } = props;
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  return /* @__PURE__ */ u3("section", { class: "vt-card", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "\u4ECA\u65E5\u304C\u5B9F\u884C\u65E5" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-text", disabled: issues.length === 0, onClick: () => void addToBoard(ctx, today, issues.map((i3) => i3.id)), children: "\u3059\u3079\u3066\u30DC\u30FC\u30C9\u3078" })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["status-detail", "mid_due", "deadline", "estimated"] }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Move to Task Board", icon: "layout-dashboard", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i3) => i3.id)).then(done) },
          { label: "Reschedule", icon: "calendar", run: () => void rescheduleIssues(ctx, sel, "scheduled", today).then(done) },
          { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
          { label: "Inbox", icon: "inbox", run: () => void inboxIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}
function DailyView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const now = useNow(6e4);
  const today = localToday(new Date(now));
  const index = ctx.store.index;
  const issues = [...index.issues.values()];
  const dead = deadIssues(issues, today);
  const pending = pendingBoards(index, index.data.boards, today);
  const caution = cautionIssues(issues, today);
  const todayBoard = index.board(today)?.board ?? emptyBoard();
  const scheduled = scheduledOn(issues, today, new Set(todayBoard.issues));
  const todayLeft = unfinished(index, today, todayBoard);
  const counts = {
    dead: dead.deadline.length + dead.midDue.length,
    previous: pending.reduce((n2, b2) => {
      const u4 = unfinished(index, b2.date, b2.board);
      return n2 + u4.issues.length + u4.routines.length;
    }, 0),
    caution: caution.deadline.length + caution.midDue.length,
    scheduled: scheduled.length,
    board: todayLeft.issues.length + todayLeft.routines.length
  };
  const [passed, setPassed] = d2(/* @__PURE__ */ new Set());
  const [manual, setManual] = d2(null);
  const auto = ["dead", "previous", "caution", "scheduled"].find((s3) => counts[s3] > 0 && !passed.has(s3)) ?? "board";
  const step = manual ?? auto;
  h2(() => {
    if (manual !== null && manual !== "caution" && manual !== "board" && counts[manual] === 0) setManual(null);
  });
  const closing = A2(/* @__PURE__ */ new Set());
  h2(() => {
    for (const b2 of index.data.boards) {
      if (b2.date >= today || b2.board.closed || closing.current.has(b2.date)) continue;
      const u4 = unfinished(index, b2.date, b2.board);
      if (u4.issues.length + u4.routines.length > 0) continue;
      closing.current.add(b2.date);
      void ctx.writer.closeBoard(b2.date, ctx.settings.deviceName).catch((e3) => ctx.report("\u524D\u56DE\u306E\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3)).finally(() => closing.current.delete(b2.date));
    }
  });
  const next = () => {
    setPassed(/* @__PURE__ */ new Set([...passed, step]));
    setManual(null);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: [
      "Daily \xB7 ",
      formatShortDate(today)
    ] }) }),
    /* @__PURE__ */ u3("nav", { class: "vt-stepper", children: STEPS.map((s3, i3) => {
      const state = s3.key === step ? "is-current" : counts[s3.key] === 0 || passed.has(s3.key) ? "is-done" : "";
      return /* @__PURE__ */ u3("button", { class: `vt-step ${state}`, onClick: () => setManual(s3.key), children: [
        /* @__PURE__ */ u3("span", { class: "vt-step-icon", children: state === "is-done" && s3.key !== step ? /* @__PURE__ */ u3(Icon, { name: "check" }) : i3 + 1 }),
        /* @__PURE__ */ u3("span", { class: "vt-step-label", children: s3.label }),
        counts[s3.key] > 0 && /* @__PURE__ */ u3("span", { class: "vt-step-count", children: counts[s3.key] })
      ] });
    }) }),
    step === "dead" && /* @__PURE__ */ u3(DueStep, { ctx, lists: dead, empty: "\u671F\u9650\u5207\u308C\u306F\u3042\u308A\u307E\u305B\u3093" }),
    step === "previous" && (pending.length > 0 ? /* @__PURE__ */ u3(PreviousStep, { ctx, boards: pending }) : /* @__PURE__ */ u3("div", { class: "vt-empty", children: "\u7247\u4ED8\u3044\u3066\u3044\u306A\u3044\u30DC\u30FC\u30C9\u306F\u3042\u308A\u307E\u305B\u3093" })),
    step === "caution" && /* @__PURE__ */ u3(DueStep, { ctx, lists: caution, empty: "3 \u65E5\u4EE5\u5185\u306E\u671F\u9650\u306F\u3042\u308A\u307E\u305B\u3093", canScheduleToday: true }),
    step === "scheduled" && /* @__PURE__ */ u3(ScheduledStep, { ctx, issues: scheduled, today }),
    step === "board" && /* @__PURE__ */ u3(Board, { ctx, index, date: today, board: todayBoard }),
    step !== "board" && /* @__PURE__ */ u3("div", { class: "vt-page-foot", children: [
      step === "dead" || step === "previous" ? /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: next, children: "\u3042\u3068\u3067\uFF08\u30B9\u30AD\u30C3\u30D7\uFF09" }) : /* @__PURE__ */ u3("span", {}),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", onClick: next, children: [
        "\u6B21\u3078 ",
        /* @__PURE__ */ u3(Icon, { name: "arrow-right" })
      ] })
    ] })
  ] });
}

// src/ui/EditRow.tsx
function move(list, i3, d3) {
  const j3 = i3 + d3;
  if (j3 < 0 || j3 >= list.length) return list;
  const next = [...list];
  [next[i3], next[j3]] = [next[j3], next[i3]];
  return next;
}
function NameField(props) {
  const ref = A2(null);
  h2(() => {
    if (props.autoFocus) ref.current?.focus();
  }, []);
  return /* @__PURE__ */ u3("label", { class: `vt-name-field${props.error ? " is-error" : ""}${props.class ? ` ${props.class}` : ""}`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-name-label", children: props.label }),
    /* @__PURE__ */ u3("input", { ref, type: "text", value: props.value, placeholder: props.placeholder ?? "\u540D\u524D", onInput: (e3) => props.onInput(e3.currentTarget.value) }),
    props.error && /* @__PURE__ */ u3("span", { class: "vt-name-error", children: props.error })
  ] });
}
function RowTools(props) {
  const deleteTitle = props.deleteDisabled ?? `${props.what}\u3092\u524A\u9664`;
  return /* @__PURE__ */ u3("span", { class: "vt-row-tools", children: [
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: "\u4E0A\u3078", "aria-label": "\u4E0A\u3078", disabled: props.index === 0, onClick: () => props.onMove(-1), children: /* @__PURE__ */ u3(Icon, { name: "arrow-up" }) }),
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: "\u4E0B\u3078", "aria-label": "\u4E0B\u3078", disabled: props.index === props.count - 1, onClick: () => props.onMove(1), children: /* @__PURE__ */ u3(Icon, { name: "arrow-down" }) }),
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: deleteTitle, "aria-label": deleteTitle, disabled: props.deleteDisabled !== void 0, onClick: props.onDelete, children: /* @__PURE__ */ u3(Icon, { name: "trash-2" }) })
  ] });
}

// src/views/GroupManagerView.tsx
var nextKey = 1;
var toDraft = (g2) => ({ key: nextKey++, name: g2.name, children: g2.children.map(toDraft) });
var toDef = (d3) => ({ name: d3.name.trim(), children: d3.children.map(toDef) });
function errorOf(d3, siblings) {
  return groupNameError(
    d3.name,
    siblings.filter((s3) => s3.key !== d3.key).map(toDef)
  );
}
function GroupManagerView(props) {
  const { ctx } = props;
  const version = useStoreVersion(ctx.store);
  const [drafts, setDrafts] = d2(() => ctx.store.index.data.groups.map(toDraft));
  const [dirty, setDirty] = d2(false);
  const [focusKey, setFocusKey] = d2(null);
  h2(() => {
    if (!dirty) setDrafts(ctx.store.index.data.groups.map(toDraft));
  }, [version]);
  const update = (next) => {
    setDrafts(next);
    setDirty(true);
  };
  const setGroup = (key, fn) => update(drafts.map((d3) => d3.key === key ? fn(d3) : d3));
  const addGroup = () => {
    const d3 = { key: nextKey++, name: "", children: [] };
    setFocusKey(d3.key);
    update([...drafts, d3]);
  };
  const addSub = (parent) => {
    const c3 = { key: nextKey++, name: "", children: [] };
    setFocusKey(c3.key);
    setGroup(parent, (g2) => ({ ...g2, children: [...g2.children, c3] }));
  };
  const hasError = drafts.some((g2) => errorOf(g2, drafts) !== null || g2.children.some((c3) => errorOf(c3, g2.children) !== null));
  const save = () => void ctx.writer.saveGroups(drafts.map(toDef)).then(
    () => setDirty(false),
    (e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)
  );
  return /* @__PURE__ */ u3("div", { class: "vt-page vt-group-manager", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Board groups" }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      dirty ? /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => {
        setDrafts(ctx.store.index.data.groups.map(toDraft));
        setDirty(false);
      }, children: "\u5143\u306B\u623B\u3059" }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u4FDD\u5B58\u6E08\u307F" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: !dirty || hasError, onClick: save, children: [
        /* @__PURE__ */ u3(Icon, { name: "save" }),
        " \u4FDD\u5B58"
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-layout-preview", "aria-label": "\u30DC\u30FC\u30C9\u3067\u306E\u4E26\u3073\u65B9", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "\u30DC\u30FC\u30C9\u3067\u306E\u4E26\u3073\u65B9" }),
      /* @__PURE__ */ u3("div", { class: "vt-preview-columns", children: [
        /* @__PURE__ */ u3("div", { class: "vt-preview-col is-ungrouped", children: /* @__PURE__ */ u3("span", { children: "\u672A\u5206\u985E" }) }),
        drafts.map((g2) => /* @__PURE__ */ u3("div", { class: "vt-preview-col", children: [
          /* @__PURE__ */ u3("span", { children: g2.name || "\uFF08\u540D\u524D\u306A\u3057\uFF09" }),
          g2.children.map((c3) => /* @__PURE__ */ u3("span", { class: "vt-preview-sub", children: c3.name || "\uFF08\u540D\u524D\u306A\u3057\uFF09" }))
        ] }))
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u30B0\u30EB\u30FC\u30D7\u306F\u30DC\u30FC\u30C9\u306B\u6A2A\u306B\u4E26\u3073\u307E\u3059\uFF08\u72ED\u3044\u753B\u9762\u3067\u306F\u7E26\uFF09\u3002\u30B5\u30D6\u30B0\u30EB\u30FC\u30D7\u306F\u30B0\u30EB\u30FC\u30D7\u306E\u4E2D\u306B\u7E26\u306B\u4E26\u3073\u307E\u3059\u3002" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-group-editor", children: [
      drafts.map((g2, i3) => /* @__PURE__ */ u3("section", { class: "vt-card vt-group-edit", children: [
        /* @__PURE__ */ u3("div", { class: "vt-group-edit-head", children: [
          /* @__PURE__ */ u3(
            NameField,
            {
              label: "\u30B0\u30EB\u30FC\u30D7\u540D",
              value: g2.name,
              error: errorOf(g2, drafts),
              autoFocus: focusKey === g2.key,
              onInput: (v3) => setGroup(g2.key, (x2) => ({ ...x2, name: v3 }))
            }
          ),
          /* @__PURE__ */ u3(RowTools, { what: "\u30B0\u30EB\u30FC\u30D7", index: i3, count: drafts.length, onMove: (d3) => update(move(drafts, i3, d3)), onDelete: () => update(drafts.filter((x2) => x2.key !== g2.key)) })
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-sub-list", children: [
          g2.children.map((c3, j3) => /* @__PURE__ */ u3("div", { class: "vt-sub-edit", children: [
            /* @__PURE__ */ u3(Icon, { name: "corner-down-right", class: "vt-sub-mark" }),
            /* @__PURE__ */ u3(
              NameField,
              {
                label: "\u30B5\u30D6\u30B0\u30EB\u30FC\u30D7\u540D",
                value: c3.name,
                error: errorOf(c3, g2.children),
                autoFocus: focusKey === c3.key,
                onInput: (v3) => setGroup(g2.key, (x2) => ({ ...x2, children: x2.children.map((y3) => y3.key === c3.key ? { ...y3, name: v3 } : y3) }))
              }
            ),
            /* @__PURE__ */ u3(
              RowTools,
              {
                what: "\u30B5\u30D6\u30B0\u30EB\u30FC\u30D7",
                index: j3,
                count: g2.children.length,
                onMove: (d3) => setGroup(g2.key, (x2) => ({ ...x2, children: move(x2.children, j3, d3) })),
                onDelete: () => setGroup(g2.key, (x2) => ({ ...x2, children: x2.children.filter((y3) => y3.key !== c3.key) }))
              }
            )
          ] }, c3.key)),
          /* @__PURE__ */ u3("button", { class: "vt-button is-text vt-add-sub", onClick: () => addSub(g2.key), children: [
            /* @__PURE__ */ u3(Icon, { name: "plus" }),
            " \u30B5\u30D6\u30B0\u30EB\u30FC\u30D7\u3092\u8FFD\u52A0"
          ] })
        ] })
      ] }, g2.key)),
      /* @__PURE__ */ u3("button", { class: "vt-add-group", onClick: addGroup, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " \u30B0\u30EB\u30FC\u30D7\u3092\u8FFD\u52A0"
      ] })
    ] }),
    dirty && /* @__PURE__ */ u3("div", { class: "vt-banner", children: [
      "\u5909\u66F4\u306F\u307E\u3060\u4FDD\u5B58\u3057\u3066\u3044\u307E\u305B\u3093",
      hasError ? "\uFF08\u540D\u524D\u306E\u30A8\u30E9\u30FC\u3092\u76F4\u3059\u3068\u4FDD\u5B58\u3067\u304D\u307E\u3059\uFF09" : ""
    ] }),
    /* @__PURE__ */ u3("p", { class: "vt-muted", children: "\u30B0\u30EB\u30FC\u30D7\u306E\u540D\u524D\u3092\u5909\u3048\u3066\u3082\u3001\u904E\u53BB\u306E\u30DC\u30FC\u30C9\u3067\u305D\u306E\u30B0\u30EB\u30FC\u30D7\u306B\u7F6E\u3044\u305F\u30AB\u30FC\u30C9\u306F\u79FB\u308A\u307E\u305B\u3093\uFF08\u672A\u5206\u985E\u306B\u51FA\u307E\u3059\uFF09\u3002" })
  ] });
}

// src/views/InboxView.tsx
function InboxView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const [draft, setDraft] = d2("");
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const issues = [...ctx.store.index.issues.values()].filter(isInbox).sort((a3, b2) => (b2.created ?? "").localeCompare(a3.created ?? ""));
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  const create = (e3) => {
    e3.preventDefault();
    const summary = draft.trim();
    if (!summary) return;
    setDraft("");
    void ctx.writer.createIssues([summary]).catch((err) => ctx.report("issue \u3092\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", err));
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Inbox" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: issues.length === 0, onClick: () => void ctx.openView("vault-task-organize"), children: [
        /* @__PURE__ */ u3(Icon, { name: "layers" }),
        " Organize \u3067\u6574\u7406"
      ] })
    ] }),
    /* @__PURE__ */ u3("form", { class: "vt-quick-add", onSubmit: create, children: [
      /* @__PURE__ */ u3(Icon, { name: "plus" }),
      /* @__PURE__ */ u3("input", { type: "text", placeholder: "summary \u3092\u5165\u529B\u3057\u3066 Enter\uFF08Inbox \u306B\u5165\u308A\u307E\u3059\uFF09", value: draft, onInput: (e3) => setDraft(e3.currentTarget.value) }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-button is-text", onClick: () => openCaptureModal(ctx), children: "\u307E\u3068\u3081\u3066\u4F5C\u6210" })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["labels", "estimated", "created"], empty: "Inbox \u306F\u7A7A\u3067\u3059" }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Do Today", icon: "calendar-check", tone: "primary", run: () => void scheduleToday(ctx, sel).then(done) },
          { label: "Schedule", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
          { label: "Someday", icon: "cloud", run: () => void somedayIssues(ctx, sel).then(done) },
          { label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(done) },
          { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}

// src/views/LabelManagerView.tsx
var nextKey2 = 1;
var toDraft2 = (l3) => ({ key: nextKey2++, from: l3.name, name: l3.name, color: l3.color });
var HEX2 = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function pickerValue(color) {
  const m3 = HEX2.exec(color);
  if (!m3) return DEFAULT_LABEL_COLOR;
  const hex = m3[1];
  if (hex.length === 3) return `#${[...hex].map((c3) => c3 + c3).join("")}`.toLowerCase();
  return `#${hex.slice(0, 6)}`.toLowerCase();
}
function LabelManagerView(props) {
  const { ctx } = props;
  const version = useStoreVersion(ctx.store);
  const [drafts, setDrafts] = d2(() => ctx.store.index.data.labels.map(toDraft2));
  const [dirty, setDirty] = d2(false);
  const [saving, setSaving] = d2(false);
  const [focusKey, setFocusKey] = d2(null);
  h2(() => {
    if (!dirty) setDrafts(ctx.store.index.data.labels.map(toDraft2));
  }, [version]);
  const usage = labelUsage(ctx.store.index);
  const update = (next) => {
    setDrafts(next);
    setDirty(true);
  };
  const setLabel = (key, patch) => update(drafts.map((d3) => d3.key === key ? { ...d3, ...patch } : d3));
  const add = () => {
    const d3 = { key: nextKey2++, from: null, name: "", color: DEFAULT_LABEL_COLOR };
    setFocusKey(d3.key);
    update([...drafts, d3]);
  };
  const nameError = (d3) => labelNameError(d3.name, drafts.filter((x2) => x2.key !== d3.key).map((x2) => x2.name));
  const hasError = drafts.some((d3) => nameError(d3) !== null || labelColorError(d3.color) !== null);
  const renamed = drafts.filter((d3) => d3.from !== null && d3.from !== d3.name.trim()).reduce((n2, d3) => n2 + (usage.get(d3.from) ?? 0), 0);
  const save = () => {
    setSaving(true);
    void Promise.resolve().then(() => ctx.writer.saveLabels(planLabelSave(ctx.store.index.data.labels, drafts, usage))).then(
      () => setDirty(false),
      (e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)
    ).finally(() => setSaving(false));
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page vt-label-manager", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Labels" }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      dirty ? /* @__PURE__ */ u3(
        "button",
        {
          class: "vt-button is-text",
          onClick: () => {
            setDrafts(ctx.store.index.data.labels.map(toDraft2));
            setDirty(false);
          },
          children: "\u5143\u306B\u623B\u3059"
        }
      ) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u4FDD\u5B58\u6E08\u307F" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: !dirty || hasError || saving, onClick: save, children: [
        /* @__PURE__ */ u3(Icon, { name: "save" }),
        " \u4FDD\u5B58"
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-label-editor", children: [
      drafts.map((d3, i3) => {
        const used = d3.from === null ? 0 : usage.get(d3.from) ?? 0;
        const colorError = labelColorError(d3.color);
        return /* @__PURE__ */ u3("section", { class: "vt-card vt-label-edit", "aria-label": `label ${d3.name || "\uFF08\u540D\u524D\u306A\u3057\uFF09"}`, children: [
          /* @__PURE__ */ u3("div", { class: "vt-label-edit-fields", children: [
            /* @__PURE__ */ u3(
              "input",
              {
                type: "color",
                class: "vt-color-swatch",
                value: pickerValue(d3.color),
                title: "\u8272\u3092\u9078\u3076",
                "aria-label": "\u8272\u3092\u9078\u3076",
                onInput: (e3) => setLabel(d3.key, { color: e3.currentTarget.value })
              }
            ),
            /* @__PURE__ */ u3(NameField, { label: "\u540D\u524D", value: d3.name, error: nameError(d3), autoFocus: focusKey === d3.key, onInput: (v3) => setLabel(d3.key, { name: v3 }) }),
            /* @__PURE__ */ u3(
              NameField,
              {
                label: "\u8272",
                class: "vt-color-field",
                placeholder: "#rrggbb",
                value: d3.color,
                error: colorError,
                autoFocus: false,
                onInput: (v3) => setLabel(d3.key, { color: v3.trim() })
              }
            ),
            /* @__PURE__ */ u3(
              RowTools,
              {
                what: "label",
                index: i3,
                count: drafts.length,
                onMove: (n2) => update(move(drafts, i3, n2)),
                onDelete: () => update(drafts.filter((x2) => x2.key !== d3.key)),
                deleteDisabled: used > 0 ? `${used} \u4EF6\u306E issue / routine \u3067\u4F7F\u308F\u308C\u3066\u3044\u308B\u306E\u3067\u524A\u9664\u3067\u304D\u307E\u305B\u3093` : void 0
              }
            )
          ] }),
          /* @__PURE__ */ u3("div", { class: "vt-label-edit-meta", children: [
            /* @__PURE__ */ u3(LabelBadge, { name: d3.name.trim() || "\uFF08\u540D\u524D\u306A\u3057\uFF09", color: HEX2.test(d3.color) ? d3.color : DEFAULT_LABEL_COLOR }),
            /* @__PURE__ */ u3("span", { class: "vt-muted", children: used > 0 ? `${used} \u4EF6\u3067\u4F7F\u7528\u4E2D` : "\u672A\u4F7F\u7528" }),
            d3.from !== null && d3.from !== d3.name.trim() && /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
              "\uFF08\u5143\u306E\u540D\u524D: ",
              d3.from,
              "\uFF09"
            ] })
          ] })
        ] }, d3.key);
      }),
      /* @__PURE__ */ u3("button", { class: "vt-add-group", onClick: add, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " label \u3092\u8FFD\u52A0"
      ] })
    ] }),
    dirty && /* @__PURE__ */ u3("div", { class: "vt-banner", children: [
      "\u5909\u66F4\u306F\u307E\u3060\u4FDD\u5B58\u3057\u3066\u3044\u307E\u305B\u3093",
      hasError ? "\uFF08\u30A8\u30E9\u30FC\u3092\u76F4\u3059\u3068\u4FDD\u5B58\u3067\u304D\u307E\u3059\uFF09" : renamed > 0 ? `\uFF08\u4FDD\u5B58\u3059\u308B\u3068 ${renamed} \u4EF6\u306E issue / routine \u306E label \u3092\u66F8\u304D\u63DB\u3048\u307E\u3059\uFF09` : ""
    ] }),
    /* @__PURE__ */ u3("p", { class: "vt-muted", children: "\u540D\u524D\u3092\u5909\u3048\u308B\u3068\u3001\u305D\u306E label \u304C\u4ED8\u3044\u305F issue \u3068 routine \u306E label \u3082\u66F8\u304D\u63DB\u3048\u307E\u3059\u3002\u4F7F\u308F\u308C\u3066\u3044\u308B label \u306F\u3001issue / routine \u304B\u3089\u5916\u3057\u3066\u304B\u3089\u524A\u9664\u3067\u304D\u307E\u3059\u3002" })
  ] });
}

// src/views/IssueListView.tsx
var import_obsidian14 = require("obsidian");

// src/core/list.ts
function defaultQuery() {
  return { text: "", statuses: [], priorities: [], labels: [], scheduled: "any", parent: null, sort: "id", desc: true };
}
function nextScheduled(issue, today) {
  return issue.scheduled.find((d3) => d3 >= today) ?? null;
}
function sortValue(issue, key, today) {
  switch (key) {
    case "id":
      return Number(issue.id.slice(2));
    case "summary":
      return issue.summary;
    case "status":
      return STATUSES.indexOf(issue.status);
    case "priority":
      return issue.priority === null ? null : PRIORITIES.indexOf(issue.priority);
    case "mid_due":
      return issue.midDue;
    case "deadline":
      return issue.deadline;
    case "created":
      return issue.created;
    case "next_scheduled":
      return nextScheduled(issue, today);
  }
}
function queryIssues(issues, q2, today) {
  const words = q2.text.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [...issues].filter((i3) => {
    if (q2.statuses.length > 0 ? !q2.statuses.includes(i3.status) : !isActive(i3)) return false;
    if (q2.priorities.length > 0 && !q2.priorities.includes(i3.priority ?? "none")) return false;
    if (q2.labels.length > 0 && !q2.labels.every((l3) => i3.labels.includes(l3))) return false;
    if (q2.scheduled === "yes" && i3.scheduled.length === 0) return false;
    if (q2.scheduled === "no" && i3.scheduled.length > 0) return false;
    if (q2.parent !== null && i3.parent !== q2.parent) return false;
    const hay = `${i3.id} ${i3.summary}`.toLowerCase();
    return words.every((w3) => hay.includes(w3));
  });
  return out.sort((a3, b2) => {
    const va = sortValue(a3, q2.sort, today);
    const vb = sortValue(b2, q2.sort, today);
    if (va === vb) return a3.id.localeCompare(b2.id, "en", { numeric: true });
    if (va === null) return 1;
    if (vb === null) return -1;
    const c3 = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return q2.desc ? -c3 : c3;
  });
}

// src/views/IssueListView.tsx
var PAGE = 50;
var SORTS = [
  { key: "id", label: "ID" },
  { key: "summary", label: "summary" },
  { key: "status", label: "status" },
  { key: "priority", label: "priority" },
  { key: "next_scheduled", label: "\u6B21\u306E\u5B9F\u884C\u65E5" },
  { key: "mid_due", label: "mid_due" },
  { key: "deadline", label: "deadline" },
  { key: "created", label: "\u4F5C\u6210\u65E5" }
];
function toggle(list, v3) {
  return list.includes(v3) ? list.filter((x2) => x2 !== v3) : [...list, v3];
}
function FilterChip(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-filter-chip${props.on ? " is-on" : ""}`, "aria-pressed": props.on, onClick: props.onClick, children: [
    props.on && /* @__PURE__ */ u3(Icon, { name: "check" }),
    props.label
  ] });
}
function IssueListView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const [q2, setQ] = d2(defaultQuery());
  const [page, setPage] = d2(0);
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const set = (patch) => {
    setQ({ ...q2, ...patch });
    setPage(0);
  };
  const results = queryIssues(index.issues.values(), q2, localToday());
  const pages = Math.max(1, Math.ceil(results.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * PAGE, (current + 1) * PAGE);
  const sel = results.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  const labels = index.data.labels.map((l3) => l3.name);
  const presetMenu = (e3) => {
    const m3 = new import_obsidian14.Menu();
    for (const p3 of ctx.settings.presets) {
      m3.addItem((mi) => mi.setTitle(p3.name).onClick(() => set({ ...defaultQuery(), ...p3.query })));
    }
    if (ctx.settings.presets.length > 0) m3.addSeparator();
    m3.addItem(
      (mi) => mi.setTitle("\u4ECA\u306E\u6761\u4EF6\u3092\u4FDD\u5B58\u2026").setIcon("save").onClick(
        () => new PreactModal(ctx.app, "\u6761\u4EF6\u306E\u540D\u524D", (close) => /* @__PURE__ */ u3(
          TextForm,
          {
            initial: "",
            onSubmit: (name) => {
              close();
              if (!name) return;
              ctx.settings.presets = [...ctx.settings.presets.filter((p3) => p3.name !== name), { name, query: q2 }];
              void ctx.saveSettings();
            }
          }
        )).open()
      )
    );
    for (const p3 of ctx.settings.presets) {
      m3.addItem(
        (mi) => mi.setTitle(`\u300C${p3.name}\u300D\u3092\u524A\u9664`).setIcon("trash").onClick(() => {
          ctx.settings.presets = ctx.settings.presets.filter((x2) => x2 !== p3);
          void ctx.saveSettings();
        })
      );
    }
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Issues" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: results.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: presetMenu, children: [
        /* @__PURE__ */ u3(Icon, { name: "bookmark" }),
        " \u4FDD\u5B58\u3057\u305F\u6761\u4EF6"
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-filters", children: [
      /* @__PURE__ */ u3("label", { class: "vt-search", children: [
        /* @__PURE__ */ u3(Icon, { name: "search" }),
        /* @__PURE__ */ u3("input", { type: "search", placeholder: "ID\u30FBsummary \u3067\u691C\u7D22", value: q2.text, onInput: (e3) => set({ text: e3.currentTarget.value }) })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-filter-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "status" }),
        STATUSES.map((s3) => /* @__PURE__ */ u3(FilterChip, { label: s3, on: q2.statuses.includes(s3), onClick: () => set({ statuses: toggle(q2.statuses, s3) }) }))
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-filter-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "priority" }),
        [...PRIORITIES, "none"].map((p3) => /* @__PURE__ */ u3(FilterChip, { label: p3, on: q2.priorities.includes(p3), onClick: () => set({ priorities: toggle(q2.priorities, p3) }) }))
      ] }),
      labels.length > 0 && /* @__PURE__ */ u3("div", { class: "vt-filter-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "label" }),
        labels.map((l3) => /* @__PURE__ */ u3(FilterChip, { label: l3, on: q2.labels.includes(l3), onClick: () => set({ labels: toggle(q2.labels, l3) }) }))
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-filter-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "\u5B9F\u884C\u65E5" }),
        [
          ["any", "\u3059\u3079\u3066"],
          ["yes", "\u3042\u308A"],
          ["no", "\u306A\u3057"]
        ].map(([v3, label]) => /* @__PURE__ */ u3(FilterChip, { label, on: q2.scheduled === v3, onClick: () => set({ scheduled: v3 }) })),
        /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "\u4E26\u3073\u66FF\u3048" }),
        /* @__PURE__ */ u3("select", { class: "dropdown", value: q2.sort, onChange: (e3) => set({ sort: e3.currentTarget.value }), children: SORTS.map((s3) => /* @__PURE__ */ u3("option", { value: s3.key, children: s3.label })) }),
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: q2.desc ? "\u964D\u9806" : "\u6607\u9806", onClick: () => set({ desc: !q2.desc }), children: /* @__PURE__ */ u3(Icon, { name: q2.desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide" }) }),
        /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => set(defaultQuery()), children: "\u30EA\u30BB\u30C3\u30C8" })
      ] })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues: shown, selected, onSelect: setSelected, columns: ["status-detail", "labels", "next", "mid_due", "deadline", "estimated"], empty: "\u6761\u4EF6\u306B\u5408\u3046 issue \u306F\u3042\u308A\u307E\u305B\u3093" }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Schedule", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
          { label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(done) },
          { label: "Someday", icon: "cloud", run: () => void somedayIssues(ctx, sel).then(done) },
          { label: "Inbox", icon: "inbox", run: () => void inboxIssues(ctx, sel).then(done) },
          { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    ),
    pages > 1 && /* @__PURE__ */ u3(Pager, { current, pages, onChange: setPage })
  ] });
}

// src/views/OrganizeView.tsx
var import_obsidian15 = require("obsidian");
var CHUNK = 5;
var SWIPE = 90;
var ESTIMATES = [15, 30, 60, 120, 300, 480];
var FIELD_OF = {
  status: (i3) => i3.status,
  scheduled: (i3) => i3.scheduled,
  mid_due: (i3) => i3.midDue,
  deadline: (i3) => i3.deadline,
  revisit: (i3) => i3.revisit,
  reviewed: (i3) => i3.reviewed,
  estimated: (i3) => i3.estimated,
  delegated_to: (i3) => i3.delegatedTo,
  priority: (i3) => i3.priority,
  label: (i3) => i3.labels
};
function snapshot(issue, patch) {
  const prev = {};
  for (const key of Object.keys(patch)) prev[key] = FIELD_OF[key]?.(issue) ?? null;
  return prev;
}
function ScheduleSheet(props) {
  const needEstimate = props.requireEstimate && props.issue.estimated === null;
  const [estimated, setEstimated] = d2(props.issue.estimated);
  return /* @__PURE__ */ u3(
    CalendarForm,
    {
      initial: props.issue.scheduled,
      midDue: props.issue.midDue,
      deadline: props.issue.deadline,
      submitLabel: "\u6C7A\u5B9A",
      canSubmit: (count) => canConfirmSchedule(count, needEstimate, estimated),
      onSubmit: (dates) => props.onSubmit(dates, estimated),
      children: needEstimate && /* @__PURE__ */ u3("div", { class: "vt-sheet", children: [
        /* @__PURE__ */ u3("div", { class: "vt-field-label", children: "estimated\uFF08\u5FC5\u9808\uFF09" }),
        /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: ESTIMATES.map((m3) => /* @__PURE__ */ u3("button", { class: `vt-filter-chip${estimated === m3 ? " is-on" : ""}`, "aria-pressed": estimated === m3, onClick: () => setEstimated(m3), children: formatMinutes(m3) })) })
      ] })
    }
  );
}
function useExcerpt(ctx, issue) {
  const [text, setText] = d2("");
  h2(() => {
    setText("");
    const file = issue && ctx.app.vault.getFileByPath(issue.path);
    if (!file) return;
    let alive = true;
    void ctx.app.vault.cachedRead(file).then((raw) => {
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").split("\n").filter((l3) => l3.trim() && !/^## (ToDo|Description|Note)\s*$/.test(l3) && l3.trim() !== "- [ ]").slice(0, 4).join("\n");
      if (alive) setText(body);
    });
    return () => {
      alive = false;
    };
  }, [issue?.path]);
  return text;
}
function OrganizeView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const today = localToday();
  const [handled, setHandled] = d2(/* @__PURE__ */ new Set());
  const [count, setCount] = d2(0);
  const [undo, setUndo] = d2(null);
  const [drag, setDrag] = d2(null);
  const start = A2(null);
  const root = A2(null);
  const queue = organizeQueue(ctx.store.index.issues.values(), today).filter((i3) => !handled.has(i3.id));
  const issue = queue[0];
  const excerpt = useExcerpt(ctx, issue);
  const apply2 = async (patch, label) => {
    if (!issue) return;
    const full = { ...patch, reviewed: today };
    const prev = snapshot(issue, full);
    try {
      await ctx.writer.update(issue.path, full);
      setUndo({ path: issue.path, id: issue.id, prev, label });
      setHandled(/* @__PURE__ */ new Set([...handled, issue.id]));
      setCount(count + 1);
    } catch (e3) {
      ctx.report("\u6574\u7406\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    }
  };
  const undoLast = async () => {
    if (!undo) return;
    try {
      await ctx.writer.update(undo.path, undo.prev);
      const next = new Set(handled);
      next.delete(undo.id);
      setHandled(next);
      setCount(Math.max(0, count - 1));
      setUndo(null);
    } catch (e3) {
      ctx.report("\u53D6\u308A\u6D88\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    }
  };
  const schedule = () => {
    if (!issue) return;
    const target = issue;
    new PreactModal(ctx.app, "\u4E88\u5B9A\u3092\u5165\u308C\u308B", (close2) => /* @__PURE__ */ u3(
      ScheduleSheet,
      {
        issue: target,
        requireEstimate: isInbox(target),
        onSubmit: (dates, est) => {
          close2();
          const label = dates.length === 1 ? `${formatShortDate(dates[0])} \u306B\u4E88\u5B9A` : `${dates.length} \u65E5\u306B\u4E88\u5B9A`;
          void apply2(organizeSchedulePatch(target, dates, est), label);
        }
      }
    )).open();
  };
  const someday = () => void apply2(issue?.status === "someday" ? {} : somedayPatch(), "Someday \u3078");
  const later = () => void apply2({}, "\u3042\u3068\u3067");
  const cancel = () => void apply2(cancelPatch(), "Cancel");
  const close = () => void apply2(closePatch(), "Closed");
  h2(() => {
    const onKey = (e3) => {
      if (!issue || !root.current || root.current.offsetParent === null) return;
      if (e3.target?.closest("input, textarea, select, [contenteditable='true'], .modal")) return;
      if (document.querySelector(".modal-container")) return;
      const map = { ArrowRight: schedule, ArrowLeft: someday, ArrowUp: later, ArrowDown: cancel };
      const fn = map[e3.key];
      if (fn) {
        e3.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const direction = (d3) => Math.abs(d3.x) >= Math.abs(d3.y) ? d3.x > SWIPE ? "right" : d3.x < -SWIPE ? "left" : null : d3.y < -SWIPE ? "up" : d3.y > SWIPE ? "down" : null;
  const hint = drag ? direction(drag) : null;
  const release = () => {
    const d3 = drag;
    start.current = null;
    setDrag(null);
    if (!d3) return;
    const dir = direction(d3);
    if (dir === "right") schedule();
    else if (dir === "left") someday();
    else if (dir === "up") later();
    else if (dir === "down") cancel();
  };
  const priorityMenu2 = (e3) => {
    if (!issue) return;
    const m3 = new import_obsidian15.Menu();
    for (const p3 of PRIORITIES) m3.addItem((mi) => mi.setTitle(p3).setChecked(issue.priority === p3).onClick(() => void ctx.writer.update(issue.path, { priority: p3 })));
    m3.addItem((mi) => mi.setTitle("\u306A\u3057").onClick(() => void ctx.writer.update(issue.path, { priority: null })));
    m3.showAtMouseEvent(e3);
  };
  const editLabels2 = () => {
    if (!issue) return;
    new PreactModal(ctx.app, "label", (c3) => /* @__PURE__ */ u3(
      LabelForm,
      {
        labels: ctx.store.index.data.labels,
        initial: issue.labels,
        onCreate: (name) => ctx.writer.addLabel(name),
        onSubmit: (names) => {
          c3();
          void ctx.writer.update(issue.path, { label: names });
        },
        onError: (e3) => ctx.report("label \u3092\u8FFD\u52A0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)
      }
    )).open();
  };
  const colors2 = new Map(ctx.store.index.data.labels.map((l3) => [l3.name, l3.color]));
  const inChunk = count % CHUNK;
  return /* @__PURE__ */ u3("div", { class: "vt-page vt-organize", ref: root, children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Organize" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: [
        "\u6B8B\u308A ",
        queue.length
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("div", { class: "vt-chunk", title: `${CHUNK} \u4EF6\u3067\u4E00\u533A\u5207\u308A`, children: Array.from({ length: CHUNK }, (_2, i3) => /* @__PURE__ */ u3("span", { class: `vt-chunk-dot${i3 < inChunk || count > 0 && inChunk === 0 ? " is-on" : ""}` })) })
    ] }),
    count > 0 && inChunk === 0 && issue && /* @__PURE__ */ u3("div", { class: "vt-banner", children: [
      count,
      " \u4EF6\u6574\u7406\u3057\u307E\u3057\u305F\u3002\u3053\u3053\u3067\u4E00\u533A\u5207\u308A\u3002\u7D9A\u3051\u308B\u306A\u3089\u305D\u306E\u307E\u307E\u6B21\u306E\u30AB\u30FC\u30C9\u3078"
    ] }),
    issue ? /* @__PURE__ */ u3("div", { class: "vt-swipe-area", children: [
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-left${hint === "left" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "cloud" }),
        " Someday"
      ] }),
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-right${hint === "right" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "calendar-plus" }),
        " \u4E88\u5B9A"
      ] }),
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-up${hint === "up" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "clock" }),
        " \u3042\u3068\u3067"
      ] }),
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-down${hint === "down" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "x" }),
        " Cancel"
      ] }),
      /* @__PURE__ */ u3(
        "article",
        {
          class: `vt-organize-card${drag ? " is-dragging" : ""}`,
          style: drag ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 20}deg)` } : void 0,
          onPointerDown: (e3) => {
            if (e3.target.closest("button")) return;
            start.current = { x: e3.clientX, y: e3.clientY };
            e3.currentTarget.setPointerCapture(e3.pointerId);
          },
          onPointerMove: (e3) => start.current && setDrag({ x: e3.clientX - start.current.x, y: e3.clientY - start.current.y }),
          onPointerUp: release,
          onPointerCancel: () => {
            start.current = null;
            setDrag(null);
          },
          children: [
            /* @__PURE__ */ u3("div", { class: "vt-organize-meta", children: [
              /* @__PURE__ */ u3(IdBadge, { issue }),
              /* @__PURE__ */ u3("span", { class: "vt-chip-mini", children: isInbox(issue) ? "Inbox" : "Someday" }),
              issue.revisit && /* @__PURE__ */ u3("span", { class: "vt-chip-mini", children: [
                "revisit ",
                formatShortDate(issue.revisit)
              ] }),
              /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
              /* @__PURE__ */ u3("span", { class: "vt-muted vt-num", children: issue.created?.slice(0, 10) })
            ] }),
            /* @__PURE__ */ u3("h3", { class: "vt-organize-summary", children: issue.summary }),
            excerpt && /* @__PURE__ */ u3("p", { class: "vt-organize-excerpt", children: excerpt }),
            /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: [
              /* @__PURE__ */ u3(PriorityBadge, { priority: issue.priority, onClick: priorityMenu2 }),
              issue.labels.map((l3) => /* @__PURE__ */ u3(LabelBadge, { name: l3, color: colors2.get(l3) ?? "var(--background-modifier-border)" })),
              /* @__PURE__ */ u3("button", { class: "vt-badge vt-label is-empty", onClick: editLabels2, children: [
                /* @__PURE__ */ u3(Icon, { name: "tag" }),
                "label"
              ] }),
              issue.estimated !== null && /* @__PURE__ */ u3("span", { class: "vt-chip-mini", children: formatMinutes(issue.estimated) })
            ] })
          ]
        },
        issue.id
      )
    ] }) : /* @__PURE__ */ u3("div", { class: "vt-empty vt-organize-done", children: [
      /* @__PURE__ */ u3(Icon, { name: "party-popper" }),
      /* @__PURE__ */ u3("div", { children: [
        "\u6574\u7406\u3059\u308B\u3082\u306E\u306F\u3042\u308A\u307E\u305B\u3093",
        count > 0 ? `\uFF08${count} \u4EF6\u6574\u7406\u3057\u307E\u3057\u305F\uFF09` : ""
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-organize-actions", children: [
      /* @__PURE__ */ u3("button", { class: "vt-round is-someday", disabled: !issue, onClick: someday, title: "Someday \u3078\uFF08\u2190\uFF09", children: [
        /* @__PURE__ */ u3(Icon, { name: "cloud" }),
        /* @__PURE__ */ u3("span", { children: "Someday" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round", disabled: !issue, onClick: later, title: "\u3042\u3068\u3067\uFF08\u2191\uFF09", children: [
        /* @__PURE__ */ u3(Icon, { name: "clock" }),
        /* @__PURE__ */ u3("span", { children: "\u3042\u3068\u3067" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round is-cancel", disabled: !issue, onClick: cancel, title: "Cancel\uFF08\u2193\uFF09", children: [
        /* @__PURE__ */ u3(Icon, { name: "x" }),
        /* @__PURE__ */ u3("span", { children: "Cancel" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round", disabled: !issue, onClick: close, title: "\u3082\u3046\u7D42\u308F\u3063\u3066\u3044\u305F", children: [
        /* @__PURE__ */ u3(Icon, { name: "check" }),
        /* @__PURE__ */ u3("span", { children: "Closed" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round is-schedule", disabled: !issue, onClick: schedule, title: "\u4E88\u5B9A\u3092\u5165\u308C\u308B\uFF08\u2192\uFF09", children: [
        /* @__PURE__ */ u3(Icon, { name: "calendar-plus" }),
        /* @__PURE__ */ u3("span", { children: "\u4E88\u5B9A" })
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-organize-foot", children: [
      undo ? /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void undoLast(), children: [
        /* @__PURE__ */ u3(Icon, { name: "undo-2" }),
        " \u53D6\u308A\u6D88\u3059\uFF08",
        undo.id,
        ": ",
        undo.label,
        "\uFF09"
      ] }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2190 Someday \uFF0F \u2192 \u4E88\u5B9A \uFF0F \u2191 \u3042\u3068\u3067 \uFF0F \u2193 Cancel\uFF08\u30B9\u30EF\u30A4\u30D7\u304B\u77E2\u5370\u30AD\u30FC\uFF09" }),
      issue && /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void ctx.openPath(issue.path, true), children: [
        /* @__PURE__ */ u3(Icon, { name: "external-link" }),
        " \u958B\u304F"
      ] })
    ] })
  ] });
}

// src/views/RoutineListView.tsx
var import_obsidian16 = require("obsidian");
function RoutineForm(props) {
  const [summary, setSummary] = d2("");
  const [draft, setDraft] = d2(defaultRepeatDraft());
  const [group, setGroup] = d2("");
  const [estimated, setEstimated] = d2("");
  const read = readRepeatDraft(draft);
  const error = !summary.trim() ? "summary \u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044" : read.error;
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (error === null) props.onSubmit(summary.trim(), read.repeat, { group: group || null, estimated: Number(estimated) > 0 ? Number(estimated) : null });
      },
      children: [
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "summary" }),
          /* @__PURE__ */ u3("input", { type: "text", value: summary, placeholder: "\u4F8B: \u9031\u6B21\u30EC\u30D3\u30E5\u30FC", onInput: (e3) => setSummary(e3.currentTarget.value) })
        ] }),
        /* @__PURE__ */ u3(RepeatFields, { draft, onChange: setDraft }),
        /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: [
          /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
            /* @__PURE__ */ u3("span", { children: "\u30B0\u30EB\u30FC\u30D7\uFF08\u4EFB\u610F\uFF09" }),
            /* @__PURE__ */ u3("select", { class: "dropdown", value: group, onChange: (e3) => setGroup(e3.currentTarget.value), children: [
              /* @__PURE__ */ u3("option", { value: "", children: "\u672A\u5206\u985E" }),
              props.groups.map((g2) => /* @__PURE__ */ u3("option", { value: g2, children: g2 }))
            ] })
          ] }),
          /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
            /* @__PURE__ */ u3("span", { children: "estimated\uFF08\u5206\u30FB\u4EFB\u610F\uFF09" }),
            /* @__PURE__ */ u3("input", { class: "vt-small-input", type: "number", min: 0, value: estimated, onInput: (e3) => setEstimated(e3.currentTarget.value) })
          ] })
        ] }),
        error !== null && summary && /* @__PURE__ */ u3("div", { class: "vt-error", children: error }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: error !== null, children: "\u4F5C\u6210" }) })
      ]
    }
  );
}
function RoutineListView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const today = localToday();
  const routines = [...index.routines.values()].sort((a3, b2) => a3.id.localeCompare(b2.id, "en", { numeric: true }));
  const create = () => new PreactModal(ctx.app, "routine \u3092\u4F5C\u6210", (close) => /* @__PURE__ */ u3(
    RoutineForm,
    {
      groups: groupKeys(index.data.groups),
      onSubmit: (summary, repeat, extra) => {
        close();
        void ctx.writer.createRoutine(summary, repeat, { ...extra, start: today }).catch((e3) => ctx.report("routine \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    }
  )).open();
  const toggle2 = (r3) => void ctx.writer.update(r3.path, { active: !r3.active }).catch((e3) => ctx.report("\u5207\u308A\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Routines" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: routines.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", onClick: create, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " routine \u3092\u4F5C\u6210"
      ] })
    ] }),
    routines.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "routine \u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002\u6BCE\u65E5\u30FB\u6BCE\u9031\u306E\u3088\u3046\u306B\u304F\u308A\u8FD4\u3059\u30BF\u30B9\u30AF\u3092\u767B\u9332\u3067\u304D\u307E\u3059\uFF08task board \u306B\u3060\u3051\u51FA\u307E\u3059\uFF09" }),
    /* @__PURE__ */ u3("div", { class: "vt-routine-list", children: routines.map((r3) => /* @__PURE__ */ u3("div", { class: `vt-routine-item${r3.active ? "" : " is-paused"}`, children: [
      /* @__PURE__ */ u3("span", { class: "vt-badge vt-id vt-routine-id", children: r3.id }),
      /* @__PURE__ */ u3("div", { class: "vt-routine-main", ...linkProps((e3) => void ctx.openPath(r3.path, import_obsidian16.Keymap.isModEvent(e3) !== false)), children: [
        /* @__PURE__ */ u3("span", { class: "vt-routine-summary", children: r3.summary || "\uFF08summary \u306A\u3057\uFF09" }),
        /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
          r3.repeat ? describeRepeat(r3.repeat) : "repeat \u304C\u8AAD\u3081\u307E\u305B\u3093",
          r3.group ? ` \xB7 ${r3.group}` : "",
          r3.estimated ? ` \xB7 ${formatMinutes(r3.estimated)}` : ""
        ] })
      ] }),
      routineOccursOn(r3, today) && /* @__PURE__ */ u3("span", { class: "vt-chip-mini is-today", children: "\u4ECA\u65E5" }),
      /* @__PURE__ */ u3("button", { class: `vt-switch${r3.active ? " is-on" : ""}`, role: "switch", "aria-checked": r3.active, title: r3.active ? "\u4E00\u6642\u505C\u6B62\u3059\u308B" : "\u518D\u958B\u3059\u308B", onClick: () => toggle2(r3), children: /* @__PURE__ */ u3("span", { class: "vt-switch-thumb" }) })
    ] }, r3.id)) })
  ] });
}

// src/views/ScheduledView.tsx
var import_obsidian17 = require("obsidian");
var DAYS = 14;
function ScheduledView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const today = localToday(new Date(useNow(6e4)));
  const days = Array.from({ length: DAYS }, (_2, i3) => addDays(today, i3));
  const issues = [...ctx.store.index.issues.values()].filter((i3) => isActive(i3) && i3.scheduled.some((d3) => d3 >= today)).sort((a3, b2) => (a3.scheduled.find((d3) => d3 >= today) ?? "").localeCompare(b2.scheduled.find((d3) => d3 >= today) ?? "") || a3.id.localeCompare(b2.id, "en", { numeric: true }));
  const toggle2 = (path, scheduled, d3) => {
    const next = scheduled.includes(d3) ? scheduled.filter((x2) => x2 !== d3) : [...scheduled, d3].sort();
    void ctx.writer.update(path, { scheduled: next }).catch((e3) => ctx.report("\u5B9F\u884C\u65E5\u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Scheduled" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length })
    ] }),
    issues.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-empty", children: "\u4ECA\u65E5\u4EE5\u964D\u306B\u5B9F\u884C\u65E5\u304C\u3042\u308B issue \u306F\u3042\u308A\u307E\u305B\u3093" }) : /* @__PURE__ */ u3("div", { class: "vt-sched-scroll", children: /* @__PURE__ */ u3("table", { class: "vt-sched", children: [
      /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("th", { class: "vt-sched-sticky" }),
        days.map((d3) => /* @__PURE__ */ u3("th", { class: weekdayOf(d3) % 6 === 0 ? "is-weekend" : "", children: [
          /* @__PURE__ */ u3("span", { class: "vt-weekday", children: WEEKDAY_NAMES[weekdayOf(d3)] }),
          /* @__PURE__ */ u3("span", { class: "vt-sched-date", children: d3 === today ? "\u4ECA\u65E5" : `${Number(d3.slice(5, 7))}/${Number(d3.slice(8))}` })
        ] }))
      ] }) }),
      /* @__PURE__ */ u3("tbody", { children: issues.map((i3) => /* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("th", { class: "vt-sched-sticky", children: /* @__PURE__ */ u3("span", { class: "vt-sched-issue", ...linkProps((e3) => void ctx.openPath(i3.path, import_obsidian17.Keymap.isModEvent(e3) !== false)), children: [
          /* @__PURE__ */ u3(IdBadge, { issue: i3 }),
          /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: i3.summary, children: i3.summary })
        ] }) }),
        days.map((d3) => /* @__PURE__ */ u3("td", { children: /* @__PURE__ */ u3(DayCell, { date: d3, scheduled: i3.scheduled.includes(d3), midDue: i3.midDue, deadline: i3.deadline, today, onClick: () => toggle2(i3.path, i3.scheduled, d3) }) }))
      ] }, i3.id)) })
    ] }) })
  ] });
}

// src/views/SidebarView.tsx
var import_obsidian18 = require("obsidian");
function SidebarView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const now = useNow(3e4);
  const today = localToday(new Date(now));
  const index = ctx.store.index;
  const counts = sidebarCounts(index, today);
  const runningByTask = /* @__PURE__ */ new Map();
  for (const l3 of index.running()) {
    const elapsed = Math.max(0, now - l3.fromMs);
    runningByTask.set(l3.taskId, Math.max(runningByTask.get(l3.taskId) ?? 0, elapsed));
  }
  const items = [
    { type: "vault-task-daily", title: "Daily", icon: "calendar-check", count: counts.daily },
    { type: "vault-task-inbox", title: "Inbox", icon: "inbox", count: counts.inbox },
    { type: "vault-task-organize", title: "Organize", icon: "layers", count: counts.organize },
    { type: "vault-task-scheduled", title: "Scheduled", icon: "calendar-range", count: counts.scheduled },
    { type: "vault-task-issues", title: "Issues", icon: "list-todo", count: counts.issues },
    { type: "vault-task-someday", title: "Someday", icon: "cloud", count: counts.someday },
    { type: "vault-task-routines", title: "Routines", icon: "repeat", count: counts.routines },
    { type: "vault-task-groups", title: "Board groups", icon: "layout-grid" },
    { type: "vault-task-labels", title: "Labels", icon: "tag" }
  ];
  return /* @__PURE__ */ u3("div", { class: "vt-sidebar", children: [
    /* @__PURE__ */ u3("button", { class: "vt-button is-primary vt-sidebar-capture", onClick: () => openCaptureModal(ctx), children: [
      /* @__PURE__ */ u3(Icon, { name: "plus" }),
      " issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210"
    ] }),
    runningByTask.size > 0 && /* @__PURE__ */ u3("section", { class: "vt-sidebar-section", children: [
      /* @__PURE__ */ u3("div", { class: "vt-field-label", children: "\u8A18\u9332\u4E2D" }),
      /* @__PURE__ */ u3("div", { class: "vt-sidebar-running", children: [...runningByTask.entries()].map(([taskId, elapsed]) => {
        const issue = index.issues.get(taskId);
        const routine = index.routines.get(taskId);
        const summary = issue?.summary || routine?.summary || taskId;
        const path = issue?.path ?? routine?.path ?? null;
        return /* @__PURE__ */ u3("div", { class: "vt-task is-running", children: /* @__PURE__ */ u3("div", { class: "vt-task-top", children: [
          path ? /* @__PURE__ */ u3("span", { class: "vt-task-summary", title: `${taskId} ${summary}`, ...linkProps((e3) => void ctx.openPath(path, import_obsidian18.Keymap.isModEvent(e3) !== false)), children: summary }) : /* @__PURE__ */ u3("span", { class: "vt-task-summary", children: summary }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "vt-play is-running",
              "aria-label": "\u8A18\u9332\u3092\u6B62\u3081\u308B",
              title: "\u8A18\u9332\u3092\u6B62\u3081\u308B",
              onClick: () => void stopTimer(ctx, [taskId]),
              children: [
                /* @__PURE__ */ u3(Icon, { name: "square" }),
                /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(elapsed / 6e4) })
              ]
            }
          )
        ] }) }, taskId);
      }) })
    ] }),
    /* @__PURE__ */ u3("nav", { class: "vt-sidebar-nav", "aria-label": "Vault Task Views", children: items.map((item) => /* @__PURE__ */ u3("button", { class: "vt-nav-item", onClick: () => void ctx.openView(item.type), children: [
      /* @__PURE__ */ u3(Icon, { name: item.icon }),
      /* @__PURE__ */ u3("span", { class: "vt-nav-label", children: item.title }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      item.count !== void 0 && item.count > 0 && /* @__PURE__ */ u3("span", { class: "vt-count", children: item.count })
    ] }, item.type)) })
  ] });
}

// src/views/SomedayView.tsx
var ORDERS = [
  { key: "reviewed", label: "\u898B\u76F4\u3057\u305F\u65E5\u304C\u53E4\u3044\u9806" },
  { key: "revisit", label: "revisit \u304C\u8FD1\u3044\u9806" },
  { key: "created", label: "\u4F5C\u6210\u65E5\u304C\u65B0\u3057\u3044\u9806" }
];
function sortSomeday(issues, order) {
  const nullsFirst = (a3, b2) => a3 === b2 ? 0 : a3 === null ? -1 : b2 === null ? 1 : a3.localeCompare(b2);
  const nullsLast = (a3, b2) => a3 === b2 ? 0 : a3 === null ? 1 : b2 === null ? -1 : a3.localeCompare(b2);
  return [...issues].sort(
    (a3, b2) => order === "reviewed" ? nullsFirst(a3.reviewed, b2.reviewed) : order === "revisit" ? nullsLast(a3.revisit, b2.revisit) : (b2.created ?? "").localeCompare(a3.created ?? "")
  );
}
function SomedayView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const [order, setOrder] = d2("reviewed");
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const issues = sortSomeday(
    [...ctx.store.index.issues.values()].filter((i3) => i3.status === "someday"),
    order
  );
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  const reopen = () => void ctx.writer.updateMany(
    sel.map((i3) => i3.path),
    reopenPatch()
  ).then(done, (e3) => ctx.report("Inbox \u306B\u623B\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  const setRevisit = async () => {
    const date = await askDate(ctx, "revisit\uFF08\u3053\u306E\u65E5\u3092\u904E\u304E\u305F\u3089 Organize \u306B\u51FA\u3059\uFF09");
    if (date === null) return;
    await ctx.writer.updateMany(
      sel.map((i3) => i3.path),
      { revisit: date }
    );
    done();
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Someday" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("select", { class: "dropdown", value: order, onChange: (e3) => setOrder(e3.currentTarget.value), children: ORDERS.map((o3) => /* @__PURE__ */ u3("option", { value: o3.key, children: o3.label })) }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: issues.length === 0, onClick: () => void ctx.openView("vault-task-organize"), children: [
        /* @__PURE__ */ u3(Icon, { name: "layers" }),
        " Organize \u3067\u898B\u76F4\u3059"
      ] })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["labels", "revisit", "reviewed"], empty: "Someday \u306F\u7A7A\u3067\u3059" }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Inbox \u306B\u623B\u3059", icon: "inbox", tone: "primary", run: reopen },
          { label: "Schedule", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
          { label: "revisit", icon: "calendar-clock", run: () => void setRevisit().catch((e3) => ctx.report("revisit \u3092\u8A2D\u5B9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)) },
          { label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}

// src/main.ts
var VIEWS = [
  { type: "vault-task-daily", title: "Daily", icon: "calendar-check", component: DailyView },
  { type: "vault-task-issues", title: "Issues", icon: "list-todo", component: IssueListView },
  { type: "vault-task-inbox", title: "Inbox", icon: "inbox", component: InboxView },
  { type: "vault-task-organize", title: "Organize", icon: "layers", component: OrganizeView },
  { type: "vault-task-scheduled", title: "Scheduled", icon: "calendar-range", component: ScheduledView },
  { type: "vault-task-someday", title: "Someday", icon: "cloud", component: SomedayView },
  { type: "vault-task-routines", title: "Routines", icon: "repeat", component: RoutineListView },
  { type: "vault-task-groups", title: "Board groups", icon: "layout-grid", component: GroupManagerView },
  { type: "vault-task-labels", title: "Labels", icon: "tag", component: LabelManagerView }
];
var SIDEBAR_VIEW = { type: "vault-task-sidebar", title: "Tasks", icon: "check-square", component: SidebarView };
var VaultTaskPlugin = class extends import_obsidian19.Plugin {
  store = null;
  taskSettings = { ...DEFAULT_SETTINGS };
  async onload() {
    await this.loadSettings();
    const store = new TaskStore(this.app);
    this.store = store;
    const ctx = {
      app: this.app,
      store,
      writer: new TaskWriter(this.app, store),
      settings: this.taskSettings,
      saveSettings: () => this.saveData(this.taskSettings),
      openPath: async (path, newTab = false) => {
        const file = this.app.vault.getFileByPath(path);
        if (file) await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file);
      },
      openView: async (type) => {
        const { workspace } = this.app;
        const existing = workspace.getLeavesOfType(type)[0];
        const leaf = existing ?? workspace.getLeaf("tab");
        if (!existing) await leaf.setViewState({ type, active: true });
        await workspace.revealLeaf(leaf);
      },
      report: (message, error) => {
        if (error !== void 0) console.error(`vault-task: ${message}`, error);
        const detail = error instanceof Error ? `: ${error.message}` : "";
        new import_obsidian19.Notice(`${message}${detail}`);
      }
    };
    const openSidebar = async (reveal = true) => {
      const { workspace } = this.app;
      const existing = workspace.getLeavesOfType?.(SIDEBAR_VIEW.type)[0];
      const leaf = existing ?? workspace.getLeftLeaf?.(false);
      if (!leaf) return;
      if (!existing) await leaf.setViewState({ type: SIDEBAR_VIEW.type, active: reveal });
      if (reveal) await workspace.revealLeaf(leaf);
    };
    for (const spec of VIEWS) {
      this.registerView(spec.type, preactViewCreator(spec, ctx));
      this.addCommand({ id: `open-${spec.type.replace("vault-task-", "")}`, name: `${spec.title} \u3092\u958B\u304F`, callback: () => void ctx.openView(spec.type) });
    }
    this.registerView(SIDEBAR_VIEW.type, preactViewCreator(SIDEBAR_VIEW, ctx));
    this.addCommand({ id: "open-sidebar", name: "Tasks \u30B5\u30A4\u30C9\u30D0\u30FC\u3092\u958B\u304F", callback: () => void openSidebar(true) });
    this.registerEditorExtension(issueHeaderExtension(ctx));
    this.addCommand({ id: "capture-issues", name: "issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210", callback: () => openCaptureModal(ctx) });
    this.addRibbonIcon("list-plus", "issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210", () => openCaptureModal(ctx));
    this.addSettingTab(new TaskSettingTab(this.app, this, this.taskSettings, () => this.saveData(this.taskSettings)));
    this.app.workspace.onLayoutReady(() => {
      void store.load((ref) => this.registerEvent(ref)).catch((e3) => ctx.report("\u30BF\u30B9\u30AF\u306E\u7D22\u5F15\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      void openSidebar(false).catch((e3) => ctx.report("\u30B5\u30A4\u30C9\u30D0\u30FC\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    });
  }
  onunload() {
    this.store?.unload();
  }
  async loadSettings() {
    const saved = await this.loadData() ?? {};
    Object.assign(this.taskSettings, DEFAULT_SETTINGS, saved);
    if (!this.taskSettings.deviceName) {
      const git = this.app.plugins?.plugins?.["vault-git"];
      const name = git?.data?.deviceName;
      if (typeof name === "string" && name) this.taskSettings.deviceName = sanitizeDeviceName(name);
    }
  }
};
