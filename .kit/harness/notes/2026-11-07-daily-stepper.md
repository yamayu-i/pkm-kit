# 2026-11-07 Daily の段階表示を縮める

## つまずき

- 起きたこと: クラウドのセッションで `pnpm --filter vault-task preview:ui` を実行したら、Chromium の起動で失敗した。固定している playwright 1.64.1 はブラウザのビルド 1248（`chromium_headless_shell-1248`）を探すが、環境に入っていたのは 1243 だった。案内どおりの `playwright install` は環境の決まりで使えないので、リポジトリの外でブラウザの場所を差し替えて（1248 の名前で 1243 へのリンクを張って）撮った
- 改善案: `preview.mjs` で、環境変数（例: `PLAYWRIGHT_CHROMIUM_EXECUTABLE`）があれば `chromium.launch({ executablePath })` に渡せるようにし、[上流のハーネス](../CLAUDE.md) のコマンドの説明に、版が合わないときの使い方を書く

## つまずき

- 起きたこと: 作業用のブランチが、前の作業でマージ済みの PR のままだった（HEAD がマージコミットより前）。気づいたのは変更を終えてコミットする直前で、最新の main からブランチを作り直してから変更を載せ直した
- 改善案: [進め方](../docs/workflow.md) の作業の始め方に「ブランチの PR がマージ済みでないかを最初に確かめる」を書く
