# 概念（concepts）

使う人が頭に置いておくもの。1 概念 = 1 ファイル（[育て方の規則](../README.md#育て方の規則)）。Norman の概念モデルと Jackson の概念設計にならい、概念ごとに目的・状態・操作・使い方の筋道を書く。画面やデータが概念とずれていたら、それは機会として起票する（[product-review](../../../skills/product-review/SKILL.md)）。

## 書式

```markdown
# <概念の名前>

## 目的

この概念があると、使う人は何ができるか。1〜2 文。

## 状態

何を覚えているか（データのキー）。

## 操作

使う人ができること。

## 使い方の筋道

「〜すると、〜になる」の形で、典型的な使われ方を書く。

## 根拠

ADR へのリンク。
```

## 一覧

### タスク

| 概念 | 目的（短く） |
|---|---|
| [issue](task-issue.md) | 1 つのやること |
| [routine](task-routine.md) | くり返すやること |
| [委任先（member）](task-member.md) | 任せた相手を覚える |
| [status](task-status.md) | やることが今どの状態か |
| [Inbox](task-inbox.md) | まだ決めていないやることの置き場 |
| [Someday](task-someday.md) | 今は考えたくないやることの置き場 |
| [Do Date](task-do-date.md) | その日にやると決めた日 |
| [deadline と soft deadline](task-deadline.md) | 間に合わせる日 |
| [estimated と実績](task-estimate.md) | どれくらいかかるか、かかったか |
| [worklog とタイマー](task-worklog.md) | いつ何をしたか |
| [task board](task-board.md) | その日にやることの盤面 |
| [ボードのグループ](task-board-group.md) | 盤面の区切り（時間帯など） |
| [label](task-label.md) | やることの分類 |

### ノートと知識

| 概念 | 目的（短く） |
|---|---|
| [ノートの type](note-type.md) | ノートの役割 |
| [テンプレート](note-template.md) | ノートの初めの形 |
| [デイリーノート](note-daily.md) | その日のノート |
| [wiki](wiki-page.md) | AI がまとめる知識 |

### 端末

| 概念 | 目的（短く） |
|---|---|
| [同期と snapshot](sync-snapshot.md) | 端末をまたいで同じ Vault を使う |

## 用語の対応表

画面の表記・データのキー・文書の用語の対応。今の実際を書く（理想ではない）。同じ概念に複数の表記があるものは、機会として扱う。

| 概念 | 画面の表記 | データのキー・置き場所 | 文書の用語 |
|---|---|---|---|
| issue | Issues、issue | `issue/i-N.md`（`type: issue`） | issue |
| routine | Routines、routine | `routine/r-N.md`（`type: routine`） | routine、くり返しのタスク |
| 委任先 | delegated、委任先 | `member/m-N.md`、issue の `delegated_to` | member、委任先 |
| status | open / in-progress / waiting / delegated / someday / closed / canceled | `status`、補足は `status-detail` | status |
| status の取り消し | 「N件のステータスが変更されました。 元に戻す ›」 | `statuslog/` の `via: undo` | 取り消し |
| Inbox | Inbox、Inbox に戻す | 保存しない（open で日付がないもの） | Inbox |
| Someday | Someday、Someday へ | `status: someday`、`revisit`、`reviewed` | Someday |
| Do Date | Add Do Date、Move Do Date、Do Today、Do Tomorrow。Organize でも Do Date。一覧の View は Scheduled | `scheduled`（日付のリスト） | 実行日、予定、scheduled |
| deadline | deadline、Change Deadline | `deadline` | deadline、固い締切 |
| soft deadline | soft_deadline、Change Soft Deadline | `soft_deadline` | 緩い締切 |
| estimated | estimated（`2h`、`1d` = 24h） | `estimated`（分） | 見積もり |
| 実績 | issue 画面の実績、routine 画面の total / average | 保存しない（worklog から按分） | 実績工数 |
| worklog | worklog、再生 / 停止 | `worklog/<端末名>/YYYY-MM.jsonl` | worklog、作業の記録 |
| task board | Daily の段階「ボード」、ボードを締める、完了、未完了、未分類 | `board/<端末名>/YYYY-MM.jsonl`、デイリーノートの `## Task board` 節 | task board、ボード |
| Daily | Daily（View の名前）、段階「期限切れ」「前回のボード」「期限が近い」「ボード」 | — | DailyTaskView、Daily |
| ボードのグループ | Board groups | `issue/board-groups.json`、routine の `group` | グループ、サブグループ |
| label | Labels、label | `issue/labels.json`、`label` | label |
| デイリーノート | Daily notes、今日のデイリーノートを開く | `daily/YYYY/MM/YYYY-MM-DD.md`（`type: daily`） | デイリーノート、DailyNote |
| テンプレート | テンプレートから新規ファイルを作成 | `.kit/templates/`、`template/` | テンプレート |
| 同期 | Git: pull、Git: push | `vault: snapshot (<端末名>)` のコミット | 同期、snapshot |
