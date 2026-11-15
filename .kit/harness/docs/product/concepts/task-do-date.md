# Calendar（Do Date）

## 目的

その日にやらなければならない行動の日を持ち、その日のボードに出す（GTD の Calendar。ハードランドスケープ）。「やりたい日」や目安の日には使わない。今日やるものは [Today](../surfaces/task-today.md) の Pick で選ぶ。期限（間に合わせる日）や [Tickler](task-tickler.md)（その日に考え直す）とは別のもの。

## 状態

`scheduled`: 日付 1 つ。issue もサブイシューも持てる。

## 操作

Organize の「Calendar」（日付を 1 つ選ぶ。整理済みにもする）、issue 画面の 7 日のセル（押すとその日、もう一度押すと消す）と「calendar >」、サブの編集の Calendar、Scheduled の表のセル、Today の Missed と前のボードの「Move date」（選び直す）と「Back to Next」（消して Next に戻す）、MCP の `scheduled`。

## 使い方の筋道

今日が Calendar の日の issue とサブイシューは、Today を開くと自動で今日のボードに載る。その日にボードから外したものは載せ直さない。過ぎて片付いていないものは、Today の Calendar の段階の「Missed」に、日を選び直すか Next に戻すまで出る。Calendar の日があるものは Next に入らない。

## 根拠

[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0152](../../../../src/docs/adr/0152-calendar-and-tickler.md)
