# Scheduled

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)、コマンド
- 場面: [朝の計画](../jobs/task-plan-day.md)、[週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

- 今日以降に Calendar の日（その日にやらなければならない日）がある issue を行に、今日から 14 日分の日付を列に並べる（横スクロール。summary は左に固定）
- セルを押すと、Calendar の日をその日に移す。同じ日をもう一度押すと消す（日付は 1 つ）
- soft deadline・deadline の枠と、締切を過ぎた日の塗りは、issue 画面の 7 日ストリップと同じ

## 使う概念

[Calendar](../concepts/task-do-date.md)、[deadline と soft deadline](../concepts/task-deadline.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)

## 入力と制約

今日以降の Calendar の日を持つ issue が対象です。今日から 14 日の列を表示し、日付は同時に 1 日だけ持ちます。

## 操作と保存

セルを押すと scheduled をその日に変更し、同じセルをもう一度押すと消します。soft deadline・deadline は表示する印で、この操作では変更しません。

## 失敗時と戻し方

行が見えないときは Calendar の日を消したか、過去の日になっていないかを確認します。過ぎた未完了は Today の Missed から見直します。選び間違いはセルを選び直して戻します。

## 端末の違い

PC は行・ボタン・キーボード、スマホはタップで開きます。スマホの画面では一覧とノートを同時に並べません。
