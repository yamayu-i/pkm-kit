# 0255: サブは Calendar の日か期間のどちらか一方

## 何が変わったか

`.kit/src/docs/adr/0255-calendar-lane-and-sub-calendar-or-period.md`。

- サブは Calendar の日（`scheduled`。その日にやらなければならない日）と期間（`start`・`end`）を同時に持たない。両方にする書き込みは、画面・本文のカード・MCP で止まり、lint が警告（`sub-calendar-and-period`）を出す
- ガント（issue 画面の Timeline と Projects）で、Calendar の日は菱形の印になる。1 日の棒と Calendar は、右クリック（モバイルは長押し）のメニューか `C` キーで切り替えられる
- 今日が `scheduled` の issue とサブは、ボードのいちばん上の Calendar の欄に出る

## スクリプトが行うこと（migrate.mjs）

何も変えない。どちらを残すかは、機械では決められないため。

## スクリプトで扱えない場合（AI が行うこと）

`check` が、両方を持つサブを報告する（`issue/i-N.md: サブ <id> が Calendar の日（…）と期間（…）の両方を持っている`）。サブごとにユーザーに確かめ、どちらか一方を外す。

- その日にやらなければならない（その日でないと意味がない）なら、Calendar を残し、`start`・`end` を消す
- 何日かかけて進めるなら、期間を残し、`scheduled` を消す
- 迷うときの目安: Calendar のサブは Pick に出ない（ADR-0184）。今まで Pick に出ていなかったなら、実際の扱いは Calendar だった

外すのは、サブのブロックの項目（`<!-- sub-issue` から `-->` まで）の行だけ。本文と、ほかの項目は変えない。Obsidian で直すなら、Edit のダイアログで片方を `Not set` にする。

直すまで、ガントは Calendar の印を出し、期間の棒は出さない。データは消えない。

## 確かめ方（check.mjs）

- `issue/i-N.md` のサブの項目に、`scheduled` と、`start` か `end` の両方を持つものがない
