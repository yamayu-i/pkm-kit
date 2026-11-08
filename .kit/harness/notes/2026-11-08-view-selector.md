# 2026-11-08 View を探して開くダイアログ（pkm-view-selector）

## 訂正

- 起きたこと: 最初の ADR では、ダイアログを既存の pkm-ribbon に置いた（成果物と移行が少ないため）。ユーザーから「新しいプラグインにして」と言われ、新しいプラグインにした。続けて、名前（`pkm-switcher` → `pkm-view-selector`）と、Markdown リンクの挿入の Mod+K の扱い（Mod+Shift+K に移す → 移さず消す。子の割り当ても上書き）を直された
- 改善案: 役割の違う機能を既存のプラグインに足すか新しいプラグインにするかの判断の基準（1 つのプラグインは 1 つの役割、など）を、プラグインの設計と開発の文書に書く

## つまずき

- 起きたこと: 作業の途中で main に pkm-updates（ADR-0070）と、プラグインの成果物を ID ごとに書く `owned-paths.json`（#20）が入った。merge で 6 ファイルがぶつかり、新しいプラグインの成果物を `owned-paths.json` に足す必要が出た。pkm-updates の一覧の View も候補の対象に加えた
- 改善案: 新しいプラグインを足すときに触る場所（`obsidian-required.json`、`owned-paths.json`、`.gitignore`、`security-scan.mjs`、fresh の fixture、移行のテストの期待値）を、プラグインの設計と開発の文書に一覧で書く。移行のテストは、community-plugins.json の全体の並びを比べる期待値が多く、プラグインを足すたびに 5 か所前後を直すことになる

- 起きたこと: `pnpm check` で、design のテストが `node_modules/.vitest-cache` の削除の競合（ENOTEMPTY）で一度失敗した。もう一度流すと通った
- 改善案: 続くようなら、vitest のキャッシュの置き場所をパッケージごとに分ける
