# セキュリティチェック 2026-11-25

- 対象 commit: 31c1058
- 前回: 2026-11-24 25e1b31
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて成功（pkm-task 679 件を含む）
- `pnpm --filter pkm-task preview:ui`: 問題なし

## 目視レビュー

この変更の差分は pkm-task（ADR-0231: View「Projects」、負荷の行、見積もりのサイズのチップ、プリセットの見積もりの既定値）と、その成果物（pkm-task・pkm-updates の main.js、.kit/bin の CLI。プリセットの読み込みを束ねているため）。

- 認証情報: 触れていない。問題なし
- 通信: 新しい通信はない。問題なし
- ファイル書き込み: `src/obsidian/settings.ts` に設定の項目（`capacity`。平日・土日の分の数）を足しただけ。data.json に入るのは数で、秘密情報ではない。読み込み時に `sanitizeCapacity` で範囲外（0〜24 時間の外、数でない）を既定に戻す。`writer.ts` は `applyPreset` でサブの `estimated` に既定値を渡すだけで、書き込みの経路（`vault.process` と `checkSubIssues`）は変えていない。プリセットの frontmatter の `sub_issues` に対応（`summary`・`estimated`）を書けるよう `FieldValue` の型を広げたが、書き込みは既存の `processFrontMatter` の経路。問題なし
- データ消失: 既存の md を書き換える処理は増えていない。今のプリセット（文字列だけ）はそのまま読める。問題なし
- UI: HTML 文字列を DOM に入れていない（preact の JSX と Obsidian の Menu だけ）。問題なし
- サプライチェーン: 依存・lockfile・`pnpm-workspace.yaml` の変更なし。pkm-task の main.js は約 16 KB 増（機能の追加分）

## 依存

- `pnpm outdated`: 出力なし
- lockfile の差分なし

## 対応したこと / 残課題

なし
