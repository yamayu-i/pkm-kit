/**
 * 閲覧画面の iframe に、Obsidian で今効いているトークンの値を入れる（ADR-0129 の 4）。
 * 子の Vault の基本の色（pkm-theme-local.css）とテーマの切り替えに追従させる。
 * 値は Obsidian の計算済みの CSS 変数だが、CSS を抜け出せるものや外を読み込むものは入れない
 */

const NAME = /^--vt-[a-z0-9-]+$/;
/** 色・長さ・影・時間・緩急だけが書ける文字（引用符・セミコロン・括弧の波・山・バックスラッシュを含まない） */
const VALUE = /^[#a-zA-Z0-9 .,%()+\-*/]+$/;
/** 関数のうち、外を読み込むもの */
const LOADS = /\b(url|image-set|image|src|element|cross-fade)\s*\(/i;
const MAX_LENGTH = 200;

/** トークンの CSS（tokens.css）にある --vt-* の名前（書いた順、重ねない） */
export function tokenVarNames(tokensCss: string): string[] {
	return [...new Set([...tokensCss.matchAll(/(--vt-[a-z0-9-]+)\s*:/g)].map((m) => m[1] as string))];
}

function safe(name: string, value: string): boolean {
	return NAME.test(name) && value.length <= MAX_LENGTH && VALUE.test(value) && !LOADS.test(value);
}

/**
 * 今の値を、トークンの CSS（body / body.theme-dark）と同じ強さで、その後に重ねる CSS。
 * HTML の側のスタイルは後に来るので、これまでどおり HTML の側が勝つ
 */
export function liveVarsCss(vars: Readonly<Record<string, string>>): string {
	const decls = Object.entries(vars)
		.map(([name, value]) => [name, value.trim()] as const)
		.filter(([name, value]) => value !== "" && safe(name, value))
		.map(([name, value]) => `\t${name}: ${value};`);
	return decls.length === 0 ? "" : `body.theme-light,\nbody.theme-dark {\n${decls.join("\n")}\n}`;
}

/**
 * スライド（slide/ の index.html）は面と文字を上流の値で埋め込む（ADR-0125）。
 * 閲覧画面では、スライドのビルドが子の色にする primary の系統だけを今の値にする
 */
const SLIDE_VARS = new Set(["--vt-primary", "--vt-on-primary", "--vt-primary-state-hover", "--vt-on-primary-state-hover", "--vt-secondary-container", "--vt-on-secondary-container", "--vt-focus-ring"]);
export function slideLiveVars(vars: Readonly<Record<string, string>>): Record<string, string> {
	return Object.fromEntries(Object.entries(vars).filter(([name]) => SLIDE_VARS.has(name)));
}
