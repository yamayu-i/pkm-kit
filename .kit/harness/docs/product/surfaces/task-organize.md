# Organize

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)（件数付き）、コマンド
- 場面: [スキマ時間の整理](../jobs/task-organize.md)

## 今の振る舞い

- 1 件ずつカードで出す。順は Inbox の古い順 → revisit を過ぎた someday → reviewed が古い someday
- カード: summary、作成日、本文の冒頭。priority と label はカードの上で変えられる
- 操作（スワイプ・ボタン・矢印キー）: Do Date（→。カレンダーで複数の日を選んで決定。Inbox のカードで estimated がなければ、それも選ぶまで決定できない）、Someday へ（←）、あとで（↑。reviewed だけ更新）、Cancel（↓）、もう終わっていた
- 整理したカードは reviewed を今日にする。1 つ前に戻せる

## 使う概念

[Inbox](../concepts/task-inbox.md)、[Someday](../concepts/task-someday.md)、[Do Date](../concepts/task-do-date.md)、[estimated と実績](../concepts/task-estimate.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0030](../../../../src/docs/adr/0030-organize-schedule-calendar.md)
