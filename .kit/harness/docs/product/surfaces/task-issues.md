# Issues

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)、コマンド
- 場面: [週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

- summary と ID で検索し、status・priority・label・parent・期限の範囲・Do Date の有無で絞り込む。列で並べ替える。条件をプリセットとして保存できる（端末ごと）
- 既定では closed / canceled / someday を隠す
- 列: priority、status、status-detail、labels、next（次の Do Date）、soft deadline、deadline、estimated
- 表示しているセルは押してその場で編集できる。行末の「…」で全項目を編集できる（スマホではここから）
- 選んだ行に Add Do Date でまとめて Do Date を足せる

## 使う概念

[issue](../concepts/task-issue.md)、[status](../concepts/task-status.md)、[Do Date](../concepts/task-do-date.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)
