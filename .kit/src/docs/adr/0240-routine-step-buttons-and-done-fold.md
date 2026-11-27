# ADR-0240: routine の遷移ボタンを closed / canceled の 2 つにし、片付いた routine をたたむ

- 状態: 承認
- 日付: 2026-11-27

## 背景

[ADR-0206](0206-closing-view-and-routine-category.md) で、ボードの routine のカードに issue と同じ status のボタンを出すことにした。open なら closed にするボタン（チェックのアイコン）、closed / canceled なら open に戻すボタン（↩）の 1 つだけを出す（Issue #240）。

使ってみると、次の問題がある。

- 今日はやらないと決めた routine を canceled にするには、status のバッジを押してメニューを開く必要がある。closed と同じくらいよく使うのに、手数が多い
- ボードの Routines 欄と、Closing の画面の Closing routines の節では、closed / canceled の routine も open と同じように並ぶ。片付けるほど、残っている routine が見つけにくくなる

## 決定

### 遷移ボタン

- open の routine には、closed にするボタン（closed のアイコン）と canceled にするボタン（canceled のアイコン）の 2 つを並べて出す
- closed / canceled の routine には、今までどおり open に戻すボタン（↩）を 1 つだけ出す
- ボードのカードと Closing の画面の行で同じ部品を使う。ボードのカードでは、今までどおりホバーとフォーカスのときだけ見せ、ホバーのない端末と狭いボードでは出さない（status のメニューだけ）
- ADR-0206 の「ボードの routine のカードに、issue と同じ status のボタンを出す。open なら closed にする（チェックのアイコン）」を置き換える

### 片付いた routine をたたむ

- ボードの Routines 欄と、Closing の画面の Closing routines の節では、結果が closed / canceled の routine を既定で出さない
- 片付いたものがあるときは、一覧の末尾に「Show N done」のボタンを出す。押すと片付いたものを出し（ボタンは「Hide done」になる）、もう一度押すと隠す
- 開いたかどうかは覚えない。画面を開き直すと隠れた状態に戻る
- 件数（Routines 欄の `open/全体`、Closing routines の件数と「All done」）は変えない
- Closing の画面の Tasks の群（Closed / Canceled）に入る routine は、その日の結果を見せる場所なので、たたまない

## 理由

- canceled は「今日はやらない」と決める操作で、closed と同じ頻度で使う。どちらもボタン 1 回で付けられるようにする
- 片付いた routine をたたむと、残っているものだけが見え、欄の長さも短くなる。結果を直す（open に戻す）ことは少ないので、展開してから戻す手数は許せる
- 開いた状態を覚えないのは、ボードを開くたびに残っているものだけを見たいため。覚える仕組み（設定やデータ）を増やさずに済む

## 却下した案

- **closed / canceled の routine にも 2 つのボタンを出し、今の status のボタンを押すと open に戻す**: 同じ見た目のボタンが、状態によって逆の操作になり、分かりにくい
- **片付いた routine を Done の欄に移す**: routine は issue と欄の並びと数え方が違い（`open/全体`）、Done の欄に混ぜると、その日の routine の進み具合が見えなくなる
- **開いた状態を覚える**: 覚えた後は、片付いたものが出たままになり、たたむ意味がなくなる

## 影響

- pkm-task の `RoutineStepButton`、ボードの Routines 欄、Closing の画面の Closing routines の節を変える
- データと MCP は変わらない。子への移行はない
- プロダクトの文書（ボード、締めの場面）の記述を直す
