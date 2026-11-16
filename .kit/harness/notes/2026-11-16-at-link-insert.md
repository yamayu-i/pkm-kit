# 2026-11-16 @ でリンクを探して入れる

## 食い違い

- 起きたこと: クラウドのセッションに `mise` がなく、`mise install` が使えなかった。Node は 22（`mise.toml` は 26）、pnpm は 12.16.1 が入っていた。Node 22 のまま `pnpm check`・`security:scan`・`verify.mjs` を実行し、すべて通った
- 改善案: クラウドのセッションのセットアップ（setup script）で mise と Node 26 を入れるか、文書に「mise がないときは入っている Node で実行し、版を記録する」と書く

## つまずき

- 起きたこと: shared の CSS を足したら、design の検査（design.md のクラスが CSS にあるか）と CSS の lint の対象に入っていなかった。`packages/design/node/paths.ts` の `PLUGIN_CSS` に手で足した。pkm-template の `@codemirror/view` も、bundle.test.ts と security-scan の許可を手で足した
- 改善案: プラグインの設計と開発の文書に「shared に CSS や CodeMirror を使うものを足したら、PLUGIN_CSS・各 bundle.test.ts・security-scan の allowedRequires を直す」と書く
