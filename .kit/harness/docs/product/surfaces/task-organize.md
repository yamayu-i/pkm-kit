# Organize

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)（件数付き）、コマンド
- 場面: [スキマ時間の整理](../jobs/task-organize.md)

## 今の振る舞い

- 1 件ずつカードで出す。対象は Inbox と、revisit を迎えた someday だけ（revisit のない・先の someday は出さない）。順は Inbox の古い順 → revisit の古い順
- カード: summary、作成日、本文の冒頭。priority と label はカードの上で変えられる
- 操作（スワイプ・ボタン・矢印キー）: Next（→。日付を決めずに整理済み（`clarified: true`）にする）、To Someday（←）、Tickler（↑。日付を 1 つ選び、その日に Inbox に戻す）、Cancel（↓）。revisit を迎えた someday で To Someday を選ぶと revisit を消す。ボタンだけ: Calendar（その日にやらなければならない日を 1 つ選ぶ。整理済みにもする。estimated は求めない）、Already done。整理の操作はどれも Tickler を消す
- 整理したカードは reviewed を今日にする。1 つ前に戻せる

## 使う概念

[Inbox](../concepts/task-inbox.md)、[Someday](../concepts/task-someday.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[estimated と実績](../concepts/task-estimate.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0030](../../../../src/docs/adr/0030-organize-schedule-calendar.md)、[ADR-0148](../../../../src/docs/adr/0148-inbox-clarified.md)、[ADR-0152](../../../../src/docs/adr/0152-calendar-and-tickler.md)、[ADR-0212](../../../../src/docs/adr/0212-organize-inbox-and-revisit-only.md)

## 入力と制約

整理対象は Inbox と revisit を迎えた Someday。ほかの Someday の見直しは週次で [Someday](task-someday.md) の一覧で行います。Calendar と Tickler は日付を 1 つ選びます。estimated は必須ではありません。

## 操作と保存

Next は clarified、Calendar は scheduled と clarified、Tickler は tickler を保存します。整理の記録として reviewed を更新します。本文を書き直す操作ではありません。

## 失敗時と戻し方

直前の整理は戻す操作で取り消せます。空なら未整理のものも revisit を迎えた Someday もない状態です。選び間違えた日付は対象の issue でも直せます。

## 端末の違い

PC の矢印キー・ボタン、タッチのスワイプ・ボタンで操作します。本文の入力中のキー操作と混同しないようボタンも使えます。
