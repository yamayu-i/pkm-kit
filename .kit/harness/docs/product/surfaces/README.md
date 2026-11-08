# 今の体験の正本（surfaces）

使う人が触れる面ごとの、**今の**振る舞い。1 面 = 1 ファイル（[育て方の規則](../README.md#育て方の規則)）。面は、View・画面・コマンド・リボン・MCP・手順（AI のスキル）など、使う人が操作する単位で分ける。

ADR は決めた理由の履歴で、書き換えない。ここは振る舞いが変わるたびに、その PR で書き換える。ADR と食い違ったら、コードを確かめてここを直す。細かい値やデータの形は ADR に任せ、ここには使う人から見える振る舞いを書く。

## 書式

```markdown
# <面の名前>

- 種類: View / 画面 / コマンド / リボン / MCP / 手順
- 開き方: どこから開くか
- 場面: この面を通る場面（jobs/ へのリンク）

## 今の振る舞い

## 使う概念

## 根拠

ADR へのリンク。
```

## 一覧

### タスク（pkm-task）

| 面 | 種類 |
|---|---|
| [Daily](task-daily.md) | View |
| [task board](task-board.md) | View（Daily の段階） |
| [issue 画面](task-issue-screen.md) | 画面 |
| [routine 画面](task-routine-screen.md) | 画面 |
| [Issues](task-issues.md) | View |
| [Inbox](task-inbox.md) | View |
| [Someday](task-someday.md) | View |
| [Organize](task-organize.md) | View |
| [Scheduled](task-scheduled.md) | View |
| [Routines](task-routines.md) | View |
| [Board groups](task-board-groups.md) | View |
| [Labels](task-labels.md) | View |
| [issue をまとめて作成](task-capture.md) | コマンド |
| [Tasks サイドバー](task-sidebar.md) | View（左サイドバー） |
| [MCP と task-coach](task-mcp.md) | MCP・手順 |

### ノート（pkm-template）

| 面 | 種類 |
|---|---|
| [テンプレートから作成](template-create.md) | コマンド |
| [ノートの一覧](template-lists.md) | View |
| [ノートのヘッダー](template-header.md) | 画面 |

### 変更の確認（pkm-updates）

| 面 | 種類 |
|---|---|
| [PKM Updates](updates.md) | View |

### HTML（pkm-html）

| 面 | 種類 |
|---|---|
| [HTML の表示](html-view.md) | View |

### 全体

| 面 | 種類 |
|---|---|
| [リボン](ribbon.md) | リボン |
| [一覧ペインとノートペイン](layout-panes.md) | 画面の配置 |
| [PKM Git](git-sync.md) | コマンド・リボン |
| [上流の更新の取り込み](kit-upgrade.md) | 手順 |
