# 2026-11-07 member の項目と Members の View

## 訂正

- 起きたこと: ユーザーは検索用の項目を `alias` と指定したが、ADR の提案で Obsidian 標準の `aliases`（リスト）に読み替えた（vault-conventions の「aliases はリスト」と、クイックスイッチャーに効くことを理由にした）。ユーザーから「単数の alias で十分。Obsidian 依存にせず、こちら側で制御したい」と直された
- 改善案: ユーザーが項目名を指定したときは、そのまま使う案を第一にし、読み替えは「確かめたいこと」に別案として出すだけにする。dev-plan の「確かめたいこと」に、指定された名前・形を変える提案はそこで聞く旨を書く

## つまずき

- 起きたこと: クラウドのセッションで `pnpm --filter vault-task preview:ui` が「Playwright のブラウザがない」で失敗した。package.json の playwright（1.64.1）が、環境に入っている Chromium（`/opt/pw-browsers/chromium`）を見つけられない。スクラッチパッドに `chromium.launch` へ `executablePath` を渡す preload を置いて `node -r` で回避した
- 改善案: preview.mjs が環境変数（例: `PREVIEW_CHROMIUM_PATH`）で実行ファイルを受け取れるようにし、plugin-development の文書に書く
