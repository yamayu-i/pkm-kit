# vault-git 高速化の引き継ぎ

このブランチは実装途中の保存用です。依存取得が実行環境のネットワーク制限でできず、型チェック・ビルド・テストは未実行です。配布用 `.obsidian/plugins/vault-git/main.js` も未更新なので、そのままでは利用中のプラグインに変更は反映されません。

## 実装済み

- `snapshot` / `fetch` / `merge-base`（pull）/ `moveTo` / `push` の経過時間を `onTiming` に通知し、Obsidian のコンソールに表示。
- 計測コールバックが例外を投げても同期結果を変えない。
- マージ後の `moveTo` に取得済み local ツリーを渡し、同じツリーの再展開を省略。取り込み前の作業ファイルのハッシュ検査は引き続き実行。

## 続きの実装

1. `refreshStatus`、ツリー展開、マージ、ツリー生成も計測対象にする。
2. コンフリクト検索を初回全件＋作成・変更・削除・リネームイベントによる差分更新へ。検索中の編集やフォルダのリネーム、エラー時の再検索も検証する。
3. `statusMatrix` と `racyChanges` の stat 重複を削減。同秒・同サイズの編集検出を維持し、取り込み前の確認には最新の情報を使う。
4. commit/tree OID 単位の再利用を拡張。index・refs・作業ファイルの長期キャッシュは避け、キャッシュ容量を制限する。
5. 独立した読み取りのみ同時実行数 4 程度で比較。index・refs 更新と親フォルダ操作の順序を維持する。

## 回収後の検証

リポジトリ指定の Node / pnpm（mise.toml）を使用する。

```sh
cd .plugin-src
pnpm install --frozen-lockfile
pnpm check
pnpm security:scan
git diff -- ../.obsidian/plugins/vault-git
```

生成された main.js をコミットする。現状のソースだけでは CI のビルド成果物一致チェックを通らない見込み。

追加したい回帰テスト: マージ時の local ツリー再読み込み削減、snapshot 後の編集検出、計測コールバック例外時の同期結果保持。変更なし・1件変更・大量取り込みについて実機のデスクトップとモバイルで計測する。速度改善率は未測定。
