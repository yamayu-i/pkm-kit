# ADR-0255: 今日の Calendar をボードの最上部の欄に出し、サブの Calendar と期間を両立させない

- 状態: 提案
- 日付: 2026-11-27

## 背景

`scheduled`（Calendar。その日にやらなければならない日。[ADR-0152](0152-calendar-and-tickler.md)）が今日の issue とサブは、自動で今日のボードに載る（ADR-0034）。ただ、載ったカードはほかのカードと同じく Next の欄（[ADR-0137](0137-board-lanes-and-sub-issue-cards.md)）に混ざる。Pick で「今日やる」と選んだだけのものと、その日にやらなければならないものを見分けられない。

Calendar のものは Pick に出ない（`isNext`・`isNextSub` が `scheduled` を除く。[ADR-0184](0184-pick-in-progress-and-watch-lane.md)、[ADR-0203](0203-pick-and-start-follow-next.md)）。この点は変えない。

サブは `scheduled` と期間（`start`・`end`。[ADR-0245](0245-sub-period-pair-and-range-dialog.md)）を両方持てる。

- Calendar のサブは Pick に出ないので、期間を持っても Pick の候補には効かない。期間は「この間に進める」、Calendar は「この日にやる」で、同じサブに両方あると、いつやるのかが 2 つの答えになる
- ガント（Timeline。[ADR-0143](0143-sub-issue-timeline.md)）は、期間があると Calendar の印を出さない。Calendar のサブの行で日を押すと、期間ができてしまう

ADR-0203 は、issue について「`scheduled` とサブ（期間）を両立させない」と決めた。サブにも同じ考え方を当てる。

## 決定

### ボードの Calendar の欄

- 欄の並びを Calendar → Working → Top 4 → Routines → Next → Watch → Done にする（`LANES` の先頭に `calendar`）
- Calendar の欄には、ボードに載っているカードのうち、`scheduled` がそのボードの日の issue とサブを出す
- 欄の決め方（`laneOf`）は routine → Working（記録中）→ Done（片付いた）→ Watch（waiting / delegated）→ **Calendar** → Top 4 → Next の順で、最初に当たったもの。記録中なら Working、片付いたら Done に移る（Working・Done・Watch の意味を変えない）
- Calendar の欄のカードは、ドラッグ・★（Add to Top 4）・Move up / down を出さない（routine の欄と同じく、手で並べる欄ではない）。並びは載せた順。Remove from board は残す（その日にボードから外したものは載せ直さない。ADR-0152）
- 欄は、カードがあるときだけ出す。見出しは `Calendar`、件数は枚数
- ボードが空のときの説明の「today's Do Date」を「today's Calendar date」にする

### サブは Calendar か期間のどちらか一方

- サブは `scheduled` と期間（`start`・`end`）を同時に持たない
- Edit のダイアログと本文のカードの日付の欄（`SubDateFields`）: `scheduled` があれば Period のチップを押せなくし、期間があれば Calendar のチップを押せなくする。押せない理由を `title` で出す（「Calendar の日があるサブは期間を持てません。Calendar を外すと設定できます」など）
- ガント: `scheduled` のあるサブは、棒を出さず、その日に Calendar の印を出す（今の点。期間があっても出す）。行で日を押しても期間を作らず、印もドラッグしない。行の `title` で理由を出す
- 書き込みでも止める: `core/calendar-subs.ts` に `subCalendarPeriodError(after)` を置き、Obsidian の書き込み（`writer.updateSub`・サブの追加）と MCP（`create_sub_issue`・`update_sub_issue`）は、書いた後のサブが両方を持つならエラーにして理由を返す
- 消す操作（Back to Next、Pick の `pickSubPatch`、someday、一括で日付を消す）はこれまでどおりで、両方を持つ状態を作らない

### 既に両方を持つサブ

- データは消さない。lint が警告（`sub-calendar-and-period`）を出し、ユーザーがどちらかを外す
- ガントは Calendar の印を出し、棒は出さない（Calendar を優先する。Pick に出ないので、実際の扱いは Calendar だから）
- 移行 `.kit/migrations/0255-sub-calendar-or-period/`: `migrate.mjs` は何も変えない。`check.mjs` は両方を持つサブを報告する。README に、どちらを残すかをユーザーに確かめて外す手順を書く

## 理由

- その日にやらなければならないもの（ハードランドスケープ）は、ほかの作業より先に目に入るべき。最上部に固定し、Top 4（自分で選んだ今日の最重要）とも分ける
- 記録中・片付いたものは、今の欄（Working・Done）に移す。Calendar の欄を「まだ手を付けていない、今日やらなければならないもの」にしておくと、残りが一目で分かる
- サブの Calendar と期間は、いつやるかの答えが 2 つになる。Pick も Calendar を優先している（期間を見ない）ので、画面と書き込みも Calendar か期間のどちらかにそろえる。ADR-0203 の issue の規則と同じ形になる
- 既存のデータを移行で消さないのは、どちらが正しいかを機械では決められないから

## 却下した案

- **Calendar の欄を Top 4 と Routines の間に置く**: ユーザーは、その日にやらなければならないものを最初に見たい
- **記録中・片付いた Calendar のカードも Calendar の欄に残す**: Working と Done の意味（いま動いているもの・終わったもの）が欄によって変わる
- **Calendar のカードにも ★ を付けられるようにする**: 2 つの欄に同じカードが出るか、どちらかに寄せる規則が要る。Calendar はそれだけで今日やることが決まっている
- **期間のあるサブに Calendar を付けたら期間を消す（逆も）**: 黙ってデータを消す。押せなくして理由を見せるほうが、何が起きたかが分かる
- **移行で期間（または Calendar）を消す**: どちらが正しいかはユーザーにしか分からない

## 影響

- 変更するもの: `core/board-lanes.ts`（`calendar` の欄と `laneOf`）、`views/Board.tsx`（欄の見出し・並び・メニュー・空の説明）、`core/calendar-subs.ts`（`subCalendarPeriodError`）、`core/sub-issue.ts`（lint の `sub-calendar-and-period`）、`obsidian/sub-editor.tsx`（日付の欄）、`header/SubTimeline.tsx`（印と、期間を作らせない）、`obsidian/writer.ts`、`cli/vault-ops.ts`、ボードの CSS
- 文書: プロダクトの `surfaces/task-board.md`・`task-issue-screen.md`、`concepts/task-do-date.md`
- 移行 `.kit/migrations/0255-sub-calendar-or-period/` と `.kit/changes/` の変更のノート
- 承認のとき、ADR-0137（ボードの欄）と ADR-0245（サブの日付の欄）の状態を「一部置換: 0255」にする
