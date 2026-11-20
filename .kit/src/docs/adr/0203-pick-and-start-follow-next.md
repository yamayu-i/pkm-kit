# ADR-0203: issue 画面の Pick と Start を Next に沿わせ、Calendar とサブを同時に持たせない

- 状態: 承認（一部置換: 0210）
- 日付: 2026-11-17

## 背景

着手までの順は「Inbox →（Clarify）→ Next → Pick → Start」と考えているが、issue 画面ではどの段階も飛ばせる（#203）。

- status のボタンの Start（open → in-progress。[ADR-0183](0183-status-transition-rules.md)）が、今日のボードに載せていない issue・サブにも出る。整理と Pick を飛ばして着手する癖がつきやすい
- issue 画面の Pick（[ADR-0165](0165-issue-screen-pick-and-reading.md)）は、Next でないもの（Inbox・someday・Calendar・Tickler、未来の開始日のサブ）でも、変更する項目を確認のダイアログで示し、Next に書き換えてから載せる。実際には使わず、ノイズになっている
- サブの Next（`isNextSub`。[ADR-0184](0184-pick-in-progress-and-watch-lane.md)）は、`start` が未来のものだけを外す。期間のないサブと、`end` を過ぎたサブも Next に入るので、Timeline の計画と今日やるものが食い違う。親が Next かどうかも見ない（Inbox の親のサブも候補になる）
- `scheduled`（Calendar。その日にやらなければならない日。[ADR-0152](0152-calendar-and-tickler.md)）を持つ issue にもサブを作れる。何日もかかる作業はサブの期間（`start`・`end`）で表すので、意味が重なる
- DailyTaskView の Pick（[ADR-0150](0150-daily-engage-steps.md)）は、active なサブを持つ issue（Project）を行にせず、Next のサブの見出しとしてだけ出す。Next のサブが 1 つもないと、Project が Pick の段階から消える。上のサブの Next を絞ると、これが起きやすくなる

## 決定

### サブの Next

- `isNextSub(sub, parent, today)` を「status が open か in-progress で、`scheduled` がなく、親が Next（`isNext`）で、今日が期間に入っている」にする
- 期間は `start`〜`end`（両端の日を含む）。片方だけなら、その 1 日（Timeline の棒と同じ。ADR-0143）。期間のないサブは Next に入らない
- 期間のほかは Next の条件を満たすサブ（期間がない・今日が期間の外）を、「期間を決めれば Next になるサブ」（`needsPeriod`）と呼ぶ
- 判定は `core/index.ts` の 1 か所に置き、issue 画面の Pick と DailyTaskView の Pick の候補の両方が使う（ADR-0184 の「条件を Pick の中に書かない」を保つ）

### issue 画面の Pick とタイマーのボタン

issue のヘッダー、上部のサブ一覧、本文のサブカードの同じ位置に、次の順で 1 つだけ出す（`pickTimerControl`）。

| 条件 | 出すもの |
|---|---|
| 記録中 | 停止 |
| closed・canceled・waiting・delegated・someday | なし |
| 今日のボードに載っている | 再生（タイマー） |
| Next（issue は `isNext`、サブは `isNextSub`） | Pick（今日のボードに載せるだけ。項目は書き換えない） |
| `needsPeriod` のサブ | Timeline |
| それ以外（Inbox・Calendar・Tickler の issue、Next でない親のサブなど） | なし |

- ADR-0165 の、Next でないものを確認して Next に書き換えてから Pick する動き（`pickIssuePatch`・`pickSubPatch` と確認のダイアログ）をなくす。Next でないものを Pick したいときは、先に Organize・Clarified のチップ・Back to Next などで Next にする
- Timeline のボタンは何も書き換えない。親の issue 画面の Sub-issues のカードを Timeline に切り替え、そのサブの行を目立たせて画面に入れる。期間を引き直したら、List に戻して Pick する（Timeline の題の列には Pick を出さない。横幅が足りないため）
- someday はこれまで Pick で open に戻せたが、それもなくす（Reopen は status のボタンで行う）

### status のボタンの Start

- open のときの Start（→ in-progress）は、今日のボードに載っているものにだけ出す。ボードのカードは載っているので、これまでどおり出す
- status のメニューは変えない。open からも in-progress を選べる（遷移表は status だけで決め、ボードに依存させない）
- ほかの status のボタン（Close・Resume・Reopen・↩）は変えない

### Calendar とサブを同時に持たせない

- `scheduled` を持つ issue は、サブを持たない。issue 画面の Sub-issues のカードを、見出し・追加・プリセットのボタンごと出さない
- サブを持つ issue（closed・canceled のサブも含めて 1 つでもあれば）は、`scheduled` を持たない。issue 画面の Calendar の欄（7 日のセルと calendar >）を出さない。Tickler の欄は残す
- 書き込みでも止める。Obsidian の書き込み（issue の更新、サブの追加、プリセット）と MCP（`update_issue` の `scheduled`、`create_sub_issue`、`carry_over` の reschedule）は、エラーにして理由を返す。Organize の Calendar のボタンは、サブを持つ issue では押せなくする
- すでに両方を持つ issue（外で編集したものなど）は、両方を表示したまま、lint が `calendar-with-subs`（警告）で知らせる。データがあるのに見えなくなるのを避ける。自動では消さない（移行は付けない）

### DailyTaskView の Pick: 次の行動のない Project

- サブを主にする形（ADR-0150）は変えない。Project 本体は Pick の行にしない
- Next の Project のうち、Next のサブが 1 つもないもの（今日のボードに載っているものも含めて）を、「Projects without a next action」の欄に 1 行ずつ出す。操作は issue 画面を開く（Open）だけ。件数は Pick の段階の件数に含める
- サブの候補は、新しい `isNextSub` で選ぶ（期間の外のサブと、Next でない親のサブは出ない）

## 理由

- 着手までの順を画面のボタンに固定すると、整理と Pick を飛ばす癖がつかない。status のメニューを逃げ道として残すので、例外の操作はできる
- Pick を Next だけにすると、Pick は「今日やるものを Next から選ぶ」だけの操作になる。Next にする判断（整理）を、ダイアログの確認で済ませない
- サブの Next を期間で決めると、Timeline の計画と今日やるものがそろう。期間の外のサブを勝手に書き換えず、計画を見直す場所（Timeline）に案内する。ユーザーが意図しない入力をしない
- Calendar は「その日にやらなければならない」1 つの行動で、何日もかかる作業はサブの期間で表す（ADR-0152）。同じ issue に両方を持たせると、どちらで計画しているのかが分からない
- どの一覧からも消える issue を作らない（ADR-0148・0152）。次の行動のない Project は、GTD の週次レビューで必ず見つけて直すもの

## 却下した案

- **Next でないものも、確認のダイアログで Next にしてから Pick する（ADR-0165 のまま）**: 使われず、ノイズになっている
- **期間の外のサブを Pick するとき、今日を期間に入れるダイアログを出す**: 計画をユーザーの意図しない値で書き換える。何もせず Timeline に移る
- **Timeline の題の列にも Pick を出す**: 横幅が足りない。List に戻して Pick すれば足りる
- **status のメニューでも、ボードに載っていない open を in-progress にできなくする**: 遷移表がボードに依存し、MCP を含めて規則が複雑になる
- **issue 画面の Pick のボタンだけに期間の条件を足し、Daily の候補は今のままにする**: Daily では Pick できるのに issue 画面ではできないサブが出る。Next の意味が 2 つになる
- **サブを持つ issue に Calendar を許し、そのサブを Calendar の日だけ Pick できるようにする**: 例外の規則が増える。Calendar の意味（1 つの行動）とも合わない
- **Project 本体を Daily の Pick の行にする**: Project は行動ではないので、選んでも何をするか決まらない（ADR-0150）

## 影響

- 変更するもの: `core/index.ts`（`isNextSub`・`needsPeriod`・`inPeriod`）、`core/pick.ts`（`pickTimerControl`、`pickIssuePatch`・`pickSubPatch` の削除）、`core/daily.ts`（`pickCandidates` の Project）、`core/calendar-subs.ts`（新規。排他の判定とエラーの文）、`core/lint.ts`、`obsidian/pick-toggle.tsx`、`obsidian/status-change.tsx`、`obsidian/writer.ts`、`header/IssueHeader.tsx`・`SubIssues.tsx`・`SubTimeline.tsx`・`sub-timeline-reveal.ts`（新規）、`views/Board.tsx`・`DailyView.tsx`・`OrganizeView.tsx`、`cli/vault-ops.ts`・`cli/mcp.ts`、プロダクトの文書、`task-coach` スキル
- 状態を「一部置換: 0203」にする: ADR-0150（Pick の Project とサブの候補）、0152（`scheduled` とサブ）、0165（Next でないものの Pick）、0183（Start のボタン）、0184（サブの Next）
- 子の Vault の issue の frontmatter は変えない（移行はない）。両方を持つ issue は lint が知らせる。子から見える変更なので `.kit/changes/` に書く
