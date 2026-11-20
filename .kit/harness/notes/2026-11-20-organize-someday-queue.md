# 2026-11-20 Organize の Someday のキュー

## 食い違い

- 起きたこと: 「Organize で Someday に整理したものが何度も出てくるのは意図通りか」と聞かれて調べた。`organizeQueue`（`src/packages/pkm-task/src/core/index.ts`）は status が someday の issue をすべてキューに入れ（revisit が先の日付のものも含む）、reviewed の古い順で末尾に並べる。整理済みを外すのは OrganizeView の `handled`（画面の状態）だけなので、開き直すと今日 reviewed にした Someday もまた出る。サイドバーの件数も Someday 全件を含むので、Someday が 1 件でもあれば 0 にならない
- 文書との違い: ADR-0009 と task-organize.md の並び順（「reviewed が古い someday」）はコードどおり。一方、jobs/task-organize.md は「見直す時期の来た Someday」「始める条件: 見直し対象の Someday があること」、concepts/task-someday.md は「revisit を過ぎると Organize に出てくる」と書き、見直し対象だけが出るように読める。何を「見直し対象」とするか（revisit を過ぎたもの・reviewed が一定以上古いもの）が決まっていない
- 改善案: 見直し対象の条件を ADR で決める（例: revisit が今日以前、または revisit がなく reviewed が N 日以上前か未設定）。キューと件数をその条件に揃え、文書の言い回しも揃える
