import {readFile,mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {createRequire} from "node:module";
import esbuild from "esbuild";
import {auditInPage} from "../../design/src/audit.ts";
const here=fileURLToPath(new URL(".",import.meta.url)),root=fileURLToPath(new URL("../../../../../",import.meta.url)),out=join(here,"out");
await mkdir(out,{recursive:true});
await esbuild.build({entryPoints:[join(here,"check-lib.ts")],outfile:join(out,"check.js"),bundle:true,format:"iife",globalName:"guideApi",logLevel:"warning"});
const html=await readFile(join(root,"pkm-guide/user-experience.html"),"utf8");
const css=await readFile(join(root,".kit/src/packages/pkm-html/tokens.css"),"utf8");
const manifest=JSON.parse(await readFile(join(root,"pkm-guide/ui/manifest.json"),"utf8"));
const pngs=Object.fromEntries(await Promise.all(manifest.images.map(async r=>[r.file,(await readFile(join(root,r.file))).toString("base64")])));
const {chromium}=createRequire(import.meta.url)("playwright");
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
try{
 for(const theme of ["light","dark"])for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:1100},colorScheme:theme});
  const requests=[],errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort()});
  await page.setContent('<html><head><style>body{margin:0}iframe{border:0;width:100%;height:1100px}</style></head><body><div id="root"></div></body></html>');
  await page.addScriptTag({path:join(out,"check.js")});
  await page.evaluate(async({html,css,pngs,theme})=>{
   const api=window.guideApi;
   const src=await api.buildSrcdoc(html,{path:"pkm-guide/user-experience.html",theme,tokensCss:css,fontVars:{"--font-text":"system-ui","--font-interface":"system-ui","--font-monospace":"monospace"},readImage:async candidates=>{
    const key=candidates.find(k=>pngs[k]);return key?Uint8Array.from(atob(pngs[key]),c=>c.charCodeAt(0)):null;
   }});
   api.mountFrame(document.getElementById("root"),src,{from:"pkm-guide/user-experience.html",openVault:()=>{},openExternal:()=>{}});
  },{html,css,pngs,theme});
  const frame=page.frames().find(f=>f.parentFrame());
  if(!frame)throw Error("iframe がない");
  await frame.waitForSelector("article");
  const problems=await frame.evaluate(()=>{
   const errors=[];
   const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);
   if(new Set(ids).size!==ids.length)errors.push("ID が重複");
   for(const a of document.querySelectorAll('a[href^="#"]'))if(!document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))))errors.push("見出しリンク切れ");
   if(document.documentElement.scrollWidth>innerWidth+1)errors.push("本文が横にはみ出す");
   if(document.querySelector("script,iframe,link"))errors.push("外部リソースまたは script");
   for(const img of document.querySelectorAll("img"))if(!img.src.startsWith("data:"))errors.push("画像が埋め込まれていない");
   return errors;
  });
  if(problems.length||errors.length||requests.length)throw Error(JSON.stringify({theme,width,problems,errors,requests}));
  const audit=await frame.evaluate(auditInPage,{rootSelector:"body",targetMin:24});
  if(audit.length)throw Error(theme+"/"+width+": "+JSON.stringify(audit.slice(0,12)));
  await page.screenshot({path:join(out,"guide-"+theme+"-"+width+".png")});
  const gallery=frame.locator(".gallery").first();await gallery.scrollIntoViewIfNeeded();
  await frame.locator(".gallery .shot:visible img").first().waitFor({state:"visible"});
  await page.screenshot({path:join(out,"gallery-"+theme+"-"+width+".png")});
  await frame.getByRole("link",{name:"目次へ",exact:true}).first().click();
  await page.keyboard.press("Tab");
  console.log("定義書 "+theme+"/"+width+": 目次・全文・画像・リンク・横幅・コントラストを検証");
  await page.close();
 }
}finally{await browser.close()}
