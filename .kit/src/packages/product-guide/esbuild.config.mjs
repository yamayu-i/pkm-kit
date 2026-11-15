import esbuild from "esbuild";
import {fileURLToPath} from "node:url";
await esbuild.build({entryPoints:["cli/product-guide.ts"],outfile:(process.env.KIT_BINDIR||fileURLToPath(new URL("../../../bin/",import.meta.url)))+"product-guide.mjs",bundle:true,format:"esm",platform:"node",target:"node22",minify:false,legalComments:"eof"});

// 上流の通常ビルドは HTML も更新する。画像を作るのは capture の明示的な実行だけ。
if (!process.env.KIT_BINDIR) {
 const {existsSync}=await import("node:fs");
 const {execFileSync}=await import("node:child_process");
 const root=fileURLToPath(new URL("../../../../",import.meta.url));
 if(existsSync(root+"pkm-guide/ui/manifest.json")) execFileSync(process.execPath,[root+".kit/bin/product-guide.mjs","build",root],{stdio:"inherit"});
}
