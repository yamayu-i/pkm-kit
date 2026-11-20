# issue 画面

- 種類: 画面（`issue/i-N.md` を開いたときの、本文より上のヘッダー）
- 開き方: 一覧の行・ボードのカード・親とサブへのリンクを押す。[ノートペイン](layout-panes.md)に開く
- 場面: [作業しながら残す](../jobs/task-work.md)、[週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

上から順に:

1. created と更新日時（小さく）
2. ID のバッジと summary（押して編集）
3. status（メニュー）と status-detail。delegated なら委任先。その issue が出る一覧（Inbox・Next Action・Calendar・Tickler）と、サブを持つなら「Project」を、読み取り専用のバッジで出す（押しても何もしない。整理は Inbox・Organize で行う）。サブがすべて閉じた Project の status のボタンは Close（open の Project には Start を出さない）
4. priority と label
5. 今日からの 7 日のストリップ（押すとその日を Calendar の日にする。もう一度押すと消す。「calendar >」で先の日も選べる）、tickler（その日に Inbox に戻す。Project では、閉じていないサブの期間の始まりのいちばん早い日以前だけを選べ、期間がすでに始まっていれば理由を出して付けさせない）、soft deadline・deadline
6. サブイシューの一覧（同じ Markdown に作る。題・状態・期間と依存を持ち、閉じたものは既定では隠す）。今日のボードに載せる Pick と、載った後の再生・停止を表示する。Pick は Next のサブ（open か in-progress で、Calendar の日がなく、親が Next で、今日が期間に入る）にだけ出し、期間がないか今日が期間の外のサブには、代わりに Timeline のボタンを出す（押すと何も書き換えず、Timeline でそのサブの行を目立たせる）。status のボタンの Start は、今日のボードに載せたものにだけ出す。Calendar の日を持つ issue にはサブを作れず、このカードを出さない。Timeline で期間と依存を見て直せる。Inbox（未整理）の Project では、サブの期間を入れられない（Edit・本文のカードの欄は押せず、Timeline は棒を作れず動かせない。理由を出す）。Tickler が先の Project では、Tickler の日より前に始まる期間を置けない。Project を someday にするときは、消えるサブの期間と Calendar の日を並べた確認のダイアログを出す。見出しの Apply preset から[プリセット](task-presets.md)を選ぶと、そのサブを末尾に足し、本文を issue の本文の末尾に追記する
7. estimated（プリセットか単位付きの入力）、実績、残り
8. worklog（見出しに Pick（Next の issue だけ。Inbox・Calendar・Tickler・someday には出さない）、ボードに載った後は再生・停止。新しい順に 5 件ずつ。押して編集）
9. 本文（ふつうのエディタ。新しい issue は ToDo / Description / Note の見出し）

ページの一番上に出る。編集の画面とリーディングビューの両方に出て、どちらでも編集できる。Properties 欄は隠す（ソースモードでは frontmatter が見える）。

## 使う概念

[issue](../concepts/task-issue.md)、[status](../concepts/task-status.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[deadline と soft deadline](../concepts/task-deadline.md)、[estimated と実績](../concepts/task-estimate.md)、[worklog とタイマー](../concepts/task-worklog.md)

## 根拠

[ADR-0008](../../../../src/docs/adr/0008-ui-preact.md)、[ADR-0012](../../../../src/docs/adr/0012-issue-screen.md)、[ADR-0017](../../../../src/docs/adr/0017-date-input.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0077](../../../../src/docs/adr/0077-task-header-dom-mount.md)、[ADR-0210](../../../../src/docs/adr/0210-gtd-list-badge-and-project-rules.md)

## 入力と制約

summary・status・priority・label、分単位の estimated、YYYY-MM-DD の日付を扱います。status-detail は 20 文字以内。サブの依存は同じ親の中で、循環させられません。

## 操作と保存

各項目は親の frontmatter、サブは同じ Markdown 内の sub-issue ブロックへ保存します。Pick は今日のボードへの追加・除外を行い、Calendar の日もほかの項目も書きません。Next でないものは、先に Organize などで Next にしてから Pick します（ADR-0203）。サブを持つ issue には Calendar の日を付けられず、その欄を出しません。worklog は親と sub の組に紐付きます。

## 失敗時と戻し方

完了したサブは一覧の表示を切り替えて確かめます。読めないサブのブロックは警告として残し、ソースで直します。取り消し可能な status 変更はトーストを使い、それ以外は項目を選び直します。

## 端末の違い

Live Preview と Reading View の両方でヘッダーを操作できます。Timeline は狭い幅でもスクロールでき、本文の生の Markdown はソースモードで確認できます。


## サブと Note の編集

上のサブの題を押すと編集ダイアログを開く。本文の Note は初めはプレビューで、押すとその場の編集に切り替わる。Note は同じ issue の Markdown に保存され、サブの本文と混ぜない。ダイアログを閉じるときは共通の Cmd/Ctrl+W も使える。
