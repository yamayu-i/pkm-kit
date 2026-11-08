# PKM Updates

- 種類: View
- 開き方: リボンの「PKM Updates を開く」、コマンド「PKM Updates を開く」。[一覧ペイン](layout-panes.md) に開く
- 場面: [朝の計画](../jobs/task-plan-day.md)、[端末間の同期](../jobs/sync-devices.md)、[週の振り返り](../jobs/task-review-week.md)

## 今の振る舞い

- 一覧 View ごとのセクションに、前回の確認より後に `updated` が新しくなったノートを、新しい順に出す。セクションは Issues、Inbox、Organize、Scheduled、Someday、Routines、Members、Daily notes、Notes、Sources の順。0 件のセクションは出さない
- 各セクションに載るノートは、その一覧を開いたときに載るものと同じ。ただし Issues は closed / canceled / someday も含む（閉じた変更も見えるように）。1 つのノートが複数の一覧に当たるなら、そのすべてに出る
- セクションの見出しを押すと、その一覧を一覧ペインに開く。行を押すとノートをノートペインに開く（Ctrl/Cmd+クリックで新しいタブ）
- 50 行ずつ出し、下まで見ると次の 50 行が出る
- 画面の下に固定した Viewed を押すと、その日時を記録してリストが空になる。記録は端末間で同期し、どの端末で押しても、最も新しいものが基準になる。端末名がない（pkm-task と pkm-git の設定のどちらにもない）と押せない
- まだ一度も Viewed を押していなければ、`updated` があるノートをすべて出す
- `updated` はコミットのときに付く。コミットしていない変更はまだ載らず、確認の前に書いて確認の後にコミットした変更は、もう一度載る

## 使う概念

[ノートの type](../concepts/note-type.md)、[issue](../concepts/task-issue.md)、[Inbox](../concepts/task-inbox.md)、[Someday](../concepts/task-someday.md)

## 根拠

[ADR-0070](../../../../src/docs/adr/0070-pkm-updates.md)、[ADR-0028](../../../../src/docs/adr/0028-auto-updated.md)、[ADR-0033](../../../../src/docs/adr/0033-list-pane.md)
