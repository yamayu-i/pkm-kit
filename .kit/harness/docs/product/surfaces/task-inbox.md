# Inbox

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)（件数付き）、コマンド
- 場面: [思いつきの捕捉](../jobs/task-capture.md)、[スキマ時間の整理](../jobs/task-organize.md)

## 今の振る舞い

- 上の入力欄に summary を入れて Enter で、Inbox に issue を作る
- Inbox の issue の一覧。列: priority、status、labels、estimated、created。行の編集は [Issues](task-issues.md) と同じ
- 選んだ行を Next（整理済み）にする、Tickler を付ける、Someday・Close・Cancel にする

## 使う概念

[Inbox](../concepts/task-inbox.md)、[issue](../concepts/task-issue.md)

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)

## 入力と制約

open で clarified が true でない issue が対象です。期限の有無は Inbox の判定に使いません。サブはここには並べません。

## 操作と保存

入力欄から summary のみの issue を作れます。整理して Next や Calendar にすると clarified が true になり、一覧から出ます。

## 失敗時と戻し方

整理したはずの項目が残る場合は clarified を確認します。期限を入れるだけでは整理済みになりません。issue 画面は Inbox か Next Action かを読み取り専用のバッジで出すだけで、切り替えません。誤って整理したものを考え直すなら Tickler を付けます（画面に Inbox に戻す操作はありません。ADR-0210）。

## 端末の違い

PC は行・ボタン・キーボード、スマホはタップで開きます。スマホの画面では一覧とノートを同時に並べません。
