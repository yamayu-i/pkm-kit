## 変更の要約

- 子の Vault ごとに、全プラグインと Obsidian 本体の基本の色（面・その上の文字・枠・アクセント）を変えられるようにした（ADR-0121）。`.kit-local/theme.json` に変えたい色を書き、`node .kit/bin/theme.mjs build` で子のスニペット `.obsidian/snippets/pkm-theme-local.css` を作る。`appearance.json` の `accentColor` と `enabledCssSnippets` も合わせる
- デザイン規約（コントラスト比、面の段差）に合わない組み合わせは、CLI が何も書かずに止め、`verify.mjs` も止める。状態の色（status・期限・エラーの色相）は変えられない
- 変えられる色は `node .kit/bin/theme.mjs list`、手順は `.claude/docs/harness.md` の「基本の色」
- 子への影響: 移行はない。`theme.json` がない Vault は、見た目も検査も変わらない。生成済みのスライド、書き出した html、図は上流の色のまま
