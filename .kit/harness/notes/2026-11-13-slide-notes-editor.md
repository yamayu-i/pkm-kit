# 2026-11-13 発表者ノートの編集（#132）

## つまずき

- 起きたこと: pkm-slide の中で CLI と同じ index.html を作ろうとしたら、閲覧の画面のスクリプトの中の esbuild のパスのコメント（`// src/runtime/main.ts`）が、ビルドを呼んだフォルダ（cwd）によって変わり、CLI とバイト列がずれた。CLI と pkm-slide の出力を照合するテストで見つかった
- 改善案: 直した（`packages/slide/esbuild.config.mjs` の `buildRuntime` に `absWorkingDir` を付けた）。ほかのパッケージの esbuild でも、出力を別の場所と照合するなら同じことが起きる。プラグインの設計と開発の文書に「出力を照合するビルドは absWorkingDir を固定する」と書くとよい

## つまずき

- 起きたこと: 一覧ペインの接頭辞（`pkm-slide-`）を持つ View は、すべて一覧の View として扱われる（`shared/src/list-pane.ts`）。ノートペインに開く編集の画面（`pkm-slide-notes`）を足すとき、`NOT_LIST_VIEWS` に足す必要があった。文書（ADR-0033 とプラグインの設計と開発）には、接頭辞を持つが一覧ではない View の足し方がない
- 改善案: プラグインの設計と開発の文書の一覧ペインの節に、接頭辞を持つ View は一覧として扱われること、そうでない View は `NOT_LIST_VIEWS` に足すことを書く
