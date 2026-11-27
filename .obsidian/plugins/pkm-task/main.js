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
  default: () => PkmTaskPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian34 = require("obsidian");

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

// ../shared/src/legacy-data.ts
function legacyDataPath(configDir, legacyId) {
  return `${configDir}/plugins/${legacyId}/data.json`;
}
async function loadDataOrLegacy(deps, legacyPath) {
  const own = await deps.loadData();
  if (own !== null && own !== void 0) return own;
  try {
    if (!await deps.exists(legacyPath)) return null;
    const data = JSON.parse(await deps.read(legacyPath));
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    await deps.saveData(data);
    return data;
  } catch {
    return null;
  }
}
function loadPluginDataOrLegacy(plugin, legacyId) {
  const { adapter, configDir } = plugin.app.vault;
  return loadDataOrLegacy(
    {
      loadData: () => plugin.loadData(),
      saveData: (data) => plugin.saveData(data),
      exists: (path) => adapter.exists(path),
      read: (path) => adapter.read(path)
    },
    legacyDataPath(configDir, legacyId)
  );
}

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

// src/header/extension.ts
var import_obsidian11 = require("obsidian");

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
  for (const item of items) {
    try {
      fn(item);
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
  let pending2 = /* @__PURE__ */ new Set();
  let frame;
  const check = (view) => {
    pending2.add(view);
    if (frame !== void 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = void 0;
      const views = Array.from(pending2);
      pending2 = /* @__PURE__ */ new Set();
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
  const refresh2 = () => {
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
    timer = window.setTimeout(refresh2, 100);
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
  app.workspace.onLayoutReady(refresh2);
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
function monthGridDays(month) {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayOf(first));
  return Array.from({ length: 42 }, (_2, i3) => addDays(start, i3));
}

// src/core/dates.ts
function normalizeDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const s3 = value.trim();
    return isLocalDate(s3) ? s3 : null;
  }
  return null;
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
  const folder = id.startsWith("i-") ? "issue" : id.startsWith("r-") ? "routine" : id.startsWith("p-") ? "preset" : "member";
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
var ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th"];
function describeRepeat(rule) {
  const every = (unit, each) => rule.interval === 1 ? each : `Every ${rule.interval} ${unit}s`;
  switch (rule.every) {
    case "day":
      return every("day", "Daily");
    case "week":
      return `${every("week", "Weekly")} ${rule.weekdays.map((w3) => WEEKDAY_NAMES[w3]).join(", ")}`;
    case "month": {
      const days = rule.days.map((d3) => {
        switch (d3.kind) {
          case "day":
            return `day ${d3.day}`;
          case "last":
            return "last day";
          case "nth":
            return `${ORDINAL[d3.n]} ${WEEKDAY_NAMES[d3.weekday]}`;
          case "lastWeekday":
            return `last ${WEEKDAY_NAMES[d3.weekday]}`;
        }
      });
      return `${every("month", "Monthly")} ${days.join(", ")}`;
    }
  }
}

// src/core/schema.ts
var SCHEMA_VERSION = 1;
var STATUSES = ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"];
var PRIORITIES = ["high", "mid", "low", "chore"];
var STATUS_DETAIL_MAX = 20;
var ROUTINE_MISSED = ["carry"];
var DEFAULT_MISSED_NAME = "list";
var ROUTINE_CATEGORIES = ["closing"];
var DEFAULT_CATEGORY_NAME = "default";
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
  /** 真偽値。ないときは fallback。真偽値でなければ問題にして fallback */
  boolean(key, fallback) {
    if (!this.has(key)) return fallback;
    const v3 = this.fm[key];
    if (typeof v3 === "boolean") return v3;
    this.problem("invalid-field", `${key} \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    return fallback;
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
  /**
   * Calendar の日付 1 つ（ADR-0152）。以前のリストなら最も早い日を読み、移行を促す警告を出す
   * （移行 0152-calendar-tickler で日付 1 つに書き直す）
   */
  calendarDate(key) {
    const v3 = this.fm[key];
    if (!Array.isArray(v3)) return this.date(key);
    const dates = this.dates(key);
    if (v3.length > 0) this.problem("legacy-scheduled-list", `${key} \u306F\u65E5\u4ED8 1 \u3064\u306B\u3057\u307E\u3057\u305F\uFF08ADR-0152\uFF09\u3002\u79FB\u884C 0152-calendar-tickler \u3067\u66F8\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\uFF08node .kit/migrate.mjs\uFF09`, "warning");
    return dates[0] ?? null;
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
  if (r3.has("mid_due")) r3.problem("legacy-mid-due", "mid_due \u306F soft_deadline \u306B\u6539\u540D\u3057\u307E\u3057\u305F\uFF08ADR-0032\uFF09\u3002\u30AD\u30FC\u3092 soft_deadline \u306B\u76F4\u3057\u3066\u304F\u3060\u3055\u3044");
  if (r3.has("parent")) r3.problem("legacy-parent", "parent \u306F\u5EC3\u6B62\u3057\u307E\u3057\u305F\uFF08ADR-0135\uFF09\u3002\u79FB\u884C 0135-sub-issues \u3067\u89AA\u306E\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u306B\u5909\u63DB\u3057\u3066\u304F\u3060\u3055\u3044\uFF08node .kit/migrate.mjs\uFF09");
  const issue = {
    path,
    id: id ?? "",
    summary,
    status: status ?? "open",
    statusDetail: r3.string("status-detail") ?? "",
    delegatedTo: r3.ref("delegated_to", "m"),
    priority: r3.oneOf("priority", PRIORITIES),
    labels: r3.strings("label"),
    related: r3.strings("related"),
    estimated: r3.minutes("estimated"),
    scheduled: r3.calendarDate("scheduled"),
    softDeadline: r3.date("soft_deadline"),
    deadline: r3.date("deadline"),
    revisit: r3.date("revisit"),
    reviewed: r3.date("reviewed"),
    clarified: r3.boolean("clarified", false),
    tickler: r3.date("tickler"),
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
  if (r3.has("group")) r3.problem("legacy-routine-group", "group \u306F\u5EC3\u6B62\u3057\u307E\u3057\u305F\uFF08ADR-0137\uFF09\u3002\u79FB\u884C 0137-board-lanes \u3067\u6D88\u3057\u3066\u304F\u3060\u3055\u3044\uFF08node .kit/migrate.mjs\uFF09", "warning");
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
    priority: r3.oneOf("priority", PRIORITIES),
    labels: r3.strings("label"),
    estimated: r3.minutes("estimated"),
    category: routineCategory(r3, fm.category),
    order: routineOrder(r3, fm.order),
    missed: routineMissed(r3, fm.missed),
    created: r3.datetime("created")
  };
  return { value: id === null ? null : routine, problems: r3.problems };
}
function routineCategory(r3, value) {
  if (value === void 0 || value === null || value === "") return null;
  if (value === DEFAULT_CATEGORY_NAME) {
    r3.problem("reserved-category", "category \u306E default \u306F\u4E88\u7D04\u8A9E\u3067\u3059\u3002default \u306B\u3059\u308B\u306A\u3089 category \u3092\u6D88\u3057\u3066\u304F\u3060\u3055\u3044\uFF08ADR-0206\uFF09", "warning");
    return null;
  }
  if (typeof value === "string" && ROUTINE_CATEGORIES.includes(value)) return value;
  r3.problem("invalid-category", `category \u306F ${ROUTINE_CATEGORIES.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u306A\u3057\u306F default\uFF09: ${String(value)}`, "warning");
  return null;
}
function routineMissed(r3, value) {
  if (value === void 0 || value === null || value === "") return null;
  if (typeof value === "string" && ROUTINE_MISSED.includes(value)) return value;
  r3.problem("invalid-missed", `missed \u306F ${ROUTINE_MISSED.join(" / ")} \u306B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u306A\u3057\u306F Calendar \u306E Missed \u306B\u4E26\u3079\u308B\uFF09: ${String(value)}`, "warning");
  return null;
}
function routineOrder(r3, value) {
  if (value === void 0 || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  r3.problem("invalid-field", `order \u306F\u6570\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(value)}`, "warning");
  return null;
}
function parseMember(path, fm) {
  const r3 = new Reader(path, fm);
  const id = r3.common("member", "m");
  const name = r3.string("name") ?? "";
  if (!name) r3.problem("missing-name", "name \u304C\u3042\u308A\u307E\u305B\u3093");
  const nickname = r3.string("nickname") || name;
  const alias = (r3.string("alias") ?? "").replace(/^@+/, "").trim();
  if (id === null) return { value: null, problems: r3.problems };
  return { value: { path, id, name, nickname, alias: alias || id, labels: r3.strings("label"), created: r3.datetime("created") }, problems: r3.problems };
}

// src/core/routine-order.ts
var CATEGORY_GROUPS = [null, ...ROUTINE_CATEGORIES];
function compareRoutines(a3, b2) {
  if (a3.order !== null && b2.order !== null && a3.order !== b2.order) return a3.order - b2.order;
  if (a3.order !== null && b2.order === null) return -1;
  if (a3.order === null && b2.order !== null) return 1;
  return a3.id.localeCompare(b2.id, "en", { numeric: true });
}
function sortRoutines(routines) {
  return [...routines].sort(compareRoutines);
}
function routineGroups(routines) {
  const all = sortRoutines(routines);
  return CATEGORY_GROUPS.map((category) => ({ category, routines: all.filter((r3) => r3.category === category) }));
}
function moveRoutine(routines, id, category, before) {
  const all = sortRoutines(routines);
  const moved = all.find((r3) => r3.id === id);
  if (!moved || before === id) return [];
  const group = all.filter((r3) => r3.category === category && r3.id !== id);
  const at = before === null ? -1 : group.findIndex((r3) => r3.id === before);
  group.splice(at < 0 ? group.length : at, 0, moved);
  const patches = [];
  group.forEach((r3, i3) => {
    const patch = { path: r3.path };
    if (r3.order !== i3 + 1) patch.order = i3 + 1;
    if (r3.id === id && r3.category !== category) patch.category = category;
    if (patch.order !== void 0 || patch.category !== void 0) patches.push(patch);
  });
  return patches;
}
function routinesOnDay(index, date, category) {
  const carried = [];
  const rest = [];
  for (const routine of index.routines.values()) {
    if (category !== void 0 && routine.category !== category) continue;
    const from = carriedFrom(index, routine, date);
    if (from !== null) carried.push({ from, routine });
    else if (routineOccursOn(routine, date)) rest.push(routine);
  }
  carried.sort((a3, b2) => a3.from === b2.from ? compareRoutines(a3.routine, b2.routine) : a3.from < b2.from ? -1 : 1);
  return [...carried.map((c3) => c3.routine), ...sortRoutines(rest)];
}
var MISSED_ROUTINES_SINCE = "2026-11-18";
function countFrom(routine, since) {
  const anchor = routineAnchor(routine);
  if (!routine.active || routine.repeat === null || anchor === null) return null;
  return anchor > since ? anchor : since;
}
function carriedFrom(index, routine, date, since = MISSED_ROUTINES_SINCE) {
  if (routine.missed !== "carry") return null;
  const start = countFrom(routine, since);
  if (start === null) return null;
  let pending2 = null;
  for (let d3 = start; d3 < date; d3 = addDays(d3, 1)) {
    if (index.board(d3)?.board.routines[routine.id] !== void 0) pending2 = null;
    else if (pending2 === null && routineOccursOn(routine, d3)) pending2 = d3;
  }
  return pending2;
}
function missedRoutines(index, today, since = MISSED_ROUTINES_SINCE) {
  const out = [];
  for (const routine of index.routines.values()) {
    const from = countFrom(routine, since);
    if (from === null || routine.missed === "carry") continue;
    for (let d3 = from; d3 < today; d3 = addDays(d3, 1)) {
      if (!routineOccursOn(routine, d3)) continue;
      if (index.board(d3)?.board.routines[routine.id] !== void 0) continue;
      out.push({ date: d3, routine });
    }
  }
  return out.sort((a3, b2) => a3.date === b2.date ? compareRoutines(a3.routine, b2.routine) : a3.date < b2.date ? -1 : 1);
}

// src/core/board.ts
var BOARD_KEY = "board";
function emptyBoard() {
  return { issues: [], stars: [], routines: {}, carried: [], closed: false };
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
  for (const [id, r3] of Object.entries(record(raw.routines))) if (r3 === "closed" || r3 === "canceled") board.routines[id] = r3;
  board.closed = raw.closed === true;
  return board;
}
function dailyNotePath(date) {
  return `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
}
var DAILY_PATH_RE = /^daily\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/;
function isOnBoard(index, date, key) {
  return index.board(date)?.board.issues.includes(key) ?? false;
}
function boardItems(index, date, board) {
  const issues = board.issues.map((id) => index.issues.get(id)).filter((i3) => i3 !== void 0);
  const subs = board.issues.map((key) => index.sub(key)).filter((s3) => s3 !== void 0);
  return { issues, subs, routines: routinesOnDay(index, date) };
}
function unfinished(index, date, board, today) {
  const items = boardItems(index, date, board);
  const left = (status, key) => isActive({ status }) && !isWatchStatus(status) && !board.carried.includes(key);
  return {
    issues: items.issues.filter((i3) => left(i3.status, i3.id)),
    subs: items.subs.filter((s3) => left(s3.status, s3.key)),
    routines: items.routines.filter((r3) => board.routines[r3.id] === void 0 && !(today !== void 0 && date < today && r3.missed === "carry"))
  };
}
function unfinishedCount(u4) {
  return u4.issues.length + u4.subs.length + u4.routines.length;
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
function sortByOrder(items, idOf, order) {
  if (!order || order.length === 0) return [...items];
  const rank = new Map(order.map((id, i3) => [id, i3]));
  const inOrder = items.filter((it) => rank.has(idOf(it))).sort((a3, b2) => (rank.get(idOf(a3)) ?? 0) - (rank.get(idOf(b2)) ?? 0));
  return [...inOrder, ...items.filter((it) => !rank.has(idOf(it)))];
}
function reorder(visible, id, before) {
  const rest = visible.filter((x2) => x2 !== id);
  const at = before === null ? -1 : rest.indexOf(before);
  return at < 0 ? [...rest, id] : [...rest.slice(0, at), id, ...rest.slice(at)];
}
function nextOrder(visible, previous) {
  const result = [...visible];
  if (!previous) return result;
  const shown = new Set(visible);
  let prev = null;
  let headAt = 0;
  for (const id of previous) {
    if (!shown.has(id) && !result.includes(id)) {
      if (prev === null) result.splice(headAt++, 0, id);
      else result.splice(result.indexOf(prev) + 1, 0, id);
    }
    prev = id;
  }
  return result;
}

// src/core/issue-file.ts
var ISSUE_BODY_TEMPLATE = "# Note\n\n";
function yamlString(s3) {
  return JSON.stringify(s3);
}
function newIssueContent(id, summary, created, extra = {}) {
  const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: issue", `id: ${id}`, `summary: ${yamlString(summary)}`, "status: open"];
  if (extra.scheduled) lines.push(`scheduled: ${extra.scheduled}`);
  if (extra.clarified) lines.push("clarified: true");
  lines.push(`created: ${created}`, `updated: ${created}`, "---", "", ISSUE_BODY_TEMPLATE);
  return lines.join("\n");
}
function newMemberContent(id, name, created) {
  return [
    "---",
    `schema: ${SCHEMA_VERSION}`,
    "type: member",
    `id: ${id}`,
    `name: ${yamlString(name)}`,
    `nickname: ${yamlString(name)}`,
    `alias: ${yamlString(id)}`,
    `created: ${created}`,
    `updated: ${created}`,
    "---",
    ""
  ].join("\n");
}
function newRoutineContent(id, summary, repeat, created, extra = {}) {
  const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: routine", `id: ${id}`, `summary: ${yamlString(summary)}`, `repeat: ${JSON.stringify(repeat)}`];
  if (extra.start) lines.push(`start: ${extra.start}`);
  lines.push("active: true");
  if (extra.estimated) lines.push(`estimated: ${extra.estimated}`);
  lines.push(`created: ${created}`, `updated: ${created}`, "---", "", "## \u624B\u9806", "", "- [ ] ", "");
  return lines.join("\n");
}
function newDailyContent(created) {
  return `---
type: daily
created: ${created}
updated: ${created}
---
`;
}

// src/core/actions.ts
function cancelPatch() {
  return { status: "canceled", soft_deadline: null, deadline: null, delegated_to: null, revisit: null, tickler: null };
}
function closePatch() {
  return { status: "closed", delegated_to: null, revisit: null, tickler: null };
}
function nextPatch(issue) {
  return { clarified: true, tickler: null, ...issue.status === "someday" ? reopenPatch() : {} };
}
function backToNextPatch() {
  return { scheduled: null, tickler: null, clarified: true };
}
function ticklerPatch(issue, date) {
  return { tickler: date, ...issue.status === "someday" ? reopenPatch() : {} };
}
function calendarPatch(issue, date) {
  return { scheduled: date, clarified: true, tickler: null, ...issue.status === "someday" ? reopenPatch() : {} };
}
function somedayPatch(revisit = null) {
  return { status: "someday", scheduled: null, soft_deadline: null, deadline: null, delegated_to: null, revisit, tickler: null };
}
function keepSomedayPatch() {
  return { tickler: null, revisit: null };
}
function reviewedPatch(date) {
  return { reviewed: date };
}
function reopenPatch() {
  return { status: "open", revisit: null };
}
function duePatch(issue, key, date) {
  return { [key]: date, ...issue.status === "someday" && date !== null ? reopenPatch() : {} };
}
function scheduledPatch(issue, date) {
  return { scheduled: date, ...issue.status === "someday" && date !== null ? reopenPatch() : {} };
}
function ticklerFieldPatch(issue, date) {
  return { tickler: date, ...issue.status === "someday" && date !== null ? reopenPatch() : {} };
}
function reschedulePatch(target, to) {
  return { [target]: to };
}

// src/core/transition.ts
var STATUS_TRANSITIONS = {
  open: ["in-progress", "waiting", "delegated", "someday", "closed", "canceled"],
  "in-progress": ["waiting", "delegated", "someday", "closed", "canceled"],
  waiting: ["in-progress", "someday", "closed", "canceled"],
  delegated: ["in-progress", "someday", "closed", "canceled"],
  someday: ["open", "closed", "canceled"],
  closed: ["canceled"],
  canceled: ["closed"]
};
var isDone = (s3) => s3 === "closed" || s3 === "canceled";
function transitionTargets(from) {
  return STATUSES.filter((s3) => STATUS_TRANSITIONS[from].includes(s3));
}
function canTransition(from, to, reopenTo = null) {
  if (from === to) return false;
  if (STATUS_TRANSITIONS[from].includes(to)) return true;
  return isDone(from) && reopenTo !== null && !isDone(reopenTo) && to === reopenTo;
}
function transitionError(from, to, reopenTo = null) {
  const targets = [...transitionTargets(from), ...isDone(from) && reopenTo !== null && !isDone(reopenTo) ? [`${reopenTo}\uFF08Reopen\uFF09`] : []];
  return `status \u306F ${from} \u304B\u3089 ${to} \u306B\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3002\u79FB\u308C\u308B\u5148: ${targets.join(", ")}\uFF08ADR-0183\uFF09`;
}
function canTransitionAll(froms, to) {
  return froms.length > 0 && froms.every((from) => canTransition(from, to));
}
function primaryStep(status) {
  switch (status) {
    case "open":
      return { kind: "status", to: "in-progress", label: "Start" };
    case "in-progress":
      return { kind: "status", to: "closed", label: "Close" };
    case "waiting":
    case "delegated":
      return { kind: "status", to: "in-progress", label: "Resume" };
    case "someday":
      return { kind: "status", to: "open", label: "Reopen" };
    default:
      return { kind: "reopen", label: "Reopen" };
  }
}
function reopenStatus(logs, task, sub = null) {
  for (let i3 = logs.length - 1; i3 >= 0; i3--) {
    const e3 = logs[i3];
    if (e3.task !== task || (e3.sub ?? null) !== sub) continue;
    if (isDone(e3.to) && !isDone(e3.from)) return e3.from;
  }
  return "open";
}
function stopsTimer(to) {
  return to !== "open" && to !== "in-progress";
}
function unstarsOn(to) {
  return to === "waiting" || to === "delegated" || to === "someday";
}
function timerStartStatus(from) {
  return from === "open" || from === "waiting" || from === "delegated" ? "in-progress" : null;
}
function issueStatusPatch(to, opts = {}) {
  if (to === "closed") return closePatch();
  if (to === "canceled") return cancelPatch();
  if (to === "someday") return somedayPatch(opts.revisit ?? null);
  if (to === "delegated") {
    if (!opts.delegatedTo) throw new Error("delegated \u306B\u3059\u308B\u3068\u304D\u306F\u59D4\u4EFB\u5148\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
    return { status: to, delegated_to: opts.delegatedTo, revisit: null, tickler: null };
  }
  if (to === "open") return { status: to, delegated_to: null, revisit: null };
  return { status: to, delegated_to: null, revisit: null, tickler: null };
}
function subStatusPatch(to, opts = {}) {
  if (to === "delegated") {
    if (!opts.delegatedTo) throw new Error("delegated \u306B\u3059\u308B\u3068\u304D\u306F\u59D4\u4EFB\u5148\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
    return { status: to, delegatedTo: opts.delegatedTo };
  }
  if (to === "someday") return { status: to, delegatedTo: null, scheduled: null, start: null, end: null };
  return { status: to, delegatedTo: null };
}
function reopenSubOnPeriod(current, patch) {
  if (current !== "someday" || patch.status !== void 0) return patch;
  const sets = patch.start !== void 0 && patch.start !== null || patch.end !== void 0 && patch.end !== null;
  return sets ? { ...patch, status: "open" } : patch;
}
function completeIssuePatch(to, fields, from = null) {
  const base = to === "delegated" ? { revisit: null, tickler: null } : issueStatusPatch(to, { revisit: fields.revisit ?? null });
  if (from === "someday" && to === "open") base.clarified = null;
  return { ...base, ...fields };
}
function completeSubPatch(to, patch) {
  const base = to === "delegated" ? {} : subStatusPatch(to);
  return { ...base, ...patch };
}
function canSetTickler(status) {
  return status === "open" || status === "someday";
}
function ticklerError(status) {
  return `Tickler \u306F open\uFF08\u3068 someday\uFF09\u306E issue \u3060\u3051\u306B\u4ED8\u3051\u3089\u308C\u307E\u3059\u3002\u4ECA\u306F ${status} \u3067\u3059\uFF08ADR-0183\uFF09`;
}
function canApplyAll(froms, op) {
  if (op === "tickler") return froms.length > 0 && froms.every(canSetTickler);
  return canTransitionAll(froms, op);
}

// src/core/sub-issue.ts
var SUB_ISSUE_MARKER = "<!-- sub-issue";
var BLOCK_END = "-->";
var SubIssueFormatError = class extends Error {
};
var REMOVED_SUB_KEYS = ["soft_deadline", "deadline"];
var SUB_ID_RE = /^[a-z0-9]{6}$/;
var SUB_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
function isSubId(value) {
  return typeof value === "string" && SUB_ID_RE.test(value);
}
function subKey(parent, id) {
  return `${parent}#${id}`;
}
function parseSubKey(key) {
  const at = key.indexOf("#");
  if (at < 0) return null;
  const parent = key.slice(0, at);
  const id = key.slice(at + 1);
  return isId(parent, "i") && isSubId(id) ? { parent, id } : null;
}
function newSubId(existing, random = Math.random) {
  const taken = new Set(existing);
  for (; ; ) {
    let id = "";
    for (let i3 = 0; i3 < 6; i3++) id += SUB_ID_CHARS[Math.min(SUB_ID_CHARS.length - 1, Math.floor(random() * SUB_ID_CHARS.length))];
    if (!taken.has(id)) return id;
  }
}
var FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
function splitSubIssueText(text) {
  const fm = FRONTMATTER_RE.exec(text);
  const from = fm ? fm[0].length : 0;
  const starts = [];
  let pos = from;
  while (pos <= text.length) {
    if (text.startsWith(SUB_ISSUE_MARKER, pos)) {
      const next = text[pos + SUB_ISSUE_MARKER.length];
      if (next === void 0 || next === "\n" || next === "\r" || next === " ") starts.push(pos);
    }
    const nl = text.indexOf("\n", pos);
    if (nl < 0) break;
    pos = nl + 1;
  }
  if (starts.length === 0) return { head: text, blocks: [] };
  const blocks = starts.map((s3, i3) => text.slice(s3, starts[i3 + 1] ?? text.length));
  return { head: text.slice(0, starts[0]), blocks };
}
function prefixed(problems, id) {
  return problems.map((p3) => ({ ...p3, message: `\u30B5\u30D6 ${id}: ${p3.message}` }));
}
function parseBlock(path, parent, raw, order, parseYaml5) {
  const invalid = (message) => ({ sub: null, problems: [{ severity: "error", path, code: "invalid-sub-issue", message: `${order + 1} \u4EF6\u76EE\u306E\u30B5\u30D6: ${message}` }] });
  const lines = raw.split(/\r?\n/);
  const endLine = lines.findIndex((l3, i3) => i3 > 0 && l3.trim() === BLOCK_END);
  if (endLine < 0) return invalid(`\u9589\u3058\u306E ${BLOCK_END} \u304C\u3042\u308A\u307E\u305B\u3093`);
  const yamlText = [lines[0].slice(SUB_ISSUE_MARKER.length), ...lines.slice(1, endLine)].join("\n");
  let fm;
  try {
    fm = parseYaml5(yamlText);
  } catch {
    return invalid("\u9805\u76EE\u304C YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
  }
  if (typeof fm !== "object" || fm === null || Array.isArray(fm)) return invalid("\u9805\u76EE\u304C YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
  const r3 = new Reader(path, fm);
  const id = r3.string("id");
  if (!isSubId(id)) return invalid(`id \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(id)}`);
  const extra = [];
  const summary = r3.string("summary") ?? "";
  if (!summary) extra.push({ severity: "error", path, code: "invalid-sub-issue", message: "summary \u304C\u3042\u308A\u307E\u305B\u3093" });
  const status = r3.oneOf("status", STATUSES);
  if (status === null && !r3.has("status")) extra.push({ severity: "error", path, code: "invalid-sub-issue", message: "status \u304C\u3042\u308A\u307E\u305B\u3093" });
  const migratedFrom = r3.ref("migrated_from", "i");
  const removed = REMOVED_SUB_KEYS.filter((k3) => r3.has(k3));
  if (removed.length > 0) extra.push({ severity: "warning", path, code: "sub-deadline-removed", message: `${removed.join(" \u3068 ")} \u306F\u30B5\u30D6\u3067\u306F\u4F7F\u308F\u306A\u304F\u306A\u308A\u307E\u3057\u305F\u3002end \u306B\u307E\u3068\u3081\u3066\u304F\u3060\u3055\u3044\uFF08ADR-0190\u3001\u79FB\u884C 0190\uFF09` });
  const sub = {
    parent,
    path,
    id,
    key: subKey(parent, id),
    order,
    summary,
    status: status ?? "open",
    delegatedTo: r3.ref("delegated_to", "m"),
    start: r3.date("start"),
    end: r3.date("end"),
    scheduled: r3.calendarDate("scheduled"),
    estimated: r3.minutes("estimated"),
    dependsOn: r3.strings("depends_on"),
    created: r3.datetime("created"),
    migratedFrom,
    body: lines.slice(endLine + 1).join("\n").replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd()
  };
  return { sub, problems: prefixed([...extra, ...r3.problems], id) };
}
function parseSubIssues(path, parent, text, parseYaml5) {
  const blocks = [];
  const problems = [];
  const subs = [];
  for (const raw of splitSubIssueText(text).blocks) {
    const r3 = parseBlock(path, parent, raw, blocks.length, parseYaml5);
    blocks.push({ raw: raw.trimEnd(), sub: r3.sub });
    problems.push(...r3.problems);
    if (r3.sub) subs.push(r3.sub);
  }
  return { subs, blocks, problems };
}
function yamlString2(s3) {
  return JSON.stringify(s3);
}
function formatSubHead(sub) {
  if (!isSubId(sub.id)) throw new SubIssueFormatError(`id \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${sub.id}`);
  const lines = [SUB_ISSUE_MARKER, `id: ${sub.id}`, `summary: ${yamlString2(sub.summary)}`, `status: ${sub.status}`];
  const put = (key, value) => {
    if (value !== null) lines.push(`${key}: ${value}`);
  };
  put("delegated_to", sub.delegatedTo);
  put("start", sub.start);
  put("end", sub.end);
  put("scheduled", sub.scheduled);
  put("estimated", sub.estimated === null ? null : String(sub.estimated));
  if (sub.dependsOn.length > 0) put("depends_on", JSON.stringify(sub.dependsOn));
  put("created", sub.created);
  put("migrated_from", sub.migratedFrom);
  for (const line of lines.slice(1)) {
    if (line.includes(BLOCK_END)) throw new SubIssueFormatError(`\u30B5\u30D6\u306E\u9805\u76EE\u306B ${BLOCK_END} \u306F\u66F8\u3051\u307E\u305B\u3093: ${line}`);
    if (/[\r\n]/.test(line)) throw new SubIssueFormatError(`\u30B5\u30D6\u306E\u9805\u76EE\u306B\u6539\u884C\u306F\u66F8\u3051\u307E\u305B\u3093: ${line}`);
  }
  lines.push(BLOCK_END);
  return lines.join("\n");
}
function formatSubIssue(sub) {
  const head = formatSubHead(sub);
  const body = sub.body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
  if (body.split(/\r?\n/).some((l3) => l3.startsWith(SUB_ISSUE_MARKER))) {
    throw new SubIssueFormatError(`\u30B5\u30D6\u306E\u672C\u6587\u306E\u884C\u982D\u306B ${SUB_ISSUE_MARKER} \u306F\u66F8\u3051\u307E\u305B\u3093`);
  }
  return `${head}
${body ? `${body}
${sub.body.endsWith("\n\n") ? "\n" : ""}` : ""}`;
}
function replaceSubIssues(text, blocks) {
  const { head, blocks: existing } = splitSubIssueText(text);
  if (blocks.length === 0) return existing.length === 0 ? text : `${head.trimEnd()}
`;
  const parts = blocks.map((b2) => typeof b2 === "string" ? `${b2.trimEnd()}
` : formatSubIssue(b2));
  return `${head.trimEnd()}

${parts.join("\n")}`;
}
function appendParentBodyText(text, body) {
  const add = body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
  if (!add) return text;
  if (add.split(/\r?\n/).some((l3) => l3.startsWith(SUB_ISSUE_MARKER))) throw new SubIssueFormatError(`\u8FFD\u8A18\u3059\u308B\u672C\u6587\u306E\u884C\u982D\u306B ${SUB_ISSUE_MARKER} \u306F\u66F8\u3051\u307E\u305B\u3093`);
  const { head, blocks } = splitSubIssueText(text);
  const base = head.trimEnd();
  const nextHead = `${base}${base ? "\n\n" : ""}${add}
`;
  return blocks.length === 0 ? nextHead : `${nextHead}
${blocks.join("")}`;
}
function updateSubIssueText(path, parent, text, id, patch, parseYaml5) {
  const { blocks } = parseSubIssues(path, parent, text, parseYaml5);
  const at = blocks.findIndex((b2) => b2.sub?.id === id);
  if (at < 0) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${subKey(parent, id)}`);
  const before = blocks[at].sub;
  const after = { ...before, ...patch, id: before.id };
  const items = blocks.map((b2, i3) => i3 === at ? after : b2.sub ?? b2.raw);
  if (becomesDone(before.status, after.status)) items.push(...items.splice(at, 1));
  return { text: replaceSubIssues(text, items), before, after };
}
function rebuild(path, parent, text, parseYaml5, edit) {
  const { blocks } = parseSubIssues(path, parent, text, parseYaml5);
  const items = blocks.map((b2) => b2.sub ?? b2.raw);
  edit(
    items,
    blocks.map((b2) => b2.sub?.id ?? null)
  );
  return replaceSubIssues(text, items);
}
function indexOfSub(ids, parent, id) {
  const at = ids.indexOf(id);
  if (at < 0) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${subKey(parent, id)}`);
  return at;
}
function insertSubIssuesText(path, parent, text, subs, parseYaml5, at) {
  return rebuild(path, parent, text, parseYaml5, (items) => {
    const pos = at ?? items.length;
    if (!Number.isInteger(pos) || pos < 0 || pos > items.length) throw new Error(`\u4F4D\u7F6E\u306F 0 \u304B\u3089 ${items.length} \u307E\u3067\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${pos}`);
    items.splice(pos, 0, ...subs);
  });
}
function moveSubIssueText(path, parent, text, id, to, parseYaml5) {
  return rebuild(path, parent, text, parseYaml5, (items, ids) => {
    const from = indexOfSub(ids, parent, id);
    if (!Number.isInteger(to) || to < 0 || to >= items.length) throw new Error(`\u4F4D\u7F6E\u306F 0 \u304B\u3089 ${items.length - 1} \u307E\u3067\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${to}`);
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
  });
}
function removeSubIssueText(path, parent, text, id, parseYaml5) {
  return rebuild(path, parent, text, parseYaml5, (items, ids) => {
    items.splice(indexOfSub(ids, parent, id), 1);
  });
}
function checkSubIssues(subs, memberIds) {
  const errors = [];
  const ids = /* @__PURE__ */ new Set();
  const byId = new Map(subs.map((s3) => [s3.id, s3]));
  const isDate = (v3) => v3 === null || typeof v3 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v3) && !Number.isNaN(Date.parse(v3));
  for (const s3 of subs) {
    const where = `\u30B5\u30D6 ${s3.id}`;
    if (ids.has(s3.id)) errors.push(`${where}: id \u304C\u91CD\u306A\u3063\u3066\u3044\u307E\u3059`);
    ids.add(s3.id);
    if (!s3.summary.trim()) errors.push(`${where}: summary \u304C\u3042\u308A\u307E\u305B\u3093`);
    if (!STATUSES.includes(s3.status)) errors.push(`${where}: status \u306F ${STATUSES.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${s3.status}`);
    for (const [key, value] of [
      ["start", s3.start],
      ["end", s3.end],
      ["scheduled", s3.scheduled]
    ]) {
      if (!isDate(value)) errors.push(`${where}: ${key} \u304C YYYY-MM-DD \u306E\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(value)}`);
    }
    if (s3.start !== null && s3.end !== null && s3.end < s3.start) errors.push(`${where}: end \u304C start \u3088\u308A\u524D\u3067\u3059`);
    if (s3.estimated !== null && !(typeof s3.estimated === "number" && Number.isFinite(s3.estimated) && s3.estimated >= 0)) errors.push(`${where}: estimated \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    if (s3.status === "delegated" && s3.delegatedTo === null) errors.push(`${where}: delegated \u306B\u306F delegated_to \u304C\u8981\u308A\u307E\u3059`);
    if (s3.delegatedTo !== null) {
      if (!memberIds.has(s3.delegatedTo)) errors.push(`${where}: delegated_to \u306E ${s3.delegatedTo} \u304C\u3042\u308A\u307E\u305B\u3093`);
      if (s3.status !== "delegated") errors.push(`${where}: delegated_to \u306F status \u304C delegated \u306E\u3068\u304D\u3060\u3051\u4ED8\u3051\u3089\u308C\u307E\u3059`);
    }
    for (const d3 of s3.dependsOn) {
      if (d3 === s3.id) errors.push(`${where}: depends_on \u306B\u81EA\u5206\u81EA\u8EAB\u306F\u5165\u308C\u3089\u308C\u307E\u305B\u3093`);
      else if (!byId.has(d3)) errors.push(`${where}: depends_on \u306E ${d3} \u304C\u540C\u3058 issue \u306E\u4E2D\u306B\u3042\u308A\u307E\u305B\u3093`);
    }
    try {
      formatSubIssue(s3);
    } catch (e3) {
      errors.push(`${where}: ${e3.message}`);
    }
  }
  for (const s3 of subs) {
    const seen = /* @__PURE__ */ new Set();
    const stack2 = s3.dependsOn.filter((d3) => d3 !== s3.id);
    let cycle = false;
    while (stack2.length > 0 && !cycle) {
      const id = stack2.pop();
      if (id === s3.id) cycle = true;
      else if (!seen.has(id)) {
        seen.add(id);
        stack2.push(...byId.get(id)?.dependsOn ?? []);
      }
    }
    if (cycle) errors.push(`\u30B5\u30D6 ${s3.id}: depends_on \u304C\u5FAA\u74B0\u3057\u3066\u3044\u307E\u3059`);
  }
  return errors;
}
function newSubIssueInput(item, id, created) {
  return {
    id,
    summary: String(item.summary ?? "").trim(),
    status: item.status ?? "open",
    delegatedTo: item.delegatedTo ?? null,
    start: item.start ?? null,
    end: item.end ?? null,
    scheduled: item.scheduled ?? null,
    estimated: item.estimated ?? null,
    dependsOn: item.dependsOn ?? [],
    created,
    migratedFrom: null,
    body: item.body ?? ISSUE_BODY_TEMPLATE
  };
}
function dependentsOf(subs, id) {
  return subs.filter((s3) => s3.dependsOn.includes(id)).map((s3) => s3.id);
}
var isDone2 = (s3) => s3.status === "closed" || s3.status === "canceled";
function becomesDone(from, to) {
  return !isDone2({ status: from }) && isDone2({ status: to });
}
function visibleSubs(subs, showClosed) {
  return showClosed ? [...subs] : subs.filter((s3) => !isDone2(s3));
}
function subCounts(subs) {
  const closed = subs.filter(isDone2).length;
  return { open: subs.length - closed, total: subs.length, closed };
}
var shortDate = (d3) => `${d3.slice(5, 7)}/${d3.slice(8, 10)}`;
function subItemPatch(draft, estimated) {
  return {
    summary: draft.summary.trim(),
    status: draft.status,
    delegatedTo: draft.delegatedTo,
    start: draft.start,
    end: draft.end,
    scheduled: draft.scheduled,
    estimated,
    dependsOn: draft.dependsOn
  };
}
function subHint(sub, today) {
  if (sub.start !== null || sub.end !== null) return `${sub.start ? shortDate(sub.start) : ""}\u2013${sub.end ? shortDate(sub.end) : ""}`;
  if (sub.scheduled !== null && sub.scheduled >= today) return shortDate(sub.scheduled);
  return null;
}
function dropPosition(ids, dragged, before) {
  const from = ids.indexOf(dragged);
  if (from < 0) return null;
  const rest = ids.filter((_2, i3) => i3 !== from);
  const to = before === null ? rest.length : rest.indexOf(before);
  if (to < 0 || to === from) return null;
  return to;
}
function stepPosition(ids, visible, id, dir) {
  const at = visible.indexOf(id);
  const neighbor = visible[at + dir];
  if (at < 0 || neighbor === void 0) return null;
  const from = ids.indexOf(id);
  const rest = ids.filter((_2, i3) => i3 !== from);
  const n2 = rest.indexOf(neighbor);
  const to = dir < 0 ? n2 : n2 + 1;
  return to === from ? null : to;
}
function splitQuickAdd(text) {
  return text.split(/\r?\n/).map((l3) => l3.trim()).filter((l3) => l3 !== "");
}
function layoutSubIssues(path, parent, text, parseYaml5) {
  const { head, blocks } = splitSubIssueText(text);
  const parsed = parseSubIssues(path, parent, text, parseYaml5).blocks;
  const out = [];
  let pos = head.length;
  let line = head.split("\n").length - 1;
  blocks.forEach((raw, index) => {
    const lines = raw.split("\n");
    const lineEnd = (i3) => lines[i3].replace(/\r$/, "").length;
    const startOf2 = (i3) => lines.slice(0, i3).reduce((n2, l3) => n2 + l3.length + 1, 0);
    const endIdx = lines.findIndex((l3, i3) => i3 > 0 && l3.trim() === BLOCK_END);
    const id = parsed[index]?.sub?.id ?? null;
    if (endIdx < 0) {
      out.push({ index, id, startLine: line, endLine: null, bodyStartLine: line + 1, bodyEndLine: line, from: pos, cardTo: null, bodyFrom: null, bodyTo: null });
    } else {
      let last = lines.length - 1;
      while (last > endIdx && lines[last].trim() === "") last--;
      const bodyFrom = Math.min(pos + startOf2(endIdx + 1), pos + raw.length);
      out.push({
        index,
        id,
        startLine: line,
        endLine: line + endIdx,
        bodyStartLine: line + endIdx + 1,
        bodyEndLine: line + last,
        from: pos,
        cardTo: pos + startOf2(endIdx) + lineEnd(endIdx),
        bodyFrom,
        bodyTo: last > endIdx ? pos + startOf2(last) + lineEnd(last) : bodyFrom
      });
    }
    pos += raw.length;
    line += lines.length - 1;
  });
  return out;
}
function subHeadChange(path, parent, text, id, patch, parseYaml5, memberIds) {
  const all = layoutSubIssues(path, parent, text, parseYaml5);
  const layout = all.find((b2) => b2.id === id);
  const { subs } = parseSubIssues(path, parent, text, parseYaml5);
  const before = subs.find((s3) => s3.id === id);
  if (!layout || !before || layout.cardTo === null) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${subKey(parent, id)}`);
  const fixed = normalizeSubPatch(reopenSubOnPeriod(before.status, patch));
  const after = { ...before, ...fixed, id };
  const errors = touchedSubErrors(
    subs.map((s3) => s3.id === id ? after : s3),
    [id],
    memberIds
  );
  if (errors.length > 0) throw new Error(errors.join("\n"));
  const head = formatSubHead(after);
  const change = { from: layout.from, to: layout.cardTo, insert: head };
  const next = all[layout.index + 1];
  if (!becomesDone(before.status, after.status) || next === void 0) return { change, changes: [change], before, after };
  const sep = text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
  const moved = `${sep}${head}${text.slice(layout.cardTo, next.from)}`;
  return {
    change,
    changes: [
      { from: layout.from, to: next.from, insert: "" },
      { from: text.length, to: text.length, insert: moved.endsWith("\n") ? moved : `${moved}
` }
    ],
    before,
    after
  };
}
function subSectionRole(layout, lineStart, lineEnd) {
  for (const b2 of layout) {
    if (lineStart <= b2.startLine && b2.startLine <= lineEnd) return { role: "card", index: b2.index, id: b2.id };
    if (b2.endLine !== null && lineStart > b2.startLine && lineStart <= b2.endLine) return { role: "hide" };
  }
  for (let i3 = layout.length - 1; i3 >= 0; i3--) {
    const b2 = layout[i3];
    if (b2.endLine !== null && lineStart > b2.endLine && lineStart > b2.startLine) {
      return b2.id === null ? { role: "none" } : { role: "body", id: b2.id };
    }
  }
  return { role: "none" };
}
function cursorInside(sel, from, to) {
  return sel.from === sel.to ? sel.from > from && sel.from < to : sel.to > from && sel.from < to;
}
function sanitizeSubOpen(value) {
  const out = {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) return out;
  for (const [path, ids] of Object.entries(value)) {
    if (!Array.isArray(ids)) continue;
    const valid = ids.filter(isSubId);
    if (valid.length > 0) out[path] = [...new Set(valid)];
  }
  return out;
}
function isSubOpen(map, path, id) {
  return map[path]?.includes(id) ?? false;
}
function toggleSubOpen(map, path, id, existing) {
  const alive = new Set(existing);
  const current = (map[path] ?? []).filter((x2) => alive.has(x2));
  const next = current.includes(id) ? current.filter((x2) => x2 !== id) : [...current, id];
  const { [path]: _drop, ...rest } = map;
  return next.length === 0 ? rest : { ...rest, [path]: next };
}
function touchedSubErrors(subs, touched, memberIds) {
  return checkSubIssues(subs, memberIds).filter((e3) => touched.some((id) => e3.startsWith(`\u30B5\u30D6 ${id}: `)));
}
function normalizeSubPatch(patch) {
  return patch.status !== void 0 && patch.status !== "delegated" && patch.delegatedTo === void 0 ? { ...patch, delegatedTo: null } : patch;
}
function dependsChip(candidates, dependsOn) {
  const picked = candidates.filter((s3) => dependsOn.includes(s3.id));
  if (picked.length === 0) return { text: "None", title: null, empty: true };
  const title = picked.map((s3) => s3.summary).join("\n");
  return { text: picked.length === 1 ? picked[0].summary : `${picked.length} sub-issues`, title, empty: false };
}
function toggleDepends(dependsOn, id) {
  return dependsOn.includes(id) ? dependsOn.filter((d3) => d3 !== id) : [...dependsOn, id];
}

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
    const sub = o3.sub === void 0 || o3.sub === null ? null : o3.sub;
    if (sub !== null && !isSubId(sub)) return problem(line, "invalid-worklog", "sub \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
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
      sub,
      from: o3.from,
      to: toMs === null ? null : o3.to,
      description: typeof o3.description === "string" ? o3.description : "",
      fromMs,
      toMs
    });
  });
  return { entries, problems };
}
function serializeWorklogEntry(e3) {
  return JSON.stringify({ id: e3.id, task_id: e3.taskId, ...e3.sub ? { sub: e3.sub } : {}, from: e3.from, to: e3.to, description: e3.description });
}
function workKey(e3) {
  return e3.sub ? `${e3.taskId}#${e3.sub}` : e3.taskId;
}
function workTarget(key) {
  const parsed = parseSubKey(key);
  return parsed ? { taskId: parsed.parent, sub: parsed.id } : { taskId: key, sub: null };
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
  else lines[i3] = serializeWorklogEntry({ id: entry.id, taskId: entry.taskId, sub: entry.sub ?? null, ...next });
  return lines.join("\n");
}
var MIN_WORKLOG_MS = 6e4;
function stopWorklogLines(text, entries, to, toMs) {
  return [...entries].sort((a3, b2) => b2.line - a3.line).reduce((t3, e3) => replaceWorklogLine(t3, e3, toMs - e3.fromMs < MIN_WORKLOG_MS ? null : { from: e3.from, to, description: e3.description }), text);
}
function newWorklogId(random = Math.random) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return `wl_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}
function appendWorklogLine(text, line) {
  return `${text}${text.length > 0 && !text.endsWith("\n") ? "\n" : ""}${line}
`;
}

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
var IGNORED = "ignored";
function parseOp(o3) {
  const task = typeof o3.task === "string" && o3.task ? o3.task : null;
  switch (o3.op) {
    case "add":
    case "remove":
    case "carry":
      return task ? { op: o3.op, task } : null;
    case "place":
      return IGNORED;
    case "star":
      return task && typeof o3.on === "boolean" ? { op: "star", task, on: o3.on } : null;
    case "routine":
      return task && (o3.result === null || o3.result === "closed" || o3.result === "canceled") ? { op: "routine", task, result: o3.result } : null;
    case "close":
      return Array.isArray(o3.tasks) && o3.tasks.every((id) => typeof id === "string" && id) ? { op: "close", tasks: o3.tasks } : null;
    case "reopen":
      return { op: "reopen" };
    case "order":
      if ("group" in o3) return IGNORED;
      return Array.isArray(o3.tasks) && o3.tasks.every((id) => typeof id === "string" && id) ? { op: "order", tasks: o3.tasks } : null;
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
    if (op === IGNORED) return;
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
      board.stars = board.stars.filter((id) => id !== op.task);
      break;
    case "star":
      board.stars = board.stars.filter((id) => id !== op.task);
      if (op.on) board.stars.push(op.task);
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
    case "order":
      break;
  }
}
function renameBoardOp(op, rename) {
  switch (op.op) {
    case "close":
      return { op: "close", tasks: op.tasks.map(rename) };
    case "order":
      return { op: "order", tasks: op.tasks.map(rename) };
    case "reopen":
      return op;
    default:
      return { ...op, task: rename(op.task) };
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
function removedTasks(entries) {
  const last = /* @__PURE__ */ new Map();
  for (const e3 of [...entries].sort(compareEntries)) {
    if (e3.op.op === "add" || e3.op.op === "remove") last.set(e3.op.task, e3.op.op);
  }
  return [...last].filter(([, op]) => op === "remove").map(([id]) => id);
}
function orderHistory(entries) {
  const records = [];
  for (const e3 of [...entries].sort(compareEntries)) {
    if (e3.op.op === "order") records.push({ date: e3.date, atMs: e3.atMs, tasks: e3.op.tasks });
  }
  return records.sort((a3, b2) => a3.date !== b2.date ? a3.date.localeCompare(b2.date) : a3.atMs - b2.atMs);
}
function lastOrder(history, date) {
  let found;
  for (const r3 of history) {
    if (r3.date > date) break;
    found = r3.tasks;
  }
  return found;
}

// src/core/status-log.ts
var STATUS_VIAS = ["ui", "timer", "undo", "mcp"];
var STATUS_LOG_PATH_RE = /^statuslog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;
function statusLogPath(device, at) {
  const safe = sanitizeDeviceName(device);
  if (!safe) throw new Error("\u7AEF\u672B\u540D\u304C\u7A7A\u3067\u3059");
  const month = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
  return `statuslog/${safe}/${month}.jsonl`;
}
function newStatusLogId(random = Math.random) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return `st_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}
function serializeStatusLogEntry(e3) {
  return JSON.stringify({ id: e3.id, at: e3.at, task: e3.task, ...e3.sub ? { sub: e3.sub } : {}, from: e3.from, to: e3.to, via: e3.via });
}
function statusLogLine(task, from, to, via, at, random = Math.random, sub = null) {
  if (from === to) return null;
  return serializeStatusLogEntry({ id: newStatusLogId(random), at: at.toISOString(), task, sub, from, to, via });
}
var isStatus = (v3) => typeof v3 === "string" && STATUSES.includes(v3);
function parseStatusLog(path, text) {
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
    if (typeof o3.id !== "string" || !o3.id) return problem(line, "invalid-status-log", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    const atMs = typeof o3.at === "string" ? Date.parse(o3.at) : Number.NaN;
    if (Number.isNaN(atMs)) return problem(line, "invalid-status-log", "at \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (typeof o3.task !== "string" || !o3.task) return problem(line, "invalid-status-log", "task \u304C\u3042\u308A\u307E\u305B\u3093");
    const sub = o3.sub === void 0 || o3.sub === null ? null : o3.sub;
    if (sub !== null && !isSubId(sub)) return problem(line, "invalid-status-log", "sub \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (!isStatus(o3.from) || !isStatus(o3.to)) return problem(line, "invalid-status-log", "from / to \u304C status \u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const via = STATUS_VIAS.includes(o3.via) ? o3.via : null;
    if (via === null) return problem(line, "invalid-status-log", "via \u304C\u4E0D\u6B63\u3067\u3059");
    entries.push({ path, line, id: o3.id, at: o3.at, atMs, task: o3.task, sub, from: o3.from, to: o3.to, via });
  });
  return { entries, problems };
}
function compareStatusLog(a3, b2) {
  if (a3.atMs !== b2.atMs) return a3.atMs - b2.atMs;
  if (a3.path !== b2.path) return a3.path < b2.path ? -1 : 1;
  return a3.line - b2.line;
}
function isIssueStatusLog(e3) {
  return !e3.sub;
}
function statusBefore(logs, task, current) {
  for (let i3 = logs.length - 1; i3 >= 0; i3--) {
    const e3 = logs[i3];
    if (e3.task !== task || !isIssueStatusLog(e3)) continue;
    return e3.to === current && e3.from !== current ? e3.from : null;
  }
  return null;
}
function closedAtMap(logs, closedIds) {
  const ids = new Set(closedIds);
  const out = /* @__PURE__ */ new Map();
  for (const e3 of logs) if (ids.has(e3.task) && isIssueStatusLog(e3) && e3.to === "closed") out.set(e3.task, e3.atMs);
  return out;
}
function isDoneStatus(status) {
  return status === "closed" || status === "canceled";
}

// src/core/daily.ts
var byDate = (key) => (a3, b2) => (a3[key] ?? "").localeCompare(b2[key] ?? "") || a3.id.localeCompare(b2.id, "en", { numeric: true });
function deadIssues(issues, today) {
  const deadline = [];
  const softDeadline = [];
  for (const i3 of issues) {
    if (!isActive(i3)) continue;
    if (i3.deadline !== null && i3.deadline < today) deadline.push(i3);
    if (i3.softDeadline !== null && i3.softDeadline < today) softDeadline.push(i3);
  }
  return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}
function cautionIssues(issues, today, days = 3) {
  const within = (d3) => d3 !== null && diffDays(d3, today) >= 0 && diffDays(d3, today) <= days;
  const deadline = [];
  const softDeadline = [];
  for (const i3 of issues) {
    if (!isActive(i3)) continue;
    if (within(i3.deadline)) deadline.push(i3);
    if (within(i3.softDeadline)) softDeadline.push(i3);
  }
  return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}
function scheduledOn(issues, date, exclude = /* @__PURE__ */ new Set()) {
  return [...issues].filter((i3) => isActive(i3) && i3.scheduled === date && !exclude.has(i3.id)).sort((a3, b2) => a3.id.localeCompare(b2.id, "en", { numeric: true }));
}
function missedIssues(issues, today) {
  return [...issues].filter((i3) => isActive(i3) && i3.scheduled !== null && i3.scheduled < today).sort((a3, b2) => a3.scheduled.localeCompare(b2.scheduled) || a3.id.localeCompare(b2.id, "en", { numeric: true }));
}
function missedSubs(index, today) {
  return index.data.subIssues.filter((s3) => isActive(s3) && s3.scheduled !== null && s3.scheduled < today && index.sub(s3.key) === s3).sort((a3, b2) => a3.scheduled.localeCompare(b2.scheduled) || a3.key.localeCompare(b2.key, "en", { numeric: true }));
}
function subDue(index, hit) {
  return index.data.subIssues.filter((s3) => isActive(s3) && index.sub(s3.key) === s3 && s3.end !== null && hit(s3.end)).sort((a3, b2) => a3.end.localeCompare(b2.end) || a3.key.localeCompare(b2.key, "en", { numeric: true }));
}
function deadSubs(index, today) {
  return subDue(index, (d3) => d3 < today);
}
function cautionSubs(index, today, days = 3) {
  return subDue(index, (d3) => diffDays(d3, today) >= 0 && diffDays(d3, today) <= days);
}
function currentStep(steps, counts, passed, manual) {
  const last = steps[steps.length - 1];
  if (manual !== null && (manual === last || counts[manual] > 0)) return manual;
  return steps.find((s3) => s3 !== last && counts[s3] > 0 && !passed.has(s3)) ?? last;
}
var priorityRank = (p3) => p3 === null ? PRIORITIES.length : PRIORITIES.indexOf(p3);
var nullsLast = (a3, b2) => a3 === b2 ? 0 : a3 === null ? 1 : b2 === null ? -1 : a3.localeCompare(b2);
var byPick = (a3, b2) => priorityRank(a3.priority) - priorityRank(b2.priority) || nullsLast(a3.deadline, b2.deadline) || nullsLast(a3.reviewed ?? "", b2.reviewed ?? "") || a3.id.localeCompare(b2.id, "en", { numeric: true });
function pickCandidates(index, today, board) {
  const on = new Set(board.issues);
  const groups = /* @__PURE__ */ new Map();
  const withNext = /* @__PURE__ */ new Set();
  for (const s3 of index.data.subIssues) {
    if (index.sub(s3.key) !== s3) continue;
    if (!index.nextSub(s3, today)) continue;
    withNext.add(s3.parent);
    if (on.has(s3.key)) continue;
    groups.set(s3.parent, [...groups.get(s3.parent) ?? [], s3]);
  }
  const projects = new Set(index.data.subIssues.filter((s3) => index.sub(s3.key) === s3).map((s3) => s3.parent));
  const issues = [...index.issues.values()].filter((i3) => !on.has(i3.id) && !projects.has(i3.id) && index.next(i3, today)).sort(byPick);
  const stalled = [...projects].map((id) => index.issues.get(id)).filter((i3) => i3 !== void 0 && index.next(i3, today) && !withNext.has(i3.id) && !hasFuturePeriod(index.subs(i3.id), today)).sort(byPick);
  return {
    stalled,
    issues,
    groups: [...groups.entries()].map(([id, subs]) => ({ parent: index.issues.get(id), subs: subs.sort((a3, b2) => a3.order - b2.order) })).sort((a3, b2) => byPick(a3.parent, b2.parent))
  };
}
function hasFuturePeriod(subs, today) {
  return subs.some((s3) => !isDoneStatus(s3.status) && (s3.start ?? s3.end) !== null && (s3.start ?? s3.end) > today);
}
function allSubsDone(subs) {
  return subs.length > 0 && subs.every((s3) => isDoneStatus(s3.status));
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
  return { issues: [], subIssues: [], routines: [], members: [], labels: [], presets: [], worklogs: [], boards: [], statusLogs: [], orders: [] };
}
var INACTIVE_STATUSES = ["closed", "canceled", "someday"];
function isActive(issue) {
  return !INACTIVE_STATUSES.includes(issue.status);
}
function ticklerReleased(issue, today, planned) {
  return planned && issue.tickler !== null && issue.tickler <= today;
}
function isInbox(issue, today, planned = false) {
  if (issue.status !== "open") return false;
  if (issue.tickler !== null) return issue.tickler <= today && !planned;
  return !issue.clarified;
}
function isNext(issue, today, planned = false) {
  const released = today !== void 0 && issue.status === "open" && ticklerReleased(issue, today, planned);
  const ready = issue.status === "in-progress" || issue.status === "open" && (issue.clarified || released);
  return ready && issue.scheduled === null && (issue.tickler === null || released);
}
function gtdList(issue, today, planned = false) {
  if (issue.status !== "open" && issue.status !== "in-progress") return null;
  if (isInbox(issue, today, planned)) return "inbox";
  if (isNext(issue, today, planned)) return "next";
  if (issue.scheduled !== null) return "calendar";
  if (issue.tickler !== null && issue.tickler > today) return "tickler";
  return null;
}
function hasPlannedSubs(subs) {
  return subs.some((s3) => s3.status !== "closed" && s3.status !== "canceled" && (s3.start !== null || s3.end !== null));
}
function inPeriod(sub, today) {
  const start = sub.start ?? sub.end;
  const end = sub.end ?? sub.start;
  return start !== null && end !== null && start <= today && today <= end;
}
function nextSubApartFromPeriod(sub, parent, today, parentPlanned) {
  return (sub.status === "open" || sub.status === "in-progress") && sub.scheduled === null && parent !== void 0 && isNext(parent, today, parentPlanned);
}
function isNextSub(sub, parent, today, parentPlanned = false) {
  return nextSubApartFromPeriod(sub, parent, today, parentPlanned) && inPeriod(sub, today);
}
function needsPeriod(sub, parent, today, parentPlanned = false) {
  return nextSubApartFromPeriod(sub, parent, today, parentPlanned) && !inPeriod(sub, today);
}
function isWatchStatus(status) {
  return status === "waiting" || status === "delegated";
}
function isScheduledAhead(issue, today) {
  return isActive(issue) && issue.scheduled !== null && issue.scheduled >= today;
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
function organizeQueue(issues, today, planned = () => false) {
  const inbox = [];
  const revisitDue = [];
  for (const issue of issues) {
    if (isInbox(issue, today, planned(issue.id))) inbox.push(issue);
    else if (issue.status === "someday" && issue.revisit !== null && issue.revisit <= today) revisitDue.push(issue);
  }
  inbox.sort((a3, b2) => compareNullableAsc(a3.created, b2.created));
  revisitDue.sort((a3, b2) => compareNullableAsc(a3.revisit, b2.revisit));
  return [...inbox, ...revisitDue];
}
var TaskIndex = class {
  constructor(data) {
    this.data = data;
    for (const i3 of data.issues) if (!this.issues.has(i3.id)) this.issues.set(i3.id, i3);
    for (const r3 of data.routines) if (!this.routines.has(r3.id)) this.routines.set(r3.id, r3);
    for (const m3 of data.members) if (!this.members.has(m3.id)) this.members.set(m3.id, m3);
    for (const i3 of data.issues) this.issuesByPath.set(i3.path, i3);
    for (const sub of data.subIssues) {
      if (this.subsByKey.has(sub.key)) continue;
      this.subsByKey.set(sub.key, sub);
      const list = this.subsOf.get(sub.parent) ?? [];
      list.push(sub);
      this.subsOf.set(sub.parent, list);
    }
  }
  data;
  issues = /* @__PURE__ */ new Map();
  routines = /* @__PURE__ */ new Map();
  members = /* @__PURE__ */ new Map();
  issuesByPath = /* @__PURE__ */ new Map();
  subsOf = /* @__PURE__ */ new Map();
  subsByKey = /* @__PURE__ */ new Map();
  /** その issue のサブ（md に書いた順。ADR-0135） */
  subs(parentId) {
    return this.subsOf.get(parentId) ?? [];
  }
  /** サブを 1 つでも持つ issue（Project）か。サブの status は見ない（ADR-0203, 0210） */
  isProject(id) {
    return this.subs(id).length > 0;
  }
  /** 計画済みの Project か: 閉じていないサブに期間がある（ADR-0210） */
  planned(id) {
    return hasPlannedSubs(this.subs(id));
  }
  /** Inbox か（索引のサブで、Tickler の日を迎えた計画済みの Project を除く。ADR-0210） */
  inbox(issue, today) {
    return isInbox(issue, today, this.planned(issue.id));
  }
  /** Next Action か（ADR-0210 の Tickler の例外を含む） */
  next(issue, today) {
    return isNext(issue, today, this.planned(issue.id));
  }
  /** サブの Next（親の Tickler の例外を含む。ADR-0203, 0210） */
  nextSub(sub, today) {
    return isNextSub(sub, this.issues.get(sub.parent), today, this.planned(sub.parent));
  }
  /** GTD の分類（ADR-0210） */
  list(issue, today) {
    return gtdList(issue, today, this.planned(issue.id));
  }
  /** 合成キー `i-12#k3f9a2` のサブ */
  sub(key) {
    return this.subsByKey.get(key);
  }
  /** 移行で子の issue から変換したサブ（元の ID → サブ。ADR-0135） */
  migrated(oldId) {
    if (this.issues.has(oldId)) return void 0;
    return this.data.subIssues.find((s3) => s3.migratedFrom === oldId);
  }
  /** 按分後の実績（分）。タスクの ID ごと（ADR-0005）。親の issue は、親に直接付けた行とサブの行の合計（ADR-0135） */
  effortMinutes(now) {
    const ms = prorateEffort(this.data.worklogs, now);
    return new Map([...ms].map(([id, v3]) => [id, v3 / 6e4]));
  }
  /**
   * 按分後の実績（分）。記録の鍵（workKey）ごと: サブは合成キー、親の ID は親に直接付けた行だけ（ADR-0135）。
   * 按分は同時に動いている区間の数で割るので、親の ID とそのサブの合計は effortMinutes の親の値と同じ
   */
  effortByKey(now) {
    const ms = prorateEffort(this.data.worklogs.map((l3) => ({ taskId: workKey(l3), fromMs: l3.fromMs, toMs: l3.toMs })), now);
    return new Map([...ms].map(([key, v3]) => [key, v3 / 6e4]));
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
  /**
   * その日のボードに自動で載せる issue の ID とサブの合成キー（ADR-0034, 0137）:
   * その日が実行日で active で、まだ載っておらず、その日に外してもいないもの。issue（ID の順）→ サブ（親の md の順）
   */
  toAutoAdd(date) {
    const daily = this.board(date);
    const skip = /* @__PURE__ */ new Set([...daily?.board.issues ?? [], ...daily?.removed ?? []]);
    const subs = this.data.subIssues.filter((s3) => isActive(s3) && s3.scheduled === date && !skip.has(s3.key) && this.subsByKey.get(s3.key) === s3);
    return [...scheduledOn(this.issues.values(), date, skip).map((i3) => i3.id), ...subs.map((s3) => s3.key)];
  }
  /** ボードの並び（ADR-0114, 0137）。その日までで最後に並べたもの。なければ undefined */
  order(date) {
    return lastOrder(this.data.orders, date);
  }
  /** 記録中（to が空）の worklog。鍵（workKey）の完全一致で選ぶ: 親の ID なら親に直接付けた記録だけ（ADR-0135） */
  running(key) {
    return this.data.worklogs.filter((l3) => l3.toMs === null && (key === void 0 || workKey(l3) === key));
  }
  /** issue が今の status になる前の status（記録から。分からなければ null。ADR-0031） */
  statusBefore(id) {
    const issue = this.issues.get(id);
    return issue ? statusBefore(this.data.statusLogs, id, issue.status) : null;
  }
  /** closed / canceled からの ↩ の戻る先（ADR-0183）。key は issue の ID かサブの合成キー。分からなければ open */
  reopenStatus(key) {
    const sub = parseSubKey(key);
    return sub ? reopenStatus(this.data.statusLogs, sub.parent, sub.id) : reopenStatus(this.data.statusLogs, key);
  }
  /** その issue の最後の status の記録 */
  lastStatusLog(id) {
    const logs = this.data.statusLogs;
    for (let i3 = logs.length - 1; i3 >= 0; i3--) if (logs[i3].task === id && isIssueStatusLog(logs[i3])) return logs[i3];
    return void 0;
  }
  /** 今 closed の issue を、最後に closed にした時刻（ミリ秒。記録にあるものだけ。ADR-0031） */
  closedAt() {
    const closed = [...this.issues.values()].filter((i3) => i3.status === "closed").map((i3) => i3.id);
    return closedAtMap(this.data.statusLogs, closed);
  }
  routinesOn(date) {
    return [...this.routines.values()].filter((r3) => routineOccursOn(r3, date));
  }
};
function sidebarCounts(index, today) {
  const issues = [...index.issues.values()];
  const dead = deadIssues(issues, today);
  const deadSub = deadSubs(index, today);
  const missed = missedIssues(issues, today).length + missedSubs(index, today).length;
  const todayBoard = index.board(today)?.board ?? emptyBoard();
  const scheduledToday = index.toAutoAdd(today);
  const todayLeft = unfinished(index, today, todayBoard);
  return {
    // 期限切れ（issue とサブ）・過ぎた Calendar の日（ADR-0150, 0152）・今日の Calendar・今日の未完了。前のボードは数えない（締めは記録だけ。ADR-0189）
    daily: dead.deadline.length + dead.softDeadline.length + deadSub.length + missed + scheduledToday.length + unfinishedCount(todayLeft),
    inbox: issues.filter((i3) => index.inbox(i3, today)).length,
    organize: organizeQueue(issues, today, (id) => index.planned(id)).length,
    scheduled: issues.filter((i3) => isScheduledAhead(i3, today)).length,
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

// ../shared/src/date-input.ts
var pad2 = (n2) => String(n2).padStart(2, "0");
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
function parseTimeInput(input) {
  const m3 = /^(?:(\d{2})(\d{2})|(\d{1,2}):(\d{2}))$/.exec(input.trim());
  if (!m3) return null;
  const hour = Number(m3[1] ?? m3[3]);
  const minute = Number(m3[2] ?? m3[4]);
  if (hour > 23 || minute > 59) return null;
  return `${pad2(hour)}:${pad2(minute)}`;
}
function localDateOf(ms) {
  const d3 = new Date(ms);
  return `${d3.getFullYear()}-${pad2(d3.getMonth() + 1)}-${pad2(d3.getDate())}`;
}
function composeDateTime(date, time) {
  const [y3, mo, d3] = date.split("-").map(Number);
  const [h3, mi] = time.split(":").map(Number);
  const t3 = new Date(y3, mo - 1, d3, h3, mi, 0, 0);
  return t3.getHours() === h3 && t3.getMinutes() === mi ? t3.getTime() : null;
}
function resolveTimeOnly(time, opts) {
  const rule = opts.timeOnly ?? { kind: "today" };
  if (rule.kind === "after") {
    const base = localDateOf(rule.baseMs);
    const same2 = composeDateTime(base, time);
    return same2 !== null && same2 > rule.baseMs ? same2 : composeDateTime(addDays(base, 1), time);
  }
  const today = localDateOf(opts.now);
  const same = composeDateTime(today, time);
  if (rule.kind === "today" || same !== null && same <= opts.now) return same;
  return composeDateTime(addDays(today, -1), time);
}
function parseDateTimeInput(input, opts) {
  const words = input.trim().toLowerCase().split(/\s+/).filter((w3) => w3 !== "");
  const floored = new Date(opts.now);
  floored.setSeconds(0, 0);
  if (words.length === 1) {
    const w3 = words[0];
    if (w3 === "now") return floored.getTime();
    const relative = /^([+-])(?:(\d+)h)?(?:(\d+)m)?$/.exec(w3);
    if (relative && (relative[2] !== void 0 || relative[3] !== void 0)) {
      if (relative[1] === "+" && !opts.allowFuture) return null;
      const minutes = Number(relative[2] ?? 0) * 60 + Number(relative[3] ?? 0);
      return floored.getTime() + (relative[1] === "+" ? 1 : -1) * minutes * 6e4;
    }
    const time = parseTimeInput(w3);
    return time === null ? null : resolveTimeOnly(time, opts);
  }
  if (words.length !== 2) return null;
  const today = localDateOf(opts.now);
  const [a3, b2] = words;
  const timeFirst = parseTimeInput(a3);
  if (timeFirst !== null) {
    const date = parseDateInput(b2, today);
    return date === null ? null : composeDateTime(date, timeFirst);
  }
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(a3)) {
    const date = parseDateInput(a3, today);
    const time = parseTimeInput(b2);
    return date === null || time === null ? null : composeDateTime(date, time);
  }
  return null;
}
var MINUTES_PER_DAY = 24 * 60;
var UNIT_MINUTES = { d: MINUTES_PER_DAY, h: 60, m: 1 };
function parseDurationInput(input) {
  const text = input.trim().toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const min2 = Math.round(Number(text));
    return min2 > 0 ? min2 : null;
  }
  if (!/^(?:\d+(?:\.\d+)?\s*[dhm]\s*)+$/.test(text)) return null;
  const seen = /* @__PURE__ */ new Set();
  let total = 0;
  for (const m3 of text.matchAll(/(\d+(?:\.\d+)?)\s*([dhm])/g)) {
    const unit = m3[2];
    if (seen.has(unit)) return null;
    seen.add(unit);
    total += Number(m3[1]) * UNIT_MINUTES[unit];
  }
  const min = Math.round(total);
  return min > 0 ? min : null;
}
function formatDateTimeValue(ms) {
  const d3 = new Date(ms);
  return `${localDateOf(ms)} ${pad2(d3.getHours())}:${pad2(d3.getMinutes())}`;
}
function formatDateLabel(date) {
  return `${date} ${WEEKDAY_NAMES[weekdayOf(date)].toUpperCase()}`;
}
function formatDateTimeLabel(ms) {
  const value = formatDateTimeValue(ms);
  return `${formatDateLabel(value.slice(0, 10))} ${value.slice(11)}`;
}
var DATE_INPUT_EXAMPLES = "e.g. 15 / 1224 / +1d / fri / +2w / +mo / tomorrow";
var DATETIME_INPUT_EXAMPLES = "e.g. 2200 / -22m / 2200 -1d / 0930 fri / now";
var DATE_INPUT_ERROR = "\u65E5\u4ED8\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093";
var DATETIME_INPUT_ERROR = "\u65E5\u6642\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093";

// src/core/format.ts
var MINUTES_PER_DAY2 = 24 * 60;
function formatMinutes(minutes) {
  const sign = minutes < 0 ? "-" : "";
  let rest = Math.round(Math.abs(minutes));
  const d3 = Math.floor(rest / MINUTES_PER_DAY2);
  rest -= d3 * MINUTES_PER_DAY2;
  const h3 = Math.floor(rest / 60);
  const m3 = rest - h3 * 60;
  const parts = [d3 ? `${d3}d` : "", h3 ? `${h3}h` : "", m3 ? `${m3}m` : ""].join("");
  return sign + (parts || "0m");
}

// src/core/timeline.ts
var DAY_PX = { day: 28, week: 8 };
var PAD_DAYS = 2;
var MIN_DAYS = 14;
var MIN_WEEKS = 8;
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var minDate = (dates) => dates.reduce((a3, b2) => b2 < a3 ? b2 : a3);
var maxDate = (dates) => dates.reduce((a3, b2) => b2 > a3 ? b2 : a3);
function timelineRange(subs, today, scale) {
  const dates = [today];
  for (const s3 of subs) {
    for (const d3 of [s3.start, s3.end, s3.scheduled]) if (d3) dates.push(d3);
  }
  let from = addDays(minDate(dates), -PAD_DAYS);
  let to = addDays(maxDate(dates), PAD_DAYS);
  if (scale === "week") {
    from = addDays(from, -weekdayOf(from));
    to = addDays(to, 6 - weekdayOf(to));
  }
  const days = Math.max(diffDays(to, from) + 1, scale === "week" ? MIN_WEEKS * 7 : MIN_DAYS);
  return { from, days };
}
function timelineColumns(range, scale) {
  const out = [];
  const step = scale === "week" ? 7 : 1;
  let prevMonth = -1;
  for (let i3 = 0; i3 < range.days; i3 += step) {
    const date = addDays(range.from, i3);
    const month = Number(date.slice(5, 7)) - 1;
    const day = Number(date.slice(8, 10));
    const wd = weekdayOf(date);
    const showMonth = i3 === 0 || (scale === "day" ? day === 1 : month !== prevMonth);
    out.push({
      date,
      label: scale === "week" ? `${month + 1}/${day}` : String(day),
      month: showMonth ? MONTHS[month] : null,
      weekend: scale === "day" && (wd === 0 || wd === 6),
      weekStart: wd === 0,
      span: Math.min(step, range.days - i3)
    });
    prevMonth = month;
  }
  return out;
}
function dayOffset(range, date) {
  return diffDays(date, range.from);
}
function dateAtX(range, x2, scale) {
  const i3 = Math.min(range.days - 1, Math.max(0, Math.floor(x2 / DAY_PX[scale])));
  return addDays(range.from, i3);
}
function barOf(sub) {
  const a3 = sub.start ?? sub.end;
  const b2 = sub.end ?? sub.start;
  if (a3 === null || b2 === null) return null;
  return a3 <= b2 ? { start: a3, end: b2 } : { start: b2, end: a3 };
}
function dragBar(bar, mode, delta) {
  if (mode === "move") return { start: addDays(bar.start, delta), end: addDays(bar.end, delta) };
  if (mode === "start") {
    const start = addDays(bar.start, delta);
    return { start: start > bar.end ? bar.end : start, end: bar.end };
  }
  const end = addDays(bar.end, delta);
  return { start: bar.start, end: end < bar.start ? bar.start : end };
}
function dependencyArrows(subs) {
  const bars = new Map(subs.map((s3) => [s3.id, barOf(s3)]));
  const out = [];
  for (const s3 of subs) {
    const to = bars.get(s3.id);
    if (!to) continue;
    for (const dep of s3.dependsOn) {
      const from = bars.get(dep);
      if (!from || dep === s3.id) continue;
      out.push({ from: dep, to: s3.id, late: to.start < from.end });
    }
  }
  return out;
}
var ARROW_GAP = 8;
var LANE_V = 4;
var BAND_OFFSETS = [0, -3, 3, -6, 6];
var BAR_CLEAR = 4;
function routeArrows(arrows, bars, rowHeight) {
  const mid = (row) => row * rowHeight + rowHeight / 2;
  const maxX = Math.max(0, ...bars.map((b2) => b2?.x1 ?? 0)) + ARROW_GAP * 4;
  const verticals = [];
  const bands = [];
  const columnFree = (x2, rowA, rowB) => {
    for (let r3 = Math.min(rowA, rowB) + 1; r3 < Math.max(rowA, rowB); r3++) {
      const b2 = bars[r3];
      if (b2 && x2 > b2.x0 - BAR_CLEAR && x2 < b2.x1 + BAR_CLEAR) return false;
    }
    return true;
  };
  const verticalFree = (x2, y0, y1, share) => !verticals.some((v3) => !share(v3) && Math.abs(v3.x - x2) < 3 && Math.min(v3.y1, Math.max(y0, y1)) - Math.max(v3.y0, Math.min(y0, y1)) > 1);
  const pickX = (ideal, lo, hi, rowA, rowB, y0, y1, share = () => false) => {
    const limit = Math.max(ideal - lo, hi - ideal);
    for (let d3 = 0; d3 <= limit; d3 += LANE_V) {
      for (const x2 of d3 === 0 ? [ideal] : [ideal - d3, ideal + d3]) {
        if (x2 < lo || x2 > hi) continue;
        if (columnFree(x2, rowA, rowB) && verticalFree(x2, y0, y1, share)) return x2;
      }
    }
    return null;
  };
  const pickBand = (boundary, xa, xb) => {
    const base = boundary * rowHeight;
    const [x0, x1] = [Math.min(xa, xb), Math.max(xa, xb)];
    for (const off of BAND_OFFSETS) {
      const y3 = base + off;
      if (!bands.some((b2) => Math.abs(b2.y - y3) < 2 && Math.min(b2.x1, x1) - Math.max(b2.x0, x0) > 1)) return y3;
    }
    return base;
  };
  const record2 = (points, from, to) => {
    for (let i3 = 1; i3 < points.length; i3++) {
      const [ax, ay] = points[i3 - 1];
      const [bx, by] = points[i3];
      if (ax === bx) verticals.push({ x: ax, y0: Math.min(ay, by), y1: Math.max(ay, by), from, to });
      else if (Math.abs(ay - Math.round(ay / rowHeight) * rowHeight) <= 8 && ay === by) bands.push({ y: ay, x0: Math.min(ax, bx), x1: Math.max(ax, bx) });
    }
  };
  return arrows.map(({ fromRow, toRow }) => {
    const src = bars[fromRow];
    const dst = bars[toRow];
    const x1 = src.x1;
    const y1 = mid(fromRow);
    const x2 = dst.x0;
    const y22 = mid(toRow);
    const down = toRow > fromRow;
    if (x2 - x1 >= ARROW_GAP * 2) {
      const xv = pickX(x2 - ARROW_GAP, x1 + BAR_CLEAR, x2 - BAR_CLEAR, fromRow, toRow, y1, y22, (v3) => v3.to === toRow);
      if (xv !== null) {
        const points2 = [[x1, y1], [xv, y1], [xv, y22], [x2, y22]];
        record2(points2, fromRow, toRow);
        return points2;
      }
    }
    const srcBoundary = down ? fromRow + 1 : fromRow;
    const dstBoundary = down ? toRow : toRow + 1;
    const ySrcBand = srcBoundary * rowHeight;
    const yDstBand = dstBoundary * rowHeight;
    const xa = pickX(x1 + ARROW_GAP, x1 + BAR_CLEAR, x1 + ARROW_GAP * 4, fromRow, fromRow, y1, ySrcBand, (v3) => v3.from === fromRow) ?? x1 + ARROW_GAP;
    const xb = pickX(x2 - ARROW_GAP, x2 - ARROW_GAP * 4, x2 - BAR_CLEAR, toRow, toRow, yDstBand, y22, (v3) => v3.to === toRow) ?? x2 - ARROW_GAP;
    let points;
    if (srcBoundary === dstBoundary) {
      const yb = pickBand(srcBoundary, xa, xb);
      points = [[x1, y1], [xa, y1], [xa, yb], [xb, yb], [xb, y22], [x2, y22]];
    } else {
      const xc = pickX(xb, 0, maxX, fromRow, toRow, ySrcBand, yDstBand) ?? xb;
      const ys = pickBand(srcBoundary, xa, xc);
      const yt = pickBand(dstBoundary, xc, xb);
      points = [[x1, y1], [xa, y1], [xa, ys], [xc, ys], [xc, yt], [xb, yt], [xb, y22], [x2, y22]];
    }
    points = simplify(points);
    record2(points, fromRow, toRow);
    return points;
  });
}
function simplify(points) {
  const out = [];
  for (const p3 of points) {
    const last = out[out.length - 1];
    if (last && last[0] === p3[0] && last[1] === p3[1]) continue;
    const prev = out[out.length - 2];
    if (prev && last && (prev[0] === last[0] && last[0] === p3[0] || prev[1] === last[1] && last[1] === p3[1])) out[out.length - 1] = p3;
    else out.push(p3);
  }
  return out;
}
var num = (n2) => String(Math.round(n2 * 100) / 100);
function roundedPath(points, radius) {
  if (points.length === 0) return "";
  let d3 = `M${num(points[0][0])} ${num(points[0][1])}`;
  for (let i3 = 1; i3 < points.length - 1; i3++) {
    const [px, py] = points[i3 - 1];
    const [cx, cy] = points[i3];
    const [nx, ny] = points[i3 + 1];
    const lenPrev = Math.hypot(cx - px, cy - py);
    const lenNext = Math.hypot(nx - cx, ny - cy);
    const r3 = Math.min(radius, lenPrev / 2, lenNext / 2);
    const ax = cx - (cx - px) / (lenPrev || 1) * r3;
    const ay = cy - (cy - py) / (lenPrev || 1) * r3;
    const bx = cx + (nx - cx) / (lenNext || 1) * r3;
    const by = cy + (ny - cy) / (lenNext || 1) * r3;
    d3 += ` L${num(ax)} ${num(ay)} Q${num(cx)} ${num(cy)} ${num(bx)} ${num(by)}`;
  }
  const last = points[points.length - 1];
  return `${d3} L${num(last[0])} ${num(last[1])}`;
}
function incomingOf(arrows, id) {
  if (id === null) return null;
  const idx = arrows.flatMap((a3, i3) => a3.to === id ? [i3] : []);
  if (idx.length === 0) return null;
  return { arrows: idx, from: [...new Set(idx.map((i3) => arrows[i3].from))] };
}
function canConnect(subs, from, to) {
  if (from === to) return false;
  const byId = new Map(subs.map((s3) => [s3.id, s3]));
  const a3 = byId.get(from);
  const b2 = byId.get(to);
  if (!a3 || !b2 || !barOf(a3) || !barOf(b2)) return false;
  if (b2.dependsOn.includes(from)) return false;
  const seen = /* @__PURE__ */ new Set();
  const stack2 = [...a3.dependsOn];
  while (stack2.length > 0) {
    const id = stack2.pop();
    if (id === to) return false;
    if (seen.has(id)) continue;
    seen.add(id);
    stack2.push(...byId.get(id)?.dependsOn ?? []);
  }
  return true;
}
function arrowMidpoint(points) {
  const i3 = Math.floor((points.length - 1) / 2) + 1;
  const [x0, y0] = points[i3 - 1] ?? [0, 0];
  const [x1, y1] = points[i3] ?? [x0, y0];
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

// src/core/projects.ts
var ID_NUM = (id) => Number(id.slice(2)) || 0;
var earlier = (a3, b2) => a3 === null ? b2 : b2 === null ? a3 : a3 < b2 ? a3 : b2;
var compareNullable = (a3, b2) => a3 === b2 ? 0 : a3 === null ? 1 : b2 === null ? -1 : a3.localeCompare(b2);
function projectDue(issue) {
  return issue.deadline ?? issue.softDeadline;
}
function projectGroups(index, showClosed) {
  const groups = [];
  for (const issue of index.issues.values()) {
    if (issue.status === "closed" || issue.status === "canceled" || !index.isProject(issue.id)) continue;
    const all = index.subs(issue.id);
    const firstEnd = all.filter((s3) => !isDone2(s3)).reduce((acc, s3) => earlier(acc, barOf(s3)?.end ?? null), null);
    groups.push({ issue, subs: visibleSubs(all, showClosed), closed: all.filter(isDone2).length, firstEnd });
  }
  groups.sort((a3, b2) => compareNullable(projectDue(a3.issue), projectDue(b2.issue)) || compareNullable(a3.firstEnd, b2.firstEnd) || ID_NUM(a3.issue.id) - ID_NUM(b2.issue.id));
  return groups.map(({ firstEnd: _2, ...g2 }) => g2);
}
function effectiveEstimates(parent, subs) {
  const out = /* @__PURE__ */ new Map();
  const candidates = subs.filter((s3) => s3.estimated === null && !isDone2(s3));
  const rest = unallocatedBudget(parent, subs) ?? 0;
  const share = candidates.length > 0 && rest > 0 ? rest / candidates.length : null;
  for (const s3 of subs) {
    if (s3.estimated !== null) out.set(s3.key, { minutes: s3.estimated, source: "sub" });
    else out.set(s3.key, share !== null && !isDone2(s3) ? { minutes: share, source: "budget" } : null);
  }
  return out;
}
function unallocatedBudget(parent, subs) {
  if (parent?.estimated == null) return null;
  return parent.estimated - subs.filter((s3) => s3.status !== "canceled" && s3.estimated !== null).reduce((n2, s3) => n2 + s3.estimated, 0);
}
var DEFAULT_CAPACITY = { weekday: 360, weekend: 0 };
function capacityOn(date, cap) {
  const wd = weekdayOf(date);
  return wd === 0 || wd === 6 ? cap.weekend : cap.weekday;
}
function dayLoad(items, cap) {
  const out = /* @__PURE__ */ new Map();
  const at = (d3) => {
    let v3 = out.get(d3);
    if (!v3) out.set(d3, v3 = { minutes: 0, unknown: [] });
    return v3;
  };
  for (const item of items) {
    const days = [];
    for (let i3 = 0; i3 <= diffDays(item.end, item.start); i3++) days.push(addDays(item.start, i3));
    if (item.minutes === null) {
      for (const d3 of days) at(d3).unknown.push(item.key);
      continue;
    }
    const working = days.filter((d3) => capacityOn(d3, cap) > 0);
    const spread = working.length > 0 ? working : days;
    for (const d3 of spread) at(d3).minutes += item.minutes / spread.length;
  }
  return out;
}
function columnLoad(load, from, days, cap) {
  let minutes = 0;
  let capacity = 0;
  const unknown = /* @__PURE__ */ new Set();
  for (let i3 = 0; i3 < days; i3++) {
    const d3 = addDays(from, i3);
    capacity += capacityOn(d3, cap);
    const v3 = load.get(d3);
    if (!v3) continue;
    minutes += v3.minutes;
    for (const k3 of v3.unknown) unknown.add(k3);
  }
  minutes = Math.round(minutes * 100) / 100;
  return { minutes, capacity, unknown: unknown.size, over: minutes > capacity };
}
function loadItems(groups, index) {
  const out = [];
  for (const g2 of groups) {
    const est = effectiveEstimates(g2.issue, index.subs(g2.issue.id));
    for (const s3 of g2.subs) {
      const bar = barOf(s3);
      if (!bar || isDone2(s3)) continue;
      out.push({ key: s3.key, ...bar, minutes: est.get(s3.key)?.minutes ?? null });
    }
  }
  return out;
}
function loadLabel(minutes, unknown) {
  const h3 = Math.round(minutes / 60);
  const text = h3 > 0 ? `${h3}h` : "";
  return unknown > 0 ? `${text}?` : text;
}
var SIZES = [
  { label: "S", minutes: 30 },
  { label: "M", minutes: 120 },
  { label: "L", minutes: 240 }
];
var XL_MESSAGE = "4 \u6642\u9593\u3092\u8D85\u3048\u308B\u4F5C\u696D\u306F\u3001\u30B5\u30D6\u3092\u5206\u3051\u3066\u304F\u3060\u3055\u3044";
function sizeOf(minutes) {
  return SIZES.find((s3) => s3.minutes === minutes)?.label ?? null;
}
var ESTIMATE_HORIZON_DAYS = 14;
function needsEstimate(sub, today) {
  if (isDone2(sub) || sub.estimated !== null) return false;
  const bar = barOf(sub);
  if (!bar) return false;
  return bar.end >= today && bar.start <= addDays(today, ESTIMATE_HORIZON_DAYS - 1);
}
function needsBudget(parent, subs, today) {
  return parent.estimated === null && subs.some((s3) => needsEstimate(s3, today));
}

// src/obsidian/issue-editors.tsx
var import_obsidian4 = require("obsidian");

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

// src/ui/EstimateField.tsx
function parseEstimate(text) {
  const v3 = text.trim();
  if (v3 === "") return null;
  return parseDurationInput(v3) ?? void 0;
}
var ESTIMATE_ERROR = (v3) => `\u898B\u7A4D\u3082\u308A\u3092\u6642\u9593\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093: ${v3}\uFF08\u4F8B: 30m / 2h / 1d / 1h30m\u3002\u7A7A\u306B\u3059\u308B\u3068\u6D88\u3057\u307E\u3059\uFF09`;
function EstimateField(props) {
  const text = props.value === null ? "" : formatMinutes(props.value);
  const [draft, setDraft] = d2(text);
  const [error, setError] = d2(null);
  h2(() => setDraft(text), [text]);
  const commit = () => {
    const minutes = parseEstimate(draft);
    if (minutes === void 0) return setError(ESTIMATE_ERROR(draft));
    setError(null);
    if (minutes !== props.value) props.onSave(minutes);
  };
  return /* @__PURE__ */ u3("label", { class: `vt-effort-cell is-input${error ? " is-error" : ""}`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "estimated" }),
    /* @__PURE__ */ u3(
      "input",
      {
        type: "text",
        class: "vt-effort-input",
        value: draft,
        placeholder: "\u2014",
        "aria-invalid": error !== null,
        title: error ?? "e.g. 30m / 2h / 1d / 1h30m (1d = 24h). Empty to clear",
        onInput: (e3) => setDraft(e3.currentTarget.value),
        onBlur: commit,
        onKeyDown: (e3) => {
          if (e3.key === "Enter" && !e3.isComposing) e3.currentTarget.blur();
          if (e3.key === "Escape") {
            setDraft(text);
            setError(null);
          }
        }
      }
    ),
    error && /* @__PURE__ */ u3("span", { class: "vt-name-error", children: error })
  ] });
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
  const toggle2 = (next) => setView(view === next ? "days" : next);
  const pick = (y3, m3) => {
    props.onMonth(`${y3}-${String(m3).padStart(2, "0")}`);
    setView("days");
  };
  return /* @__PURE__ */ u3("div", { class: "vt-cal", children: [
    /* @__PURE__ */ u3("div", { class: "vt-cal-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-cal-title", "aria-live": "polite", children: [
        /* @__PURE__ */ u3("button", { type: "button", class: `vt-cal-menu${view === "months" ? " is-open" : ""}`, "aria-expanded": view === "months", "aria-label": `Choose month (${MONTH_NAMES[monthNumber - 1]})`, onClick: () => toggle2("months"), children: [
          MONTH_NAMES[monthNumber - 1],
          /* @__PURE__ */ u3(DropArrow, {})
        ] }),
        /* @__PURE__ */ u3("button", { type: "button", class: `vt-cal-menu${view === "years" ? " is-open" : ""}`, "aria-expanded": view === "years", "aria-label": `Choose year (${year})`, onClick: () => toggle2("years"), children: [
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

// src/core/worklog-times.ts
function planWorklogTimes(input) {
  const { running, fromMs, toMs, now } = input;
  if (fromMs === null) return { kind: "error", error: "From \u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" };
  if (fromMs > now || toMs !== null && toMs > now) return { kind: "error", error: "\u4ECA\u3088\u308A\u5F8C\u306E\u65E5\u6642\u306F\u5165\u308C\u3089\u308C\u307E\u305B\u3093" };
  if (toMs !== null && toMs <= fromMs) return { kind: "error", error: "To \u306F From \u3088\u308A\u5F8C\u306B\u3057\u3066\u304F\u3060\u3055\u3044" };
  if (toMs === null) return running ? { kind: "continue", fromMs } : { kind: "start", fromMs };
  return running ? { kind: "stop", fromMs, toMs } : { kind: "add", fromMs, toMs };
}
var INNER_LIMIT = 0.78;
var INNER_RADIUS = 0.62;
function clockValueAt(mode, x2, y3) {
  const turn = (Math.atan2(x2, -y3) / (2 * Math.PI) + 1) % 1;
  if (mode === "minute") return Math.round(turn * 60) % 60;
  const hour = Math.round(turn * 12) % 12;
  return Math.hypot(x2, y3) < INNER_LIMIT ? hour + 12 : hour;
}
function dialPositions(mode) {
  const at = (value, step, radius, inner) => {
    const angle = step / 12 * 2 * Math.PI;
    return { value, x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius, inner };
  };
  if (mode === "minute") return Array.from({ length: 12 }, (_2, i3) => at(i3 * 5, i3, 1, false));
  return [...Array.from({ length: 12 }, (_2, i3) => at(i3, i3, 1, false)), ...Array.from({ length: 12 }, (_2, i3) => at(i3 + 12, i3, INNER_RADIUS, true))];
}
function handPosition(mode, value) {
  const turn = mode === "minute" ? value / 60 : value % 12 / 12;
  const radius = mode === "hour" && value >= 12 ? INNER_RADIUS : 1;
  const angle = turn * 2 * Math.PI;
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}

// src/ui/ClockPicker.tsx
var pad22 = (n2) => String(n2).padStart(2, "0");
var VIEW = 1.3;
function ClockPicker(props) {
  const [mode, setMode] = d2("hour");
  const dragging = A2(false);
  const dialRef = A2(null);
  const value = mode === "hour" ? props.hour : props.minute;
  const set = (v3) => mode === "hour" ? props.onChange(v3, props.minute) : props.onChange(props.hour, v3);
  const pick = (e3) => {
    const rect = e3.currentTarget.getBoundingClientRect();
    const x2 = ((e3.clientX - rect.left) / rect.width - 0.5) * 2 * VIEW;
    const y3 = ((e3.clientY - rect.top) / rect.height - 0.5) * 2 * VIEW;
    set(clockValueAt(mode, x2, y3));
  };
  const choose = (next) => {
    setMode(next);
    dialRef.current?.focus();
  };
  const hand = handPosition(mode, value);
  const numbers = dialPositions(mode);
  const max = mode === "hour" ? 24 : 60;
  return /* @__PURE__ */ u3("div", { class: "vt-clock", children: [
    /* @__PURE__ */ u3("div", { class: "vt-clock-display", children: [
      /* @__PURE__ */ u3("button", { type: "button", class: `vt-clock-part${mode === "hour" ? " is-selected" : ""}`, "aria-pressed": mode === "hour", "aria-label": "Hour", onClick: () => choose("hour"), children: pad22(props.hour) }),
      /* @__PURE__ */ u3("span", { class: "vt-clock-colon", "aria-hidden": "true", children: ":" }),
      /* @__PURE__ */ u3("button", { type: "button", class: `vt-clock-part${mode === "minute" ? " is-selected" : ""}`, "aria-pressed": mode === "minute", "aria-label": "Minute", onClick: () => choose("minute"), children: pad22(props.minute) })
    ] }),
    /* @__PURE__ */ u3(
      "div",
      {
        ref: dialRef,
        class: "vt-clock-dial",
        role: "slider",
        tabIndex: 0,
        "aria-label": mode === "hour" ? "Hour" : "Minute",
        "aria-valuemin": 0,
        "aria-valuemax": max - 1,
        "aria-valuenow": value,
        onPointerDown: (e3) => {
          dragging.current = true;
          e3.currentTarget.setPointerCapture?.(e3.pointerId);
          pick(e3);
        },
        onPointerMove: (e3) => dragging.current && pick(e3),
        onPointerUp: () => {
          if (!dragging.current) return;
          dragging.current = false;
          if (mode === "hour") setMode("minute");
        },
        onKeyDown: (e3) => {
          const step = e3.key === "ArrowUp" || e3.key === "ArrowRight" ? 1 : e3.key === "ArrowDown" || e3.key === "ArrowLeft" ? -1 : 0;
          if (step !== 0) {
            e3.preventDefault();
            set((value + step + max) % max);
          } else if (e3.key === "Enter") {
            e3.preventDefault();
            e3.stopPropagation();
            if (mode === "hour") setMode("minute");
            else props.onDone();
          }
        },
        children: [
          /* @__PURE__ */ u3("svg", { viewBox: `${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`, "aria-hidden": "true", children: [
            /* @__PURE__ */ u3("circle", { class: "vt-clock-face", r: VIEW }),
            /* @__PURE__ */ u3("line", { class: "vt-clock-hand", x1: 0, y1: 0, x2: hand.x, y2: hand.y }),
            /* @__PURE__ */ u3("circle", { class: "vt-clock-center", r: 0.04 }),
            /* @__PURE__ */ u3("circle", { class: "vt-clock-knob", cx: hand.x, cy: hand.y, r: 0.17 })
          ] }),
          numbers.map((n2) => /* @__PURE__ */ u3(
            "span",
            {
              class: `vt-clock-number${n2.inner ? " is-inner" : ""}${n2.value === value ? " is-selected" : ""}`,
              style: { left: `${50 + n2.x / VIEW * 50}%`, top: `${50 + n2.y / VIEW * 50}%` },
              "aria-hidden": "true",
              children: pad22(n2.value)
            }
          ))
        ]
      }
    ),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: [
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-button is-text", onClick: props.onDone, children: "OK" })
    ] })
  ] });
}

// src/ui/Icon.tsx
var import_obsidian = require("obsidian");
function Icon(props) {
  const ref = A2(null);
  h2(() => {
    if (!ref.current) return;
    ref.current.replaceChildren();
    (0, import_obsidian.setIcon)(ref.current, props.name);
    if (!ref.current.firstChild && props.fallback) (0, import_obsidian.setIcon)(ref.current, props.fallback);
  }, [props.name, props.fallback]);
  return /* @__PURE__ */ u3("span", { ref, class: `vt-icon ${props.class ?? ""}`, "aria-hidden": "true" });
}

// src/ui/DateTimeField.tsx
var pad23 = (n2) => String(n2).padStart(2, "0");
function DateTimeField(props) {
  const [panel, setPanel] = d2(null);
  const { parsed } = props;
  const empty = props.text.trim() === "";
  const commit = () => {
    if (parsed !== null) props.onText(formatDateTimeValue(parsed));
  };
  const base = new Date(parsed ?? props.now());
  const baseDate = formatDateTimeValue(base.getTime()).slice(0, 10);
  const [month, setMonth] = d2(baseDate.slice(0, 7));
  const set = (date, hour, minute) => {
    const ms = composeDateTime(date, `${pad23(hour)}:${pad23(minute)}`);
    if (ms !== null) props.onText(formatDateTimeValue(ms));
  };
  const toggle2 = (next) => {
    if (next === "calendar") setMonth(baseDate.slice(0, 7));
    setPanel(panel === next ? null : next);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-text-field vt-wt-field", children: [
    /* @__PURE__ */ u3("span", { children: props.label }),
    /* @__PURE__ */ u3("div", { class: "vt-wt-row", children: [
      /* @__PURE__ */ u3(
        "input",
        {
          ref: props.inputRef,
          type: "text",
          "aria-label": props.label,
          placeholder: props.placeholder ?? DATETIME_INPUT_EXAMPLES.replace(/^e\.g\. /, ""),
          value: props.text,
          onInput: (e3) => props.onText(e3.currentTarget.value),
          onBlur: commit,
          onKeyDown: (e3) => {
            if (e3.key !== "Enter" || e3.isComposing || !props.onEnter) return;
            e3.preventDefault();
            commit();
            props.onEnter();
          }
        }
      ),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-icon-button vt-wt-tool", "aria-label": `${props.label} calendar`, "aria-expanded": panel === "calendar", title: "Pick a date", onClick: () => toggle2("calendar"), children: /* @__PURE__ */ u3(Icon, { name: "calendar" }) }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-icon-button vt-wt-tool", "aria-label": `${props.label} clock`, "aria-expanded": panel === "clock", title: "Pick a time", onClick: () => toggle2("clock"), children: /* @__PURE__ */ u3(Icon, { name: "clock" }) })
    ] }),
    empty ? null : parsed === null ? /* @__PURE__ */ u3("div", { class: "vt-error", children: DATETIME_INPUT_ERROR }) : /* @__PURE__ */ u3("div", { class: "vt-date-hint", children: formatDateTimeLabel(parsed) }),
    panel === "calendar" && /* @__PURE__ */ u3(
      MonthCalendar,
      {
        month,
        onMonth: setMonth,
        today: localToday(new Date(props.now())),
        isSelected: (d3) => parsed !== null && d3 === baseDate,
        onPick: (d3) => {
          set(d3, base.getHours(), base.getMinutes());
          setPanel(null);
        }
      }
    ),
    panel === "clock" && /* @__PURE__ */ u3(ClockPicker, { hour: base.getHours(), minute: base.getMinutes(), onChange: (h3, m3) => set(baseDate, h3, m3), onDone: () => setPanel(null) })
  ] });
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
        /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", children: "Save" })
      ]
    }
  );
}
function DateHint(props) {
  if (props.text.trim() === "") return /* @__PURE__ */ u3("div", { class: "vt-date-hint", children: DATE_INPUT_EXAMPLES });
  if (props.parsed === null) return /* @__PURE__ */ u3("div", { class: "vt-error", children: DATE_INPUT_ERROR });
  return /* @__PURE__ */ u3("div", { class: "vt-date-hint", children: formatDateLabel(props.parsed) });
}
function DateTextField(props) {
  return /* @__PURE__ */ u3("div", { class: "vt-date-field", children: [
    /* @__PURE__ */ u3(
      "input",
      {
        ref: props.inputRef,
        type: "text",
        "aria-label": "Date",
        placeholder: props.placeholder,
        value: props.text,
        onInput: (e3) => props.onText(e3.currentTarget.value),
        onBlur: () => {
          if (props.parsed !== null && props.parsed !== props.text) props.onText(props.parsed);
        }
      }
    ),
    /* @__PURE__ */ u3(DateHint, { text: props.text, parsed: props.parsed })
  ] });
}
function DateForm(props) {
  const today = localToday();
  const [text, setText] = d2(props.initial ?? "");
  const [month, setMonth] = d2((props.initial ?? today).slice(0, 7));
  const ref = A2(null);
  h2(() => ref.current?.select(), []);
  const parsed = parseDateInput(text, today);
  const rejected = parsed !== null && props.validate ? props.validate(parsed) : null;
  const invalid = text.trim() !== "" && parsed === null || rejected !== null;
  const choose = (d3) => {
    if (props.validate?.(d3)) {
      setText(d3);
      setMonth(d3.slice(0, 7));
    } else props.onSubmit(d3);
  };
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-date-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (!invalid) props.onSubmit(parsed);
      },
      children: [
        /* @__PURE__ */ u3(
          DateTextField,
          {
            inputRef: ref,
            text,
            parsed,
            onText: (value) => {
              setText(value);
              const next = parseDateInput(value, today);
              if (next !== null) setMonth(next.slice(0, 7));
            }
          }
        ),
        props.presets !== false && /* @__PURE__ */ u3("div", { class: "vt-date-presets", children: [
          ["Today", 0],
          ["Tomorrow", 1],
          ["Next week", 7]
        ].map(([label, n2]) => /* @__PURE__ */ u3("button", { type: "button", class: "vt-field-chip", onClick: () => choose(addDays(today, n2)), children: label })) }),
        /* @__PURE__ */ u3(MonthCalendar, { month, onMonth: setMonth, today, isSelected: (d3) => d3 === parsed, onPick: choose }),
        rejected !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: rejected }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: [
          props.allowClear !== false && /* @__PURE__ */ u3("button", { type: "button", onClick: () => props.onSubmit(null), children: "Clear" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: invalid, children: "Save" })
        ] })
      ]
    }
  );
}
function DayCell(props) {
  const w3 = weekdayOf(props.date);
  const cls = ["vt-day"];
  if (w3 === 0 || w3 === 6) cls.push("is-weekend");
  if (props.date === props.softDeadline) cls.push("is-soft-deadline");
  if (props.date === props.deadline) cls.push("is-deadline");
  if (props.deadline !== null && props.date > props.deadline) cls.push("is-after-deadline");
  if (props.scheduled) cls.push("is-scheduled");
  if (props.date === props.today) cls.push("is-today");
  if (props.dimmed) cls.push("is-dimmed");
  const marks = [props.date === props.today ? "Today" : null, props.date === props.softDeadline ? "soft_deadline" : null, props.date === props.deadline ? "deadline" : null].filter(Boolean).join(" \xB7 ");
  const label = marks ? `${props.date}\uFF08${marks}\uFF09` : props.date;
  return /* @__PURE__ */ u3("button", { type: "button", class: cls.join(" "), onClick: props.onClick, "aria-pressed": props.scheduled, "aria-label": label, title: label, children: Number(props.date.slice(8, 10)) });
}
function WorklogForm(props) {
  const now = Date.now;
  const [fromText, setFromText] = d2(formatDateTimeValue(props.initial.fromMs));
  const [toText, setToText] = d2(props.initial.toMs === null ? "" : formatDateTimeValue(props.initial.toMs));
  const [description, setDescription] = d2(props.initial.description);
  const [confirming, setConfirming] = d2(false);
  const fromMs = parseDateTimeInput(fromText, { now: now(), timeOnly: { kind: "past" } });
  const running = toText.trim() === "";
  const endMs = running ? null : parseDateTimeInput(toText, { now: now(), timeOnly: fromMs === null ? { kind: "past" } : { kind: "after", baseMs: fromMs } });
  const error = fromMs === null ? "\u958B\u59CB\u306E\u65E5\u6642\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" : !running && endMs === null ? "\u7D42\u4E86\u306E\u65E5\u6642\u3092\u78BA\u304B\u3081\u3066\u304F\u3060\u3055\u3044" : fromMs > now() || endMs !== null && endMs > now() ? "\u4ECA\u3088\u308A\u5F8C\u306E\u65E5\u6642\u306F\u5165\u308C\u3089\u308C\u307E\u305B\u3093" : endMs !== null && endMs <= fromMs ? "\u7D42\u4E86\u306F\u958B\u59CB\u3088\u308A\u5F8C\u306B\u3057\u3066\u304F\u3060\u3055\u3044" : null;
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (error === null) props.onSubmit({ fromMs, toMs: endMs, description: description.trim() });
      },
      children: [
        /* @__PURE__ */ u3(DateTimeField, { label: "Start", text: fromText, parsed: fromMs, onText: setFromText, now }),
        /* @__PURE__ */ u3(DateTimeField, { label: "End", text: toText, parsed: endMs, placeholder: "Empty while running", onText: setToText, now }),
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "Description" }),
          /* @__PURE__ */ u3("input", { type: "text", value: description, onInput: (e3) => setDescription(e3.currentTarget.value) })
        ] }),
        error !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: error }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: [
          props.onDelete && /* @__PURE__ */ u3("button", { type: "button", class: confirming ? "mod-warning" : "vt-danger-text", onClick: () => confirming ? props.onDelete() : setConfirming(true), children: confirming ? "Click again to delete" : "Delete" }),
          /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: error !== null, children: "Save" })
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
      /* @__PURE__ */ u3("input", { type: "text", placeholder: "New label", value: draft, onInput: (e3) => setDraft(e3.currentTarget.value) }),
      /* @__PURE__ */ u3("button", { type: "submit", children: "Add" })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { class: "mod-cta", onClick: () => props.onSubmit(names.filter((n2) => selected.has(n2))), children: "Save" }) })
  ] });
}

// src/obsidian/modals.ts
var import_obsidian2 = require("obsidian");

// src/core/member.ts
function memberLabel(m3) {
  return `@${m3.alias} - ${m3.nickname} (${m3.name})`;
}
function memberQuery(query) {
  return query.trim().replace(/^@+/, "").trim().toLowerCase();
}
function memberMatches(m3, query) {
  const q2 = memberQuery(query);
  return [m3.alias, m3.nickname, m3.name, m3.id].some((v3) => v3.toLowerCase().includes(q2));
}
function memberExactly(m3, query) {
  const q2 = memberQuery(query);
  return q2 !== "" && [m3.alias, m3.nickname, m3.name].some((v3) => v3.toLowerCase() === q2);
}
function sortMembers(members) {
  return [...members].sort((a3, b2) => a3.id.localeCompare(b2.id, "en", { numeric: true }));
}
var MEMBER_SORTS = [
  { key: "id", label: "ID" },
  { key: "nickname", label: "nickname" },
  { key: "name", label: "name" },
  { key: "alias", label: "alias" },
  { key: "delegated", label: "Delegated" },
  { key: "created", label: "created" }
];
function defaultMemberQuery() {
  return { text: "", labels: [], sort: "id", desc: false };
}
function sortValue(m3, key, delegated) {
  switch (key) {
    case "id":
      return Number(m3.id.slice(2));
    case "nickname":
      return m3.nickname;
    case "name":
      return m3.name;
    case "alias":
      return m3.alias;
    case "delegated":
      return delegated.get(m3.id) ?? 0;
    case "created": {
      const t3 = m3.created === null ? Number.NaN : Date.parse(m3.created);
      return Number.isNaN(t3) ? null : t3;
    }
  }
}
function queryMembers(members, q2, delegated) {
  const byId = (a3, b2) => a3.id.localeCompare(b2.id, "en", { numeric: true });
  return [...members].filter((m3) => memberMatches(m3, q2.text) && q2.labels.every((l3) => m3.labels.includes(l3))).sort((a3, b2) => {
    const va = sortValue(a3, q2.sort, delegated);
    const vb = sortValue(b2, q2.sort, delegated);
    if (va === vb) return byId(a3, b2);
    if (va === null) return 1;
    if (vb === null) return -1;
    const c3 = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "ja");
    return q2.desc ? -c3 : c3;
  });
}

// ../shared/src/modal-keys.ts
function registerCloseKey(modal) {
  modal.scope.register(["Mod"], "w", () => {
    modal.close();
    return false;
  });
}

// src/obsidian/modals.ts
var PreactModal = class extends import_obsidian2.Modal {
  constructor(app, title, view) {
    super(app);
    this.title = title;
    this.view = view;
    registerCloseKey(this);
  }
  title;
  view;
  onOpen() {
    this.setTitle(this.title);
    this.modalEl.addClass("vt-ui");
    R(k(() => this.view(() => this.close(), this.scope), {}), this.contentEl);
  }
  onClose() {
    R(null, this.contentEl);
  }
};
function boardChoiceText(choice) {
  return choice.kind === "issue" ? `${choice.issue.id} ${choice.issue.summary}` : `${choice.sub.parent} \u203A ${choice.sub.summary}`;
}
function boardSuggestions(items, query, match) {
  const summary = query.trim();
  if (!summary) return [...items];
  const test = match(summary);
  const hits = items.map((item) => ({ item, result: test(boardChoiceText(item)) })).filter((h3) => h3.result !== null).sort((a3, b2) => b2.result.score - a3.result.score).map(({ item }) => item);
  return [...hits, { kind: "create", summary }];
}
var BoardIssueModal = class extends import_obsidian2.SuggestModal {
  constructor(app, items, onChoose) {
    super(app);
    this.items = items;
    this.onChoose = onChoose;
    registerCloseKey(this);
    this.setPlaceholder("Search issues and sub-issues, or type a summary to create one");
  }
  items;
  onChoose;
  getSuggestions(query) {
    return boardSuggestions(this.items, query, import_obsidian2.prepareFuzzySearch);
  }
  renderSuggestion(choice, el) {
    if (choice.kind === "create") el.createEl("div", { text: `+ Create "${choice.summary}" and add it to the board` });
    else el.createEl("div", { text: boardChoiceText(choice) });
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
    registerCloseKey(this);
    this.setPlaceholder("Search delegates by @alias, nickname or name, or type a name to create one");
  }
  members;
  onChoose;
  getSuggestions(query) {
    const hits = sortMembers(this.members).filter((m3) => memberMatches(m3, query)).map((member) => ({ kind: "member", member }));
    const name = query.trim().replace(/^@+/, "").trim();
    if (memberQuery(query) && !this.members.some((m3) => memberExactly(m3, query))) hits.push({ kind: "create", name });
    return hits;
  }
  renderSuggestion(choice, el) {
    if (choice.kind === "member") el.createEl("div", { text: memberLabel(choice.member) });
    else el.createEl("div", { text: `+ Create "${choice.name}"` });
  }
  onChooseSuggestion(choice) {
    this.onChoose(choice);
  }
};

// src/obsidian/status-change.tsx
var import_obsidian3 = require("obsidian");

// src/core/pick.ts
function pickTimerControl(s3) {
  if (s3.running) return "stop";
  if (isDoneStatus(s3.status) || isWatchStatus(s3.status) || s3.status === "someday") return null;
  if (s3.picked) return "start";
  if (s3.next) return "pick";
  if (s3.needsPeriod) return "timeline";
  return null;
}
function showsPrimaryStep(status, onBoard) {
  return status !== "open" || onBoard;
}
function primaryStepFor(status, onBoard, project = "none") {
  if (project === "done" && (status === "open" || status === "in-progress")) return { kind: "status", to: "closed", label: "Close" };
  if (project !== "none" && status === "open") return null;
  return showsPrimaryStep(status, onBoard) ? primaryStep(status) : null;
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

// src/ui/StatusIcon.tsx
var SHAPES = {
  open: /* @__PURE__ */ u3("circle", { class: "vt-si-ring", cx: "12", cy: "12", r: "9" }),
  "in-progress": /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3("circle", { class: "vt-si-ring", cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ u3("path", { class: "vt-si-fill vt-si-spin", d: "M12 7a5 5 0 0 1 0 10z" })
  ] }),
  waiting: /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3("circle", { class: "vt-si-ring", cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ u3("path", { class: "vt-si-ring", d: "M10 9.5v5M14 9.5v5" })
  ] }),
  delegated: /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3("path", { class: "vt-si-ring", d: "M19.37 6.84A9 9 0 1 0 19.37 17.16" }),
    /* @__PURE__ */ u3("path", { class: "vt-si-ring", d: "M11 12h10M18 9l3 3-3 3" })
  ] }),
  someday: /* @__PURE__ */ u3("circle", { class: "vt-si-ring", cx: "12", cy: "12", r: "9", pathLength: "48", "stroke-dasharray": "2.4 3.6" }),
  closed: /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3("circle", { class: "vt-si-fill vt-si-pop", cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ u3("path", { class: "vt-si-knock vt-si-draw", d: "M8 12.3l2.8 2.8L16.2 9.6", pathLength: "14" })
  ] }),
  canceled: /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3("circle", { class: "vt-si-ring", cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ u3("path", { class: "vt-si-ring", d: "M8.5 15.5l7-7" })
  ] })
};
function StatusIcon(props) {
  return /* @__PURE__ */ u3("svg", { class: `vt-status-icon vt-si-${props.status} ${props.class ?? ""}`, viewBox: "0 0 24 24", "aria-hidden": "true", children: SHAPES[props.status] });
}

// src/core/project-periods.ts
function periodStart(p3) {
  return p3.start ?? p3.end;
}
function onlyClears(before, after) {
  const keep = (k3) => after[k3] === null || after[k3] === (before?.[k3] ?? null);
  return keep("start") && keep("end");
}
function periodInInboxMessage(parentId) {
  return `${parentId}: Inbox\uFF08\u672A\u6574\u7406\uFF09\u306E Project \u306E\u30B5\u30D6\u306B\u306F\u3001\u671F\u9593\u3092\u5165\u308C\u3089\u308C\u307E\u305B\u3093\uFF08ADR-0210\uFF09\u3002\u5148\u306B Inbox \u3067\u6574\u7406\u3057\u3066\u304F\u3060\u3055\u3044`;
}
function periodBeforeTicklerMessage(parentId, tickler) {
  return `${parentId}: Tickler\uFF08${formatShortDate(tickler)}\uFF09\u3088\u308A\u524D\u306B\u59CB\u307E\u308B\u671F\u9593\u306F\u5165\u308C\u3089\u308C\u307E\u305B\u3093\uFF08ADR-0210\uFF09\u3002${formatShortDate(tickler)} \u4EE5\u964D\u306B\u3057\u3066\u304F\u3060\u3055\u3044`;
}
function subPeriodError(parent, planned, before, after, today) {
  if (onlyClears(before, after)) return null;
  if (isInbox(parent, today, planned)) return periodInInboxMessage(parent.id);
  const start = periodStart(after);
  if (parent.tickler !== null && parent.tickler > today && start !== null && start < parent.tickler) return periodBeforeTicklerMessage(parent.id, parent.tickler);
  return null;
}
function canEditSubPeriod(parent, planned, today) {
  return parent === void 0 || !isInbox(parent, today, planned);
}
function earliestPeriodStart(subs) {
  let earliest = null;
  for (const s3 of subs) {
    if (isDoneStatus(s3.status)) continue;
    const start = periodStart(s3);
    if (start !== null && (earliest === null || start < earliest)) earliest = start;
  }
  return earliest;
}
function ticklerLimit(subs, today) {
  const latest = earliestPeriodStart(subs);
  return { latest, blocked: latest !== null && latest <= today };
}
function ticklerBlockedMessage(id) {
  return `${id}: \u671F\u9593\u304C\u3059\u3067\u306B\u59CB\u307E\u3063\u3066\u3044\u308B\u30B5\u30D6\u304C\u3042\u308B\u306E\u3067\u3001Tickler \u3092\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093\uFF08ADR-0210\uFF09\u3002\u30B5\u30D6\u306E\u671F\u9593\u3092\u5F8C\u308D\u306B\u305A\u3089\u3057\u3066\u304F\u3060\u3055\u3044`;
}
function ticklerWithSubsError(id, subs, tickler, today) {
  if (tickler === null) return null;
  const { latest, blocked } = ticklerLimit(subs, today);
  if (latest === null || tickler <= latest) return null;
  if (blocked) return ticklerBlockedMessage(id);
  return `${id}: Tickler \u306F\u30B5\u30D6\u306E\u671F\u9593\u306E\u59CB\u307E\u308A\uFF08${formatShortDate(latest)}\uFF09\u3088\u308A\u5F8C\u306B\u3067\u304D\u307E\u305B\u3093\uFF08ADR-0210\uFF09\u3002${formatShortDate(latest)} \u4EE5\u524D\u306B\u3059\u308B\u304B\u3001\u30B5\u30D6\u306E\u671F\u9593\u3092\u5F8C\u308D\u306B\u305A\u3089\u3057\u3066\u304F\u3060\u3055\u3044`;
}
function somedayClears(subs) {
  return subs.filter((s3) => !isDoneStatus(s3.status) && (s3.start !== null || s3.end !== null || s3.scheduled !== null));
}
function describeClear(sub) {
  const parts = [];
  if (sub.start !== null || sub.end !== null) parts.push(`${sub.start ? formatShortDate(sub.start) : "\u2014"} \u2013 ${sub.end ? formatShortDate(sub.end) : "\u2014"}`);
  if (sub.scheduled !== null) parts.push(`calendar ${formatShortDate(sub.scheduled)}`);
  return `${sub.summary}\uFF08${parts.join("\u3001")}\uFF09`;
}

// src/obsidian/someday-confirm.tsx
function confirmSomeday(ctx, issues) {
  const groups = issues.filter((i3) => i3.status !== "someday").map((issue) => ({ issue, subs: somedayClears(ctx.store.index.subs(issue.id)) })).filter((g2) => g2.subs.length > 0);
  if (groups.length === 0) return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, close) => {
      done = true;
      close();
      resolve(ok);
    };
    const modal = new PreactModal(ctx.app, "Move to Someday", (close) => /* @__PURE__ */ u3("div", { children: [
      /* @__PURE__ */ u3("p", { children: "Someday \u306B\u3059\u308B\u3068\u3001\u6B21\u306E\u30B5\u30D6\u306E\u671F\u9593\u3068 Calendar \u306E\u65E5\u3092\u6D88\u3057\u307E\u3059\u3002\u30B5\u30D6\u306E status \u306F\u5909\u3048\u307E\u305B\u3093\u3002" }),
      groups.map((g2) => /* @__PURE__ */ u3("div", { children: [
        groups.length > 1 && /* @__PURE__ */ u3("div", { class: "vt-field-label", children: `${g2.issue.id} ${g2.issue.summary}` }),
        /* @__PURE__ */ u3("ul", { children: g2.subs.map((s3) => /* @__PURE__ */ u3("li", { children: describeClear(s3) })) })
      ] })),
      /* @__PURE__ */ u3("div", { class: "vt-form", children: [
        /* @__PURE__ */ u3("button", { type: "button", onClick: () => finish(false, close), children: "Cancel" }),
        /* @__PURE__ */ u3("button", { type: "button", class: "mod-warning", onClick: () => finish(true, close), children: "Move to Someday" })
      ] })
    ] }));
    const onClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      onClose();
      if (!done) resolve(false);
    };
    modal.open();
  });
}

// src/obsidian/status-change.tsx
var isDone3 = (s3) => s3 === "closed" || s3 === "canceled";
function changeIssueStatus(ctx, issue, to) {
  const save = (delegatedTo) => ctx.writer.update(issue.path, issueStatusPatch(to, { delegatedTo })).catch((e3) => ctx.report("status \u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  if (to === "delegated") return pickMember(ctx, (id) => void save(id));
  if (to === issue.status) return;
  if (to === "someday") return confirmSomeday(ctx, [issue]).then((ok) => ok ? save() : void 0);
  return save();
}
function changeSubStatus(ctx, sub, to, save) {
  const write = (patch) => Promise.resolve(save ? save(patch) : ctx.writer.updateSub(sub.key, patch)).then(
    () => void 0,
    (e3) => ctx.report("\u30B5\u30D6\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)
  );
  if (to === "delegated") return pickMember(ctx, (id) => void write(subStatusPatch(to, { delegatedTo: id })));
  if (to === sub.status) return;
  return write(subStatusPatch(to));
}
function changeByKey(ctx, key, to, save) {
  const issue = ctx.store.index.issues.get(key);
  if (issue) return changeIssueStatus(ctx, issue, to);
  const sub = ctx.store.index.sub(key);
  if (sub) return changeSubStatus(ctx, sub, to, save);
}
function statusOf(ctx, key) {
  return (ctx.store.index.issues.get(key) ?? ctx.store.index.sub(key))?.status ?? null;
}
function reopenByKey(ctx, key, save) {
  return changeByKey(ctx, key, ctx.store.index.reopenStatus(key), save);
}
function showStatusMenu(ctx, e3, key, save) {
  const current = statusOf(ctx, key);
  if (current === null) return;
  const m3 = new import_obsidian3.Menu();
  const title = (s3) => s3 === "delegated" ? "delegated\u2026" : s3;
  m3.addItem(
    (mi) => mi.setTitle(title(current)).setChecked(true).onClick(() => {
      if (current === "delegated") void changeByKey(ctx, key, current, save);
    })
  );
  for (const s3 of transitionTargets(current)) m3.addItem((mi) => mi.setTitle(title(s3)).onClick(() => void changeByKey(ctx, key, s3, save)));
  if (isDone3(current)) {
    const to = ctx.store.index.reopenStatus(key);
    m3.addSeparator();
    m3.addItem((mi) => mi.setTitle(`Reopen (\u2192 ${to})`).setIcon("undo-2").onClick(() => void reopenByKey(ctx, key, save)));
  }
  m3.showAtMouseEvent(e3);
}
function StatusStepButton(props) {
  const { ctx, keyOf, save } = props;
  useStoreVersion(ctx.store);
  const status = statusOf(ctx, keyOf);
  if (status === null) return null;
  const index = ctx.store.index;
  const project = !index.issues.has(keyOf) || !index.isProject(keyOf) ? "none" : allSubsDone(index.subs(keyOf)) ? "done" : "open";
  const step = primaryStepFor(status, props.onBoard ?? isOnBoard(index, localToday(), keyOf), project);
  if (step === null) return null;
  const reopenTo = step.kind === "reopen" ? ctx.store.index.reopenStatus(keyOf) : null;
  const title = step.kind === "reopen" ? `Reopen (\u2192 ${reopenTo})` : `${step.label} (\u2192 ${step.to})`;
  const run = (e3) => {
    e3.stopPropagation();
    const done = step.kind === "reopen" ? reopenByKey(ctx, keyOf, save) : changeByKey(ctx, keyOf, step.to, save);
    void Promise.resolve(done).then(() => props.onDone?.());
  };
  return /* @__PURE__ */ u3("button", { type: "button", class: "vt-icon-button vt-status-step", "aria-label": title, title, onClick: run, children: step.kind === "reopen" ? /* @__PURE__ */ u3(Icon, { name: "undo-2" }) : /* @__PURE__ */ u3(StatusIcon, { status: step.to }) });
}

// src/obsidian/issue-editors.tsx
var saveIssue = (ctx, issue) => (fields) => void ctx.writer.update(issue.path, fields).catch((e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
function pickMember(ctx, onPick) {
  new MemberSuggestModal(ctx.app, [...ctx.store.index.members.values()], (choice) => {
    if (choice.kind === "member") onPick(choice.member.id);
    else
      void ctx.writer.createMember(choice.name).then(onPick).catch((e3) => ctx.report("\u59D4\u4EFB\u5148\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  }).open();
}
function priorityMenu(e3, current, save) {
  const m3 = new import_obsidian4.Menu();
  for (const p3 of PRIORITIES) m3.addItem((item) => item.setTitle(p3).setChecked(p3 === current).onClick(() => save({ priority: p3 })));
  m3.addItem((item) => item.setTitle("None").onClick(() => save({ priority: null })));
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
      placeholder: "e.g. Waiting for reply",
      onSubmit: (v3) => {
        close();
        save({ "status-detail": v3 });
      }
    }
  )).open();
}
function editEstimate(ctx, current, save) {
  new PreactModal(ctx.app, "estimated\uFF08m / h / d\u30021d = 24h\uFF09", (close) => /* @__PURE__ */ u3(
    TextForm,
    {
      initial: current === null ? "" : formatMinutes(current),
      placeholder: "e.g. 30m / 2h / 1d / 1h30m\uFF08\u7A7A\u306B\u3059\u308B\u3068\u6D88\u3059\uFF09",
      onSubmit: (v3) => {
        const min = parseEstimate(v3);
        if (min === void 0) return ctx.report(ESTIMATE_ERROR(v3));
        close();
        save({ estimated: min });
      }
    }
  )).open();
}
function editDue(ctx, issue, key) {
  new PreactModal(ctx.app, key, (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: key === "soft_deadline" ? issue.softDeadline : issue.deadline,
      onSubmit: (v3) => {
        close();
        saveIssue(ctx, issue)(duePatch(issue, key, v3));
      }
    }
  )).open();
}
function editScheduled(ctx, issue) {
  new PreactModal(ctx.app, "Calendar (must be done on this day)", (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: issue.scheduled,
      onSubmit: (v3) => {
        close();
        saveIssue(ctx, issue)(scheduledPatch(issue, v3));
      }
    }
  )).open();
}
function editTickler(ctx, issue) {
  new PreactModal(ctx.app, "Tickler (back to Inbox on this date)", (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial: issue.tickler,
      onSubmit: (v3) => {
        close();
        saveIssue(ctx, issue)(ticklerFieldPatch(issue, v3));
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
  const m3 = new import_obsidian4.Menu();
  m3.addItem((item) => item.setTitle("summary").setIcon("pencil").onClick(() => editSummary(ctx, issue)));
  m3.addItem((item) => item.setTitle("status").setIcon("circle-dot").onClick(() => showStatusMenu(ctx, e3, issue.id)));
  m3.addItem((item) => item.setTitle("status-detail").setIcon("pencil").onClick(() => editStatusDetail(ctx, issue.statusDetail, save)));
  m3.addItem((item) => item.setTitle("priority").setIcon("flag").onClick(() => priorityMenu(e3, issue.priority, save)));
  m3.addItem((item) => item.setTitle("label").setIcon("tag").onClick(() => editLabels(ctx, issue.labels, save)));
  m3.addSeparator();
  m3.addItem((item) => item.setTitle("Calendar").setIcon("calendar").onClick(() => editScheduled(ctx, issue)));
  if (canSetTickler(issue.status)) m3.addItem((item) => item.setTitle("Tickler").setIcon("alarm-clock").onClick(() => editTickler(ctx, issue)));
  else if (issue.tickler !== null) m3.addItem((item) => item.setTitle("Clear Tickler").setIcon("alarm-clock-off").onClick(() => saveIssue(ctx, issue)({ tickler: null })));
  m3.addItem((item) => item.setTitle("soft_deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "soft_deadline")));
  m3.addItem((item) => item.setTitle("deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "deadline")));
  m3.addItem((item) => item.setTitle("estimated").setIcon("clock").onClick(() => editEstimate(ctx, issue.estimated, save)));
  m3.showAtMouseEvent(e3);
}

// src/header/sub-timeline-reveal.ts
var revealers = /* @__PURE__ */ new Map();
var pending = null;
function setTimelineRevealer(parentId, fn) {
  if (!fn) {
    revealers.delete(parentId);
    return;
  }
  revealers.set(parentId, fn);
  if (pending?.parent === parentId) {
    const sub = pending;
    pending = null;
    fn(sub);
  }
}
function revealInTimeline(sub) {
  const fn = revealers.get(sub.parent);
  if (!fn) {
    pending = sub;
    return false;
  }
  pending = null;
  fn(sub);
  return true;
}

// src/obsidian/board-actions.ts
var import_obsidian5 = require("obsidian");

// src/core/board-lanes.ts
var TOP_LIMIT = 4;
function boardCards(index, date, board) {
  const cards2 = [];
  for (const key of board.issues) {
    const issue = index.issues.get(key);
    if (issue) {
      cards2.push({ kind: "issue", key, issue });
      continue;
    }
    const sub = index.sub(key);
    if (sub) cards2.push({ kind: "sub", key, sub, parent: index.issues.get(sub.parent) });
  }
  for (const routine of routinesOnDay(index, date, null)) cards2.push({ kind: "routine", key: routine.id, routine, carriedFrom: carriedFrom(index, routine, date) });
  return cards2;
}
function cardStatus(board, card) {
  if (card.kind === "issue") return card.issue.status;
  if (card.kind === "sub") return card.sub.status;
  return board.routines[card.routine.id] ?? "open";
}
function cardSummary(card) {
  return card.kind === "issue" ? card.issue.summary : card.kind === "sub" ? card.sub.summary : card.routine.summary;
}
function cardPath(card) {
  return card.kind === "issue" ? card.issue.path : card.kind === "sub" ? card.sub.path : card.routine.path;
}
function isSettled(board, card) {
  if (card.kind === "routine") return board.routines[card.routine.id] !== void 0;
  const status = cardStatus(board, card);
  return !isActive({ status }) || isDoneStatus(status) || board.carried.includes(card.key);
}
function laneOf(index, board, card) {
  if (card.kind === "routine") return "routine";
  if (index.running(card.key).length > 0) return "working";
  if (isSettled(board, card)) return "done";
  const status = cardStatus(board, card);
  if (isWatchStatus(status)) return "watch";
  if (board.stars.includes(card.key)) return "top";
  return "next";
}
function boardLanes(index, date, board) {
  const lanes = { working: [], top: [], routine: [], next: [], watch: [], done: [] };
  const order = index.order(date);
  for (const card of sortByOrder(boardCards(index, date, board), (c3) => c3.key, order)) {
    const lane = laneOf(index, board, card);
    if (lane !== "watch") lanes[lane].push(card);
  }
  lanes.watch = watchCards(index, new Set(lanes.working.map((c3) => c3.key)));
  const startedAt = (c3) => Math.min(...index.running(c3.key).map((l3) => l3.fromMs));
  lanes.working.sort((a3, b2) => startedAt(a3) - startedAt(b2));
  const added = boardCards(index, date, board).map((c3) => c3.key);
  lanes.done.sort((a3, b2) => added.indexOf(a3.key) - added.indexOf(b2.key));
  return lanes;
}
function watchCards(index, exclude = /* @__PURE__ */ new Set()) {
  const cards2 = [];
  for (const issue of index.issues.values()) if (isWatchStatus(issue.status)) cards2.push({ kind: "issue", key: issue.id, issue });
  for (const sub of index.data.subIssues) {
    if (!isWatchStatus(sub.status) || index.sub(sub.key) !== sub) continue;
    const parent = index.issues.get(sub.parent);
    if (parent && isActive(parent)) cards2.push({ kind: "sub", key: sub.key, sub, parent });
  }
  const owner = (c3) => c3.kind === "issue" ? c3.issue : c3.parent;
  const rank = (c3) => c3.kind === "sub" ? c3.sub.order : -1;
  return cards2.filter((c3) => !exclude.has(c3.key)).sort((a3, b2) => byPick(owner(a3), owner(b2)) || rank(a3) - rank(b2));
}
function unstarOps(index, date, key, to) {
  if (!unstarsOn(to)) return [];
  return index.board(date)?.board.stars.includes(key) ? [{ op: "star", task: key, on: false }] : [];
}
function cardRuns(cards2) {
  const runs = [];
  for (const card of cards2) {
    const parent = card.kind === "sub" ? card.sub.parent : null;
    const last = runs[runs.length - 1];
    if (parent !== null && last && last.parent === parent) last.cards.push(card);
    else runs.push({ parent, cards: [card] });
  }
  return runs;
}
function showRoutineLane(board, lanes) {
  return lanes.routine.some((c3) => cardStatus(board, c3) === "open");
}
function canStar(lanes) {
  return lanes.top.length < TOP_LIMIT;
}
function orderedKeys(lanes) {
  return [...lanes.top, ...lanes.next].map((c3) => c3.key);
}
function endOf(lanes, lane, key) {
  const after = lane === "top" ? ["next"] : [];
  for (const l3 of after) {
    const first = lanes[l3].find((c3) => c3.key !== key);
    if (first) return first.key;
  }
  return null;
}
function moveOps(lanes, board, key, lane, before, previous) {
  const ops = [];
  const starred = board.stars.includes(key);
  if (lane === "top" && !starred) ops.push({ op: "star", task: key, on: true });
  if (lane === "next" && starred) ops.push({ op: "star", task: key, on: false });
  const visible = orderedKeys(lanes);
  const target = before ?? endOf(lanes, lane, key);
  ops.push({ op: "order", tasks: nextOrder(reorder(visible.includes(key) ? visible : [...visible, key], key, target), previous) });
  return ops;
}
function stepOps(lanes, board, key, direction, previous) {
  const lane = ["top", "next"].find((l3) => lanes[l3].some((c3) => c3.key === key));
  if (!lane) return null;
  const keys = lanes[lane].map((c3) => c3.key);
  const at = keys.indexOf(key);
  if (direction === -1) {
    if (at <= 0) return null;
    return moveOps(lanes, board, key, lane, keys[at - 1], previous);
  }
  if (at >= keys.length - 1) return null;
  return moveOps(lanes, board, key, lane, keys[at + 2] ?? null, previous);
}

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
async function somedayIssues(ctx, issues, revisit = null) {
  if (!await confirmSomeday(ctx, issues)) return;
  await patchAll(ctx, issues, somedayPatch(revisit), "Someday \u306B\u79FB\u3059\u3053\u3068\u304C");
}
async function ticklerIssues(ctx, issues) {
  const date = await askDate(ctx, "Tickler (back to Inbox on this date)", addDays(localToday(), 1));
  if (date === null) return;
  await patchAll(ctx, issues, (i3) => ticklerPatch(i3, date), "Tickler \u3092\u4ED8\u3051\u308B\u3053\u3068\u304C");
}
var nextIssues = (ctx, issues) => patchAll(ctx, issues, (i3) => nextPatch(i3), "Next \u306B\u3059\u308B\u3053\u3068\u304C");
var backToNextIssues = (ctx, issues) => patchAll(ctx, issues, backToNextPatch(), "Next \u306B\u623B\u3059\u3053\u3068\u304C");
async function rescheduleIssues(ctx, issues, target) {
  const title = target === "scheduled" ? "Move date (must be done on this day)" : `Change ${target}`;
  const date = await askDate(ctx, title, localToday());
  if (date === null) return;
  await patchAll(ctx, issues, () => reschedulePatch(target, date), "\u65E5\u4ED8\u3092\u5909\u3048\u308B\u3053\u3068\u304C");
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
    const { created } = await ctx.writer.createIssues([summary], { clarified: true });
    const file = created[0];
    if (!file) throw new Error(`\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${summary}`);
    await addToBoard(ctx, date, [file.basename]);
  } catch (e3) {
    ctx.report("issue \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
var removeFromBoard = (ctx, date, id) => guard(ctx, "\u30DC\u30FC\u30C9\u304B\u3089\u5916\u305B\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "remove", task: id }]));
async function addSubToBoard(ctx, date, sub) {
  try {
    await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "add", task: sub.key }]);
  } catch (e3) {
    ctx.report("\u30B5\u30D6\u3092\u30DC\u30FC\u30C9\u306B\u8F09\u305B\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
async function resumeCard(ctx, date, card) {
  if (card.kind === "routine") return;
  try {
    if (card.kind === "issue") await ctx.writer.update(card.issue.path, issueStatusPatch("in-progress"));
    else await ctx.writer.updateSub(card.key, subStatusPatch("in-progress"));
    if (!isOnBoard(ctx.store.index, date, card.key)) await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "add", task: card.key }]);
  } catch (e3) {
    ctx.report("Resume \u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
function lanesOn(ctx, date) {
  const index = ctx.store.index;
  const board = index.board(date)?.board ?? emptyBoard();
  return { board, lanes: boardLanes(index, date, board), previous: index.order(date) };
}
function setStar(ctx, date, key, on) {
  const { board, lanes } = lanesOn(ctx, date);
  if (on && lanes.routine.some((c3) => c3.key === key)) return Promise.resolve();
  if (on && !board.stars.includes(key) && !canStar(lanes)) {
    new import_obsidian5.Notice(`\u2605 \u306F ${TOP_LIMIT} \u4EF6\u307E\u3067\u3067\u3059\u3002\u307B\u304B\u306E \u2605 \u3092\u5916\u3057\u3066\u304B\u3089\u4ED8\u3051\u3066\u304F\u3060\u3055\u3044`);
    return Promise.resolve();
  }
  return guard(ctx, "\u2605 \u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "star", task: key, on }]));
}
function moveCard(ctx, date, key, lane, before) {
  const { board, lanes, previous } = lanesOn(ctx, date);
  if (lane === "top" && !board.stars.includes(key) && !canStar(lanes)) {
    new import_obsidian5.Notice(`\u2605 \u306F ${TOP_LIMIT} \u4EF6\u307E\u3067\u3067\u3059\u3002\u307B\u304B\u306E \u2605 \u3092\u5916\u3057\u3066\u304B\u3089\u5165\u308C\u3066\u304F\u3060\u3055\u3044`);
    return Promise.resolve();
  }
  return guard(ctx, "\u30AB\u30FC\u30C9\u3092\u52D5\u304B\u305B\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, moveOps(lanes, board, key, lane, before, previous)));
}
function stepCard(ctx, date, key, direction) {
  const { board, lanes, previous } = lanesOn(ctx, date);
  const ops = stepOps(lanes, board, key, direction, previous);
  if (!ops) return Promise.resolve();
  return guard(ctx, "\u30AB\u30FC\u30C9\u3092\u52D5\u304B\u305B\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, ops));
}
async function setRoutineResult(ctx, date, id, result, record2 = true) {
  const before = ctx.store.index.board(date)?.board.routines[id] ?? null;
  try {
    await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "routine", task: id, result }]);
  } catch (e3) {
    ctx.report("routine \u3092\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    return;
  }
  if (record2 && before !== result) ctx.undo.push(`${date}/${id}`, () => setRoutineResult(ctx, date, id, before, false));
}
async function closeBoard(ctx, date) {
  try {
    await ctx.writer.closeBoard(date, ctx.settings.deviceName);
  } catch (e3) {
    ctx.report("\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
  }
}
async function beginClosing(ctx, date) {
  let path;
  try {
    path = await ctx.writer.insertReview(date);
  } catch (e3) {
    ctx.report("\u632F\u308A\u8FD4\u308A\u306E\u578B\u3092\u5165\u308C\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    return;
  }
  const { workspace } = ctx.app;
  const open = workspace.getLeavesOfType?.("markdown").find((l3) => l3.view.file?.path === path);
  if (open) await workspace.revealLeaf(open);
  else await ctx.openPath(path);
}
var reopenBoard = (ctx, date) => guard(ctx, "\u30DC\u30FC\u30C9\u3092\u958B\u304D\u76F4\u305B\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "reopen" }]));
function startTimer(ctx, ids) {
  return guard(ctx, "\u8A18\u9332\u3092\u59CB\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.startTimer(ids, ctx.settings.deviceName));
}
function stopTimer(ctx, ids) {
  const running = ctx.store.index.running().filter((l3) => ids.includes(workKey(l3)));
  if (running.length === 0) return Promise.resolve();
  return guard(ctx, "\u8A18\u9332\u3092\u6B62\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", ctx.writer.stopTimer(running));
}

// src/obsidian/pick-toggle.tsx
function PickToggle(props) {
  const { ctx, keyOf } = props;
  const [busy, setBusy] = d2(false);
  const run = async () => {
    setBusy(true);
    try {
      await addToBoard(ctx, localToday(), [keyOf]);
    } catch (e3) {
      ctx.report("Pick \u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ u3("button", { type: "button", class: "vt-play vt-pick", "aria-label": "Pick", title: "Add to today's board", disabled: busy, onClick: () => void run(), children: /* @__PURE__ */ u3(Icon, { name: "calendar-check" }) });
}
function TimelineButton(props) {
  const { ctx, sub } = props;
  const open = () => {
    if (!revealInTimeline(sub)) void ctx.openPath(sub.path, false);
  };
  const title = "Today is outside this sub-issue's period. Open the Timeline to plan it";
  return /* @__PURE__ */ u3("button", { type: "button", class: "vt-play vt-pick", "aria-label": "Open Timeline", title, onClick: open, children: /* @__PURE__ */ u3(Icon, { name: "calendar-range" }) });
}
function PickTimer(props) {
  const { ctx, keyOf } = props;
  useStoreVersion(ctx.store);
  const now = useNow();
  const running = ctx.store.index.running(keyOf);
  const index = ctx.store.index;
  const today = localToday();
  const issue = index.issues.get(keyOf);
  const sub = issue ? void 0 : index.sub(keyOf);
  const task = issue ?? sub;
  if (!task) return null;
  const parent = sub ? index.issues.get(sub.parent) : void 0;
  const control = pickTimerControl({
    status: task.status,
    picked: isOnBoard(index, today, keyOf),
    running: running.length > 0,
    next: issue ? index.next(issue, today) : sub ? index.nextSub(sub, today) : false,
    needsPeriod: sub ? needsPeriod(sub, parent, today, index.planned(sub.parent)) : false
  });
  if (control === null) return null;
  if (control === "pick") return /* @__PURE__ */ u3(PickToggle, { ...props });
  if (control === "timeline" && sub) return /* @__PURE__ */ u3(TimelineButton, { ctx, sub });
  const elapsed = running.reduce((m3, log) => Math.max(m3, now - log.fromMs), 0);
  const label = running.length ? "Stop timer" : "Start timer";
  return /* @__PURE__ */ u3(
    "button",
    {
      type: "button",
      class: `vt-play${running.length ? " is-running" : ""}`,
      "aria-label": label,
      title: label,
      onClick: () => void (running.length ? stopTimer(ctx, [keyOf]) : startTimer(ctx, [keyOf])),
      children: [
        /* @__PURE__ */ u3(Icon, { name: running.length ? "square" : "play" }),
        running.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(elapsed / 6e4) })
      ]
    }
  );
}

// src/ui/badges.tsx
function StatusBadge(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-badge vt-status vt-status-${props.status}${props.wide ? " is-wide" : ""}`, onClick: props.onClick, disabled: !props.onClick, children: [
    /* @__PURE__ */ u3(StatusIcon, { status: props.status, class: props.enter ? "is-enter" : "" }),
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
var GTD_LISTS = {
  inbox: { label: "Inbox", icon: "inbox", title: "In Inbox (not clarified). Clarify it in Inbox or Organize" },
  next: { label: "Next Action", icon: "list-todo", title: "In Next Actions. Pick it in Daily" },
  calendar: { label: "Calendar", icon: "calendar", title: "Must be done on this day" },
  tickler: { label: "Tickler", icon: "alarm-clock", title: "Hidden until this date" }
};
function GtdListBadge(props) {
  const { label, icon, title } = GTD_LISTS[props.list];
  const date = props.list === "calendar" ? props.issue.scheduled : props.list === "tickler" ? props.issue.tickler : null;
  return /* @__PURE__ */ u3("span", { class: `vt-badge vt-gtd-list is-${props.list}`, title, children: [
    /* @__PURE__ */ u3(Icon, { name: icon }),
    date ? `${label} ${formatShortDate(date)}` : label
  ] });
}
function ProjectBadge() {
  return /* @__PURE__ */ u3("span", { class: "vt-badge vt-gtd-list is-project", title: "Project: has sub-issues", children: [
    /* @__PURE__ */ u3(Icon, { name: "folder-kanban", fallback: "folder" }),
    "Project"
  ] });
}

// src/header/SubIssues.tsx
var import_obsidian8 = require("obsidian");

// src/obsidian/sub-editor.tsx
var import_obsidian6 = require("obsidian");

// src/header/sub-reveal.ts
var reveal = null;
function setSubRevealer(fn) {
  reveal = fn;
}
function revealSub(sub) {
  reveal?.(sub);
}

// src/ui/SizeChips.tsx
function SizeChips(props) {
  const current = sizeOf(props.minutes);
  return /* @__PURE__ */ u3("div", { class: "vt-segmented is-small vt-size-chips", role: "group", "aria-label": "Size", children: [
    SIZES.map((s3) => {
      const on = current === s3.label;
      return /* @__PURE__ */ u3(
        "button",
        {
          type: "button",
          class: `vt-segmented-button${on ? " is-on" : ""}`,
          "aria-pressed": on,
          title: `${s3.label}: ${s3.minutes >= 60 ? `${s3.minutes / 60}h` : `${s3.minutes}m`}`,
          onClick: () => on ? props.clearable && props.onPick(null) : props.onPick(s3.minutes),
          children: s3.label
        }
      );
    }),
    props.onXl && /* @__PURE__ */ u3("button", { type: "button", class: "vt-segmented-button", title: "XL: split into smaller sub-issues", onClick: () => props.onXl(XL_MESSAGE), children: "XL" })
  ] });
}

// src/obsidian/sub-editor.tsx
var DATE_FIELDS = [
  ["start", "Start"],
  ["end", "End"],
  ["scheduled", "Calendar"]
];
function confirmModal(ctx, title, message, action, run) {
  new PreactModal(ctx.app, title, (close) => /* @__PURE__ */ u3("div", { children: [
    /* @__PURE__ */ u3("p", { children: message }),
    /* @__PURE__ */ u3("div", { class: "vt-form", children: [
      /* @__PURE__ */ u3("button", { type: "button", onClick: close, children: "Cancel" }),
      /* @__PURE__ */ u3(
        "button",
        {
          type: "button",
          class: "mod-warning",
          onClick: () => {
            close();
            run();
          },
          children: action
        }
      )
    ] })
  ] })).open();
}
function deleteSubWithConfirm(ctx, sub, done) {
  confirmModal(ctx, "Delete sub-issue", `\u30B5\u30D6\u300C${sub.summary}\u300D\u3092\u672C\u6587\u3054\u3068\u6D88\u3057\u307E\u3059\u3002\u4F5C\u696D\u6642\u9593\u306E\u8A18\u9332\u306F\u6B8B\u308A\u3001\u89AA\u306E\u5B9F\u7E3E\u306B\u542B\u307E\u308C\u307E\u3059\u3002`, "Delete", () => {
    void ctx.writer.deleteSub(sub.key).then(() => done?.()).catch((e3) => ctx.report("\u30B5\u30D6\u3092\u6D88\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  });
}
function pickSubDate(ctx, label, initial, onPick, validate) {
  new PreactModal(ctx.app, label, (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial,
      validate,
      allowClear: true,
      onSubmit: (v3) => {
        close();
        onPick(v3);
      }
    }
  )).open();
}
var SUB_DATE_FIELDS = DATE_FIELDS;
function subDateRules(ctx, sub) {
  const index = ctx.store.index;
  const parent = index.issues.get(sub.parent);
  const today = localToday();
  const planned = index.planned(sub.parent);
  const lock = canEditSubPeriod(parent, planned, today) ? null : periodInInboxMessage(sub.parent);
  return {
    lock,
    validate: (key, draft) => key === "scheduled" || !parent ? void 0 : (d3) => subPeriodError(parent, planned, { start: sub.start, end: sub.end }, { start: draft.start, end: draft.end, [key]: d3 }, today)
  };
}
var isPeriodKey = (key) => key !== "scheduled";
function DependsField(props) {
  const { candidates, dependsOn } = props;
  const chip = dependsChip(candidates, dependsOn);
  const open = (e3) => {
    const m3 = new import_obsidian6.Menu();
    for (const s3 of candidates) m3.addItem((item) => item.setTitle(s3.summary).setChecked(dependsOn.includes(s3.id)).onClick(() => props.onChange(toggleDepends(dependsOn, s3.id))));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
    /* @__PURE__ */ u3("span", { children: "Depends on" }),
    /* @__PURE__ */ u3("button", { type: "button", class: `vt-field-chip vt-subissue-depends${chip.empty ? " is-placeholder" : ""}`, title: chip.title ?? void 0, "aria-haspopup": "menu", onClick: open, children: [
      /* @__PURE__ */ u3(Icon, { name: "link" }),
      /* @__PURE__ */ u3("span", { class: "vt-subissue-depends-text", children: chip.text })
    ] })
  ] });
}
function openSubEditor(ctx, sub) {
  new PreactModal(ctx.app, "Edit sub-issue", (close) => /* @__PURE__ */ u3(SubIssueForm, { ctx, sub, close })).open();
}
function SubIssueForm(props) {
  const { ctx, sub, close } = props;
  const [draft, setDraft] = d2(sub);
  const [estimated, setEstimated] = d2(sub.estimated === null ? "" : formatMinutes(sub.estimated));
  const [error, setError] = d2(null);
  const [saving, setSaving] = d2(false);
  const set = (patch) => setDraft((d3) => ({ ...d3, ...patch }));
  const siblings = ctx.store.index.subs(sub.parent).filter((s3) => s3.id !== sub.id);
  const member = draft.delegatedTo === null ? null : ctx.store.index.members.get(draft.delegatedTo);
  const rules = subDateRules(ctx, sub);
  const editDate = (key, label) => pickSubDate(
    ctx,
    label,
    draft[key],
    (v3) => setDraft((d3) => ({ ...d3, [key]: v3, ...d3.status === "someday" && key !== "scheduled" && v3 !== null ? { status: "open" } : {} })),
    rules.validate(key, draft)
  );
  const changeStatus = (status) => {
    if (status === "delegated" && draft.delegatedTo === null) pickMember(ctx, (id) => set({ status, delegatedTo: id }));
    else set({ status, ...status === "delegated" ? {} : { delegatedTo: null }, ...status === "someday" ? { scheduled: null, start: null, end: null } : {} });
  };
  const save = () => {
    const minutes = estimated.trim() === "" ? null : parseDurationInput(estimated);
    if (minutes === null && estimated.trim() !== "") return setError(`\u898B\u7A4D\u3082\u308A\u3092\u6642\u9593\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093: ${estimated}\uFF08\u4F8B: 30m / 2h / 1h30m\uFF09`);
    const patch = subItemPatch(draft, minutes);
    setSaving(true);
    ctx.writer.updateSub(sub.key, patch).then(close).catch((e3) => {
      setSaving(false);
      setError(e3 instanceof Error ? e3.message : String(e3));
    });
  };
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-subissue-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        save();
      },
      children: [
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "Summary" }),
          /* @__PURE__ */ u3("input", { type: "text", value: draft.summary, onInput: (e3) => set({ summary: e3.currentTarget.value }) })
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-subissue-form-row", children: [
          /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
            /* @__PURE__ */ u3("span", { children: "Status" }),
            /* @__PURE__ */ u3("select", { value: draft.status, onChange: (e3) => changeStatus(e3.currentTarget.value), children: STATUSES.map((s3) => /* @__PURE__ */ u3("option", { value: s3, children: s3 })) })
          ] }),
          draft.status === "delegated" && /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
            /* @__PURE__ */ u3("span", { children: "Delegated to" }),
            /* @__PURE__ */ u3("button", { type: "button", class: `vt-field-chip${member ? "" : " is-placeholder"}`, onClick: () => pickMember(ctx, (id) => set({ delegatedTo: id })), children: [
              /* @__PURE__ */ u3(Icon, { name: "user" }),
              member ? member.nickname : "Choose a member"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-subissue-form-row", children: DATE_FIELDS.map(([key, label]) => /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: label }),
          /* @__PURE__ */ u3(
            "button",
            {
              type: "button",
              class: `vt-field-chip${draft[key] ? "" : " is-placeholder"}`,
              disabled: rules.lock !== null && isPeriodKey(key),
              onClick: () => editDate(key, label),
              children: [
                /* @__PURE__ */ u3(Icon, { name: "calendar" }),
                draft[key] ? formatShortDate(draft[key]) : "Not set"
              ]
            }
          )
        ] })) }),
        rules.lock !== null && /* @__PURE__ */ u3("div", { class: "vt-muted", children: rules.lock }),
        /* @__PURE__ */ u3("div", { class: "vt-subissue-form-row", children: [
          /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
            /* @__PURE__ */ u3("span", { children: "Estimated" }),
            /* @__PURE__ */ u3("input", { type: "text", class: "vt-small-input", placeholder: "e.g. 2h", value: estimated, onInput: (e3) => setEstimated(e3.currentTarget.value) })
          ] }),
          /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
            /* @__PURE__ */ u3("span", { children: "Size" }),
            /* @__PURE__ */ u3(
              SizeChips,
              {
                minutes: estimated.trim() === "" ? null : parseDurationInput(estimated),
                onPick: (m3) => {
                  setError(null);
                  setEstimated(m3 === null ? "" : formatMinutes(m3));
                },
                onXl: setError
              }
            )
          ] }),
          siblings.length > 0 && /* @__PURE__ */ u3(DependsField, { candidates: siblings, dependsOn: draft.dependsOn, onChange: (dependsOn) => set({ dependsOn }) })
        ] }),
        error !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: error }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: [
          /* @__PURE__ */ u3("button", { type: "button", class: "vt-danger-text", onClick: () => deleteSubWithConfirm(ctx, sub, close), children: "Delete" }),
          /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
          /* @__PURE__ */ u3(
            "button",
            {
              type: "button",
              onClick: () => {
                close();
                revealSub(sub);
              },
              children: "Open note"
            }
          ),
          /* @__PURE__ */ u3("button", { type: "button", onClick: close, children: "Cancel" }),
          /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: saving, children: "Save" })
        ] })
      ]
    }
  );
}

// src/ui/Segmented.tsx
function Segmented(props) {
  return /* @__PURE__ */ u3("div", { class: `vt-segmented${props.size === "small" ? " is-small" : ""}`, role: "group", "aria-label": props.label, children: props.options.map((o3) => /* @__PURE__ */ u3(
    "button",
    {
      type: "button",
      class: `vt-segmented-button${o3.value === props.value ? " is-on" : ""}${o3.icon ? " is-icon" : ""}`,
      "aria-pressed": o3.value === props.value,
      "aria-label": o3.icon ? o3.label : void 0,
      title: o3.icon ? o3.label : void 0,
      onClick: () => o3.value !== props.value && props.onChange(o3.value),
      children: o3.icon ? /* @__PURE__ */ u3(Icon, { name: o3.icon, fallback: o3.iconFallback }) : o3.label
    }
  )) });
}

// src/header/SubTimeline.tsx
var import_obsidian7 = require("obsidian");

// src/ui/ScrollRail.tsx
var MIN_THUMB = 24;
function railThumb(scrollLeft, scrollWidth, clientWidth, track) {
  if (scrollWidth <= clientWidth || track <= 0) return null;
  const width = Math.min(track, Math.max(MIN_THUMB, clientWidth / scrollWidth * track));
  const max = scrollWidth - clientWidth;
  const left = Math.min(max, Math.max(0, scrollLeft)) / max * (track - width);
  return { left, width };
}
function railScrollFor(startScroll, dx, scrollWidth, clientWidth, track, thumb) {
  const room = track - thumb;
  if (room <= 0) return startScroll;
  return startScroll + dx / room * (scrollWidth - clientWidth);
}
function ScrollRail(props) {
  const rail = A2(null);
  const thumb = A2(null);
  const drag = A2(null);
  const update = () => {
    const el = props.target.current;
    const r3 = rail.current;
    const t3 = thumb.current;
    if (!el || !r3 || !t3) return;
    const v3 = railThumb(el.scrollLeft, el.scrollWidth, el.clientWidth, r3.clientWidth);
    r3.classList.toggle("is-idle", v3 === null);
    if (v3) {
      t3.style.left = `${v3.left}px`;
      t3.style.width = `${v3.width}px`;
    }
  };
  h2(() => {
    const el = props.target.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (rail.current) ro.observe(rail.current);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  h2(update, [props.contentWidth]);
  const onThumbDown = (e3) => {
    const el = props.target.current;
    if (!el) return;
    e3.preventDefault();
    e3.stopPropagation();
    e3.currentTarget.setPointerCapture(e3.pointerId);
    drag.current = { x: e3.clientX, scroll: el.scrollLeft };
    rail.current?.classList.add("is-dragging");
  };
  const onThumbMove = (e3) => {
    const el = props.target.current;
    const d3 = drag.current;
    if (!el || !d3 || !rail.current || !thumb.current) return;
    el.scrollLeft = railScrollFor(d3.scroll, e3.clientX - d3.x, el.scrollWidth, el.clientWidth, rail.current.clientWidth, thumb.current.offsetWidth);
  };
  const onThumbUp = () => {
    drag.current = null;
    rail.current?.classList.remove("is-dragging");
  };
  const onTrackDown = (e3) => {
    const el = props.target.current;
    const r3 = rail.current;
    const t3 = thumb.current;
    if (!el || !r3 || !t3) return;
    const x2 = e3.clientX - r3.getBoundingClientRect().left - t3.offsetWidth / 2;
    el.scrollLeft = railScrollFor(0, x2, el.scrollWidth, el.clientWidth, r3.clientWidth, t3.offsetWidth);
  };
  const onWheel = (e3) => {
    const el = props.target.current;
    if (!el) return;
    e3.preventDefault();
    el.scrollLeft += Math.abs(e3.deltaX) > Math.abs(e3.deltaY) ? e3.deltaX : e3.deltaY;
  };
  return /* @__PURE__ */ u3("div", { class: `vt-scroll-rail${props.class ? ` ${props.class}` : ""}`, ref: rail, onPointerDown: onTrackDown, onWheel, "aria-hidden": "true", children: /* @__PURE__ */ u3("div", { class: "vt-scroll-rail-thumb", ref: thumb, onPointerDown: onThumbDown, onPointerMove: onThumbMove, onPointerUp: onThumbUp, onPointerCancel: onThumbUp }) });
}

// src/header/SubTimeline.tsx
var ROW = 36;
var HANDLE = 8;
function chartSub(sub) {
  return { id: sub.key, start: sub.start, end: sub.end, scheduled: sub.scheduled, dependsOn: sub.dependsOn.map((d3) => subKey(sub.parent, d3)) };
}
function SubTimeline(props) {
  return /* @__PURE__ */ u3(TimelineChart, { ctx: props.ctx, rows: props.subs.map((sub) => ({ kind: "sub", sub })), scale: props.scale, onScale: props.onScale, target: props.target ?? null });
}
function TimelineChart(props) {
  const { ctx, rows, scale } = props;
  const target = props.target ?? null;
  const subs = rows.flatMap((r3) => r3.kind === "sub" ? [r3.sub] : []);
  const today = localToday();
  const px = DAY_PX[scale];
  const dues = rows.flatMap((r3) => {
    if (r3.kind !== "project") return [];
    return [r3.issue.deadline, r3.issue.softDeadline].flatMap((d3) => d3 ? [{ id: r3.issue.id, start: null, end: null, scheduled: d3, dependsOn: [] }] : []);
  });
  const range = timelineRange([...subs.map(chartSub), ...dues], today, scale);
  const cols = timelineColumns(range, scale);
  const width = range.days * px;
  const scroller = A2(null);
  const [drag, setDrag] = d2(null);
  const [hovered, setHovered] = d2(null);
  const [focused, setFocused] = d2(null);
  const body = A2(null);
  const [link, setLink] = d2(null);
  const [selected, setSelected] = d2(null);
  const labels = A2(null);
  h2(() => {
    if (target !== null) labels.current?.querySelector(".vt-timeline-label.is-target")?.scrollIntoView({ block: "nearest" });
  }, [target]);
  h2(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, (dayOffset(range, today) - 2) * px);
  }, [scale]);
  const index = ctx.store.index;
  const lockOf = (parentId) => canEditSubPeriod(index.issues.get(parentId), index.planned(parentId), today) ? null : periodInInboxMessage(parentId);
  const parents = [...new Set(subs.map((s3) => s3.parent))];
  const fixedLock = parents.length === 1 && !rows.some((r3) => r3.kind === "project") ? lockOf(parents[0]) : null;
  const [notice, setNotice] = d2(null);
  const save = (sub, next) => {
    const lock = lockOf(sub.parent);
    if (lock !== null) return setNotice(lock);
    const parent = index.issues.get(sub.parent);
    const error = parent ? subPeriodError(parent, index.planned(sub.parent), sub, next, today) : null;
    if (error) return setNotice(error);
    setNotice(null);
    return void ctx.writer.updateSub(sub.key, { start: next.start, end: next.end }).catch((e3) => ctx.report("\u671F\u9593\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  };
  const shown = (sub) => {
    const bar = barOf(sub);
    return drag && drag.key === sub.key && bar ? dragBar(drag.bar, drag.mode, drag.delta) : bar;
  };
  const xOf = (date) => dayOffset(range, date) * px;
  const byKey = new Map(subs.map((s3) => [s3.key, s3]));
  const rowOf = new Map(rows.flatMap((r3, i3) => r3.kind === "sub" ? [[r3.sub.key, i3]] : []));
  const chartSubs = subs.map((s3) => ({ ...chartSub(s3), ...shown(s3) ?? {} }));
  const arrows = dependencyArrows(chartSubs).map((a3) => ({ ...a3, fromRow: rowOf.get(a3.from), toRow: rowOf.get(a3.to) }));
  const spans = rows.map((r3) => {
    const bar = r3.kind === "sub" ? shown(r3.sub) : null;
    return bar ? { x0: xOf(bar.start), x1: xOf(bar.end) + px } : null;
  });
  const routes = routeArrows(arrows, spans, ROW);
  const active = hovered ?? focused;
  const related = incomingOf(arrows, active);
  const routed = arrows.map((a3, i3) => ({ late: a3.late, related: related?.arrows.includes(i3) ?? false, d: roundedPath(routes[i3], 4) }));
  const relatedFrom = new Set(related?.from ?? []);
  const connectable = (from, to) => byKey.get(from)?.parent === byKey.get(to)?.parent && canConnect(chartSubs, from, to);
  const saveDeps = (sub, dependsOn) => ctx.writer.updateSub(sub.key, { dependsOn }).catch((e3) => ctx.report("\u4F9D\u5B58\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  const removeDep = (a3) => {
    const to = byKey.get(a3.to);
    const from = byKey.get(a3.from);
    setSelected(null);
    if (to && from) void saveDeps(to, to.dependsOn.filter((d3) => d3 !== from.id));
  };
  const pointInBody = (e3) => {
    const rect = body.current?.getBoundingClientRect();
    return { x: e3.clientX - (rect?.left ?? 0), y: e3.clientY - (rect?.top ?? 0) };
  };
  const startLink = (e3, sub) => {
    if (e3.button !== 0) return;
    e3.preventDefault();
    e3.stopPropagation();
    e3.currentTarget.setPointerCapture(e3.pointerId);
    setSelected(null);
    setLink({ from: sub.key, ...pointInBody(e3), target: null });
  };
  const moveLink = (e3) => {
    if (!link) return;
    const key = document.elementFromPoint(e3.clientX, e3.clientY)?.closest("[data-sub-key]")?.dataset.subKey ?? null;
    setLink({ ...link, ...pointInBody(e3), target: key !== null && connectable(link.from, key) ? key : null });
  };
  const endLink = () => {
    if (!link) return;
    const l3 = link;
    setLink(null);
    const to = l3.target === null ? void 0 : byKey.get(l3.target);
    const from = byKey.get(l3.from);
    if (to && from) void saveDeps(to, [...to.dependsOn, from.id]);
  };
  const startDrag = (e3, sub, mode) => {
    const bar = barOf(sub);
    if (!bar || e3.button !== 0) return;
    const lock = lockOf(sub.parent);
    if (lock !== null) return setNotice(lock);
    setSelected(null);
    e3.preventDefault();
    e3.stopPropagation();
    e3.currentTarget.setPointerCapture(e3.pointerId);
    setDrag({ key: sub.key, mode, x0: e3.clientX, bar, delta: 0 });
  };
  const moveDrag = (e3) => {
    if (!drag) return;
    const delta = Math.round((e3.clientX - drag.x0) / px);
    if (delta !== drag.delta) setDrag({ ...drag, delta });
  };
  const endDrag = (sub) => {
    if (!drag) return;
    const d3 = drag;
    setDrag(null);
    if (d3.delta !== 0) void save(sub, dragBar(d3.bar, d3.mode, d3.delta));
  };
  const keyDown = (e3, sub) => {
    const bar = barOf(sub);
    if (e3.key === "Enter") {
      e3.preventDefault();
      openSubEditor(ctx, sub);
    } else if (bar && (e3.key === "ArrowLeft" || e3.key === "ArrowRight")) {
      e3.preventDefault();
      void save(sub, dragBar(bar, e3.shiftKey ? "end" : "move", e3.key === "ArrowLeft" ? -1 : 1));
    }
  };
  const pickDay = (e3, sub) => {
    if (barOf(sub)) return;
    const rect = e3.currentTarget.getBoundingClientRect();
    const date = dateAtX(range, e3.clientX - rect.left, scale);
    void save(sub, { start: date, end: date });
  };
  const pickSize = (e3, sub) => {
    e3.stopPropagation();
    const m3 = new import_obsidian7.Menu();
    for (const size of SIZES) {
      m3.addItem((item) => item.setTitle(`${size.label} (${formatMinutes(size.minutes)})`).onClick(() => void ctx.writer.updateSub(sub.key, { estimated: size.minutes }).catch((err) => ctx.report("\u898B\u7A4D\u3082\u308A\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", err))));
    }
    m3.showAtMouseEvent(e3);
  };
  const onSubLabel = props.onSubLabel ?? revealSub;
  const height = rows.length * ROW;
  const load = props.load ? dayLoad(props.load.items, props.load.capacity) : null;
  return /* @__PURE__ */ u3(S, { children: [
    (notice ?? fixedLock) !== null && /* @__PURE__ */ u3("div", { class: "vt-muted vt-timeline-notice", children: notice ?? fixedLock }),
    /* @__PURE__ */ u3("div", { class: `vt-timeline is-${scale}${related ? " has-focus" : ""}${link ? " has-link" : ""}${load ? " has-load" : ""}`, onKeyDown: (e3) => e3.key === "Escape" && setSelected(null), children: [
      /* @__PURE__ */ u3("div", { class: "vt-timeline-labels", ref: labels, children: [
        /* @__PURE__ */ u3("div", { class: "vt-timeline-corner", children: /* @__PURE__ */ u3(
          Segmented,
          {
            label: "Scale",
            size: "small",
            options: [
              { value: "day", label: "Day" },
              { value: "week", label: "Week" }
            ],
            value: scale,
            onChange: props.onScale
          }
        ) }),
        load && /* @__PURE__ */ u3("div", { class: "vt-timeline-load-label", title: "Estimated hours per column, compared with the time you can use (settings)", children: "Load" }),
        rows.map(
          (row) => row.kind === "project" ? /* @__PURE__ */ u3("button", { type: "button", class: "vt-timeline-label is-project", title: `Open: ${row.issue.summary}`, onClick: () => void ctx.openPath(row.issue.path), children: [
            /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: row.issue.id }),
            /* @__PURE__ */ u3("span", { class: "vt-timeline-label-text", children: row.issue.summary })
          ] }) : /* @__PURE__ */ u3(
            "button",
            {
              type: "button",
              class: `vt-timeline-label${row.sub.status === "closed" || row.sub.status === "canceled" ? " is-done" : ""}${row.sub.key === target ? " is-target" : ""}${rows.some((r3) => r3.kind === "project") ? " is-child" : ""}`,
              title: `Open: ${row.sub.summary}`,
              onClick: () => onSubLabel(row.sub),
              children: [
                /* @__PURE__ */ u3(StatusIcon, { status: row.sub.status }),
                /* @__PURE__ */ u3("span", { class: "vt-timeline-label-text", children: row.sub.summary })
              ]
            }
          )
        )
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-timeline-main", children: [
        /* @__PURE__ */ u3("div", { class: `vt-timeline-scroll${props.stickyScrollbar ? " has-rail" : ""}`, ref: scroller, children: /* @__PURE__ */ u3("div", { class: "vt-timeline-grid", style: { width: `${width}px` }, children: [
          /* @__PURE__ */ u3("div", { class: "vt-timeline-head", children: cols.map((c3) => /* @__PURE__ */ u3(
            "div",
            {
              class: `vt-timeline-col${c3.weekend ? " is-weekend" : ""}${c3.weekStart ? " is-week-start" : ""}${c3.date === today ? " is-today" : ""}`,
              style: { left: `${xOf(c3.date)}px`, width: `${c3.span * px}px` },
              children: [
                c3.month !== null && /* @__PURE__ */ u3("span", { class: "vt-timeline-month", children: c3.month }),
                /* @__PURE__ */ u3("span", { class: "vt-timeline-day", children: c3.label })
              ]
            }
          )) }),
          load && props.load && /* @__PURE__ */ u3("div", { class: "vt-timeline-load", children: cols.map((c3) => {
            const v3 = columnLoad(load, c3.date, c3.span, props.load.capacity);
            const text = loadLabel(v3.minutes, v3.unknown);
            const tip = `Estimated ${formatMinutes(v3.minutes)} / available ${formatMinutes(v3.capacity)}${v3.over ? " (over)" : ""}${v3.unknown > 0 ? `
${v3.unknown} sub-issue(s) without an estimate` : ""}`;
            return /* @__PURE__ */ u3("div", { class: `vt-timeline-load-cell${v3.over ? " is-over" : ""}`, style: { left: `${xOf(c3.date)}px`, width: `${c3.span * px}px` }, title: tip, children: [
              text,
              v3.over && /* @__PURE__ */ u3("span", { class: "vt-timeline-load-over", children: "!" })
            ] });
          }) }),
          /* @__PURE__ */ u3("div", { class: "vt-timeline-body", ref: body, style: { height: `${height}px` }, onPointerDown: () => setSelected(null), children: [
            cols.map((c3) => /* @__PURE__ */ u3("div", { class: `vt-timeline-stripe${c3.weekend ? " is-weekend" : ""}${c3.weekStart ? " is-week-start" : ""}`, style: { left: `${xOf(c3.date)}px`, width: `${c3.span * px}px` } })),
            /* @__PURE__ */ u3("svg", { class: "vt-timeline-arrows", width, height, "aria-hidden": "true", children: [
              /* @__PURE__ */ u3("defs", { children: ["", "-late", "-related"].map((suffix) => (
                // 先端は塗らない小さな「>」（線の太さによらず 5px）。主張を小さくする
                /* @__PURE__ */ u3("marker", { id: `vt-timeline-arrowhead${suffix}`, viewBox: "0 0 6 6", refX: "5", refY: "3", markerWidth: "5", markerHeight: "5", markerUnits: "userSpaceOnUse", orient: "auto-start-reverse", children: /* @__PURE__ */ u3("path", { d: "M1 0.5 L5 3 L1 5.5", class: `vt-timeline-arrowhead${suffix === "-late" ? " is-late" : suffix === "-related" ? " is-related" : ""}` }) })
              )) }),
              routed.map((r3) => /* @__PURE__ */ u3(
                "path",
                {
                  class: `vt-timeline-arrow${r3.late ? " is-late" : ""}${r3.related ? " is-related" : ""}`,
                  d: r3.d,
                  "marker-end": `url(#vt-timeline-arrowhead${r3.late ? "-late" : r3.related ? "-related" : ""})`
                }
              )),
              link && (() => {
                const row = rowOf.get(link.from);
                const span = spans[row];
                return span && /* @__PURE__ */ u3("path", { class: "vt-timeline-link", d: `M${span.x1} ${row * ROW + ROW / 2} L${link.x} ${link.y}` });
              })()
            ] }),
            /* @__PURE__ */ u3("svg", { class: "vt-timeline-arrow-hits", "aria-hidden": "true", width, height, children: arrows.map((a3, i3) => {
              const isSel = selected?.from === a3.from && selected?.to === a3.to;
              return /* @__PURE__ */ u3(
                "path",
                {
                  class: `vt-timeline-arrow-hit${isSel ? " is-selected" : ""}`,
                  d: routed[i3].d,
                  onPointerDown: (e3) => e3.stopPropagation(),
                  onClick: () => setSelected({ from: a3.from, to: a3.to })
                }
              );
            }) }),
            selected && (() => {
              const i3 = arrows.findIndex((a3) => a3.from === selected.from && a3.to === selected.to);
              if (i3 < 0) return null;
              const [x2, y3] = arrowMidpoint(routes[i3]);
              return /* @__PURE__ */ u3(
                "button",
                {
                  type: "button",
                  class: "vt-timeline-arrow-remove",
                  style: { left: `${x2}px`, top: `${y3}px` },
                  title: "Remove dependency",
                  "aria-label": "Remove dependency",
                  ref: (el) => el?.focus(),
                  onPointerDown: (e3) => e3.stopPropagation(),
                  onKeyDown: (e3) => {
                    if (e3.key === "Delete" || e3.key === "Backspace") {
                      e3.preventDefault();
                      removeDep(selected);
                    }
                  },
                  onClick: () => removeDep(selected),
                  children: "\xD7"
                }
              );
            })(),
            /* @__PURE__ */ u3("div", { class: "vt-timeline-today", style: { left: `${xOf(today) + px / 2}px` }, "aria-hidden": "true" }),
            rows.map((row, i3) => {
              if (row.kind === "project")
                return /* @__PURE__ */ u3(
                  ProjectRow,
                  {
                    issue: row.issue,
                    subs: row.subs.map((s3) => shown(s3)),
                    top: i3 * ROW,
                    xOf,
                    px,
                    onBudget: needsBudget(row.issue, index.subs(row.issue.id), today) ? () => editEstimate(ctx, row.issue.estimated, saveIssue(ctx, row.issue)) : null
                  }
                );
              const sub = row.sub;
              const bar = shown(sub);
              const left = bar ? xOf(bar.start) : 0;
              const barWidth = bar ? (dayOffset(range, bar.end) - dayOffset(range, bar.start) + 1) * px : 0;
              const handles = barWidth >= HANDLE * 3;
              const period = bar ? `${formatShortDate(bar.start)} \u2013 ${formatShortDate(bar.end)}` : "";
              const nothing = !bar && sub.scheduled === null;
              const key = sub.key;
              return /* @__PURE__ */ u3("div", { class: `vt-timeline-row${bar ? "" : " is-empty"}`, style: { top: `${i3 * ROW}px` }, onClick: (e3) => pickDay(e3, sub), title: bar ? void 0 : "Click a day to set the period", children: [
                nothing && /* @__PURE__ */ u3("span", { class: "vt-timeline-none", children: "No dates" }),
                !bar && sub.scheduled !== null && /* @__PURE__ */ u3("span", { class: "vt-timeline-dot", style: { left: `${xOf(sub.scheduled) + px / 2}px` }, title: `Calendar ${formatShortDate(sub.scheduled)}` }),
                bar && /* @__PURE__ */ u3(
                  "div",
                  {
                    "data-sub-key": key,
                    class: `vt-timeline-bar vt-status-${sub.status}${link && link.from !== key ? link.target === key ? " is-link-target" : connectable(link.from, key) ? "" : " is-link-no" : ""}${selected?.to === key || selected?.from === key ? " is-selected-end" : ""}${drag?.key === key ? " is-dragging" : ""}${active === key && related ? " is-active" : ""}${relatedFrom.has(key) ? " is-related" : ""}`,
                    style: { left: `${left}px`, width: `${barWidth}px` },
                    tabIndex: 0,
                    role: "button",
                    "aria-label": `${sub.summary}: ${period}. Drag or use arrow keys to move, Shift + arrow keys to change the end`,
                    title: `${sub.summary}
${period}`,
                    onPointerEnter: () => setHovered(key),
                    onPointerLeave: () => setHovered((h3) => h3 === key ? null : h3),
                    onFocus: () => setFocused(key),
                    onBlur: () => setFocused((f4) => f4 === key ? null : f4),
                    onPointerDown: (e3) => startDrag(e3, sub, "move"),
                    onPointerMove: moveDrag,
                    onPointerUp: () => endDrag(sub),
                    onPointerCancel: () => setDrag(null),
                    onKeyDown: (e3) => keyDown(e3, sub),
                    onClick: (e3) => e3.stopPropagation(),
                    children: [
                      /* @__PURE__ */ u3(
                        "span",
                        {
                          class: "vt-timeline-connector",
                          title: "Connect: drag to a bar that depends on this",
                          "aria-hidden": "true",
                          onPointerDown: (e3) => startLink(e3, sub),
                          onPointerMove: moveLink,
                          onPointerUp: endLink,
                          onPointerCancel: () => setLink(null)
                        }
                      ),
                      handles && /* @__PURE__ */ u3(S, { children: [
                        /* @__PURE__ */ u3("span", { class: "vt-timeline-handle is-start", "aria-hidden": "true", onPointerDown: (e3) => startDrag(e3, sub, "start"), onPointerMove: moveDrag, onPointerUp: () => endDrag(sub) }),
                        /* @__PURE__ */ u3("span", { class: "vt-timeline-handle is-end", "aria-hidden": "true", onPointerDown: (e3) => startDrag(e3, sub, "end"), onPointerMove: moveDrag, onPointerUp: () => endDrag(sub) })
                      ] })
                    ]
                  }
                ),
                bar && needsEstimate(sub, today) && /* @__PURE__ */ u3("button", { type: "button", class: "vt-timeline-estimate", style: { left: `${left + barWidth + 16}px` }, title: "No estimate: choose a size", onClick: (e3) => pickSize(e3, sub), children: "Estimate" })
              ] });
            })
          ] })
        ] }) }),
        props.stickyScrollbar && /* @__PURE__ */ u3(ScrollRail, { target: scroller, class: "vt-timeline-rail", contentWidth: width })
      ] })
    ] })
  ] });
}
function ProjectRow(props) {
  const { issue, xOf, px } = props;
  const bars = props.subs.filter((b2) => b2 !== null);
  const span = bars.length > 0 ? { start: bars.map((b2) => b2.start).reduce((a3, b2) => b2 < a3 ? b2 : a3), end: bars.map((b2) => b2.end).reduce((a3, b2) => b2 > a3 ? b2 : a3) } : null;
  const marks = [
    issue.softDeadline ? { date: issue.softDeadline, kind: "soft", label: `Soft deadline ${formatShortDate(issue.softDeadline)}` } : null,
    issue.deadline ? { date: issue.deadline, kind: "hard", label: `Deadline ${formatShortDate(issue.deadline)}` } : null
  ].filter((m3) => m3 !== null);
  return /* @__PURE__ */ u3("div", { class: "vt-timeline-row is-project", style: { top: `${props.top}px` }, children: [
    span && /* @__PURE__ */ u3("div", { class: "vt-timeline-span", style: { left: `${xOf(span.start)}px`, width: `${xOf(span.end) - xOf(span.start) + px}px` }, title: `${formatShortDate(span.start)} \u2013 ${formatShortDate(span.end)}` }),
    marks.map((m3) => /* @__PURE__ */ u3("span", { class: `vt-timeline-due is-${m3.kind}`, style: { left: `${xOf(m3.date) + px / 2}px` }, title: m3.label })),
    props.onBudget && /* @__PURE__ */ u3(
      "button",
      {
        type: "button",
        class: "vt-timeline-estimate is-budget",
        style: { left: `${span ? xOf(span.end) + px + 16 : 4}px` },
        title: "No estimated for this project: enter the budget for its sub-issues",
        onClick: props.onBudget,
        children: "Budget"
      }
    )
  ] });
}

// src/header/SubIssues.tsx
var DRAG_TYPE = "application/x-pkm-sub-issue";
function SubIssues(props) {
  const { ctx, issue, index, now } = props;
  const [showClosed, setShowClosed] = d2(false);
  const [mode, setMode] = d2("list");
  const [scale, setScale] = d2("day");
  const [target, setTarget] = d2(null);
  const card = A2(null);
  h2(() => {
    setTimelineRevealer(issue.id, (sub) => {
      setMode("timeline");
      setTarget(sub.key);
      card.current?.scrollIntoView({ block: "nearest" });
    });
    return () => setTimelineRevealer(issue.id, null);
  }, [issue.id]);
  const subs = index.subs(issue.id);
  if (issue.scheduled !== null && subs.length === 0) return null;
  const shown = visibleSubs(subs, showClosed);
  const counts = subCounts(subs);
  const effort = index.effortByKey(now);
  const visibleKeys = shown.map((s3) => s3.key);
  const move2 = (key, before) => void ctx.writer.moveSubBefore(key, before).catch((e3) => ctx.report("\u30B5\u30D6\u3092\u4E26\u3079\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  return /* @__PURE__ */ u3("section", { class: "vt-card vt-subissues", ref: card, children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Sub-issues" }),
      counts.total > 0 && /* @__PURE__ */ u3("span", { class: "vt-count", title: `${counts.open} open of ${counts.total}`, children: [
        counts.open,
        " / ",
        counts.total
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      counts.total > 0 && /* @__PURE__ */ u3(
        Segmented,
        {
          label: "View",
          options: [
            { value: "list", label: "List", icon: "list" },
            { value: "timeline", label: "Timeline", icon: "chart-gantt", iconFallback: "gantt-chart" }
          ],
          value: mode,
          onChange: (v3) => {
            setMode(v3);
            if (v3 === "list") setTarget(null);
          }
        }
      ),
      /* @__PURE__ */ u3(PresetButton, { ctx, issue, index })
    ] }),
    mode === "timeline" && shown.length > 0 && /* @__PURE__ */ u3(SubTimeline, { ctx, subs: shown, scale, onScale: setScale, target }),
    mode === "list" && shown.length > 0 && /* @__PURE__ */ u3("ul", { class: "vt-subissue-list", children: shown.map((sub) => /* @__PURE__ */ u3(
      SubRow,
      {
        ctx,
        sub,
        index,
        actual: effort.get(sub.key) ?? 0,
        visible: visibleKeys,
        onDrop: (dragged) => move2(dragged, sub.key)
      },
      sub.key
    )) }),
    counts.closed > 0 && /* @__PURE__ */ u3("button", { type: "button", class: "vt-text-button vt-subissues-closed", onClick: () => setShowClosed((v3) => !v3), children: showClosed ? "Hide closed" : `Show ${counts.closed} closed` }),
    /* @__PURE__ */ u3(QuickAdd, { ctx, issue, onDropEnd: (dragged) => move2(dragged, null) })
  ] });
}
function PresetButton(props) {
  const { ctx, issue, index } = props;
  const open = (e3) => {
    const m3 = new import_obsidian8.Menu();
    for (const preset of index.data.presets) {
      m3.addItem(
        (mi) => mi.setTitle(preset.name).setIcon("copy-plus").onClick(
          () => void ctx.writer.applyPreset(issue.id, preset).then(
            (keys) => new import_obsidian8.Notice(`\u30D7\u30EA\u30BB\u30C3\u30C8\u300C${preset.name}\u300D\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F\uFF08\u30B5\u30D6 ${keys.length} \u4EF6\uFF09`),
            (err) => ctx.report("\u30D7\u30EA\u30BB\u30C3\u30C8\u3092\u8FFD\u52A0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", err)
          )
        )
      );
    }
    if (index.data.presets.length > 0) m3.addSeparator();
    m3.addItem((mi) => mi.setTitle("Manage presets\u2026").setIcon("settings").onClick(() => void ctx.openView("pkm-task-presets")));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3("button", { type: "button", class: "vt-icon-button", "aria-label": "Apply preset", title: "Apply preset", onClick: open, children: /* @__PURE__ */ u3(Icon, { name: "copy-plus" }) });
}
function readDrag(e3) {
  return e3.dataTransfer?.getData(DRAG_TYPE) || null;
}
function SubRow(props) {
  const { ctx, sub, index, actual } = props;
  const [dropBefore, setDropBefore] = d2(false);
  const running = index.running(sub.key);
  const hint = subHint(sub, localToday());
  const save = (patch) => void ctx.writer.updateSub(sub.key, patch).catch((e3) => ctx.report("\u30B5\u30D6\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  const statusMenu = (e3) => showStatusMenu(ctx, e3, sub.key);
  const moreMenu = (e3) => {
    const m3 = new import_obsidian8.Menu();
    const at = props.visible.indexOf(sub.key);
    m3.addItem((mi) => mi.setTitle("Edit").setIcon("pencil").onClick(() => openSubEditor(ctx, sub)));
    m3.addSeparator();
    if (at > 0) m3.addItem((mi) => mi.setTitle("Move up").setIcon("arrow-up").onClick(() => void ctx.writer.stepSub(sub.key, props.visible, -1).catch((err) => ctx.report("\u30B5\u30D6\u3092\u4E26\u3079\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", err))));
    if (at >= 0 && at < props.visible.length - 1) m3.addItem((mi) => mi.setTitle("Move down").setIcon("arrow-down").onClick(() => void ctx.writer.stepSub(sub.key, props.visible, 1).catch((err) => ctx.report("\u30B5\u30D6\u3092\u4E26\u3079\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", err))));
    m3.addSeparator();
    m3.addItem((mi) => mi.setTitle("Delete").setIcon("trash-2").onClick(() => deleteSubWithConfirm(ctx, sub)));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3(
    "li",
    {
      class: `vt-subissue${isDoneStatus(sub.status) ? " is-done" : ""}${running.length > 0 ? " is-running" : ""}${dropBefore ? " is-drop-before" : ""}`,
      draggable: true,
      onDragStart: (e3) => e3.dataTransfer?.setData(DRAG_TYPE, sub.key),
      onDragOver: (e3) => {
        if (!e3.dataTransfer?.types.includes(DRAG_TYPE)) return;
        e3.preventDefault();
        setDropBefore(true);
      },
      onDragLeave: () => setDropBefore(false),
      onDrop: (e3) => {
        e3.preventDefault();
        setDropBefore(false);
        const dragged = readDrag(e3);
        if (dragged && dragged !== sub.key) props.onDrop(dragged);
      },
      children: /* @__PURE__ */ u3("div", { class: "vt-subissue-row", children: [
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-subissue-status", "aria-label": `Status: ${sub.status}`, title: `Status: ${sub.status}`, onClick: statusMenu, children: /* @__PURE__ */ u3(StatusIcon, { status: sub.status }) }),
        /* @__PURE__ */ u3(StatusStepButton, { ctx, keyOf: sub.key }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-subissue-summary", title: `Open: ${sub.summary}`, onClick: () => revealSub(sub), children: [
          /* @__PURE__ */ u3("span", { class: "vt-subissue-summary-text", children: sub.summary }),
          hint !== null && /* @__PURE__ */ u3("span", { class: "vt-subissue-hint", children: hint })
        ] }),
        actual >= 1 && /* @__PURE__ */ u3("span", { class: "vt-subissue-actual vt-num", children: formatMinutes(actual) }),
        /* @__PURE__ */ u3(PickTimer, { ctx, keyOf: sub.key }),
        /* @__PURE__ */ u3("button", { type: "button", class: "vt-icon-button", "aria-label": "More actions", title: "More actions", onClick: moreMenu, children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
      ] })
    }
  );
}
function QuickAdd(props) {
  const { ctx, issue } = props;
  const [draft, setDraft] = d2("");
  const [over2, setOver] = d2(false);
  const create = (summaries) => {
    if (summaries.length === 0) return;
    void ctx.writer.createSubs(issue.id, summaries).catch((e3) => ctx.report("\u30B5\u30D6\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  };
  return /* @__PURE__ */ u3(
    "form",
    {
      class: `vt-quick-add vt-subissue-add${over2 ? " is-drop-before" : ""}`,
      onSubmit: (e3) => {
        e3.preventDefault();
        create(splitQuickAdd(draft));
        setDraft("");
      },
      onDragOver: (e3) => {
        if (!e3.dataTransfer?.types.includes(DRAG_TYPE)) return;
        e3.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e3) => {
        e3.preventDefault();
        setOver(false);
        const dragged = readDrag(e3);
        if (dragged) props.onDropEnd(dragged);
      },
      children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        /* @__PURE__ */ u3(
          "input",
          {
            type: "text",
            "aria-label": "Add a sub-issue",
            placeholder: "Add a sub-issue",
            value: draft,
            onInput: (e3) => setDraft(e3.currentTarget.value),
            onPaste: (e3) => {
              const text = e3.clipboardData?.getData("text/plain") ?? "";
              if (!/\r?\n/.test(text.trim())) return;
              e3.preventDefault();
              create(splitQuickAdd(text));
            },
            onKeyDown: (e3) => {
              if (e3.key === "Escape") e3.currentTarget.blur();
            }
          }
        )
      ]
    }
  );
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
  return /* @__PURE__ */ u3("nav", { class: "vt-pager", "aria-label": "Pages", children: [
    /* @__PURE__ */ u3("button", { class: "vt-pager-step", disabled: current === 0, onClick: () => onChange(current - 1), "aria-label": "Newer", children: /* @__PURE__ */ u3(Icon, { name: "chevron-left" }) }),
    pageItems(current, pages).map(
      (i3) => i3 === null ? /* @__PURE__ */ u3("span", { class: "vt-pager-gap", children: "\u2026" }) : /* @__PURE__ */ u3("button", { class: `vt-pager-page${i3 === current ? " is-current" : ""}`, "aria-current": i3 === current ? "page" : void 0, onClick: () => onChange(i3), children: i3 + 1 })
    ),
    /* @__PURE__ */ u3("button", { class: "vt-pager-step", disabled: current >= pages - 1, onClick: () => onChange(current + 1), "aria-label": "Older", children: /* @__PURE__ */ u3(Icon, { name: "chevron-right" }) })
  ] });
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
function IssueHeader(props) {
  const { ctx, path } = props;
  useStoreVersion(ctx.store);
  const now = useNow();
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
      /* @__PURE__ */ u3(ScheduleStrip, { ctx, issue, save, calendar: issue.scheduled !== null || index.subs(issue.id).length === 0 }),
      /* @__PURE__ */ u3(DueFields, { ctx, issue, save })
    ] }) }),
    /* @__PURE__ */ u3(SubIssues, { ctx, issue, index, now }),
    /* @__PURE__ */ u3(Effort, { ctx, issue, index, save }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" }),
    /* @__PURE__ */ u3(Worklog, { ctx, taskId: issue.id, index }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" })
  ] });
}
function SummaryField(props) {
  const { summary, save } = props;
  const field = props.field ?? "summary";
  const [editing, setEditing] = d2(false);
  const commit = (value) => {
    setEditing(false);
    if (value.trim() && value.trim() !== summary) save({ [field]: value.trim() });
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
    ) : /* @__PURE__ */ u3("span", { class: "vt-summary", onClick: () => setEditing(true), title: "Click to edit", children: [
      summary || "(no summary)",
      /* @__PURE__ */ u3(Icon, { name: "pencil", class: "vt-hover-icon" })
    ] })
  ] });
}
function StatusField(props) {
  const { ctx, issue, index, save } = props;
  const menu = (e3) => showStatusMenu(ctx, e3, issue.id);
  const editDetail = () => editStatusDetail(ctx, issue.statusDetail, save);
  const editRevisit = () => new PreactModal(ctx.app, "revisit (shows up in Organize after this date)", (close) => /* @__PURE__ */ u3(
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
  const list = index.list(issue, localToday());
  return /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3(StatusBadge, { status: issue.status, wide: true, onClick: menu }),
    /* @__PURE__ */ u3(StatusStepButton, { ctx, keyOf: issue.id }),
    /* @__PURE__ */ u3("div", { class: "vt-status-detail", children: [
      issue.status === "delegated" && /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: () => pickMember(ctx, (id) => save({ delegated_to: id })), children: [
        /* @__PURE__ */ u3(Icon, { name: "user" }),
        member ? member.nickname : issue.delegatedTo ?? "Choose delegate"
      ] }),
      list !== null && /* @__PURE__ */ u3(GtdListBadge, { issue, list }),
      index.isProject(issue.id) && /* @__PURE__ */ u3(ProjectBadge, {}),
      issue.status === "someday" && /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: editRevisit, children: [
        /* @__PURE__ */ u3(Icon, { name: "calendar-clock" }),
        "revisit ",
        issue.revisit ? formatShortDate(issue.revisit) : "\u2014"
      ] }),
      /* @__PURE__ */ u3("button", { class: `vt-field-chip${issue.statusDetail ? "" : " is-placeholder"}`, onClick: editDetail, children: [
        /* @__PURE__ */ u3(Icon, { name: "pencil" }),
        issue.statusDetail || "Add detail"
      ] })
    ] })
  ] });
}
function LabelsField(props) {
  const { ctx, labels, index, save } = props;
  const colors2 = new Map(index.data.labels.map((l3) => [l3.name, l3.color]));
  return /* @__PURE__ */ u3("button", { class: "vt-labels", onClick: () => editLabels(ctx, labels, save), title: "Edit labels", children: [
    labels.map((name) => /* @__PURE__ */ u3(LabelBadge, { name, color: colors2.get(name) ?? "var(--background-modifier-border)" })),
    /* @__PURE__ */ u3("span", { class: "vt-badge vt-label is-empty", children: [
      /* @__PURE__ */ u3(Icon, { name: labels.length === 0 ? "tag" : "pencil" }),
      labels.length === 0 ? "label" : ""
    ] })
  ] });
}
function ScheduleStrip(props) {
  const { ctx, issue, save, calendar } = props;
  const today = localToday();
  const days = Array.from({ length: 7 }, (_2, i3) => addDays(today, i3));
  const setCalendar = (d3) => save(scheduledPatch(issue, d3));
  const subs = ctx.store.index.subs(issue.id);
  const limit = ticklerLimit(subs, today);
  const pick = (title, initial, onPick, validate) => () => new PreactModal(ctx.app, title, (close) => /* @__PURE__ */ u3(
    DateForm,
    {
      initial,
      validate,
      onSubmit: (v3) => {
        close();
        onPick(v3);
      }
    }
  )).open();
  const later = issue.scheduled !== null && issue.scheduled > days[6];
  return /* @__PURE__ */ u3("div", { class: "vt-strip", children: [
    calendar && /* @__PURE__ */ u3("div", { class: "vt-strip-days", children: days.map((d3) => /* @__PURE__ */ u3("div", { class: "vt-strip-col", children: [
      /* @__PURE__ */ u3("span", { class: "vt-weekday", children: WEEKDAY_NAMES[weekdayOf(d3)] }),
      /* @__PURE__ */ u3(DayCell, { date: d3, scheduled: issue.scheduled === d3, softDeadline: issue.softDeadline, deadline: issue.deadline, today, onClick: () => setCalendar(issue.scheduled === d3 ? null : d3) })
    ] })) }),
    subs.length > 0 && /* @__PURE__ */ u3(UnallocatedBudget, { issue, subs, onEdit: () => editEstimate(ctx, issue.estimated, save) }),
    /* @__PURE__ */ u3("div", { class: "vt-row", children: [
      calendar && /* @__PURE__ */ u3("button", { class: "vt-text-button", onClick: pick("Calendar (must be done on this day)", issue.scheduled, setCalendar), children: [
        "calendar >",
        issue.scheduled !== null && (later || issue.scheduled < today) ? ` (${formatShortDate(issue.scheduled)})` : ""
      ] }),
      canSetTickler(issue.status) ? /* @__PURE__ */ u3(
        "button",
        {
          class: `vt-field-chip${issue.tickler ? "" : " is-placeholder"}`,
          title: limit.blocked ? ticklerBlockedMessage(issue.id) : "Tickler: hidden until this date, then back to Inbox",
          onClick: pick(
            "Tickler (back to Inbox on this date)",
            issue.tickler ?? addDays(today, 1),
            (d3) => save(ticklerFieldPatch(issue, d3)),
            (d3) => ticklerWithSubsError(issue.id, subs, d3, today)
          ),
          children: [
            /* @__PURE__ */ u3(Icon, { name: "alarm-clock" }),
            "tickler ",
            issue.tickler ? formatShortDate(issue.tickler) : "\u2014"
          ]
        }
      ) : issue.tickler && /* @__PURE__ */ u3("button", { class: "vt-field-chip", title: "Only open issues can have a Tickler. Click to clear it", onClick: () => save({ tickler: null }), children: [
        /* @__PURE__ */ u3(Icon, { name: "alarm-clock" }),
        "tickler ",
        formatShortDate(issue.tickler),
        " \xD7"
      ] })
    ] })
  ] });
}
function UnallocatedBudget(props) {
  const rest = unallocatedBudget(props.issue, props.subs);
  const assigned = props.subs.filter((s3) => s3.status !== "canceled" && s3.estimated !== null).reduce((n2, s3) => n2 + s3.estimated, 0);
  if (rest === null) {
    return /* @__PURE__ */ u3("button", { type: "button", class: "vt-budget is-editable", title: "Enter the estimated of this issue to see the budget left for sub-issues", onClick: props.onEdit, children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: [
        "unallocated",
        /* @__PURE__ */ u3(Icon, { name: "pencil", class: "vt-trailing" })
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-budget-value", children: "\u2014" }),
      /* @__PURE__ */ u3("span", { class: "vt-muted vt-budget-detail", children: "No estimated. Click to enter the budget" })
    ] });
  }
  return /* @__PURE__ */ u3("div", { class: `vt-budget${rest < 0 ? " is-over" : ""}`, title: `estimated ${formatMinutes(props.issue.estimated)} \u2212 sub-issues ${formatMinutes(assigned)} (canceled not counted)`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "unallocated" }),
    /* @__PURE__ */ u3("span", { class: "vt-budget-value", children: formatMinutes(rest) }),
    /* @__PURE__ */ u3("span", { class: "vt-muted vt-budget-detail", children: rest < 0 ? "Over the estimated" : "of the estimated, not yet in sub-issues" })
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
    /* @__PURE__ */ u3("span", { class: "vt-due-value", children: value ? formatShortDate(value) : "Not set" }),
    /* @__PURE__ */ u3(Icon, { name: "calendar", class: "vt-trailing" })
  ] });
  return /* @__PURE__ */ u3("div", { class: "vt-dues", children: [
    row("soft_deadline", "soft_deadline", issue.softDeadline),
    row("deadline", "deadline", issue.deadline)
  ] });
}
function Effort(props) {
  const { ctx, issue, index, save } = props;
  const actual = index.effortMinutes(Date.now()).get(issue.id) ?? 0;
  return /* @__PURE__ */ u3("div", { class: "vt-effort", children: [
    /* @__PURE__ */ u3(EstimateField, { value: issue.estimated, onSave: (estimated) => save({ estimated }) }),
    /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: "Calculated from the worklog", children: [
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
  const sub = log.sub ? ctx.store.index.sub(`${log.taskId}#${log.sub}`) ?? { summary: "Deleted sub-issue" } : null;
  const edit = () => new PreactModal(ctx.app, "Edit worklog", (close) => /* @__PURE__ */ u3(
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
  return /* @__PURE__ */ u3("button", { class: `vt-log${running ? " is-running" : ""}`, onClick: edit, title: "Click to edit", children: [
    /* @__PURE__ */ u3("span", { class: "vt-log-date", children: [
      /* @__PURE__ */ u3("span", { class: "vt-log-day", children: date.slice(5).replace("-", "/") }),
      /* @__PURE__ */ u3("span", { class: "vt-log-weekday", children: WEEKDAY_NAMES[weekdayOf(date)] })
    ] }),
    /* @__PURE__ */ u3("span", { class: "vt-log-main", children: [
      /* @__PURE__ */ u3("span", { class: "vt-log-time vt-num", children: [
        formatTime(log.fromMs),
        " \u2013 ",
        running ? "running" : formatTime(log.toMs)
      ] }),
      sub && /* @__PURE__ */ u3("span", { class: "vt-log-sub", children: sub.summary }),
      /* @__PURE__ */ u3("span", { class: `vt-log-desc${log.description ? "" : " is-placeholder"}`, children: log.description || "No description" })
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
    new PreactModal(ctx.app, "Add worklog", (close) => /* @__PURE__ */ u3(
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
      props.index.issues.has(taskId) && /* @__PURE__ */ u3(PickTimer, { ctx, keyOf: taskId }),
      logs.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-count", children: logs.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-text-button", onClick: add, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " Add"
      ] })
    ] }),
    logs.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No worklog yet" }),
    /* @__PURE__ */ u3("div", { class: "vt-log-list", children: shown.map((l3) => /* @__PURE__ */ u3(WorklogItem, { ctx: props.ctx, log: l3 }, l3.id)) }),
    pages > 1 && /* @__PURE__ */ u3(Pager, { current, pages, onChange: setPage })
  ] });
}

// src/header/MemberHeader.tsx
var import_obsidian9 = require("obsidian");

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

// src/header/MemberHeader.tsx
function MemberField(props) {
  const { label, field, value, required, save } = props;
  const [draft, setDraft] = d2(value);
  h2(() => setDraft(value), [value]);
  const error = required && !draft.trim() ? `${label} \u306F\u7A7A\u306B\u3067\u304D\u307E\u305B\u3093` : null;
  const commit = () => {
    const next = draft.trim();
    if (error !== null) return;
    if (next !== value) save({ [field]: next || null });
  };
  return /* @__PURE__ */ u3("label", { class: `vt-name-field vt-member-field${error ? " is-error" : ""}`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-name-label", children: label }),
    /* @__PURE__ */ u3(
      "input",
      {
        type: "text",
        value: draft,
        "aria-invalid": error !== null,
        onInput: (e3) => setDraft(e3.currentTarget.value),
        onBlur: commit,
        onKeyDown: (e3) => {
          if (e3.key === "Enter" && !e3.isComposing) commit();
          if (e3.key === "Escape") setDraft(value);
        }
      }
    ),
    /* @__PURE__ */ u3("span", { class: error ? "vt-name-error" : "vt-name-hint", children: error ?? props.hint })
  ] });
}
function DelegatedIssues(props) {
  const { ctx } = props;
  const active = props.issues.filter((i3) => !isDoneStatus(i3.status));
  const done = props.issues.length - active.length;
  return /* @__PURE__ */ u3("div", { class: "vt-member-issues", children: [
    /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
      "Delegated issues ",
      active.length
    ] }),
    active.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-muted", children: "No delegated issues" }),
    active.map((issue) => /* @__PURE__ */ u3("div", { class: "vt-member-issue", children: [
      /* @__PURE__ */ u3(StatusBadge, { status: issue.status }),
      /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: issue.id }),
      /* @__PURE__ */ u3("span", { class: "vt-member-issue-summary", ...linkProps((e3) => void ctx.openPath(issue.path, import_obsidian9.Keymap.isModEvent(e3) !== false)), children: issue.summary || "(no summary)" })
    ] }, issue.id)),
    done > 0 && /* @__PURE__ */ u3("div", { class: "vt-muted", children: [
      "Finished (closed / canceled) ",
      done
    ] })
  ] });
}
function MemberHeader(props) {
  const { ctx, path } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const member = [...index.members.values()].find((m3) => m3.path === path);
  if (!member) {
    return /* @__PURE__ */ u3("div", { class: "vt-header-missing", children: "member \u306E frontmatter \u3092\u8AAD\u3081\u307E\u305B\u3093\uFF08type / id \u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\uFF09" });
  }
  const save = (fields) => void ctx.writer.update(path, fields).catch((e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  const issues = [...index.issues.values()].filter((i3) => i3.delegatedTo === member.id).sort((a3, b2) => a3.id.localeCompare(b2.id, "en", { numeric: true }));
  return /* @__PURE__ */ u3("div", { class: "vt-issue vt-member", children: [
    /* @__PURE__ */ u3("div", { class: "vt-meta", children: [
      /* @__PURE__ */ u3("span", { children: [
        "created ",
        formatDateTime(member.created)
      ] }),
      /* @__PURE__ */ u3("span", { children: [
        "updated ",
        formatDateTime(ctx.store.mtime(path))
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-title vt-member-title", children: [
      /* @__PURE__ */ u3(Icon, { name: "user", class: "vt-member-icon" }),
      /* @__PURE__ */ u3("span", { class: "vt-member-nickname", children: member.nickname }),
      /* @__PURE__ */ u3("span", { class: "vt-member-name", children: [
        "(",
        member.name,
        ")"
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: member.id })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-member-fields", children: [
      /* @__PURE__ */ u3(MemberField, { label: "nickname", field: "nickname", value: member.nickname, hint: "What you call them. Empty uses name", save }),
      /* @__PURE__ */ u3(MemberField, { label: "name", field: "name", value: member.name, hint: "Full name", required: true, save }),
      /* @__PURE__ */ u3(MemberField, { label: "alias", field: "alias", value: member.alias, hint: `Find them with @${member.alias} when choosing a delegate. Empty uses the ID`, save }),
      /* @__PURE__ */ u3("div", { class: "vt-member-labels", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "label" }),
        /* @__PURE__ */ u3(LabelsField, { ctx, labels: member.labels, index, save })
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: /* @__PURE__ */ u3(DelegatedIssues, { ctx, issues }) }),
    /* @__PURE__ */ u3("hr", { class: "vt-sep" })
  ] });
}

// src/core/presets.ts
var PRESET_PATH_RE = /^preset\/[^/]+\.md$/;
var FRONTMATTER_RE2 = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;
function presetBodyOf(text) {
  const fm = FRONTMATTER_RE2.exec(text);
  return text.slice(fm ? fm[0].length : 0).replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
}
function parsePreset(path, fm, text) {
  const r3 = new Reader(path, fm);
  const id = r3.common("preset", "p");
  const name = r3.string("name") ?? "";
  if (!name) r3.problem("missing-name", "name \u304C\u3042\u308A\u307E\u305B\u3093", "warning");
  const subIssues = [];
  const subEstimates = [];
  for (const v3 of r3.list("sub_issues")) {
    const item = presetSubItem(v3);
    if (typeof item === "string") {
      r3.problem("invalid-preset-sub", `sub_issues: ${item}: ${JSON.stringify(v3)}`);
      continue;
    }
    if (item.estimateError !== null) r3.problem("invalid-preset-sub", `sub_issues: ${item.estimateError}: ${JSON.stringify(v3)}`);
    subIssues.push(item.summary);
    subEstimates.push(item.estimated);
  }
  let body = text === void 0 ? "" : presetBodyOf(text);
  const bodyError = presetBodyError(body);
  if (bodyError !== null) {
    r3.problem("invalid-preset-body", `\u672C\u6587: ${bodyError}`);
    body = "";
  }
  if (id === null) return { value: null, problems: r3.problems };
  const estimates = subEstimates.some((e3) => e3 !== null) ? { subEstimates } : {};
  return { value: { path, id, name: name || id, subIssues, ...estimates, body, created: r3.datetime("created") }, problems: r3.problems };
}
function presetSubItem(v3) {
  if (typeof v3 === "string") {
    const error2 = presetSubError(v3);
    return error2 ?? { summary: v3.trim(), estimated: null, estimateError: null };
  }
  if (typeof v3 !== "object" || v3 === null || Array.isArray(v3)) return "\u6587\u5B57\u5217\u304B\u3001summary \u3068 estimated \u306E\u5BFE\u5FDC\u306B\u3057\u3066\u304F\u3060\u3055\u3044";
  const o3 = v3;
  if (typeof o3.summary !== "string") return "summary \u304C\u3042\u308A\u307E\u305B\u3093";
  const error = presetSubError(o3.summary);
  if (error !== null) return error;
  const e3 = o3.estimated;
  if (e3 === void 0 || e3 === null) return { summary: o3.summary.trim(), estimated: null, estimateError: null };
  if (typeof e3 === "number" && Number.isFinite(e3) && e3 >= 0) return { summary: o3.summary.trim(), estimated: e3, estimateError: null };
  return { summary: o3.summary.trim(), estimated: null, estimateError: "estimated \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044" };
}
function presetSubItems(subIssues, subEstimates) {
  return subIssues.map((summary, i3) => {
    const estimated = subEstimates?.[i3] ?? null;
    return estimated === null ? summary : { summary, estimated };
  });
}
function presetSubError(summary) {
  if (!summary.trim()) return "\u984C\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044";
  if (/[\r\n]/.test(summary)) return "\u984C\u306B\u6539\u884C\u306F\u66F8\u3051\u307E\u305B\u3093";
  if (summary.includes("-->")) return "\u984C\u306B --> \u306F\u66F8\u3051\u307E\u305B\u3093";
  return null;
}
function presetBodyError(body) {
  if (body.split(/\r?\n/).some((l3) => l3.startsWith(SUB_ISSUE_MARKER))) return `\u884C\u982D\u306B ${SUB_ISSUE_MARKER} \u306F\u66F8\u3051\u307E\u305B\u3093`;
  return null;
}
function newPresetContent(id, name, created) {
  return ["---", `schema: ${SCHEMA_VERSION}`, "type: preset", `id: ${id}`, `name: ${JSON.stringify(name)}`, "sub_issues: []", `created: ${created}`, `updated: ${created}`, "---", "", ""].join("\n");
}
function presetBodyPreview(body) {
  const line = body.split(/\r?\n/).find((l3) => l3.trim() !== "") ?? "";
  return line.replace(/^#+\s*/, "").trim();
}
function matchPreset(p3, text) {
  const q2 = text.trim().toLowerCase();
  if (!q2) return true;
  return [p3.id, p3.name, ...p3.subIssues, p3.body].some((s3) => s3.toLowerCase().includes(q2));
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
    /* @__PURE__ */ u3("input", { ref, type: "text", value: props.value, placeholder: props.placeholder ?? "Name", onInput: (e3) => props.onInput(e3.currentTarget.value) }),
    props.error && /* @__PURE__ */ u3("span", { class: "vt-name-error", children: props.error })
  ] });
}
function RowTools(props) {
  const deleteTitle = props.deleteDisabled ?? `Delete ${props.what}`;
  return /* @__PURE__ */ u3("span", { class: "vt-row-tools", children: [
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: "Move up", "aria-label": "Move up", disabled: props.index === 0, onClick: () => props.onMove(-1), children: /* @__PURE__ */ u3(Icon, { name: "arrow-up" }) }),
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: "Move down", "aria-label": "Move down", disabled: props.index === props.count - 1, onClick: () => props.onMove(1), children: /* @__PURE__ */ u3(Icon, { name: "arrow-down" }) }),
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: deleteTitle, "aria-label": deleteTitle, disabled: props.deleteDisabled !== void 0, onClick: props.onDelete, children: /* @__PURE__ */ u3(Icon, { name: "trash-2" }) })
  ] });
}

// src/header/PresetHeader.tsx
function PresetHeader(props) {
  const { ctx, path } = props;
  useStoreVersion(ctx.store);
  const preset = ctx.store.index.data.presets.find((p3) => p3.path === path);
  if (!preset) {
    return /* @__PURE__ */ u3("div", { class: "vt-header-missing", children: "preset \u306E frontmatter \u3092\u8AAD\u3081\u307E\u305B\u3093\uFF08type / id \u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\uFF09" });
  }
  const save = (fields) => void ctx.writer.update(path, fields).catch((e3) => ctx.report("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  return /* @__PURE__ */ u3("div", { class: "vt-issue vt-preset", children: [
    /* @__PURE__ */ u3("div", { class: "vt-meta", children: [
      /* @__PURE__ */ u3("span", { children: [
        "created ",
        formatDateTime(preset.created)
      ] }),
      /* @__PURE__ */ u3("span", { children: [
        "updated ",
        formatDateTime(ctx.store.mtime(path))
      ] })
    ] }),
    /* @__PURE__ */ u3(SummaryField, { badge: /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: preset.id }), summary: preset.name, field: "name", save }),
    /* @__PURE__ */ u3(PresetSubs, { preset, save }),
    /* @__PURE__ */ u3("div", { class: "vt-banner vt-preset-hint", children: [
      /* @__PURE__ */ u3(Icon, { name: "copy-plus" }),
      " Apply this preset from the Sub-issues card of an issue. The sub-issues are added at the end, and the body below is appended to the end of the issue's body."
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-field-label vt-preset-body-label", children: "Body" })
  ] });
}
function PresetSubs(props) {
  const { preset, save } = props;
  const subs = preset.subIssues.map((summary, i3) => ({ summary, estimated: preset.subEstimates?.[i3] ?? null }));
  const write = (next) => save({
    sub_issues: presetSubItems(
      next.map((s3) => s3.summary),
      next.map((s3) => s3.estimated)
    )
  });
  return /* @__PURE__ */ u3("section", { class: "vt-card vt-preset-subs", "aria-label": "Sub-issues", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Sub-issues" }),
      subs.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-count", children: subs.length })
    ] }),
    subs.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No sub-issues yet" }),
    subs.length > 0 && /* @__PURE__ */ u3("ol", { class: "vt-preset-sub-list", children: subs.map((sub, i3) => /* @__PURE__ */ u3(
      PresetSubRow,
      {
        index: i3,
        count: subs.length,
        summary: sub.summary,
        estimated: sub.estimated,
        onCommit: (v3) => write(subs.map((s3, j3) => j3 === i3 ? { ...s3, summary: v3 } : s3)),
        onEstimate: (m3) => write(subs.map((s3, j3) => j3 === i3 ? { ...s3, estimated: m3 } : s3)),
        onMove: (d3) => write(move(subs, i3, d3)),
        onDelete: () => write(subs.filter((_2, j3) => j3 !== i3))
      },
      `${i3}:${sub.summary}`
    )) }),
    /* @__PURE__ */ u3(SubQuickAdd, { onAdd: (added) => write([...subs, ...added.map((summary) => ({ summary, estimated: null }))]) })
  ] });
}
function PresetSubRow(props) {
  const { summary } = props;
  const [draft, setDraft] = d2(summary);
  h2(() => setDraft(summary), [summary]);
  const error = presetSubError(draft);
  const commit = () => {
    const next = draft.trim();
    if (error === null && next !== summary) props.onCommit(next);
  };
  return /* @__PURE__ */ u3("li", { class: "vt-preset-sub", children: [
    /* @__PURE__ */ u3("label", { class: `vt-name-field${error ? " is-error" : ""}`, children: [
      /* @__PURE__ */ u3("span", { class: "vt-name-label", children: [
        "#",
        props.index + 1
      ] }),
      /* @__PURE__ */ u3(
        "input",
        {
          type: "text",
          value: draft,
          placeholder: "Sub-issue title",
          "aria-invalid": error !== null,
          onInput: (e3) => setDraft(e3.currentTarget.value),
          onBlur: commit,
          onKeyDown: (e3) => {
            if (e3.key === "Enter" && !e3.isComposing) commit();
            if (e3.key === "Escape") setDraft(summary);
          }
        }
      ),
      error && /* @__PURE__ */ u3("span", { class: "vt-name-error", children: error })
    ] }),
    /* @__PURE__ */ u3(SizeChips, { minutes: props.estimated, onPick: props.onEstimate, clearable: true }),
    /* @__PURE__ */ u3(RowTools, { what: "sub-issue", index: props.index, count: props.count, onMove: props.onMove, onDelete: props.onDelete })
  ] });
}
function SubQuickAdd(props) {
  const [draft, setDraft] = d2("");
  const [error, setError] = d2(null);
  const add = (summaries) => {
    if (summaries.length === 0) return false;
    const bad = summaries.map(presetSubError).find((e3) => e3 !== null) ?? null;
    setError(bad);
    if (bad !== null) return false;
    props.onAdd(summaries);
    return true;
  };
  return /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3(
      "form",
      {
        class: "vt-quick-add vt-subissue-add",
        onSubmit: (e3) => {
          e3.preventDefault();
          if (add(splitQuickAdd(draft))) setDraft("");
        },
        children: [
          /* @__PURE__ */ u3(Icon, { name: "plus" }),
          /* @__PURE__ */ u3(
            "input",
            {
              type: "text",
              "aria-label": "Add a sub-issue",
              placeholder: "Add a sub-issue",
              value: draft,
              "aria-invalid": error !== null,
              onInput: (e3) => {
                setDraft(e3.currentTarget.value);
                setError(null);
              },
              onPaste: (e3) => {
                const text = e3.clipboardData?.getData("text/plain") ?? "";
                if (!/\r?\n/.test(text.trim())) return;
                e3.preventDefault();
                add(splitQuickAdd(text));
              },
              onKeyDown: (e3) => {
                if (e3.key === "Escape") e3.currentTarget.blur();
              }
            }
          )
        ]
      }
    ),
    error && /* @__PURE__ */ u3("span", { class: "vt-name-error", children: error })
  ] });
}

// src/header/RoutineHeader.tsx
var import_obsidian10 = require("obsidian");

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
      /* @__PURE__ */ u3("span", { children: "Repeat" }),
      /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: [
        [
          ["day", "Daily"],
          ["week", "Weekly"],
          ["month", "Monthly"]
        ].map(([v3, label]) => /* @__PURE__ */ u3("button", { type: "button", class: `vt-filter-chip${draft.every === v3 ? " is-on" : ""}`, onClick: () => set({ every: v3 }), children: label })),
        /* @__PURE__ */ u3("span", { class: "vt-muted", children: "Every" }),
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
      /* @__PURE__ */ u3("span", { children: "Days (comma-separated. 15 / last = last day / 2th-tue = 2nd Tuesday / last-fri = last Friday)" }),
      /* @__PURE__ */ u3("input", { type: "text", value: draft.monthText, onInput: (e3) => set({ monthText: e3.currentTarget.value }) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-muted", children: readRepeatDraft(draft).description })
  ] });
}

// src/header/RoutineHeader.tsx
var RESULT_DAYS = 14;
var RESULT_MARK = { closed: "\u2713", canceled: "\xD7", none: "\u30FB", off: "" };
var RESULT_LABEL = { closed: "closed", canceled: "canceled", none: "not recorded", off: "not scheduled" };
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
        /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: read.error !== null, children: "Save" }) })
      ]
    }
  );
}
function Results(props) {
  return /* @__PURE__ */ u3("div", { class: "vt-routine-results", children: [
    /* @__PURE__ */ u3("div", { class: "vt-field-label", children: [
      "Last ",
      RESULT_DAYS,
      " days"
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-results", children: props.results.map((r3) => {
      const label = `${r3.date} ${RESULT_LABEL[r3.state]}`;
      return /* @__PURE__ */ u3("div", { class: `vt-result is-${r3.state}`, title: label, "aria-label": label, role: "img", children: [
        /* @__PURE__ */ u3("span", { class: "vt-result-weekday", children: WEEKDAY_NAMES[weekdayOf(r3.date)] }),
        /* @__PURE__ */ u3("span", { class: "vt-num", children: Number(r3.date.slice(8, 10)) }),
        /* @__PURE__ */ u3("span", { class: "vt-result-mark", children: RESULT_MARK[r3.state] })
      ] });
    }) }),
    /* @__PURE__ */ u3("div", { class: "vt-muted", children: "\u2713 closed\u3000\xD7 canceled\u3000\u30FB not recorded\u3000blank not scheduled" })
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
  const editRepeat = () => new PreactModal(ctx.app, "Repeat", (close) => /* @__PURE__ */ u3(
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
  const categoryMenu = (e3) => {
    const m3 = new import_obsidian10.Menu();
    for (const c3 of [null, ...ROUTINE_CATEGORIES]) {
      m3.addItem(
        (mi) => mi.setTitle(c3 ?? DEFAULT_CATEGORY_NAME).setChecked(routine.category === c3).onClick(() => save({ category: c3 }))
      );
    }
    m3.showAtMouseEvent(e3);
  };
  const missedMenu = (e3) => {
    const m3 = new import_obsidian10.Menu();
    for (const v3 of [null, ...ROUTINE_MISSED]) {
      m3.addItem(
        (mi) => mi.setTitle(v3 ?? DEFAULT_MISSED_NAME).setChecked(routine.missed === v3).onClick(() => save({ missed: v3 }))
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
          "aria-label": routine.active ? "Pause" : "Resume",
          title: routine.active ? "Pause" : "Resume",
          onClick: () => save({ active: !routine.active }),
          children: /* @__PURE__ */ u3("span", { class: "vt-switch-thumb" })
        }
      )
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: [
      /* @__PURE__ */ u3("div", { class: "vt-row vt-chips", children: [
        /* @__PURE__ */ u3("button", { class: "vt-field-chip", onClick: editRepeat, children: [
          /* @__PURE__ */ u3(Icon, { name: "repeat" }),
          routine.repeat ? describeRepeat(routine.repeat) : "Invalid repeat"
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
        /* @__PURE__ */ u3("button", { class: "vt-field-chip", "aria-label": "Category", title: "Where it appears: default is the board, closing is the Closing screen", onClick: categoryMenu, children: [
          /* @__PURE__ */ u3(Icon, { name: routine.category === "closing" ? "moon" : "layout-dashboard" }),
          routine.category ?? DEFAULT_CATEGORY_NAME,
          /* @__PURE__ */ u3(Icon, { name: "chevron-down" })
        ] }),
        /* @__PURE__ */ u3(
          "button",
          {
            class: "vt-field-chip",
            "aria-label": "When missed",
            title: "When missed: list shows it under Missed in Today's Calendar, carry puts it on today's board until it is closed",
            onClick: missedMenu,
            children: [
              /* @__PURE__ */ u3(Icon, { name: routine.missed === "carry" ? "rotate-cw" : "list" }),
              "missed: ",
              routine.missed ?? DEFAULT_MISSED_NAME,
              /* @__PURE__ */ u3(Icon, { name: "chevron-down" })
            ]
          }
        ),
        /* @__PURE__ */ u3(PriorityBadge, { priority: routine.priority, onClick: (e3) => priorityMenu(e3, routine.priority, save) }),
        /* @__PURE__ */ u3(LabelsField, { ctx, labels: routine.labels, index, save })
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card", children: /* @__PURE__ */ u3(Results, { results: routineResults(index, routine, localToday(), RESULT_DAYS) }) }),
    /* @__PURE__ */ u3("div", { class: "vt-effort", children: [
      /* @__PURE__ */ u3(EstimateField, { value: routine.estimated, onSave: (estimated) => save({ estimated }) }),
      /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: "Calculated from the worklog", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "total" }),
        /* @__PURE__ */ u3("span", { class: "vt-effort-value", children: formatMinutes(effort.total) })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-effort-cell is-readonly", title: effort.days > 0 ? `Daily average over ${effort.days} recorded days` : "Calculated from the worklog", children: [
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
var MEMBER_PATH_RE = /^member\/[^/]+\.md$/;
var PRESET_PATH_RE2 = /^preset\/[^/]+\.md$/;
var HEADER_CLASS = "vt-header vt-ui";
function isTaskNotePath(path) {
  return ISSUE_PATH_RE.test(path) || ROUTINE_PATH_RE.test(path) || MEMBER_PATH_RE.test(path) || PRESET_PATH_RE2.test(path);
}
function headerFor(path) {
  if (ROUTINE_PATH_RE.test(path)) return RoutineHeader;
  if (MEMBER_PATH_RE.test(path)) return MemberHeader;
  if (PRESET_PATH_RE2.test(path)) return PresetHeader;
  return IssueHeader;
}
function installTaskHeaders(ctx, plugin) {
  const { app } = ctx;
  installHeaderMount({
    plugin,
    className: HEADER_CLASS,
    views: () => {
      const views = [];
      app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof import_obsidian11.MarkdownView) views.push(leaf.view);
      });
      return views;
    },
    activeView: () => app.workspace.getActiveViewOfType(import_obsidian11.MarkdownView),
    model: (view) => {
      const path = view.file?.path ?? null;
      return path !== null && isTaskNotePath(path) ? path : null;
    },
    // 別のノートに切り替わったら、ヘッダーの状態（開いた入力欄など）を持ち越さない
    draw: (host, path) => R(k(headerFor(path), { key: path, ctx, path }), host),
    clear: (host) => R(null, host),
    resized: remeasureEditor
  });
}

// src/header/sub-cards.ts
var import_state = require("@codemirror/state");
var import_view = require("@codemirror/view");
var import_obsidian13 = require("obsidian");

// src/core/sub-sticky.ts
function pickSticky(regions, edge, rowHeight) {
  let pick = null;
  regions.forEach((r3, index) => {
    if (r3.top < edge && r3.bottom > edge) pick = { index, offset: Math.min(0, r3.bottom - edge - rowHeight) };
  });
  return pick;
}
function toggleScrollDelta(before, after, edge, floating) {
  const delta = floating ? after - edge : after - before;
  return Math.abs(delta) < 1 ? 0 : delta;
}

// src/obsidian/sub-card.tsx
var import_obsidian12 = require("obsidian");

// src/core/draft.ts
function adoptValue(state, value, normalize) {
  if (value === state.draft || value === normalize(state.draft)) return { draft: state.draft, dirty: false };
  if (!state.dirty) return { draft: value, dirty: false };
  return state;
}

// src/obsidian/sub-card.tsx
function issueIdOf(path) {
  return path.replace(/^issue\//, "").replace(/\.md$/, "");
}
function useDraft(value, commit, delayMs, normalize = (v3) => v3) {
  const [draft, setDraft] = d2(value);
  const s3 = A2({ draft: value, dirty: false, value, commit, normalize, timer: 0 });
  s3.current.value = value;
  s3.current.commit = commit;
  s3.current.normalize = normalize;
  h2(() => {
    const c3 = s3.current;
    const next = adoptValue({ draft: c3.draft, dirty: c3.dirty }, value, c3.normalize);
    c3.dirty = next.dirty;
    if (next.draft !== c3.draft) {
      c3.draft = next.draft;
      setDraft(next.draft);
    }
  }, [value]);
  const flush = () => {
    const c3 = s3.current;
    window.clearTimeout(c3.timer);
    if (!c3.dirty || c3.draft === c3.value) return;
    const sent = c3.draft;
    void c3.commit(sent).then((ok) => {
      if (ok && s3.current.draft === sent) s3.current.dirty = false;
    });
  };
  h2(() => () => flush(), []);
  const cancel = () => {
    const c3 = s3.current;
    window.clearTimeout(c3.timer);
    c3.dirty = false;
    c3.draft = c3.value;
    setDraft(c3.value);
  };
  const input = (v3) => {
    const c3 = s3.current;
    c3.draft = v3;
    c3.dirty = true;
    setDraft(v3);
    window.clearTimeout(c3.timer);
    if (delayMs !== null) c3.timer = window.setTimeout(flush, delayMs);
  };
  return { draft, input, flush, cancel };
}
function SubCard(props) {
  const { ctx, sub, open } = props;
  const [error, setError] = d2(null);
  const save = (patch) => props.save(patch).then(() => {
    setError(null);
    return true;
  }).catch((e3) => {
    setError(e3 instanceof Error ? e3.message : String(e3));
    return false;
  });
  return /* @__PURE__ */ u3("div", { class: "vt-sub-card vt-ui", children: /* @__PURE__ */ u3("div", { class: `vt-subissue${isDoneStatus(sub.status) ? " is-done" : ""}${open ? " is-open" : ""}`, children: [
    /* @__PURE__ */ u3(SubRow2, { ctx, sub, open, onToggle: props.onToggle, save, titleDelayMs: open ? props.delayMs : void 0 }),
    open && /* @__PURE__ */ u3(SubFields, { ...props, save, error })
  ] }) });
}
function SubRow2(props) {
  const { ctx, sub, open, save } = props;
  const [editing, setEditing] = d2(false);
  const editable = props.titleDelayMs !== void 0;
  h2(() => {
    if (!editable) setEditing(false);
  }, [editable]);
  const statusMenu = (e3) => showStatusMenu(ctx, e3, sub.key, (patch) => save(patch));
  const hint = subHint(sub, localToday());
  return /* @__PURE__ */ u3("div", { class: "vt-subissue-row", children: [
    /* @__PURE__ */ u3("button", { type: "button", class: "vt-subissue-status", "aria-label": `Status: ${sub.status}`, title: `Status: ${sub.status}`, onClick: statusMenu, children: /* @__PURE__ */ u3(StatusIcon, { status: sub.status }) }),
    /* @__PURE__ */ u3(StatusStepButton, { ctx, keyOf: sub.key, save: (patch) => save(patch) }),
    editable && editing ? (
      // 入力中は題を押しても開閉しない。矢印は見た目だけ残す
      /* @__PURE__ */ u3("div", { class: "vt-subissue-summary is-editing", children: [
        /* @__PURE__ */ u3(Icon, { name: "chevron-down" }),
        /* @__PURE__ */ u3(TitleInput, { summary: sub.summary, save, delayMs: props.titleDelayMs ?? null, close: () => setEditing(false) })
      ] })
    ) : /* @__PURE__ */ u3("button", { type: "button", class: `vt-subissue-summary${editable ? " has-title-edit" : ""}`, "aria-expanded": open, title: sub.summary, onClick: props.onToggle, children: [
      /* @__PURE__ */ u3(Icon, { name: open ? "chevron-down" : "chevron-right" }),
      /* @__PURE__ */ u3("span", { class: "vt-subissue-summary-text", children: sub.summary }),
      hint !== null && /* @__PURE__ */ u3("span", { class: "vt-subissue-hint", children: hint })
    ] }),
    editable && !editing && /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-icon-button vt-subissue-title-edit", "aria-label": "Edit title", title: "Edit title", onClick: () => setEditing(true), children: /* @__PURE__ */ u3(Icon, { name: "pencil" }) }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" })
    ] }),
    /* @__PURE__ */ u3(PickTimer, { ctx, keyOf: sub.key })
  ] });
}
function TitleInput(props) {
  const { save, close } = props;
  const summary = useDraft(props.summary, (v3) => v3.trim() === "" ? Promise.resolve(false) : save({ summary: v3.trim() }), props.delayMs, (v3) => v3.trim());
  const ref = A2(null);
  h2(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const finish = () => {
    summary.flush();
    close();
  };
  return /* @__PURE__ */ u3(
    "input",
    {
      ref,
      type: "text",
      class: "vt-subissue-title-input",
      "aria-label": "Title",
      value: summary.draft,
      onInput: (e3) => summary.input(e3.currentTarget.value),
      onBlur: finish,
      onKeyDown: (e3) => {
        if (e3.isComposing) return;
        if (e3.key === "Enter") {
          e3.preventDefault();
          finish();
        } else if (e3.key === "Escape") {
          e3.preventDefault();
          e3.stopPropagation();
          summary.cancel();
          close();
        }
      }
    }
  );
}
function StickySubRow(props) {
  const { ctx, sub } = props;
  const save = (patch) => props.save(patch).then(() => true).catch((e3) => {
    ctx.report("\u30B5\u30D6\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    return false;
  });
  return /* @__PURE__ */ u3("div", { class: "vt-sub-card vt-ui", children: /* @__PURE__ */ u3("div", { class: `vt-subissue is-open${isDoneStatus(sub.status) ? " is-done" : ""}`, children: /* @__PURE__ */ u3(SubRow2, { ctx, sub, open: true, onToggle: props.onToggle, save }) }) });
}
function SubFields(props) {
  const { ctx, sub, save } = props;
  const member = sub.delegatedTo === null ? null : ctx.store.index.members.get(sub.delegatedTo);
  const others = props.siblings.filter((s3) => s3.id !== sub.id);
  const rules = subDateRules(ctx, sub);
  const estimatedText = sub.estimated === null ? "" : formatMinutes(sub.estimated);
  const [estimatedError, setEstimatedError] = d2(null);
  const estimated = useDraft(
    estimatedText,
    (v3) => {
      const minutes = v3.trim() === "" ? null : parseDurationInput(v3);
      if (minutes === null && v3.trim() !== "") {
        setEstimatedError(`\u898B\u7A4D\u3082\u308A\u3092\u6642\u9593\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093: ${v3}\uFF08\u4F8B: 30m / 2h / 1h30m\uFF09`);
        return Promise.resolve(false);
      }
      setEstimatedError(null);
      return save({ estimated: minutes });
    },
    null
  );
  return /* @__PURE__ */ u3("div", { class: "vt-subissue-detail vt-subissue-form", children: [
    /* @__PURE__ */ u3("div", { class: "vt-subissue-form-row", children: [
      sub.status === "delegated" && /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
        /* @__PURE__ */ u3("span", { children: "Delegated to" }),
        /* @__PURE__ */ u3("button", { type: "button", class: `vt-field-chip${member ? "" : " is-placeholder"}`, onClick: () => pickMember(ctx, (id) => void save({ delegatedTo: id })), children: [
          /* @__PURE__ */ u3(Icon, { name: "user" }),
          member ? member.nickname : "Choose a member"
        ] })
      ] }),
      SUB_DATE_FIELDS.map(([key, label]) => /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
        /* @__PURE__ */ u3("span", { children: label }),
        /* @__PURE__ */ u3(
          "button",
          {
            type: "button",
            class: `vt-field-chip${sub[key] ? "" : " is-placeholder"}`,
            disabled: rules.lock !== null && isPeriodKey(key),
            title: rules.lock !== null && isPeriodKey(key) ? rules.lock : void 0,
            onClick: () => pickSubDate(ctx, label, sub[key], (v3) => void save({ [key]: v3 }), rules.validate(key, sub)),
            children: [
              /* @__PURE__ */ u3(Icon, { name: "calendar" }),
              sub[key] ? formatShortDate(sub[key]) : "Not set"
            ]
          }
        )
      ] })),
      /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
        /* @__PURE__ */ u3("span", { children: "Estimated" }),
        /* @__PURE__ */ u3(
          "input",
          {
            type: "text",
            class: "vt-small-input",
            placeholder: "e.g. 2h",
            value: estimated.draft,
            onInput: (e3) => estimated.input(e3.currentTarget.value),
            onBlur: estimated.flush,
            onKeyDown: (e3) => {
              if (e3.key === "Enter" && !e3.isComposing) estimated.flush();
            }
          }
        )
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-text-field", children: [
        /* @__PURE__ */ u3("span", { children: "Size" }),
        /* @__PURE__ */ u3(
          SizeChips,
          {
            minutes: sub.estimated,
            onPick: (m3) => {
              setEstimatedError(null);
              void save({ estimated: m3 });
            },
            onXl: setEstimatedError
          }
        )
      ] }),
      others.length > 0 && /* @__PURE__ */ u3(DependsField, { candidates: others, dependsOn: sub.dependsOn, onChange: (dependsOn) => void save({ dependsOn }) })
    ] }),
    (props.error ?? estimatedError) !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: props.error ?? estimatedError }),
    props.onShowSource && /* @__PURE__ */ u3("div", { class: "vt-form", children: [
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-text-button", onClick: props.onShowSource, children: "Show source" })
    ] })
  ] });
}
function UnreadableCard(props) {
  return /* @__PURE__ */ u3("div", { class: "vt-sub-card vt-ui", children: /* @__PURE__ */ u3("div", { class: "vt-subissue is-unreadable", children: [
    /* @__PURE__ */ u3("div", { class: "vt-subissue-row", children: [
      /* @__PURE__ */ u3("span", { class: "vt-subissue-status", "aria-hidden": "true", children: /* @__PURE__ */ u3(Icon, { name: "alert-triangle" }) }),
      /* @__PURE__ */ u3("span", { class: "vt-subissue-summary-text", children: "Could not read this block" }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      props.onShowSource && /* @__PURE__ */ u3("button", { type: "button", class: "vt-text-button", onClick: props.onShowSource, children: "Show source" })
    ] }),
    !props.onShowSource && /* @__PURE__ */ u3("div", { class: "vt-subissue-detail", children: /* @__PURE__ */ u3("pre", { class: "vt-subissue-raw", children: props.raw }) })
  ] }) });
}
function ReadingCard(props) {
  const { ctx, path } = props;
  const [, setTick] = d2(0);
  const redraw = () => setTick((n2) => n2 + 1);
  h2(() => ctx.store.subscribe(redraw), [ctx]);
  h2(() => props.subscribeOpen?.(redraw), [props.subscribeOpen]);
  if (props.id === null) return /* @__PURE__ */ u3(UnreadableCard, { raw: props.raw });
  const subs = parseSubIssues(path, issueIdOf(path), ctx.store.text(path) ?? "", import_obsidian12.parseYaml).subs;
  const sub = subs.find((s3) => s3.id === props.id);
  if (!sub) return null;
  return /* @__PURE__ */ u3(
    SubCard,
    {
      ctx,
      sub,
      siblings: subs,
      open: props.open(),
      onToggle: () => {
        props.onToggle(subs.map((s3) => s3.id));
        redraw();
      },
      save: (patch) => ctx.writer.updateSub(sub.key, patch),
      delayMs: null
    }
  );
}

// src/header/ClosedToggle.tsx
function ClosedToggle(props) {
  const [, tick] = d2(0);
  h2(() => props.subscribe(() => tick((n2) => n2 + 1)), []);
  return /* @__PURE__ */ u3("button", { type: "button", class: "vt-text-button vt-sub-closed-toggle", onClick: props.onToggle, children: closedLabel(props.count, props.shown()) });
}
function closedLabel(count, shown) {
  return shown ? "Hide closed" : `Show ${count} closed`;
}

// src/header/sub-sticky-overlay.ts
var ROW_HEIGHT_GUESS = 46;
var SHADOW_ROOM = 4;
function stickyBox(scroller, card) {
  const r3 = scroller.getBoundingClientRect();
  const left = Math.max(card.left, r3.left);
  const right = Math.min(card.right, r3.left + scroller.clientWidth);
  return { top: r3.top, left, width: Math.max(0, right - left) };
}
var StickyOverlay = class {
  el;
  inner;
  key = null;
  height = ROW_HEIGHT_GUESS;
  constructor(container) {
    this.el = document.createElement("div");
    this.el.className = "vt-sub-sticky";
    this.el.hidden = true;
    this.inner = document.createElement("div");
    this.inner.className = "vt-sub-sticky-inner";
    this.el.appendChild(this.inner);
    container.appendChild(this.el);
  }
  /** 浮かべる行の高さ（押し出しの計算に使う） */
  get rowHeight() {
    return this.height;
  }
  /** key が変わったときだけ描き直す */
  show(key, view, box, offset) {
    this.el.hidden = false;
    if (key !== this.key) {
      this.key = key;
      R(view(), this.inner);
    }
    this.height = this.inner.offsetHeight || this.height;
    const base = (this.el.offsetParent ?? this.el.parentElement)?.getBoundingClientRect();
    this.el.style.top = `${box.top - (base?.top ?? 0)}px`;
    this.el.style.left = `${box.left - (base?.left ?? 0)}px`;
    this.el.style.width = `${box.width}px`;
    this.el.style.height = `${this.height + SHADOW_ROOM}px`;
    this.inner.style.transform = offset === 0 ? "" : `translateY(${offset}px)`;
  }
  hide() {
    this.el.hidden = true;
  }
  destroy() {
    R(null, this.inner);
    this.el.remove();
  }
};

// src/header/sub-cards.ts
var ISSUE_PATH_RE2 = /^issue\/[^/]+\.md$/;
var LIVE_PREVIEW_SAVE_MS = 600;
var refresh = import_state.StateEffect.define();
var closedShown = /* @__PURE__ */ new Set();
var closedListeners = /* @__PURE__ */ new Set();
function toggleClosed(ctx, path, view) {
  if (!closedShown.delete(path)) closedShown.add(path);
  view?.dispatch({ effects: refresh.of(null) });
  syncReading(ctx, path);
}
function toggleOpen(ctx, path, id, ids) {
  ctx.settings.subOpen = toggleSubOpen(ctx.settings.subOpen, path, id, ids);
  void ctx.saveSettings().catch((e3) => ctx.report("\u5C55\u958B\u306E\u72B6\u614B\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
}
var CLOSED_CLASS = "vt-sub-body-closed";
var AREA_HIDDEN = "vt-subissue-area-hidden";
var BODY_SECTION = "vt-sub-body-section";
var BODY_END = import_view.Decoration.line({ class: "vt-sub-body-end" });
var bodies = /* @__PURE__ */ new Map();
var cards = /* @__PURE__ */ new Map();
var openListeners = /* @__PURE__ */ new Set();
function addEntry(map, path, entry, mctx) {
  const set = map.get(path) ?? /* @__PURE__ */ new Set();
  map.set(path, set);
  set.add(entry);
  const child = new import_obsidian13.MarkdownRenderChild(entry.el);
  child.onunload = () => {
    set.delete(entry);
    if (set.size === 0) map.delete(path);
  };
  mctx.addChild(child);
}
function syncReading(ctx, path) {
  const shown = closedShown.has(path);
  for (const b2 of bodies.get(path) ?? []) b2.el.toggleClass(CLOSED_CLASS, !isSubOpen(ctx.settings.subOpen, path, b2.id) || b2.done === true && !shown);
  for (const c3 of cards.get(path) ?? []) if (c3.done) (c3.target ?? c3.el).toggleClass(AREA_HIDDEN, !shown);
  for (const fn of openListeners) fn();
  for (const fn of closedListeners) fn();
  readingSticky?.scheduleAll();
}
function keepReadingScroll(scroller, el, before, floating, tries = 2) {
  window.requestAnimationFrame(() => {
    if (!el.isConnected) return;
    const d3 = toggleScrollDelta(before, el.getBoundingClientRect().top, scroller.getBoundingClientRect().top, floating);
    if (d3 !== 0) scroller.scrollTop += d3;
    if (tries > 1) keepReadingScroll(scroller, el, before, floating, tries - 1);
  });
}
function readingCardEl(path, id, scroller) {
  for (const c3 of cards.get(path) ?? []) if (c3.id === id && c3.el.isConnected && scroller.contains(c3.el)) return c3.el;
  return null;
}
function readingScrollToCard(ctx, scroller, path, id, line) {
  const el = readingCardEl(path, id, scroller);
  if (el) return keepReadingScroll(scroller, el, 0, true);
  const view = ctx.app.workspace.getLeavesOfType("markdown").map((l3) => l3.view).find((v3) => v3 instanceof import_obsidian13.MarkdownView && v3.previewMode.containerEl.contains(scroller));
  view?.previewMode.applyScroll(line);
  window.requestAnimationFrame(() => {
    const found = readingCardEl(path, id, scroller);
    if (found) keepReadingScroll(scroller, found, 0, true);
  });
}
function readingScroller(el) {
  return el.matches(".markdown-preview-view") ? el : el.closest(".markdown-preview-view") ?? el.querySelector(".markdown-preview-view");
}
var ReadingSticky = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  ctx;
  overlays = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Set();
  frame = 0;
  schedule(scroller) {
    this.pending.add(scroller);
    if (this.frame === 0) this.frame = window.requestAnimationFrame(() => this.flush());
  }
  scheduleAll() {
    for (const s3 of this.overlays.keys()) this.schedule(s3);
    for (const set of cards.values()) for (const c3 of set) if (c3.scroller) this.schedule(c3.scroller);
  }
  flush() {
    this.frame = 0;
    const list = [...this.pending];
    this.pending.clear();
    for (const s3 of list) this.update(s3);
  }
  /** 入れ物（スクロール領域の親）が消えたものは片付ける */
  overlayOf(scroller) {
    let o3 = this.overlays.get(scroller);
    if (!scroller.isConnected || !scroller.parentElement) {
      o3?.destroy();
      this.overlays.delete(scroller);
      return null;
    }
    if (!o3) {
      o3 = new StickyOverlay(scroller.parentElement);
      this.overlays.set(scroller, o3);
    }
    return o3;
  }
  update(scroller) {
    const overlay = this.overlayOf(scroller);
    if (!overlay) return;
    const tag = (e3) => {
      if (e3.el.isConnected && scroller.contains(e3.el)) e3.scroller = scroller;
      return e3.scroller === scroller;
    };
    const found = [];
    for (const [path, set] of cards) {
      const mine = [...set].filter(tag);
      if (mine.length === 0) continue;
      const ownBodies = [...bodies.get(path) ?? []].filter(tag).sort((a3, b2) => a3.line - b2.line);
      for (const card of mine) {
        if (!isSubOpen(this.ctx.settings.subOpen, path, card.id)) continue;
        if (card.done && !closedShown.has(path)) continue;
        const bs = ownBodies.filter((b2) => b2.id === card.id);
        const shown = bs.filter((b2) => b2.el.isConnected);
        const last = bs[bs.length - 1];
        let top;
        let bottom;
        if (card.el.isConnected) top = card.el.getBoundingClientRect().top;
        else if (shown.length > 0) top = -Infinity;
        else continue;
        if (last?.el.isConnected) bottom = last.el.getBoundingClientRect().bottom;
        else if (shown.length > 0) bottom = Infinity;
        else bottom = card.el.getBoundingClientRect().bottom;
        found.push({ path, card, region: { top, bottom }, box: card.el.isConnected ? card.el : shown[0]?.el ?? null });
      }
    }
    found.sort((a3, b2) => a3.card.line - b2.card.line);
    const rect = scroller.getBoundingClientRect();
    const pick = pickSticky(
      found.map((f5) => f5.region),
      rect.top,
      overlay.rowHeight
    );
    const f4 = pick === null ? null : found[pick.index];
    const subs = f4 === null ? [] : parseSubIssues(f4.path, issueIdOf(f4.path), this.ctx.store.text(f4.path) ?? "", import_obsidian13.parseYaml).subs;
    const sub = f4 === null ? void 0 : subs.find((s3) => s3.id === f4.card.id);
    if (!f4 || !sub || !f4.box || pick === null) return overlay.hide();
    const box = stickyBox(scroller, f4.box.getBoundingClientRect());
    const { ctx } = this;
    overlay.show(
      `${f4.path}
${JSON.stringify(sub)}`,
      () => k(StickySubRow, {
        ctx,
        sub,
        save: (patch) => ctx.writer.updateSub(sub.key, patch),
        onToggle: () => {
          toggleOpen(
            ctx,
            f4.path,
            sub.id,
            subs.map((s3) => s3.id)
          );
          syncReading(ctx, f4.path);
          readingScrollToCard(ctx, scroller, f4.path, sub.id, f4.card.line);
        }
      }),
      box,
      pick.offset
    );
  }
  destroy() {
    if (this.frame !== 0) window.cancelAnimationFrame(this.frame);
    for (const o3 of this.overlays.values()) o3.destroy();
    this.overlays.clear();
  }
};
var readingSticky = null;
function installReading(ctx, plugin) {
  const sticky = new ReadingSticky(ctx);
  readingSticky = sticky;
  plugin.register(() => {
    sticky.destroy();
    if (readingSticky === sticky) readingSticky = null;
  });
  if (typeof document === "undefined") return installReadingCards(ctx, plugin);
  plugin.registerDomEvent(
    document,
    "scroll",
    (e3) => {
      const t3 = e3.target;
      if (t3 instanceof HTMLElement && t3.classList.contains("markdown-preview-view")) sticky.schedule(t3);
    },
    { capture: true, passive: true }
  );
  plugin.registerDomEvent(window, "resize", () => sticky.scheduleAll());
  plugin.register(ctx.store.subscribe(() => sticky.scheduleAll()));
  installReadingCards(ctx, plugin);
}
function installReadingCards(ctx, plugin) {
  let memo = null;
  const layoutOf = (path, text) => {
    if (memo?.path !== path || memo.text !== text) memo = { path, text, layout: layoutSubIssues(path, issueIdOf(path), text, import_obsidian13.parseYaml) };
    return memo.layout;
  };
  let subsMemo = null;
  const subsOf = (path, text) => {
    if (subsMemo?.path !== path || subsMemo.text !== text) subsMemo = { path, text, subs: parseSubIssues(path, issueIdOf(path), text, import_obsidian13.parseYaml).subs };
    return subsMemo.subs;
  };
  plugin.registerMarkdownPostProcessor((el, mctx) => {
    const path = mctx.sourcePath;
    if (!ISSUE_PATH_RE2.test(path)) return;
    const info = mctx.getSectionInfo(el);
    if (!info) return;
    const layout = layoutOf(path, info.text);
    const r3 = subSectionRole(layout, info.lineStart, info.lineEnd);
    const subs = r3.role === "card" || r3.role === "body" ? subsOf(path, info.text) : [];
    const doneIds = subs.filter(isDone2).map((s3) => s3.id);
    const isDoneId = (id) => id !== null && doneIds.includes(id);
    if (r3.role === "hide") {
      el.addClass(AREA_HIDDEN);
    } else if (r3.role === "card") {
      el.addClass("vt-sub-card-section");
      const b2 = layout[r3.index];
      const raw = info.text.slice(b2.from, b2.cardTo ?? layout[r3.index + 1]?.from ?? info.text.length).trimEnd();
      const done = isDoneId(r3.id);
      const toggleHost = done && r3.id === doneIds[0] ? el.createDiv() : null;
      const host = el.createDiv();
      if (r3.id !== null) addEntry(cards, path, { id: r3.id, el, line: info.lineStart, done, target: toggleHost ? host : el }, mctx);
      if (done) (toggleHost ? host : el).toggleClass(AREA_HIDDEN, !closedShown.has(path));
      if (toggleHost) {
        R(
          k(ClosedToggle, {
            count: doneIds.length,
            shown: () => closedShown.has(path),
            subscribe: (fn) => {
              closedListeners.add(fn);
              return () => closedListeners.delete(fn);
            },
            onToggle: () => toggleClosed(ctx, path)
          }),
          toggleHost
        );
        const toggleChild = new import_obsidian13.MarkdownRenderChild(toggleHost);
        toggleChild.onunload = () => R(null, toggleHost);
        mctx.addChild(toggleChild);
      }
      R(
        k(ReadingCard, {
          ctx,
          path,
          id: r3.id,
          raw,
          open: () => r3.id !== null && isSubOpen(ctx.settings.subOpen, path, r3.id),
          subscribeOpen: (fn) => {
            openListeners.add(fn);
            return () => openListeners.delete(fn);
          },
          onToggle: (ids) => {
            if (r3.id === null) return;
            const before = el.getBoundingClientRect().top;
            const scroller = readingScroller(el);
            toggleOpen(ctx, path, r3.id, ids);
            syncReading(ctx, path);
            if (scroller) keepReadingScroll(scroller, el, before, false);
          }
        }),
        host
      );
      const child = new import_obsidian13.MarkdownRenderChild(host);
      child.onunload = () => R(null, host);
      mctx.addChild(child);
    } else if (r3.role === "body") {
      const done = isDoneId(r3.id);
      el.addClass(BODY_SECTION);
      addEntry(bodies, path, { id: r3.id, el, line: info.lineStart, done }, mctx);
      el.toggleClass(CLOSED_CLASS, !isSubOpen(ctx.settings.subOpen, path, r3.id) || done && !closedShown.has(path));
    }
  });
}
function editorSave(ctx, view, path, id) {
  return async (patch) => {
    const text = view.state.doc.toString();
    const current = parseSubIssues(path, issueIdOf(path), text, import_obsidian13.parseYaml).subs.find((s3) => s3.id === id) ?? null;
    ctx.writer.assertSubPeriod(issueIdOf(path), current, patch);
    const r3 = subHeadChange(path, issueIdOf(path), text, id, patch, import_obsidian13.parseYaml, new Set(ctx.store.index.members.keys()));
    if (r3.changes.length > 1 || r3.change.insert !== text.slice(r3.change.from, r3.change.to)) view.dispatch({ changes: r3.changes, userEvent: "input.sub-card" });
    if (r3.before.status !== r3.after.status) await ctx.writer.afterSubStatusChange(r3.after, r3.before.status, r3.after.status);
  };
}
function editorTop(view, pos) {
  return view.lineBlockAt(pos).top + view.documentTop;
}
function correctEditorScroll(view, pos, before, floating) {
  view.requestMeasure({
    read: () => toggleScrollDelta(before, editorTop(view, pos), view.scrollDOM.getBoundingClientRect().top, floating),
    write: (d3) => {
      if (d3 !== 0) view.scrollDOM.scrollTop += d3;
    }
  });
}
function keepEditorScroll(view, pos, before, floating) {
  if (!floating) correctEditorScroll(view, pos, before, floating);
  window.requestAnimationFrame(() => correctEditorScroll(view, pos, before, floating));
}
function editorToggle(ctx, view, path, id, floating = false) {
  const parent = issueIdOf(path);
  const layout = layoutSubIssues(path, parent, view.state.doc.toString(), import_obsidian13.parseYaml);
  const wasOpen = isSubOpen(ctx.settings.subOpen, path, id);
  toggleOpen(
    ctx,
    path,
    id,
    layout.flatMap((b3) => b3.id ? [b3.id] : [])
  );
  const b2 = layout.find((x2) => x2.id === id);
  const before = b2 ? editorTop(view, b2.from) : 0;
  const inBody = wasOpen && b2 && b2.cardTo !== null && b2.bodyFrom !== null && b2.bodyTo !== null && view.state.selection.ranges.some((r3) => r3.from <= b2.bodyTo && r3.to >= b2.bodyFrom);
  const effects = floating && b2 ? [refresh.of(null), import_view.EditorView.scrollIntoView(b2.from, { y: "start", yMargin: 0 })] : refresh.of(null);
  view.dispatch({ effects, ...inBody ? { selection: { anchor: b2.cardTo } } : {} });
  syncReading(ctx, path);
  if (b2) keepEditorScroll(view, b2.from, before, floating);
}
function showSource(view, from, cardTo) {
  view.dispatch({ selection: { anchor: Math.min(from + 1, cardTo) }, scrollIntoView: true });
  view.focus();
}
var SubCardWidget = class extends import_view.WidgetType {
  constructor(ctx, path, sub, siblings, open, raw, range) {
    super();
    this.ctx = ctx;
    this.path = path;
    this.sub = sub;
    this.siblings = siblings;
    this.open = open;
    this.raw = raw;
    this.range = range;
  }
  ctx;
  path;
  sub;
  siblings;
  open;
  raw;
  range;
  /** 同じ内容なら DOM に触れない。変わったら、DOM を作り直さず中身だけを更新する（入力中のフォーカスを失わないため） */
  get signature() {
    return [this.path, this.open, this.raw, this.siblings.map((s3) => `${s3.id}:${s3.summary}`).join("|")].join("\n");
  }
  eq(other) {
    return other.signature === this.signature;
  }
  mount(dom, view) {
    const { ctx, path, sub } = this;
    const onShowSource = () => showSource(view, this.range.from, this.range.cardTo);
    if (sub === null) {
      R(k(UnreadableCard, { raw: this.raw, onShowSource }), dom);
      return;
    }
    R(
      k(SubCard, {
        ctx,
        sub,
        siblings: this.siblings,
        open: this.open,
        onToggle: () => editorToggle(ctx, view, path, sub.id),
        save: editorSave(ctx, view, path, sub.id),
        delayMs: LIVE_PREVIEW_SAVE_MS,
        onShowSource
      }),
      dom
    );
  }
  toDOM(view) {
    const dom = document.createElement("div");
    dom.className = "vt-sub-card-host";
    this.mount(dom, view);
    return dom;
  }
  updateDOM(dom, view) {
    this.mount(dom, view);
    return true;
  }
  destroy(dom) {
    R(null, dom);
  }
  // 入力欄やボタンの操作はエディタに渡さない
  ignoreEvent() {
    return true;
  }
};
var ClosedToggleWidget = class extends import_view.WidgetType {
  constructor(ctx, path, count, shown) {
    super();
    this.ctx = ctx;
    this.path = path;
    this.count = count;
    this.shown = shown;
  }
  ctx;
  path;
  count;
  shown;
  eq(other) {
    return other.path === this.path && other.count === this.count && other.shown === this.shown;
  }
  toDOM(view) {
    const dom = document.createElement("div");
    dom.className = "vt-sub-closed-host";
    const button = dom.createEl("button", { cls: "vt-text-button vt-sub-closed-toggle", text: closedLabel(this.count, this.shown) });
    button.type = "button";
    button.addEventListener("click", () => toggleClosed(this.ctx, this.path, view));
    return dom;
  }
  ignoreEvent() {
    return true;
  }
};
var NONE = { all: import_view.Decoration.none, folds: import_view.Decoration.none };
function build(ctx, state) {
  const path = state.field(import_obsidian13.editorInfoField, false)?.file?.path;
  if (!path || !ISSUE_PATH_RE2.test(path) || !state.field(import_obsidian13.editorLivePreviewField, false)) return NONE;
  const text = state.doc.toString();
  const parent = issueIdOf(path);
  const layout = layoutSubIssues(path, parent, text, import_obsidian13.parseYaml);
  if (layout.length === 0) return NONE;
  const subs = parseSubIssues(path, parent, text, import_obsidian13.parseYaml).subs;
  const touches2 = (from, to) => state.selection.ranges.some((r3) => cursorInside(r3, from, to));
  const all = [];
  const folds = [];
  const shownClosed = closedShown.has(path);
  const doneCount = subs.filter(isDone2).length;
  let toggled = false;
  for (const b2 of layout) {
    if (b2.cardTo === null || b2.bodyFrom === null || b2.bodyTo === null) continue;
    const sub = b2.id === null ? null : subs.find((s3) => s3.id === b2.id) ?? null;
    const open = sub !== null && isSubOpen(ctx.settings.subOpen, path, sub.id);
    const sectionTo = layout[b2.index + 1] ? layout[b2.index + 1].from - 1 : text.length;
    if (sub !== null && isDone2(sub)) {
      if (!toggled) {
        toggled = true;
        all.push(import_view.Decoration.widget({ widget: new ClosedToggleWidget(ctx, path, doneCount, shownClosed), block: true, side: -1 }).range(b2.from));
      }
      if (!shownClosed && !touches2(b2.from, sectionTo)) {
        all.push(import_view.Decoration.replace({ block: true }).range(b2.from, sectionTo));
        folds.push(import_view.Decoration.replace({ block: true }).range(b2.from, sectionTo));
        continue;
      }
    }
    const collapsed = sub !== null && !open && !touches2(b2.cardTo, sectionTo);
    const cardTo = collapsed ? sectionTo : b2.cardTo;
    if (!touches2(b2.from, cardTo)) {
      all.push(import_view.Decoration.replace({ widget: new SubCardWidget(ctx, path, sub, subs, open, text.slice(b2.from, b2.cardTo), { from: b2.from, cardTo: b2.cardTo }), block: true }).range(b2.from, cardTo));
    }
    if (collapsed && sectionTo > b2.cardTo) {
      folds.push(import_view.Decoration.replace({ block: true }).range(b2.cardTo, sectionTo));
    }
    if (!collapsed && layout[b2.index + 1] && b2.bodyTo > b2.bodyFrom) {
      all.push(BODY_END.range(state.doc.lineAt(b2.bodyTo).from));
    }
  }
  return { all: import_view.Decoration.set(all, true), folds: import_view.Decoration.set(folds, true) };
}
var liveViews = /* @__PURE__ */ new Set();
function editorSticky(ctx) {
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view;
        this.overlay = new StickyOverlay(view.dom);
        liveViews.add(view);
        view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
        this.schedule();
      }
      view;
      overlay;
      onScroll = () => this.schedule();
      memo = null;
      update(u4) {
        if (u4.docChanged || u4.geometryChanged || u4.viewportChanged || u4.transactions.some((t3) => t3.effects.some((e3) => e3.is(refresh)))) this.schedule();
      }
      schedule() {
        this.view.requestMeasure({ key: this, read: () => this.read(), write: (m3) => this.write(m3) });
      }
      read() {
        const { view } = this;
        const state = view.state;
        const path = state.field(import_obsidian13.editorInfoField, false)?.file?.path;
        if (!path || !ISSUE_PATH_RE2.test(path) || !state.field(import_obsidian13.editorLivePreviewField, false)) return null;
        if (this.memo?.doc !== state.doc) {
          const text = state.doc.toString();
          const parent = issueIdOf(path);
          this.memo = { doc: state.doc, layout: layoutSubIssues(path, parent, text, import_obsidian13.parseYaml), subs: parseSubIssues(path, parent, text, import_obsidian13.parseYaml).subs };
        }
        const { layout, subs } = this.memo;
        const open = [];
        for (const b2 of layout) {
          if (b2.cardTo === null || b2.id === null || !isSubOpen(ctx.settings.subOpen, path, b2.id)) continue;
          const sub = subs.find((s3) => s3.id === b2.id);
          if (!sub || isDone2(sub) && !closedShown.has(path)) continue;
          const end = b2.bodyFrom !== null && b2.bodyTo !== null && b2.bodyTo > b2.bodyFrom ? b2.bodyTo : b2.cardTo;
          open.push({ b: b2, sub, region: { top: view.lineBlockAt(b2.from).top, bottom: view.lineBlockAt(end).bottom } });
        }
        if (open.length === 0) return null;
        const rect = view.scrollDOM.getBoundingClientRect();
        const pick = pickSticky(
          open.map((o4) => o4.region),
          rect.top - view.documentTop,
          this.overlay.rowHeight
        );
        if (pick === null) return null;
        const host = view.contentDOM.querySelector(".vt-sub-card-host");
        let card;
        if (host) {
          card = host.getBoundingClientRect();
        } else {
          const r3 = view.contentDOM.getBoundingClientRect();
          const cs = getComputedStyle(view.contentDOM);
          card = { left: r3.left + (parseFloat(cs.paddingLeft) || 0), right: r3.right - (parseFloat(cs.paddingRight) || 0) };
        }
        const box = stickyBox(view.scrollDOM, card);
        const o3 = open[pick.index];
        return { path, b: o3.b, sub: o3.sub, offset: pick.offset, box };
      }
      write(m3) {
        if (m3 === null) return this.overlay.hide();
        const { view } = this;
        const { path, sub } = m3;
        this.overlay.show(
          `${path}
${JSON.stringify(sub)}`,
          () => k(StickySubRow, {
            ctx,
            sub,
            save: editorSave(ctx, view, path, sub.id),
            // 閉じると本文が消えるので、そのカードの題を上端に出す（読んでいた位置を見失わない）
            onToggle: () => editorToggle(ctx, view, path, sub.id, true)
          }),
          m3.box,
          m3.offset
        );
      }
      destroy() {
        liveViews.delete(this.view);
        this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
        this.overlay.destroy();
      }
    }
  );
}
function installSubCards(ctx, plugin) {
  const field = import_state.StateField.define({
    create: (state) => build(ctx, state),
    update: (_value, tr) => build(ctx, tr.state),
    provide: (f4) => [import_view.EditorView.decorations.from(f4, (v3) => v3.all), import_view.EditorView.atomicRanges.of((view) => view.state.field(f4).folds)]
  });
  plugin.registerEditorExtension([field, editorSticky(ctx)]);
  setSubRevealer((sub) => revealSubIn(ctx, sub));
  plugin.register(() => setSubRevealer(null));
  installReading(ctx, plugin);
}
function revealSubIn(ctx, sub) {
  const { path, id } = sub;
  if (isDone2(sub)) closedShown.add(path);
  if (!isSubOpen(ctx.settings.subOpen, path, id)) {
    toggleOpen(
      ctx,
      path,
      id,
      ctx.store.index.subs(sub.parent).map((s3) => s3.id)
    );
  }
  syncReading(ctx, path);
  const active = ctx.app.workspace.getActiveViewOfType(import_obsidian13.MarkdownView);
  const view = active?.file?.path === path ? active : ctx.app.workspace.getLeavesOfType("markdown").map((l3) => l3.view).find((v3) => v3 instanceof import_obsidian13.MarkdownView && v3.file?.path === path);
  if (!view) return;
  if (view.getMode() === "preview") {
    const scroller = readingScroller(view.previewMode.containerEl);
    const b3 = layoutSubIssues(path, sub.parent, ctx.store.text(path) ?? "", import_obsidian13.parseYaml).find((x2) => x2.id === id);
    if (scroller && b3) readingScrollToCard(ctx, scroller, path, id, b3.startLine);
    return;
  }
  const ev = [...liveViews].find((v3) => view.containerEl.contains(v3.dom));
  if (!ev) return;
  const b2 = layoutSubIssues(path, sub.parent, ev.state.doc.toString(), import_obsidian13.parseYaml).find((x2) => x2.id === id);
  if (!b2) return;
  ev.dispatch({ effects: [refresh.of(null), import_view.EditorView.scrollIntoView(b2.from, { y: "start" })] });
}

// src/obsidian/link-insert.ts
var import_obsidian16 = require("obsidian");

// ../shared/src/link-chips.ts
var import_state2 = require("@codemirror/state");
var import_view2 = require("@codemirror/view");
var import_obsidian14 = require("obsidian");

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
  items.forEach((item, index) => {
    const rank = query.number !== null ? opts.id ? idRank(opts.id(item), query.number) : null : matchRank(opts.haystacks(item), query.words);
    if (rank === null) return;
    ranked.push({ item, rank, recency: opts.recency?.(item) ?? 0, index });
  });
  ranked.sort((a3, b2) => a3.rank - b2.rank || b2.recency - a3.recency || a3.index - b2.index);
  return ranked.map((r3) => r3.item);
}
function pageOf(items, shown) {
  return { items: items.slice(0, shown), rest: Math.max(0, items.length - shown) };
}
function escapeLinkText(text) {
  return text.replace(/([\\[\]])/g, "\\$1");
}
function encodeLinkPath(path) {
  return path.replace(/[ ()<>%]/g, (c3) => `%${c3.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}
function markdownLink(text, path, anchor) {
  return `[${escapeLinkText(text)}](${encodeLinkPath(path)}${anchor ? `#${encodeLinkPath(anchor)}` : ""})`;
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
function openPath(app, path, source, evt) {
  void app.workspace.openLinkText(path, source, import_obsidian14.Keymap.isModEvent(evt));
}
var ChipWidget = class extends import_view2.WidgetType {
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
        openPath(this.app, this.chip.open ?? "", this.source, e3);
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
  if (!state.field(import_obsidian14.editorLivePreviewField, false)) return import_view2.Decoration.none;
  const source = state.field(import_obsidian14.editorInfoField, false)?.file?.path ?? "";
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
        ranges.push(import_view2.Decoration.replace({ widget }).range(link.from, link.to));
      } else {
        ranges.push(import_view2.Decoration.widget({ widget, side: -1 }).range(link.from));
      }
    }
  }
  return import_view2.Decoration.set(ranges, true);
}
function installLinkChips(plugin, opts) {
  const app = plugin.app;
  const refresh2 = import_state2.StateEffect.define();
  const viewPlugin = import_view2.ViewPlugin.fromClass(
    class {
      decorations;
      constructor(view) {
        this.decorations = buildDecorations(view, app, opts);
      }
      update(u4) {
        const modeChanged = u4.startState.field(import_obsidian14.editorLivePreviewField, false) !== u4.state.field(import_obsidian14.editorLivePreviewField, false);
        const asked = u4.transactions.some((t3) => t3.effects.some((e3) => e3.is(refresh2)));
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
        if (cm instanceof import_view2.EditorView) cm.dispatch({ effects: refresh2.of(null) });
      });
    })
  );
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    for (const a3 of Array.from(el.querySelectorAll("a.internal-link"))) {
      const href = a3.getAttribute("data-href") ?? a3.getAttribute("href") ?? "";
      const target = splitLinkTarget(href);
      if (!target) continue;
      const text = a3.textContent ?? "";
      let lead = null;
      let replaced = false;
      const undo = () => {
        lead?.remove();
        lead = null;
        if (replaced) {
          a3.removeClass("vt-link-chip", "is-replace");
          a3.setText(text);
          replaced = false;
        }
      };
      const draw = () => {
        undo();
        const chip = opts.resolve({ ...target, text, source: ctx.sourcePath });
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
      const child = new import_obsidian14.MarkdownRenderChild(a3);
      child.onload = () => child.register(opts.subscribe(draw));
      ctx.addChild(child);
    }
  });
}

// ../shared/src/link-picker.ts
var import_obsidian15 = require("obsidian");
var LinkPicker = class extends import_obsidian15.SuggestModal {
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
    const rows = items.map((item) => ({ item }));
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
function insertAtCursor(editor, text) {
  editor.replaceSelection(text);
  editor.focus();
}
function renderRow(el, parts) {
  const lead = el.createSpan({ cls: "vt-link-row-lead" });
  parts.lead?.(lead);
  el.createSpan({ cls: `vt-link-row-title${parts.done ? " is-done" : ""}`, text: parts.title });
  if (parts.note) el.createSpan({ cls: "vt-link-row-note", text: parts.note });
}

// src/core/link-search.ts
var DONE = ["closed", "canceled"];
function isDoneStatus2(status) {
  return DONE.includes(status);
}
function statusFilter(values) {
  if (!values || values.length === 0) return (s3) => !isDoneStatus2(s3);
  if (values.includes("all")) return () => true;
  const set = new Set(values.filter((v3) => STATUSES.includes(v3)));
  return (s3) => set.has(s3);
}
function searchIssues(issues, input, recency) {
  const q2 = parseLinkQuery(input, ["s"], "i");
  const ok = statusFilter(q2.filters.s);
  return searchItems(
    issues.filter((i3) => ok(i3.status)),
    q2,
    { haystacks: (i3) => [i3.summary, i3.id], id: (i3) => i3.id, recency: (i3) => recency(i3.path) }
  );
}
function subShortcut(input) {
  const m3 = /^\s*(?:i-)?(\d+)#(.*)$/.exec(input);
  return m3 ? { parent: `i-${m3[1]}`, rest: m3[2] } : null;
}
function searchSubs(subs, input) {
  const q2 = parseLinkQuery(input, ["s"]);
  const ok = statusFilter(q2.filters.s);
  const words = q2.number !== null ? [q2.number] : q2.words;
  return searchItems(
    subs.filter((s3) => ok(s3.status)),
    { ...q2, words, number: null },
    { haystacks: (s3) => [s3.summary, s3.id] }
  );
}
function searchMembers(members, input, recency) {
  const q2 = parseLinkQuery(input, [], "m");
  return searchItems(members, q2, { haystacks: (m3) => [m3.nickname, m3.name, m3.alias, m3.id], id: (m3) => m3.id, recency: (m3) => recency(m3.path) });
}
function searchRoutines(routines, input, recency) {
  const q2 = parseLinkQuery(input, ["s"], "r");
  const s3 = q2.filters.s ?? [];
  const ok = s3.includes("all") ? () => true : s3.includes("paused") ? (r3) => !r3.active : (r3) => r3.active;
  return searchItems(routines.filter(ok), q2, { haystacks: (r3) => [r3.summary, r3.id], id: (r3) => r3.id, recency: (r3) => recency(r3.path) });
}
function issueLink(issue) {
  return markdownLink(`${issue.id} ${issue.summary}`, issue.path);
}
function subLink(sub) {
  return markdownLink(`${sub.key} ${sub.summary}`, sub.path, sub.id);
}
function memberLink(member) {
  return markdownLink(member.nickname, member.path);
}
function routineLink(routine) {
  return markdownLink(`${routine.id} ${routine.summary}`, routine.path);
}
function memberInitial(member) {
  return Array.from((member.nickname || member.name).trim())[0]?.toUpperCase() ?? "?";
}

// src/obsidian/link-insert.ts
function idBadge(el, text, status) {
  const cls = status === "routine" ? "vt-status-in-progress" : status === "paused" ? "vt-status-canceled" : `vt-status-${status}`;
  el.createSpan({ cls: `vt-badge vt-id ${cls}`, text });
}
function avatar(el, member) {
  el.createSpan({ cls: "vt-link-avatar", text: memberInitial(member), attr: { "aria-hidden": "true" } });
}
function chipTitle(el, text, done = false) {
  el.createSpan({ cls: `vt-link-chip-title${done ? " is-done" : ""}`, text });
}
var STATUS_HINT = "Number: ID \xB7 s:closed / s:open,waiting / s:all";
function issueSource(ctx, editor, recency) {
  return {
    placeholder: "Search issues",
    hint: STATUS_HINT,
    search: (q2) => searchIssues([...ctx.store.index.issues.values()], q2, recency),
    render: (i3, el) => renderRow(el, { lead: (l3) => idBadge(l3, i3.id, i3.status), title: i3.summary, note: i3.status, done: isDoneStatus2(i3.status) }),
    choose: (i3) => insertAtCursor(editor, issueLink(i3))
  };
}
function subSource(ctx, editor, recency) {
  const index = () => ctx.store.index;
  const subsStep = (parent) => ({
    placeholder: `Sub-issues of ${parent.id} ${parent.summary}`,
    hint: "s:closed / s:all \xB7 Backspace: back to issues",
    search: (q2) => searchSubs(index().subs(parent.id), q2).map((sub) => ({ sub })),
    render: (row, el) => {
      if (!("sub" in row)) return;
      const s3 = row.sub;
      renderRow(el, { lead: (l3) => idBadge(l3, s3.key, s3.status), title: s3.summary, note: s3.status, done: isDoneStatus2(s3.status) });
    },
    choose: (row) => {
      if ("sub" in row) insertAtCursor(editor, subLink(row.sub));
    },
    back: (picker) => {
      picker.setSource(first);
      return true;
    },
    empty: "No sub-issues"
  });
  const first = {
    placeholder: "Search issues with sub-issues (12# to jump)",
    hint: STATUS_HINT,
    search: (q2) => {
      const jump = subShortcut(q2);
      if (jump) {
        const parent = index().issues.get(jump.parent);
        return parent ? searchSubs(index().subs(parent.id), jump.rest).map((sub) => ({ sub })) : [];
      }
      const parents = [...index().issues.values()].filter((i3) => index().subs(i3.id).length > 0);
      return searchIssues(parents, q2, recency).map((parent) => ({ parent }));
    },
    render: (row, el) => {
      if ("sub" in row) {
        const s3 = row.sub;
        renderRow(el, { lead: (l3) => idBadge(l3, s3.key, s3.status), title: s3.summary, note: s3.status, done: isDoneStatus2(s3.status) });
        return;
      }
      const p3 = row.parent;
      renderRow(el, { lead: (l3) => idBadge(l3, p3.id, p3.status), title: p3.summary, note: `${index().subs(p3.id).length} sub-issues`, done: isDoneStatus2(p3.status) });
    },
    choose: (row, picker) => {
      if ("sub" in row) return insertAtCursor(editor, subLink(row.sub));
      picker.setSource(subsStep(row.parent));
      return "stay";
    },
    empty: "No issues with sub-issues"
  };
  return first;
}
function memberSource(ctx, editor, recency) {
  return {
    placeholder: "Search members",
    hint: "Name, nickname, alias \xB7 Number: ID",
    search: (q2) => searchMembers([...ctx.store.index.members.values()], q2, recency),
    render: (m3, el) => renderRow(el, { lead: (l3) => avatar(l3, m3), title: m3.nickname, note: m3.name === m3.nickname ? m3.id : `${m3.name} \xB7 ${m3.id}` }),
    choose: (m3) => insertAtCursor(editor, memberLink(m3))
  };
}
function routineSource(ctx, editor, recency) {
  return {
    placeholder: "Search routines",
    hint: "Number: ID \xB7 s:paused / s:all",
    search: (q2) => searchRoutines([...ctx.store.index.routines.values()], q2, recency),
    render: (r3, el) => renderRow(el, { lead: (l3) => idBadge(l3, r3.id, r3.active ? "routine" : "paused"), title: r3.summary, note: r3.repeat ? describeRepeat(r3.repeat) : "", done: !r3.active }),
    choose: (r3) => insertAtCursor(editor, routineLink(r3))
  };
}
function chipFor(ctx, t3) {
  const index = ctx.store.index;
  const path = index.issuesByPath.has(t3.path) ? t3.path : resolveVaultPath(ctx.app, t3.path, t3.source);
  if (!path) return null;
  if (path.startsWith("issue/")) {
    const issue = index.issuesByPath.get(path);
    if (!issue) return null;
    const sub = t3.anchor ? index.sub(`${issue.id}#${t3.anchor}`) : void 0;
    if (sub) {
      return {
        mode: "replace",
        key: `${sub.key}|${sub.status}|${sub.summary}|${issue.summary}`,
        open: path,
        render: (el) => {
          idBadge(el, sub.key, sub.status);
          el.createSpan({ cls: "vt-link-chip-context", text: `${issue.summary} \u203A` });
          chipTitle(el, sub.summary, isDoneStatus2(sub.status));
        }
      };
    }
    return {
      mode: "replace",
      key: `${issue.id}|${issue.status}|${issue.summary}`,
      open: path,
      render: (el) => {
        idBadge(el, issue.id, issue.status);
        chipTitle(el, issue.summary, isDoneStatus2(issue.status));
      }
    };
  }
  if (path.startsWith("routine/")) {
    const r3 = index.data.routines.find((x2) => x2.path === path);
    if (!r3) return null;
    return {
      mode: "replace",
      key: `${r3.id}|${r3.active}|${r3.summary}`,
      open: path,
      render: (el) => {
        idBadge(el, r3.id, r3.active ? "routine" : "paused");
        chipTitle(el, r3.summary, !r3.active);
      }
    };
  }
  if (path.startsWith("member/")) {
    const m3 = index.data.members.find((x2) => x2.path === path);
    if (!m3) return null;
    return {
      mode: "replace",
      key: `${m3.id}|${m3.nickname}`,
      open: path,
      render: (el) => {
        avatar(el, m3);
        chipTitle(el, m3.nickname);
      }
    };
  }
  return null;
}
function recencyOf(ctx) {
  return (path) => ctx.app.vault.getFileByPath(path)?.stat.mtime ?? 0;
}
function installLinkInsert(ctx, plugin) {
  const open = (editor, make) => new LinkPicker(ctx.app, make(ctx, editor, recencyOf(ctx))).open();
  plugin.addCommand({ id: "insert-issue-link", name: "Insert link to issue", icon: "link", editorCallback: (editor) => open(editor, issueSource) });
  plugin.addCommand({ id: "insert-sub-issue-link", name: "Insert link to sub-issue", icon: "link", editorCallback: (editor) => open(editor, subSource) });
  plugin.addCommand({ id: "insert-member-link", name: "Insert link to member", icon: "link", editorCallback: (editor) => open(editor, memberSource) });
  plugin.addCommand({ id: "insert-routine-link", name: "Insert link to routine", icon: "link", editorCallback: (editor) => open(editor, routineSource) });
  installLinkChips(plugin, { resolve: (t3) => chipFor(ctx, t3), subscribe: (fn) => ctx.store.subscribe(fn) });
}

// src/obsidian/capture.tsx
var import_obsidian17 = require("obsidian");

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
        placeholder: "One summary per line\n- You can paste a bulleted list",
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
        "Create ",
        summaries.length,
        import_obsidian17.Platform.isMobile ? "" : " (Mod+Enter)"
      ] }),
      /* @__PURE__ */ u3("button", { class: "mod-cta", disabled: summaries.length === 0, onClick: submit, children: "Create" })
    ] })
  ] });
}
async function openAll(ctx, files) {
  let first = null;
  for (const file of files) {
    const leaf = await openInNotePane(ctx.app.workspace, file, { newTab: true, phone: import_obsidian17.Platform.isPhone });
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
    const button = fragment.createEl("button", { text: "Open all in tabs", cls: "vt-notice-button" });
    button.addEventListener("click", (e3) => {
      e3.stopPropagation();
      notice?.hide();
      void openAll(ctx, created).catch((err) => ctx.report("\u30BF\u30D6\u3067\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", err));
    });
  }
  notice = new import_obsidian17.Notice(fragment, NOTICE_MS);
}
function openCaptureModal(ctx) {
  new PreactModal(ctx.app, "Capture issues", (close) => /* @__PURE__ */ u3(
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
var import_obsidian18 = require("obsidian");

// src/core/closing.ts
function localDateOf2(ms) {
  const d3 = new Date(ms);
  return `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, "0")}-${String(d3.getDate()).padStart(2, "0")}`;
}
var DEFAULT_CLOSING_GRACE_HOUR = 4;
function startOf(date, hour = 0) {
  const [y3, m3, d3] = date.split("-").map(Number);
  return new Date(y3, m3 - 1, d3, hour).getTime();
}
function closingWindow(date, graceHour) {
  return { fromMs: startOf(date), toMs: startOf(addDays(date, 1), graceHour) };
}
var inWindow = (ms, w3) => ms >= w3.fromMs && ms < w3.toMs;
function inGrace(now, graceHour) {
  return now.getHours() < graceHour;
}
function closingTarget(index, now, graceHour) {
  const today = localToday(now);
  if (!inGrace(now, graceHour)) return today;
  const yesterday = addDays(today, -1);
  const daily = index.board(yesterday);
  return daily && !daily.board.closed ? yesterday : today;
}
function holdAutoClose(date, now, graceHour) {
  return inGrace(now, graceHour) && date === addDays(localToday(now), -1);
}
var CLOSING_GROUPS = ["closed", "not-done", "waiting", "canceled"];
function groupOf(status) {
  if (status === "closed") return "closed";
  if (status === "canceled" || status === "someday") return "canceled";
  if (status === "waiting" || status === "delegated") return "waiting";
  return "not-done";
}
function itemStatus(board, item) {
  if (item.kind === "issue") return item.issue.status;
  if (item.kind === "sub") return item.sub.status;
  return board.routines[item.routine.id] ?? "open";
}
function workedMinutes(index, date) {
  const out = /* @__PURE__ */ new Map();
  for (const l3 of index.data.worklogs) {
    if (l3.toMs === null || localDateOf2(l3.fromMs) !== date) continue;
    const key = workKey(l3);
    out.set(key, (out.get(key) ?? 0) + (l3.toMs - l3.fromMs) / 6e4);
  }
  return out;
}
function closingGroups(index, date, board, graceHour = 0) {
  const minutes = workedMinutes(index, date);
  const window2 = closingWindow(date, graceHour);
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (item) => {
    if (seen.has(item.key)) return;
    seen.add(item.key);
    items.push(item);
  };
  const on = boardItems(index, date, board);
  for (const key of board.issues) {
    const issue = index.issues.get(key);
    if (issue) push({ kind: "issue", key, issue, minutes: minutes.get(key) ?? 0 });
    const sub = issue ? void 0 : index.sub(key);
    if (sub) push({ kind: "sub", key, sub, minutes: minutes.get(key) ?? 0 });
  }
  for (const log of index.data.statusLogs) {
    if (log.to !== "closed" && log.to !== "canceled") continue;
    if (!inWindow(log.atMs, window2)) continue;
    const key = log.sub ? `${log.task}#${log.sub}` : log.task;
    if (log.sub) {
      const sub = index.sub(key);
      if (sub) push({ kind: "sub", key, sub, minutes: minutes.get(key) ?? 0 });
    } else {
      const issue = index.issues.get(key);
      if (issue) push({ kind: "issue", key, issue, minutes: minutes.get(key) ?? 0 });
    }
  }
  for (const routine of on.routines) if (routine.category !== "closing") push({ kind: "routine", key: routine.id, routine, minutes: minutes.get(routine.id) ?? 0, carriedFrom: carriedFrom(index, routine, date) });
  const groups = { closed: [], "not-done": [], waiting: [], canceled: [] };
  for (const item of items) groups[groupOf(itemStatus(board, item))].push(item);
  return groups;
}
function closingRoutines(index, date) {
  return routinesOnDay(index, date, "closing");
}
var TASK_FOLDERS = ["daily/", "issue/", "routine/", "member/", "preset/", "tmp/", "template/"];
function isClosingNote(path) {
  if (!path.endsWith(".md")) return false;
  if (TASK_FOLDERS.some((f4) => path.startsWith(f4))) return false;
  return !path.split("/").some((part) => part.startsWith("."));
}
function closingNotes(notes, date, graceHour = 0) {
  const window2 = closingWindow(date, graceHour);
  return notes.filter((n2) => isClosingNote(n2.path) && inWindow(n2.mtime, window2)).sort((a3, b2) => b2.mtime - a3.mtime).map((note) => ({ note, created: createdIn(note.created, date, window2) }));
}
function createdIn(created, date, window2) {
  if (!created) return false;
  const ms = Date.parse(created);
  return Number.isNaN(ms) ? created.slice(0, 10) === date : inWindow(ms, window2);
}

// src/obsidian/settings.ts
var DEFAULT_SETTINGS = { deviceName: "", presets: [], lastOrganizedAt: null, pausedTasks: [], subOpen: {}, closingGraceHour: DEFAULT_CLOSING_GRACE_HOUR, capacity: { ...DEFAULT_CAPACITY } };
function sanitizeGraceHour(v3) {
  return typeof v3 === "number" && Number.isInteger(v3) && v3 >= 0 && v3 <= 6 ? v3 : DEFAULT_CLOSING_GRACE_HOUR;
}
function sanitizeCapacity(v3) {
  const o3 = typeof v3 === "object" && v3 !== null ? v3 : {};
  const ok = (x2) => typeof x2 === "number" && Number.isFinite(x2) && x2 >= 0 && x2 <= 24 * 60;
  return { weekday: ok(o3.weekday) ? o3.weekday : DEFAULT_CAPACITY.weekday, weekend: ok(o3.weekend) ? o3.weekend : DEFAULT_CAPACITY.weekend };
}
var TaskSettingTab = class extends import_obsidian18.PluginSettingTab {
  constructor(app, plugin, settings, save) {
    super(app, plugin);
    this.settings = settings;
    this.save = save;
  }
  settings;
  save;
  display() {
    this.containerEl.empty();
    new import_obsidian18.Setting(this.containerEl).setName("\u7AEF\u672B\u540D").setDesc("worklog \u3092 worklog/<\u7AEF\u672B\u540D>/ \u306B\u66F8\u304D\u307E\u3059\u3002\u7AEF\u672B\u3054\u3068\u306B\u9055\u3046\u540D\u524D\u306B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08pkm-git \u306E\u7AEF\u672B\u540D\u3068\u540C\u3058\u304C\u304A\u3059\u3059\u3081\uFF09").addText(
      (t3) => t3.setPlaceholder("\u4F8B: iphone").setValue(this.settings.deviceName).onChange(async (v3) => {
        this.settings.deviceName = sanitizeDeviceName(v3);
        await this.save();
      })
    );
    new import_obsidian18.Setting(this.containerEl).setName("\u7DE0\u3081\u306E\u7336\u4E88\uFF08\u6642\uFF09").setDesc("0 \u6642\u304B\u3089\u3053\u306E\u6642\u523B\u307E\u3067\u306B Close board \u3092\u62BC\u3059\u3068\u3001\u7DE0\u3081\u3066\u3044\u306A\u3044\u524D\u65E5\u306E\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u307E\u3059\u30020 \u306B\u3059\u308B\u3068\u3001\u3044\u3064\u3082\u4ECA\u65E5\u3092\u7DE0\u3081\u307E\u3059").addDropdown((d3) => {
      for (let h3 = 0; h3 <= 6; h3++) d3.addOption(String(h3), h3 === 0 ? "\u306A\u3057" : `${h3}:00 \u307E\u3067`);
      d3.setValue(String(this.settings.closingGraceHour)).onChange(async (v3) => {
        this.settings.closingGraceHour = sanitizeGraceHour(Number(v3));
        await this.save();
      });
    });
    for (const [key, name] of [
      ["weekday", "1 \u65E5\u306B\u4F7F\u3048\u308B\u6642\u9593\uFF08\u5E73\u65E5\uFF09"],
      ["weekend", "1 \u65E5\u306B\u4F7F\u3048\u308B\u6642\u9593\uFF08\u571F\u65E5\uFF09"]
    ]) {
      new import_obsidian18.Setting(this.containerEl).setName(name).setDesc("Projects \u306E\u8CA0\u8377\u306E\u884C\u3067\u3001\u898B\u7A4D\u3082\u308A\u306E\u5408\u8A08\u3068\u6BD4\u3079\u308B\u6642\u9593\u3067\u3059\uFF08\u4F8B: 6h\u30014h30m\u30010\uFF09").addText(
        (t3) => t3.setValue(formatMinutes(this.settings.capacity[key])).onChange(async (v3) => {
          const minutes = v3.trim() === "0" ? 0 : parseDurationInput(v3);
          if (minutes === null || minutes > 24 * 60) return;
          this.settings.capacity = { ...this.settings.capacity, [key]: minutes };
          await this.save();
        })
      );
    }
  }
};

// src/obsidian/status-bar.ts
var import_obsidian19 = require("obsidian");

// src/core/running.ts
var SUMMARY_MAX = 24;
function runningStatus(index, now) {
  const elapsedByTask = /* @__PURE__ */ new Map();
  for (const l3 of index.running()) {
    const elapsed = Math.max(0, now - l3.fromMs);
    const key = workKey(l3);
    elapsedByTask.set(key, Math.max(elapsedByTask.get(key) ?? 0, elapsed));
  }
  if (elapsedByTask.size === 0) return null;
  const rows = [...elapsedByTask.entries()].sort((a3, b2) => b2[1] - a3[1]).map(([taskId, elapsed]) => {
    const task = index.sub(taskId) ?? index.issues.get(taskId) ?? index.routines.get(taskId);
    return { taskId, summary: task?.summary ?? "", path: task?.path ?? null, time: formatMinutes(Math.floor(elapsed / 6e4)) };
  });
  const tooltip = rows.map((r4) => [r4.taskId, r4.summary, r4.time].filter(Boolean).join(" ")).join("\n");
  if (rows.length > 1) return { text: `\u25CF ${rows.length} running ${rows[0].time}`, tooltip, path: null };
  const r3 = rows[0];
  const summary = r3.summary.length > SUMMARY_MAX ? `${r3.summary.slice(0, SUMMARY_MAX)}\u2026` : r3.summary;
  return { text: ["\u25CF", r3.taskId, summary, r3.time].filter(Boolean).join(" "), tooltip, path: r3.path };
}

// src/obsidian/status-bar.ts
var REFRESH_MS = 3e4;
function registerRunningStatusBar(host, store, open) {
  const el = host.addStatusBarItem();
  el.addClass("mod-clickable", "pkm-task-running-status");
  let path = null;
  const render = () => {
    const s3 = runningStatus(store.index, Date.now());
    path = s3?.path ?? null;
    el.toggle(s3 !== null);
    el.setText(s3?.text ?? "");
    (0, import_obsidian19.setTooltip)(el, s3?.tooltip ?? "", { placement: "top" });
  };
  el.addEventListener("click", () => path ? open.path(path) : open.sidebar());
  host.register(store.subscribe(render));
  host.registerInterval(window.setInterval(render, REFRESH_MS));
  render();
}

// src/obsidian/status-undo.ts
var import_obsidian20 = require("obsidian");

// src/core/undo.ts
var UndoBatch = class {
  items = /* @__PURE__ */ new Map();
  /** 足して、件数を返す。同じ key がすでにあれば、最初のものを残す */
  add(key, item) {
    if (!this.items.has(key)) this.items.set(key, item);
    return this.items.size;
  }
  get size() {
    return this.items.size;
  }
  /** すべて取り出して空にする（新しい順。戻すときは後の変更から戻す） */
  take() {
    const out = [...this.items.values()].reverse();
    this.items.clear();
    return out;
  }
  clear() {
    this.items.clear();
  }
};
function undoMessage(count) {
  return `${count}\u4EF6\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F\u3002`;
}

// src/obsidian/status-undo.ts
var UNDO_TIMEOUT_MS = 5e3;
var StatusUndo = class {
  constructor(report, timeoutMs = UNDO_TIMEOUT_MS) {
    this.report = report;
    this.timeoutMs = timeoutMs;
  }
  report;
  timeoutMs;
  batch = new UndoBatch();
  timer = null;
  el = null;
  text = null;
  /** 変更を足す。key は issue / routine の ID（同じものは 1 件に数える） */
  push(key, revert) {
    const count = this.batch.add(key, revert);
    this.show(count);
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.dismiss(), this.timeoutMs);
  }
  /** トーストに入っているすべての変更を、最初に変える前に戻す */
  async undo() {
    const reverts = this.batch.take();
    this.dismiss();
    for (const revert of reverts) {
      try {
        await revert();
      } catch (e3) {
        this.report("\u5143\u306B\u623B\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3);
      }
    }
  }
  dismiss() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.batch.clear();
    this.el?.remove();
    this.el = null;
    this.text = null;
  }
  show(count) {
    if (!this.el) {
      const el = document.createElement("div");
      el.className = "vt-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      const text = document.createElement("span");
      text.className = "vt-toast-text";
      const button = document.createElement("button");
      button.className = "vt-toast-action";
      button.type = "button";
      button.append("Undo");
      const icon = document.createElement("span");
      icon.className = "vt-icon";
      icon.setAttribute("aria-hidden", "true");
      (0, import_obsidian20.setIcon)(icon, "chevron-right");
      button.append(icon);
      button.addEventListener("click", () => void this.undo());
      el.append(text, button);
      document.body.append(el);
      this.el = el;
      this.text = text;
    }
    this.text.textContent = undoMessage(count);
  }
};

// src/obsidian/store.ts
var import_obsidian21 = require("obsidian");

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
  if (PRESET_PATH_RE.test(path)) return "preset";
  if (DAILY_PATH_RE.test(path)) return "daily";
  if (WORKLOG_PATH_RE.test(path)) return "worklog";
  if (BOARD_LOG_PATH_RE.test(path)) return "board";
  if (STATUS_LOG_PATH_RE.test(path)) return "statuslog";
  const m3 = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
  return m3 ? m3[1] : null;
}
function migratedIds(data) {
  const issueIds = new Set(data.issues.map((i3) => i3.id));
  const byOld = /* @__PURE__ */ new Map();
  for (const s3 of data.subIssues) {
    if (s3.migratedFrom !== null && !issueIds.has(s3.migratedFrom) && !byOld.has(s3.migratedFrom)) byOld.set(s3.migratedFrom, { parent: s3.parent, id: s3.id });
  }
  return byOld;
}
function resolveMigrated(data, byOld) {
  if (byOld.size === 0) return;
  data.worklogs = data.worklogs.map((l3) => {
    const to = l3.sub ? void 0 : byOld.get(l3.taskId);
    return to ? { ...l3, taskId: to.parent, sub: to.id } : l3;
  });
  data.statusLogs = data.statusLogs.map((e3) => {
    const to = e3.sub ? void 0 : byOld.get(e3.task);
    return to ? { ...e3, task: to.parent, sub: to.id } : e3;
  });
}
function collectVault(input) {
  const data = { issues: [], subIssues: [], routines: [], members: [], labels: [], presets: [], worklogs: [], boards: [], statusLogs: [], orders: [] };
  const problems = [];
  const initialBoards = /* @__PURE__ */ new Map();
  for (const { path, frontmatter, text } of [...input.markdown].sort((a3, b2) => a3.path.localeCompare(b2.path, "en", { numeric: true }))) {
    const kind = fileKind(path);
    if (kind === "daily") {
      if (frontmatter && frontmatter[BOARD_KEY] !== void 0) {
        initialBoards.set(DAILY_PATH_RE.exec(path)[1], parseBoard(frontmatter[BOARD_KEY]));
      }
      continue;
    }
    if (kind !== "issue" && kind !== "routine" && kind !== "member" && kind !== "preset") continue;
    if (frontmatter === null) {
      problems.push({ severity: "error", path, code: "missing-frontmatter", message: "frontmatter \u304C\u306A\u3044\u304B\u3001YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093" });
      continue;
    }
    if (kind === "issue") {
      const r3 = parseIssue(path, frontmatter);
      problems.push(...r3.problems);
      if (r3.value) {
        data.issues.push(r3.value);
        if (text !== void 0 && input.parseYaml) {
          const s3 = parseSubIssues(path, r3.value.id, text, input.parseYaml);
          problems.push(...s3.problems);
          data.subIssues.push(...s3.subs);
        }
      }
    } else if (kind === "preset") {
      const r3 = parsePreset(path, frontmatter, text);
      problems.push(...r3.problems);
      if (r3.value) data.presets.push(r3.value);
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
  const byOld = migratedIds(data);
  const renameKey = (key) => {
    const to = byOld.get(key);
    return to ? subKey(to.parent, to.id) : key;
  };
  for (const [date, board] of initialBoards) {
    initialBoards.set(date, { ...board, issues: board.issues.map(renameKey), carried: board.carried.map(renameKey) });
  }
  const logsByDate = /* @__PURE__ */ new Map();
  const allLogs = [];
  for (const { path, text } of [...input.boardLogs ?? []].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseBoardLog(path, text);
    problems.push(...r3.problems);
    const entries = byOld.size === 0 ? r3.entries : r3.entries.map((e3) => ({ ...e3, op: renameBoardOp(e3.op, renameKey) }));
    allLogs.push(...entries);
    for (const e3 of entries) logsByDate.set(e3.date, [...logsByDate.get(e3.date) ?? [], e3]);
  }
  for (const date of [.../* @__PURE__ */ new Set([...initialBoards.keys(), ...logsByDate.keys()])].sort()) {
    const logs = logsByDate.get(date) ?? [];
    const removed = removedTasks(logs);
    data.boards.push({
      date,
      path: dailyNotePath(date),
      board: replayBoard(initialBoards.get(date) ?? emptyBoard(), logs),
      ...logs.length > 0 ? { latestAt: Math.max(...logs.map((e3) => e3.atMs)) } : {},
      ...removed.length > 0 ? { removed } : {}
    });
  }
  data.orders = orderHistory(allLogs);
  for (const { path, text } of [...input.statusLogs ?? []].sort((a3, b2) => a3.path.localeCompare(b2.path))) {
    const r3 = parseStatusLog(path, text);
    problems.push(...r3.problems);
    data.statusLogs.push(...r3.entries);
  }
  data.statusLogs.sort(compareStatusLog);
  resolveMigrated(data, byOld);
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
      vault.on("create", (file) => file instanceof import_obsidian21.TFile && void this.readText(file).then(() => this.touch(file))),
      vault.on("modify", (file) => file instanceof import_obsidian21.TFile && void this.readText(file).then(() => this.touch(file))),
      vault.on("delete", (file) => {
        this.texts.delete(file.path);
        if (file instanceof import_obsidian21.TFile) this.touch(file);
      }),
      vault.on("rename", (file, oldPath) => {
        this.texts.delete(oldPath);
        if (file instanceof import_obsidian21.TFile) void this.readText(file).then(() => this.schedule());
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
  /** 読み込み済みの issue / worklog などの本文（なければ null）。issue の本文のサブの領域を描くのに使う（ADR-0158） */
  text(path) {
    return this.texts.get(path) ?? null;
  }
  mtime(path) {
    const file = this.app.vault.getFileByPath(path);
    return file ? file.stat.mtime : null;
  }
  async readText(file) {
    const kind = fileKind(file.path);
    if (kind === "issue" || kind === "worklog" || kind === "board" || kind === "statuslog" || kind === "labels" || kind === "preset") this.texts.set(file.path, await this.app.vault.cachedRead(file));
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
    const input = { markdown: [], worklogs: [], labels: null, boardLogs: [], statusLogs: [], parseYaml: import_obsidian21.parseYaml };
    for (const file of this.app.vault.getMarkdownFiles()) {
      const kind = fileKind(file.path);
      if (kind !== "issue" && kind !== "routine" && kind !== "member" && kind !== "preset" && kind !== "daily") continue;
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      const text = kind === "issue" || kind === "preset" ? this.texts.get(file.path) : void 0;
      input.markdown.push({ path: file.path, frontmatter: fm ? { ...fm } : null, ...text !== void 0 ? { text } : {} });
    }
    for (const [path, text] of this.texts) {
      const kind = fileKind(path);
      if (kind === "issue" || kind === "preset") continue;
      if (kind === "worklog") input.worklogs.push({ path, text });
      else if (kind === "board") input.boardLogs.push({ path, text });
      else if (kind === "statuslog") input.statusLogs.push({ path, text });
      else if (kind === "labels") input.labels = text;
    }
    const { data, problems } = collectVault(input);
    this.index = new TaskIndex(data);
    this.problems = problems;
    this.version++;
    for (const fn of this.listeners) fn();
  }
};

// src/obsidian/view.ts
var import_obsidian22 = require("obsidian");
function preactViewCreator(spec, ctx) {
  class PreactView extends import_obsidian22.ItemView {
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
      this.contentEl.addClass("vt-view", "vt-ui");
      R(k(spec.component, { ctx }), this.contentEl);
    }
    async onClose() {
      R(null, this.contentEl);
    }
  }
  return (leaf) => new PreactView(leaf);
}

// src/core/calendar-subs.ts
function calendarWithSubsError(id, subCount, scheduled) {
  if (scheduled === null || subCount === 0) return null;
  return `${id}: \u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u3092\u6301\u3064 issue \u306B\u306F Calendar \u306E\u65E5\uFF08scheduled\uFF09\u3092\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093\uFF08ADR-0203\uFF09\u3002\u4F55\u65E5\u3082\u304B\u304B\u308B\u4F5C\u696D\u306F\u3001\u30B5\u30D6\u306E\u671F\u9593\u3067\u8A08\u753B\u3057\u3066\u304F\u3060\u3055\u3044`;
}
function subsWithCalendarError(issue) {
  if (issue.scheduled === null) return null;
  return `${issue.id}: Calendar \u306E\u65E5\u3092\u6301\u3064 issue \u306B\u306F\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u3092\u8DB3\u305B\u307E\u305B\u3093\uFF08ADR-0203\uFF09\u3002\u5148\u306B Calendar \u306E\u65E5\uFF08scheduled\uFF09\u3092\u6D88\u3057\u3066\u304F\u3060\u3055\u3044`;
}

// src/obsidian/writer.ts
var import_obsidian23 = require("obsidian");

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
    const sub = index.sub(id);
    if (sub) return `[${sub.parent} \u203A ${sub.summary}](${sub.path})`;
    const routine = index.routines.get(id);
    return routine ? `[${routine.id} ${routine.summary}](${routine.path})` : id;
  };
  const lines = [SECTION, ""];
  const present = board.issues.filter((id) => index.issues.has(id) || index.sub(id) !== void 0);
  const statusOf2 = (id) => index.issues.get(id)?.status ?? index.sub(id)?.status;
  const closed = present.filter((id) => statusOf2(id) === "closed");
  const others = present.filter((id) => !closed.includes(id));
  const routines = Object.entries(board.routines);
  lines.push("### \u5B8C\u4E86", "");
  if (closed.length === 0 && routines.every(([, r3]) => r3 !== "closed")) lines.push("- \u306A\u3057");
  for (const id of closed) lines.push(`- ${link(id)}`);
  for (const [id, r3] of routines) if (r3 === "closed") lines.push(`- ${link(id)}`);
  if (others.length > 0 || routines.some(([, r3]) => r3 === "canceled")) {
    lines.push("", "### \u6301\u3061\u8D8A\u3057\u30FB\u4E2D\u6B62", "");
    for (const id of others) {
      const status = statusOf2(id);
      const note = board.carried.includes(id) || status === "open" || status === "in-progress" ? "\u6301\u3061\u8D8A\u3057" : status ?? "?";
      lines.push(`- ${link(id)}\uFF08${note}\uFF09`);
    }
    for (const [id, r3] of routines) if (r3 === "canceled") lines.push(`- ${link(id)}\uFF08canceled\uFF09`);
  }
  const logs = index.data.worklogs.filter((l3) => sameLocalDate(l3.fromMs, date) && l3.toMs !== null).sort((a3, b2) => a3.fromMs - b2.fromMs);
  if (logs.length > 0) {
    lines.push("", "### worklog", "");
    for (const l3 of logs) {
      const desc = l3.description ? ` ${l3.description}` : "";
      lines.push(`- ${hm(l3.fromMs)}\u2013${hm(l3.toMs)}\uFF08${formatMinutes((l3.toMs - l3.fromMs) / 6e4)}\uFF09 ${link(l3.sub ? `${l3.taskId}#${l3.sub}` : l3.taskId)}${desc}`);
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
  return upsertSummary(text, boardSummary(index, date, board));
}

// src/core/review-template.ts
var REVIEW_SNIPPET = "daily-review.md";
var REVIEW_SNIPPET_PATHS = [`template/snippet/${REVIEW_SNIPPET}`, `.kit/templates/snippet/${REVIEW_SNIPPET}`];
var DEFAULT_REVIEW_TEMPLATE = "## \u65E5\u6B21\u632F\u308A\u8FD4\u308A\n\n### \u4F55\u3092\u3057\u305F\u304B\n- \n\n### Keep\n- \n\n### Problem \u2192 Try\n- \n\n---\n";
var FRONTMATTER_RE3 = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
function snippetBody(text) {
  const body = text.replace(FRONTMATTER_RE3, "").replace(/^(?:[ \t]*\r?\n)+/, "").replace(/\s+$/, "");
  return body ? `${body}
` : "";
}
function templateMarker(template) {
  const lines = template.split(/\r?\n/).map((l3) => l3.trimEnd());
  return lines.find((l3) => /^#{1,6} /.test(l3)) ?? lines.find((l3) => l3.trim() !== "") ?? null;
}
function insertReviewTemplate(text, template) {
  const marker = templateMarker(template);
  if (marker === null) return text;
  const fm = FRONTMATTER_RE3.exec(text);
  const head = fm ? fm[0] : "";
  const body = text.slice(head.length);
  if (body.split(/\r?\n/).some((l3) => l3.trimEnd() === marker)) return text;
  const block = template.endsWith("\n") ? template : `${template}
`;
  const rest = body.replace(/^(?:[ \t]*\r?\n)+/, "");
  const headSep = head && !head.endsWith("\n") ? "\n" : "";
  return `${head}${headSep}${rest ? `${block}
${rest}` : block}`;
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
    "color.text-faint": "#949494",
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
  for (const item of [...index.issues.values(), ...index.routines.values(), ...index.members.values()]) {
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
var isStatus2 = (v3) => typeof v3 === "string" && STATUSES.includes(v3);
var TaskWriter = class {
  constructor(app, store, deviceName = () => "") {
    this.app = app;
    this.store = store;
    this.deviceName = deviceName;
  }
  app;
  store;
  deviceName;
  /** この端末が最後に書いたボードの操作の時刻（索引に載る前の次の操作のため） */
  lastBoardAt = 0;
  /** issue の status を変えたら呼ぶ（取り消しのトースト。ADR-0031） */
  onStatusChange = null;
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
  /**
   * frontmatter の欄をまとめて更新する。issue の status は遷移表（ADR-0183）にある遷移だけを書き、ほかは例外にする（取り消しの undo は除く）。
   * status が変わったら、statuslog に書き、★ を外し、今の作業でなくなればタイマーを止め、onStatusChange を呼ぶ（ADR-0031, 0184, 0183）
   */
  async update(path, fields, via = "ui") {
    const before = {};
    let from;
    let id;
    await this.app.fileManager.processFrontMatter(this.file(path), (fm) => {
      from = fm.status;
      id = fm.id;
      const next = fields.status;
      if (via !== "undo" && fileKind(path) === "issue" && isStatus2(from) && isStatus2(next) && from !== next) {
        const reopenTo = typeof fm.id === "string" ? this.store.index.reopenStatus(fm.id) : null;
        if (!canTransition(from, next, reopenTo)) throw new Error(transitionError(from, next, reopenTo));
        fields = completeIssuePatch(next, fields, from);
      }
      if (via !== "undo" && fileKind(path) === "issue" && typeof fields.scheduled === "string" && fields.scheduled !== "" && typeof fm.id === "string") {
        const error = calendarWithSubsError(fm.id, this.store.index.subs(fm.id).length, fields.scheduled);
        if (error) throw new Error(error);
      }
      const after = isStatus2(next) ? next : from;
      if (via !== "undo" && fileKind(path) === "issue" && typeof fields.tickler === "string" && fields.tickler !== "" && isStatus2(after) && after !== "open") {
        throw new Error(ticklerError(after));
      }
      if (via !== "undo" && fileKind(path) === "issue" && typeof fields.tickler === "string" && fields.tickler !== "" && typeof fm.id === "string") {
        const error = ticklerWithSubsError(fm.id, this.store.index.subs(fm.id), fields.tickler, localToday());
        if (error) throw new Error(error);
      }
      for (const [key, value] of Object.entries(fields)) {
        before[key] = structuredClone(fm[key]);
        if (value === null || value === void 0 || Array.isArray(value) && value.length === 0 || value === "") delete fm[key];
        else fm[key] = value;
      }
    });
    this.store.refreshSoon();
    const to = fields.status;
    if (fileKind(path) !== "issue" || !isStatus2(from) || !isStatus2(to) || from === to || typeof id !== "string") return;
    if (to === "someday" && via !== "undo") await this.clearSubPeriods(id);
    await this.recordStatus(id, from, to, via);
    await this.unstar(id, to);
    if (stopsTimer(to)) {
      const running = this.store.index.running(id);
      if (running.length > 0) await this.stopTimer(running);
    }
    this.onStatusChange?.({ path, id, from, to, before, via });
  }
  /**
   * サブの項目を書き換える（ADR-0135）。key は合成キー。status が変わったら statuslog に task と sub で書き、
   * 今の作業でなくなればそのサブの記録中のタイマーを止める。遷移表にない遷移は例外（ADR-0183）。親の status は変えない
   */
  async updateSub(key, patch, via = "ui") {
    const sub = this.store.index.sub(key);
    if (!sub) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
    let fixed = normalizeSubPatch(reopenSubOnPeriod(sub.status, patch));
    if (via !== "undo") this.assertSubPeriod(sub.parent, sub, fixed);
    const next = fixed.status;
    if (via !== "undo" && next !== void 0 && next !== sub.status) {
      const reopenTo = this.store.index.reopenStatus(sub.key);
      if (!canTransition(sub.status, next, reopenTo)) throw new Error(transitionError(sub.status, next, reopenTo));
      fixed = completeSubPatch(next, fixed);
    }
    let change = null;
    await this.app.vault.process(this.file(sub.path), (text) => {
      const siblings = parseSubIssues(sub.path, sub.parent, text, import_obsidian23.parseYaml).subs.map((s3) => s3.id === sub.id ? { ...s3, ...fixed, id: s3.id } : s3);
      this.assertSubs(siblings, [sub.id]);
      const r3 = updateSubIssueText(sub.path, sub.parent, text, sub.id, fixed, import_obsidian23.parseYaml);
      change = r3.before.status !== r3.after.status ? { from: r3.before.status, to: r3.after.status } : null;
      return r3.text;
    });
    this.store.refreshSoon();
    const done = change;
    if (done === null) return;
    await this.afterSubStatusChange(sub, done.from, done.to, via);
  }
  /**
   * サブの status が変わった後の処理: statuslog に task と sub で書き、closed / canceled ならそのサブの記録中のタイマーを止める。
   * エディタの文書を直接書き換えたとき（ADR-0161）も、ファイルを書き換えたときと同じにするために公開している
   */
  async afterSubStatusChange(sub, from, to, via = "ui") {
    await this.recordStatus(sub.parent, from, to, via, sub.id);
    await this.unstar(sub.key, to);
    if (stopsTimer(to)) {
      const running = this.store.index.running(sub.key);
      if (running.length > 0) await this.stopTimer(running);
    }
  }
  /**
   * サブの期間を書いてよいか（ADR-0210）。Inbox の Project のサブには入れない・変えない。Tickler より前に始めない。
   * 通らなければ例外。本文のカード（エディタの文書に書く。ADR-0161）も、書く前にこれを呼ぶ
   */
  assertSubPeriod(parentId, before, patch) {
    if (patch.start === void 0 && patch.end === void 0) return;
    const parent = this.store.index.issues.get(parentId);
    if (!parent) return;
    const after = { start: patch.start !== void 0 ? patch.start : before?.start ?? null, end: patch.end !== void 0 ? patch.end : before?.end ?? null };
    const error = subPeriodError(parent, this.store.index.planned(parentId), before, after, localToday());
    if (error) throw new Error(error);
  }
  /** issue の閉じていないサブの期間と Calendar の日を消す（Project を someday にしたとき。ADR-0210）。消したサブの数を返す */
  async clearSubPeriods(parentId) {
    const targets = somedayClears(this.store.index.subs(parentId));
    const issue = this.store.index.issues.get(parentId);
    if (targets.length === 0 || !issue) return 0;
    await this.app.vault.process(this.file(issue.path), (text) => {
      let out = text;
      for (const sub of targets) out = updateSubIssueText(issue.path, issue.id, out, sub.id, { start: null, end: null, scheduled: null }, import_obsidian23.parseYaml).text;
      return out;
    });
    this.store.refreshSoon();
    return targets.length;
  }
  assertSubs(subs, touched) {
    const errors = touchedSubErrors(subs, touched, new Set(this.store.index.members.keys()));
    if (errors.length > 0) throw new Error(errors.join("\n"));
  }
  /** サブを足す（ADR-0142）。summaries の順に末尾へ。作ったサブの合成キーを返す */
  async createSubs(parentId, summaries) {
    const issue = this.store.index.issues.get(parentId);
    if (!issue) throw new Error(`issue \u304C\u3042\u308A\u307E\u305B\u3093: ${parentId}`);
    if (summaries.length === 0) return [];
    const calendar = subsWithCalendarError(issue);
    if (calendar) throw new Error(calendar);
    const created = localDateTime();
    let keys = [];
    await this.app.vault.process(this.file(issue.path), (text) => {
      const existing = parseSubIssues(issue.path, issue.id, text, import_obsidian23.parseYaml).subs;
      const taken = existing.map((s3) => s3.id);
      const subs = summaries.map((summary) => {
        const id = newSubId(taken);
        taken.push(id);
        return newSubIssueInput({ summary }, id, created);
      });
      this.assertSubs([...existing, ...subs], subs.map((s3) => s3.id));
      keys = subs.map((s3) => subKey(issue.id, s3.id));
      return insertSubIssuesText(issue.path, issue.id, text, subs, import_obsidian23.parseYaml);
    });
    this.store.refreshSoon();
    return keys;
  }
  /** サブを to の位置へ移す（md のブロックの並びで数える） */
  async moveSub(key, to) {
    await this.moveSubWith(key, () => to);
  }
  /** サブを before の前へ移す（null なら末尾。ドラッグ。ADR-0142）。位置は今の md のブロックの並び（読めないブロックを含む）で決める */
  async moveSubBefore(key, before) {
    const target = before === null ? null : this.store.index.sub(before);
    await this.moveSubWith(key, (ids, id) => dropPosition(ids, id, target ? target.id : null));
  }
  /** サブを、出ている隣の行（visible の合成キー）をまたいで 1 つ上（-1）か下（1）へ移す（Move up / down） */
  async stepSub(key, visible, dir) {
    const ids = visible.map((k3) => this.store.index.sub(k3)?.id).filter((x2) => x2 !== void 0);
    await this.moveSubWith(key, (all, id) => stepPosition(all, ids, id, dir));
  }
  async moveSubWith(key, position) {
    const sub = this.store.index.sub(key);
    if (!sub) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
    await this.app.vault.process(this.file(sub.path), (text) => {
      const ids = parseSubIssues(sub.path, sub.parent, text, import_obsidian23.parseYaml).blocks.map((b2) => b2.sub?.id ?? null);
      const to = position(ids, sub.id);
      return to === null ? text : moveSubIssueText(sub.path, sub.parent, text, sub.id, to, import_obsidian23.parseYaml);
    });
    this.store.refreshSoon();
  }
  /** サブを本文ごと消す。記録中のタイマーは止める。worklog の行は残す（ADR-0135）。依存されていたら消さない */
  async deleteSub(key) {
    const sub = this.store.index.sub(key);
    if (!sub) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
    const dependents = dependentsOf(this.store.index.subs(sub.parent), sub.id);
    if (dependents.length > 0) throw new Error(`${dependents.join(", ")} \u306E depends_on \u306B\u3042\u308B\u306E\u3067\u6D88\u305B\u307E\u305B\u3093\u3002\u5148\u306B\u5916\u3057\u3066\u304F\u3060\u3055\u3044`);
    const running = this.store.index.running(key);
    if (running.length > 0) await this.stopTimer(running);
    await this.app.vault.process(this.file(sub.path), (text) => removeSubIssueText(sub.path, sub.parent, text, sub.id, import_obsidian23.parseYaml));
    this.store.refreshSoon();
  }
  /** statuslog に 1 行追記する。端末名がなければ書かない。書けなくても status の変更は止めない */
  /** waiting / delegated にしたら、今日のボードの ★ を外す（ADR-0184）。失敗しても status の変更は止めない */
  async unstar(key, to) {
    const device = this.deviceName();
    const today = localToday();
    const ops = unstarOps(this.store.index, today, key, to);
    if (!device || ops.length === 0) return;
    try {
      await this.appendBoardOps(today, device, ops);
    } catch (e3) {
      console.error("pkm-task: \u2605 \u3092\u5916\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    }
  }
  async recordStatus(task, from, to, via, sub = null) {
    const device = this.deviceName();
    if (!device) return;
    try {
      const now = /* @__PURE__ */ new Date();
      const line = statusLogLine(task, from, to, via, now, Math.random, sub);
      if (line === null) return;
      const file = await this.getOrCreate((0, import_obsidian23.normalizePath)(statusLogPath(device, now)), "");
      await this.app.vault.process(file, (text) => appendWorklogLine(text, line));
    } catch (e3) {
      console.error("pkm-task: status \u306E\u8A18\u9332\u3092\u66F8\u3051\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    }
  }
  takenIds() {
    const { index } = this.store;
    const ids = [...index.issues.keys(), ...index.routines.keys(), ...index.members.keys(), ...index.data.presets.map((p3) => p3.id)];
    for (const f4 of this.app.vault.getMarkdownFiles()) ids.push(f4.basename);
    return ids;
  }
  /** issue を作る。clarified を渡さなければ Inbox に入る（ADR-0011, 0148）。作れなかった summary は failed に入る */
  async createIssues(summaries, extra = {}) {
    const ids = nextIds("i", this.takenIds(), summaries.length);
    const created = [];
    const failed = [];
    const now = localDateTime();
    for (const [i3, summary] of summaries.entries()) {
      const path = (0, import_obsidian23.normalizePath)(pathForId(ids[i3]));
      try {
        await this.ensureFolder(path);
        created.push(await this.app.vault.create(path, newIssueContent(ids[i3], summary, now, extra)));
      } catch (e3) {
        console.error("pkm-task: issue \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", path, e3);
        failed.push(summary);
      }
    }
    this.store.refreshSoon();
    return { created, failed };
  }
  async createMember(name) {
    const [id] = nextIds("m", this.takenIds());
    const path = (0, import_obsidian23.normalizePath)(pathForId(id));
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
   * Labels 画面の保存（ADR-0024, 0036）。改名した label が付いた issue・routine・member を書き換えてから labels.json を書く。
   * 途中で失敗しても、改名の元の名前が labels.json に残るので、もう一度保存すれば残りが書き換わる
   */
  async saveLabels(plan) {
    if (this.store.problems.some((p3) => p3.path === LABELS_PATH)) throw new Error(`${LABELS_PATH} \u3092\u76F4\u3057\u3066\u304B\u3089\u4FDD\u5B58\u3057\u3066\u304F\u3060\u3055\u3044`);
    const { index } = this.store;
    assertUnused(plan.removed, labelUsage(index));
    if (plan.renames.size > 0) {
      const targets = [...index.issues.values(), ...index.routines.values(), ...index.members.values()].filter((x2) => x2.labels.some((l3) => plan.renames.has(l3)));
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
  /** プリセットの md を作る（ADR-0186）。作った ID を返す */
  async createPreset(name) {
    const [id] = nextIds("p", this.takenIds());
    const path = (0, import_obsidian23.normalizePath)(pathForId(id));
    await this.ensureFolder(path);
    await this.app.vault.create(path, newPresetContent(id, name, localDateTime()));
    this.store.refreshSoon();
    return id;
  }
  /**
   * プリセットを issue に当てる（ADR-0186）。1 回の書き込みで、サブを末尾へ足し（素早い追加と同じ既定値）、
   * 本文を親の本文の末尾に追記する。作ったサブの合成キーを返す
   */
  async applyPreset(parentId, preset) {
    const issue = this.store.index.issues.get(parentId);
    if (!issue) throw new Error(`issue \u304C\u3042\u308A\u307E\u305B\u3093: ${parentId}`);
    const calendar = preset.subIssues.length > 0 ? subsWithCalendarError(issue) : null;
    if (calendar) throw new Error(calendar);
    const created = localDateTime();
    let keys = [];
    await this.app.vault.process(this.file(issue.path), (text) => {
      const existing = parseSubIssues(issue.path, issue.id, text, import_obsidian23.parseYaml).subs;
      const taken = existing.map((s3) => s3.id);
      const subs = preset.subIssues.map((summary, i3) => {
        const id = newSubId(taken);
        taken.push(id);
        return newSubIssueInput({ summary, estimated: preset.subEstimates?.[i3] ?? null }, id, created);
      });
      this.assertSubs([...existing, ...subs], subs.map((s3) => s3.id));
      keys = subs.map((s3) => subKey(issue.id, s3.id));
      const withBody = appendParentBodyText(text, preset.body);
      return subs.length > 0 ? insertSubIssuesText(issue.path, issue.id, withBody, subs, import_obsidian23.parseYaml) : withBody;
    });
    this.store.refreshSoon();
    return keys;
  }
  /** worklog の 1 行を書き換える。next が null なら行を消す（ADR-0012） */
  async updateWorklog(entry, next) {
    await this.app.vault.process(this.file(entry.path), (text) => replaceWorklogLine(text, entry, next));
    this.store.refreshSoon();
  }
  /**
   * 記録を始める（ADR-0004: worklog/<端末名>/YYYY-MM.jsonl に追記）。すでに記録中のものは除く。
   * taskIds は記録の鍵（issue / routine の ID か、サブの合成キー。ADR-0135）。
   * open の issue とサブは in-progress にする（ADR-0031）。
   * fromMs を渡すと、その時刻から始めたことにする（押し忘れを直す。ADR-0193）
   */
  async startTimer(taskIds, device, fromMs) {
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08worklog \u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    const running = new Set(this.store.index.running().map(workKey));
    const targets = taskIds.filter((id) => !running.has(id));
    if (targets.length === 0) return;
    const now = fromMs === void 0 ? /* @__PURE__ */ new Date() : new Date(fromMs);
    const from = localDateTime(now);
    const path = (0, import_obsidian23.normalizePath)(worklogPath(device, now));
    const file = await this.getOrCreate(path, "");
    await this.app.vault.process(
      file,
      (text) => targets.reduce((t3, key) => appendWorklogLine(t3, serializeWorklogEntry({ id: newWorklogId(), ...workTarget(key), from, to: null, description: "" })), text)
    );
    this.store.refreshSoon();
    for (const id of targets) {
      const sub = this.store.index.sub(id);
      if (sub) {
        const to2 = timerStartStatus(sub.status);
        if (to2) await this.updateSub(id, { status: to2 }, "timer");
        continue;
      }
      const issue = this.store.index.issues.get(id);
      const to = issue ? timerStartStatus(issue.status) : null;
      if (issue && to) await this.update(issue.path, { status: to, delegated_to: null }, "timer");
    }
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
  /** worklog を手で足す。保存先は開始日の月のファイル。key は記録の鍵（サブは合成キー。ADR-0135） */
  async addWorklog(key, device, entry, fromDate) {
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08worklog \u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    const file = await this.getOrCreate((0, import_obsidian23.normalizePath)(worklogPath(device, fromDate)), "");
    await this.app.vault.process(file, (text) => appendWorklogLine(text, serializeWorklogEntry({ id: newWorklogId(), ...workTarget(key), ...entry })));
    this.store.refreshSoon();
  }
  /** その日のボードの操作を、この端末のログに追記する（ADR-0020） */
  async appendBoardOps(date, device, ops) {
    if (!device) throw new Error("\u8A2D\u5B9A\u3067\u7AEF\u672B\u540D\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044\uFF08\u30DC\u30FC\u30C9\u306E\u4FDD\u5B58\u5148\u306B\u4F7F\u3044\u307E\u3059\uFF09");
    const file = await this.getOrCreate((0, import_obsidian23.normalizePath)(boardLogPath(device, date)), "");
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
    const note = await this.getOrCreate((0, import_obsidian23.normalizePath)(dailyNotePath(date)), newDailyContent(localDateTime()));
    await this.app.vault.process(note, (text) => closeBoardNote(text, date, index, board));
    await this.appendBoardOps(date, device, [{ op: "close", tasks: board.issues }]);
  }
  /**
   * 振り返りの型（ADR-0206）を、その日のデイリーノートの本文の冒頭に入れる（ノートがなければ作る）。
   * 型の見出しがすでにあれば何もしない。デイリーノートのパスを返す
   */
  async insertReview(date) {
    const template = await this.reviewTemplate();
    const path = (0, import_obsidian23.normalizePath)(dailyNotePath(date));
    const note = await this.getOrCreate(path, newDailyContent(localDateTime()));
    await this.app.vault.process(note, (text) => insertReviewTemplate(text, template));
    return path;
  }
  /** 振り返りの型。その Vault のスニペット → 上流の既定 → 組み込みの既定の順（ADR-0060, 0206）。隠しパスも読めるよう adapter で読む */
  async reviewTemplate() {
    const { adapter } = this.app.vault;
    for (const path of REVIEW_SNIPPET_PATHS) {
      try {
        if (!await adapter.exists(path)) continue;
        const body = snippetBody(await adapter.read(path));
        if (body) return body;
      } catch {
      }
    }
    return DEFAULT_REVIEW_TEMPLATE;
  }
  /** routine の category と order を書く（一覧のドラッグ。ADR-0206）。category の null は欄ごと消す（default） */
  async updateRoutines(patches) {
    for (const { path, ...fields } of patches) await this.update(path, fields);
  }
  /** routine を作る（ADR-0010） */
  async createRoutine(summary, repeat, extra = {}) {
    const [id] = nextIds("r", this.takenIds());
    const path = (0, import_obsidian23.normalizePath)(pathForId(id));
    await this.ensureFolder(path);
    const file = await this.app.vault.create(path, newRoutineContent(id, summary, repeat, localDateTime(), extra));
    this.store.refreshSoon();
    return file;
  }
};

// src/core/stepper.ts
function stepperItems(steps, current, counts, passed) {
  return steps.map((s3, i3) => {
    const count = counts[s3.key];
    const state = s3.key === current ? "current" : count === 0 || passed.has(s3.key) ? "done" : "todo";
    const detail = state === "done" ? count > 0 ? `Done \xB7 ${count}` : "Done" : `${count}`;
    return { key: s3.key, number: i3 + 1, label: s3.label, state, compact: state !== "current", count, title: `${i3 + 1}. ${s3.label} (${detail})` };
  });
}

// src/views/ClosingView.tsx
var import_obsidian25 = require("obsidian");

// src/views/Board.tsx
var import_obsidian24 = require("obsidian");

// src/ui/WorklogTimesForm.tsx
function WorklogTimesForm(props) {
  const now = props.now ?? Date.now;
  const [fromText, setFromText] = d2(props.initialFromMs === null ? "" : formatDateTimeValue(props.initialFromMs));
  const [toText, setToText] = d2("");
  const fromRef = A2(null);
  const toRef = A2(null);
  const playRef = A2(null);
  const stopRef = A2(null);
  h2(() => fromRef.current?.select(), []);
  const toEmpty = toText.trim() === "";
  const fromMs = parseDateTimeInput(fromText, { now: now(), timeOnly: { kind: "past" } });
  const toMs = toEmpty ? null : parseDateTimeInput(toText, { now: now(), timeOnly: fromMs === null ? { kind: "past" } : { kind: "after", baseMs: fromMs } });
  const unreadable = fromText.trim() !== "" && fromMs === null || !toEmpty && toMs === null;
  const plan = unreadable ? null : planWorklogTimes({ running: props.running, fromMs, toMs, now: now() });
  const error = plan?.kind === "error" && fromText.trim() !== "" ? plan.error : null;
  const ready = plan !== null && plan.kind !== "error";
  const canPlay = ready && toEmpty;
  const canStop = ready && !toEmpty;
  const submit = () => {
    if (ready) props.onSubmit(plan);
  };
  const focusAction = (to) => setTimeout(() => (to === "play" ? playRef : stopRef).current?.focus(), 0);
  return /* @__PURE__ */ u3("div", { class: "vt-wt", children: [
    /* @__PURE__ */ u3("div", { class: "vt-wt-summary", children: props.summary }),
    /* @__PURE__ */ u3(DateTimeField, { label: "From", text: fromText, parsed: fromMs, onText: setFromText, inputRef: fromRef, now, onEnter: () => toRef.current?.focus() }),
    /* @__PURE__ */ u3(
      DateTimeField,
      {
        label: "To",
        text: toText,
        parsed: toMs,
        placeholder: "Empty to keep running",
        onText: setToText,
        inputRef: toRef,
        now,
        onEnter: () => focusAction(toEmpty ? "play" : "stop")
      }
    ),
    error !== null && /* @__PURE__ */ u3("div", { class: "vt-error", children: error }),
    /* @__PURE__ */ u3("div", { class: "vt-wt-actions", children: [
      /* @__PURE__ */ u3("span", { class: "vt-wt-note", children: props.running ? "Running: \u25B6 keeps it running, \u25A0 stops it" : "\u25B6 starts from From, \u25A0 adds a finished record" }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3(
        "button",
        {
          ref: playRef,
          type: "button",
          class: "vt-play",
          disabled: !canPlay,
          "aria-label": props.running ? "Keep running with this start" : "Start from this time",
          title: props.running ? "Keep running with this start" : "Start from this time",
          onClick: submit,
          children: /* @__PURE__ */ u3(Icon, { name: "play" })
        }
      ),
      /* @__PURE__ */ u3(
        "button",
        {
          ref: stopRef,
          type: "button",
          class: "vt-play is-running",
          disabled: !canStop,
          "aria-label": props.running ? "Stop with these times" : "Add this record",
          title: props.running ? "Stop with these times" : "Add this record",
          onClick: submit,
          children: /* @__PURE__ */ u3(Icon, { name: "square" })
        }
      )
    ] })
  ] });
}

// src/obsidian/worklog-times.ts
function runningOf(ctx, key) {
  return ctx.store.index.running().filter((l3) => workKey(l3) === key).sort((a3, b2) => b2.fromMs - a3.fromMs);
}
async function applyWorklogTimes(ctx, key, plan) {
  const iso = (ms) => localDateTime(new Date(ms));
  if (plan.kind === "start") return ctx.writer.startTimer([key], ctx.settings.deviceName, plan.fromMs);
  if (plan.kind === "add") return ctx.writer.addWorklog(key, ctx.settings.deviceName, { from: iso(plan.fromMs), to: iso(plan.toMs), description: "" }, new Date(plan.fromMs));
  const [entry, ...others] = runningOf(ctx, key);
  if (!entry) throw new Error("\u8A18\u9332\u4E2D\u306E worklog \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044");
  await ctx.writer.updateWorklog(entry, { from: iso(plan.fromMs), to: plan.kind === "stop" ? iso(plan.toMs) : null, description: entry.description });
  if (plan.kind === "stop" && others.length > 0) await ctx.writer.stopTimer(others);
}
function openWorklogTimes(ctx, key, summary) {
  const entry = runningOf(ctx, key)[0] ?? null;
  new PreactModal(
    ctx.app,
    "Edit worklog times",
    (close) => k(WorklogTimesForm, {
      summary,
      running: entry !== null,
      initialFromMs: entry?.fromMs ?? null,
      onSubmit: (plan) => {
        close();
        applyWorklogTimes(ctx, key, plan).catch((e3) => ctx.report("worklog \u3092\u76F4\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    })
  ).open();
}

// src/views/Board.tsx
var ENTER_MS = 3e3;
var LANE_TITLE = {
  working: "Working",
  top: "Top 4",
  routine: "Routines",
  next: "Up next",
  watch: "Watch",
  done: "Done"
};
var LANE_EMPTY = {
  top: "Pick up to 4 cards that matter most today. Drag them here, or use the card menu.",
  next: "Nothing else to do today."
};
var DRAG_TYPE2 = "text/plain";
var readDrag2 = (e3) => e3.dataTransfer?.getData(DRAG_TYPE2) || null;
var isDragLane = (lane) => lane === "top" || lane === "next";
function showStatusMenu2(ctx, date, card, status, e3) {
  if (card.kind !== "routine") return showStatusMenu(ctx, e3, card.key);
  const m3 = new import_obsidian24.Menu();
  for (const s3 of ROUTINE_RESULTS) {
    m3.addItem(
      (mi) => mi.setTitle(s3).setChecked(s3 === status).onClick(() => void setRoutineResult(ctx, date, card.key, s3 === "open" ? null : s3))
    );
  }
  m3.showAtMouseEvent(e3);
}
var ROUTINE_RESULTS = ["open", "closed", "canceled"];
function CarriedChip(props) {
  const day = `${Number(props.from.slice(5, 7))}/${Number(props.from.slice(8, 10))}`;
  return /* @__PURE__ */ u3("span", { class: "vt-chip-mini is-carried vt-num", title: `Carried over from ${formatShortDate(props.from)}. Closing it today settles the missed days`, children: [
    /* @__PURE__ */ u3(Icon, { name: "rotate-cw" }),
    " ",
    day
  ] });
}
function RoutineStepButton(props) {
  const reopen = props.status !== "open";
  const title = reopen ? "Reopen (\u2192 open)" : "Close (\u2192 closed)";
  return /* @__PURE__ */ u3(
    "button",
    {
      type: "button",
      class: "vt-icon-button vt-status-step",
      "aria-label": title,
      title,
      onClick: (e3) => {
        e3.stopPropagation();
        void setRoutineResult(props.ctx, props.date, props.id, reopen ? null : "closed");
      },
      children: reopen ? /* @__PURE__ */ u3(Icon, { name: "undo-2" }) : /* @__PURE__ */ u3(StatusIcon, { status: "closed" })
    }
  );
}
function TaskCard(props) {
  const { ctx, date, board, lanes, lane, card, now } = props;
  const index = ctx.store.index;
  const [dropBefore, setDropBefore] = d2(false);
  const key = card.key;
  const running = index.running(key);
  const elapsed = running.reduce((m3, l3) => Math.max(m3, now - l3.fromMs), 0);
  const status = cardStatus(board, card);
  const summary = cardSummary(card);
  const path = cardPath(card);
  const done = lane === "done";
  const last = card.kind === "issue" ? index.lastStatusLog(card.issue.id) : void 0;
  const enter = last !== void 0 && last.to === status && Date.now() - last.atMs < ENTER_MS;
  const starred = board.stars.includes(key);
  const statusMenu = (e3) => showStatusMenu2(ctx, date, card, status, e3);
  const moreMenu = (e3) => {
    const m3 = new import_obsidian24.Menu();
    if (!done && card.kind !== "routine") {
      if (starred) m3.addItem((mi) => mi.setTitle("Remove from Top 4").setIcon("star-off").onClick(() => void setStar(ctx, date, key, false)));
      else if (canStar(lanes)) m3.addItem((mi) => mi.setTitle("Add to Top 4").setIcon("star").onClick(() => void setStar(ctx, date, key, true)));
    }
    const up = stepOps(lanes, board, key, -1, void 0);
    const down = stepOps(lanes, board, key, 1, void 0);
    if (up) m3.addItem((mi) => mi.setTitle("Move up").setIcon("arrow-up").onClick(() => void stepCard(ctx, date, key, -1)));
    if (down) m3.addItem((mi) => mi.setTitle("Move down").setIcon("arrow-down").onClick(() => void stepCard(ctx, date, key, 1)));
    m3.addSeparator();
    m3.addItem((mi) => mi.setTitle("Edit times").setIcon("history").onClick(() => openWorklogTimes(ctx, key, summary)));
    m3.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(path)));
    if (card.kind !== "routine") m3.addItem((mi) => mi.setTitle("Remove from board").setIcon("x").onClick(() => void removeFromBoard(ctx, date, key)));
    m3.showAtMouseEvent(e3);
  };
  const draggable = isDragLane(lane);
  return /* @__PURE__ */ u3(
    "div",
    {
      class: `vt-task${card.kind === "sub" ? " is-sub" : ""}${isDoneStatus(status) ? " is-done" : ""}${running.length > 0 ? " is-running" : ""}${dropBefore ? " is-drop-before" : ""}`,
      "data-key": key,
      draggable,
      ...draggable ? {
        onDragStart: (e3) => e3.dataTransfer?.setData(DRAG_TYPE2, key),
        // 別のカードの上に落とすと、そのカードの前に入る（ADR-0114, 0137）
        onDragOver: (e3) => {
          e3.preventDefault();
          e3.stopPropagation();
          setDropBefore(true);
        },
        onDragLeave: () => setDropBefore(false),
        onDrop: (e3) => {
          e3.preventDefault();
          e3.stopPropagation();
          setDropBefore(false);
          const dragged = readDrag2(e3);
          if (dragged && dragged !== key) void moveCard(ctx, date, dragged, lane, key);
        }
      } : {},
      children: [
        /* @__PURE__ */ u3(StatusBadge, { status, enter, onClick: statusMenu }),
        card.kind !== "routine" ? /* @__PURE__ */ u3(StatusStepButton, { ctx, keyOf: key, onBoard: true }) : /* @__PURE__ */ u3(RoutineStepButton, { ctx, date, id: key, status }),
        /* @__PURE__ */ u3("span", { class: "vt-task-summary", title: card.kind === "sub" ? `${card.sub.parent} \u203A ${summary}` : `${key} ${summary}`, ...linkProps((e3) => void ctx.openPath(path, import_obsidian24.Keymap.isModEvent(e3) !== false)), children: summary }),
        card.kind === "routine" && card.carriedFrom !== null && /* @__PURE__ */ u3(CarriedChip, { from: card.carriedFrom }),
        !done && card.kind !== "routine" && /* @__PURE__ */ u3(
          "button",
          {
            class: `vt-icon-button vt-star${starred ? " is-starred" : ""}`,
            "aria-label": starred ? "Remove from Top 4" : "Add to Top 4",
            "aria-pressed": starred,
            title: starred ? "Remove from Top 4" : "Add to Top 4",
            onClick: () => void setStar(ctx, date, key, !starred),
            children: /* @__PURE__ */ u3(Icon, { name: "star" })
          }
        ),
        /* @__PURE__ */ u3("button", { class: "vt-icon-button vt-time-edit", "aria-label": "Edit times", title: "Edit start / end times (forgot to press play?)", onClick: () => openWorklogTimes(ctx, key, summary), children: /* @__PURE__ */ u3(Icon, { name: "history" }) }),
        /* @__PURE__ */ u3(
          "button",
          {
            class: `vt-play${running.length > 0 ? " is-running" : ""}`,
            "aria-label": running.length > 0 ? "Stop timer" : "Start timer",
            title: running.length > 0 ? "Stop timer" : "Start timer",
            onClick: () => void (running.length > 0 ? stopTimer(ctx, [key]) : startTimer(ctx, [key])),
            children: [
              /* @__PURE__ */ u3(Icon, { name: running.length > 0 ? "square" : "play" }),
              running.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(elapsed / 6e4) })
            ]
          }
        ),
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "Card menu", title: "Move and more", onClick: moreMenu, children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
      ]
    }
  );
}
function WatchCard(props) {
  const { ctx, date, card } = props;
  if (card.kind === "routine") return null;
  const status = card.kind === "issue" ? card.issue.status : card.sub.status;
  const summary = cardSummary(card);
  const path = cardPath(card);
  const delegatedTo = card.kind === "issue" ? card.issue.delegatedTo : card.sub.delegatedTo;
  const member = delegatedTo ? ctx.store.index.members.get(delegatedTo) : void 0;
  const moreMenu = (e3) => {
    const m3 = new import_obsidian24.Menu();
    m3.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(path)));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3("div", { class: `vt-task vt-watch-task${card.kind === "sub" ? " is-sub" : ""}`, "data-key": card.key, children: [
    /* @__PURE__ */ u3(StatusBadge, { status, onClick: (e3) => showStatusMenu2(ctx, date, card, status, e3) }),
    /* @__PURE__ */ u3("span", { class: "vt-task-summary", title: card.kind === "sub" ? `${card.sub.parent} \u203A ${summary}` : `${card.key} ${summary}`, ...linkProps((e3) => void ctx.openPath(path, import_obsidian24.Keymap.isModEvent(e3) !== false)), children: summary }),
    delegatedTo && /* @__PURE__ */ u3("span", { class: "vt-chip-mini vt-watch-member", title: member ? memberLabel(member) : delegatedTo, children: [
      "@",
      member?.alias ?? delegatedTo
    ] }),
    /* @__PURE__ */ u3("button", { class: "vt-button is-text", "aria-label": "Resume", title: "Back to in-progress and add to today's board", onClick: () => void resumeCard(ctx, date, card), children: [
      /* @__PURE__ */ u3(Icon, { name: "undo-2" }),
      /* @__PURE__ */ u3("span", { class: "vt-watch-label", children: "Resume" })
    ] }),
    /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "Card menu", title: "More", onClick: moreMenu, children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
  ] });
}
function ParentHead(props) {
  const parent = props.ctx.store.index.issues.get(props.parentId);
  return /* @__PURE__ */ u3("div", { class: "vt-lane-parent", children: [
    /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: props.parentId }),
    parent ? /* @__PURE__ */ u3("span", { class: "vt-lane-parent-summary", title: parent.summary, ...linkProps((e3) => void props.ctx.openPath(parent.path, import_obsidian24.Keymap.isModEvent(e3) !== false)), children: parent.summary }) : /* @__PURE__ */ u3("span", { class: "vt-lane-parent-summary", children: "Deleted issue" })
  ] });
}
function Lane(props) {
  const { ctx, date, board, lanes, lane, now } = props;
  const cards2 = lanes[lane];
  const watch = lane === "watch";
  const [over2, setOver] = d2(false);
  const [open, setOpen] = d2(lane === "routine");
  const collapsible = lane === "done" || lane === "routine";
  const shown = !collapsible || open;
  const accepts = isDragLane(lane) && (lane !== "top" || canStar(lanes));
  return /* @__PURE__ */ u3(
    "section",
    {
      class: `vt-lane is-${lane}${over2 ? " is-over" : ""}`,
      "aria-label": LANE_TITLE[lane],
      ...isDragLane(lane) ? {
        onDragOver: (e3) => {
          if (!accepts && !cards2.some((c3) => c3.key === readDrag2(e3))) return;
          e3.preventDefault();
          setOver(true);
        },
        onDragLeave: () => setOver(false),
        onDrop: (e3) => {
          e3.preventDefault();
          setOver(false);
          const dragged = readDrag2(e3);
          if (dragged) void moveCard(ctx, date, dragged, lane, null);
        }
      } : {},
      children: [
        /* @__PURE__ */ u3("header", { class: "vt-lane-head", children: [
          collapsible ? /* @__PURE__ */ u3("button", { class: "vt-lane-toggle", "aria-expanded": open, onClick: () => setOpen(!open), children: [
            /* @__PURE__ */ u3(Icon, { name: open ? "chevron-down" : "chevron-right" }),
            /* @__PURE__ */ u3("span", { class: "vt-lane-name", children: LANE_TITLE[lane] })
          ] }) : /* @__PURE__ */ u3("span", { class: "vt-lane-name", children: [
            lane === "top" && /* @__PURE__ */ u3(Icon, { name: "star" }),
            LANE_TITLE[lane]
          ] }),
          /* @__PURE__ */ u3("span", { class: "vt-count", children: lane === "top" ? `${cards2.length}/${TOP_LIMIT}` : lane === "routine" ? `${cards2.filter((c3) => cardStatus(board, c3) === "open").length}/${cards2.length}` : cards2.length })
        ] }),
        shown && /* @__PURE__ */ u3("div", { class: "vt-lane-cards", children: [
          cardRuns(cards2).map(
            (run) => run.parent === null ? run.cards.map((card) => watch ? /* @__PURE__ */ u3(WatchCard, { ctx, date, card }, card.key) : /* @__PURE__ */ u3(TaskCard, { ctx, date, board, lanes, lane, card, now }, card.key)) : /* @__PURE__ */ u3("div", { class: "vt-lane-run", children: [
              /* @__PURE__ */ u3(ParentHead, { ctx, parentId: run.parent }),
              run.cards.map(
                (card) => watch ? /* @__PURE__ */ u3(WatchCard, { ctx, date, card }, card.key) : /* @__PURE__ */ u3(TaskCard, { ctx, date, board, lanes, lane, card, now }, card.key)
              )
            ] }, `${run.parent}/${run.cards[0].key}`)
          ),
          cards2.length === 0 && LANE_EMPTY[lane] && /* @__PURE__ */ u3("div", { class: "vt-drop-hint", children: LANE_EMPTY[lane] })
        ] })
      ]
    }
  );
}
function boardCandidates(index, date, board) {
  const on = new Set(board.issues);
  const issues = [...index.issues.values()].filter((i3) => isActive(i3) && !on.has(i3.id));
  const subs = index.data.subIssues.filter((s3) => isActive(s3) && !on.has(s3.key) && s3.scheduled !== date && index.sub(s3.key) === s3);
  return [...issues.map((issue) => ({ kind: "issue", issue })), ...subs.map((sub) => ({ kind: "sub", sub }))];
}
function Board(props) {
  const { ctx, index, date, board } = props;
  const now = useNow(3e4);
  const lanes = boardLanes(index, date, board);
  const total = Object.values(lanes).reduce((n2, l3) => n2 + l3.length, 0) - lanes.watch.length;
  const addIssue = () => {
    new BoardIssueModal(ctx.app, boardCandidates(index, date, board), (choice) => {
      if (choice.kind === "issue") void addToBoard(ctx, date, [choice.issue.id]);
      else if (choice.kind === "sub") void addSubToBoard(ctx, date, choice.sub);
      else void createOnBoard(ctx, date, choice.summary);
    }).open();
  };
  const visibleLanes = ["working", "top", "routine", "next", "watch", "done"].filter((l3) => l3 === "routine" ? showRoutineLane(board, lanes) : l3 === "top" || l3 === "next" || lanes[l3].length > 0);
  return /* @__PURE__ */ u3("div", { class: "vt-board", children: [
    /* @__PURE__ */ u3("div", { class: "vt-board-head", children: [
      /* @__PURE__ */ u3("h3", { class: "vt-h", children: [
        "Task board \xB7 ",
        formatShortDate(date)
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button", onClick: addIssue, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " Add issue"
      ] })
    ] }),
    total === 0 ? /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("div", { class: "vt-empty", children: "The board is empty. Issues and sub-issues with today's Do Date are added automatically. You can also add them with the button above." }),
      lanes.watch.length > 0 && /* @__PURE__ */ u3("div", { class: "vt-lanes", children: /* @__PURE__ */ u3(Lane, { ctx, date, board, lanes, lane: "watch", now }) })
    ] }) : /* @__PURE__ */ u3("div", { class: "vt-lanes", children: visibleLanes.map((lane) => /* @__PURE__ */ u3(Lane, { ctx, date, board, lanes, lane, now }, lane)) }),
    /* @__PURE__ */ u3("div", { class: "vt-page-foot vt-board-foot", children: [
      board.closed ? /* @__PURE__ */ u3("span", { class: "vt-done-label", children: [
        /* @__PURE__ */ u3(Icon, { name: "check-circle-2" }),
        " Closed"
      ] }) : /* @__PURE__ */ u3("span", {}),
      props.closingDate !== void 0 && props.closingDate !== date ? (
        // 猶予の間は前日を締める。どの日を締めるかを文言で示す（ADR-0226）
        /* @__PURE__ */ u3("button", { class: "vt-button is-primary", title: "It's past midnight: review the previous day and write the record to its daily note", onClick: props.onClosing, children: [
          /* @__PURE__ */ u3(Icon, { name: "moon" }),
          " Close ",
          formatShortDate(props.closingDate)
        ] })
      ) : /* @__PURE__ */ u3("button", { class: "vt-button is-primary", title: "Review today and write the record to the daily note", onClick: props.onClosing, children: [
        /* @__PURE__ */ u3(Icon, { name: "moon" }),
        " Close board"
      ] })
    ] })
  ] });
}

// src/views/ClosingView.tsx
var GROUP_HEAD = {
  closed: { label: "Closed", icon: "check-circle-2" },
  "not-done": { label: "Not done", icon: "circle-dashed" },
  waiting: { label: "Waiting", icon: "hourglass" },
  canceled: { label: "Canceled", icon: "x-circle" }
};
function hm2(ms) {
  const d3 = new Date(ms);
  return `${String(d3.getHours()).padStart(2, "0")}:${String(d3.getMinutes()).padStart(2, "0")}`;
}
function vaultNotes(ctx) {
  const files = ctx.app.vault.getMarkdownFiles?.() ?? [];
  return files.map((f4) => {
    const fm = ctx.app.metadataCache.getFileCache(f4)?.frontmatter;
    const created = typeof fm?.created === "string" ? fm.created : null;
    const title = typeof fm?.title === "string" && fm.title ? fm.title : typeof fm?.name === "string" && fm.name ? fm.name : f4.basename;
    return { path: f4.path, mtime: f4.stat.mtime, created, title };
  });
}
function TaskRow(props) {
  const { ctx, date, board, item } = props;
  const path = item.kind === "issue" ? item.issue.path : item.kind === "sub" ? item.sub.path : item.routine.path;
  const summary = item.kind === "issue" ? item.issue.summary : item.kind === "sub" ? item.sub.summary : item.routine.summary;
  return /* @__PURE__ */ u3("li", { class: "vt-compact-row", "data-key": item.key, children: [
    /* @__PURE__ */ u3("span", { class: "vt-compact-step", children: item.kind === "routine" ? /* @__PURE__ */ u3(RoutineStepButton, { ctx, date, id: item.key, status: itemStatus(board, item) }) : /* @__PURE__ */ u3(StatusStepButton, { ctx, keyOf: item.key, onBoard: true }) }),
    item.kind === "sub" && /* @__PURE__ */ u3("span", { class: "vt-compact-meta", children: [
      item.sub.parent,
      " \u203A"
    ] }),
    /* @__PURE__ */ u3("span", { class: "vt-compact-title", title: summary, ...linkProps((e3) => void ctx.openPath(path, import_obsidian25.Keymap.isModEvent(e3) !== false)), children: summary || "(no summary)" }),
    item.kind === "routine" && item.carriedFrom !== null && /* @__PURE__ */ u3(CarriedChip, { from: item.carriedFrom }),
    item.kind === "routine" && props.kindLabel !== false && /* @__PURE__ */ u3("span", { class: "vt-compact-meta", children: "routine" }),
    item.minutes > 0 && /* @__PURE__ */ u3("span", { class: "vt-compact-meta vt-num", children: formatMinutes(item.minutes) })
  ] });
}
function ClosingView(props) {
  const { ctx, index, date, board } = props;
  const grace = ctx.settings.closingGraceHour;
  const routines = closingRoutines(index, date);
  const routinesLeft = routines.filter((r3) => board.routines[r3.id] === void 0).length;
  const groups = closingGroups(index, date, board, grace);
  const taskCount = CLOSING_GROUPS.reduce((n2, g2) => n2 + groups[g2].length, 0);
  const notes = closingNotes(vaultNotes(ctx), date, grace);
  const total = [...workedMinutes(index, date).values()].reduce((a3, b2) => a3 + b2, 0);
  return /* @__PURE__ */ u3("div", { class: "vt-closing", children: [
    /* @__PURE__ */ u3("div", { class: "vt-closing-head", children: [
      /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: props.onBack, children: [
        /* @__PURE__ */ u3(Icon, { name: "arrow-left" }),
        " Board"
      ] }),
      /* @__PURE__ */ u3("h3", { class: "vt-h", children: [
        "Closing \xB7 ",
        formatShortDate(date)
      ] }),
      !props.isToday && /* @__PURE__ */ u3("span", { class: "vt-chip-mini", children: "yesterday" }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      total > 0 && /* @__PURE__ */ u3("span", { class: "vt-chip-mini vt-num", title: "Time recorded today", children: [
        /* @__PURE__ */ u3(Icon, { name: "timer" }),
        " ",
        formatMinutes(total)
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-closing-section", "aria-label": "Closing routines", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Closing routines" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: routines.length }),
        routines.length > 0 && routinesLeft === 0 && /* @__PURE__ */ u3("span", { class: "vt-done-label", children: [
          /* @__PURE__ */ u3(Icon, { name: "check-circle-2" }),
          " All done"
        ] })
      ] }),
      routines.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No closing routines today. Set a routine's category to closing to show it here." }) : /* @__PURE__ */ u3("ul", { class: "vt-compact-list", children: routines.map((r3) => /* @__PURE__ */ u3(TaskRow, { ctx, date, board, item: { kind: "routine", key: r3.id, routine: r3, minutes: 0, carriedFrom: carriedFrom(index, r3, date) }, kindLabel: false }, r3.id)) })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-closing-section", "aria-label": "Tasks", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Tasks" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: taskCount })
      ] }),
      taskCount === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "Nothing on today's board" }),
      CLOSING_GROUPS.filter((g2) => groups[g2].length > 0).map((g2) => /* @__PURE__ */ u3("div", { class: "vt-closing-group", children: [
        /* @__PURE__ */ u3("div", { class: `vt-closing-group-head is-${g2}`, children: [
          /* @__PURE__ */ u3(Icon, { name: GROUP_HEAD[g2].icon }),
          /* @__PURE__ */ u3("span", { children: GROUP_HEAD[g2].label }),
          /* @__PURE__ */ u3("span", { class: "vt-num", children: groups[g2].length })
        ] }),
        /* @__PURE__ */ u3("ul", { class: "vt-compact-list", children: groups[g2].map((item) => /* @__PURE__ */ u3(TaskRow, { ctx, date, board, item }, item.key)) })
      ] }, g2))
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-closing-section", "aria-label": "Notes", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Notes" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: notes.length })
      ] }),
      notes.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No notes changed today" }) : /* @__PURE__ */ u3("ul", { class: "vt-compact-list", children: notes.map(({ note, created }) => /* @__PURE__ */ u3("li", { class: "vt-compact-row", children: [
        /* @__PURE__ */ u3(Icon, { name: created ? "file-plus" : "file-text" }),
        /* @__PURE__ */ u3("span", { class: "vt-compact-title", title: note.path, ...linkProps((e3) => void ctx.openPath(note.path, import_obsidian25.Keymap.isModEvent(e3) !== false)), children: note.title }),
        created && /* @__PURE__ */ u3("span", { class: "vt-chip-mini", children: "new" }),
        /* @__PURE__ */ u3("span", { class: "vt-compact-meta vt-num", children: hm2(note.mtime) })
      ] }, note.path)) })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-page-foot", children: [
      /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: props.onBack, children: [
        /* @__PURE__ */ u3(Icon, { name: "arrow-left" }),
        " Board"
      ] }),
      board.closed ? /* @__PURE__ */ u3("span", { class: "vt-closing-done", children: [
        /* @__PURE__ */ u3("span", { class: "vt-done-label", children: [
          /* @__PURE__ */ u3(Icon, { name: "check-circle-2" }),
          " Closed"
        ] }),
        /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void reopenBoard(ctx, date), children: "Reopen" })
      ] }) : /* @__PURE__ */ u3("button", { class: "vt-button is-primary", title: "Write today's record to the daily note. Unfinished cards are recorded as carried over", onClick: () => void closeBoard(ctx, date), children: [
        /* @__PURE__ */ u3(Icon, { name: "check" }),
        " Finish closing"
      ] })
    ] })
  ] });
}

// src/ui/IssueTable.tsx
var import_obsidian26 = require("obsidian");
function IssueTable(props) {
  const { ctx, issues, selected, onSelect } = props;
  const columns = props.columns ?? ["status-detail", "soft_deadline", "deadline"];
  const today = localToday();
  const toggle2 = (id) => {
    if (!selected || !onSelect) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect(next);
  };
  const all = selected !== void 0 && issues.length > 0 && issues.every((i3) => selected.has(i3.id));
  if (issues.length === 0) return /* @__PURE__ */ u3("div", { class: "vt-empty", children: props.empty ?? "Nothing here" });
  const due = (issue, value) => value ? /* @__PURE__ */ u3("span", { class: `vt-due-chip vt-due-${dueLevel(issue, value, today)}`, children: formatShortDate(value) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
  const editable = (issue, c3, open, content) => /* @__PURE__ */ u3("button", { class: "vt-cell-edit", "aria-label": `Edit ${c3} of ${issue.id}`, title: `Edit ${c3}`, onClick: open, children: content });
  const text = (value) => value ? /* @__PURE__ */ u3("span", { class: "vt-cell-detail", children: value }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
  const cell = (issue, c3) => {
    const save = saveIssue(ctx, issue);
    switch (c3) {
      case "status-detail":
        return editable(issue, c3, () => editStatusDetail(ctx, issue.statusDetail, save), text(issue.statusDetail));
      case "soft_deadline":
        return editable(issue, c3, () => editDue(ctx, issue, "soft_deadline"), due(issue, issue.softDeadline));
      case "deadline":
        return editable(issue, c3, () => editDue(ctx, issue, "deadline"), due(issue, issue.deadline));
      case "labels":
        return editable(issue, c3, () => editLabels(ctx, issue.labels, save), text(issue.labels.join(", ")));
      case "estimated":
        return editable(issue, c3, () => editEstimate(ctx, issue.estimated, save), issue.estimated === null ? /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" }) : /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(issue.estimated) }));
      case "calendar": {
        const d3 = issue.scheduled;
        return editable(issue, c3, () => editScheduled(ctx, issue), d3 ? /* @__PURE__ */ u3("span", { class: "vt-num", children: formatShortDate(d3) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" }));
      }
      case "revisit":
        return issue.revisit ? /* @__PURE__ */ u3("span", { class: "vt-num", children: formatShortDate(issue.revisit) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
      case "reviewed":
        return issue.reviewed ? /* @__PURE__ */ u3("span", { class: "vt-num", children: formatShortDate(issue.reviewed) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "Never" });
      case "created":
        return issue.created ? /* @__PURE__ */ u3("span", { class: "vt-num", children: issue.created.slice(0, 10) }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2014" });
    }
  };
  return /* @__PURE__ */ u3("div", { class: "vt-table", role: "table", style: { "--vt-cols": String(columns.length) }, children: [
    /* @__PURE__ */ u3("div", { class: "vt-tr vt-thead", role: "row", children: [
      onSelect && /* @__PURE__ */ u3("input", { type: "checkbox", "aria-label": "Select all", checked: all, onChange: () => onSelect(all ? /* @__PURE__ */ new Set() : new Set(issues.map((i3) => i3.id))) }),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-main", children: "issue" }),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-priority", children: "priority" }),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-status", children: "status" }),
      columns.map((c3) => /* @__PURE__ */ u3("span", { class: `vt-th vt-col-${c3}`, children: c3 })),
      /* @__PURE__ */ u3("span", { class: "vt-th vt-col-menu" })
    ] }),
    issues.map((issue) => /* @__PURE__ */ u3("div", { class: `vt-tr${selected?.has(issue.id) ? " is-selected" : ""}`, role: "row", children: [
      onSelect && /* @__PURE__ */ u3("input", { type: "checkbox", checked: selected?.has(issue.id) ?? false, onChange: () => toggle2(issue.id), "aria-label": `Select ${issue.id}` }),
      /* @__PURE__ */ u3("span", { class: "vt-col-main", ...linkProps((e3) => void ctx.openPath(issue.path, import_obsidian26.Keymap.isModEvent(e3) !== false)), children: [
        props.lead?.(issue),
        /* @__PURE__ */ u3(IdBadge, { issue }),
        /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: issue.summary, children: issue.summary })
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-col-priority", children: /* @__PURE__ */ u3(PriorityBadge, { priority: issue.priority, onClick: (e3) => priorityMenu(e3, issue.priority, saveIssue(ctx, issue)) }) }),
      /* @__PURE__ */ u3("span", { class: "vt-col-status", children: /* @__PURE__ */ u3(StatusBadge, { status: issue.status, onClick: (e3) => showStatusMenu(ctx, e3, issue.id) }) }),
      columns.map((c3) => /* @__PURE__ */ u3("span", { class: `vt-col-${c3}`, children: cell(issue, c3) })),
      /* @__PURE__ */ u3("span", { class: "vt-col-menu", children: /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": `Edit ${issue.id}`, title: "Edit", onClick: (e3) => issueRowMenu(ctx, e3, issue), children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) }) })
    ] }, issue.id))
  ] });
}
function ActionBar(props) {
  return /* @__PURE__ */ u3("div", { class: `vt-actionbar${props.count > 0 ? " is-active" : ""}`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-actionbar-count", children: props.count > 0 ? `${props.count} selected` : "Select rows to act on them" }),
    /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
    props.actions.map((a3) => /* @__PURE__ */ u3("button", { class: `vt-button${a3.tone ? ` is-${a3.tone}` : ""}`, disabled: props.count === 0 || a3.disabled === true, onClick: a3.run, children: a3.label }))
  ] });
}

// src/views/DailyView.tsx
var STEPS = [
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "pick", label: "Pick", icon: "list-todo" },
  { key: "board", label: "Board", icon: "layout-dashboard" }
];
function SubLines(props) {
  const { ctx, subs } = props;
  if (subs.length === 0) return null;
  const runs = [];
  for (const s3 of [...subs].sort((a3, b2) => a3.parent.localeCompare(b2.parent, "en", { numeric: true }) || a3.order - b2.order)) {
    const last = runs[runs.length - 1];
    if (last && last.parent === s3.parent) last.subs.push(s3);
    else runs.push({ parent: s3.parent, subs: [s3] });
  }
  return /* @__PURE__ */ u3("div", { class: "vt-routine-rows vt-sub-rows", children: runs.map((run) => /* @__PURE__ */ u3("div", { class: "vt-lane-run", children: [
    /* @__PURE__ */ u3(ParentHead, { ctx, parentId: run.parent }),
    run.subs.map((s3) => {
      const note = props.note?.(s3) ?? null;
      return /* @__PURE__ */ u3("div", { class: "vt-routine-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: `${s3.parent} \u203A ${s3.summary}`, children: s3.summary }),
        note && /* @__PURE__ */ u3("span", { class: "vt-muted vt-num", children: note }),
        /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
        props.actions(s3).map((a3) => /* @__PURE__ */ u3("button", { class: `vt-button${a3.primary ? "" : " is-text"}`, onClick: a3.run, children: a3.label }))
      ] }, s3.key);
    })
  ] }, run.parent)) });
}
function DueSection(props) {
  const { ctx, target, issues } = props;
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  const today = localToday();
  return /* @__PURE__ */ u3("section", { class: "vt-card", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: props.title }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["status-detail", "soft_deadline", "deadline"], empty: props.empty }),
    issues.length > 0 && /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Add to today's board", icon: "calendar-check", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i3) => i3.id)).then(done) },
          { label: target === "deadline" ? "Change Deadline" : "Change Soft Deadline", icon: "flag", run: () => void rescheduleIssues(ctx, sel, target).then(done) },
          { label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i3) => i3.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
          // 守れない期限は結び直す: 日を変える・保留する（Someday）・やめる（Cancel。ADR-0189）
          { label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i3) => i3.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
          { label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i3) => i3.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}
function SubDueSection(props) {
  const { ctx } = props;
  const today = localToday();
  return /* @__PURE__ */ u3("section", { class: "vt-card", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "end" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: props.subs.length })
    ] }),
    /* @__PURE__ */ u3(
      SubLines,
      {
        ctx,
        subs: props.subs,
        note: (s3) => s3.end ? formatShortDate(s3.end) : null,
        actions: (s3) => [{ label: "Add to today's board", primary: true, run: () => void addSubToBoard(ctx, today, s3) }]
      }
    )
  ] });
}
function CalendarStep(props) {
  const { ctx } = props;
  const total = (l3, s3) => l3.deadline.length + l3.softDeadline.length + s3.length;
  if (total(props.dead, props.deadSub) + total(props.caution, props.cautionSub) + props.missed.length + props.missedSub.length + props.missedRoutines.length === 0) {
    return /* @__PURE__ */ u3("div", { class: "vt-empty", children: "Nothing overdue, due soon, or missed" });
  }
  return /* @__PURE__ */ u3(S, { children: [
    total(props.dead, props.deadSub) > 0 && /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("h3", { class: "vt-h", children: "Overdue" }),
      /* @__PURE__ */ u3(DueSection, { ctx, target: "deadline", title: "deadline", issues: props.dead.deadline, empty: "Nothing is overdue" }),
      /* @__PURE__ */ u3(DueSection, { ctx, target: "soft_deadline", title: "soft_deadline", issues: props.dead.softDeadline, empty: "Nothing is overdue" }),
      props.deadSub.length > 0 && /* @__PURE__ */ u3(SubDueSection, { ctx, subs: props.deadSub })
    ] }),
    total(props.caution, props.cautionSub) > 0 && /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("h3", { class: "vt-h", children: "Due soon" }),
      /* @__PURE__ */ u3(DueSection, { ctx, target: "deadline", title: "deadline", issues: props.caution.deadline, empty: "No deadlines in the next 3 days" }),
      /* @__PURE__ */ u3(DueSection, { ctx, target: "soft_deadline", title: "soft_deadline", issues: props.caution.softDeadline, empty: "No deadlines in the next 3 days" }),
      props.cautionSub.length > 0 && /* @__PURE__ */ u3(SubDueSection, { ctx, subs: props.cautionSub })
    ] }),
    props.missed.length + props.missedSub.length + props.missedRoutines.length > 0 && /* @__PURE__ */ u3("h3", { class: "vt-h", children: "Missed" }),
    props.missed.length + props.missedSub.length > 0 && /* @__PURE__ */ u3(MissedSection, { ctx, issues: props.missed, subs: props.missedSub }),
    props.missedRoutines.length > 0 && /* @__PURE__ */ u3(MissedRoutinesSection, { ctx, missed: props.missedRoutines })
  ] });
}
function MissedSection(props) {
  const { ctx, issues } = props;
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  const today = localToday();
  return /* @__PURE__ */ u3(S, { children: /* @__PURE__ */ u3("section", { class: "vt-card", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Calendar" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length + props.subs.length })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["calendar", "deadline", "estimated"], empty: "" }),
    issues.length > 0 && /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Add to today's board", icon: "calendar-check", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i3) => i3.id)).then(done) },
          { label: "Move date", icon: "calendar-clock", run: () => void rescheduleIssues(ctx, sel, "scheduled").then(done) },
          { label: "Back to Next", icon: "list-todo", run: () => void backToNextIssues(ctx, sel).then(done) },
          { label: "Close", icon: "check", disabled: !canApplyAll(sel.map((i3) => i3.status), "closed"), run: () => void closeIssues(ctx, sel).then(done) },
          { label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i3) => i3.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    ),
    /* @__PURE__ */ u3(
      SubLines,
      {
        ctx,
        subs: props.subs,
        note: (s3) => s3.scheduled ? formatShortDate(s3.scheduled) : null,
        actions: (s3) => [
          { label: "Add to today's board", primary: true, run: () => void addSubToBoard(ctx, today, s3) },
          {
            label: "Move date",
            run: () => void askDate(ctx, "Move date (must be done on this day)", today).then((d3) => {
              if (d3) void ctx.writer.updateSub(s3.key, { scheduled: d3 }).catch((e3) => ctx.report("\u65E5\u4ED8\u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
            })
          },
          { label: "Back to Next", run: () => void ctx.writer.updateSub(s3.key, { scheduled: null }).catch((e3) => ctx.report("Next \u306B\u623B\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3)) }
        ]
      }
    )
  ] }) });
}
function MissedRoutinesSection(props) {
  const { ctx } = props;
  return /* @__PURE__ */ u3("section", { class: "vt-card", "aria-label": "Missed routines", children: [
    /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
      /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Routines" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: props.missed.length })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-routine-rows", children: props.missed.map(({ date, routine }) => /* @__PURE__ */ u3("div", { class: "vt-routine-row", children: [
      /* @__PURE__ */ u3("span", { class: "vt-date-chip", title: `Scheduled on ${date}`, children: formatShortDate(date) }),
      /* @__PURE__ */ u3("span", { class: "vt-badge vt-id vt-routine-id", children: routine.id }),
      /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: routine.summary, children: routine.summary }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button", onClick: () => void setRoutineResult(ctx, date, routine.id, "closed"), children: "Close" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void setRoutineResult(ctx, date, routine.id, "canceled"), children: "Cancel" })
    ] }, `${date}/${routine.id}`)) })
  ] });
}
function PickStep(props) {
  const { ctx, issues } = props;
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const sel = issues.filter((i3) => selected.has(i3.id));
  const done = () => setSelected(/* @__PURE__ */ new Set());
  const today = localToday();
  if (issues.length === 0 && props.groups.length === 0 && props.stalled.length === 0) return /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No next actions to pick" });
  return /* @__PURE__ */ u3(S, { children: [
    issues.length > 0 && /* @__PURE__ */ u3("section", { class: "vt-card", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Next actions" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length })
      ] }),
      /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["labels", "estimated", "deadline", "reviewed"] }),
      /* @__PURE__ */ u3(
        ActionBar,
        {
          count: sel.length,
          actions: [
            { label: "Add to board", icon: "calendar-check", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i3) => i3.id)).then(done) },
            { label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i3) => i3.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
            { label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i3) => i3.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
            { label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i3) => i3.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) }
          ]
        }
      )
    ] }),
    props.groups.length > 0 && /* @__PURE__ */ u3("section", { class: "vt-card", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Sub-issues" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: props.groups.reduce((n2, g2) => n2 + g2.subs.length, 0) })
      ] }),
      /* @__PURE__ */ u3(SubLines, { ctx, subs: props.groups.flatMap((g2) => g2.subs), actions: (s3) => [{ label: "Add to board", primary: true, run: () => void addSubToBoard(ctx, today, s3) }] })
    ] }),
    props.stalled.length > 0 && // Next のサブが 1 つもない Project（ADR-0203）。Pick の段階から消えないように出し、issue 画面で期間を決めるかサブを足す
    /* @__PURE__ */ u3("section", { class: "vt-card", children: [
      /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Projects without a next action" }),
        /* @__PURE__ */ u3("span", { class: "vt-count", children: props.stalled.length })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-routine-rows", children: props.stalled.map((p3) => {
        const done2 = allSubsDone(ctx.store.index.subs(p3.id));
        return /* @__PURE__ */ u3("div", { class: "vt-routine-row", children: [
          /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: `${p3.id} ${p3.summary}`, children: p3.summary }),
          /* @__PURE__ */ u3("span", { class: "vt-muted", children: done2 ? "All sub-issues are done" : "No sub-issue to do today" }),
          /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
          done2 && /* @__PURE__ */ u3("button", { class: "vt-button", onClick: () => void closeIssues(ctx, [p3]), children: "Close" }),
          /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void ctx.openPath(p3.path), children: "Open" })
        ] }, p3.id);
      }) })
    ] })
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
  const deadSub = deadSubs(index, today);
  const caution = cautionIssues(issues, today);
  const cautionSub = cautionSubs(index, today);
  const missed = missedIssues(issues, today);
  const missedSub = missedSubs(index, today);
  const missedRoutine = missedRoutines(index, today);
  const todayBoard = index.board(today)?.board ?? emptyBoard();
  const pick = pickCandidates(index, today, todayBoard);
  const toAdd = index.toAutoAdd(today);
  const todayLeft = unfinished(index, today, todayBoard);
  const lists = (l3, s3) => l3.deadline.length + l3.softDeadline.length + s3.length;
  const counts = {
    calendar: lists(dead, deadSub) + lists(caution, cautionSub) + missed.length + missedSub.length + missedRoutine.length,
    pick: pick.issues.length + pick.groups.reduce((n2, g2) => n2 + g2.subs.length, 0) + pick.stalled.length,
    board: unfinishedCount(todayLeft)
  };
  const [passed, setPassed] = d2(/* @__PURE__ */ new Set());
  const [manual, setManual] = d2(null);
  const [closingDate, setClosingDate] = d2(null);
  const grace = ctx.settings.closingGraceHour;
  const target = closingTarget(index, new Date(now), grace);
  const step = currentStep(
    STEPS.map((s3) => s3.key),
    counts,
    passed,
    manual
  );
  const adding = A2(/* @__PURE__ */ new Set());
  h2(() => {
    const ids = toAdd.filter((id) => !adding.current.has(`${today}/${id}`));
    if (ids.length === 0) return;
    for (const id of ids) adding.current.add(`${today}/${id}`);
    void addToBoard(ctx, today, ids).finally(() => {
      for (const id of ids) adding.current.delete(`${today}/${id}`);
    });
  });
  const closing = A2(/* @__PURE__ */ new Set());
  h2(() => {
    for (const b2 of index.data.boards) {
      if (b2.date >= today || b2.board.closed || closing.current.has(b2.date)) continue;
      if (holdAutoClose(b2.date, new Date(now), grace)) continue;
      if (unfinishedCount(unfinished(index, b2.date, b2.board, today)) > 0) continue;
      closing.current.add(b2.date);
      void ctx.writer.closeBoard(b2.date, ctx.settings.deviceName).catch((e3) => ctx.report("\u524D\u56DE\u306E\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3)).finally(() => closing.current.delete(b2.date));
    }
  });
  const next = () => {
    setPassed(/* @__PURE__ */ new Set([...passed, step]));
    setManual(null);
  };
  if (closingDate !== null) {
    return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
      /* @__PURE__ */ u3("header", { class: "vt-page-head", children: /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: [
        "Today \xB7 ",
        formatShortDate(today)
      ] }) }),
      /* @__PURE__ */ u3(ClosingView, { ctx, index, date: closingDate, board: index.board(closingDate)?.board ?? emptyBoard(), isToday: closingDate === today, onBack: () => setClosingDate(null) })
    ] });
  }
  const startClosing = () => {
    setClosingDate(target);
    void beginClosing(ctx, target);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: [
      "Today \xB7 ",
      formatShortDate(today)
    ] }) }),
    /* @__PURE__ */ u3("nav", { class: "vt-stepper", "aria-label": "Steps", children: stepperItems(STEPS, step, counts, passed).map((s3, i3) => /* @__PURE__ */ u3(S, { children: [
      i3 > 0 && /* @__PURE__ */ u3("span", { class: "vt-step-line", "aria-hidden": "true" }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: `vt-step is-${s3.state}${s3.compact ? " is-compact" : ""}`,
          "aria-current": s3.state === "current" ? "step" : void 0,
          "aria-label": s3.compact ? s3.title : void 0,
          title: s3.compact ? s3.title : void 0,
          onClick: () => setManual(s3.key),
          children: [
            /* @__PURE__ */ u3("span", { class: "vt-step-icon", children: s3.state === "done" ? /* @__PURE__ */ u3(Icon, { name: "check" }) : s3.number }),
            !s3.compact && /* @__PURE__ */ u3("span", { class: "vt-step-label", children: s3.label }),
            s3.count > 0 && (s3.compact ? /* @__PURE__ */ u3("span", { class: "vt-step-dot" }) : /* @__PURE__ */ u3("span", { class: "vt-step-count", children: s3.count }))
          ]
        }
      )
    ] }, s3.key)) }),
    step === "calendar" && /* @__PURE__ */ u3(CalendarStep, { ctx, dead, deadSub, caution, cautionSub, missed, missedSub, missedRoutines: missedRoutine }),
    step === "pick" && /* @__PURE__ */ u3(PickStep, { ctx, issues: pick.issues, groups: pick.groups, stalled: pick.stalled }),
    step === "board" && /* @__PURE__ */ u3(Board, { ctx, index, date: today, board: todayBoard, closingDate: target, onClosing: startClosing }),
    step !== "board" && /* @__PURE__ */ u3("div", { class: "vt-page-foot", children: [
      /* @__PURE__ */ u3("span", {}),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", onClick: next, children: [
        "Next ",
        /* @__PURE__ */ u3(Icon, { name: "arrow-right" })
      ] })
    ] })
  ] });
}

// src/views/InboxView.tsx
function InboxView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const [draft, setDraft] = d2("");
  const [selected, setSelected] = d2(/* @__PURE__ */ new Set());
  const today = localToday();
  const issues = [...ctx.store.index.issues.values()].filter((i3) => ctx.store.index.inbox(i3, today)).sort((a3, b2) => (b2.created ?? "").localeCompare(a3.created ?? ""));
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
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: issues.length === 0, onClick: () => void ctx.openView("pkm-task-organize"), children: [
        /* @__PURE__ */ u3(Icon, { name: "layers" }),
        " Organize"
      ] })
    ] }),
    /* @__PURE__ */ u3("form", { class: "vt-quick-add", onSubmit: create, children: [
      /* @__PURE__ */ u3(Icon, { name: "plus" }),
      /* @__PURE__ */ u3("input", { type: "text", placeholder: "Type a summary and press Enter (goes to Inbox)", value: draft, onInput: (e3) => setDraft(e3.currentTarget.value) }),
      /* @__PURE__ */ u3("button", { type: "button", class: "vt-button is-text", onClick: () => openCaptureModal(ctx), children: "Capture" })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["labels", "estimated", "created"], empty: "Inbox is empty" }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Next", icon: "list-todo", tone: "primary", run: () => void nextIssues(ctx, sel).then(done) },
          { label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i3) => i3.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
          { label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i3) => i3.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
          { label: "Close", icon: "check", disabled: !canApplyAll(sel.map((i3) => i3.status), "closed"), run: () => void closeIssues(ctx, sel).then(done) },
          { label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i3) => i3.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}

// src/views/LabelManagerView.tsx
var nextKey = 1;
var toDraft = (l3) => ({ key: nextKey++, from: l3.name, name: l3.name, color: l3.color });
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
  const [drafts, setDrafts] = d2(() => ctx.store.index.data.labels.map(toDraft));
  const [dirty, setDirty] = d2(false);
  const [saving, setSaving] = d2(false);
  const [focusKey, setFocusKey] = d2(null);
  h2(() => {
    if (!dirty) setDrafts(ctx.store.index.data.labels.map(toDraft));
  }, [version]);
  const usage = labelUsage(ctx.store.index);
  const update = (next) => {
    setDrafts(next);
    setDirty(true);
  };
  const setLabel = (key, patch) => update(drafts.map((d3) => d3.key === key ? { ...d3, ...patch } : d3));
  const add = () => {
    const d3 = { key: nextKey++, from: null, name: "", color: DEFAULT_LABEL_COLOR };
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
            setDrafts(ctx.store.index.data.labels.map(toDraft));
            setDirty(false);
          },
          children: "Revert"
        }
      ) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "Saved" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: !dirty || hasError || saving, onClick: save, children: [
        /* @__PURE__ */ u3(Icon, { name: "save" }),
        " Save"
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-label-editor", children: [
      drafts.map((d3, i3) => {
        const used = d3.from === null ? 0 : usage.get(d3.from) ?? 0;
        const colorError = labelColorError(d3.color);
        return /* @__PURE__ */ u3("section", { class: "vt-card vt-label-edit", "aria-label": `label ${d3.name || "(no name)"}`, children: [
          /* @__PURE__ */ u3("div", { class: "vt-label-edit-fields", children: [
            /* @__PURE__ */ u3(
              "input",
              {
                type: "color",
                class: "vt-color-swatch",
                value: pickerValue(d3.color),
                title: "Choose color",
                "aria-label": "Choose color",
                onInput: (e3) => setLabel(d3.key, { color: e3.currentTarget.value })
              }
            ),
            /* @__PURE__ */ u3(NameField, { label: "Name", value: d3.name, error: nameError(d3), autoFocus: focusKey === d3.key, onInput: (v3) => setLabel(d3.key, { name: v3 }) }),
            /* @__PURE__ */ u3(
              NameField,
              {
                label: "Color",
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
                deleteDisabled: used > 0 ? `Used by ${used} issues / routines / members, so it cannot be deleted` : void 0
              }
            )
          ] }),
          /* @__PURE__ */ u3("div", { class: "vt-label-edit-meta", children: [
            /* @__PURE__ */ u3(LabelBadge, { name: d3.name.trim() || "(no name)", color: HEX2.test(d3.color) ? d3.color : DEFAULT_LABEL_COLOR }),
            /* @__PURE__ */ u3("span", { class: "vt-muted", children: used > 0 ? `Used by ${used}` : "Unused" }),
            d3.from !== null && d3.from !== d3.name.trim() && /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
              "(was: ",
              d3.from,
              ")"
            ] })
          ] })
        ] }, d3.key);
      }),
      /* @__PURE__ */ u3("button", { class: "vt-add-group", onClick: add, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " Add label"
      ] })
    ] }),
    dirty && /* @__PURE__ */ u3("div", { class: "vt-banner", children: [
      "Unsaved changes",
      hasError ? " (fix the errors to save)" : renamed > 0 ? ` (saving rewrites the label on ${renamed} issues / routines / members)` : ""
    ] }),
    /* @__PURE__ */ u3("p", { class: "vt-muted", children: "Renaming a label also rewrites it on the issues, routines and members that use it. To delete a label in use, remove it from those issues, routines and members first." })
  ] });
}

// src/views/MemberListView.tsx
var import_obsidian27 = require("obsidian");

// src/ui/FilterChip.tsx
function FilterChip(props) {
  return /* @__PURE__ */ u3("button", { class: `vt-filter-chip${props.on ? " is-on" : ""}`, "aria-pressed": props.on, onClick: props.onClick, children: [
    props.on && /* @__PURE__ */ u3(Icon, { name: "check" }),
    props.label
  ] });
}
function toggle(list, v3) {
  return list.includes(v3) ? list.filter((x2) => x2 !== v3) : [...list, v3];
}

// src/views/MemberListView.tsx
function MemberForm(props) {
  const [name, setName] = d2("");
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (name.trim()) props.onSubmit(name.trim());
      },
      children: [
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "name" }),
          /* @__PURE__ */ u3("input", { type: "text", value: name, placeholder: "e.g. Taro Tanaka", ref: (el) => el?.focus(), onInput: (e3) => setName(e3.currentTarget.value) })
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-muted", children: "The same name goes into nickname, and the ID into alias. You can change them on the member screen later." }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: !name.trim(), children: "Create" }) })
      ]
    }
  );
}
function MemberListView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const [q2, setQ] = d2(defaultMemberQuery);
  const set = (patch) => setQ({ ...q2, ...patch });
  const delegated = /* @__PURE__ */ new Map();
  for (const issue of index.issues.values()) {
    if (issue.delegatedTo !== null && !isDoneStatus(issue.status)) delegated.set(issue.delegatedTo, (delegated.get(issue.delegatedTo) ?? 0) + 1);
  }
  const total = index.members.size;
  const members = queryMembers(index.members.values(), q2, delegated);
  const colors2 = new Map(index.data.labels.map((l3) => [l3.name, l3.color]));
  const labels = index.data.labels.map((l3) => l3.name);
  const create = () => new PreactModal(ctx.app, "Create member", (close) => /* @__PURE__ */ u3(
    MemberForm,
    {
      onSubmit: (name) => {
        close();
        void ctx.writer.createMember(name).then((id) => ctx.openPath(pathForId(id))).catch((e3) => ctx.report("member \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    }
  )).open();
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Members" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: total }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", onClick: create, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " Create member"
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-filters", children: [
      /* @__PURE__ */ u3("label", { class: "vt-search", children: [
        /* @__PURE__ */ u3(Icon, { name: "search" }),
        /* @__PURE__ */ u3("input", { type: "search", placeholder: "Search by @alias, nickname, name or ID", value: q2.text, onInput: (e3) => set({ text: e3.currentTarget.value }) })
      ] }),
      labels.length > 0 && /* @__PURE__ */ u3("div", { class: "vt-filter-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "label" }),
        labels.map((l3) => /* @__PURE__ */ u3(FilterChip, { label: l3, on: q2.labels.includes(l3), onClick: () => set({ labels: toggle(q2.labels, l3) }) }))
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-filter-row", children: [
        /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Sort" }),
        /* @__PURE__ */ u3("select", { class: "dropdown", value: q2.sort, onChange: (e3) => set({ sort: e3.currentTarget.value }), children: MEMBER_SORTS.map((s3) => /* @__PURE__ */ u3("option", { value: s3.key, children: s3.label })) }),
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: q2.desc ? "Descending" : "Ascending", "aria-label": q2.desc ? "Descending" : "Ascending", onClick: () => set({ desc: !q2.desc }), children: /* @__PURE__ */ u3(Icon, { name: q2.desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide" }) }),
        /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => setQ(defaultMemberQuery()), children: "Reset" })
      ] })
    ] }),
    total === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No members yet. Add the people you delegate issues to." }),
    total > 0 && members.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No members match" }),
    /* @__PURE__ */ u3("div", { class: "vt-routine-list", children: members.map((m3) => {
      const count = delegated.get(m3.id) ?? 0;
      return /* @__PURE__ */ u3("div", { class: "vt-routine-item", children: [
        /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: m3.id }),
        /* @__PURE__ */ u3("div", { class: "vt-routine-main", ...linkProps((e3) => void ctx.openPath(m3.path, import_obsidian27.Keymap.isModEvent(e3) !== false)), children: [
          /* @__PURE__ */ u3("span", { class: "vt-routine-summary", children: memberLabel(m3) }),
          m3.labels.length > 0 && /* @__PURE__ */ u3("span", { class: "vt-member-row-labels", children: m3.labels.map((l3) => /* @__PURE__ */ u3(LabelBadge, { name: l3, color: colors2.get(l3) ?? DEFAULT_LABEL_COLOR })) })
        ] }),
        /* @__PURE__ */ u3("span", { class: "vt-muted", title: "Number of delegated issues (not closed / canceled)", children: [
          "Delegated ",
          count
        ] })
      ] }, m3.id);
    }) })
  ] });
}

// src/views/PresetListView.tsx
var import_obsidian28 = require("obsidian");
function PresetForm(props) {
  const [name, setName] = d2("");
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (name.trim()) props.onSubmit(name.trim());
      },
      children: [
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "name" }),
          /* @__PURE__ */ u3("input", { type: "text", value: name, placeholder: "e.g. Release", ref: (el) => el?.focus(), onInput: (e3) => setName(e3.currentTarget.value) })
        ] }),
        /* @__PURE__ */ u3("div", { class: "vt-muted", children: "Add the sub-issues and the body on the preset screen that opens next." }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: !name.trim(), children: "Create" }) })
      ]
    }
  );
}
function PresetListView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const all = ctx.store.index.data.presets;
  const [text, setText] = d2("");
  const presets = all.filter((p3) => matchPreset(p3, text));
  const create = () => new PreactModal(ctx.app, "Create preset", (close) => /* @__PURE__ */ u3(
    PresetForm,
    {
      onSubmit: (name) => {
        close();
        void ctx.writer.createPreset(name).then((id) => ctx.openPath(pathForId(id))).catch((e3) => ctx.report("\u30D7\u30EA\u30BB\u30C3\u30C8\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    }
  )).open();
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Presets" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: all.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", onClick: create, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " Create preset"
      ] })
    ] }),
    all.length > 0 && /* @__PURE__ */ u3("section", { class: "vt-card vt-filters", children: /* @__PURE__ */ u3("label", { class: "vt-search", children: [
      /* @__PURE__ */ u3(Icon, { name: "search" }),
      /* @__PURE__ */ u3("input", { type: "search", placeholder: "Search by name, sub-issue or body", value: text, onInput: (e3) => setText(e3.currentTarget.value) })
    ] }) }),
    all.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No presets yet. A preset is a set of sub-issues and a body that you can add to an issue at once." }),
    all.length > 0 && presets.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No presets match" }),
    /* @__PURE__ */ u3("div", { class: "vt-routine-list", children: presets.map((p3) => {
      const preview = presetBodyPreview(p3.body);
      return /* @__PURE__ */ u3("div", { class: "vt-routine-item vt-preset-item", children: [
        /* @__PURE__ */ u3("span", { class: "vt-badge vt-id", children: p3.id }),
        /* @__PURE__ */ u3("div", { class: "vt-routine-main", ...linkProps((e3) => void ctx.openPath(p3.path, import_obsidian28.Keymap.isModEvent(e3) !== false)), children: [
          /* @__PURE__ */ u3("span", { class: "vt-routine-summary", children: p3.name }),
          preview && /* @__PURE__ */ u3("span", { class: "vt-preset-item-preview", children: preview })
        ] }),
        /* @__PURE__ */ u3("span", { class: "vt-muted", title: "Number of sub-issues", children: [
          "Sub-issues ",
          p3.subIssues.length
        ] })
      ] }, p3.id);
    }) }),
    /* @__PURE__ */ u3("p", { class: "vt-muted", children: "Apply a preset from the Sub-issues card of an issue. Its sub-issues are added at the end, and its body is appended to the end of the issue's body." })
  ] });
}

// src/views/ProjectsView.tsx
function ProjectsView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const [showClosed, setShowClosed] = d2(false);
  const [scale, setScale] = d2("week");
  const index = ctx.store.index;
  const today = localToday();
  const groups = projectGroups(index, showClosed);
  const rows = groups.flatMap((g2) => [{ kind: "project", issue: g2.issue, subs: g2.subs }, ...g2.subs.map((sub) => ({ kind: "sub", sub }))]);
  const closed = groups.reduce((n2, g2) => n2 + g2.closed, 0);
  const noEstimate = groups.reduce((n2, g2) => n2 + g2.subs.filter((s3) => needsEstimate(s3, today)).length, 0);
  const openSub = (sub) => void ctx.openPath(sub.path).then(() => window.setTimeout(() => revealSub(sub), 50)).catch((e3) => ctx.report("\u30B5\u30D6\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  return /* @__PURE__ */ u3("div", { class: "vt-page vt-projects", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Projects" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: groups.length }),
      noEstimate > 0 && /* @__PURE__ */ u3("span", { class: "vt-badge vt-projects-no-estimate", title: "Sub-issues in the next 14 days without an estimate", children: [
        "No estimate ",
        noEstimate
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      closed > 0 && /* @__PURE__ */ u3("button", { type: "button", class: "vt-text-button", onClick: () => setShowClosed((v3) => !v3), children: closedLabel(closed, showClosed) })
    ] }),
    groups.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No projects" }) : /* @__PURE__ */ u3(TimelineChart, { ctx, rows, scale, onScale: setScale, load: { capacity: ctx.settings.capacity, items: loadItems(groups, index) }, onSubLabel: openSub, stickyScrollbar: true })
  ] });
}

// src/views/IssueListView.tsx
var import_obsidian29 = require("obsidian");

// src/core/list.ts
function defaultQuery() {
  return { text: "", statuses: [], priorities: [], labels: [], scheduled: "any", sort: "id", desc: true };
}
function nextScheduled(issue, today) {
  return issue.scheduled !== null && issue.scheduled >= today ? issue.scheduled : null;
}
function sortValue2(issue, key, today) {
  switch (key) {
    case "id":
      return Number(issue.id.slice(2));
    case "summary":
      return issue.summary;
    case "status":
      return STATUSES.indexOf(issue.status);
    case "priority":
      return issue.priority === null ? null : PRIORITIES.indexOf(issue.priority);
    case "soft_deadline":
      return issue.softDeadline;
    case "deadline":
      return issue.deadline;
    case "created":
      return issue.created;
    case "scheduled":
      return nextScheduled(issue, today);
  }
}
function queryIssues(issues, q2, today) {
  const words = q2.text.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [...issues].filter((i3) => {
    if (q2.statuses.length > 0 ? !q2.statuses.includes(i3.status) : !isActive(i3)) return false;
    if (q2.priorities.length > 0 && !q2.priorities.includes(i3.priority ?? "none")) return false;
    if (q2.labels.length > 0 && !q2.labels.every((l3) => i3.labels.includes(l3))) return false;
    if (q2.scheduled === "yes" && i3.scheduled === null) return false;
    if (q2.scheduled === "no" && i3.scheduled !== null) return false;
    const hay = `${i3.id} ${i3.summary}`.toLowerCase();
    return words.every((w3) => hay.includes(w3));
  });
  return out.sort((a3, b2) => {
    const va = sortValue2(a3, q2.sort, today);
    const vb = sortValue2(b2, q2.sort, today);
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
  { key: "scheduled", label: "Calendar date" },
  { key: "soft_deadline", label: "soft_deadline" },
  { key: "deadline", label: "deadline" },
  { key: "created", label: "Created" }
];
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
    const m3 = new import_obsidian29.Menu();
    for (const p3 of ctx.settings.presets) {
      m3.addItem((mi) => mi.setTitle(p3.name).onClick(() => set({ ...defaultQuery(), ...p3.query })));
    }
    if (ctx.settings.presets.length > 0) m3.addSeparator();
    m3.addItem(
      (mi) => mi.setTitle("Save current filter\u2026").setIcon("save").onClick(
        () => new PreactModal(ctx.app, "Filter name", (close) => /* @__PURE__ */ u3(
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
        (mi) => mi.setTitle(`Delete "${p3.name}"`).setIcon("trash").onClick(() => {
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
        " Saved filters"
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-card vt-filters", children: [
      /* @__PURE__ */ u3("label", { class: "vt-search", children: [
        /* @__PURE__ */ u3(Icon, { name: "search" }),
        /* @__PURE__ */ u3("input", { type: "search", placeholder: "Search by ID or summary", value: q2.text, onInput: (e3) => set({ text: e3.currentTarget.value }) })
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
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Calendar" }),
        [
          ["any", "Any"],
          ["yes", "Set"],
          ["no", "Not set"]
        ].map(([v3, label]) => /* @__PURE__ */ u3(FilterChip, { label, on: q2.scheduled === v3, onClick: () => set({ scheduled: v3 }) })),
        /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
        /* @__PURE__ */ u3("span", { class: "vt-field-label", children: "Sort" }),
        /* @__PURE__ */ u3("select", { class: "dropdown", value: q2.sort, onChange: (e3) => set({ sort: e3.currentTarget.value }), children: SORTS.map((s3) => /* @__PURE__ */ u3("option", { value: s3.key, children: s3.label })) }),
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", title: q2.desc ? "Descending" : "Ascending", onClick: () => set({ desc: !q2.desc }), children: /* @__PURE__ */ u3(Icon, { name: q2.desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide" }) }),
        /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => set(defaultQuery()), children: "Reset" })
      ] })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues: shown, selected, onSelect: setSelected, columns: ["status-detail", "labels", "calendar", "soft_deadline", "deadline", "estimated"], empty: "No issues match" }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i3) => i3.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
          { label: "Close", icon: "check", disabled: !canApplyAll(sel.map((i3) => i3.status), "closed"), run: () => void closeIssues(ctx, sel).then(done) },
          { label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i3) => i3.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
          { label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i3) => i3.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    ),
    pages > 1 && /* @__PURE__ */ u3(Pager, { current, pages, onChange: setPage })
  ] });
}

// src/views/OrganizeView.tsx
var import_obsidian30 = require("obsidian");
var CHUNK = 5;
var SWIPE = 90;
var FIELD_OF = {
  status: (i3) => i3.status,
  scheduled: (i3) => i3.scheduled,
  soft_deadline: (i3) => i3.softDeadline,
  deadline: (i3) => i3.deadline,
  revisit: (i3) => i3.revisit,
  reviewed: (i3) => i3.reviewed,
  estimated: (i3) => i3.estimated,
  delegated_to: (i3) => i3.delegatedTo,
  priority: (i3) => i3.priority,
  label: (i3) => i3.labels,
  clarified: (i3) => i3.clarified ? true : null,
  tickler: (i3) => i3.tickler
};
function snapshot(issue, patch) {
  const prev = {};
  for (const key of Object.keys(patch)) prev[key] = FIELD_OF[key]?.(issue) ?? null;
  return prev;
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
  const queue = organizeQueue(ctx.store.index.issues.values(), today, (id) => ctx.store.index.planned(id)).filter((i3) => !handled.has(i3.id));
  const issue = queue[0];
  const hasSubs = issue !== void 0 && ctx.store.index.subs(issue.id).length > 0;
  const excerpt = useExcerpt(ctx, issue);
  const apply2 = async (patch, label) => {
    if (!issue) return;
    const full = { ...patch, reviewed: today };
    const prev = snapshot(issue, full);
    try {
      await ctx.writer.update(issue.path, full);
      ctx.settings.lastOrganizedAt = (/* @__PURE__ */ new Date()).toISOString();
      void ctx.saveSettings();
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
      const next2 = new Set(handled);
      next2.delete(undo.id);
      setHandled(next2);
      setCount(Math.max(0, count - 1));
      setUndo(null);
    } catch (e3) {
      ctx.report("\u53D6\u308A\u6D88\u305B\u307E\u305B\u3093\u3067\u3057\u305F", e3);
    }
  };
  const calendar = () => {
    if (!issue) return;
    const target = issue;
    void askDate(ctx, "Calendar (must be done on this day)", localToday()).then((d3) => {
      if (d3) void apply2(calendarPatch(target, d3), `Calendar: ${formatShortDate(d3)}`);
    });
  };
  const tickler = () => {
    if (!issue) return;
    const target = issue;
    void askDate(ctx, "Tickler (back to Inbox on this date)", addDays(localToday(), 1)).then((d3) => {
      if (d3) void apply2(ticklerPatch(target, d3), `Tickler: ${formatShortDate(d3)}`);
    });
  };
  const someday = () => {
    if (!issue) return;
    if (issue.status === "someday") return void apply2(keepSomedayPatch(), "To Someday");
    void confirmSomeday(ctx, [issue]).then((ok) => {
      if (ok) void apply2(somedayPatch(), "To Someday");
    });
  };
  const next = () => void apply2(issue ? nextPatch(issue) : {}, "Next");
  const cancel = () => void apply2(cancelPatch(), "Cancel");
  const close = () => void apply2(closePatch(), "Closed");
  h2(() => {
    const onKey = (e3) => {
      if (!issue || !root.current || root.current.offsetParent === null) return;
      if (e3.target?.closest("input, textarea, select, [contenteditable='true'], .modal")) return;
      if (document.querySelector(".modal-container")) return;
      const map = { ArrowRight: next, ArrowLeft: someday, ArrowUp: tickler, ArrowDown: cancel };
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
    if (dir === "right") next();
    else if (dir === "left") someday();
    else if (dir === "up") tickler();
    else if (dir === "down") cancel();
  };
  const priorityMenu2 = (e3) => {
    if (!issue) return;
    const m3 = new import_obsidian30.Menu();
    for (const p3 of PRIORITIES) m3.addItem((mi) => mi.setTitle(p3).setChecked(issue.priority === p3).onClick(() => void ctx.writer.update(issue.path, { priority: p3 })));
    m3.addItem((mi) => mi.setTitle("None").onClick(() => void ctx.writer.update(issue.path, { priority: null })));
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
        queue.length,
        " left"
      ] }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("div", { class: "vt-chunk", title: `A break every ${CHUNK}`, children: Array.from({ length: CHUNK }, (_2, i3) => /* @__PURE__ */ u3("span", { class: `vt-chunk-dot${i3 < inChunk || count > 0 && inChunk === 0 ? " is-on" : ""}` })) })
    ] }),
    count > 0 && inChunk === 0 && issue && /* @__PURE__ */ u3("div", { class: "vt-banner", children: [
      "Organized ",
      count,
      ". Good place for a break. To keep going, move on to the next card."
    ] }),
    issue ? /* @__PURE__ */ u3("div", { class: "vt-swipe-area", children: [
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-left${hint === "left" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "cloud" }),
        " Someday"
      ] }),
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-right${hint === "right" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "list-todo" }),
        " Next"
      ] }),
      /* @__PURE__ */ u3("div", { class: `vt-swipe-hint is-up${hint === "up" ? " is-active" : ""}`, children: [
        /* @__PURE__ */ u3(Icon, { name: "alarm-clock" }),
        " Tickler"
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
              /* @__PURE__ */ u3("span", { class: "vt-chip-mini", children: issue.status === "someday" ? "Someday" : "Inbox" }),
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
        "Nothing to organize",
        count > 0 ? ` (organized ${count})` : ""
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-organize-actions", children: [
      /* @__PURE__ */ u3("button", { class: "vt-round is-someday", disabled: !issue, onClick: someday, title: "To Someday (\u2190)", children: [
        /* @__PURE__ */ u3(Icon, { name: "cloud" }),
        /* @__PURE__ */ u3("span", { children: "Someday" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round is-cancel", disabled: !issue, onClick: cancel, title: "Cancel\uFF08\u2193\uFF09", children: [
        /* @__PURE__ */ u3(Icon, { name: "x" }),
        /* @__PURE__ */ u3("span", { children: "Cancel" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round", disabled: !issue, onClick: close, title: "Already done", children: [
        /* @__PURE__ */ u3(Icon, { name: "check" }),
        /* @__PURE__ */ u3("span", { children: "Closed" })
      ] }),
      /* @__PURE__ */ u3("button", { class: "vt-round", disabled: !issue, onClick: tickler, title: "Tickler: decide later, back to Inbox on a date (\u2191)", children: [
        /* @__PURE__ */ u3(Icon, { name: "alarm-clock" }),
        /* @__PURE__ */ u3("span", { children: "Tickler" })
      ] }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "vt-round",
          disabled: !issue || hasSubs,
          onClick: calendar,
          title: hasSubs ? "Calendar: not for an issue with sub-issues. Plan the sub-issues' periods instead" : "Calendar: must be done on a specific day",
          children: [
            /* @__PURE__ */ u3(Icon, { name: "calendar-plus" }),
            /* @__PURE__ */ u3("span", { children: "Calendar" })
          ]
        }
      ),
      /* @__PURE__ */ u3("button", { class: "vt-round is-schedule", disabled: !issue, onClick: next, title: "Next action, no date (\u2192)", children: [
        /* @__PURE__ */ u3(Icon, { name: "list-todo" }),
        /* @__PURE__ */ u3("span", { children: "Next" })
      ] })
    ] }),
    /* @__PURE__ */ u3("div", { class: "vt-organize-foot", children: [
      undo ? /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void undoLast(), children: [
        /* @__PURE__ */ u3(Icon, { name: "undo-2" }),
        " Undo (",
        undo.id,
        ": ",
        undo.label,
        ")"
      ] }) : /* @__PURE__ */ u3("span", { class: "vt-muted", children: "\u2190 Someday / \u2192 Next / \u2191 Tickler / \u2193 Cancel (swipe or arrow keys)" }),
      issue && /* @__PURE__ */ u3("button", { class: "vt-button is-text", onClick: () => void ctx.openPath(issue.path, true), children: [
        /* @__PURE__ */ u3(Icon, { name: "external-link" }),
        " Open"
      ] })
    ] })
  ] });
}

// src/views/RoutineListView.tsx
var import_obsidian31 = require("obsidian");
function RoutineForm(props) {
  const [summary, setSummary] = d2("");
  const [draft, setDraft] = d2(defaultRepeatDraft());
  const [estimated, setEstimated] = d2("");
  const read = readRepeatDraft(draft);
  const minutes = estimated.trim() ? parseDurationInput(estimated) : null;
  const error = !summary.trim() ? "summary \u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044" : minutes === null && estimated.trim() ? `estimated \u3092\u6642\u9593\u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093: ${estimated.trim()}` : read.error;
  return /* @__PURE__ */ u3(
    "form",
    {
      class: "vt-worklog-form",
      onSubmit: (e3) => {
        e3.preventDefault();
        if (error === null) props.onSubmit(summary.trim(), read.repeat, { estimated: minutes });
      },
      children: [
        /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "summary" }),
          /* @__PURE__ */ u3("input", { type: "text", value: summary, placeholder: "e.g. Weekly review", onInput: (e3) => setSummary(e3.currentTarget.value) })
        ] }),
        /* @__PURE__ */ u3(RepeatFields, { draft, onChange: setDraft }),
        /* @__PURE__ */ u3("div", { class: "vt-chip-row", children: /* @__PURE__ */ u3("label", { class: "vt-text-field", children: [
          /* @__PURE__ */ u3("span", { children: "estimated (optional)" }),
          /* @__PURE__ */ u3("input", { class: "vt-small-input", type: "text", value: estimated, placeholder: "30m / 2h / 1d", onInput: (e3) => setEstimated(e3.currentTarget.value) })
        ] }) }),
        error !== null && summary && /* @__PURE__ */ u3("div", { class: "vt-error", children: error }),
        /* @__PURE__ */ u3("div", { class: "vt-form", children: /* @__PURE__ */ u3("button", { type: "submit", class: "mod-cta", disabled: error !== null, children: "Create" }) })
      ]
    }
  );
}
var DRAG_TYPE3 = "text/plain";
var readDrag3 = (e3) => e3.dataTransfer?.getData(DRAG_TYPE3) || null;
var GROUP_HINT = {
  [DEFAULT_CATEGORY_NAME]: "On the task board",
  closing: "On the Closing screen"
};
function RoutineItem(props) {
  const { ctx, routine: r3 } = props;
  const [dropBefore, setDropBefore] = d2(false);
  const toggle2 = () => void ctx.writer.update(r3.path, { active: !r3.active }).catch((e3) => ctx.report("\u5207\u308A\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  return /* @__PURE__ */ u3(
    "div",
    {
      class: `vt-routine-item${r3.active ? "" : " is-paused"}${dropBefore ? " is-drop-before" : ""}`,
      "data-key": r3.id,
      draggable: true,
      onDragStart: (e3) => e3.dataTransfer?.setData(DRAG_TYPE3, r3.id),
      onDragOver: (e3) => {
        e3.preventDefault();
        e3.stopPropagation();
        setDropBefore(true);
      },
      onDragLeave: () => setDropBefore(false),
      onDrop: (e3) => {
        e3.preventDefault();
        e3.stopPropagation();
        setDropBefore(false);
        const dragged = readDrag3(e3);
        if (dragged && dragged !== r3.id) props.move(dragged, r3.category, r3.id);
      },
      children: [
        /* @__PURE__ */ u3("span", { class: "vt-drag-handle", "aria-hidden": "true", children: /* @__PURE__ */ u3(Icon, { name: "grip-vertical" }) }),
        /* @__PURE__ */ u3("span", { class: "vt-badge vt-id vt-routine-id", children: r3.id }),
        /* @__PURE__ */ u3("div", { class: "vt-routine-main", ...linkProps((e3) => void ctx.openPath(r3.path, import_obsidian31.Keymap.isModEvent(e3) !== false)), children: [
          /* @__PURE__ */ u3("span", { class: "vt-routine-summary", children: r3.summary || "(no summary)" }),
          /* @__PURE__ */ u3("span", { class: "vt-muted", children: [
            r3.repeat ? describeRepeat(r3.repeat) : "Invalid repeat",
            r3.estimated ? ` \xB7 ${formatMinutes(r3.estimated)}` : ""
          ] })
        ] }),
        routineOccursOn(r3, props.today) && /* @__PURE__ */ u3("span", { class: "vt-chip-mini is-today", children: "Today" }),
        /* @__PURE__ */ u3("button", { class: `vt-switch${r3.active ? " is-on" : ""}`, role: "switch", "aria-checked": r3.active, title: r3.active ? "Pause" : "Resume", onClick: toggle2, children: /* @__PURE__ */ u3("span", { class: "vt-switch-thumb" }) }),
        /* @__PURE__ */ u3("button", { class: "vt-icon-button", "aria-label": "Routine menu", title: "Move and more", onClick: (e3) => props.menu(e3, r3), children: /* @__PURE__ */ u3(Icon, { name: "more-horizontal" }) })
      ]
    }
  );
}
function RoutineListView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const index = ctx.store.index;
  const today = localToday();
  const all = [...index.routines.values()];
  const groups = routineGroups(all);
  const [over2, setOver] = d2(null);
  const create = () => new PreactModal(ctx.app, "Create routine", (close) => /* @__PURE__ */ u3(
    RoutineForm,
    {
      onSubmit: (summary, repeat, extra) => {
        close();
        void ctx.writer.createRoutine(summary, repeat, { ...extra, start: today }).catch((e3) => ctx.report("routine \u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      }
    }
  )).open();
  const move2 = (id, category, before) => {
    const patches = moveRoutine(all, id, category, before);
    if (patches.length > 0) void ctx.writer.updateRoutines(patches).catch((e3) => ctx.report("\u4E26\u3079\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  };
  const menu = (e3, r3) => {
    const group = groups.find((g2) => g2.category === r3.category)?.routines ?? [];
    const at = group.findIndex((x2) => x2.id === r3.id);
    const m3 = new import_obsidian31.Menu();
    if (at > 0) m3.addItem((mi) => mi.setTitle("Move up").setIcon("arrow-up").onClick(() => move2(r3.id, r3.category, group[at - 1].id)));
    if (at >= 0 && at < group.length - 1) m3.addItem((mi) => mi.setTitle("Move down").setIcon("arrow-down").onClick(() => move2(r3.id, r3.category, group[at + 2]?.id ?? null)));
    for (const g2 of groups) {
      if (g2.category === r3.category) continue;
      m3.addItem(
        (mi) => mi.setTitle(`Move to ${g2.category ?? DEFAULT_CATEGORY_NAME}`).setIcon("folder-input").onClick(() => move2(r3.id, g2.category, null))
      );
    }
    m3.addSeparator();
    m3.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(r3.path)));
    m3.showAtMouseEvent(e3);
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Routines" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: all.length }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      /* @__PURE__ */ u3("button", { class: "vt-button is-primary", onClick: create, children: [
        /* @__PURE__ */ u3(Icon, { name: "plus" }),
        " Create routine"
      ] })
    ] }),
    all.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No routines yet. Add tasks that repeat daily or weekly (they appear only on the task board)." }),
    all.length > 0 && groups.map((g2) => {
      const name = g2.category ?? DEFAULT_CATEGORY_NAME;
      return /* @__PURE__ */ u3(
        "section",
        {
          class: `vt-routine-group${over2 === name ? " is-over" : ""}`,
          "aria-label": name,
          onDragOver: (e3) => {
            e3.preventDefault();
            setOver(name);
          },
          onDragLeave: () => setOver(null),
          onDrop: (e3) => {
            e3.preventDefault();
            setOver(null);
            const dragged = readDrag3(e3);
            if (dragged) move2(dragged, g2.category, null);
          },
          children: [
            /* @__PURE__ */ u3("div", { class: "vt-section-head", children: [
              /* @__PURE__ */ u3("span", { class: "vt-field-label", children: name }),
              /* @__PURE__ */ u3("span", { class: "vt-count", children: g2.routines.length }),
              /* @__PURE__ */ u3("span", { class: "vt-muted", children: GROUP_HINT[name] })
            ] }),
            /* @__PURE__ */ u3("div", { class: "vt-routine-list", children: [
              g2.routines.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-empty", children: "Drag a routine here" }),
              g2.routines.map((r3) => /* @__PURE__ */ u3(RoutineItem, { ctx, routine: r3, today, move: move2, menu }, r3.id))
            ] })
          ]
        },
        name
      );
    })
  ] });
}

// src/views/ScheduledView.tsx
var import_obsidian32 = require("obsidian");
var DAYS = 14;
function ScheduledView(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const today = localToday(new Date(useNow(6e4)));
  const days = Array.from({ length: DAYS }, (_2, i3) => addDays(today, i3));
  const issues = [...ctx.store.index.issues.values()].filter((i3) => isScheduledAhead(i3, today)).sort((a3, b2) => a3.scheduled.localeCompare(b2.scheduled) || a3.id.localeCompare(b2.id, "en", { numeric: true }));
  const toggle2 = (path, scheduled, d3) => {
    void ctx.writer.update(path, { scheduled: scheduled === d3 ? null : d3 }).catch((e3) => ctx.report("Calendar \u306E\u65E5\u3092\u5909\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  };
  return /* @__PURE__ */ u3("div", { class: "vt-page", children: [
    /* @__PURE__ */ u3("header", { class: "vt-page-head", children: [
      /* @__PURE__ */ u3("h2", { class: "vt-page-title", children: "Scheduled" }),
      /* @__PURE__ */ u3("span", { class: "vt-count", children: issues.length })
    ] }),
    issues.length === 0 ? /* @__PURE__ */ u3("div", { class: "vt-empty", children: "No issues on the Calendar from today on" }) : /* @__PURE__ */ u3("div", { class: "vt-sched-scroll", children: /* @__PURE__ */ u3("table", { class: "vt-sched", children: [
      /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("th", { class: "vt-sched-sticky" }),
        days.map((d3) => /* @__PURE__ */ u3("th", { class: weekdayOf(d3) % 6 === 0 ? "is-weekend" : "", children: [
          /* @__PURE__ */ u3("span", { class: "vt-weekday", children: WEEKDAY_NAMES[weekdayOf(d3)] }),
          /* @__PURE__ */ u3("span", { class: "vt-sched-date", children: d3 === today ? "Today" : `${Number(d3.slice(5, 7))}/${Number(d3.slice(8))}` })
        ] }))
      ] }) }),
      /* @__PURE__ */ u3("tbody", { children: issues.map((i3) => /* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("th", { class: "vt-sched-sticky", children: /* @__PURE__ */ u3("span", { class: "vt-sched-issue", ...linkProps((e3) => void ctx.openPath(i3.path, import_obsidian32.Keymap.isModEvent(e3) !== false)), children: [
          /* @__PURE__ */ u3(IdBadge, { issue: i3 }),
          /* @__PURE__ */ u3("span", { class: "vt-cell-summary", title: i3.summary, children: i3.summary })
        ] }) }),
        days.map((d3) => /* @__PURE__ */ u3("td", { children: /* @__PURE__ */ u3(DayCell, { date: d3, scheduled: i3.scheduled === d3, softDeadline: i3.softDeadline, deadline: i3.deadline, today, onClick: () => toggle2(i3.path, i3.scheduled, d3) }) }))
      ] }, i3.id)) })
    ] }) })
  ] });
}

// src/views/SidebarView.tsx
var import_obsidian33 = require("obsidian");
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
    const key = workKey(l3);
    runningByTask.set(key, Math.max(runningByTask.get(key) ?? 0, elapsed));
  }
  const items = [
    { type: "pkm-task-daily", title: "Today", icon: "sun", count: counts.daily },
    { type: "pkm-task-inbox", title: "Inbox", icon: "inbox", count: counts.inbox },
    { type: "pkm-task-organize", title: "Organize", icon: "layers", count: counts.organize },
    { type: "pkm-task-scheduled", title: "Scheduled", icon: "calendar-range", count: counts.scheduled },
    { type: "pkm-task-projects", title: "Projects", icon: "chart-gantt" },
    { type: "pkm-task-issues", title: "Issues", icon: "list-todo", count: counts.issues },
    { type: "pkm-task-someday", title: "Someday", icon: "cloud", count: counts.someday },
    { type: "pkm-task-routines", title: "Routines", icon: "repeat", count: counts.routines },
    { type: "pkm-task-members", title: "Members", icon: "users" },
    { type: "pkm-task-labels", title: "Labels", icon: "tag" },
    { type: "pkm-task-presets", title: "Presets", icon: "copy-plus" }
  ];
  return /* @__PURE__ */ u3("div", { class: "vt-sidebar", children: [
    /* @__PURE__ */ u3("button", { class: "vt-button is-primary vt-sidebar-capture", onClick: () => openCaptureModal(ctx), children: [
      /* @__PURE__ */ u3(Icon, { name: "plus" }),
      " Capture issues"
    ] }),
    runningByTask.size > 0 && /* @__PURE__ */ u3("section", { class: "vt-sidebar-section", children: [
      /* @__PURE__ */ u3("div", { class: "vt-field-label", children: "Running" }),
      /* @__PURE__ */ u3("div", { class: "vt-sidebar-running", children: [...runningByTask.entries()].map(([taskId, elapsed]) => {
        const task = index.sub(taskId) ?? index.issues.get(taskId) ?? index.routines.get(taskId);
        const summary = task?.summary || taskId;
        const path = task?.path ?? null;
        return /* @__PURE__ */ u3("div", { class: "vt-task is-running", children: /* @__PURE__ */ u3("div", { class: "vt-task-top", children: [
          path ? /* @__PURE__ */ u3("span", { class: "vt-task-summary", title: `${taskId} ${summary}`, ...linkProps((e3) => void ctx.openPath(path, import_obsidian33.Keymap.isModEvent(e3) !== false)), children: summary }) : /* @__PURE__ */ u3("span", { class: "vt-task-summary", children: summary }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "vt-play is-running",
              "aria-label": "Stop timer",
              title: "Stop timer",
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
    /* @__PURE__ */ u3("nav", { class: "vt-sidebar-nav", "aria-label": "PKM Task Views", children: items.map((item) => /* @__PURE__ */ u3("button", { class: "vt-nav-item", onClick: () => void ctx.openView(item.type), children: [
      /* @__PURE__ */ u3(Icon, { name: item.icon }),
      /* @__PURE__ */ u3("span", { class: "vt-nav-label", children: item.title }),
      /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
      item.count !== void 0 && item.count > 0 && /* @__PURE__ */ u3("span", { class: "vt-count", children: item.count })
    ] }, item.type)) })
  ] });
}

// src/views/SomedayView.tsx
var ORDERS = [
  { key: "reviewed", label: "Oldest review first" },
  { key: "revisit", label: "Nearest revisit first" },
  { key: "created", label: "Newest first" }
];
function sortSomeday(issues, order) {
  const nullsFirst = (a3, b2) => a3 === b2 ? 0 : a3 === null ? -1 : b2 === null ? 1 : a3.localeCompare(b2);
  const nullsLast2 = (a3, b2) => a3 === b2 ? 0 : a3 === null ? 1 : b2 === null ? -1 : a3.localeCompare(b2);
  return [...issues].sort(
    (a3, b2) => order === "reviewed" ? nullsFirst(a3.reviewed, b2.reviewed) : order === "revisit" ? nullsLast2(a3.revisit, b2.revisit) : (b2.created ?? "").localeCompare(a3.created ?? "")
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
  const markReviewed = () => void ctx.writer.updateMany(
    sel.map((i3) => i3.path),
    reviewedPatch(localToday())
  ).then(done, (e3) => ctx.report("\u898B\u76F4\u3057\u305F\u65E5\u3092\u8A18\u9332\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3));
  const setRevisit = async () => {
    const date = await askDate(ctx, "revisit (shows up in Organize from this date)");
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
      /* @__PURE__ */ u3("select", { class: "dropdown", value: order, onChange: (e3) => setOrder(e3.currentTarget.value), children: ORDERS.map((o3) => /* @__PURE__ */ u3("option", { value: o3.key, children: o3.label })) })
    ] }),
    /* @__PURE__ */ u3(IssueTable, { ctx, issues, selected, onSelect: setSelected, columns: ["labels", "revisit", "reviewed"], empty: "Someday is empty" }),
    /* @__PURE__ */ u3(
      ActionBar,
      {
        count: sel.length,
        actions: [
          { label: "Reviewed", icon: "check", tone: "primary", run: markReviewed },
          { label: "Back to Inbox", icon: "inbox", run: reopen },
          { label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i3) => i3.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
          { label: "revisit", icon: "calendar-clock", run: () => void setRevisit().catch((e3) => ctx.report("revisit \u3092\u8A2D\u5B9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", e3)) },
          { label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i3) => i3.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) }
        ]
      }
    )
  ] });
}

// src/core/tasks-now.ts
var HOUR = 36e5;
var DAY = 24 * HOUR;
var ORGANIZED_ALERT_MS = DAY;
var PAUSED_ALERT_MS = 12 * HOUR;
var FOCUS_OK_MS = HOUR;
var FOCUS_CAUTION_MS = 2 * HOUR;
function localMidnightMs(date) {
  const [y3, m3, d3] = date.split("-").map(Number);
  return new Date(y3, m3 - 1, d3).getTime();
}
function lastOrganizedMs(index, lastOrganizedAt) {
  let latest = null;
  for (const issue of index.issues.values()) {
    if (issue.reviewed === null) continue;
    const ms = localMidnightMs(issue.reviewed);
    if (!Number.isNaN(ms) && (latest === null || ms > latest)) latest = ms;
  }
  const own = lastOrganizedAt ? Date.parse(lastOrganizedAt) : Number.NaN;
  if (!Number.isNaN(own) && (latest === null || own > latest)) latest = own;
  return latest;
}
function organizedCard(lastMs, now) {
  if (lastMs === null) return { elapsedMs: null, level: "alert", label: "Never" };
  const elapsedMs = Math.max(0, now - lastMs);
  return { elapsedMs, level: elapsedMs >= ORGANIZED_ALERT_MS ? "alert" : "ok", label: null };
}
function lastWorklogStopMs(worklogs) {
  let latest = null;
  for (const l3 of worklogs) if (l3.toMs !== null && (latest === null || l3.toMs > latest)) latest = l3.toMs;
  return latest;
}
function pausedCard(worklogs, now) {
  if (worklogs.some((l3) => l3.toMs === null)) return { elapsedMs: null, level: "ok", label: "Running" };
  const last = lastWorklogStopMs(worklogs);
  if (last === null) return { elapsedMs: null, level: "alert", label: "No worklog" };
  const elapsedMs = Math.max(0, now - last);
  return { elapsedMs, level: elapsedMs >= PAUSED_ALERT_MS ? "alert" : "ok", label: null };
}
function focusElapsedMs(worklogs, now) {
  let first = null;
  for (const l3 of worklogs) if (l3.toMs === null && (first === null || l3.fromMs < first)) first = l3.fromMs;
  return first === null ? null : Math.max(0, now - first);
}
function restCard(worklogs, now) {
  const elapsedMs = focusElapsedMs(worklogs, now);
  if (elapsedMs === null) return { elapsedMs: null, level: "idle", label: "Resting" };
  if (elapsedMs < FOCUS_OK_MS) return { elapsedMs, level: "ok", label: "Healthy" };
  if (elapsedMs < FOCUS_CAUTION_MS) return { elapsedMs, level: "caution", label: "Caution" };
  return { elapsedMs, level: "alert", label: "Over-focused" };
}
function describe(index, key) {
  const task = index.sub(key) ?? index.issues.get(key) ?? index.routines.get(key);
  return { id: key.includes("#") ? key.split("#")[0] : key, summary: task?.summary ?? "", path: task?.path ?? null };
}
function runningTasks(index, now) {
  const elapsed = /* @__PURE__ */ new Map();
  for (const l3 of index.running()) {
    const key = workKey(l3);
    elapsed.set(key, Math.max(elapsed.get(key) ?? 0, Math.max(0, now - l3.fromMs)));
  }
  return [...elapsed.entries()].sort((a3, b2) => b2[1] - a3[1]).map(([key, ms]) => ({ key, ...describe(index, key), elapsedMs: ms }));
}
function pausedTasks(index, keys) {
  const running = new Set(index.running().map(workKey));
  return keys.filter((key) => !running.has(key)).filter((key) => {
    const task = index.sub(key) ?? index.issues.get(key) ?? index.routines.get(key);
    if (!task) return false;
    return !("status" in task) || task.status !== "closed" && task.status !== "canceled";
  }).map((key) => ({ key, ...describe(index, key), elapsedMs: null }));
}
function todoTasks(index, today, excluded) {
  const stored = index.board(today)?.board ?? emptyBoard();
  const board = { ...stored, issues: [...stored.issues, ...index.toAutoAdd(today)] };
  const lanes = boardLanes(index, today, board);
  return [...lanes.top, ...lanes.next].filter((c3) => !excluded.has(c3.key)).map((c3) => ({ key: c3.key, ...describe(index, c3.key), summary: cardSummary(c3), path: cardPath(c3), elapsedMs: null }));
}
var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function formatNow(ms) {
  const d3 = new Date(ms);
  const p3 = (n2) => String(n2).padStart(2, "0");
  return `${d3.getFullYear()}-${p3(d3.getMonth() + 1)}-${p3(d3.getDate())} ${WEEKDAYS[d3.getDay()].toUpperCase()} ${p3(d3.getHours())}:${p3(d3.getMinutes())}:${p3(d3.getSeconds())}`;
}
function formatElapsed(ms) {
  const minutes = Math.floor(ms / 6e4);
  if (minutes >= 24 * 60) return `${Math.floor(minutes / (24 * 60))}d ${Math.floor(minutes % (24 * 60) / 60)}h`;
  return formatMinutes(minutes);
}

// src/views/TasksNowDialog.tsx
function StateCardView(props) {
  const { card } = props;
  const value = card.elapsedMs === null ? "\u2013" : formatElapsed(card.elapsedMs);
  return /* @__PURE__ */ u3("div", { class: `vt-now-state is-${card.level}`, role: "group", "aria-label": props.title, children: [
    /* @__PURE__ */ u3("div", { class: "vt-now-state-title", children: props.title }),
    /* @__PURE__ */ u3("div", { class: "vt-now-state-value vt-num", children: value }),
    /* @__PURE__ */ u3("div", { class: "vt-now-state-label", children: card.label ?? props.hint })
  ] });
}
function TaskRow2(props) {
  const { ctx, task, action } = props;
  const open = task.path ? () => void ctx.openPath(task.path) : null;
  return /* @__PURE__ */ u3("div", { class: `vt-task${task.elapsedMs !== null ? " is-running" : ""}${props.paused ? " is-paused" : ""}`, children: [
    /* @__PURE__ */ u3("span", { class: "vt-badge vt-id vt-routine-id", children: task.id }),
    open ? /* @__PURE__ */ u3("span", { class: "vt-task-summary", title: `${task.id} ${task.summary}`, ...linkProps(open), children: task.summary || task.key }) : /* @__PURE__ */ u3("span", { class: "vt-task-summary", children: task.summary || task.key }),
    props.editTimes && /* @__PURE__ */ u3("button", { class: "vt-icon-button vt-time-edit", "aria-label": "Edit times", title: "Edit start / end times (forgot to press play?)", onClick: () => openWorklogTimes(ctx, task.key, task.summary || task.key), children: /* @__PURE__ */ u3(Icon, { name: "history" }) }),
    /* @__PURE__ */ u3("button", { class: `vt-play${action.running ? " is-running" : ""}`, "aria-label": action.label, title: action.label, onClick: action.onClick, children: [
      /* @__PURE__ */ u3(Icon, { name: action.icon }),
      task.elapsedMs !== null && /* @__PURE__ */ u3("span", { class: "vt-num", children: formatMinutes(task.elapsedMs / 6e4) })
    ] })
  ] });
}
function TasksNowDialog(props) {
  const { ctx } = props;
  useStoreVersion(ctx.store);
  const now = useNow(1e3);
  const index = ctx.store.index;
  const [pausedKeys, setPausedKeys] = d2(ctx.settings.pausedTasks);
  const [busy, setBusy] = d2(false);
  const running = runningTasks(index, now);
  const paused = running.length === 0 ? pausedTasks(index, pausedKeys) : [];
  const worklogs = index.data.worklogs;
  const todo = todoTasks(index, localToday(new Date(now)), /* @__PURE__ */ new Set([...running.map((t3) => t3.key), ...paused.map((t3) => t3.key)]));
  const remember = async (keys) => {
    ctx.settings.pausedTasks = keys;
    setPausedKeys(keys);
    await ctx.saveSettings();
  };
  const guarded = async (label, run) => {
    if (busy) return;
    setBusy(true);
    try {
      await run();
    } catch (e3) {
      ctx.report(label, e3);
    } finally {
      setBusy(false);
    }
  };
  const stopGroup = (keepGroup) => guarded(keepGroup ? "\u4E00\u6642\u505C\u6B62\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F" : "\u505C\u6B62\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", async () => {
    const keys = running.map((t3) => t3.key);
    const entries = index.running();
    if (entries.length === 0) return;
    await ctx.writer.stopTimer(entries);
    await remember(keepGroup ? keys : []);
  });
  const resume = () => guarded("\u518D\u958B\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", async () => {
    await ctx.writer.startTimer(paused.map((t3) => t3.key), ctx.settings.deviceName);
    await remember([]);
  });
  const discardPaused = () => guarded("\u7834\u68C4\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", () => remember([]));
  const keyActions = A2({ toggle: () => {
  }, end: () => {
  } });
  keyActions.current = {
    toggle: () => void (running.length > 0 ? stopGroup(true) : paused.length > 0 ? resume() : void 0),
    end: () => void (running.length > 0 ? stopGroup(false) : paused.length > 0 ? discardPaused() : void 0)
  };
  h2(() => {
    const scope = props.scope;
    if (!scope) return;
    const handlers = [
      scope.register([], " ", () => (keyActions.current.toggle(), false)),
      scope.register(["Shift"], " ", () => (keyActions.current.end(), false))
    ];
    return () => handlers.forEach((handler) => scope.unregister(handler));
  }, [props.scope]);
  return /* @__PURE__ */ u3("div", { class: "vt-now", children: [
    /* @__PURE__ */ u3("section", { class: "vt-now-clock", "aria-live": "off", children: [
      /* @__PURE__ */ u3(Icon, { name: "clock" }),
      /* @__PURE__ */ u3("span", { class: "vt-now-clock-text vt-num", children: formatNow(now) })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-now-section", "aria-label": "PKM State", children: [
      /* @__PURE__ */ u3("h3", { class: "vt-now-heading", children: "PKM State" }),
      /* @__PURE__ */ u3("div", { class: "vt-now-states", children: [
        /* @__PURE__ */ u3(StateCardView, { title: "Organized", hint: "since last Organize", card: organizedCard(lastOrganizedMs(index, ctx.settings.lastOrganizedAt), now) }),
        /* @__PURE__ */ u3(StateCardView, { title: "Worklog Paused", hint: "since last worklog", card: pausedCard(worklogs, now) }),
        /* @__PURE__ */ u3(StateCardView, { title: "Focus Streak", hint: "timer running", card: restCard(worklogs, now) })
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-now-section", "aria-label": "Running tasks", children: [
      /* @__PURE__ */ u3("div", { class: "vt-now-heading-row", children: [
        /* @__PURE__ */ u3("h3", { class: "vt-now-heading", children: paused.length > 0 ? "Paused" : "Running" }),
        /* @__PURE__ */ u3("span", { class: "vt-spacer" }),
        running.length > 0 && /* @__PURE__ */ u3(S, { children: [
          /* @__PURE__ */ u3("button", { class: "vt-button", disabled: busy, onClick: () => void stopGroup(true), title: "Pause all: save the worklog and keep this group to resume later", children: [
            /* @__PURE__ */ u3(Icon, { name: "pause" }),
            " Pause"
          ] }),
          /* @__PURE__ */ u3("button", { class: "vt-button", disabled: busy, onClick: () => void stopGroup(false), title: "Stop all: save the worklog and drop this group", children: [
            /* @__PURE__ */ u3(Icon, { name: "square" }),
            " Stop"
          ] })
        ] }),
        paused.length > 0 && /* @__PURE__ */ u3(S, { children: [
          /* @__PURE__ */ u3("button", { class: "vt-button is-primary", disabled: busy, onClick: () => void resume(), title: "Start all paused tasks again", children: [
            /* @__PURE__ */ u3(Icon, { name: "play" }),
            " Resume"
          ] }),
          /* @__PURE__ */ u3("button", { class: "vt-button", disabled: busy, onClick: () => void discardPaused(), title: "Drop the paused group", children: [
            /* @__PURE__ */ u3(Icon, { name: "x" }),
            " Discard"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ u3("div", { class: "vt-now-list", children: [
        running.map((t3) => /* @__PURE__ */ u3(TaskRow2, { ctx, task: t3, editTimes: true, action: { icon: "square", label: "Stop timer", running: true, onClick: () => void stopTimer(ctx, [t3.key]) } })),
        paused.map((t3) => /* @__PURE__ */ u3(TaskRow2, { ctx, task: t3, paused: true, action: { icon: "play", label: "Start timer", onClick: () => void startTimer(ctx, [t3.key]) } })),
        running.length === 0 && paused.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-now-empty", children: "No running tasks" })
      ] })
    ] }),
    /* @__PURE__ */ u3("section", { class: "vt-now-section", "aria-label": "Task list", children: [
      /* @__PURE__ */ u3("h3", { class: "vt-now-heading", children: "Tasks" }),
      /* @__PURE__ */ u3("div", { class: "vt-now-list", children: [
        todo.map((t3) => /* @__PURE__ */ u3(TaskRow2, { ctx, task: t3, editTimes: true, action: { icon: "play", label: "Start timer", onClick: () => void startTimer(ctx, [t3.key]) } })),
        todo.length === 0 && /* @__PURE__ */ u3("div", { class: "vt-now-empty", children: "Nothing left on today's board" })
      ] })
    ] })
  ] });
}

// src/main.ts
var TASKS_NOW_COMMAND = "pkm-task:open-tasks-now";
var BADGE_CHANGED_EVENT = "pkm-ribbon:badge-changed";
var VIEWS = [
  { type: "pkm-task-daily", title: "Today", icon: "sun", component: DailyView },
  { type: "pkm-task-issues", title: "Issues", icon: "list-todo", component: IssueListView },
  { type: "pkm-task-inbox", title: "Inbox", icon: "inbox", component: InboxView },
  { type: "pkm-task-organize", title: "Organize", icon: "layers", component: OrganizeView },
  { type: "pkm-task-scheduled", title: "Scheduled", icon: "calendar-range", component: ScheduledView },
  { type: "pkm-task-projects", title: "Projects", icon: "chart-gantt", component: ProjectsView },
  { type: "pkm-task-someday", title: "Someday", icon: "cloud", component: SomedayView },
  { type: "pkm-task-routines", title: "Routines", icon: "repeat", component: RoutineListView },
  { type: "pkm-task-members", title: "Members", icon: "users", component: MemberListView },
  { type: "pkm-task-labels", title: "Labels", icon: "tag", component: LabelManagerView },
  { type: "pkm-task-presets", title: "Presets", icon: "copy-plus", component: PresetListView }
];
var SIDEBAR_VIEW = { type: "pkm-task-sidebar", title: "Tasks", icon: "check-square", component: SidebarView };
var PkmTaskPlugin = class extends import_obsidian34.Plugin {
  store = null;
  undo = null;
  taskSettings = { ...DEFAULT_SETTINGS };
  async onload() {
    await this.loadSettings();
    const store = new TaskStore(this.app);
    this.store = store;
    const report = (message, error) => {
      if (error !== void 0) console.error(`pkm-task: ${message}`, error);
      const detail = error instanceof Error ? `: ${error.message}` : "";
      new import_obsidian34.Notice(`${message}${detail}`);
    };
    const writer = new TaskWriter(this.app, store, () => this.taskSettings.deviceName);
    const undo = new StatusUndo(report);
    this.undo = undo;
    writer.onStatusChange = (c3) => {
      if (c3.via !== "undo") undo.push(c3.id, () => writer.update(c3.path, c3.before, "undo"));
    };
    const ctx = {
      app: this.app,
      store,
      writer,
      undo,
      settings: this.taskSettings,
      saveSettings: () => this.saveData(this.taskSettings),
      // 一覧の View は左の固定ペインに、そこから開くノートは右のノートペインに出す（ADR-0033）
      openPath: async (path, newTab = false) => {
        const file = this.app.vault.getFileByPath(path);
        if (file) await openInNotePane(this.app.workspace, file, { newTab, phone: import_obsidian34.Platform.isPhone });
      },
      openView: (type) => openListView(this.app.workspace, type, { phone: import_obsidian34.Platform.isPhone }),
      report
    };
    const openSidebar = async (reveal2 = true) => {
      const { workspace } = this.app;
      const existing = workspace.getLeavesOfType?.(SIDEBAR_VIEW.type)[0];
      const leaf = existing ?? workspace.getLeftLeaf?.(false);
      if (!leaf) return;
      if (!existing) await leaf.setViewState({ type: SIDEBAR_VIEW.type, active: reveal2 });
      if (reveal2) await workspace.revealLeaf(leaf);
    };
    for (const spec of VIEWS) {
      this.registerView(spec.type, preactViewCreator(spec, ctx));
      this.addCommand({ id: `open-${spec.type.replace("pkm-task-", "")}`, name: `Open ${spec.title}`, icon: spec.icon, callback: () => void ctx.openView(spec.type) });
    }
    this.registerView(SIDEBAR_VIEW.type, preactViewCreator(SIDEBAR_VIEW, ctx));
    this.addCommand({ id: "open-sidebar", name: "Open Tasks sidebar", icon: SIDEBAR_VIEW.icon, callback: () => void openSidebar(true) });
    installTaskHeaders(ctx, this);
    installSubCards(ctx, this);
    installLinkInsert(ctx, this);
    this.addCommand({ id: "capture-issues", name: "Capture issues", callback: () => openCaptureModal(ctx) });
    this.addCommand({
      id: "open-tasks-now",
      name: "Open Tasks Now",
      icon: "timer",
      callback: () => {
        const modal = new PreactModal(this.app, "Tasks Now", (_close, scope) => k(TasksNowDialog, { ctx, scope }));
        modal.modalEl.addClass("vt-now-modal");
        modal.open();
      }
    });
    let lastBadge = null;
    this.register(
      store.subscribe(() => {
        const count = this.getRibbonBadge(TASKS_NOW_COMMAND);
        if (count === lastBadge) return;
        lastBadge = count;
        this.app.workspace.trigger(BADGE_CHANGED_EVENT, TASKS_NOW_COMMAND);
      })
    );
    registerRunningStatusBar(this, store, { path: (path) => void ctx.openPath(path), sidebar: () => void openSidebar(true) });
    this.addSettingTab(new TaskSettingTab(this.app, this, this.taskSettings, () => this.saveData(this.taskSettings)));
    this.app.workspace.onLayoutReady(() => {
      void store.load((ref) => this.registerEvent(ref)).catch((e3) => ctx.report("\u30BF\u30B9\u30AF\u306E\u7D22\u5F15\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F", e3));
      void openSidebar(false).catch((e3) => ctx.report("\u30B5\u30A4\u30C9\u30D0\u30FC\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F", e3));
    });
  }
  /** pkm-ribbon が尋ねるバッジの数（ADR-0070 の 6）。Tasks Now は、記録中のタスクの数（なければ null） */
  getRibbonBadge(command) {
    if (command !== TASKS_NOW_COMMAND || !this.store) return null;
    const n2 = new Set(this.store.index.running().map(workKey)).size;
    return n2 > 0 ? n2 : null;
  }
  onunload() {
    this.store?.unload();
    this.undo?.dismiss();
  }
  async loadSettings() {
    const saved = await loadPluginDataOrLegacy(this, "vault-task") ?? {};
    Object.assign(this.taskSettings, DEFAULT_SETTINGS, saved);
    this.taskSettings.subOpen = sanitizeSubOpen(saved.subOpen);
    this.taskSettings.closingGraceHour = sanitizeGraceHour(saved.closingGraceHour);
    this.taskSettings.capacity = sanitizeCapacity(saved.capacity);
    if (!this.taskSettings.deviceName) {
      const git = this.app.plugins?.plugins?.["pkm-git"];
      const name = git?.data?.deviceName;
      if (typeof name === "string" && name) this.taskSettings.deviceName = sanitizeDeviceName(name);
    }
  }
};
