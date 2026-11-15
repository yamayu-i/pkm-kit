# セキュリティチェック 2026-11-15

- 対象 commit: e7592e5（＋markdown-view-parity の作業ツリー）
- 前回: 2026-11-15（bec4716）
- 結果: pass

## 機械的チェック

- `TMPDIR=/private/tmp node .claude/scripts/verify.mjs --plugin`: 成功。型・ビルド・テストを含む。
- `pnpm security:scan`: 8/8 PASS（audit、成果物の再現性を含む）。
- `preview:ui header header-unpicked header-picked header-someday header-closed routine`: ライト・ダーク × 広幅・狭幅の検査に成功。Issue の状態ごとの操作と Pick・再生の 36px を検査。
- Pick の表示条件は全 status × ボード内外 × 記録の有無をテスト。pkm-task は 485 テスト成功。
- Chromium に Obsidian 本体の CSS と変更 CSS を読み、H2 上余白・見出し直後を含むリスト行間・深さ 1〜9 の記号を両モードで比較。4 条件で一致を確認。本体の CSS は検証用の一時ファイルにのみ置き、配布しない。

## 目視レビュー

- 認証情報・通信: 変更なし。問題なし。
- UI: Issue と上下のサブで Pick・再生・停止の判断を共通化。記録中は完了後も停止できる。既存の書き込み経路を使い、HTML の注入や新しいファイル書き込みは追加しない。問題なし。
- ファイル書き込み: 移行は指定した Vault の app.json の設定 1 項目のみを変更する。他のキーと末尾改行の有無を保持し、本文には触れない。問題なし。
- データ消失: 読めない JSON・オブジェクトでない値・不正な設定値は変更せず check で止める。dry-run と冪等性をテストで確認。問題なし。
- サプライチェーン: 依存・lockfile の変更なし。問題なし。

## 依存

- `pnpm outdated`: 更新対象なし。

## 対応したこと / 残課題

- 実際のノートの仮想スクロール・空行・他の拡張との組み合わせはマージ後に確認する。設定反映には Obsidian の再起動が必要。
