# ADR-0070: 一覧 View の前回からの変更を、新しいプラグイン pkm-updates の 1 ページで見る

- 状態: 提案
- 日付: 2026-11-08

## 背景

- 一覧 View は pkm-task（Issues、Inbox、Organize、Scheduled、Someday、Routines、Members など）と pkm-template（Daily notes、Notes、Sources。ADR-0026）に分かれている
- 前回見たときから何が変わったかを知るには、一覧を 1 つずつ開いて探すしかない。ほかの端末や AI（MCP、Claude Code）が変えたものに気づきにくい
- 全部の一覧の変更を 1 ページで見て、確認したら片付けたい（Issue #70）

## 決定

### 1. プラグイン

- 新しいプラグイン **pkm-updates** を作る。View「PKM Updates」（型 `pkm-updates-view`）、コマンド「PKM Updates を開く」、リボンのボタンを持つ
- 一覧ペインの接頭辞（`shared/src/list-pane.ts` の `LIST_VIEW_PREFIXES`）に `pkm-updates-` を足し、ほかの一覧と同じく一覧ペインに固定タブで開く（ADR-0033）。行を押したノートはノートペインに開く
- 一覧に載せる規則は、元の View と同じ関数を使う。pkm-task と pkm-template の `src/core/`（Obsidian に依存しない）を相対パスで読み、束ねる。規則を写さない（ADR-0009 の正本は 1 つ）
- 実行時には pkm-task と pkm-template に依存しない。一覧 View はコマンドを ID で呼んで開く（`pkm-task:open-issues` など。ADR-0029 と同じ）。コマンドがなければ Notice で伝える

### 2. 対象の一覧と、載せる規則

ノートの一覧だけを対象にする。Daily（ボード）、Board groups と Labels（JSON で `updated` がない）は対象にしない。

| セクション | 開く一覧 | 載せるノート |
|---|---|---|
| Issues | Issues | すべての issue（closed / canceled / someday も。閉じた変更も見えるように） |
| Inbox | Inbox | `isInbox` |
| Organize | Organize | `organizeQueue` |
| Scheduled | Scheduled | 今日以降に Do Date がある有効な issue |
| Someday | Someday | status が someday |
| Routines | Routines | すべての routine |
| Members | Members | すべての member |
| Daily notes | Daily notes | `type: daily` |
| Notes | Notes | `type: note` |
| Sources | Sources | `type: source` |

- そのうえで、frontmatter の `updated` が基準の日時より後のものだけを載せる。`updated` がない・読めないものは載せない
- 同じノートが複数の一覧に当たるときは、当たるすべてのセクションに出す（各セクションは、その一覧に起きた変更そのもの）
- セクションの中は `updated` の新しい順。行はタイトル（ADR-0026 の決め方）と `updated`。0 件のセクションは見出しごと出さない
- セクションの見出しは、その一覧 View へのリンク

### 3. 無限スクロール

- 全セクションを通した行を 50 行ずつ描く。最後の行が見えたら（`IntersectionObserver`）次の 50 行を足す
- 索引が変わったら（`metadataCache` の `changed` / `deleted`、`vault` の `rename`）作り直す。描いた行数は保つ

### 4. Viewed と基準の日時（Vault で共有）

- 画面の最下部に固定した **Viewed** ボタン。押すと今の日時を記録し、リストが空になる
- 記録は端末別の追記だけのログ `updates/<端末名>/YYYY-MM.jsonl` に 1 行 `{"viewed_at":"<秒までの ISO 8601、オフセット付き>"}` を足す（board、statuslog と同じ形。ADR-0020、ADR-0031）。同期で衝突しない
- 基準の日時は、全端末のログの `viewed_at` の最大。ログがなければ基準はなく、すべてを載せる
- 端末名は pkm-task の設定の端末名（なければ pkm-git の端末名）を読む。どちらもなければ Viewed を押せず、理由を出す
- Viewed は確認なしで記録する（取り消しはしない。押し間違えても、ノートは消えない）

### 5. リボンのボタンとバッジ

- リボンに「PKM Updates を開く」（アイコン `bell`）を足す
- バッジは、全セクションを通したノートの数（重複を数えない）。100 件以上は `99+`、0 件はバッジを出さない
- バッジは `addRibbonIcon` が返す要素の中に要素を足して出す。色と形はトークンに足す（ADR-0016）
- 件数は索引の変更と Viewed で数え直す（間引いて 1 秒に 1 回まで）

## 理由

- 一覧が 2 つのプラグインにまたがるので、どちらかに置くと、もう一方の規則を写すか依存することになる。独立したプラグインが両方の `core` を束ねれば、規則の正本は 1 つのまま、実行時の依存もない
- 載せる規則を元の View と同じ関数にすれば、セクションの中身と、その一覧を開いて見えるものが一致する
- 端末別の追記ログにすれば、PC で確認したらスマホでも消え、2 台で同時に押してもコンフリクトしない。1 つの JSON にすると、PKM Git は JSON の衝突でリモートを採り、別名のファイルを残す
- `updated` はコミット時に付く（ADR-0028）ので、ほかの端末や AI の変更も同じ基準で比べられる

## 却下した案

- **pkm-task に置き、ノートの一覧の規則を shared に移す**: pkm-task が無効の Vault で使えない。リボンのボタンが pkm-task の中に増える
- **基準の日時を端末ごと（`data.json`）に置く**: 端末ごとに確認し直す必要がある
- **1 つの JSON（`updates/viewed.json`）に書く**: 同期で衝突しやすい
- **重なるノートを 1 つのセクションだけに出す**: セクションと、開いた一覧の中身が一致しない
- **ファイルの更新時刻（mtime）で比べる**: 同期（pull）で受け取っただけでも新しくなる。端末ごとに違う

## 影響

- `.obsidian/plugins/pkm-updates/`（`main.js`、`manifest.json`、`styles.css`）が増える。security-scan とビルドの再現の確認の対象に加え、`.kit/owned-paths.json` に足す
- 子の Vault に `updates/` ができる（Viewed を押したとき）。ノート規約の配置の表（`.claude/docs/vault-conventions.md`）に足す。`.kit/obsidian-required.json` の `community-plugins.json` に `pkm-updates` を足すので、移行（Issue 番号 70）で有効にする
- `updated` はコミットで付くので、確認した後にコミットされた自分の変更（確認より前に書いたもの）も、次に載る。コミットされていない変更は、コミットされるまで載らない
- リボンの並びはプラグインの読み込み順で決まる。PKM Updates のボタンの位置は決めない
- `surfaces/` に PKM Updates の面を足し、リボンの面を直す
