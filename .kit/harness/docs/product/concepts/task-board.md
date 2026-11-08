# task board

## 目的

その日にやることを 1 つの盤面に並べ、片付けて締めることで一日を区切る。

## 状態

`board/<端末名>/YYYY-MM.jsonl` の操作ログ（載せる・外す・置く・routine の結果・持ち越し・締める）を、全端末ぶん再生して作る。締めると、デイリーノートの `## Task board` 節に要約が書かれる。

## 操作

載せる・外す、グループに置く、status を変える、持ち越す（Do Tomorrow、Move Do Date、Inbox）、締める。

## 使い方の筋道

今日が Do Date の issue と今日の routine は自動で載る。カードは前に置いたグループに出る。closed / canceled は下の「完了」に移る。持ち越したものはボードに残るが未完了に数えない。未完了が 0 になると締められ、締めなかったボードは翌日「前回のボード」に出る。

## 根拠

[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0020](../../../../src/docs/adr/0020-board-oplog.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)
