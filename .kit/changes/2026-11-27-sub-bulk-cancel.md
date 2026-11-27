## 変更の要約

- issue 画面の「Sub-issues」の数の右に、一括キャンセルのボタン（`list-checks`）を足した（ADR-0244）。押すとダイアログで、チェックしたサブをまとめて canceled にする
- 「Select all」は閉じていないサブだけを選ぶ。closed は個別に選べば canceled にでき、そのときは完了の記録が変わることを知らせる。canceled は選べない
- 期間（start / end）と Calendar の日は残す（ADR-0190 のまま）。statuslog はサブごとに書き、記録中のタイマーは止まる
- 子への影響: 移行なし
