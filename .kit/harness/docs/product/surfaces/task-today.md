# Today

- 種類: View
- 開き方: リボンの「Open Today」、[Tasks サイドバー](task-sidebar.md)、コマンド。[一覧ペイン](layout-panes.md)に開く
- 場面: [朝の計画](../jobs/task-plan-day.md)、[一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- 段階を順に進む: **Calendar → Pick → Board**。件数のある段階を順に通り、「Next」で飛ばせる。手で選んだ段階は、片付くと次へ進む。上の段階表示は、今の段階だけ名前と件数を出し、ほかは番号（済みはチェック）の丸に縮める。残りがある段階には赤い点が付き、名前と件数はツールチップで分かる。丸を押すといつでも移れる
- Calendar: 期限切れ（Overdue）・期限が近い（Due soon。3 日以内）は deadline と soft deadline の表が別々。操作は Add to today's board、Change Deadline / Change Soft Deadline、Tickler、Someday、Cancel、行の編集（守れない期限は結び直す）。Missed は 2 つの節に分かれる。Calendar の節（[Calendar](../concepts/task-do-date.md) の日が過ぎて片付いていないもの）は Add to today's board、Move date、Back to Next、Close、Cancel。Routines の節（予定日に結果を付けなかった routine の積み残し。予定日ごとに 1 行で、行の先頭にどの日の分かを出す）は Close、Cancel で、もとの日の結果を書く。サブイシューは、期限切れ・期限が近い表では end（サブの期限）の表に、Missed の表にもそのまま出る。同じ issue のサブは親の小さい見出し（ID と題）の下にまとまる
- Pick: Next（整理済みで、Calendar の日も Tickler もない open の issue）を priority → deadline → 見直しが古い順に出し、選んで今日のボードに載せる（日付は書かない）。Tickler・Someday・Cancel・Inbox もできる。サブイシュー（Calendar の日がなく、親が Next で、今日が期間に入るもの）は、親の小さい見出しの下に並べて「Add to board」で載せる。サブを持つ親（Project。サブがすべて閉じても）は行に出さない。Next のサブが 1 つもなく、先に始まる期間のサブもない Next の親は「Projects without a next action」に出し、Open で issue 画面を開いて期間を決めるかサブを足す。サブがすべて閉じた親には Close も出す（押したときだけ閉じる）。Someday にする操作は、Project のサブの期間が消えるなら先に確認する
- 開いているあいだ、今日が Calendar の日の issue とサブイシューを自動で今日のボードに載せる（その日に外したものは載せない）
- 最後の段階は [task board](task-board.md)。ボードの末尾の Close board で [Closing の画面](task-closing.md) に移る（段階表示には入らない）

## 使う概念

[deadline と soft deadline](../concepts/task-deadline.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[task board](../concepts/task-board.md)、[Inbox](../concepts/task-inbox.md)

## 根拠

[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0150](../../../../src/docs/adr/0150-daily-engage-steps.md)、[ADR-0152](../../../../src/docs/adr/0152-calendar-and-tickler.md)、[ADR-0190](../../../../src/docs/adr/0190-sub-end-as-due.md)。段階表示を縮めたのは変更の記録（`.kit/CHANGELOG.md` の「Daily の段階表示を縮める」）

## 入力と制約

Calendar の日は必須の予定です。今日やりたいだけのものは Pick で選び、scheduled を書きません。

## 操作と保存

今日の予定と routine をボードに自動で載せます。同じ日に手で外したものは再追加しません。Pick は board の add 操作として記録されます。

## 失敗時と戻し方

前の日の未完了は、Next に残っていれば Pick から、Calendar の日を過ぎていれば Missed から選び直します（締めていないボードを催促しません）。期限と作業日の意味を混同した場合は Calendar を直します。

## 端末の違い

同じ段階を PC とスマホで進めます。幅が狭くなると操作が折り返されます。AI には MCP から同じ状態を読ませます。
