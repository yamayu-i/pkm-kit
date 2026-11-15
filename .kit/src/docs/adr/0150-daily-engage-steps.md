# ADR-0150: DailyTaskView を GTD の Engage に合わせ、段階を整理して Next から選べるようにする

- 状態: 提案
- 日付: 2026-11-15

## 背景

DailyTaskView（Today。[ADR-0009](0009-views.md)）は、Overdue → Previous boards → Due soon → Board の 4 段階を順に片付ける画面。[ADR-0148](0148-inbox-clarified.md) で日付のない Next Actions ができ、[ADR-0152](0152-tickler-replaces-scheduled.md) で `scheduled`（Do Date）が廃止されて Tickler（その日まで出さない）に置き換わる。GTD の Engage は、Calendar（確定した日付のもの）を先に見て、Next Actions から文脈・時間・優先度で選ぶ。いまの Daily には Next から選ぶ段階がなく、ボードの「Add issue」の候補（全 active issue の平らな一覧。Inbox も混ざる）しかない。

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
| Calendar | 期限切れ（Overdue）、期限が近い（Due soon。3 日以内）、日付が来た Tickler の 3 つの表。期限の表は、これまでどおり deadline / soft_deadline に分ける | Calendar（確定した日付）を先に見る |
| Previous boards | 締めていない過去のボードの未完了。ボードの日付ごとに、issue・サブ・routine を 1 か所にまとめる | 昨日の残りを処理する |
| Pick（新設） | Next を一覧にし、選んで今日のボードに載せる | Next Actions から選ぶ |
| Board | 今日のボード（[ADR-0137](0137-board-lanes-and-sub-issue-cards.md) のまま。自動で載るものはなくなる） | 実行 |

- 件数のある段階を順に通る。「Next」ボタンで飛ばせる。段階表示から、いつでも移れる
- 「Later (skip)」を削除し、「Next」だけにする（同じ動作）
- 段階の状態は `passed`（飛ばした段階）と `manual`（手で選んだ段階）の 2 つにし、「片付けなくても進める」特例をなくす（どの段階も「Next」で飛ばせるので、特例は要らない）

### 各段階の操作

`scheduled` の廃止（ADR-0152）で、Do Today / Do Tomorrow / Add Do Date / Move Do Date はなくなる。

| 段階 | 操作 |
|---|---|
| Calendar の期限の表 | Add to today's board（主。期限切れの表にも出す）、Change Deadline / Change Soft Deadline、Tickler、Cancel、Inbox |
| Calendar の Tickler の表 | Add to today's board（主）、To Next、Tickler（日付を選び直す）、Someday、Cancel、Inbox。どれも `tickler` を消すか置き換える |
| Previous boards | Add to today's board（主）、Back to Next（持ち越して Next に戻す）、Tickler（既定は明日）、Close、Cancel、Inbox。持ち越しはボードの `carry` で記録する |
| Pick | Add to board（主）、Tickler、Someday、Cancel、Inbox |

- 「Inbox」は ADR-0148 の意味（`clarified` を外す。日付は残す）
- Add to today's board は、どの段階でも日付を書かない

### Pick

- 対象: 今日のボードにない、次の 2 つ
  - Next の issue（ADR-0148。`open` で、`clarified` で、`tickler` がない）
  - `open` のサブのうち、`start` がないか今日以前のもの。親が active なものだけ。親の題を `i-12 › 題` の形で添える
- 並び順: priority の高い順 → deadline が近い順 → 最後に見直してから（`reviewed`）古い順。サブは親の priority・deadline を使い、同じ親のサブは隣り合わせる
- 列: priority、summary、estimated、label、deadline、最後に見直してからの日数（古い Next に気づくため）
- 絞り込みは、一覧の既存の仕組み（label・テキスト）を使う。新しい項目は足さない。体力・文脈の専用項目は持たない
- Pick を見ただけでは `reviewed` を更新しない。操作したときだけ、既存の操作が `reviewed` を書く
- 「Add issue」（候補の一覧）は残す。新規作成と、Next 以外（Inbox のもの、Tickler で隠れているものなど）をあえて載せるために使う

## 理由

- Overdue と Due soon は、見るもの（期限）も操作も同じ。分ける意味は「過ぎたか、近いか」だけなので、1 段階の中の表で足りる。日付が来た Tickler も「確定した日付のもの」なので、同じ段階に置く
- 「Later (skip)」は「Next」と同じ動作なので、ボタンを 2 つ並べる意味がない
- 期限切れを今日やりたいときに、今日のボードへ載せる操作が出ないのは不自然（期限切れこそ今日やる候補）
- Pick を段階にするのは、GTD の Engage（Next から選ぶ）が、毎朝の流れの中にあるべきだから。独立した画面にすると、見直す習慣にならない
- 古さを Pick の一覧に出すのは、日付のない Next が、Inbox にも Calendar にも出ず、見直しから漏れやすいため。毎日見る画面で気づける。体系的な見直しは Weekly Review（#151）の仕事として残す
- サブを Pick に含めるのは、`scheduled` の廃止でサブがボードに載る経路が「Add issue」だけになるため。プロジェクトの次の行動（サブ）を、単発の行動と同じ場所で選べる
- 段階の数は変えない（4 → 4）。減らした 1 段階を Pick で埋める形なので、毎朝の手数は増えない

## 却下した案

- **Overdue と Due soon を別々の段階のまま、操作の抜けだけ直す**: 同じ部品の重複が残る
- **Pick を段階にせず、「Add issue」の候補を並べ替える**: 候補はモーダルで、一覧として見渡せず、古さや見積もりも出せない
- **文脈・体力の専用項目を足す**: 今の利用実態を確かめていない。label・estimated・priority で足りるか、使ってから判断する
- **Weekly Review を Daily に統合する**: Daily は今日の選択の場。選ばれなかったものの健全性は、全体を一度に見る場（#151）でないと確かめられない
- **サブを Pick に出さず、親の issue だけを出す**: 親（Project）は行動ではないので、選んでも何をするか決まらない

## 影響

- 変更するもの: `views/DailyView.tsx`（段階、Calendar、Previous boards、Pick）、`core/daily.ts`（Next とサブの候補の算出、Calendar のまとめ）、`core/stepper.ts` とそのテスト（段階の特例）、`views/Board.tsx` の「Add issue」の候補、`ui/IssueTable.tsx`（Pick の列）、`obsidian/board-actions.ts`（Back to Next）、`styles.css`、`docs/design.md`（部品の表）、プロダクトの文書（`task-plan-day.md`、`surfaces/task-today.md`、`task-sidebar.md` の件数）、`preview/fixture.tsx`
- 前提: ADR-0148（`clarified`、Next）と ADR-0152（`tickler`、`scheduled` の廃止）。実装の順は 0148 → 0152 → 0150
- 移行は要らない（データの形は変わらない）。`.kit/changes/` に変更のノートを書く
- Daily の表示が変わる。段階表示の「Overdue」「Due soon」が「Calendar」に統合され、Pick が増える。段階の数は変わらない
