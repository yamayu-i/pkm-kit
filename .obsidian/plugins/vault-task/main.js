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
var import_obsidian7 = require("obsidian");

// src/obsidian/capture.tsx
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

// src/core/capture.ts
var LIST_MARKER_RE = /^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/;
function parseCaptureText(text) {
  return text.split(/\r?\n/).map((line) => line.replace(LIST_MARKER_RE, "").trim()).filter((line) => line.length > 0);
}

// src/obsidian/modals.ts
var import_obsidian = require("obsidian");
var PreactModal = class extends import_obsidian.Modal {
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
var IssueSuggestModal = class extends import_obsidian.FuzzySuggestModal {
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
var MemberSuggestModal = class extends import_obsidian.SuggestModal {
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
        import_obsidian2.Platform.isMobile ? "" : "\uFF08Mod+Enter\uFF09"
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
  notice = new import_obsidian2.Notice(fragment, NOTICE_MS);
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

// src/obsidian/store.ts
var import_obsidian3 = require("obsidian");

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
function formatShortDate(date) {
  return `${date.slice(5, 7)}/${date.slice(8, 10)} (${WEEKDAY_NAMES[weekdayOf(date)]})`;
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

// src/core/index.ts
var INACTIVE_STATUSES = ["closed", "canceled", "someday"];
function isActive(issue) {
  return !INACTIVE_STATUSES.includes(issue.status);
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
  routinesOn(date) {
    return [...this.routines.values()].filter((r3) => routineOccursOn(r3, date));
  }
};

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

// src/core/worklog.ts
var WORKLOG_PATH_RE = /^worklog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
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
    let toMs = null;
    if (o3.to !== null && o3.to !== void 0) {
      toMs = typeof o3.to === "string" ? Date.parse(o3.to) : Number.NaN;
      if (Number.isNaN(toMs)) return problem(line, "invalid-worklog", "to \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    }
    entries.push({
      path,
      line,
      id: o3.id,
      taskId: o3.task_id,
      from: o3.from,
      to: toMs === null ? null : o3.to,
      description: typeof o3.description === "string" ? o3.description : "",
      fromMs,
      toMs
    });
  });
  return { entries, problems };
}

// src/core/load.ts
function fileKind(path) {
  if (path === LABELS_PATH) return "labels";
  if (WORKLOG_PATH_RE.test(path)) return "worklog";
  const m3 = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
  return m3 ? m3[1] : null;
}
function collectVault(input) {
  const data = { issues: [], routines: [], members: [], labels: [], worklogs: [] };
  const problems = [];
  for (const { path, frontmatter } of [...input.markdown].sort((a3, b2) => a3.path.localeCompare(b2.path, "en", { numeric: true }))) {
    const kind = fileKind(path);
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
  if (input.labels !== null) {
    const r3 = parseLabels(input.labels);
    problems.push(...r3.problems);
    data.labels = r3.labels;
  }
  return { data, problems };
}

// src/obsidian/store.ts
var TaskStore = class {
  constructor(app) {
    this.app = app;
  }
  app;
  index = new TaskIndex({ issues: [], routines: [], members: [], labels: [], worklogs: [] });
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
      vault.on("create", (file) => file instanceof import_obsidian3.TFile && void this.readText(file).then(() => this.touch(file))),
      vault.on("modify", (file) => file instanceof import_obsidian3.TFile && void this.readText(file).then(() => this.touch(file))),
      vault.on("delete", (file) => {
        this.texts.delete(file.path);
        if (file instanceof import_obsidian3.TFile) this.touch(file);
      }),
      vault.on("rename", (file, oldPath) => {
        this.texts.delete(oldPath);
        if (file instanceof import_obsidian3.TFile) void this.readText(file).then(() => this.schedule());
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
    if (kind === "worklog" || kind === "labels") this.texts.set(file.path, await this.app.vault.cachedRead(file));
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
    const input = { markdown: [], worklogs: [], labels: null };
    for (const file of this.app.vault.getMarkdownFiles()) {
      const kind = fileKind(file.path);
      if (kind !== "issue" && kind !== "routine" && kind !== "member") continue;
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      input.markdown.push({ path: file.path, frontmatter: fm ? { ...fm } : null });
    }
    for (const [path, text] of this.texts) {
      const kind = fileKind(path);
      if (kind === "worklog") input.worklogs.push({ path, text });
      else if (kind === "labels") input.labels = text;
    }
    const { data, problems } = collectVault(input);
    this.index = new TaskIndex(data);
    this.problems = problems;
    this.version++;
    for (const fn of this.listeners) fn();
  }
};

// src/obsidian/writer.ts
var import_obsidian4 = require("obsidian");

// src/core/issue-file.ts
var ISSUE_BODY_TEMPLATE = "## ToDo\n\n- [ ] \n\n## Description\n\n## Note\n";
function yamlString(s3) {
  return JSON.stringify(s3);
}
function newIssueContent(id, summary, created, parent = null) {
  const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: issue", `id: ${id}`, `summary: ${yamlString(summary)}`, "status: open"];
  if (parent !== null) lines.push(`parent: ${parent}`);
  lines.push(`created: ${created}`, "---", "", ISSUE_BODY_TEMPLATE);
  return lines.join("\n");
}
function newMemberContent(id, name, created) {
  return ["---", `schema: ${SCHEMA_VERSION}`, "type: member", `id: ${id}`, `name: ${yamlString(name)}`, `created: ${created}`, "---", ""].join(
    "\n"
  );
}

// src/obsidian/writer.ts
var TaskWriter = class {
  constructor(app, store) {
    this.app = app;
    this.store = store;
  }
  app;
  store;
  file(path) {
    const file = this.app.vault.getFileByPath(path);
    if (!file) throw new Error(`\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u305B\u3093: ${path}`);
    return file;
  }
  async ensureFolder(path) {
    const folder = path.slice(0, path.lastIndexOf("/"));
    if (folder && !this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
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
  /** Inbox に issue を作る（ADR-0011）。作れなかった summary は failed に入る */
  async createIssues(summaries, parent = null) {
    const ids = nextIds("i", this.takenIds(), summaries.length);
    const created = [];
    const failed = [];
    const now = localDateTime();
    for (const [i3, summary] of summaries.entries()) {
      const path = (0, import_obsidian4.normalizePath)(pathForId(ids[i3]));
      try {
        await this.ensureFolder(path);
        created.push(await this.app.vault.create(path, newIssueContent(ids[i3], summary, now, parent)));
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
    const path = (0, import_obsidian4.normalizePath)(pathForId(id));
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
    const text = `${JSON.stringify(labels, null, 2)}
`;
    const file = this.app.vault.getFileByPath(LABELS_PATH);
    if (file) await this.app.vault.modify(file, text);
    else {
      await this.ensureFolder(LABELS_PATH);
      await this.app.vault.create(LABELS_PATH, text);
    }
    this.store.refreshSoon();
  }
};

// src/header/extension.ts
var import_state = require("@codemirror/state");
var import_view = require("@codemirror/view");
var import_obsidian6 = require("obsidian");

// src/header/IssueHeader.tsx
var import_obsidian5 = require("obsidian");

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

// src/ui/badges.tsx
function StatusBadge(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-badge vt-status vt-status-${props.status}${props.wide ? " is-wide" : ""}`, onClick: props.onClick, disabled: !props.onClick, children: props.status });
}
function IdBadge(props) {
  return /* @__PURE__ */ u3("span", { class: `vt-badge vt-id vt-status-${props.issue.status}`, children: props.issue.id });
}
function PriorityBadge(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-badge vt-priority vt-priority-${props.priority ?? "none"}`, onClick: props.onClick, disabled: !props.onClick, children: props.priority ?? "priority" });
}
function LabelBadge(props) {
  return /* @__PURE__ */ u3("span", { class: "vt-badge vt-label", style: { backgroundColor: props.color }, children: props.name });
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
function DateForm(props) {
  const [value, setValue] = d2(props.initial ?? "");
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        props.onSubmit(value || null);
      },
      children: [
        /* @__PURE__ */ u3("input", { type: "date", value, onInput: (e3) => setValue(e3.currentTarget.value) }),
        /* @__PURE__ */ u3("button", { type: "button", onClick: () => props.onSubmit(null), children: "\u30AF\u30EA\u30A2" }),
        /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", children: "\u4FDD\u5B58" })
      ]
    }
  );
}
function CalendarForm(props) {
  const today = localToday();
  const [selected, setSelected] = d2(new Set(props.initial));
  const [month, setMonth] = d2(today.slice(0, 7));
  const first = `${month}-01`;
  const start = addDays(first, -((weekdayOf(first) + 6) % 7));
  const days = Array.from({ length: 42 }, (_2, i3) => addDays(start, i3));
  const shift = (n2) => {
    const [y3, m3] = month.split("-").map(Number);
    const d3 = new Date(Date.UTC(y3, m3 - 1 + n2, 1));
    setMonth(d3.toISOString().slice(0, 7));
  };
  const toggle = (d3) => {
    const next = new Set(selected);
    if (next.has(d3)) next.delete(d3);
    else next.add(d3);
    setSelected(next);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-calendar", children: [
    /* @__PURE__ */ u3("div", { class: "vt-calendar-nav", children: [
      /* @__PURE__ */ u3("button", { onClick: () => shift(-1), children: "\u2039" }),
      /* @__PURE__ */ u3("span", { children: month.replace("-", " / ") }),
      /* @__PURE__ */ u3("button", { onClick: () => shift(1), children: "\u203A" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-calendar-grid", children: [
      [1, 2, 3, 4, 5, 6, 0].map((w3) => /* @__PURE__ */ u3("span", { class: "vt-weekday", children: WEEKDAY_NAMES[w3] })),
      days.map((d3) => /* @__PURE__ */ u3(
        DayCell,
        {
          date: d3,
          dimmed: !d3.startsWith(month),
          scheduled: selected.has(d3),
          midDue: props.midDue,
          deadline: props.deadline,
          today,
          onClick: () => toggle(d3)
        }
      ))
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: [
      /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
        selected.size,
        " \u65E5"
      ] }),
      /* @__PURE__ */ u3("button", { class: "mod-cta", onClick: () => props.onSubmit([...selected].sort()), children: "\u4FDD\u5B58" })
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
  return /* @__PURE__ */ u3("button", { class: cls.join(" "), onClick: props.onClick, "aria-pressed": props.scheduled, title: props.date, children: Number(props.date.slice(8, 10)) });
}

// src/ui/hooks.ts
function useStoreVersion(store) {
  const [version, setVersion] = d2(store.version);
  h2(() => store.subscribe(() => setVersion(store.version)), [store]);
  return version;
}

// src/ui/LabelForm.tsx
function LabelForm(props) {
  const [selected, setSelected] = d2(new Set(props.initial));
  const [extra, setExtra] = d2([]);
  const [draft, setDraft] = d2("");
  const names = [...props.labels.map((l3) => l3.name), ...extra.filter((n2) => !props.labels.some((l3) => l3.name === n2))];
  for (const n2 of props.initial) if (!names.includes(n2)) names.push(n2);
  const toggle = (name) => {
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
      /* @__PURE__ */ u3("input", { type: "checkbox", checked: selected.has(name), onChange: () => toggle(name) }),
      name
    ] })) }),
    /* @__PURE__ */ u3("form", { class: "vt-form", onSubmit: create, children: [
      /* @__PURE__ */ u3("input", { type: "text", placeholder: "\u65B0\u3057\u3044 label", value: draft, onInput: (e3) => setDraft(e3.currentTarget.value) }),
      /* @__PURE__ */ u3("button", { type: "submit", children: "\u8FFD\u52A0" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { class: "mod-cta", onClick: () => props.onSubmit(names.filter((n2) => selected.has(n2))), children: "\u4FDD\u5B58" }) })
  ] });
}

// src/header/IssueHeader.tsx
var ESTIMATE_PRESETS = [15, 30, 60, 120, 300, 480];
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
    /* @__PURE__ */ u3(Title, { issue, save }),
    /* @__PURE__ */ u3("div", { class: "vt-row vt-halves", children: /* @__PURE__ */ u3(StatusField, { ctx, issue, index, save }) }),
    /* @__PURE__ */ u3("div", { class: "vt-row", children: [
      /* @__PURE__ */ u3(PriorityField, { issue, save }),
      /* @__PURE__ */ u3(LabelsField, { ctx, issue, index, save })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-row", children: [
      /* @__PURE__ */ u3(ScheduleStrip, { ctx, issue, save }),
      /* @__PURE__ */ u3(DueFields, { ctx, issue, save })
    ] }),
    /* @__PURE__ */ u3(Relations, { ctx, issue, index, save }),
    /* @__PURE__ */ u3(Effort, { ctx, issue, index, save }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" }),
    /* @__PURE__ */ u3(Worklog, { issue, index }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" })
  ] });
}
function Title(props) {
  const { issue, save } = props;
  const [editing, setEditing] = d2(false);
  const commit = (value) => {
    setEditing(false);
    if (value.trim() && value.trim() !== issue.summary) save({ summary: value.trim() });
  };
  return /* @__PURE__ */ u3("div", { class: "vt-title", children: [
    /* @__PURE__ */ u3(IdBadge, { issue }),
    editing ? /* @__PURE__ */ u3(
      "input",
      {
        class: "vt-summary-input",
        value: issue.summary,
        ref: (el) => el?.focus(),
        onBlur: (e3) => commit(e3.currentTarget.value),
        onKeyDown: (e3) => {
          if (e3.key === "Enter" && !e3.isComposing) commit(e3.currentTarget.value);
          if (e3.key === "Escape") setEditing(false);
        }
      }
    ) : /* @__PURE__ */ u3("span", { class: "vt-summary", onClick: () => setEditing(true), children: issue.summary || "\uFF08summary \u306A\u3057\uFF09" })
  ] });
}
function pickMember(ctx, index, onPick) {
  new MemberSuggestModal(ctx.app, [...index.members.values()], (choice) => {
    if (choice.kind === "member") onPick(choice.member.id);
    else
      void ctx.writer.createMember(choice.name).then(onPick).catch((e3) => ctx.report("\u59D4\u4EFB\u5148\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  }).open();
}
function StatusField(props) {
  const { ctx, issue, index, save } = props;
  const change = (next) => {
    if (next === issue.status) return;
    if (next === "delegated") {
      pickMember(ctx, index, (id) => save({ status: next, delegated_to: id }));
      return;
    }
    const fields = { status: next, delegated_to: null };
    if (next === "someday") Object.assign(fields, { scheduled: null, mid_due: null, deadline: null });
    else fields.revisit = null;
    save(fields);
  };
  const menu = (e3) => {
    const m3 = new import_obsidian5.Menu();
    for (const s3 of STATUSES) m3.addItem((item) => item.setTitle(s3).setChecked(s3 === issue.status).onClick(() => change(s3)));
    m3.showAtMouseEvent(e3);
  };
  const editDetail = () => new PreactModal(ctx.app, "status-detail", (close) => /* @__PURE__ */ u3(
    TextForm,
    {
      initial: issue.statusDetail,
      maxLength: STATUS_DETAIL_MAX,
      placeholder: "\u4F8B: \u8FD4\u4E8B\u5F85\u3061",
      onSubmit: (v3) => {
        close();
        save({ "status-detail": v3 });
      }
    }
  )).open();
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
      issue.status === "delegated" && /* @__PURE__ */ u3("span", { class: "vt-link", onClick: () => pickMember(ctx, index, (id) => save({ delegated_to: id })), children: [
        "\u2192 ",
        member ? member.name : issue.delegatedTo ?? "\u59D4\u4EFB\u5148\u3092\u9078\u3076"
      ] }),
      issue.status === "someday" && /* @__PURE__ */ u3("span", { class: "vt-link", onClick: editRevisit, children: [
        "revisit ",
        issue.revisit ? formatShortDate(issue.revisit) : "\u2014"
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-link", onClick: editDetail, children: issue.statusDetail || "\uFF08\u8A73\u7D30\uFF09" })
    ] })
  ] });
}
function PriorityField(props) {
  const menu = (e3) => {
    const m3 = new import_obsidian5.Menu();
    for (const p3 of PRIORITIES) m3.addItem((item) => item.setTitle(p3).setChecked(p3 === props.issue.priority).onClick(() => props.save({ priority: p3 })));
    m3.addItem((item) => item.setTitle("\u306A\u3057").onClick(() => props.save({ priority: null })));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3(PriorityBadge, { priority: props.issue.priority, onClick: menu });
}
function LabelsField(props) {
  const { ctx, issue, index, save } = props;
  const colors = new Map(index.data.labels.map((l3) => [l3.name, l3.color]));
  const edit = () => new PreactModal(ctx.app, "label", (close) => /* @__PURE__ */ u3(
    LabelForm,
    {
      labels: index.data.labels,
      initial: issue.labels,
      onCreate: (name) => ctx.writer.addLabel(name),
      onSubmit: (names) => {
        close();
        save({ label: names });
      },
      onError: (e3) => ctx.report("label \u3092\u8FFD\u52A0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)
    }
  )).open();
  return /* @__PURE__ */ u3("div", { class: "vt-labels", onClick: edit, children: [
    issue.labels.length === 0 && /* @__PURE__ */ u3("span", { class: "vt-badge vt-label is-empty", children: "label" }),
    issue.labels.map((name) => /* @__PURE__ */ u3(LabelBadge, { name, color: colors.get(name) ?? "var(--background-modifier-border)" }))
  ] });
}
function ScheduleStrip(props) {
  const { ctx, issue, save } = props;
  const today = localToday();
  const days = Array.from({ length: 7 }, (_2, i3) => addDays(today, i3));
  const scheduled = new Set(issue.scheduled);
  const toggle = (d3) => {
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
      /* @__PURE__ */ u3(DayCell, { date: d3, scheduled: scheduled.has(d3), midDue: issue.midDue, deadline: issue.deadline, today, onClick: () => toggle(d3) })
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
    /* @__PURE__ */ u3("span", { children: value ? formatShortDate(value) : "\u2014" })
  ] });
  return /* @__PURE__ */ u3("div", { class: "vt-dues", children: [
    row("mid_due", "mid_due", issue.midDue),
    row("deadline", "deadline", issue.deadline)
  ] });
}
function IssueLink(props) {
  return /* @__PURE__ */ u3("span", { class: "vt-relation", children: [
    /* @__PURE__ */ u3(IdBadge, { issue: props.issue }),
    /* @__PURE__ */ u3("span", { class: "vt-link", onClick: (e3) => void props.ctx.openPath(props.issue.path, import_obsidian5.Keymap.isModEvent(e3) !== false), children: props.issue.summary }),
    props.onRemove && /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u5916\u3059", onClick: props.onRemove, children: "\xD7" })
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
    const m3 = new import_obsidian5.Menu();
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
  return /* @__PURE__ */ u3("div", { class: "vt-row vt-halves vt-small", children: [
    /* @__PURE__ */ u3("div", { children: [
      /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
        "Parent",
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u89AA\u3092\u9078\u3076", onClick: pickParent, children: "\u270E" })
      ] }),
      parent ? /* @__PURE__ */ u3(IssueLink, { ctx, issue: parent, onRemove: () => save({ parent: null }) }) : issue.parent !== null ? /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
        issue.parent,
        "\uFF08\u898B\u3064\u304B\u308A\u307E\u305B\u3093\uFF09"
      ] }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" })
    ] }),
    /* @__PURE__ */ u3("div", { children: [
      /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
        "Children",
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "\u5B50\u3092\u8FFD\u52A0", onClick: addChild, children: "\uFF0B" })
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
  const menu = (e3) => {
    const m3 = new import_obsidian5.Menu();
    for (const min of ESTIMATE_PRESETS) m3.addItem((item) => item.setTitle(formatMinutes(min)).onClick(() => save({ estimated: min })));
    m3.addItem(
      (item) => item.setTitle("\u65E5\u6570\u3067\u5165\u529B\u2026").onClick(
        () => new PreactModal(ctx.app, "estimated\uFF08\u65E5\u6570\u30021d = 8h\uFF09", (close) => /* @__PURE__ */ u3(
          TextForm,
          {
            initial: issue.estimated === null ? "" : String(issue.estimated / 480),
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
  };
  return /* @__PURE__ */ u3("div", { class: "vt-row vt-thirds vt-effort", children: [
    /* @__PURE__ */ u3("button", { class: "vt-effort-cell", onClick: menu, children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "estimated" }),
      /* @__PURE__ */ u3("span", { children: issue.estimated === null ? "\u2014" : formatMinutes(issue.estimated) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-effort-cell", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "actual" }),
      /* @__PURE__ */ u3("span", { children: formatMinutes(actual) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-effort-cell", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "remained" }),
      /* @__PURE__ */ u3("span", { children: issue.estimated === null ? "\u2014" : formatMinutes(issue.estimated - actual) })
    ] })
  ] });
}
function Worklog(props) {
  const [page, setPage] = d2(0);
  const logs = props.index.data.worklogs.filter((l3) => l3.taskId === props.issue.id).sort((a3, b2) => b2.fromMs - a3.fromMs);
  const pages = Math.max(1, Math.ceil(logs.length / WORKLOG_PAGE));
  const current = Math.min(page, pages - 1);
  const shown = logs.slice(current * WORKLOG_PAGE, (current + 1) * WORKLOG_PAGE);
  return /* @__PURE__ */ u3("div", { class: "vt-worklog vt-small", children: [
    /* @__PURE__ */ u3("div", { class: "vt-field-label", children: "worklog" }),
    logs.length === 0 && /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093" }),
    shown.map((l3) => /* @__PURE__ */ u3("div", { class: "vt-worklog-row", children: [
      /* @__PURE__ */ u3("span", { children: formatDateTime(l3.fromMs) }),
      /* @__PURE__ */ u3("span", { children: [
        "\u2013 ",
        l3.toMs === null ? "\u8A18\u9332\u4E2D" : formatDateTime(l3.toMs).slice(11)
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-muted", children: l3.toMs === null ? "" : formatMinutes((l3.toMs - l3.fromMs) / 6e4) }),
      /* @__PURE__ */ u3("span", { children: l3.description })
    ] })),
    pages > 1 && /* @__PURE__ */ u3("div", { class: "vt-pager", children: [
      /* @__PURE__ */ u3("button", { disabled: current === 0, onClick: () => setPage(current - 1), children: "\u2039" }),
      /* @__PURE__ */ u3("span", { children: [
        current + 1,
        " / ",
        pages
      ] }),
      /* @__PURE__ */ u3("button", { disabled: current >= pages - 1, onClick: () => setPage(current + 1), children: "\u203A" })
    ] })
  ] });
}

// src/header/extension.ts
var ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;
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
    R(k(IssueHeader, { ctx: this.ctx, path: this.path }), el);
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
    return path !== null && ISSUE_PATH_RE.test(path) ? path : null;
  };
  const build = (path) => ({
    path,
    decorations: path === null ? import_view.Decoration.none : import_view.Decoration.set([import_view.Decoration.widget({ widget: new HeaderWidget(ctx, path), block: true, side: -1 }).range(0)])
  });
  return import_state.StateField.define({
    create: (state) => build(pathOf(state)),
    update(value, tr) {
      const path = pathOf(tr.state);
      if (path !== value.path) return build(path);
      return tr.docChanged ? { path, decorations: value.decorations.map(tr.changes) } : value;
    },
    provide: (field) => import_view.EditorView.decorations.from(field, (v3) => v3.decorations)
  });
}

// src/main.ts
var VaultTaskPlugin = class extends import_obsidian7.Plugin {
  store = null;
  async onload() {
    const store = new TaskStore(this.app);
    this.store = store;
    const ctx = {
      app: this.app,
      store,
      writer: new TaskWriter(this.app, store),
      openPath: async (path, newTab = false) => {
        const file = this.app.vault.getFileByPath(path);
        if (file) await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file);
      },
      report: (message, error) => {
        if (error !== void 0) console.error(`vault-task: ${message}`, error);
        const detail = error instanceof Error ? `: ${error.message}` : "";
        new import_obsidian7.Notice(`${message}${detail}`);
      }
    };
    this.registerEditorExtension(issueHeaderExtension(ctx));
    this.addCommand({ id: "capture-issues", name: "issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210", callback: () => openCaptureModal(ctx) });
    this.addRibbonIcon("list-plus", "issue \u3092\u307E\u3068\u3081\u3066\u4F5C\u6210", () => openCaptureModal(ctx));
    this.app.workspace.onLayoutReady(() => {
      void store.load((ref) => this.registerEvent(ref)).catch((e3) => ctx.report("\u30BF\u30B9\u30AF\u306E\u7D22\u5F15\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    });
  }
  onunload() {
    this.store?.unload();
  }
};
