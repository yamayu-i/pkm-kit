# 一日の終わりに締める

- 端末: PC / スマホ / AI 経由
- 望む成果: [1](../strategy.md#望む成果)

## ジョブ

一日を終えるとき、残ったものの行き先を決めて、今日の記録を残したい。明日の朝に昨日の後片付けから始めずに済むように。

## 今の流れ

1. [Today](../surfaces/task-today.md) の [task board](../surfaces/task-board.md) の末尾の「Close board」を押す。[Closing の画面](../surfaces/task-closing.md) に移り、右のペインにデイリーノートが開いて、本文の冒頭に振り返りの型が入る
2. Closing の画面で、closing の routine（振り返りなど）を片付け、その日のタスク（Closed / Not done / Waiting / Canceled）と、その日に作った・変えたノートを一覧で見ながら、デイリーノートに振り返りを書く。片付けたいタスクは、その場で status のボタンで閉じる。片付けなくてもよい（やらなかったものは Next に残る）
3. 「Finish closing」で記録を書く。未完了が残っていても押せる。デイリーノートの `## Task board` 節に、完了・持ち越し（片付けなかった未完了を含む）・worklog の要約がリンク付きで書かれる
4. 締めなくても困らない。締めなかったボードを催促しない。前の日の未完了は、Next（Pick）と Calendar の Missed から選べる
5. AI と振り返るときは、task-coach が持ち越しを片付けてボードを締め、振り返りをデイリーノートの末尾に追記する（[MCP と task-coach](../surfaces/task-mcp.md)）

## 関わる概念

[task board](../concepts/task-board.md)、[routine](../concepts/task-routine.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[Inbox](../concepts/task-inbox.md)、[デイリーノート](../concepts/note-daily.md)

## うまくいっている兆し

- 一日の終わりに Close board を押せば、振り返りに必要なもの（その日の作業の一覧とデイリーノート）が並ぶ
- routine の実行漏れが、翌日の Missed で見つかって片付く
- 持ち越した issue が、翌日の Pick で選ばれて片付く

## 知られている困りごと

まだない。

## 始める条件

今日のボードに作業と結果が記録されていること。

## 期待する結果と、つまずいたとき

daily に要約があること。未完了は持ち越しとして記録される。持ち越しの回数はボードの記録から自動で数えられる（[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)、[ADR-0206](../../../../src/docs/adr/0206-closing-view-and-routine-category.md)）。
