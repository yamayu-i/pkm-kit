import {mkdir,readFile,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {createRequire} from "node:module";
import {platform} from "node:os";
import esbuild from "esbuild";
import {assetsPlugin,buildAssets} from "../../slide/esbuild.config.mjs";
import {fingerprint,sha,safeOutput} from "../../../../bin/product-guide.mjs";
const here=fileURLToPath(new URL(".",import.meta.url)), root=fileURLToPath(new URL("../../../../../",import.meta.url)),out=join(here,"out");
import {templateOf} from "../../slide/preview/gallery.mjs";
import {DOMParser} from "linkedom";
const catalog=JSON.parse(await readFile(join(here,"../catalog.json"),"utf8"));
const screens=[...new Map(Object.values(catalog).flatMap(e=>e.screens).map(s=>[s.provider+"--"+s.screen,s])).values()];
await mkdir(out,{recursive:true});await mkdir(join(root,"pkm-guide/ui"),{recursive:true});
await esbuild.build({entryPoints:[join(here,"fixture.tsx")],outfile:join(out,"fixture.js"),bundle:true,format:"iife",jsx:"automatic",jsxImportSource:"preact",alias:{obsidian:join(here,"mock.ts")},plugins:[assetsPlugin],loader:{".html":"text",".css":"text",".svg":"text"},logLevel:"warning"});
const packages=["pkm-task","pkm-template","pkm-updates","pkm-slide","pkm-diagram","pkm-ribbon","pkm-html"];
const css=(await Promise.all(packages.map(p=>readFile(join(root,".kit/src/packages",p,"styles.css"),"utf8")))).join("\n");
const snippet=await readFile(join(root,".obsidian/snippets/pkm-theme.css"),"utf8");
const tokens=await readFile(join(root,".kit/src/packages/pkm-task/tokens.css"),"utf8");
const shared=await readFile(join(root,".kit/src/packages/shared/src/month-calendar.css"),"utf8");
const chrome=`body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:var(--background-primary);color:var(--text-normal)}#wide{width:100%;min-height:64px}.modal-content{position:relative;padding:16px}.setting-item{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--background-modifier-border)}.setting-item-description{font-size:13px;color:var(--text-muted)}.setting-item-control{display:flex;gap:8px}button,input,textarea,select{font:inherit;color:inherit;max-width:100%}button{background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:4px;padding:6px 10px}input,textarea,select{background:var(--background-primary);border:1px solid var(--background-modifier-border);padding:8px}svg{width:20px;height:20px}.side-dock-ribbon-action{position:relative;margin:8px}.suggestion-item{display:flex;gap:12px;padding:12px}.suggestion-note{font-size:13px}.suggestion-icon{width:24px}iframe{width:100%;height:760px;border:0}.vt-diagram-zoom{height:640px;position:relative}.vt-diagram-zoom-stage{height:480px}*{animation:none!important;transition:none!important;caret-color:transparent!important}`;
for(const theme of ["light","dark"])await writeFile(join(out,theme+".html"),'<!doctype html><html><head><meta charset="utf-8"><style>'+snippet+"\n"+tokens+"\n"+css+"\n"+shared+"\n"+chrome+'</style></head><body class="theme-'+theme+'"><script src="fixture.js"></script></body></html>');
await esbuild.build({entryPoints:[join(here,"../../slide/src/core/build.ts")],outfile:join(out,"builder.mjs"),bundle:true,format:"esm",platform:"node",logLevel:"warning"});
const {buildDeck}=await import("file://"+join(out,"builder.mjs"));
const assets=await buildAssets();
for(const theme of ["light","dark"]){
 const result=buildDeck({source:'<title>体験を確認する</title><meta name="deck-theme" content="'+theme+'">'+templateOf("statement")+templateOf("next-steps"),deckPath:"slide/guide-example",assets,exists:()=>true,parse:html=>new DOMParser().parseFromString(html,"text/html"),sha256:(text,encoding)=>encoding==="hex"?sha(text):Buffer.from(sha(text),"hex").toString("base64")});
 if(!result.html)throw Error(JSON.stringify(result.problems));
 await writeFile(join(out,"deck-"+theme+".html"),result.html);
}
const {chromium}=createRequire(import.meta.url)("playwright");
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const manifest={fingerprint:fingerprint(root),platform:platform(),browser:browser.version(),images:[]};
const check=process.argv.includes("--check");
const wanted=process.argv.find(a=>a.startsWith("--only="))?.slice(7);
try{
 for(const screen of screens.filter(s=>!wanted||s.provider===wanted)){
  const key=screen.provider+"--"+screen.screen;
  for(const theme of ["light","dark"])for(const [width,pixels] of [["wide",1024],["narrow",390]]){
   let page=await browser.newPage({viewport:{width:pixels,height:1100},timezoneId:"Asia/Tokyo",locale:"ja-JP",colorScheme:theme});
   const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+09:00"));
   if(screen.provider==="browser"){
    await page.goto("file://"+join(out,"deck-"+theme+".html"));
    if(screen.screen==="review")await page.getByRole("button",{name:"Review",exact:true}).click();
    if(screen.screen==="show")await page.getByRole("button",{name:"Slide Show",exact:true}).click();
    if(screen.screen==="presenter"){
     const popup=page.waitForEvent("popup");
     await page.getByRole("button",{name:"Presenter",exact:true}).click();
     const presenter=await popup;await presenter.waitForLoadState();await presenter.clock.setFixedTime(new Date("2026-11-16T10:00:00+09:00"));page=presenter;
    }
   }else await page.goto("file://"+join(out,theme+".html")+"?guide-only=1#"+key);
   if(screen.provider!=="browser")await page.waitForFunction(()=>window.guideReady===true,null,{timeout:5000}).catch(e=>{throw Error(key+": "+(errors.join("; ")||e.message))});
   await page.waitForTimeout(220);
   if(screen.screen==="capture--input")await page.locator("textarea").fill("資料を読む\n- 相談する\n\n");
   if(screen.screen==="list--search")await page.locator("input").fill("zzzz");
   if(screen.provider==="diagram"&&screen.screen==="toolbar")await page.locator("#wide img").hover();
   if(screen.provider==="template"&&screen.screen.startsWith("create")){const input=page.locator('input[type="text"]');if(await input.count())await input.first().fill("次の一歩");}
   await page.waitForTimeout(120);
   if(errors.length)throw Error(key+": "+errors.join("; "));
   if(screen.provider==="task"&&["pick","board"].includes(screen.screen)){
    const current=await page.locator('[aria-current="step"]').innerText();
    const expected={pick:"Pick",board:"Board"}[screen.screen];
    if(!current.includes(expected))throw Error(key+": 違う段階が表示されている: "+current);
   }
   const el=screen.provider==="browser"?page.locator("body"):page.locator("#wide");
   const text=await el.innerText();
   if(!text.trim()&&screen.provider!=="html"&&screen.provider!=="diagram")throw Error("画面が空: "+key);
   const file="pkm-guide/ui/"+key+"-"+theme+"-"+width+".png";
   const buffer=await el.screenshot({animations:"disabled"});
   const record={screen:key,file,theme,width,sha256:sha(buffer),text:sha(text)};
   if(!check)await writeFile(safeOutput(root,file),buffer);
   else {
    const old=JSON.parse(await readFile(join(root,"pkm-guide/ui/manifest.json"),"utf8"));
    const prev=old.images.find(r=>r.file===file);
    // UI の入力が変わっていれば古さは想定どおり。警告にとどめ、反映は月 1 回か任意のタイミングで行う
    const stale=old.fingerprint!==manifest.fingerprint;
    const fail=message=>{if(!stale)throw Error(message);console.warn("警告: "+message)};
    if(!prev||prev.text!==record.text)fail("描画した内容が一致しない: "+file);
    else if(old.platform===platform()&&old.browser===browser.version()&&prev.sha256!==record.sha256)fail("固定環境の画像が一致しない: "+file);
    await writeFile(join(out,file.split("/").pop()),buffer);
   }
   manifest.images.push(record);await page.close();
  }
  console.log(key+": 4 条件を描画");
 }
}finally{await browser.close()}
if(!check&&!wanted)await writeFile(join(root,"pkm-guide/ui/manifest.json"),JSON.stringify(manifest,null,2)+"\n");
console.log("画面例: "+manifest.images.length+" 枚"+(check?"を検証":"を生成"));
