# セキュリティチェック 2026-11-09

- 対象 commit: 64627e8（Issue #103、ADR-0103。PKM Git の衝突の記録と、複数の共通祖先）
- 前回: 2026-11-08（Issue #89、PKM Git の自動の同期）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed
- `pnpm check`: 成功（pkm-git 149 テスト、全パッケージ成功）

## 目視レビュー

対象: `src/git/conflict-records.ts`（記録の形・読み書き）、`src/git/engine.ts`（共通祖先、記録をマージのツリーに入れる）、`src/merge/tree-merge.ts`（`commonBaseTree`）、`src/sync/controller.ts`（記録）、`src/main.ts`・`src/obsidian/modals.ts`（一覧と解決のボタン）。

### 認証情報
- 問題なし。記録に入るのはパス・端末名・日時・コミットの oid だけ。トークンや URL は入らない。同期の記録への書き込みは今までどおり `redactSecrets` を通る

### ファイル書き込み
- 問題なし。記録は、マージの結果のツリーに入り、作業ツリーへは `moveTo` の `assertSafeWorktreePath` を通って書かれる
- 記録の中の `path` は、読むときに `isSafeWorktreePath` で検査し、`.git` と Vault の外と `.pkm-git/` を指すものは読めない記録として扱う。Delete ボタンで消すのは、検査を通った記録の `path` だけ
- 記録を消す関数（`removeConflictRecord`）は `.pkm-git/conflicts/` の直下の `.json` だけを消し、それ以外のパスは拒む（テストあり）

### データ消失
- 問題なし。Delete はファイルを Obsidian のごみ箱の設定に従って消し、確認のモーダルを出す。自動で消すのは、対象のファイルがもうない記録だけ。読めない記録は自動では消さない
- 共通祖先が複数あるとき、祖先によって違うパスを祖先から外すので、片方の変更を黙って戻さない（テストで、先頭の祖先だけを使うと黙って戻ることも確かめた）

### UI
- 問題なし。一覧のボタンとパスは `createEl` の `text` だけで作り、HTML 文字列を DOM に入れていない

### サプライチェーン
- 依存・lockfile の変更なし
