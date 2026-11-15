# issue

## 目的

1 つのやることを、1 つのノートとして持つ。本文にメモや手順を書け、プラグインがなくても読める。

## 状態

`issue/i-N.md` の frontmatter が正本: `id`、`summary`、[status](task-status.md)、`priority`（high / mid / low / chore）、[label](task-label.md)、`related`、[estimated](task-estimate.md)、[Calendar](task-do-date.md)（`scheduled`）、[Tickler](task-tickler.md)（`tickler`）、[deadline と soft deadline](task-deadline.md)、`clarified`（整理済みか。[Inbox](task-inbox.md)）。子・実績は保存せず、索引で計算する。

## 操作

作る（Capture issues、Inbox の入力欄、テンプレート、MCP）、開いて編集する（issue 画面、一覧の行、ボードのカード）、[サブイシュー](task-sub-issue.md)を追加・並べ替える、閉じる・取り消す。

## 使い方の筋道

思いついたら作ると Inbox に入る。整理で Next にすると日付のない次の行動になり、Today の Pick で選んでボードに載せる。Calendar の日を入れると、その日のボードに自動で載る。終えて closed にすると、ボードの「完了」に移る。

## 根拠

[ADR-0002](../../../../src/docs/adr/0002-frontmatter-as-source-of-truth.md)、[ADR-0003](../../../../src/docs/adr/0003-issue-id.md)、[ADR-0012](../../../../src/docs/adr/0012-issue-screen.md)

## 入力の型と既定値

| キー | 型・既定値・制約 |
|---|---|
| id | i-N の ID。ないと索引に入らない |
| summary | 文字列 |
| status | open / in-progress / waiting / delegated / someday / closed / canceled。省略時 open |
| status-detail | 文字列、20 文字以内 |
| priority | high / mid / low / chore。未設定可 |
| label / related | 文字列の配列。related は ID、サブの合成キー、Vault 内のパス |
| estimated | 0 以上の数、分。未設定可 |
| scheduled / tickler / soft_deadline / deadline / revisit / reviewed | YYYY-MM-DD。未設定可 |
| clarified | 真偽値。省略時 false |
| delegated_to | member の ID。未設定可 |

不正なフィールドは lint の問題として報告し、読めない項目は未設定等として扱う。親子関係は parent のキーではなく、同じノートのサブで表す。
