# task board

- 種類: View（[Today](task-today.md) の最後の段階）
- 開き方: Today の段階「ボード」
- 場面: [朝の計画](../jobs/task-plan-day.md)、[作業しながら残す](../jobs/task-work.md)、[一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- 1 列のボード。欄は上から Working（タイマーが動いているもの）・Top 4（★ 今日の最重要。4 件まで）・Routines（routine だけ。issue・サブと混ぜない。開いたまま始め、見出しで開閉。すべて Close / Cancel したら欄ごと隠す。★ は付けられない）・Up next（残り。in-progress も open もここ）・Waiting（waiting / delegated。件数を出して開いたまま）・Done（片付いたもの。たたむ）。欄は status・タイマー・★ から自動で決まる
- カードは issue・サブイシュー・routine の 1 件ごと。1 行に status のバッジ（メニュー。`delegated…` も選べる）・題・再生 / 停止・`···` のメニューだけを出す。ID はマウスを乗せると出る
- 同じ欄で隣り合った、同じ issue のサブイシューは、親の ID と題の見出しの下にまとまる（見出しを押すと親を開く）。親のカードは、親自身が今日の Calendar の日のときか、自分で載せたときだけ載る
- 星ボタン: 済み以外のカードの右（再生ボタンの前）。押すと Top 4 に入れ / 外す（付いているときは塗る）。4 件あるときは入れずに知らせる
- `···` のメニュー: Add to Top 4 / Remove from Top 4、Move up / Move down（同じ欄の中）、Open、Remove from board。PC では Top 4 と Up next の間と中をドラッグで並べ替えられ、Top 4 に落とすと ★ が付く。並びは翌日以降にも引き継ぎ、★ はその日だけ
- Add issue: issue を検索して載せるか、新しく作って載せる。今日が Calendar の日でないサブイシューも `i-12 › 題` の形で候補に出る。載せても日付は書かない（ADR-0152）
- status を変えると、右下に「N件のステータスが変更されました。 元に戻す ›」が 5 秒出て、まとめて取り消せる
- 未完了の一覧: issue は Back to Next、Tickler、Move date（Calendar の日を持つものだけ）、Close、Cancel、Inbox。サブイシューは Back to Next、Close、Move date、Cancel（Tickler と Inbox はない）。持ち越したものはボードに残るが未完了に数えない
- 未完了が 0 になると「Close board」が押せる。デイリーノートの `## Task board` 節に要約が入る（サブイシューは `i-12 › 題`）

## 使う概念

[task board](../concepts/task-board.md)、[ボードの欄と ★](../concepts/task-board-lane.md)、[status](../concepts/task-status.md)、[worklog とタイマー](../concepts/task-worklog.md)、[routine](../concepts/task-routine.md)、[委任先](../concepts/task-member.md)、[サブイシュー](../concepts/task-issue.md)

## 根拠

[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0015](../../../../src/docs/adr/0015-board-layout-simplified.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0020](../../../../src/docs/adr/0020-board-oplog.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)、[ADR-0114](../../../../src/docs/adr/0114-board-manual-order.md)、[ADR-0137](../../../../src/docs/adr/0137-board-lanes-and-sub-issue-cards.md)

## 入力と制約

Top 3 は 3 件まで。未完了が残る間は Close board を押せません。routine の結果は当日の結果です。

## 操作と保存

★・順番・追加と除外・routine の結果は board の操作ログへ追記します。issue の状態変更は frontmatter、作業時間は worklog に保存します。締めると daily の Task board 節へ要約を書きます。

## 失敗時と戻し方

状態変更直後は取り消しのトーストを使えます。外しすぎたカードは Add issue や Pick から載せ直します。ボードから除外しても元の issue は削除しません。

## 端末の違い

PC のドラッグに加えて Move up / Move down のメニューを使えます。スマホではカードのメニューから同じ並びを直します。
