## 変更の要約

- 「Inbox に戻す」を、ボードの持ち越し・Today の Calendar（期限切れ・期限が近い・Missed）・Today の Pick・Issues の一括操作・MCP の `carry_issues` から外した（ADR-0189）。GTD では in に戻さない。やらなかったものは Next に残し、考え直すなら Tickler にする。誤って整理済みにしたものは、issue 画面の「Clarified」を押して戻せる（open だけ）
- MCP の `update_issue` の `clarified: false` は open の issue だけ。`carry_issues` の `inbox` はエラーになる
- Today の Calendar の期限切れ・期限が近い欄に Someday を足した（守れない期限の結び直し）
- someday から open に戻したもの（status のメニュー、Someday の一覧の Back to Inbox、日付を入れたとき、MCP）は Inbox に入り、整理し直す。Organize で Next・Calendar を選んだときは整理済みのまま
- ボードの締めを記録だけにした。「Close board」は未完了が残っていても押せ、未完了は要約に「持ち越し」と書く。締めなくても催促しない（Today の Previous boards の段階と、サイドバーの前のボードの件数をやめた）。前の日の未完了は Pick と Missed から選べる
- 持ち越しの回数は、ボードの記録と statuslog から自動で数える（手で持ち越したか、その日のうちに片付けなかったもの）。MCP の `list_pending_boards` と `get_overview` の `pendingBoards` を消した
- 子への影響: 移行は要らない。締めていない過去のボードは、そのまま残る（催促しない）。Today の段階が Calendar → Pick → Board になること、未完了があっても Close board が押せること、Someday の一覧の Back to Inbox で Inbox に入ることを、PC とモバイルで確かめる
