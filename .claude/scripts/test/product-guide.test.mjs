import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderDocuments, slug, resolveGuideLink } from "../../../.kit/bin/product-guide.mjs";

const docs = [
 {path:"README.md", markdown:"# はじめに\n\n[今日](surfaces/today.md#操作)\n"},
 {path:"surfaces/today.md", markdown:"# Today\n\n## 操作\n\n1. **選ぶ**\n   - `scheduled`\n\n| 項目 | 値 |\n|---|---|\n| 日 | 今日 |\n\n> 保存する\n\n\`\`\`js\nconst x = '<script>';\n\`\`\`\n\n## 操作\n\n<script>alert(1)</script>\n\n[悪いリンク](javascript:alert)\n"}
];
test("全文の構造を保ち、スクリプトと危険な URL を実行可能にしない",()=>{
 const html=renderDocuments(docs,"",{}, {images:[]});
 for(const tag of ["<strong>選ぶ</strong>","<ul>","<ol>","<table>","<blockquote>","<pre>"]) assert.ok(html.includes(tag),tag);
 assert.ok(html.includes("&lt;script&gt;"));
 assert.ok(!html.includes("<script>"));
 assert.ok(!html.includes('href="javascript:'));
});
test("同じ入力は同じ HTML、見出しの重複は一意のアンカーになる",()=>{
 const a=renderDocuments(docs,"",{}, {images:[]});
 assert.equal(a,renderDocuments(docs,"",{}, {images:[]}));
 const ids=[...a.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(a.includes('href="#'+slug("surfaces/today.md")+"--"+slug("操作")+'"'));
});
test("文書間リンクと見出しを検証し、欠落を黙って通さない",()=>{
 assert.throws(()=>renderDocuments([{path:"a.md",markdown:"# A\n\n[missing](missing.md)"}],"",{}, {images:[]}),/missing/);
 assert.throws(()=>renderDocuments([{path:"a.md",markdown:"# A\n\n[missing](#存在しない)"}],"",{}, {images:[]}),/存在しない/);
});
test("外部根拠リンクは GitHub、Vault 外や危険な URL は禁止する",()=>{
 assert.match(resolveGuideLink("surfaces/a.md","../../../../src/docs/adr/a.md",new Map()),/^https:\/\/github.com\/yamayu-i\/pkm-kit\/blob\/main\//);
 assert.throws(()=>resolveGuideLink("a.md","file:///etc/passwd",new Map()),/URL/);
 assert.throws(()=>resolveGuideLink("a.md","https://user:password@example.com/",new Map()),/URL/); // security-scan: allow 固定ダミーの認証付き URL を拒否するテスト
});
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {buildGuide,checkGuide,uiDrift,fingerprint,sha,safeOutput} from "../../../.kit/bin/product-guide.mjs";
test("子の Node だけで再生成漏れと入力の変更を検出できる",()=>{
 const root=mkdtempSync(join(tmpdir(),"pkm-guide-test-"));
 try{
  for(const p of [".kit/harness/docs/product",".kit/src/packages/product-guide","pkm-guide/ui"])mkdirSync(join(root,p),{recursive:true});
  const put=(p,s)=>writeFileSync(join(root,p),s);
  put(".kit/harness/docs/product/README.md","# 定義書\n");
  put(".kit/src/pnpm-lock.yaml","lockfileVersion: 9\n");
  put(".kit/src/packages/product-guide/catalog.json","{}");
  put(".kit/src/packages/product-guide/styles.css","");
  put("pkm-guide/ui/manifest.json",JSON.stringify({fingerprint:fingerprint(root),images:[]}));
  buildGuide(root);assert.deepEqual(checkGuide(root),[]);
  put(".kit/harness/docs/product/README.md","# 新しい体験\n");assert.match(checkGuide(root).join("\n"),/原本と一致/);
  buildGuide(root);assert.deepEqual(checkGuide(root),[]);
  put(".kit/src/packages/product-guide/styles.css","body {}");
  assert.match(checkGuide(root).join("\n"),/原本と一致/);
  assert.ok(!checkGuide(root).join("\n").includes("UI の入力"),"共通書式だけなら UI の撮り直しは不要");
  mkdirSync(join(root,".kit/src/packages/pkm-task"),{recursive:true});
  put(".kit/src/packages/pkm-task/styles.css","body {}");assert.ok(!checkGuide(root).join("\n").includes("UI の入力"),"UI の入力の変化は失敗にしない");assert.equal(uiDrift(root),true);
  put("pkm-guide/ui/manifest.json",JSON.stringify({fingerprint:fingerprint(root),images:[{screen:"example",file:"pkm-guide/ui/example.png",theme:"light",width:"wide",sha256:sha("image")}]}));
  assert.match(checkGuide(root).join("\n"),/画像がない/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test("出力先が symlink なら Vault の外へ書かない",()=>{
 const root=mkdtempSync(join(tmpdir(),"pkm-guide-symlink-"));
 try{symlinkSync(tmpdir(),join(root,"pkm-guide"));assert.throws(()=>safeOutput(root,"pkm-guide/user-experience.html"),/symlink/)}
 finally{rmSync(root,{recursive:true,force:true})}
});
test("重複した見出しと番号付きの見出しも ID が衝突せずリンクできる",()=>{
 const html=renderDocuments([{path:"a.md",markdown:"# A\n\n## X\n\n## X\n\n## X-2\n\n[重複](#x-1) [番号](#x-2)"}],"",{}, {images:[]});
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(html.includes('href="#a-md--x-1"'));
 assert.ok(html.includes('href="#a-md--x-2"'));
});
