# Someday

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)、コマンド
- 場面: [週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

- someday の issue の一覧。列: priority、status、labels、revisit、reviewed。reviewed が古い順にも並べられる
- 週次の見直しの場。上から見て、残すものに Reviewed（reviewed を今日にするだけ）を押す。ほかの操作: Back to Inbox、Tickler、revisit（その日に Organize に出す）、Cancel
- 行の編集は [Issues](task-issues.md) と同じ。Tickler を付けるか、Calendar の日や期限を入れると open に戻る

## 使う概念

[Someday](../concepts/task-someday.md)

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0212](../../../../src/docs/adr/0212-organize-inbox-and-revisit-only.md)

## 入力と制約

status が someday の issue が対象です。見直し日 revisit と見直した日 reviewed は YYYY-MM-DD です。

## 操作と保存

Next や Calendar へ戻すと実行する候補になります。Someday へ入れると Calendar・期限・Tickler を消すため、再開する際は必要な日付を入れ直します。

## 失敗時と戻し方

一覧が空なら保留した issue がありません。日付を失ったように見える場合は Someday に入る際の仕様を確認し、再開時に設定します。

## 端末の違い

PC は行・ボタン・キーボード、スマホはタップで開きます。スマホの画面では一覧とノートを同時に並べません。
