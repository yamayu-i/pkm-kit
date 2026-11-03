# ADR-0032: 日付のアクション名の整理、mid_due の改名（soft_deadline）、ボードからの delegated

- 状態: 承認（ADR-0002 と ADR-0006 の `mid_due` の名前、ADR-0009 / ADR-0014 / ADR-0018 のアクション名、ADR-0031 のカードの status メニューを一部置換）
- 日付: 2026-11-03

## 背景

- 操作バーに「Schedule」と「Reschedule」が並ぶ。Schedule は実行日を**足す**、Reschedule は画面によって実行日を**移す**か期限を**置き換える**。どちらも何の日付を変えるのかがラベルから分からず、期限切れ・期限が近いの表では両方が並んで違いがいちばん見えない。Do Tomorrow と Schedule のアイコン（`calendar-plus`）も同じだった
- `mid_due` は意味がどこにも書かれていなかった。`mid` は同じ frontmatter の `priority: mid`（中くらい）と読み方がぶつかり、「中間の締切」とも「緩い締切」とも読める。使い方は「守りたいが、過ぎても致命的ではない目標日」（緩い締切）
- task board のカードの status メニューから delegated を選べない。委任するには issue を開く必要があった。また、メニューは status だけを書き換えるので、delegated から別の status に移すと `delegated_to` が残った

## 決定

### アクション名

ラベルに、変える日付と変え方を書く。実行日（`scheduled`）は Do Today / Do Tomorrow とそろえて "Do Date" と呼ぶ。動きは変えない。

| 今 | 場所 | 新しい名前 | アイコン |
|---|---|---|---|
| Schedule | Inbox / Issues / Someday / Daily の期限切れ・期限が近い | **Add Do Date**（実行日を足す） | `calendar-plus` |
| Reschedule | 今日の予定 / 前回のボード / ボードの未完了 | **Move Do Date**（その日を外して選んだ日へ移す） | `calendar-clock` |
| Reschedule | 期限切れ・期限が近いの deadline の表 | **Change Deadline** | `flag` |
| Reschedule | 同じく soft_deadline の表 | **Change Soft Deadline** | `flag` |
| Do Tomorrow | ボードの未完了 | そのまま | `sunrise`（Add Do Date と分ける） |

日付を選ぶダイアログの見出しは「実行日を足す」「実行日を移す」「deadline を変える」「soft_deadline を変える」にする。

### mid_due を soft_deadline に改名する

- frontmatter のキーを `mid_due` から `soft_deadline` にする。`deadline`（固い締切）と対になる。コードの名前（`softDeadline`）、画面の欄の名前、MCP の引数と並べ替えのキー、CSS の class（`is-soft-deadline`）も合わせる
- 旧名は読まない。`mid_due` が残っている issue は `legacy-mid-due` のエラーにする（lint と vault-task の問題の一覧に出る）
- 子の Vault は移行 `0003-soft-deadline` で、`issue/*.md` と `template/file/*.md` の frontmatter と、`.obsidian/types.json` を書き換える

### ボードから delegated を選ぶ

- カードの status メニューに `delegated…` を足す（issue だけ。routine はその日の結果だけを選ぶ）。選ぶと委任先を選ぶ画面（リストの status メニューと同じ `MemberSuggestModal`。名前で探し、いなければその場で member を作る）を開く。すでに delegated のときに選ぶと、委任先を選び直す
- delegated のカードには、status のバッジの隣に委任先の名前のチップ（人のアイコン + 名前、長い名前は省略）を出す。押すと委任先を選び直す
- メニューからの変更は、リストと同じ `statusPatch` を通す。delegated 以外にすると `delegated_to` を外す

## 理由

- 名前に対象（Do Date / Deadline / Soft Deadline）と動詞（Add / Move / Change）を入れれば、同じ操作バーに並んでも区別できる。英語のラベルの方針（ADR-0027）は保つ
- `soft_deadline` は意味を名前だけで説明でき、`deadline` と並べたときに強さの違いが分かる
- 旧名を読み続けると、2 つのキーが混ざった issue の扱い（どちらを正とするか）を決め続ける必要がある。移行で一度に書き換え、残りはエラーで見つける
- 委任は、ボードでその日の作業を整理しているときに決めることが多い

## 却下した案

- **Schedule / Reschedule のまま、ツールチップで違いを説明する**: ラベルだけでは分からないことは変わらない。モバイルにはホバーがない
- **キーは `mid_due` のまま、画面の名前だけを変える**: frontmatter と画面で名前がずれ、Claude Code や MCP で読むときに混乱が残る
- **`target` / `checkpoint`**: `target` は一般的すぎ、`checkpoint` は「中間の締切」の意味になる
- **旧名の `mid_due` も読む（互換）**: 新旧の両方を持つ issue の扱いが必要になり、検査と書き込みが複雑になる
- **delegated をカードの「次の status」のボタンにする**: 委任は 1 日に何度もする操作ではない。ボタンが増えるとカードが狭くなる

## 影響

- 子は移行 0003 を実行する。MCP の `soft_deadline` の引数と並べ替えのキーが変わるので、子だけのスキルが `mid_due` を使っていれば直す
- 取り込みの前の vault-task で緩い締切を入れると `mid_due` で書かれ、取り込み後に `legacy-mid-due` のエラーになる（キーを `soft_deadline` に手で直す）
