# セキュリティチェック 2026-11-27

- 対象 commit: 0200d78（とその上の未コミットの変更。ADR-0244・0245 の実装）
- 前回: 2026-11-27 780d54a（2026-11-27-note-header-edit.md）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現性、require、pnpm audit）
- 型チェック・ビルド・テスト（`pnpm -r typecheck`、`pnpm build`、`pnpm -r test`）: すべて通過。メモリの都合で並列数を 2 にして流した
- `pnpm --filter pkm-task preview:ui`: 問題なし（contrast・target-size・focus-visible・keyboard）

## 目視レビュー

前回からの差分（`.kit/src`・`.kit/bin`・`.obsidian/plugins`）を見た。

### 認証情報・通信
- 問題なし。認証・通信のコードに変更はない。通信の API（`requestUrl`・`fetch`）は増えていない

### ファイル書き込み
- `TaskWriter.cancelSubs` / `clearSubDates`（`src/obsidian/writer.ts`）は、索引にある親の issue の md だけを `vault.process` で 1 回書く。パスは索引のサブから取り、入力から作らない。別の親のサブが混じれば書かない
- 書く前に、変える全部のサブを `assertSubs` で検査し、1 件でも通らなければ何も書かない（一部だけ書かれることがない）
- 移行 0245 は `issue/i-N.md`（サブフォルダとシンボリックリンクは見ない）のサブの項目の行だけを書き換え、本文・DailyNote には触れない。2 回目は何も変えない（テストで確かめた）

### データ消失
- 一括の Cancel は期間と Calendar の日を残す（ADR-0190）。Clear dates は利用者が選んだサブの日付だけを消す
- 移行 0245 は値を足すだけで、消さない。読めない値は直さず、check に残す

### UI
- HTML 文字列を DOM に入れていない。新しい画面（`sub-bulk.tsx`・`PeriodForm`）は Preact の JSX だけで描く

### サプライチェーン
- 依存の変更なし（`package.json`・`pnpm-lock.yaml`・`pnpm-workspace.yaml` の差分なし）
- pkm-task の main.js は 557 KB → 568 KB。新しいダイアログ 2 つと期間の部品の分で、説明がつく

## 依存

- `pnpm outdated`: preact 11、node-diff3 4 などのメジャー更新がある。脆弱性の修正ではないので、今は上げない

## 対応したこと / 残課題

- なし
