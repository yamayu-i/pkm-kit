# セキュリティチェック 2026-11-16

- 対象 commit: 8472de1（＋作業ツリーの #186 の変更）
- 前回: 2026-11-16（7a5294e）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS（pnpm audit を含む）
- `pnpm check`（`verify.mjs --plugin` の中で実行）: 成功。pkm-task のテスト 530 件、pkm-template のテスト 177 件が通る

## 目視レビュー

対象: #186（issue のプリセット。`src/core/{presets,load,index,ids,schema,sub-issue}.ts`、`src/obsidian/{store,writer}.ts`、`src/header/{PresetHeader,SubIssues,IssueHeader,extension}.tsx`、`src/views/{PresetListView,SidebarView}.tsx`、`cli/read-vault.ts`、pkm-template の `core/{ids,note-list}.ts`、`styles.css`）。

- 認証情報・通信: 触れていない。問題なし
- ファイル書き込み: 新しい書き込みは 2 つ。プリセットの作成（`createPreset`）は連番の ID から `preset/p-N.md` を組み立て（`pathForId`。利用者の入力はパスに入らない）、Vault API の `create` で書く。名前は `JSON.stringify` で YAML の文字列にする。呼び出し（`applyPreset`）は索引にある issue のパスだけを `vault.process` で書き換える。サブの題と本文は既存の検査（`checkSubIssues`、`-->` と改行と区切りの行を止める）を通らなければ書かない。プリセットの項目の更新は既存の `update`（`processFrontMatter`）。CLI は `preset/` を読むだけ。問題なし
- データ消失: 呼び出しは追記だけで、既存の本文とサブのブロックは文字のまま残す（テストで確認）。問題なし
- UI: HTML 文字列を DOM に入れていない（JSX の文字だけ）。問題なし
- サプライチェーン: 依存の追加なし。バンドルは pkm-task の main.js が 426,150 → 442,604 バイト（+16KB。View とヘッダーが 1 つずつ増えた分）、pkm-template が 104,464 → 104,486 バイト。問題なし

## 依存

- 変更なし（lockfile の差分なし）

## 対応したこと / 残課題

- なし
