# セキュリティチェック 2026-11-24

- 対象 commit: 25e1b31
- 前回: 2026-11-20 c2fd699
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて成功（pkm-task 766 件を含む）
- `pnpm --filter pkm-task preview:ui`: 問題なし

## 目視レビュー

前回からの差分は、pkm-task（Organize と Someday の変更、この変更の締めの日付と猶予）、pkm-template の ADR の一覧、pkm-updates のビルド成果物。

- 認証情報: 触れていない。問題なし
- 通信: 新しい通信はない。問題なし
- ファイル書き込み: `src/obsidian/settings.ts` に設定の項目（`closingGraceHour`、整数 0〜6）を足しただけ。data.json に入るのは数で、秘密情報ではない。読み込み時に `sanitizeGraceHour` で範囲外を既定に戻す。締めの日のボードとデイリーノートへの書き込みは既存の writer の経路（`closeBoard`・`insertReview`・ボードの操作ログ）に日付を渡すだけ。問題なし
- データ消失: デイリーノートの本文を変える処理は増えていない（型の挿入は既存の処理で、見出しがあれば入れない）。自動の締めは待つ条件が増えただけ。問題なし
- UI: HTML 文字列を DOM に入れていない。設定はドロップダウン（Obsidian の Setting）。問題なし
- サプライチェーン: 依存・lockfile・`pnpm-workspace.yaml` の変更なし。pkm-task の main.js は約 3 KB 増（機能の追加分）

## 依存

- `pnpm outdated`: 出力なし
- lockfile の差分なし

## 対応したこと / 残課題

なし
