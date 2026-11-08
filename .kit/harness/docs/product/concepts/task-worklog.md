# worklog とタイマー

## 目的

いつ、どのやることに時間を使ったかを残す。

## 状態

`worklog/<端末名>/YYYY-MM.jsonl` に 1 行 1 件（`task_id`、`from`、`to`、`description`）。記録中は `to` が空。書くのはその端末だけ。

## 操作

ボードのカードやグループの再生 / 停止、サイドバーの停止、issue 画面での編集。間違ったログは worklog-review で直す。

## 使い方の筋道

再生するとログが始まり、停止すると終わる。止め忘れの警告や自動停止はしない（[戦略](../strategy.md#やらないこと)）。closed か canceled にすると止まる。

## 根拠

[ADR-0004](../../../../src/docs/adr/0004-worklog-storage.md)、[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)
