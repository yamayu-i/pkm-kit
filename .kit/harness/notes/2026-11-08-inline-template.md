# 2026-11-08 インラインテンプレート

## つまずき

- 起きたこと: パッケージを `vault-*` から `pkm-*` に改名した（ADR-0058）前のブランチから main に切り替えたら、追跡されない `packages/vault-*/node_modules`（と `vault-html/preview/out`）が残り、`pnpm security:scan` の「危険な API」「依存の固定」が `packages/vault-git/src` などがないと失敗した。消すのは自動の判定に止められ、scratchpad へ移して通した
- 改善案: security-scan が、`package.json` のないパッケージのフォルダを飛ばす（または「改名前の残りがある」と分かるエラーにする）

## つまずき

- 起きたこと: `pnpm check` の並列のテストで、`node_modules/.vitest-cache` の削除がぶつかり（ENOTEMPTY）、関係ないパッケージで失敗した。`pnpm -r --workspace-concurrency=1 test` なら通った
- 改善案: vitest のキャッシュの置き場所をパッケージごとにする
