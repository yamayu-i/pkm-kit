# 2026-11-12 子の Vault の基本の色（#121）

## つまずき

- 起きたこと: 新しい CLI（`.kit/bin/theme.mjs`）を design パッケージに足したが、security-scan の「ビルドの再現性」と「require」の検査は、`scripts/security-scan.mjs` に手で並べたパッケージの一覧だけを見ていた。一覧に足すまで、新しい CLI は検査されないまま 8/8 passed になった。新しい CLI を足すときに一覧へ足す、とはどの文書にも書いていない
- 改善案: security-scan が `.kit/bin/*.mjs` のうち一覧にないものを見つけたら失敗にする。あわせて plugin-development.md の CLI の節に「CLI を足したら security-scan の一覧に足す」と書く

- 起きたこと: ADR を「承認」に変えた後、ADR の一覧（README）を作り直し忘れ、verify の「ADR の一覧」とスクリプトのテストが失敗した
- 改善案: dev-plan の「合意したら状態を承認にする」の手順に、`node .claude/scripts/adr-index.mjs --write` を続けて書く
