# ADR-0212: Organize に出す Someday を revisit を迎えたものに絞り、Someday の見直しを週次レビューに移す

- 状態: 承認
- 日付: 2026-11-20

## 背景

#212。

- Organize のキュー（`organizeQueue`）は、[ADR-0009](0009-views.md) のとおり「Inbox の古い順 → `revisit` を過ぎた someday → `reviewed` が古い someday」で、status が someday の issue を全件含む（`revisit` が先の日付のものも含む）。整理したカードを外すのは画面の状態だけなので、Organize を開き直すと、さっき Someday にしたものもまた出てくる。サイドバーの件数も、Someday が 1 件でもあれば 0 にならない
- `revisit` を過ぎた Someday で「To Someday」を選んでも、`tickler` と `reviewed` だけを書き、`revisit` は今日以前のまま残る。開くたびに先頭のほうへ戻ってくる
- GTD では、Inbox の処理（見極める・整理する）は 1 件ずつ 1 回だけ決め、件数を 0 にできるもの。Someday/Maybe は整理した結果の置き場で、見直すのは週次レビュー（見直す）の工程になる。日付が来たら思い出したいものは Tickler（日付が来ると Inbox に戻る）。今の Organize は、整理と週次レビューを 1 つのキューに混ぜている
- 文書（スキマ時間の整理のジョブ、Someday の概念）は「見直す時期の来た Someday」「`revisit` を過ぎると Organize に出てくる」と書き、コードと食い違っている
- 週次レビューの流れ（task-coach の週次、週の見直しのジョブ）に、Someday を見直す手順がない

## 決定

### Organize のキュー

- Organize に出すのは、Inbox（`isInbox`）と、`revisit` が今日以前の someday だけにする。`revisit` がない someday、`revisit` が今日より後の someday は出さない
- 並びは Inbox の古い順 → `revisit` の古い順（今までと同じ）
- サイドバーの Organize の件数も同じ条件で数える（`organizeQueue` を使っているので、キューと揃う）
- ADR-0009 の Organize の「`reviewed` が古い someday」をこの決定で置き換える

### revisit を迎えた Someday を Someday に残すとき

- Organize で `revisit` を迎えた someday に「To Someday」（←）を選んだら、`revisit` を消す（`tickler` を消し、`reviewed` を今日にするのは今までどおり）。もう一度思い出したい日があれば、Someday の一覧の revisit で付け直す
- そのほかの操作（Next・Calendar・Tickler・Cancel・Already done）は今までどおり。open に戻す操作は `revisit` を消す（`reopenPatch`）

### Someday の見直しは週次レビューで行う

- Someday の一覧に「Reviewed」の操作を足す。選んだ issue の `reviewed` を今日にするだけで、ほかは変えない。一覧の既定の並びは今までどおり `reviewed` が古い順（未設定が先）なので、上から見て、残すものに Reviewed を押す
- Someday の一覧の「Review in Organize」のボタンをなくす（Organize に Someday の全件が出なくなるので、押しても見直しにならない）
- task-coach の週次の手順に、Someday の見直しを足す。`task_list_issues(statuses: ["someday"])` で取り、`reviewed` が古い順（未設定が先）に見て、続けるなら Inbox に戻す（status を open に）・日付を決めるなら Tickler・やめるなら canceled・残すなら `reviewed` を今日にする（思い出したい日があれば `revisit`）
- 週の見直しのジョブの流れにも、Someday の一覧で見直す手順を足す

## 理由

- Organize を「空にできる場所」にすると、溜めたものが重荷にならない（スキマ時間の整理のジョブの望む成果）。一度 Someday にすると決めたものを、次に開いたときにまた決めさせない
- `revisit` は Someday に付けた Tickler の役割をしている。日付を迎えたら整理の場（Organize）に戻すのは、GTD の Tickler と同じ流れ
- `revisit` を迎えたものを Someday に残すと決めたなら、その日付の役目は終わっている。残すと、次に開いたときにまた出てくる
- 定期の見直しは週次レビューの工程に置くと、整理（毎日・スキマ時間）と見直し（週 1 回）の頻度の違いに合う。Someday の一覧は既に `reviewed` の古い順に並べられるので、Reviewed の操作を足すだけで見直しの場になる

## 却下した案

- **今のまま全件を出し、今日 `reviewed` にしたものだけ外す**: 数日たてばまた全件が出る。件数が 0 にならないことは変わらず、整理と見直しが混ざったまま
- **`reviewed` が N 日以上前の someday だけを出す**: N の決め方に根拠がない。整理の場に見直しが混ざることは変わらない
- **Organize に「Someday を見直す」の切り替えを付け、1 件ずつカードで見直せるようにする**: 見直しの場が 2 つになる。必要になったら、Someday の一覧からの別の画面として足す
- **`revisit` を `tickler` にまとめる**: someday に `tickler` を付けると open に戻る決まり（[ADR-0152](0152-calendar-and-tickler.md)）と衝突し、決め直す範囲が大きい。今回は `revisit` の役割（Organize に戻る日）を文書で揃えるだけにする

## 影響

- 子のデータ（frontmatter・md の形）は変えない。移行なし
- `revisit` のない someday は Organize に出なくなる。見直しは Someday の一覧と task-coach の週次で行う
- 文書: Organize・Someday の画面、Someday の概念、スキマ時間の整理と週の見直しのジョブ、task-coach の週次
