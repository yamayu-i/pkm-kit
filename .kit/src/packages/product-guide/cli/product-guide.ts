import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, lstatSync, realpathSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderDocuments, type Catalog, type Manifest, type SourceDoc } from "./render.ts";
export {renderDocuments,slug,resolveGuideLink} from "./render.ts";
export const sha=(text:string|Uint8Array)=>createHash("sha256").update(text).digest("hex");
export function walk(root:string, dir=root):string[]{
 return readdirSync(dir).sort().flatMap(n=>{
  if(["node_modules","out",".git","test","generated"].includes(n)) return [];
  const p=join(dir,n);
  if(lstatSync(p).isSymbolicLink()) return [];
  return lstatSync(p).isDirectory()?walk(root,p):[relative(root,p).replaceAll("\\","/")];
 });
}
export function fingerprint(root:string):string {
 const paths=walk(join(root,".kit/src/packages")).filter(p=>
  /\.(ts|tsx|css|mjs|json|html|svg)$/.test(p) &&
  (!p.startsWith("product-guide/") || ["product-guide/catalog.json","product-guide/preview/capture.mjs","product-guide/preview/fixture.tsx","product-guide/preview/mock.ts"].includes(p))
 );
 const templates=["statement","next-steps"].map(id=>join(root,".claude/skills/slide/patterns",id+".md")).filter(existsSync);
 return sha(paths.map(p=>p+"\0"+readFileSync(join(root,".kit/src/packages",p),"utf8")).join("\0")+templates.map(p=>readFileSync(p,"utf8")).join("\0")+(existsSync(join(root,".obsidian/snippets/pkm-theme.css"))?readFileSync(join(root,".obsidian/snippets/pkm-theme.css"),"utf8"):"")+readFileSync(join(root,".kit/src/pnpm-lock.yaml"),"utf8"));
}
export function registeredViews(root:string):string[]{
 const packages=join(root,".kit/src/packages");
 return [...new Set(walk(packages).filter(p=>p.endsWith("src/main.ts")||/src\/obsidian\/[^/]*view[^/]*\.ts$/.test(p)).flatMap(p=>
  [...readFileSync(join(packages,p),"utf8").matchAll(/(?:\btype:|(?:VIEW_TYPE|NOTES_VIEW_TYPE)\s*=)\s*"((?:pkm-)[a-z-]+)"/g)].map(m=>m[1]!)
 ))].sort();
}
const guidePath="pkm-guide/user-experience.html";
const packagePath=".kit/src/packages/product-guide";
function read(root:string){
 const source=join(root,".kit/harness/docs/product");
 const group=(p:string)=>p.startsWith("jobs/")?1:p.startsWith("surfaces/")?2:p.startsWith("concepts/")?3:0;
 const paths=walk(source).filter(p=>p.endsWith(".md")).sort((a,b)=>group(a)-group(b)||(a.endsWith("README.md")?-1:b.endsWith("README.md")?1:a.localeCompare(b,"en")));
 const docs:SourceDoc[]=paths.map(path=>({path,markdown:readFileSync(join(source,path),"utf8")}));
 const catalog:Catalog=JSON.parse(readFileSync(join(root,packagePath,"catalog.json"),"utf8"));
 const manifest:Manifest=JSON.parse(readFileSync(join(root,"pkm-guide/ui/manifest.json"),"utf8"));
 const css=readFileSync(join(root,packagePath,"styles.css"),"utf8");
 return {docs,catalog,manifest,css};
}
export function safeOutput(root:string,path:string):string{
 const full=resolve(root,path);
 if(!full.startsWith(resolve(root)+"/")) throw Error("Vault 外への出力を拒否: "+path);
 for(let p=full;p!==resolve(root);p=dirname(p)) if(existsSync(p)&&lstatSync(p).isSymbolicLink()) throw Error("symlink への出力を拒否: "+path);
 return full;
}
export function checkGuide(root:string):string[]{
 const errors:string[]=[];
 const {docs,catalog,manifest,css}=read(root);
 for(const d of docs.filter(d=>d.path.startsWith("surfaces/")&&!d.path.endsWith("README.md"))){
  if(!catalog[d.path]) errors.push(d.path+": 画面対応がない");
  for(const heading of ["入力と制約","操作と保存","失敗時と戻し方","端末の違い"]) if(!d.markdown.includes("## "+heading+"\n")) errors.push(d.path+": "+heading+" がない");
 }
 const documentedViews=new Set(Object.values(catalog).flatMap(e=>e.views||[]));
 for(const view of registeredViews(root))if(!documentedViews.has(view)) errors.push(view+": 登録された View の説明がない");
 for(const [path,entry] of Object.entries(catalog)){
  if(!docs.some(d=>d.path===path)) errors.push(path+": 原本がない");
  if(entry.kind==="visual"&&!entry.screens.length) errors.push(path+": 画像の指定がない");
  if(entry.kind!=="visual"&&!entry.reason) errors.push(path+": 対象外の理由がない");
  for(const p of entry.source) if(!existsSync(join(root,p))) errors.push(path+": 実装がない "+p);
 }
 for(const image of manifest.images){
  if(!/^pkm-guide\/ui\/[a-z0-9-]+\.png$/.test(image.file)) {errors.push("画像パスが不正: "+image.file);continue}
  const path=safeOutput(root,image.file);
  if(!existsSync(path)||sha(readFileSync(path))!==image.sha256) errors.push(image.file+": 画像がないかハッシュが不一致");
 }
 const expected=renderDocuments(docs,css,catalog,manifest);
 if(!existsSync(join(root,guidePath))||readFileSync(join(root,guidePath),"utf8")!==expected) errors.push(guidePath+": 原本と一致しません。node .kit/bin/product-guide.mjs build を実行してください");
 return errors;
}
export function uiDrift(root:string):boolean{
 return read(root).manifest.fingerprint!==fingerprint(root);
}
export function buildGuide(root:string){
 const data=read(root);
 const result=renderDocuments(data.docs,data.css,data.catalog,data.manifest);
 const path=safeOutput(root,guidePath);
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,result);
 return data.docs.length;
}
export async function main(args:string[]){
 const command=args[0]||"check";
 const root=resolve(args[1]||fileURLToPath(new URL("../..",import.meta.url)));
 if(command==="build") console.log("体験定義書: "+buildGuide(root)+" 文書を生成");
 else if(command==="check"){
  const errors=checkGuide(root);if(errors.length) throw Error(errors.join("\n"));console.log("体験定義書: 原本・画像・生成物は一致");
  if(uiDrift(root)) console.warn("警告: UI の入力が画面例を撮った時から変わっています。月 1 回か任意のタイミングで pnpm --filter product-guide capture と build を実行して反映してください");
 }else if(command==="inventory"){
  const {docs,catalog}=read(root);
  console.log(JSON.stringify({documents:docs.map(d=>d.path),surfaces:catalog},null,2));
 }else throw Error("使い方: product-guide.mjs build|check|inventory [Vault のルート]");
}
if(process.argv[1]&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(e=>{console.error(String(e.message||e));process.exitCode=1});
