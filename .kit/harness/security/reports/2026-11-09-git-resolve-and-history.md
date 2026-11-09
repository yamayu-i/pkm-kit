# セキュリティチェック 2026-11-09

- 対象 commit: 8e61ba4（Issue #110、ADR-0110。PKM Git の衝突の解決とファイルの履歴）
- 前回: 2026-11-09（Issue #106、shallow clone）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed
- `pnpm check`: 成功（pkm-git 166 テスト、全パッケージ成功）

## 目視レビュー

対象: `src/git/engine.ts`（fileHistory、readVersion、deepen、snapshotBeforeRestore）、`src/merge/text-merge.ts`（マーカーの塊）、`src/merge/tree-merge.ts`（別名の版の元のファイル）、`src/sync/controller.ts`（exclusive）、`src/main.ts`・`src/obsidian/modals.ts`（コマンド、ファイルのメニュー、モーダル）。

### 認証情報・通信
- 問題なし。履歴の取り足し（`deepen`）は、今の fetch と同じ `net`（`assertAuthTarget` で接続先を検査してからトークンを取り出す）で、設定の remote にだけつながる。使う人が Load older を押したときだけ実行する
- 失敗の Notice と同期の記録は、今までどおり `redactSecrets` を通す

### ファイル書き込み
- 問題なし。`fileHistory` と `readVersion` はパスを `assertSafeWorktreePath` で検査する。戻す先は、Vault の中で開いたファイル（ファイルのメニューか、開いているファイル）のパスだけ
- 別名の版の元のファイルは、Vault の中のファイルの名前から ` (conflict …)` を除いて決める。同じフォルダの中だけで、`.` で始まる名前にはしない
- マーカーの解決は `vault.process` で、開いたときの本文と同じときだけ書く

### データ消失
- 問題なし。戻す前に、今の内容を必ずコミットする（オフラインでも残る）。Use this version と Discard は確認のモーダルを出し、Obsidian の「削除したファイル」の設定に従って消す
- 戻す前の snapshot と取り足しは、同期と重ねずに実行する（`exclusive`）

### UI
- 問題なし。新しいモーダルは `createEl` の `text` と `Setting` だけを使い、本文やパスを HTML 文字列として DOM に入れていない

### サプライチェーン
- 依存・lockfile の変更なし
