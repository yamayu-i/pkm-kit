# Tickler

## 目的

今は決めず、その日に思い出して整理し直したいもの（例: 返金が届いたか確かめる、更新するか考える）を、その日まで目から外しておく（GTD の Tickler）。その日にやらなければならない行動は [Calendar](task-do-date.md) で表す。

## 状態

`tickler`: 日付 1 つ。issue だけが持つ（サブイシューは整理の対象ではないので持たない）。整理の先送りなので、`clarified` は変えない。

## 操作

Organize の「Tickler」（↑。既定は明日）、Today の Pick と前のボードの「Tickler」、Inbox・Someday・Issues の一覧の「Tickler」、issue 画面の「tickler」、MCP の `tickler` と `carry_issues` の `tickler`。

## 使い方の筋道

日付の前は、Inbox・Next・Today の Pick・Organize のどこにも出ない（期限は Tickler があっても Today に出る）。日付が来ると Inbox に戻り、Organize で整理し直す。整理の操作（Next・Calendar・Someday・Cancel・Already done・Inbox に戻す）は `tickler` を消す。

## 根拠

[ADR-0152](../../../../src/docs/adr/0152-calendar-and-tickler.md)
