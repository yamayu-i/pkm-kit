import { createRequire as __kitCreateRequire } from "node:module";
const require = __kitCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
    function lineLengthOverLimit(str2, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str2.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str2[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str2 = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str2 += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str2 += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str2 += "\\0";
                    break;
                  case "0007":
                    str2 += "\\a";
                    break;
                  case "000b":
                    str2 += "\\v";
                    break;
                  case "001b":
                    str2 += "\\e";
                    break;
                  case "0085":
                    str2 += "\\N";
                    break;
                  case "00a0":
                    str2 += "\\_";
                    break;
                  case "2028":
                    str2 += "\\L";
                    break;
                  case "2029":
                    str2 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str2 += "\\x" + code.substr(2);
                    else
                      str2 += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str2 += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str2 += "\n";
                  i += 2;
                }
                str2 += indent;
                if (json[i + 2] === " ")
                  str2 += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str2 = start ? str2 + json.slice(start) : json;
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str2 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify2(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str2;
      return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify2;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str2 = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str2 = `? ${str2}`;
        if (keyComment && !keyCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        str2 = `? ${str2}
${indent}:`;
      } else {
        str2 = `${str2}:`;
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str2.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify2.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str2 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str2;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify2 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify2.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify3 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify3(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str3 = stringify2.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str3);
      }
      let str2;
      if (lines.length === 0) {
        str2 = flowChars.start + flowChars.end;
      } else {
        str2 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str2 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str2;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str2 = stringify2.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str2.includes("\n"));
        if (i < items.length - 1) {
          str2 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str2.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str2 += ",";
          }
        }
        if (comment)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment));
        lines.push(str2);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str2 = start;
          for (const line of lines)
            str2 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str2}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str2) => str2,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2));
        const dot = str2.indexOf(".");
        if (dot !== -1 && str2[str2.length - 1] === "0")
          node.minFractionDigits = str2.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str2, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str2) => str2 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str2) => parseFloat(str2),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str2, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
        return str2;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str2 = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str2.length);
          for (let i = 0; i < str2.length; ++i)
            buffer[i] = str2.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str2;
        if (typeof node_buffer.Buffer === "function") {
          str2 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str2 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str2.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str2.substr(o, lineWidth);
          }
          str2 = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str2 }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
        const dot = str2.indexOf(".");
        if (dot !== -1) {
          const f = str2.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str2, offset, radix, { intAsBigInt }) {
      const sign = str2[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str2 = str2.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str2 = `0b${str2}`;
            break;
          case 8:
            str2 = `0o${str2}`;
            break;
          case 16:
            str2 = `0x${str2}`;
            break;
        }
        const n2 = BigInt(str2);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str2, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str2 = value.toString(radix);
        return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str2, asBigInt) {
      const sign = str2[0];
      const parts = sign === "-" || sign === "+" ? str2.substring(1) : str2;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str2) => parseSexagesimal(str2, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str2) {
        const match = str2.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify2.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify2.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep4, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep4?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep4) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep4 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep4, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep4 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep4 + cb;
              sep4 = "";
              break;
            }
            case "newline":
              if (comment)
                sep4 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep4, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep4?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep4 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep4 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep4, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep4 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep4)
                for (const st of sep4) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep4, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep4 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep4 + indent.slice(trimIndent) + content;
          sep4 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep4 === " ")
            sep4 = "\n";
          else if (!prevMoreIndented && sep4 === "\n")
            sep4 = "\n\n";
          value += sep4 + indent.slice(trimIndent) + content;
          sep4 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep4 === "\n")
            value += "\n";
          else
            sep4 = "\n";
        } else {
          value += sep4 + content;
          sep4 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep4 = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep4 === "\n")
            res += sep4;
          else
            sep4 = "\n";
        } else {
          res += sep4 + lm;
          sep4 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep4 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep4, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep4)
        for (const st of sep4)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify2;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports.visit = visit;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep4;
          if (scalar.end) {
            sep4 = scalar.end;
            sep4.push(this.sourceToken);
            delete scalar.end;
          } else
            sep4 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep4 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep4 = it.sep;
                  sep4.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep4 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep4 = fc.end.splice(1, fc.end.length);
            sep4.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep4 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse4(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify2(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse4;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify2;
  }
});

// ../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// cli/mcp.ts
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

// ../shared/src/dates.ts
var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
var DAY_MS = 864e5;
var WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function toEpochDay(date) {
  const m = DATE_RE.exec(date);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / DAY_MS;
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
function diffDays(a, b) {
  return requireDay(a) - requireDay(b);
}
function weekdayOf(date) {
  return new Date(requireDay(date) * DAY_MS).getUTCDay();
}
function localToday(now = /* @__PURE__ */ new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// src/core/dates.ts
function normalizeDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const s = value.trim();
    return isLocalDate(s) ? s : null;
  }
  return null;
}
function localDateTime(now = /* @__PURE__ */ new Date()) {
  const pad2 = (n) => String(Math.trunc(Math.abs(n))).padStart(2, "0");
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return `${localToday(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}${sign}${pad2(offset / 60)}:${pad2(offset % 60)}`;
}

// src/core/ids.ts
function idNumber(id, prefix) {
  const m = new RegExp(`^${prefix}-([1-9]\\d*)$`).exec(id);
  return m ? Number(m[1]) : null;
}
function isId(value, prefix) {
  return typeof value === "string" && idNumber(value, prefix) !== null;
}
function nextIds(prefix, existing, count = 1) {
  let max = 0;
  for (const id of existing) {
    const n = idNumber(id, prefix);
    if (n !== null && n > max) max = n;
  }
  return Array.from({ length: count }, (_, i) => `${prefix}-${max + 1 + i}`);
}
function pathForId(id) {
  const folder = id.startsWith("i-") ? "issue" : id.startsWith("r-") ? "routine" : "member";
  return `${folder}/${id}.md`;
}

// src/core/repeat.ts
function parseWeekday(s) {
  const i = WEEKDAY_NAMES.indexOf(s.toLowerCase());
  return i < 0 ? null : i;
}
function parseMonthSpec(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 && value <= 31 ? { kind: "day", day: value } : null;
  }
  if (typeof value !== "string") return null;
  const s = value.trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseMonthSpec(Number(s));
  if (s === "last") return { kind: "last" };
  const nth = /^([1-5])(?:th|st|nd|rd)-([a-z]{3})$/.exec(s);
  if (nth) {
    const weekday = parseWeekday(nth[2]);
    return weekday === null ? null : { kind: "nth", n: Number(nth[1]), weekday };
  }
  const last = /^last-([a-z]{3})$/.exec(s);
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
      for (const v of on) {
        const w = typeof v === "string" ? parseWeekday(v.trim()) : null;
        if (w === null) return { ok: false, error: `repeat.on \u306E\u66DC\u65E5\u304C\u8AAD\u3081\u307E\u305B\u3093: ${String(v)}` };
        if (!weekdays.includes(w)) weekdays.push(w);
      }
      if (weekdays.length === 0) return { ok: false, error: "every: week \u306B\u306F repeat.on \u3067\u66DC\u65E5\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" };
      return { ok: true, value: { every: "week", interval, weekdays } };
    }
    case "month": {
      const days = [];
      for (const v of on) {
        const spec = parseMonthSpec(v);
        if (spec === null) return { ok: false, error: `repeat.on \u306E\u65E5\u4ED8\u304C\u8AAD\u3081\u307E\u305B\u3093: ${String(v)}` };
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
      const [y, m, d] = date.split("-").map(Number);
      const [ay, am] = anchor.split("-").map(Number);
      const months = (y - ay) * 12 + (m - am);
      if (months % rule.interval !== 0) return false;
      const weekday = weekdayOf(date);
      return rule.days.some((spec) => matchesMonthSpec(spec, y, m, d, weekday));
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
    const v = this.fm[key];
    return v !== void 0 && v !== null && v !== "";
  }
  string(key) {
    if (!this.has(key)) return null;
    const v = this.fm[key];
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") return String(v);
    this.problem("invalid-field", `${key} \u304C\u6587\u5B57\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093`);
    return null;
  }
  oneOf(key, values) {
    const v = this.string(key);
    if (v === null) return null;
    if (values.includes(v)) return v;
    this.problem("invalid-field", `${key} \u306F ${values.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${v}`);
    return null;
  }
  date(key) {
    if (!this.has(key)) return null;
    const d = normalizeDate(this.fm[key]);
    if (d === null) this.problem("invalid-date", `${key} \u304C YYYY-MM-DD \u306E\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(this.fm[key])}`);
    return d;
  }
  datetime(key) {
    if (!this.has(key)) return null;
    const v = this.fm[key];
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
    if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return v.trim();
    this.problem("invalid-date", `${key} \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(v)}`);
    return null;
  }
  /** 真偽値。ないときは fallback。真偽値でなければ問題にして fallback */
  boolean(key, fallback) {
    if (!this.has(key)) return fallback;
    const v = this.fm[key];
    if (typeof v === "boolean") return v;
    this.problem("invalid-field", `${key} \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    return fallback;
  }
  minutes(key) {
    if (!this.has(key)) return null;
    const v = this.fm[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
    this.problem("invalid-field", `${key} \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(v)}`);
    return null;
  }
  list(key) {
    if (!this.has(key)) return [];
    const v = this.fm[key];
    return Array.isArray(v) ? v.filter((x) => x !== null && x !== "") : [v];
  }
  strings(key) {
    const out = [];
    for (const v of this.list(key)) {
      if (typeof v === "string" || typeof v === "number") {
        const s = String(v).trim();
        if (s && !out.includes(s)) out.push(s);
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
    const v = this.fm[key];
    if (!Array.isArray(v)) return this.date(key);
    const dates = this.dates(key);
    if (v.length > 0) this.problem("legacy-scheduled-list", `${key} \u306F\u65E5\u4ED8 1 \u3064\u306B\u3057\u307E\u3057\u305F\uFF08ADR-0152\uFF09\u3002\u79FB\u884C 0152-calendar-tickler \u3067\u66F8\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\uFF08node .kit/migrate.mjs\uFF09`, "warning");
    return dates[0] ?? null;
  }
  dates(key) {
    const out = /* @__PURE__ */ new Set();
    for (const v of this.list(key)) {
      const d = normalizeDate(v);
      if (d === null) this.problem("invalid-date", `${key} \u306B\u65E5\u4ED8\u3067\u306A\u3044\u5024\u304C\u3042\u308A\u307E\u3059: ${String(v)}`);
      else out.add(d);
    }
    return [...out].sort();
  }
  ref(key, prefix) {
    const v = this.string(key);
    if (v === null) return null;
    if (isId(v, prefix)) return v;
    this.problem("invalid-ref", `${key} \u304C ${prefix}-N \u306E ID \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${v}`);
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
  const r = new Reader(path, fm);
  const id = r.common("issue", "i");
  const summary = r.string("summary") ?? "";
  if (!summary) r.problem("missing-summary", "summary \u304C\u3042\u308A\u307E\u305B\u3093", "warning");
  const status = r.oneOf("status", STATUSES);
  if (status === null && !r.has("status")) r.problem("missing-status", "status \u304C\u3042\u308A\u307E\u305B\u3093");
  if (r.has("mid_due")) r.problem("legacy-mid-due", "mid_due \u306F soft_deadline \u306B\u6539\u540D\u3057\u307E\u3057\u305F\uFF08ADR-0032\uFF09\u3002\u30AD\u30FC\u3092 soft_deadline \u306B\u76F4\u3057\u3066\u304F\u3060\u3055\u3044");
  if (r.has("parent")) r.problem("legacy-parent", "parent \u306F\u5EC3\u6B62\u3057\u307E\u3057\u305F\uFF08ADR-0135\uFF09\u3002\u79FB\u884C 0135-sub-issues \u3067\u89AA\u306E\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u306B\u5909\u63DB\u3057\u3066\u304F\u3060\u3055\u3044\uFF08node .kit/migrate.mjs\uFF09");
  const issue = {
    path,
    id: id ?? "",
    summary,
    status: status ?? "open",
    statusDetail: r.string("status-detail") ?? "",
    delegatedTo: r.ref("delegated_to", "m"),
    priority: r.oneOf("priority", PRIORITIES),
    labels: r.strings("label"),
    related: r.strings("related"),
    estimated: r.minutes("estimated"),
    scheduled: r.calendarDate("scheduled"),
    softDeadline: r.date("soft_deadline"),
    deadline: r.date("deadline"),
    revisit: r.date("revisit"),
    reviewed: r.date("reviewed"),
    clarified: r.boolean("clarified", false),
    tickler: r.date("tickler"),
    created: r.datetime("created")
  };
  return { value: id === null ? null : issue, problems: r.problems };
}
function parseRoutine(path, fm) {
  const r = new Reader(path, fm);
  const id = r.common("routine", "r");
  let repeat = null;
  const parsed = parseRepeat(fm.repeat);
  if (parsed.ok) repeat = parsed.value;
  else r.problem("invalid-repeat", parsed.error);
  if (r.has("group")) r.problem("legacy-routine-group", "group \u306F\u5EC3\u6B62\u3057\u307E\u3057\u305F\uFF08ADR-0137\uFF09\u3002\u79FB\u884C 0137-board-lanes \u3067\u6D88\u3057\u3066\u304F\u3060\u3055\u3044\uFF08node .kit/migrate.mjs\uFF09", "warning");
  const active = fm.active === void 0 || fm.active === null ? true : fm.active;
  if (typeof active !== "boolean") r.problem("invalid-field", "active \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const routine = {
    path,
    id: id ?? "",
    summary: r.string("summary") ?? "",
    repeat,
    start: r.date("start"),
    end: r.date("end"),
    active: active !== false,
    priority: r.oneOf("priority", PRIORITIES),
    labels: r.strings("label"),
    estimated: r.minutes("estimated"),
    created: r.datetime("created")
  };
  return { value: id === null ? null : routine, problems: r.problems };
}
function parseMember(path, fm) {
  const r = new Reader(path, fm);
  const id = r.common("member", "m");
  const name = r.string("name") ?? "";
  if (!name) r.problem("missing-name", "name \u304C\u3042\u308A\u307E\u305B\u3093");
  const nickname = r.string("nickname") || name;
  const alias = (r.string("alias") ?? "").replace(/^@+/, "").trim();
  if (id === null) return { value: null, problems: r.problems };
  return { value: { path, id, name, nickname, alias: alias || id, labels: r.strings("label"), created: r.datetime("created") }, problems: r.problems };
}

// src/core/issue-file.ts
var ISSUE_BODY_TEMPLATE = "# Note\n\n";
function yamlString(s) {
  return JSON.stringify(s);
}
function newIssueContent(id, summary, created, extra = {}) {
  const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: issue", `id: ${id}`, `summary: ${yamlString(summary)}`, "status: open"];
  if (extra.scheduled) lines.push(`scheduled: ${extra.scheduled}`);
  if (extra.clarified) lines.push("clarified: true");
  lines.push(`created: ${created}`, `updated: ${created}`, "---", "", ISSUE_BODY_TEMPLATE);
  return lines.join("\n");
}
function frontmatterRange(text) {
  const m = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?=\r?\n|$)/.exec(text);
  return m ? { from: 0, to: m[0].length } : null;
}
function newDailyContent(created) {
  return `---
type: daily
created: ${created}
updated: ${created}
---
`;
}

// src/core/sub-issue.ts
var SUB_ISSUE_MARKER = "<!-- sub-issue";
var BLOCK_END = "-->";
var SubIssueFormatError = class extends Error {
};
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
    for (let i = 0; i < 6; i++) id += SUB_ID_CHARS[Math.min(SUB_ID_CHARS.length - 1, Math.floor(random() * SUB_ID_CHARS.length))];
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
  const blocks = starts.map((s, i) => text.slice(s, starts[i + 1] ?? text.length));
  return { head: text.slice(0, starts[0]), blocks };
}
function prefixed(problems, id) {
  return problems.map((p) => ({ ...p, message: `\u30B5\u30D6 ${id}: ${p.message}` }));
}
function parseBlock(path, parent, raw, order, parseYaml) {
  const invalid = (message) => ({ sub: null, problems: [{ severity: "error", path, code: "invalid-sub-issue", message: `${order + 1} \u4EF6\u76EE\u306E\u30B5\u30D6: ${message}` }] });
  const lines = raw.split(/\r?\n/);
  const endLine = lines.findIndex((l, i) => i > 0 && l.trim() === BLOCK_END);
  if (endLine < 0) return invalid(`\u9589\u3058\u306E ${BLOCK_END} \u304C\u3042\u308A\u307E\u305B\u3093`);
  const yamlText = [lines[0].slice(SUB_ISSUE_MARKER.length), ...lines.slice(1, endLine)].join("\n");
  let fm;
  try {
    fm = parseYaml(yamlText);
  } catch {
    return invalid("\u9805\u76EE\u304C YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
  }
  if (typeof fm !== "object" || fm === null || Array.isArray(fm)) return invalid("\u9805\u76EE\u304C YAML \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093");
  const r = new Reader(path, fm);
  const id = r.string("id");
  if (!isSubId(id)) return invalid(`id \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(id)}`);
  const extra = [];
  const summary = r.string("summary") ?? "";
  if (!summary) extra.push({ severity: "error", path, code: "invalid-sub-issue", message: "summary \u304C\u3042\u308A\u307E\u305B\u3093" });
  const status = r.oneOf("status", STATUSES);
  if (status === null && !r.has("status")) extra.push({ severity: "error", path, code: "invalid-sub-issue", message: "status \u304C\u3042\u308A\u307E\u305B\u3093" });
  const migratedFrom = r.ref("migrated_from", "i");
  const sub = {
    parent,
    path,
    id,
    key: subKey(parent, id),
    order,
    summary,
    status: status ?? "open",
    delegatedTo: r.ref("delegated_to", "m"),
    start: r.date("start"),
    end: r.date("end"),
    scheduled: r.calendarDate("scheduled"),
    softDeadline: r.date("soft_deadline"),
    deadline: r.date("deadline"),
    estimated: r.minutes("estimated"),
    dependsOn: r.strings("depends_on"),
    created: r.datetime("created"),
    migratedFrom,
    body: lines.slice(endLine + 1).join("\n").replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd()
  };
  return { sub, problems: prefixed([...extra, ...r.problems], id) };
}
function parseSubIssues(path, parent, text, parseYaml) {
  const blocks = [];
  const problems = [];
  const subs = [];
  for (const raw of splitSubIssueText(text).blocks) {
    const r = parseBlock(path, parent, raw, blocks.length, parseYaml);
    blocks.push({ raw: raw.trimEnd(), sub: r.sub });
    problems.push(...r.problems);
    if (r.sub) subs.push(r.sub);
  }
  return { subs, blocks, problems };
}
function yamlString2(s) {
  return JSON.stringify(s);
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
  put("soft_deadline", sub.softDeadline);
  put("deadline", sub.deadline);
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
  if (body.split(/\r?\n/).some((l) => l.startsWith(SUB_ISSUE_MARKER))) {
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
  const parts = blocks.map((b) => typeof b === "string" ? `${b.trimEnd()}
` : formatSubIssue(b));
  return `${head.trimEnd()}

${parts.join("\n")}`;
}
function updateSubIssueText(path, parent, text, id, patch, parseYaml) {
  const { blocks } = parseSubIssues(path, parent, text, parseYaml);
  const at = blocks.findIndex((b) => b.sub?.id === id);
  if (at < 0) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${subKey(parent, id)}`);
  const before = blocks[at].sub;
  const after = { ...before, ...patch, id: before.id };
  const next = replaceSubIssues(
    text,
    blocks.map((b, i) => i === at ? after : b.sub ?? b.raw)
  );
  return { text: next, before, after };
}
function rebuild(path, parent, text, parseYaml, edit) {
  const { blocks } = parseSubIssues(path, parent, text, parseYaml);
  const items = blocks.map((b) => b.sub ?? b.raw);
  edit(
    items,
    blocks.map((b) => b.sub?.id ?? null)
  );
  return replaceSubIssues(text, items);
}
function indexOfSub(ids, parent, id) {
  const at = ids.indexOf(id);
  if (at < 0) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${subKey(parent, id)}`);
  return at;
}
function insertSubIssuesText(path, parent, text, subs, parseYaml, at) {
  return rebuild(path, parent, text, parseYaml, (items) => {
    const pos = at ?? items.length;
    if (!Number.isInteger(pos) || pos < 0 || pos > items.length) throw new Error(`\u4F4D\u7F6E\u306F 0 \u304B\u3089 ${items.length} \u307E\u3067\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${pos}`);
    items.splice(pos, 0, ...subs);
  });
}
function moveSubIssueText(path, parent, text, id, to, parseYaml) {
  return rebuild(path, parent, text, parseYaml, (items, ids) => {
    const from = indexOfSub(ids, parent, id);
    if (!Number.isInteger(to) || to < 0 || to >= items.length) throw new Error(`\u4F4D\u7F6E\u306F 0 \u304B\u3089 ${items.length - 1} \u307E\u3067\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${to}`);
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
  });
}
function removeSubIssueText(path, parent, text, id, parseYaml) {
  return rebuild(path, parent, text, parseYaml, (items, ids) => {
    items.splice(indexOfSub(ids, parent, id), 1);
  });
}
function checkSubIssues(subs, memberIds) {
  const errors = [];
  const ids = /* @__PURE__ */ new Set();
  const byId = new Map(subs.map((s) => [s.id, s]));
  const isDate = (v) => v === null || typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  for (const s of subs) {
    const where = `\u30B5\u30D6 ${s.id}`;
    if (ids.has(s.id)) errors.push(`${where}: id \u304C\u91CD\u306A\u3063\u3066\u3044\u307E\u3059`);
    ids.add(s.id);
    if (!s.summary.trim()) errors.push(`${where}: summary \u304C\u3042\u308A\u307E\u305B\u3093`);
    if (!STATUSES.includes(s.status)) errors.push(`${where}: status \u306F ${STATUSES.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${s.status}`);
    for (const [key, value] of [
      ["start", s.start],
      ["end", s.end],
      ["scheduled", s.scheduled],
      ["soft_deadline", s.softDeadline],
      ["deadline", s.deadline]
    ]) {
      if (!isDate(value)) errors.push(`${where}: ${key} \u304C YYYY-MM-DD \u306E\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(value)}`);
    }
    if (s.start !== null && s.end !== null && s.end < s.start) errors.push(`${where}: end \u304C start \u3088\u308A\u524D\u3067\u3059`);
    if (s.estimated !== null && !(typeof s.estimated === "number" && Number.isFinite(s.estimated) && s.estimated >= 0)) errors.push(`${where}: estimated \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    if (s.status === "delegated" && s.delegatedTo === null) errors.push(`${where}: delegated \u306B\u306F delegated_to \u304C\u8981\u308A\u307E\u3059`);
    if (s.delegatedTo !== null) {
      if (!memberIds.has(s.delegatedTo)) errors.push(`${where}: delegated_to \u306E ${s.delegatedTo} \u304C\u3042\u308A\u307E\u305B\u3093`);
      if (s.status !== "delegated") errors.push(`${where}: delegated_to \u306F status \u304C delegated \u306E\u3068\u304D\u3060\u3051\u4ED8\u3051\u3089\u308C\u307E\u3059`);
    }
    for (const d of s.dependsOn) {
      if (d === s.id) errors.push(`${where}: depends_on \u306B\u81EA\u5206\u81EA\u8EAB\u306F\u5165\u308C\u3089\u308C\u307E\u305B\u3093`);
      else if (!byId.has(d)) errors.push(`${where}: depends_on \u306E ${d} \u304C\u540C\u3058 issue \u306E\u4E2D\u306B\u3042\u308A\u307E\u305B\u3093`);
    }
    try {
      formatSubIssue(s);
    } catch (e) {
      errors.push(`${where}: ${e.message}`);
    }
  }
  for (const s of subs) {
    const seen = /* @__PURE__ */ new Set();
    const stack2 = s.dependsOn.filter((d) => d !== s.id);
    let cycle = false;
    while (stack2.length > 0 && !cycle) {
      const id = stack2.pop();
      if (id === s.id) cycle = true;
      else if (!seen.has(id)) {
        seen.add(id);
        stack2.push(...byId.get(id)?.dependsOn ?? []);
      }
    }
    if (cycle) errors.push(`\u30B5\u30D6 ${s.id}: depends_on \u304C\u5FAA\u74B0\u3057\u3066\u3044\u307E\u3059`);
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
    softDeadline: item.softDeadline ?? null,
    deadline: item.deadline ?? null,
    estimated: item.estimated ?? null,
    dependsOn: item.dependsOn ?? [],
    created,
    migratedFrom: null,
    body: item.body ?? ISSUE_BODY_TEMPLATE
  };
}
function dependentsOf(subs, id) {
  return subs.filter((s) => s.dependsOn.includes(id)).map((s) => s.id);
}
function touchedSubErrors(subs, touched, memberIds) {
  return checkSubIssues(subs, memberIds).filter((e) => touched.some((id) => e.startsWith(`\u30B5\u30D6 ${id}: `)));
}
function normalizeSubPatch(patch) {
  return patch.status !== void 0 && patch.status !== "delegated" && patch.delegatedTo === void 0 ? { ...patch, delegatedTo: null } : patch;
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
  text.split("\n").forEach((raw, i) => {
    const line = i + 1;
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
    const o = obj;
    if (typeof o.id !== "string" || !o.id) return problem(line, "invalid-worklog", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    if (typeof o.task_id !== "string" || !o.task_id) return problem(line, "invalid-worklog", "task_id \u304C\u3042\u308A\u307E\u305B\u3093");
    const sub = o.sub === void 0 || o.sub === null ? null : o.sub;
    if (sub !== null && !isSubId(sub)) return problem(line, "invalid-worklog", "sub \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const fromMs = typeof o.from === "string" ? Date.parse(o.from) : Number.NaN;
    if (Number.isNaN(fromMs)) return problem(line, "invalid-worklog", "from \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    let toMs = null;
    if (o.to !== null && o.to !== void 0) {
      toMs = typeof o.to === "string" ? Date.parse(o.to) : Number.NaN;
      if (Number.isNaN(toMs)) return problem(line, "invalid-worklog", "to \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    }
    entries.push({
      path,
      line,
      id: o.id,
      taskId: o.task_id,
      sub,
      from: o.from,
      to: toMs === null ? null : o.to,
      description: typeof o.description === "string" ? o.description : "",
      fromMs,
      toMs
    });
  });
  return { entries, problems };
}
function serializeWorklogEntry(e) {
  return JSON.stringify({ id: e.id, task_id: e.taskId, ...e.sub ? { sub: e.sub } : {}, from: e.from, to: e.to, description: e.description });
}
function workKey(e) {
  return e.sub ? `${e.taskId}#${e.sub}` : e.taskId;
}
function workTarget(key) {
  const parsed = parseSubKey(key);
  return parsed ? { taskId: parsed.parent, sub: parsed.id } : { taskId: key, sub: null };
}
function replaceWorklogLine(text, entry, next) {
  const lines = text.split("\n");
  const i = entry.line - 1;
  let current;
  try {
    current = JSON.parse(lines[i] ?? "");
  } catch {
    current = null;
  }
  if (typeof current !== "object" || current === null || current.id !== entry.id) {
    throw new Error("worklog \u306E\u30D5\u30A1\u30A4\u30EB\u304C\u5909\u308F\u3063\u3066\u3044\u307E\u3059\u3002\u958B\u304D\u76F4\u3057\u3066\u304B\u3089\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044");
  }
  if (next === null) lines.splice(i, 1);
  else lines[i] = serializeWorklogEntry({ id: entry.id, taskId: entry.taskId, sub: entry.sub ?? null, ...next });
  return lines.join("\n");
}
var MIN_WORKLOG_MS = 6e4;
function stopWorklogLines(text, entries, to, toMs) {
  return [...entries].sort((a, b) => b.line - a.line).reduce((t, e) => replaceWorklogLine(t, e, toMs - e.fromMs < MIN_WORKLOG_MS ? null : { from: e.from, to, description: e.description }), text);
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
function parseOp(o) {
  const task = typeof o.task === "string" && o.task ? o.task : null;
  switch (o.op) {
    case "add":
    case "remove":
    case "carry":
      return task ? { op: o.op, task } : null;
    case "place":
      return IGNORED;
    case "star":
      return task && typeof o.on === "boolean" ? { op: "star", task, on: o.on } : null;
    case "routine":
      return task && (o.result === null || o.result === "closed" || o.result === "canceled") ? { op: "routine", task, result: o.result } : null;
    case "close":
      return Array.isArray(o.tasks) && o.tasks.every((id) => typeof id === "string" && id) ? { op: "close", tasks: o.tasks } : null;
    case "reopen":
      return { op: "reopen" };
    case "order":
      if ("group" in o) return IGNORED;
      return Array.isArray(o.tasks) && o.tasks.every((id) => typeof id === "string" && id) ? { op: "order", tasks: o.tasks } : null;
    default:
      return null;
  }
}
function parseBoardLog(path, text) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text.split("\n").forEach((raw, i) => {
    const line = i + 1;
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
    const o = obj;
    if (typeof o.id !== "string" || !o.id) return problem(line, "invalid-board-log", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    const atMs = typeof o.at === "string" ? Date.parse(o.at) : Number.NaN;
    if (Number.isNaN(atMs)) return problem(line, "invalid-board-log", "at \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (typeof o.date !== "string" || !isLocalDate(o.date)) return problem(line, "invalid-board-log", "date \u304C\u65E5\u4ED8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const op = parseOp(o);
    if (!op) return problem(line, "invalid-board-log", "\u64CD\u4F5C\u304C\u4E0D\u6B63\u3067\u3059");
    if (op === IGNORED) return;
    entries.push({ path, line, id: o.id, at: o.at, atMs, date: o.date, op });
  });
  return { entries, problems };
}
function serializeBoardLogEntry(e) {
  return JSON.stringify(e);
}
function newBoardLogId(random = Math.random) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return `bo_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}
function compareEntries(a, b) {
  if (a.atMs !== b.atMs) return a.atMs - b.atMs;
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  return a.line - b.line;
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
  for (const e of [...entries].sort(compareEntries)) {
    apply(board, e.op);
    if (e.op.op === "close") lastClose = e.op.tasks;
  }
  const seen = lastClose;
  if (board.closed && seen !== null && board.issues.some((id) => !seen.includes(id))) board.closed = false;
  return board;
}
function removedTasks(entries) {
  const last = /* @__PURE__ */ new Map();
  for (const e of [...entries].sort(compareEntries)) {
    if (e.op.op === "add" || e.op.op === "remove") last.set(e.op.task, e.op.op);
  }
  return [...last].filter(([, op]) => op === "remove").map(([id]) => id);
}
function orderHistory(entries) {
  const records = [];
  for (const e of [...entries].sort(compareEntries)) {
    if (e.op.op === "order") records.push({ date: e.date, atMs: e.atMs, tasks: e.op.tasks });
  }
  return records.sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.atMs - b.atMs);
}
function lastOrder(history, date) {
  let found;
  for (const r of history) {
    if (r.date > date) break;
    found = r.tasks;
  }
  return found;
}

// src/core/daily.ts
var byDate = (key) => (a, b) => (a[key] ?? "").localeCompare(b[key] ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });
function deadIssues(issues, today) {
  const deadline = [];
  const softDeadline = [];
  for (const i of issues) {
    if (!isActive(i)) continue;
    if (i.deadline !== null && i.deadline < today) deadline.push(i);
    if (i.softDeadline !== null && i.softDeadline < today) softDeadline.push(i);
  }
  return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}
function cautionIssues(issues, today, days = 3) {
  const within = (d) => d !== null && diffDays(d, today) >= 0 && diffDays(d, today) <= days;
  const deadline = [];
  const softDeadline = [];
  for (const i of issues) {
    if (!isActive(i)) continue;
    if (within(i.deadline)) deadline.push(i);
    if (within(i.softDeadline)) softDeadline.push(i);
  }
  return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}
function scheduledOn(issues, date, exclude = /* @__PURE__ */ new Set()) {
  return [...issues].filter((i) => isActive(i) && i.scheduled === date && !exclude.has(i.id)).sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}
var priorityRank = (p) => p === null ? PRIORITIES.length : PRIORITIES.indexOf(p);
var nullsLast = (a, b) => a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b);
var byPick = (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || nullsLast(a.deadline, b.deadline) || nullsLast(a.reviewed ?? "", b.reviewed ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });

// src/core/effort.ts
function prorateEffort(intervals, now) {
  const events = [];
  for (const iv of intervals) {
    const to = iv.toMs ?? Math.max(now, iv.fromMs);
    if (!(to > iv.fromMs)) continue;
    events.push({ t: iv.fromMs, delta: 1, taskId: iv.taskId }, { t: to, delta: -1, taskId: iv.taskId });
  }
  events.sort((a, b) => a.t - b.t);
  const result = /* @__PURE__ */ new Map();
  const active = /* @__PURE__ */ new Map();
  let k = 0;
  let prev = 0;
  for (let i = 0; i < events.length; ) {
    const t = events[i].t;
    if (k > 0 && t > prev) {
      const share = (t - prev) / k;
      for (const [taskId, count] of active) result.set(taskId, (result.get(taskId) ?? 0) + share * count);
    }
    for (; i < events.length && events[i].t === t; i++) {
      const e = events[i];
      const count = (active.get(e.taskId) ?? 0) + e.delta;
      if (count === 0) active.delete(e.taskId);
      else active.set(e.taskId, count);
      k += e.delta;
      if (!result.has(e.taskId)) result.set(e.taskId, 0);
    }
    prev = t;
  }
  return result;
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
function serializeStatusLogEntry(e) {
  return JSON.stringify({ id: e.id, at: e.at, task: e.task, ...e.sub ? { sub: e.sub } : {}, from: e.from, to: e.to, via: e.via });
}
function statusLogLine(task, from, to, via, at, random = Math.random, sub = null) {
  if (from === to) return null;
  return serializeStatusLogEntry({ id: newStatusLogId(random), at: at.toISOString(), task, sub, from, to, via });
}
var isStatus = (v) => typeof v === "string" && STATUSES.includes(v);
function parseStatusLog(path, text) {
  const entries = [];
  const problems = [];
  const problem = (line, code, message) => problems.push({ severity: "error", path, code, message: `${line} \u884C\u76EE: ${message}` });
  text.split("\n").forEach((raw, i) => {
    const line = i + 1;
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
    const o = obj;
    if (typeof o.id !== "string" || !o.id) return problem(line, "invalid-status-log", "id \u304C\u3042\u308A\u307E\u305B\u3093");
    const atMs = typeof o.at === "string" ? Date.parse(o.at) : Number.NaN;
    if (Number.isNaN(atMs)) return problem(line, "invalid-status-log", "at \u304C\u65E5\u6642\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (typeof o.task !== "string" || !o.task) return problem(line, "invalid-status-log", "task \u304C\u3042\u308A\u307E\u305B\u3093");
    const sub = o.sub === void 0 || o.sub === null ? null : o.sub;
    if (sub !== null && !isSubId(sub)) return problem(line, "invalid-status-log", "sub \u304C\u82F1\u5C0F\u6587\u5B57\u3068\u6570\u5B57\u306E 6 \u6587\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    if (!isStatus(o.from) || !isStatus(o.to)) return problem(line, "invalid-status-log", "from / to \u304C status \u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    const via = STATUS_VIAS.includes(o.via) ? o.via : null;
    if (via === null) return problem(line, "invalid-status-log", "via \u304C\u4E0D\u6B63\u3067\u3059");
    entries.push({ path, line, id: o.id, at: o.at, atMs, task: o.task, sub, from: o.from, to: o.to, via });
  });
  return { entries, problems };
}
function compareStatusLog(a, b) {
  if (a.atMs !== b.atMs) return a.atMs - b.atMs;
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  return a.line - b.line;
}
function isIssueStatusLog(e) {
  return !e.sub;
}
function statusBefore(logs, task, current) {
  for (let i = logs.length - 1; i >= 0; i--) {
    const e = logs[i];
    if (e.task !== task || !isIssueStatusLog(e)) continue;
    return e.to === current && e.from !== current ? e.from : null;
  }
  return null;
}
function closedAtMap(logs, closedIds) {
  const ids = new Set(closedIds);
  const out = /* @__PURE__ */ new Map();
  for (const e of logs) if (ids.has(e.task) && isIssueStatusLog(e) && e.to === "closed") out.set(e.task, e.atMs);
  return out;
}
function isDoneStatus(status) {
  return status === "closed" || status === "canceled";
}

// src/core/index.ts
var INACTIVE_STATUSES = ["closed", "canceled", "someday"];
function isActive(issue) {
  return !INACTIVE_STATUSES.includes(issue.status);
}
function isInbox(issue, today) {
  if (issue.status !== "open") return false;
  if (issue.tickler !== null) return issue.tickler <= today;
  return !issue.clarified;
}
function isWatchStatus(status) {
  return status === "waiting" || status === "delegated";
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
    for (const i of data.issues) if (!this.issues.has(i.id)) this.issues.set(i.id, i);
    for (const r of data.routines) if (!this.routines.has(r.id)) this.routines.set(r.id, r);
    for (const m of data.members) if (!this.members.has(m.id)) this.members.set(m.id, m);
    for (const i of data.issues) this.issuesByPath.set(i.path, i);
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
  /** 合成キー `i-12#k3f9a2` のサブ */
  sub(key) {
    return this.subsByKey.get(key);
  }
  /** 移行で子の issue から変換したサブ（元の ID → サブ。ADR-0135） */
  migrated(oldId) {
    if (this.issues.has(oldId)) return void 0;
    return this.data.subIssues.find((s) => s.migratedFrom === oldId);
  }
  /** 按分後の実績（分）。タスクの ID ごと（ADR-0005）。親の issue は、親に直接付けた行とサブの行の合計（ADR-0135） */
  effortMinutes(now) {
    const ms = prorateEffort(this.data.worklogs, now);
    return new Map([...ms].map(([id, v]) => [id, v / 6e4]));
  }
  /**
   * 按分後の実績（分）。記録の鍵（workKey）ごと: サブは合成キー、親の ID は親に直接付けた行だけ（ADR-0135）。
   * 按分は同時に動いている区間の数で割るので、親の ID とそのサブの合計は effortMinutes の親の値と同じ
   */
  effortByKey(now) {
    const ms = prorateEffort(this.data.worklogs.map((l) => ({ taskId: workKey(l), fromMs: l.fromMs, toMs: l.toMs })), now);
    return new Map([...ms].map(([key, v]) => [key, v / 6e4]));
  }
  /** routine 画面の工数（ADR-0021）: 按分後の累計（分）・worklog がある日数・1 日あたりの平均（分、0 日なら null） */
  routineEffort(taskId, now) {
    const total = this.effortMinutes(now).get(taskId) ?? 0;
    const dates = /* @__PURE__ */ new Set();
    for (const l of this.data.worklogs) {
      if (l.taskId !== taskId) continue;
      const to = l.toMs ?? Math.max(now, l.fromMs);
      if (to > l.fromMs) dates.add(localToday(new Date(l.fromMs)));
    }
    const days = dates.size;
    return { total, days, average: days > 0 ? total / days : null };
  }
  board(date) {
    return this.data.boards.find((b) => b.date === date);
  }
  /**
   * その日のボードに自動で載せる issue の ID とサブの合成キー（ADR-0034, 0137）:
   * その日が実行日で active で、まだ載っておらず、その日に外してもいないもの。issue（ID の順）→ サブ（親の md の順）
   */
  toAutoAdd(date) {
    const daily = this.board(date);
    const skip = /* @__PURE__ */ new Set([...daily?.board.issues ?? [], ...daily?.removed ?? []]);
    const subs = this.data.subIssues.filter((s) => isActive(s) && s.scheduled === date && !skip.has(s.key) && this.subsByKey.get(s.key) === s);
    return [...scheduledOn(this.issues.values(), date, skip).map((i) => i.id), ...subs.map((s) => s.key)];
  }
  /** ボードの並び（ADR-0114, 0137）。その日までで最後に並べたもの。なければ undefined */
  order(date) {
    return lastOrder(this.data.orders, date);
  }
  /** 記録中（to が空）の worklog。鍵（workKey）の完全一致で選ぶ: 親の ID なら親に直接付けた記録だけ（ADR-0135） */
  running(key) {
    return this.data.worklogs.filter((l) => l.toMs === null && (key === void 0 || workKey(l) === key));
  }
  /** issue が今の status になる前の status（記録から。分からなければ null。ADR-0031） */
  statusBefore(id) {
    const issue = this.issues.get(id);
    return issue ? statusBefore(this.data.statusLogs, id, issue.status) : null;
  }
  /** その issue の最後の status の記録 */
  lastStatusLog(id) {
    const logs = this.data.statusLogs;
    for (let i = logs.length - 1; i >= 0; i--) if (logs[i].task === id && isIssueStatusLog(logs[i])) return logs[i];
    return void 0;
  }
  /** 今 closed の issue を、最後に closed にした時刻（ミリ秒。記録にあるものだけ。ADR-0031） */
  closedAt() {
    const closed = [...this.issues.values()].filter((i) => i.status === "closed").map((i) => i.id);
    return closedAtMap(this.data.statusLogs, closed);
  }
  routinesOn(date) {
    return [...this.routines.values()].filter((r) => routineOccursOn(r, date));
  }
};

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
  for (const [id, r] of Object.entries(record(raw.routines))) if (r === "closed" || r === "canceled") board.routines[id] = r;
  board.closed = raw.closed === true;
  return board;
}
function dailyNotePath(date) {
  return `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
}
var DAILY_PATH_RE = /^daily\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/;
function boardItems(index, date, board) {
  const issues = board.issues.map((id) => index.issues.get(id)).filter((i) => i !== void 0);
  const subs = board.issues.map((key) => index.sub(key)).filter((s) => s !== void 0);
  return { issues, subs, routines: index.routinesOn(date) };
}
function unfinished(index, date, board) {
  const items = boardItems(index, date, board);
  const left = (status, key) => isActive({ status }) && !isWatchStatus(status) && !board.carried.includes(key);
  return {
    issues: items.issues.filter((i) => left(i.status, i.id)),
    subs: items.subs.filter((s) => left(s.status, s.key)),
    routines: items.routines.filter((r) => board.routines[r.id] === void 0)
  };
}
function unfinishedCount(u) {
  return u.issues.length + u.subs.length + u.routines.length;
}
function markCarried(board, ids) {
  for (const id of ids) if (!board.carried.includes(id)) board.carried.push(id);
}
function routineResults(index, routine, today, days) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    const result = index.board(date)?.board.routines[routine.id];
    return { date, state: result ?? (routineOccursOn(routine, date) ? "none" : "off") };
  });
}
function pendingBoards(index, boards, today) {
  return boards.filter((b) => b.date < today && !b.board.closed).filter((b) => {
    const u = unfinished(index, b.date, b.board);
    return unfinishedCount(u) > 0;
  }).sort((a, b) => a.date.localeCompare(b.date));
}
function sortByOrder(items, idOf, order) {
  if (!order || order.length === 0) return [...items];
  const rank = new Map(order.map((id, i) => [id, i]));
  const inOrder = items.filter((it) => rank.has(idOf(it))).sort((a, b) => (rank.get(idOf(a)) ?? 0) - (rank.get(idOf(b)) ?? 0));
  return [...inOrder, ...items.filter((it) => !rank.has(idOf(it)))];
}
function reorder(visible, id, before) {
  const rest = visible.filter((x) => x !== id);
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

// src/core/board-lanes.ts
var LANES = ["working", "top", "routine", "next", "watch", "done"];
var TOP_LIMIT = 4;
function boardCards(index, date, board) {
  const cards = [];
  for (const key of board.issues) {
    const issue = index.issues.get(key);
    if (issue) {
      cards.push({ kind: "issue", key, issue });
      continue;
    }
    const sub = index.sub(key);
    if (sub) cards.push({ kind: "sub", key, sub, parent: index.issues.get(sub.parent) });
  }
  for (const routine of index.routinesOn(date)) cards.push({ kind: "routine", key: routine.id, routine });
  return cards;
}
function cardStatus(board, card) {
  if (card.kind === "issue") return card.issue.status;
  if (card.kind === "sub") return card.sub.status;
  return board.routines[card.routine.id] ?? "open";
}
function cardSummary(card) {
  return card.kind === "issue" ? card.issue.summary : card.kind === "sub" ? card.sub.summary : card.routine.summary;
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
  for (const card of sortByOrder(boardCards(index, date, board), (c) => c.key, order)) {
    const lane = laneOf(index, board, card);
    if (lane !== "watch") lanes[lane].push(card);
  }
  lanes.watch = watchCards(index, new Set(lanes.working.map((c) => c.key)));
  const startedAt = (c) => Math.min(...index.running(c.key).map((l) => l.fromMs));
  lanes.working.sort((a, b) => startedAt(a) - startedAt(b));
  const added = boardCards(index, date, board).map((c) => c.key);
  lanes.done.sort((a, b) => added.indexOf(a.key) - added.indexOf(b.key));
  return lanes;
}
function watchCards(index, exclude = /* @__PURE__ */ new Set()) {
  const cards = [];
  for (const issue of index.issues.values()) if (isWatchStatus(issue.status)) cards.push({ kind: "issue", key: issue.id, issue });
  for (const sub of index.data.subIssues) {
    if (!isWatchStatus(sub.status) || index.sub(sub.key) !== sub) continue;
    const parent = index.issues.get(sub.parent);
    if (parent && isActive(parent)) cards.push({ kind: "sub", key: sub.key, sub, parent });
  }
  const owner = (c) => c.kind === "issue" ? c.issue : c.parent;
  const rank = (c) => c.kind === "sub" ? c.sub.order : -1;
  return cards.filter((c) => !exclude.has(c.key)).sort((a, b) => byPick(owner(a), owner(b)) || rank(a) - rank(b));
}
function unstarOps(index, date, key, to) {
  if (!isWatchStatus(to)) return [];
  return index.board(date)?.board.stars.includes(key) ? [{ op: "star", task: key, on: false }] : [];
}
function canStar(lanes) {
  return lanes.top.length < TOP_LIMIT;
}
function orderedKeys(lanes) {
  return [...lanes.top, ...lanes.next].map((c) => c.key);
}
function endOf(lanes, lane, key) {
  const after = lane === "top" ? ["next"] : [];
  for (const l of after) {
    const first = lanes[l].find((c) => c.key !== key);
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

// ../design/src/color.ts
var HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function isHex(text) {
  return HEX.test(text);
}
function parseHex(text) {
  if (!isHex(text)) throw new Error(`\u8272\u306E\u66F8\u5F0F\u304C\u9055\u3044\u307E\u3059: ${text}`);
  let h = text.slice(1);
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  const n = (i) => Number.parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}
function over(top, bottom) {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1
  };
}
function stack(layers) {
  const [first, ...rest] = layers;
  if (!first) throw new Error("\u91CD\u306D\u308B\u8272\u304C\u3042\u308A\u307E\u305B\u3093");
  if (first.a < 1) throw new Error("\u4E00\u756A\u4E0B\u306E\u8272\u306F\u4E0D\u900F\u660E\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  return rest.reduce((acc, c) => over(c, acc), first);
}
function channel(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(c) {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}
function contrastRatio(foreground, background) {
  if (background.a < 1) throw new Error("\u80CC\u666F\u306F\u4E0D\u900F\u660E\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const fg = foreground.a < 1 ? over(foreground, background) : foreground;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
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
    const o = typeof item === "object" && item !== null ? item : {};
    if (typeof o.name !== "string" || !o.name.trim()) {
      problem(`name \u306E\u306A\u3044 label \u304C\u3042\u308A\u307E\u3059: ${JSON.stringify(item)}`);
      continue;
    }
    const name = o.name.trim();
    if (labels.some((l) => l.name === name)) {
      problem(`label \u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059: ${name}`);
      continue;
    }
    const color = typeof o.color === "string" && /^#[0-9a-f]{3,8}$/i.test(o.color) ? o.color : DEFAULT_LABEL_COLOR;
    labels.push({ name, color });
  }
  return { labels, problems };
}

// src/core/lint.ts
function safeDecode(path) {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}
var LABEL_CONTRAST_MIN = 4.5;
function labelContrast(color) {
  return Math.min(
    ...["light", "dark"].map((mode) => {
      const bg = stack([parseHex(colors[mode]["color.surface-container"]), parseHex(color)]);
      return contrastRatio(parseHex(colors[mode]["color.on-label"]), bg);
    })
  );
}
function lintSubIssues(data, index, add) {
  const byParent = /* @__PURE__ */ new Map();
  for (const sub of data.subIssues) byParent.set(sub.parent, [...byParent.get(sub.parent) ?? [], sub]);
  for (const subs of byParent.values()) {
    const seen = /* @__PURE__ */ new Set();
    for (const sub of subs) {
      if (seen.has(sub.id)) add("error", sub.path, "duplicate-sub-id", `\u30B5\u30D6\u306E id ${sub.id} \u304C\u540C\u3058 issue \u306E\u4E2D\u3067\u91CD\u306A\u3063\u3066\u3044\u307E\u3059`);
      seen.add(sub.id);
    }
  }
  for (const sub of data.subIssues) {
    const { path } = sub;
    const where = `\u30B5\u30D6 ${sub.id}`;
    if (index.sub(sub.key) !== sub) continue;
    if (sub.status === "delegated" && sub.delegatedTo === null) add("error", path, "missing-delegated-to", `${where}: delegated \u306A\u306E\u306B delegated_to \u304C\u3042\u308A\u307E\u305B\u3093`);
    if (sub.delegatedTo !== null) {
      if (!index.members.has(sub.delegatedTo)) add("error", path, "dangling-member", `${where}: delegated_to \u306E ${sub.delegatedTo} \u304C\u3042\u308A\u307E\u305B\u3093`);
      if (sub.status !== "delegated") add("warning", path, "stale-delegated-to", `${where}: delegated \u3067\u306F\u306A\u3044\u306E\u306B delegated_to \u304C\u3042\u308A\u307E\u3059`);
    }
    for (const dep of sub.dependsOn) {
      if (dep === sub.id) {
        add("error", path, "self-depends-on", `${where}: depends_on \u304C\u81EA\u5206\u81EA\u8EAB\u3067\u3059`);
        continue;
      }
      const target = index.sub(subKey(sub.parent, dep));
      if (!target) {
        add("error", path, "dangling-depends-on", `${where}: depends_on \u306E ${dep} \u304C\u540C\u3058 issue \u306E\u4E2D\u306B\u3042\u308A\u307E\u305B\u3093`);
        continue;
      }
      if (sub.start !== null && target.end !== null && sub.start < target.end) {
        add("warning", path, "start-before-dependency", `${where}: start\uFF08${sub.start}\uFF09\u304C\u4F9D\u5B58\u5148 ${dep} \u306E end\uFF08${target.end}\uFF09\u3088\u308A\u524D\u3067\u3059`);
      }
    }
    if (dependsOnCycle(index, sub)) add("error", path, "depends-on-cycle", `${where}: depends_on \u304C\u5FAA\u74B0\u3057\u3066\u3044\u307E\u3059`);
  }
}
function dependsOnCycle(index, start) {
  const seen = /* @__PURE__ */ new Set();
  const stack2 = start.dependsOn.filter((d) => d !== start.id);
  while (stack2.length > 0) {
    const id = stack2.pop();
    if (id === start.id) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const next = index.sub(subKey(start.parent, id));
    if (next) stack2.push(...next.dependsOn.filter((d) => d !== next.id));
  }
  return false;
}
function lintVault(data, options = {}) {
  const problems = [];
  const add = (severity, path, code, message) => problems.push({ severity, path, code, message });
  const index = new TaskIndex(data);
  for (const [kind, items] of [
    ["issue", data.issues],
    ["routine", data.routines],
    ["member", data.members]
  ]) {
    const first = /* @__PURE__ */ new Map();
    for (const item of items) {
      const prev = first.get(item.id);
      if (prev === void 0) first.set(item.id, item.path);
      else add("error", item.path, "duplicate-id", `${kind} \u306E ID ${item.id} \u304C ${prev} \u3068\u91CD\u8907\u3057\u3066\u3044\u307E\u3059`);
    }
  }
  const labelNames = new Set(data.labels.map((l) => l.name));
  for (const label of data.labels) {
    const ratio = labelContrast(label.color);
    if (ratio < LABEL_CONTRAST_MIN) {
      add("error", LABELS_PATH, "low-contrast-label", `label\u300C${label.name}\u300D\u306E\u8272 ${label.color} \u306F\u6587\u5B57\u3068\u306E\u6BD4\u304C ${formatRatio(ratio)} \u3067\u3001${LABEL_CONTRAST_MIN} \u306B\u5C4A\u304D\u307E\u305B\u3093\uFF08docs/design.md\uFF09`);
    }
  }
  for (const issue of data.issues) {
    const { path } = issue;
    for (const ref of issue.related) {
      if (parseSubKey(ref) !== null) {
        if (!index.sub(ref)) add("error", path, "dangling-related", `related \u306E\u30B5\u30D6 ${ref} \u304C\u3042\u308A\u307E\u305B\u3093`);
      } else if (isId(ref, "i")) {
        if (!index.issues.has(ref)) add("error", path, "dangling-related", `related \u306E ${ref} \u304C\u3042\u308A\u307E\u305B\u3093`);
      } else if (options.paths && !options.paths.has(safeDecode(ref))) {
        add("error", path, "dangling-related", `related \u306E\u30CE\u30FC\u30C8 ${ref} \u304C\u3042\u308A\u307E\u305B\u3093`);
      }
    }
    if (issue.status === "delegated" && issue.delegatedTo === null) {
      add("error", path, "missing-delegated-to", "delegated \u306A\u306E\u306B delegated_to \u304C\u3042\u308A\u307E\u305B\u3093");
    }
    if (issue.delegatedTo !== null) {
      if (!index.members.has(issue.delegatedTo)) add("error", path, "dangling-member", `delegated_to \u306E ${issue.delegatedTo} \u304C\u3042\u308A\u307E\u305B\u3093`);
      if (issue.status !== "delegated") add("warning", path, "stale-delegated-to", "delegated \u3067\u306F\u306A\u3044\u306E\u306B delegated_to \u304C\u3042\u308A\u307E\u3059");
    }
    if (issue.statusDetail.length > STATUS_DETAIL_MAX) {
      add("warning", path, "long-status-detail", `status-detail \u304C ${STATUS_DETAIL_MAX} \u6587\u5B57\u3092\u8D85\u3048\u3066\u3044\u307E\u3059`);
    }
    if (issue.status === "someday" && (issue.scheduled !== null || issue.softDeadline !== null || issue.deadline !== null)) {
      add("warning", path, "someday-with-dates", "someday \u306A\u306E\u306B scheduled / soft_deadline / deadline \u304C\u6B8B\u3063\u3066\u3044\u307E\u3059");
    }
    if (issue.revisit !== null && issue.status !== "someday") {
      add("warning", path, "stale-revisit", "someday \u3067\u306F\u306A\u3044\u306E\u306B revisit \u304C\u3042\u308A\u307E\u3059");
    }
    for (const label of issue.labels) {
      if (!labelNames.has(label)) add("warning", path, "unknown-label", `label\u300C${label}\u300D\u304C labels.json \u306B\u3042\u308A\u307E\u305B\u3093`);
    }
  }
  lintSubIssues(data, index, add);
  for (const member of data.members) {
    for (const label of member.labels) {
      if (!labelNames.has(label)) add("warning", member.path, "unknown-label", `label\u300C${label}\u300D\u304C labels.json \u306B\u3042\u308A\u307E\u305B\u3093`);
    }
  }
  for (const b of data.boards) {
    for (const id of b.board.issues) {
      if (!index.issues.has(id) && !index.sub(id) && !index.migrated(id)) add("warning", b.path, "dangling-board-issue", `\u30DC\u30FC\u30C9\u306B\u8F09\u3063\u3066\u3044\u308B ${id} \u304C\u3042\u308A\u307E\u305B\u3093`);
    }
  }
  const logIds = /* @__PURE__ */ new Map();
  for (const log of data.worklogs) {
    const where = `${log.path}:${log.line}`;
    const prev = logIds.get(log.id);
    if (prev !== void 0) add("error", log.path, "duplicate-worklog-id", `${log.line} \u884C\u76EE: worklog \u306E ID ${log.id} \u304C ${prev} \u3068\u91CD\u8907\u3057\u3066\u3044\u307E\u3059`);
    else logIds.set(log.id, where);
    if (!index.issues.has(log.taskId) && !index.routines.has(log.taskId)) {
      add("error", log.path, "dangling-task", `${log.line} \u884C\u76EE: task_id \u306E ${log.taskId} \u304C\u3042\u308A\u307E\u305B\u3093`);
    } else if (log.sub && !index.sub(subKey(log.taskId, log.sub))) {
      add("warning", log.path, "dangling-sub-worklog", `${log.line} \u884C\u76EE: sub \u306E ${log.sub} \u304C ${log.taskId} \u306B\u3042\u308A\u307E\u305B\u3093\uFF08\u524A\u9664\u6E08\u307F\u3068\u3057\u3066\u89AA\u306B\u542B\u3081\u307E\u3059\uFF09`);
    }
    if (log.toMs !== null && log.toMs <= log.fromMs) {
      add("error", log.path, "non-positive-worklog", `${log.line} \u884C\u76EE: to \u304C from \u4EE5\u524D\u3067\u3059`);
    }
  }
  return problems;
}

// src/core/list.ts
function defaultQuery() {
  return { text: "", statuses: [], priorities: [], labels: [], scheduled: "any", sort: "id", desc: true };
}
function nextScheduled(issue, today) {
  return issue.scheduled !== null && issue.scheduled >= today ? issue.scheduled : null;
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
function queryIssues(issues, q, today) {
  const words = q.text.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [...issues].filter((i) => {
    if (q.statuses.length > 0 ? !q.statuses.includes(i.status) : !isActive(i)) return false;
    if (q.priorities.length > 0 && !q.priorities.includes(i.priority ?? "none")) return false;
    if (q.labels.length > 0 && !q.labels.every((l) => i.labels.includes(l))) return false;
    if (q.scheduled === "yes" && i.scheduled === null) return false;
    if (q.scheduled === "no" && i.scheduled !== null) return false;
    const hay = `${i.id} ${i.summary}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  return out.sort((a, b) => {
    const va = sortValue(a, q.sort, today);
    const vb = sortValue(b, q.sort, today);
    if (va === vb) return a.id.localeCompare(b.id, "en", { numeric: true });
    if (va === null) return 1;
    if (vb === null) return -1;
    const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return q.desc ? -c : c;
  });
}

// src/core/metrics.ts
var DEFAULT_AVAILABLE_MINUTES = 240;
var DEFAULT_STALE_DAYS = 3;
function boardWorkload(index, date, availableMinutes = DEFAULT_AVAILABLE_MINUTES) {
  const board = index.board(date)?.board ?? emptyBoard();
  const items = boardItems(index, date, board);
  const activeBoardIssues = items.issues.filter((i) => !board.carried.includes(i.id));
  const activeBoardSubs = items.subs.filter((x) => !board.carried.includes(x.key));
  const totalEstimatedMinutes = activeBoardIssues.reduce((sum, i) => sum + (i.estimated ?? 0), 0) + activeBoardSubs.reduce((sum, x) => sum + (x.estimated ?? 0), 0) + items.routines.reduce((sum, r) => sum + (r.estimated ?? 0), 0);
  const rem = unfinished(index, date, board);
  const unfinishedEstimatedMinutes = rem.issues.reduce((sum, i) => sum + (i.estimated ?? 0), 0) + rem.subs.reduce((sum, x) => sum + (x.estimated ?? 0), 0) + rem.routines.reduce((sum, r) => sum + (r.estimated ?? 0), 0);
  const unestimatedCount = rem.issues.filter((i) => i.estimated === null).length + rem.subs.filter((x) => x.estimated === null).length + rem.routines.filter((r) => r.estimated === null).length;
  const overloadedByMinutes = Math.max(0, unfinishedEstimatedMinutes - availableMinutes);
  const loadRatio = availableMinutes > 0 ? Math.round(unfinishedEstimatedMinutes / availableMinutes * 100) / 100 : null;
  return {
    totalEstimatedMinutes,
    unfinishedEstimatedMinutes,
    unestimatedCount,
    availableMinutes,
    overloadedByMinutes,
    loadRatio
  };
}
function carryCounts(boards) {
  const counts = /* @__PURE__ */ new Map();
  for (const b of boards) {
    for (const id of b.board.carried) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}
function stalledIssues(index, today, staleDays = DEFAULT_STALE_DAYS) {
  const lastWorkByTask = /* @__PURE__ */ new Map();
  for (const log of index.data.worklogs) {
    const d = log.from.slice(0, 10);
    const prev = lastWorkByTask.get(log.taskId);
    if (prev === void 0 || d > prev) lastWorkByTask.set(log.taskId, d);
  }
  const threshold = addDays(today, -staleDays);
  const inProgressStale = [];
  const revisitDue = [];
  const waitingOrDelegated = [];
  for (const issue of index.data.issues) {
    if (issue.status === "in-progress") {
      const lastWorkDate = lastWorkByTask.get(issue.id) ?? null;
      const createdDate = issue.created ? issue.created.slice(0, 10) : null;
      const referenceDate = lastWorkDate ?? createdDate;
      if (referenceDate === null || referenceDate <= threshold) {
        inProgressStale.push({ issue, lastWorkDate });
      }
    } else if (issue.status === "someday" && issue.revisit !== null && issue.revisit <= today) {
      revisitDue.push(issue);
    } else if (issue.status === "waiting" || issue.status === "delegated") {
      waitingOrDelegated.push(issue);
    }
  }
  return { inProgressStale, revisitDue, waitingOrDelegated };
}
function estimationStats(index, now) {
  const efforts = index.effortMinutes(now);
  const items = [];
  let totalEstimatedMinutes = 0;
  let totalActualMinutes = 0;
  for (const issue of index.data.issues) {
    if (issue.status !== "closed" || issue.estimated === null || issue.estimated <= 0) continue;
    const actual = Math.round(efforts.get(issue.id) ?? 0);
    if (actual <= 0) continue;
    totalEstimatedMinutes += issue.estimated;
    totalActualMinutes += actual;
    items.push({
      id: issue.id,
      summary: issue.summary,
      estimatedMinutes: issue.estimated,
      actualMinutes: actual,
      diffMinutes: actual - issue.estimated,
      ratio: Math.round(actual / issue.estimated * 100) / 100
    });
  }
  const ratio = totalEstimatedMinutes > 0 ? Math.round(totalActualMinutes / totalEstimatedMinutes * 100) / 100 : null;
  return {
    sampleCount: items.length,
    totalEstimatedMinutes,
    totalActualMinutes,
    ratio,
    items
  };
}
function buildOverview(index, date, now, options = {}) {
  const availableMinutes = options.availableMinutes ?? DEFAULT_AVAILABLE_MINUTES;
  const staleDays = options.staleDays ?? DEFAULT_STALE_DAYS;
  const cautionDays = options.cautionDays ?? 3;
  const minCarryCount = options.minCarryCount ?? 2;
  const board = index.board(date)?.board ?? emptyBoard();
  const items = boardItems(index, date, board);
  const rem = unfinished(index, date, board);
  const workload = boardWorkload(index, date, availableMinutes);
  const scheduledNotOnBoard = index.toAutoAdd(date);
  const dead = deadIssues(index.data.issues, date);
  const caution = cautionIssues(index.data.issues, date, cautionDays);
  const inbox = index.data.issues.filter((i) => isInbox(i, date));
  const pending = pendingBoards(index, index.data.boards, date).map((b) => {
    const u = unfinished(index, b.date, b.board);
    return {
      date: b.date,
      unfinishedIssues: u.issues.map((i) => i.id),
      unfinishedSubs: u.subs.map((x) => x.key),
      unfinishedRoutines: u.routines.map((r) => r.id)
    };
  });
  const runningTimers = index.running().map((l) => ({
    id: l.id,
    taskId: l.taskId,
    ...l.sub ? { sub: l.sub } : {},
    summary: (l.sub ? index.sub(`${l.taskId}#${l.sub}`)?.summary : void 0) ?? index.issues.get(l.taskId)?.summary ?? index.routines.get(l.taskId)?.summary ?? null,
    from: l.from,
    elapsedMinutes: Math.max(0, Math.round((now - l.fromMs) / 6e4))
  }));
  const counts = carryCounts(index.data.boards);
  const frequentlyCarried = [...counts.entries()].filter(([, c]) => c >= minCarryCount).map(([id, count]) => ({ issue: index.issues.get(id), count })).filter((x) => x.issue !== void 0 && isActive(x.issue)).sort((a, b) => b.count - a.count);
  const stalled = stalledIssues(index, date, staleDays);
  const estimation = estimationStats(index, now);
  return {
    date,
    board: {
      closed: board.closed,
      issues: items.issues,
      subs: items.subs,
      routines: items.routines,
      unfinished: rem,
      carried: [...board.carried],
      stars: [...board.stars],
      routineResults: { ...board.routines }
    },
    workload,
    scheduledNotOnBoard,
    dead,
    caution,
    inboxCount: inbox.length,
    inboxSample: inbox.slice(0, 10),
    pendingBoards: pending,
    runningTimers,
    frequentlyCarried,
    stalled,
    estimation
  };
}

// src/core/review.ts
var DEFAULT_REVIEW = { runningHours: 4, longHours: 6, overlapCount: 3 };
var HOUR = 36e5;
function localDay(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function reviewWorklogs(index, now, options = {}, closedAt = index.closedAt()) {
  const o = {
    runningHours: options.runningHours ?? DEFAULT_REVIEW.runningHours,
    longHours: options.longHours ?? DEFAULT_REVIEW.longHours,
    overlapCount: options.overlapCount ?? DEFAULT_REVIEW.overlapCount
  };
  const logs = index.data.worklogs;
  const findings = [];
  const add = (entry, code, message) => findings.push({ entry, code, message });
  const events = logs.flatMap((l, i) => {
    const to = l.toMs ?? now;
    return to > l.fromMs ? [{ t: l.fromMs, d: 1, i }, { t: to, d: -1, i }] : [];
  }).sort((a, b) => a.t - b.t || a.d - b.d);
  const active = /* @__PURE__ */ new Set();
  const peak = /* @__PURE__ */ new Map();
  for (const e of events) {
    if (e.d === 1) active.add(e.i);
    else active.delete(e.i);
    for (const i of active) peak.set(i, Math.max(peak.get(i) ?? 0, active.size));
  }
  logs.forEach((l, i) => {
    if (!index.issues.has(l.taskId) && !index.routines.has(l.taskId)) add(l, "unknown-task", `task_id \u306E ${l.taskId} \u304C\u3042\u308A\u307E\u305B\u3093`);
    if (l.toMs === null) {
      const h2 = (now - l.fromMs) / HOUR;
      if (h2 >= o.runningHours) add(l, "still-running", `${Math.floor(h2)} \u6642\u9593\u4EE5\u4E0A\u3001\u8A18\u9332\u4E2D\u306E\u307E\u307E\u3067\u3059\uFF08\u6B62\u3081\u5FD8\u308C\uFF1F\uFF09`);
      return;
    }
    const h = (l.toMs - l.fromMs) / HOUR;
    if (h <= 0) add(l, "non-positive", "\u7D42\u4E86\u304C\u958B\u59CB\u4EE5\u524D\u3067\u3059");
    else {
      if (h >= o.longHours) add(l, "too-long", `1 \u4EF6\u3067 ${h.toFixed(1)} \u6642\u9593\u3042\u308A\u307E\u3059`);
      if (localDay(l.fromMs) !== localDay(l.toMs - 1)) add(l, "crosses-midnight", "\u65E5\u3092\u307E\u305F\u3044\u3067\u3044\u307E\u3059");
    }
    const p = peak.get(i) ?? 0;
    if (p >= o.overlapCount) add(l, "many-overlaps", `${p} \u4EF6\u306E\u30ED\u30B0\u3068\u6642\u9593\u304C\u91CD\u306A\u3063\u3066\u3044\u307E\u3059`);
    const closed = closedAt.get(l.taskId);
    if (closed !== void 0 && l.fromMs > closed) add(l, "after-close", "issue \u3092\u9589\u3058\u305F\u5F8C\u306E\u30ED\u30B0\u3067\u3059");
  });
  return findings.sort((a, b) => b.entry.fromMs - a.entry.fromMs);
}
function rawEffortMinutes(logs, now) {
  const out = /* @__PURE__ */ new Map();
  for (const l of logs) {
    const ms = (l.toMs ?? now) - l.fromMs;
    if (ms > 0) out.set(l.taskId, (out.get(l.taskId) ?? 0) + ms / 6e4);
  }
  return out;
}

// cli/read-vault.ts
var import_yaml = __toESM(require_dist(), 1);
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// src/core/load.ts
function fileKind(path) {
  if (path === LABELS_PATH) return "labels";
  if (DAILY_PATH_RE.test(path)) return "daily";
  if (WORKLOG_PATH_RE.test(path)) return "worklog";
  if (BOARD_LOG_PATH_RE.test(path)) return "board";
  if (STATUS_LOG_PATH_RE.test(path)) return "statuslog";
  const m = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
  return m ? m[1] : null;
}
function migratedIds(data) {
  const issueIds = new Set(data.issues.map((i) => i.id));
  const byOld = /* @__PURE__ */ new Map();
  for (const s of data.subIssues) {
    if (s.migratedFrom !== null && !issueIds.has(s.migratedFrom) && !byOld.has(s.migratedFrom)) byOld.set(s.migratedFrom, { parent: s.parent, id: s.id });
  }
  return byOld;
}
function resolveMigrated(data, byOld) {
  if (byOld.size === 0) return;
  data.worklogs = data.worklogs.map((l) => {
    const to = l.sub ? void 0 : byOld.get(l.taskId);
    return to ? { ...l, taskId: to.parent, sub: to.id } : l;
  });
  data.statusLogs = data.statusLogs.map((e) => {
    const to = e.sub ? void 0 : byOld.get(e.task);
    return to ? { ...e, task: to.parent, sub: to.id } : e;
  });
}
function collectVault(input) {
  const data = { issues: [], subIssues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], statusLogs: [], orders: [] };
  const problems = [];
  const initialBoards = /* @__PURE__ */ new Map();
  for (const { path, frontmatter, text } of [...input.markdown].sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }))) {
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
      const r = parseIssue(path, frontmatter);
      problems.push(...r.problems);
      if (r.value) {
        data.issues.push(r.value);
        if (text !== void 0 && input.parseYaml) {
          const s = parseSubIssues(path, r.value.id, text, input.parseYaml);
          problems.push(...s.problems);
          data.subIssues.push(...s.subs);
        }
      }
    } else if (kind === "routine") {
      const r = parseRoutine(path, frontmatter);
      problems.push(...r.problems);
      if (r.value) data.routines.push(r.value);
    } else {
      const r = parseMember(path, frontmatter);
      problems.push(...r.problems);
      if (r.value) data.members.push(r.value);
    }
  }
  for (const { path, text } of [...input.worklogs].sort((a, b) => a.path.localeCompare(b.path))) {
    const r = parseWorklog(path, text);
    problems.push(...r.problems);
    data.worklogs.push(...r.entries);
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
  for (const { path, text } of [...input.boardLogs ?? []].sort((a, b) => a.path.localeCompare(b.path))) {
    const r = parseBoardLog(path, text);
    problems.push(...r.problems);
    const entries = byOld.size === 0 ? r.entries : r.entries.map((e) => ({ ...e, op: renameBoardOp(e.op, renameKey) }));
    allLogs.push(...entries);
    for (const e of entries) logsByDate.set(e.date, [...logsByDate.get(e.date) ?? [], e]);
  }
  for (const date of [.../* @__PURE__ */ new Set([...initialBoards.keys(), ...logsByDate.keys()])].sort()) {
    const logs = logsByDate.get(date) ?? [];
    const removed = removedTasks(logs);
    data.boards.push({
      date,
      path: dailyNotePath(date),
      board: replayBoard(initialBoards.get(date) ?? emptyBoard(), logs),
      ...logs.length > 0 ? { latestAt: Math.max(...logs.map((e) => e.atMs)) } : {},
      ...removed.length > 0 ? { removed } : {}
    });
  }
  data.orders = orderHistory(allLogs);
  for (const { path, text } of [...input.statusLogs ?? []].sort((a, b) => a.path.localeCompare(b.path))) {
    const r = parseStatusLog(path, text);
    problems.push(...r.problems);
    data.statusLogs.push(...r.entries);
  }
  data.statusLogs.sort(compareStatusLog);
  resolveMigrated(data, byOld);
  if (input.labels !== null) {
    const r = parseLabels(input.labels);
    problems.push(...r.problems);
    data.labels = r.labels;
  }
  return { data, problems };
}

// cli/read-vault.ts
function walk(root, dir = root, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(root, p, out);
    else out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
}
var FRONTMATTER_RE2 = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
function readFrontmatter(text) {
  const m = FRONTMATTER_RE2.exec(text);
  if (!m) return null;
  try {
    const value = (0, import_yaml.parse)(m[1]);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function readVault(root) {
  const paths = walk(root);
  const input = { markdown: [], worklogs: [], labels: null, boardLogs: [], statusLogs: [], parseYaml: import_yaml.parse };
  for (const path of paths) {
    const kind = fileKind(path);
    if (kind === null) continue;
    const text = readFileSync(join(root, path), "utf8");
    if (kind === "worklog") input.worklogs.push({ path, text });
    else if (kind === "board") input.boardLogs.push({ path, text });
    else if (kind === "statuslog") input.statusLogs.push({ path, text });
    else if (kind === "labels") input.labels = text;
    else input.markdown.push({ path, frontmatter: readFrontmatter(text), ...kind === "issue" ? { text } : {} });
  }
  const { data, problems } = collectVault(input);
  return { data, problems, paths };
}

// cli/vault-ops.ts
var import_yaml2 = __toESM(require_dist(), 1);
import { existsSync, mkdirSync, readFileSync as readFileSync2, writeFileSync } from "node:fs";
import { dirname, resolve, sep as sep2 } from "node:path";

// src/core/actions.ts
function cancelPatch() {
  return { status: "canceled", soft_deadline: null, deadline: null, delegated_to: null, revisit: null, tickler: null };
}
function closePatch() {
  return { status: "closed", delegated_to: null, revisit: null, tickler: null };
}
function inboxPatch() {
  return { status: "open", clarified: null, delegated_to: null, revisit: null, tickler: null };
}
function backToNextPatch() {
  return { scheduled: null, tickler: null, clarified: true };
}
function ticklerPatch(issue, date) {
  return { tickler: date, ...issue.status === "someday" ? reopenPatch() : {} };
}
function somedayPatch(revisit = null) {
  return { status: "someday", scheduled: null, soft_deadline: null, deadline: null, delegated_to: null, revisit, tickler: null };
}
function reopenPatch() {
  return { status: "open", revisit: null };
}

// src/core/format.ts
var MINUTES_PER_DAY = 24 * 60;
function formatMinutes(minutes) {
  const sign = minutes < 0 ? "-" : "";
  let rest = Math.round(Math.abs(minutes));
  const d = Math.floor(rest / MINUTES_PER_DAY);
  rest -= d * MINUTES_PER_DAY;
  const h = Math.floor(rest / 60);
  const m = rest - h * 60;
  const parts = [d ? `${d}d` : "", h ? `${h}h` : "", m ? `${m}m` : ""].join("");
  return sign + (parts || "0m");
}

// src/core/summary.ts
var SECTION = "## Task board";
function hm(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function sameLocalDate(ms, date) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === date;
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
  const statusOf = (id) => index.issues.get(id)?.status ?? index.sub(id)?.status;
  const closed = present.filter((id) => statusOf(id) === "closed");
  const others = present.filter((id) => !closed.includes(id));
  const routines = Object.entries(board.routines);
  lines.push("### \u5B8C\u4E86", "");
  if (closed.length === 0 && routines.every(([, r]) => r !== "closed")) lines.push("- \u306A\u3057");
  for (const id of closed) lines.push(`- ${link(id)}`);
  for (const [id, r] of routines) if (r === "closed") lines.push(`- ${link(id)}`);
  if (others.length > 0 || routines.some(([, r]) => r === "canceled")) {
    lines.push("", "### \u6301\u3061\u8D8A\u3057\u30FB\u4E2D\u6B62", "");
    for (const id of others) {
      const note = board.carried.includes(id) ? "\u6301\u3061\u8D8A\u3057" : statusOf(id) ?? "?";
      lines.push(`- ${link(id)}\uFF08${note}\uFF09`);
    }
    for (const [id, r] of routines) if (r === "canceled") lines.push(`- ${link(id)}\uFF08canceled\uFF09`);
  }
  const logs = index.data.worklogs.filter((l) => sameLocalDate(l.fromMs, date) && l.toMs !== null).sort((a, b) => a.fromMs - b.fromMs);
  if (logs.length > 0) {
    lines.push("", "### worklog", "");
    for (const l of logs) {
      const desc = l.description ? ` ${l.description}` : "";
      lines.push(`- ${hm(l.fromMs)}\u2013${hm(l.toMs)}\uFF08${formatMinutes((l.toMs - l.fromMs) / 6e4)}\uFF09 ${link(l.sub ? `${l.taskId}#${l.sub}` : l.taskId)}${desc}`);
    }
  }
  return `${lines.join("\n")}
`;
}
function upsertSummary(text, summary) {
  const fm = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
  const head = fm ? fm[0] : "";
  const body = text.slice(head.length);
  const start = body.split("\n").findIndex((l) => l.trim() === SECTION);
  if (start < 0) {
    const sep4 = body.length === 0 || body.endsWith("\n\n") ? "" : body.endsWith("\n") ? "\n" : "\n\n";
    return head + body + sep4 + summary;
  }
  const lines = body.split("\n");
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = lines.length;
  const after = lines.slice(end).join("\n");
  return head + [...lines.slice(0, start), summary.trimEnd(), ...after ? ["", after] : [""]].join("\n");
}

// src/core/board-note.ts
function closeBoardNote(text, date, index, board) {
  if (!isLocalDate(date)) throw new Error("\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059");
  if (/^(?:<{7}|={7}|>{7})(?: |\r?$)/m.test(text)) throw new Error("\u540C\u671F\u306E\u7AF6\u5408\u3092\u89E3\u6D88\u3057\u3066\u304B\u3089\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3066\u304F\u3060\u3055\u3044");
  const remaining = unfinished(index, date, board);
  if (unfinishedCount(remaining) > 0) throw new Error("\u672A\u5B8C\u4E86\u306E\u30BF\u30B9\u30AF\u304C\u3042\u308B\u305F\u3081\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3089\u308C\u307E\u305B\u3093");
  return upsertSummary(text, boardSummary(index, date, board));
}

// cli/vault-ops.ts
function resolveInVault(root, relPath) {
  const absRoot = resolve(root);
  const absTarget = resolve(absRoot, relPath);
  if (absTarget !== absRoot && !absTarget.startsWith(`${absRoot}${sep2}`)) {
    throw new Error(`Vault \u306E\u5916\u306E\u30D1\u30B9\u306B\u306F\u30A2\u30AF\u30BB\u30B9\u3067\u304D\u307E\u305B\u3093: ${relPath}`);
  }
  return absTarget;
}
function readTextOrEmpty(root, relPath) {
  const full = resolveInVault(root, relPath);
  return existsSync(full) ? readFileSync2(full, "utf8") : "";
}
function writeTextInVault(root, relPath, text) {
  const full = resolveInVault(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text, "utf8");
}
function readMarkdownBody(root, relPath) {
  const text = readTextOrEmpty(root, relPath);
  const range = frontmatterRange(text);
  return range ? text.slice(range.to) : text;
}
function appendStatusLogOnDisk(root, task, from, to, log, sub = null) {
  const dev = sanitizeDeviceName(log.device);
  if (!dev) return;
  const line = statusLogLine(task, from, to, log.via, log.now, Math.random, sub);
  if (line === null) return;
  const relPath = statusLogPath(dev, log.now);
  writeTextInVault(root, relPath, appendWorklogLine(readTextOrEmpty(root, relPath), line));
}
function updateIssueFrontmatter(root, relPath, fields, log) {
  const full = resolveInVault(root, relPath);
  if (!existsSync(full)) throw new Error(`\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u305B\u3093: ${relPath}`);
  const text = readFileSync2(full, "utf8");
  const range = frontmatterRange(text);
  if (!range) throw new Error(`frontmatter \u304C\u3042\u308A\u307E\u305B\u3093: ${relPath}`);
  const rawYaml = text.slice(text.indexOf("\n") + 1, range.to).replace(/\r?\n---\r?\n?$/, "");
  const parsed = (0, import_yaml2.parse)(rawYaml);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`frontmatter \u304C\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${relPath}`);
  }
  const fm = { ...parsed };
  const fromStatus = fm.status;
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === void 0 || value === "" || Array.isArray(value) && value.length === 0) {
      delete fm[key];
    } else {
      fm[key] = value;
    }
  }
  const check = parseIssue(relPath, fm);
  const errors = check.problems.filter((p) => p.severity === "error");
  if (!check.value || errors.length > 0) {
    throw new Error(`\u4E0D\u6B63\u306A frontmatter \u3067\u3059: ${errors.map((e) => e.message).join(", ") || "ID \u304C\u8AAD\u3081\u307E\u305B\u3093"}`);
  }
  const nextYaml = (0, import_yaml2.stringify)(fm).trimEnd();
  const body = text.slice(range.to);
  writeFileSync(full, `---
${nextYaml}
---
${body}`, "utf8");
  if (log && typeof fromStatus === "string" && STATUSES.includes(fromStatus)) {
    appendStatusLogOnDisk(root, check.value.id, fromStatus, check.value.status, log);
  }
  return check.value;
}
function appendBoardOpsOnDisk(root, index, date, device, ops, now) {
  if (!isLocalDate(date)) throw new Error(`\u65E5\u4ED8\u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(date)}`);
  const dev = sanitizeDeviceName(device);
  if (!dev) throw new Error("\u7AEF\u672B\u540D\u304C\u7A7A\u3067\u3059");
  if (ops.length === 0) return;
  const relPath = boardLogPath(dev, date);
  const current = readTextOrEmpty(root, relPath);
  let latest = index.board(date)?.latestAt ?? null;
  const nowMs = now.getTime();
  const next = ops.reduce((acc, op) => {
    latest = nextBoardAt(nowMs, latest);
    const line = serializeBoardLogEntry({
      id: newBoardLogId(),
      at: new Date(latest).toISOString(),
      date,
      ...op
    });
    return appendWorklogLine(acc, line);
  }, current);
  writeTextInVault(root, relPath, next);
}
function assertBoardKey(index, key) {
  if (!index.issues.has(key) && !index.sub(key)) throw new Error(`issue \u307E\u305F\u306F\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
}
function addToBoardOnDisk(root, index, date, issueIds, device, now) {
  if (!isLocalDate(date)) throw new Error(`\u65E5\u4ED8\u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(date)}`);
  if (!Array.isArray(issueIds) || issueIds.length === 0) throw new Error("issue_ids \u3092 1 \u4EF6\u4EE5\u4E0A\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  for (const id of issueIds) assertBoardKey(index, id);
  appendBoardOpsOnDisk(
    root,
    index,
    date,
    device,
    issueIds.map((task) => ({ op: "add", task })),
    now
  );
}
function removeFromBoardOnDisk(root, index, date, issueId, device, now) {
  assertBoardKey(index, issueId);
  appendBoardOpsOnDisk(root, index, date, device, [{ op: "remove", task: issueId }], now);
}
function laneOfKey(index, date, key) {
  if (!isLocalDate(date)) throw new Error(`\u65E5\u4ED8\u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(date)}`);
  const board = index.board(date)?.board ?? emptyBoard();
  const lanes = boardLanes(index, date, board);
  const lane = Object.keys(lanes).find((l) => lanes[l].some((c) => c.key === key));
  if (!lane) throw new Error(`${key} \u306F ${date} \u306E\u30DC\u30FC\u30C9\u306B\u8F09\u3063\u3066\u3044\u307E\u305B\u3093`);
  return { board, lanes, lane };
}
function orderCardOnDisk(root, index, date, key, before, device, now) {
  const { board, lanes, lane } = laneOfKey(index, date, key);
  if (lane === "working" || lane === "done" || lane === "routine" || lane === "watch") throw new Error(`${key} \u306F\u4E26\u3079\u66FF\u3048\u3089\u308C\u306A\u3044\u6B04\uFF08${lane}\uFF09\u306B\u3042\u308A\u307E\u3059`);
  if (before !== null && !lanes[lane].some((c) => c.key === before)) throw new Error(`before\uFF08${before}\uFF09\u306F ${key} \u3068\u540C\u3058\u6B04\u306B\u3042\u308A\u307E\u305B\u3093`);
  appendBoardOpsOnDisk(root, index, date, device, moveOps(lanes, board, key, lane, before, index.order(date)), now);
}
function starCardOnDisk(root, index, date, key, on, device, now) {
  if (typeof on !== "boolean") throw new Error("on \u306F true \u304B false \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const { board, lanes, lane } = laneOfKey(index, date, key);
  if (on && lane === "routine") throw new Error(`${key} \u306F routine \u306A\u306E\u3067 \u2605 \u3092\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093`);
  if (on && lane === "watch") throw new Error(`${key} \u306F\u5F85\u3063\u3066\u3044\u308B\uFF08waiting / delegated\uFF09\u306E\u3067 \u2605 \u3092\u4ED8\u3051\u3089\u308C\u307E\u305B\u3093`);
  if (on && !board.stars.includes(key) && !canStar(lanes)) throw new Error(`\u2605 \u306F ${TOP_LIMIT} \u4EF6\u307E\u3067\u3067\u3059\u3002\u307B\u304B\u306E \u2605 \u3092\u5916\u3057\u3066\u304B\u3089\u4ED8\u3051\u3066\u304F\u3060\u3055\u3044`);
  appendBoardOpsOnDisk(root, index, date, device, [{ op: "star", task: key, on }], now);
}
function setRoutineResultOnDisk(root, index, date, routineId, result, device, now) {
  if (!index.routines.has(routineId)) throw new Error(`routine \u304C\u3042\u308A\u307E\u305B\u3093: ${routineId}`);
  if (result !== null && result !== "closed" && result !== "canceled") {
    throw new Error(`routine \u306E\u7D50\u679C\u306F closed / canceled / null \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(result)}`);
  }
  appendBoardOpsOnDisk(root, index, date, device, [{ op: "routine", task: routineId, result }], now);
}
function carryIssuesOnDisk(root, index, date, issueIds, mode, to, device, now) {
  if (!isLocalDate(date)) throw new Error(`\u65E5\u4ED8\u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(date)}`);
  if (!Array.isArray(issueIds) || issueIds.length === 0) throw new Error("issue_ids \u3092 1 \u4EF6\u4EE5\u4E0A\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  const kind = mode === "reschedule" ? "move" : mode;
  if (!["today", "next", "move", "tickler", "inbox"].includes(kind)) throw new Error("mode \u306F today / next / move / tickler / inbox \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  if ((kind === "move" || kind === "tickler") && (to === null || !isLocalDate(to))) {
    throw new Error(`reschedule_to \u306B YYYY-MM-DD \u306E\u65E5\u4ED8\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044: ${String(to)}`);
  }
  const board = index.board(date)?.board ?? emptyBoard();
  for (const id of issueIds) {
    assertBoardKey(index, id);
    if (!board.issues.includes(id)) throw new Error(`${id} \u306F ${date} \u306E\u30DC\u30FC\u30C9\u306B\u8F09\u3063\u3066\u3044\u307E\u305B\u3093`);
    if ((kind === "inbox" || kind === "tickler") && index.sub(id)) throw new Error(`\u30B5\u30D6\u306F ${kind} \u306B\u3067\u304D\u307E\u305B\u3093: ${id}`);
  }
  for (const id of issueIds) {
    const issue = index.issues.get(id);
    if (issue) {
      const patch = kind === "inbox" ? inboxPatch() : kind === "next" ? backToNextPatch() : kind === "move" ? { scheduled: to } : kind === "tickler" ? ticklerPatch(issue, to) : null;
      if (patch) updateIssueFrontmatter(root, issue.path, patch, { device, now, via: "mcp" });
      continue;
    }
    const sub = index.sub(id);
    if (kind === "next" && sub.scheduled !== null) updateSubIssueOnDisk(root, index, id, { scheduled: null });
    if (kind === "move") updateSubIssueOnDisk(root, index, id, { scheduled: to });
  }
  if (kind === "today") {
    const today = localToday(now);
    appendBoardOpsOnDisk(root, index, today, device, issueIds.map((task) => ({ op: "add", task })), now);
  }
  appendBoardOpsOnDisk(
    root,
    index,
    date,
    device,
    issueIds.map((task) => ({ op: "carry", task })),
    now
  );
}
function closeBoardOnDisk(root, index, date, device, now) {
  if (!isLocalDate(date)) throw new Error(`\u65E5\u4ED8\u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(date)}`);
  const board = index.board(date)?.board ?? emptyBoard();
  if (board.closed) return { date, closed: true, alreadyClosed: true };
  const noteRelPath = dailyNotePath(date);
  const existing = readTextOrEmpty(root, noteRelPath) || newDailyContent(localDateTime(now));
  const updatedNote = closeBoardNote(existing, date, index, board);
  writeTextInVault(root, noteRelPath, updatedNote);
  appendBoardOpsOnDisk(root, index, date, device, [{ op: "close", tasks: board.issues }], now);
  return { date, closed: true, alreadyClosed: false };
}
function createIssueOnDisk(root, index, input, device, now) {
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  if (!summary) throw new Error("summary \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  const scheduled = input.scheduled ?? null;
  if (scheduled !== null && !isLocalDate(scheduled)) throw new Error(`scheduled \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(scheduled)}`);
  if (input.tickler !== void 0 && input.tickler !== null && !isLocalDate(input.tickler)) throw new Error(`tickler \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.tickler)}`);
  if (input.add_to_board_date && !isLocalDate(input.add_to_board_date)) {
    throw new Error(`add_to_board_date \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.add_to_board_date)}`);
  }
  const labelNames = new Set(index.data.labels.map((l) => l.name));
  for (const l of input.labels ?? []) {
    if (!labelNames.has(l)) throw new Error(`label\u300C${l}\u300D\u304C labels.json \u306B\u3042\u308A\u307E\u305B\u3093`);
  }
  if (input.priority !== void 0 && input.priority !== null && !PRIORITIES.includes(input.priority)) {
    throw new Error(`priority \u304C\u4E0D\u6B63\u3067\u3059: ${String(input.priority)}`);
  }
  if (input.estimated !== void 0 && input.estimated !== null && (typeof input.estimated !== "number" || input.estimated < 0)) {
    throw new Error(`estimated \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(input.estimated)}`);
  }
  if (input.soft_deadline !== void 0 && input.soft_deadline !== null && !isLocalDate(input.soft_deadline)) {
    throw new Error(`soft_deadline \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.soft_deadline)}`);
  }
  if (input.deadline !== void 0 && input.deadline !== null && !isLocalDate(input.deadline)) {
    throw new Error(`deadline \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.deadline)}`);
  }
  if (input.clarified !== void 0 && typeof input.clarified !== "boolean") throw new Error("clarified \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const taken = [...index.issues.keys(), ...index.routines.keys(), ...index.members.keys()];
  const [id] = nextIds("i", taken, 1);
  const relPath = pathForId(id);
  writeTextInVault(root, relPath, newIssueContent(id, summary, localDateTime(now), { scheduled }));
  const extra = {};
  if (input.priority !== void 0) extra.priority = input.priority;
  if (input.labels !== void 0 && input.labels.length > 0) extra.labels = input.labels;
  if (input.estimated !== void 0) extra.estimated = input.estimated;
  if (input.soft_deadline !== void 0) extra.soft_deadline = input.soft_deadline;
  if (input.deadline !== void 0) extra.deadline = input.deadline;
  if (input.clarified === true) extra.clarified = true;
  if (input.tickler) extra.tickler = input.tickler;
  const issue = Object.keys(extra).length > 0 ? updateIssueFrontmatter(root, relPath, extra) : parseIssue(relPath, {
    type: "issue",
    id,
    summary,
    status: "open",
    scheduled,
    created: localDateTime(now)
  }).value;
  if (input.add_to_board_date) {
    appendBoardOpsOnDisk(root, index, input.add_to_board_date, device, [{ op: "add", task: id }], now);
  }
  return issue;
}
function updateIssueOnDisk(root, index, input, log) {
  const current = index.issues.get(input.id);
  if (!current) throw new Error(`issue \u304C\u3042\u308A\u307E\u305B\u3093: ${input.id}`);
  const patch = {};
  if (input.summary !== void 0) {
    const s = input.summary.trim();
    if (!s) throw new Error("summary \u3092\u7A7A\u306B\u306F\u3067\u304D\u307E\u305B\u3093");
    patch.summary = s;
  }
  if (input.status !== void 0) {
    if (!STATUSES.includes(input.status)) throw new Error(`status \u304C\u4E0D\u6B63\u3067\u3059: ${String(input.status)}`);
    if (input.status === "closed") Object.assign(patch, closePatch());
    else if (input.status === "canceled") Object.assign(patch, cancelPatch());
    else if (input.status === "someday") Object.assign(patch, somedayPatch(input.revisit ?? current.revisit));
    else patch.status = input.status;
  }
  if (input.status_detail !== void 0) {
    if (input.status_detail !== null && input.status_detail.length > STATUS_DETAIL_MAX) {
      throw new Error(`status-detail \u306F ${STATUS_DETAIL_MAX} \u6587\u5B57\u4EE5\u5185\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    }
    patch["status-detail"] = input.status_detail;
  }
  if (input.delegated_to !== void 0) {
    if (input.delegated_to !== null && !index.members.has(input.delegated_to)) {
      throw new Error(`delegated_to \u306E member \u304C\u3042\u308A\u307E\u305B\u3093: ${input.delegated_to}`);
    }
    patch.delegated_to = input.delegated_to;
  }
  const nextStatus = patch.status ?? current.status;
  const nextDelegatedTo = input.delegated_to !== void 0 ? input.delegated_to : current.delegatedTo;
  if (nextStatus === "delegated" && !nextDelegatedTo) {
    throw new Error("status \u3092 delegated \u306B\u3059\u308B\u3068\u304D\u306F delegated_to \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  }
  if (input.priority !== void 0) {
    if (input.priority !== null && !PRIORITIES.includes(input.priority)) {
      throw new Error(`priority \u304C\u4E0D\u6B63\u3067\u3059: ${String(input.priority)}`);
    }
    patch.priority = input.priority;
  }
  if (input.labels !== void 0) {
    const labelNames = new Set(index.data.labels.map((l) => l.name));
    for (const l of input.labels) {
      if (!labelNames.has(l)) throw new Error(`label\u300C${l}\u300D\u304C labels.json \u306B\u3042\u308A\u307E\u305B\u3093`);
    }
    patch.labels = input.labels;
  }
  if (input.scheduled !== void 0) {
    if (input.scheduled !== null && !isLocalDate(input.scheduled)) throw new Error(`scheduled \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.scheduled)}`);
    patch.scheduled = input.scheduled;
  }
  if (input.tickler !== void 0) {
    if (input.tickler !== null && !isLocalDate(input.tickler)) throw new Error(`tickler \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.tickler)}`);
    patch.tickler = input.tickler;
  }
  if (input.soft_deadline !== void 0) {
    if (input.soft_deadline !== null && !isLocalDate(input.soft_deadline)) throw new Error(`soft_deadline \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.soft_deadline)}`);
    patch.soft_deadline = input.soft_deadline;
  }
  if (input.deadline !== void 0) {
    if (input.deadline !== null && !isLocalDate(input.deadline)) throw new Error(`deadline \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.deadline)}`);
    patch.deadline = input.deadline;
  }
  if (input.revisit !== void 0) {
    if (input.revisit !== null && !isLocalDate(input.revisit)) throw new Error(`revisit \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.revisit)}`);
    patch.revisit = input.revisit;
  }
  if (input.reviewed !== void 0) {
    if (input.reviewed !== null && !isLocalDate(input.reviewed)) throw new Error(`reviewed \u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059: ${String(input.reviewed)}`);
    patch.reviewed = input.reviewed;
  }
  if (input.estimated !== void 0) {
    if (input.estimated !== null && (typeof input.estimated !== "number" || input.estimated < 0)) {
      throw new Error(`estimated \u306F 0 \u4EE5\u4E0A\u306E\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044: ${String(input.estimated)}`);
    }
    patch.estimated = input.estimated;
  }
  if (input.clarified !== void 0) {
    if (input.clarified !== null && typeof input.clarified !== "boolean") throw new Error("clarified \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
    patch.clarified = input.clarified === true ? true : null;
  }
  const hasDatesAdded = patch.scheduled !== void 0 && patch.scheduled !== null || patch.tickler !== void 0 && patch.tickler !== null || patch.soft_deadline !== void 0 && patch.soft_deadline !== null || patch.deadline !== void 0 && patch.deadline !== null;
  if (current.status === "someday" && input.status === void 0 && hasDatesAdded) {
    patch.status = "open";
    patch.revisit = null;
  }
  const updated = updateIssueFrontmatter(root, current.path, patch, log ? { ...log, via: "mcp" } : void 0);
  if (updated.status !== current.status) unstarOnDisk(root, index, current.id, updated.status, log);
  if (isDoneStatus(updated.status) && !isDoneStatus(current.status)) stopTimerOnDisk(root, index, [current.id], log?.now ?? /* @__PURE__ */ new Date());
  return updated;
}
function unstarOnDisk(root, index, key, to, log) {
  if (!log || !sanitizeDeviceName(log.device)) return;
  const today = localToday(log.now);
  appendBoardOpsOnDisk(root, index, today, log.device, unstarOps(index, today, key, to), log.now);
}
function updateSubIssueOnDisk(root, index, key, patch, log) {
  const current = index.sub(key);
  if (!current) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
  patch = normalizeSubPatch(patch);
  const siblings = index.subs(current.parent).map((s) => s.id === current.id ? { ...s, ...patch, id: s.id } : s);
  assertSubIssues(index, siblings, [current.id]);
  const text = readTextOrEmpty(root, current.path);
  const r = updateSubIssueText(current.path, current.parent, text, current.id, patch, import_yaml2.parse);
  writeTextInVault(root, current.path, r.text);
  if (log && r.before.status !== r.after.status) {
    appendStatusLogOnDisk(root, current.parent, r.before.status, r.after.status, log, current.id);
    unstarOnDisk(root, index, key, r.after.status, log);
    if (isDoneStatus(r.after.status) && !isDoneStatus(r.before.status)) stopTimerOnDisk(root, index, [key], log.now);
  }
  return r.after;
}
function assertSubIssues(index, subs, touched) {
  const errors = touchedSubErrors(subs, touched, new Set(index.members.keys()));
  if (errors.length > 0) throw new Error(errors.join("\n"));
}
function createSubIssuesOnDisk(root, index, parent, items, now, at) {
  const issue = index.issues.get(parent);
  if (!issue) throw new Error(`issue \u304C\u3042\u308A\u307E\u305B\u3093: ${parent}`);
  if (!Array.isArray(items) || items.length === 0) throw new Error("items \u3092 1 \u4EF6\u4EE5\u4E0A\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  const existing = index.subs(parent);
  const taken = existing.map((s) => s.id);
  const created = localDateTime(now);
  const subs = items.map((item) => {
    const id = newSubId(taken);
    taken.push(id);
    return newSubIssueInput(item, id, created);
  });
  assertSubIssues(index, [...existing, ...subs], subs.map((s) => s.id));
  const text = readTextOrEmpty(root, issue.path);
  writeTextInVault(root, issue.path, insertSubIssuesText(issue.path, parent, text, subs, import_yaml2.parse, at));
  return subs.map((s) => subKey(parent, s.id));
}
function moveSubIssueOnDisk(root, index, key, to) {
  const sub = index.sub(key);
  if (!sub) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
  const text = readTextOrEmpty(root, sub.path);
  writeTextInVault(root, sub.path, moveSubIssueText(sub.path, sub.parent, text, sub.id, to, import_yaml2.parse));
}
function deleteSubIssueOnDisk(root, index, key, now) {
  const sub = index.sub(key);
  if (!sub) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${key}`);
  const dependents = dependentsOf(index.subs(sub.parent), sub.id);
  if (dependents.length > 0) throw new Error(`\u30B5\u30D6 ${sub.id} \u306F ${dependents.join(", ")} \u306E depends_on \u306B\u3042\u308A\u307E\u3059\u3002\u5148\u306B\u5916\u3057\u3066\u304F\u3060\u3055\u3044`);
  stopTimerOnDisk(root, index, [key], now);
  const text = readTextOrEmpty(root, sub.path);
  writeTextInVault(root, sub.path, removeSubIssueText(sub.path, sub.parent, text, sub.id, import_yaml2.parse));
}
function startTimerOnDisk(root, index, taskIds, device, now) {
  const dev = sanitizeDeviceName(device);
  if (!dev) throw new Error("\u7AEF\u672B\u540D\u304C\u7A7A\u3067\u3059");
  if (!Array.isArray(taskIds) || taskIds.length === 0) throw new Error("task_ids \u3092 1 \u4EF6\u4EE5\u4E0A\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  for (const id of taskIds) {
    if (parseSubKey(id) !== null) {
      if (!index.sub(id)) throw new Error(`\u30B5\u30D6\u304C\u3042\u308A\u307E\u305B\u3093: ${id}`);
    } else if (!index.issues.has(id) && !index.routines.has(id)) {
      throw new Error(`issue \u307E\u305F\u306F routine \u304C\u3042\u308A\u307E\u305B\u3093: ${id}`);
    }
  }
  const running = new Set(index.running().map(workKey));
  const targets = taskIds.filter((id) => !running.has(id));
  if (targets.length === 0) return [];
  const from = localDateTime(now);
  const relPath = worklogPath(dev, now);
  const current = readTextOrEmpty(root, relPath);
  const next = targets.reduce(
    (acc, key) => appendWorklogLine(acc, serializeWorklogEntry({ id: newWorklogId(), ...workTarget(key), from, to: null, description: "" })),
    current
  );
  writeTextInVault(root, relPath, next);
  for (const id of targets) {
    const sub = index.sub(id);
    if (sub) {
      if (sub.status === "open") updateSubIssueOnDisk(root, index, id, { status: "in-progress" }, { device: dev, now, via: "timer" });
      continue;
    }
    const issue = index.issues.get(id);
    if (issue?.status === "open") updateIssueFrontmatter(root, issue.path, { status: "in-progress" }, { device: dev, now, via: "timer" });
  }
  return targets;
}
function stopTimerOnDisk(root, index, taskIds, now) {
  const running = index.running().filter((l) => !taskIds || taskIds.length === 0 || taskIds.includes(workKey(l)));
  if (running.length === 0) return [];
  const to = localDateTime(now);
  const toMs = now.getTime();
  const byFile = /* @__PURE__ */ new Map();
  for (const e of running) {
    byFile.set(e.path, [...byFile.get(e.path) ?? [], e]);
  }
  for (const [relPath, entries] of byFile) {
    const current = readTextOrEmpty(root, relPath);
    const next = stopWorklogLines(current, entries, to, toMs);
    writeTextInVault(root, relPath, next);
  }
  return running.map(workKey);
}
function appendDailyNoteOnDisk(root, date, heading, content, now) {
  if (!isLocalDate(date)) throw new Error(`\u65E5\u4ED8\u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(date)}`);
  const cleanHeading = heading.trim().replace(/^#+\s*/, "");
  const cleanContent = content.trim();
  if (!cleanHeading) throw new Error("heading \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  if (!cleanContent) throw new Error("content \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  const relPath = dailyNotePath(date);
  const existing = readTextOrEmpty(root, relPath) || newDailyContent(localDateTime(now));
  const sepLine = existing.endsWith("\n") ? "\n" : "\n\n";
  const appended = `${existing}${sepLine}## ${cleanHeading}

${cleanContent}
`;
  writeTextInVault(root, relPath, appended);
  return { path: relPath };
}

// cli/mcp-log.ts
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync as existsSync2, mkdirSync as mkdirSync2, readdirSync as readdirSync2, readFileSync as readFileSync3, statSync as statSync2 } from "node:fs";
import { isAbsolute, join as join2, relative as relative2, sep as sep3 } from "node:path";
var ERROR_KINDS = ["ownership", "validation", "not_found", "conflict", "unknown_tool", "internal"];
var FEEDBACK_KINDS = ["missing", "wrong", "large", "slow", "unclear", "rejected", "bypass"];
function logDir(root) {
  return existsSync2(join2(root, ".kit-local")) ? join2(root, ".claude/mcp-log") : join2(root, ".kit/harness/mcp-log");
}
function logEnabled(env = process.env) {
  return (env.PKM_MCP_LOG ?? "").toLowerCase() !== "off";
}
var pad = (n) => String(n).padStart(2, "0");
function monthDir(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function stamp(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
var McpLogger = class _McpLogger {
  constructor(root, fileName, start, now = () => /* @__PURE__ */ new Date()) {
    this.root = root;
    this.now = now;
    this.path = join2(logDir(root), monthDir(start), fileName);
  }
  root;
  now;
  path;
  /** サーバーの起動 1 回ぶんのロガー */
  static forServer(root, now = () => /* @__PURE__ */ new Date()) {
    const start = now();
    return new _McpLogger(root, `${stamp(start)}-${randomBytes(3).toString("hex")}.jsonl`, start, now);
  }
  write(kind, fields) {
    const line = { ts: this.now().toISOString(), kind, ...fields };
    try {
      mkdirSync2(join2(this.path, ".."), { recursive: true });
      appendFileSync(this.path, `${JSON.stringify(line)}
`);
    } catch {
    }
  }
};
var KEEP_KEYS = /* @__PURE__ */ new Set([
  "id",
  "ids",
  "key",
  "issue_id",
  "issue_ids",
  "task_ids",
  "routine_id",
  "parent",
  "before",
  "date",
  "from",
  "to",
  "today",
  "status",
  "statuses",
  "priority",
  "priorities",
  "sort",
  "desc",
  "mode",
  "type",
  "scope",
  "kind",
  "tool",
  "scheduled",
  "result",
  "on",
  "full",
  "limit",
  "cursor",
  "inbox_only",
  "available_minutes",
  "stale_days",
  "caution_days",
  "days",
  "position",
  "estimated"
]);
var QUERY_KEYS = /* @__PURE__ */ new Set(["query", "text"]);
var PATH_KEYS = /* @__PURE__ */ new Set(["path", "path_prefix"]);
function summarizeArgs(args) {
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === void 0) continue;
    if (QUERY_KEYS.has(k) && typeof v === "string") out[k] = v.slice(0, 100);
    else if (PATH_KEYS.has(k) && typeof v === "string") out[k] = { area: pathArea(v) };
    else if (KEEP_KEYS.has(k) && isSmall(v)) out[k] = v;
    else if (typeof v === "string") out[k] = { len: v.length };
    else if (Array.isArray(v)) out[k] = { n: v.length };
    else if (v !== null && typeof v === "object") out[k] = { keys: Object.keys(v) };
    else out[k] = typeof v;
  }
  return out;
}
function isSmall(v) {
  if (v === null || typeof v === "number" || typeof v === "boolean") return true;
  if (typeof v === "string") return v.length <= 40;
  if (Array.isArray(v)) return v.length <= 20 && v.every((x) => typeof x === "string" && x.length <= 40);
  return false;
}
function errorKind(message) {
  const m = /^\[([a-z_]+)\]/.exec(message);
  if (m && ERROR_KINDS.includes(m[1])) return m[1];
  if (/^未知のツール/.test(message)) return "unknown_tool";
  if (/がありません|見つかりません|ありません:/.test(message)) return "not_found";
  return "validation";
}
function withErrorKind(message, kind = errorKind(message)) {
  return /^\[[a-z_]+\]/.test(message) ? message : `[${kind}] ${message}`;
}
var TASK_DIRS = /* @__PURE__ */ new Set(["issue", "routine", "member", "worklog", "board", "statuslog", "updates"]);
function pathArea(rel) {
  const p = rel.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
  if (p === "" || p === ".") return "vault";
  const segs = p.split("/");
  if (segs.some((s) => s.startsWith(".") || s === "node_modules")) return "hidden";
  const top = segs[0];
  if (top === "daily") return "daily";
  if (top === "wiki") return "wiki";
  if (top === "sources") return "sources";
  if (top === "asset") return "asset";
  if (top === "tmp") return "tmp";
  if (top === "template") return "template";
  if (top === "slide") return "slide";
  if (TASK_DIRS.has(top)) return "task";
  return "note";
}
function localDateOf(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function percentile(values, p) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)];
}
function readLogLines(root) {
  const dir = logDir(root);
  if (!existsSync2(dir)) return [];
  const out = [];
  for (const month of readdirSync2(dir).sort()) {
    const mdir = join2(dir, month);
    if (!statSync2(mdir).isDirectory()) continue;
    for (const name of readdirSync2(mdir).sort()) {
      if (!name.endsWith(".jsonl")) continue;
      for (const line of readFileSync3(join2(mdir, name), "utf8").split("\n")) {
        if (!line.trim()) continue;
        try {
          const v = JSON.parse(line);
          if (typeof v.ts === "string" && typeof v.kind === "string") out.push(v);
        } catch {
        }
      }
    }
  }
  return out;
}
function buildReport(lines, since, until) {
  const inRange = lines.filter((l) => {
    const d = localDateOf(l.ts);
    return d >= since && d <= until;
  });
  const clients = {};
  const byTool = /* @__PURE__ */ new Map();
  const bypass = {};
  const bypassByOp = {};
  const feedback = [];
  const zeroHitQueries = [];
  let starts = 0;
  for (const l of inRange) {
    if (l.kind === "start") {
      starts++;
      const c = l.client;
      const name = c?.name ?? "unknown";
      clients[name] = (clients[name] ?? 0) + 1;
    } else if (l.kind === "call") {
      const tool = String(l.tool ?? "?");
      let e = byTool.get(tool);
      if (!e) {
        e = { ms: [], bytes: [], s: { tool, calls: 0, alias: 0, errors: {}, p50Ms: 0, p95Ms: 0, p95Bytes: 0, truncated: 0, zeroHits: 0 } };
        byTool.set(tool, e);
      }
      e.s.calls++;
      if (l.alias) e.s.alias++;
      if (typeof l.error === "string") e.s.errors[l.error] = (e.s.errors[l.error] ?? 0) + 1;
      if (typeof l.ms === "number") e.ms.push(l.ms);
      if (typeof l.bytes === "number") e.bytes.push(l.bytes);
      if (l.truncated) e.s.truncated++;
      if (l.hits === 0) {
        e.s.zeroHits++;
        const q = l.args?.query ?? l.args?.text;
        if (typeof q === "string") zeroHitQueries.push({ tool, query: q });
      }
    } else if (l.kind === "bypass") {
      const area = String(l.area ?? "?");
      const op = String(l.op ?? "?");
      bypass[area] = (bypass[area] ?? 0) + 1;
      bypassByOp[op] = (bypassByOp[op] ?? 0) + 1;
    } else if (l.kind === "feedback") {
      feedback.push({ ts: l.ts, tool: typeof l.tool === "string" ? l.tool : null, kind: String(l.type ?? "?"), summary: String(l.summary ?? "") });
    }
  }
  const tools = [...byTool.values()].map(({ ms, bytes, s }) => ({ ...s, p50Ms: percentile(ms, 50), p95Ms: percentile(ms, 95), p95Bytes: percentile(bytes, 95) })).sort((a, b) => b.calls - a.calls || a.tool.localeCompare(b.tool));
  return { since, until, starts, clients, tools, bypass, bypassByOp, feedback, zeroHitQueries };
}
function formatReport(r) {
  const out = [];
  const totalCalls = r.tools.reduce((n, t) => n + t.calls, 0);
  const totalBypass = Object.values(r.bypass).reduce((n, v) => n + v, 0);
  out.push(`- \u8D77\u52D5 ${r.starts} \u56DE\u3001\u30C4\u30FC\u30EB\u306E\u547C\u3073\u51FA\u3057 ${totalCalls} \u56DE\u3001MCP \u3092\u901A\u3055\u306A\u3044\u8AAD\u307F\u66F8\u304D\uFF08bypass\uFF09${totalBypass} \u56DE\u3001\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF ${r.feedback.length} \u4EF6`);
  if (Object.keys(r.clients).length) {
    out.push(`- \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8: ${Object.entries(r.clients).map(([k, v]) => `${k} ${v}`).join("\u3001")}`);
  }
  if (r.tools.length) {
    out.push("", "| \u30C4\u30FC\u30EB | \u56DE\u6570 | \u30A8\u30E9\u30FC | p50 ms | p95 ms | p95 bytes | \u5207\u308A\u8A70\u3081 | 0 \u4EF6 | \u65E7\u540D |", "|---|---|---|---|---|---|---|---|---|");
    for (const t of r.tools) {
      const errs = Object.entries(t.errors).map(([k, v]) => `${k} ${v}`).join("\u3001") || "0";
      out.push(`| ${t.tool} | ${t.calls} | ${errs} | ${t.p50Ms} | ${t.p95Ms} | ${t.p95Bytes} | ${t.truncated} | ${t.zeroHits} | ${t.alias} |`);
    }
  }
  if (totalBypass) {
    out.push("", `- bypass \u306E\u533A\u5206: ${Object.entries(r.bypass).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join("\u3001")}`);
    out.push(`- bypass \u306E\u64CD\u4F5C: ${Object.entries(r.bypassByOp).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join("\u3001")}`);
  }
  if (r.feedback.length) {
    out.push("", "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\uFF08\u8981\u7D04\u306F\u500B\u4EBA\u306E\u5185\u5BB9\u3092\u542B\u307F\u3046\u308B\u3002\u4E0A\u6D41\u306B\u306F\u7A2E\u985E\u3068\u4EF6\u6570\u3060\u3051\u3092\u4F1D\u3048\u308B\uFF09:");
    for (const f of r.feedback) out.push(`- ${f.ts.slice(0, 10)} ${f.kind}${f.tool ? `\uFF08${f.tool}\uFF09` : ""}: ${f.summary}`);
  }
  if (r.zeroHitQueries.length) {
    out.push("", "\u7D50\u679C\u304C 0 \u4EF6\u3060\u3063\u305F\u691C\u7D22\uFF08\u4E0A\u6D41\u306B\u306F\u4EF6\u6570\u3060\u3051\u3092\u4F1D\u3048\u308B\uFF09:");
    for (const q of r.zeroHitQueries.slice(-20)) out.push(`- ${q.tool}: ${q.query}`);
  }
  return out.join("\n");
}

// cli/mcp-pkm.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync3 } from "node:fs";
import { join as join4 } from "node:path";
import { pathToFileURL } from "node:url";

// cli/notes.ts
var import_yaml3 = __toESM(require_dist(), 1);
import { readdirSync as readdirSync3, readFileSync as readFileSync4, statSync as statSync3 } from "node:fs";
import { join as join3 } from "node:path";
var DAILY_RE = /^daily\/(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2})\.md$/;
var SKIP_AREAS = /* @__PURE__ */ new Set(["hidden", "tmp", "template", "slide"]);
function normalize(s) {
  return s.normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 96));
}
var FRONTMATTER_RE3 = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
function strList(v) {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" || typeof x === "number").map(String);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}
function str(v) {
  return typeof v === "string" && v.trim() ? v : typeof v === "number" ? String(v) : null;
}
function extractLinkTargets(body) {
  const out = /* @__PURE__ */ new Set();
  let fence = null;
  for (const raw of body.split("\n")) {
    const f = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      continue;
    }
    if (f) {
      fence = f[1];
      continue;
    }
    const line = raw.replace(/`+[^`]*`+/g, "");
    for (const m of line.matchAll(/!?\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)) {
      let target = m[1];
      if (target.startsWith("<")) target = target.slice(1, -1);
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
      const hash = target.indexOf("#");
      let path = hash === -1 ? target : target.slice(0, hash);
      try {
        path = decodeURIComponent(path);
      } catch {
      }
      path = path.replace(/^\.?\//, "");
      if (path) out.add(path);
    }
  }
  return [...out];
}
function parseNote(path, text) {
  const m = FRONTMATTER_RE3.exec(text);
  let fm = {};
  if (m) {
    try {
      const v = (0, import_yaml3.parse)(m[1]);
      if (v && typeof v === "object" && !Array.isArray(v)) fm = v;
    } catch {
    }
  }
  const body = m ? text.slice(m[0].length) : text;
  const bodyLine = m ? m[0].split("\n").length : 1;
  const daily = DAILY_RE.exec(path);
  const base = path.split("/").pop().replace(/\.md$/, "");
  const title = str(fm.title) ?? str(fm.name) ?? (daily ? daily[3] : base);
  const created = str(fm.created);
  const updated = str(fm.updated);
  const tags = strList(fm.tags);
  const aliases = [...strList(fm.aliases), ...strList(fm.alias)];
  return {
    path,
    title,
    type: str(fm.type),
    tags,
    aliases,
    created,
    updated,
    date: daily ? daily[3] : (updated ?? created)?.slice(0, 10) ?? null,
    frontmatter: fm,
    body,
    bodyLine,
    links: extractLinkTargets(body),
    norm: { title: normalize(title), aliases: aliases.map(normalize), tags: tags.map(normalize), body: normalize(body) }
  };
}
function walkStats(root, dir = "", out = /* @__PURE__ */ new Map()) {
  let names;
  try {
    names = readdirSync3(join3(root, dir));
  } catch {
    return out;
  }
  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const rel = dir ? `${dir}/${name}` : name;
    let st;
    try {
      st = statSync3(join3(root, rel));
    } catch {
      continue;
    }
    if (st.isDirectory()) walkStats(root, rel, out);
    else out.set(rel, { mtimeMs: st.mtimeMs, size: st.size });
  }
  return out;
}
function isNotePath(path) {
  return path.endsWith(".md") && !SKIP_AREAS.has(pathArea(path));
}
var NoteStore = class {
  constructor(root) {
    this.root = root;
  }
  root;
  files = /* @__PURE__ */ new Map();
  notes = /* @__PURE__ */ new Map();
  stats = /* @__PURE__ */ new Map();
  /** ファイルの一覧を取り直す（呼び出しごとに 1 回）。読み直したノートの数を返す */
  refresh(files = walkStats(this.root)) {
    this.files = files;
    let changed = 0;
    for (const path of [...this.notes.keys()]) {
      if (!files.has(path)) {
        this.notes.delete(path);
        this.stats.delete(path);
      }
    }
    for (const [path, st] of files) {
      if (!isNotePath(path)) continue;
      const prev = this.stats.get(path);
      if (prev && prev.mtimeMs === st.mtimeMs && prev.size === st.size) continue;
      try {
        this.notes.set(path, parseNote(path, readFileSync4(join3(this.root, path), "utf8")));
        this.stats.set(path, st);
        changed++;
      } catch {
        this.notes.delete(path);
      }
    }
    return changed;
  }
  get(path) {
    return this.notes.get(path);
  }
  exists(path) {
    return this.files.has(path);
  }
};
function matchesFilter(n, f) {
  if (f.type !== void 0 && n.type !== f.type) return false;
  if (f.pathPrefix !== void 0 && !n.path.startsWith(f.pathPrefix)) return false;
  if (f.tags?.length) {
    const set = new Set(n.norm.tags);
    if (!f.tags.every((t) => set.has(normalize(t)))) return false;
  }
  if (f.from !== void 0 && (n.date === null || n.date < f.from)) return false;
  if (f.to !== void 0 && (n.date === null || n.date > f.to)) return false;
  return true;
}
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
function pageOf(all, limit, cursor) {
  const n = typeof limit === "number" && limit > 0 ? Math.min(Math.trunc(limit), MAX_LIMIT) : DEFAULT_LIMIT;
  const start = typeof cursor === "string" && /^\d+$/.test(cursor) ? Number(cursor) : 0;
  const items = all.slice(start, start + n);
  const more = start + n < all.length;
  return { total: all.length, items, truncated: more, cursor: more ? String(start + n) : null };
}
function summaryOf(n) {
  return { path: n.path, title: n.title, type: n.type, tags: n.tags, date: n.date };
}
var FIELD_SCORE = { title: 8, aliases: 4, tags: 2, body: 1 };
var SNIPPET_RADIUS = 80;
function searchNotes(notes, query, filter = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const scored = [];
  for (const n of notes) {
    if (!matchesFilter(n, filter)) continue;
    let score = 0;
    const matched = /* @__PURE__ */ new Set();
    let ok = true;
    for (const t of terms) {
      let best = 0;
      if (n.norm.title.includes(t)) {
        best = Math.max(best, FIELD_SCORE.title);
        matched.add("title");
      }
      if (n.norm.aliases.some((a) => a.includes(t))) {
        best = Math.max(best, FIELD_SCORE.aliases);
        matched.add("aliases");
      }
      if (n.norm.tags.some((a) => a.includes(t))) {
        best = Math.max(best, FIELD_SCORE.tags);
        matched.add("tags");
      }
      if (n.norm.body.includes(t)) {
        best = Math.max(best, FIELD_SCORE.body);
        matched.add("body");
      }
      if (best === 0) {
        ok = false;
        break;
      }
      score += best;
    }
    if (!ok) continue;
    const snip = matched.has("body") ? snippetOf(n, terms) : null;
    scored.push({
      score,
      hit: {
        path: n.path,
        title: n.title,
        type: n.type,
        date: n.date,
        matched: ["title", "aliases", "tags", "body"].filter((f) => matched.has(f)),
        line: snip?.line ?? null,
        snippet: snip?.text ?? null
      }
    });
  }
  scored.sort((a, b) => b.score - a.score || (b.hit.date ?? "").localeCompare(a.hit.date ?? "") || a.hit.path.localeCompare(b.hit.path));
  return scored.map((s) => s.hit);
}
function snippetOf(n, terms) {
  const lines = n.body.split("\n");
  for (const t of terms) {
    for (let i = 0; i < lines.length; i++) {
      const norm = normalize(lines[i]);
      const pos = norm.indexOf(t);
      if (pos === -1) continue;
      const line = lines[i];
      const start = Math.max(0, pos - SNIPPET_RADIUS);
      const end = Math.min(line.length, pos + t.length + SNIPPET_RADIUS);
      const text = `${start > 0 ? "\u2026" : ""}${line.slice(start, end).trim()}${end < line.length ? "\u2026" : ""}`;
      return { line: n.bodyLine + i, text };
    }
  }
  return null;
}
function backlinksOf(notes, path) {
  const out = [];
  for (const n of notes) if (n.path !== path && n.links.includes(path)) out.push(n);
  return out;
}
function unprocessedSources(notes) {
  const all = [...notes];
  const referenced = /* @__PURE__ */ new Set();
  for (const n of all) {
    if (!n.path.startsWith("wiki/")) continue;
    for (const s of strList(n.frontmatter.sources)) referenced.add(s.replace(/^\.?\//, ""));
    for (const l of n.links) referenced.add(l);
  }
  return all.filter((n) => /^sources\/[^/]+\.md$/.test(n.path) && !referenced.has(n.path));
}
var BODY_LIMIT = 8e3;
function bodyOf(n, full) {
  if (full === true || n.body.length <= BODY_LIMIT) return { body: n.body, length: n.body.length, truncated: false };
  return { body: n.body.slice(0, BODY_LIMIT), length: n.body.length, truncated: true };
}
function recentLogEntries(body, limit) {
  const entries = [];
  let cur = null;
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      if (cur) entries.push({ heading: cur.heading, text: cur.lines.join("\n").trim() });
      cur = { heading: line.slice(3).trim(), lines: [] };
    } else if (cur) cur.lines.push(line);
  }
  if (cur) entries.push({ heading: cur.heading, text: cur.lines.join("\n").trim() });
  return entries.slice(-limit).reverse().map((e) => ({ heading: e.heading, text: e.text.length > 1e3 ? `${e.text.slice(0, 1e3)}\u2026` : e.text }));
}

// cli/mcp-pkm.ts
var TOOLSETS = ["task", "note", "daily", "wiki", "check", "meta"];
var LIMIT = { type: "number", description: "\u4EF6\u6570\uFF08\u65E2\u5B9A 20\u3001\u4E0A\u9650 100\uFF09" };
var CURSOR = { type: "string", description: "\u7D9A\u304D\u3092\u53D6\u308B\u3068\u304D\u306B\u3001\u524D\u306E\u5FDC\u7B54\u306E cursor \u3092\u6E21\u3059" };
var FILTERS = {
  type: { type: "string", description: "frontmatter \u306E type\uFF08note / daily / concept \u306A\u3069\uFF09" },
  tags: { type: "array", items: { type: "string" }, description: "\u3059\u3079\u3066\u3092\u6301\u3064\u3082\u306E\u3060\u3051" },
  path_prefix: { type: "string", description: "\u30D1\u30B9\u306E\u5148\u982D\uFF08\u4F8B: wiki/\uFF09" },
  from: { type: "string", description: "YYYY-MM-DD \u4EE5\u964D\uFF08daily \u306F\u30D5\u30A1\u30A4\u30EB\u540D\u306E\u65E5\u4ED8\u3001\u307B\u304B\u306F updated \u304B created\uFF09" },
  to: { type: "string", description: "YYYY-MM-DD \u4EE5\u524D" }
};
var FULL = { type: "boolean", description: "true \u306A\u3089\u672C\u6587\u3092\u5207\u3089\u305A\u306B\u8FD4\u3059\uFF08\u65E2\u5B9A\u306F 8,000 \u5B57\u3067\u5207\u308B\uFF09" };
var PKM_TOOLS = {
  note: [
    {
      name: "note_search",
      description: "\u30CE\u30FC\u30C8\u3092\u5358\u7D14\u4E00\u81F4\u3067\u691C\u7D22\u3059\u308B\u3002\u7A7A\u767D\u3067\u533A\u5207\u3063\u305F\u8A9E\u306E AND\u3002\u5168\u89D2\u30FB\u534A\u89D2\u3001\u5927\u6587\u5B57\u30FB\u5C0F\u6587\u5B57\u3001\u30AB\u30BF\u30AB\u30CA\u30FB\u3072\u3089\u304C\u306A\u306E\u9055\u3044\u306F\u7121\u8996\u3059\u308B\u3002title \u2192 aliases \u2192 tags \u2192 \u672C\u6587\u306E\u9806\u306B\u5F53\u305F\u3063\u305F\u3082\u306E\u3092\u4E0A\u306B\u3057\u3001\u540C\u3058\u306A\u3089\u65B0\u3057\u3044\u9806\u3002\u610F\u5473\u306E\u8FD1\u3044\u8A9E\u306F\u5F53\u305F\u3089\u306A\u3044\u306E\u3067\u3001\u898B\u3064\u304B\u3089\u306A\u3051\u308C\u3070\u8A00\u3044\u63DB\u3048\u3066\u691C\u7D22\u3057\u76F4\u3059\u3002tmp/\u30FBtemplate/\u30FBslide/\u30FB\u96A0\u3057\u30D1\u30B9\u306F\u5BFE\u8C61\u5916",
      inputSchema: { type: "object", properties: { query: { type: "string", description: "\u691C\u7D22\u8A9E" }, ...FILTERS, limit: LIMIT, cursor: CURSOR }, required: ["query"] }
    },
    {
      name: "note_get",
      description: "\u30CE\u30FC\u30C8 1 \u4EF6\u306E frontmatter\u30FB\u672C\u6587\u30FB\u51FA\u308B\u30EA\u30F3\u30AF\u3068\u88AB\u30EA\u30F3\u30AF\u306E\u4EF6\u6570\u3092\u53D6\u5F97\u3059\u308B",
      inputSchema: { type: "object", properties: { path: { type: "string", description: "Vault \u30EB\u30FC\u30C8\u304B\u3089\u306E\u30D1\u30B9\uFF08.md \u307E\u3067\uFF09" }, full: FULL }, required: ["path"] }
    },
    {
      name: "note_list",
      description: "\u30CE\u30FC\u30C8\u3092\u6761\u4EF6\u3067\u7D5E\u3063\u3066\u4E00\u89A7\u306B\u3059\u308B\uFF08\u672C\u6587\u306F\u8FD4\u3055\u306A\u3044\uFF09",
      inputSchema: {
        type: "object",
        properties: {
          ...FILTERS,
          sort: { type: "string", enum: ["date", "title", "path"], description: "\u65E2\u5B9A\u306F date\uFF08\u65B0\u3057\u3044\u9806\uFF09" },
          desc: { type: "boolean", description: "\u964D\u9806\uFF08date \u306E\u65E2\u5B9A\u306F true\u3001\u307B\u304B\u306F false\uFF09" },
          limit: LIMIT,
          cursor: CURSOR
        }
      }
    },
    {
      name: "note_links",
      description: "\u30CE\u30FC\u30C8\u306E\u51FA\u308B\u30EA\u30F3\u30AF\uFF08\u30EA\u30F3\u30AF\u5148\u304C\u3042\u308B\u304B\uFF09\u3068\u88AB\u30EA\u30F3\u30AF\u3092\u53D6\u5F97\u3059\u308B",
      inputSchema: { type: "object", properties: { path: { type: "string" }, limit: LIMIT }, required: ["path"] }
    }
  ],
  daily: [
    {
      name: "daily_get",
      description: "\u305D\u306E\u65E5\u306E\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u306E frontmatter \u3068\u672C\u6587\u3092\u53D6\u5F97\u3059\u308B",
      inputSchema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u4ECA\u65E5\uFF09" }, full: FULL } }
    },
    {
      name: "daily_list_pending",
      description: "wiki-daily \u3067\u6B21\u306B\u51E6\u7406\u3059\u308B\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\uFF08\u524D\u56DE\u306E daily \u306E\u8A18\u9332\u306E\u5F8C\u306B\u8FFD\u52A0\u30FB\u5909\u66F4\u3055\u308C\u305F\u3082\u306E\u3002\u4ECA\u65E5\u3088\u308A\u524D\uFF09\u3092\u4E00\u89A7\u306B\u3059\u308B",
      inputSchema: { type: "object", properties: { today: { type: "string", description: "YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u4ECA\u65E5\uFF09" }, limit: LIMIT, cursor: CURSOR } }
    }
  ],
  wiki: [
    {
      name: "wiki_get_index",
      description: "wiki \u306E\u76EE\u6B21\uFF08wiki/index.md\uFF09\u3092\u53D6\u5F97\u3059\u308B\u3002wiki \u304B\u3089\u7B54\u3048\u308B\u3068\u304D\u306F\u3001\u307E\u305A\u3053\u3053\u304B\u3089\u8FBF\u308B",
      inputSchema: { type: "object", properties: { full: FULL } }
    },
    {
      name: "wiki_recent_log",
      description: "wiki \u306E\u64CD\u4F5C\u306E\u8A18\u9332\uFF08wiki/log.md\uFF09\u3092\u65B0\u3057\u3044\u3082\u306E\u304B\u3089\u53D6\u5F97\u3059\u308B",
      inputSchema: { type: "object", properties: { limit: { type: "number", description: "\u4EF6\u6570\uFF08\u65E2\u5B9A 10\u3001\u4E0A\u9650 100\uFF09" } } }
    },
    {
      name: "wiki_list_unprocessed_sources",
      description: "wiki \u306E\u30DA\u30FC\u30B8\uFF08frontmatter \u306E sources \u304B\u672C\u6587\u306E\u30EA\u30F3\u30AF\uFF09\u304B\u3089\u53C2\u7167\u3055\u308C\u3066\u3044\u306A\u3044\u5143\u8CC7\u6599\uFF08sources/\uFF09\u3092\u4E00\u89A7\u306B\u3059\u308B",
      inputSchema: { type: "object", properties: { limit: LIMIT, cursor: CURSOR } }
    }
  ],
  check: [
    {
      name: "check_vault",
      description: "Vault \u3092\u691C\u67FB\u3059\u308B\u3002notes \u306F\u30CE\u30FC\u30C8\u306E\u66F8\u5F0F\u30FB\u30EA\u30F3\u30AF\u5207\u308C\u30FBwiki \u306E index \u3078\u306E\u63B2\u8F09\u306A\u3069\uFF08wiki-lint \u3068\u540C\u3058\u5224\u5B9A\u3002errors \u306F\u76F4\u3059\u3001warnings \u306F\u4EBA\u306E\u30CE\u30FC\u30C8\u306A\u306E\u3067\u30E6\u30FC\u30B6\u30FC\u306B\u4F1D\u3048\u308B\uFF09\u3001tasks \u306F\u30BF\u30B9\u30AF\u7BA1\u7406\u306E\u30C7\u30FC\u30BF\u306E\u6574\u5408\u6027\uFF08lint \u3068\u540C\u3058\u5224\u5B9A\uFF09",
      inputSchema: { type: "object", properties: { scope: { type: "string", enum: ["all", "notes", "tasks"], description: "\u65E2\u5B9A\u306F all" }, limit: LIMIT } }
    },
    {
      name: "check_rename_candidates",
      description: "\u30D5\u30A1\u30A4\u30EB\u540D\u304C\u82F1\u8A9E\u306E\u30B1\u30D0\u30D6\u30B1\u30FC\u30B9\u306B\u306A\u3063\u3066\u3044\u306A\u3044\u30CE\u30FC\u30C8\uFF08note-rename \u306E\u5019\u88DC\uFF09\u3092\u4E00\u89A7\u306B\u3059\u308B",
      inputSchema: { type: "object", properties: { limit: LIMIT, cursor: CURSOR } }
    }
  ],
  meta: [
    {
      name: "meta_feedback",
      description: "MCP \u306E\u30C4\u30FC\u30EB\u3067\u8DB3\u308A\u306A\u304B\u3063\u305F\u3053\u3068\u30FB\u56F0\u3063\u305F\u3053\u3068\u3092\u8A18\u9332\u3059\u308B\uFF08\u4E0A\u6D41\u306E\u6539\u5584\u306B\u4F7F\u3046\uFF09\u3002\u6B21\u306E\u3068\u304D\u306B\u547C\u3076: \u5FC5\u8981\u306A\u30C4\u30FC\u30EB\u304C\u306A\u3044\uFF08missing\uFF09\u3001\u7D50\u679C\u304C\u8AA4\u3063\u3066\u3044\u308B\uFF08wrong\uFF09\u3001\u5FDC\u7B54\u304C\u5927\u304D\u3059\u304E\u308B\uFF08large\uFF09\u3001\u9045\u3044\uFF08slow\uFF09\u3001\u4F7F\u3044\u65B9\u304C\u5206\u304B\u3089\u306A\u3044\uFF08unclear\uFF09\u3001\u62D2\u5426\u304C\u4E0D\u5F53\uFF08rejected\uFF09\u3001MCP \u3092\u4F7F\u308F\u305A\u306B\u30D5\u30A1\u30A4\u30EB\u3092\u76F4\u63A5\u8AAD\u307F\u66F8\u304D\u3057\u305F\uFF08bypass\uFF09\u3002summary \u306B\u30CE\u30FC\u30C8\u306E\u4E2D\u8EAB\u3084\u500B\u4EBA\u306E\u60C5\u5831\u3092\u66F8\u304B\u306A\u3044",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string", enum: [...FEEDBACK_KINDS] },
          tool: { type: "string", description: "\u5BFE\u8C61\u306E\u30C4\u30FC\u30EB\u540D\uFF08\u3042\u308C\u3070\uFF09" },
          summary: { type: "string", description: "200 \u5B57\u4EE5\u5185\u3002\u4F55\u3092\u3057\u3088\u3046\u3068\u3057\u3066\u3001\u4F55\u304C\u8DB3\u308A\u306A\u304B\u3063\u305F\u304B" }
        },
        required: ["kind", "summary"]
      }
    }
  ]
};
function isPkmTool(name) {
  return Object.values(PKM_TOOLS).some((defs) => defs.some((d) => d.name === name));
}
function filterOf(args) {
  const f = {};
  if (typeof args.type === "string") f.type = args.type;
  if (Array.isArray(args.tags)) f.tags = args.tags.map(String);
  if (typeof args.path_prefix === "string") f.pathPrefix = args.path_prefix;
  for (const k of ["from", "to"]) {
    const v = args[k];
    if (v === void 0) continue;
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`[validation] ${k} \u306F YYYY-MM-DD \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    f[k] = v;
  }
  return f;
}
function requireNote(ctx, path) {
  if (typeof path !== "string" || !path) throw new Error("[validation] path \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
  const p = path.replace(/^\.?\//, "");
  const n = ctx.notes.get(p);
  if (n) return n;
  const area = pathArea(p);
  if (["hidden", "tmp", "template", "slide"].includes(area)) throw new Error(`[ownership] ${area} \u306E\u5834\u6240\u306F MCP \u3067\u306F\u8AAD\u307F\u307E\u305B\u3093: ${p}`);
  if (!p.endsWith(".md")) throw new Error(`[validation] \u30CE\u30FC\u30C8\u306E\u30D1\u30B9\u306F .md \u307E\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044: ${p}`);
  throw new Error(`[not_found] \u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093: ${p}`);
}
function noteDetail(ctx, n, full) {
  const { body, length, truncated } = bodyOf(n, full);
  return {
    path: n.path,
    title: n.title,
    type: n.type,
    frontmatter: n.frontmatter,
    body,
    bodyLength: length,
    truncated,
    linkCount: n.links.length,
    backlinkCount: backlinksOf(ctx.notes.notes.values(), n.path).length
  };
}
function runHarness(root, script, expr) {
  const file = join4(root, ".claude/scripts", script);
  if (!existsSync3(file)) throw new Error(`[not_found] \u30CF\u30FC\u30CD\u30B9\u306E\u30B9\u30AF\u30EA\u30D7\u30C8\u304C\u3042\u308A\u307E\u305B\u3093: .claude/scripts/${script}`);
  const code = `import * as m from ${JSON.stringify(pathToFileURL(file).href)};
const root = process.argv[1];
const out = await (${expr});
process.stdout.write(JSON.stringify(out));`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code, root], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`[internal] .claude/scripts/${script} \u304C\u5931\u6557\u3057\u307E\u3057\u305F: ${(r.stderr || "").trim().split("\n").slice(-3).join(" / ")}`);
  return JSON.parse(r.stdout);
}
function callPkmTool(ctx, name, args) {
  switch (name) {
    case "note_search": {
      if (typeof args.query !== "string" || !args.query.trim()) throw new Error("[validation] query \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
      return pageOf(searchNotes(ctx.notes.notes.values(), args.query, filterOf(args)), args.limit, args.cursor);
    }
    case "note_get":
      return noteDetail(ctx, requireNote(ctx, args.path), args.full);
    case "note_list": {
      const f = filterOf(args);
      const sort = args.sort === "title" || args.sort === "path" ? args.sort : "date";
      const desc = typeof args.desc === "boolean" ? args.desc : sort === "date";
      const all = [...ctx.notes.notes.values()].filter((n) => matchesFilter(n, f));
      const key = (n) => sort === "title" ? n.title : sort === "path" ? n.path : n.date ?? "";
      all.sort((a, b) => key(a).localeCompare(key(b)) * (desc ? -1 : 1) || a.path.localeCompare(b.path));
      return pageOf(all.map(summaryOf), args.limit, args.cursor);
    }
    case "note_links": {
      const n = requireNote(ctx, args.path);
      const outgoing = n.links.map((target) => ({ target, exists: ctx.notes.exists(target), title: ctx.notes.get(target)?.title ?? null }));
      const back = backlinksOf(ctx.notes.notes.values(), n.path).map((b2) => ({ path: b2.path, title: b2.title }));
      const o = pageOf(outgoing, args.limit, void 0);
      const b = pageOf(back, args.limit, void 0);
      return { path: n.path, outgoing: o.items, outgoingTotal: o.total, backlinks: b.items, backlinkTotal: b.total, truncated: o.truncated || b.truncated };
    }
    case "daily_get": {
      const date = typeof args.date === "string" ? args.date : ctx.today;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("[validation] date \u306F YYYY-MM-DD \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
      const path = `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
      const n = ctx.notes.get(path);
      if (!n || !DAILY_RE.test(path)) throw new Error(`[not_found] \u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093: ${path}`);
      return noteDetail(ctx, n, args.full);
    }
    case "daily_list_pending": {
      const today = typeof args.today === "string" ? args.today : ctx.today;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("[validation] today \u306F YYYY-MM-DD \u306B\u3057\u3066\u304F\u3060\u3055\u3044");
      const r = runHarness(ctx.root, "daily-pending.mjs", `m.pendingDaily(root, ${JSON.stringify(today)})`);
      return { last: r.last, head: r.head, ...pageOf(r.pending, args.limit, args.cursor) };
    }
    case "wiki_get_index": {
      const n = ctx.notes.get("wiki/index.md");
      if (!n) throw new Error("[not_found] wiki/index.md \u304C\u3042\u308A\u307E\u305B\u3093");
      return noteDetail(ctx, n, args.full);
    }
    case "wiki_recent_log": {
      const n = ctx.notes.get("wiki/log.md");
      if (!n) throw new Error("[not_found] wiki/log.md \u304C\u3042\u308A\u307E\u305B\u3093");
      const limit = typeof args.limit === "number" && args.limit > 0 ? Math.min(Math.trunc(args.limit), 100) : 10;
      const entries = recentLogEntries(n.body, limit);
      return { total: entries.length, items: entries };
    }
    case "wiki_list_unprocessed_sources":
      return pageOf(
        unprocessedSources(ctx.notes.notes.values()).map((n) => ({ path: n.path, title: n.title, created: n.created })),
        args.limit,
        args.cursor
      );
    case "check_vault": {
      const scope = args.scope === "notes" || args.scope === "tasks" ? args.scope : "all";
      const out = { scope };
      let truncated = false;
      if (scope !== "tasks") {
        const r = runHarness(ctx.root, "wiki-lint.mjs", "m.lintVault(root)");
        const e = pageOf(r.errors, args.limit, void 0);
        const w = pageOf(r.warnings, args.limit, void 0);
        truncated ||= e.truncated || w.truncated;
        out.notes = { errorCount: e.total, errors: e.items, warningCount: w.total, warnings: w.items };
      }
      if (scope !== "notes") {
        const p = pageOf(ctx.taskProblems(), args.limit, void 0);
        truncated ||= p.truncated;
        out.tasks = { problemCount: p.total, problems: p.items };
      }
      out.truncated = truncated;
      return out;
    }
    case "check_rename_candidates": {
      const paths = runHarness(ctx.root, "note-rename.mjs", "m.listCandidates(root)");
      return pageOf(paths, args.limit, args.cursor);
    }
    case "meta_feedback": {
      const kind = String(args.kind ?? "");
      if (!FEEDBACK_KINDS.includes(kind)) throw new Error(`[validation] kind \u306F ${FEEDBACK_KINDS.join(" / ")} \u306E\u3069\u308C\u304B\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      const summary = String(args.summary ?? "").trim();
      if (!summary) throw new Error("[validation] summary \u3092\u66F8\u3044\u3066\u304F\u3060\u3055\u3044");
      if (summary.length > 200) throw new Error("[validation] summary \u306F 200 \u5B57\u4EE5\u5185\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
      const tool = typeof args.tool === "string" && args.tool ? args.tool.slice(0, 64) : null;
      const recorded = !!ctx.log && logEnabled();
      ctx.log?.write("feedback", { tool, type: kind, summary });
      return { ok: true, recorded };
    }
    default:
      throw new Error(`[unknown_tool] \u672A\u77E5\u306E\u30C4\u30FC\u30EB\u3067\u3059: ${name}`);
  }
}

// cli/mcp.ts
var TASK_READ_TOOLS = /* @__PURE__ */ new Set(["get_overview", "get_board", "list_pending_boards", "list_issues", "get_issue", "get_worklog_summary", "get_routine_stats"]);
var TASK_PREFIX = "task_";
var OVERVIEW_TOP = 5;
var VaultCache = class {
  constructor(root) {
    this.root = root;
    this.notes = new NoteStore(root);
  }
  root;
  notes;
  taskSig = "";
  task = null;
  fileCount = 0;
  refresh() {
    const files = walkStats(this.root);
    this.fileCount = files.size;
    this.notes.refresh(files);
    const parts = [];
    for (const [p, st] of files) if (fileKind(p) !== null) parts.push(`${p}	${st.mtimeMs}	${st.size}`);
    const sig = parts.join("\n");
    if (sig !== this.taskSig) {
      this.taskSig = sig;
      this.task = null;
    }
  }
  taskIndex() {
    this.task ??= loadIndex(this.root);
    return this.task;
  }
  invalidate() {
    this.taskSig = "";
    this.task = null;
  }
};
var TOOLS = [
  {
    name: "get_overview",
    description: "\u6307\u5B9A\u65E5\uFF08\u65E2\u5B9A\u306F\u4ECA\u65E5\uFF09\u306E\u30DC\u30FC\u30C9\u3001\u8CA0\u8377\u3001\u671F\u9650\u5207\u308C\u30FB\u671F\u9650\u9593\u8FD1\u3001Inbox\u4EF6\u6570\u3001\u672A\u7DE0\u3081\u306E\u904E\u53BB\u30DC\u30FC\u30C9\u3001\u8A18\u9332\u4E2D\u30BF\u30A4\u30DE\u30FC\u3001\u6301\u3061\u8D8A\u3057\u904E\u591A\u30FB\u505C\u6EDE\u30BF\u30B9\u30AF\u3001\u898B\u7A4D\u3082\u308A\u7CBE\u5EA6\u3092\u307E\u3068\u3081\u3066\u53D6\u5F97\u3059\u308B",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u4ECA\u65E5\uFF09" },
        available_minutes: { type: "number", description: "1\u65E5\u306E\u4F7F\u3048\u308B\u6642\u9593\uFF08\u5206\u3001\u65E2\u5B9A 240\uFF09" },
        stale_days: { type: "number", description: "in-progress \u306E\u505C\u6EDE\u5224\u5B9A\u65E5\u6570\uFF08\u65E2\u5B9A 3\uFF09" },
        caution_days: { type: "number", description: "\u671F\u9650\u9593\u8FD1\u306E\u5224\u5B9A\u65E5\u6570\uFF08\u65E2\u5B9A 3\uFF09" }
      }
    }
  },
  {
    name: "get_board",
    description: "\u6307\u5B9A\u65E5\uFF08\u65E2\u5B9A\u306F\u4ECA\u65E5\uFF09\u306E\u30BF\u30B9\u30AF\u30DC\u30FC\u30C9\u306E\u72B6\u614B\u3092\u53D6\u5F97\u3059\u308B\u3002lanes \u306F\u6B04\u3054\u3068\u306E\u30AB\u30FC\u30C9\uFF08working: \u30BF\u30A4\u30DE\u30FC\u304C\u52D5\u3044\u3066\u3044\u308B\u3082\u306E\u3001top: \u2605\u4ECA\u65E5\u306E\u6700\u91CD\u8981\uFF084 \u4EF6\u307E\u3067\uFF09\u3001routine: routine \u3059\u3079\u3066\uFF08issue \u3068\u6DF7\u305C\u306A\u3044\u3002\u2605 \u306F\u4ED8\u3051\u3089\u308C\u306A\u3044\uFF09\u3001next: \u6B21\u306B\u3084\u308B\u9806\u3001watch: waiting / delegated \u306E issue \u3068\u30B5\u30D6\u3059\u3079\u3066\uFF08\u30DC\u30FC\u30C9\u306B\u8F09\u3063\u3066\u3044\u308B\u304B\u306B\u3088\u3089\u306A\u3044\u3002\u4E26\u3073\u306F Pick \u3068\u540C\u3058\u3002ADR-0184\uFF09\u3001done: \u7247\u4ED8\u3044\u305F\u3082\u306E\uFF09\u3067\u3001\u305D\u308C\u305E\u308C\u753B\u9762\u306E\u9806\u3002\u30AB\u30FC\u30C9\u306E key \u306F issue \u306E ID\u30FB\u30B5\u30D6\u306E\u5408\u6210\u30AD\u30FC\uFF08i-N#xxxxxx\uFF09\u30FBroutine \u306E ID",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u4ECA\u65E5\uFF09" }
      }
    }
  },
  {
    name: "list_pending_boards",
    description: "\u4ECA\u65E5\u3088\u308A\u524D\u3067\u3001\u672A\u5B8C\u4E86\u304C\u6B8B\u3063\u3066\u3044\u3066\u7DE0\u3081\u3066\u3044\u306A\u3044\u904E\u53BB\u306E\u30DC\u30FC\u30C9\u4E00\u89A7\u3092\u53D6\u5F97\u3059\u308B",
    inputSchema: {
      type: "object",
      properties: {
        today: { type: "string", description: "\u57FA\u6E96\u65E5 YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u4ECA\u65E5\uFF09" }
      }
    }
  },
  {
    name: "list_issues",
    description: "\u6761\u4EF6\uFF08status\u3001priority\u3001label\u3001\u4E88\u5B9A\u306E\u6709\u7121\u3001Inbox\u306E\u307F\u3001\u6587\u5B57\u5217\u691C\u7D22\u3001\u4E26\u3073\u9806\uFF09\u3067\u7D5E\u3063\u305F issue \u4E00\u89A7\u3092\u53D6\u5F97\u3059\u308B",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        statuses: { type: "array", items: { type: "string" } },
        priorities: { type: "array", items: { type: "string" } },
        labels: { type: "array", items: { type: "string" } },
        scheduled: { type: "string", enum: ["any", "yes", "no"] },
        inbox_only: { type: "boolean", description: "true \u306E\u3068\u304D Inbox\uFF08open \u3067 clarified \u3067\u306A\u3044\u3002\u65E5\u4ED8\u306F\u898B\u306A\u3044\u3002ADR-0148\uFF09\u306E issue \u306E\u307F\u8FD4\u3059" },
        sort: { type: "string", enum: ["id", "summary", "status", "priority", "soft_deadline", "deadline", "created", "scheduled", "next_scheduled"], description: "next_scheduled \u306F\u4EE5\u524D\u306E\u540D\u524D\uFF08scheduled \u3068\u540C\u3058\uFF09" },
        desc: { type: "boolean" },
        limit: { type: "number", description: "\u6700\u5927\u4EF6\u6570\uFF08\u65E2\u5B9A 100\uFF09" }
      }
    }
  },
  {
    name: "get_issue",
    description: "issue \u306E\u8A73\u7D30\uFF08frontmatter\u3001Markdown\u672C\u6587\u3001\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u306E\u4E00\u89A7\u3001\u6309\u5206\u5F8C\u306E\u5B9F\u7E3E\u5DE5\u6570\u3001\u6301\u3061\u8D8A\u3057\u56DE\u6570\uFF09\u3092\u53D6\u5F97\u3059\u308B\u3002effortMinutes \u306F\u89AA\u306B\u76F4\u63A5\u4ED8\u3051\u305F\u5206\u3068\u30B5\u30D6\u306E\u5206\u306E\u5408\u8A08\u3001directEffortMinutes \u306F\u89AA\u306B\u76F4\u63A5\u4ED8\u3051\u305F\u5206\u3060\u3051",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "\u4F8B: i-1" }
      },
      required: ["id"]
    }
  },
  {
    name: "get_worklog_summary",
    description: "\u671F\u9593\u5185\u306E\u30BF\u30B9\u30AF\u5225\u5B9F\u7E3E\u5DE5\u6570\uFF08\u6309\u5206\u5F8C\u30FB\u6309\u5206\u524D\uFF09\u3001\u8A18\u9332\u4E2D\u306E\u30BF\u30A4\u30DE\u30FC\u3001\u602A\u3057\u3044 worklog \u306E\u5019\u88DC\u3092\u53D6\u5F97\u3059\u308B",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "\u958B\u59CB\u65E5 YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u5168\u671F\u9593\uFF09" },
        to: { type: "string", description: "\u7D42\u4E86\u65E5 YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u5168\u671F\u9593\uFF09" }
      }
    }
  },
  {
    name: "get_routine_stats",
    description: "routine \u306E\u76F4\u8FD1 N \u65E5\u9593\u306E\u5B9F\u65BD\u7D50\u679C\u3068\u7D99\u7D9A\u7387\u3092\u53D6\u5F97\u3059\u308B",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "\u4F8B: r-1\uFF08\u7701\u7565\u6642\u306F\u6709\u52B9\u306A\u5168 routine\uFF09" },
        days: { type: "number", description: "\u9061\u308B\u65E5\u6570\uFF08\u65E2\u5B9A 14\uFF09" },
        today: { type: "string", description: "\u57FA\u6E96\u65E5 YYYY-MM-DD\uFF08\u7701\u7565\u6642\u306F\u4ECA\u65E5\uFF09" }
      }
    }
  },
  {
    name: "add_to_board",
    description: "\u6307\u5B9A\u65E5\u306E\u30DC\u30FC\u30C9\u306B issue \u304B\u30B5\u30D6\uFF08\u5408\u6210\u30AD\u30FC i-N#xxxxxx\uFF09\u3092\u8F09\u305B\u308B\u3002\u65E5\u4ED8\uFF08scheduled\uFF09\u306F\u66F8\u304B\u306A\u3044\uFF08ADR-0152\uFF09",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        issue_ids: { type: "array", items: { type: "string" }, description: "issue \u306E ID \u304B\u30B5\u30D6\u306E\u5408\u6210\u30AD\u30FC" }
      },
      required: ["date", "issue_ids"]
    }
  },
  {
    name: "remove_from_board",
    description: "\u6307\u5B9A\u65E5\u306E\u30DC\u30FC\u30C9\u304B\u3089 issue \u304B\u30B5\u30D6\uFF08\u5408\u6210\u30AD\u30FC\uFF09\u3092\u5916\u3059",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        issue_id: { type: "string", description: "issue \u306E ID \u304B\u30B5\u30D6\u306E\u5408\u6210\u30AD\u30FC" }
      },
      required: ["date", "issue_id"]
    }
  },
  {
    name: "order_card",
    description: "\u30DC\u30FC\u30C9\u306E\u30AB\u30FC\u30C9\u3092\u3001\u540C\u3058\u6B04\uFF08top / next\uFF09\u306E before \u306E\u524D\u306B\u52D5\u304B\u3059\uFF08before \u304C null \u306A\u3089\u6B04\u306E\u672B\u5C3E\uFF09\u3002\u4E26\u3073\u306F\u7FCC\u65E5\u4EE5\u964D\u306B\u3082\u5F15\u304D\u7D99\u3050",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        key: { type: "string", description: "\u30AB\u30FC\u30C9\u306E key\uFF08issue \u306E ID\u30FB\u30B5\u30D6\u306E\u5408\u6210\u30AD\u30FC\u30FBroutine \u306E ID\uFF09" },
        before: { type: ["string", "null"], description: "\u524D\u306B\u6765\u308B\u30AB\u30FC\u30C9\u306E key\u3002null \u306A\u3089\u6B04\u306E\u672B\u5C3E" }
      },
      required: ["date", "key", "before"]
    }
  },
  {
    name: "star_card",
    description: "\u30DC\u30FC\u30C9\u306E\u30AB\u30FC\u30C9\u306B \u2605 \u4ECA\u65E5\u306E\u6700\u91CD\u8981\u3092\u4ED8\u3051\u308B\uFF08on: true\uFF09\u304B\u5916\u3059\uFF08on: false\uFF09\u3002\u2605 \u306F 4 \u4EF6\u307E\u3067\u3002\u305D\u306E\u65E5\u3060\u3051\u3067\u7FCC\u65E5\u306B\u306F\u5F15\u304D\u7D99\u304C\u306A\u3044",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        key: { type: "string", description: "\u30AB\u30FC\u30C9\u306E key" },
        on: { type: "boolean" }
      },
      required: ["date", "key", "on"]
    }
  },
  {
    name: "set_routine_result",
    description: "\u6307\u5B9A\u65E5\u306E routine \u306E\u7D50\u679C\uFF08closed / canceled / null\uFF09\u3092\u8A18\u9332\u3059\u308B",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        routine_id: { type: "string" },
        result: { type: ["string", "null"], enum: ["closed", "canceled", null] }
      },
      required: ["date", "routine_id", "result"]
    }
  },
  {
    name: "carry_issues",
    description: "\u30DC\u30FC\u30C9\u4E0A\u306E\u672A\u5B8C\u4E86 issue\u30FB\u30B5\u30D6\u3092\u7247\u4ED8\u3051\u3001carried \u306B\u3059\u308B\uFF08ADR-0152\uFF09\u3002today: \u4ECA\u65E5\u306E\u30DC\u30FC\u30C9\u306B\u8F09\u305B\u308B\uFF08\u65E5\u4ED8\u3092\u66F8\u304B\u306A\u3044\uFF09\u3001next: Calendar \u3068 Tickler \u3092\u6D88\u3057\u3066 Next \u306B\u623B\u3059\u3001move: Calendar \u306E\u65E5\uFF08\u305D\u306E\u65E5\u306B\u3084\u3089\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u65E5\uFF09\u3092 reschedule_to \u306B\u3001tickler: Tickler\uFF08\u305D\u306E\u65E5\u306B Inbox \u306B\u623B\u3059\uFF09\u3092 reschedule_to \u306B\u3001inbox: clarified \u3092\u5916\u3059\uFF08\u65E5\u4ED8\u306F\u6B8B\u3059\uFF09\u3002\u30B5\u30D6\u306F tickler \u3068 inbox \u306B\u3067\u304D\u306A\u3044",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "\u30DC\u30FC\u30C9\u306E\u65E5\u4ED8 YYYY-MM-DD" },
        issue_ids: { type: "array", items: { type: "string" }, description: "issue \u306E ID \u304B\u30B5\u30D6\u306E\u5408\u6210\u30AD\u30FC" },
        mode: { type: "string", enum: ["today", "next", "move", "tickler", "inbox", "reschedule"], description: "reschedule \u306F\u4EE5\u524D\u306E\u540D\u524D\uFF08move \u3068\u540C\u3058\uFF09" },
        reschedule_to: { type: "string", description: "mode \u304C move / tickler \u306E\u3068\u304D\u306E\u65E5\u4ED8 YYYY-MM-DD" }
      },
      required: ["date", "issue_ids", "mode"]
    }
  },
  {
    name: "close_board",
    description: "\u672A\u5B8C\u4E86\u304C 0 \u4EF6\u306A\u3089\u305D\u306E\u65E5\u306E\u30DC\u30FC\u30C9\u3092\u7DE0\u3081\u3001\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u672C\u6587\u306E ## Task board \u306B\u8981\u7D04\u3092\u66F8\u304F",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" }
      },
      required: ["date"]
    }
  },
  {
    name: "reopen_board",
    description: "\u7DE0\u3081\u305F\u30DC\u30FC\u30C9\u3092\u958B\u304D\u76F4\u3059",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" }
      },
      required: ["date"]
    }
  },
  {
    name: "create_issue",
    description: "\u65B0\u3057\u3044 issue \u3092\u4F5C\u6210\u3059\u308B\uFF08\u5FC5\u8981\u306A\u3089\u305D\u306E\u65E5\u306E\u30DC\u30FC\u30C9\u306B\u3082\u8F09\u305B\u308B\uFF09",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        scheduled: { type: ["string", "null"], description: "Calendar \u306E\u65E5 YYYY-MM-DD\uFF08\u305D\u306E\u65E5\u306B\u3084\u3089\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u65E5\u3002ADR-0152\uFF09\u3002\u4ECA\u65E5\u3084\u308B\u3068\u6C7A\u3081\u305F\u3060\u3051\u306A\u3089\u66F8\u304B\u306A\u3044" },
        tickler: { type: ["string", "null"], description: "Tickler \u306E\u65E5 YYYY-MM-DD\uFF08\u305D\u306E\u65E5\u307E\u3067\u51FA\u3055\u305A\u3001\u305D\u306E\u65E5\u306B Inbox \u306B\u623B\u3059\uFF09" },
        priority: { type: ["string", "null"], enum: ["high", "mid", "low", "chore", null] },
        labels: { type: "array", items: { type: "string" } },
        estimated: { type: ["number", "null"] },
        soft_deadline: { type: ["string", "null"] },
        deadline: { type: ["string", "null"] },
        clarified: { type: "boolean", description: "\u6574\u7406\u6E08\u307F\uFF08\u4F55\u3092\u3059\u308B\u304B\u6C7A\u3081\u305F\uFF09\u3067\u4F5C\u308B\u3002\u7701\u304F\u3068 Inbox\uFF08\u672A\u6574\u7406\uFF09\u306B\u5165\u308B\uFF08ADR-0148\uFF09" },
        add_to_board_date: { type: ["string", "null"], description: "\u6307\u5B9A\u3057\u305F\u65E5\u4ED8\uFF08YYYY-MM-DD\uFF09\u306E\u30DC\u30FC\u30C9\u306B\u3082\u8F09\u305B\u308B" }
      },
      required: ["summary"]
    }
  },
  {
    name: "update_issue",
    description: "issue \u306E frontmatter\uFF08status, priority, scheduled, deadline, estimated \u306A\u3069\uFF09\u3092\u691C\u67FB\u4ED8\u304D\u3067\u66F4\u65B0\u3059\u308B\u3002\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u306F update_sub_issue \u3067\u76F4\u3059",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        summary: { type: "string" },
        status: { type: "string", enum: ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] },
        status_detail: { type: ["string", "null"] },
        delegated_to: { type: ["string", "null"] },
        priority: { type: ["string", "null"], enum: ["high", "mid", "low", "chore", null] },
        labels: { type: "array", items: { type: "string" } },
        scheduled: { type: ["string", "null"], description: "Calendar \u306E\u65E5 YYYY-MM-DD\uFF08\u305D\u306E\u65E5\u306B\u3084\u3089\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u65E5\u3002ADR-0152\uFF09\u3002null \u3067\u6D88\u3059" },
        tickler: { type: ["string", "null"], description: "Tickler \u306E\u65E5 YYYY-MM-DD\uFF08\u305D\u306E\u65E5\u306B Inbox \u306B\u623B\u3059\uFF09\u3002null \u3067\u6D88\u3059" },
        soft_deadline: { type: ["string", "null"] },
        deadline: { type: ["string", "null"] },
        revisit: { type: ["string", "null"] },
        reviewed: { type: ["string", "null"] },
        estimated: { type: ["number", "null"] },
        clarified: { type: ["boolean", "null"], description: "\u6574\u7406\u6E08\u307F\u304B\uFF08ADR-0148\uFF09\u3002true \u3067 Inbox \u304B\u3089\u51FA\u308B\u3002false / null \u3067 Inbox \u306B\u623B\u3059\uFF08\u65E5\u4ED8\u306F\u6B8B\u308B\uFF09" }
      },
      required: ["id"]
    }
  },
  {
    name: "create_sub_issues",
    description: "issue \u306E md \u306E\u4E2D\u306B\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u3092\u8DB3\u3059\uFF08ADR-0135\u3002\u30B5\u30D6\u306E\u30B5\u30D6\u306F\u4F5C\u308C\u306A\u3044\uFF09\u3002items \u306E\u9806\u306B\u3001\u672B\u5C3E\u304B position \u306E\u4F4D\u7F6E\u306B\u7F6E\u304F\u3002\u4F5C\u3063\u305F\u30B5\u30D6\u306E\u5408\u6210\u30AD\u30FC\uFF08i-12#k3f9a2\uFF09\u3092\u8FD4\u3059\u3002\u5927\u304D\u3044 issue \u3092\u5206\u3051\u308B\u3068\u304D\u306B\u4F7F\u3046",
    inputSchema: {
      type: "object",
      properties: {
        parent: { type: "string", description: "\u89AA\u306E issue \u306E ID\uFF08i-N\uFF09" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              summary: { type: "string" },
              status: { type: "string", enum: ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] },
              delegated_to: { type: ["string", "null"], description: "status \u304C delegated \u306E\u3068\u304D\u3060\u3051\uFF08m-N\uFF09" },
              start: { type: ["string", "null"], description: "\u30AC\u30F3\u30C8\u30C1\u30E3\u30FC\u30C8\u306E\u958B\u59CB\u65E5\uFF08YYYY-MM-DD\uFF09" },
              end: { type: ["string", "null"], description: "\u30AC\u30F3\u30C8\u30C1\u30E3\u30FC\u30C8\u306E\u7D42\u4E86\u65E5\uFF08YYYY-MM-DD\uFF09" },
              scheduled: { type: ["string", "null"], description: "Calendar \u306E\u65E5 YYYY-MM-DD\uFF08\u305D\u306E\u65E5\u306B\u3084\u3089\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u65E5\u3002ADR-0152\uFF09" },
              soft_deadline: { type: ["string", "null"] },
              deadline: { type: ["string", "null"] },
              estimated: { type: ["number", "null"], description: "\u5206\u3002\u89AA\u306E estimated\uFF08\u5168\u4F53\u306E\u4E88\u7B97\uFF09\u306B\u306F\u8DB3\u3055\u306A\u3044" },
              depends_on: { type: ["array", "null"], items: { type: "string" }, description: "\u540C\u3058\u89AA\u306E\u30B5\u30D6\u306E id\uFF086 \u6587\u5B57\uFF09" },
              body: { type: "string", description: "\u30B5\u30D6\u306E\u672C\u6587\uFF08Markdown\uFF09" }
            },
            required: ["summary"]
          }
        },
        position: { type: "number", description: "\u5DEE\u3057\u8FBC\u3080\u4F4D\u7F6E\uFF080 \u304B\u3089\u3002\u7701\u304F\u3068\u672B\u5C3E\uFF09" }
      },
      required: ["parent", "items"]
    }
  },
  {
    name: "update_sub_issue",
    description: "\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u306E\u9805\u76EE\u3068\u672C\u6587\u3092\u691C\u67FB\u4ED8\u304D\u3067\u76F4\u3059\u3002null \u3067\u9805\u76EE\u3092\u6D88\u3059\u3002status \u306E\u5909\u5316\u306F statuslog \u306B\u8A18\u9332\u3057\u3001closed / canceled \u306A\u3089\u305D\u306E\u30B5\u30D6\u306E\u30BF\u30A4\u30DE\u30FC\u3092\u6B62\u3081\u308B\u3002\u89AA\u306E status \u306F\u5909\u3048\u306A\u3044",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "\u5408\u6210\u30AD\u30FC\uFF08\u4F8B: i-12#k3f9a2\uFF09" },
        summary: { type: "string" },
        status: { type: "string", enum: ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] },
        delegated_to: { type: ["string", "null"], description: "status \u304C delegated \u306E\u3068\u304D\u3060\u3051\uFF08m-N\uFF09" },
        start: { type: ["string", "null"], description: "\u30AC\u30F3\u30C8\u30C1\u30E3\u30FC\u30C8\u306E\u958B\u59CB\u65E5\uFF08YYYY-MM-DD\uFF09" },
        end: { type: ["string", "null"], description: "\u30AC\u30F3\u30C8\u30C1\u30E3\u30FC\u30C8\u306E\u7D42\u4E86\u65E5\uFF08YYYY-MM-DD\uFF09" },
        scheduled: { type: ["string", "null"], description: "Calendar \u306E\u65E5 YYYY-MM-DD\uFF08\u305D\u306E\u65E5\u306B\u3084\u3089\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u65E5\u3002ADR-0152\uFF09" },
        soft_deadline: { type: ["string", "null"] },
        deadline: { type: ["string", "null"] },
        estimated: { type: ["number", "null"], description: "\u5206\u3002\u89AA\u306E estimated\uFF08\u5168\u4F53\u306E\u4E88\u7B97\uFF09\u306B\u306F\u8DB3\u3055\u306A\u3044" },
        depends_on: { type: ["array", "null"], items: { type: "string" }, description: "\u540C\u3058\u89AA\u306E\u30B5\u30D6\u306E id\uFF086 \u6587\u5B57\uFF09" },
        body: { type: "string", description: "\u30B5\u30D6\u306E\u672C\u6587\uFF08Markdown\uFF09" }
      },
      required: ["key"]
    }
  },
  {
    name: "move_sub_issue",
    description: "\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u3092\u3001\u540C\u3058\u89AA\u306E\u4E2D\u3067 position \u306E\u4F4D\u7F6E\uFF080 \u304B\u3089\uFF09\u3078\u79FB\u3059",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "\u5408\u6210\u30AD\u30FC\uFF08\u4F8B: i-12#k3f9a2\uFF09" },
        position: { type: "number" }
      },
      required: ["key", "position"]
    }
  },
  {
    name: "delete_sub_issue",
    description: "\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u3092\u672C\u6587\u3054\u3068\u6D88\u3059\u3002\u8A18\u9332\u4E2D\u306E\u30BF\u30A4\u30DE\u30FC\u306F\u6B62\u3081\u308B\u3002worklog \u306E\u884C\u306F\u6B8B\u308A\u3001\u89AA\u306E\u5B9F\u7E3E\u306B\u542B\u307E\u308C\u308B\u3002\u307B\u304B\u306E\u30B5\u30D6\u306E depends_on \u306B\u3042\u308B\u3068\u304D\u306F\u6D88\u305B\u306A\u3044",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "\u5408\u6210\u30AD\u30FC\uFF08\u4F8B: i-12#k3f9a2\uFF09" }
      },
      required: ["key"]
    }
  },
  {
    name: "start_timer",
    description: "\u6307\u5B9A\u3057\u305F issue / routine / \u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u306E\u4F5C\u696D\u8A18\u9332\u30BF\u30A4\u30DE\u30FC\u3092\u958B\u59CB\u3059\u308B\u3002\u30B5\u30D6\u306F\u5408\u6210\u30AD\u30FC\uFF08i-12#k3f9a2\uFF09\u3067\u6307\u3059\u3002open \u306E\u3082\u306E\u306F in-progress \u306B\u3059\u308B\uFF08\u30B5\u30D6\u306E\u3068\u304D\u306F\u89AA\u306E status \u3092\u5909\u3048\u306A\u3044\uFF09",
    inputSchema: {
      type: "object",
      properties: {
        task_ids: { type: "array", items: { type: "string" } }
      },
      required: ["task_ids"]
    }
  },
  {
    name: "stop_timer",
    description: "\u8A18\u9332\u4E2D\u306E\u30BF\u30A4\u30DE\u30FC\u3092\u505C\u6B62\u3059\u308B\uFF08task_ids \u7701\u7565\u6642\u306F\u3059\u3079\u3066\u306E\u8A18\u9332\u4E2D\u30BF\u30A4\u30DE\u30FC\u3092\u6B62\u3081\u308B\uFF09\u3002\u30B5\u30D6\u306F\u5408\u6210\u30AD\u30FC\u3067\u6307\u3059\u3002\u89AA\u306E ID \u3067\u306F\u89AA\u306B\u76F4\u63A5\u4ED8\u3051\u305F\u8A18\u9332\u3060\u3051\u3092\u6B62\u3081\u308B",
    inputSchema: {
      type: "object",
      properties: {
        task_ids: { type: "array", items: { type: "string" } }
      }
    }
  },
  {
    name: "append_daily_note",
    description: "\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30C8\u672C\u6587\u306E\u672B\u5C3E\u306B AI \u306E\u30A2\u30C9\u30D0\u30A4\u30B9\u3084\u632F\u308A\u8FD4\u308A\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u8FFD\u8A18\u3059\u308B\uFF08\u65E2\u5B58\u306E\u672C\u6587\u306F\u5909\u66F4\u30FB\u524A\u9664\u3057\u306A\u3044\uFF09",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        heading: { type: "string", description: "\u898B\u51FA\u3057\u540D\uFF08\u4F8B: AI \u632F\u308A\u8FD4\u308A\uFF09" },
        content: { type: "string", description: "\u8FFD\u8A18\u3059\u308B\u672C\u6587" }
      },
      required: ["date", "heading", "content"]
    }
  }
];
var TASK_NAMES = new Set(TOOLS.map((t) => t.name));
function listMcpTools(toolsets) {
  const on = (g) => g === "meta" || !toolsets || toolsets.includes(g);
  const out = [];
  if (on("task")) out.push(...TOOLS.map((t) => ({ ...t, name: `${TASK_PREFIX}${t.name}` })));
  for (const g of TOOLSETS) if (g !== "task" && on(g)) out.push(...PKM_TOOLS[g]);
  return out;
}
function resolveTool(name) {
  if (name.startsWith(TASK_PREFIX) && TASK_NAMES.has(name.slice(TASK_PREFIX.length))) return { group: "task", base: name.slice(TASK_PREFIX.length), alias: false };
  if (TASK_NAMES.has(name)) return { group: "task", base: name, alias: true };
  if (isPkmTool(name)) return { group: name.split("_")[0], base: name, alias: false };
  return null;
}
function loadIndex(root) {
  const { data, problems, paths } = readVault(root);
  const lintProblems = lintVault(data, { paths: new Set(paths) });
  return {
    index: new TaskIndex(data),
    problems: [...problems, ...lintProblems]
  };
}
function calendarArg(v) {
  if (v === void 0) return void 0;
  if (v === null) return null;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (v.length === 1) return String(v[0]);
    throw new Error("scheduled \u306F\u65E5\u4ED8 1 \u3064\u306B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08ADR-0152\uFF09");
  }
  return String(v);
}
function subPatch(args) {
  const out = {};
  const str2 = (key) => {
    const v = args[key];
    if (v === null) return null;
    if (typeof v !== "string") throw new Error(`${key} \u306F\u6587\u5B57\u5217\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    return v.trim() || null;
  };
  const list = (key) => {
    const v = args[key];
    if (v === null) return [];
    if (!Array.isArray(v)) throw new Error(`${key} \u306F\u914D\u5217\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    return v.map(String);
  };
  if (args.summary !== void 0) out.summary = String(args.summary);
  if (args.status !== void 0) out.status = String(args.status);
  if (args.delegated_to !== void 0) out.delegatedTo = str2("delegated_to");
  if (args.start !== void 0) out.start = str2("start");
  if (args.end !== void 0) out.end = str2("end");
  if (args.scheduled !== void 0) out.scheduled = calendarArg(args.scheduled) ?? null;
  if (args.soft_deadline !== void 0) out.softDeadline = str2("soft_deadline");
  if (args.deadline !== void 0) out.deadline = str2("deadline");
  if (args.estimated !== void 0) {
    if (args.estimated !== null && typeof args.estimated !== "number") throw new Error("estimated \u306F\u6570\uFF08\u5206\uFF09\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
    out.estimated = args.estimated;
  }
  if (args.depends_on !== void 0) out.dependsOn = [...new Set(list("depends_on"))];
  if (args.body !== void 0) out.body = String(args.body ?? "");
  return out;
}
function callMcpTool(ctx, name, args = {}) {
  const resolved = resolveTool(name);
  if (!resolved) throw new Error(`[unknown_tool] \u672A\u77E5\u306E\u30C4\u30FC\u30EB\u3067\u3059: ${name}`);
  if (resolved.group !== "meta" && ctx.toolsets && !ctx.toolsets.includes(resolved.group)) {
    throw new Error(`[unknown_tool] ${resolved.group} \u306E\u7FA4\u306F\u516C\u958B\u3057\u3066\u3044\u307E\u305B\u3093\uFF08--toolset\uFF09: ${name}`);
  }
  const now = ctx.now ? ctx.now() : /* @__PURE__ */ new Date();
  const today = localToday(now);
  const cache = ctx.cache ?? new VaultCache(ctx.root);
  cache.refresh();
  if (resolved.group !== "task") {
    return callPkmTool({ root: ctx.root, today, notes: cache.notes, taskProblems: () => cache.taskIndex().problems, log: ctx.log }, name, args);
  }
  try {
    return callTaskTool(ctx, resolved.base, args, now, today, cache.taskIndex());
  } finally {
    if (!TASK_READ_TOOLS.has(resolved.base)) cache.invalidate();
  }
}
function callTaskTool(ctx, name, args, now, today, { index, problems }) {
  if ((name === "create_issue" || name === "update_issue" || name === "list_issues") && args.parent !== void 0) {
    throw new Error("parent \u306F\u5EC3\u6B62\u3057\u307E\u3057\u305F\uFF08ADR-0135\uFF09\u3002\u5206\u3051\u308B\u3068\u304D\u306F create_sub_issues \u3067\u30B5\u30D6\u30A4\u30B7\u30E5\u30FC\u3092\u8DB3\u3057\u3066\u304F\u3060\u3055\u3044");
  }
  switch (name) {
    case "get_overview": {
      const date = typeof args.date === "string" ? args.date : today;
      if (!isLocalDate(date)) throw new Error(`date \u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(args.date)}`);
      const overview = buildOverview(index, date, now.getTime(), {
        availableMinutes: typeof args.available_minutes === "number" ? args.available_minutes : void 0,
        staleDays: typeof args.stale_days === "number" ? args.stale_days : void 0,
        cautionDays: typeof args.caution_days === "number" ? args.caution_days : void 0
      });
      const top = (xs) => xs.slice(0, OVERVIEW_TOP);
      const { stalled } = overview;
      return {
        ...overview,
        stalled: { inProgressStale: top(stalled.inProgressStale), revisitDue: top(stalled.revisitDue), waitingOrDelegated: top(stalled.waitingOrDelegated) },
        stalledCounts: {
          inProgressStale: stalled.inProgressStale.length,
          revisitDue: stalled.revisitDue.length,
          waitingOrDelegated: stalled.waitingOrDelegated.length
        },
        problems: top(problems),
        problemCount: problems.length
      };
    }
    case "get_board": {
      const date = typeof args.date === "string" ? args.date : today;
      if (!isLocalDate(date)) throw new Error(`date \u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(args.date)}`);
      const board = index.board(date)?.board ?? emptyBoard();
      const lanes = boardLanes(index, date, board);
      const card = (c) => ({
        key: c.key,
        kind: c.kind,
        ...c.kind === "sub" ? { parent: c.sub.parent, parentSummary: c.parent?.summary ?? null } : {},
        summary: cardSummary(c),
        status: cardStatus(board, c),
        starred: board.stars.includes(c.key),
        carried: board.carried.includes(c.key)
      });
      return {
        date,
        closed: board.closed,
        lanes: Object.fromEntries(LANES.map((l) => [l, lanes[l].map(card)])),
        unfinished: unfinished(index, date, board),
        carried: board.carried,
        stars: board.stars,
        routineResults: board.routines,
        runningTimers: index.running()
      };
    }
    case "list_pending_boards": {
      const refDate = typeof args.today === "string" ? args.today : today;
      if (!isLocalDate(refDate)) throw new Error(`today \u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(args.today)}`);
      return pendingBoards(index, index.data.boards, refDate).map((b) => {
        const u = unfinished(index, b.date, b.board);
        return {
          date: b.date,
          unfinishedIssues: u.issues,
          unfinishedSubs: u.subs,
          unfinishedRoutines: u.routines
        };
      });
    }
    case "list_issues": {
      const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 100;
      if (args.inbox_only === true) {
        return index.data.issues.filter((i) => isInbox(i, today)).slice(0, limit);
      }
      const q = {
        ...defaultQuery(),
        ...typeof args.text === "string" ? { text: args.text } : {},
        ...Array.isArray(args.statuses) ? { statuses: args.statuses } : {},
        ...Array.isArray(args.priorities) ? { priorities: args.priorities } : {},
        ...Array.isArray(args.labels) ? { labels: args.labels } : {},
        ...args.scheduled === "any" || args.scheduled === "yes" || args.scheduled === "no" ? { scheduled: args.scheduled } : {},
        ...typeof args.sort === "string" ? { sort: args.sort === "next_scheduled" ? "scheduled" : args.sort } : {},
        ...typeof args.desc === "boolean" ? { desc: args.desc } : {}
      };
      return queryIssues(index.data.issues, q, today).slice(0, limit);
    }
    case "get_issue": {
      const id = String(args.id ?? "");
      const issue = index.issues.get(id);
      if (!issue) throw new Error(`issue \u304C\u3042\u308A\u307E\u305B\u3093: ${id}`);
      const efforts = index.effortMinutes(now.getTime());
      const byKey = index.effortByKey(now.getTime());
      const counts = carryCounts(index.data.boards);
      return {
        ...issue,
        body: splitSubIssueText(readMarkdownBody(ctx.root, issue.path)).head,
        subIssues: index.subs(id).map(({ path: _path, parent: _parent, ...s }) => ({ ...s, effortMinutes: Math.round(byKey.get(s.key) ?? 0) })),
        effortMinutes: Math.round(efforts.get(id) ?? 0),
        directEffortMinutes: Math.round(byKey.get(id) ?? 0),
        carryCount: counts.get(id) ?? 0
      };
    }
    case "get_worklog_summary": {
      const from = typeof args.from === "string" ? args.from : null;
      const to = typeof args.to === "string" ? args.to : null;
      if (from !== null && !isLocalDate(from)) throw new Error(`from \u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${from}`);
      if (to !== null && !isLocalDate(to)) throw new Error(`to \u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${to}`);
      const logs = index.data.worklogs.filter((l) => {
        const d = l.from.slice(0, 10);
        if (from !== null && d < from) return false;
        if (to !== null && d > to) return false;
        return true;
      });
      const nowMs = now.getTime();
      const proratedMs = prorateEffort(logs, nowMs);
      const rawMins = rawEffortMinutes(logs, nowMs);
      const byTask = [...rawMins.entries()].map(([taskId, raw]) => ({
        taskId,
        summary: index.issues.get(taskId)?.summary ?? index.routines.get(taskId)?.summary ?? null,
        rawMinutes: Math.round(raw),
        proratedMinutes: Math.round((proratedMs.get(taskId) ?? 0) / 6e4)
      }));
      return {
        from,
        to,
        entryCount: logs.length,
        byTask,
        running: index.running(),
        findings: reviewWorklogs(index, nowMs)
      };
    }
    case "get_routine_stats": {
      const refDate = typeof args.today === "string" ? args.today : today;
      if (!isLocalDate(refDate)) throw new Error(`today \u304C YYYY-MM-DD \u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${String(args.today)}`);
      const days = typeof args.days === "number" && args.days > 0 ? Math.trunc(args.days) : 14;
      const targets = typeof args.id === "string" ? [index.routines.get(args.id)].filter((r) => r !== void 0) : [...index.routines.values()].filter((r) => r.active);
      if (typeof args.id === "string" && targets.length === 0) {
        throw new Error(`routine \u304C\u3042\u308A\u307E\u305B\u3093: ${args.id}`);
      }
      return targets.map((r) => {
        const results = routineResults(index, r, refDate, days);
        const scheduledDays = results.filter((d) => d.state !== "off");
        const closedDays = scheduledDays.filter((d) => d.state === "closed");
        return {
          id: r.id,
          summary: r.summary,
          active: r.active,
          scheduledCount: scheduledDays.length,
          closedCount: closedDays.length,
          completionRate: scheduledDays.length > 0 ? Math.round(closedDays.length / scheduledDays.length * 100) / 100 : null,
          days: results
        };
      });
    }
    case "add_to_board": {
      const date = String(args.date ?? "");
      const ids = Array.isArray(args.issue_ids) ? args.issue_ids.map(String) : [];
      addToBoardOnDisk(ctx.root, index, date, ids, ctx.device, now);
      return { ok: true, date, added: ids };
    }
    case "remove_from_board": {
      const date = String(args.date ?? "");
      const issueId = String(args.issue_id ?? "");
      removeFromBoardOnDisk(ctx.root, index, date, issueId, ctx.device, now);
      return { ok: true, date, removed: issueId };
    }
    case "order_card": {
      const date = String(args.date ?? "");
      const key = String(args.key ?? "");
      const before = args.before === null || args.before === void 0 ? null : String(args.before);
      orderCardOnDisk(ctx.root, index, date, key, before, ctx.device, now);
      return { ok: true, date, key, before };
    }
    case "star_card": {
      const date = String(args.date ?? "");
      const key = String(args.key ?? "");
      starCardOnDisk(ctx.root, index, date, key, args.on, ctx.device, now);
      return { ok: true, date, key, on: args.on };
    }
    case "set_routine_result": {
      const date = String(args.date ?? "");
      const routineId = String(args.routine_id ?? "");
      const result = args.result ?? null;
      setRoutineResultOnDisk(ctx.root, index, date, routineId, result, ctx.device, now);
      return { ok: true, date, routineId, result };
    }
    case "carry_issues": {
      const date = String(args.date ?? "");
      const ids = Array.isArray(args.issue_ids) ? args.issue_ids.map(String) : [];
      const mode = args.mode;
      const rescheduleTo = typeof args.reschedule_to === "string" ? args.reschedule_to : null;
      carryIssuesOnDisk(ctx.root, index, date, ids, mode, rescheduleTo, ctx.device, now);
      return { ok: true, date, carried: ids, mode, rescheduleTo };
    }
    case "close_board": {
      const date = String(args.date ?? "");
      return closeBoardOnDisk(ctx.root, index, date, ctx.device, now);
    }
    case "reopen_board": {
      const date = String(args.date ?? "");
      appendBoardOpsOnDisk(ctx.root, index, date, ctx.device, [{ op: "reopen" }], now);
      return { ok: true, date, reopened: true };
    }
    case "create_issue": {
      return createIssueOnDisk(
        ctx.root,
        index,
        {
          summary: String(args.summary ?? ""),
          scheduled: calendarArg(args.scheduled) ?? null,
          tickler: args.tickler === void 0 ? void 0 : args.tickler,
          priority: args.priority,
          labels: Array.isArray(args.labels) ? args.labels.map(String) : void 0,
          estimated: args.estimated,
          soft_deadline: args.soft_deadline,
          deadline: args.deadline,
          clarified: args.clarified,
          add_to_board_date: args.add_to_board_date
        },
        ctx.device,
        now
      );
    }
    case "update_issue": {
      return updateIssueOnDisk(ctx.root, index, {
        id: String(args.id ?? ""),
        ...args.summary !== void 0 ? { summary: String(args.summary) } : {},
        ...args.status !== void 0 ? { status: args.status } : {},
        ...args.status_detail !== void 0 ? { status_detail: args.status_detail } : {},
        ...args.delegated_to !== void 0 ? { delegated_to: args.delegated_to } : {},
        ...args.priority !== void 0 ? { priority: args.priority } : {},
        ...Array.isArray(args.labels) ? { labels: args.labels.map(String) } : {},
        ...args.scheduled !== void 0 ? { scheduled: calendarArg(args.scheduled) ?? null } : {},
        ...args.tickler !== void 0 ? { tickler: args.tickler } : {},
        ...args.soft_deadline !== void 0 ? { soft_deadline: args.soft_deadline } : {},
        ...args.deadline !== void 0 ? { deadline: args.deadline } : {},
        ...args.revisit !== void 0 ? { revisit: args.revisit } : {},
        ...args.reviewed !== void 0 ? { reviewed: args.reviewed } : {},
        ...args.estimated !== void 0 ? { estimated: args.estimated } : {},
        ...args.clarified !== void 0 ? { clarified: args.clarified } : {}
      }, { device: ctx.device, now });
    }
    case "create_sub_issues": {
      const items = Array.isArray(args.items) ? args.items.map((it) => subPatch(it)) : [];
      const position = args.position === void 0 ? void 0 : Number(args.position);
      const created = createSubIssuesOnDisk(ctx.root, index, String(args.parent ?? ""), items, now, position);
      return { ok: true, created };
    }
    case "update_sub_issue": {
      const key = String(args.key ?? "");
      const sub = updateSubIssueOnDisk(ctx.root, index, key, subPatch(args), { device: ctx.device, now, via: "mcp" });
      return { ok: true, key, sub };
    }
    case "move_sub_issue": {
      const key = String(args.key ?? "");
      moveSubIssueOnDisk(ctx.root, index, key, Number(args.position));
      return { ok: true, key, position: Number(args.position) };
    }
    case "delete_sub_issue": {
      const key = String(args.key ?? "");
      deleteSubIssueOnDisk(ctx.root, index, key, now);
      return { ok: true, key, deleted: true };
    }
    case "start_timer": {
      const ids = Array.isArray(args.task_ids) ? args.task_ids.map(String) : [];
      const started = startTimerOnDisk(ctx.root, index, ids, ctx.device, now);
      return { ok: true, started };
    }
    case "stop_timer": {
      const ids = Array.isArray(args.task_ids) ? args.task_ids.map(String) : void 0;
      const stopped = stopTimerOnDisk(ctx.root, index, ids, now);
      return { ok: true, stopped };
    }
    case "append_daily_note": {
      const date = String(args.date ?? "");
      const heading = String(args.heading ?? "");
      const content = String(args.content ?? "");
      return appendDailyNoteOnDisk(ctx.root, date, heading, content, now);
    }
    default:
      throw new Error(`[unknown_tool] \u672A\u77E5\u306E\u30C4\u30FC\u30EB\u3067\u3059: ${name}`);
  }
}
function resultMeta(name, out) {
  const meta = {};
  if (Array.isArray(out)) meta.count = out.length;
  else if (out && typeof out === "object") {
    const o = out;
    if (typeof o.total === "number") meta.count = o.total;
    if (o.truncated === true) meta.truncated = true;
  }
  if (name === "note_search" && typeof meta.count === "number") meta.hits = meta.count;
  return meta;
}
function toolsCall(ctx, id, params) {
  const name = String(params.name ?? "");
  const args = typeof params.arguments === "object" && params.arguments !== null && !Array.isArray(params.arguments) ? params.arguments : {};
  const resolved = resolveTool(name);
  const started = performance.now();
  let result;
  let logFields;
  try {
    const out = callMcpTool(ctx, name, args);
    const text = JSON.stringify(out) ?? "null";
    result = { content: [{ type: "text", text }] };
    logFields = { bytes: Buffer.byteLength(text), ...resultMeta(resolved?.base ?? name, out) };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const kind = /^\[[a-z_]+\]/.test(raw) || !(e instanceof TypeError || e instanceof RangeError) ? errorKind(raw) : "internal";
    const message = withErrorKind(raw, kind);
    result = { isError: true, content: [{ type: "text", text: message }] };
    logFields = { bytes: Buffer.byteLength(message), error: kind };
  }
  ctx.log?.write("call", {
    tool: resolved ? resolved.group === "task" ? `${TASK_PREFIX}${resolved.base}` : resolved.base : name,
    ...resolved?.alias ? { alias: true } : {},
    args: summarizeArgs(args),
    ms: Math.round(performance.now() - started),
    ...logFields
  });
  return { jsonrpc: "2.0", id, result };
}
function handleMcpRequest(ctx, req) {
  const id = req.id ?? null;
  if (req.method === "notifications/initialized" || req.method.startsWith("notifications/")) {
    return null;
  }
  if (req.method === "initialize") {
    const info = req.params?.clientInfo;
    ctx.client = info && typeof info === "object" ? info : null;
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "pkm", version: SERVER_VERSION }
      }
    };
  }
  if (req.method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  if (req.method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: listMcpTools(ctx.toolsets) } };
  }
  if (req.method === "tools/call") {
    return toolsCall(ctx, id, req.params ?? {});
  }
  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${req.method}` }
  };
}
var SERVER_VERSION = "2.0.0";
function logStart(ctx) {
  const started = performance.now();
  ctx.cache?.refresh();
  ctx.cache?.taskIndex();
  ctx.log?.write("start", {
    version: SERVER_VERSION,
    client: ctx.client ?? null,
    toolsets: ctx.toolsets ?? "all",
    device: ctx.device,
    fileCount: ctx.cache?.fileCount ?? null,
    noteCount: ctx.cache?.notes.notes.size ?? null,
    indexMs: Math.round(performance.now() - started)
  });
}
function parseMcpArgs(argv) {
  let device = process.env.PKM_TASK_DEVICE ?? process.env.VAULT_TASK_DEVICE ?? "ai";
  let root = process.cwd();
  let toolsets;
  const flags = {};
  for (const a of argv) {
    if (a.startsWith("--device=")) {
      device = a.slice("--device=".length);
    } else if (a.startsWith("--toolset=")) {
      const names = a.slice("--toolset=".length).split(",").map((s) => s.trim()).filter(Boolean);
      const bad = names.filter((n) => !TOOLSETS.includes(n));
      if (bad.length) throw new Error(`\u672A\u77E5\u306E\u7FA4\u3067\u3059: ${bad.join(", ")}\uFF08${TOOLSETS.join(", ")}\uFF09`);
      toolsets = names;
    } else if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) flags[a.slice(2)] = true;
      else flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      root = a;
    }
  }
  return { root, device, toolsets, flags };
}
function daysAgo(n, now = /* @__PURE__ */ new Date()) {
  return localToday(new Date(now.getTime() - n * 864e5));
}
function runReport(argv) {
  const { root, flags } = parseMcpArgs(argv);
  const since = typeof flags.since === "string" ? flags.since : daysAgo(30);
  const until = typeof flags.until === "string" ? flags.until : localToday(/* @__PURE__ */ new Date());
  const report = buildReport(readLogLines(root), since, until);
  process.stdout.write(flags.json ? `${JSON.stringify(report)}
` : `${formatReport(report)}
`);
}
function runServer(argv) {
  const { root, device, toolsets } = parseMcpArgs(argv);
  const ctx = { root, device, toolsets, cache: new VaultCache(root), log: logEnabled() ? McpLogger.forServer(root) : null };
  let started = false;
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed);
      const res = handleMcpRequest(ctx, req);
      if (res !== null) process.stdout.write(`${JSON.stringify(res)}
`);
      if (req.method === "initialize" && !started) {
        started = true;
        setImmediate(() => logStart(ctx));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message } })}
`);
    }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  if (argv[0] === "report") runReport(argv.slice(1));
  else runServer(argv);
}
export {
  SERVER_VERSION,
  VaultCache,
  callMcpTool,
  handleMcpRequest,
  listMcpTools,
  logStart,
  parseMcpArgs,
  resolveTool
};
