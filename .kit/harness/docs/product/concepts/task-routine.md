# routine

## 目的

決まった間隔でくり返すやることを、毎回作らずにその日のボードに出す。

## 状態

`routine/r-N.md`: `summary`、`repeat`（every / interval / on）、`start`、`end`、`active`、`priority`、[label](task-label.md)、[estimated](task-estimate.md)。その日の結果（closed / canceled）はボードの操作ログにあり、routine のノートには書かない。

## 操作

作る・一時停止する（Routines）、くり返しを変える（routine 画面）、その日の結果を決める（ボード）、タイマーを動かす。

## 使い方の筋道

くり返しに当てはまる日には、自動でボードに載る。その日のうちに closed か canceled にし、翌日に持ち越さない。status、Calendar の日、期限は持たない。

## 根拠

[ADR-0010](../../../../src/docs/adr/0010-routine.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0021](../../../../src/docs/adr/0021-routine-effort-and-sidebar.md)

## 繰り返しの入力と判定

| 項目 | 入力・既定値 | 判定 |
|---|---|---|
| every | day / week / month | 日・週・月単位 |
| interval | 1 以上の整数。省略時 1 | 2 なら 2 日／週／月ごと |
| on（week） | mon / tue / wed / thu / fri / sat / sun。1 つ以上必須 | 指定した曜日 |
| on（month） | 1〜31、last、2th-tue（2nd-tue も可）、last-fri 等。1 つ以上必須 | 日、月末、第 1〜5 の曜日、最後の曜日 |
| start / end | YYYY-MM-DD。未設定可 | 有効な期間を制限する |
| active | 真偽値。省略時 true | false の間は予定にしない |

on は複数指定できる。月の 31 日や第 5 曜日が存在しない月は、その条件の回を作らず、月末に繰り上げない。interval は start を起点に数え、週の境界は月曜。起点より前は出さない。不正な every・interval・on は lint の問題として報告する。

例: repeat が every: week、interval: 2、on: [mon, thu] なら、起点を含む週から 2 週ごとの月曜と木曜。月末なら every: month、on: [last] とする。start を省いたときの起点は created の日付を使う。両方ともない場合は起点を決められず、ボードの予定に出ない。継続的に使うものは start を明示すると確認しやすい。
