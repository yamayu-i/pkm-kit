# ADR-0184: Pick に in-progress を含め、ボードの Waiting の欄を Watch に差し替える

- 状態: 承認（一部置換: 0183）
- 日付: 2026-11-16

## 背景

- DailyTaskView の Pick（[ADR-0150](0150-daily-engage-steps.md)）は、issue を `isNext`（`open` だけ）で、サブを `status === "open"` で選んでいる。in-progress（着手済みで、今日続きをやる有力な候補）が出ず、今日のボードに載っていない in-progress は「Add issue」から探すしかない。GTD でも、着手した行動は終わるまで Next Actions に含まれる（in-progress は GTD の状態ではなく、作業の状態）。ボードの欄（[ADR-0137](0137-board-lanes-and-sub-issue-cards.md)）でも、in-progress は open と同じ Up next に入っている
- Pick したときの書き換え（`pickSubPatch`）は、open でないサブを open にする。in-progress のサブを Pick すると open に下がる
- ボードの Waiting の欄（ADR-0137）は、今日のボードに載せた waiting / delegated しか出さない。待っているもの（GTD の Waiting For）は、ボードに載せていなくても見張りたい
- 今日のボードに載ったまま waiting にしたものは未完了に数えるので、ボードを締められない。待っているものは、今日の自分の作業としては終わっている

status の移り変わりと付随の変更を全体として決め直すことは [#183](https://github.com/yamayu-i/pkm-kit/issues/183) で扱う。この ADR は、その前に必要な次の変更だけを決める。

## 決定

### Next に in-progress を含める

- `isNext`（Next Actions）を「`open` で `clarified` のもの、または `in-progress` のもので、`scheduled` も `tickler` もない」にする。in-progress は着手したので整理済みとみなし、`clarified` を問わない（status のメニューで Inbox から直接 in-progress にしたものも漏らさない。ADR-0148 のとおり in-progress は Inbox にも出ない）。`isNext` を使うのは Pick だけ（候補と、Pick したときの書き換え）なので、ほかの画面は変わらない
- サブの Next も同じ場所（`core/index.ts`）に `isNextSub` として置く: 「`open` または `in-progress` で、`scheduled` がなく、`start` がないか今日以前」。Pick の候補（`pickCandidates`）はこれを使う。条件を Pick の中に書かない
- waiting / delegated / someday は、これまでどおり Pick に出さない
- Pick したときの書き換えは、in-progress をそのまま残す。issue は `isNext` が真なら書き換えず、偽なら in-progress は in-progress のまま、ほかは open にする（`clarified` を付け、`scheduled`・`tickler`・委任先・`revisit` を消すのはこれまでどおり）。サブ（`pickSubPatch`）は、`isNextSub` が真なら書き換えず、偽なら今の status が in-progress なら in-progress のまま、ほかは open にして、`scheduled`・委任先・未来の `start` を消す

### Watch の欄

ボードの Waiting の欄をやめ、Watch の欄に差し替える。

| 項目 | 決定 |
|---|---|
| 入るもの | status が waiting / delegated の issue とサブ（親が active なもの）すべて。今日のボードに載っているかによらない。タイマーが動いているものは Working に出し、Watch には出さない |
| 位置 | Up next と Done の間（これまでの Waiting の位置） |
| 見た目 | 面は `--vt-secondary-container`（primary から作る薄い色。子が primary を変えると追従する）。カードがないときは欄を出さない。たたまず、見出しに件数を出す |
| 並び | Pick と同じ（priority → deadline → 見直しが古い順 → ID。サブは親の値で、同じ親のサブは親の中の並び）。手では並べない（ドラッグ・Move up / Move down はない） |
| カード | status のバッジ（押すと status のメニュー）・題・委任先（delegated のとき）・主の操作「Resume」・`···` のメニュー（Open）。サブは、ほかの欄と同じく親の見出しの下にまとめる |
| Resume | status を in-progress にし、今日のボードに載っていなければ載せる。日付は書かない（ADR-0152）。今日は手を付けないなら、status のメニューで in-progress にだけ戻し、あとで Pick から選べる |

- 欄の判定は、ボードのカードについて これまでどおり 作業中 → 片付いた → ★ → 次にやる順 の順で行い、waiting / delegated のカードはボードの欄に入れない（Watch に出す）
- 戻す先は in-progress。カードの「次の status」（`nextStatuses`。waiting → in-progress、delegated → in-progress / closed）と同じ
- Watch は今の status で決まるので、どの日付のボードについても同じものになる（画面で開くボードは今日のものだけ。MCP の `get_board` は日付によらず今の Watch を返す）
- Watch のカードには ★ を付けられない（画面に ★ のボタンを出さない。MCP の `star_card` は止める）

### ★ を外す

- issue・サブを waiting / delegated にしたら、今日のボードで ★ が付いていれば外す（`star` の `on: false` を書く）。in-progress に戻しても ★ は戻らない
- 外す操作は、status を書く処理（Obsidian の `TaskWriter`、MCP の `updateIssueOnDisk` / `updateSubIssueOnDisk`）が、status が変わったときに書く。どの画面・MCP から変えても同じになる。どの op を書くかは core の 1 つの関数（`unstarOps`）で決める

### 締める・未完了

- waiting / delegated は、ボードの未完了（`unfinished`）に数えない。ボードに載ったまま待ちになっても締められ、Previous boards にも残らない。続きの見張りは Watch が引き継ぐ
- 締めたときの要約（デイリーノートの `## Task board`）の書き方は変えない

### タスクリストと MCP

- タスクリスト（tasks now のダイアログ。[ADR-0154](0154-tasks-now-dialog.md)）は Top 4 → Up next の順にし、waiting / delegated を含めない。今やるものの一覧なので
- MCP の `get_board` の `lanes` は `waiting` をやめ、`watch` を返す（中身は Watch の欄と同じ）。`order_card` の欄は top / next だけ
- 並び（`order`）のログに残る waiting のカードの鍵は、そのまま読む（欄に出ないだけ）。移行は要らない

## 理由

- in-progress は Next Actions の一部なので、`isNext` の定義そのものを直すのが素直。Pick 用に別の条件を作ると、Next の定義が 2 つになる
- 待っているものは、今日やると決めたかによらず見張る対象なので、今日のボードの欄ではなく、status で決まる別の欄が合う。待ち（Waiting For）を今日の作業（ボード）と分けると、未完了の数え方も自然になる
- ★ は今日やる最重要のもので、待っている間はやれない。戻したときに ★ が復活すると、朝決めた 4 件が勝手に変わる
- ★ を外すことを表示の計算で済ませる（status から ★ を無視する）と、戻したときに ★ が戻る。status の記録（statuslog）から ★ を判定すると、分析用の記録（正本は frontmatter）に表示が依存する。どちらも避け、変えたときに記録を書く
- 背景の色は、デザインルールの「選んだものの面を primary の系統にしたいとき」の `secondary-container` を使う。新しい色を足さない

## 却下した案

- **Pick 用の条件を `isNext` と別に作る**: Next の定義が散らばる。`isNext` を使うのは Pick だけなので、定義を直しても影響が広がらない
- **waiting / delegated も Pick に出す**: Pick は今日やる行動を選ぶ場。待っているものは別の欄で見張る
- **Waiting の欄を残し、Watch を足す**: 同じものが 2 か所に出る
- **Watch を手で並べる**: すべての waiting / delegated が入るので、並べる手間が増える。並びは決まった規則にする
- **waiting にしたら ★ を表示の上だけ外す**: 戻したときに ★ が戻る（上の理由）
- **待ち始めた古い順に並べる**: 待ち始めた時刻は statuslog にしかなく、分析用の記録に表示を依存させることになる

## 影響

- ADR-0137 の欄の表の Waiting、ADR-0150 の Pick の対象、ADR-0154 のタスクリストの順を、この ADR で置き換える
- デザインルール（`docs/design.md`）の「ボードの欄」と、プロダクトの文書（ボードの画面、ボードの欄）、task-coach の欄の名前を直す
- 子への移行はない（ボードのログ・frontmatter の形を変えない）
