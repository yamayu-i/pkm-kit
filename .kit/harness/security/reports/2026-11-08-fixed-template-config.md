# セキュリティチェック 2026-11-08

- 対象 commit: 2a4c39b
- 前回: 2026-11-08（cde7caa、スニペットの挿入）
- 結果: pass

pkm-template の `src/obsidian/`（設定タブの削除、設定の保存処理の削除）を変え、移行 0061 を足したので行った（ADR-0061、#61）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass（ビルドの再現性、require、pnpm audit を含む）
- `pnpm check`: 成功。`node .claude/scripts/verify.mjs --plugin`: すべて成功

## 目視レビュー

- **ファイル書き込み**: `template/config.json` への書き込み（`saveConfig`）をなくした。新しい書き込みはない。ノートの作成とスニペットの挿入は変えていない: 問題なし
- **UI**: 設定タブ（`createEl` の `text` だけを使っていた）を消した。HTML の挿入はない: 問題なし
- **移行 0061**: 子の `template/config.json` だけを消し、空になった `template/` を消す。読めないときは消さない。ほかのパスには触れない: 問題なし
- **認証情報・通信**: 変更なし

## 依存

- 変更なし（`package.json`・lockfile の差分なし）。`pnpm outdated` に更新はない
- バンドルサイズ: pkm-template の `main.js` が 84.6 KB から 76.3 KB に減った（設定タブと重ね合わせのコードの削除）

## 対応したこと / 残課題

- 改名の前の `packages/vault-*/`（git で追跡していない `node_modules` だけのフォルダ）が手元に残っていると、`security:scan` の 2 項目がパッケージとして読んで失敗する。手元のフォルダを消して通した。リポジトリの問題ではない
