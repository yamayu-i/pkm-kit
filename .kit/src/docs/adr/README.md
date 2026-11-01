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
| [0002](0002-frontmatter-as-source-of-truth.md) | 承認 | issue の正本は md の frontmatter。派生値は保存しない |
| [0003](0003-issue-id.md) | 承認 | issue の ID は `i-N` の連番 |
| [0004](0004-worklog-storage.md) | 承認 | worklog は端末別・月別の jsonl |
| [0005](0005-effort-proration.md) | 承認 | 実績工数は重複を按分して都度計算する |
| [0006](0006-status-inbox-someday.md) | 承認 | status の定義、Inbox と Someday |
| [0007](0007-labels-and-members.md) | 承認 | label の定義ファイルと、委任先（member） |
| [0008](0008-ui-preact.md) | 承認 | UI は Preact。issue 画面は CodeMirror の widget |
| [0009](0009-views.md) | 承認（一部置換: 0018） | View の一覧と各 View の振る舞い |
| [0010](0010-routine.md) | 承認 | 繰り返しタスク（routine, `r-N`） |
| [0011](0011-quick-capture.md) | 承認 | ショートカットでの issue 一括登録 |
| [0012](0012-issue-screen.md) | 承認 | issue 画面の構成と、親子関係の編集 |
| [0013](0013-design-system.md) | 一部置換（0016） | UI のデザインは Material 3 を参考にし、ルールを docs/design.md に残す |
| [0014](0014-daily-board.md) | 承認（一部置換: 0015） | DailyTaskView と task board の保存形式・細部 |
| [0015](0015-board-layout-simplified.md) | 承認 | task board のグループの並べ方を簡単にし、カードの ID を外す |
| [0016](0016-design-under-control.md) | 承認 | デザインを管理下に置く（トークンの一元化、Obsidian の外観の固定、検査） |
| [0017](0017-date-input.md) | 承認 | 日付の入力は自作のカレンダーと、短い書き方の入力欄にする |
| [0018](0018-list-edit-routine-screen.md) | 承認 | リストからの issue 編集、routine 画面、Do Today / Do Tomorrow |
| [0019](0019-soften-theme.md) | 承認 | 目に優しくするため、ニュートラルな面と文字の色を抑える |
| [0020](0020-template-plugin.md) | 承認 | テンプレートからのノート作成を自作プラグイン vault-template として作る |
