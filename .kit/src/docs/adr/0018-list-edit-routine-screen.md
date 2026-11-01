# ADR-0018: リストからの issue 編集、routine 画面、Do Today / Do Tomorrow

- 状態: 承認
- 日付: 2026-11-01

## 背景

- リストでできる操作は片付け（Close / Cancel など）が中心で、ほかの項目を変えるには issue を 1 件ずつ開く必要がある
- routine には一覧しかなく、`r-N.md` を開くと raw の frontmatter を直接書き換えることになる
- ボードの未完了を翌日や今日へ移すにも、Reschedule で毎回日付を選ぶ必要がある
- 「今日やる」だけが、英語で揃った操作バーの中で日本語になっている

## 決定

### 行の編集

対象は `IssueTable` を使うすべてのリスト（Inbox / Issues / Someday / Daily の各段階 / ボードの未完了）。

- 表示しているセルは、クリックでその場の編集を開く。部品は issue 画面と同じメニューとモーダルを使う
- 行末に「…」メニューを置き、summary、status、status-detail、priority、label、実行日、mid_due、deadline、estimated のすべてを編集できるようにする。列にない項目と、ホバーのないモバイルでの編集はここから行う
- summary のクリックは今までどおり issue を開く（ADR-0009）

### 一括編集

Inbox / Issues / Someday / Daily の期限切れ・期限が近い の操作バーに **Schedule** を足す。

- 日付を 1 つ選び、選択中の行すべての実行日に足す。既存の実行日は残す
- 今日の予定、前回のボード、ボードの未完了には足さない（実行日を移す Reschedule がある）
- ほかの項目の一括編集は作らない。必要になったら追加する

### status と日付の整合

- リストの status 変更は、ボードのカードと同じ規則にする。closed / canceled は `closePatch` / `cancelPatch`、someday は `somedayPatch`
- someday の issue に実行日や期限を入れたら、open に戻す（someday は予定と期限を持たない。ADR-0006）

### 列

画面ごとに固定で増やす。選択の切り替えは作らない。priority と status は全画面で固定で出す。

| 画面 | 列 |
|---|---|
| Inbox | labels / estimated / created |
| Issues | status-detail / labels / next / mid_due / deadline / estimated |
| Someday | labels / revisit / reviewed |
| Daily の期限切れ・期限が近い | status-detail / next / mid_due / deadline |
| Daily の前回のボード・ボードの未完了 | status-detail / next / deadline / estimated |
| Daily の今日の予定 | status-detail / mid_due / deadline / estimated |

### routine 画面

`routine/r-N.md` を開いたとき、issue と同じく CodeMirror の widget を先頭に差し込む（ADR-0008）。上から順に:

1. created と更新日時
2. ID と summary（クリックで編集）、active のスイッチ
3. くり返し（作成フォームと同じ入力）、start、end
4. group、priority、label
5. 直近 14 日の結果（closed / canceled / 未記録 / 予定なし）。読み取り専用で、ボードの状態から作る（ADR-0010）
6. estimated、実績の合計
7. worklog、本文

status、実行日、期限、親子関係は持たない。ADR-0010 の「routine は一日ごとに完結する」を変えない。

### Do Today / Do Tomorrow

- 今日のボードの未完了に **Do Tomorrow**、前回のボードの未完了に **Do Today** を置く
- Reschedule の日付を固定したものとして動く。そのボードの日付を実行日から外して移動先の日付を足し、`carried` に入れる（ボードには残るが未完了に数えない）
- Do Today にした issue は、ボードに直接は載せず「今日の予定」の段階に出す
- routine には付けない（持ち越さない。ADR-0010）
- 「今日やる」は **Do Today** に変える。変えるのは操作バーのこの文言だけで、段階名などはそのまま

## 理由

- セルの編集と「…」メニューを併用すれば、列を増やしすぎずに全項目を編集でき、モバイルでも使える
- 編集の部品と patch を共有すると、issue 画面やボードと規則がずれにくい
- routine 画面を issue の widget と同じ仕組みにすると、本文をふつうのエディタのまま編集できる

## 却下した案

- **列をユーザーが選べるようにする**: 画面ごとの設定と UI が増える。「…」メニューで全項目を編集できるので、なくても困らない
- **全項目を一括編集できるようにする**: 実行日のほかに使う場面が今は思いつかない
- **routine 専用の Preact View を別に作る**: 本文の編集を作り直すことになる
- **Do Today でボードへ直接載せる**: 載せる入口が 2 つになる。今の流れでは次の段階で載せられる

## 影響

- ADR-0009 の「一覧の行に出すもの」を、上の列の表に置き換える
- 一括編集は 1 回の操作で複数のファイルを書き換える。途中で失敗すると一部だけ変わる（今の `updateMany` と同じ）
- 行の編集で書くのは issue の frontmatter だけ。デイリーノートの本文は変えない
