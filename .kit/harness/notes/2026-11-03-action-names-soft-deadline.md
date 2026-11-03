# 2026-11-03 日付のアクション名、soft_deadline への改名、ボードからの delegated

## 訂正

- 起きたこと: 移行付きの大きい変更（ADR-0032、移行 0003）を、チャットでの合意だけで実装して PR（#23）を出した。進め方では、大きい変更は計画を Issue に書いて承認を得る。ユーザーに「Issue は今からでいいので作って」と言われ、後から Issue（#24）を作った
- 改善案: 依頼が小さい変更（文言の修正）から始まり、途中で大きい変更（キーの改名と移行）に広がると、Issue の工程を飛ばしやすい。dev-plan に「途中で大きい変更になったら、その時点で Issue を作る」と書く

## つまずき

- 起きたこと: クラウドの環境で `pnpm --filter vault-task preview:ui` を実行すると、playwright（1.64.1）がブラウザを見つけられずに失敗した。環境に入っているブラウザは `/opt/pw-browsers/chromium` で、`executablePath` を指定する preload を一時的に作って撮った
- 改善案: `preview.mjs` で、環境変数（例: `PLAYWRIGHT_CHROMIUM_EXECUTABLE`）があれば `executablePath` に渡す
