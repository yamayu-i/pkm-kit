# issue 画面

- 種類: 画面（`issue/i-N.md` を開いたときの、本文より上のヘッダー）
- 開き方: 一覧の行・ボードのカード・親とサブへのリンクを押す。[ノートペイン](layout-panes.md)に開く
- 場面: [作業しながら残す](../jobs/task-work.md)、[週の見直し](../jobs/task-review-week.md)

## 今の振る舞い

上から順に:

1. created と更新日時（小さく）
2. ID のバッジと summary（押して編集）
3. status（メニュー）と status-detail。delegated なら委任先。
4. priority と label
5. 今日からの 7 日のストリップ（押すとその日を Calendar の日にする。もう一度押すと消す。「calendar >」で先の日も選べる）、tickler（その日に Inbox に戻す）、soft deadline・deadline
6. サブイシューの一覧（同じ Markdown に作る。題・状態・期間と依存を持ち、閉じたものは既定では隠す）。今日のボードに載せる Pick と、載った後の再生・停止を表示する。Timeline で期間と依存を見て直せる。見出しの Apply preset から[プリセット](task-presets.md)を選ぶと、そのサブを末尾に足し、本文を issue の本文の末尾に追記する
7. estimated（プリセットか単位付きの入力）、実績、残り
8. worklog（見出しに Pick、ボードに載った後は再生・停止。新しい順に 5 件ずつ。押して編集）
9. 本文（ふつうのエディタ。新しい issue は ToDo / Description / Note の見出し）

ページの一番上に出る。編集の画面とリーディングビューの両方に出て、どちらでも編集できる。Properties 欄は隠す（ソースモードでは frontmatter が見える）。

## 使う概念

[issue](../concepts/task-issue.md)、[status](../concepts/task-status.md)、[Calendar](../concepts/task-do-date.md)、[Tickler](../concepts/task-tickler.md)、[deadline と soft deadline](../concepts/task-deadline.md)、[estimated と実績](../concepts/task-estimate.md)、[worklog とタイマー](../concepts/task-worklog.md)

## 根拠

[ADR-0008](../../../../src/docs/adr/0008-ui-preact.md)、[ADR-0012](../../../../src/docs/adr/0012-issue-screen.md)、[ADR-0017](../../../../src/docs/adr/0017-date-input.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0077](../../../../src/docs/adr/0077-task-header-dom-mount.md)

## 入力と制約

summary・status・priority・label、分単位の estimated、YYYY-MM-DD の日付を扱います。status-detail は 20 文字以内。サブの依存は同じ親の中で、循環させられません。

## 操作と保存

各項目は親の frontmatter、サブは同じ Markdown 内の sub-issue ブロックへ保存します。Pick は今日のボードへの追加・除外を行い、Calendar の日は書きません。worklog は親と sub の組に紐付きます。

## 失敗時と戻し方

完了したサブは一覧の表示を切り替えて確かめます。読めないサブのブロックは警告として残し、ソースで直します。取り消し可能な status 変更はトーストを使い、それ以外は項目を選び直します。

## 端末の違い

Live Preview と Reading View の両方でヘッダーを操作できます。Timeline は狭い幅でもスクロールでき、本文の生の Markdown はソースモードで確認できます。


## サブと Note の編集

上のサブの題を押すと編集ダイアログを開く。本文の Note は初めはプレビューで、押すとその場の編集に切り替わる。Note は同じ issue の Markdown に保存され、サブの本文と混ぜない。ダイアログを閉じるときは共通の Cmd/Ctrl+W も使える。
