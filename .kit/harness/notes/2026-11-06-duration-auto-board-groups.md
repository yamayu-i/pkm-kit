# 2026-11-06 estimated の単位入力、今日の予定の自動のボード入り、置き場所の記憶

## つまずき

- 起きたこと: クラウドのセッションで `pnpm --filter vault-task preview:ui` が、Playwright のブラウザが見つからずに失敗した。環境に入っているブラウザ（`/opt/pw-browsers/chromium`）と、`vault-task` が固定している playwright の版が合わない。`chromium.launch` に `executablePath` を渡す preload を作業用のフォルダに置いて回避した
- 改善案: `preview/preview.mjs` が環境変数（たとえば `PW_CHROMIUM_PATH`）でブラウザのパスを受け取れるようにし、プラグインの設計と開発の文書に書く

## 質問

- 起きたこと: 大きい変更なので、手順では ADR と Issue で計画の承認を得る。ユーザーはチャットで 4 件の方針（おすすめの案）を承認したので、Issue は作らず、ADR を `承認` で書いて同じブランチに入れた。後でユーザーに頼まれ、実装の後から Issue（#28）を作って計画を書いた
- 改善案: チャットで方針の承認を得たときに Issue を省いてよいかを、進め方に書く
