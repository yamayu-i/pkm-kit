## 変更の要約

- task board の Top 3 を Top 4 にした（★ は 4 件まで）。欄の名前と件数（`n/4`）、通知、MCP の説明（`get_board`・`star_card`）が変わる。上限は `TOP_LIMIT`
- ボードの各カード（済み以外）に星ボタンを置いた。ワンクリックで Top 4 に入れる / 外す。4 件あるときは入れずに知らせる。以前のカード先頭の星の印はボタンに置き換えた
- routine を issue・サブと混ぜず、Top 4 の下の別の欄「Routines」にした。見出しで開閉でき、既定は開く。routine がすべて Close / Cancel されたら欄ごと隠す。routine は Working・Done に出ず、★ も付けられない（MCP の `get_board` の `lanes` に `routine` が増え、`star_card`・`order_card` は routine を拒む）
- 子への影響: 移行は要らない。子だけのスキルや `local/CLAUDE.md` で「Top 3」「★ は 3 件」に触れていれば直す。すでに 3 件の ★ が付いている日はそのまま 4 件目を付けられる
