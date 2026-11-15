# セキュリティチェック 2026-11-15

- 対象 commit: b09ff80 と今回の issue-note-editor 差分
- 前回: 2026-11-15（origin/main のレポート）
- 結果: pass

## 機械的チェック

`pnpm check`（型検査・全プラグインのビルド・テスト）成功。`pnpm security:scan` は audit を含め 8/8 成功。既存画面と Note エディタの UI 自動検査成功。ブラウザで入力・改行・Undo・プレビューから編集への切り替えを確認。

ハーネスの `verify.mjs` は移行テスト 5 件が失敗。変更前の origin/main を別ディレクトリに展開して同じ失敗を再現。今回変更したプラグインの検査は成功。

## 目視レビュー

Markdown は Obsidian の MarkdownRenderer で描画し、HTML を直接 DOM に挿入しない。描画コンポーネントはウィジェット破棄時に unload、エディタはダイアログ終了時に destroy。編集中の値は Save で既存 writer に渡し、Cancel では保存しない。本文の既定値を変えるだけで既存データの書き換えは行わない。認証・通信・ファイル操作の経路に変更なし。

## 依存

`@codemirror/commands` 6.11.1 を固定バージョンで追加。補助依存は CodeMirror language と Lezer 系。install スクリプトの追加なし。commands と補助モジュールはバンドルし、state / view だけを Obsidian と共有する。エディタのキー操作を同梱するため main.js が増加。`pnpm outdated` は出力なし。

## 対応したこと / 残課題

追加した commands の外部 require を同梱に修正。今回の差分でセキュリティ上の残課題なし。実際の Obsidian の描画・リンク・モバイル操作はマージ後に確認する。
