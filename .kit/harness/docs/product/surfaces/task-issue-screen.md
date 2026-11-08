# issue 画面

- 種類: 画面（`issue/i-N.md` を開いたときの、本文より上のヘッダー）
- 開き方: 一覧の行・ボードのカード・親子のリンクを押す。[ノートペイン](layout-panes.md)に開く
- 場面: [作業しながら残す](../jobs/task-work.md)、[週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

上から順に:

1. created と更新日時（小さく）
2. ID のバッジと summary（押して編集）
3. status（メニュー）と status-detail。delegated なら委任先
4. priority と label
5. 今日からの 7 日のストリップ（押して Do Date を入れる・外す。「calendar >」で先の日も選べる）と、soft deadline・deadline
6. Parent と Children（検索して選ぶ、新しく作る、外す。循環は作れない）
7. estimated（プリセットか単位付きの入力）、実績、残り
8. worklog（新しい順に 5 件ずつ。押して編集）
9. 本文（ふつうのエディタ。新しい issue は ToDo / Description / Note の見出し）

ページの一番上に出る。編集の画面とリーディングビューの両方に出て、どちらでも編集できる。Properties 欄は隠す（ソースモードでは frontmatter が見える）。

## 使う概念

[issue](../concepts/task-issue.md)、[status](../concepts/task-status.md)、[Do Date](../concepts/task-do-date.md)、[deadline と soft deadline](../concepts/task-deadline.md)、[estimated と実績](../concepts/task-estimate.md)、[worklog とタイマー](../concepts/task-worklog.md)

## 根拠

[ADR-0008](../../../../src/docs/adr/0008-ui-preact.md)、[ADR-0012](../../../../src/docs/adr/0012-issue-screen.md)、[ADR-0017](../../../../src/docs/adr/0017-date-input.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0077](../../../../src/docs/adr/0077-task-header-dom-mount.md)
