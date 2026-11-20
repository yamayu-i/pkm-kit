# ADR-0148: Inbox は日付ではなく clarified（整理済み）で決める

- 状態: 承認（一部置換: 0189, 0210）
- 日付: 2026-11-15

## 背景

Inbox は「`open` で、`scheduled`・`soft_deadline`・`deadline` がどれもないもの」と決めている（[ADR-0006](0006-status-inbox-someday.md)）。これは「日付がない」を「未整理」と取り違えている（#134 §3.2）。

| ケース | 今の判定 | 本来 |
|---|---|---|
| 締切だけ確定していて、中身は曖昧 | Inbox に入らない | Inbox に入る |
| 整理済みだが、実行日は未定 | Inbox に入る | Inbox に入らない |

また、Inbox に戻す操作（`inboxPatch`）は予定と期限をすべて消す。再整理したくなっても、外から与えられた締切は消えない。

整理の定義は GTD（Getting Things Done）の Clarify に合わせる。Inbox は「まだ処理していないもの」だけを入れ、1 件ずつ処理して出す。処理の行き先は、捨てる・参照・Someday・その場でやる・Waiting For・Project・Calendar（日時が確定したもの）・Next Actions（日付なし）。

## 決定

### Inbox の定義

- `isInbox(issue)` を「`status` が `open` で、`clarified` が `true` でない」に変える。日付は見ない。ただし [ADR-0152](0152-calendar-and-tickler.md) の `tickler` について、今日より後のものは出さず、今日以前のものは `clarified` があっても出す（整理を先送りしたものが戻ってくる）
- `clarified` は frontmatter の真偽値。「何をするか・何が済めば終わりかを自分で決めた（処理した）」ことを表す。未設定は未整理（`false` と同じ）
- 1 行の登録（クイックキャプチャ、Inbox 画面の入力欄、MCP の `create_issue`）は、これまでどおり `clarified` を書かない。登録は軽いままにする
- status とは別の項目にする。`open` 以外の status（`in-progress`・`waiting` など）は、`clarified` が未設定でも Inbox に出ない（ADR-0006 のとおり）

### Next Actions

- 「`open` で、`clarified` で、`scheduled`（Calendar）も `tickler` もない」issue を Next（Next Actions）と呼ぶ。保存する項目は増やさず、算出する
- `scheduled` があるものは Calendar として扱い、その日にボードに載り、過ぎたら Daily の Missed の表に出る。`tickler` があるものは、日付の前は隠れ、日付が来たら Inbox に戻る（ADR-0152）。どの一覧からも消える issue を作らない
- 以前は「`scheduled` が空」だけを条件にしかけたが、実行日が過ぎてやっていない issue がどこにも出なくなる穴があった（今の Inbox の定義にもある）。ADR-0152 の Missed で塞ぐ
- Next は Inbox に出ない。選ぶ場所は DailyTaskView（#150）、見直す場所は Weekly Review（#151）

### clarified を付ける・外す

- Organize の操作を次のようにする

| 操作 | 書くもの | `clarified` |
|---|---|---|
| Next（新設） | `clarified: true` と `reviewed` | 付ける |
| Calendar（Do Date を置き換える。ADR-0152） | `scheduled`（日付 1 つ）と `reviewed` | 付ける |
| Tickler（Later を置き換える。ADR-0152） | `tickler`（日付 1 つ）と `reviewed` | 触らない（整理の先送りなので） |
| Someday / Cancel / Already done | status の変更 | 触らない |

- Organize で整理すると、どの操作でも `tickler` を消す（Tickler を選び直したときは新しい日付に置き換える）
- Organize の Calendar で `clarified: true` を付けるのは、「その日にやる」と決めたことが整理の結果だから。issue 画面や MCP で `scheduled` だけを書くときは、`clarified` を変えない
- `deadline`・`soft_deadline` だけを書く操作では、`clarified` を付けない。締切が分かっていて、中身が曖昧という状態を残すため
- 「Inbox に戻す」（View のアクション、ボードの Inbox 操作、MCP）は、`clarified` を消すだけにする。期限（`soft_deadline`・`deadline`）と `scheduled`（Calendar）は残す。`tickler`（ADR-0152）は消す（今日より後の日付が残ると Inbox に出ないため）。status が `open` でなければ `open` に戻す。GTD では処理したものを Inbox に戻さないが、実行中に曖昧さが見つかったときの人の逃げ道として残す
- Later は廃止する。Later は何も変えずに `reviewed` を今日にして、そのセッションでキューから外すだけの操作だった。処理せずに Inbox に残すのは、GTD の「Inbox に戻さず、1 件ずつ処理する」に合わない。決められないものは、Someday か Next にする。↑ キー・上スワイプ・ボタン・取り消しの対応から外す
- issue の画面と一覧から、`clarified` を直接切り替えられる
- Organize で `estimated` を要求しない。これまでは Inbox から Do Date を決めるときだけ要求していた（[ADR-0030](0030-organize-schedule-calendar.md)）。GTD は見積もりを整理の条件にしない。Do Date は ADR-0152 で Calendar に置き換わり、そこでも見積もりを求めない。見積もりは issue 画面で任意に入れる

### 範囲

- サブイシュー（[ADR-0135](0135-sub-issues-in-issue-file.md)）は対象にしない。`clarified` を持たず、Inbox・Organize・Someday 画面に出さない
  - Organize の責務は issue の整理。サブは issue（GTD の Project）を解決するために分けた行動で、Project を計画するときに作るものなので、Inbox を通らない
  - サブの整理（分ける・直す・Someday・取りやめ）は、親の issue 画面で行う。文脈（親の本文・ほかのサブ・依存）がそこにあるから
  - 実行中にサブが曖昧になり、その場で直せないときは、親を「Inbox に戻す」。Project ごと Organize に出る
- サブを横断して扱うのは、期限と Calendar の通知（ADR-0150 の Calendar の段階）と、今日やる行動を選ぶこと（ADR-0150 の Pick）だけにする。どちらも整理ではない
- 次の行動のない Project（開いているサブがない親）や、滞ったサブの見直しは、Weekly Review（#151）で親ごとに行う
- routine は対象外（これまでどおり）

### 移行

- 既存の `open` の issue のうち、`scheduled`・`soft_deadline`・`deadline` のどれかがあるものに `clarified: true` を書く。日付がないものは書かない（今も Inbox なので、そのまま Inbox に残る）。ADR-0152 の移行（`scheduled` を消す）より前に適用する
- 見た目は移行の前後で変わらない。変わるのは、移行のあとに起きる操作から
- 番号は Issue に合わせて `0148-inbox-clarified`。冪等にする

### この ADR の外で扱うこと

- Daily で Next から選ぶ、Daily の段階の整理: #150（ADR-0150）
- Next・Project・Waiting For・Someday の見直し（Weekly Review）: #151
- `scheduled` を Calendar に絞ることと Tickler: #152（ADR-0152）

### 派生する変更

- `isInbox` を使う Inbox 画面、Organize、PKM Updates の Inbox 欄、サイドバーの件数、MCP の Inbox の一覧、metrics、task-coach スキルを、新しい定義にそろえる
- ADR-0006 の Inbox の節を一部置換する。Someday と期限の色の節、「Inbox を status にする案」の却下は変えない

## 理由

- 「整理したか」と「いつやるか」は別の問いなので、別の項目に持つ。締切の近さと仕事の明確さを独立に扱える（#134 §3.2、例 C）
- 未設定を未整理にするので、登録は 1 行のまま。入力の負担を増やさない（#134 §5 の、管理の手間を増やさないという点）
- GTD は、日時が確定したものだけを Calendar に置き、それ以外は日付のない Next に置く。日付のない Next を整理の出口として持たないと、Do Date を無理に決めるか、Inbox に残すしかなくなる
- Organize で Calendar（その日にやる）を決めることは処理の結果なので、`clarified` を付ける。期限だけ、Tickler だけでは処理したとは言えないので付けない
- 「戻す」で日付を残すので、再整理が締切を消さない
- `estimated` を要求しないのは、見積もりは整理の条件ではなく、任意の情報だから。見積もりがないとボードの負荷計算は粗くなるが、それは別に扱う

## 却下した案

- **Inbox を status にする**: ADR-0006 が却下した案。status の色・遷移・集計すべてに影響し、`open` と二重になる。今回は status とは別の真偽値で持つ
- **現在の定義のまま、本文に「要明確化」と書いて運用する**: 期限付きで曖昧なものは Inbox に出ないまま残る。機械が読めないので、Organize・MCP・タスクコーチが使えない
- **`needs_clarification: true` を書く（未設定が整理済み）**: 既存の issue を移行しなくて済むが、登録時に毎回この項目を書く必要が生じる。1 行の登録に反する
- **Next を `status: next` や専用の項目で持つ**: `open` + `clarified` + 日付なし で算出できる。保存すると、日付を足したときなどに二重管理になる
- **「Inbox に戻す」を廃止する**: GTD の原則には近いが、実行中に見つけた曖昧さを直す手段がなくなる。日付を残す形で残す
- **Later を残す**: 処理せず Inbox に残す操作は、GTD に合わない。Someday か Next で足りる
- **Do Date を決めるとき、見積もりが空なら常に要求する**: 整理の手間が増える。管理の手間を増やさない方針に反する

## 影響

- 変更するもの: `core/schema.ts`（`clarified` の読み書き）、`core/index.ts`（`isInbox`、Next の算出）、`core/actions.ts`（`inboxPatch`、Next の patch）、`views/OrganizeView.tsx`（Next の追加、Later の削除、`requireEstimate`）、`cli/mcp.ts`・`cli/vault-ops.ts`、`core/lint.ts`、issue 画面・一覧の切り替え、プロダクトの文書、`task-coach` スキル
- 移行 `.kit/migrations/0148-inbox-clarified/`。子の Vault の issue の frontmatter を書き換えるので、`.kit/changes/` に変更のノートを書く
- Organize の操作が Later の廃止と Next の追加で入れ替わる。キーとスワイプの割り当て（今は 4 方向で埋まっている）は、→ を Next、↑ を Tickler（ADR-0152）に当てる。Calendar はボタンにする
- この ADR だけを先に実装する間は、Do Date（日付のリストの `scheduled`）が残る。その間は Organize の Do Date が `clarified: true` を書き、↑ はボタンのない空きにしておく（ADR-0152 の実装で Calendar と Tickler に置き換わる）
- `clarified` は通常のメタデータ。`updated` の自動付与（ADR-0028）の対象になる
- ADR-0006 と ADR-0030 の状態に「一部置換: 0148」を足す
