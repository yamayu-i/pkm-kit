# Tasks サイドバー

- 種類: View（左サイドバーに常駐）
- 開き方: 起動時に自動で開く。コマンド「Open Tasks sidebar」
- 場面: [朝の計画](../jobs/task-plan-day.md)、[作業しながら残す](../jobs/task-work.md)、[思いつきの捕捉](../jobs/task-capture.md)

## 今の振る舞い

上から:

1. 「Capture issues」のボタン
2. 記録中のタイマー（表題・経過時間・停止）
3. 各 View への移動と件数: Today（期限切れ + 前回のボードの未完了 + 今日のボードの未完了。その日に外したものは数えない）、Inbox、Organize、Scheduled、Issues、Someday、Routines、Board groups、Labels

押した View は [一覧ペイン](layout-panes.md) に開く。

## 使う概念

[worklog とタイマー](../concepts/task-worklog.md)、[Inbox](../concepts/task-inbox.md)

## 根拠

[ADR-0021](../../../../src/docs/adr/0021-routine-effort-and-sidebar.md)、[ADR-0024](../../../../src/docs/adr/0024-label-manager.md)、[ADR-0033](../../../../src/docs/adr/0033-list-pane.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)

## 入力と制約

一覧ごとの件数と記録中のタスクを表示します。件数は索引から計算し、手入力しません。

## 操作と保存

一覧への移動とタイマー停止の入口です。件数の表示だけではノートを書き換えず、停止すると worklog の終わりを保存します。

## 失敗時と戻し方

目的の一覧がない場合は対応するプラグインが有効かを確認します。タイマーの止め忘れはここから停止し、必要なら worklog を修正します。

## 端末の違い

左サイドバーを開いて使います。PC とスマホのどちらでも一覧への入口として使えます。
