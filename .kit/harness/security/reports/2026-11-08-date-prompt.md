# セキュリティチェック 2026-11-08

- 対象 commit: d713f6b
- 前回: 2026-11-08（5041633）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS（秘密情報、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現性、require、pnpm audit）
- `pnpm check`（`verify.mjs --plugin`）: 型チェック・ビルド・テストすべて成功

## 目視レビュー

差分は pkm-template の日付のダイアログ（ADR-0065）と、日付の処理の shared への移動。

- 認証情報: 触れていない。問題なし
- 通信: 通信を足していない。問題なし
- ファイル書き込み: 新しい書き込みの経路はない。ノートの作成は既存の `createNoteFromTemplate`（`vault.create`）、スニペットは既存の `editor.replaceRange` のまま。ダイアログで選んだ日付は `YYYY-MM-DD`（と曜日）の形だけで、生成先のパスには展開しない。問題なし
- データ消失: キャンセルではノートを作らず、エディタも変えない。問題なし
- UI: Preact の JSX だけで描き、HTML 文字列を DOM に入れていない。問題なし
- サプライチェーン: 依存も lockfile も変えていない。pkm-template の main.js が増えたのは、ダイアログ・カレンダーと shared の日付の処理をバンドルしたため

## 依存

増えたパッケージはない（lockfile の差分なし）。

## 対応したこと / 残課題

なし
