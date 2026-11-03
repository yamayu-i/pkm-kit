# ADR-0029: デイリーノートと Daily のリボンを、軽量なプラグイン vault-ribbon にまとめる

- 状態: 承認
- 日付: 2026-11-03

## 背景

左のリボンに、次の 3 つが並んでいた。

- コアプラグイン「デイリーノート」の「今日のデイリーノートを開く」
- vault-template の「今日のデイリーノートを開く」（ADR-0023）
- vault-task の「Daily を開く」（DailyTaskView）

コアプラグインのデイリーノートは、もう使っていない。デイリーノートのパスと作成は、vault-template が `template/config.json` の設定で行っている（ADR-0023）。それなのにボタンが残り、同じ名前のボタンが 2 つ出ていた。vault-template と vault-task のボタンは、同じアイコン（`calendar-check`）を使っていて、見分けにくかった。

「今日のデイリーノート」と「Daily」は続けて使うので、隣り合わせに、デイリーノートを上にして並べたい。リボンの並びは、ボタンを登録した順で決まる。別々のプラグインのボタンを、決まった順で隣り合わせにすることはできない。

## 決定

- 新しいプラグイン **vault-ribbon** を作る。このプラグインは、リボンに次の 2 つのボタンをこの順で登録するだけにする
  1. 今日のデイリーノートを開く（アイコン `calendar`）: vault-template のコマンド `vault-template:open-todays-daily` を実行する
  2. Daily を開く（アイコン `calendar-check`）: vault-task のコマンド `vault-task:open-daily` を実行する
- vault-ribbon は、vault-template と vault-task のどちらにも依存しない（import しない）。実行時にコマンドを ID で呼ぶだけにする。コマンドがない（そのプラグインが無効）ときは、Notice でそう伝える
- vault-template と vault-task は、この 2 つのボタンを登録しない（コマンドは残す）。ほかのボタン（新規作成、issue の一括作成）はそのまま
- コアプラグイン「デイリーノート」を無効にする。上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）を、次のように変える
  - `core-plugins.json`: `daily-notes` を `false` にする
  - `daily-notes.json`: 求めない
  - `community-plugins.json`: `vault-ribbon` を足す
- 子の `.obsidian/` を変えるので、移行 `0002-ribbon-and-core-daily-notes` を付ける。この移行は次を行う
  - コアプラグインを無効にし、`vault-ribbon` を有効にする
  - 上流が求めていた既定の値のままの `daily-notes.json` を消す
  - 子が値を変えていた `daily-notes.json` は消さずに残す（使われないだけ）

## 理由

- 2 つのボタンを 1 つのプラグインが続けて登録すれば、並びが確実に決まる。プラグインの読み込み順に左右されない
- ボタンのためだけに vault-template と vault-task の一方がもう一方に依存すると、どちらかだけを使う Vault で困る。コマンドを ID で呼ぶ軽量なプラグインなら、どちらにも依存しない
- コアプラグインを無効にすれば、同じ名前のボタンが二重に出なくなる。使っていない設定ファイルも残らない

## 却下した案

- **vault-task が 2 つのボタンを登録し、vault-template のコマンドを呼ぶ**: vault-task が vault-template に依存する
- **登録の時期をずらして順番を合わせる（片方を `onLayoutReady` で登録する）**: プラグインの読み込み順と、Obsidian の起動の順に依存して壊れやすい
- **コアプラグインを有効のまま、ボタンだけ隠す**: 隠す設定は端末ごと（`workspace.json`）で、Vault の設定として配れない

## 影響

- `.obsidian/plugins/vault-ribbon/`（`main.js`、`manifest.json`）が増える。security-scan とビルドの再現の確認の対象に加える
- vault-template と vault-task の `main.js` から、ボタンの登録が 1 つずつ減る
- 子の Vault は、取り込みのときに移行 0002 を実行する（`vault-upgrade`）。モバイルでは、pull した後にリボンの並びを確かめる
- ノート規約（`.claude/docs/vault-conventions.md`）から、`daily-notes.json` の記述を外す
