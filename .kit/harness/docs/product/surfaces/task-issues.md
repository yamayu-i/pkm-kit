# Issues

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)、コマンド
- 場面: [週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

- summary と ID で検索し、status・priority・label・期限の範囲・Calendar の日の有無で絞り込む。列で並べ替える。条件をプリセットとして保存できる（端末ごと）
- 既定では closed / canceled / someday を隠す
- 列: priority、status、status-detail、labels、calendar（Calendar の日）、soft deadline、deadline、estimated（押すと入力欄のダイアログ）
- 表示しているセルは押してその場で編集できる。行末の「…」で全項目を編集できる（スマホではここから）
- 選んだ行にまとめて Tickler を付けられる。行の「…」から Calendar・Tickler を編集できる

## 使う概念

[issue](../concepts/task-issue.md)、[status](../concepts/task-status.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)

## 入力と制約

summary・ID と status・priority・label・期限・Calendar の有無で絞ります。既定で closed・canceled・someday は隠れます。

## 操作と保存

セルの項目編集は issue の frontmatter に保存します。プリセットは端末ごとの設定で、ノートの内容とは別です。複数選択した Tickler は対象それぞれへ保存します。

## 失敗時と戻し方

終えた issue が見えない場合は status の条件を変えます。誤って変更した値はセルで選び直し、status の変更直後は取り消しを使えます。保存エラーの対象は通知から確認します。

## 端末の違い

PC は行・ボタン・キーボード、スマホはタップで開きます。スマホの画面では一覧とノートを同時に並べません。
