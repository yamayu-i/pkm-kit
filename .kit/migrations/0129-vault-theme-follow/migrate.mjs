/**
 * 0129: 子の基本の色のスニペットを作り直す（.kit/src/docs/adr/0129-vault-theme-follow-primary.md）。
 * - .kit-local/theme.json がある Vault だけ、node .kit/bin/theme.mjs build で pkm-theme-local.css と appearance.json を作り直す
 *   （primary から作る secondary-container・on-primary など、ダークの primary、Mermaid の上書きが足される）
 * - theme.json がない Vault では何もしない
 * 何度実行しても同じ結果になる。theme.json が規約に合わなければ何も書かない（check が失敗して止まる）
 */
import { hasTheme, SNIPPET, THEME, theme } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	if (!hasTheme(root) || theme(root, "check").ok) return [];
	const change = `${SNIPPET}: ${THEME} から作り直す（primary から作る色を足す）`;
	if (dryRun) return [change];
	return theme(root, "build").ok ? [change] : [];
}
