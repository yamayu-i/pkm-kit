# ADR-0072: Cmd+K で一覧の View を探して開くダイアログを、新しいプラグイン pkm-view-selector にする

- 状態: 承認
- 日付: 2026-11-08

## 背景

一覧の View は 3 つのプラグインにある（Issue #72）。

- pkm-task: Daily, Issues, Inbox, Organize, Scheduled, Someday, Routines, Board groups, Members, Labels, Tasks サイドバー
- pkm-template: Daily notes, Notes, Sources
- pkm-updates: PKM Updates（ADR-0070）

それぞれに「〜を開く」のコマンドはあるが、コマンドパレットではほかのコマンドに混ざる。View が増えるほど探しにくい。すべての一覧の View を 1 つのダイアログから探して開き、Cmd+K（Mod+K）で呼べるようにしたい。

Obsidian の既定では、Mod+K は「Markdown リンクを挿入」（`editor:insert-link`）に割り当てられている。

## 決定

### 置き場所

- 新しいプラグイン **pkm-view-selector** を作る。役割は「pkm の一覧の View を探して開くダイアログ」だけにする
- pkm-view-selector は pkm-task・pkm-template・pkm-updates を import しない（ADR-0029 の pkm-ribbon と同じ作り）。実行時に Obsidian のコマンドの登録から候補を集め、選んだらコマンドを ID で実行する

### 候補の集め方

- 候補は、`pkm-task:`・`pkm-template:`・`pkm-updates:` のコマンドのうち、ID が `open-<名前>` で、`<プラグイン>-<名前>` が登録済みの View の種類であるもの（例: `pkm-task:open-issues` → `pkm-task-issues`）。Tasks サイドバー（`open-sidebar` → `pkm-task-sidebar`）と PKM Updates（`open-view` → `pkm-updates-view`）も含む。View を開かないコマンド（`open-todays-daily` など）は出ない
- ダイアログを開くたびに集め直す。View を足したプラグインは、これまでどおり `open-<名前>` のコマンドを登録するだけで候補に載る。どれかのプラグインが無効なら、その候補は出ない
- pkm-task・pkm-template・pkm-updates の View を開くコマンドに `icon`（View のアイコン）を付け、ダイアログでも同じアイコンを出す
- 名前は、コマンド名から末尾の「を開く」を除いたもの（英語の View 名。Issues, Inbox など）。プラグイン名を小さく添える。開いている View には印を付ける
- あいまい検索で絞り込み、Enter で開く。大文字と小文字を区別しない（`issues` で Issues が出る）。開き方は各コマンドのまま（一覧ペイン。ADR-0033）

### ホットキー

- コマンド「View を探して開く」（`pkm-view-selector:open`）の既定のホットキーを Mod+K にする
- 「Markdown リンクを挿入」のホットキーは消す（割り当てなし）。上流が子に求める設定（`.kit/obsidian-required.json`）に `hotkeys.json` の `"editor:insert-link": []` を足す。空の配列を書くと Obsidian の既定の Mod+K が外れる。リンクの挿入は、コマンドパレットからは引き続き使える
- モバイルにはホットキーがないので、コマンドパレットから同じコマンドを呼ぶ

### 子の Vault への移行

`.obsidian/` を変えるので、移行 `0072-pkm-view-selector` を付ける。

- `community-plugins.json` に `pkm-view-selector` を足す（`.kit/obsidian-required.json` にも足す）
- `hotkeys.json` の `editor:insert-link` を `[]` で上書きする。子が自分で割り当てていても上書きする（Mod+K 以外のキーでも、上流の設定に揃える）。ほかのキーは残す

## 理由

- 複数のプラグインの View を 1 つのダイアログに出すには、それらにまたがる場所が要る。役割の違う pkm-ribbon（リボンのボタン）に混ぜず、1 つの役割の小さなプラグインにすれば、無効にするのも直すのも独立してできる
- 候補を実行時のコマンドから集めれば、View を足すたびに一覧を 2 か所で直さなくてよい
- 既定のホットキーだけでは、Obsidian の既定の Mod+K と衝突し、どちらが動くかが決まらない。リンクの挿入のキーを消せば確実に開く
- リンクは Markdown リンクで書く規約で、`[` からの補完や貼り付けで足りる。別のキーに移すほどは使わない

## 却下した案

- **pkm-ribbon に置く**: 成果物と移行は少なく済むが、pkm-ribbon の役割（リボンのボタンを並べる）が広がり、名前と中身が合わなくなる
- **pkm-task に置き、pkm-template の View も扱う**: pkm-task が pkm-template を知ることになる（ADR-0029 で避けた依存）
- **両方のプラグインがそれぞれダイアログを持つ**: Mod+K は 1 つのコマンドにしか割り当てられない。片方の View しか出ない
- **候補を固定の一覧で持つ**: View を足すたびに pkm-view-selector も直す必要がある
- **ホットキーを付けず、各端末で割り当てる**: 端末ごとの手間。Cmd+K で開くという目的を満たさない
- **リンクの挿入を Mod+Shift+K に移す**: 使わないキーを 1 つ上流で固定することになる
- **子が割り当て済みなら変えない**: 子ごとに Mod+K が衝突したまま残りうる。上流が求める設定として揃える

## 影響

- `.obsidian/plugins/pkm-view-selector/`（`main.js`、`manifest.json`）が増える。`.kit/owned-paths.json`、`.gitignore`（`data.json`）、security-scan とビルドの再現の確認の対象に加える
- pkm-task・pkm-template・pkm-updates は、View を開くコマンドに `icon` を足すだけ
- `.kit/obsidian-required.json` に `pkm-view-selector` と `hotkeys.json` が加わる。`editor:insert-link` にキーを割り当てると、検査（`check-obsidian-config.mjs`）が知らせる
- 子は取り込みのときに移行 0072 を実行する。リンクの挿入のホットキーがなくなることを `.kit/changes/` に書く
