/**
 * 子の Vault の基本の色の primary（.kit-local/theme.json の light.primary / dark.primary。ADR-0125）を、ファイルの中身から読む。
 * CLI（slide.mjs）と pkm-slide（ADR-0132）が同じ読み方をするために、ファイルの読み込みから切り離す。
 * 値の形と規約は theme.mjs check が確かめる。ここでは読めた文字列をそのまま渡し、ビルドが色として確かめる
 */
export function parseVaultPrimary(text: string): { light?: string; dark?: string } | undefined {
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		return undefined;
	}
	const pick = (mode: string): string | undefined => {
		const v = (json as Record<string, unknown> | null)?.[mode];
		const p = typeof v === "object" && v !== null ? (v as Record<string, unknown>).primary : undefined;
		return typeof p === "string" ? p.toLowerCase() : undefined;
	};
	const light = pick("light");
	const dark = pick("dark");
	return light === undefined && dark === undefined ? undefined : { ...(light ? { light } : {}), ...(dark ? { dark } : {}) };
}
