# task board

- 種類: View（[Today](task-today.md) の最後の段階）
- 開き方: Today の段階「ボード」
- 場面: [朝の計画](../jobs/task-plan-day.md)、[作業しながら残す](../jobs/task-work.md)、[一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- 1 列のボード。欄は上から Working（タイマーが動いているもの）・Top 4（★ 今日の最重要。4 件まで）・Routines（category が default の routine だけを、Routines の一覧の並び順で。issue・サブと混ぜない。closing の routine は Closing の画面に出す。開いたまま始め、見出しで開閉。closed / canceled の routine は隠し、末尾の「Show N done」で出す（開いたかは覚えない。ADR-0240）。すべて Close / Cancel したら欄ごと隠す。★ は付けられない）・Up next（残り。in-progress も open もここ）・Watch（waiting / delegated の issue とサブすべて。ボードに載っているかによらない。薄い primary の面。Resume で in-progress に戻して今日のボードに載せる）・Done（片付いたもの。たたむ）。欄は status・タイマー・★ から自動で決まる。waiting / delegated にすると ★ が外れ、未完了にも数えない
- カードは issue・サブイシュー・routine の 1 件ごと。1 行に status のバッジ（メニュー。遷移表で移れる先だけ。`delegated…` も選べる）・題・記録の時刻を直すボタン・再生 / 停止・`···` のメニューだけを出す。マウスを乗せると、バッジの隣に status のボタン（よく使う遷移 1 つ。routine は open なら closed と canceled の 2 つ、結果があれば ↩ で open に戻す。ADR-0240）が出る。ID はマウスを乗せると出る
- 同じ欄で隣り合った、同じ issue のサブイシューは、親の ID と題の見出しの下にまとまる（見出しを押すと親を開く）。親のカードは、親自身が今日の Calendar の日のときか、自分で載せたときだけ載る
- 星ボタン: 済み以外のカードの右（再生ボタンの前）。押すと Top 4 に入れ / 外す（付いているときは塗る）。4 件あるときは入れずに知らせる
- 記録の時刻を直すボタン（`history` のアイコン。色なしの小さい丸）: 再生 / 停止の左。押すと From / To の 2 欄のダイアログを開き、再生の押し忘れ・止め忘れを入力言語の日時（`-22m`、`2200`、`2200 -1d` など。時刻だけなら From は今より前、To は From より後のいちばん近いその時刻。[ADR-0228](../../../../src/docs/adr/0228-date-time-input-language.md)）かカレンダーと時計で直す。記録中なら To が空の再生で開始だけを直して続け、To を入れた停止で止める。記録していないなら再生で From から始め、停止で From〜To の記録を足す（[ADR-0193](../../../../src/docs/adr/0193-worklog-quick-edit.md)）。幅 480px 以下では隠し、`···` のメニューの Edit times から開く
- `···` のメニュー: Add to Top 4 / Remove from Top 4、Move up / Move down（同じ欄の中）、Open、Remove from board。PC では Top 4 と Up next の間と中をドラッグで並べ替えられ、Top 4 に落とすと ★ が付く。並びは翌日以降にも引き継ぎ、★ はその日だけ
- Add issue: issue を検索して載せるか、新しく作って載せる。今日が Calendar の日でないサブイシューも `i-12 › 題` の形で候補に出る。載せても日付は書かない（ADR-0152）
- status を変えると、右下に「N件のステータスが変更されました。 元に戻す ›」が 5 秒出て、まとめて取り消せる
- 未完了の一覧（Not done の欄）はない。未完了のカードは欄に出ているので、そこで片付ける（[ADR-0206](../../../../src/docs/adr/0206-closing-view-and-routine-category.md)）
- ボードの末尾の「Close board」で [Closing の画面](task-closing.md) に移り、右のペインにデイリーノートを開いて、本文の冒頭に振り返りの型を入れる。記録（`## Task board` 節）は Closing の画面の「Finish closing」で書く。0 時から締めの猶予の時刻（既定は 4 時）までは、前日のボードを締めていなければ、ボタンが `Close 11/23 MON` になって前日を締める（[ADR-0226](../../../../src/docs/adr/0226-closing-date-across-midnight.md)）。未完了のない前日のボードの自動の締めも、猶予が過ぎるまで待つ

## 使う概念

[task board](../concepts/task-board.md)、[ボードの欄と ★](../concepts/task-board-lane.md)、[status](../concepts/task-status.md)、[worklog とタイマー](../concepts/task-worklog.md)、[routine](../concepts/task-routine.md)、[委任先](../concepts/task-member.md)、[サブイシュー](../concepts/task-issue.md)

## 根拠

[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0015](../../../../src/docs/adr/0015-board-layout-simplified.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0020](../../../../src/docs/adr/0020-board-oplog.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0114](../../../../src/docs/adr/0114-board-manual-order.md)、[ADR-0137](../../../../src/docs/adr/0137-board-lanes-and-sub-issue-cards.md)、[ADR-0183](../../../../src/docs/adr/0183-status-transition-rules.md)、[ADR-0206](../../../../src/docs/adr/0206-closing-view-and-routine-category.md)、[ADR-0234](../../../../src/docs/adr/0234-routine-missed-carry.md)

## 入力と制約

Top 3 は 3 件まで。記録（Finish closing）は未完了が残っていても書けます。routine の結果は、その予定日の結果です（予定日に付けなかったものは、Today の Missed に積み残しとして出ます）。`missed: carry` の routine の積み残しは、今日のボードの Routines の先頭に、起点の日の印（注意の色）を付けて出ます。今日の結果で、それまでの積み残しがまとめて片付きます。過去の日のボードでは、結果のない carry の routine は持ち越しとして扱い、未完了に数えません（自動の締めを止めないため。ADR-0234）。

## 操作と保存

★・順番・追加と除外・routine の結果は board の操作ログへ追記します。issue の状態変更は frontmatter、作業時間は worklog に保存します。締めると daily の Task board 節へ要約を書きます。

## 失敗時と戻し方

状態変更直後は取り消しのトーストを使えます。外しすぎたカードは Add issue や Pick から載せ直します。ボードから除外しても元の issue は削除しません。

## 端末の違い

PC のドラッグに加えて Move up / Move down のメニューを使えます。スマホではカードのメニューから同じ並びを直します。
