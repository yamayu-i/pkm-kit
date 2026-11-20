## 変更の要約

- issue 画面の status の行の Clarified / Inbox のチップ（押すと整理済みを切り替えた）を、読み取り専用のバッジに置き換えた。その issue が出る一覧（Inbox・Next Action・Calendar・Tickler）と、サブを持つなら「Project」を出す。整理（Inbox → Next）は Inbox・Organize の画面で行う（ADR-0210）
- サブを 1 つでも持つ issue を Project とする（サブがすべて閉じても Project のまま）。DailyTaskView の Pick では、サブがすべて閉じた Project を通常の行にせず、「Projects without a next action」に Close のボタン付きで出す。issue 画面の status のボタンも Close になる。どちらも押したときだけ閉じる
- 先に始まる期間のサブを持つ Project は、「Projects without a next action」に出さない（次の行動が計画されている）
- Inbox（未整理）の Project のサブには、期間（Start・End）を入れられない（変えるのも不可。消すのはよい）。Edit のダイアログ・本文のカードの欄は押せず、Timeline は棒を作れず動かせない。MCP はエラーで理由を返す
- Project の Tickler は、閉じていないサブの期間の始まりのいちばん早い日以前だけ。Tickler が先の Project のサブには、Tickler の日以降に始まる期間だけを入れられる。Tickler の日を迎えた計画済みの Project は、Inbox ではなく Next Action になる（そのサブは期間に入れば Pick に出る）
- Project を someday にすると、閉じていないサブの期間と Calendar の日を消す。消すものがあれば、先に確認のダイアログ（Move to Someday / Cancel）を出す。MCP の `update_issue` は `clear_sub_periods: true` がなければエラーにし、消えるものを返す
- MCP の `list_issues`・`get_issue` が、分類 `list`（inbox・next・calendar・tickler・null）と `project` を返す
- lint の警告を 2 つ足した: `period-in-inbox`（Inbox の Project のサブに期間がある）、`tickler-after-sub-period`（Project の Tickler がサブの期間の始まりより後）。自動では直さない
- 子への影響: 移行なし（frontmatter と md の形は変えない）。規則に合わない既存のデータは lint の警告で知らせる。モバイルで、issue 画面のバッジの並びと、someday にするときの確認のダイアログを確かめる
