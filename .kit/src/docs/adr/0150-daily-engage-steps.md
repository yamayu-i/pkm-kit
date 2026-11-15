# ADR-0150: DailyTaskView を GTD の Engage に合わせ、段階を整理して Next から選べるようにする

- 状態: 提案
- 日付: 2026-11-15

## 背景

DailyTaskView（Today。[ADR-0009](0009-views.md)）は、Overdue → Previous boards → Due soon → Board の 4 段階を順に片付ける画面。[ADR-0148](0148-inbox-clarified.md) で、日付のない Next Actions（`open` で `clarified` で `scheduled` がない issue）ができる。GTD の Engage は、Calendar の確定分を見たうえで、Next Actions から文脈・時間・優先度で選ぶ。いまの Daily には Next から選ぶ段階がなく、ボードの「Add issue」の候補（全 active issue の平らな一覧。Inbox も混ざる）しかない。

あわせて、今の Daily の段階と操作に無駄がある（`DailyView.tsx`）。

1. Overdue と Due soon が、同じ部品（`DueStep`）・同じ 2 つの表（deadline / soft_deadline）・同じ操作の別々の段階
2. 「Later (skip)」と「Next」が同じ関数（`next`）を呼ぶ。ラベルが違うだけ
3. 「Do Today」が Due soon にしか出ない（`canScheduleToday`）。期限切れを今日やるには、Add Do Date から今日を選び直すしかない
4. Previous boards が、issue・サブ・routine を別々の `map` で描く。ボードが 2 つ以上あると、日付ごとにまとまらず種類ごとに並ぶ
5. 段階の状態が `auto` / `manual` / `passed` と、段階ごとの特例（caution は片付けなくても進める）で複雑

## 決定

### 段階

4 段階のまま、内容を次にする。

| 段階 | 中身 | GTD |
|---|---|---|
| Due | Overdue（期限切れ）と Due soon（3 日以内）。上に Overdue、下に Due soon。それぞれ deadline / soft_deadline の 2 つの表 | Calendar の確定分を先に見る |
| Previous boards | 締めていない過去のボードの未完了。ボードの日付ごとに、issue・サブ・routine を 1 か所にまとめる | 昨日の残りを処理する |
| Pick（新設） | Next を一覧にし、選んでボードに載せる | Next Actions から選ぶ |
| Board | 今日のボード（ADR-0137 のまま） | 実行 |

- 件数のある段階を順に通る。「Next」ボタンで飛ばせる。段階表示から、いつでも移れる
- 「Later (skip)」を削除し、「Next」だけにする（同じ動作）
- Due の 4 つの表すべてに「Do Today」を出す
- 段階の状態は `passed`（飛ばした段階）と `manual`（手で選んだ段階）の 2 つにし、「片付けなくても進める」特例をなくす（どの段階も「Next」で飛ばせるので、特例は要らない）

### Pick

- 対象: Next（ADR-0148。`open` で、`clarified` で、`scheduled` に今日以降の日付がない）のうち、今日のボードにない issue。サブは対象にしない（サブは親の画面とボードの「Add issue」から載せる）
- 並び順: priority の高い順 → deadline が近い順 → 最後に見直してから（`reviewed`）古い順
- 列: priority、summary、estimated、label、deadline、最後に見直してからの日数（古い Next に気づくため）
- 操作: Add to board（主。今日のボードに載せる。`scheduled` は書かない）、Someday、Cancel、Inbox（`clarified` を外す。日付は残す）
- 絞り込みは、一覧の既存の仕組み（label・テキスト）を使う。新しい項目は足さない。体力・文脈の専用項目は持たない
- Pick を見ただけでは `reviewed` を更新しない。操作したときだけ、既存の操作が `reviewed` を書く
- 「Add issue」（候補の一覧）は残す。サブと新規作成のために使う。issue の候補は Pick と重なるが、Next 以外（日付のある issue など）を載せるために必要

### Inbox 操作の意味

- Due と Previous boards の「Inbox」は、ADR-0148 の意味（`clarified` を外す。日付は残す）になる。ラベルは変えない

## 理由

- Overdue と Due soon は、見るもの（期限）も操作も同じ。分ける意味は「過ぎたか、近いか」だけなので、1 段階の中の上下で足りる。段階が 1 つ減ると、「Next」を押す回数も減る
- 「Later (skip)」は「Next」と同じ動作なので、ボタンを 2 つ並べる意味がない
- 期限切れを今日やりたいときに、Do Today が使えないのは不自然（期限切れこそ今日やる候補）
- Pick を段階にするのは、GTD の Engage（Next から選ぶ）が、毎朝の流れの中にあるべきだから。独立した画面にすると、見直す習慣にならない
- 古さを Pick の一覧に出すのは、日付のない Next が、Inbox にも Due にも出ず、見直しから漏れやすいため。毎日見る画面で気づける。体系的な見直しは Weekly Review（#151）の仕事として残す
- 段階の数は変えない（4 → 4）。減らした 1 段階を Pick で埋める形なので、毎朝の手数は増えない

## 却下した案

- **Overdue と Due soon を別々の段階のまま、Do Today だけ足す**: 操作の抜けは直るが、同じ部品の重複が残る
- **Pick を段階にせず、「Add issue」の候補を並べ替える**: 候補はモーダルで、一覧として見渡せず、古さや見積もりも出せない
- **Pick で `scheduled` を今日にする**: ボードに載せた記録は、日ごとの操作ログがすでに持っている。既存の「Add issue」も `scheduled` を書かないので、Pick もそろえる。書くと「今日やる」を二重に持ち、日付が過去になっても issue に残る。書く案にも、Daily の「Do Today」と意味がそろう利点はあるが、既存の挙動との一貫性を取る
- **文脈・体力の専用項目を足す**: 今の利用実態を確かめていない。label・estimated・priority で足りるか、使ってから判断する
- **Weekly Review を Daily に統合する**: Daily は今日の選択の場。選ばれなかったものの健全性は、全体を一度に見る場（#151）でないと確かめられない

## 影響

- 変更するもの: `views/DailyView.tsx`（段階、Due、Previous boards、Pick）、`core/daily.ts`（Next の算出、Due のまとめ）、`core/stepper.ts` とそのテスト（段階の数と特例）、`views/Board.tsx` の「Add issue」の候補（Next を除く）、`ui/IssueTable.tsx`（Pick の列）、`styles.css`、`docs/design.md`（部品の表）、プロダクトの文書（`task-plan-day.md`、`surfaces/task-today.md`、`task-sidebar.md` の件数）、`preview/fixture.tsx`
- 前提: ADR-0148（`clarified`、Next の算出）。ADR-0148 の実装のあとに着手する
- 移行は要らない（データの形は変わらない）。`.kit/changes/` に変更のノートを書く
- Daily の表示が変わる。段階表示の「Due soon」が「Due」に統合され、Pick が増える。段階の数は変わらない
