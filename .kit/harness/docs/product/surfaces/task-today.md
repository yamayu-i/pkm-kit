# Today

- 種類: View
- 開き方: リボンの「Open Today」、[Tasks サイドバー](task-sidebar.md)、コマンド。[一覧ペイン](layout-panes.md)に開く
- 場面: [朝の計画](../jobs/task-plan-day.md)、[一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- 段階を順に進む: **Calendar → Previous boards → Pick → Board**。件数のある段階を順に通り、「Next」で飛ばせる。手で選んだ段階は、片付くと次へ進む。上の段階表示は、今の段階だけ名前と件数を出し、ほかは番号（済みはチェック）の丸に縮める。残りがある段階には赤い点が付き、名前と件数はツールチップで分かる。丸を押すといつでも移れる
- Calendar: 期限切れ（Overdue）・期限が近い（Due soon。3 日以内）は deadline と soft deadline の表が別々。操作は Add to today's board、Change Deadline / Change Soft Deadline、Tickler、Cancel、Inbox、行の編集。Missed（[Calendar](../concepts/task-do-date.md) の日が過ぎて片付いていないもの）は Add to today's board、Move date、Back to Next、Close、Cancel、Inbox。どの表にもサブイシューが出て、同じ issue のサブは親の小さい見出し（ID と題）の下にまとまる
- Previous boards: 締めていない過去のボードの未完了を、ボードの日付ごとに issue・サブイシュー・routine をまとめて出す。Add to today's board、Back to Next、Tickler、Move date（Calendar の日を持つものだけ）、Close、Cancel、Inbox で片付ける（サブイシューには Tickler と Inbox がない）。未完了がなくなった過去のボードは自動で締まる
- Pick: Next（整理済みで、Calendar の日も Tickler もない open の issue）を priority → deadline → 見直しが古い順に出し、選んで今日のボードに載せる（日付は書かない）。Tickler・Someday・Cancel・Inbox もできる。サブイシュー（Calendar の日がなく、start が今日以前）は、親の小さい見出しの下に並べて「Add to board」で載せる。サブを持つ親は行に出さない
- 開いているあいだ、今日が Calendar の日の issue とサブイシューを自動で今日のボードに載せる（その日に外したものは載せない）
- 最後の段階は [task board](task-board.md)

## 使う概念

[deadline と soft deadline](../concepts/task-deadline.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[task board](../concepts/task-board.md)、[Inbox](../concepts/task-inbox.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0150](../../../../src/docs/adr/0150-daily-engage-steps.md)、[ADR-0152](../../../../src/docs/adr/0152-calendar-and-tickler.md)。段階表示を縮めたのは変更の記録（`.kit/CHANGELOG.md` の「Daily の段階表示を縮める」）
