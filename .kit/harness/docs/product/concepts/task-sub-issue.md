# サブイシュー

## 目的

1 つの成果に必要な行動を、別のノートを増やさず、親の issue の本文に持つ。

## 状態

親の issue ノートの末尾で、HTML コメントの sub-issue ブロックに項目、その後に本文を置く。ID は親の中で一意で、外からは親と ID の組（例: i-12#k3f9a2）で指定する。サブの下にサブは作らない。旧 parent の frontmatter で別 issue を結ぶ方式は使わない。

| UI・意味 | キー | 型・単位・制約 |
|---|---|---|
| 識別子 | id | 親内で一意の短い ID |
| 題 | summary | 文字列 |
| 状態 | status | issue と同じ 7 状態 |
| 期間 | start / end | YYYY-MM-DD。開始・終了は任意。end はサブの期限を兼ね、過ぎる・3 日以内になると Today に出る |
| Calendar | scheduled | YYYY-MM-DD、1 日 |
| 見積もり | estimated | 0 以上の分数 |
| 依存する先 | depends_on | 同じ親内のサブ ID の配列。循環不可 |
| 委任先 | delegated_to | member の ID |

label・priority は親の文脈を使う。サブに soft_deadline / deadline はない（外の都合で決まる締切は親の deadline に書く）。someday にすると Calendar の日と期間を外し、someday のサブに期間を入れると open に戻る。サブに Tickler と Inbox はない。親が完了してもサブの状態を自動で揃えず、サブがすべて終わっても親を自動では閉じない。サブ（閉じたものも含む）を持つ issue を Project と呼ぶ（サブがすべて閉じても Project のまま）。Project は Calendar の日を持たず、Calendar の日を持つ issue にはサブを作れない（ADR-0203）。Inbox（未整理）の Project のサブには期間を入れられない（変えるのも不可。消すのはよい）。Project の Tickler は、閉じていないサブの期間の始まりのいちばん早い日以前で、Tickler が先の Project のサブには Tickler の日以降に始まる期間だけを入れられる。Project を someday にすると、閉じていないサブの期間と Calendar の日を消す（ADR-0210）。

サブの Next は、open か in-progress で、Calendar の日がなく、親が Next で、今日が期間（start〜end。片方だけならその 1 日）に入るもの。Tickler の日を迎えた計画済み（閉じていないサブに期間がある）の Project は Next になるので、そのサブは期間に入れば Pick に出る。期間がないサブ・今日が期間の外のサブは Pick できず、issue 画面では Timeline で期間を決めるよう案内する。

## 操作

親の issue で追加・題や項目の変更・順番の変更・削除・別の親への移動を行う。本文のカードは開閉し、Show source で元の Markdown を確認できる。Timeline で期間と依存を直す。今日のボードに個別に載せ、再生・停止できる。

## 使い方の筋道

成果を親の summary に書き、次に取れる行動をサブにする。実行したサブの worklog は親の ID と sub を持つ。親の実績には親への直接の時間とサブの時間を 1 回ずつ数え、二重計上しない。親の見積もりは全体の予算として扱う。

## 根拠

[ADR-0135](../../../../src/docs/adr/0135-sub-issues-in-issue-file.md)、[ADR-0190](../../../../src/docs/adr/0190-sub-end-as-due.md)、[ADR-0203](../../../../src/docs/adr/0203-pick-and-start-follow-next.md)、[ADR-0210](../../../../src/docs/adr/0210-gtd-list-badge-and-project-rules.md)
