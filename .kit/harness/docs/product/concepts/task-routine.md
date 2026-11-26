# routine

## 目的

決まった間隔でくり返すやることを、毎回作らずにその日のボードに出す。

## 状態

`routine/r-N.md`: `summary`、`repeat`（every / interval / on）、`start`、`end`、`active`、`priority`、[label](task-label.md)、[estimated](task-estimate.md)、`category`（`closing` か、なし = default。`default` は予約語で書かない）、`order`（category の中の並び）。その日の結果（closed / canceled）はボードの操作ログにあり、routine のノートには書かない。

## 操作

作る・一時停止する・並べる・category を変える（Routines）、くり返しと積み残しの扱い（missed）を変える（routine 画面）、その日の結果を決める（ボード）、タイマーを動かす。

## 使い方の筋道

くり返しに当てはまる日には、default の routine は自動でボードに、closing の routine は Closing の画面に出る。その日のうちに closed か canceled にする。付けないまま日が過ぎたものは積み残しとして、結果を付けるまで Today の Calendar の Missed（Routines の節）に出る（実行漏れに気づくため。[ADR-0206](../../../../src/docs/adr/0206-closing-view-and-routine-category.md)）。遅れてでも今日やらなければいけない routine（週報など）は `missed: carry`（routine 画面の `missed` の欄）にすると、積み残しを Missed ではなく今日のボードに 1 枚で持ち越し、起点の日の印を付けて欄の先に出す。今日閉じると（canceled も）、それまでの積み残しはまとめて片付く（何回分抜かしても 1 回やれば済む。過去の日のボードには書かない。[ADR-0234](../../../../src/docs/adr/0234-routine-missed-carry.md)）。status、Calendar の日、期限は持たない。

## 根拠

[ADR-0010](../../../../src/docs/adr/0010-routine.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0021](../../../../src/docs/adr/0021-routine-effort-and-sidebar.md)、[ADR-0206](../../../../src/docs/adr/0206-closing-view-and-routine-category.md)、[ADR-0234](../../../../src/docs/adr/0234-routine-missed-carry.md)

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
