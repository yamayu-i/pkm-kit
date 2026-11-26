## 変更の要約

- routine の frontmatter に `missed: carry` を書けるようにした（ADR-0234）。routine 画面の `missed` の欄（`list` / `carry`）でも選べる
- `carry` の routine は、予定日に結果を付けずに日が過ぎると、Today の Calendar の Missed ではなく、今日のボードの Routines の先頭に 1 枚で出る。起点の日（積み残した一番古い予定日）の印が付く
- 今日のボードで閉じると（canceled も）、それまでの積み残しはまとめて片付く。過去の日のボードには書かない。open に戻すと、また持ち越す
- `category: closing` と一緒に使うと、Closing の画面に持ち越す
- MCP: `get_board` の routine のカードに `carriedFrom` を、`get_routine_stats` に `missed` を足した。`get_overview` の `missedRoutines` から `carry` の routine を除いた
- 子への影響: 移行なし（任意の項目を足しただけ。書かない routine は今までどおり）
