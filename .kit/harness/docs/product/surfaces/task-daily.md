# Daily

- 種類: View
- 開き方: リボンの「Daily を開く」、[Tasks サイドバー](task-sidebar.md)、コマンド。[一覧ペイン](layout-panes.md)に開く
- 場面: [朝の計画](../jobs/task-plan-day.md)、[一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- 段階を順に進む: **期限切れ → 前回のボード → 期限が近い → ボード**。上の段階表示は、今の段階だけ名前と件数を出し、ほかは番号（済みはチェック）の丸に縮める。残りがある段階には赤い点が付き、名前と件数はツールチップで分かる。丸を押すといつでも移れる
- 期限切れと前回のボードは、片付くと自動で次へ進む。期限が近いは「次へ」で進む
- 期限切れ・期限が近いは deadline と soft deadline の表が別々。操作は Change Deadline / Change Soft Deadline、Add Do Date、Cancel、Inbox、行の編集
- 前回のボードは、締めていない過去のボードの未完了。Close、Cancel、Inbox、Do Today、Move Do Date で片付ける。未完了がなくなった過去のボードは自動で締まる
- 開いているあいだ、今日が Do Date の issue を自動で今日のボードに載せる（その日に外したものは載せない）
- 最後の段階は [task board](task-board.md)

## 使う概念

[deadline と soft deadline](../concepts/task-deadline.md)、[Do Date](../concepts/task-do-date.md)、[task board](../concepts/task-board.md)、[Inbox](../concepts/task-inbox.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)。段階表示を縮めたのは変更の記録（`.kit/CHANGELOG.md` の「Daily の段階表示を縮める」）
