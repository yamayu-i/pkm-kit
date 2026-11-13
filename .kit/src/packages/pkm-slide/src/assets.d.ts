/** 閲覧の画面の CSS とスクリプト。ビルドで CLI と同じものを束ねる（esbuild.config.mjs。ADR-0132） */
declare module "virtual:slide-assets" {
	const assets: import("../../slide/src/core/build.ts").Assets;
	export default assets;
}
