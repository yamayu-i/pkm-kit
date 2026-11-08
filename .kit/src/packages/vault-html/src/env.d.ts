/** esbuild の loader で文字列として束ねる CSS（esbuild.config.mjs） */
declare module "*.css" {
	const css: string;
	export default css;
}

/** preview の fixture（preview/preview.mjs で文字列として束ねる） */
declare module "*.html" {
	const html: string;
	export default html;
}
