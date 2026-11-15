# ADR-0152: scheduled（Do Date）を廃止し、Tickler を専用の項目にする

- 状態: 提案
- 日付: 2026-11-15

## 背景

`scheduled`（Do Date。日付のリスト）は、「その日にやる」と決めた日を持ち、その日のボードに自動で載せる（[ADR-0034](0034-duration-input-auto-board-sticky-groups.md)）。[ADR-0148](0148-inbox-clarified.md)（Inbox を `clarified` で決める）と [ADR-0150](0150-daily-engage-steps.md)（Daily で Next から選ぶ）を GTD に合わせて決めると、`scheduled` の役割はほとんど他に移る。

| 役割 | 置き換え |
|---|---|
| 朝に今日やるものを決める（Organize の Do Date、Do Today、ボードへの自動追加） | Daily の Pick とボード（ADR-0150）。GTD の Engage は、その日に Next から選ぶ |
| 先の日に予定を積む（Scheduled 画面、複数日、issue 画面の 7 日ストリップ） | GTD では非推奨。日付の決まっていない行動を Calendar に置かない |
| 持ち越し（Do Tomorrow、Move Do Date） | 持ち越しの記録と回数は、ボードの操作ログの `carry` が持つ（`scheduled` に依存しない）。やり残しは Next に戻す |
| サブをボードに載せる（[ADR-0137](0137-board-lanes-and-sub-issue-cards.md)） | Pick と「Add issue」。サブの期間はガントの `start`・`end` が持つ |
| その日まで出さない（Tickler。例: 木曜に店が開いたら電話する） | **置き換えられない**。`deadline`（この日までに）とは逆の意味 |

残る役割は Tickler（GTD の Tickler と、Calendar の「その日にやる行動」）だけで、`scheduled` の「複数日・自動でボードに載せる」という作りとは合わない。

## 決定

### scheduled を廃止する

- issue とサブ（[ADR-0135](0135-sub-issues-in-issue-file.md)）から `scheduled` を廃止する。読むときは無視し、lint が残っていれば警告する（移行で消す）
- 廃止するもの: Scheduled 画面（View・コマンド・サイドバーの項目）、PKM Updates の Scheduled 欄、Organize の Do Date（と、そこでの estimated の選択）、Do Today / Do Tomorrow / Add Do Date / Move Do Date の操作、ボードへの自動追加（`toAutoAdd`）、issue 画面の 7 日ストリップ、サブの編集の `scheduled`、ガントの `scheduled` の印、一覧の `scheduled` の絞り込みと `next_scheduled` の並べ替え、MCP の `scheduled` の引数、metrics の `scheduledNotOnBoard`
- ボードに載せる方法は、Daily の Pick と、ボードの「Add issue」（issue・サブ・新規作成）だけになる。載せても日付は書かない
- 持ち越しは、ボードに `carry` を記録するだけにする（日付を移さない）。持ち越したものは Next に戻る

### Tickler

- issue に `tickler`（日付 1 つ）を足す。「この日まで出さない。この日になったら見直す」を表す
- `tickler` が今日より後の issue は、Inbox・Next・Pick・Organize に出さない。期限（`deadline`・`soft_deadline`）は Tickler と関係なく、Daily の期限の表に出す（期限は確定した約束なので隠さない）
- `tickler` が今日以前になったら、Daily の最初の段階（ADR-0150 の Calendar）の「Tickler」の表に出す。見直すまで毎日そこに出つづけ、Next や Inbox には出さない（二重に出さない）
- Tickler の表の操作: Add to today's board、To Next、Tickler（日付を選び直す）、Someday、Cancel、Inbox。どの操作も `tickler` を消すか、新しい日付に置き換える
- サブは `tickler` を持たない。サブは `start` が今日より後なら Pick に出さない（`start` を「この日から」として使う）

### Tickler を設定する場面

日々の計画に使わないよう、決めるべき場面にだけ置く。

| 場面 | 操作 |
|---|---|
| Organize（整理） | Do Date の代わりに「Tickler」。日付を 1 つ選ぶ。`clarified: true` も書く（その日まで出さないと決めたことが、整理の結果） |
| Daily の Previous boards（昨日の残り） | 「Tickler」。既定は明日。ほかに Back to Next（持ち越して Next に戻す） |
| Daily の Pick | 「Tickler」（今日はやらない。この日まで出さない） |
| Daily の Tickler の表 | 「Tickler」（日付を選び直す） |
| issue 画面、MCP の `create_issue`・`update_issue` | `tickler` の欄 |

一覧の一括編集には置かない。

### 移行

- `.kit/migrations/0152-tickler/`。冪等にする
- active な issue: `scheduled` のうち、移行した日以降の最も早い日を `tickler` にする（`tickler` がまだない場合）。`scheduled` は消す。過去の日付だけのものは、`tickler` を付けずに消す（Next に入る）
- サブ: `scheduled` を消す。移行した日以降の日付があり、`start` がなければ、最も早い日を `start` にする
- closed・canceled・someday の issue とサブ: `scheduled` を消すだけ
- 2 日目以降の予定（複数日の分割）は失われる。移行の README と `.kit/changes/` に書き、`check.mjs` は `scheduled` が残っていれば報告する
- ボードの操作ログは変えない（日付を持たないので影響しない）

### ほかの ADR への影響

- ADR-0148: Organize の出口は Next・Tickler・Someday・Cancel・Already done になる。「`scheduled` を書く操作は `clarified` を付ける」は「Organize で `tickler` を書くと `clarified` を付ける」に置き換わる。Next は「`open` で `clarified` で `tickler` がない」になる
- ADR-0150: 最初の段階を「Calendar」（期限切れ・期限が近い・Tickler）にする。Pick にサブを含める。Previous boards の操作を直す
- 承認のとき、ADR-0009（Scheduled 画面）、0018（Do Today / Do Tomorrow）、0030（Organize の予定入れ）、0032（操作名）、0034（自動でボードに載せる）、0070（PKM Updates の Scheduled 欄）、0135（サブの `scheduled`）、0137（サブをボードに載せる規則）の状態を「一部置換: 0152」にする

## 理由

- GTD では、日付は確定したもの（その日にやる・その日まで出さない）だけに付ける。「やりたい日」を前もって積むと、守れない予定が増えて Calendar が信用できなくなる。今日やるものは、その日に Next から選ぶ（ADR-0150 の Pick）
- `scheduled` を Tickler に転用すると、複数日・自動でボードに載る、という今の意味と混ざる。名前と意味が一致する専用の項目にする
- 日付が来た Tickler を Inbox ではなく Daily の Calendar に出すのは、Tickler を付けたものは整理済みで、必要なのは「今日やるか、また先にするか」の判断だから。Calendar に出しておけば、毎朝必ず目に入る
- 期限を Tickler で隠さないのは、期限が外との約束で、見落とすと取り返しがつかないから
- 持ち越しで日付を移さないのは、GTD ではやり残しは Next に戻すだけでよく、持ち越しの記録はボードの操作ログで足りるから
- サブに `tickler` を持たせないのは、`start`（この日から）がすでに同じ役割を果たせるから。項目を増やさない

## 却下した案

- **`scheduled` を残し、意味を Tickler に絞る**: 日付のリスト・自動でボードに載せる、という今の作りと名前の印象が残り、意味が混ざる
- **`scheduled` をそのまま残す**: 今日やるものを決める経路が、`scheduled` と Pick の 2 つになる
- **Tickler の日付が来たら Inbox に戻す（GTD の Tickler ファイルの使い方）**: 整理済みのものを整理し直すことになる。`clarified` を外すことになり、ADR-0148 の「処理したものを戻さない」に反する。必要なら Tickler の表から Inbox を選べる
- **Tickler の日付が来たら自動でボードに載せる**: 今の `scheduled` の自動追加と同じになり、その日の計画が勝手に増える
- **Someday の `revisit` を `tickler` にまとめる**: どちらも「この日に見直す」だが、someday は status で意識の外に置くもの、Tickler は整理済みの行動を一時的に隠すもの。混ぜると、日付が来たときの出し先（Organize と Daily）が分かれる理由が見えなくなる。必要になったら別に検討する
- **サブにも `tickler` を足す**: `start` で足りる
- **移行で `scheduled` の全日付を残す（本文に書くなど）**: 機械が読めず、残しても使われない。最も早い日だけ Tickler にすれば、少なくとも見失わない

## 影響

- 変更するもの: `core/schema.ts`・`sub-issue.ts`（`scheduled` の削除、`tickler` の追加）、`core/index.ts`（`toAutoAdd`、`isScheduledAhead` の削除、Inbox・Next の判定）、`core/actions.ts`、`core/daily.ts`、`core/list.ts`、`core/lint.ts`、`core/metrics.ts`、`core/timeline.ts`、`views/ScheduledView.tsx`（削除）、`views/OrganizeView.tsx`、`views/DailyView.tsx`、`views/Board.tsx`、`views/SidebarView.tsx`、`header/IssueHeader.tsx`（7 日ストリップを Tickler の欄に）、`header/SubIssues.tsx`・`SubTimeline.tsx`、`obsidian/*-actions`・`writer.ts`・`sub-editor.tsx`、`cli/mcp.ts`・`vault-ops.ts`、`pkm-updates/src/core/sections.ts`、`main.ts`（View とコマンド）、テンプレート（`.kit/templates/file/issue.md` に `scheduled` があれば外す）
- 文書: プロダクトの `concepts/task-do-date.md`（削除し、`task-tickler.md` を足す）、`surfaces/task-scheduled.md`（削除）、`task-today.md`・`task-organize.md`・`task-board.md`・`task-issue-screen.md`、`jobs/task-plan-day.md`・`task-close-day.md`・`task-organize.md`、`task-coach` スキル
- 移行 `.kit/migrations/0152-tickler/` と `.kit/changes/` の変更のノート。fixtures に `scheduled` を持つ issue とサブを足す
- 実装の順: ADR-0148 → ADR-0152 → ADR-0150。0148 の移行は `scheduled` を見て `clarified` を付けるので、0152 の移行より前に適用する
