## 変更の要約

- issue 画面の「Sub-issues」の数の右に、一括の操作のボタン（`list-checks`）を足した（ADR-0244）。押すとダイアログで、チェックしたサブをまとめて canceled にするか、日付を消す
- 「Select all but closed」は closed と canceled 以外のサブを選ぶ。closed と canceled も個別に選べる
- 「Cancel N」は選んだ中の canceled でないものを canceled にする。期間と Calendar の日は残す（ADR-0190 のまま）。statuslog はサブごとに書き、記録中のタイマーは止まる。closed を canceled にするときは、完了の記録が変わることを知らせる
- 「Clear dates N」は選んだ中の、期間（start / end）か Calendar の日を持つサブの日付をすべて消す。status は変えない
- 子への影響: 移行なし
