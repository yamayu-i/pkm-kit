# ADR（Architecture Decision Records）

自作プラグインとそのデータ配置について、決めたことと理由を残す。

- 1 決定 = 1 ファイル。`NNNN-短い名前.md`
- 状態: `提案`（未確定）→ `承認` → 必要なら `廃止` / `置換（ADR-NNNN）` / `一部置換（ADR-NNNN）`
- 承認済みの ADR は書き換えない。決定を変えるときは新しい ADR を作り、古い方の状態を `置換` にする
- 書式は [template.md](template.md)

## 一覧

| ADR | 状態 | 内容 |
|---|---|---|
| [0001](0001-task-plugin.md) | 承認 | タスク管理を自作プラグイン vault-task として作る |
| [0002](0002-frontmatter-as-source-of-truth.md) | 承認（一部置換: 0032） | issue の正本は md の frontmatter。派生値は保存しない |
| [0003](0003-issue-id.md) | 承認 | issue の ID は `i-N` の連番 |
| [0004](0004-worklog-storage.md) | 承認 | worklog は端末別・月別の jsonl |
| [0005](0005-effort-proration.md) | 承認 | 実績工数は重複を按分して都度計算する |
| [0006](0006-status-inbox-someday.md) | 承認（一部置換: 0032） | status の定義、Inbox と Someday |
| [0007](0007-labels-and-members.md) | 承認（一部置換: 0024, 0035） | label の定義ファイルと、委任先（member） |
| [0008](0008-ui-preact.md) | 承認 | UI は Preact。issue 画面は CodeMirror の widget |
| [0009](0009-views.md) | 承認（一部置換: 0018, 0021, 0024, 0030, 0032, 0033, 0034） | View の一覧と各 View の振る舞い |
| [0010](0010-routine.md) | 承認 | 繰り返しタスク（routine, `r-N`） |
| [0011](0011-quick-capture.md) | 承認 | ショートカットでの issue 一括登録 |
| [0012](0012-issue-screen.md) | 承認（一部置換: 0034） | issue 画面の構成と、親子関係の編集 |
| [0013](0013-design-system.md) | 一部置換（0016） | UI のデザインは Material 3 を参考にし、ルールを docs/design.md に残す |
| [0014](0014-daily-board.md) | 承認（一部置換: 0015, 0020, 0032, 0034） | DailyTaskView と task board の保存形式・細部 |
| [0015](0015-board-layout-simplified.md) | 承認 | task board のグループの並べ方を簡単にし、カードの ID を外す |
| [0016](0016-design-under-control.md) | 承認 | デザインを管理下に置く（トークンの一元化、Obsidian の外観の固定、検査） |
| [0017](0017-date-input.md) | 承認 | 日付の入力は自作のカレンダーと、短い書き方の入力欄にする |
| [0018](0018-list-edit-routine-screen.md) | 承認（一部置換: 0021, 0032） | リストからの issue 編集、routine 画面、Do Today / Do Tomorrow |
| [0019](0019-soften-theme.md) | 承認 | 目に優しくするため、ニュートラルな面と文字の色を抑える |
| [0020](0020-board-oplog.md) | 承認 | ボードの状態を端末別の操作ログに置く |
| [0021](0021-routine-effort-and-sidebar.md) | 承認（一部置換: 0024, 0033） | routine 画面の total / average と左サイドバーのナビゲーション View |
| [0022](0022-template-plugin.md) | 承認（一部補足: 0023） | テンプレートからのノート作成を自作プラグイン vault-template として作る |
| [0023](0023-template-id-and-daily.md) | 承認 | テンプレートの ID 採番（`{{id:…}}`）と、今日のデイリーノートを開くコマンド |
| [0024](0024-label-manager.md) | 承認 | label を編集する画面（Labels） |
| [0025](0025-mcp-and-task-coach.md) | 承認 | MCP サーバーによるタスク参照・編集とタスクコーチ |
| [0026](0026-note-views.md) | 承認（一部置換: 0027, 0033, 0035） | 主要なノートの一覧 View とノートの View（ヘッダー）を vault-template に足す |
| [0027](0027-hide-properties-english-labels.md) | 承認 | 専用ヘッダーのある type は Properties 欄を隠し、ラベルを英語にする |
| [0028](0028-auto-updated.md) | 承認（一部置換: ハーネスの 0009、0037） | コミット時に変更ノートの updated を自動付与する |
| [0029](0029-ribbon-plugin.md) | 承認 | デイリーノートと Daily のリボンを、軽量なプラグイン vault-ribbon にまとめる（コアプラグインのデイリーノートは無効にする） |
| [0030](0030-organize-schedule-calendar.md) | 承認 | Organize の予定入れを、複数日を選べるカレンダーにする |
| [0031](0031-status-quick-change.md) | 承認（一部置換: 0032） | ボードからの status の 1 クリック変更、status のアイコン、取り消しのトースト、status の記録（statuslog） |
| [0032](0032-action-names-soft-deadline-board-delegate.md) | 承認 | 日付のアクション名の整理（Add / Move Do Date、Change Deadline）、mid_due を soft_deadline に改名、ボードからの delegated |
| [0033](0033-list-pane.md) | 承認 | 一覧の View を左の固定ペインに、そこから開くノートを右のノートペインに出す |
| [0034](0034-duration-input-auto-board-sticky-groups.md) | 承認 | estimated の単位入力（m / h / d）と 1d = 24h、今日の予定の自動のボード入り、カードの置き場所の記憶 |
| [0035](0035-member-view-and-fields.md) | 承認 | member の項目（name / nickname / alias）と、member の専用 View |
| [0036](0036-member-labels-and-list-sort.md) | 承認 | member の label と、Members の一覧の絞り込み・並べ替え |
| [0037](0037-tmp-folder.md) | 承認 | git で管理しない一時ファイルの置き場 tmp/ を作り、temporary/ は使わない |
