## 変更の要約

- **移行 0152-calendar-tickler**: issue の frontmatter とサブイシューのブロックの `scheduled` のリストを、移行した日以降の最も早い日 1 つにする。過去の日付だけのリストは消す
- `scheduled` を **Calendar**（その日にやらなければならない日）の意味に絞り、日付 1 つにした（ADR-0152）。その日になると、これまでどおり自動でボードに載る。リストのまま残っていると `legacy-scheduled-list` の警告が出る
- **Tickler**（`tickler`。日付 1 つ）を足した。その日まで Inbox・Next・Pick・Organize に出さず、その日に Inbox に戻る（整理の先送り）。サブイシューは持たない
- Organize: → Next、↑ Tickler、← Someday、↓ Cancel。Do Date のボタンは Calendar（日付 1 つ）になった。整理の操作は Tickler を消す
- Do Today は「Add to today's board」（日付を書かない）、Do Tomorrow と Add Do Date はなくなった。Move Do Date は「Move date」（Calendar の日を持つものだけ）。持ち越しは Back to Next・Tickler・Move date・Inbox から選ぶ
- ボードの「Add issue」・MCP の `add_to_board` でサブを載せても、日付を書かなくなった。ボードで新しく作る issue は整理済み（`clarified: true`）で、日付を書かない
- **Today の段階を整理した**（ADR-0150）: Calendar → Previous boards → Pick → Board
  - Calendar: 期限切れ・期限が近い・Missed（Calendar の日が過ぎて片付いていないもの）。サブイシューも出す（これまでサブの期限は警告されていなかった）
  - Previous boards: ボードの日付ごとに issue・サブ・routine をまとめた
  - Pick（新設）: Next（整理済みで Calendar の日も Tickler もない issue）から今日やるものを選んでボードに載せる。サブは親の小さい見出し（ID と題）の下に並び、サブを持つ親は行に出さない
  - 「Later (skip)」をなくし「Next」だけにした。件数のある段階を順に通り、どれも「Next」で飛ばせる
- issue 画面: 7 日のセルは Calendar の日 1 つ（もう一度押すと消す）。tickler の欄を足した。サブの編集の Do dates は Calendar（日付 1 つ）になった
- Scheduled: 1 行に Calendar の日 1 つ。セルでその日に移す・消す
- 左サイドバーの Today の件数に、サブの期限切れと Missed を含めた
- MCP: `create_issue`・`update_issue` の `scheduled` は日付 1 つ（要素 1 つの配列も受け付ける）で、`tickler` を受け付ける。`carry_issues` の `mode` は `today`・`next`・`move`・`tickler`・`inbox`（以前の `reschedule` は `move` と同じ）。`list_issues` の並べ替えは `scheduled`（以前の `next_scheduled` も受け付ける）
- 子への影響: 移行 0152-calendar-tickler がある。複数の日に分けていた予定は最も早い未来の日だけが残る。issue の frontmatter とサブのブロックを書き換えるので、取り込む前にすべての端末で同期を済ませる。子だけのスキルや `local/CLAUDE.md` が Do Date・Do Today・Do Tomorrow・`scheduled` のリスト・`carry_issues` の `reschedule` を前提にしていれば直す
