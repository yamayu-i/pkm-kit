## 変更の要約

- DailyTaskView の Pick に、in-progress の issue とサブを出すようにした（ADR-0184）。in-progress の issue は clarified がなくても出る。Pick しても in-progress のまま。waiting / delegated は出さない
- ボードの Waiting の欄をやめ、Watch の欄に差し替えた。今日のボードに載っているかによらず、waiting / delegated の issue とサブ（親が active なもの）をすべて、薄い primary の面に出す。並びは Pick と同じ（priority → deadline → 見直しが古い順）で、手では並べない
- Watch のカードの「Resume」で、in-progress に戻し、今日のボードになければ載せる
- waiting / delegated にすると、今日のボードの ★ を外す。in-progress に戻しても ★ は戻らない（画面・MCP のどちらから変えても同じ）
- waiting / delegated は、ボードの未完了に数えない（待っているものがあってもボードを締められる）。タスクリスト（tasks now）にも出さない
- MCP の `get_board` の `lanes` は `waiting` の代わりに `watch` を返す。`order_card` は top / next だけ、`star_card` は Watch のカードに ★ を付けない
- 子への影響: 移行は要らない。Today のボードで Watch の欄が出ること、Resume で Up next に移ること、★ を付けたカードを waiting にすると ★ が外れること、waiting のカードが残っていても Close board できることを、PC とモバイルで確かめる
