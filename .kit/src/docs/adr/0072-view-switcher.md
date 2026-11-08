# ADR-0072: Cmd+K で一覧の View を探して開くダイアログを pkm-ribbon に置く

- 状態: 提案
- 日付: 2026-11-08

## 背景

一覧の View は 2 つのプラグインにある（Issue #72）。

- pkm-task: Daily, Issues, Inbox, Organize, Scheduled, Someday, Routines, Board groups, Members, Labels, Tasks サイドバー
- pkm-template: Daily notes, Notes, Sources

それぞれに「〜を開く」のコマンドはあるが、コマンドパレットではほかのコマンドに混ざる。View が増えるほど探しにくい。すべての一覧の View を 1 つのダイアログから探して開き、Cmd+K（Mod+K）で呼べるようにしたい。

Obsidian の既定では、Mod+K は「Markdown リンクを挿入」（`editor:insert-link`）に割り当てられている。

## 決定

### 置き場所

- ダイアログは **pkm-ribbon** に置く。pkm-ribbon の役割を「pkm-task と pkm-template をまたぐ入口（リボンのボタンと View の切り替え）」に広げる
- pkm-ribbon は、ADR-0029 と同じく pkm-task と pkm-template を import しない。実行時に Obsidian のコマンドの登録から候補を集め、選んだらコマンドを ID で実行する

### 候補の集め方

- 候補は、`pkm-task:` と `pkm-template:` のコマンドのうち、ID が `open-<名前>` で、`<プラグイン>-<名前>` が登録済みの View の種類であるもの（例: `pkm-task:open-issues` → `pkm-task-issues`）。Tasks サイドバー（`open-sidebar` → `pkm-task-sidebar`）も含む
- ダイアログを開くたびに集め直す。View を足したプラグインは、これまでどおり `open-<名前>` のコマンドを登録するだけで候補に載る。片方のプラグインが無効なら、その候補は出ない
- pkm-task と pkm-template の View を開くコマンドに `icon`（View のアイコン）を付け、ダイアログでも同じアイコンを出す
- 名前は、コマンド名から末尾の「を開く」を除いたもの。プラグイン名を小さく添える。開いている View には印を付ける
- あいまい検索（Obsidian の `FuzzySuggestModal`）で絞り込み、Enter で開く。開き方は各コマンドのまま（一覧ペイン。ADR-0033）

### ホットキー

- コマンド「View を探して開く」（`pkm-ribbon:open-view-switcher`）の既定のホットキーを Mod+K にする
- 「Markdown リンクを挿入」を Mod+Shift+K に移す。上流が子に求める設定（`.kit/obsidian-required.json`）に `hotkeys.json` の `editor:insert-link` を足す。キーを指定すると Obsidian の既定の Mod+K が外れる
- 子の `.obsidian/hotkeys.json` を変えるので、移行 `0072-view-switcher-hotkey` を付ける。`editor:insert-link` がないときだけ足す。子がすでに自分で割り当てていたら変えない（検査で知らせ、AI がユーザーに確かめる）
- モバイルにはホットキーがないので、コマンドパレットから同じコマンドを呼ぶ

## 理由

- 2 つのプラグインの View を 1 つのダイアログに出すには、両方にまたがる場所が要る。pkm-ribbon はすでに「どちらにも依存せず、コマンドを ID で呼ぶ」プラグインで、同じ作りで足せる
- 候補を実行時のコマンドから集めれば、View を足すたびに一覧を 2 か所で直さなくてよい
- 既定のホットキーだけでは、Obsidian の既定の Mod+K と衝突し、どちらが動くかが決まらない。リンクの挿入を別のキーに移せば確実に開く

## 却下した案

- **新しいプラグイン（pkm-launcher など）を作る**: 成果物・有効化の移行・security-scan の対象が増える。役割は pkm-ribbon と同じ「入口」
- **pkm-task に置き、pkm-template の View も扱う**: pkm-task が pkm-template を知ることになる（ADR-0029 で避けた依存）
- **両方のプラグインがそれぞれダイアログを持つ**: Mod+K は 1 つのコマンドにしか割り当てられない。片方の View しか出ない
- **候補を pkm-ribbon に固定の一覧で持つ**: View を足すたびに pkm-ribbon も直す必要がある
- **ホットキーを付けず、各端末で割り当てる**: 端末ごとの手間。Cmd+K で開くという目的を満たさない
- **リンクの挿入の Mod+K を外すだけ（割り当てなし）**: リンクの挿入をキーで使えなくなる

## 影響

- pkm-ribbon の `main.js` が増える（Modal 1 つ）。pkm-task と pkm-template はコマンドに `icon` を足すだけ
- `.kit/obsidian-required.json` に `hotkeys.json` が加わる。`editor:insert-link` を Mod+Shift+K 以外にすると、検査（`check-obsidian-config.mjs`）が知らせる
- 子は取り込みのときに移行 0072 を実行する。リンクの挿入は Mod+Shift+K になることを `.kit/changes/` に書く
- ADR-0029 の「pkm-ribbon はリボンのボタンを登録するだけ」を一部置き換える
