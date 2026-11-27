## 変更の要約

- **移行 0245-sub-period-pair**: サブの期間が `start` か `end` の片方だけなら、もう片方を同じ日にする（ADR-0245）。残っている値が日付として読めないものは直さず、移行の検査に残る
- issue 画面の「Sub-issues」の数の右に、一括の操作のボタン（`list-checks`）を足した（ADR-0244）。押すとダイアログで、チェックしたサブをまとめて canceled にするか、日付を消す
- 「Select all but closed」は closed と canceled 以外のサブを選ぶ。closed と canceled も個別に選べる
- 「Cancel N」は選んだ中の canceled でないものを canceled にする。期間と Calendar の日は残す（ADR-0190 のまま）。statuslog はサブごとに書き、記録中のタイマーは止まる。closed を canceled にするときは、完了の記録が変わることを知らせる
- 「Clear dates N」は選んだ中の、期間（start / end）か Calendar の日を持つサブの日付をすべて消す。status は変えない
- サブの期間（start / end）は、両方あるか、両方ないかのどちらかにした（ADR-0245）。片方だけは画面・本文のカード・MCP の書き込みで止まり、lint が `sub-period-half` で知らせる
- Edit のダイアログと本文のカードの Start・End の欄を、Period の 1 つの欄にまとめた。押すとダイアログで、Start と End の入力欄（入力言語。End は Start を基準に読む）と月のカレンダーから選ぶ。カレンダーは 1 回目に押した日が Start、2 回目が End。片方だけ・逆転は保存できない。期限だけのサブは同じ日の期間にする
- 子への影響: 移行 0245（issue/ のサブの期間をそろえる）。モバイルで、Period のダイアログの Start と End の欄が横に並んで収まるか確かめる
