# セキュリティチェック 2026-11-08

- 対象 commit: cf1897f（Issue #89）
- 前回: 2026-11-08 be48d5c（pkm-git の fetch と転送量の計測）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed。初回は 2 件で失敗した。テストのダミーの URL（`security-scan: allow` を付けた）と、`console.error` の引数の中で `redactSecrets(..., [this.token()])` を呼んでいた 2 行（伏せた値を変数に入れてから出す、既存の形に直した）。どちらも実際にトークンを出す経路ではない
- `pnpm check`: 成功（pkm-git 138 テスト、pkm-ribbon 6 テスト、全パッケージ成功）

## 目視レビュー

対象: `src/git/engine.ts`（sync、取り込みの記録と復旧、ブランチの確認、通信の失敗の分類）、`src/git/sync-log.ts`（同期の記録）、`src/sync/controller.ts`（キュー）、`src/main.ts`・`src/obsidian/`（きっかけ、状態の表示、コマンド、モーダル、設定）、pkm-ribbon のボタンの表。

### 認証情報
- 問題なし。トークンは今までどおり `getAuth` でその都度取り出す。同期の記録（`.git/pkm-git/log.jsonl`）は、メッセージ・スタック・補足・パスを `redactSecrets`（URL の認証情報とトークンの値）に通してから書く。テストでトークンを含むエラーを書き、ファイルに残らないことを確かめた（`sync-log.test.ts`、`bundle.test.ts`）
- 記録は `.git` の中で、コミットにも同期にも入らない。記録のコピー（クリップボード）は利用者の操作だけで、モーダルにパスが入ることを添えている
- Notice とコンソールへの出力は、すべて `redactSecrets` を通している

### 通信
- 問題なし。通信は今までどおり `requestUrl` → `createHttpClient` の経路だけ。数える包み（`countingHttp`）は、送受信の失敗を `NetworkError` に包むだけで、`AuthTargetError`（送信直前の接続先の検査）はそのまま伝える。接続先・ヘッダー・本文は変えない
- 自動の同期は、設定の remote にだけつながる。間隔は前景のみ・既定 5 分で、失敗が続くと倍にする（上限 30 分）。接続先の検査に失敗したときは自動では繰り返し通知しない

### ファイル書き込み
- 問題なし。作業ツリーへの書き込みは `moveTo` と `recover` の `applyPaths` だけで、どちらも `assertSafeWorktreePath` を通ったパス（`recover` は記録の版の差分のパスを 1 つずつ検査する）
- 新しく書くのは `.git/pkm-git/apply.json` と `.git/pkm-git/log.jsonl`（`log.1.jsonl`）だけ。Vault の外に書く経路はない
- 取り込みの記録が知らない形なら、何も書かずに止まる（記録も消さない）。記録の版が読めないときは記録を消して、今の振る舞いに戻す

### データ消失
- 問題なし。snapshot の後の編集は、今までどおり `WorktreeChangedError` で上書きしない（自動の同期では共有待ちとして次に回す）
- ブランチを書き換える前に、同期の始めの値のままかを確かめ、外（Git の CLI）のコミットをブランチから外さない（`BranchMovedError`）
- 取り込みの途中で落ちたときは、作業ファイルが取り込む前か後の内容のときだけ揃える。それ以外の内容（落ちた後の編集）があれば、ブランチを進めずに snapshot とマージに任せる。テストで、両方の内容が残ることを確かめた
- push を force にする経路はない。拒否は 3 回で止める

### UI
- 問題なし。新しいモーダル（Keep this version、Sync log）は `createEl` の `text` と `Setting` だけを使い、HTML 文字列を DOM に入れていない

### サプライチェーン
- 依存・lockfile・`pnpm-workspace.yaml` の変更なし
- バンドル: pkm-git 693,394 → 723,769 バイト（同期のキュー、記録、モーダル）。pkm-ribbon 3,735 → 3,715 バイト

## 依存

変更なし。

## 対応したこと / 残課題

- スキャンの 2 件を直した（上）
- 残課題: 実機（PC・スマホ）での確認はマージ後（PR に挙げた）
