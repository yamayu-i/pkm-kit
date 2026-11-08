# estimated と実績

## 目的

やる前にどれくらいかかるかを見積もり、やった後に実際にかかった時間と比べられるようにする。

## 状態

`estimated`（分）。表記は 60m = 1h、24h = 1d。実績は保存せず、worklog から計算する。時間が重なったログは、重なった数で割って配る。

## 操作

プリセット（15m〜8h）から選ぶか、`30m`・`2h`・`1h30m` のように入れる。Inbox のカードで Organize から Do Date を選ぶときは必須。

## 使い方の筋道

ボードの未完了の estimated の合計が、一日に使える時間（task-coach の既定は 240 分）と比べられる。closed にした issue の見積もりと実績の比が、見積もりの精度になる。

## 根拠

[ADR-0005](../../../../src/docs/adr/0005-effort-proration.md)、[ADR-0012](../../../../src/docs/adr/0012-issue-screen.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0025](../../../../src/docs/adr/0025-mcp-and-task-coach.md)
