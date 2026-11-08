# pkm-git の計測とツリー再利用

PR #20 の実装・正式検証・配布成果物更新は完了。同期の各工程を観測でき、マージ後の取り込みで local ツリーの再展開を省く。

## 実装済み

- `snapshot` / `fetch` / `merge-base`（pull・push）/ `moveTo` / `push` の経過時間を通知。
- 分岐した履歴のマージでは `read-trees` / `merge` / `write-tree` も通知。
- Obsidian の未解決コンフリクト検索と状態表示を `refreshStatus` として計測。
- コンソールへの出力は固定の工程名とミリ秒のみ。パス・ノート本文・認証情報は含めない。
- 計測コールバックやログ出力の例外が、同期結果や元のエラーを変えない。
- マージ後の `moveTo` は取得済み local ツリーを再利用。作業ファイルのハッシュ確認、index 更新、最後のブランチ更新の順序を維持。

## 検証

- Node 26.13.0 / pnpm 12.16.1、固定 lockfile で依存を準備。
- 最新 main を取り込んで `node .claude/scripts/verify.mjs --plugin` が成功。
- プラグイン全体 299 テスト成功（pkm-git 64、pkm-task 176、design 59）。
- `pnpm security:scan` 8/8 成功。audit とビルド再現性を含む。`pnpm outdated` の更新候補なし。
- ローカル Git smart HTTP サーバーで、通知される工程・例外の隔離・同期結果・途中編集の保護を確認。
- 回帰テストで snapshot 後のツリー展開が base / local / remote / merged の4回で、local を再読しないことを確認。
- 配布用 `.obsidian/plugins/pkm-git/main.js` を再生成。Obsidian API モック上のバンドルテストも成功。

## fetch の転送量（Issue #87）

- 不具合: isomorphic-git 1.44.8 の `fetch` は `singleBranch: true` のとき、`ref` が指すコミット 1 つだけを have として伝える。`ref` にローカルのブランチを渡していたので、未 push の snapshot・マージがあると、サーバーは共通の履歴がないとみなし全履歴の pack を返していた。
- 修正: `ref` に追跡ブランチ（`refs/remotes/<remote>/<branch>`）、`remoteRef` に取得するブランチを渡す。追跡ブランチがなければローカルのブランチ。依存は変えていない。
- 計測: `onTransfer` で、通信した工程（`clone` / `fetch` / `push`）のリクエスト数と送受信の body のバイト数を通知する。HTTP ヘッダー・TLS は含まない。
- テスト（`test/fetch-transfer.test.ts`。git http-backend、64 KiB の圧縮の効かないアセットを 16 版持つ履歴）での upload-pack の応答の大きさ:

| 場面 | 修正前 | 修正後 |
| --- | ---: | ---: |
| 未 push のコミットあり、リモート不変（pull） | 1,059,671 B | 209 B |
| 同上（push の前の fetch） | 1,059,866 B | 209 B |
| 双方に変更あり（pull でマージ） | 1,060,314 B | 767 B |
| pull → push を 3 回繰り返す（1 回あたり） | 約 2.1 MB | 975〜1,216 B |

- 限界: push の応答を失い追跡ブランチが古いままだと、次の fetch で自分が送った分を 1 回取り直す（その push の分だけ）。初回の clone は全履歴を取得する。GitHub・実機での計測は未実施。

## 今後の高速化候補

以下は本 PR に含めない。今回の計測値を実機で集め、費用対効果と必要な設計・テストを検討する。

1. コンフリクト検索を初回全件＋作成・変更・削除・リネームイベントによる差分更新へ。検索中の編集やフォルダのリネーム、エラー時の再検索も検証する。
2. `statusMatrix` と `racyChanges` の stat 重複を削減。同秒・同サイズの編集検出を維持し、取り込み前の確認には最新の情報を使う。
3. commit/tree OID 単位の再利用を拡張。index・refs・作業ファイルの長期キャッシュは避け、キャッシュ容量を制限する。
4. 独立した読み取りのみ同時実行数4程度で比較。index・refs 更新と親フォルダ操作の順序を維持する。

実機デスクトップ・モバイルでの変更なし・1件変更・大量取り込みの時間と速度改善率は未測定。工程別の時間を比較して次の対象を選ぶ。
