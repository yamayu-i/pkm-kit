# セキュリティチェック 2026-11-16

- 対象 commit: 7f4f875
- 前回: 2026-11-16 ec9b8b2（2026-11-16-tickler-open-only）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed
- `pnpm check`: 型チェック・ビルド・テストすべて成功（pkm-task 637 件ほか）

## 目視レビュー

前回からの差分は、サブイシューの `soft_deadline` / `deadline` をなくし、`end` を期限として扱う変更（ADR-0190）と、その移行 0190。`src/obsidian/` の変更は、TaskWriter の `updateSub` で someday のサブに期間を入れたら open に戻す変換を足したことと、Edit のダイアログの日付の欄を減らしたことだけ。

- 認証情報・通信: 対象外。追加なし。問題なし
- ファイル書き込み: 書き込みの経路は変えていない（今までどおり `vault.process` と書く前の検査）。問題なし
- データ消失: サブの `soft_deadline` / `deadline` は読まなくなり、書き換えると消える。移行 0190 が先に `end` にまとめ、消した値は報告に出す。lint が残りを警告する。問題なし
- UI: HTML 文字列を DOM に入れていない。問題なし
- サプライチェーン: 依存・lockfile の変更なし

## 依存

- 変更なし

## 対応したこと / 残課題

- なし
