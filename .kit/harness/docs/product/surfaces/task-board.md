# task board

- 種類: View（[Daily](task-daily.md) の最後の段階）
- 開き方: Daily の段階「ボード」
- 場面: [朝の計画](../jobs/task-plan-day.md)、[作業しながら残す](../jobs/task-work.md)、[一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- グループ（1 階層目）を横に等分して並べ、サブグループはその中に縦に並べる。狭いペインでは縦 1 列。グループのないカードは「未分類」
- カードは表題を優先し、ID はマウスを乗せると出る。カードの置き場所は、その日に移した場所 → 前に置いた場所 → routine の `group` → 未分類 の順
- カード: status のバッジ（メニュー。issue は `delegated…` も選べる）、「次の status」ボタン（押した後の status のアイコン）、再生 / 停止。delegated なら委任先のチップ。グループにも、まとめて再生 / 停止のボタン
- closed / canceled の issue と、結果を記録した routine は、下の「完了」の欄に移る。↩ で戻すと元のグループに戻る
- status を変えると、右下に「N件のステータスが変更されました。 やり直す ›」が 5 秒出て、まとめて取り消せる
- 未完了の一覧: Close、Cancel、Inbox、Do Tomorrow、Move Do Date。持ち越したものはボードに残るが未完了に数えない
- 未完了が 0 になると「ボードを締める」が押せる。デイリーノートの `## Task board` 節に要約が入る

## 使う概念

[task board](../concepts/task-board.md)、[ボードのグループ](../concepts/task-board-group.md)、[status](../concepts/task-status.md)、[worklog とタイマー](../concepts/task-worklog.md)、[routine](../concepts/task-routine.md)、[委任先](../concepts/task-member.md)

## 根拠

[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0015](../../../../src/docs/adr/0015-board-layout-simplified.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0020](../../../../src/docs/adr/0020-board-oplog.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)
