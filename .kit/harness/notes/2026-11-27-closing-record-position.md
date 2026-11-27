# 2026-11-27 Closing の記録の位置

## 訂正

- 起きたこと: `.kit/harness/docs/product/` の文書を直して PR を出したが、生成物 `pkm-guide/user-experience.html` を作り直しておらず、CI の「体験定義書」の検査が落ちた。ユーザーに「CI が落ちている」と指摘された。手元でも verify.mjs は失敗を出していたが、出力の末尾だけを見て見落とした
- 改善案: dev-implement（または product/README.md）に「product/ の文書を変えたら `node .kit/bin/product-guide.mjs build` を実行し、生成物も一緒にコミットする」と書く。今は ADR-0042 にしか書かれていない。verify.mjs の結果は ✗ の行で確かめる
