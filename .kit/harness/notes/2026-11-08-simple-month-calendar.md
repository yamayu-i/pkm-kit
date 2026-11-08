# 2026-11-08 月のカレンダーをシンプルにする（Issue #78）

## つまずき

- 起きたこと: 共有の部品の CSS（`packages/shared/src/month-calendar.css`）を足したら、design.md の検査が「クラスが CSS にない」と失敗した。検査する CSS の一覧（`packages/design/node/paths.ts` の `PLUGIN_CSS`）がプラグインの styles.css だけだった。一覧に足すと、フォーカスの枠と outline-offset の規則の違反も見つかった
- 改善案: 一覧に足した（直した）。共有の CSS を足すときは `PLUGIN_CSS` にも足す、とプラグインの設計と開発の文書に書く

## つまずき

- 起きたこと: クラウドのセッションで、Issue の本文に添付された画像（`github.com/user-attachments/assets/...`）を取得できなかった。直接は 403、API の `body_html` にある署名付きの URL（`private-user-images.githubusercontent.com`）はプロキシで遮断された。ユーザーが同じ画像をチャットに添付して解決した
- 改善案: dev-plan の「文脈を読む」に、Issue の画像が読めないときは推測で進めずユーザーに画像の添付を頼む、と書く

## つまずき

- 起きたこと: `pnpm preview:ui` が Playwright の版のブラウザがなくて失敗し、preview.mjs を読んで `CHROMIUM_PATH` を見つけた。手順はプラグインの設計と開発の「クラウドのセッションでの準備」に書いてあったが、先に読まなかった
- 改善案: dev-implement の「4. Obsidian の実機で確かめる」か preview:ui を使う所から「クラウドのセッションでの準備」へリンクする
