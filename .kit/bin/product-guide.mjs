// cli/product-guide.ts
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, lstatSync, realpathSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ../../node_modules/.pnpm/marked@18.2.0/node_modules/marked/lib/marked.esm.js
function j() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var y = j();
function ie(l3) {
  y = l3;
}
var D = { exec: () => null };
function B(l3) {
  let e = [];
  return (t) => {
    let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
    return s || (s = l3(n), e[n] = s), s;
  };
}
function h(l3, e = "") {
  let t = typeof l3 == "string" ? l3 : l3.source, n = { replace: (s, i) => {
    let r = typeof i == "string" ? i : i.source;
    return r = r.replace(T.caret, "$1"), t = t.replace(s, r), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var we = ((l3 = "") => {
  try {
    return !!new RegExp("(?<=1)(?<!1)" + l3);
  } catch {
    return false;
  }
})();
var T = { codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm, listInterruptsParagraph: /^ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, endingSpaceTabChar: /[ \t]$/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, leadingSpaceTab: /^[ \t]+/, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+)[ \t]*)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, blockquoteMarkerWhitespace: /^( {0,3}>)([ \t]+)/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\][ \t]+\S/, listReplaceTask: /^\[[ xX]\][ \t]+/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, numericCharacterReference: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/, numericCharacterReferenceOrAmpersand: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (l3) => new RegExp(`^( {0,3}${l3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: B((l3) => new RegExp(`^ {0,${l3}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)), hrRegex: B((l3) => new RegExp(`^ {0,${l3}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)), fencesBeginRegex: B((l3) => new RegExp(`^ {0,${l3}}(?:\`\`\`|~~~)`)), headingBeginRegex: B((l3) => new RegExp(`^ {0,${l3}}#{1,6}(?:\\s|$)`)), pedanticHeadingBeginRegex: B((l3) => new RegExp(`^ {0,${l3}}#`)), htmlBeginRegex: B((l3) => new RegExp(`^ {0,${l3}}(?:</?(?:${K})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`, "i")), blockquoteBeginRegex: B((l3) => new RegExp(`^ {0,${l3}}>`)), nestedContainerMarkers: /^(?: {0,3}(?:(?:[*+-]|\d{1,9}[.)])[ \t]+|>[ \t]?))+/ };
var He = /^(?:[ \t]*(?:\n|$))+/;
var je = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var Ge = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}(?:(?=`)\1`*|(?=~)\1~*) *(?=\n|$)|$)/;
var W = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Ne = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var ae = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var Pe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+)[ \t]*(?:\n+|$)/;
var ye = h(Pe).replace(/bull/g, ae).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Fe = h(Pe).replace(/bull/g, ae).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var le = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/;
var Qe = /^[^\n]+/;
var ue = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\\n]|\n(?![ \t]*\n))+/;
var Ue = h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", ue).replace("title", /(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\\n]|\n(?!\n))*'|\((?:\\[\s\S]|[^()\\])*\))/).getRegex();
var We = h(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, ae).getRegex();
var K = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var pe = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var Ke = h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?:[ \\t]+|\\n|/?>|$)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", pe).replace("tag", K).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var Se = (l3) => h(le).replace("hr", W).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", l3).replace("html", " {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag", K).getRegex();
var Xe = Se(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
var Ve = Se(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/);
var Je = h(/^( {0,3}> ?(?:(?![ \t]*(?:\n|$))(paragraph)|[^\n]*)(?:\n|$))+/).replace("paragraph", Ve).getRegex();
var ce = { blockquote: Je, code: je, def: Ue, fences: Ge, heading: Ne, hr: W, html: Ke, lheading: ye, list: We, newline: He, paragraph: Xe, table: D, text: Qe };
var Re = h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", W).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", " {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag", K).getRegex();
var Ye = { ...ce, lheading: Fe, table: Re, paragraph: h(le).replace("hr", W).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Re).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", " {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag", K).getRegex() };
var et = { ...ce, html: h(`^ *(?:comment(?: *\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1>(?: *\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?>(?: *\\n{2,}|\\s*$))`).replace("comment", pe).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: D, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: h(le).replace("hr", W).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ye).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var tt = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var nt = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var _e = /^( {2,}|\\)\n(?!\s*$)[ \t]*/;
var rt = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var $ = /[\p{P}\p{S}]/u;
var G = /[\s\p{P}\p{S}]/u;
var X = /[^\s\p{P}\p{S}]/u;
var st = h(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, G).getRegex();
var it = /[\p{Pi}\p{Ps}"']/u;
var $e = /(?!~)[\p{P}\p{S}]/u;
var ot = /(?!~)[\s\p{P}\p{S}]/u;
var at = /(?:[^\s\p{P}\p{S}]|~)/u;
var lt = h(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", we ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var Le = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var ut = h(Le, "u").replace(/punct/g, $).getRegex();
var pt = h(Le, "u").replace(/punct/g, $e).getRegex();
var ct = /^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/;
var ht = h(ct, "u").replace(/openQuote/g, it).replace(/punct/g, $).getRegex();
var Ce = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var dt = h(Ce, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, G).replace(/punct/g, $).getRegex();
var gt = h(Ce, "gu").replace(/notPunctSpace/g, at).replace(/punctSpace/g, ot).replace(/punct/g, $e).getRegex();
var kt = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)";
var ft = h(kt, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, G).replace(/punct/g, $).getRegex();
var mt = h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, G).replace(/punct/g, $).getRegex();
var xt = "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)";
var bt = h(xt, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, G).replace(/punct/g, $).getRegex();
var Rt = h(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, $).getRegex();
var Tt = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)";
var Ot = h(Tt, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, G).replace(/punct/g, $).getRegex();
var wt = h(/\\(punct)/, "gu").replace(/punct/g, $).getRegex();
var Pt = h(/(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\(punct)/, "gu").replace(/punct/g, $).getRegex();
var yt = h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var St = h(pe).replace("(?:-->|$)", "-->").getRegex();
var _t = h("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", St).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var Ie = /\[(?:\\[\s\S]|[^\[\]\\])*\]/;
var re = h(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets", Ie).getRegex();
var $t = h(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/).replace("label", re).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\((?:\\[\s\S]|[^)\\])*\)/).getRegex();
var Lt = h(/^!?\[(label)\]\[(ref)\]/).replace("label", re).replace("ref", ue).getRegex();
var Ct = h(/^!?\[(ref)\](?:\[\])?/).replace("ref", ue).getRegex();
var Te = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/;
var It = h(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets", Ie).getRegex();
var At = h("reflink|nolink(?!\\()", "g").replace("reflink", h(/^!?\[(label)\]\[(ref)\]/).replace("label", It).replace("ref", Te).getRegex()).replace("nolink", h(/^!?\[(ref)\](?:\[\])?/).replace("ref", Te).getRegex()).getRegex();
var Oe = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var Et = /[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/;
var zt = h(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g, Et).getRegex();
var he = { _backpedal: D, anyPunctuation: wt, anyPunctuationOutsideCode: Pt, autolink: yt, blockSkip: lt, br: _e, code: nt, del: D, delLDelim: D, delRDelim: D, emStrongLDelim: ut, emStrongRDelimAst: dt, emStrongRDelimUnd: mt, escape: tt, link: $t, nolink: Ct, punctuation: st, reflink: Lt, reflinkSearch: At, tag: _t, text: rt, url: D };
var Mt = { ...he, emStrongLDelim: ht, emStrongRDelimAst: ft, emStrongRDelimUnd: bt, link: h(/^!?\[(label)\]\((.*?)\)/).replace("label", re).getRegex(), reflink: h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", re).getRegex() };
var oe = { ...he, emStrongRDelimAst: gt, emStrongLDelim: pt, delLDelim: Rt, delRDelim: Ot, url: h(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol", zt).replace("protocol", Oe).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: h(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|wwwStart|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol", Oe).replace(/emailProtocol/g, /(?:mailto|xmpp):/).replace("wwwStart", we ? "(?<![^\\s*_~(])www\\." : "www\\.").getRegex() };
var Bt = { ...oe, br: h(_e).replace("{2,}", "*").getRegex(), text: h(oe.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var V = { normal: ce, gfm: Ye, pedantic: et };
var N = { normal: he, gfm: oe, breaks: Bt, pedantic: Mt };
var Dt = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var Ae = (l3) => Dt[l3];
function P(l3, e) {
  if (e) {
    if (T.escapeTest.test(l3)) return l3.replace(T.escapeReplace, Ae);
  } else if (T.escapeTestNoEncode.test(l3)) return l3.replace(T.escapeReplaceNoEncode, Ae);
  return l3;
}
function Ee(l3) {
  return T.numericCharacterReference.test(l3) ? l3.replace(T.numericCharacterReferenceOrAmpersand, (e, t, n) => {
    if (t === void 0 && n === void 0) return "&amp;";
    let s = t === void 0 ? Number.parseInt(n, 16) : Number.parseInt(t, 10);
    return s === 0 || s > 1114111 || s >= 55296 && s <= 57343 ? "\uFFFD" : s === 38 ? "&amp;" : String.fromCodePoint(s);
  }) : l3;
}
function de(l3) {
  try {
    l3 = encodeURI(l3).replace(T.percentDecode, "%");
  } catch {
    return null;
  }
  return l3;
}
function ge(l3, e) {
  let t = l3.replace(T.findPipe, (i, r, o) => {
    let a = false, p = r;
    for (; --p >= 0 && o[p] === "\\"; ) a = !a;
    return a ? "|" : " |";
  }), n = t.split(T.splitPipe), s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; s < n.length; s++) n[s] = n[s].trim().replace(T.slashPipe, "|");
  return n;
}
function L(l3, e, t) {
  let n = l3.length;
  if (n === 0) return "";
  let s = 0;
  for (; s < n; ) {
    let i = l3.charAt(n - s - 1);
    if (i === e && !t) s++;
    else if (i !== e && t) s++;
    else break;
  }
  return l3.slice(0, n - s);
}
function ke(l3) {
  let e = l3.split(`
`), t = e.length - 1;
  for (; t >= 0 && T.blankLine.test(e[t]); ) t--;
  return e.length - t <= 2 ? l3 : e.slice(0, t + 1).join(`
`);
}
function Q(l3) {
  return l3.trim().replace(T.multipleSpaceGlobal, " ").toLowerCase().toUpperCase().toLowerCase();
}
function fe(l3, e) {
  if (l3.indexOf(e[0]) === -1 && l3.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < l3.length; n++) if (l3[n] === "\\") n++;
  else if (l3[n] === e[0]) t++;
  else if (l3[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
var F = /* @__PURE__ */ new WeakMap();
function me(l3) {
  let e = { "*": -1, _: -1 }, t = -1, n = l3.length;
  for (let s = 0; s < n; s++) {
    let i = l3[s];
    if (i !== "*" && i !== "_" && i !== "~") continue;
    let r = s === 0 ? `
` : l3[s - 1], o = s + 1;
    for (; o < n && l3[o] === i; ) o++;
    r !== " " && r !== "	" && r !== `
` && r !== "\r" && r !== "\f" && (i === "~" ? t = s : e[i] = s), s = o - 1;
  }
  return { maskedSrc: l3, lastPossibleEmStrongCloserIndex: e, lastPossibleDelCloserIndex: t };
}
function ze(l3, e) {
  let t = me(e), n = F.get(l3);
  n ? n.push(t) : F.set(l3, [t]);
}
function Me(l3) {
  let e = F.get(l3);
  e && (e.pop(), e.length === 0 && F.delete(l3));
}
function Be(l3, e, t) {
  let n = F.get(l3)?.at(-1);
  return n && n.maskedSrc === e ? n.lastPossibleEmStrongCloserIndex[t] : me(e).lastPossibleEmStrongCloserIndex[t];
}
function De(l3, e) {
  let t = F.get(l3)?.at(-1);
  return t && t.maskedSrc === e ? t.lastPossibleDelCloserIndex : me(e).lastPossibleDelCloserIndex;
}
function J(l3, e = 0) {
  let t = e, n = "";
  for (let s of l3) if (s === "	") {
    let i = 4 - t % 4;
    n += " ".repeat(i), t += i;
  } else n += s, t++;
  return n;
}
function qe(l3, e, t, n, s) {
  let i = e.href, r = e.title || null, o = l3[1].replace(s.other.outputLinkReplace, "$1"), a = l3[0].charAt(0) === "!", p = n.state.inLink, c = n.state.linkEmitted, u = n.state.inRawBlock;
  n.state.inLink = true, n.state.linkEmitted = false;
  let d = n.inlineTokens(o), k = n.state.linkEmitted;
  if (n.state.linkEmitted = c, n.state.inLink = p, !a) {
    if (k) {
      n.state.inRawBlock = u;
      return;
    }
    n.state.linkEmitted = true;
  }
  return { type: a ? "image" : "link", raw: t, href: i, title: r, text: o, tokens: d };
}
function qt(l3, e, t) {
  let n = l3.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let s = n[1];
  return e.split(`
`).map((i) => {
    let r = i.match(t.other.beginningSpace);
    if (r === null) return i;
    let [o] = r;
    return i.slice(Math.min(o.length, s.length));
  }).join(`
`);
}
function ve(l3, e, t, n) {
  if (!e.includes("<")) return false;
  for (let s = 0; s < e.length; s++) {
    if (e[s] === "\\") {
      s++;
      continue;
    }
    if (e[s] === "`") {
      let o = n.inline.code.exec(e.slice(s));
      if (o) {
        s += o[0].length - 1;
        continue;
      }
    }
    if (e[s] !== "<") continue;
    let i = l3.slice(t + s), r = n.inline.tag.exec(i) || n.inline.autolink.exec(i);
    if (r) {
      if (r[0].length > e.length - s) return true;
      s += r[0].length - 1;
    }
  }
  return false;
}
var _ = class {
  options;
  rules;
  lexer;
  constructor(e) {
    this.options = e || y;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = this.options.pedantic ? t[0] : ke(t[0]), s = n.replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: n, codeBlockStyle: "indented", text: s };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], s = qt(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: s };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let s = L(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceTabChar.test(s)) && (n = s.trim());
      }
      return { type: "heading", raw: L(t[0], `
`), depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return { type: "hr", raw: L(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = L(t[0], `
`).split(`
`), s = "", i = "", r = [];
      for (; n.length > 0; ) {
        let o = false, a = [], p;
        for (p = 0; p < n.length; p++) if (this.rules.other.blockquoteStart.test(n[p])) a.push(n[p]), o = true;
        else if (!o) a.push(n[p]);
        else break;
        n = n.slice(p);
        let c = a.join(`
`), u = c.replace(this.rules.other.blockquoteMarkerWhitespace, (g, b, f) => b + J(f, b.length)).replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${c}` : c, i = i ? `${i}
${u}` : u;
        let d = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(u, r, true), this.lexer.state.top = d, n.length === 0) break;
        let k = r.at(-1);
        if (k?.type === "code" || k?.type === "heading" || k?.type === "hr" || k?.type === "html" || k?.type === "table") break;
        if (k?.type === "blockquote") {
          let g = k, b = n.join(`
`), f = g.raw + `
` + b.replace(this.rules.other.blockquoteSetextReplace2, ""), m = this.blockquote(f);
          r[r.length - 1] = m;
          let S = f.substring(m.raw.length).replace(/^\n/, ""), R = S ? S.split(`
`).length : 0, A = R ? n.slice(0, -R) : n;
          if (A.length > 0 && (s = `${s}
${A.join(`
`)}`), i = i.substring(0, i.length - g.text.length) + m.text, n = n.slice(A.length), n.length > 0 && this.rules.other.blockquoteStart.test(n[0])) continue;
          break;
        } else if (k?.type === "list") {
          let g = k, b = g.raw + `
` + n.join(`
`), f = this.list(b);
          r[r.length - 1] = f;
          let m = f.raw.length > g.raw.length ? b.slice(g.raw.length + 1, f.raw.length).split(`
`).length : 0;
          if (m > 0) {
            let S = n.slice(0, m).join(`
`);
            s = `${s}
${S}`, i = `${i}
${S}`;
          }
          n = n.slice(m);
          continue;
        }
      }
      return { type: "blockquote", raw: s, tokens: r, text: i };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      if (!this.options.pedantic && this.lexer.state.lastToken?.type === "text" && !this.rules.other.listInterruptsParagraph.test(e)) return;
      let n = e, s = () => n.length - e.length, i = t[1].trim(), r = i.length > 1, o = { type: "list", raw: "", ordered: r, start: r ? +i.slice(0, -1) : "", loose: false, items: [] };
      i = r ? `\\d{1,9}\\${i.slice(-1)}` : `\\${i}`, this.options.pedantic && (i = r ? i : "[*+-]");
      let a = this.rules.other.listItemRegex(i), p = false;
      for (; e; ) {
        let u = false, d = "";
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e)) break;
        let k = s();
        e = e.substring(t[0].length);
        let g = t[2].split(`
`, 1)[0], b = t[1].length, f = this.options.pedantic ? J(g, b) : g.replace(this.rules.other.leadingSpaceTab, (v) => J(v, b)), m = e.split(`
`, 1)[0], S = !f.trim(), R = 0;
        if (this.options.pedantic ? (R = 2, d = f.trimStart()) : S ? R = b + 1 : (R = f.search(this.rules.other.nonSpaceChar), R = R > 4 ? 1 : R, d = f.slice(R), R += b), S && this.rules.other.blankLine.test(m) && (e = e.substring(m.length + 1), u = true), !u) {
          let v = this.rules.other.nextBulletRegex(R), U = this.rules.other.hrRegex(R), ee = this.rules.other.fencesBeginRegex(R), te = this.options.pedantic ? this.rules.other.pedanticHeadingBeginRegex(R) : this.rules.other.headingBeginRegex(R), M = this.rules.other.htmlBeginRegex(R), ne = this.rules.other.blockquoteBeginRegex(R), Z = false;
          for (; e; ) {
            let xe = e.split(`
`, 1)[0], H;
            if (m = xe, this.options.pedantic ? (m = m.replace(this.rules.other.listReplaceNesting, "  "), H = m) : H = m.replace(this.rules.other.leadingSpaceTab, (be) => J(be)), ee.test(m) || te.test(m) || M.test(m) || ne.test(m) || v.test(m) || U.test(m)) break;
            if (H.search(this.rules.other.nonSpaceChar) >= R || !m.trim()) d += `
` + H.slice(R), Z = false;
            else {
              if (S || f.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ee.test(f) || te.test(f) || M.test(f) || U.test(f)) break;
              if (!this.options.pedantic && !Z) {
                let se = f.replace(this.rules.other.nestedContainerMarkers, "");
                if (this.rules.block.fences.test(se) || this.rules.block.heading.test(se) || this.rules.block.hr.test(se)) break;
              }
              let Ze = !this.options.pedantic && /^ {0,3}(?:=+|-+) *$/.test(m) && this.rules.block.lheading.test(`${f}
${m}`) ? `    ${H.replace(/^ {0,3}/, "")}` : m;
              d += `
` + Ze, Z = true;
            }
            S = !m.trim(), e = e.substring(xe.length + 1), f = H.slice(R);
          }
        }
        let A = n.slice(k, s());
        o.loose || (p ? o.loose = true : this.rules.other.doubleBlankLine.test(A) && (p = true)), o.items.push({ type: "list_item", raw: A, task: !!this.options.gfm && this.rules.other.listIsTask.test(d), loose: false, text: d, tokens: [] });
      }
      let c = o.items.at(-1);
      if (c) c.raw = c.raw.trimEnd(), c.text = c.text.trimEnd();
      else return;
      o.raw = n.slice(0, s()).trimEnd();
      for (let u of o.items) if (this.lexer.state.top = false, u.tokens = this.lexer.blockTokens(u.text, []), !o.loose) {
        let d = u.tokens.filter((g) => g.type === "space"), k = d.length > 0 && d.some((g) => this.rules.other.anyLine.test(g.raw));
        o.loose = k;
      }
      for (let u of o.items) {
        let d = u.tokens[0];
        if (u.task && (d?.type === "text" || d?.type === "paragraph")) {
          u.text = u.text.replace(this.rules.other.listReplaceTask, ""), d.raw = d.raw.replace(this.rules.other.listReplaceTask, ""), d.text = d.text.replace(this.rules.other.listReplaceTask, "");
          for (let g = this.lexer.inlineQueue.length - 1; g >= 0; g--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[g].src)) {
            this.lexer.inlineQueue[g].src = this.lexer.inlineQueue[g].src.replace(this.rules.other.listReplaceTask, "");
            break;
          }
          let k = this.rules.other.listTaskCheckbox.exec(u.raw);
          if (k) {
            let g = { type: "checkbox", raw: k[0] + " ", checked: k[0] !== "[ ]" };
            u.checked = g.checked, o.loose ? u.tokens[0] && ["paragraph", "text"].includes(u.tokens[0].type) && "tokens" in u.tokens[0] && u.tokens[0].tokens ? (u.tokens[0].raw = g.raw + u.tokens[0].raw, u.tokens[0].text = g.raw + u.tokens[0].text, u.tokens[0].tokens.unshift(g)) : u.tokens.unshift({ type: "paragraph", raw: g.raw, text: g.raw, tokens: [g] }) : u.tokens.unshift(g);
          }
        } else u.task && (u.task = false);
      }
      if (o.loose) for (let u of o.items) {
        u.loose = true;
        for (let d of u.tokens) d.type === "text" && (d.type = "paragraph");
      }
      return o;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) {
      let n = ke(t[0]);
      return { type: "html", block: true, raw: n, pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: n };
    }
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      if (!this.rules.other.startAngleBracket.test(t[2]) && fe(t[2], "()") !== -1) return;
      let n = Q(t[1]), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: L(t[0], `
`), href: s, title: i };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = ge(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], r = { type: "table", raw: L(t[0], `
`), header: [], align: [], rows: [] };
    if (n.length === s.length) {
      for (let o of s) this.rules.other.tableAlignRight.test(o) ? r.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? r.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? r.align.push("left") : r.align.push(null);
      for (let o = 0; o < n.length; o++) r.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: true, align: r.align[o] });
      for (let o of i) r.rows.push(ge(o, r.header.length).map((a, p) => ({ text: a, tokens: this.lexer.inline(a), header: false, align: r.align[p] })));
      return r;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) {
      let n = t[1].trim();
      return { type: "heading", raw: L(t[0], `
`), depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
    }
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    if (this.lexer.state.linkParenPossible === false) return;
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[0].charAt(0) === "!" ? 2 : 1;
      if (!this.options.pedantic && ve(e, t[1], n, this.rules)) return;
      let s = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(s)) {
        if (!this.rules.other.endAngleBracket.test(s)) return;
        let a = L(s.slice(0, -1), "\\");
        if ((s.length - a.length) % 2 === 0) return;
      } else {
        let a = fe(t[2], "()");
        if (a === -2) return;
        if (a > -1) {
          let c = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + a;
          t[2] = t[2].substring(0, a), t[0] = t[0].substring(0, c).trim(), t[3] = "";
        }
      }
      let i = L(t[0].slice(0, -1), "\\");
      if ((t[0].length - i.length) % 2 === 0) return;
      let r = t[2], o = "";
      if (this.options.pedantic) {
        let a = this.rules.other.pedanticHrefTitle.exec(r);
        a && (r = a[1], o = a[3]);
      } else o = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(s) ? r = r.slice(1) : r = r.slice(1, -1)), qe(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: o && o.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let s = n[0].charAt(0) === "!" ? 2 : 1;
      if (!this.options.pedantic && ve(e, n[1], s, this.rules)) return;
      let i = t[Q(n[2] || n[1])];
      if (!i) {
        let r = n[0].charAt(0);
        return { type: "text", raw: r, text: r };
      }
      return qe(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || !s[1] && !s[2] && !s[3] && !s[4]) return;
    let i = s[0][0], r = n === i, o = t.length - e.length, a = o;
    for (; !this.options.pedantic && a > 0 && t[a - 1] === i; ) a--;
    let p = [...t.slice(Math.max(0, a - 2), a)].at(-1) ?? "", c = p === "*" || p === "_" || !!this.rules.inline.punctuation.exec(p);
    a < o && (n = p);
    let u = a < o ? c : n === "*" || n === "_" || !!this.rules.inline.punctuation.exec(n);
    if (s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    let d = s[1] || s[3] || "";
    if (!d || !n || u) {
      let k = [...s[0]].length - 1, g, b, f = k, m = 0, S = o - a + k, R = !this.options.pedantic && !!p.trim() && (!!d || i === "*" && !c);
      if (i !== "*" && i !== "_") return;
      let A = i === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd, v = Be(this, t, i), U = t.length - e.length + k;
      if (v < U) return;
      t = t.slice(-1 * e.length + k);
      let ee = v - U;
      for (A.lastIndex = 0; (s = A.exec(t)) !== null && !(s.index > ee); ) {
        if (g = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !g) continue;
        if (b = [...g].length, s[3] || s[4]) {
          f += b;
          continue;
        } else if (s[5] || s[6] || R) {
          if (r && (s[5] || s[6])) break;
          if (S % 3 && !((S + b) % 3)) {
            m += b;
            continue;
          }
        }
        if (f -= b, f > 0) continue;
        b = Math.min(b, b + f + m);
        let te = [...s[0]][0].length, M = e.slice(0, k + s.index + te + b);
        if (Math.min(k, b) % 2) {
          let Z = M.slice(1, -1);
          return { type: "em", raw: M, text: Z, tokens: this.lexer.inlineTokens(Z) };
        }
        let ne = M.slice(2, -2);
        return { type: "strong", raw: M, text: ne, tokens: this.lexer.inlineTokens(ne) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && i && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return { type: "br", raw: t[0] };
  }
  del(e, t, n = "") {
    let s = this.rules.inline.delLDelim.exec(e);
    if (!s) return;
    if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let r = [...s[0]].length - 1, o, a, p = r, c = this.rules.inline.delRDelim, u = De(this, t), d = t.length - e.length + r;
      if (u < d) return;
      t = t.slice(-1 * e.length + r);
      let k = u - d;
      for (c.lastIndex = 0; (s = c.exec(t)) !== null && !(s.index > k); ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (a = [...o].length, a !== r)) continue;
        if (s[3] || s[4]) {
          p += a;
          continue;
        }
        if (p -= a, p > 0) continue;
        a = Math.min(a, a + p);
        let g = [...s[0]][0].length, b = e.slice(0, r + s.index + g + a), f = b.slice(r, -r);
        return { type: "del", raw: b, text: f, tokens: this.lexer.inlineTokens(f) };
      }
    }
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), { type: "link", raw: t[0], text: n, href: s, autolink: true, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, s;
      if (t[2] === "@") n = t[0], s = "mailto:" + n;
      else {
        let i;
        do
          i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (i !== t[0]);
        n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: s, autolink: true, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: n ? t[0] : Ee(t[0]), escaped: n };
    }
  }
};
var O = class l {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || y, this.options.tokenizer = this.options.tokenizer || new _(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, linkEmitted: false, linkParenPossible: true, top: true };
    let t = { other: T, block: V.normal, inline: N.normal };
    this.options.pedantic ? (t.block = V.pedantic, t.inline = N.pedantic) : this.options.gfm && (t.block = V.gfm, this.options.breaks ? t.inline = N.breaks : t.inline = N.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: V, inline: N };
  }
  static lex(e, t) {
    return new l(t).lex(e);
  }
  static lexInline(e, t) {
    return new l(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(T.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.state.inRawBlock = false, this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    this.tokenizer.lexer = this;
    let s = this.state.lastToken;
    this.options.pedantic && (e = e.replace(T.tabCharGlobal, "    ").replace(T.spaceLine, ""));
    let i = 1 / 0;
    for (; e; ) {
      if (e.length < i) i = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      this.state.lastToken = t.at(-1);
      let r;
      if (this.options.extensions?.block?.some((a) => (r = a.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let a = t.at(-1);
        r.raw.length === 1 && a !== void 0 ? a.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let a = t.at(-1);
        a?.type === "paragraph" || a?.type === "text" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + r.raw, a.text += `
` + r.text, this.inlineQueue.at(-1).src = a.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let a = t.at(-1);
        a?.type === "paragraph" || a?.type === "text" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + r.raw, a.text += `
` + r.raw, this.inlineQueue.at(-1).src = a.text) : (this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }), t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let o = e;
      if (this.options.extensions?.startBlock) {
        let a = 1 / 0, p = e.slice(1), c;
        this.options.extensions.startBlock.forEach((u) => {
          c = u.call({ lexer: this }, p), typeof c == "number" && c >= 0 && (a = Math.min(a, c));
        }), a < 1 / 0 && a >= 0 && (o = e.substring(0, a + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(o))) {
        let a = t.at(-1);
        n && a?.type === "paragraph" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + r.raw, a.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a.text) : t.push(r), n = o.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let a = t.at(-1);
        a?.type === "text" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + r.raw, a.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a.text) : t.push(r);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return this.state.top = true, this.state.lastToken = s, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  linkInText(e) {
    if (!e.includes("[")) return false;
    let t = this.tokenizer.rules.inline.link;
    for (let n of e.matchAll(this.tokenizer.rules.inline.blockSkip)) if (t.test(n[0]) && e.charAt(n.index - 1) !== "!") return true;
    for (let n of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)) {
      let s = n[0], i = s.lastIndexOf("[");
      if (!(s.charAt(0) === "!" || !Object.hasOwn(this.tokens.links, Q(s.slice(i + 1, -1)))) && !(i > 1 && this.linkInText(s.slice(1, i - 1)))) return true;
    }
    return false;
  }
  inlineTokens(e, t = []) {
    this.tokenizer.lexer = this;
    let n = this.state.linkParenPossible;
    this.state.linkParenPossible = n && e.includes(")");
    try {
      return this.#e(e, t);
    } finally {
      this.state.linkParenPossible = n;
    }
  }
  #e(e, t) {
    let n = e.includes("*") || e.includes("_") || e.includes("~") || this.options.hooks?.emStrongMask || this.tokenizer.emStrong !== _.prototype.emStrong || this.tokenizer.del !== _.prototype.del ? this.#r(e) : e;
    ze(this.tokenizer, n);
    try {
      return this.#t(e, n, t);
    } finally {
      Me(this.tokenizer);
    }
  }
  #t(e, t, n) {
    let s = false, i = "", r = 1 / 0;
    for (; e; ) {
      if (e.length < r) r = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      s || (i = ""), s = false;
      let o;
      if (this.options.extensions?.inline?.some((p) => (o = p.call({ lexer: this }, e, n)) ? (e = e.substring(o.raw.length), n.push(o), true) : false)) continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let p = n.at(-1);
        o.type === "text" && p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : n.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, t, i)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e, t, i)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), n.push(o);
        continue;
      }
      let a = e;
      if (this.options.extensions?.startInline) {
        let p = 1 / 0, c = e.slice(1), u;
        this.options.extensions.startInline.forEach((d) => {
          u = d.call({ lexer: this }, c), typeof u == "number" && u >= 0 && (p = Math.min(p, u));
        }), p < 1 / 0 && p >= 0 && (a = e.substring(0, p + 1));
      }
      if (o = this.tokenizer.inlineText(a)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (i = o.raw.slice(-1)), s = true;
        let p = n.at(-1);
        p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : n.push(o);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return n;
  }
  #n(e) {
    let { blockSkip: t, tag: n, autolink: s } = this.tokenizer.rules.inline, i = "", r = 0, o;
    for (t.lastIndex = 0; o = t.exec(e); ) {
      let a = o.index + (o[2] ? o[2].length : 0), p = o.index + o[0].length;
      if (e.charAt(a) === "<") {
        let c = e.slice(a), u = n.exec(c) || s.exec(c);
        if (!u) {
          t.lastIndex = a + 1;
          continue;
        }
        p = a + u[0].length, t.lastIndex = p;
      }
      i += e.slice(r, a) + "[" + "a".repeat(p - a - 2) + "]", r = p;
    }
    return i + e.slice(r);
  }
  #r(e) {
    let t = e;
    if (this.tokens.links && e.includes("[")) {
      let n = this.tokenizer.rules.inline.reflinkSearch, s = (i) => {
        let r = i.lastIndexOf("[");
        if (!Object.hasOwn(this.tokens.links, Q(i.slice(r + 1, -1)))) return i;
        if (r > 1 && i.charAt(0) !== "!") {
          let o = i.slice(1, r - 1);
          if (this.linkInText(o)) return "[" + o.replace(n, s) + "][" + "a".repeat(i.length - r - 2) + "]";
        }
        return "[" + "a".repeat(i.length - 2) + "]";
      };
      t = t.replace(n, s);
    }
    return t = t.replace(this.tokenizer.rules.inline.anyPunctuationOutsideCode, (n, s, i) => i ? "+".repeat(n.length) : s ? s + n.slice(s.length, -s.length).replace(/`/g, "+") + s : n), t = this.#n(t), t = this.options.hooks?.emStrongMask?.call({ lexer: this }, t) ?? t, t;
  }
  infiniteLoopError(e) {
    let t = "Infinite loop on byte: " + e;
    if (this.options.silent) console.error(t);
    else throw new Error(t);
  }
};
var C = class {
  options;
  parser;
  constructor(e) {
    this.options = e || y;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let s = (t || "").match(T.notSpaceStart)?.[0], i = e ? e.replace(T.endingNewline, "") + `
` : "";
    return s ? '<pre><code class="language-' + P(s) + '">' + (n ? i : P(i, true)) + `</code></pre>
` : "<pre><code>" + (n ? i : P(i, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered, n = e.start, s = "";
    for (let o = 0; o < e.items.length; o++) {
      let a = e.items[o];
      s += this.listitem(a);
    }
    let i = t ? "ol" : "ul", r = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + r + `>
` + s + "</" + i + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let i = 0; i < e.header.length; i++) n += this.tablecell(e.header[i]);
    t += this.tablerow({ text: n });
    let s = "";
    for (let i = 0; i < e.rows.length; i++) {
      let r = e.rows[i];
      n = "";
      for (let o = 0; o < r.length; o++) n += this.tablecell(r[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${P(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, text: n, tokens: s, autolink: i }) {
    let r = i ? P(n, true) : this.parser.parseInline(s), o = de(e);
    if (o === null) return r;
    e = P(o, i);
    let a = '<a href="' + e + '"';
    return t && (a += ' title="' + P(t) + '"'), a += ">" + r + "</a>", a;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    let i = de(e);
    if (i === null) return P(n);
    e = i;
    let r = `<img src="${P(e)}" alt="${P(n)}"`;
    return t && (r += ` title="${P(t)}"`), r += ">", r;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : P(e.text);
  }
};
var E = class {
  parser;
  strong({ text: e, tokens: t }) {
    return t ? this.parser.parseInline(t, this) : e;
  }
  em({ text: e, tokens: t }) {
    return t ? this.parser.parseInline(t, this) : e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e, tokens: t }) {
    return t ? this.parser.parseInline(t, this) : e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e, tokens: t }) {
    return t ? this.parser.parseInline(t, this) : e;
  }
  image({ text: e, tokens: t }) {
    return t ? this.parser.parseInline(t, this) : e;
  }
  br() {
    return `
`;
  }
  checkbox({ raw: e }) {
    return e;
  }
};
var w = class l2 {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || y, this.options.renderer = this.options.renderer || new C(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new E(), this.textRenderer.parser = this;
  }
  static parse(e, t) {
    return new l2(t).parse(e);
  }
  static parseInline(e, t) {
    return new l2(t).parseInline(e);
  }
  parse(e) {
    this.renderer.parser = this;
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let s = e[n];
      if (this.options.extensions?.renderers?.[s.type]) {
        let r = s, o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (o !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "checkbox", "html", "def", "paragraph", "text"].includes(r.type)) {
          t += o === false ? "" : o ?? "";
          continue;
        }
      }
      let i = s;
      switch (i.type) {
        case "space": {
          t += this.renderer.space(i);
          break;
        }
        case "hr": {
          t += this.renderer.hr(i);
          break;
        }
        case "heading": {
          t += this.renderer.heading(i);
          break;
        }
        case "code": {
          t += this.renderer.code(i);
          break;
        }
        case "table": {
          t += this.renderer.table(i);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(i);
          break;
        }
        case "list": {
          t += this.renderer.list(i);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(i);
          break;
        }
        case "html": {
          t += this.renderer.html(i);
          break;
        }
        case "def": {
          t += this.renderer.def(i);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(i);
          break;
        }
        case "text": {
          t += this.renderer.text(i);
          break;
        }
        default: {
          let r = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent) return console.error(r), "";
          throw new Error(r);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    this.renderer.parser = this;
    let n = "";
    for (let s = 0; s < e.length; s++) {
      let i = e[s];
      if (this.options.extensions?.renderers?.[i.type]) {
        let o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (o !== false || !["escape", "html", "link", "image", "checkbox", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += o === false ? "" : o ?? "";
          continue;
        }
      }
      let r = i;
      switch (r.type) {
        case "escape": {
          n += t.text(r);
          break;
        }
        case "html": {
          n += t.html(r);
          break;
        }
        case "link": {
          n += t.link(r);
          break;
        }
        case "image": {
          n += t.image(r);
          break;
        }
        case "checkbox": {
          n += t.checkbox(r);
          break;
        }
        case "strong": {
          n += t.strong(r);
          break;
        }
        case "em": {
          n += t.em(r);
          break;
        }
        case "codespan": {
          n += t.codespan(r);
          break;
        }
        case "br": {
          n += t.br(r);
          break;
        }
        case "del": {
          n += t.del(r);
          break;
        }
        case "text": {
          n += t.text(r);
          break;
        }
        default: {
          let o = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent) return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return n;
  }
};
var I = class {
  options;
  block;
  constructor(e) {
    this.options = e || y;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer(e = this.block) {
    return e ? O.lex : O.lexInline;
  }
  provideParser(e = this.block) {
    return e ? w.parse : w.parseInline;
  }
};
function z(l3, e) {
  if (Array.isArray(e)) for (let t = 0; t < e.length; t++) l3.push(e[t]);
  else l3.push(e);
}
var Y = class {
  defaults = j();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = w;
  Renderer = C;
  TextRenderer = E;
  Lexer = O;
  Tokenizer = _;
  Hooks = I;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let s of e) switch (z(n, t.call(this, s)), s.type) {
      case "table": {
        let i = s;
        for (let r of i.header) z(n, this.walkTokens(r.tokens, t));
        for (let r of i.rows) for (let o of r) z(n, this.walkTokens(o.tokens, t));
        break;
      }
      case "list": {
        let i = s;
        z(n, this.walkTokens(i.items, t));
        break;
      }
      default: {
        let i = s;
        this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((r) => {
          let o = i[r].flat(1 / 0);
          z(n, this.walkTokens(o, t));
        }) : i.tokens && z(n, this.walkTokens(i.tokens, t));
      }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: /* @__PURE__ */ Object.create(null), childTokens: /* @__PURE__ */ Object.create(null) };
    return e.forEach((n) => {
      let s = { ...n };
      if (s.async = this.defaults.async || s.async || false, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name) throw new Error("extension name required");
        if ("renderer" in i) {
          let r = t.renderers[i.name];
          r ? t.renderers[i.name] = function(...o) {
            let a = i.renderer.apply(this, o);
            return a === false && (a = r.apply(this, o)), a;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let r = t[i.level];
          r ? r.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), s.extensions = t), n.renderer) {
        let i = this.defaults.renderer || new C(this.defaults);
        for (let r in n.renderer) {
          if (!(r in i)) throw new Error(`renderer '${r}' does not exist`);
          if (["options", "parser"].includes(r)) continue;
          let o = r, a = n.renderer[o], p = i[o];
          i[o] = (...c) => {
            let u = a.apply(i, c);
            return u === false && (u = p.apply(i, c)), u === false ? "" : u ?? "";
          };
        }
        s.renderer = i;
      }
      if (n.tokenizer) {
        let i = this.defaults.tokenizer || new _(this.defaults);
        for (let r in n.tokenizer) {
          if (!(r in i)) throw new Error(`tokenizer '${r}' does not exist`);
          if (["options", "rules", "lexer"].includes(r)) continue;
          let o = r, a = n.tokenizer[o], p = i[o];
          i[o] = (...c) => {
            let u = a.apply(i, c);
            return u === false && (u = p.apply(i, c)), u;
          };
        }
        s.tokenizer = i;
      }
      if (n.hooks) {
        let i = this.defaults.hooks || new I();
        for (let r in n.hooks) {
          if (!(r in i)) throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r)) continue;
          let o = r, a = n.hooks[o], p = i[o];
          I.passThroughHooks.has(r) ? i[o] = (c) => {
            if (i.options.async && I.passThroughHooksRespectAsync.has(r)) return (async () => {
              let d = await a.call(i, c);
              return p.call(i, d);
            })();
            let u = a.call(i, c);
            return p.call(i, u);
          } : i[o] = (...c) => {
            if (i.options.async) return (async () => {
              let d = await a.apply(i, c);
              return d === false && (d = await p.apply(i, c)), d;
            })();
            let u = a.apply(i, c);
            return u === false && (u = p.apply(i, c)), u;
          };
        }
        s.hooks = i;
      }
      if (n.walkTokens) {
        let i = this.defaults.walkTokens, r = n.walkTokens;
        s.walkTokens = function(o) {
          let a = [];
          return z(a, r.call(this, o)), i && z(a, i.call(this, o)), a;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return O.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return w.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, s) => {
      let i = { ...s }, r = { ...this.defaults, ...i }, o = this.onError(!!r.silent, !!r.async);
      if (this.defaults.async === true && i.async === false) return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (r.hooks && (r.hooks.options = r, r.hooks.block = e), r.async) return (async () => {
        let a = r.hooks ? await r.hooks.preprocess(n) : n, c = await (r.hooks ? await r.hooks.provideLexer(e) : e ? O.lex : O.lexInline)(a, r), u = r.hooks ? await r.hooks.processAllTokens(c) : c;
        r.walkTokens && await Promise.all(this.walkTokens(u, r.walkTokens));
        let k = await (r.hooks ? await r.hooks.provideParser(e) : e ? w.parse : w.parseInline)(u, r);
        return r.hooks ? await r.hooks.postprocess(k) : k;
      })().catch(o);
      try {
        r.hooks && (n = r.hooks.preprocess(n));
        let p = (r.hooks ? r.hooks.provideLexer(e) : e ? O.lex : O.lexInline)(n, r);
        r.hooks && (p = r.hooks.processAllTokens(p)), r.walkTokens && this.walkTokens(p, r.walkTokens);
        let u = (r.hooks ? r.hooks.provideParser(e) : e ? w.parse : w.parseInline)(p, r);
        return r.hooks && (u = r.hooks.postprocess(u)), u;
      } catch (a) {
        return o(a);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let s = "<p>An error occurred:</p><pre>" + P(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var q = new Y();
function x(l3, e) {
  return q.parse(l3, e);
}
x.options = x.setOptions = function(l3) {
  return q.setOptions(l3), x.defaults = q.defaults, ie(x.defaults), x;
};
x.getDefaults = j;
x.defaults = y;
function vt(...l3) {
  return q.use(...l3), x.defaults = q.defaults, ie(x.defaults), x;
}
x.use = vt;
x.walkTokens = function(l3, e) {
  return q.walkTokens(l3, e);
};
x.parseInline = q.parseInline;
x.Parser = w;
x.parser = w.parse;
x.Renderer = C;
x.TextRenderer = E;
x.Lexer = O;
x.lexer = O.lex;
x.Tokenizer = _;
x.Hooks = I;
x.parse = x;
var Ln = x.options;
var Cn = x.setOptions;
var In = x.walkTokens;
var An = x.parseInline;
var zn = w.parse;
var Mn = O.lex;

// cli/render.ts
import { posix } from "node:path";
var escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var slug = (s) => s.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-|-$/g, "") || "section";
var base = ".kit/harness/docs/product";
function resolveGuideLink(from, href, index) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    const url = new URL(href);
    if (!["https:", "http:", "mailto:"].includes(url.protocol) || url.username || url.password) throw Error("\u7981\u6B62\u3055\u308C\u305F URL: " + href);
    return href;
  }
  if (href.startsWith("//") || href.startsWith("/")) throw Error("\u7981\u6B62\u3055\u308C\u305F URL: " + href);
  const hash = href.indexOf("#");
  const target = decodeURIComponent(hash < 0 ? href : href.slice(0, hash));
  const anchor = decodeURIComponent(hash < 0 ? "" : href.slice(hash + 1));
  let path = target ? posix.normalize(posix.join(posix.dirname(from), target)) : from;
  if (path.endsWith("/") || !posix.extname(path)) path = posix.join(path, "README.md");
  if (index.has(path)) {
    const id = anchor ? slug(anchor) : "";
    if (id && !index.get(path).has(id)) throw Error(from + ": \u898B\u51FA\u3057\u304C\u306A\u3044 " + href);
    return "#" + slug(path) + (id ? "--" + id : "");
  }
  const absolute = posix.normalize(posix.join(base, path));
  if (absolute.startsWith(base + "/")) throw Error(from + ": \u53CE\u9332\u3055\u308C\u3066\u3044\u306A\u3044\u6587\u66F8 " + href);
  if (absolute.startsWith("../")) throw Error("Vault \u5916\u306E URL: " + href);
  return "https://github.com/yamayu-i/pkm-kit/blob/main/" + absolute.split("/").map(encodeURIComponent).join("/") + (anchor ? "#" + encodeURIComponent(anchor) : "");
}
function headings(md) {
  const result = [];
  const m = new Y();
  m.walkTokens(m.lexer(md), (token) => {
    if (token.type === "heading") result.push(token);
  });
  return result;
}
function renderDocuments(docs, css, catalog, manifest) {
  if (new Set(docs.map((d) => slug(d.path))).size !== docs.length) throw Error("\u6587\u66F8 ID \u304C\u91CD\u8907");
  const idsByDoc = new Map(docs.map((d) => {
    const used = /* @__PURE__ */ new Set();
    const ids = headings(d.markdown).map((h2) => {
      const stem = slug(h2.text);
      let id = stem, n = 1;
      while (used.has(id)) id = stem + "-" + n++;
      used.add(id);
      return id;
    });
    return [d.path, ids];
  }));
  const index = new Map([...idsByDoc].map(([p, ids]) => [p, new Set(ids)]));
  const title = (d) => headings(d.markdown)[0]?.text || d.path;
  const link = (d) => '<a href="#' + slug(d.path) + '">' + escape(title(d)) + "</a>";
  const groups = [["guide", "\u5168\u4F53\u50CF", docs.filter((d) => !d.path.includes("/"))], ["jobs", "\u76EE\u7684\u304B\u3089\u8AAD\u3080", docs.filter((d) => d.path.startsWith("jobs/"))], ["surfaces", "\u753B\u9762\u3068\u64CD\u4F5C", docs.filter((d) => d.path.startsWith("surfaces/"))], ["concepts", "\u6982\u5FF5\u30FB\u7528\u8A9E\u30FB\u30C7\u30FC\u30BF", docs.filter((d) => d.path.startsWith("concepts/"))]];
  const articles = docs.map((d, i) => {
    let headingPosition = 0;
    const local = [];
    const m = new Y({ gfm: true, breaks: false });
    m.use({ renderer: {
      heading(token) {
        const id = slug(d.path) + "--" + idsByDoc.get(d.path)[headingPosition++];
        const depth = Math.min(6, token.depth + 1);
        if (token.depth > 1) local.push('<li><a href="#' + id + '">' + escape(token.text) + "</a></li>");
        return "<h" + depth + ' id="' + id + '">' + this.parser.parseInline(token.tokens) + "</h" + depth + ">\n";
      },
      html({ text }) {
        return escape(text);
      },
      link(token) {
        let href;
        try {
          href = resolveGuideLink(d.path, token.href, index);
        } catch (e) {
          if (/禁止された URL/.test(String(e))) return this.parser.parseInline(token.tokens);
          throw e;
        }
        return '<a href="' + escape(href) + '">' + this.parser.parseInline(token.tokens) + "</a>";
      },
      image(token) {
        if (!token.href.startsWith("https://") && !token.href.startsWith("http://")) throw Error(d.path + ": \u539F\u672C\u753B\u50CF\u306F\u753B\u9762\u5BFE\u5FDC\u5B9A\u7FA9\u3067\u7BA1\u7406\u3059\u308B: " + token.href);
        return "<span>\u753B\u50CF: " + escape(token.text) + "\uFF08\u5916\u90E8\u753B\u50CF\u306F\u8AAD\u307F\u8FBC\u307F\u307E\u305B\u3093\uFF09</span>";
      }
    } });
    m.use({ renderer: { table(token) {
      const row = (cells, tag) => "<tr>" + cells.map((c) => "<" + tag + ">" + this.parser.parseInline(c.tokens) + "</" + tag + ">").join("") + "</tr>";
      return '<div class="table-scroll" tabindex="0" role="region" aria-label="\u8868"><table><thead>' + row(token.header, "th") + "</thead><tbody>" + token.rows.map((r) => row(r, "td")).join("") + "</tbody></table></div>";
    } } });
    const body = m.parse(d.markdown);
    const entry = catalog[d.path];
    const gallery = entry ? renderGallery(entry, manifest) : "";
    return '<article id="' + slug(d.path) + '" aria-label="' + escape(title(d)) + '"><p class="eyebrow">' + escape(d.path) + "</p>" + (local.length ? '<details class="chapter-nav"><summary>\u3053\u306E\u7AE0\u306E\u76EE\u6B21</summary><ul>' + local.join("") + "</ul></details>" : "") + body + gallery + '<footer><a href="#contents">\u76EE\u6B21\u3078</a> ' + (docs[i - 1] ? "\u524D: " + link(docs[i - 1]) : "") + " " + (docs[i + 1] ? "\u6B21: " + link(docs[i + 1]) : "") + ' \xB7 <a href="https://github.com/yamayu-i/pkm-kit/blob/main/' + base + "/" + d.path + '">\u539F\u672C</a></footer></article>';
  }).join("\n");
  const toc = groups.map(([id, label, items]) => '<section aria-labelledby="nav-' + id + '"><h3 id="nav-' + id + '">' + label + "</h3><ol>" + items.map((d) => "<li>" + link(d) + "</li>").join("") + "</ol></section>").join("");
  const coverage = Object.entries(catalog).map(([path, e]) => '<tr><td><a href="#' + slug(path) + '">' + escape(title(docs.find((d) => d.path === path))) + "</a></td><td>" + (e.kind === "visual" ? e.screens.length + " \u6761\u4EF6" : escape(e.reason || "")) + "</td></tr>").join("");
  return '<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PKM \u30E6\u30FC\u30B6\u30FC\u4F53\u9A13\u5B9A\u7FA9\u66F8\u30FB\u4ED5\u69D8\u66F8</title><style>' + css + '</style></head><body><a class="skip" href="#main">\u672C\u6587\u3078</a><header id="top"><p class="eyebrow">PKM KIT \xB7 PRODUCT GUIDE</p><h1>\u30E6\u30FC\u30B6\u30FC\u4F53\u9A13\u5B9A\u7FA9\u66F8<br>\u30FB\u4ED5\u69D8\u66F8</h1><p class="lead">\u4F55\u3092\u3057\u305F\u3044\u3068\u304D\u3001\u3069\u306E\u753B\u9762\u3067\u3001\u4F55\u304C\u8D77\u304D\u308B\u304B\u3002</p><p>\u5834\u9762\u304B\u3089\u8AAD\u307F\u9032\u3081\u308B\u3053\u3068\u3082\u3001\u753B\u9762\u3084\u7528\u8A9E\u304B\u3089\u73FE\u5728\u306E\u4ED5\u69D8\u3092\u5F15\u304F\u3053\u3068\u3082\u3067\u304D\u307E\u3059\u3002\u539F\u672C\u306E\u5168\u6587\u3092\u53CE\u9332\u3057\u305F\u3001\u8AAD\u307F\u53D6\u308A\u5C02\u7528\u306E\u5B9A\u7FA9\u66F8\u3067\u3059\u3002</p><p>' + docs.length + " \u6587\u66F8 \xB7 " + Object.keys(catalog).length + ' \u9762 \xB7 \u5B9F\u88C5\u304B\u3089\u63CF\u753B\u3057\u305F\u753B\u9762\u4F8B</p></header><nav id="contents" aria-label="\u5168\u4F53\u306E\u76EE\u6B21"><h2>\u76EE\u6B21</h2><p>\u307E\u305A\u5168\u4F53\u50CF\u3001\u6B21\u306B\u76EE\u7684\u306B\u5408\u3046\u5834\u9762\u3078\u3002\u8A73\u3057\u3044\u64CD\u4F5C\u3084\u5236\u7D04\u306F\u753B\u9762\u3068\u6982\u5FF5\u304B\u3089\u78BA\u304B\u3081\u3066\u304F\u3060\u3055\u3044\u3002</p><div class="toc-grid">' + toc + '</div></nav><main id="main">' + articles + '</main><section class="coverage"><h2>\u53CE\u9332\u3068\u753B\u9762\u4F8B\u306E\u5BFE\u5FDC</h2><p>\u753B\u9762\u4F8B\u306F\u5408\u6210\u30C7\u30FC\u30BF\u3092\u5B9F\u88C5\u30B3\u30F3\u30DD\u30FC\u30CD\u30F3\u30C8\u3068\u672C\u756A CSS \u3067\u63CF\u753B\u3057\u3066\u3044\u307E\u3059\u3002Obsidian \u306E API \u3068\u5468\u8FBA\u306E\u67A0\u306F\u30D7\u30EC\u30D3\u30E5\u30FC\u7528\u3067\u3059\u3002\u672C\u4F53\u3084\u5B9F\u7AEF\u672B\u3067\u306E\u7D30\u90E8\u306F\u7570\u306A\u308B\u3053\u3068\u304C\u3042\u308A\u307E\u3059\u3002\u64CD\u4F5C\u3067\u304D\u308B\u30A2\u30D7\u30EA\u3067\u306F\u306A\u304F\u3001\u8868\u793A\u6761\u4EF6\u3092\u56FA\u5B9A\u3057\u305F\u753B\u50CF\u3067\u3059\u3002</p><div class="table-scroll" tabindex="0" role="region" aria-label="\u53CE\u9332\u4E00\u89A7"><table><thead><tr><th>\u9762</th><th>\u753B\u9762\u4F8B\u30FB\u5BFE\u8C61\u5916\u306E\u7406\u7531</th></tr></thead><tbody>' + coverage + '</tbody></table></div></section><footer><a href="#top">\u5148\u982D\u3078</a><p>\u672C\u6587\u306E\u6539\u8A02\u306F\u539F\u672C\u306E Markdown \u3067\u884C\u3044\u3001HTML \u306F CLI \u3067\u751F\u6210\u3057\u307E\u3059\u3002\u6839\u62E0\u3078\u306E\u30EA\u30F3\u30AF\u306F GitHub \u306E main \u3092\u958B\u304F\u305F\u3081\u3001\u30AA\u30D5\u30E9\u30A4\u30F3\u3067\u306F\u672C\u6587\u5185\u306E\u8AAC\u660E\u3092\u53C2\u7167\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p></footer></body></html>\n';
}
function renderGallery(entry, manifest) {
  if (entry.kind !== "visual") return "<aside><p>\u753B\u9762\u4F8B: " + escape(entry.reason || "\u8A72\u5F53\u306A\u3057") + "</p></aside>";
  return '<section class="gallery"><h3>\u5B9F\u88C5\u306E\u753B\u9762\u4F8B</h3>' + entry.screens.map((s, i) => {
    const key = s.provider + "--" + s.screen + (s.action ? "--" + s.action : "");
    const records = manifest.images.filter((r) => r.screen === key);
    if (records.length !== 4 || ["light/wide", "light/narrow", "dark/wide", "dark/narrow"].some((v) => !records.some((r) => r.theme + "/" + r.width === v))) throw Error("\u753B\u9762\u4F8B\u304C\u4E0D\u8DB3: " + key);
    const figures = records.map((r) => '<a class="shot ' + r.theme + " " + r.width + '" href="' + escape(r.file.replace(/^pkm-guide\//, "")) + '"><img src="' + escape(r.file.replace(/^pkm-guide\//, "")) + '" alt="' + escape(s.label + " / " + r.theme + " / " + r.width) + '" loading="lazy"><span>\u753B\u50CF\u3092\u958B\u304F \xB7 ' + escape(r.theme + " / " + r.width) + "</span></a>").join("");
    const content = "<p>" + escape(s.detail) + "</p><figure>" + figures + "<figcaption>" + escape(s.label) + " \u2014 \u5408\u6210\u30C7\u30FC\u30BF\u306B\u3088\u308B\u5B9F\u88C5\u30D7\u30EC\u30D3\u30E5\u30FC</figcaption></figure>";
    return i === 0 ? "<h4>" + escape(s.label) + "</h4>" + content : "<details><summary>" + escape(s.label) + "</summary>" + content + "</details>";
  }).join("") + "</section>";
}

// cli/product-guide.ts
var sha = (text) => createHash("sha256").update(text).digest("hex");
function walk(root, dir = root) {
  return readdirSync(dir).sort().flatMap((n) => {
    if (["node_modules", "out", ".git", "test", "generated"].includes(n)) return [];
    const p = join(dir, n);
    if (lstatSync(p).isSymbolicLink()) return [];
    return lstatSync(p).isDirectory() ? walk(root, p) : [relative(root, p).replaceAll("\\", "/")];
  });
}
function fingerprint(root) {
  const paths = walk(join(root, ".kit/src/packages")).filter(
    (p) => /\.(ts|tsx|css|mjs|json|html|svg)$/.test(p) && (!p.startsWith("product-guide/") || ["product-guide/catalog.json", "product-guide/preview/capture.mjs", "product-guide/preview/fixture.tsx", "product-guide/preview/mock.ts"].includes(p))
  );
  const templates = ["statement", "next-steps"].map((id) => join(root, ".claude/skills/slide/patterns", id + ".md")).filter(existsSync);
  return sha(paths.map((p) => p + "\0" + readFileSync(join(root, ".kit/src/packages", p), "utf8")).join("\0") + templates.map((p) => readFileSync(p, "utf8")).join("\0") + (existsSync(join(root, ".obsidian/snippets/pkm-theme.css")) ? readFileSync(join(root, ".obsidian/snippets/pkm-theme.css"), "utf8") : "") + readFileSync(join(root, ".kit/src/pnpm-lock.yaml"), "utf8"));
}
function registeredViews(root) {
  const packages = join(root, ".kit/src/packages");
  return [...new Set(walk(packages).filter((p) => p.endsWith("src/main.ts") || /src\/obsidian\/[^/]*view[^/]*\.ts$/.test(p)).flatMap(
    (p) => [...readFileSync(join(packages, p), "utf8").matchAll(/(?:\btype:|(?:VIEW_TYPE|NOTES_VIEW_TYPE)\s*=)\s*"((?:pkm-)[a-z-]+)"/g)].map((m) => m[1])
  ))].sort();
}
var guidePath = "pkm-guide/user-experience.html";
var packagePath = ".kit/src/packages/product-guide";
function read(root) {
  const source = join(root, ".kit/harness/docs/product");
  const group = (p) => p.startsWith("jobs/") ? 1 : p.startsWith("surfaces/") ? 2 : p.startsWith("concepts/") ? 3 : 0;
  const paths = walk(source).filter((p) => p.endsWith(".md")).sort((a, b) => group(a) - group(b) || (a.endsWith("README.md") ? -1 : b.endsWith("README.md") ? 1 : a.localeCompare(b, "en")));
  const docs = paths.map((path) => ({ path, markdown: readFileSync(join(source, path), "utf8") }));
  const catalog = JSON.parse(readFileSync(join(root, packagePath, "catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(root, "pkm-guide/ui/manifest.json"), "utf8"));
  const css = readFileSync(join(root, packagePath, "styles.css"), "utf8");
  return { docs, catalog, manifest, css };
}
function safeOutput(root, path) {
  const full = resolve(root, path);
  if (!full.startsWith(resolve(root) + "/")) throw Error("Vault \u5916\u3078\u306E\u51FA\u529B\u3092\u62D2\u5426: " + path);
  for (let p = full; p !== resolve(root); p = dirname(p)) if (existsSync(p) && lstatSync(p).isSymbolicLink()) throw Error("symlink \u3078\u306E\u51FA\u529B\u3092\u62D2\u5426: " + path);
  return full;
}
function checkGuide(root) {
  const errors = [];
  const { docs, catalog, manifest, css } = read(root);
  for (const d of docs.filter((d2) => d2.path.startsWith("surfaces/") && !d2.path.endsWith("README.md"))) {
    if (!catalog[d.path]) errors.push(d.path + ": \u753B\u9762\u5BFE\u5FDC\u304C\u306A\u3044");
    for (const heading of ["\u5165\u529B\u3068\u5236\u7D04", "\u64CD\u4F5C\u3068\u4FDD\u5B58", "\u5931\u6557\u6642\u3068\u623B\u3057\u65B9", "\u7AEF\u672B\u306E\u9055\u3044"]) if (!d.markdown.includes("## " + heading + "\n")) errors.push(d.path + ": " + heading + " \u304C\u306A\u3044");
  }
  const documentedViews = new Set(Object.values(catalog).flatMap((e) => e.views || []));
  for (const view of registeredViews(root)) if (!documentedViews.has(view)) errors.push(view + ": \u767B\u9332\u3055\u308C\u305F View \u306E\u8AAC\u660E\u304C\u306A\u3044");
  for (const [path, entry] of Object.entries(catalog)) {
    if (!docs.some((d) => d.path === path)) errors.push(path + ": \u539F\u672C\u304C\u306A\u3044");
    if (entry.kind === "visual" && !entry.screens.length) errors.push(path + ": \u753B\u50CF\u306E\u6307\u5B9A\u304C\u306A\u3044");
    if (entry.kind !== "visual" && !entry.reason) errors.push(path + ": \u5BFE\u8C61\u5916\u306E\u7406\u7531\u304C\u306A\u3044");
    for (const p of entry.source) if (!existsSync(join(root, p))) errors.push(path + ": \u5B9F\u88C5\u304C\u306A\u3044 " + p);
  }
  if (manifest.fingerprint !== fingerprint(root)) errors.push("UI \u306E\u5165\u529B\u304C\u5909\u308F\u3063\u3066\u3044\u307E\u3059\u3002pnpm --filter product-guide capture \u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
  for (const image of manifest.images) {
    if (!/^pkm-guide\/ui\/[a-z0-9-]+\.png$/.test(image.file)) {
      errors.push("\u753B\u50CF\u30D1\u30B9\u304C\u4E0D\u6B63: " + image.file);
      continue;
    }
    const path = safeOutput(root, image.file);
    if (!existsSync(path) || sha(readFileSync(path)) !== image.sha256) errors.push(image.file + ": \u753B\u50CF\u304C\u306A\u3044\u304B\u30CF\u30C3\u30B7\u30E5\u304C\u4E0D\u4E00\u81F4");
  }
  const expected = renderDocuments(docs, css, catalog, manifest);
  if (!existsSync(join(root, guidePath)) || readFileSync(join(root, guidePath), "utf8") !== expected) errors.push(guidePath + ": \u539F\u672C\u3068\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002node .kit/bin/product-guide.mjs build \u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
  return errors;
}
function buildGuide(root) {
  const data = read(root);
  const result = renderDocuments(data.docs, data.css, data.catalog, data.manifest);
  const path = safeOutput(root, guidePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, result);
  return data.docs.length;
}
async function main(args) {
  const command = args[0] || "check";
  const root = resolve(args[1] || fileURLToPath(new URL("../..", import.meta.url)));
  if (command === "build") console.log("\u4F53\u9A13\u5B9A\u7FA9\u66F8: " + buildGuide(root) + " \u6587\u66F8\u3092\u751F\u6210");
  else if (command === "check") {
    const errors = checkGuide(root);
    if (errors.length) throw Error(errors.join("\n"));
    console.log("\u4F53\u9A13\u5B9A\u7FA9\u66F8: \u539F\u672C\u30FB\u753B\u50CF\u30FB\u751F\u6210\u7269\u306F\u4E00\u81F4");
  } else if (command === "inventory") {
    const { docs, catalog } = read(root);
    console.log(JSON.stringify({ documents: docs.map((d) => d.path), surfaces: catalog }, null, 2));
  } else throw Error("\u4F7F\u3044\u65B9: product-guide.mjs build|check|inventory [Vault \u306E\u30EB\u30FC\u30C8]");
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => {
  console.error(String(e.message || e));
  process.exitCode = 1;
});
export {
  buildGuide,
  checkGuide,
  fingerprint,
  main,
  registeredViews,
  renderDocuments,
  resolveGuideLink,
  safeOutput,
  sha,
  slug,
  walk
};
