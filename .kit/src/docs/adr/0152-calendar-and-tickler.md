# ADR-0152: scheduled を Calendar（その日にやる）に絞り、Tickler を別の項目にする

- 状態: 承認（一部置換: 0189, 0203, 0210）
- 日付: 2026-11-15

## 背景

`scheduled`（Do Date。日付のリスト）は、「その日にやる」と決めた日を持ち、その日のボードに自動で載せる（[ADR-0034](0034-duration-input-auto-board-sticky-groups.md)）。[ADR-0148](0148-inbox-clarified.md)（Inbox を `clarified` で決める）と [ADR-0150](0150-daily-engage-steps.md)（Daily で Next から選ぶ）を GTD に合わせて決めると、`scheduled` の役割は次のように分かれる。

| 役割 | 行き先 |
|---|---|
| 朝に今日やるものを決める（Do Today、Organize の Do Date を「やりたい日」として使う） | Daily の Pick とボード（ADR-0150）。GTD の Engage は、その日に Next から選ぶ |
| 先の日に「やりたい日」を積む（複数日、7 日ストリップ） | GTD では非推奨。日付の決まっていない行動を Calendar に置かない |
| その日にやらなければならない行動（例: 木曜しか開いていない店に行く） | **Calendar**。GTD のハードランドスケープ。`scheduled` に残す |
| その日に思い出して考え直したいもの（例: 返金が届いたか確かめる） | **Tickler**。Calendar とは意味が違う（行動が決まっていない）。今は表す方法がない |

GTD の Calendar と Tickler は別物である。Calendar は「整理済みで、その日にやる行動」、Tickler は「整理をその日まで先送りしたもの」で、日付が来ると受け箱（Inbox）に戻る。

## 決定

### scheduled: Calendar（その日にやる）に絞る

- `scheduled` は「その日にやらなければならない」日を表す。やりたい日・目安の日には使わない
- 日付のリストをやめ、日付 1 つにする（issue もサブも）
- その日になったら、これまでどおり自動で今日のボードに載せる（ADR-0034 の自動追加を残す）。その日にボードから外したものは載せ直さない
- `scheduled` が過去で、片付いていない（active な）issue・サブは、Daily の Calendar の段階（ADR-0150）の「Missed」の表に出す。日付を決め直すか、Next に戻すまで毎日出る。どの一覧からも消える issue を作らない
- Next（ADR-0148）には、`scheduled` があるものを入れない（Calendar で扱う）
- Pick とボードの「Add issue」で載せたものには、`scheduled` を書かない（今日やると選んだだけで、その日にやらなければならないわけではない）

### tickler: 別の項目として足す

- issue に `tickler`（日付 1 つ）を足す。「この日に思い出して、整理し直す」を表す
- `tickler` が今日より後の issue は、どの一覧（Inbox・Next・Pick・Organize）にも出さない。期限（`deadline`・`soft_deadline`）は Tickler と関係なく Daily の期限の表に出す（期限は外との約束なので隠さない）
- `tickler` が今日以前になったら、Inbox に出す（`clarified` があっても出す）。Organize で整理すると、どの操作でも `tickler` を消す
- Tickler は整理の先送りなので、`clarified` を付けない
- サブは `tickler` を持たない。サブは Inbox・Organize の対象ではない（ADR-0148）ので、整理の先送りもない。「この日から」は `start` で表し、`start` が今日より後のサブは Pick に出さない（ADR-0150）

### 設定する場面

| 項目 | 場面 |
|---|---|
| `scheduled`（Calendar） | Organize の「Calendar」（日付を 1 つ選ぶ。`clarified: true` も書く）、Daily の Previous boards と Missed の「Move date」（決め直す）、issue 画面・サブの編集、MCP |
| `tickler` | Organize の「Tickler」（日付を 1 つ選ぶ）、Daily の Pick・Previous boards の「Tickler」、issue 画面、MCP |

一覧の一括編集には置かない。

### Organize の操作

| 操作 | 方向 | 書くもの |
|---|---|---|
| Next | → | `clarified: true`（ADR-0148） |
| Tickler | ↑（廃止した Later の場所） | `tickler` |
| Someday | ← | status |
| Cancel | ↓ | status |
| Calendar | ボタン | `scheduled`（1 日）と `clarified: true` |
| Already done | ボタン | status |

Tickler は、ADR-0148 で廃止した Later（何も決めずにキューから外す）の、GTD に沿った置き換えになる。「今は決めない」を、日付付きで記録する。

### 持ち越しと Daily の操作

- Do Today は「Add to today's board」になる（日付を書かない）
- Do Tomorrow はなくす。明日に考え直すなら Tickler、明日やらなければならないなら Move date
- Move Do Date は「Move date」として、`scheduled` を持つものだけに出す
- 持ち越し（Previous boards）は、ボードに `carry` を記録する。`scheduled` を持つものは、Move date か Back to Next（`scheduled` を消す）を選ぶ

### 廃止・変更するもの

- Scheduled 画面の、issue × 日の表（複数日のトグル）。先の Calendar（`scheduled`）の一覧に縮める
- issue 画面の 7 日ストリップ（`scheduled` と `tickler` の日付の欄にする）
- Organize の Do Date のカレンダーの複数選択と、そこでの estimated の選択（ADR-0148）
- 一覧の `scheduled` の絞り込み（あり・なし）は残す。並べ替えの `next_scheduled` は `scheduled` にする
- MCP の `scheduled` は日付 1 つにする。`tickler` を足す

### 移行

- `.kit/migrations/0152-calendar-tickler/`。冪等にする
- `scheduled` のリストは、移行した日以降の最も早い日 1 つにする（今と同じく、その日のボードに自動で載る）。2 日目以降は消える
- 過去の日付だけのものは、`scheduled` を消す（ADR-0148 の移行で `clarified` が付いていれば Next に入る）
- サブも同じ
- 消える日付があることを、移行の README と `.kit/changes/` に書く。`check.mjs` は、リストのままの `scheduled` が残っていれば報告する
- 既存の `scheduled` は「やりたい日」として使われてきたが、移行で Calendar の意味に変わる。見た目（その日のボードに載る）は変わらないので、使いながら Next に戻すか決め直す

### ほかの ADR への影響

- ADR-0148: Organize の出口は表のとおり。Next は「`open` で `clarified` で、`scheduled` も `tickler` もない」。Inbox は「`open` で `clarified` でない、または `tickler` が今日以前」（`tickler` が今日より後のものは出さない）
- ADR-0150: Calendar の段階は、期限切れ・期限が近い・Missed の 3 つの表。Tickler の表は持たない（Inbox に戻る）
- 承認のとき、ADR-0009（Scheduled 画面）、0018（Do Today / Do Tomorrow）、0030（Organize の予定入れ）、0032（操作名）、0034（自動でボードに載せる）、0135（サブの `scheduled`）、0137（サブをボードに載せる規則）の状態を「一部置換: 0152」にする

## 理由

- GTD は Calendar と Tickler を分ける。Calendar は「その日にやる」と整理済みの行動、Tickler は整理を先送りしたもの。混ぜると、日付が来たときに「やる」のか「考える」のかが分からない
- `scheduled` を「やりたい日」に使うと、守れない予定が積もり、Calendar が信用できなくなる（GTD のハードランドスケープの考え方）。今日やるものは Pick で選ぶ
- Calendar の日付を 1 つにするのは、「その日にやらなければならない」は 1 日に決まるから。複数日に分ける作業は、サブイシューと `start`・`end`（ガント）で表す
- 日付が来た Tickler を Inbox に戻すのは、GTD の Tickler ファイルの使い方そのもの。先送りしたのは整理なので、整理の場（Organize）に戻す
- 過去の Calendar を Missed として出し続けるのは、「その日にやらなければならなかった」ものを見落とさないため
- 期限を Tickler で隠さないのは、期限が外との約束で、見落とすと取り返しがつかないから

## 却下した案

- **`scheduled` を廃止し、Tickler だけにする**: Calendar（その日にやる）と Tickler（その日に考え直す）が 1 つの項目に混ざる
- **`scheduled` をそのまま残す（日付のリスト・やりたい日）**: 今日やるものを決める経路が、`scheduled` と Pick の 2 つになる。GTD の Calendar の使い方に反する
- **日付が来た Tickler を Daily に出す**: Tickler は整理を先送りしたものなので、Daily（今日やるものを選ぶ場）ではなく Organize（整理する場）で扱う
- **Someday の `revisit` を `tickler` にまとめる**: どちらも「この日に見直す」だが、someday は status で意識の外に置くもの（Organize の someday の列に出る）、Tickler は open のまま一時的に隠すもの。今は分けておき、使ってみて同じなら別に検討する
- **サブにも `tickler` を足す**: サブは Inbox を通らない（ADR-0148）ので、日付が来ても戻る先がない。先送りしたいなら、親に付けるか、`start` を使う
- **`scheduled` の名前を `calendar` などに変える**: 意味は絞るが、データの役割（その日のボードに載る）は同じ。名前を変えると、移行と MCP・スキルの変更が増える

## 影響

- 変更するもの: `core/schema.ts`・`sub-issue.ts`（`scheduled` を日付 1 つに、`tickler` の追加）、`core/index.ts`（Inbox・Next の判定、`toAutoAdd`）、`core/actions.ts`、`core/daily.ts`（Missed）、`core/list.ts`、`core/lint.ts`、`core/metrics.ts`、`core/timeline.ts`、`views/ScheduledView.tsx`（一覧に縮める）、`views/OrganizeView.tsx`、`views/DailyView.tsx`、`views/Board.tsx`、`header/IssueHeader.tsx`（7 日ストリップを日付の欄に）、`header/SubIssues.tsx`・`SubTimeline.tsx`、`obsidian/*-actions`・`writer.ts`・`sub-editor.tsx`、`cli/mcp.ts`・`vault-ops.ts`、`pkm-updates/src/core/sections.ts`
- 文書: プロダクトの `concepts/task-do-date.md`（Calendar の意味に直す）、`task-tickler.md`（新規）、`surfaces/task-scheduled.md`・`task-today.md`・`task-organize.md`・`task-board.md`・`task-issue-screen.md`、`jobs/task-plan-day.md`・`task-close-day.md`・`task-organize.md`、`task-coach` スキル
- 移行 `.kit/migrations/0152-calendar-tickler/` と `.kit/changes/` の変更のノート。fixtures に複数日の `scheduled` を持つ issue とサブを足す
- 実装の順: ADR-0148 → ADR-0152 → ADR-0150。0148 の移行は、リストのままの `scheduled` を見て `clarified` を付けるので、0152 の移行より前に適用する
