## 変更の要約

- estimated の入力欄（issue・routine・サブイシューの欄、routine を作るフォーム）で 0（`0` / `0m` など）を入れられるようにした（ADR-0247）。0 は「見積もり済みで手間なし」、空は「未見積もり」
- 0 で作った routine にも `estimated: 0` を書き、routine の一覧に `0m` と出す
- 見積もりのない delegated のサブは、Projects の「Estimate」「Budget」の印、負荷の行の `?` に数えず、親の予算も割り振らない。見積もりがあればその値を使う
- 子への影響: 移行なし
