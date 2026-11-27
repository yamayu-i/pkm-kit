# ADR-0255: 今日の Calendar をボードの最上部の欄に出し、サブの Calendar と期間を両立させない

- 状態: 承認
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
- ガント（Timeline）で、Calendar を置く・動かす・1 日の期間と切り替える:
  - `scheduled` のあるサブは、棒を出さず、その日のマスに Calendar の印（1 日幅の菱形。今の小さい点を置き換える）を出す。期間があっても印を優先する
  - 印は棒と同じく、ドラッグか ← → キーで日を動かす（`scheduled` を書き換える）。端のつまみ（長さを変える）と依存の矢印のつなぎ口は持たない
  - **1 日の棒 → Calendar**: 1 日の棒の右クリック（モバイルは長押し）のメニューの「Make Calendar」か、棒にフォーカスして `C` キーで、その日を `scheduled` にして期間を消す（1 回の書き込み）
  - **Calendar → 1 日の棒**: 印のメニューの「Make 1-day period」か `C` キーで、その日を `start`・`end` にして `scheduled` を消す（1 回の書き込み）
  - 2 日以上の棒のメニューでは「Make Calendar」を押せなくし、「Calendar は 1 日だけ。棒を 1 日に縮めると切り替えられます」と出す（どの日にするかを黙って決めない）
  - 何もない行で日を押すと、これまでどおり 1 日の棒を作る。Calendar にしたければ、そのまま切り替える
  - 切り替えと印の移動は、期間と同じ規則で止める: Inbox の Project（ADR-0210）では動かせず、理由を出す。期間にするときは `subPeriodError`（Tickler より前に置けない）も見る
  - 依存の矢印（`dependsOn`）は期間の棒どうしの関係なので、Calendar のサブには矢印を引かない（依存のデータは消さない。1 日の棒に戻すと、また引く）
- 書き込みでも止める: `core/calendar-subs.ts` に `subCalendarPeriodError(after)` を置き、Obsidian の書き込み（`writer.updateSub`・サブの追加）と MCP（`create_sub_issue`・`update_sub_issue`）は、書いた後のサブが両方を持つならエラーにして理由を返す
- 消す操作（Back to Next、Pick の `pickSubPatch`、someday、一括で日付を消す）はこれまでどおりで、両方を持つ状態を作らない

### issue 画面と Projects 画面

- ガントの描画と操作は、issue 画面の Timeline と Projects（[ADR-0231](0231-projects-timeline-and-load.md)）で共通の `TimelineChart` に入れる。上の操作は、どちらの画面でも同じに使える
- 棒に描く期間は `periodBarOf(sub)`（`scheduled` があれば null、なければ `barOf`）にする。依存の矢印・つなげるかの判定（`canConnect`）・棒のドラッグもこれを使う
- Projects の計算では、Calendar のサブを「その 1 日にかかるサブ」として数える。`core/timeline.ts` に `daysOf(sub)`（`scheduled` があれば `{ start: scheduled, end: scheduled }`、なければ `barOf`）を置き、次で使う:
  - Project の行のまとめの棒（サブの日の最小〜最大）
  - 負荷の行（`loadItems`）: 見積もりをその 1 日に数える。見積もりのないものは、その日の `?` に数える
  - 見積もりのない印（`needsEstimate`）: その日が今日から 14 日のうちなら出す
  - Project の並び（閉じていないサブの終わりのいちばん早い日）

### 既に両方を持つサブ

- データは消さない。lint が警告（`sub-calendar-and-period`）を出し、ユーザーがどちらかを外す
- ガントは Calendar の印を出し、棒は出さない（Calendar を優先する。Pick に出ないので、実際の扱いは Calendar だから）
- 移行 `.kit/migrations/0255-sub-calendar-or-period/`: `migrate.mjs` は何も変えない。`check.mjs` は両方を持つサブを報告する。README に、どちらを残すかをユーザーに確かめて外す手順を書く

## 理由

- その日にやらなければならないもの（ハードランドスケープ）は、ほかの作業より先に目に入るべき。最上部に固定し、Top 4（自分で選んだ今日の最重要）とも分ける
- 記録中・片付いたものは、今の欄（Working・Done）に移す。Calendar の欄を「まだ手を付けていない、今日やらなければならないもの」にしておくと、残りが一目で分かる
- サブの Calendar と期間は、いつやるかの答えが 2 つになる。Pick も Calendar を優先している（期間を見ない）ので、画面と書き込みも Calendar か期間のどちらかにそろえる。ADR-0203 の issue の規則と同じ形になる
- 既存のデータを移行で消さないのは、どちらが正しいかを機械では決められないから
- 1 日の棒と Calendar は、どちらも「その 1 日」で、違うのは「やらなければならない（Calendar）」か「この日に進める（期間）」かだけ。ガントで日を決めながら、そのまま意味を切り替えられると、Edit のダイアログを開かずに済む。切り替えを 1 回の書き込みにするのは、途中で両方を持つ状態や、どちらもない状態を作らないため

## 却下した案

- **Calendar の欄を Top 4 と Routines の間に置く**: ユーザーは、その日にやらなければならないものを最初に見たい
- **記録中・片付いた Calendar のカードも Calendar の欄に残す**: Working と Done の意味（いま動いているもの・終わったもの）が欄によって変わる
- **Calendar のカードにも ★ を付けられるようにする**: 2 つの欄に同じカードが出るか、どちらかに寄せる規則が要る。Calendar はそれだけで今日やることが決まっている
- **期間のあるサブに Calendar を付けたら期間を消す（逆も）**: 黙ってデータを消す。押せなくして理由を見せるほうが、何が起きたかが分かる
- **移行で期間（または Calendar）を消す**: どちらが正しいかはユーザーにしか分からない
- **棒をクリックするたびに 1 日の棒と Calendar を切り替える**: クリックは選択（依存の矢印）とドラッグの始まりに使っている。誤って切り替わる
- **2 日以上の棒も Calendar にでき、始まりの日を使う**: どの日にするかを黙って決めることになる。終わりの日のほうが正しい場合もある
- **何もない行で Alt + クリックしたら Calendar を作る**: 修飾キーはモバイルで使えず、見つけにくい。作ってから切り替えれば足りる

## 影響

- 変更するもの: `core/board-lanes.ts`（`calendar` の欄と `laneOf`）、`views/Board.tsx`（欄の見出し・並び・メニュー・空の説明）、`core/calendar-subs.ts`（`subCalendarPeriodError`）、`core/sub-issue.ts`（lint の `sub-calendar-and-period`）、`obsidian/sub-editor.tsx`（日付の欄）、`header/SubTimeline.tsx`（印・切り替え・期間を作らせない）、`core/timeline.ts`（`periodBarOf`・`daysOf`）、`core/projects.ts`（Projects の計算）、`obsidian/writer.ts`、`cli/vault-ops.ts`、ボードの CSS
- 文書: プロダクトの `surfaces/task-board.md`・`task-issue-screen.md`、`concepts/task-do-date.md`
- 移行 `.kit/migrations/0255-sub-calendar-or-period/` と `.kit/changes/` の変更のノート
- ADR-0137（ボードの欄）、0143（Timeline）、0231（Projects の計算）、0245（サブの日付の欄）の状態を「一部置換: 0255」にした
