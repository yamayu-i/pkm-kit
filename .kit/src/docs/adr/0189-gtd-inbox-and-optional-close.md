# ADR-0189: 「Inbox に戻す」を GTD に合わせて絞り、ボードの締めを記録だけにする

- 状態: 承認
- 日付: 2026-11-16

## 背景

### Inbox に戻す

「Inbox に戻す」（`clarified` を外す）が、次の 5 か所にあった。

- ボードの持ち越し
- Today の Calendar（期限切れ・期限が近い・Missed）
- Today の Pick
- Issues の一括操作
- MCP の `carry_issues` の `inbox`

GTD では、次のように考える。

- 処理の場でも Engage の場でも、手に取ったものを in に戻さない（Never put anything back into "in"）
- やらなかった行動は Next Actions に残る（Next Actions は毎日の to-do ではない）
- 過ぎた Calendar は日を決め直すか Next Actions に移す
- 守れない約束（期限）は結び直す（日を変える・Someday・やめる）
- 進まない行動は、その場で次の行動を決め直す
- 「今は考えない、その日に整理し直す」は Tickler が受け持つ。日付が来たら in に戻す

[ADR-0183](0183-status-transition-rules.md) で Inbox に戻すのを open だけにしたため、in-progress が混じる Pick や持ち越しでは、ボタンが押せないことも多い。

Someday から open に戻すと、前の `clarified` が残り、整理し直さずに Next に入る。GTD では、Someday から戻すときに次の行動を決める（Weekly Review の Get Creative）。

### ボードの締め

ボードの締め（[ADR-0014](0014-daily-board.md)、[ADR-0150](0150-daily-engage-steps.md)、[ADR-0152](0152-calendar-and-tickler.md)）は、次の 4 つを行う。

1. 一日の記録をデイリーノートの `## Task board` に書く
2. 未完了を 0 にしないと締められない（残りの行き先を決めさせる）
3. 締めていない前のボードを、Today の Previous boards とサイドバーの件数に出し続ける
4. 持ち越し（`carried`）の回数を数える（task-coach の助言に使う）

このうち価値が高いのは 1 の記録だけである。2 でいちばん多い選択の Back to Next は、何もしないのとほぼ同じで、毎日の手間に見合わない（行動は Next に残っている）。3 は、休んだ日があると前のボードが溜まり、作業と関係なく件数が増える。戦略の「決めることを減らす」に反し、「作業を見張る」に近い。4 は、手で持ち越さなくてもボードの記録から数えられる。

## 決定

### Inbox に戻すを絞る

- 次から「Inbox に戻す」を外す
  - ボードの持ち越し
  - Today の Calendar（期限切れ・期限が近い・Missed）
  - Today の Pick
  - Issues の一括操作
  - MCP の `carry_issues` の `inbox`（モードごと消す。指定するとエラー）
- issue 画面の「Inbox / Clarified」の切り替えは残す。Clarified にする向きは整理そのもので、戻す向きは、誤って整理済みにしたときの訂正（戦略の原則「間違えても戻せる」）。open のときだけ出す（今のまま）
- MCP の `update_issue` の `clarified: false` は、open の issue だけ（画面と揃える）。ほかの status ではエラー
- 場面ごとの答えは次のとおり

  | 場面 | 残す操作 |
  |---|---|
  | ボードの持ち越し | Back to Next、Tickler、Move date、Close、Cancel |
  | Calendar の期限切れ・期限が近い | Add to today's board、日を変える（Reschedule）、Tickler、**Someday（足す）**、Cancel |
  | Calendar の Missed | Add to today's board、Move date、Back to Next、Close、Cancel |
  | Pick | Add to board、Tickler、Someday、Cancel |
  | Issues の一覧 | Close、Someday、Tickler、Cancel |

### Someday から戻したら整理し直す

- someday から open に戻すときは、`clarified` を外して Inbox に入れる。次のすべての経路が当たる。
  - status のメニューとボタン
  - Someday の一覧の Reopen
  - 期限・Calendar・Tickler を入れて自動で戻すとき
  - MCP
- ただし、Organize の Someday の見直しで Next か Calendar を選んで戻すときは、整理の結果なので `clarified` を付ける（今のまま）
- 付随の変更の表（ADR-0183）に「someday → open は `clarified` を外す」を足し、`completeIssuePatch` が補う（呼び出し側が `clarified` を書いたときはそれが優先する）

### ボードの締めは記録だけにする

- 「Close board」は、デイリーノートの `## Task board` に記録を書く操作だけにする。未完了が残っていても押せる。未完了のもの（終わっておらず、待ちでもないもの）は、記録の「持ち越し・中止」に「持ち越し」と書く
- 締めなくても困らない。Previous boards の段階（Today）と、サイドバーの前のボードの件数をやめる。前のボードの未完了は、Next（Pick）と Calendar の Missed から、いつもどおり選べる
- 今日のボードの「Not done」の欄（持ち越しの操作）は残す。押さなくても締められる、片付けたい人のための操作
- 持ち越しの回数は、ボードの記録から自動で数える。過去のボード（今日より前）に載っていて、次のどちらかに当たれば、その日に持ち越したとみなす
  - 手で持ち越した（`carried`）
  - その日のうちに、open / in-progress 以外の status に変えた記録（statuslog）がない

  statuslog がない端末（端末名がない）で変えたものは持ち越しに数えることがあるが、助言の目安なので許す
- MCP
  - `close_board` は未完了があっても記録を書く
  - `list_pending_boards` と `get_overview` の `pendingBoards` は消す
  - task-coach の朝の手順の「前のボードを締める」も消す
- 締めた後にカードを足すと締めを外す（ADR-0020）のは、そのまま

## 理由

- 「Inbox に戻す」は、どの場面でも GTD に別の答えがある（Next に残す、日を決め直す、結び直す、決め直す、Tickler）。in に戻すのは、決めることの先送りになる
- 訂正の手段は 1 か所（issue 画面）にあれば足りる。一括で戻す場面は、GTD の流れの中にない
- 期限切れの欄に Someday がないと、「今はやらない」を Cancel でしか表せない。GTD の約束の結び直しには、やめる・保留するの両方が要る
- Someday から戻るものは、しばらく考えていなかったものなので、次の行動を決め直すのがよい。Organize で戻すときは、その場で決めている
- 毎日の締めの価値は記録にある。記録を書くのに、すべての未完了の行き先を決めさせる必要はない。押さなくても困らなくすると、休んだ日の後に催促が溜まらない
- 持ち越しの回数は先送りの兆しとして役に立つが、手で持ち越すことを前提にすると、締めない人の数が取れない。ボードの記録と statuslog から数えれば、操作によらず数えられる

## 却下した案

- **「Inbox に戻す」をすべての場所から外す（issue 画面も）**: 誤って整理済みにしたときに戻せない
- **Issues の一括操作の Inbox は残す（Weekly Review の場なので）**: 同じ Review の中で、その場で決めれば済む。一括で戻すと、決めることを先送りにした件数が溜まる
- **Someday から戻したら、いつも `clarified` を外す（Organize でも）**: Organize で Next・Calendar を選んだときは、その場で整理している
- **記録も自動で書く（翌日に Today を開いたとき、前日のデイリーノートに書く）**: 当たり前の品質「書いたノートの本文を、仕組みが勝手に書き換えない」に触れる
- **締めを今のまま必須にする**: 毎日の手間に見合う価値がない（背景）
- **持ち越しの回数を数えるのをやめる**: task-coach が先送りの常連を見つけられなくなる

## 影響

- ADR-0014 の「未完了が 0 になったら締められる」「前回のボード」、ADR-0150 の Previous boards の段階、ADR-0152 の持ち越しの Inbox、ADR-0025 の `close_board` の検査・`list_pending_boards`・未締めの過去ボード、ADR-0148 の Inbox に戻す操作の置き場所を、この ADR で置き換える
- プロダクトの文書（Today、ボード、Inbox、Someday、締めの場面）と task-coach の手順を直す
- 子への移行はない（ボードの記録・frontmatter の形を変えない）。締めていない過去のボードは、そのまま残る（何も催促しない）
