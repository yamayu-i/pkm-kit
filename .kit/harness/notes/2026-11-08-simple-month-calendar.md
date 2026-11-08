# 2026-11-08 月のカレンダーをシンプルにする（Issue #78）

## つまずき

- 起きたこと: クラウドのセッションで、Issue の本文に添付された画像（`github.com/user-attachments/assets/...`）を取得できなかった。直接は 403、API の `body_html` にある署名付きの URL（`private-user-images.githubusercontent.com`）はプロキシで遮断された。ユーザーが同じ画像をチャットに添付して解決した
- 改善案: dev-plan の「文脈を読む」に、Issue の画像が読めないときは推測で進めずユーザーに画像の添付を頼む、と書く

## つまずき

- 起きたこと: `pnpm preview:ui` が、プロジェクトの Playwright の版のブラウザがなくて失敗した。`CHROMIUM_PATH` に入っているブラウザ（`/opt/pw-browsers/chromium-*/chrome-linux64/chrome`）を渡すと動いた。`CHROMIUM_PATH` は preview.mjs を読むまで分からなかった
- 改善案: プラグインの設計と開発の文書の preview:ui の節に、クラウドのセッションでは `CHROMIUM_PATH` を渡すと書く
