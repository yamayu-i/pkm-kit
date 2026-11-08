# issue

## 目的

1 つのやることを、1 つのノートとして持つ。本文にメモや手順を書け、プラグインがなくても読める。

## 状態

`issue/i-N.md` の frontmatter が正本: `id`、`summary`、[status](task-status.md)、`priority`（high / mid / low / chore）、[label](task-label.md)、`parent`、`related`、[estimated](task-estimate.md)、[Do Date](task-do-date.md)（`scheduled`）、[deadline と soft deadline](task-deadline.md)。子・実績・Inbox かどうかは保存せず、索引で計算する。

## 操作

作る（Capture issues、Inbox の入力欄、テンプレート、MCP）、開いて編集する（issue 画面、一覧の行、ボードのカード）、親子をつなぐ、閉じる・取り消す。

## 使い方の筋道

思いついたら作ると Inbox に入る。整理で Do Date を入れると、その日のボードに載る。終えて closed にすると、ボードの「完了」に移る。

## 根拠

[ADR-0002](../../../../src/docs/adr/0002-frontmatter-as-source-of-truth.md)、[ADR-0003](../../../../src/docs/adr/0003-issue-id.md)、[ADR-0012](../../../../src/docs/adr/0012-issue-screen.md)
