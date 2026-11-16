# task board

## 目的

その日にやることを 1 つの盤面に並べ、締めて一日の記録を残す。

## 状態

`board/<端末名>/YYYY-MM.jsonl` の操作ログ（載せる・外す・置く・routine の結果・持ち越し・締める）を、全端末ぶん再生して作る。締めると、デイリーノートの `## Task board` 節に要約が書かれる。

## 操作

載せる・外す、★ を付ける、並べ替える、status を変える、持ち越す（Back to Next、Tickler、Move date）、締める。

## 使い方の筋道

今日が Calendar の日の issue とサブイシュー、今日の routine は自動で載る。カードは status とタイマーで欄に分かれる（[ボードの欄と ★](task-board-lane.md)）。closed / canceled は下の「Done」に移る。持ち越したものはボードに残るが未完了に数えない。締めると記録が残る。未完了が残っていても締められ、未完了は持ち越しと書かれる。締めなくても催促しない。持ち越しの回数は、その日に片付けなかったものを自動で数える（[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)）。

## 根拠

[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0020](../../../../src/docs/adr/0020-board-oplog.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0137](../../../../src/docs/adr/0137-board-lanes-and-sub-issue-cards.md)
