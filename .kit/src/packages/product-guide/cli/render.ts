import { Marked, type Tokens } from "marked";
import { posix } from "node:path";
export interface SourceDoc { path: string; markdown: string }
export interface Screen { provider: string; screen: string; label: string; detail: string; action?: string }
export interface Surface { kind: "visual" | "example" | "layout"; screens: Screen[]; reason?: string; source: string[]; views?: string[] }
export type Catalog = Record<string, Surface>;
export interface ImageRecord { screen: string; file: string; theme: string; width: string; sha256: string }
export interface Manifest { images: ImageRecord[]; fingerprint?: string }
export const escape = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
export const slug = (s: string) => s.toLowerCase().replace(/<[^>]*>/g,"").replace(/[^\p{L}\p{N}_-]+/gu,"-").replace(/^-|-$/g,"") || "section";
const base=".kit/harness/docs/product";
type Index = Map<string,Set<string>>;
export function resolveGuideLink(from: string, href: string, index: Index): string {
 if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
  const url=new URL(href);
  if (!["https:","http:","mailto:"].includes(url.protocol) || url.username || url.password) throw Error("禁止された URL: "+href);
  return href;
 }
 if (href.startsWith("//") || href.startsWith("/")) throw Error("禁止された URL: "+href);
 const hash=href.indexOf("#");
 const target=decodeURIComponent(hash<0?href:href.slice(0,hash));
 const anchor=decodeURIComponent(hash<0?"":href.slice(hash+1));
 let path=target ? posix.normalize(posix.join(posix.dirname(from),target)) : from;
 if(path.endsWith("/") || !posix.extname(path)) path=posix.join(path,"README.md");
 if(index.has(path)){
  const id=anchor?slug(anchor):"";
  if(id && !index.get(path)!.has(id)) throw Error(from+": 見出しがない "+href);
  return "#"+slug(path)+(id?"--"+id:"");
 }
 const absolute=posix.normalize(posix.join(base,path));
 if(absolute.startsWith(base+"/")) throw Error(from+": 収録されていない文書 "+href);
 if(absolute.startsWith("../")) throw Error("Vault 外の URL: "+href);
 return "https://github.com/yamayu-i/pkm-kit/blob/main/"+absolute.split("/").map(encodeURIComponent).join("/")+(anchor?"#"+encodeURIComponent(anchor):"");
}
function headings(md: string): Tokens.Heading[] {
 const result: Tokens.Heading[]=[];
 const m=new Marked();
 m.walkTokens(m.lexer(md), token=>{if(token.type==="heading") result.push(token as Tokens.Heading)});
 return result;
}
export function renderDocuments(docs: SourceDoc[], css: string, catalog: Catalog, manifest: Manifest): string {
 if(new Set(docs.map(d=>slug(d.path))).size!==docs.length)throw Error("文書 ID が重複");
 const idsByDoc=new Map(docs.map(d=>{
  const used=new Set<string>();
  const ids=headings(d.markdown).map(h=>{
   const stem=slug(h.text);let id=stem,n=1;
   while(used.has(id))id=stem+"-"+n++;
   used.add(id);return id;
  });
  return [d.path,ids] as const;
 }));
 const index: Index=new Map([...idsByDoc].map(([p,ids])=>[p,new Set(ids)]));
 const title=(d:SourceDoc)=>headings(d.markdown)[0]?.text || d.path;
 const link=(d:SourceDoc)=>'<a href="#'+slug(d.path)+'">'+escape(title(d))+"</a>";
 const groups=[["guide","全体像",docs.filter(d=>!d.path.includes("/"))],["jobs","目的から読む",docs.filter(d=>d.path.startsWith("jobs/"))],["surfaces","画面と操作",docs.filter(d=>d.path.startsWith("surfaces/"))],["concepts","概念・用語・データ",docs.filter(d=>d.path.startsWith("concepts/"))]] as const;
 const articles=docs.map((d,i)=>{
  let headingPosition=0;
  const local:string[]=[];
  const m=new Marked({gfm:true,breaks:false});
  m.use({renderer:{
   heading(token){
    const id=slug(d.path)+"--"+idsByDoc.get(d.path)![headingPosition++]!;
    const depth=Math.min(6,token.depth+1);
    if(token.depth>1) local.push('<li><a href="#'+id+'">'+escape(token.text)+"</a></li>");
    return '<h'+depth+' id="'+id+'">'+this.parser.parseInline(token.tokens)+'</h'+depth+'>\n';
   },
   html({text}){return escape(text)},
   link(token){
    let href:string;
    try{href=resolveGuideLink(d.path,token.href,index)}catch(e){
     if(/禁止された URL/.test(String(e))) return this.parser.parseInline(token.tokens);
     throw e;
    }
    return '<a href="'+escape(href)+'">'+this.parser.parseInline(token.tokens)+"</a>";
   },
   image(token){
    if(!token.href.startsWith("https://") && !token.href.startsWith("http://")) throw Error(d.path+": 原本画像は画面対応定義で管理する: "+token.href);
    return '<span>画像: '+escape(token.text)+"（外部画像は読み込みません）</span>";
   }
  }});
  // 表の再パースはリンク変換を保つため、既定の table renderer を呼ぶ。
  m.use({renderer:{table(token){
   const row=(cells:Tokens.TableCell[],tag:string)=>"<tr>"+cells.map(c=>"<"+tag+">"+this.parser.parseInline(c.tokens)+"</"+tag+">").join("")+"</tr>";
   return '<div class="table-scroll" tabindex="0" role="region" aria-label="表"><table><thead>'+row(token.header,"th")+"</thead><tbody>"+token.rows.map(r=>row(r,"td")).join("")+"</tbody></table></div>";
  }}});
  const body=m.parse(d.markdown) as string;
  const entry=catalog[d.path];
  const gallery=entry?renderGallery(entry,manifest):"";
  return '<article id="'+slug(d.path)+'" aria-label="'+escape(title(d))+'"><p class="eyebrow">'+escape(d.path)+'</p>'+
    (local.length?'<details class="chapter-nav"><summary>この章の目次</summary><ul>'+local.join("")+"</ul></details>":"")+body+gallery+
    '<footer><a href="#contents">目次へ</a> '+(docs[i-1]?'前: '+link(docs[i-1]!):"")+" "+(docs[i+1]?'次: '+link(docs[i+1]!):"")+
    ' · <a href="https://github.com/yamayu-i/pkm-kit/blob/main/'+base+'/'+d.path+'">原本</a></footer></article>';
 }).join("\n");
 const toc=groups.map(([id,label,items])=>'<section aria-labelledby="nav-'+id+'"><h3 id="nav-'+id+'">'+label+"</h3><ol>"+items.map(d=>"<li>"+link(d)+"</li>").join("")+"</ol></section>").join("");
 const coverage=Object.entries(catalog).map(([path,e])=>'<tr><td><a href="#'+slug(path)+'">'+escape(title(docs.find(d=>d.path===path)!))+"</a></td><td>"+(e.kind==="visual"?e.screens.length+" 条件":escape(e.reason||""))+"</td></tr>").join("");
 return '<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PKM ユーザー体験定義書・仕様書</title><style>'+css+'</style></head><body><a class="skip" href="#main">本文へ</a><header id="top"><p class="eyebrow">PKM KIT · PRODUCT GUIDE</p><h1>ユーザー体験定義書<br>・仕様書</h1><p class="lead">何をしたいとき、どの画面で、何が起きるか。</p><p>場面から読み進めることも、画面や用語から現在の仕様を引くこともできます。原本の全文を収録した、読み取り専用の定義書です。</p><p>'+docs.length+' 文書 · '+Object.keys(catalog).length+' 面 · 実装から描画した画面例</p></header><nav id="contents" aria-label="全体の目次"><h2>目次</h2><p>まず全体像、次に目的に合う場面へ。詳しい操作や制約は画面と概念から確かめてください。</p><div class="toc-grid">'+toc+'</div></nav><main id="main">'+articles+'</main><section class="coverage"><h2>収録と画面例の対応</h2><p>画面例は合成データを実装コンポーネントと本番 CSS で描画しています。Obsidian の API と周辺の枠はプレビュー用です。本体や実端末での細部は異なることがあります。操作できるアプリではなく、表示条件を固定した画像です。</p><div class="table-scroll" tabindex="0" role="region" aria-label="収録一覧"><table><thead><tr><th>面</th><th>画面例・対象外の理由</th></tr></thead><tbody>'+coverage+'</tbody></table></div></section><footer><a href="#top">先頭へ</a><p>本文の改訂は原本の Markdown で行い、HTML は CLI で生成します。根拠へのリンクは GitHub の main を開くため、オフラインでは本文内の説明を参照してください。</p></footer></body></html>\n';
}
function renderGallery(entry:Surface,manifest:Manifest):string {
 if(entry.kind!=="visual") return '<aside><p>画面例: '+escape(entry.reason||"該当なし")+"</p></aside>";
 return '<section class="gallery"><h3>実装の画面例</h3>'+entry.screens.map((s,i)=>{
  const key=s.provider+"--"+s.screen+(s.action?"--"+s.action:"");
  const records=manifest.images.filter(r=>r.screen===key);
  if(records.length!==4 || ["light/wide","light/narrow","dark/wide","dark/narrow"].some(v=>!records.some(r=>r.theme+"/"+r.width===v))) throw Error("画面例が不足: "+key);
  const figures=records.map(r=>'<a class="shot '+r.theme+' '+r.width+'" href="'+escape(r.file.replace(/^pkm-guide\//,""))+'"><img src="'+escape(r.file.replace(/^pkm-guide\//,""))+'" alt="'+escape(s.label+" / "+r.theme+" / "+r.width)+'" loading="lazy"><span>画像を開く · '+escape(r.theme+" / "+r.width)+'</span></a>').join("");
  const content='<p>'+escape(s.detail)+'</p><figure>'+figures+'<figcaption>'+escape(s.label)+' — 合成データによる実装プレビュー</figcaption></figure>';
  return i===0?'<h4>'+escape(s.label)+'</h4>'+content:'<details><summary>'+escape(s.label)+'</summary>'+content+"</details>";
 }).join("")+"</section>";
}
