# ADR-0070: 一覧 View の前回からの変更を新しいプラグイン pkm-updates の 1 ページで見て、リボンのボタンを pkm-ribbon にまとめる

- 状態: 承認
- 日付: 2026-11-08

## 背景

- 一覧 View は pkm-task（Issues、Inbox、Organize、Scheduled、Someday、Routines、Members など）と pkm-template（Daily notes、Notes、Sources。ADR-0026）に分かれている
- 前回見たときから何が変わったかを知るには、一覧を 1 つずつ開いて探すしかない。ほかの端末や AI（MCP、Claude Code）が変えたものに気づきにくい
- 全部の一覧の変更を 1 ページで見て、確認したら片付けたい（Issue #70）
- そのページを開くボタンをリボンに置き、件数のバッジを付けたい。リボンの並びはボタンを登録した順で決まり、別々のプラグインのボタンの順は決められない。ADR-0029 は、デイリーノートと Daily の 2 つだけを pkm-ribbon がまとめて登録することで解いた。ほかのボタン（テンプレートから作成、issue をまとめて作成、Git: pull / push）は、今も各プラグインが登録していて、並びは読み込み順に任されている

## 決定

### 1. プラグイン

- 新しいプラグイン **pkm-updates** を作る。View「PKM Updates」（型 `pkm-updates-view`）とコマンド「PKM Updates を開く」（`pkm-updates:open-view`）を持つ。リボンのボタンは pkm-ribbon が出す（5）
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

### 5. リボンのボタンは pkm-ribbon だけが登録する（ADR-0029 を広げる）

- 自作プラグインのリボンのボタンは、**pkm-ribbon だけが**登録する。ほかのプラグインはコマンドだけを持ち、`addRibbonIcon` を使わない（検査で止める）
- pkm-ribbon に、並びの表を 1 つ置く。並びはこの表の順で決まり、読み込み順に左右されない

| 順 | ボタン | アイコン | 呼ぶコマンド |
|---|---|---|---|
| 1 | 今日のデイリーノートを開く | `calendar` | `pkm-template:open-todays-daily` |
| 2 | Daily を開く | `calendar-check` | `pkm-task:open-daily` |
| 3 | PKM Updates を開く | `bell` | `pkm-updates:open-view` |
| 4 | issue をまとめて作成 | `list-plus` | `pkm-task:capture-issues` |
| 5 | Git: pull | `arrow-down-to-line` | `pkm-git:pull` |
| 6 | Git: push | `arrow-up-from-line` | `pkm-git:push` |

- 「テンプレートから新規ファイルを作成」のボタンはなくす（コマンドは残す）
- 押したら、コマンドを ID で呼ぶ。コマンドがない（そのプラグインが無効）ときは Notice で伝える（ADR-0029 と同じ）。pkm-ribbon はどのプラグインも import しない

### 6. バッジの取り決め

- ボタンに数を出したいプラグインは、プラグインのインスタンスにメソッド `getRibbonBadge(commandId: string): number | null` を持つ。`null` は「数がない」
- 数が変わったら、そのプラグインが `app.workspace.trigger("pkm-ribbon:badge-changed", commandId)` を出す
- pkm-ribbon は、起動の後（`onLayoutReady`）と、そのイベントを受けたときに、コマンドの ID の接頭辞のプラグイン（`app.plugins.getPlugin`）に尋ねて描き直す。プラグインがない・メソッドがない・例外のときはバッジを出さない
- 表示の規則は pkm-ribbon の 1 か所だけ: 1〜99 はその数、100 以上は `99+`、0 と `null` は出さない
- バッジは `addRibbonIcon` が返す要素の中に要素を足して出す。色と形はトークンから取る（ADR-0016）
- pkm-updates は、全セクションを通したノートの数（重複を数えない）を返す。索引の変更と Viewed で数え直し、イベントは間引いて 1 秒に 1 回まで

## 理由

- 一覧が 2 つのプラグインにまたがるので、どちらかに置くと、もう一方の規則を写すか依存することになる。独立したプラグインが両方の `core` を束ねれば、規則の正本は 1 つのまま、実行時の依存もない
- 載せる規則を元の View と同じ関数にすれば、セクションの中身と、その一覧を開いて見えるものが一致する
- リボンのボタンを 1 か所で登録すれば、ボタンが増えても並びが確実に決まる。ADR-0029 の解き方を、2 つの決め打ちから表に広げただけで、各プラグインはコマンドを持つだけでよい
- バッジを「尋ねる」と「変わったら知らせる」の組にすれば、読み込みの順にかかわらず、正しい数が出る。import がないので、どちらかが無効でも壊れない
- 端末別の追記ログにすれば、PC で確認したらスマホでも消え、2 台で同時に押してもコンフリクトしない。1 つの JSON にすると、PKM Git は JSON の衝突でリモートを採り、別名のファイルを残す
- `updated` はコミット時に付く（ADR-0028）ので、ほかの端末や AI の変更も同じ基準で比べられる

## 却下した案

- **pkm-task に置き、ノートの一覧の規則を shared に移す**: pkm-task が無効の Vault で使えない。リボンのボタンが pkm-task の中に増える
- **基準の日時を端末ごと（`data.json`）に置く**: 端末ごとに確認し直す必要がある
- **1 つの JSON（`updates/viewed.json`）に書く**: 同期で衝突しやすい
- **重なるノートを 1 つのセクションだけに出す**: セクションと、開いた一覧の中身が一致しない
- **pkm-updates が自分でリボンのボタンを登録する**: 並びが読み込み順に任される（ADR-0029 と同じ問題）
- **バッジの数を pkm-ribbon が自分で数える**: pkm-ribbon が一覧の規則を持つことになり、どのプラグインにも依存しないという決まりが崩れる
- **ファイルの更新時刻（mtime）で比べる**: 同期（pull）で受け取っただけでも新しくなる。端末ごとに違う

## 影響

- `.obsidian/plugins/pkm-updates/`（`main.js`、`manifest.json`、`styles.css`）が増える。security-scan とビルドの再現の確認の対象に加え、`.kit/owned-paths.json` に足す
- 子の Vault に `updates/` ができる（Viewed を押したとき）。ノート規約の配置の表（`.claude/docs/vault-conventions.md`）に足す。`.kit/obsidian-required.json` の `community-plugins.json` に `pkm-updates` を足すので、移行（Issue 番号 70）で有効にする
- `updated` はコミットで付くので、確認した後にコミットされた自分の変更（確認より前に書いたもの）も、次に載る。コミットされていない変更は、コミットされるまで載らない
- pkm-template・pkm-task・pkm-git の `main.js` から、リボンの登録がなくなる。「テンプレートから新規ファイルを作成」はリボンから消え、コマンドパレットから使う
- 自作プラグインの `src/` で `addRibbonIcon` を使ってよいのは pkm-ribbon だけ、という検査を足す
- pkm-ribbon が呼ぶコマンドの ID を変えるときは、表も変える（ADR-0029 と同じ）。`test/bundle.test.ts` で、表の順とコマンドの呼び出し、バッジの規則を確かめる
- `surfaces/` に PKM Updates の面を足し、リボンの面を直す
