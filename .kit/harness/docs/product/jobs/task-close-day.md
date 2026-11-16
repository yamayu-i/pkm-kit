# 一日の終わりに締める

- 端末: PC / スマホ / AI 経由
- 望む成果: [1](../strategy.md#望む成果)

## ジョブ

一日を終えるとき、残ったものの行き先を決めて、今日の記録を残したい。明日の朝に昨日の後片付けから始めずに済むように。

## 今の流れ

1. 片付けたい人は、[Today](../surfaces/task-today.md) の [task board](../surfaces/task-board.md) で未完了のカードを片付ける: Back to Next、Tickler、Move date、Close、Cancel。片付けなくてもよい（やらなかったものは Next に残る）。routine はその日のうちに closed か canceled にする
2. 「Close board」で締める。未完了が残っていても押せる。デイリーノートの `## Task board` 節に、完了・持ち越し（片付けなかった未完了を含む）・worklog の要約がリンク付きで書かれる
3. 締めなくても困らない。締めなかったボードを催促しない。前の日の未完了は、Next（Pick）と Calendar の Missed から選べる
4. AI と振り返るときは、task-coach が持ち越しを片付けてボードを締め、振り返りをデイリーノートの末尾に追記する（[MCP と task-coach](../surfaces/task-mcp.md)）

## 関わる概念

[task board](../concepts/task-board.md)、[routine](../concepts/task-routine.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[Inbox](../concepts/task-inbox.md)、[デイリーノート](../concepts/note-daily.md)

## うまくいっている兆し

- 記録を残したい日に、Close board を 1 回押すだけで締まる
- 持ち越した issue が、翌日の Pick で選ばれて片付く

## 知られている困りごと

まだない。

## 始める条件

今日のボードに作業と結果が記録されていること。

## 期待する結果と、つまずいたとき

daily に要約があること。未完了は持ち越しとして記録される。持ち越しの回数はボードの記録から自動で数えられる（[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)）。
